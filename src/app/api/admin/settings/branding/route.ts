import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/adminAuth";
import { getBrandingSettings } from "@/lib/admin/adminDataService";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branding = await getBrandingSettings();
    return NextResponse.json({ branding });
  } catch {
    return NextResponse.json({ error: "Failed to fetch branding settings" }, { status: 500 });
  }
}
