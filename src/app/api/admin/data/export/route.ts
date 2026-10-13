import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/adminAuth";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { getAllCanonicalBundles } from "@/lib/data/bundleService";
import {
  getAllQuestionBankItems,
  getAllAssignments,
  getAllCoupons,
  getSiteCMSConfig,
  getPlatformSettings,
  getBrandingSettings,
} from "@/lib/admin/adminDataService";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tests, bundles, questions, assignments, coupons, cms, platform, branding] =
      await Promise.all([
        fetchCanonicalTests(),
        getAllCanonicalBundles(),
        getAllQuestionBankItems(),
        getAllAssignments(),
        getAllCoupons(),
        getSiteCMSConfig(),
        getPlatformSettings(),
        getBrandingSettings(),
      ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      platformVersion: "2.0.0",
      adminUser: session.email,
      data: {
        tests,
        bundles,
        questions,
        assignments,
        coupons,
        siteSettings: {
          homepage: cms,
          platform,
          branding,
        },
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="testorbit_export_${Date.now()}.json"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
