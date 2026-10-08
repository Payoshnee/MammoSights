import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NominatimPlace = {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
};

type CarePlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  speciality?: string;
  category: string;
  oncologyRelated: boolean;
  km: number;
};

const cache = new Map<
  string,
  {
    expires: number;
    places: CarePlace[];
  }
>();

let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function respectRateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  const wait = 1100 - elapsed;

  if (wait > 0) {
    await sleep(wait);
  }

  lastRequestAt = Date.now();
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;

  const rad = (value: number) =>
    (value * Math.PI) / 180;

  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
      Math.cos(rad(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function makeViewbox(
  lat: number,
  lng: number,
  radiusKm: number
) {
  const latDelta = radiusKm / 111;

  const cosLat = Math.max(
    0.2,
    Math.cos((lat * Math.PI) / 180)
  );

  const lngDelta =
    radiusKm / (111 * cosLat);

  const west = lng - lngDelta;
  const east = lng + lngDelta;
  const north = lat + latDelta;
  const south = lat - latDelta;

  // Nominatim format:
  // left,top,right,bottom
  return `${west},${north},${east},${south}`;
}

async function searchNominatim(
  q: string,
  lat: number,
  lng: number,
  radiusKm: number,
  limit = 15
): Promise<NominatimPlace[]> {
  await respectRateLimit();

  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("bounded", "1");
  url.searchParams.set(
    "viewbox",
    makeViewbox(lat, lng, radiusKm)
  );

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "MammoSense/1.0 educational research demo",
      "Accept-Language": "en",
      Referer: "http://localhost:3000/",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Nominatim returned ${response.status}`
    );
  }

  return await response.json();
}

function convertPlaces(
  results: NominatimPlace[],
  origin: { lat: number; lng: number },
  oncologySearch: boolean
): CarePlace[] {
  return results
    .map((place) => {
      const lat = Number(place.lat);
      const lng = Number(place.lon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null;
      }

      const address = place.address ?? {};

      const name =
        place.name ||
        address.amenity ||
        address.healthcare ||
        place.display_name.split(",")[0] ||
        "Healthcare facility";

      const combined =
        `${name} ${place.display_name}`.toLowerCase();

      const oncologyRelated =
        oncologySearch ||
        /cancer|oncolog|breast|mammograph|tumou?r/.test(
          combined
        );

      return {
        id: `${place.osm_type ?? "osm"}-${
          place.osm_id ?? place.place_id
        }`,

        name,

        lat,
        lng,

        address: place.display_name,

        category: oncologyRelated
          ? "Cancer / oncology related"
          : "Hospital / healthcare facility",

        oncologyRelated,

        km: haversineKm(origin, {
          lat,
          lng,
        }),
      };
    })
    .filter(
      (
        place
      ): place is NonNullable<typeof place> =>
        place !== null
    );
}

export async function GET(req: NextRequest) {
  const lat = Number(
    req.nextUrl.searchParams.get("lat")
  );

  const lng = Number(
    req.nextUrl.searchParams.get("lng")
  );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      {
        detail: "Invalid location.",
      },
      {
        status: 400,
      }
    );
  }

  const cacheKey = `${lat.toFixed(
    2
  )},${lng.toFixed(2)}`;

  const cached = cache.get(cacheKey);

  if (
    cached &&
    cached.expires > Date.now()
  ) {
    return NextResponse.json({
      places: cached.places,
    });
  }

  try {
    const origin = { lat, lng };

    /*
      First try to find actual cancer /
      oncology-related facilities in a wider area.
    */

    let results =
      await searchNominatim(
        "cancer hospital",
        lat,
        lng,
        160,
        15
      );

    let places = convertPlaces(
      results,
      origin,
      true
    );

    /*
      If OSM has no cancer-specific match,
      fall back to nearby hospitals.
    */

    if (places.length === 0) {
      results =
        await searchNominatim(
          "[hospital]",
          lat,
          lng,
          60,
          20
        );

      places = convertPlaces(
        results,
        origin,
        false
      );
    }

    const unique = new Map<
      string,
      CarePlace
    >();

    for (const place of places) {
      unique.set(place.id, place);
    }

    const finalPlaces = Array.from(
      unique.values()
    )
      .sort((a, b) => {
        if (
          a.oncologyRelated !==
          b.oncologyRelated
        ) {
          return a.oncologyRelated
            ? -1
            : 1;
        }

        return a.km - b.km;
      })
      .slice(0, 20);

    cache.set(cacheKey, {
      expires:
        Date.now() +
        10 * 60 * 1000,

      places: finalPlaces,
    });

    return NextResponse.json({
      places: finalPlaces,
    });
  } catch (error) {
    console.error(
      "Nearby-care search error:",
      error
    );

    return NextResponse.json(
      {
        detail:
          "Nearby-care search could not be completed. Please try again.",
      },
      {
        status: 503,
      }
    );
  }
}