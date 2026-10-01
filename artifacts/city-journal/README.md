# Sổ tay mobile — bản nâng cấp 01/10/2026

- Bản tinh chỉnh theo phản hồi: hàng thông thường giảm từ 68px xuống 52px; tên dài được xuống dòng. Vùng đánh dấu và mũi tên mở chi tiết vẫn có vùng chạm ít nhất 44px.
- Bé linh thú tăng từ 48×49px lên 84×86px, khối tiến độ khoảng 207px trên màn hình 390×844. Giữ thông số điểm/chuỗi ngày gọn, hiển thị lại danh hiệu dưới tên.
- Mô tả, thông tin quán/giá tham khảo và link tìm món chuyển vào phần mở rộng từng hàng. Chỉ mở một mục chi tiết tại một thời điểm; mở chi tiết không đánh dấu hoặc cộng điểm.
- Bộ lọc loại món dùng nền kem, lựa chọn màu cam đất và huy hiệu số lượng. Trạng thái có biểu tượng bộ lọc, nhãn gọn và màu báo khi lọc; vẫn dùng trình chọn native 16px cho mobile và có viền focus rõ.
- Bộ lọc gồm thành phố, Món ăn/Đồ uống và trạng thái Tất cả/Chưa thử/Đã thử. Tiến độ thành phố tính cả hai nhóm.
- 72 mục: 24 mỗi thành phố, gồm 18 món ăn và 6 đồ uống. Giữ nguyên 30 ID và dữ liệu đã đánh dấu. Mẫu số tiến độ tăng theo danh sách mới; điểm không thay đổi chỉ vì thêm món.
- Không thêm thư viện, API hoặc dữ liệu quán/giá phỏng đoán. [Nguồn biên tập](../foodie-companion/JOURNAL-SOURCES.md).

## Kiểm thử

- `pnpm test`: 67/67 đạt, kiểm tra personal pool đạt.
- `pnpm build`: đạt, gồm TypeScript.
- `FOODTOUR_QA_ENGINES=chromium,webkit node tests/city-journal.browser.mjs`: 16/16 đạt, kết quả tại `browser-qa/report.json`.
- `FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-companion.browser.mjs`: 28/28 đạt ở lần nâng cấp danh mục trước; lần tinh chỉnh kích thước này kiểm tra lại bằng bộ journal 16 trường hợp và build.
- Kích thước journal: 320×568, 360×640, 390×844, 430×932. Đã kiểm tra bàn phím, Escape/focus, tiếng Anh, reduced motion, toàn bộ kết hợp bộ lọc, dữ liệu cũ và cộng/trừ điểm sau reload.
- Browser automation dùng context cô lập, chặn mạng ngoài; không thao tác dữ liệu thật, đặt hàng hoặc chia sẻ. Chưa kiểm tra trên iPhone vật lý.

## Bàn giao

`mobile-journal-design.html` chứa sẵn hai ảnh chụp và mô tả thiết kế, mở offline được. Ảnh `mobile-foods.png`, `mobile-drinks.png`, `mobile-danang-drinks.png`, `mobile-details.png` chụp bản triển khai local với dữ liệu kiểm thử 90 điểm / 7 ngày. `design-board.png` là ảnh toàn bộ bảng thiết kế.
