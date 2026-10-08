"""Leak-free retraining + export.
Run on the HTF-filtered images (your MBC_HTF folder: Cancer/ and Non-Cancer/).
Split FIRST; scaler, PCA and feature selection are fitted on training data only."""
import argparse, glob, json, os
import cv2, joblib, numpy as np
from sklearn.base import clone
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif  # F = t^2 for 2 classes -> same ranking as the notebook's |t|
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
import mammo_core as mc

ap = argparse.ArgumentParser()
ap.add_argument("--data", required=True)
ap.add_argument("--out", default="model")
ap.add_argument("--pca", type=int, default=100)
ap.add_argument("--k", type=int, default=30)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

grays, y = [], []
for label, name in enumerate(mc.CLASSES):  # Non-Cancer=0, Cancer=1
    files = sorted(f for f in glob.glob(os.path.join(a.data, name, "*")) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    print(f"{name}: {len(files)} images")
    for f in files:
        g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
        if g is not None:
            grays.append(g); y.append(label)
y = np.array(y)
cache = os.path.join(a.out, "features.npz")
if os.path.exists(cache):
    X = np.load(cache)["X"]
else:
    X = mc.extract_features(grays)
    np.savez_compressed(cache, X=X)
print("features:", X.shape)

pipe = Pipeline([("s1", StandardScaler()), ("pca", PCA(a.pca, random_state=42)), ("sel", SelectKBest(f_classif, k=a.k)),
                 ("s2", StandardScaler()), ("svm", SVC(kernel="rbf", probability=True, random_state=42))])

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
cv = cross_validate(pipe, Xtr, ytr, cv=StratifiedKFold(5, shuffle=True, random_state=42),
                    scoring=["accuracy", "recall", "roc_auc"])
m = clone(pipe).fit(Xtr, ytr)
pred, proba = m.predict(Xte), m.predict_proba(Xte)[:, 1]
tn, fp, fn, tp = confusion_matrix(yte, pred, labels=[0, 1]).ravel()
metrics = dict(
    n_train=int(len(ytr)), n_test=int(len(yte)), positive_class="Cancer",
    test=dict(accuracy=float((tp + tn) / len(yte)), sensitivity_cancer=float(tp / (tp + fn)),
              specificity=float(tn / (tn + fp)), auc=float(roc_auc_score(yte, proba)),
              confusion={"TN": int(tn), "FP": int(fp), "FN_missed_cancers": int(fn), "TP": int(tp)}),
    cv5_on_train=dict(accuracy=[float(cv["test_accuracy"].mean()), float(cv["test_accuracy"].std())],
                      sensitivity_cancer=[float(cv["test_recall"].mean()), float(cv["test_recall"].std())],
                      auc=[float(cv["test_roc_auc"].mean()), float(cv["test_roc_auc"].std())]))
json.dump(metrics, open(os.path.join(a.out, "metrics.json"), "w"), indent=2)
print(json.dumps(metrics, indent=2))

final = clone(pipe).fit(X, y)  # deployed model uses all data; the numbers above are the honest held-out estimate
joblib.dump(final, os.path.join(a.out, "pipeline.joblib"))
print("saved ->", a.out)
print("NOTE: if your images include several shots/augmentations of the same patient, split by patient to avoid optimistic numbers.")
