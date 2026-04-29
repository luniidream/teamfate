import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * Hash a password with a salt using PBKDF2
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, useSalt, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt: useSalt };
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: newHash } = hashPassword(password, salt);
  return newHash === hash;
}

/**
 * Generate a random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate a random session token
 */
export function generateSessionToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Verify admin password
 */
export function verifyAdminPassword(password: string): boolean {
  return password === ENV.adminPassword;
}

/**
 * Create a JWT token for admin sessions (simple approach)
 */
export function createAdminToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify admin token (in production, use proper JWT)
 */
export function verifyAdminToken(token: string): boolean {
  // This is a placeholder - in production use proper JWT verification
  return token.length > 0;
}
