import { randomInt } from "node:crypto";

// No 0/O, 1/I/L: codes get read aloud and typed on phones.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Returns a code like "K7QM-4XRT-9PWD" (about 60 bits of randomness).
export function generateInviteCode() {
  const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map((g) => g.join("")).join("-");
}

export function normalizeInviteCode(input: string) {
  return input.trim().toUpperCase();
}
