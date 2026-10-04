import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import {
  TOP_BEVERAGE_BRANDS,
  resolveBrandShopeeLink,
} from "@/lib/brand-catalog";
import {
  requestUserCoordinates,
  findNearestBrandBranch,
  openShopeeFoodDirect,
  getCachedUserCoordinates,
} from "@/lib/brand-locator";
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
  const [loadingBrandId, setLoadingBrandId] = useState<string | null>(null);

  const handleBrandOrder = async (
    e: React.MouseEvent,
    brandId: string,
    fallbackUrl?: string,
  ) => {
    e.preventDefault();
    if (loadingBrandId) return;

    // 1. Nếu toạ độ GPS đã có sẵn trong Session Cache: Mở app ngay lập tức (<10ms)
    const cachedCoords = getCachedUserCoordinates();
    if (cachedCoords) {
      const match = findNearestBrandBranch(
        brandId,
        cachedCoords,
        city || "ho-chi-minh",
      );
      const targetUrl =
        match?.branch.shopeefood_url || fallbackUrl || "https://shopeefood.vn";
      openShopeeFoodDirect(targetUrl);
      return;
    }

    // 2. Nếu chưa có toạ độ: hiển thị trạng thái đang định vị và xin quyền GPS
    setLoadingBrandId(brandId);
    try {
      const coords = await requestUserCoordinates(2500);
      const match = findNearestBrandBranch(
        brandId,
        coords,
        city || "ho-chi-minh",
      );
      const targetUrl =
        match?.branch.shopeefood_url || fallbackUrl || "https://shopeefood.vn";
      openShopeeFoodDirect(targetUrl);
    } finally {
      setLoadingBrandId(null);
    }
  };

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
          const directRestaurantUrl =
            (city && brand.cityBranches?.[city]?.originalUrl) ||
            brand.restaurantUrl;
          const fallbackLink =
            directRestaurantUrl || resolveBrandShopeeLink(brand, city);
          const displayName = brand.shortName || brand.name;
          const isLoading = loadingBrandId === brand.id;

          return (
            <button
              type="button"
              key={brand.id}
              className="brand-card"
              onClick={(e) => handleBrandOrder(e, brand.id, fallbackLink)}
              disabled={loadingBrandId !== null && !isLoading}
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
                {isLoading ? (
                  <>
                    <span>{vi ? "Tìm..." : "Finding..."}</span>
                    <Loader2 size={11} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <span>{vi ? "Đặt" : "Order"}</span>
                    <ArrowUpRight size={11} strokeWidth={2.5} />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
