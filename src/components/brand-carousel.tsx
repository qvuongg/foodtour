import { ArrowUpRight } from "lucide-react";
import {
  TOP_BEVERAGE_BRANDS,
  resolveBrandShopeeLink,
} from "@/lib/brand-catalog";
import { handleShopeeFoodClick } from "@/lib/shopee-deeplink";
import type { Language } from "@/lib/i18n";
import "./brand-carousel.css";

export function BrandCarousel({
  language,
  city,
}: {
  language: Language;
  city?: string;
}) {
  const vi = language === "vi";
  const isMobile =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <section
      className="brand-carousel-section"
      aria-labelledby="brand-carousel-heading"
    >
      <div className="brand-carousel-header">
        <span className="brand-eyebrow">
          {vi ? "THƯƠNG HIỆU NỔI BẬT" : "POPULAR BRANDS"}
        </span>
        <h3 id="brand-carousel-heading" className="brand-heading">
          <span>{vi ? "Quán ngon bạn nên thử" : "Famous brands to try"}</span>
          <span className="brand-heading-badge">
            {TOP_BEVERAGE_BRANDS.length}
          </span>
        </h3>
      </div>

      <div
        className="brand-scroll-track"
        role="region"
        aria-label={
          vi ? "Danh sách thương hiệu đồ uống" : "Beverage brands list"
        }
        tabIndex={0}
      >
        {TOP_BEVERAGE_BRANDS.map((brand) => {
          const link = resolveBrandShopeeLink(brand, city);
          const restaurantUrl =
            (city && brand.cityBranches?.[city]?.originalUrl) ||
            brand.restaurantUrl;
          const displayName = brand.shortName || brand.name;

          return (
            <a
              key={brand.id}
              href={link}
              target={isMobile ? undefined : "_blank"}
              rel="sponsored noopener noreferrer"
              className="brand-card"
              onClick={(e) => handleShopeeFoodClick(link, e, restaurantUrl)}
              title={`${vi ? "Đặt trên ShopeeFood" : "Order on ShopeeFood"}: ${brand.name}`}
            >
              <div className="brand-logo-wrapper">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="brand-logo-img"
                  loading="lazy"
                  width={56}
                  height={56}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(
                      ".brand-avatar-fallback",
                    ) as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  className="brand-avatar-fallback"
                  style={{
                    backgroundColor: brand.themeColor,
                    color: brand.textColor,
                    display: "none",
                  }}
                  aria-hidden="true"
                >
                  {brand.initials}
                </div>
              </div>

              <span className="brand-card-name" title={brand.name}>
                {displayName}
              </span>

              <span className="brand-card-cta">
                <span>{vi ? "Đặt" : "Order"}</span>
                <ArrowUpRight size={11} strokeWidth={2.5} />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
