/**
 * Environment Variables Validator for TestOrbit
 * Validates presence and format of required variables without ever logging secret values.
 */

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_PUBLIC_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const REQUIRED_SERVER_VARS: string[] = [];

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 1. Client / Public variables
  for (const varName of REQUIRED_PUBLIC_VARS) {
    const val = process.env[varName];
    if (!val) {
      missing.push(varName);
    } else if (val.includes("your_") || val.includes("example")) {
      warnings.push(`${varName} still contains a placeholder value.`);
    }
  }

  // 2. Server-only variables (only checked on server)
  if (typeof window === "undefined") {
    for (const varName of REQUIRED_SERVER_VARS) {
      const val = process.env[varName];
      if (!val) {
        missing.push(varName);
      } else if (val.includes("your_") || val.includes("example")) {
        warnings.push(`${varName} still contains a placeholder value.`);
      }
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}
