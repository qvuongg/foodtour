import { useId, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  MapPin,
  QrCode,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  ORDERING_CITIES,
  DEFAULT_ORDERING_CITY,
  resolveSmartHubAffiliate,
} from "@/lib/food-ordering";
import { readCookie, writeCookie } from "@/lib/cookies";
import { QRCodeSVG } from "@/components/qr-code";
import type { Language } from "@/lib/i18n";

const messages = {
  vi: {
    title: "Chốt món. Tìm quán thôi.",
    restaurantMobileSpecific: "Xem quán trên ShopeeFood",
    restaurantMobileHub: (dish: string) => `Tìm quán ${dish} trên ShopeeFood`,
    restaurantDesktop: "Xem quán trên ShopeeFood",
    restaurantLabel: "Quán có món này",
    restaurantQrLabel: "Gợi ý thông minh · Bán kính 3km",
    qrInstructionsSpecific:
      "Dùng Camera điện thoại hoặc App Shopee quét mã QR để mở quán và nhận ưu đãi.",
    qrInstructionsHub: (dish: string) =>
      `Dùng Camera điện thoại quét mã QR để mở App Shopee và tìm quán ${dish} gần bạn.`,
    qrFallbackLink: "Mở danh sách quán trên web",
    affiliateHintMobileSpecific:
      "ShopeeFood sẽ mở để bạn kiểm tra địa chỉ giao hàng và áp mã khuyến mãi.",
    affiliateHintMobileHub:
      "Chạm nút để tự động sao chép tên món, khi Shopee mở chỉ cần Dán (Paste) vào ô tìm kiếm!",
    copiedHint: (dish: string) =>
      `✓ Đã chép "${dish}"! Dán vào ô tìm kiếm trên ShopeeFood nhé.`,
    copyButton: "Chép tên món",
    copiedButton: "Đã chép",
    cityLabel: "Khu vực:",
    disclosure:
      "Liên kết tiếp thị · Website có thể nhận hoa hồng từ đơn hợp lệ.",
  },
  en: {
    title: "Lunch picked. Find your place.",
    restaurantMobileSpecific: "View restaurant on ShopeeFood",
    restaurantMobileHub: (dish: string) => `Find ${dish} spots on ShopeeFood`,
    restaurantDesktop: "View on ShopeeFood",
    restaurantLabel: "A restaurant serving this dish",
    restaurantQrLabel: "Smart Search · 3km Delivery",
    qrInstructionsSpecific:
      "Scan QR code with your phone camera or Shopee App to open this restaurant on mobile.",
    qrInstructionsHub: (dish: string) =>
      `Scan QR code with phone camera to open Shopee and find ${dish} spots near you.`,
    qrFallbackLink: "Open restaurant listing on web",
    affiliateHintMobileSpecific:
      "ShopeeFood will open to check your delivery address and apply discounts.",
    affiliateHintMobileHub:
      "Tap to auto-copy dish name, then Paste into the search box once Shopee opens!",
    copiedHint: (dish: string) =>
      `✓ Copied "${dish}"! Paste into ShopeeFood search box.`,
    copyButton: "Copy dish",
    copiedButton: "Copied",
    cityLabel: "City:",
    disclosure: "Affiliate link · We may earn a commission on eligible orders.",
  },
} as const;

export function FoodOrdering({
  dish,
  language,
}: {
  dish: string;
  language: Language;
}) {
  const t = messages[language];
  const id = useId();

  const [city, setCity] = useState<string>(() => {
    try {
      const saved = readCookie<string>("ordering-city");
      if (saved && ORDERING_CITIES.some((c) => c.value === saved)) return saved;
    } catch {}
    return DEFAULT_ORDERING_CITY;
  });

  const [copied, setCopied] = useState(false);

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    try {
      writeCookie("ordering-city", newCity);
    } catch {}
  };

  const handleCopyOnly = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(dish.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  };

  const handleMobileCtaClick = () => {
    // Auto-copy dish name to clipboard so user can instantly paste into Shopee search
    try {
      if (navigator?.clipboard?.writeText) {
        void navigator.clipboard.writeText(dish.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  };

  // Smart Search & Hub: resolves both mobile app shortlink and city web search URL
  const hubResult = resolveSmartHubAffiliate(dish, city, language);
  const showAffiliate = !!hubResult?.affiliate;
  const title = hubResult?.title ?? "";
  const badge = hubResult?.badge ?? "";
  const appHref = hubResult?.appHref ?? hubResult?.href ?? "";
  const webHref = hubResult?.webHref ?? hubResult?.href ?? "";
  const isSpecific = hubResult?.isSpecificRestaurant ?? false;

  return (
    <section className="food-ordering" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>
        <ShoppingBag size={17} aria-hidden="true" />
        {t.title}
      </h3>
      {showAffiliate && (
        <div className="ordering-restaurant">
          {/* Desktop view: QR code card for phone scanning */}
          <div className="ordering-desktop-view">
            <div className="ordering-qr-header">
              <span className="ordering-badge">
                {isSpecific ? (
                  <QrCode size={13} aria-hidden="true" />
                ) : (
                  <Sparkles size={13} aria-hidden="true" />
                )}
                {badge || t.restaurantQrLabel}
              </span>
              <div className="ordering-title-row">
                <strong className="ordering-restaurant-name">{title}</strong>
                <button
                  type="button"
                  className={`ordering-copy-chip ${copied ? "copied" : ""}`}
                  onClick={handleCopyOnly}
                  title={copied ? t.copiedButton : t.copyButton}
                  aria-label={copied ? t.copiedButton : t.copyButton}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? t.copiedButton : t.copyButton}</span>
                </button>
              </div>
            </div>
            <div className="ordering-qr-frame">
              <div className="ordering-qr-box">
                <QRCodeSVG
                  value={appHref}
                  size={136}
                  level="M"
                  title={`${title} QR Code`}
                />
              </div>
              <div className="ordering-qr-text">
                <p className="ordering-qr-instructions">
                  {isSpecific
                    ? t.qrInstructionsSpecific
                    : t.qrInstructionsHub(dish)}
                </p>

                <div className="ordering-city-selector">
                  <MapPin size={13} aria-hidden="true" />
                  <label htmlFor={`${id}-desktop-city`}>{t.cityLabel}</label>
                  <select
                    id={`${id}-desktop-city`}
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                  >
                    {ORDERING_CITIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <a
                  className="ordering-qr-fallback"
                  href={webHref}
                  target="_blank"
                  rel="sponsored noopener"
                >
                  {t.qrFallbackLink}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              </div>
            </div>
            <p className="ordering-disclosure">{t.disclosure}</p>
          </div>

          {/* Mobile view: Direct CTA button navigating to ShopeeFood */}
          <div className="ordering-mobile-view">
            <span className="ordering-badge">
              <Smartphone size={13} aria-hidden="true" />
              {badge || t.restaurantLabel}
            </span>
            <div className="ordering-title-row">
              <strong className="ordering-restaurant-name">{title}</strong>
              <button
                type="button"
                className={`ordering-copy-chip ${copied ? "copied" : ""}`}
                onClick={handleCopyOnly}
                title={copied ? t.copiedButton : t.copyButton}
                aria-label={copied ? t.copiedButton : t.copyButton}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? t.copiedButton : t.copyButton}</span>
              </button>
            </div>
            <a
              className="shopeefood-button"
              href={appHref}
              onClick={handleMobileCtaClick}
              target="_blank"
              rel="sponsored noopener"
              aria-describedby={`${id}-affiliate-hint`}
            >
              <ShoppingBag size={17} aria-hidden="true" />
              {isSpecific
                ? t.restaurantMobileSpecific
                : t.restaurantMobileHub(dish)}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <p id={`${id}-affiliate-hint`} className="ordering-hint">
              {copied
                ? t.copiedHint(dish)
                : isSpecific
                  ? t.affiliateHintMobileSpecific
                  : t.affiliateHintMobileHub}
            </p>
            <p className="ordering-disclosure">{t.disclosure}</p>
          </div>
        </div>
      )}
    </section>
  );
}
