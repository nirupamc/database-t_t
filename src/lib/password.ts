import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(value: string) {
  return bcrypt.hash(value, SALT_ROUNDS);
}

export async function verifyPassword(rawValue: string, hashedValue: string) {
  return bcrypt.compare(rawValue, hashedValue);
}
