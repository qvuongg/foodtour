import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, BookOpen, ChevronRight, PartyPopper, Ticket, X } from "lucide-react";
import { CITY_CHECKLISTS } from "@/lib/city-checklist";
import type { FoodieStreakState } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import "./main-menu-drawer.css";

const HappyHour = lazy(() => import("./happy-hour").then((module) => ({ default: module.HappyHour })));
const VoucherCollections = lazy(() => import("./voucher-collections").then((module) => ({ default: module.VoucherCollections })));

const LocalChecklist = lazy(() => import("./city-checklist-modal").then((module) => ({ default: module.LocalChecklist })));

type MenuView = "home" | "voucher" | "happy-hour" | "checklist";

export function MainMenuDrawer({ open, onClose, language, state, onSetChecked, storageError, onRetrySave, finalFocus }: {
  open: boolean;
  onClose: () => void;
  language: Language;
  state: FoodieStreakState;
  onSetChecked: (id: string, checked: boolean) => Promise<boolean>;
  storageError?: string | null;
  onRetrySave?: () => Promise<boolean>;
  finalFocus?: RefObject<HTMLElement | null>;
}) {
  const vi = language === "vi";
  const [view, setView] = useState<MenuView>("home");
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const voucherRef = useRef<HTMLButtonElement>(null);
  const happyRef = useRef<HTMLButtonElement>(null);
  const checklistRef = useRef<HTMLButtonElement>(null);
  const total = CITY_CHECKLISTS.reduce((sum, city) => sum + city.items.length, 0);
  useEffect(() => { if (open) { setView("home"); } }, [open]);
  function show(next: MenuView) {
    const previous = view;
    // Keep focus on a stable node while the clicked view is removed.
    closeRef.current?.focus({ preventScroll: true });
    setView(next);
    requestAnimationFrame(() => {
      if (next === "home") (previous === "voucher" ? voucherRef : previous === "checklist" ? checklistRef : happyRef).current?.focus({ preventScroll: true });
      else backRef.current?.focus({ preventScroll: true });
    });
  }
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="main-menu-overlay" />
      <Dialog.Popup className="compact-main-menu" initialFocus={closeRef} finalFocus={finalFocus}>
        <header className="menu-hub-header">
          {view !== "home" && <button ref={backRef} type="button" className="menu-detail-back menu-round-button" aria-label={vi ? "Trở về menu" : "Back to menu"} onClick={() => show("home")}><ArrowLeft size={21} aria-hidden="true" /></button>}
          <div><span className="menu-hub-eyebrow">{vi ? "QUAY CƠM.ONLINE" : "QUAY COM.ONLINE"}</span><Dialog.Title>{view === "home" ? vi ? "Khám phá" : "Explore" : view === "voucher" ? "Voucher" : view === "checklist" ? vi ? "Món local" : "Local food" : "Happy Hour"}</Dialog.Title></div>
          <Dialog.Close ref={closeRef} className="menu-close menu-round-button" aria-label={vi ? "Đóng menu" : "Close menu"}><X size={21} aria-hidden="true" /></Dialog.Close>
        </header>
        <Dialog.Description className="sr-only">{vi ? "Voucher ShopeeFood, checklist món địa phương và gợi ý thực đơn cho cả nhóm." : "ShopeeFood offers, a local food checklist and menus for your group."}</Dialog.Description>
        <div className="menu-hub-body">
          {view === "home" && <>
            <p className="menu-hub-intro">{vi ? "Một chút cảm hứng cho cuộc hẹn tiếp theo." : "A little inspiration for your next get-together."}</p>
            <nav className="menu-hub-nav" aria-label={vi ? "Tiện ích" : "Tools"}>
              <button ref={voucherRef} className="menu-nav-button" data-destination="voucher" onClick={() => show("voucher")}><span className="menu-nav-icon is-voucher"><Ticket size={23} aria-hidden="true" /></span><span><strong>Voucher</strong><small>{vi ? "Khám phá ưu đãi ShopeeFood" : "Explore ShopeeFood offers"}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              <button ref={checklistRef} className="menu-nav-button" data-destination="checklist" onClick={() => show("checklist")}><span className="menu-nav-icon is-journal"><BookOpen size={22} aria-hidden="true" /></span><span><strong>{vi ? "Món ngon local" : "Local food"}</strong><small>{vi ? `${total} món đặc sản · 3 thành phố` : `${total} local dishes · 3 cities`}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
              <button ref={happyRef} className="menu-nav-button" data-destination="happy-hour" onClick={() => show("happy-hour")}><span className="menu-nav-icon is-happy"><PartyPopper size={23} aria-hidden="true" /></span><span><strong>Happy Hour</strong><small>{vi ? "Lên menu vừa túi tiền cả nhóm" : "Plan a menu for your group"}</small></span><ChevronRight size={18} aria-hidden="true" /></button>
            </nav>
          </>}
          <Suspense fallback={<p className="menu-hub-intro" role="status">{vi ? "Đang mở tiện ích…" : "Opening…"}</p>}>
            {view === "voucher" && <VoucherCollections language={language} />}
            {view === "happy-hour" && <HappyHour language={language} />}
            {view === "checklist" && <LocalChecklist language={language} state={state} onSetChecked={onSetChecked} storageError={storageError} onRetrySave={onRetrySave} />}
          </Suspense>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
