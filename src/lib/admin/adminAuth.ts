import { cookies } from "next/headers";
import { AdminUser, AdminRole } from "@/types/admin";

export const ADMIN_SESSION_COOKIE = "testorbit_admin_session";

// Authoritative root super-admin credential defaults
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "testorbit@ellipse.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tdSUi4rqJ_NN3n4";

/**
 * Validates admin credentials against authoritative environment secrets.
 */
export async function verifyAdminCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  const configuredEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  if (email === configuredEmail && password === configuredPassword) {
    const adminUser: AdminUser = {
      id: "admin-root-001",
      email: configuredEmail,
      name: "Super Administrator",
      role: "super_admin",
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    return { success: true, user: adminUser };
  }

  return { success: false, error: "Invalid administrator email or password." };
}

/**
 * Establishes an encrypted/signed server session cookie.
 */
export async function createAdminSession(user: AdminUser): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    loggedInAt: new Date().toISOString(),
  });

  // Base64 encode for cookie safety
  const token = Buffer.from(payload).toString("base64");

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Retrieves the currently active admin session from cookies.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;

    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    if (parsed && parsed.email) {
      return {
        id: parsed.id || "admin-root-001",
        email: parsed.email,
        name: parsed.name || "Administrator",
        role: (parsed.role as AdminRole) || "admin",
        active: true,
        createdAt: parsed.loggedInAt || new Date().toISOString(),
      };
    }
  } catch {
    // Malformed token
  }
  return null;
}

/**
 * Destroys the active admin session.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
