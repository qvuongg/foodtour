import { useId, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  QrCode,
  ShoppingBag,
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
    restaurant: "Xem quán trên ShopeeFood",
    openApp: "Mở ShopeeFood",
    restaurantHint:
      "Kiểm tra địa chỉ giao hàng và món còn bán trên ShopeeFood.",
    appHint: "Mở ShopeeFood, sau đó nhập tên món và chọn địa chỉ giao hàng.",
    qrLabel: "Mở bằng mã QR",
    qrRestaurant: "Quét mã bằng điện thoại để mở liên kết của quán này.",
    qrHub: "Quét mã để mở ShopeeFood, sau đó tìm món trong ứng dụng.",
    webSearch: "Tìm món trên web ShopeeFood",
    webHint: "Tìm theo tên món trong khu vực đã chọn.",
    cityLabel: "Khu vực tìm quán",
    saveError: "Chưa lưu được khu vực. Bạn có thể cần chọn lại ở lần sau.",
    disclosure:
      "Liên kết tiếp thị · Website có thể nhận hoa hồng từ đơn hợp lệ.",
  },
  en: {
    title: "Dish picked. Find your place.",
    restaurant: "View restaurant on ShopeeFood",
    openApp: "Open ShopeeFood",
    restaurantHint:
      "Check your delivery address and menu availability on ShopeeFood.",
    appHint:
      "Open ShopeeFood, then enter the dish name and your delivery address.",
    qrLabel: "Open with a QR code",
    qrRestaurant: "Scan with your phone to open this restaurant’s link.",
    qrHub: "Scan to open ShopeeFood, then search for your dish in the app.",
    webSearch: "Search on the ShopeeFood website",
    webHint: "Search for this dish in your selected city.",
    cityLabel: "City for restaurant search",
    saveError:
      "Couldn’t save your city. You may need to select it again next time.",
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
    const saved = readCookie<string>("ordering-city");
    return saved && ORDERING_CITIES.some((item) => item.value === saved)
      ? saved
      : DEFAULT_ORDERING_CITY;
  });
  const [saveError, setSaveError] = useState(false);
  const destination = resolveSmartHubAffiliate(dish, city, language);
  if (!destination) return null;

  const isSpecific = destination.appDestinationType === "restaurant";
  const restaurantCity = ORDERING_CITIES.find(
    (item) => item.value === destination.restaurantCity,
  )?.label;

  function handleCityChange(value: string) {
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
      <div className="ordering-city">
        <label htmlFor={`${id}-city`}>
          <MapPin size={15} aria-hidden="true" />
          {t.cityLabel}
        </label>
        <select
          id={`${id}-city`}
          value={city}
          onChange={(event) => handleCityChange(event.target.value)}
        >
          {ORDERING_CITIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      {saveError && (
        <p className="ordering-save-error" role="status">
          {t.saveError}
        </p>
      )}
      <div className="ordering-restaurant">
        {isSpecific && (
          <div className="ordering-restaurant-header">
            <span className="ordering-badge">
              {destination.badge}
              {restaurantCity && ` · ${restaurantCity}`}
            </span>
            <strong className="ordering-restaurant-name">
              {destination.title}
            </strong>
          </div>
        )}
        <a
          className="shopeefood-button"
          href={destination.appHref}
          target="_blank"
          rel="sponsored noopener"
          aria-describedby={`${id}-destination-hint`}
        >
          {isSpecific ? t.restaurant : t.openApp}
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <p id={`${id}-destination-hint`} className="ordering-hint">
          {isSpecific ? t.restaurantHint : t.appHint}
        </p>
        <details className="ordering-phone">
          <summary>
            <QrCode size={17} aria-hidden="true" />
            {t.qrLabel}
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="ordering-qr-frame">
            <div className="ordering-qr-box">
              <QRCodeSVG
                value={destination.appHref}
                size={136}
                level="M"
                title={`${isSpecific ? destination.title : "ShopeeFood"} QR`}
              />
            </div>
            <p className="ordering-qr-instructions">
              {isSpecific ? t.qrRestaurant : t.qrHub}
            </p>
          </div>
        </details>
      </div>
      <a
        className="ordering-web-link"
        href={destination.webHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={`${id}-web-hint`}
      >
        {t.webSearch}
        <ArrowUpRight size={17} aria-hidden="true" />
      </a>
      <p id={`${id}-web-hint`} className="ordering-web-hint">
        {t.webHint}
      </p>
      <p className="ordering-disclosure">{t.disclosure}</p>
    </section>
  );
}
