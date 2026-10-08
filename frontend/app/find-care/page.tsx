"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Crosshair,
  Hospital,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Disclaimer from "@/components/Disclaimer";

const CareMap = dynamic(
  () => import("@/components/CareMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-cream-muted">
        Loading map...
      </div>
    ),
  }
);

type Center = {
  lat: number;
  lng: number;
};

type Care = {
  id: string;
  name: string;
  address?: string;
  speciality?: string;
  category: string;
  oncologyRelated: boolean;
  lat: number;
  lng: number;
  km: number;
};

function FindCare() {
  const mapSection = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [center, setCenter] = useState<Center | null>(
    null
  );

  const [locationLabel, setLocationLabel] =
    useState<string | null>(null);

  const [places, setPlaces] = useState<Care[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function searchAround(
    point: Center,
    label: string
  ) {
    setCenter(point);
    setLocationLabel(label);

    const response = await fetch(
      `/api/nearby-care?lat=${point.lat}&lng=${point.lng}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Nearby-care search failed."
      );
    }

    const found = (data.places ?? []) as Care[];

    setPlaces(found);

    if (!found.length) {
      setMsg(
        "No mapped healthcare facilities were found within about 120 km. Try a nearby larger city."
      );
    }
  }

  async function manualSearch() {
    if (!query.trim()) return;

    setBusy(true);
    setMsg(null);
    setPlaces([]);
    setSelectedId(null);

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(
          query.trim()
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Location could not be found."
        );
      }

      await searchAround(
        {
          lat: data.lat,
          lng: data.lng,
        },
        data.label
      );
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : "The search failed."
      );
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    setBusy(true);
    setMsg(null);
    setPlaces([]);
    setSelectedId(null);

    if (!navigator.geolocation) {
      setMsg(
        "Your browser does not support location access. Please type your location instead."
      );
      setBusy(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          await searchAround(
            point,
            "Your current location"
          );
        } catch (error) {
          setMsg(
            error instanceof Error
              ? error.message
              : "Nearby-care search failed."
          );
        } finally {
          setBusy(false);
        }
      },

      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setMsg(
            "Location permission was not granted. You can type a city or address instead."
          );
        } else {
          setMsg(
            "Your current location could not be determined. You can type a location instead."
          );
        }

        setBusy(false);
      },

      {
        enableHighAccuracy: false,
        timeout: 15000,
      }
    );
  }

  function focus(place: Care) {
    setSelectedId(place.id);

    mapSection.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function directionsUrl(place: Care) {
    if (!center) {
      return `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`;
    }

    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${center.lat}%2C${center.lng}%3B${place.lat}%2C${place.lng}`;
  }

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-5xl">
        Find care near you
      </h1>

      <p className="mt-3 max-w-2xl text-cream-muted">
        Explore nearby hospitals and healthcare facilities,
        including locations whose map data mentions cancer,
        oncology or breast-care services.
      </p>

      <div className="card mt-8 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            manualSearch();
          }}
        >
          <label htmlFor="loc" className="label">
            Enter city, area, postcode, or address
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="loc"
              className="field"
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="e.g. Bhopal, Madhya Pradesh"
              autoComplete="street-address"
            />

            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={busy || !query.trim()}
            >
              <Search
                className="h-4 w-4"
                aria-hidden="true"
              />
              Find Care
            </button>
          </div>
        </form>

        <button
          className="btn-ghost"
          onClick={useMyLocation}
          disabled={busy}
        >
          <Crosshair
            className="h-4 w-4"
            aria-hidden="true"
          />
          Use my current location
        </button>
      </div>

      <p className="mt-3 text-xs text-cream-dim">
        Your browser asks for permission before sharing your
        location. MammoSights uses it only for the current search
        and does not store it.
      </p>

      {busy && (
        <p
          role="status"
          className="mt-5 text-sm text-cream-muted"
        >
          Searching nearby care options...
        </p>
      )}

      {msg && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-rose/40 bg-rose/10 p-3 text-sm"
        >
          {msg}
        </p>
      )}

      {locationLabel && center && (
        <p className="mt-5 flex items-start gap-2 text-sm text-cream-muted">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          Searching around {locationLabel}
        </p>
      )}

      {center && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div
            ref={mapSection}
            className="h-[420px] overflow-hidden rounded-xl2 border border-cream/10 bg-plum-800 lg:sticky lg:top-24 lg:h-[560px]"
          >
            <CareMap
              center={center}
              places={places}
              selectedId={selectedId}
            />
          </div>

          <ul className="space-y-4">
            {places.map((place) => (
              <li
                key={place.id}
                className="card p-5"
              >
                <div className="flex items-start gap-3">
                  <Hospital
                    className="mt-1 h-5 w-5 shrink-0 text-rose-soft"
                    aria-hidden="true"
                  />

                  <div>
                    <h2 className="text-lg font-medium">
                      {place.name}
                    </h2>

                    <p className="mt-1 text-xs text-rose-soft">
                      {place.category}
                    </p>
                  </div>
                </div>

                {place.address && (
                  <p className="mt-3 flex gap-2 text-sm text-cream-muted">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {place.address}
                  </p>
                )}

                {place.speciality && (
                  <p className="mt-2 text-sm text-cream-muted">
                    Listed speciality:{" "}
                    {place.speciality}
                  </p>
                )}

                <p className="mt-2 text-sm text-cream-muted">
                  {place.km.toFixed(1)} km away
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="btn-ghost !py-2"
                    onClick={() => focus(place)}
                  >
                    View on Map
                  </button>

                  <a
                    className="btn-ghost !py-2"
                    href={directionsUrl(place)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Directions
                    <span className="sr-only">
                      {" "}
                      (opens in a new tab)
                    </span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <Disclaimer>
          Nearby care options are based on OpenStreetMap
          community data. Medical speciality information may be
          incomplete or outdated. Verify services, availability
          and suitability directly with the healthcare provider.
        </Disclaimer>
      </div>
    </div>
  );
}

export default function FindCarePage() {
  return (
    <>
      <Navbar />

      <main id="main">
        <ProtectedRoute>
          <FindCare />
        </ProtectedRoute>
      </main>
    </>
  );
}