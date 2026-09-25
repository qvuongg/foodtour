import { ArrowUpRight, ShoppingBag } from "lucide-react";
import {
  DEFAULT_ORDERING_CITY,
  resolveSmartHubAffiliate,
} from "@/lib/food-ordering";
import type { Language } from "@/lib/i18n";

export function FoodOrdering({
  dish,
  language,
}: {
  dish: string;
  language: Language;
}) {
  const destination = resolveSmartHubAffiliate(dish, DEFAULT_ORDERING_CITY, language);
  if (!destination) return null;

  const isSpecific = destination.appDestinationType === "restaurant";
  const vi = language === "vi";

  return (
    <div className="food-ordering-action">
      <a
        className="shopeefood-button"
        href={destination.appHref}
        target="_blank"
        rel="sponsored noopener"
      >
        <ShoppingBag size={18} aria-hidden="true" />
        <span>
          {isSpecific
            ? vi
              ? `Xem quán trên ShopeeFood`
              : "View on ShopeeFood"
            : vi
              ? "Đặt món trên ShopeeFood"
              : "Order on ShopeeFood"}
        </span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
      {isSpecific && (
        <p className="ordering-specific-restaurant">
          {destination.title}
        </p>
      )}
    </div>
  );
}
