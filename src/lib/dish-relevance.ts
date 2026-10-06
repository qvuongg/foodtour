/**
 * Module kiểm tra độ phù hợp của quán ăn với món ăn (Dish Relevance Filter)
 * Ngăn chặn triệt để các quán sai lệch:
 * - Bún chả cá xuất hiện khi chọn Bún chả (Hà Nội)
 * - Quán mặn (Cơm cháy chà bông, Ngan cháy tỏi, Bá cháy bù chét) xuất hiện khi chọn Món Chay
 * - Bánh mì nấm chay xuất hiện khi chọn Mì nấm chay
 * - Quán chay xuất hiện khi chọn món mặn (Bún bò Huế, Phở bò)
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
 * Ví dụ: "Bún chả" không được khớp "Bún chả cá", "Bún chả giò" (illegalFollowers: ["ca", "gio"])
 *        "Mì nấm chay" không được khớp "Bánh mì nấm chay" (illegalPreceders: ["banh"])
 */
export function matchWholePhrase(
  text: string,
  phrase: string,
  illegalFollowers: string[] = [],
  illegalPreceders: string[] = [],
): boolean {
  if (!text || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let lookbehind = "";
  if (illegalPreceders.length > 0) {
    const precederPattern = illegalPreceders.join("|");
    lookbehind = `(?<!\\b(${precederPattern})\\s+)`;
  }
  let lookahead = "";
  if (illegalFollowers.length > 0) {
    const followerPattern = illegalFollowers.join("|");
    lookahead = `(?!\\s+(${followerPattern})(\\s|$|[^a-z0-9]))`;
  }
  const regex = new RegExp(
    `(^|[^a-z0-9])${lookbehind}${escaped}${lookahead}([^a-z0-9]|$)`,
    "i",
  );
  return regex.test(text);
}

/**
 * Kiểm tra xem món ăn có phải là món chay hay không
 */
export function isVegetarianDish(dishName: string): boolean {
  if (!dishName) return false;
  const n = normalizeText(dishName);
  return (
    n.includes("chay") ||
    n === "salad quinoa dau ga" ||
    n === "falafel kem pita"
  );
}

/**
 * Kiểm tra xem tên quán có thực sự là quán chay hay không
 * LOẠI TRỪ TRIỆT ĐỂ:
 * - Cơm cháy (gạo giòn chà bông)
 * - Ngan/Bò/Vịt/Lòng cháy tỏi
 * - Bá cháy (tiếng lóng Nam Bộ)
 * - Lẩu bò khu nhà cháy (địa danh)
 */
export function isRealVegetarianRestaurant(rawName: string): boolean {
  if (!rawName) return false;

  // 1. Phải có từ khóa đồ chay chuẩn (thanh ngang)
  const hasVegKeywords =
    /(^|[^\p{L}\p{N}])(chay|vegan|veggie|thu[aâầ]n\s*chay|th[uự]c\s*d[uư][oỡ]ng|[aâ]u\s*l[aạ]c|b[oồ]\s*[dđ][eề]|an\s*l[aạ]c|thi[eệ]n\s*t[aâ]m|tu[eệ]\s*t[aâ]m)([^\p{L}\p{N}]|$)/iu.test(
      rawName,
    );

  // 2. Chặn các quán mặn có từ "cháy" (dấu sắc: cơm cháy, cháy tỏi, bá cháy, nhà cháy, cháy cạnh)
  const hasChaySac =
    /\b(ch[aá]y\s*t[oỏ]i|c[oơ]m\s*ch[aá]y|b[aá]\s*ch[aá]y|nh[aà]\s*ch[aá]y|ch[aá]y\s*c[aạ]nh|ch[aá]y\s*m[aắ]m)\b/i.test(
      rawName,
    );
  if (hasChaySac && !hasVegKeywords) {
    return false;
  }

  // 3. Chặn nếu có chữ "cháy" độc lập mà không có từ khóa chay thanh ngang
  if (/\bch[aá]y\b/i.test(rawName) && !hasVegKeywords) {
    return false;
  }

  return hasVegKeywords;
}

/**
 * Danh sách từ khóa đặc thù và từ khóa xung đột của các món ăn phổ biến
 */
interface DishRule {
  strongSynonyms?: string[]; // Khẳng định mạnh mẽ (bỏ qua xung đột), VD: "bún chả hà nội", "bánh xèo tôm nhảy"
  synonyms?: string[]; // Từ đồng nghĩa hoặc tên mở rộng thông thường, VD: "nem cua bể", "nem lụi"
  illegalFollowers?: string[]; // Hậu tố gây biến tướng sang món khác, VD: "bún chả" + "cá/giò/sứa"
  illegalPreceders?: string[]; // Tiền tố gây biến tướng sang món khác, VD: "bánh" + "mì nấm chay"
  conflicts?: string[]; // Tên món khác dễ bị lẫn lộn, VD: "bun cha ca", "cha ca", "banh canh"...
}

export const DISH_RULES: Record<string, DishRule> = {
  // === MÓN CHAY (VEGETARIAN) ===
  "com chay": {
    strongSynonyms: [
      "com chay",
      "quan chay",
      "am thuc chay",
      "bep chay",
      "nha hang chay",
      "buffet chay",
      "thuan chay",
      "an chay",
      "loving hut",
      "au lac",
      "bo de",
      "an lac",
      "thien tam",
      "tue tam",
    ],
    synonyms: ["com chay", "quan chay"],
    conflicts: [
      "com chay", // Cơm cháy
      "ba chay",
      "chay toi",
      "chay canh",
      "com ga",
      "com tam",
      "com suon",
      "com heo",
      "com vit",
      "cha ca",
      "hai san",
    ],
  },
  "banh mi chay": {
    strongSynonyms: [
      "banh mi chay",
      "banh my chay",
      "vegan bread",
      "banh mi pate chay",
      "banh mi thuan chay",
    ],
    synonyms: ["banh mi chay", "banh my chay"],
    conflicts: [
      "com chay",
      "ba chay",
      "chay toi",
      "banh canh",
      "hu tieu",
      "banh mi thit",
      "banh mi heo quay",
      "banh mi cha ca",
    ],
  },
  "bun chay": {
    strongSynonyms: [
      "bun chay",
      "bun rieu chay",
      "bun bo chay",
      "bun bo hue chay",
      "bun hue chay",
      "bun mam chay",
      "bun moc chay",
      "bun nuoc tuong chay",
      "bun nam chay",
      "bun tron chay",
      "bun xao chay",
    ],
    synonyms: ["bun chay"],
    conflicts: [
      "ba chay",
      "chay toi",
      "bun cha ca",
      "bun thit nuong",
      "bun mam",
      "bun ngan",
      "bun vit",
    ],
  },
  "lau nam chay": {
    strongSynonyms: [
      "lau nam chay",
      "lau chay",
      "lau rau nam chay",
      "lau thai chay",
      "buffet lau chay",
      "lau rau nam",
    ],
    synonyms: ["lau nam chay", "lau chay"],
    conflicts: [
      "lau bo",
      "lau de",
      "lau ga",
      "lau ech",
      "lau vit",
      "lau hai san",
      "ba chay",
      "nha chay",
    ],
  },
  "mi nam chay": {
    strongSynonyms: [
      "mi nam chay",
      "my nam chay",
      "mi y nam chay",
      "mi chay",
      "my chay",
      "mi xao chay",
      "mi quang chay",
      "hu tieu mi chay",
      "spaghetti vegetarian",
    ],
    synonyms: ["mi nam chay", "my nam chay"],
    illegalPreceders: ["banh"], // Chặn triệt để "bánh mì nấm chay"
    conflicts: [
      "banh mi",
      "banh my",
      "com chay",
      "ba chay",
      "chay toi",
      "mi vit tiem",
      "mi xao bo",
      "mi cay",
    ],
  },
  "goi cuon chay": {
    strongSynonyms: [
      "goi cuon chay",
      "bi cuon chay",
      "cuon chay",
      "cuon rau nam",
      "nem cuon chay",
      "goi cuon healthy",
    ],
    synonyms: ["goi cuon chay", "bi cuon chay"],
    conflicts: [
      "ba chay",
      "com chay",
      "chay toi",
      "goi cuon tom thit",
      "goi cuon thit heo",
      "bo bia",
    ],
  },
  "salad quinoa dau ga": {
    strongSynonyms: [
      "salad quinoa",
      "quinoa",
      "dau ga",
      "chickpea",
      "salad chay",
      "healthy salad",
      "eat clean",
    ],
    synonyms: ["salad quinoa", "dau ga", "quinoa"],
  },
  "falafel kem pita": {
    strongSynonyms: ["falafel", "pita", "middle eastern", "trung dong"],
    synonyms: ["falafel"],
  },

  // === MÓN MẶN PHỔ BIẾN ===
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
 * Kiểm tra xem món ăn có phải là đồ uống hay không
 */
export function isBeverageDish(dishName: string): boolean {
  if (!dishName) return false;
  const n = normalizeText(dishName);
  const DRINK_TERMS = [
    "ca phe", "cafe", "bac xiu", "latte", "cappuccino", "americano", "espresso",
    "cold brew", "u lanh", "cacao", "tra sua", "milktea", "tra dao", "tra vai",
    "tra chanh", "tra tac", "tra sen", "tra dau", "tra xoai", "tra mang cau",
    "tra nhan", "hong tra", "tra xanh", "tra o long", "tra", "nuoc ep", "sinh to",
    "matcha", "rau ma", "nuoc mia", "nuoc dua", "sua dau", "sam bi dao", "nuoc sam",
    "nuoc mo", "nuoc sau", "sua hat", "sua chua", "soda", "nuoc loc"
  ];
  return DRINK_TERMS.some((t) => n.includes(t));
}

/**
 * Kiểm tra xem quán ăn có bán đồ uống phù hợp với món đồ uống đang chọn hay không
 */
export function isBeverageRestaurantMatch(restaurantName: string, dishName: string): boolean {
  const nRest = normalizeText(restaurantName);
  const nDish = normalizeText(dishName);

  // 1. Chặn quán thuần ăn mặn không phải quán nước
  const isPureSavory =
    /\b(pho|bun|com|banh canh|hu tieu|mi quang|lau|hai san|oc|chao|banh cuon|banh xeo)\b/i.test(nRest) &&
    !/\b(ca phe|cafe|coffee|tra|juice|smoothie|sinh to|nuoc ep|milktea)\b/i.test(nRest);
  if (isPureSavory) return false;

  // 2. Nhóm Cà phê
  const isCoffeeDish = /\b(ca phe|cafe|bac xiu|latte|cappuccino|americano|espresso|cold brew|u lanh|cacao)\b/i.test(nDish);
  if (isCoffeeDish) {
    return /\b(ca phe|cafe|coffee|roastery|phin|highlands|phuc long|katinat|starbucks|cong ca phe|the coffee house|aha|milano|trung nguyen|tiem ca phe|quan ca phe)\b/i.test(nRest);
  }

  // 3. Nhóm Trà Sữa & Boba
  const isMilkTeaDish = /\b(tra sua|milktea|tran chau|duong den|khoai mon|matcha|hojicha)\b/i.test(nDish);
  if (isMilkTeaDish) {
    return /\b(tra sua|milktea|tea|tiem tra|mixue|tocotoco|phuc long|phe la|katinat|gong cha|koi the|ding tea|bobapop|chago|do do|dau dau|hidu|tealive|tra)\b/i.test(nRest);
  }

  // 4. Nhóm Trà Trái Cây & Trà Chanh
  const isFruitTeaDish = /\b(tra dao|tra vai|tra chanh|tra tac|tra sen|tra dau|tra xoai|tra mang cau|tra nhan|hong tra|tra xanh|tra o long|tra|nuoc chanh)\b/i.test(nDish);
  if (isFruitTeaDish) {
    return /\b(tra|tea|tiem tra|tra chanh|tra sua|milktea|mixue|phuc long|phe la|katinat|gong cha|tocotoco|highlands|cafe|coffee|ca phe)\b/i.test(nRest);
  }

  // 5. Nhóm Sinh Tố & Nước Ép & Detox
  const isJuiceDish = /\b(sinh to|nuoc ep|juice|smoothie|detox)\b/i.test(nDish);
  if (isJuiceDish) {
    return /\b(sinh to|nuoc ep|juice|smoothie|detox|trai cay|hoa qua|katinat|phuc long)\b/i.test(nRest);
  }

  // 6. Nhóm Giải Khát Truyền Thống & Khác
  if (nDish.includes("rau ma")) return /\b(rau ma|nuoc rau ma)\b/i.test(nRest);
  if (nDish.includes("nuoc mia")) return /\b(nuoc mia|mia)\b/i.test(nRest);
  if (nDish.includes("nuoc dua")) return /\b(nuoc dua|dua|dua tuoi)\b/i.test(nRest);
  if (nDish.includes("sam") || nDish.includes("bi dao")) return /\b(sam|bi dao|nuoc sam)\b/i.test(nRest);
  if (nDish.includes("sua chua")) return /\b(sua chua|yogurt|che|tra)\b/i.test(nRest);
  if (nDish.includes("soda")) return /\b(soda|cafe|coffee|ca phe|tra)\b/i.test(nRest);
  if (nDish.includes("mo") || nDish.includes("sau")) return /\b(cafe|coffee|ca phe|tra|nuoc sau|nuoc mo)\b/i.test(nRest);

  return /\b(ca phe|cafe|coffee|tra|tea|juice|smoothie|sinh to|nuoc ep)\b/i.test(nRest);
}

/**
 * Kiểm tra xem một quán ăn có thực sự phù hợp với món ăn đang chọn hay không
 */
export function isRestaurantRelevantForDish(
  restaurantName: string,
  dishName: string,
): boolean {
  if (!restaurantName || !dishName) return false;

  const isVeg = isVegetarianDish(dishName);
  const restIsVeg = isRealVegetarianRestaurant(restaurantName);

  // 1. RÀNG BUỘC MÓN CHAY (VEGETARIAN SHIELD):
  // 1.1. Nếu người dùng chọn món CHAY: Quán BẮT BUỘC phải là quán chay chuẩn.
  // Tuyệt đối chặn các quán mặn (Cơm cháy chà bông, Ngan cháy tỏi, Bá cháy, Lẩu bò nhà cháy...)
  if (isVeg && !restIsVeg) {
    return false;
  }

  // 1.2. Nếu người dùng chọn món MẶN: Quán thuần chay không được nhận món mặn
  // (trừ khi quán ghi rõ phục vụ cả 2: "Chay & Mặn")
  if (!isVeg && restIsVeg) {
    const n = normalizeText(restaurantName);
    if (!n.includes("chay & man") && !n.includes("chay va man")) {
      return false;
    }
  }

  // 2. RÀNG BUỘC ĐỒ UỐNG (BEVERAGE MATCHER):
  if (isBeverageDish(dishName)) {
    return isBeverageRestaurantMatch(restaurantName, dishName);
  }

  const nRest = normalizeText(restaurantName);
  const nDish = normalizeText(dishName);

  // 3. Tra cứu quy tắc đặc biệt nếu có
  const rule = DISH_RULES[nDish];
  if (rule) {
    // 3.1. Strong Synonyms khẳng định tuyệt đối (VD: "Phở Nam Định & Bún Chả Hà Nội")
    if (
      rule.strongSynonyms?.some((s) =>
        matchWholePhrase(nRest, s, rule.illegalFollowers, rule.illegalPreceders),
      )
    ) {
      return true;
    }

    // 2.2. Nếu chứa từ khóa xung đột -> Loại trừ ngay lập tức (VD: "Bún Chả Cá Tam Giác", "Bánh Mì Nấm Chay")
    if (rule.conflicts?.some((c) => matchWholePhrase(nRest, c))) {
      return false;
    }

    // 2.3. Khớp tên món chính nhưng kiểm soát nghiêm ngặt từ mở rộng
    if (
      matchWholePhrase(nRest, nDish, rule.illegalFollowers, rule.illegalPreceders)
    ) {
      return true;
    }

    // 2.4. Khớp các từ đồng nghĩa được chấp nhận
    if (
      rule.synonyms?.some((s) =>
        matchWholePhrase(nRest, s, rule.illegalFollowers, rule.illegalPreceders),
      )
    ) {
      return true;
    }

    // Khi đã có rule riêng cho món đó mà không khớp, không được fallback bừa bãi
    return false;
  }

  // 3. Mặc định cho các món chưa có rule riêng:
  // Nếu quán chứa trọn vẹn cụm từ tên món -> Phù hợp!
  if (matchWholePhrase(nRest, nDish)) {
    return true;
  }

  // 4. Tách các từ chính của món đối với tên món dài (VD: "Burger bò phô mai & khoai tây")
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

  return restaurants.filter((r) =>
    isRestaurantRelevantForDish(r.name, dishName),
  );
}

