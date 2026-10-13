"use server";

import { revalidatePath } from "next/cache";
import { MockTest, TestQuestion } from "@/types";
import {
  saveCanonicalTest,
  deleteCanonicalTest,
  fetchCanonicalTestBySlug,
  fetchCanonicalTests,
  purgeCanonicalTesterTests,
  saveCanonicalQuestions,
  fetchCanonicalQuestionsForTest,
} from "@/lib/data/testService";

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
      revalidatePath(`/admin/tests/${test.slug}/questions`);
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

    await deleteCanonicalTest(id, slug);

    try {
      revalidatePath("/");
      revalidatePath("/explore");
      if (slug) {
        revalidatePath(`/tests/${slug}`);
        revalidatePath(`/tests/${slug}/take`);
        revalidatePath(`/admin/tests/${slug}/questions`);
        revalidatePath(`/admin/tests/${slug}/edit`);
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

/**
 * Server action to purge all 117 pre-loaded seed/tester mock tests.
 */
export async function purgeAllTesterTestsServerAction(): Promise<ActionResponse<{ purgedCount: number }>> {
  try {
    const res = await purgeCanonicalTesterTests();
    try {
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/admin/tests");
    } catch {}
    return { success: true, data: res };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[purgeAllTesterTestsServerAction] Error purges tests:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to fetch a test by slug from canonical database / Firestore.
 * Supports both published and draft/unpublished tests for admin operations.
 */
export async function getTestBySlugServerAction(slug: string): Promise<ActionResponse<MockTest>> {
  try {
    if (!slug || !slug.trim()) {
      return { success: false, error: "Mock test slug is required." };
    }
    const clean = slug.trim().toLowerCase();
    const test = await fetchCanonicalTestBySlug(clean, false);
    if (!test) {
      return { success: false, error: `Mock test "${slug}" not found in database.` };
    }
    return { success: true, data: test };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[getTestBySlugServerAction] Error fetching test:", message);
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch all tests (including drafts) from canonical database / Firestore.
 */
export async function getAllTestsServerAction(): Promise<ActionResponse<MockTest[]>> {
  try {
    const tests = await fetchCanonicalTests();
    return { success: true, data: tests };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[getAllTestsServerAction] Error fetching tests:", message);
    return { success: false, error: message };
  }
}

/**
 * Server action to persist manual questions for a test to Firestore.
 */
export async function saveQuestionsServerAction(
  slug: string,
  questions: TestQuestion[]
): Promise<ActionResponse<TestQuestion[]>> {
  try {
    if (!slug || !slug.trim()) {
      return { success: false, error: "Test slug is required." };
    }
    const clean = slug.trim().toLowerCase();
    const saved = await saveCanonicalQuestions(clean, questions);

    try {
      revalidatePath(`/tests/${clean}`);
      revalidatePath(`/tests/${clean}/take`);
      revalidatePath(`/admin/tests/${clean}/questions`);
    } catch {}

    return { success: true, data: saved };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[saveQuestionsServerAction] Error saving questions:", message);
    return { success: false, error: message };
  }
}

/**
 * Server action to fetch questions for a test.
 */
export async function getQuestionsServerAction(slug: string): Promise<ActionResponse<TestQuestion[]>> {
  try {
    if (!slug || !slug.trim()) {
      return { success: false, error: "Test slug is required." };
    }
    const clean = slug.trim().toLowerCase();
    const questions = await fetchCanonicalQuestionsForTest(clean);
    return { success: true, data: questions };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[getQuestionsServerAction] Error fetching questions:", message);
    return { success: false, error: message };
  }
}
