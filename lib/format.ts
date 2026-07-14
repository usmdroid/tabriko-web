export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-().]/g, "");
  const match = cleaned.match(/^(\+\d{1,3})(\d{2})\d*(\d{2})$/);
  if (!match) return phone;
  return `${match[1]} ${match[2]} *** ** ${match[3]}`;
}
