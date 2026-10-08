"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

type Care = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  category: string;
};

type Center = {
  lat: number;
  lng: number;
};

function FitMap({
  center,
  places,
}: {
  center: Center;
  places: Care[];
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      L.latLng(center.lat, center.lng),
      ...places.map((p) => L.latLng(p.lat, p.lng)),
    ];

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [center, places, map]);

  return null;
}

function FocusSelected({
  selectedId,
  places,
}: {
  selectedId: string | null;
  places: Care[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;

    const place = places.find((p) => p.id === selectedId);

    if (place) {
      map.flyTo([place.lat, place.lng], 15, {
        duration: 0.8,
      });
    }
  }, [selectedId, places, map]);

  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:9999px;
      background:#f1c4cf;
      border:4px solid white;
      box-shadow:0 2px 12px rgba(0,0,0,.45);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const careIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:30px;
      height:30px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:#d9a7b4;
      border:3px solid #fff;
      box-shadow:0 3px 12px rgba(0,0,0,.5);
    ">
      <div style="
        width:8px;
        height:8px;
        border-radius:50%;
        background:#5a2943;
        margin:8px;
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function CareMap({
  center,
  places,
  selectedId,
}: {
  center: Center;
  places: Care[];
  selectedId: string | null;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[center.lat, center.lng]}
        icon={userIcon}
      >
        <Popup>Your search location</Popup>
      </Marker>

      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={careIcon}
        >
          <Popup>
            <div>
              <strong>{place.name}</strong>
              <br />
              <span>{place.category}</span>
              {place.address && (
                <>
                  <br />
                  <span>{place.address}</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      <FitMap center={center} places={places} />

      <FocusSelected
        selectedId={selectedId}
        places={places}
      />
    </MapContainer>
  );
}