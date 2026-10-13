/**
 * Canonical administrator environment credentials reader.
 * SERVER-ONLY: Sensitive values are read strictly from environment variables.
 * Never hardcode secrets in source files.
 */
export const ADMIN_CREDENTIALS = {
  get email(): string {
    return (process.env.ADMIN_EMAIL || "").trim();
  },
  get password(): string {
    return (process.env.ADMIN_PASSWORD || "").trim();
  },
};
