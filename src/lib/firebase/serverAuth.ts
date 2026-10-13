import { auth, isFirebaseConfigured } from "./client";
import { signInWithEmailAndPassword } from "firebase/auth";

let isSigningIn = false;

/**
 * Ensures the server process has an active Firebase Auth administrator session
 * to satisfy Firestore security rules (allow write: if isAuthenticated()).
 */
export async function ensureAdminAuthenticated(): Promise<boolean> {
  if (!isFirebaseConfigured || !auth) return false;
  if (auth.currentUser) return true;
  if (isSigningIn) return false;

  isSigningIn = true;
  const email = (process.env.ADMIN_EMAIL || "testorbit@ellipse.com").trim();
  const password = (process.env.ADMIN_PASSWORD || "tdSUi4rqJ_NN3n4").trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (err) {
    console.warn("[Firebase] Server admin authentication notice:", err);
    return false;
  } finally {
    isSigningIn = false;
  }
}
