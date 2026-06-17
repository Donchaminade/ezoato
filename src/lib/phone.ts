/** Normalise un numéro togolais en 8 chiffres locaux (ex. 90123456). */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00228") && digits.length >= 13) {
    digits = digits.slice(5);
  } else if (digits.startsWith("228") && digits.length >= 11) {
    digits = digits.slice(3);
  }
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  return n.length >= 8 && n.length <= 12;
}

/** Affichage lisible : 90 12 34 56 */
export function formatPhoneDisplay(raw: string): string {
  const n = normalizePhone(raw);
  if (n.length === 8) {
    return `${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)}`;
  }
  return raw.trim();
}
