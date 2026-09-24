import { useRef, useState } from "react";
import {
  MoreHorizontal,
  Utensils,
  Volume2,
  VolumeX,
  Languages,
} from "lucide-react";
import { PreferencesPanel } from "./preferences-panel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import type { usePreferences } from "@/hooks/use-preferences";
import type { Language } from "@/lib/i18n";

export function AppHeader({
  preferences,
  language,
  sound,
  disabled,
  onLanguage,
  onSound,
  onOpenChange,
}: {
  preferences: ReturnType<typeof usePreferences>;
  language: Language;
  sound: boolean;
  disabled: boolean;
  onLanguage: (language: Language) => void;
  onSound: (sound: boolean) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const vi = language === "vi";
  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };
  return (
    <header className="app-header">
      <a
        href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`}
        className="brand"
        aria-label="Trưa Nay Ăn Gì — Trang chủ"
      >
        <span className="brand-symbol">
          <Utensils size={21} aria-hidden="true" />
        </span>
        <span className="brand-wordmark">
          trưa nay
          <span>
            ăn gì<span className="brand-dot">?</span>
          </span>
        </span>
      </a>
      <div className="header-actions">
        <PreferencesPanel
          preferences={preferences}
          language={language}
          disabled={disabled}
          onOpenChange={onOpenChange}
        />
        <button
          ref={trigger}
          className="icon-button"
          disabled={disabled}
          aria-label={vi ? "Tùy chọn" : "Options"}
          aria-haspopup="dialog"
          onClick={() => toggle(true)}
        >
          <MoreHorizontal size={22} />
        </button>
      </div>
      <Dialog open={open} onOpenChange={toggle}>
        <DialogContent
          className="settings-dialog"
          finalFocus={trigger}
          closeLabel={vi ? "Đóng" : "Close"}
        >
          <DialogTitle>
            {vi ? "Theo cách của bạn" : "Make it yours"}
          </DialogTitle>
          <DialogDescription>
            {vi
              ? "Âm thanh và ngôn ngữ cho lần ghé tiếp theo."
              : "Sound and language for your next visit."}
          </DialogDescription>
          <button
            className="settings-row"
            role="switch"
            aria-checked={sound}
            onClick={() => onSound(!sound)}
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{vi ? "Âm thanh" : "Sound"}</span>
            <strong>{sound ? (vi ? "Bật" : "On") : vi ? "Tắt" : "Off"}</strong>
          </button>
          <button
            className="settings-row"
            onClick={() => onLanguage(vi ? "en" : "vi")}
          >
            <Languages size={20} />
            <span>{vi ? "Ngôn ngữ" : "Language"}</span>
            <strong>{vi ? "Tiếng Việt" : "English"}</strong>
          </button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
