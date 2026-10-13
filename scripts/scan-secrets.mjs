#!/usr/bin/env node

/**
 * TestOrbit Secret Scanning & Security Verification Script
 * Validates that no private keys, passwords, or active secrets are staged or committed.
 * NEVER prints secret values.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();

console.log("\n🛡️  Running TestOrbit Secret-Leak Prevention Audit...\n");

let violations = 0;

function reportViolation(file, description) {
  console.error(`❌ [SECURITY VIOLATION] ${file}: ${description}`);
  violations++;
}

// 1. Verify Git-tracked files
try {
  const trackedFilesOutput = execSync("git ls-files", { encoding: "utf8" });
  const trackedFiles = trackedFilesOutput.split("\n").map(f => f.trim()).filter(Boolean);

  for (const file of trackedFiles) {
    // Check for tracked .env files (only .env.example allowed)
    if (file.startsWith(".env") && file !== ".env.example") {
      reportViolation(file, "Environment file is tracked by Git. Only .env.example should be tracked.");
    }

    // Check for private keys or certificates
    if (/\.(pem|key|crt|p12|pfx)$/i.test(file)) {
      reportViolation(file, "Cryptographic key or certificate is tracked by Git.");
    }

    // Check for service accounts
    if (/serviceAccount|firebase-adminsdk/i.test(file)) {
      reportViolation(file, "Service account JSON credential is tracked by Git.");
    }
  }
} catch (err) {
  console.warn("⚠️  Could not run git ls-files:", err.message);
}

// 2. Scan file contents for dangerous patterns
const DANGEROUS_PATTERNS = [
  {
    name: "Private Key Header",
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    files: ["**/*"],
  },
  {
    name: "Google Service Account Type",
    regex: /"type":\s*"service_account"/,
    files: ["**/*.json"],
  },
];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Don't scan binary files
      if (/\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot)$/i.test(entry.name)) {
        continue;
      }

      // Don't scan local development .env.local
      if (entry.name === ".env.local") {
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf8");

      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.regex.test(content)) {
          reportViolation(relPath, `Contains sensitive pattern matching: ${pattern.name}`);
        }
      }

      // Check .env.example specifically for real credentials
      if (entry.name === ".env.example") {
        if (/AIzaSy[A-Za-z0-9_-]{33}/.test(content)) {
          reportViolation(relPath, "Contains real Google/Firebase API key instead of safe placeholder.");
        }
      }

      // Check adminCredentials.ts specifically for hardcoded password fallback
      if (relPath.includes("adminCredentials.ts")) {
        if (/password:\s*["'][a-zA-Z0-9_-]{8,}["']/.test(content)) {
          reportViolation(relPath, "Contains hardcoded administrator password string.");
        }
      }
    }
  }
}

scanDirectory(ROOT_DIR);

if (violations === 0) {
  console.log("✅ Secret scan passed! No committed secrets, private keys, or tracked environment files detected.\n");
  process.exit(0);
} else {
  console.error(`\n🚨 Secret scan failed with ${violations} security violation(s).\n`);
  process.exit(1);
}
