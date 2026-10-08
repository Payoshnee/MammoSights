import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { detail: "Location is required." },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "MammoSense/1.0 educational research demo",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Geocoding service failed");
    }

    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (!data.length) {
      return NextResponse.json(
        { detail: "Location not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name,
    });
  } catch {
    return NextResponse.json(
      { detail: "Location search is temporarily unavailable." },
      { status: 503 }
    );
  }
}