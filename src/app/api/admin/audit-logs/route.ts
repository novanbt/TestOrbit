import { NextResponse } from "next/server";
import { getRecentAuditLogs } from "@/lib/admin/adminDataService";
import { getAdminSession } from "@/lib/admin/adminAuth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await getRecentAuditLogs(100);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
