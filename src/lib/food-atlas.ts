export interface FoodAtlasStyle {
  atlas: string;
  clipPath?: string;
  backgroundSize: string;
  backgroundPosition: string;
}

export function getFoodAtlas(e: number): FoodAtlasStyle | null {
  if (e < 0) return null;
  if (e >= 600 && e <= 623) {
    const t = (e - 600) % 12;
    return {
      atlas: `food-meals-${Math.floor((e - 600) / 12)}`,
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${[0, 46, 94][Math.floor(t / 4)]}%`,
    };
  }
  if (e >= 500 && e <= 547) {
    const t = (e - 500) % 12;
    const n = Math.floor((e - 500) / 12);
    const a = Math.floor(t / 4);
    const i = [
      [0, 47, 94],
      [0, 48, 98],
      [0, 50, 96],
      [0, 47, 97],
    ][n];
    const clip =
      0 === a && 0 === n
        ? "inset(0 0 2% 0)"
        : (0 === a && 3 === n) || (1 === a && 0 === n)
          ? "inset(0 0 7% 0)"
          : 1 === a && 2 === n
            ? "inset(0 0 6% 0)"
            : undefined;
    return {
      atlas: `drink-${2 + n}`,
      clipPath: clip,
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${i[a]}%`,
    };
  }
  if (e >= 400 && e <= 447) {
    const t = (e - 400) % 12;
    const n = Math.floor((e - 400) / 12);
    const a = [
      [0, 50, 100],
      [0, 46, 91],
      [0, 46, 90],
      [1, 46, 91],
    ][n];
    return {
      atlas: `nhau-${n}`,
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${a[Math.floor(t / 4)]}%`,
    };
  }
  if (e >= 300 && e <= 383) {
    const t = (e - 300) % 12;
    const n = Math.floor((e - 300) / 12);
    const a = Math.floor(t / 4);
    const i = [
      [0, 46, 94],
      [0, 49, 98.5],
      [0, 46, 94],
      [0, 46, 94],
      [0, 50, 100],
      [0, 49, 98.5],
      [0, 46, 94],
    ][n];
    const s =
      2 === n && 0 === a
        ? "inset(0 0 2% 0)"
        : 3 === n && 0 === a
          ? "inset(0 0 6% 0)"
          : 3 === n && 1 === a
            ? "inset(0 0 4% 0)"
            : 6 === n && 0 === a
              ? "inset(0 0 3% 0)"
              : undefined;
    return {
      atlas: `snack-vietnam-${n}`,
      clipPath: s,
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${i[a]}%`,
    };
  }
  if (e >= 168 && e <= 183) {
    const t = (e - 168) % 4;
    return {
      atlas: [
        "food-chinese-0",
        "food-korean-0",
        "food-japanese-0",
        "food-indian-0",
      ][Math.floor((e - 168) / 4)],
      backgroundSize: "200% 200%",
      backgroundPosition: `${(t % 2) * 100}% ${100 * Math.floor(t / 2)}%`,
    };
  }
  if (e >= 156 && e <= 167) {
    const t = e - 156;
    return {
      atlas: "snack-0",
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${[0, 47, 93][Math.floor(t / 4)]}%`,
    };
  }
  if (e >= 132 && e <= 155) {
    const t = (e - 132) % 12;
    const n = (e < 144 ? [0, 47, 94] : [0, 50, 100])[Math.floor(t / 4)];
    return {
      atlas: `drink-${Math.floor((e - 132) / 12)}`,
      backgroundSize: "400% 300%",
      backgroundPosition: `${((t % 4) / 3) * 100}% ${n}%`,
    };
  }
  if (e >= 0 && e <= 131) {
    const common = e >= 120;
    const lunch = e >= 72 && !common;
    const expanded = e >= 36;
    const index = common
      ? (e - 120) % 12
      : lunch
        ? (e - 72) % 12
        : expanded
          ? (e - 36) % 12
          : e % 4;
    const atlas = common
      ? `food-common-${Math.floor((e - 120) / 12)}`
      : lunch
        ? `food-lunch-${Math.floor((e - 72) / 12)}`
        : expanded
          ? `food-expanded-${Math.floor((e - 36) / 12)}`
          : `food-hd-${Math.floor(e / 4)}`;
    return {
      atlas,
      clipPath:
        89 === e
          ? "inset(0 0 12% 0)"
          : 93 === e
            ? undefined
            : (e < 36 && index < 2) || common
              ? "inset(0 0 4% 0)"
              : lunch
                ? "inset(0 0 7% 0)"
                : undefined,
      backgroundSize: expanded ? "400% 300%" : "200% 200%",
      backgroundPosition:
        93 === e
          ? `${100 / 3}% 89%`
          : expanded
            ? `${((index % 4) / 3) * 100}% ${[0, 46, 92][Math.floor(index / 4)]}%`
            : `${(index % 2) * 100}% ${94 * Math.floor(index / 2)}%`,
    };
  }
  return null;
}
