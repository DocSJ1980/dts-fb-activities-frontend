import { NextResponse } from "next/server";
import type { KoboListResponse } from "@/types/kobo";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  // Use the live API endpoint directly
  try {
    const url =
      "https://kf.dharawalpindi.com/api/v2/assets/aFyQMvo4sF3PAUtBZ3iwXj/data.json";
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${process.env.KFKOBO_TOKEN}`,
        Cookie: "django_language=en",
      },
      // Do not cache sensitive data
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Kobo API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as KoboListResponse;
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Supervision API: remote fetch failed:", err);

    // Fallback: read local sample file so UI can work offline
    try {
      const filePath = path.join(process.cwd(), "sample_response.json");
      const raw = await readFile(filePath, "utf-8");
      const json = JSON.parse(raw) as KoboListResponse;
      return NextResponse.json(json, { status: 200 });
    } catch (fallbackErr) {
      console.error(
        "Supervision API: failed to read sample_response.json:",
        fallbackErr
      );
      return NextResponse.json(
        { error: "Failed to load supervision data" },
        { status: 500 }
      );
    }
  }
}
