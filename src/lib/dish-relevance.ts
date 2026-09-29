/**
 * Module kiểm tra độ phù hợp của quán ăn với món ăn (Dish Relevance Filter)
 * Ngăn chặn triệt để các quán sai lệch (VD: Bánh canh, Bánh cá Taiyaki xuất hiện khi chọn Bánh xèo)
 */

export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

/**
 * Khớp cụm từ nguyên vẹn với ranh giới từ (Tránh lỗi "banh can" hay "banh ca" khớp nhầm "banh canh")
 */
export function matchWholePhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return regex.test(text);
}

/**
 * Danh sách từ khóa đặc thù và từ khóa xung đột của các món ăn phổ biến
 */
interface DishRule {
  synonyms?: string[]; // Các từ đồng nghĩa hoặc món đi kèm thường thấy (VD: Bánh xèo đi kèm Nem lụi, Bánh căn)
  conflicts?: string[]; // Các món khác dễ bị tìm kiếm nhầm (VD: Bánh xèo bị nhầm Bánh canh, Bánh cá, Bánh mì...)
}

const DISH_RULES: Record<string, DishRule> = {
  "banh xeo": {
    synonyms: ["banh xeo", "banh can", "nem lui", "ba duong"],
    conflicts: [
      "banh ca",
      "taiyaki",
      "takoyaki",
      "banh canh",
      "banh ep",
      "banh beo",
      "banh cuon",
      "banh mi",
      "banh my",
      "banh bao",
      "banh ran",
      "banh trang",
      "bakery",
      "tiem banh",
      "tra sua",
      "ca phe",
      "coffee",
      "chan ga",
      "chao",
      "xoi",
      "be thui",
      "bun long",
      "bun bo",
      "bun rieu",
    ],
  },
  "banh cuon": {
    synonyms: ["banh cuon", "banh uot", "cha muc ha long"],
    conflicts: [
      "banh ca",
      "banh canh",
      "banh xeo",
      "banh ep",
      "banh mi",
      "banh my",
      "bakery",
      "tiem banh",
      "tra sua",
      "ca phe",
    ],
  },
  "banh mi": {
    synonyms: ["banh mi", "banh my", "bread", "baguette"],
    conflicts: [
      "banh ca",
      "banh canh",
      "banh xeo",
      "banh ep",
      "banh cuon",
      "tra sua",
      "ca phe",
    ],
  },
  "bun cha": {
    synonyms: ["bun cha", "nem cua be"],
    conflicts: [
      "bun dau",
      "bun bo",
      "bun rieu",
      "bun ca",
      "bun mam",
      "bun oc",
      "tra sua",
      "ca phe",
    ],
  },
  "bun dau mam tom": {
    synonyms: ["bun dau"],
    conflicts: [
      "bun cha",
      "bun bo",
      "bun rieu",
      "bun ca",
      "tra sua",
      "ca phe",
    ],
  },
  "bun bo hue": {
    synonyms: ["bun bo"],
    conflicts: [
      "bun cha",
      "bun dau",
      "bun rieu",
      "bun ca",
      "tra sua",
      "ca phe",
    ],
  },
  "pho bo": {
    synonyms: ["pho bo", "pho"],
    conflicts: [
      "bun bo",
      "bun dau",
      "com tam",
      "banh mi",
      "tra sua",
      "ca phe",
    ],
  },
  "pho ga": {
    synonyms: ["pho ga", "pho"],
    conflicts: [
      "bun bo",
      "bun dau",
      "com tam",
      "tra sua",
      "ca phe",
    ],
  },
  "com tam": {
    synonyms: ["com tam", "com suon"],
    conflicts: [
      "tra sua",
      "ca phe",
      "coffee",
      "banh mi",
      "che",
      "bakery",
    ],
  },
  "mi quang": {
    synonyms: ["mi quang", "my quang"],
    conflicts: [
      "tra sua",
      "ca phe",
      "coffee",
      "banh mi",
      "che",
    ],
  },
  "banh canh cua": {
    synonyms: ["banh canh"],
    conflicts: [
      "banh xeo",
      "banh ca",
      "banh cuon",
      "banh mi",
      "tra sua",
    ],
  },
  "ga ran": {
    synonyms: [
      "ga ran",
      "fried chicken",
      "kfc",
      "jollibee",
      "lotteria",
      "popeyes",
      "texas chicken",
      "bbq chicken",
      "chick",
    ],
    conflicts: ["tra sua", "ca phe", "che"],
  },
  "pizza": {
    synonyms: ["pizza", "pizzeria"],
    conflicts: ["tra sua", "ca phe", "che"],
  },
  "sushi ca hoi": {
    synonyms: ["sushi", "sashimi", "nhat ban", "japanese"],
    conflicts: ["tra sua", "ca phe"],
  },
  "ramen": {
    synonyms: ["ramen", "nhat ban", "japanese noodle"],
    conflicts: ["tra sua", "ca phe"],
  },
};

/**
 * Kiểm tra xem một quán ăn có thực sự phù hợp với món ăn đang chọn hay không
 */
export function isRestaurantRelevantForDish(
  restaurantName: string,
  dishName: string,
): boolean {
  if (!restaurantName || !dishName) return false;

  const nRest = normalizeText(restaurantName);
  const nDish = normalizeText(dishName);

  // 1. Nếu tên quán chứa trọn vẹn cụm từ tên món -> 100% phù hợp!
  if (matchWholePhrase(nRest, nDish)) {
    return true;
  }

  // 2. Tra cứu quy tắc đặc biệt nếu có
  const rule = DISH_RULES[nDish];
  if (rule) {
    // Nếu có từ đồng nghĩa / món đi kèm hợp lệ
    const matchesSynonym = rule.synonyms?.some((s) => matchWholePhrase(nRest, s));
    if (matchesSynonym) {
      return true;
    }

    // Nếu chứa từ khóa xung đột -> Loại bỏ!
    const hasConflict = rule.conflicts?.some((c) => matchWholePhrase(nRest, c));
    if (hasConflict) {
      return false;
    }
  }

  // 3. Quy tắc chung: Tách các từ chính của món (loại bỏ từ nối)
  const dishWords = nDish
    .split(/\s+/)
    .filter((w) => !["va", "kem", "mot", "nguoi", "sot", "kieu"].includes(w));

  if (dishWords.length >= 2) {
    // Nếu quán chứa ít nhất 2 từ chính của món (VD: "bún" + "chả")
    const matchCount = dishWords.filter((w) => matchWholePhrase(nRest, w)).length;
    if (matchCount >= 2) {
      return true;
    }
  } else if (dishWords.length === 1) {
    if (matchWholePhrase(nRest, dishWords[0])) {
      return true;
    }
  }

  return false;
}

/**
 * Lọc danh sách quán ăn chỉ giữ lại các quán thực sự bán món ăn đó
 */
export function filterRelevantRestaurants<T extends { name: string }>(
  restaurants: T[],
  dishName: string,
): T[] {
  if (!Array.isArray(restaurants) || restaurants.length === 0) return [];

  // Lọc các quán vượt qua bộ kiểm tra phù hợp
  const relevant = restaurants.filter((r) =>
    isRestaurantRelevantForDish(r.name, dishName),
  );

  // Nếu sau khi lọc vẫn có ít nhất 1 quán phù hợp, trả về danh sách đã lọc sạch
  if (relevant.length > 0) {
    return relevant;
  }

  // Nếu không có quán nào có tên khớp (rất hiếm), trả về danh sách ban đầu để không bị rỗng
  return restaurants;
}
