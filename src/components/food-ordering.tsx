import { useId, useState } from "react";
import { ArrowUpRight, MapPin, ShoppingBag } from "lucide-react";
import { readCookie, writeCookie } from "@/lib/cookies";
import {
  ORDERING_CITIES,
  resolveDishAffiliateLink,
  shopeeFoodSearchUrl,
} from "@/lib/food-ordering";
import type { Language } from "@/lib/i18n";

const messages = {
  vi: {
    title: "Chốt món. Tìm quán thôi.",
    city: "Khu vực tìm quán",
    chooseCity: "Chọn trên ShopeeFood",
    search: "Tìm món trên ShopeeFood",
    open: "Mở ShopeeFood",
    restaurant: "Xem quán trên ShopeeFood",
    restaurantLabel: "Quán có món này",
    searchHint: "Chọn địa chỉ giao hàng và quán phù hợp trên ShopeeFood.",
    affiliateHint: "Kiểm tra địa chỉ giao hàng và món còn bán trên ShopeeFood.",
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
    restaurant: "View restaurant on ShopeeFood",
    restaurantLabel: "A restaurant serving this dish",
    searchHint: "Choose your delivery address and restaurant on ShopeeFood.",
    affiliateHint:
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
          <span>{t.restaurantLabel}</span>
          <strong>{restaurant}</strong>
          <a
            className="shopeefood-button"
            href={affiliate.href}
            target="_blank"
            rel="sponsored noopener"
            aria-describedby={`${id}-affiliate-hint`}
          >
            {t.restaurant}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <p id={`${id}-affiliate-hint`}>{t.affiliateHint}</p>
          <p className="ordering-disclosure">{t.disclosure}</p>
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
