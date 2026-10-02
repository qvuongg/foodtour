# Điều chỉnh Menu và Checklist — 02/10/2026

Đã tích hợp local, chưa triển khai production.

- Header chỉ còn hai icon Menu 19px và Cài đặt 18px, không chữ, viền hay nền nút mặc định. Vùng chạm trong suốt vẫn 44px; focus bàn phím được giữ.
- Menu mở từ bên phải, đẩy trang và dock sang trái. Chạm phần trang còn lại bên trái để đóng. Giữ cuộn trang, focus và reduced motion.
- Checklist món local mở trong chính menu, cùng header/quay lại/vùng cuộn với Voucher và Happy Hour; không mở popup thứ hai. Bộ lọc thành phố, món ăn/đồ uống, trạng thái cùng chi tiết món được giữ; bố cục hẹp xếp bộ lọc theo hàng riêng.
- Bỏ lối vào Sổ tay trong màn hình linh thú. Dữ liệu đã thử và quy tắc +5/−5 XP giữ nguyên trong checklist; không chỉnh engine quay hoặc thưởng ShopeeFood.
- Checklist tải theo nhu cầu như hai tiện ích còn lại. `LocalChecklist` dùng chung nội dung với wrapper cũ, không sao chép logic lưu dữ liệu.

## Kiểm thử

`pnpm test`: 104/104 và personal pool đạt. `pnpm typecheck`, `pnpm build`, `git diff --check` đạt. Build chính khoảng 494,9kB (154,1kB gzip), không còn cảnh báo chunk vượt 500kB.

Browser QA cuối **34/34 đạt** và ảnh trong thư mục này: Chromium/WebKit, viewport mobile 320–430px và desktop; kiểm tra chiều đẩy trang/dock, icon/44px, Escape/focus, đóng bằng dải trang trái, giữ vị trí cuộn, checklist trong menu, bộ lọc/trạng thái trống/chi tiết, ±5 XP/lưu/reload/lỗi lưu và thử lại, cùng việc gỡ lối vào sổ tay trên linh thú. Báo cáo kết quả cuối: `report.json`.

Các suite hồi quy sổ tay/linh thú/tiến độ đã cập nhật đường điều hướng mới; **22 kiểm tra bổ sung đạt**; báo cáo bổ sung được giữ trong thư mục `artifacts/foodie-pet-v2` và `artifacts/city-journal` theo cấu hình từng suite. QA dùng dữ liệu cô lập, chặn mạng ngoài, không tạo click affiliate hoặc thay dữ liệu browser thật.

Chưa thử iPhone/Android vật lý hoặc VoiceOver/TalkBack. Ảnh `mobile-390-home.png`, `mobile-390-menu.png`, `mobile-390-checklist.png`, `mobile-320-checklist.png` chụp ứng dụng local.
