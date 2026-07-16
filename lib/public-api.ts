const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.tabriko.uz/api/v1";

export interface PublicCreator {
  id: string;
  publicCode: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  category?: string;
  tier?: "STANDARD" | "RISING" | "TOP" | "CELEBRITY";
  verified: boolean;
  priceFrom?: number;
  deliveryDays?: number;
  portfolio?: Array<{ id: string; url: string; caption?: string }>;
}

/** Returns null on 404, throws on other errors. */
export async function getCreatorByCode(code: string): Promise<PublicCreator | null> {
  const res = await fetch(`${API_BASE}/creators/by-code/${encodeURIComponent(code)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch creator: ${res.status}`);
  return res.json() as Promise<PublicCreator>;
}
