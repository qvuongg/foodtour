import { useId, type CSSProperties } from "react";
import type { PetLevel } from "@/lib/foodie-streak";
import type { Language } from "@/lib/i18n";
import "./foodie-pet.css";

/** Original local vector artwork. Light consistently falls from the upper left. */
export function FoodiePet({
  level, xp, isEating = false, celebrating = false, size = "md", language = "vi", paused = false, decorative = false,
}: {
  level: PetLevel;
  xp: number;
  isEating?: boolean;
  celebrating?: boolean;
  size?: "sm" | "md" | "lg";
  language?: Language;
  paused?: boolean;
  decorative?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const paint = (name: string) => `url(#${id}-${name})`;
  const n = level.level;
  // Tông cam đất đặc trưng của app: viền đậm rõ nét, ấm áp và đồng bộ hoàn hảo
  const ink = "var(--pet-outline, #8f3417)";
  const outline = { stroke: ink, strokeWidth: size === "lg" ? 3 : size === "md" ? 3.8 : 4.6, strokeLinejoin: "round" as const };
  const softOutline = { stroke: ink, strokeOpacity: 0.8, strokeWidth: size === "lg" ? 2 : size === "md" ? 2.8 : 3.4, strokeLinejoin: "round" as const };
  const palette = n === 4
    ? { light: "#97ccc4", mid: "#5c9e94", dark: "#28675f", scarf: "#407f75", edge: "#c3e4d9" }
    : n === 6
      ? { light: "#bf9ba8", mid: "#936675", dark: "#674454", scarf: "#8b596c", edge: "#e9ccd0" }
      : { light: "#f6a47c", mid: "#dd7650", dark: "#a7462b", scarf: "#d46a43", edge: "#ffe1bd" };

  return (
    <div
      className={`foodie-pet-wrapper size-${size} level-${n}${isEating ? " is-eating" : ""}${celebrating ? " is-celebrating" : ""}${paused ? " is-paused" : ""}`}
      style={{ "--pet-accent": level.colorHex } as CSSProperties}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : language === "vi"
        ? `Linh thú cấp ${n}, ${level.nameVi}, ${xp} XP`
        : `Level ${n} foodie pet, ${level.nameEn}, ${xp} XP`}
    >
      <svg className="pet-mascot-svg" viewBox="0 0 240 250" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-fur`} cx="31%" cy="24%" r="82%">
            <stop stopColor="#fffdf0" /><stop offset=".46" stopColor="#f1deb9" />
            <stop offset=".8" stopColor="#dfbd8e" /><stop offset="1" stopColor="#c49564" />
          </radialGradient>
          <radialGradient id={`${id}-face`} cx="34%" cy="23%" r="84%">
            <stop stopColor="#fffdf0" /><stop offset=".52" stopColor="#f6e3be" />
            <stop offset=".82" stopColor="#e5c28e" /><stop offset="1" stopColor="#c39867" />
          </radialGradient>
          <radialGradient id={`${id}-muzzle`} cx="37%" cy="24%" r="80%">
            <stop stopColor="#fffdf1" /><stop offset="1" stopColor="#f4dfba" />
          </radialGradient>
          <radialGradient id={`${id}-ear`} cx="37%" cy="72%" r="82%">
            <stop stopColor="#f4bf9d" /><stop offset=".63" stopColor="#e69d7c" /><stop offset="1" stopColor="#be7659" />
          </radialGradient>
          <radialGradient id={`${id}-cheek`}>
            <stop stopColor="#ed9981" stopOpacity=".74" /><stop offset=".6" stopColor="#efaa88" stopOpacity=".46" /><stop offset="1" stopColor="#f0b391" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-eye`} cx="35%" cy="25%" r="85%">
            <stop stopColor="#615343" /><stop offset=".48" stopColor="#352b25" /><stop offset="1" stopColor="#211d1c" />
          </radialGradient>
          <linearGradient id={`${id}-ceramic`} x1=".13" y1="0" x2=".8" y2="1">
            <stop stopColor={palette.light} /><stop offset=".48" stopColor={palette.mid} /><stop offset="1" stopColor={palette.dark} />
          </linearGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff0b0" /><stop offset=".32" stopColor="#edc262" /><stop offset=".73" stopColor="#d69d3d" /><stop offset="1" stopColor="#ac762d" />
          </linearGradient>
          <linearGradient id={`${id}-leaf`} x2=".8" y2="1">
            <stop stopColor="#c3d791" /><stop offset="1" stopColor="#628447" />
          </linearGradient>
          <linearGradient id={`${id}-wood`} x2="1" y2=".2">
            <stop stopColor="#b9753d" /><stop offset=".45" stopColor="#e8b77c" /><stop offset="1" stopColor="#ae6933" />
          </linearGradient>
          <linearGradient id={`${id}-hat`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#fffef8" /><stop offset=".55" stopColor="#f3e9d9" /><stop offset="1" stopColor="#d7c9b7" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#745132" stopOpacity=".23" /><stop offset=".52" stopColor="#745132" stopOpacity=".11" /><stop offset="1" stopColor="#745132" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse className="pet-ground-shadow" cx="123" cy="231" rx="79" ry="14" fill={paint("shadow")} />
        <g className="pet-float-body">
          {/* Tail and body are darker behind the face, like a small clay figurine. */}
          <path d="M175 184 C211 199 220 178 207 162 C204 158 198 161 200 166 C206 184 194 177 187 169" fill={paint("fur")} {...outline} />
          <path d="M201 165 C211 181 205 185 197 186" fill="none" stroke="#fff0d5" strokeWidth="3" strokeLinecap="round" opacity=".7" />
          <ellipse cx="121" cy="179" rx="55" ry="43" fill={paint("fur")} {...softOutline} />
          <ellipse cx="121" cy="164" rx="44" ry="24" fill="#ba885f" opacity=".16" />
          <ellipse cx="84" cy="219" rx="21" ry="11" fill={paint("fur")} {...softOutline} />
          <ellipse cx="157" cy="219" rx="21" ry="11" fill={paint("fur")} {...softOutline} />
          <path d="M77 220 L77 223 M84 222 L84 225 M156 222 L156 225 M163 220 L163 223" stroke={ink} strokeWidth={size === "lg" ? 2.2 : 2.8} strokeLinecap="round" opacity=".85" />

          {/* Rounded ears, inset warm interiors, and one broad uninterrupted face. */}
          <path d="M51 90 C44 76 37 35 47 31 C55 28 79 48 86 59 L81 96Z" fill={paint("fur")} {...outline} />
          <path d="M154 59 C163 47 184 28 194 32 C203 37 196 76 187 93 L158 95Z" fill={paint("fur")} {...outline} />
          <path d="M54 76 C51 68 45 41 50 40 C56 40 69 53 75 63Z" fill={paint("ear")} />
          <path d="M164 63 C173 53 187 40 191 42 C195 45 190 67 186 77Z" fill={paint("ear")} />
          <path d="M49 83 C51 65 78 52 120 52 C162 52 185 63 192 83 C201 108 205 132 184 150 C170 163 146 168 120 167 C94 168 69 163 55 150 C34 133 39 105 49 83Z" fill={paint("face")} {...outline} />
          <path d="M62 79 C73 65 96 60 119 61" fill="none" stroke="#fffdf0" strokeWidth="5" strokeLinecap="round" opacity=".72" />
          <path d="M78 154 Q121 174 166 154" fill="none" stroke="#c5a077" strokeWidth="3" strokeLinecap="round" opacity=".18" />
          <path d="M107 55 Q106 65 111 71 M120 54 L121 67 M133 55 Q136 65 130 71" fill="none" stroke={ink} strokeWidth={size === "lg" ? 4.0 : 5.0} strokeLinecap="round" opacity=".85" />
          <ellipse cx="64" cy="132" rx="21" ry="15" fill={paint("cheek")} />
          <ellipse cx="177" cy="132" rx="21" ry="15" fill={paint("cheek")} />
          <ellipse cx="105" cy="138" rx="21" ry="14" fill={paint("muzzle")} />
          <ellipse cx="135" cy="138" rx="21" ry="14" fill={paint("muzzle")} />

          {n === 4 ? (
            <g className="pet-glasses">
              <path d="M68 102 Q84 97 106 101 L103 120 Q90 134 73 120Z M135 101 Q155 97 173 102 L168 120 Q151 134 137 120Z" fill="#34534e" stroke="#243f3d" strokeWidth="3.4" strokeLinejoin="round" />
              <path d="M106 105 Q121 100 135 105 M67 104 L57 101 M173 104 L184 101" fill="none" stroke="#294b45" strokeWidth="4" strokeLinecap="round" />
              <path d="M75 105 L92 102 L79 120Z M143 105 L159 103 L146 120Z" fill="#97c7bf" opacity=".64" />
              <path d="M84 104 L90 103 L80 117Z M151 104 L157 104 L147 117Z" fill="#e7f6e9" opacity=".55" />
            </g>
          ) : (
            <g className="pet-eyes">
              <ellipse cx="85" cy="111" rx="10.5" ry="14.5" fill={paint("eye")} />
              <ellipse cx="155" cy="111" rx="10.5" ry="14.5" fill={paint("eye")} />
              <ellipse cx="82" cy="106" rx="3.8" ry="4.4" fill="#fffef4" />
              <ellipse cx="152" cy="106" rx="3.8" ry="4.4" fill="#fffef4" />
              <circle cx="89" cy="116" r="1.8" fill="#e4cda6" /><circle cx="159" cy="116" r="1.8" fill="#e4cda6" />
            </g>
          )}
          <path d="M114 127 Q120 124 126 127 Q128 129 120 134 Q112 129 114 127Z" fill="#af6b54" />
          <path d="M117 127 Q120 126 123 127" fill="none" stroke="#f2b8a0" strokeWidth="1.5" strokeLinecap="round" />
          {isEating
            ? <g className="pet-happy-mouth"><ellipse cx="120" cy="143" rx="9" ry="7" fill="#82523c" /><ellipse cx="120" cy="147" rx="5" ry="2.7" fill="#eb9d86" /></g>
            : <path d="M110 139 Q114 145 120 139 Q126 145 130 139" fill="none" stroke={ink} strokeWidth={size === "lg" ? 2.8 : 3.4} strokeLinecap="round" />}
          <path d="M57 120 L45 117 M56 134 L43 136 M184 120 L196 117 M185 134 L198 136" fill="none" stroke={ink} strokeWidth={size === "lg" ? 2.4 : 3.0} strokeLinecap="round" opacity=".9" />

          {/* The neckerchief and bowl stay with the pet through all six levels. */}
          <path d="M82 161 Q120 173 161 161 L153 175 Q120 185 89 176Z" fill={palette.dark} />
          <path d="M86 161 Q121 170 158 161 L153 170 Q120 181 90 171Z" fill={palette.scarf} />
          <path d="M132 173 Q143 179 149 191 L135 189 L127 178Z" fill={palette.scarf} />
          <path d="M133 179 L143 185" stroke={palette.edge} strokeWidth="2.7" strokeLinecap="round" opacity={n === 2 ? ".95" : ".4"} />

          {n === 2 && <g className="pet-accessory-spoon" transform="rotate(-22 67 161)">
            <rect x="63" y="139" width="7" height="49" rx="3.5" fill={paint("wood")} />
            <ellipse cx="66.5" cy="130" rx="11" ry="16" fill={paint("wood")} />
            <ellipse cx="66.5" cy="128" rx="6.5" ry="10" fill="#a66b3c" opacity=".45" />
            <path d="M61 124 Q62 118 67 119" fill="none" stroke="#f7d8a5" strokeWidth="2" strokeLinecap="round" />
          </g>}
          {n === 3 && <g className="pet-accessory-skewer" transform="rotate(18 179 173)">
            <path d="M179 125 L179 194" stroke="#ad753d" strokeWidth="4" strokeLinecap="round" />
            <rect x="169" y="124" width="21" height="20" rx="7" fill="#d98546" />
            <rect x="168" y="147" width="22" height="19" rx="7" fill="#e3ac5c" />
            <path d="M173 129 L181 127 M173 153 L181 151" stroke="#f9d08b" strokeWidth="3" strokeLinecap="round" />
            <path d="M174 139 L183 136 M174 160 L184 157" stroke="#ac643b" strokeWidth="2" strokeLinecap="round" opacity=".65" />
          </g>}

          <g className="pet-food-bowl">
            <ellipse cx="121" cy="216" rx="37" ry="6" fill="#ad7650" opacity=".22" />
            <path d="M66 186 Q73 220 120 223 Q168 220 176 186Z" fill={paint("ceramic")} stroke={palette.dark} strokeWidth={size === "lg" ? 1 : 1.7} />
            <path d="M74 193 Q85 214 113 216" fill="none" stroke={palette.edge} strokeWidth="3.5" strokeLinecap="round" opacity=".42" />
            <path d="M153 215 Q169 207 173 193" fill="none" stroke={palette.dark} strokeWidth="4" strokeLinecap="round" opacity=".23" />
            <ellipse cx="121" cy="185" rx="55" ry="12" fill={palette.edge} />
            <ellipse cx="121" cy="185" rx="48" ry="8.4" fill={n === 4 ? "#b97f41" : "#e6d3ac"} />
            {n === 4 ? <g>
              <path d="M87 184 Q97 174 113 183 T145 181 Q150 178 159 184 M88 187 Q110 179 132 187 T157 185" fill="none" stroke="#f9e8ba" strokeWidth="3" strokeLinecap="round" />
              <path d="M103 181 L111 177 L122 181 L113 185Z M133 183 L144 177 L155 181 L145 185Z" fill="#a56548" />
              <path d="M122 178 L124 188 M126 179 L136 185" stroke="#6d9250" strokeWidth="2.5" strokeLinecap="round" />
            </g> : <g>
              <path d="M84 184 Q84 178 92 177 Q94 169 103 174 Q109 166 117 172 Q126 166 132 174 Q144 168 147 178 Q156 177 158 184 Q123 196 84 184Z" fill={paint("muzzle")} />
              <path d="M99 181 L102 181 M110 176 L113 176 M124 181 L127 181 M138 177 L141 177 M113 185 L116 185" stroke="#d8c49e" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M135 179 Q138 166 154 169 Q150 182 135 179Z" fill={paint("leaf")} />
              <path d="M139 177 L149 172" stroke="#58793f" strokeWidth="1.2" strokeLinecap="round" />
            </g>}
            <path d="M107 204 Q111 198 116 204 Q121 197 126 204 Q131 198 135 204" fill="none" stroke="#fff0d5" strokeWidth="2.3" strokeLinecap="round" opacity=".85" />
          </g>
          <ellipse cx="69" cy="190" rx="14" ry="11" transform="rotate(-27 69 190)" fill={paint("fur")} {...softOutline} />
          <ellipse cx="172" cy="190" rx="14" ry="11" transform="rotate(27 172 190)" fill={paint("fur")} {...softOutline} />
          <path d="M62 187 L65 191 M68 185 L71 189 M170 185 L167 189 M176 187 L173 191" fill="none" stroke={ink} strokeWidth={size === "lg" ? 2.2 : 2.8} strokeLinecap="round" opacity=".85" />

          {n === 1 && <g className="pet-accessory-sprout">
            <path d="M120 57 Q122 44 118 35" fill="none" stroke="#6d8949" strokeWidth="3" strokeLinecap="round" />
            <path d="M119 44 Q104 47 101 31 Q116 29 119 44Z M121 40 Q124 26 138 29 Q137 41 121 40Z" fill={paint("leaf")} />
            <path d="M107 35 L116 42 M126 35 L133 32" stroke="#e1e6b0" strokeWidth="1.4" strokeLinecap="round" />
          </g>}
          {n === 3 && <g className="pet-accessory-cap" transform="rotate(-9 118 62)">
            <path d="M87 58 Q90 30 117 31 Q144 32 149 59Z" fill="#84945a" />
            <path d="M88 57 Q121 44 155 60 Q159 65 146 67 Q116 61 88 65Z" fill="#adbd78" />
            <path d="M117 33 Q104 42 105 52" stroke="#b8c98a" strokeWidth="2" fill="none" opacity=".85" />
            <path d="M120 42 L122 47 L127 49 L122 51 L120 56 L118 51 L113 49 L118 47Z" fill="#f8e5bb" />
          </g>}
          {n === 5 && <g className="pet-accessory-chef">
            <path d="M86 45 C72 43 74 20 91 20 C95 4 116 6 122 15 C137 2 157 14 155 28 C171 32 166 49 155 50 L153 64 Q121 71 88 64Z" fill={paint("hat")} {...outline} />
            <path d="M90 52 Q120 58 153 52 L152 64 Q123 71 88 64Z" fill="#e9dfcf" />
            <path d="M92 56 Q121 62 151 56" fill="none" stroke="#fff9ec" strokeWidth="2.4" />
            <path d="M99 26 Q94 37 99 45 M122 23 L122 46 M145 30 Q149 37 144 46" fill="none" stroke="#dacebd" strokeWidth="2.2" strokeLinecap="round" opacity=".68" />
          </g>}
          {n === 6 && <g className="pet-accessory-crown" transform="rotate(-5 121 53)">
            <path d="M94 56 L88 30 L106 41 L120 22 L134 41 L153 30 L147 56 Q121 64 94 56Z" fill={paint("gold")} stroke="#ba8c40" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M97 52 Q120 59 145 52" fill="none" stroke="#ffe9a6" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="89" cy="29" r="3" fill="#efd084" /><circle cx="120" cy="21" r="3" fill="#efd084" /><circle cx="153" cy="29" r="3" fill="#efd084" />
            <path d="M120 39 L125 45 L120 51 L115 45Z" fill="#a66d7c" /><path d="M120 40 L120 48 L116 45Z" fill="#e1a9b2" />
          </g>}
          <g className="pet-level-sparkle" fill="#d5a64c">
            <path d="M207 78 L210 86 L218 89 L210 92 L207 100 L204 92 L196 89 L204 86Z" />
            <path d="M27 151 L29 156 L34 158 L29 160 L27 165 L25 160 L20 158 L25 156Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
