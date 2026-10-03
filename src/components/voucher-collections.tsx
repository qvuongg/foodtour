import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Coffee,
  Compass,
  ExternalLink,
  Globe2,
  Heart,
  MapPin,
  PartyPopper,
  ShoppingBasket,
  Sparkles,
  Ticket,
  Truck,
  UsersRound,
  Utensils,
} from "lucide-react";
import {
  getCityShopeeHubUrl,
  getVouchersForCity,
  resolveVoucherAffiliateLink,
  type CityVoucher,
  type CityVoucherCategory,
} from "@/lib/city-vouchers";
import { useUserLocation, type CitySlug } from "@/hooks/use-user-location";
import { handleShopeeFoodClick } from "@/lib/shopee-deeplink";
import type { Language } from "@/lib/i18n";
import "./voucher-collections.css";

const icons = {
  delivery: Truck,
  food: Utensils,
  favorite: Heart,
  nearby: MapPin,
  explore: Compass,
  city: Building2,
  groceries: ShoppingBasket,
  drink: Coffee,
  world: Globe2,
  party: PartyPopper,
  new: Sparkles,
  group: UsersRound,
};

const CITY_OPTIONS: { id: CitySlug; labelVi: string; labelEn: string; shortVi: string }[] = [
  { id: "ha-noi", labelVi: "Hà Nội", labelEn: "Hanoi", shortVi: "Hà Nội" },
  { id: "da-nang", labelVi: "Đà Nẵng", labelEn: "Da Nang", shortVi: "Đà Nẵng" },
  { id: "ho-chi-minh", labelVi: "TP. Hồ Chí Minh", labelEn: "TP. HCM", shortVi: "TP. HCM" },
];

const CATEGORIES: { id: CityVoucherCategory; labelVi: string; labelEn: string }[] = [
  { id: "all", labelVi: "Tất cả", labelEn: "All" },
  { id: "freeship", labelVi: "Freeship", labelEn: "Freeship" },
  { id: "megadeal", labelVi: "Giảm sâu", labelEn: "Mega deals" },
  { id: "lunch", labelVi: "Cơm trưa", labelEn: "Lunch" },
  { id: "drinks", labelVi: "Trà sữa", labelEn: "Drinks" },
  { id: "party", labelVi: "Tiệc nhóm", labelEn: "Party" },
];

export function VoucherCollections({ language }: { language: Language }) {
  const vi = language === "vi";
  const { city, requestLocation } = useUserLocation();
  const [selectedCategory, setSelectedCategory] = useState<CityVoucherCategory>("all");

  // Tự động xin quyền vị trí ngay khi người dùng mở mục Voucher
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const vouchers = getVouchersForCity(city, selectedCategory);
  const allCityVouchers = getVouchersForCity(city, "all");
  const hubUrl = getCityShopeeHubUrl(city);

  const activeCityMeta = CITY_OPTIONS.find((c) => c.id === city) || CITY_OPTIONS[0];

  return (
    <section
      className="voucher-hub"
      aria-label={vi ? "Kho voucher ShopeeFood theo thành phố" : "City ShopeeFood vouchers"}
    >
      {/* Tiêu đề thành phố tương ứng với vị trí người dùng */}
      <div className="voucher-city-headline">
        <MapPin size={13} className="location-pin-icon" aria-hidden="true" />
        <span>
          {vi ? "Ưu đãi ShopeeFood tại:" : "ShopeeFood offers in:"}{" "}
          <strong>{vi ? activeCityMeta.labelVi : activeCityMeta.labelEn}</strong>
        </span>
      </div>

      {/* Bộ lọc danh mục voucher */}
      <div className="voucher-category-scroll" role="tablist" aria-label={vi ? "Lọc ưu đãi" : "Filter offers"}>
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === selectedCategory;
          const count =
            cat.id === "all"
              ? allCityVouchers.length
              : allCityVouchers.filter((v) => v.category === cat.id).length;

          if (cat.id !== "all" && count === 0) return null;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`voucher-category-pill ${isActive ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{vi ? cat.labelVi : cat.labelEn}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Danh sách thẻ Voucher chuẩn Affiliate */}
      <div className="voucher-cards-list">
        {vouchers.map((voucher) => {
          const Icon = icons[voucher.icon] || Ticket;
          const affUrl = resolveVoucherAffiliateLink(voucher);

          return (
            <article key={voucher.id} className="voucher-card">
              <div className="voucher-card-left">
                <span className="voucher-badge">{voucher.badge}</span>
                <span className="voucher-min-order">
                  {vi ? voucher.minOrderVi : voucher.minOrderEn}
                </span>
              </div>

              <div className="voucher-card-center">
                <div className="voucher-card-title-row">
                  <span className="voucher-icon-wrapper">
                    <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <h3 className="voucher-title">
                    {vi ? voucher.titleVi : voucher.titleEn}
                  </h3>
                </div>
                <p className="voucher-discount">
                  {vi ? voucher.discountVi : voucher.discountEn}
                </p>
                <div className="voucher-tags-row">
                  <span className="voucher-tag">{vi ? voucher.tagVi : voucher.tagEn}</span>
                </div>
              </div>

              <div className="voucher-card-right">
                <a
                  href={affUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="voucher-cta-btn"
                  onClick={(e) => handleShopeeFoodClick(affUrl, e)}
                  aria-label={
                    vi
                      ? `Lấy mã ${voucher.badge} — ${voucher.titleVi}`
                      : `Get voucher ${voucher.badge} — ${voucher.titleEn}`
                  }
                >
                  <span>{vi ? "Lấy mã" : "Get deal"}</span>
                  <ExternalLink size={12} strokeWidth={2.4} aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* Link tổng hợp sàn ShopeeFood cho thành phố */}
      <footer className="voucher-hub-footer">
        <a
          href={hubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="voucher-full-hub-link"
          onClick={(e) => handleShopeeFoodClick(hubUrl, e)}
        >
          <span>
            {vi
              ? `Xem toàn bộ ưu đãi ShopeeFood tại ${activeCityMeta.labelVi}`
              : `View all ShopeeFood offers in ${activeCityMeta.labelEn}`}
          </span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <p className="voucher-disclaimer">
          {vi
            ? "Mã ưu đãi áp dụng trên ứng dụng ShopeeFood. Số lượng mã có hạn và thay đổi theo khung giờ."
            : "Vouchers apply on the ShopeeFood app. Quantities are limited and subject to terms."}
        </p>
      </footer>
    </section>
  );
}
