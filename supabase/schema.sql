-- ====================================================================
-- SUPABASE SCHEMA & POSTGIS SETUP CHO FOODTOUR (128 MÓN TOÀN QUỐC)
-- Dự án: https://cfjahscecuviajbemznx.supabase.co
-- ====================================================================

-- 1. Kích hoạt Extension PostGIS để tính toán toạ độ không gian
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Bảng Danh mục Món ăn (128 món ăn trưa & mở rộng)
CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lunch',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Quán ăn ShopeeFood
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  delivery_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  district TEXT,
  city TEXT NOT NULL DEFAULT 'ha-noi',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326),
  rating NUMERIC(3, 2) DEFAULT 4.5,
  rating_count INT DEFAULT 100,
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger tự động tính cột toạ độ location (PostGIS Point) khi insert/update
CREATE OR REPLACE FUNCTION update_restaurant_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lng IS NOT NULL AND NEW.lat IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurant_location ON restaurants;
CREATE TRIGGER trg_restaurant_location
BEFORE INSERT OR UPDATE OF lat, lng ON restaurants
FOR EACH ROW EXECUTE FUNCTION update_restaurant_location();

-- 5. Chỉ mục không gian (Spatial GIST Index) & Chỉ mục tìm kiếm
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_delivery_id ON restaurants(delivery_id);

-- 6. Bảng liên kết nhiều-nhiều: Món nào có ở Quán nào
CREATE TABLE IF NOT EXISTS restaurant_dishes (
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  dish_id INT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  price INT,
  PRIMARY KEY (restaurant_id, dish_id)
);
CREATE INDEX IF NOT EXISTS idx_rd_dish_id ON restaurant_dishes(dish_id);
CREATE INDEX IF NOT EXISTS idx_rd_restaurant_id ON restaurant_dishes(restaurant_id);

-- 7. Thiết lập Row Level Security (RLS) - Cho phép đọc công khai
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public dishes read" ON dishes;
CREATE POLICY "Public dishes read" ON dishes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public restaurants read" ON restaurants;
CREATE POLICY "Public restaurants read" ON restaurants FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public restaurant_dishes read" ON restaurant_dishes;
CREATE POLICY "Public restaurant_dishes read" ON restaurant_dishes FOR SELECT USING (true);

-- 8. Hàm RPC PostGIS: Tìm quán trong bán kính R mét (Mặc định 3000m)
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
  p_dish_slug TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION DEFAULT 3000,
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  address TEXT,
  district TEXT,
  city TEXT,
  rating NUMERIC,
  rating_count INT,
  affiliate_url TEXT,
  original_url TEXT,
  distance_meters DOUBLE PRECISION
) LANGUAGE sql STABLE AS $$
  SELECT 
    r.id,
    r.name,
    r.address,
    r.district,
    r.city,
    r.rating,
    r.rating_count,
    r.affiliate_url,
    r.original_url,
    ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_meters
  FROM restaurants r
  JOIN restaurant_dishes rd ON r.id = rd.restaurant_id
  JOIN dishes d ON d.id = rd.dish_id
  WHERE (d.slug = p_dish_slug OR LOWER(d.name) = LOWER(p_dish_slug))
    AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    AND r.is_active = true
  ORDER BY 
    (ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / p_radius_meters * 0.65)
    - (COALESCE(r.rating, 4.0) / 5.0 * 0.35) ASC
  LIMIT p_limit;
$$;

-- 9. Hàm RPC: Lấy quán tốt nhất theo đánh giá (khi không bật GPS)
CREATE OR REPLACE FUNCTION get_top_restaurants_for_dish(
  p_dish_slug TEXT,
  p_city TEXT DEFAULT NULL,
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  address TEXT,
  district TEXT,
  city TEXT,
  rating NUMERIC,
  rating_count INT,
  affiliate_url TEXT,
  original_url TEXT
) LANGUAGE sql STABLE AS $$
  SELECT 
    r.id,
    r.name,
    r.address,
    r.district,
    r.city,
    r.rating,
    r.rating_count,
    r.affiliate_url,
    r.original_url
  FROM restaurants r
  JOIN restaurant_dishes rd ON r.id = rd.restaurant_id
  JOIN dishes d ON d.id = rd.dish_id
  WHERE (d.slug = p_dish_slug OR LOWER(d.name) = LOWER(p_dish_slug))
    AND (p_city IS NULL OR r.city = p_city)
    AND r.is_active = true
  ORDER BY r.rating DESC, r.rating_count DESC
  LIMIT p_limit;
$$;

-- ====================================================================
-- SEED DATA: 128 MÓN ĂN TRƯA
-- ====================================================================
INSERT INTO dishes (slug, name, category) VALUES
  ('com-tam', 'Cơm tấm', 'lunch'),
  ('pho-bo', 'Phở bò', 'lunch'),
  ('banh-mi', 'Bánh mì', 'lunch'),
  ('bun-cha', 'Bún chả', 'lunch'),
  ('sushi-ca-hoi', 'Sushi cá hồi', 'lunch'),
  ('pizza', 'Pizza', 'lunch'),
  ('ga-ran', 'Gà rán', 'lunch'),
  ('com-chay', 'Cơm chay', 'lunch'),
  ('bibimbap', 'Bibimbap', 'lunch'),
  ('com-ga-hoi-an', 'Cơm gà Hội An', 'lunch'),
  ('bun-bo-hue', 'Bún bò Huế', 'lunch'),
  ('hu-tieu', 'Hủ tiếu', 'lunch'),
  ('mi-quang', 'Mì Quảng', 'lunch'),
  ('bun-thit-nuong', 'Bún thịt nướng', 'lunch'),
  ('banh-cuon', 'Bánh cuốn', 'lunch'),
  ('bun-dau-mam-tom', 'Bún đậu mắm tôm', 'lunch'),
  ('com-rang-dua-bo', 'Cơm rang dưa bò', 'lunch'),
  ('bo-luc-lac', 'Bò lúc lắc', 'lunch'),
  ('banh-xeo', 'Bánh xèo', 'lunch'),
  ('banh-da-cua', 'Bánh đa cua', 'lunch'),
  ('mi-xao-bo', 'Mì xào bò', 'lunch'),
  ('bun-ca', 'Bún cá', 'lunch'),
  ('goi-cuon', 'Gỏi cuốn', 'lunch'),
  ('chao-suon', 'Cháo sườn', 'lunch'),
  ('ramen', 'Ramen', 'lunch'),
  ('udon', 'Udon', 'lunch'),
  ('com-ca-ri-nhat', 'Cơm cà ri Nhật', 'lunch'),
  ('tteokbokki', 'Tteokbokki', 'lunch'),
  ('burger-bo', 'Burger bò', 'lunch'),
  ('mi-y-bo-bam', 'Mì Ý bò bằm', 'lunch'),
  ('pad-thai', 'Pad Thai', 'lunch'),
  ('mi-tom-yum', 'Mì Tom Yum', 'lunch'),
  ('lau-nam-chay', 'Lẩu nấm chay', 'lunch'),
  ('mi-nam-chay', 'Mì nấm chay', 'lunch'),
  ('banh-mi-chay', 'Bánh mì chay', 'lunch'),
  ('goi-cuon-chay', 'Gỏi cuốn chay', 'lunch'),
  ('com-binh-dan', 'Cơm bình dân', 'lunch'),
  ('com-ga-xoi-mo', 'Cơm gà xối mỡ', 'lunch'),
  ('bun-rieu', 'Bún riêu', 'lunch'),
  ('banh-canh-cua', 'Bánh canh cua', 'lunch'),
  ('bo-ne', 'Bò né', 'lunch'),
  ('com-ga-teriyaki', 'Cơm gà teriyaki', 'lunch'),
  ('com-heo-chien-xu', 'Cơm heo chiên xù', 'lunch'),
  ('com-chien-hai-san', 'Cơm chiên hải sản', 'lunch'),
  ('mi-vit-tiem', 'Mì vịt tiềm', 'lunch'),
  ('kimbap', 'Kimbap', 'lunch'),
  ('mi-tron-han-quoc', 'Mì trộn Hàn Quốc', 'lunch'),
  ('salad-uc-ga', 'Salad ức gà', 'lunch'),
  ('mi-y-sot-kem-bacon', 'Mì Ý sốt kem bacon', 'lunch'),
  ('lasagna-bo', 'Lasagna bò', 'lunch'),
  ('burger-bo-pho-mai-khoai-tay', 'Burger bò phô mai & khoai tây', 'lunch'),
  ('pizza-pepperoni', 'Pizza pepperoni', 'lunch'),
  ('com-bo-gyudon', 'Cơm bò gyudon', 'lunch'),
  ('com-ca-saba-nuong', 'Cơm cá saba nướng', 'lunch'),
  ('mi-soba-nhat', 'Mì soba Nhật', 'lunch'),
  ('com-ca-ri-thai', 'Cơm cà ri Thái', 'lunch'),
  ('salad-ca-ngu', 'Salad cá ngừ', 'lunch'),
  ('salad-quinoa-dau-ga', 'Salad quinoa đậu gà', 'lunch'),
  ('bo-bit-tet', 'Bò bít tết', 'lunch'),
  ('ca-hoi-ap-chao', 'Cá hồi áp chảo', 'lunch'),
  ('com-luon-nhat', 'Cơm lươn Nhật', 'lunch'),
  ('com-bo-nuong-han', 'Cơm bò nướng Hàn', 'lunch'),
  ('com-ca-hoi-teriyaki', 'Cơm cá hồi teriyaki', 'lunch'),
  ('poke-ca-hoi', 'Poke cá hồi', 'lunch'),
  ('suon-nuong-bbq', 'Sườn nướng BBQ', 'lunch'),
  ('pizza-hai-san', 'Pizza hải sản', 'lunch'),
  ('mi-y-hai-san', 'Mì Ý hải sản', 'lunch'),
  ('lau-bo-ca-nhan', 'Lẩu bò cá nhân', 'lunch'),
  ('pho-ga', 'Phở gà', 'lunch'),
  ('pho-cuon', 'Phở cuốn', 'lunch'),
  ('bun-moc', 'Bún mọc', 'lunch'),
  ('bun-mang-vit', 'Bún măng vịt', 'lunch'),
  ('bun-bo-nam-bo', 'Bún bò Nam Bộ', 'lunch'),
  ('bun-mam', 'Bún mắm', 'lunch'),
  ('bun-chay', 'Bún chay', 'lunch'),
  ('banh-canh-gio-heo', 'Bánh canh giò heo', 'lunch'),
  ('mien-ga', 'Miến gà', 'lunch'),
  ('mien-luon', 'Miến lươn', 'lunch'),
  ('chao-vit', 'Cháo vịt', 'lunch'),
  ('chao-long', 'Cháo lòng', 'lunch'),
  ('banh-hoi-heo-quay', 'Bánh hỏi heo quay', 'lunch'),
  ('nem-nuong', 'Nem nướng', 'lunch'),
  ('dimsum', 'Dimsum', 'lunch'),
  ('mi-hoanh-thanh', 'Mì hoành thánh', 'lunch'),
  ('mi-bo-dai-loan', 'Mì bò Đài Loan', 'lunch'),
  ('mi-xao-gion', 'Mì xào giòn', 'lunch'),
  ('com-nieu-singapore', 'Cơm niêu Singapore', 'lunch'),
  ('com-ga-hai-nam', 'Cơm gà Hải Nam', 'lunch'),
  ('com-ga-trung-nhat', 'Cơm gà trứng Nhật', 'lunch'),
  ('com-tempura', 'Cơm tempura', 'lunch'),
  ('mi-cay-han-quoc', 'Mì cay Hàn Quốc', 'lunch'),
  ('mi-tuong-den', 'Mì tương đen', 'lunch'),
  ('mi-lanh-han-quoc', 'Mì lạnh Hàn Quốc', 'lunch'),
  ('canh-kimchi-kem-com', 'Canh kimchi kèm cơm', 'lunch'),
  ('canh-dau-hu-non-kem-com', 'Canh đậu hũ non kèm cơm', 'lunch'),
  ('ga-pho-mai-han-quoc', 'Gà phô mai Hàn Quốc', 'lunch'),
  ('com-chien-kimchi', 'Cơm chiên kimchi', 'lunch'),
  ('lau-thai-mot-nguoi', 'Lẩu Thái một người', 'lunch'),
  ('lau-sukiyaki-mot-nguoi', 'Lẩu sukiyaki một người', 'lunch'),
  ('ca-ri-an-do-naan', 'Cà ri Ấn Độ & naan', 'lunch'),
  ('com-biryani', 'Cơm biryani', 'lunch'),
  ('banh-xeo-nhat', 'Bánh xèo Nhật', 'lunch'),
  ('sandwich', 'Sandwich', 'lunch'),
  ('banh-mi-kebab', 'Bánh mì kebab', 'lunch'),
  ('banh-cuon-ga', 'Bánh cuộn gà', 'lunch'),
  ('burrito', 'Burrito', 'lunch'),
  ('taco', 'Taco', 'lunch'),
  ('quesadilla', 'Quesadilla', 'lunch'),
  ('fish-chips', 'Fish & chips', 'lunch'),
  ('ga-nuong-kem-khoai-tay', 'Gà nướng kèm khoai tây', 'lunch'),
  ('mac-cheese', 'Mac & cheese', 'lunch'),
  ('mi-y-pesto', 'Mì Ý pesto', 'lunch'),
  ('mi-y-ca-hoi', 'Mì Ý cá hồi', 'lunch'),
  ('com-risotto', 'Cơm risotto', 'lunch'),
  ('gnocchi', 'Gnocchi', 'lunch'),
  ('falafel-kem-pita', 'Falafel kèm pita', 'lunch'),
  ('nui-xao-bo', 'Nui xào bò', 'lunch'),
  ('chao-ga', 'Cháo gà', 'lunch'),
  ('bo-kho-banh-mi', 'Bò kho bánh mì', 'lunch'),
  ('xoi-man', 'Xôi mặn', 'lunch'),
  ('banh-mi-chao', 'Bánh mì chảo', 'lunch'),
  ('com-xa-xiu', 'Cơm xá xíu', 'lunch'),
  ('com-vit-quay', 'Cơm vịt quay', 'lunch'),
  ('mi-xa-xiu', 'Mì xá xíu', 'lunch'),
  ('mi-udon-xao', 'Mì udon xào', 'lunch'),
  ('burger-ga-khoai-tay', 'Burger gà & khoai tây', 'lunch'),
  ('mi-y-sot-ca-chua-pho-mai', 'Mì Ý sốt cà chua & phô mai', 'lunch'),
  ('mien-xao', 'Miến xào', 'lunch')
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- SEED DATA: 30 QUÁN BÚN CHẢ HÀ NỘI ĐÃ XÁC MINH TOẠ ĐỘ & AFFILIATE
-- ====================================================================
INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-huong-lien-le-van-huu', 2401, 'Bún Chả Hương Liên (Obama) - Lê Văn Hưu', '24 Lê Văn Hưu, P. Phan Chu Trinh, Hai Bà Trưng, Hà Nội', 'Hai Bà Trưng', 'ha-noi', 21.01825, 105.85292, 4.8, 3520, 'https://shopeefood.vn/ha-noi/bun-cha-huong-lien', 'https://shope.ee/4B0DrlamO7', true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-huong-lien-lang-ha', 2402, 'Bún Chả Hương Liên - Láng Hạ', '14 Ngõ 59 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội', 'Ba Đình', 'ha-noi', 21.01639, 105.81556, 4.7, 1840, 'https://shopeefood.vn/ha-noi/bun-cha-huong-lien-lang-ha', 'https://shope.ee/3g3xGqcgP2', true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-nguyen-khuyen', 3101, 'Bún Chả Sinh Từ - Nguyễn Khuyến', '57 Nguyễn Khuyến, P. Văn Miếu, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0264, 105.8378, 4.7, 2410, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-nguyen-khuyen', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-tran-thai-tong', 3102, 'Bún Chả Sinh Từ - Trần Thái Tông', '48 Trần Thái Tông, P. Dịch Vọng Hậu, Cầu Giấy, Hà Nội', 'Cầu Giấy', 'ha-noi', 21.0345, 105.7892, 4.6, 1950, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-tran-thai-tong', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-hoang-cau', 3103, 'Bún Chả Sinh Từ - Hoàng Cầu', '10 Hoàng Cầu Mới, P. Trung Liệt, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0185, 105.8236, 4.6, 1680, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-hoang-cau', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-nguyen-trai', 3104, 'Bún Chả Sinh Từ - Nguyễn Trãi', '440 Nguyễn Trãi, P. Thanh Xuân Trung, Thanh Xuân, Hà Nội', 'Thanh Xuân', 'ha-noi', 20.9942, 105.8035, 4.6, 1420, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-nguyen-trai', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-dai-co-viet', 3105, 'Bún Chả Sinh Từ - Đại Cồ Việt', '38 Đại Cồ Việt, P. Lê Đại Hành, Hai Bà Trưng, Hà Nội', 'Hai Bà Trưng', 'ha-noi', 21.0089, 105.8475, 4.7, 2100, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-dai-co-viet', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-thuy-khue', 3106, 'Bún Chả Sinh Từ - Thụy Khuê', '10 Thụy Khuê, P. Thụy Khuê, Tây Hồ, Hà Nội', 'Tây Hồ', 'ha-noi', 21.0425, 105.8362, 4.6, 1350, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-thuy-khue', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-doi-can', 3107, 'Bún Chả Sinh Từ - Đội Cấn', '247 Đội Cấn, P. Liễu Giai, Ba Đình, Hà Nội', 'Ba Đình', 'ha-noi', 21.0362, 105.8185, 4.7, 1780, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-doi-can', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-sinh-tu-giang-vo', 3108, 'Bún Chả Sinh Từ - Giảng Võ', '114 D1 Giảng Võ, P. Chợ Dừa, Ba Đình, Hà Nội', 'Ba Đình', 'ha-noi', 21.0289, 105.8231, 4.6, 1590, 'https://shopeefood.vn/ha-noi/bun-cha-sinh-tu-giang-vo', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-dac-kim-hang-manh', 4001, 'Bún Chả Đắc Kim - Hàng Mành', '1 Hàng Mành, P. Hàng Gai, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0335, 105.8488, 4.5, 3100, 'https://shopeefood.vn/ha-noi/bun-cha-dac-kim-hang-manh', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-cua-dong', 4002, 'Bún Chả Cửa Đông', '41 Cửa Đông, P. Cửa Đông, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0342, 105.8458, 4.7, 1820, 'https://shopeefood.vn/ha-noi/bun-cha-cua-dong', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-hang-quat', 4003, 'Bún Chả Hàng Quạt', 'Ngõ 74 Hàng Quạt, P. Hàng Gai, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0328, 105.8499, 4.8, 2650, 'https://shopeefood.vn/ha-noi/bun-cha-hang-quat', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-mai-hac-de', 4004, 'Bún Chả Mai Hắc Đế', '108 Mai Hắc Đế, P. Lê Đại Hành, Hai Bà Trưng, Hà Nội', 'Hai Bà Trưng', 'ha-noi', 21.0118, 105.8505, 4.6, 1410, 'https://shopeefood.vn/ha-noi/bun-cha-mai-hac-de', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-bat-su', 4005, 'Bún Chả Bát Sứ', '23 Bát Sứ, P. Hàng Bồ, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0351, 105.8479, 4.7, 1290, 'https://shopeefood.vn/ha-noi/bun-cha-bat-su', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-duy-tan', 4006, 'Bún Chả Duy Tân - Cầu Giấy', '18 Duy Tân, P. Dịch Vọng Hậu, Cầu Giấy, Hà Nội', 'Cầu Giấy', 'ha-noi', 21.0321, 105.7825, 4.6, 1650, 'https://shopeefood.vn/ha-noi/bun-cha-duy-tan', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-to-hieu', 4007, 'Bún Chả Tô Hiệu - Nghĩa Tân', '102 B8 Tô Hiệu, P. Nghĩa Tân, Cầu Giấy, Hà Nội', 'Cầu Giấy', 'ha-noi', 21.0428, 105.7924, 4.5, 1180, 'https://shopeefood.vn/ha-noi/bun-cha-to-hieu', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-bach-mai', 4008, 'Bún Chả Bạch Mai', '216 Bạch Mai, P. Cầu Dền, Hai Bà Trưng, Hà Nội', 'Hai Bà Trưng', 'ha-noi', 21.0035, 105.8501, 4.6, 1540, 'https://shopeefood.vn/ha-noi/bun-cha-bach-mai', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-que-tre-bach-mai', 4009, 'Bún Chả Que Tre - Bạch Mai', '17 Ngõ 213 Bạch Mai, P. Thanh Nhàn, Hai Bà Trưng, Hà Nội', 'Hai Bà Trưng', 'ha-noi', 21.0041, 105.8492, 4.8, 2180, 'https://shopeefood.vn/ha-noi/bun-cha-que-tre-bach-mai', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-nguyen-bieu', 4010, 'Bún Chả Nguyễn Biểu', '23 Nguyễn Biểu, P. Quán Thánh, Ba Đình, Hà Nội', 'Ba Đình', 'ha-noi', 21.0401, 105.8385, 4.7, 1690, 'https://shopeefood.vn/ha-noi/bun-cha-nguyen-bieu', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-yen-phu', 4011, 'Bún Chả Yên Phụ Nhỏ', '34 Yên Phụ Nhỏ, P. Yên Phụ, Tây Hồ, Hà Nội', 'Tây Hồ', 'ha-noi', 21.0495, 105.8402, 4.6, 980, 'https://shopeefood.vn/ha-noi/bun-cha-yen-phu', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-lac-long-quan', 4012, 'Bún Chả Lạc Long Quân', '281 Lạc Long Quân, P. Nghĩa Đô, Tây Hồ, Hà Nội', 'Tây Hồ', 'ha-noi', 21.0542, 105.8089, 4.5, 870, 'https://shopeefood.vn/ha-noi/bun-cha-lac-long-quan', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-vu-tong-phan', 4013, 'Bún Chả Vũ Tông Phan', '156 Vũ Tông Phan, P. Khương Trung, Thanh Xuân, Hà Nội', 'Thanh Xuân', 'ha-noi', 20.9985, 105.8189, 4.6, 1120, 'https://shopeefood.vn/ha-noi/bun-cha-vu-tong-phan', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-kim-lien', 4014, 'Bún Chả Kim Liên', 'B7 Kim Liên, P. Kim Liên, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0095, 105.8345, 4.5, 1340, 'https://shopeefood.vn/ha-noi/bun-cha-kim-lien', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-chua-boc', 4015, 'Bún Chả Chùa Bộc', '43 Chùa Bộc, P. Quang Trung, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0075, 105.8279, 4.6, 1450, 'https://shopeefood.vn/ha-noi/bun-cha-chua-boc', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-thai-ha', 4016, 'Bún Chả Thái Hà', '188 Thái Hà, P. Trung Liệt, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0132, 105.8178, 4.6, 1280, 'https://shopeefood.vn/ha-noi/bun-cha-thai-ha', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-nguyen-khang', 4017, 'Bún Chả Nguyễn Khang', '238 Nguyễn Khang, P. Yên Hòa, Cầu Giấy, Hà Nội', 'Cầu Giấy', 'ha-noi', 21.0165, 105.7995, 4.5, 970, 'https://shopeefood.vn/ha-noi/bun-cha-nguyen-khang', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-tran-hung-dao', 4018, 'Bún Chả Trần Hưng Đạo', '67 Trần Hưng Đạo, P. Cửa Nam, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0235, 105.8482, 4.7, 1580, 'https://shopeefood.vn/ha-noi/bun-cha-tran-hung-dao', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-ngo-si-lien', 4019, 'Bún Chả Ngô Sĩ Liên', '42 Ngô Sĩ Liên, P. Văn Miếu, Đống Đa, Hà Nội', 'Đống Đa', 'ha-noi', 21.0272, 105.8365, 4.7, 1720, 'https://shopeefood.vn/ha-noi/bun-cha-ngo-si-lien', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

INSERT INTO restaurants (id, delivery_id, name, address, district, city, lat, lng, rating, rating_count, original_url, affiliate_url, is_verified)
VALUES ('bun-cha-phan-chu-trinh', 4020, 'Bún Chả Phan Chu Trinh', '38 Phan Chu Trinh, P. Phan Chu Trinh, Hoàn Kiếm, Hà Nội', 'Hoàn Kiếm', 'ha-noi', 21.0205, 105.8562, 4.6, 1390, 'https://shopeefood.vn/ha-noi/bun-cha-phan-chu-trinh', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  rating = EXCLUDED.rating,
  rating_count = EXCLUDED.rating_count,
  affiliate_url = COALESCE(EXCLUDED.affiliate_url, restaurants.affiliate_url);

-- Liên kết 30 quán Bún chả với món bun-cha trong bảng dishes
INSERT INTO restaurant_dishes (restaurant_id, dish_id)
SELECT r.id, d.id
FROM restaurants r
CROSS JOIN dishes d
WHERE d.slug = 'bun-cha' AND r.id LIKE 'bun-cha%'
ON CONFLICT (restaurant_id, dish_id) DO NOTHING;
