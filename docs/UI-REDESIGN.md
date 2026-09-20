# Food Spotlight — giao diện local

## Thiết kế

Nền kem, chữ than, cam đỏ cho hành động chính và lime cho điểm nhấn. Carousel khám phá có card trung tâm nổi bật, điều hướng bằng nút hoặc phím trái/phải khi focus trong carousel. Trạng thái khám phá tách biệt khỏi thuật toán chọn món và kết quả đã lưu.

Cập nhật hiệu ứng theo yêu cầu: dùng cùng carousel trong lúc quay, tăng tốc nhẹ rồi giảm tốc về đúng tâm. Giữ profile tổng thời gian và thuật toán xác suất cũ; đường cong chuyển động và cách trình bày được đổi. Kết quả hiện tại chỗ, không mở dialog. Reduced motion giữ thời gian chờ nhưng không chạy dải thẻ. Bộ lọc ngân sách/chay, cookie, danh sách cá nhân, tiếng Việt/Anh và các liên kết tìm quán được giữ lại. Âm thanh đồng bộ với tùy chọn được khôi phục từ cookie.

Các phần chính:

- `src/components/food-spotlight.tsx`: carousel khám phá, không ghi cookie hoặc chọn kết quả.
- `src/components/food-image.tsx`: hiển thị atlas món ăn local và hình mặc định cho món cá nhân.
- `src/app/globals.css`: tokens, layout, responsive, reel, dialog, reduced motion; thay các lớp style ghi đè cũ.
- `src/app/page.tsx`: ghép các phần giao diện với luồng quay hiện tại.
- `src/components/preferences-panel.tsx`: giao diện tùy chỉnh, bổ sung trạng thái tìm kiếm rỗng.

Không thêm dependency của ứng dụng, API, font/ảnh từ xa hoặc dịch vụ bên ngoài.

## Kiểm chứng ngày 18/09/2026

- `pnpm test`: 7 bài kiểm tra Node và bộ personal-pool đều thành công.
- `pnpm build`: TypeScript và Vite thành công.
- `git diff --check`: thành công.
- Chrome headless qua Playwright: quay thường và reduced motion; khóa nút khi quay; tên kết quả khớp cookie và card dưới vạch chọn.
- Duyệt bằng nút/phím trái-phải; đóng dialog bằng Escape và trả focus về nút mở.
- Thêm, sửa, xóa món cá nhân; báo lỗi tên rỗng; món và bộ lọc còn sau reload.
- Giá tùy chỉnh ngoài khoảng quy định khóa nút quay; giá hợp lệ mở lại nút.
- Việt/Anh được lưu và cập nhật thuộc tính `lang`.
- Danh sách có một món không chay + bật bộ lọc chay: hiển thị trạng thái rỗng, khóa quay.
- Cookie bị chặn: hiển thị thông báo không thể lưu.
- Không tràn ngang ở chiều rộng 360, 390, 768, 1024px; xem ảnh desktop 1440px và mobile 390px.
- Không ghi nhận lỗi JavaScript hoặc request tài nguyên ra ngoài localhost trong lượt kiểm tra chính.
- axe-core với WCAG 2 A/AA và WCAG 2.1 AA: không có vi phạm tự động trên trang chính desktop/mobile, dialog kết quả và bảng tùy chỉnh. Đây không phải chứng nhận accessibility đầy đủ.

Công cụ QA được cài riêng ở `/tmp/foodtour-qa`, không thêm vào dependencies dự án. Các script kiểm tra lần này: `check.cjs`, `edge.cjs`, `final.cjs` trong thư mục đó. Ảnh bàn giao nằm ở `/Users/buiquocvuong/.codex/visualizations/2026/09/18/food-spotlight/`.

## Giới hạn

- Chưa kiểm thử trên thiết bị iOS/Android thật, Safari/Firefox hoặc bằng trình đọc màn hình thực tế.
- Chưa đo hiệu năng trên điện thoại cấu hình thấp; không thêm thư viện animation/WebGL.
- Chưa xác minh toàn bộ demo Premium của GetLayers; thiết kế là concept Food Spotlight riêng.
- `PRODUCT_PHILOSOPHY.md` trong repository infrastructure riêng tư không truy cập được; không khẳng định đã tuân thủ tài liệu chưa đọc.
- `AGENTS.md` đã bị xóa trong working tree trước khi thực hiện redesign; không khôi phục hoặc sửa thay đổi đó.

## Kiểm chứng hiệu ứng carousel mới

- Test chuyển động: tiến liên tục, không chạy ngược, vận tốc liên tục ở hai đoạn nối, dừng chính xác tại 1 và vận tốc hai đầu gần 0.
- 8 bài kiểm tra Node và bộ personal-pool thành công.
- Chrome/Playwright: quay liên tiếp hai lần; card trung tâm trùng cookie kết quả; mỗi lần chỉ tăng bộ đếm một lần; duyệt món không đổi dữ liệu kết quả; bộ lọc và nút duyệt bị khóa khi quay.
- Không có popup kết quả. Reduced motion không di chuyển thẻ trước khi công bố kết quả. Mobile 390px không tràn ngang. Không ghi nhận lỗi JavaScript.
- Script kiểm chứng bổ sung: `/tmp/foodtour-qa/spin.cjs`.

## Điều chỉnh mới nhất: popup và carousel chờ

Theo phản hồi tiếp theo, popup kết quả đã được khôi phục, thay thế kết quả tại chỗ ở phần cập nhật trước. Khi chưa quay hoặc sau khi đóng popup, carousel tự trôi chậm (khoảng 6,5 giây mỗi thẻ), các thẻ cùng kích thước và nằm ngang, không nhô lên/zoom. Lúc quay vẫn dùng chuyển động spotlight.

Chuyển động chờ không phát âm thanh, không chọn món và không ghi dữ liệu. Có nút tạm dừng; tạm ngừng khi hover, focus trong carousel, mở popup, ẩn tab hoặc bật reduced motion.

Kiểm chứng qua `/tmp/foodtour-qa/idle.cjs`: trôi tự động; ma trận transform không scale/rotate ở trạng thái chờ; tạm dừng; popup khớp kết quả lưu; Escape đóng popup và trôi lại; reduced motion đứng yên; mobile không tràn ngang; không lỗi JavaScript. 8 test Node, personal-pool, build và diff-check đều qua.

## Điều chỉnh chiều sâu và màn hình đầu

Khôi phục transform có chiều sâu cho carousel trôi chậm; chỉ loại bỏ hiệu ứng nhấn nổi riêng trên card trung tâm. Thu gọn header, tiêu đề, sân khấu và khoảng cách theo cả chiều cao lẫn chiều rộng viewport. Nút ăn chay dùng Sprout có sẵn trong lucide-react (tham khảo https://lucide.dev/icons/sprout), nền xanh nhẹ, biểu tượng mầm cây và trạng thái bật xanh rõ hơn; không tải icon từ xa.

Kiểm tra tự động `/tmp/foodtour-qa/compact.cjs`: toàn bộ nút quay nằm trong viewport ở 1440×900, 1280×720, 1024×600, 768×700, 390×844, 375×667, 360×640 và 360×600 với cấu hình mặc định. Không tràn ngang; carousel giữ transform chiều sâu và tự trôi; bộ lọc chay hoạt động và giữ sau reload.

## Mirror Hall — 20/09/2026

Đã quan sát preview công khai Mirror Hall trên GetLayers. Triển khai độc lập bằng CSS 3D: dãy thẻ đứng trên vòng cung lõm, nền tối xanh than, phản chiếu ảnh có mask và gợn sáng nhẹ. Không sao chép mã/prompt Premium. Giữ tài nguyên món ăn local, thuật toán chọn món, tổng thời gian quay và popup kết quả.

Thêm kéo ngang bằng Pointer Events và quán tính tắt dần. Chỉ giữ bảy thẻ và bảy phản chiếu trong DOM. Chế độ chờ tự trôi; nút tạm dừng dừng cả trôi và gợn sáng. Reduced motion không tự trôi, không có gợn chuyển động.

Kiểm tra qua trình duyệt: kéo đổi món, khóa điều khiển khi quay, popup và thẻ trung tâm cùng hiển thị Cơm chay, đóng Escape trở về carousel. Nút quay nằm trong viewport ở 390×844, 360×640 và 1024×600; không tràn ngang. Bộ 8 test Node và personal-pool qua. Chưa kiểm thử thao tác cảm ứng trên thiết bị thật; phản chiếu là hiệu ứng CSS, không phải mô phỏng nước vật lý.

## Bố cục theo ảnh Mirror Hall người dùng gửi

Bỏ khung nền bo ngoài và phần chân card trắng; tên món ở trên ảnh, giá nằm gọn trên ảnh. Tăng ảnh từ 122px lên 206px ở desktop và từ 89px lên 154px trên mobile thông thường. Các thẻ dùng chung camera CSS perspective ở sân khấu, với tọa độ X/Z theo cùng bán kính vòng cung; phản chiếu nằm cách chân ảnh 3px. Giữ nền kem và không thêm hiệu ứng nhô riêng tại tâm.

Kiểm tra trực quan desktop/mobile, không tràn ngang. Nút quay nằm trong màn hình ở 390×844, 360×640, 1024×600, 1440×900. Quay thử: card trung tâm và popup cùng Cơm chay; đóng popup quay lại chế độ trôi. Build thành công.
