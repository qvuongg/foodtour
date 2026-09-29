/**
 * Module kiểm tra độ phù hợp của quán ăn với món ăn (Dish Relevance Filter)
 * Ngăn chặn triệt để các quán sai lệch (VD: Bún chả cá xuất hiện khi chọn Bún chả; Bánh canh, Bánh cá khi chọn Bánh xèo)
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
 * Khớp cụm từ nguyên vẹn với ranh giới từ, hỗ trợ chặn các từ mở rộng gây sai lệch món
 * Ví dụ: "Bún chả" không được khớp "Bún chả cá", "Bún chả giò"
 *        "Bánh xèo" không được khớp "Bánh xèo Nhật"
 */
export function matchWholePhrase(
  text: string,
  phrase: string,
  illegalFollowers: string[] = [],
): boolean {
  if (!text || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let regexStr = `(^|[^a-z0-9])${escaped}`;
  if (illegalFollowers.length > 0) {
    const followerPattern = illegalFollowers.join("|");
    regexStr += `(?!\\s+(${followerPattern})(\\s|$|[^a-z0-9]))`;
  }
  regexStr += `([^a-z0-9]|$)`;
  return new RegExp(regexStr, "i").test(text);
}

/**
 * Danh sách từ khóa đặc thù và từ khóa xung đột của các món ăn phổ biến
 */
interface DishRule {
  strongSynonyms?: string[]; // Khẳng định mạnh mẽ (bỏ qua xung đột), VD: "bún chả hà nội", "bánh xèo tôm nhảy"
  synonyms?: string[]; // Từ đồng nghĩa hoặc tên mở rộng thông thường, VD: "nem cua bể", "nem lụi"
  illegalFollowers?: string[]; // Hậu tố gây biến tướng sang món khác, VD: "bún chả" + "cá/giò/sứa"
  conflicts?: string[]; // Tên món khác dễ bị lẫn lộn, VD: "bun cha ca", "cha ca", "banh canh"...
}

export const DISH_RULES: Record<string, DishRule> = {
  "bun cha": {
    strongSynonyms: [
      "bun cha ha noi",
      "bun cha que tre",
      "bun cha nuong",
      "bun cha than hoa",
      "bun cha than hong",
      "bun cha obama",
      "bun cha sinh tu",
      "bun cha dac kim",
      "bun cha huong lien",
      "bun cha bat dan",
      "bun cha hang quat",
      "nem cua be",
      "bun cha quat",
      "bun cha mam",
    ],
    synonyms: ["bun cha", "o bun cha"],
    illegalFollowers: ["ca", "gio", "sua", "muc", "ram", "bo"],
    conflicts: [
      "bun cha ca",
      "cha ca",
      "bun cha gio",
      "cha gio",
      "bun cha sua",
      "cha sua",
      "cha muc",
      "cha ram",
      "bun ca ngu",
      "bun ca",
      "tra sua",
      "ca phe",
    ],
  },
  "banh xeo": {
    strongSynonyms: [
      "banh xeo mien trung",
      "banh xeo tom nhay",
      "banh xeo mien tay",
      "banh xeo quang ngai",
      "banh xeo dai loc",
      "ba duong",
    ],
    synonyms: ["banh xeo", "banh can", "nem lui"],
    illegalFollowers: ["nhat", "okonomiyaki"],
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
  "banh xeo nhat": {
    strongSynonyms: ["banh xeo nhat", "okonomiyaki"],
    synonyms: ["banh xeo nhat", "okonomiyaki", "japanese pancake"],
    conflicts: [
      "banh xeo mien trung",
      "banh xeo tom nhay",
      "ba duong",
      "nem lui",
      "banh can",
    ],
  },
  "bun bo hue": {
    strongSynonyms: ["bun bo hue", "bun bo gio heo", "bun bo bap hoa", "bun bo gan"],
    synonyms: ["bun bo"],
    illegalFollowers: ["nam bo", "xao", "tron"],
    conflicts: [
      "bun bo nam bo",
      "bun cha",
      "bun dau",
      "bun rieu",
      "bun ca",
      "bun mam",
      "tra sua",
      "ca phe",
    ],
  },
  "bun bo nam bo": {
    strongSynonyms: ["bun bo nam bo", "bun bo tron nam bo", "bun bo xao nam bo"],
    synonyms: ["bun bo nam bo", "bun bo tron"],
    conflicts: ["bun bo hue", "bun bo gio heo"],
  },
  "banh cuon": {
    strongSynonyms: [
      "banh cuon nong",
      "banh cuon thanh tri",
      "banh cuon cha muc",
      "banh cuon cao bang",
    ],
    synonyms: ["banh cuon", "banh uot"],
    illegalFollowers: ["ga", "wrap"],
    conflicts: [
      "banh cuon ga",
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
    strongSynonyms: [
      "banh mi pate",
      "banh mi thit",
      "banh mi heo quay",
      "banh mi cha",
      "banh mi hoi an",
      "banh mi phuong",
      "banh mi ba lan",
      "banh mi huynh hoa",
    ],
    synonyms: ["banh mi", "banh my", "bread", "baguette"],
    illegalFollowers: ["chao", "kebab", "doner", "que"],
    conflicts: [
      "banh mi chao",
      "banh mi kebab",
      "banh mi chay",
      "bo kho banh mi",
      "banh ca",
      "banh canh",
      "banh xeo",
      "banh ep",
      "banh cuon",
      "tra sua",
      "ca phe",
    ],
  },
  "banh mi chao": {
    strongSynonyms: ["banh mi chao", "chao banh mi", "chao cot dien"],
    synonyms: ["banh mi chao"],
    conflicts: ["banh mi kebab", "banh mi que", "banh mi thit", "banh mi pate"],
  },
  "banh mi kebab": {
    strongSynonyms: ["banh mi kebab", "banh mi doner", "doner kebab"],
    synonyms: ["banh mi kebab", "doner kebab"],
    conflicts: ["banh mi chao", "banh mi que", "banh mi thit", "banh mi pate"],
  },
  "com ga hoi an": {
    strongSynonyms: [
      "com ga hoi an",
      "com ga ba buoi",
      "com ga ba nga",
      "com ga xe hoi an",
      "com ga tam ky",
    ],
    synonyms: ["com ga hoi an"],
    illegalFollowers: ["xoi mo", "hai nam", "teriyaki", "sot", "quay"],
    conflicts: [
      "com ga xoi mo",
      "com ga hai nam",
      "com ga teriyaki",
      "com ga xao",
      "com ga sot cay",
      "com ga gion",
    ],
  },
  "com ga xoi mo": {
    strongSynonyms: ["com ga xoi mo", "com ga xoi mo su-si"],
    synonyms: ["com ga xoi mo", "ga xoi mo"],
    conflicts: ["com ga hoi an", "com ga hai nam", "com ga teriyaki"],
  },
  "com ga hai nam": {
    strongSynonyms: ["com ga hai nam", "com ga singapore"],
    synonyms: ["com ga hai nam", "ga hai nam"],
    conflicts: ["com ga hoi an", "com ga xoi mo", "com ga teriyaki"],
  },
  "chao vit": {
    strongSynonyms: ["chao vit", "chao goi vit", "vit co", "vit co van dinh"],
    synonyms: ["chao vit"],
    conflicts: [
      "chao long",
      "chao suon",
      "chao ga",
      "chao ech",
      "chao bo",
      "chao ca",
    ],
  },
  "chao long": {
    strongSynonyms: ["chao long", "long heo", "doi sun", "tiet canh"],
    synonyms: ["chao long"],
    conflicts: [
      "chao vit",
      "chao suon",
      "chao ga",
      "chao ech",
      "chao bo",
      "chao ca",
    ],
  },
  "chao suon": {
    strongSynonyms: ["chao suon", "chao suon sun"],
    synonyms: ["chao suon"],
    conflicts: [
      "chao long",
      "chao vit",
      "chao ga",
      "chao ech",
      "chao bo",
      "chao ca",
    ],
  },
  "chao ga": {
    strongSynonyms: ["chao ga", "chao ga ac", "chao goi ga"],
    synonyms: ["chao ga"],
    conflicts: [
      "chao long",
      "chao vit",
      "chao suon",
      "chao ech",
      "chao bo",
      "chao ca",
    ],
  },
  "pho bo": {
    strongSynonyms: [
      "pho bo gia truyen",
      "pho bo nam dinh",
      "pho bo tai nam",
      "pho bo sot vang",
      "pho bo",
    ],
    synonyms: ["pho bo", "pho"],
    conflicts: [
      "pho cuon",
      "bun bo",
      "bun dau",
      "com tam",
      "banh mi",
      "tra sua",
      "ca phe",
    ],
  },
  "pho cuon": {
    strongSynonyms: ["pho cuon huong mai", "pho cuon ngu xa", "pho cuon"],
    synonyms: ["pho cuon"],
    conflicts: ["pho bo", "pho ga", "bun bo"],
  },
  "pho ga": {
    strongSynonyms: ["pho ga", "pho ga ta", "pho ga chat"],
    synonyms: ["pho ga", "pho"],
    conflicts: ["pho cuon", "bun bo", "bun dau", "com tam", "tra sua", "ca phe"],
  },
  "com tam": {
    strongSynonyms: [
      "com tam sai gon",
      "com tam suon bi cha",
      "com tam ba ghieng",
      "com tam cali",
      "com tam moc",
    ],
    synonyms: ["com tam", "com suon"],
    conflicts: ["tra sua", "ca phe", "coffee", "banh mi", "che", "bakery"],
  },
  "mi quang": {
    strongSynonyms: [
      "mi quang da nang",
      "mi quang ba mua",
      "mi quang ech",
      "mi quang ga",
      "my quang",
    ],
    synonyms: ["mi quang", "my quang"],
    conflicts: ["tra sua", "ca phe", "coffee", "banh mi", "che"],
  },
  "banh canh cua": {
    strongSynonyms: ["banh canh cua", "banh canh ghe"],
    synonyms: ["banh canh cua", "banh canh"],
    conflicts: ["banh xeo", "banh ca", "banh cuon", "banh mi", "tra sua"],
  },
  "bun dau mam tom": {
    strongSynonyms: [
      "bun dau mam tom",
      "bun dau met",
      "bun dau pho co",
      "bun dau lang mo",
    ],
    synonyms: ["bun dau"],
    conflicts: [
      "bun cha ca",
      "bun bo",
      "bun rieu",
      "bun ca",
      "tra sua",
      "ca phe",
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

  // 1. Tra cứu quy tắc đặc biệt nếu có
  const rule = DISH_RULES[nDish];
  if (rule) {
    // 1.1. Strong Synonyms khẳng định tuyệt đối (VD: "Phở Nam Định & Bún Chả Hà Nội")
    if (rule.strongSynonyms?.some((s) => matchWholePhrase(nRest, s))) {
      return true;
    }

    // 1.2. Nếu chứa từ khóa xung đột -> Loại trừ ngay lập tức (VD: "Bún Chả Cá Tam Giác")
    if (rule.conflicts?.some((c) => matchWholePhrase(nRest, c))) {
      return false;
    }

    // 1.3. Khớp tên món chính nhưng kiểm soát nghiêm ngặt từ mở rộng (VD: "bún chả" không nhận "bún chả cá/giò")
    if (matchWholePhrase(nRest, nDish, rule.illegalFollowers)) {
      return true;
    }

    // 1.4. Khớp các từ đồng nghĩa được chấp nhận
    if (rule.synonyms?.some((s) => matchWholePhrase(nRest, s, rule.illegalFollowers))) {
      return true;
    }

    // Khi đã có rule riêng cho món đó mà không khớp, không được fallback bừa bãi
    return false;
  }

  // 2. Mặc định cho các món chưa có rule riêng:
  // Nếu quán chứa trọn vẹn cụm từ tên món -> Phù hợp!
  if (matchWholePhrase(nRest, nDish)) {
    return true;
  }

  // 3. Tách các từ chính của món đối với tên món dài (VD: "Burger bò phô mai & khoai tây")
  const dishWords = nDish
    .split(/\s+/)
    .filter((w) => !["va", "kem", "mot", "nguoi", "sot", "kieu"].includes(w));

  if (dishWords.length >= 3) {
    const matchCount = dishWords.filter((w) => matchWholePhrase(nRest, w)).length;
    // Yêu cầu khớp tối thiểu 70% từ chính
    if (matchCount / dishWords.length >= 0.7) {
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
