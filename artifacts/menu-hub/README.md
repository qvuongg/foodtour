# Menu, cài đặt và Happy Hour — 02/10/2026

Đã tích hợp local; chưa triển khai production.

## Trải nghiệm

- Menu mở từ bên trái, đẩy trang và thanh quay sang phải, giữ một phần trang để chạm đóng. Dùng Base UI Dialog cho focus, Escape và khóa tương tác nền; cuộn trong menu. Giữ vị trí cuộn của trang khi đóng.
- Ba mục: Voucher, Checklist món local, Happy Hour. Checklist mở sổ tay hiện có, giữ ID món, dấu đã thử và XP. Không tạo bản sao checklist.
- Nút bánh răng riêng cạnh Menu; bỏ huy hiệu VN khỏi header. Âm lượng và ngôn ngữ giữ cơ chế lưu cookie đang có. “Món của tôi” mở được cả khi đang chọn nhóm đồ uống/ăn vặt, và vẫn ghi rõ chỉ chỉnh danh mục ăn trưa.
- Voucher và Happy Hour chỉ tải code/giao diện khi mở mục tương ứng, tránh tải thêm toàn bộ tiện ích ở màn hình chọn món ban đầu.
- Happy Hour: ngân sách tổng 100.000–2.000.000đ, bước 25.000đ, 2–20 người; mỗi người một đồ uống và một phần trái cây/ăn vặt. Tối đa sáu phương án từ catalog local, cộng tiền theo đúng đơn giá × số phần. Không tự tăng giá/khẩu phần để dùng hết ngân sách. Giá tham khảo, chưa gồm giao hàng; không tạo đơn hàng hay cộng XP.
- 500.000đ / 5 người hiện gợi ý 5 latte × 55.000đ và 5 phần trái cây dầm × 40.000đ: tổng 475.000đ, còn 25.000đ. Thiếu ngân sách hiển thị mức tối thiểu và cách điều chỉnh.

## Voucher theo nguồn người dùng cung cấp

Nguồn: https://shopeefood.vn/food/collection-list, đọc ngày 02/10/2026. Trang nguồn mặc định hiển thị TP.HCM. Lấy 12 URL bộ sưu tập trên trang đầu, kèm đường dẫn xem danh sách đầy đủ. Đây là snapshot local, không có crawler/API chạy khi người dùng mở menu.

Dùng link HTTPS công khai của từng bộ sưu tập; không tự chế tracking, không gọi helper thưởng mở quán. Các link này chưa phải link affiliate của tài khoản. Nhãn được rút gọn theo chủ đề, không hứa mức giảm, thời hạn hoặc tính đủ điều kiện. Người dùng xem chương trình hiện hành và chọn khu vực trên ShopeeFood. Một số trang chi tiết trả rỗng/timeout khi đọc bằng công cụ; URL được đối chiếu từ danh sách nguồn, không khẳng định mọi chiến dịch còn hiệu lực.

## Kiểm thử

- pnpm đúng phiên bản 9.1.1. `pnpm test`: 104/104 và personal pool đạt; sáu test Happy Hour kiểm tra 1.463 tổ hợp ngân sách/số người, đầu vào lỗi, thiếu tiền và phương án thay thế.
- Browser QA cuối: **28/28 đạt**, cô lập Chromium + WebKit: viewport 320×568, 360×640, 390×844, 430×932, 1280×800; menu đẩy trang/dock, touch target, focus, Escape, đóng bằng phần trang bên phải, cuộn trang, reduced motion, cài đặt/lưu ngôn ngữ và âm lượng, checklist/XP, Happy Hour tính tiền/giới hạn/trạng thái trống. Báo cáo ở `report.json`, bao gồm 12 link Voucher mới và kiểm tra focus khi đi vào/quay lại hai mục tải theo nhu cầu.
- Quay thực tế/lên cấp reduced motion và bình thường: 4/4 đạt, giữ popup kết quả, nhịp quay và +1 XP. Báo cáo `spin-regression.json`.
- `pnpm build` và `git diff --check` đạt.
- Test chặn toàn bộ mạng ngoài; chỉ kiểm tra đích liên kết, không tạo click affiliate/đơn hàng hoặc sửa dữ liệu trình duyệt thật.

Chưa kiểm tra iPhone/Android vật lý, VoiceOver/TalkBack và chuyển sang app Shopee thực. WebKit tự động là mô phỏng. Build có cảnh báo chunk JS chính vượt 500kB; đã tách tải Voucher/Happy Hour theo nhu cầu, không thêm thư viện mới; phần JS chính còn khoảng 504kB trước gzip.
