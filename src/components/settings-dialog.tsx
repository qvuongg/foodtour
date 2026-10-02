import { useEffect, useId, useRef, type CSSProperties, type RefObject } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronRight, Languages, SlidersHorizontal, Sparkles, Volume1, Volume2, VolumeX, X } from "lucide-react";
import type { Language } from "@/lib/i18n";
import "./settings-dialog.css";

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onOpenPreferences?: () => void;
  onOpenPet?: () => void;
  finalFocus?: RefObject<HTMLElement | null>;
}

/** Preferences keep their existing storage in the page; this dialog only edits them. */
export function SettingsDialog({ open, onClose, volume, onVolumeChange, language, onLanguageChange, onOpenPreferences, onOpenPet, finalFocus }: SettingsDialogProps) {
  const vi = language === "vi";
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastNonzeroVolume = useRef(volume > 0 ? volume : 50);
  const volumeId = useId();
  const currentVolume = Math.min(100, Math.max(0, volume));

  useEffect(() => {
    if (currentVolume > 0) lastNonzeroVolume.current = currentVolume;
  }, [currentVolume]);

  const updateVolume = (nextVolume: number) => {
    if (nextVolume > 0) lastNonzeroVolume.current = nextVolume;
    onVolumeChange(nextVolume);
  };

  const toggleMute = () => {
    if (currentVolume > 0) {
      lastNonzeroVolume.current = currentVolume;
      onVolumeChange(0);
    } else {
      onVolumeChange(lastNonzeroVolume.current);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="settings-backdrop" />
        <Dialog.Popup className="settings-dialog" initialFocus={closeRef} finalFocus={finalFocus}>
          <div className="settings-handle" aria-hidden="true" />
          <header className="settings-header">
            <div>
              <Dialog.Title className="settings-title">{vi ? "Cài đặt" : "Settings"}</Dialog.Title>
              <Dialog.Description className="settings-description">{vi ? "Một chút tuỳ chỉnh, đúng gu của bạn." : "A few tweaks to make it yours."}</Dialog.Description>
            </div>
            <Dialog.Close ref={closeRef} className="settings-icon-button settings-close" aria-label={vi ? "Đóng cài đặt" : "Close settings"}>
              <X size={21} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="settings-body">
            <section className="settings-sound" aria-labelledby={`${volumeId}-label`}>
              <div className="settings-section-heading">
                <label id={`${volumeId}-label`} htmlFor={volumeId}>{vi ? "Âm thanh khi quay" : "Spin sound"}</label>
                <output htmlFor={volumeId} className={currentVolume === 0 ? "is-muted" : undefined}>{currentVolume === 0 ? vi ? "Đã tắt tiếng" : "Muted" : `${currentVolume}%`}</output>
              </div>
              <div className="settings-volume-controls">
                <button type="button" className="settings-icon-button settings-mute" onClick={toggleMute} aria-pressed={currentVolume === 0} aria-label={vi ? "Tắt tiếng" : "Mute sound"} title={currentVolume === 0 ? vi ? "Bật lại âm thanh" : "Restore sound" : vi ? "Tắt tiếng" : "Mute sound"}>
                  {currentVolume === 0 ? <VolumeX size={20} aria-hidden="true" /> : currentVolume < 50 ? <Volume1 size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
                </button>
                <input id={volumeId} type="range" min="0" max="100" step="1" value={currentVolume} onChange={(event) => updateVolume(Number(event.target.value))} className="settings-volume-range" aria-valuetext={currentVolume === 0 ? vi ? "Đã tắt tiếng" : "Muted" : `${currentVolume}%`} style={{ "--settings-volume": `${currentVolume}%` } as CSSProperties} />
              </div>
            </section>

            <section className="settings-language" aria-labelledby={`${volumeId}-language`}>
              <h2 id={`${volumeId}-language`}><Languages size={19} aria-hidden="true" />{vi ? "Ngôn ngữ" : "Language"}</h2>
              <div className="settings-language-options" role="group" aria-labelledby={`${volumeId}-language`}>
                <button type="button" lang="vi" aria-pressed={language === "vi"} onClick={() => onLanguageChange("vi")}>Tiếng Việt</button>
                <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>English</button>
              </div>
            </section>

            {(onOpenPreferences || onOpenPet) && <div className="settings-shortcuts">
              {onOpenPreferences && <button type="button" className="settings-shortcut" onClick={() => { onClose(); onOpenPreferences(); }}>
                <span className="settings-shortcut-icon"><SlidersHorizontal size={20} aria-hidden="true" /></span>
                <span className="settings-shortcut-copy"><strong>{vi ? "Món của tôi" : "My dishes"}</strong><small>{vi ? "Thêm món ruột, chỉnh thực đơn riêng" : "Add favourites and edit your dish pool"}</small></span>
                <ChevronRight size={19} aria-hidden="true" />
              </button>}
              {onOpenPet && <button type="button" className="settings-shortcut" onClick={() => { onClose(); onOpenPet(); }}>
                <span className="settings-shortcut-icon"><Sparkles size={20} aria-hidden="true" /></span>
                <span className="settings-shortcut-copy"><strong>{vi ? "Linh thú của bạn" : "Your foodie pet"}</strong><small>{vi ? "Xem cấp độ và cách nuôi bé" : "See levels and ways to help your pet grow"}</small></span>
                <ChevronRight size={19} aria-hidden="true" />
              </button>}
            </div>}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
