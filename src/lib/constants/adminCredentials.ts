/**
 * Canonical administrator credentials for TestOrbit admin panel & database operations.
 * Free of "use client" so it is universally accessible on both Server Actions and Client Components.
 */
export const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "testorbit@ellipse.com",
  password: process.env.ADMIN_PASSWORD || "tdSUi4rqJ_NN3n4",
};
