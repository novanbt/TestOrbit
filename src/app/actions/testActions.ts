"use server";

import { revalidatePath } from "next/cache";
import { MockTest } from "@/types";
import { saveCanonicalTest, deleteCanonicalTest } from "@/lib/data/testService";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to validate, persist, and revalidate affected routes when an admin saves a test.
 */
export async function saveTestServerAction(test: MockTest): Promise<ActionResponse<MockTest>> {
  try {
    // 1. Validation
    if (!test) {
      return { success: false, error: "No test payload provided." };
    }
    if (!test.title || !test.title.trim()) {
      return { success: false, error: "Mock test title is required." };
    }
    if (!test.slug || !test.slug.trim()) {
      return { success: false, error: "Mock test slug is required." };
    }

    // 2. Persist to canonical database
    const saved = await saveCanonicalTest(test);

    // 3. Next.js cache invalidation so live pages immediately display the new data
    try {
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath(`/tests/${test.slug}`);
      revalidatePath(`/tests/${test.slug}/take`);
      revalidatePath("/admin/tests");
      revalidatePath(`/admin/tests/${test.slug}/edit`);
    } catch (revErr) {
      console.warn("[saveTestServerAction] Route revalidation warning:", revErr);
    }

    return {
      success: true,
      data: saved,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[saveTestServerAction] Error saving test:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to delete a test and revalidate paths.
 */
export async function deleteTestServerAction(id: string, slug?: string): Promise<ActionResponse<void>> {
  try {
    if (!id) {
      return { success: false, error: "Test ID is required for deletion." };
    }

    await deleteCanonicalTest(id);

    try {
      revalidatePath("/");
      revalidatePath("/explore");
      if (slug) {
        revalidatePath(`/tests/${slug}`);
        revalidatePath(`/tests/${slug}/take`);
      }
      revalidatePath("/admin/tests");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[deleteTestServerAction] Error deleting test:", message);
    return {
      success: false,
      error: message,
    };
  }
}
