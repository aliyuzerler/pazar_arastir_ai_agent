/**
 * Parola saklama ve politika (TEST_10). bcryptjs tamamen JS — Vercel
 * serverless'ta yerel bağımlılık gerektirmez.
 */
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordPolicyError";
  }
}

/** Politika: en az 10 karakter, büyük harf, küçük harf ve rakam. */
export function validatePasswordPolicy(password: string): void {
  if (password.length < 10) {
    throw new PasswordPolicyError("Parola en az 10 karakter olmalıdır.");
  }
  if (!/[A-ZĞÜŞİÖÇ]/.test(password)) {
    throw new PasswordPolicyError("Parola en az bir büyük harf içermelidir.");
  }
  if (!/[a-zğüşıöç]/.test(password)) {
    throw new PasswordPolicyError("Parola en az bir küçük harf içermelidir.");
  }
  if (!/[0-9]/.test(password)) {
    throw new PasswordPolicyError("Parola en az bir rakam içermelidir.");
  }
}

export function hashPassword(password: string): string {
  validatePasswordPolicy(password);
  return bcrypt.hashSync(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
