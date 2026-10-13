"use server";

import { revalidatePath } from "next/cache";
import { TestBundle } from "@/types";
import {
  saveCanonicalBundle,
  deleteCanonicalBundle,
  getCanonicalBundleById,
} from "@/lib/data/bundleService";
import { enrollUserInBundle } from "@/lib/data/entitlementService";

export interface BundleActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to validate, persist, and revalidate affected routes when an admin creates or edits a test bundle.
 */
export async function saveBundleServerAction(
  bundle: TestBundle
): Promise<BundleActionResponse<TestBundle>> {
  try {
    // 1. Validation
    if (!bundle) {
      return { success: false, error: "No bundle payload provided." };
    }
    if (!bundle.title || !bundle.title.trim()) {
      return { success: false, error: "Bundle title is required." };
    }
    if (!bundle.slug || !bundle.slug.trim()) {
      return { success: false, error: "Bundle slug is required." };
    }
    if (!bundle.includedItems || bundle.includedItems.length === 0) {
      return {
        success: false,
        error: "A bundle must include at least one valid mock test.",
      };
    }
    if (typeof bundle.priceInPaise !== "number" || bundle.priceInPaise < 0) {
      return { success: false, error: "Bundle price must be a valid non-negative number." };
    }

    // Check for duplicate test inclusion
    const testIds = bundle.includedItems.map((item) => item.testId || item.testSlug);
    const uniqueTestIds = new Set(testIds);
    if (uniqueTestIds.size !== testIds.length) {
      return {
        success: false,
        error: "Bundle contains duplicate mock tests. Each test can only be included once.",
      };
    }

    // 2. Persist to canonical database
    const saved = await saveCanonicalBundle(bundle);

    // 3. Next.js cache invalidation
    try {
      revalidatePath("/");
      revalidatePath("/series");
      revalidatePath("/test-series");
      revalidatePath(`/series/${saved.slug}`);
      revalidatePath(`/test-series/${saved.slug}`);
      revalidatePath("/admin/series");
      revalidatePath("/dashboard");
    } catch (revErr) {
      console.warn("[saveBundleServerAction] Route revalidation warning:", revErr);
    }

    return {
      success: true,
      data: saved,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[saveBundleServerAction] Error saving bundle:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to delete a bundle and revalidate paths.
 * Does not delete the included mock tests or historical purchases.
 */
export async function deleteBundleServerAction(
  id: string,
  slug?: string
): Promise<BundleActionResponse<void>> {
  try {
    if (!id) {
      return { success: false, error: "Bundle ID is required for deletion." };
    }

    await deleteCanonicalBundle(id);

    try {
      revalidatePath("/");
      revalidatePath("/series");
      revalidatePath("/test-series");
      if (slug) {
        revalidatePath(`/series/${slug}`);
        revalidatePath(`/test-series/${slug}`);
      }
      revalidatePath("/admin/series");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[deleteBundleServerAction] Error deleting bundle:", message);
    return {
      success: false,
      error: message,
    };
  }
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
