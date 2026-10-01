# Linh thú đồng hành — bản mobile

Ngày thiết kế: 01/10/2026. Triển khai trong ứng dụng hiện tại; không xuất bản production.

**Cập nhật sổ tay:** phiên bản sau đã thu gọn hero và danh sách, bổ sung nhóm món ăn/đồ uống cùng 72 mục. Xem [thiết kế và kiểm thử mới](../city-journal/README.md). Ảnh sheet trong bảng thiết kế đã được cập nhật theo phiên bản này.

## Ý tưởng

Mèo ôm bát ăn, nét nâu ấm, lông kem, khăn và bát đổi sắc theo cấp lửa. Dùng SVG local tự vẽ, không có ảnh/font/API bên ngoài hoặc thư viện chuyển động mới. Điểm lửa nằm trong huy hiệu nhỏ có mũi tên để gợi ý có thể bấm.

## Vị trí và kích thước

- Mobile dọc: linh thú ở góc phải của vùng trống trên carousel, đúng khu vực được khoanh trong ảnh tham chiếu. Neo theo `case-panel`, không dùng fixed theo màn hình; cuộn xuống danh sách món thì linh thú cũng rời màn hình.
- Header mobile giữ logo, khu vực và Menu; không hiển thị lặp pill linh thú trên header.
- Kích thước thường: nút khoảng 102 × 119 px, vùng SVG 92 × 95 px.
- Khi phần carousel thấp hơn 560 px: avatar 72 × 74 px, dành khoảng trống phía trên thẻ món để tránh che tên/ảnh món.
- Khi phần carousel thấp hơn 360 px: avatar 56 × 58 px và thẻ món co theo chiều cao thực tế để không bị cắt.
- Viewport rất thấp (≤500 px): nút thu gọn trở lại header; desktop giữ nút header. Đây là phương án dự phòng có chủ đích cho màn hình ngang, không chồng lên nút quay.
- Huy hiệu vẫn đọc được điểm đầy đủ với công nghệ hỗ trợ; số rất lớn chỉ rút gọn ở phần hiển thị.

## Chuyển động và tương tác

- Nhấp nhô tối đa 5 px theo chu kỳ 4,8 giây; chớp mắt nhẹ, bóng bên dưới đổi độ rộng/độ mờ.
- Phản hồi điểm tăng tồn tại 1,1 giây; không tự tạo điểm khi mở linh thú.
- Tạm dừng chuyển động khi quay, mở overlay, tab bị ẩn hoặc linh thú rời viewport. Tôn trọng `prefers-reduced-motion`.
- Bấm nút mở sheet “Linh thú ẩm thực”. Nút bị khóa khi vòng quay đang chạy.
- SVG dùng ID riêng cho mỗi instance, tránh lỗi màu khi header, widget và sheet cùng tồn tại.

## Sheet

- Header gọn, nút đóng 44 px, một vùng cuộn cho toàn bộ nội dung, padding safe area.
- Hero hiển thị rõ tên linh thú, cấp lửa, **điểm lửa** và **chuỗi ngày** riêng biệt, tiến độ lên cấp.
- Sổ tay món đã thử giữ ba thành phố, bộ lọc, tick/bỏ tick, chia sẻ và liên kết có sẵn.
- Base UI Dialog quản lý khóa cuộn nền, focus, Escape và khôi phục focus khi đóng.
- Checkbox toàn hàng; không bắt người dùng chạm chính xác ô vuông nhỏ. Có trạng thái rỗng và thông báo cho trình đọc màn hình.
- Hai ngôn ngữ Việt/Anh; văn bản hiển thị dựa trên dữ liệu có sẵn.

## Phạm vi được giữ nguyên

Thuật toán/xác suất/nhịp quay, cách cộng +1 sau lượt quay hoàn tất, checklist +5/−5, mốc cấp 3/100/200, ID checklist và khóa localStorage không thay đổi. Không thêm cơ chế combo, thưởng giả, thông báo thúc ép hay hệ thống lưu trữ mới từ bản ý tưởng.

## Kiểm chứng

`pnpm test`, `pnpm build`, và `node tests/foodie-companion.browser.mjs` với dev server tại `http://127.0.0.1:5173`. Có thể đặt `FOODTOUR_QA_URL` khi dùng preview server.

Browser QA dùng context riêng, dữ liệu mẫu được ghi riêng trong context đó và chặn request tới Supabase; không thao tác dữ liệu thật hoặc mở link đặt hàng. Ảnh minh họa có thể dùng fixture 90 điểm/7 ngày để kiểm tra khả năng hiển thị, không phải thành tích người dùng thật.

Kiểm thử WebKit mô phỏng không thay thế kiểm thử Safari trên iPhone vật lý. Kết quả chi tiết và ảnh cuối nằm cùng thư mục này.

### Kết quả cuối

- TypeScript và production build: đạt.
- Bộ test dự án: 66/66 đạt, kiểm tra personal pool đạt.
- Browser regression: 28/28 đạt, chia đều Chromium và WebKit. Xem `browser-qa/report.json`.
- Kích thước dọc: 320×568, 360×640, 375×667, 390×844, 430×932, 390×740. Kiểm tra thêm ngang 740×390 và desktop 1280×900.
- Đã sửa hai vấn đề tìm được qua kiểm thử: dock màn hình ngang bị đẩy nút quay ra ngoài viewport; Safari không tự focus nút khi chạm nên cần ghi nhận nút mở trước khi dialog lấy focus.
- Đã xác nhận ảnh món và linh thú không đè nhau, focus bàn phím/Escape, tick/bỏ tick và tải lại, cộng điểm đúng một lần khi quay xong, chuyển cấp 99→100 và 199→200, tiếng Anh, reduced motion và dừng carousel phía sau sheet.
- Chưa kiểm tra trên iPhone vật lý, giao dịch affiliate hoặc chia sẻ tới dịch vụ thật; các thao tác này không thuộc phạm vi thay đổi.

### File bàn giao

- `mobile-companion-design.html`: bảng thiết kế độc lập, chứa sẵn ảnh và bốn biến thể SVG; mở offline được.
- `mobile-home.png`, `mobile-sheet.png`, `mobile-compact.png`: ảnh chụp bản triển khai đã hoàn thiện.
- `design-board.png`: toàn bộ bảng thiết kế dạng ảnh.
- `../../tests/foodie-companion.browser.mjs`: kịch bản kiểm thử có thể chạy lại. Đặt `FOODTOUR_QA_ENGINES=chromium,webkit` để chạy cả hai engine.
