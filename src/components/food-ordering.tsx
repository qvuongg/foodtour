import { useId, useState } from "react";
import {
  ArrowUpRight,
  MapPin,
  QrCode,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { readCookie, writeCookie } from "@/lib/cookies";
import {
  ORDERING_CITIES,
  resolveDishAffiliateLink,
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
    restaurantMobile: "Mở quán trên App ShopeeFood",
    restaurantDesktop: "Xem quán trên ShopeeFood",
    restaurantLabel: "Quán có món này",
    restaurantQrLabel: "Quán có món này · Quét mã để đặt món",
    qrInstructions:
      "Dùng Camera điện thoại hoặc App Shopee quét mã QR để mở quán và nhận ưu đãi.",
    qrFallbackLink: "Hoặc mở liên kết trên web",
    searchHint: "Chọn địa chỉ giao hàng và quán phù hợp trên ShopeeFood.",
    affiliateHintMobile:
      "Ứng dụng Shopee sẽ mở để bạn kiểm tra địa chỉ giao hàng và áp mã khuyến mãi.",
    affiliateHintDesktop:
      "Kiểm tra địa chỉ giao hàng và món còn bán trên ShopeeFood.",
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
    restaurantMobile: "Open in ShopeeFood App",
    restaurantDesktop: "View restaurant on ShopeeFood",
    restaurantLabel: "A restaurant serving this dish",
    restaurantQrLabel: "Serving this dish · Scan QR to order",
    qrInstructions:
      "Scan QR code with your phone camera or Shopee App to open this restaurant on mobile.",
    qrFallbackLink: "Or open link on web",
    searchHint: "Choose your delivery address and restaurant on ShopeeFood.",
    affiliateHintMobile:
      "Shopee App will open to check your delivery address and apply discounts.",
    affiliateHintDesktop:
      "Check delivery to your address and dish availability on ShopeeFood.",
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
  const affiliate = resolveDishAffiliateLink(
    import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_URL,
    import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_DISHES,
    dish,
  );
  const restaurant =
    import.meta.env.VITE_SHOPEEFOOD_AFFILIATE_RESTAURANT?.trim();
  const showAffiliate = affiliate.affiliate && !!restaurant;

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
                <QrCode size={13} aria-hidden="true" />
                {t.restaurantQrLabel}
              </span>
              <strong className="ordering-restaurant-name">{restaurant}</strong>
            </div>
            <div className="ordering-qr-frame">
              <div className="ordering-qr-box">
                <QRCodeSVG
                  value={affiliate.href}
                  size={136}
                  level="M"
                  title={`${restaurant} QR Code`}
                />
              </div>
              <div className="ordering-qr-text">
                <p className="ordering-qr-instructions">{t.qrInstructions}</p>
                <a
                  className="ordering-qr-fallback"
                  href={affiliate.href}
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
              {t.restaurantLabel}
            </span>
            <strong className="ordering-restaurant-name">{restaurant}</strong>
            <a
              className="shopeefood-button"
              href={affiliate.href}
              target="_self"
              rel="sponsored"
              aria-describedby={`${id}-affiliate-hint`}
            >
              <Smartphone size={17} aria-hidden="true" />
              {t.restaurantMobile}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <p id={`${id}-affiliate-hint`}>{t.affiliateHintMobile}</p>
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
      <a
        className={`shopeefood-button${showAffiliate ? " secondary" : ""}`}
        href={shopeeFoodSearchUrl(dish, city)}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={`${id}-hint`}
      >
        {city ? t.search : t.open}
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
      <p className="ordering-hint" id={`${id}-hint`}>
        {t.searchHint}
      </p>
    </section>
  );
}
