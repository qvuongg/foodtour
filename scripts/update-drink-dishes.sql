-- ============================================================================
-- SQL CẬP NHẬT TÊN MÓN NƯỚC & MA TRẬN TỪ KHÓA ĐỒNG NGHĨA (SEARCH ALIASES)
-- BẢNG: public.dishes
-- Hướng dẫn: Copy và chạy trong mục SQL Editor trên Supabase Dashboard.
-- ============================================================================

-- 1. Bổ sung cột search_aliases (mảng text[]) nếu chưa có
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS search_aliases text[] DEFAULT '{}';

-- 2. Đổi tên Bánh quy kem đá xay thành Cookie đá xay & cập nhật aliases
UPDATE public.dishes
SET 
  name = 'Cookie đá xay',
  slug = 'cookie-da-xay',
  search_aliases = ARRAY[
    'cookie da xay', 
    'oreo da xay', 
    'cookies da xay', 
    'banh quy da xay', 
    'freeze banh quy', 
    'banh quy kem da xay', 
    'cookies and cream',
    'cookie freeze'
  ]
WHERE id = 187 OR slug = 'banh-quy-kem-da-xay';

-- 3. Đổi tên Cà phê ủ lạnh thành Cold Brew & cập nhật aliases
UPDATE public.dishes
SET 
  name = 'Cold Brew',
  slug = 'cold-brew',
  search_aliases = ARRAY[
    'cold brew', 
    'coldbrew', 
    'specialty coffee', 
    'ca phe u lanh', 
    'nitro cold brew', 
    'cold brew cam'
  ]
WHERE id = 137 OR slug = 'ca-phe-u-lanh';

-- 4. Cập nhật Ma trận từ khóa cho các món đồ uống phổ biến khác
UPDATE public.dishes
SET search_aliases = ARRAY['ca phe muoi', 'cafe muoi', 'ca phe kem muoi', 'salted coffee']
WHERE slug = 'ca-phe-muoi' OR name = 'Cà phê muối';

UPDATE public.dishes
SET search_aliases = ARRAY['ca phe cot dua', 'cafe cot dua', 'ca phe dua', 'coconut coffee']
WHERE slug = 'ca-phe-cot-dua' OR name = 'Cà phê cốt dừa';

UPDATE public.dishes
SET search_aliases = ARRAY['ca phe trung', 'cafe trung', 'egg coffee']
WHERE slug = 'ca-phe-trung' OR name = 'Cà phê trứng';

UPDATE public.dishes
SET search_aliases = ARRAY['bac xiu', 'bac siu', 'white coffee']
WHERE slug = 'bac-xiu' OR name = 'Bạc xỉu';

UPDATE public.dishes
SET search_aliases = ARRAY['matcha da xay', 'tra xanh da xay', 'freeze matcha', 'matcha ice blended']
WHERE slug = 'matcha-da-xay' OR name = 'Matcha đá xay';

UPDATE public.dishes
SET search_aliases = ARRAY['so co la da xay', 'socola da xay', 'chocolate da xay', 'freeze socola', 'choco freeze']
WHERE slug = 'so-co-la-da-xay' OR name = 'Sô cô la đá xay';

UPDATE public.dishes
SET search_aliases = ARRAY['tra dao cam sa', 'tra dao', 'tra cam sa', 'peach tea']
WHERE slug = 'tra-dao-cam-sa' OR name = 'Trà đào cam sả';

UPDATE public.dishes
SET search_aliases = ARRAY['tra sen vang', 'tra sen vang cu nang', 'tra hat sen', 'tra sen']
WHERE slug = 'tra-sen-vang' OR name = 'Trà sen vàng';

UPDATE public.dishes
SET search_aliases = ARRAY['tra tac', 'tra quat', 'kumquat tea']
WHERE slug = 'tra-tac' OR name = 'Trà tắc';

UPDATE public.dishes
SET search_aliases = ARRAY['tra chanh', 'tra chanh gia tay', 'lemon tea']
WHERE slug = 'tra-chanh' OR name = 'Trà chanh';

UPDATE public.dishes
SET search_aliases = ARRAY['sua tuoi tran chau duong den', 'duong den', 'tran chau duong den', 'tiger sugar']
WHERE slug = 'sua-tuoi-tran-chau-duong-den' OR name = 'Sữa tươi trân châu đường đen';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc ep dua', 'nuoc ep thom', 'dua ep', 'thom ep', 'pineapple juice']
WHERE slug = 'nuoc-ep-dua' OR name = 'Nước ép dứa';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc ep cam', 'cam vat', 'nuoc cam ep', 'orange juice']
WHERE slug = 'nuoc-ep-cam' OR name = 'Nước ép cam';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc chanh day', 'nuoc chanh leo', 'chanh day da', 'chanh leo', 'passion fruit juice']
WHERE slug = 'nuoc-chanh-day' OR name = 'Nước chanh dây';

UPDATE public.dishes
SET search_aliases = ARRAY['rau ma dau xanh', 'rau ma sua', 'rau ma mix']
WHERE slug = 'rau-ma-dau-xanh' OR name = 'Rau má đậu xanh';

UPDATE public.dishes
SET search_aliases = ARRAY['sam bi dao', 'tra bi dao', 'tra bi dao hat chia']
WHERE slug = 'sam-bi-dao' OR name = 'Sâm bí đao';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc sam', 'sam mia lau', 'nuoc mat']
WHERE slug = 'nuoc-sam' OR name = 'Nước sâm';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc mia', 'mia sieu sach', 'nuoc mia tac']
WHERE slug = 'nuoc-mia' OR name = 'Nước mía';

UPDATE public.dishes
SET search_aliases = ARRAY['nuoc dua', 'dua tuoi', 'dua xiem', 'coconut water']
WHERE slug = 'nuoc-dua' OR name = 'Nước dừa';

UPDATE public.dishes
SET search_aliases = ARRAY['sinh to sapoche', 'sinh to hong xiem', 'sapoche xay']
WHERE slug = 'sinh-to-sapoche' OR name = 'Sinh tố sapoche';

UPDATE public.dishes
SET search_aliases = ARRAY['sua chua da', 'sua chua danh da']
WHERE slug = 'sua-chua-da' OR name = 'Sữa chua đá';

-- 5. Kiểm tra kết quả
SELECT id, name, slug, search_aliases 
FROM public.dishes 
WHERE category = 'drinks' AND array_length(search_aliases, 1) > 0
ORDER BY id;
