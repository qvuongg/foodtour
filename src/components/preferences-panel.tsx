import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Leaf, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { foods } from "@/lib/foods";
import { foodName, priceLabel, type Language } from "@/lib/i18n";
import {
  emptyProfile,
  validateProfile,
  type PoolProfile,
} from "@/lib/personal-pool";
import type { Preferences } from "@/hooks/use-preferences";
import "./preferences-panel.css";

type PoolTab = "builtIn" | "custom";
type FieldErrors = { name?: string; price?: string };

export function PreferencesPanel({
  preferences: a,
  language,
  disabled,
  variant = "header",
  onOpenChange,
}: {
  preferences: Preferences;
  language: Language;
  disabled: boolean;
  variant?: "header" | "inventory";
  onOpenChange?: (open: boolean) => void;
}) {
  const vi = language === "vi";
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const priceInput = useRef<HTMLInputElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PoolProfile>(emptyProfile);
  const [saveFailed, setSaveFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<PoolTab>("builtIn");
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("50");
  const [veg, setVeg] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!saveFailed) setDraft(a.profile);
  }, [a.profile, saveFailed]);

  function changeOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setPrice("50");
    setVeg(false);
    setFieldErrors({});
  }

  function updateDraft(next: PoolProfile) {
    try {
      const checked = validateProfile(next);
      setDraft(checked);
      setSaveFailed(!a.save(checked));
      setNotice("");
      return true;
    } catch {
      setNoticeIsError(true);
      setNotice(
        vi
          ? "Giữ lại ít nhất một món để có thể quay nhé."
          : "Keep at least one dish in your lunch list.",
      );
      return false;
    }
  }

  function add() {
    const errors: FieldErrors = {};
    if (!name.trim() || name.length > 60 || /[\x00-\x1f\x7f]/.test(name)) {
      errors.name = vi
        ? "Nhập tên món từ 1–60 ký tự."
        : "Enter a dish name with 1–60 characters.";
    }
    const amount = Number(price);
    if (
      !price.trim() ||
      !Number.isInteger(amount) ||
      amount < 10 ||
      amount > 500
    ) {
      errors.price = vi
        ? "Nhập số nguyên từ 10–500 nghìn đồng."
        : "Enter a whole number from 10–500 (thousand VND).";
    }
    setFieldErrors(errors);
    if (errors.name || errors.price) {
      (errors.name ? nameInput : priceInput).current?.focus();
      return;
    }
    if (!editing && draft.custom.length >= 50) {
      setNoticeIsError(true);
      setNotice(
        vi
          ? "Bạn đã có 50 món tự thêm. Hãy sửa hoặc bỏ một món trước khi thêm tiếp."
          : "Your list already has 50 custom dishes. Edit or remove one to add another.",
      );
      return;
    }
    const item = {
      id: editing || crypto.randomUUID(),
      name: name.trim(),
      price: amount,
      veg,
    };
    if (
      updateDraft({
        ...draft,
        custom: editing
          ? draft.custom.map((f) => (f.id === editing ? item : f))
          : [...draft.custom, item],
      })
    ) {
      resetForm();
    }
  }

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft")
      next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault();
    setTab(next === 0 ? "builtIn" : "custom");
    tabButtons.current[next]?.focus();
  }

  const filteredFoods = foods.filter((f) =>
    foodName(f, language)
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const count = foods.length - draft.disabled.length + draft.custom.length;
  const scopeTitle = vi ? "Món ăn trưa của tôi" : "My lunch dishes";

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={
          variant === "inventory"
            ? "customize-food-button"
            : "preferences-button"
        }
        disabled={disabled}
        onClick={() => {
          if (!saveFailed) setDraft(a.profile);
          setNotice("");
          setConfirmDelete(false);
          changeOpen(true);
        }}
        aria-label={scopeTitle}
        title={scopeTitle}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        {variant === "inventory" ? (
          <>
            <span className="customize-full">
              {vi ? "Tuỳ chỉnh món ăn trưa" : "Customize lunch"}
            </span>
            <span className="customize-short">
              {vi ? "Tuỳ chỉnh" : "Customize"}
            </span>
          </>
        ) : (
          <span>{vi ? "Món của tôi" : "My dishes"}</span>
        )}
      </button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          className="preferences-dialog"
          finalFocus={trigger}
          showCloseButton={false}
        >
          <DialogClose
            className="preferences-close"
            aria-label={vi ? "Đóng" : "Close"}
          >
            <X size={20} aria-hidden="true" />
          </DialogClose>
          <div className="preferences-heading">
            <DialogTitle>{scopeTitle}</DialogTitle>
            <DialogDescription>
              {vi
                ? "Chọn món có sẵn hoặc thêm món quen. Chỉ áp dụng cho nhóm Ăn trưa; tự động lưu trên thiết bị này."
                : "Choose catalog dishes or add your favorites. Applies to Lunch only; saved automatically on this device."}
            </DialogDescription>
          </div>
          <div
            className="pool-tabs"
            role="tablist"
            aria-label={vi ? "Danh sách món ăn trưa" : "Lunch lists"}
          >
            {(["builtIn", "custom"] as const).map((value, index) => (
              <button
                key={value}
                ref={(element) => {
                  tabButtons.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-${value}-tab`}
                aria-selected={tab === value}
                aria-controls={`${id}-panel`}
                tabIndex={tab === value ? 0 : -1}
                className={tab === value ? "selected" : ""}
                onClick={() => setTab(value)}
                onKeyDown={(event) => handleTabKey(event, index)}
              >
                {value === "builtIn"
                  ? vi
                    ? "Món có sẵn"
                    : "Catalog"
                  : vi
                    ? "Món tự thêm"
                    : "Custom"}
                <span>
                  {value === "builtIn"
                    ? foods.length - draft.disabled.length
                    : `${draft.custom.length}/50`}
                </span>
              </button>
            ))}
          </div>
          <div
            className="pool-body"
            id={`${id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-${tab}-tab`}
            tabIndex={0}
          >
            {tab === "builtIn" ? (
              <>
                <input
                  className="pool-search"
                  placeholder={
                    vi
                      ? "Lọc món trong danh sách…"
                      : "Filter dishes in this list…"
                  }
                  aria-label={vi ? "Lọc món có sẵn" : "Filter catalog dishes"}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="pool-list">
                  {filteredFoods.length === 0 && (
                    <p role="status">
                      {vi
                        ? "Không tìm thấy món. Thử tên khác nhé."
                        : "No dishes found. Try another name."}
                    </p>
                  )}
                  {filteredFoods.map((f) => (
                    <label className="pool-row" key={f.image}>
                      <input
                        type="checkbox"
                        checked={!draft.disabled.includes(f.image)}
                        onChange={(event) =>
                          updateDraft({
                            ...draft,
                            disabled: event.target.checked
                              ? draft.disabled.filter(
                                  (foodId) => foodId !== f.image,
                                )
                              : [...draft.disabled, f.image],
                          })
                        }
                      />
                      <span>
                        {foodName(f, language)}
                        {f.veg && (
                          <Leaf
                            size={14}
                            aria-label={vi ? "Món chay" : "Vegetarian"}
                          />
                        )}
                      </span>
                      <small>{priceLabel(f.price, language)}</small>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="subtle-button"
                  onClick={() => updateDraft({ ...draft, disabled: [] })}
                >
                  {vi
                    ? "Bật lại tất cả món có sẵn"
                    : "Enable all catalog dishes"}
                </button>
              </>
            ) : (
              <>
                <form
                  className="custom-form"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    add();
                  }}
                >
                  <label>
                    {vi ? "Tên món" : "Dish name"}
                    <input
                      ref={nameInput}
                      aria-label={vi ? "Tên món" : "Dish name"}
                      value={name}
                      maxLength={60}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={
                        fieldErrors.name ? `${id}-name-error` : undefined
                      }
                      onChange={(event) => {
                        setName(event.target.value);
                        setFieldErrors((errors) => ({
                          ...errors,
                          name: undefined,
                        }));
                      }}
                    />
                    {fieldErrors.name && (
                      <span
                        className="pool-field-error"
                        id={`${id}-name-error`}
                      >
                        {fieldErrors.name}
                      </span>
                    )}
                  </label>
                  <label>
                    {vi ? "Giá (nghìn đồng)" : "Price (thousand VND)"}
                    <input
                      ref={priceInput}
                      aria-label={
                        vi ? "Giá (nghìn đồng)" : "Price (thousand VND)"
                      }
                      type="number"
                      min="10"
                      max="500"
                      step="1"
                      inputMode="numeric"
                      value={price}
                      aria-invalid={!!fieldErrors.price}
                      aria-describedby={
                        fieldErrors.price ? `${id}-price-error` : undefined
                      }
                      onChange={(event) => {
                        setPrice(event.target.value);
                        setFieldErrors((errors) => ({
                          ...errors,
                          price: undefined,
                        }));
                      }}
                    />
                    {fieldErrors.price && (
                      <span
                        className="pool-field-error"
                        id={`${id}-price-error`}
                      >
                        {fieldErrors.price}
                      </span>
                    )}
                  </label>
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={veg}
                      onChange={(event) => setVeg(event.target.checked)}
                    />
                    <Leaf size={16} aria-hidden="true" />
                    {vi ? "Món chay" : "Vegetarian"}
                  </label>
                  <button type="submit" className="pool-primary">
                    {editing ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Plus size={16} aria-hidden="true" />
                    )}
                    {editing
                      ? vi
                        ? "Cập nhật"
                        : "Update"
                      : vi
                        ? "Thêm món"
                        : "Add dish"}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="subtle-button custom-cancel"
                      onClick={resetForm}
                    >
                      {vi ? "Huỷ sửa" : "Cancel edit"}
                    </button>
                  )}
                </form>
                <div className="pool-list">
                  {draft.custom.length === 0 && (
                    <p>
                      {vi
                        ? "Thêm món tủ để lần quay tới có thêm lựa chọn của bạn."
                        : "Add a favorite lunch dish for your next spin."}
                    </p>
                  )}
                  {draft.custom.map((f) => (
                    <div className="pool-row" key={f.id}>
                      <button
                        type="button"
                        aria-label={`${vi ? "Sửa" : "Edit"} ${f.name}`}
                        onClick={() => {
                          setEditing(f.id);
                          setName(f.name);
                          setPrice(String(f.price));
                          setVeg(f.veg);
                          setFieldErrors({});
                          nameInput.current?.focus();
                        }}
                      >
                        {f.name}
                        {f.veg && (
                          <Leaf
                            size={14}
                            aria-label={vi ? "Món chay" : "Vegetarian"}
                          />
                        )}
                      </button>
                      <small>{priceLabel(f.price, language)}</small>
                      <button
                        type="button"
                        className="pool-remove"
                        aria-label={`${vi ? "Xóa" : "Remove"} ${f.name}`}
                        onClick={() => {
                          if (
                            updateDraft({
                              ...draft,
                              custom: draft.custom.filter(
                                (item) => item.id !== f.id,
                              ),
                            }) &&
                            editing === f.id
                          )
                            resetForm();
                        }}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className={`pool-save${saveFailed ? " has-error" : ""}`}>
            <p role="status" aria-live="polite">
              {saveFailed ? (
                vi ? (
                  "Chưa lưu được. Bản thay đổi của bạn vẫn được giữ tại đây."
                ) : (
                  "Could not save. Your changes are still kept here."
                )
              ) : (
                <>
                  <Check size={15} aria-hidden="true" />
                  {vi ? "Đã lưu trên thiết bị này" : "Saved on this device"}
                </>
              )}
            </p>
            {saveFailed ? (
              <button
                type="button"
                className="pool-retry"
                onClick={() => setSaveFailed(!a.save(draft))}
              >
                {vi ? "Thử lưu lại" : "Retry saving"}
              </button>
            ) : (
              <small>
                {count} {vi ? "món ăn trưa" : "lunch dishes"}
              </small>
            )}
          </div>
          {(notice || (a.error && !saveFailed)) && (
            <p
              className={`preferences-message${notice && !noticeIsError ? " is-info" : ""}`}
              role={notice && !noticeIsError ? "status" : "alert"}
            >
              {notice ||
                (vi
                  ? "Chưa thực hiện được. Vui lòng thử lại."
                  : "This did not complete. Please try again.")}
            </p>
          )}
          <div className="preferences-bottom">
            <button
              type="button"
              onClick={() => {
                const saved = a.reload();
                setDraft(saved);
                setSaveFailed(false);
                setNoticeIsError(false);
                setNotice(
                  vi
                    ? "Đã khôi phục bản được lưu gần nhất trên thiết bị này."
                    : "Restored the last saved list on this device.",
                );
                setConfirmDelete(false);
                resetForm();
              }}
            >
              {vi ? "Khôi phục bản đã lưu" : "Restore saved list"}
            </button>
            <button
              type="button"
              className="preferences-clear"
              aria-expanded={confirmDelete}
              aria-controls={`${id}-delete-confirm`}
              onClick={() => setConfirmDelete(!confirmDelete)}
            >
              {vi ? "Xóa tuỳ chỉnh" : "Reset choices"}
            </button>
          </div>
          {confirmDelete && (
            <div className="delete-confirm" id={`${id}-delete-confirm`}>
              <p>
                {vi
                  ? "Xóa các món tự thêm và bật lại toàn bộ món ăn trưa có sẵn trên thiết bị này?"
                  : "Remove custom dishes and restore all catalog lunch dishes on this device?"}
              </p>
              <div>
                <button
                  type="button"
                  className="delete-cancel"
                  onClick={() => setConfirmDelete(false)}
                >
                  {vi ? "Giữ lại" : "Keep my choices"}
                </button>
                <button
                  type="button"
                  className="delete-approve"
                  onClick={() => {
                    if (a.remove()) {
                      setSaveFailed(false);
                      setDraft(emptyProfile());
                      resetForm();
                      changeOpen(false);
                    } else {
                      setNoticeIsError(true);
                      setNotice(
                        vi
                          ? "Chưa xóa được. Danh sách hiện tại vẫn được giữ nguyên."
                          : "Could not reset your choices. Your current list is unchanged.",
                      );
                    }
                  }}
                >
                  {vi ? "Xác nhận xóa" : "Confirm reset"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
