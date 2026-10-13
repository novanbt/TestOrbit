"use server";

import { revalidatePath } from "next/cache";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  verifyAdminCredentials,
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
} from "@/lib/admin/adminAuth";
import {
  AdminUser,
  AuditLog,
  AdminNotification,
  CommerceOrder,
  Coupon,
  Assignment,
  SiteCMSConfig,
  QuestionBankItem,
  PlatformSettings,
  BrandingSettings,
} from "@/types/admin";
import { MockTest, TestQuestion, TestBundle, Category } from "@/types";
import { saveCanonicalTest, deleteCanonicalTest, bulkDeleteCanonicalTests } from "@/lib/data/testService";
import { saveCanonicalBundle, deleteCanonicalBundle } from "@/lib/data/bundleService";

export interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * -------------------------------------------------------------
 * 1. AUTHENTICATION ACTIONS
 * -------------------------------------------------------------
 */
export async function loginAdminAction(
  email: string,
  pass: string
): Promise<ServerActionResponse<AdminUser>> {
  try {
    const result = await verifyAdminCredentials(email, pass);
    if (!result.success || !result.user) {
      return { success: false, error: result.error || "Authentication failed." };
    }

    await createAdminSession(result.user);

    // Audit login
    await logAuditEvent("admin_login", "user", result.user.id, `Admin ${result.user.email} signed in.`);

    return { success: true, data: result.user };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function logoutAdminAction(): Promise<ServerActionResponse<void>> {
  try {
    const session = await getAdminSession();
    if (session) {
      await logAuditEvent("admin_logout", "user", session.id, `Admin ${session.email} signed out.`);
    }
    await destroyAdminSession();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function getActiveAdminSessionAction(): Promise<ServerActionResponse<AdminUser | null>> {
  try {
    const session = await getAdminSession();
    return { success: true, data: session };
  } catch {
    return { success: true, data: null };
  }
}

/**
 * -------------------------------------------------------------
 * 2. AUDIT LOGGING HELPER
 * -------------------------------------------------------------
 */
async function logAuditEvent(
  action: string,
  entityType: AuditLog["entityType"],
  entityId: string,
  details: string
): Promise<void> {
  try {
    const session = await getAdminSession();
    const logItem: AuditLog = {
      id: "log_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      actorEmail: session?.email || "system",
      actorId: session?.id || "sys-001",
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "auditLogs", logItem.id), logItem).catch(() => {});
    }
  } catch {}
}

/**
 * -------------------------------------------------------------
 * 3. MOCK TEST ACTIONS
 * -------------------------------------------------------------
 */
export async function saveMockTestAction(test: MockTest): Promise<ServerActionResponse<MockTest>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (!test.title || !test.slug) {
      return { success: false, error: "Test title and slug are mandatory." };
    }

    const saved = await saveCanonicalTest(test);
    await logAuditEvent("save_test", "test", saved.id, `Saved mock test "${saved.title}" (${saved.slug})`);

    // Invalidate public page caches
    try {
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath(`/tests/${saved.slug}`);
      revalidatePath(`/tests/${saved.slug}/take`);
      revalidatePath("/admin/tests");
    } catch {}

    return { success: true, data: saved };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteMockTestAction(id: string, slug?: string): Promise<ServerActionResponse<void>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    await deleteCanonicalTest(id, slug);
    await logAuditEvent("delete_test", "test", id, `Deleted mock test ID ${id} (${slug || ""})`);

    try {
      revalidatePath("/");
      revalidatePath("/explore");
      if (slug) revalidatePath(`/tests/${slug}`);
      revalidatePath("/admin/tests");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function bulkDeleteMockTestsAction(
  items: { id: string; slug?: string }[]
): Promise<ServerActionResponse<number>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (!items || items.length === 0) {
      return { success: true, data: 0 };
    }

    const count = await bulkDeleteCanonicalTests(items);

    await logAuditEvent("bulk_delete_tests", "test", "bulk", `Bulk deleted ${count} mock tests.`);

    try {
      revalidatePath("/");
      revalidatePath("/explore");
      revalidatePath("/admin/tests");
    } catch {}

    return { success: true, data: count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 4. QUESTION BANK & QUESTIONS ACTIONS
 * -------------------------------------------------------------
 */
export async function saveQuestionItemAction(
  question: QuestionBankItem
): Promise<ServerActionResponse<QuestionBankItem>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (!question.id) {
      question.id = "q_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
    }
    question.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "questions", question.id), question);
    }

    await logAuditEvent("save_question", "question", question.id, `Saved question "${question.text.slice(0, 40)}..."`);
    revalidatePath("/admin/questions");

    return { success: true, data: question };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function saveQuestionsForTestAction(
  testSlug: string,
  questions: TestQuestion[]
): Promise<ServerActionResponse<TestQuestion[]>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    const clean = testSlug.trim().toLowerCase();

    if (isFirebaseConfigured && db) {
      const docRef = doc(db, "test_questions", clean);
      await setDoc(docRef, {
        slug: clean,
        questions,
        updatedAt: new Date().toISOString(),
      });
    }

    await logAuditEvent("update_test_questions", "test", clean, `Updated ${questions.length} questions for test "${clean}".`);

    try {
      revalidatePath(`/tests/${clean}/take`);
      revalidatePath(`/tests/${clean}`);
    } catch {}

    return { success: true, data: questions };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 5. TEST SERIES ACTIONS
 * -------------------------------------------------------------
 */
export async function saveSeriesAction(series: TestBundle): Promise<ServerActionResponse<TestBundle>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    const saved = await saveCanonicalBundle(series);
    await logAuditEvent("save_series", "series", saved.id, `Saved test series "${saved.title}" (${saved.slug})`);

    try {
      revalidatePath("/");
      revalidatePath("/series");
      revalidatePath("/test-series");
      revalidatePath(`/series/${saved.slug}`);
      revalidatePath("/admin/series");
    } catch {}

    return { success: true, data: saved };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteSeriesAction(id: string): Promise<ServerActionResponse<void>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    await deleteCanonicalBundle(id);
    await logAuditEvent("delete_series", "series", id, `Deleted test series ID ${id}`);

    try {
      revalidatePath("/");
      revalidatePath("/series");
      revalidatePath("/admin/series");
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 6. ASSIGNMENT & TAXONOMY ACTIONS
 * -------------------------------------------------------------
 */
export async function saveAssignmentAction(assignment: Assignment): Promise<ServerActionResponse<Assignment>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (!assignment.id) {
      assignment.id = "asg_" + Date.now().toString(36);
    }
    assignment.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "assignments", assignment.id), assignment);
    }

    await logAuditEvent("save_assignment", "series", assignment.id, `Saved assignment "${assignment.title}"`);
    revalidatePath("/admin/assignments");

    return { success: true, data: assignment };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function saveCategoryAction(category: Category): Promise<ServerActionResponse<Category>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "categories", category.id), category);
    }

    await logAuditEvent("save_category", "category", category.id, `Saved category "${category.name}"`);
    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/admin/categories");

    return { success: true, data: category };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 7. COMMERCE ACTIONS (Coupons & Refunds)
 * -------------------------------------------------------------
 */
export async function saveCouponAction(coupon: Coupon): Promise<ServerActionResponse<Coupon>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (!coupon.id) {
      coupon.id = "cpn_" + Date.now().toString(36);
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "coupons", coupon.id), coupon);
    }

    await logAuditEvent("save_coupon", "order", coupon.id, `Configured coupon code "${coupon.code}"`);
    revalidatePath("/admin/coupons");

    return { success: true, data: coupon };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function processRefundAction(
  orderId: string,
  reason: string
): Promise<ServerActionResponse<{ refundId: string }>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    const refundId = "ref_" + Date.now().toString(36);

    if (isFirebaseConfigured && db) {
      const orderRef = doc(db, "orders", orderId);
      await setDoc(
        orderRef,
        {
          status: "refunded",
          refundedAt: new Date().toISOString(),
          refundReason: reason,
        },
        { merge: true }
      );
    }

    await logAuditEvent("process_refund", "order", orderId, `Processed refund for order ${orderId}: ${reason}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/refunds");

    return { success: true, data: { refundId } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 8. SITE CMS & HOMEPAGE CONFIG
 * -------------------------------------------------------------
 */
export async function saveSiteCMSAction(config: SiteCMSConfig): Promise<ServerActionResponse<SiteCMSConfig>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "siteSettings", "homepage"), config, { merge: true });
    }

    await logAuditEvent("update_cms", "setting", "homepage", "Updated public homepage CMS configuration.");
    revalidatePath("/");
    revalidatePath("/admin/website/homepage");

    return { success: true, data: config };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * -------------------------------------------------------------
 * 9. PLATFORM & BRANDING ACTIONS
 * -------------------------------------------------------------
 */
export async function savePlatformSettingsAction(
  settings: PlatformSettings
): Promise<ServerActionResponse<PlatformSettings>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "siteSettings", "platform"), settings, { merge: true });
    }

    await logAuditEvent("update_settings", "setting", "platform", "Updated platform examination and system defaults.");
    revalidatePath("/admin/settings");

    return { success: true, data: settings };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function saveBrandingSettingsAction(
  branding: BrandingSettings
): Promise<ServerActionResponse<BrandingSettings>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Unauthorized: Administrator session required." };
    }

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, "siteSettings", "branding"), branding, { merge: true });
    }

    await logAuditEvent("update_branding", "setting", "branding", "Updated platform branding, colors, and identity.");
    revalidatePath("/admin/settings/branding");

    return { success: true, data: branding };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

