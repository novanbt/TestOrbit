import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { ensureAdminAuthenticated } from "@/lib/firebase/serverAuth";
import { SubjectTaxonomy } from "@/types/admin";
export type { SubjectTaxonomy };

export const BASE_SUBJECTS: SubjectTaxonomy[] = [
  {
    id: "sub-1",
    name: "Mathematics",
    slug: "mathematics",
    categoryId: "cat-school",
    topics: ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Statistics"],
  },
  {
    id: "sub-2",
    name: "Physics",
    slug: "physics",
    categoryId: "cat-competitive",
    topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"],
  },
  {
    id: "sub-3",
    name: "Chemistry",
    slug: "chemistry",
    categoryId: "cat-competitive",
    topics: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Equilibrium"],
  },
  {
    id: "sub-4",
    name: "Computer Science",
    slug: "computer-science",
    categoryId: "cat-programming",
    topics: ["Data Structures", "Algorithms", "Object-Oriented Programming", "Databases", "Web Architecture"],
  },
];

const taxonomyRegistry = new Map<string, SubjectTaxonomy>();
let isInitialized = false;
let isSyncing = false;

export function initTaxonomyRegistry() {
  if (isInitialized) return;
  for (const s of BASE_SUBJECTS) {
    taxonomyRegistry.set(s.id, s);
    taxonomyRegistry.set(s.slug, s);
  }
  isInitialized = true;
}

export async function syncTaxonomyFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncing) return;
  isSyncing = true;
  try {
    const snap = await getDocs(collection(db, "taxonomy"));
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as SubjectTaxonomy;
        if (item && item.id) {
          taxonomyRegistry.set(item.id, item);
          if (item.slug) taxonomyRegistry.set(item.slug, item);
        }
      });
    }
  } catch (err) {
    console.warn("[taxonomyService] Sync warning:", err);
  } finally {
    isSyncing = false;
  }
}

export function getAllCanonicalTaxonomy(): SubjectTaxonomy[] {
  initTaxonomyRegistry();
  const unique = new Map<string, SubjectTaxonomy>();
  for (const s of taxonomyRegistry.values()) {
    unique.set(s.id, s);
  }
  return Array.from(unique.values());
}

export async function fetchCanonicalTaxonomy(): Promise<SubjectTaxonomy[]> {
  initTaxonomyRegistry();
  await syncTaxonomyFromFirestore();
  return getAllCanonicalTaxonomy();
}

export async function saveCanonicalSubject(subject: SubjectTaxonomy): Promise<SubjectTaxonomy> {
  initTaxonomyRegistry();

  const toSave: SubjectTaxonomy = {
    ...subject,
    id: subject.id || `sub-${Date.now().toString(36)}`,
    slug: subject.slug || subject.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  };

  taxonomyRegistry.set(toSave.id, toSave);
  taxonomyRegistry.set(toSave.slug, toSave);

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      await setDoc(doc(db, "taxonomy", toSave.id), toSave, { merge: true });
    } catch (err) {
      console.warn("[taxonomyService] Save warning:", err);
    }
  }

  return toSave;
}

export async function deleteCanonicalSubject(id: string): Promise<void> {
  initTaxonomyRegistry();
  const existing = taxonomyRegistry.get(id);
  taxonomyRegistry.delete(id);
  if (existing?.slug) taxonomyRegistry.delete(existing.slug);

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      await deleteDoc(doc(db, "taxonomy", id)).catch(() => {});
    } catch (err) {
      console.warn("[taxonomyService] Delete warning:", err);
    }
  }
}
