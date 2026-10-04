import { priceRarity } from './case-mechanics';
export type MealPeriod = "breakfast" | "lunch" | "afternoon" | "dinner" | "late" | "night";
export type Food = {
  customId?: string;
  name: string;
  nameEn?: string;
  sub: string;
  price: number;
  rarity: number;
  image: number;
  veg?: boolean;
  quip: string;
  kind?: string;
  category?: string;
  meals?: (MealPeriod | string)[];
  serving?: string;
  groupMeal?: boolean;
};
// Approximate lunch portion prices in thousands of VND, not restaurant quotes.
export const foods:Food[]=[
  {
    "name": "Cơm tấm",
    "sub": "Sườn bì chả • Việt Nam",
    "price": 45,
    "image": 0,
    "quip": "Sườn có thể gãy. Kèo này thì không."
  },
  {
    "name": "Phở bò",
    "sub": "Tái nạm • Việt Nam",
    "price": 55,
    "image": 1,
    "quip": "Đời có thể nhạt. Nước phở thì không."
  },
  {
    "name": "Bánh mì",
    "sub": "Thịt nướng • Việt Nam",
    "price": 25,
    "image": 2,
    "quip": "Vũ khí cận chiến của dân văn phòng."
  },
  {
    "name": "Bún chả",
    "sub": "Chả nướng • Việt Nam",
    "price": 50,
    "image": 3,
    "quip": "Một pha gắp chả đi vào lòng người."
  },
  {
    "name": "Sushi cá hồi",
    "sub": "Cá hồi • Nhật Bản",
    "price": 150,
    "image": 4,
    "quip": "Legendary drop. Ví bạn vừa disconnect."
  },
  {
    "name": "Pizza",
    "sub": "Phô mai • Ý",
    "price": 100,
    "image": 5,
    "quip": "Một miếng cho bạn. Phần còn lại cũng vậy."
  },
  {
    "name": "Gà rán",
    "sub": "Giòn cay • Quốc tế",
    "price": 65,
    "image": 6,
    "quip": "Winner winner, chicken lunch."
  },
  {
    "name": "Cơm chay",
    "sub": "Đậu hũ & rau • Việt Nam",
    "price": 35,
    "image": 7,
    "veg": true,
    "quip": "Ăn chay nhưng chiến hết mình."
  },
  {
    "name": "Bibimbap",
    "sub": "Cơm trộn • Hàn Quốc",
    "price": 85,
    "image": 8,
    "quip": "Trộn cơm. Đừng trộn deadline."
  },
  {
    "name": "Cơm gà Hội An",
    "sub": "Món ăn trưa",
    "price": 45,
    "image": 9,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bún bò Huế",
    "sub": "Món ăn trưa",
    "price": 50,
    "image": 10,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Hủ tiếu",
    "sub": "Món ăn trưa",
    "price": 40,
    "image": 11,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Mì Quảng",
    "sub": "Món ăn trưa",
    "price": 45,
    "image": 12,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bún thịt nướng",
    "sub": "Món ăn trưa",
    "price": 40,
    "image": 13,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bánh cuốn",
    "sub": "Món ăn trưa",
    "price": 35,
    "image": 14,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bún đậu mắm tôm",
    "sub": "Món ăn trưa",
    "price": 55,
    "image": 15,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Cơm rang dưa bò",
    "sub": "Món ăn trưa",
    "price": 50,
    "image": 16,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bò lúc lắc",
    "sub": "Món ăn trưa",
    "price": 85,
    "image": 17,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bánh xèo",
    "sub": "Món ăn trưa",
    "price": 50,
    "image": 18,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bánh đa cua",
    "sub": "Món ăn trưa",
    "price": 45,
    "image": 19,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Mì xào bò",
    "sub": "Món ăn trưa",
    "price": 45,
    "image": 20,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Bún cá",
    "sub": "Món ăn trưa",
    "price": 40,
    "image": 21,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Gỏi cuốn",
    "sub": "Món ăn trưa",
    "price": 35,
    "image": 22,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Cháo sườn",
    "sub": "Món ăn trưa",
    "price": 25,
    "image": 23,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Ramen",
    "sub": "Món ăn trưa",
    "price": 100,
    "image": 24,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Udon",
    "sub": "Món ăn trưa",
    "price": 85,
    "image": 25,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Cơm cà ri Nhật",
    "sub": "Món ăn trưa",
    "price": 90,
    "image": 26,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Tteokbokki",
    "sub": "Món ăn trưa",
    "price": 65,
    "image": 27,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Burger bò",
    "sub": "Món ăn trưa",
    "price": 65,
    "image": 28,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Mì Ý bò bằm",
    "sub": "Món ăn trưa",
    "price": 80,
    "image": 29,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Pad Thai",
    "sub": "Món ăn trưa",
    "price": 75,
    "image": 30,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Mì Tom Yum",
    "sub": "Món ăn trưa",
    "price": 80,
    "image": 31,
    "veg": false,
    "quip": ""
  },
  {
    "name": "Lẩu nấm chay",
    "sub": "Chay",
    "price": 120,
    "image": 32,
    "veg": true,
    "quip": ""
  },
  {
    "name": "Mì nấm chay",
    "sub": "Chay",
    "price": 40,
    "image": 33,
    "veg": true,
    "quip": ""
  },
  {
    "name": "Bánh mì chay",
    "sub": "Chay",
    "price": 25,
    "image": 34,
    "veg": true,
    "quip": ""
  },
  {
    "name": "Gỏi cuốn chay",
    "sub": "Chay",
    "price": 35,
    "image": 35,
    "veg": true,
    "quip": ""
  },
  {
    "name": "Cơm bình dân",
    "price": 40,
    "image": 36,
    "sub": "Chọn món mặn, rau & canh",
    "quip": ""
  },
  {
    "name": "Cơm gà xối mỡ",
    "price": 55,
    "image": 39,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Bún riêu",
    "price": 45,
    "image": 42,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Bánh canh cua",
    "price": 60,
    "image": 43,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Bò né",
    "price": 75,
    "image": 44,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm gà teriyaki",
    "price": 85,
    "image": 45,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm heo chiên xù",
    "price": 95,
    "image": 46,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm chiên hải sản",
    "price": 85,
    "image": 47,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Mì vịt tiềm",
    "price": 95,
    "image": 48,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Kimbap",
    "price": 70,
    "image": 49,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Mì trộn Hàn Quốc",
    "price": 75,
    "image": 50,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Salad ức gà",
    "price": 85,
    "image": 51,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Mì Ý sốt kem bacon",
    "price": 115,
    "image": 52,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Lasagna bò",
    "price": 125,
    "image": 53,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Burger bò phô mai & khoai tây",
    "price": 120,
    "image": 54,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Pizza pepperoni",
    "price": 120,
    "image": 55,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm bò gyudon",
    "price": 110,
    "image": 56,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm cá saba nướng",
    "price": 110,
    "image": 57,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Mì soba Nhật",
    "price": 110,
    "image": 58,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm cà ri Thái",
    "price": 110,
    "image": 59,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Salad cá ngừ",
    "price": 110,
    "image": 60,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Salad quinoa đậu gà",
    "price": 115,
    "image": 61,
    "veg": true,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Bò bít tết",
    "price": 180,
    "image": 62,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cá hồi áp chảo",
    "price": 190,
    "image": 63,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm lươn Nhật",
    "price": 180,
    "image": 64,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm bò nướng Hàn",
    "price": 150,
    "image": 65,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Cơm cá hồi teriyaki",
    "price": 150,
    "image": 66,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Poke cá hồi",
    "price": 160,
    "image": 67,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Sườn nướng BBQ",
    "price": 230,
    "image": 68,
    "sub": "Kèm cơm hoặc khoai tây • Phần một người",
    "quip": ""
  },
  {
    "name": "Pizza hải sản",
    "price": 160,
    "image": 69,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Mì Ý hải sản",
    "price": 160,
    "image": 70,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Lẩu bò cá nhân",
    "price": 160,
    "image": 71,
    "sub": "Phần ăn trưa / người",
    "quip": ""
  },
  {
    "name": "Phở gà",
    "price": 55,
    "sub": "Tô thường • Việt Nam",
    "veg": false,
    "image": 72,
    "quip": ""
  },
  {
    "name": "Phở cuốn",
    "price": 70,
    "sub": "Phần 10 cuốn • Việt Nam",
    "veg": false,
    "image": 73,
    "quip": ""
  },
  {
    "name": "Bún mọc",
    "price": 45,
    "sub": "Tô thường • Việt Nam",
    "veg": false,
    "image": 74,
    "quip": ""
  },
  {
    "name": "Bún măng vịt",
    "price": 60,
    "sub": "Tô có thịt vịt • Việt Nam",
    "veg": false,
    "image": 75,
    "quip": ""
  },
  {
    "name": "Bún bò Nam Bộ",
    "price": 60,
    "sub": "Bún trộn bò • Việt Nam",
    "veg": false,
    "image": 76,
    "quip": ""
  },
  {
    "name": "Bún mắm",
    "price": 65,
    "sub": "Tô hải sản • Việt Nam",
    "veg": false,
    "image": 77,
    "quip": ""
  },
  {
    "name": "Bún chay",
    "price": 35,
    "sub": "Đậu hũ & rau • Việt Nam",
    "veg": true,
    "image": 78,
    "quip": ""
  },
  {
    "name": "Bánh canh giò heo",
    "price": 50,
    "sub": "Tô thường • Việt Nam",
    "veg": false,
    "image": 79,
    "quip": ""
  },
  {
    "name": "Miến gà",
    "price": 55,
    "sub": "Tô thường • Việt Nam",
    "veg": false,
    "image": 80,
    "quip": ""
  },
  {
    "name": "Miến lươn",
    "price": 65,
    "sub": "Tô thường • Việt Nam",
    "veg": false,
    "image": 81,
    "quip": ""
  },
  {
    "name": "Cháo vịt",
    "price": 55,
    "sub": "Phần có thịt vịt • Việt Nam",
    "veg": false,
    "image": 82,
    "quip": ""
  },
  {
    "name": "Cháo lòng",
    "price": 40,
    "sub": "Phần có lòng • Việt Nam",
    "veg": false,
    "image": 83,
    "quip": ""
  },
  {
    "name": "Bánh hỏi heo quay",
    "price": 50,
    "sub": "Một phần • Việt Nam",
    "veg": false,
    "image": 84,
    "quip": ""
  },
  {
    "name": "Nem nướng",
    "price": 55,
    "sub": "Phần cuốn đủ bữa • Việt Nam",
    "veg": false,
    "image": 85,
    "quip": ""
  },
  {
    "name": "Dimsum",
    "price": 130,
    "sub": "Khoảng 3 xửng / người",
    "veg": false,
    "image": 86,
    "quip": ""
  },
  {
    "name": "Mì hoành thánh",
    "price": 60,
    "sub": "Tô mì & hoành thánh",
    "veg": false,
    "image": 87,
    "quip": ""
  },
  {
    "name": "Mì bò Đài Loan",
    "price": 85,
    "sub": "Bò hầm & mì • Đài Loan",
    "veg": false,
    "image": 88,
    "quip": ""
  },
  {
    "name": "Mì xào giòn",
    "price": 70,
    "sub": "Hải sản & rau củ",
    "veg": false,
    "image": 89,
    "quip": ""
  },
  {
    "name": "Cơm niêu Singapore",
    "price": 85,
    "sub": "Một niêu / người",
    "veg": false,
    "image": 90,
    "quip": ""
  },
  {
    "name": "Cơm gà Hải Nam",
    "price": 75,
    "sub": "Gà luộc & cơm thơm",
    "veg": false,
    "image": 91,
    "quip": ""
  },
  {
    "name": "Cơm gà trứng Nhật",
    "price": 100,
    "sub": "Oyakodon • Nhật Bản",
    "veg": false,
    "image": 92,
    "quip": ""
  },
  {
    "name": "Cơm tempura",
    "price": 130,
    "sub": "Tendon • Nhật Bản",
    "veg": false,
    "image": 93,
    "quip": ""
  },
  {
    "name": "Mì cay Hàn Quốc",
    "price": 65,
    "sub": "Một tô • Hàn Quốc",
    "veg": false,
    "image": 94,
    "quip": ""
  },
  {
    "name": "Mì tương đen",
    "price": 70,
    "sub": "Jajangmyeon • Hàn Quốc",
    "veg": false,
    "image": 95,
    "quip": ""
  },
  {
    "name": "Mì lạnh Hàn Quốc",
    "price": 95,
    "sub": "Naengmyeon • Hàn Quốc",
    "veg": false,
    "image": 96,
    "quip": ""
  },
  {
    "name": "Canh kimchi kèm cơm",
    "price": 85,
    "sub": "Kimchi jjigae • Hàn Quốc",
    "veg": false,
    "image": 97,
    "quip": ""
  },
  {
    "name": "Canh đậu hũ non kèm cơm",
    "price": 85,
    "sub": "Sundubu jjigae • Hàn Quốc",
    "veg": false,
    "image": 98,
    "quip": ""
  },
  {
    "name": "Gà phô mai Hàn Quốc",
    "price": 120,
    "sub": "Phần một người",
    "veg": false,
    "image": 99,
    "quip": ""
  },
  {
    "name": "Cơm chiên kimchi",
    "price": 65,
    "sub": "Kimchi bokkeumbap • Hàn Quốc",
    "veg": false,
    "image": 100,
    "quip": ""
  },
  {
    "name": "Lẩu Thái một người",
    "price": 130,
    "sub": "Kèm bún hoặc mì",
    "veg": false,
    "image": 101,
    "quip": ""
  },
  {
    "name": "Lẩu sukiyaki một người",
    "price": 220,
    "sub": "Thịt, rau & mì • Nhật Bản",
    "veg": false,
    "image": 102,
    "quip": ""
  },
  {
    "name": "Cà ri Ấn Độ & naan",
    "price": 220,
    "sub": "Cà ri gà kèm bánh naan",
    "veg": false,
    "image": 103,
    "quip": ""
  },
  {
    "name": "Cơm biryani",
    "price": 190,
    "sub": "Cơm gia vị & gà • Ấn Độ",
    "veg": false,
    "image": 104,
    "quip": ""
  },
  {
    "name": "Bánh xèo Nhật",
    "price": 110,
    "sub": "Okonomiyaki • Nhật Bản",
    "veg": false,
    "image": 105,
    "quip": ""
  },
  {
    "name": "Sandwich",
    "price": 80,
    "sub": "Phần bánh kẹp đủ bữa",
    "veg": false,
    "image": 106,
    "quip": ""
  },
  {
    "name": "Bánh mì kebab",
    "price": 35,
    "sub": "Doner kebab • Thổ Nhĩ Kỳ",
    "veg": false,
    "image": 107,
    "quip": ""
  },
  {
    "name": "Bánh cuộn gà",
    "price": 95,
    "sub": "Chicken wrap",
    "veg": false,
    "image": 108,
    "quip": ""
  },
  {
    "name": "Burrito",
    "price": 150,
    "sub": "Cuộn cơm, đậu & thịt • Mexico",
    "veg": false,
    "image": 109,
    "quip": ""
  },
  {
    "name": "Taco",
    "price": 150,
    "sub": "Phần 3 bánh • Mexico",
    "veg": false,
    "image": 110,
    "quip": ""
  },
  {
    "name": "Quesadilla",
    "price": 140,
    "sub": "Phô mai & gà • Mexico",
    "veg": false,
    "image": 111,
    "quip": ""
  },
  {
    "name": "Fish & chips",
    "price": 170,
    "sub": "Cá chiên & khoai tây",
    "veg": false,
    "image": 112,
    "quip": ""
  },
  {
    "name": "Gà nướng kèm khoai tây",
    "price": 140,
    "sub": "Phần một người",
    "veg": false,
    "image": 113,
    "quip": ""
  },
  {
    "name": "Mac & cheese",
    "price": 150,
    "sub": "Nui phô mai • Phần chính",
    "veg": false,
    "image": 114,
    "quip": ""
  },
  {
    "name": "Mì Ý pesto",
    "price": 170,
    "sub": "Húng quế & gà • Ý",
    "veg": false,
    "image": 115,
    "quip": ""
  },
  {
    "name": "Mì Ý cá hồi",
    "price": 230,
    "sub": "Sốt kem cá hồi • Ý",
    "veg": false,
    "image": 116,
    "quip": ""
  },
  {
    "name": "Cơm risotto",
    "price": 260,
    "sub": "Cơm Ý • Phần chính",
    "veg": false,
    "image": 117,
    "quip": ""
  },
  {
    "name": "Gnocchi",
    "price": 250,
    "sub": "Bánh khoai tây kiểu Ý",
    "veg": false,
    "image": 118,
    "quip": ""
  },
  {
    "name": "Falafel kèm pita",
    "price": 150,
    "sub": "Đậu gà, rau & bánh pita",
    "veg": true,
    "image": 119,
    "quip": ""
  },
{
  "name": "Nui xào bò",
  "price": 50,
  "sub": "Nui, bò & rau • Việt Nam",
  "quip": "Nui deadline lại. Ăn trước đã.",
  "image": 120
},
{
  "name": "Cháo gà",
  "price": 45,
  "sub": "Gà xé & hành tiêu • Việt Nam",
  "quip": "Một bát hồi máu giữa giờ làm.",
  "image": 121
},
{
  "name": "Bò kho bánh mì",
  "price": 65,
  "sub": "Bò hầm & bánh mì • Việt Nam",
  "quip": "Chấm bánh mì. Đừng chấm công muộn.",
  "image": 122
},
{
  "name": "Xôi mặn",
  "price": 35,
  "sub": "Gà, thịt hoặc chả • Việt Nam",
  "quip": "Dẻo dai đến hết ca chiều.",
  "image": 123
},
{
  "name": "Bánh mì chảo",
  "price": 45,
  "sub": "Trứng, pa tê & xúc xích • Việt Nam",
  "quip": "Nóng hơn cả nhóm chat công ty.",
  "image": 124
},
{
  "name": "Cơm xá xíu",
  "price": 55,
  "sub": "Thịt xá xíu & cơm • Món Hoa",
  "quip": "Xá xíu một chút. No cả buổi.",
  "image": 125
},
{
  "name": "Cơm vịt quay",
  "price": 75,
  "sub": "Vịt quay & cơm • Món Hoa",
  "quip": "Da giòn. Tinh thần cũng lên.",
  "image": 126
},
{
  "name": "Mì xá xíu",
  "price": 55,
  "sub": "Mì trứng & thịt xá xíu • Món Hoa",
  "quip": "Sợi mì dài hơn thời gian nghỉ trưa.",
  "image": 127
},
{
  "name": "Mì udon xào",
  "price": 110,
  "sub": "Hải sản & rau • Nhật Bản",
  "quip": "Sợi to. Kèo thơm.",
  "image": 128
},
{
  "name": "Burger gà & khoai tây",
  "price": 80,
  "sub": "Gà giòn & khoai tây • Quốc tế",
  "quip": "Cắn một phát. Hết phân vân.",
  "image": 129
},
{
  "name": "Mì Ý sốt cà chua & phô mai",
  "price": 170,
  "sub": "Cà chua & mascarpone • Ý",
  "quip": "Sốt cà chua cứu một ngày nhạt nhẽo.",
  "image": 130
},
{
  "name": "Miến xào",
  "price": 55,
  "sub": "Thịt & rau • Việt Nam",
  "quip": "Miến này không phải miếng mồi deadline.",
  "image": 131
}
,
{
  "name": "Cơm đậu hũ Mapo",
  "nameEn": "Mapo tofu with rice",
  "sub": "Đậu hũ, thịt heo băm, sốt tê cay và cơm • Trung Quốc",
  "price": 80,
  "image": 168,
  "quip": "Tê cay vừa đủ để quên câu hỏi ăn gì.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cơm gà Kung Pao",
  "nameEn": "Kung Pao chicken with rice",
  "sub": "Gà xào đậu phộng, ớt khô, hành và cơm • Trung Quốc",
  "price": 95,
  "image": 169,
  "quip": "Gà, đậu phộng và một bữa trưa có đáp án.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Mì Dan Dan Tứ Xuyên",
  "nameEn": "Sichuan Dan Dan noodles",
  "sub": "Mì lúa mì, thịt heo băm, cải muối và dầu ớt • Trung Quốc",
  "price": 160,
  "image": 170,
  "quip": "Trộn đều rồi để đũa quyết định.",
  "category": "noodles",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cháo thịt nạc trứng bắc thảo",
  "nameEn": "Pork & century egg congee",
  "sub": "Cháo gạo, thịt heo nạc, trứng bắc thảo và gừng • Trung Quốc",
  "price": 50,
  "image": 171,
  "quip": "Một bát cháo ấm cho ngày cần chậm lại.",
  "category": "hotpot",
  "meals": [
    "breakfast",
    "lunch",
    "dinner",
    "late"
  ]
},
{
  "name": "Cơm heo xào cay Jeyuk",
  "nameEn": "Spicy pork Jeyuk with rice",
  "sub": "Thịt heo xào tương ớt, hành tây và cơm • Hàn Quốc",
  "price": 100,
  "image": 172,
  "quip": "Bữa trưa cay một chút, đỡ nhạt một ngày.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Gà hầm sâm Samgyetang",
  "nameEn": "Ginseng chicken soup Samgyetang",
  "sub": "Gà non nhồi gạo nếp, nhân sâm, tỏi và táo tàu • Hàn Quốc",
  "price": 250,
  "image": 173,
  "quip": "Gà hầm nóng hổi, cứ thong thả thưởng thức.",
  "category": "hotpot",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Canh sườn bò Galbitang kèm cơm",
  "nameEn": "Beef short rib soup Galbitang with rice",
  "sub": "Sườn bò hầm củ cải, hành lá và cơm trắng • Hàn Quốc",
  "price": 270,
  "image": 174,
  "quip": "Canh nóng, cơm trắng, bữa này đã đủ.",
  "category": "hotpot",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Mì Kalguksu hải sản",
  "nameEn": "Seafood knife-cut noodles Kalguksu",
  "sub": "Mì cắt dao, nghêu, tôm và nước dùng hải sản • Hàn Quốc",
  "price": 150,
  "image": 175,
  "quip": "Mì tươi và vị biển trong một tô.",
  "category": "noodles",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cơm cuộn trứng Omurice",
  "nameEn": "Japanese omelette rice Omurice",
  "sub": "Cơm chiên gà bọc trứng, sốt cà chua • Nhật Bản",
  "price": 75,
  "image": 176,
  "quip": "Mở lớp trứng, gặp cơm gà bên trong.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cơm heo xào gừng Shogayaki",
  "nameEn": "Ginger pork Shogayaki with rice",
  "sub": "Heo áp chảo sốt gừng, bắp cải và cơm • Nhật Bản",
  "price": 80,
  "image": 177,
  "quip": "Thơm gừng rồi, đến giờ nghỉ trưa thôi.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cơm thịt băm Hambagu",
  "nameEn": "Hamburg steak Hambagu with rice",
  "sub": "Thịt bò, heo băm áp chảo, sốt nâu và cơm • Nhật Bản",
  "price": 120,
  "image": 178,
  "quip": "Thịt mềm, sốt nâu, cơm trắng chờ sẵn.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Cơm trà cá hồi Ochazuke",
  "nameEn": "Salmon green tea rice Ochazuke",
  "sub": "Cơm chan trà và dashi, cá hồi chín, rong biển • Nhật Bản",
  "price": 100,
  "image": 179,
  "quip": "Cơm chan trà, một bữa nhẹ nhàng.",
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Masala dosa",
  "nameEn": "Masala dosa",
  "sub": "Bánh gạo đậu nhân khoai tây, sambar và chutney • Nam Ấn Độ",
  "price": 115,
  "image": 180,
  "quip": "Bánh giòn ôm khoai tây thơm gia vị.",
  "veg": true,
  "category": "bread",
  "meals": [
    "breakfast",
    "lunch",
    "dinner"
  ]
},
{
  "name": "Chole bhature",
  "nameEn": "Chole bhature",
  "sub": "Đậu gà nấu gia vị, 2 bánh bhature chiên • Bắc Ấn Độ",
  "price": 165,
  "image": 181,
  "quip": "Bẻ bánh, chấm đậu gà, hết phân vân.",
  "veg": true,
  "category": "bread",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Palak paneer kèm cơm",
  "nameEn": "Palak paneer with rice",
  "sub": "Phô mai paneer sốt cải bó xôi, cơm basmati • Bắc Ấn Độ",
  "price": 200,
  "image": 182,
  "quip": "Xanh màu cải bó xôi, béo vị paneer.",
  "veg": true,
  "category": "rice",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Gà tandoori kèm naan",
  "nameEn": "Tandoori chicken with naan",
  "sub": "Gà nướng ướp sữa chua, gia vị, bánh naan • Bắc Ấn Độ",
  "price": 220,
  "image": 183,
  "quip": "Gà thơm lò nướng, xé naan ăn cùng.",
  "category": "grill",
  "meals": [
    "lunch",
    "dinner"
  ]
},
{
  "name": "Bánh mì trứng",
  "nameEn": "Egg banh mi",
  "sub": "Trứng ốp la, dưa leo và đồ chua • Một phần / người",
  "price": 25,
  "image": 600,
  "quip": "Trứng ốp la lòng đào, bữa sáng giòn rụm nhanh gọn.",
  "category": "bread",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon",
    "late"
  ]
},
{
  "name": "Xôi xéo",
  "nameEn": "Sticky rice with mung bean",
  "sub": "Nếp, đậu xanh và hành phi • Một phần / người",
  "price": 25,
  "image": 601,
  "quip": "Hành phi thơm lừng, xôi dẻo bùi đậu xanh.",
  "veg": true,
  "category": "rice",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon"
  ]
},
{
  "name": "Xôi bắp",
  "nameEn": "Corn sticky rice",
  "sub": "Nếp, bắp, đậu xanh và hành phi • Một phần / người",
  "price": 25,
  "image": 602,
  "quip": "Hạt bắp ngọt bùi, ăn sáng hay ăn xế đều ấm bụng.",
  "veg": true,
  "category": "rice",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon"
  ]
},
{
  "name": "Xôi đậu xanh",
  "nameEn": "Mung bean sticky rice",
  "sub": "Nếp đậu xanh, muối mè đậu phộng • Một phần / người",
  "price": 20,
  "image": 603,
  "quip": "Muối mè béo ngậy, nếp đậu xanh ngọt thanh thuần khiết.",
  "veg": true,
  "category": "rice",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon"
  ]
},
{
  "name": "Bánh bao nhân thịt",
  "nameEn": "Pork steamed bun",
  "sub": "Thịt heo, nấm và trứng • Một phần / người",
  "price": 25,
  "image": 604,
  "quip": "Vỏ xốp mềm, nhân thịt trứng cút nóng hổi cứu đói tức thì.",
  "category": "bread",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon",
    "late"
  ]
},
{
  "name": "Bánh giò nóng",
  "nameEn": "Warm pork rice dumpling",
  "sub": "Bột gạo, thịt heo băm và mộc nhĩ • Một phần / người",
  "price": 25,
  "image": 605,
  "quip": "Bánh giò mềm mịn, nhân mộc nhĩ giòn sần sật ấm lòng chiều muộn.",
  "category": "bread",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon",
    "late"
  ]
},
{
  "name": "Bánh ướt chả lụa",
  "nameEn": "Rice sheets with pork sausage",
  "sub": "Bánh ướt, chả lụa, rau và nước mắm • Một phần / người",
  "price": 35,
  "image": 606,
  "quip": "Bánh ướt mướt mềm, chả lụa giòn dai nước mắm chua ngọt.",
  "category": "bread",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon"
  ]
},
{
  "name": "Bánh bao chay",
  "nameEn": "Vegetable steamed bun",
  "sub": "Rau củ và nấm, không thịt • Một phần / người",
  "price": 20,
  "image": 607,
  "quip": "Thanh đạm nhẹ nhàng, nấm ngọt rau tươi.",
  "veg": true,
  "category": "bread",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "afternoon",
    "late"
  ]
},
{
  "name": "Cháo trắng ăn kèm",
  "nameEn": "Rice congee with side dishes",
  "sub": "Cháo trắng, trứng muối và thịt kho • Một phần / người",
  "price": 40,
  "image": 608,
  "quip": "Cháo trắng lá dứa hột vịt muối, món ruột của hội cú đêm.",
  "category": "hotpot",
  "serving": "Một phần / người",
  "meals": [
    "late"
  ]
},
{
  "name": "Cháo ếch",
  "nameEn": "Frog congee",
  "sub": "Cháo trắng kèm ếch kho trong niêu • Một phần / người",
  "price": 65,
  "image": 609,
  "quip": "Ếch kho cay đậm đà niêu đất, rưới lên bát cháo sánh mịn.",
  "category": "hotpot",
  "serving": "Một phần / người",
  "meals": [
    "dinner",
    "late"
  ]
},
{
  "name": "Miến ngan",
  "nameEn": "Duck glass noodle soup",
  "sub": "Miến, thịt ngan và măng • Một phần / người",
  "price": 55,
  "image": 610,
  "quip": "Nước dùng ngan béo ngậy ngọt thanh, măng giòn sợi miến dong trong suốt.",
  "category": "noodles",
  "serving": "Một phần / người",
  "meals": [
    "breakfast",
    "lunch",
    "dinner",
    "late"
  ]
},
{
  "name": "Mì trộn trứng xúc xích",
  "nameEn": "Mixed noodles with egg and sausage",
  "sub": "Mì trộn kiểu Indomie, trứng và xúc xích • Một phần / người",
  "price": 40,
  "image": 611,
  "quip": "Mì trộn thần thánh siêu cay bùng vị đêm khuya.",
  "category": "noodles",
  "serving": "Một phần / người",
  "meals": [
    "afternoon",
    "late"
  ]
},
{
  "name": "Lẩu Thái hải sản",
  "nameEn": "Thai seafood hotpot",
  "sub": "Tôm, mực, rau và nước lẩu chua cay • Giá / người khi ăn nhóm 2–4 người",
  "price": 180,
  "image": 612,
  "quip": "Chua cay bùng nổ, tôm mực ngập tràn nồi lẩu rôm rả.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Lẩu bò ăn nhóm",
  "nameEn": "Beef hotpot to share",
  "sub": "Thịt bò, rau và nấm • Giá / người khi ăn nhóm 2–4 người",
  "price": 160,
  "image": 613,
  "quip": "Nước hầm xương bò thanh ngọt, nhúng gầu bò nấm tươi.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Lẩu gà lá é",
  "nameEn": "Chicken and basil hotpot",
  "sub": "Gà, măng và lá é • Giá / người khi ăn nhóm 2–4 người",
  "price": 150,
  "image": 614,
  "quip": "Vị cay the the của lá é và măng chua, gà ta chắc thịt ngọt thơm.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Lẩu riêu cua bắp bò",
  "nameEn": "Crab and beef hotpot",
  "sub": "Riêu cua, bắp bò, đậu hũ và bún • Giá / người khi ăn nhóm 2–4 người",
  "price": 180,
  "image": 615,
  "quip": "Riêu cua vàng ươm, dấm bỗng chua thanh bắp bò giòn sần sật.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Lẩu cá",
  "nameEn": "Fish hotpot",
  "sub": "Cá, cà chua, rau và bún • Giá / người khi ăn nhóm 2–4 người",
  "price": 150,
  "image": 616,
  "quip": "Cá tươi ngọt nước lẩu thì là, chua dịu ấm cúng gia đình.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Lẩu dê",
  "nameEn": "Goat hotpot",
  "sub": "Thịt dê, khoai môn và rau • Giá / người khi ăn nhóm 2–4 người",
  "price": 200,
  "image": 617,
  "quip": "Thịt dê ninh nhừ bổ dưỡng cùng khoai môn bở bùi, chấm chao cay.",
  "category": "hotpot",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Nướng Hàn Quốc",
  "nameEn": "Korean barbecue",
  "sub": "Thịt bò, heo, rau cuốn và kimchi • Giá / người khi ăn nhóm 2–4 người",
  "price": 250,
  "image": 618,
  "quip": "Thịt xèo xèo trên vỉ nướng, cuốn xà lách chấm sốt ssamjang.",
  "category": "grill",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Nướng Nhật Yakiniku",
  "nameEn": "Japanese yakiniku",
  "sub": "Thịt bò nướng và rau nấm • Giá / người khi ăn nhóm 2–4 người",
  "price": 300,
  "image": 619,
  "quip": "Bò vân mỡ tan chảy trên than hoa thơm nức mũi.",
  "category": "grill",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Buffet lẩu",
  "nameEn": "Hotpot buffet",
  "sub": "Lẩu và các món nhúng tự chọn • Suất buffet / người",
  "price": 250,
  "image": 620,
  "quip": "Quầy line đầy ắp, ăn thả ga không lo về giá.",
  "category": "hotpot",
  "serving": "Suất buffet / người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Buffet nướng",
  "nameEn": "Barbecue buffet",
  "sub": "Thịt, hải sản, rau và món ăn kèm • Suất buffet / người",
  "price": 300,
  "image": 621,
  "quip": "Bò Mỹ, dẻ sườn, hải sản tẩm sốt nướng ngập tràn tiệc vui.",
  "category": "grill",
  "serving": "Suất buffet / người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Hải sản hấp nướng",
  "nameEn": "Steamed and grilled seafood",
  "sub": "Tôm, mực, nghêu và sò • Giá / người khi ăn nhóm 2–4 người",
  "price": 250,
  "image": 622,
  "quip": "Tôm mực nhảy tanh tách hấp sả ớt chấm muối tiêu chanh thần thánh.",
  "category": "grill",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
},
{
  "name": "Gà mẹt",
  "nameEn": "Shared chicken platter",
  "sub": "Gà, xôi, rau và đồ ăn kèm • Giá / người khi ăn nhóm 2–4 người",
  "price": 150,
  "image": 623,
  "quip": "Gà hấp lá chanh, gà nướng mật ong, xôi chiên giòn trọn vị sum vầy.",
  "category": "grill",
  "serving": "Giá / người khi ăn nhóm 2–4 người",
  "groupMeal": true,
  "meals": [
    "dinner"
  ]
}
].map(food=>({...food,rarity:priceRarity(food.price)}));
