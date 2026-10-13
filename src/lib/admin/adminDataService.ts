import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  AdminDashboardMetrics,
  AuditLog,
  AdminNotification,
  CommerceOrder,
  Coupon,
  CreatorProfile,
  Assignment,
  SiteCMSConfig,
  QuestionBankItem,
} from "@/types/admin";
import { MockTest, TestBundle, Category, TestQuestion } from "@/types";
import { getAllCanonicalPublishedTests, fetchCanonicalTests } from "@/lib/data/testService";
import { getAllCanonicalBundles } from "@/lib/data/bundleService";
import { getCategories } from "@/data/categories";
import { CURATED_QUESTION_BANK } from "@/data/question-bank";

/**
 * -------------------------------------------------------------
 * 1. DASHBOARD METRICS CALCULATION
 * -------------------------------------------------------------
 */
export async function getStudioDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const tests = await fetchCanonicalTests();
  const bundles = getAllCanonicalBundles();

  const totalTests = tests.length;
  const draftTests = tests.filter((t) => !t.published).length;
  const publishedSeries = bundles.filter((b) => b.published).length;

  let totalLearners = 0;
  let totalAttempts = 0;
  let completedAttempts = 0;
  let paidOrders = 0;
  let grossSalesInPaise = 0;
  let refundTotalInPaise = 0;

  if (isFirebaseConfigured && db) {
    try {
      // 1. Learners count
      const usersSnap = await getDocs(collection(db, "users"));
      totalLearners = usersSnap.size;

      // 2. Orders & Sales
      const ordersSnap = await getDocs(collection(db, "orders"));
      if (!ordersSnap.empty) {
        ordersSnap.forEach((d) => {
          const ord = d.data() as CommerceOrder;
          if (ord.status === "completed") {
            paidOrders++;
            grossSalesInPaise += ord.amountInPaise || 0;
          } else if (ord.status === "refunded") {
            refundTotalInPaise += ord.amountInPaise || 0;
          }
        });
      }
    } catch {}
  }

  return {
    totalTests,
    draftTests,
    publishedSeries,
    totalLearners,
    totalAttempts,
    completedAttempts,
    paidOrders,
    grossSalesInPaise,
    refundTotalInPaise,
  };
}

/**
 * -------------------------------------------------------------
 * 2. QUESTION BANK SERVICE
 * -------------------------------------------------------------
 */
export async function getAllQuestionBankItems(): Promise<QuestionBankItem[]> {
  const items: QuestionBankItem[] = [];
  const seenIds = new Set<string>();

  // 1. Curated built-in questions
  for (const [slug, questions] of Object.entries(CURATED_QUESTION_BANK)) {
    for (const q of questions) {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        items.push({
          ...q,
          status: "approved",
          assignedTestSlugs: [slug],
        });
      }
    }
  }

  // 2. Firestore questions collection
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "questions"));
      if (!snap.empty) {
        snap.forEach((d) => {
          const data = d.data() as QuestionBankItem;
          if (data && data.id && !seenIds.has(data.id)) {
            seenIds.add(data.id);
            items.unshift(data);
          }
        });
      }
    } catch {}
  }

  return items;
}

/**
 * -------------------------------------------------------------
 * 3. RECENT AUDIT LOGS
 * -------------------------------------------------------------
 */
export async function getRecentAuditLogs(max: number = 30): Promise<AuditLog[]> {
  const logs: AuditLog[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(max));
      const snap = await getDocs(q);
      snap.forEach((d) => logs.push(d.data() as AuditLog));
    } catch {}
  }
  return logs;
}

/**
 * -------------------------------------------------------------
 * 4. COMMERCE ORDERS & COUPONS
 * -------------------------------------------------------------
 */
export async function getAllOrders(): Promise<CommerceOrder[]> {
  const orders: CommerceOrder[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "orders"));
      snap.forEach((d) => orders.push(d.data() as CommerceOrder));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {}
  }
  return orders;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const coupons: Coupon[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "coupons"));
      snap.forEach((d) => coupons.push(d.data() as Coupon));
    } catch {}
  }
  return coupons;
}

/**
 * -------------------------------------------------------------
 * 5. ASSIGNMENTS
 * -------------------------------------------------------------
 */
export async function getAllAssignments(): Promise<Assignment[]> {
  const list: Assignment[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "assignments"));
      snap.forEach((d) => list.push(d.data() as Assignment));
    } catch {}
  }
  return list;
}

/**
 * -------------------------------------------------------------
 * 6. CREATOR PROFILES
 * -------------------------------------------------------------
 */
export async function getAllCreatorProfiles(): Promise<CreatorProfile[]> {
  const list: CreatorProfile[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, "creatorProfiles"));
      snap.forEach((d) => list.push(d.data() as CreatorProfile));
    } catch {}
  }
  return list;
}

/**
 * -------------------------------------------------------------
 * 7. SITE CMS CONFIGURATION
 * -------------------------------------------------------------
 */
export async function getSiteCMSConfig(): Promise<SiteCMSConfig> {
  const defaults: SiteCMSConfig = {
    heroTitle: "Standardized Computer-Based Test Simulations",
    heroSubtitle: "Practice real curriculum-aligned exam formats with instant scoring and detailed topic breakdowns.",
    featuredTestIds: [],
    featuredSeriesIds: [],
    announcementBanner: {
      active: true,
      text: "🎓 All 2026 JEE Main & NEET UG Practice Mocks are now live with updated syllabus patterns!",
      type: "info",
    },
    faqs: [
      {
        id: "faq-1",
        question: "How does TestOrbit CBT exam timing work?",
        answer: "The exam interface runs an authoritative countdown timer. Answers are autosaved on every selection.",
      },
      {
        id: "faq-2",
        question: "Can I take tests on mobile and tablet devices?",
        answer: "Yes, our responsive test-runner adapts smoothly to mobile devices and tablets.",
      },
    ],
  };

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "siteSettings", "homepage"));
      if (snap.exists()) {
        return { ...defaults, ...snap.data() };
      }
    } catch {}
  }

  return defaults;
}

/**
 * -------------------------------------------------------------
 * 8. PLATFORM & BRANDING SETTINGS
 * -------------------------------------------------------------
 */
export async function getPlatformSettings(): Promise<import("@/types/admin").PlatformSettings> {
  const defaults: import("@/types/admin").PlatformSettings = {
    platformName: "TestOrbit",
    supportEmail: "support@testorbit.in",
    defaultCurrency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    defaultExamDurationMinutes: 60,
    defaultPassingPercentage: 40,
    enableNegativeMarking: true,
    defaultNegativeMarkingRate: 0.25,
    allowReviewLater: true,
    autoSaveIntervalSeconds: 15,
    allowCalculator: false,
    resultReleasePolicy: "immediate",
    maintenanceMode: false,
  };

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "siteSettings", "platform"));
      if (snap.exists()) {
        return { ...defaults, ...snap.data() };
      }
    } catch {}
  }
  return defaults;
}

export async function getBrandingSettings(): Promise<import("@/types/admin").BrandingSettings> {
  const defaults: import("@/types/admin").BrandingSettings = {
    brandName: "TestOrbit",
    tagline: "India's Premier Computer-Based Test Simulation Platform",
    primaryColor: "#0284c7",
    accentColor: "#3b82f6",
    fontFamily: "Inter, system-ui, sans-serif",
    contactAddress: "Bengaluru, Karnataka, India",
  };

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "siteSettings", "branding"));
      if (snap.exists()) {
        return { ...defaults, ...snap.data() };
      }
    } catch {}
  }
  return defaults;
}

