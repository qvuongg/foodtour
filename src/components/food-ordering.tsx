import { useId, useState } from "react";
import {
  ArrowUpRight,
  MapPin,
  QrCode,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { readCookie, writeCookie } from "@/lib/cookies";
import {
  ORDERING_CITIES,
  resolveSmartHubAffiliate,
  shopeeFoodSearchUrl,
} from "@/lib/food-ordering";
import { QRCodeSVG } from "@/components/qr-code";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Language } from "@/lib/i18n";

const messages = {
  vi: {
    title: "Chốt món. Tìm quán thôi.",
    city: "Khu vực tìm quán",
    chooseCity: "Chọn trên ShopeeFood",
    search: "Tìm món trên ShopeeFood",
    open: "Mở ShopeeFood",
    restaurantMobileSpecific: "Mở quán trên App ShopeeFood",
    restaurantMobileHub: (dish: string) =>
      `Tìm quán ${dish} gần bạn trên App Shopee`,
    restaurantDesktop: "Xem quán trên ShopeeFood",
    restaurantLabel: "Quán có món này",
    restaurantQrLabel: "Gợi ý thông minh · Bán kính 3km",
    qrInstructionsSpecific:
      "Dùng Camera điện thoại hoặc App Shopee quét mã QR để mở quán và nhận ưu đãi.",
    qrInstructionsHub: (dish: string) =>
      `Dùng Camera điện thoại hoặc App Shopee quét mã QR để tìm quán ${dish} ngon nhất gần bạn (bán kính 3km).`,
    qrFallbackLink: "Hoặc mở liên kết trên web",
    searchHint: "Chọn địa chỉ giao hàng và quán phù hợp trên ShopeeFood.",
    affiliateHintMobileSpecific:
      "Ứng dụng Shopee sẽ mở để bạn kiểm tra địa chỉ giao hàng và áp mã khuyến mãi.",
    affiliateHintMobileHub:
      "Shopee App sẽ tự động định vị các quán đang mở cửa gần bạn nhất để giao nhanh & áp mã giảm giá.",
    disclosure:
      "Liên kết tiếp thị · Website có thể nhận hoa hồng từ đơn hợp lệ.",
    saveError:
      "Chưa lưu được khu vực. Bạn có thể cần chọn lại ở lượt tiếp theo.",
  },
  en: {
    title: "Lunch picked. Find your place.",
    city: "Search area",
    chooseCity: "Choose on ShopeeFood",
    search: "Find this dish on ShopeeFood",
    open: "Open ShopeeFood",
    restaurantMobileSpecific: "Open in ShopeeFood App",
    restaurantMobileHub: (dish: string) => `Find ${dish} spots on Shopee App`,
    restaurantDesktop: "View on ShopeeFood",
    restaurantLabel: "A restaurant serving this dish",
    restaurantQrLabel: "Smart Hub · 3km Delivery",
    qrInstructionsSpecific:
      "Scan QR code with your phone camera or Shopee App to open this restaurant on mobile.",
    qrInstructionsHub: (dish: string) =>
      `Scan QR code with phone camera or Shopee App to find top-rated ${dish} spots near you.`,
    qrFallbackLink: "Or open link on web",
    searchHint: "Choose your delivery address and restaurant on ShopeeFood.",
    affiliateHintMobileSpecific:
      "Shopee App will open to check your delivery address and apply discounts.",
    affiliateHintMobileHub:
      "Shopee App will locate open restaurants near you to deliver fast with vouchers.",
    disclosure: "Affiliate link · We may earn a commission on eligible orders.",
    saveError:
      "Your area couldn't be saved. You may need to select it again next time.",
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
  const isMobile = useIsMobile();
  const [city, setCity] = useState(() => {
    const saved = readCookie<string>("ordering-city");
    return ORDERING_CITIES.some((option) => option.value === saved)
      ? saved!
      : "";
  });
  const [saveError, setSaveError] = useState(false);

  // Smart Category Hub: 100% coverage across all dishes with 3km radius matching
  const hubResult = resolveSmartHubAffiliate(dish, city, language);
  const showAffiliate = !!hubResult?.affiliate;
  const title = hubResult?.title ?? "";
  const badge = hubResult?.badge ?? "";
  const affiliateHref = hubResult?.href ?? "";
  const isSpecific = hubResult?.isSpecificRestaurant ?? false;

  function changeCity(value: string) {
    setCity(value);
    try {
      writeCookie("ordering-city", value);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

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
              <strong className="ordering-restaurant-name">{title}</strong>
            </div>
            <div className="ordering-qr-frame">
              <div className="ordering-qr-box">
                <QRCodeSVG
                  value={affiliateHref}
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
                <a
                  className="ordering-qr-fallback"
                  href={affiliateHref}
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

          {/* Mobile view: Direct CTA button navigating in same tab */}
          <div className="ordering-mobile-view">
            <span className="ordering-badge">
              <Smartphone size={13} aria-hidden="true" />
              {badge || t.restaurantLabel}
            </span>
            <strong className="ordering-restaurant-name">{title}</strong>
            <a
              className="shopeefood-button"
              href={affiliateHref}
              target="_self"
              rel="sponsored"
              aria-describedby={`${id}-affiliate-hint`}
            >
              <Smartphone size={17} aria-hidden="true" />
              {isSpecific
                ? t.restaurantMobileSpecific
                : t.restaurantMobileHub(dish)}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <p id={`${id}-affiliate-hint`}>
              {isSpecific
                ? t.affiliateHintMobileSpecific
                : t.affiliateHintMobileHub}
            </p>
            <p className="ordering-disclosure">{t.disclosure}</p>
          </div>
        </div>
      )}
      <div className="ordering-city">
        <label htmlFor={`${id}-city`}>
          <MapPin size={15} aria-hidden="true" />
          {t.city}
        </label>
        <select
          id={`${id}-city`}
          value={city}
          onChange={(event) => changeCity(event.target.value)}
        >
          <option value="">{t.chooseCity}</option>
          {ORDERING_CITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {saveError && (
        <p className="ordering-save-error" role="status">
          {t.saveError}
        </p>
      )}
      {(!showAffiliate || city) && (
        <a
          className={`shopeefood-button${showAffiliate ? " secondary" : ""}`}
          href={shopeeFoodSearchUrl(dish, city, { affiliate: true })}
          target="_blank"
          rel="sponsored noopener"
          aria-describedby={`${id}-hint`}
        >
          {city ? t.search : t.open}
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      )}
      <p className="ordering-hint" id={`${id}-hint`}>
        {city ? t.searchHint : t.disclosure}
      </p>
    </section>
  );
}
