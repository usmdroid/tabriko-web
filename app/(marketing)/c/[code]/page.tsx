import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import { getCreatorByCode, type PublicCreator } from "@/lib/public-api";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const creator = await getCreatorByCode(code);
  if (!creator) return { title: "Creator not found" };
  return {
    title: creator.name,
    description: creator.bio,
  };
}

const TIER_STYLES: Record<NonNullable<PublicCreator["tier"]>, string> = {
  STANDARD: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  RISING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  TOP: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  CELEBRITY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-600",
};

export default async function CreatorPublicPage({ params }: Props) {
  const { code } = await params;
  const creator = await getCreatorByCode(code);
  if (!creator) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Banner */}
      {creator.bannerUrl ? (
        <img
          src={creator.bannerUrl}
          alt=""
          className="w-full h-40 object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-accent/30 to-accent2/20" />
      )}

      {/* Avatar */}
      <div className="-mt-10 ml-6 mb-4">
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="h-20 w-20 rounded-full border-4 border-surface object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full border-4 border-surface bg-card flex items-center justify-center text-2xl font-bold text-accent">
            {creator.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-2xl text-primary">{creator.name}</h1>
        {creator.verified && (
          <BadgeCheck className="h-5 w-5 text-accent" aria-label="Verified" />
        )}
        {creator.tier && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_STYLES[creator.tier]}`}>
            {creator.tier}
          </span>
        )}
      </div>

      {/* Category */}
      {creator.category && (
        <p className="text-muted text-sm mt-1">{creator.category}</p>
      )}

      {/* Bio */}
      {creator.bio && (
        <p className="text-sm leading-relaxed mt-2 text-primary">{creator.bio}</p>
      )}

      {/* Pricing */}
      {creator.priceFrom != null && (
        <p className="mt-3 text-sm text-muted">
          From{" "}
          <span className="text-primary font-medium">
            {creator.priceFrom.toLocaleString()} UZS
          </span>
          {creator.deliveryDays != null && ` · ${creator.deliveryDays} days`}
        </p>
      )}

      {/* Portfolio */}
      {creator.portfolio && creator.portfolio.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Portfolio
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {creator.portfolio.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
