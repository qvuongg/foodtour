import test from 'node:test';
import assert from 'node:assert/strict';
import { isRestaurantRelevantForDish, filterRelevantRestaurants } from '../src/lib/dish-relevance.ts';

test('isRestaurantRelevantForDish correctly validates genuine Bánh xèo restaurants', () => {
  const dish = 'Bánh xèo';

  // Positive cases
  assert.equal(isRestaurantRelevantForDish('Quán 307 - Bánh Xèo & Nem Lụi', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bánh Xèo Tôm Nhảy Cô Ba', dish), true);
  assert.equal(isRestaurantRelevantForDish('Đặc Sản Đà Nẵng - Nem Lụi & Bánh Căn', dish), true);
  assert.equal(isRestaurantRelevantForDish('Bà Dưỡng - Bánh Xèo', dish), true);

  // Negative cases (mismatched dishes)
  assert.equal(isRestaurantRelevantForDish('Kichi - Bánh Cá Taiyaki', dish), false);
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

  // Bún bò Huế
  assert.equal(isRestaurantRelevantForDish('Bún Bò Huế Bà Gái', 'Bún bò Huế'), true);
  assert.equal(isRestaurantRelevantForDish('Bún Thịt Nướng Bà Trai', 'Bún bò Huế'), false);
});

test('filterRelevantRestaurants correctly filters an array of restaurants', () => {
  const restaurants = [
    { name: 'Kichi - Bánh Cá Taiyaki', rating: 4.8 },
    { name: 'Bánh Canh Dốc', rating: 4.5 },
    { name: 'Quán 307 - Bánh Xèo Nem Lụi', rating: 4.9 },
    { name: 'Bà Dưỡng', rating: 4.7 },
  ];

  const filtered = filterRelevantRestaurants(restaurants, 'Bánh xèo');
  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].name, 'Quán 307 - Bánh Xèo Nem Lụi');
  assert.equal(filtered[1].name, 'Bà Dưỡng');
});
