import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRestaurantRelevantForDish,
  filterRelevantRestaurants,
  isRealVegetarianRestaurant,
  isVegetarianDish,
} from '../src/lib/dish-relevance.ts';

test('isRealVegetarianRestaurant strictly separates genuine Chay from Cháy / Bá cháy', () => {
  // Genuine vegetarian
  assert.equal(isRealVegetarianRestaurant('Cơm Chay Dưỡng Sinh - Hoài Hương'), true);
  assert.equal(isRealVegetarianRestaurant('Bánh Mì Chay - Trần Tống'), true);
  assert.equal(isRealVegetarianRestaurant('Loving Hut - Vegan Food'), true);
  assert.equal(isRealVegetarianRestaurant('Bếp Chay An Nhiên'), true);
  assert.equal(isRealVegetarianRestaurant('An Khánh - Bún Chay Rau Nấm'), true);
  assert.equal(isRealVegetarianRestaurant('Thanh Cảnh - Lẩu Nấm Chay'), true);
  assert.equal(isRealVegetarianRestaurant('Tự Châu Veggie'), true);

  // False positives with "Cháy" (dấu sắc)
  assert.equal(isRealVegetarianRestaurant('Minh Châu - Cơm Cháy Hàn Quốc & Coffee'), false);
  assert.equal(isRealVegetarianRestaurant('Cơm Cháy Kho Quẹt - Đường 50'), false);
  assert.equal(isRealVegetarianRestaurant('Bá Cháy Bù Chét - Bánh Canh Cốt Dừa'), false);
  assert.equal(isRealVegetarianRestaurant('Gỏi Cuốn & Cơm Cháy 53 - Ăn Vặt'), false);
  assert.equal(isRealVegetarianRestaurant('Ngan Cháy Tỏi & Bún Trộn'), false);
  assert.equal(isRealVegetarianRestaurant('Lẩu Bò Khu Nhà Cháy'), false);
  assert.equal(isRealVegetarianRestaurant('Bún Đậu - Ngon Bá Cháy'), false);
  assert.equal(isRealVegetarianRestaurant('Cơm Cháy & Bánh Mì Ngon Phố Cổ'), false);
});

test('Vegetarian dishes strictly filter out non-veg and false-positive restaurants', () => {
  // Cơm chay
  assert.equal(isRestaurantRelevantForDish('Cơm Chay Dưỡng Sinh - Hoài Hương', 'Cơm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Cơm Chay Âu Lạc', 'Cơm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Minh Châu - Cơm Cháy Hàn Quốc & Coffee', 'Cơm chay'), false);
  assert.equal(isRestaurantRelevantForDish('Cơm Tấm Ba Ghiền', 'Cơm chay'), false);

  // Mì nấm chay (MUST NOT match Bánh Mì nấm chay)
  assert.equal(isRestaurantRelevantForDish('Bếp Nhà Bên - Mì Nấm Chay - Hồ Tùng Mậu', 'Mì nấm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Má Tư - Mì Ý Nấm Chay, Vegetarian Spaghetti', 'Mì nấm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Nấm Chay Dương An - Cơ Sở Hà Đông', 'Mì nấm chay'), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Chay Mẹ Nấm - CMT8', 'Mì nấm chay'), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Việt Nam - Chay & Mặn', 'Mì nấm chay'), false);

  // Gỏi cuốn chay
  assert.equal(isRestaurantRelevantForDish('Bếp Chay Mèo Béo - Gỏi Cuốn Healthy', 'Gỏi cuốn chay'), true);
  assert.equal(isRestaurantRelevantForDish('Cô Tuyết - Hủ Tiếu & Gỏi Cuốn Chay', 'Gỏi cuốn chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bá Cháy Bù Chét - Bánh Canh Cốt Dừa & Gỏi Cuốn', 'Gỏi cuốn chay'), false);
  assert.equal(isRestaurantRelevantForDish('Gỏi Cuốn & Cơm Cháy 53 - Ăn Vặt', 'Gỏi cuốn chay'), false);

  // Bánh mì chay
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Chay - Trần Tống', 'Bánh mì chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Chay An Yên', 'Bánh mì chay'), true);
  assert.equal(isRestaurantRelevantForDish('Nga Lê Quán - Hủ Tiếu, Mì Quảng & Bánh Canh Chay', 'Bánh mì chay'), false);
  assert.equal(isRestaurantRelevantForDish('Cơm Cháy & Bánh Mì Ngon Phố Cổ', 'Bánh mì chay'), false);

  // Lẩu nấm chay
  assert.equal(isRestaurantRelevantForDish('Thanh Cảnh - Lẩu Nấm Chay', 'Lẩu nấm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Hida Chay - Lẩu Rau Nấm', 'Lẩu nấm chay'), true);
  assert.equal(isRestaurantRelevantForDish('Lẩu Bò Khu Nhà Cháy', 'Lẩu nấm chay'), false);

  // Bún chay
  assert.equal(isRestaurantRelevantForDish('An Khánh - Bún Chay Rau Nấm', 'Bún chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chay - An Viên', 'Bún chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Bò Huế Chay', 'Bún chay'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Đậu - Ngon Bá Cháy', 'Bún chay'), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá Tam Giác', 'Bún chay'), false);
});

test('Non-vegetarian dishes reject pure vegetarian restaurants', () => {
  // Pure vegetarian restaurant should not be recommended for meat beef noodles
  assert.equal(isRestaurantRelevantForDish('Bún Bò Huế Chay', 'Bún bò Huế'), false);
  assert.equal(isRestaurantRelevantForDish('Quán Chay An Lạc - Cơm Chay', 'Cơm tấm'), false);
  assert.equal(isRestaurantRelevantForDish('Phở Chay An Nhiên', 'Phở bò'), false);

  // Dual "Chay & Mặn" restaurant is acceptable for non-veg dish
  assert.equal(isRestaurantRelevantForDish('Bánh Mì Việt Nam - Chay & Mặn', 'Bánh mì'), true);
});

test('isRestaurantRelevantForDish strictly differentiates Bún chả (Hà Nội) from Bún chả cá / Bún chả giò', () => {
  const dish = 'Bún chả';

  // Positive cases (Genuine Bún chả / Bún chả Hà Nội)
  assert.equal(isRestaurantRelevantForDish('Bún Chả 1986', dish), true);
  assert.equal(isRestaurantRelevantForDish('Phở Nam Định & Bún Chả Hà Nội', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Hương Liên (Obama) - Lê Văn Hưu', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Đắc Kim - Hàng Mành', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cửa Đông', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Que Tre - Bạch Mai', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả & Bún Đậu Linh Nhi', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Sinh Từ - Giảng Võ', dish), true);

  // Negative cases (Bún chả cá, Bún chả giò, Bún chả sứa...)
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá Tam Giác - Dũng Sĩ Thanh Khê', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá Bà Lữ - Nam Trân', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá Bá Đào CS2 - 50 Đặng Dung', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá 109 - Nguyễn Chí Thanh', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cá Hờn - Quang Trung', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Giò Ban Mê - Trần Hưng Đạo', dish), false);
  assert.equal(isRestaurantRelevantForDish('Mến - Bún Chả Cá Sứa Nha Trang', dish), false);
});

test('isRestaurantRelevantForDish correctly validates genuine Bánh xèo restaurants', () => {
  const dish = 'Bánh xèo';

  // Positive cases
  assert.equal(isRestaurantRelevantForDish('Quán 307 - Bánh Xèo & Nem Lụi', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bánh Xèo Tôm Nhảy Cô Ba', dish), true);
  assert.equal(isRestaurantRelevantForDish('Đặc Sản Đà Nẵng - Nem Lụi & Bánh Căn', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bà Dưỡng - Bánh Xèo', dish), true);

  // Negative cases (mismatched dishes)
  assert.equal(isRestaurantRelevantForDish('Kichi - Bánh Cá Taiyaki', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Xèo Nhật Bản Okonomiyaki', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Canh Dốc - Dũng Sĩ Thanh Khê', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Ép Huế - Lê Độ', dish), false);
  assert.equal(isRestaurantRelevantForDish('Đồng Tiến Bakery - Bánh Mì & Bánh Ngọt', dish), false);
  assert.equal(isRestaurantRelevantForDish('Bánh Cuốn Nóng Kim Chi', dish), false);
  assert.equal(isRestaurantRelevantForDish('Trà Sữa Bánh Flan', dish), false);
});

test('filterRelevantRestaurants correctly filters an array of restaurants', () => {
  const restaurants = [
    { name: 'Bún Chả Cá Tam Giác - Dũng Sĩ Thanh Khê', rating: 4.8 },
    { name: 'Bún Chả Cá Bà Lữ - Nam Trân', rating: 4.7 },
    { name: 'Phở Nam Định & Bún Chả Hà Nội', rating: 4.5 },
    { name: 'Bún Chả 1986', rating: 4.9 },
  ];

  const filtered = filterRelevantRestaurants(restaurants, 'Bún chả');
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].name, 'Phở Nam Định & Bún Chả Hà Nội');
  assert.equal(filtered[1].name, 'Bún Chả 1986');
});
