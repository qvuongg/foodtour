import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, ExternalLink, MapPin, RotateCcw, Star, Store, X } from "lucide-react";
import type { RestaurantRouletteItem } from "@/lib/restaurant-roulette";
import { resolveRestaurantActionUrl } from "@/lib/restaurant-roulette";
import { formatDistance } from "@/lib/geo-distance";
import { openShopeeFoodDirect } from "@/lib/brand-locator";
import type { Language } from "@/lib/i18n";
import "./restaurant-result-dialog.css";

export interface RestaurantResultDialogProps {
  open: boolean;
  onClose: () => void;
  restaurant: RestaurantRouletteItem | null;
  language: Language;
  distanceKm?: number | null;
  onSpinAgain: () => void;
}

export function RestaurantResultDialog({
  open,
  onClose,
  restaurant,
  language,
  distanceKm,
  onSpinAgain,
}: RestaurantResultDialogProps) {
  const vi = language === "vi";
  const closeRef = useRef<HTMLButtonElement>(null);

  if (!restaurant) return null;

  const actionUrl = resolveRestaurantActionUrl(restaurant);

  const handleOpenShopee = () => {
    openShopeeFoodDirect(actionUrl);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="restaurant-dialog-backdrop" />
        <Dialog.Popup className="restaurant-dialog" initialFocus={closeRef}>
          <div className="restaurant-dialog-card">
            <header className="restaurant-dialog-header">
              <div className="restaurant-celebrate-badge">
                <Store size={22} aria-hidden="true" />
                <span>{vi ? "Quán đã chọn" : "Chosen Spot"}</span>
              </div>
              <Dialog.Close
                ref={closeRef}
                className="restaurant-dialog-close"
                aria-label={vi ? "Đóng" : "Close"}
              >
                <X size={20} aria-hidden="true" />
              </Dialog.Close>
            </header>

            <div className="restaurant-dialog-body">
              <Dialog.Title className="restaurant-dialog-title">
                {restaurant.name}
              </Dialog.Title>

              {/* Món đặc trưng */}
              {restaurant.specialties.length > 0 && (
                <div className="restaurant-dialog-specialties">
                  {restaurant.specialties.map((spec, i) => (
                    <span key={i} className="restaurant-dialog-chip">
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Thông tin rating và khoảng cách */}
              <div className="restaurant-dialog-meta">
                <span className="restaurant-dialog-rating">
                  <Star size={14} className="star-icon" fill="currentColor" aria-hidden="true" />
                  <strong>{restaurant.rating.toFixed(1)}</strong>
                  <small>({restaurant.ratingCount.toLocaleString(vi ? "vi-VN" : "en-US")}+)</small>
                </span>

                <span className="restaurant-dialog-district">
                  <MapPin size={13} className="pin-icon" aria-hidden="true" />
                  <span>
                    {restaurant.districtName}
                    {typeof distanceKm === "number" && distanceKm < 100
                      ? ` · ~${formatDistance(distanceKm)}`
                      : ""}
                  </span>
                </span>
              </div>

              {restaurant.address && (
                <p className="restaurant-dialog-address">
                  {restaurant.address}
                </p>
              )}
            </div>

            <footer className="restaurant-dialog-actions">
              <button
                type="button"
                className="restaurant-dialog-primary-btn"
                onClick={handleOpenShopee}
              >
                <ExternalLink size={18} aria-hidden="true" />
                <span>{vi ? "Mở quán trên ShopeeFood" : "Open on ShopeeFood"}</span>
                <span className="restaurant-dialog-xp-chip">+2 XP</span>
              </button>

              <button
                type="button"
                className="restaurant-dialog-secondary-btn"
                onClick={() => {
                  onClose();
                  onSpinAgain();
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
                <span>{vi ? "Quay quán khác" : "Spin again"}</span>
              </button>
            </footer>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
