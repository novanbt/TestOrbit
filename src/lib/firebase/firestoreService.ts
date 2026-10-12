import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./client";
import { MockTest, TestAttemptScorecard } from "@/types";

export interface StoredAttempt {
  id: string;
  testId: string;
  testSlug: string;
  testTitle: string;
  categoryName: string;
  difficulty: string;
  maxMarks: number;
  marksScored: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  completedAt: string;
  scorecard: TestAttemptScorecard;
}

export interface UserDashboardData {
  targetExam: string;
  totalAttempts: number;
  avgAccuracy: number;
  totalPracticeTimeSeconds: number;
  recentAttempts: StoredAttempt[];
}

const LOCAL_STORAGE_PREFIX = "testorbit_attempts_";
const LOCAL_PROFILE_PREFIX = "testorbit_profile_";

/**
 * Save a test attempt to Firestore under /users/{userId}/attempts/{attemptId}
 * and update the user's aggregate stats in /users/{userId}.
 * Also caches to localStorage for instant offline access.
 */
export async function saveUserAttempt(
  userId: string,
  test: MockTest,
  scorecard: TestAttemptScorecard
): Promise<StoredAttempt> {
  const attemptId = "att_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const attemptData: StoredAttempt = {
    id: attemptId,
    testId: test.id,
    testSlug: test.slug,
    testTitle: test.title,
    categoryName: test.categoryName,
    difficulty: test.difficulty,
    maxMarks: test.maxMarks,
    marksScored: scorecard.totalMarksScored,
    accuracyPercentage: scorecard.accuracyPercentage,
    timeTakenSeconds: scorecard.timeTakenSeconds,
    completedAt: now,
    scorecard,
  };

  // 1. Cache to local storage immediately
  try {
    const localKey = LOCAL_STORAGE_PREFIX + userId;
    const existingStr = localStorage.getItem(localKey);
    const existing: StoredAttempt[] = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(attemptData);
    localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.warn("Failed to cache attempt to localStorage:", err);
  }

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const attemptDocRef = doc(db, "users", userId, "attempts", attemptId);
      await setDoc(attemptDocRef, {
        ...attemptData,
        createdAt: now,
      });

      // Update aggregate profile
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      const prevData = userDocSnap.exists() ? userDocSnap.data() : {};

      const prevTotal = (prevData.totalAttempts as number) || 0;
      const prevAccuracy = (prevData.avgAccuracy as number) || 0;
      const prevTime = (prevData.totalPracticeTimeSeconds as number) || 0;

      const newTotal = prevTotal + 1;
      const newAvgAccuracy = Math.round((prevAccuracy * prevTotal + scorecard.accuracyPercentage) / newTotal);
      const newTotalTime = prevTime + scorecard.timeTakenSeconds;

      await setDoc(
        userDocRef,
        {
          totalAttempts: newTotal,
          avgAccuracy: newAvgAccuracy,
          totalPracticeTimeSeconds: newTotalTime,
          lastActiveAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore saveUserAttempt warning (offline or permissions pending):", err);
    }
  }

  return attemptData;
}

/**
 * Fetch dashboard data: recent test attempts, aggregate performance, and user exam target.
 */
export async function getUserDashboardData(userId: string): Promise<UserDashboardData> {
  let targetExam = "JEE Main & Board Exams";
  let recentAttempts: StoredAttempt[] = [];
  let totalAttempts = 0;
  let avgAccuracy = 0;
  let totalPracticeTimeSeconds = 0;

  // 1. Read local storage cache first
  try {
    const localKey = LOCAL_STORAGE_PREFIX + userId;
    const cachedAttemptsStr = localStorage.getItem(localKey);
    if (cachedAttemptsStr) {
      recentAttempts = JSON.parse(cachedAttemptsStr);
    }

    const localProfileKey = LOCAL_PROFILE_PREFIX + userId;
    const cachedProfileStr = localStorage.getItem(localProfileKey);
    if (cachedProfileStr) {
      const p = JSON.parse(cachedProfileStr);
      if (p.targetExam) targetExam = p.targetExam;
    }
  } catch {}

  // 2. Fetch from Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      // Fetch user profile document
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const udata = userDocSnap.data();
        if (udata.targetExam) targetExam = udata.targetExam;
        if (typeof udata.totalAttempts === "number") totalAttempts = udata.totalAttempts;
        if (typeof udata.avgAccuracy === "number") avgAccuracy = udata.avgAccuracy;
        if (typeof udata.totalPracticeTimeSeconds === "number") totalPracticeTimeSeconds = udata.totalPracticeTimeSeconds;
      }

      // Fetch attempts subcollection
      const attemptsColRef = collection(db, "users", userId, "attempts");
      const q = query(attemptsColRef, orderBy("completedAt", "desc"), limit(20));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const firestoreAttempts: StoredAttempt[] = [];
        querySnap.forEach((docSnap) => {
          firestoreAttempts.push(docSnap.data() as StoredAttempt);
        });
        recentAttempts = firestoreAttempts;

        // Keep local cache fresh
        try {
          localStorage.setItem(LOCAL_STORAGE_PREFIX + userId, JSON.stringify(recentAttempts));
        } catch {}
      }
    } catch (err) {
      console.warn("Firestore getUserDashboardData fallback to local cache:", err);
    }
  }

  // 3. Fallback calculate aggregates if not set in user profile
  if (totalAttempts === 0 && recentAttempts.length > 0) {
    totalAttempts = recentAttempts.length;
    const sumAccuracy = recentAttempts.reduce((acc, cur) => acc + (cur.accuracyPercentage || 0), 0);
    avgAccuracy = Math.round(sumAccuracy / totalAttempts);
    totalPracticeTimeSeconds = recentAttempts.reduce((acc, cur) => acc + (cur.timeTakenSeconds || 0), 0);
  }

  return {
    targetExam,
    totalAttempts,
    avgAccuracy,
    totalPracticeTimeSeconds,
    recentAttempts,
  };
}

/**
 * Update the student's target exam goal in Firestore and local storage.
 */
export async function updateStudentTargetExam(userId: string, targetExam: string): Promise<boolean> {
  try {
    const localProfileKey = LOCAL_PROFILE_PREFIX + userId;
    localStorage.setItem(localProfileKey, JSON.stringify({ targetExam }));
  } catch {}

  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, { targetExam }, { merge: true });
      return true;
    } catch (err) {
      console.warn("Firestore updateStudentTargetExam error:", err);
      return false;
    }
  }
  return true;
}
