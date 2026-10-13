import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { ensureAdminAuthenticated } from "@/lib/firebase/serverAuth";
import { Category } from "@/types";

export const BASE_CATEGORIES: Category[] = [
  {
    id: "cat-school",
    name: "School Education",
    slug: "school-education",
    iconName: "GraduationCap",
    description: "Curriculum-aligned mock assessments for Classes V–XII (CBSE, ICSE, State Boards).",
    testCount: 15,
  },
  {
    id: "cat-competitive",
    name: "Competitive Exams",
    slug: "competitive-exams",
    iconName: "Target",
    description: "Standardized practice simulations for JEE, NEET, UPSC, SSC CGL, Banking & Railways.",
    testCount: 29,
  },
  {
    id: "cat-college",
    name: "College & University",
    slug: "college-university",
    iconName: "Building2",
    description: "Undergraduate course mocks, semester finals, engineering fundamentals, and GATE prep.",
    testCount: 16,
  },
  {
    id: "cat-programming",
    name: "Programming & Technology",
    slug: "programming-technology",
    iconName: "Code2",
    description: "Technical evaluations in Python, DSA, Web Development, Cloud Computing, and AI/ML.",
    testCount: 23,
  },
  {
    id: "cat-languages",
    name: "Languages",
    slug: "languages",
    iconName: "Languages",
    description: "Evaluations across Hindi, French, German, Spanish, Sanskrit, Japanese, and English communication.",
    testCount: 25,
  },
  {
    id: "cat-professional",
    name: "Professional Skills",
    slug: "professional-skills",
    iconName: "Briefcase",
    description: "Industry readiness tests, financial analysis, business acumen, and workplace tooling.",
    testCount: 11,
  },
];

const categoriesRegistry = new Map<string, Category>();
let isInitialized = false;
let isSyncing = false;
const deletedCategoryIds = new Set<string>();

function loadCache() {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("testorbit_categories_state");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.deletedIds)) {
          parsed.deletedIds.forEach((id: string) => deletedCategoryIds.add(id));
        }
      }
    } catch {}
  }
}

function syncCache() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "testorbit_categories_state",
        JSON.stringify({
          deletedIds: Array.from(deletedCategoryIds),
        })
      );
    } catch {}
  }
}

loadCache();

export function initCategoriesRegistry() {
  if (isInitialized) return;
  loadCache();

  for (const cat of BASE_CATEGORIES) {
    if (!deletedCategoryIds.has(cat.id)) {
      categoriesRegistry.set(cat.id, cat);
      categoriesRegistry.set(cat.slug, cat);
    }
  }

  isInitialized = true;
}

export async function syncCategoriesFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncing) return;
  isSyncing = true;

  try {
    const colRef = collection(db, "categories");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as Category;
        if (item && item.id && !deletedCategoryIds.has(item.id)) {
          categoriesRegistry.set(item.id, item);
          if (item.slug) categoriesRegistry.set(item.slug, item);
        }
      });
    }
  } catch (err) {
    console.warn("[categoryService] Firestore sync notice:", err);
  } finally {
    isSyncing = false;
  }
}

export function getAllCanonicalCategories(): Category[] {
  initCategoriesRegistry();
  const unique = new Map<string, Category>();
  for (const c of categoriesRegistry.values()) {
    if (!deletedCategoryIds.has(c.id)) {
      unique.set(c.id, c);
    }
  }
  return Array.from(unique.values());
}

export async function fetchCanonicalCategories(): Promise<Category[]> {
  initCategoriesRegistry();
  await syncCategoriesFromFirestore();
  return getAllCanonicalCategories();
}

export function getCanonicalCategoryBySlug(slug: string): Category | undefined {
  initCategoriesRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();
  for (const c of categoriesRegistry.values()) {
    if (c.slug.toLowerCase() === clean && !deletedCategoryIds.has(c.id)) {
      return c;
    }
  }
  return undefined;
}

export async function saveCanonicalCategory(category: Category): Promise<Category> {
  initCategoriesRegistry();

  const toSave: Category = {
    ...category,
    id: category.id || `cat-${Date.now().toString(36)}`,
    slug: category.slug.trim().toLowerCase(),
  };

  deletedCategoryIds.delete(toSave.id);
  categoriesRegistry.set(toSave.id, toSave);
  categoriesRegistry.set(toSave.slug, toSave);
  syncCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      await setDoc(doc(db, "categories", toSave.id), toSave, { merge: true });
    } catch (err) {
      console.warn("[categoryService] Save warning:", err);
    }
  }

  return toSave;
}

export async function deleteCanonicalCategory(id: string, slug?: string): Promise<void> {
  initCategoriesRegistry();

  const existing = categoriesRegistry.get(id);
  deletedCategoryIds.add(id);
  if (existing?.slug) deletedCategoryIds.add(existing.slug);
  if (slug) deletedCategoryIds.add(slug);

  categoriesRegistry.delete(id);
  if (existing?.slug) categoriesRegistry.delete(existing.slug);
  if (slug) categoriesRegistry.delete(slug);
  syncCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      await deleteDoc(doc(db, "categories", id)).catch(() => {});
    } catch (err) {
      console.warn("[categoryService] Delete warning:", err);
    }
  }
}
