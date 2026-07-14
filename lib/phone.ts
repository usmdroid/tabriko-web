// Uzbek phone-input helpers.
//
// The market is Uzbekistan, so phone inputs are fixed to the +998 country code
// and the 9-digit national number, grouped as "+998 90 123 45 67" while typing.
// `formatUzPhoneInput` produces the pretty on-screen value; `normalizeUzPhone`
// collapses any formatted/pasted value back to the canonical "+998XXXXXXXXX"
// the API expects.

// Returns the 9 national digits, dropping a leading 998 country code if present.
function uzDigits(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, 9);
}

// Live display mask: "" while empty, then "+998 90 123 45 67" as digits arrive.
export function formatUzPhoneInput(raw: string): string {
  const d = uzDigits(raw);
  if (d.length === 0) return "";
  const parts = ["+998", d.slice(0, 2)];
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(" ");
}

// Canonical value for the API / validation: "+998XXXXXXXXX".
export function normalizeUzPhone(raw: string): string {
  return "+998" + uzDigits(raw);
}
