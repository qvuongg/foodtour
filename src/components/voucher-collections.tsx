import { ArrowUpRight, Building2, Coffee, Compass, Globe2, Heart, MapPin, PartyPopper, ShoppingBasket, Sparkles, Truck, UsersRound, Utensils } from "lucide-react";
import { SHOPEE_COLLECTIONS, SOURCE_URL } from "@/lib/shopee-collections";
import type { Language } from "@/lib/i18n";
import "./voucher-collections.css";

const icons = {
  delivery: Truck, food: Utensils, favorite: Heart, nearby: MapPin,
  explore: Compass, city: Building2, groceries: ShoppingBasket, drink: Coffee,
  world: Globe2, party: PartyPopper, new: Sparkles, group: UsersRound,
};

export function VoucherCollections({ language }: { language: Language }) {
  const vi = language === "vi";
  return (
    <section className="voucher-collections" aria-label={vi ? "Bộ sưu tập ShopeeFood" : "ShopeeFood collections"}>
      <div className="voucher-source-heading">
        <p>{vi ? "Nguồn: ShopeeFood · TP.HCM" : "Source: ShopeeFood · Ho Chi Minh City"}</p>
        <a className="voucher-source-link" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
          {vi ? "Xem tất cả trên ShopeeFood" : "All collections on ShopeeFood"}<ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
      <p className="voucher-collections-intro">{vi
        ? "Chọn bộ sưu tập để xem ưu đãi. Đổi khu vực và kiểm tra điều kiện áp dụng trên ShopeeFood."
        : "Choose a collection to explore offers. Select your area and check eligibility on ShopeeFood."}</p>
      <ul className="voucher-collection-list">
        {SHOPEE_COLLECTIONS.map((collection) => {
          const Icon = icons[collection.icon];
          return <li key={collection.id}>
            <a className="voucher-collection-link" href={collection.url} target="_blank" rel="noopener noreferrer">
              <span className={`voucher-collection-icon is-${collection.icon}`}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
              <span>{vi ? collection.labelVi : collection.labelEn}</span>
              <ArrowUpRight className="voucher-collection-arrow" size={15} aria-hidden="true" />
            </a>
          </li>;
        })}
      </ul>
      <p className="voucher-collections-note">{vi
        ? "Bộ sưu tập có thể thay đổi theo khu vực và thời điểm. Nếu liên kết không còn nội dung, hãy mở danh sách đầy đủ ở trên."
        : "Collections may change by area and date. If a collection is no longer available, open the full list above."}</p>
    </section>
  );
}
