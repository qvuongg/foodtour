# FoodTour — Hôm Nay Ăn Gì & Đồ Uống Chuẩn Gu 🍜🥤

**Tiếng Việt** · [English](README.en.md)

Ứng dụng web giải cứu câu hỏi kinh điển *"Hôm nay ăn gì / uống gì?"* bằng cơ chế **mở hòm & quay món** phong cách CS2 đầy bất ngờ, kết hợp tìm kiếm quán ngon gần nhất trong bán kính 3km (PostGIS) và đặt món 1 chạm trực tiếp qua ứng dụng ShopeeFood.

---

## 🌟 Tính Năng Nổi Bật

### 1. 🎰 Vòng Quay Mở Hòm Giải Cứu Cơn Đói
- **4 Danh mục phong phú:**
  - **Ăn trưa (Lunch):** Cơm, phở, bún, mì, bánh cuốn, món chay... kèm bộ lọc ngân sách và chế độ thuần chay.
  - **Đồ uống (Drinks):** Cà phê muối, trà sữa, trà đào cam sả, nước ép, sinh tố...
  - **Ăn vặt (Snacks):** Bánh tráng nướng, nem chua rán, chè, kem bơ...
  - **Đi nhậu (Pubs):** Lẩu, nướng, mồi nhậu tụ tập bạn bè.
- **Hiệu ứng chân thực:** Trải nghiệm âm thanh click mở hòm CS2 sống động, ánh sáng spotlight dừng đúng món chiến thắng.

### 2. 📍 Tìm Quán Ngon Gần 3km Qua Supabase PostGIS
- Tự động định vị GPS của người dùng (chỉ khi được cho phép).
- Truy vấn trực tiếp hàm PostGIS RPC `get_nearby_restaurants` trên cơ sở dữ liệu Supabase để tìm các quán đang mở cửa gần nhất trong bán kính 3,000m.
- Bộ lọc thông minh (`dish-relevance`): Ngăn chặn triệt để quán sai lệch (ví dụ: quay "Bún chả Hà Nội" sẽ không trả về quán bún chả cá; món mặn không lẫn vào quán chay).
- Tự động sắp xếp ưu tiên theo: Lượt đánh giá (Rating Count) ➔ Điểm đánh giá (Rating ⭐) ➔ Khoảng cách gần nhất.

### 3. 🥤 Trải Nghiệm Đồ Uống Chuyên Biệt
- **Thanh Cuộn Ngang Thương Hiệu (Brand Carousel):**
  - Trưng bày các chuỗi F&B hàng đầu: *Highlands Coffee, Phúc Long, Phê La, Katinat, The Coffee House, Starbucks, Mixue, ToCoToCo, Cộng Cà Phê, Gong Cha, KOI Thé*.
  - Logo chuẩn nhận diện thương hiệu, thiết kế card bo góc tinh gọn, vuốt ngang 1 chạm trên mobile.
- **Checklist Quán Ngon Theo Quận (District Spots Checklist):**
  - Tự động nhận diện quận huyện (Đà Nẵng: *Liên Chiểu, Hải Châu, Thanh Khê, Sơn Trà, Ngũ Hành Sơn, Cẩm Lệ...*).
  - Danh sách top quán nước uy tín nhất quận kết nối động từ database Supabase, tích hợp thanh tiến độ check-in trải nghiệm.

### 4. ⚡ Deep Link Mở Thẳng App ShopeeFood
- Công nghệ điều hướng Universal Deep Link (`shopee-deeplink.ts`): Bấm nút **"Đặt"** hoặc **"Mở quán"** trên iOS Safari / Android sẽ mở trực tiếp ứng dụng Shopee/ShopeeFood, **không bị kẹt ở trang web trung gian**.
- Tự động gắn tham số tracking Shopee Affiliate chính thức (`mmp_pid`, `utm_source`, `utm_medium`, `utm_campaign`, `sub_id`).

### 5. 🕷️ Bộ Công Cụ Crawler & Quản Lý Dữ Liệu Tự Động
- **ShopeeFood Crawler (`scripts/crawl-drinks.mjs`):** Tự động cào quán ăn & quán nước đa tỉnh thành (*Đà Nẵng, Hà Nội, TP.HCM*), tự động mở rộng theo từng quận.
- **Shopee Batch Link Export (`scripts/export-batch-custom-links.py`):** Xuất hàng nghìn liên kết sang định dạng Excel chuẩn để tải lên Shopee Affiliate Portal lấy link rút gọn.
- **Database Synchronizer (`scripts/merge-affiliate-results.py`):** Đọc file kết quả từ Shopee và tự động cập nhật hàng loạt link affiliate lên Supabase Database với đa luồng song song.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Ngôn ngữ** | [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Styling & Icons** | Vanilla CSS Modules + CSS Custom Properties, [Lucide React](https://lucide.dev/) |
| **Database & Spatial** | [Supabase](https://supabase.com/) (PostgreSQL 15 + PostGIS extension) |
| **Crawler & Automation** | [Playwright](https://playwright.dev/) (Chromium Stealth), Python 3 (openpyxl) |
| **Unit Testing** | Node.js Test Runner (`node --test`) + [esbuild](https://esbuild.github.io/) |

---

## 🚀 Cài Đặt & Chạy Trên Máy (Local Development)

### Yêu cầu môi trường
- **Node.js**: `22.12+`
- **pnpm**: `9.x+` (hoặc npm tương đương)
- **Python**: `3.9+` (kèm thư viện `openpyxl` nếu dùng tính năng xử lý Excel)

### Các bước khởi chạy

1. **Clone repository và cài đặt thư viện:**
   ```bash
   git clone https://github.com/qvuongg/foodtour.git
   cd foodtour
   pnpm install
   ```

2. **Cấu hình biến môi trường:**
   Tạo file `.env.local` từ mẫu `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Cập nhật các thông tin Supabase của bạn:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Dùng khi chạy crawler / merge scripts
   ```

3. **Khởi chạy Development Server:**
   ```bash
   pnpm dev
   ```
   Mở trình duyệt tại [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## 🧪 Kiểm Thử & Đóng Gói (Testing & Build)

```bash
# Chạy toàn bộ 60 bài kiểm thử tự động
pnpm test

# Kiểm tra cú pháp và kiểu dữ liệu TypeScript
pnpm typecheck

# Đóng gói phiên bản sản xuất (Production Build)
pnpm build

# Xem thử bản build production tại local
pnpm preview
```

---

## 📊 Hướng Dẫn Cào & Đồng Bộ Dữ Liệu Quán

### 1. Cào dữ liệu quán nước
```bash
# Cào toàn bộ 3 thành phố lớn: Hà Nội, Đà Nẵng, TP.HCM
node scripts/crawl-drinks.mjs --all

# Hoặc cào riêng 1 thành phố với chế độ quét nhanh:
node scripts/crawl-drinks.mjs --city=da-nang --fast
```

### 2. Xuất file nộp Shopee Affiliate để lấy link rút gọn
Dữ liệu cào sẽ được tạo sẵn tại file [`data/Batch Custom Links_Drink.xlsx`](data/Batch%20Custom%20Links_Drink.xlsx).  
Bạn tải tệp này lên **Shopee Affiliate Portal > Custom Link > Batch** và tải file kết quả `AffiliateBatchCustomLinks...` về thư mục `data/`.

### 3. Đồng bộ link rút gọn lên Database Supabase
```bash
python3 scripts/merge-affiliate-results.py
```
Tập lệnh sẽ tự động nạp link affiliate và cập nhật trường `affiliate_url` của tất cả các quán trên Supabase Database.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
foodtour/
├── data/                       # Dữ liệu CSV/Excel cào được và link đối soát Shopee
├── public/
│   ├── brand/                  # Logo và biểu tượng ứng dụng chính
│   ├── brands/                 # Logo vector các thương hiệu đồ uống (Highlands, Phúc Long...)
│   └── *.webp                  # Sprite atlas hình ảnh món ăn
├── scripts/
│   ├── crawl-drinks.mjs        # Crawler đồ uống đa thành phố
│   ├── crawl-shopeefood-batch.mjs # Crawler món ăn trưa
│   ├── export-batch-custom-links.py # Công cụ tạo file Excel nộp Shopee
│   └── merge-affiliate-results.py   # Công cụ đồng bộ link affiliate lên Supabase
├── src/
│   ├── app/                    # Layout chính và trang Home (page.tsx)
│   ├── components/             # React UI components
│   │   ├── brand-carousel.tsx  # Thanh cuộn ngang thương hiệu nổi bật
│   │   ├── district-spots-checklist.tsx # Checklist quán ngon theo quận
│   │   ├── food-ordering.tsx   # Modal hiển thị quán gần bạn 3km qua PostGIS
│   │   ├── food-spotlight.tsx  # Hiệu ứng vòng quay hòm CS2
│   │   └── spin-controls.tsx   # Bộ nút quay và lọc món
│   └── lib/                    # Logic nghiệp vụ, dịch vụ dữ liệu & helper
│       ├── brand-catalog.ts    # Danh mục 11 chuỗi thương hiệu đồ uống
│       ├── district-spots.ts   # Dữ liệu quận và quán nước tuyển chọn
│       ├── shopee-deeplink.ts  # Cơ chế mở thẳng App Shopee không qua web trung gian
│       ├── supabase-client.ts  # Client PostGIS RPC truy vấn quán gần 3km
│       └── dish-relevance.ts   # Thuật toán lọc quán chính xác theo tên món
└── tests/                      # Bộ 60 unit tests kiểm thử toàn diện
```

---

## 🔒 Quyền Riêng Tư & Bảo Mật

- **Vị trí địa lý:** Tọa độ GPS chỉ được sử dụng trực tiếp trên trình duyệt để gọi hàm tính toán khoảng cách PostGIS, **hoàn toàn không lưu trữ nhật ký vị trí** của người dùng.
- **Cookie cá nhân:** Lượt quay và cài đặt thực đơn cá nhân được lưu hoàn toàn trong cookie nội bộ thiết bị của bạn.
