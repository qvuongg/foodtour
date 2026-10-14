-- ============================================================================
-- SQL CẬP NHẬT TÊN MÓN NƯỚC TRÊN SUPABASE (TABLE: dishes)
-- ============================================================================
-- 1. Bánh quy kem đá xay (id: 187) -> Cookie đá xay (slug: cookie-da-xay)
-- 2. Cà phê ủ lạnh (id: 137) -> Cold Brew (slug: cold-brew)
-- Chạy đoạn SQL này trong mục SQL Editor trên Supabase Dashboard.
-- ============================================================================

-- 1. Đổi tên Bánh quy kem đá xay thành Cookie đá xay
UPDATE public.dishes
SET 
  name = 'Cookie đá xay',
  slug = 'cookie-da-xay'
WHERE id = 187 OR slug = 'banh-quy-kem-da-xay';

-- 2. Đổi tên Cà phê ủ lạnh thành Cold Brew
UPDATE public.dishes
SET 
  name = 'Cold Brew',
  slug = 'cold-brew'
WHERE id = 137 OR slug = 'ca-phe-u-lanh';

-- 3. Kiểm tra lại kết quả sau khi cập nhật
SELECT id, name, slug, category 
FROM public.dishes 
WHERE id IN (137, 187) OR slug IN ('cookie-da-xay', 'cold-brew');
