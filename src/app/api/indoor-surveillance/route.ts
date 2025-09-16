import { NextRequest, NextResponse } from "next/server";
import {
  getSurveillanceData,
  getTowns,
  getUCs,
  searchUCs
} from "@/lib/surveillance-queries";
import { SurveillanceFilters } from "@/types/surveillance";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    // Handle different endpoints
    switch (endpoint) {
      case "towns":
        return handleGetTowns();
      
      case "ucs":
        return handleGetUCs(searchParams);
      
      case "surveillance-data":
        return handleGetSurveillanceData(searchParams);
      
      case "search-uc":
        return handleSearchUC(searchParams);
      
      default:
        return NextResponse.json(
          { error: "Invalid endpoint. Use ?endpoint=towns, ?endpoint=ucs, ?endpoint=surveillance-data, or ?endpoint=search-uc" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Indoor surveillance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleGetTowns() {
  try {
    const towns = await getTowns();
    return NextResponse.json(towns);
  } catch (error) {
    console.error("Error fetching towns:", error);
    return NextResponse.json(
      { error: "Failed to fetch towns" },
      { status: 500 }
    );
  }
}

async function handleGetUCs(searchParams: URLSearchParams) {
  try {
    const townId = searchParams.get("town_id");
    
    if (!townId) {
      return NextResponse.json(
        { error: "town_id parameter is required" },
        { status: 400 }
      );
    }

    const townIdNumber = parseInt(townId, 10);
    if (isNaN(townIdNumber)) {
      return NextResponse.json(
        { error: "town_id must be a valid number" },
        { status: 400 }
      );
    }

    const ucs = await getUCs(townIdNumber);
    return NextResponse.json(ucs);
  } catch (error) {
    console.error("Error fetching UCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch UCs" },
      { status: 500 }
    );
  }
}

async function handleSearchUC(searchParams: URLSearchParams) {
  try {
    const searchTerm = searchParams.get("search");
    
    if (!searchTerm) {
      return NextResponse.json(
        { error: "search parameter is required" },
        { status: 400 }
      );
    }

    const ucs = await searchUCs(searchTerm);
    return NextResponse.json(ucs);
  } catch (error) {
    console.error("Error searching UCs:", error);
    return NextResponse.json(
      { error: "Failed to search UCs" },
      { status: 500 }
    );
  }
}

async function handleGetSurveillanceData(searchParams: URLSearchParams) {
  try {
    const date = searchParams.get("date");
    const townCode = searchParams.get("town_code");
    const ucCode = searchParams.get("uc_code");

    // Validate required parameters - UC is now required
    if (!date) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    if (!ucCode) {
      return NextResponse.json(
        { error: "uc_code parameter is required" },
        { status: 400 }
      );
    }

    // Convert string parameters to numbers
    const townCodeNumber = townCode ? parseInt(townCode, 10) : undefined;
    const ucCodeNumber = parseInt(ucCode, 10);
    
    if (isNaN(ucCodeNumber)) {
      return NextResponse.json(
        { error: "uc_code must be a valid number" },
        { status: 400 }
      );
    }

    if (townCode && isNaN(townCodeNumber!)) {
      return NextResponse.json(
        { error: "town_code must be a valid number" },
        { status: 400 }
      );
    }

    // Build filters object
    const filters: SurveillanceFilters = {
      date,
      townCode: townCodeNumber,
      ucCode: ucCodeNumber,
    };

    console.log("API: Getting surveillance data with filters:", filters);

    const surveillanceData = await getSurveillanceData(filters);

    console.log("API: Returning surveillance data:", {
      activities: surveillanceData.combined_data.length,
      containers: surveillanceData.container_data.length,
      users: surveillanceData.users.length,
    });

    return NextResponse.json(surveillanceData);
  } catch (error) {
    console.error("Error fetching surveillance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveillance data" },
      { status: 500 }
    );
  }
}