"use server";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

export interface AdminLoginResult {
  success: boolean;
  error?: string;
  adminEmail?: string;
}

/**
 * Server action to verify administrator credentials strictly on the server.
 * The administrator password is NEVER sent to the client bundle.
 */
export async function verifyAdminCredentialsAction(
  email: string,
  pass: string
): Promise<AdminLoginResult> {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPass = (process.env.ADMIN_PASSWORD || "").trim();

  const inputEmail = (email || "").trim().toLowerCase();
  const inputPass = (pass || "").trim();

  if (!inputEmail || !inputPass) {
    return {
      success: false,
      error: "Please enter both administrator email and password.",
    };
  }

  // 1. Verify against server environment variables
  if (adminEmail && adminPass) {
    if (inputEmail === adminEmail && inputPass === adminPass) {
      return { success: true, adminEmail: inputEmail };
    }
  }

  // 2. Alternatively, verify directly against Firebase Authentication
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, inputEmail, inputPass);
      if (adminEmail && cred.user.email?.toLowerCase() !== adminEmail) {
        return {
          success: false,
          error: "Unauthorized account. Administrator access required.",
        };
      }
      return { success: true, adminEmail: cred.user.email || inputEmail };
    } catch {
      // Firebase auth failed
    }
  }

  return {
    success: false,
    error: "Invalid administrator credentials. Access denied.",
  };
}
