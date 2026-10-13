import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/adminAuth";
import { getPlatformSettings } from "@/lib/admin/adminDataService";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch platform settings" }, { status: 500 });
  }
}
