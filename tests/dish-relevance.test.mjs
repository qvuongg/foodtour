import test from 'node:test';
import assert from 'node:assert/strict';
import { isRestaurantRelevantForDish, filterRelevantRestaurants } from '../src/lib/dish-relevance.ts';

test('isRestaurantRelevantForDish strictly differentiates Bún chả (Hà Nội) from Bún chả cá / Bún chả giò', () => {
  const dish = 'Bún chả';

  // Positive cases (Genuine Bún chả / Bún chả Hà Nội)
  assert.equal(isRestaurantRelevantForDish('Bún Chả 1986', dish), true);
  assert.equal(isRestaurantRelevantForDish('Phở Nam Định & Bún Chả Hà Nội', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Hương Liên (Obama) - Lê Văn Hưu', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Đắc Kim - Hàng Mành', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bún Chả Cửa Đông', dish), dish === 'Bún chả');
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

test('isRestaurantRelevantForDish correctly distinguishes other dishes', () => {
  // Cơm tấm
  assert.equal(isRestaurantRelevantForDish('Cơm Tấm Sườn Bì Chả Ba Ghiền', 'Cơm tấm'), true);
  assert.equal(isRestaurantRelevantForDish('Trà Sữa TocoToco', 'Cơm tấm'), false);

  // Phở bò
  assert.equal(isRestaurantRelevantForDish('Phở Bò Gia Truyền Nam Định', 'Phở bò'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Bò Huế O Oanh', 'Phở bò'), false);
  assert.equal(isRestaurantRelevantForDish('Phở Cuốn Hương Mai', 'Phở bò'), false);

  // Bún bò Huế
  assert.equal(isRestaurantRelevantForDish('Bún Bò Huế Bà Gái', 'Bún bò Huế'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Thịt Nướng Bà Trai', 'Bún bò Huế'), false);
  assert.equal(isRestaurantRelevantForDish('Bún Bò Nam Bộ Cô Ba', 'Bún bò Huế'), false);

  // Cơm gà Hội An vs Cơm gà xối mỡ
  assert.equal(isRestaurantRelevantForDish('Cơm Gà Bà Buội - Chuẩn Vị Hội An', 'Cơm gà Hội An'), true);
  assert.equal(isRestaurantRelevantForDish('Cơm Gà Xối Mỡ 142', 'Cơm gà Hội An'), false);
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
