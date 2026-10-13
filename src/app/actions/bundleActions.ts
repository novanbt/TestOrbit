"use server";

import { revalidatePath } from "next/cache";
import { getCanonicalBundleById } from "@/lib/data/bundleService";
import { enrollUserInBundle } from "@/lib/data/entitlementService";

export interface BundleActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to securely fulfill a bundle purchase and grant access to all included tests.
 */
export async function enrollInBundleServerAction(
  userId: string,
  bundleId: string
): Promise<BundleActionResponse<{ orderId: string; message: string }>> {
  try {
    if (!userId || !bundleId) {
      return { success: false, error: "User ID and Bundle ID are required." };
    }

    const bundle = getCanonicalBundleById(bundleId);
    if (!bundle) {
      return { success: false, error: "Test bundle not found." };
    }

    if (!bundle.published && bundle.status !== "published") {
      return {
        success: false,
        error: "This test bundle is currently unpublished and not available for enrollment.",
      };
    }

    const result = await enrollUserInBundle(userId, bundle);
    if (!result.success) {
      return { success: false, error: result.message };
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath(`/series/${bundle.slug}`);
      revalidatePath(`/test-series/${bundle.slug}`);
    } catch {}

    return {
      success: true,
      data: {
        orderId: result.orderId,
        message: result.message,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
