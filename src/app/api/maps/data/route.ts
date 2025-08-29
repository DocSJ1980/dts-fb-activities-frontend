import { NextRequest, NextResponse } from "next/server";
import { queryLayerData } from "@/lib/maps-queries";
import { mapsCache } from "@/lib/maps-cache";
import { MapsDataRequest, MapsDataResponse, MapMarker } from "@/types/maps";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: MapsDataRequest = await request.json();
    const { ucs, layers } = body;

    if (!ucs || ucs.length === 0) {
      return NextResponse.json(
        { error: "At least one UC is required" },
        { status: 400 }
      );
    }

    if (!layers || layers.length === 0) {
      return NextResponse.json(
        { error: "At least one layer is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const enabledLayers = layers.filter((layer) => layer.enabled);
    const cacheKey = { ucs, layers: enabledLayers };
    const cachedResult = mapsCache.get(cacheKey);

    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Query data for all enabled layers and UCs in parallel
    const layerPromises = enabledLayers.flatMap((layer) =>
      ucs.map((uc) =>
        queryLayerData(layer, uc).then((markers) => ({
          layerId: layer.id,
          uc,
          markers,
        }))
      )
    );

    const layerResults = await Promise.all(layerPromises);

    // Combine all markers and aggregate counts by layer
    const allMarkers: MapMarker[] = [];
    const layerCounts: Record<string, number> = {};

    // Initialize layer counts
    enabledLayers.forEach((layer) => {
      layerCounts[layer.id] = 0;
    });

    layerResults.forEach(({ layerId, markers }) => {
      allMarkers.push(...markers);
      layerCounts[layerId] += markers.length;
    });

    const response: MapsDataResponse = {
      markers: allMarkers,
      layerCounts,
    };

    // Cache the result for 2 minutes
    mapsCache.set(cacheKey, response, 2 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in maps data API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
