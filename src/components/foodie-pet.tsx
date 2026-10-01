import { useId, type CSSProperties } from "react";
import type { FlameTierConfig } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import "./foodie-pet.css";

/** Local vector artwork: the same little kitchen companion at every size. */
export function FoodiePet({
  tier, score, isEating = false, size = "md", language = "vi", paused = false, decorative = false,
}: {
  tier: FlameTierConfig;
  score: number;
  isEating?: boolean;
  size?: "sm" | "md" | "lg";
  language?: Language;
  paused?: boolean;
  decorative?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const fur = `${id}-fur`, ear = `${id}-ear`, bowl = `${id}-bowl`;
  const blue = tier.id === "blue", purple = tier.id === "purple";
  return (
    <div
      className={`foodie-pet-wrapper size-${size} tier-${tier.id}${isEating ? " is-eating" : ""}${paused ? " is-paused" : ""}`}
      style={{ "--flame-color": tier.colorHex } as CSSProperties}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : language === "vi"
        ? `Linh thú ${tier.petTitleVi}, ${score} điểm lửa`
        : `Foodie pet ${tier.petTitleEn}, ${score} fire points`}
    >
      <svg className="pet-mascot-svg" viewBox="0 0 160 164" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={fur} cx="35%" cy="25%" r="80%">
            <stop offset="0" stopColor="#fffdf5" /><stop offset=".7" stopColor="#f9ebd7" /><stop offset="1" stopColor="#e9cbaa" />
          </radialGradient>
          <linearGradient id={ear} x2="0" y2="1"><stop stopColor="#f6b394" /><stop offset="1" stopColor="#f5cbb0" /></linearGradient>
          <linearGradient id={bowl} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor={blue ? "#92d9dc" : purple ? "#cbb3e7" : "#f18d62"} />
            <stop offset="1" stopColor={blue ? "#267e88" : purple ? "#7a509f" : "#bd4e2c"} />
          </linearGradient>
        </defs>
        <ellipse className="pet-ground-shadow" cx="80" cy="152" rx="35" ry="5" fill="#67472e" opacity=".13" />
        <g className="pet-float-body">
          <path className="pet-tail" d="M118 122 C148 131 154 108 142 104 C132 101 133 115 125 111" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="80" cy="111" rx="39" ry="34" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.3" />
          <ellipse cx="57" cy="143" rx="13" ry="7" fill="#f9e8d1" stroke="#765338" strokeWidth="2.2" />
          <ellipse cx="103" cy="143" rx="13" ry="7" fill="#f9e8d1" stroke="#765338" strokeWidth="2.2" />
          <path d="M35 57 Q24 21 38 25 L61 42 M99 42 L122 25 Q135 21 125 57" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M37 48 L35 33 Q38 32 50 44 Z M111 44 Q121 32 124 33 L122 48 Z" fill={`url(#${ear})`} />
          <path d="M80 36 C112 34 131 53 130 76 C130 100 111 114 80 113 C49 114 30 100 30 76 C29 53 48 35 80 36Z" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.5" />
          <path d="M69 38 L74 46 M80 36 L80 45 M91 38 L87 46" stroke="#dbab7a" strokeWidth="3.3" strokeLinecap="round" />
          <ellipse cx="48" cy="84" rx="10" ry="5" fill="#e88e77" opacity=".42" /><ellipse cx="112" cy="84" rx="10" ry="5" fill="#e88e77" opacity=".42" />
          {blue ? (
            <g className="pet-glasses" stroke="#344a4e" strokeWidth="3">
              <path d="M44 65 H68 V76 Q56 86 46 75Z M92 65 H116 L114 75 Q104 86 92 76Z" fill="#344a4e" strokeLinejoin="round" />
              <path d="M68 68 Q80 64 92 68" fill="none" />
              <path d="M50 68 L57 74 M98 68 L105 74" stroke="#c7f0eb" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : (
            <g className="pet-eyes">
              <ellipse cx="58" cy="71" rx="5.8" ry={tier.id === "starter" ? "5" : "7.2"} fill="#43362b" />
              <ellipse cx="102" cy="71" rx="5.8" ry={tier.id === "starter" ? "5" : "7.2"} fill="#43362b" />
              <circle cx="56" cy="68" r="1.8" fill="#fffdf5" /><circle cx="100" cy="68" r="1.8" fill="#fffdf5" />
            </g>
          )}
          <path d="M76 80 Q80 77 84 80 L80 84Z" fill="#ac6b55" />
          {isEating ? <ellipse cx="80" cy="90" rx="7" ry="6" fill="#854635" /> : <path d="M70 87 Q73 94 80 87 Q87 94 90 87" fill="none" stroke="#765338" strokeWidth="2.3" strokeLinecap="round" />}
          <path d="M37 79 L27 76 M38 88 L27 89 M123 79 L133 76 M122 88 L133 89" fill="none" stroke="#bc9675" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M51 108 Q80 118 110 108 L103 118 L81 121 L61 117Z" fill={blue ? "#337e87" : purple ? "#8861a4" : "#c85736"} />
          <path d="M84 116 L95 132 L97 116Z" fill={blue ? "#4fa4ad" : purple ? "#b189c9" : "#ec865e"} />
          <g className="pet-food-bowl">
            <path d="M48 123 Q51 145 80 147 Q109 145 112 123Z" fill={`url(#${bowl})`} stroke="#765338" strokeWidth="2" />
            <ellipse cx="80" cy="123" rx="32" ry="8" fill="#fff7e3" stroke="#765338" strokeWidth="2" />
            <path d="M58 121 Q60 113 68 116 Q70 108 78 114 Q86 108 90 116 Q100 111 103 122" fill="#fffdf5" stroke="#ddcdb5" strokeWidth="1.3" />
            <path d="M84 120 Q86 111 96 110 Q96 121 84 120Z" fill="#82995a" /><path d="M86 119 L93 114" stroke="#566f38" strokeWidth="1.2" />
            <path d="M64 133 Q80 142 98 131" fill="none" stroke="#fff3d8" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
          </g>
          <ellipse cx="48" cy="123" rx="9" ry="7" transform="rotate(-23 48 123)" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.1" />
          <ellipse cx="112" cy="123" rx="9" ry="7" transform="rotate(23 112 123)" fill={`url(#${fur})`} stroke="#765338" strokeWidth="2.1" />
          {purple && <g className="pet-crown"><path d="M61 33 L56 17 L71 24 L80 10 L89 24 L104 17 L99 33Z" fill="#ecc16c" stroke="#b68337" strokeWidth="2" strokeLinejoin="round" /><circle cx="80" cy="25" r="3.5" fill="#9772b1" /></g>}
          <g className="pet-accent-spark" fill={blue ? "#71b7bb" : purple ? "#b391c7" : "#dc9b57"}>
            <path d="M139 46 L142 53 L149 56 L142 59 L139 66 L136 59 L129 56 L136 53Z" />
            {purple && <path d="M21 40 L23 45 L28 47 L23 49 L21 54 L19 49 L14 47 L19 45Z" />}
          </g>
        </g>
      </svg>
    </div>
  );
}
