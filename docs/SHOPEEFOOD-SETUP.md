# ShopeeFood trong popup kết quả

## Luồng đang triển khai

- Quay và popup giữ nguyên kết quả do thuật toán hiện tại chọn.
- Bấm món trong phần 02 để mở cùng popup, không tăng lượt quay hoặc đổi kết quả quay trước đó. Thẻ hỗ trợ Enter/Space; đóng popup trả focus về thẻ. Khóa chọn trực tiếp khi đang quay.
- Không có nút sao chép tên món; liên kết tìm kiếm vẫn dùng tên tiếng Việt ở cả hai ngôn ngữ.
- Chọn TP. HCM hoặc Hà Nội để mở website ShopeeFood với tên món điền sẵn. Khu vực khác dùng “Chọn trên ShopeeFood”. Khu vực đã chọn lưu qua cookie hiện tại; không thu thập tọa độ.
- Gợi ý quán affiliate chỉ hiện cho tên món đã được chủ website xác nhận. Tìm kiếm thông thường vẫn luôn truy cập được.
- Google Maps và GrabFood nằm trong “Tìm bằng cách khác”.

Đây là tìm kiếm trên website; không cam kết app nhận từ khóa. Người dùng chọn địa chỉ và kiểm tra quán đang nhận đơn trên ShopeeFood. Không có API tìm quán toàn hệ thống, xếp hạng tự động, bán kính 3 km, hoặc xác nhận đơn/hoa hồng trong website này.

## Cấu hình link đã được cấp

Sao chép các biến từ `.env.example` vào `.env.local` hoặc môi trường build:

```dotenv
VITE_SHOPEEFOOD_AFFILIATE_URL=<URL nguyên vẹn do chương trình cấp>
VITE_SHOPEEFOOD_AFFILIATE_RESTAURANT=Bún Đậu Phố Cổ
VITE_SHOPEEFOOD_AFFILIATE_DISHES='["Bún đậu mắm tôm","Bún chả"]'
```

Link người dùng cấp ngày 20/09/2026 đã đặt trong `.env.local` của workspace này. Người dùng xác nhận quán Bún Đậu Phố Cổ bán hai món trên. Không đưa link tài khoản cụ thể vào cấu hình mẫu.

Các biến `VITE_` công khai trong trình duyệt. Chỉ dùng URL chia sẻ, không đặt API secret ở đây. Khi triển khai phải cung cấp lại biến tại môi trường build; `.env.local` không được commit. Khởi động lại Vite hoặc build lại khi thay đổi cấu hình.

Tên món được so khớp nguyên tên sau chuẩn hóa Unicode, chữ thường và khoảng trắng đầu/cuối. “Bún chả cá” hoặc món khác không được gán link “Bún chả”. Quán và link không thay đổi xác suất quay. Link giữ nguyên tham số theo dõi; không thay `restaurantId`, ghép tọa độ, từ khóa hoặc biến link tìm kiếm thường thành affiliate.

Cấu hình thiếu/sai hoặc URL không phải HTTPS trên miền Shopee Việt Nam/ShopeeFood Việt Nam sẽ ẩn gợi ý quán. Kiểm tra miền không chứng minh có hoa hồng hoặc quán giao được tới người dùng.

## Kiểm chứng nguồn và giới hạn

- Đã dùng giao diện tìm kiếm công khai ShopeeFood: “Cơm tấm” ở TP. HCM trả về `/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=...` và danh sách kết quả. Hà Nội có cùng kiểu trang tìm kiếm qua giao diện chính thức.
- Link affiliate người dùng cấp chứa `restaurantId=947982`, `brandId=15544`. Trên desktop, phần thông tin quán không hiển thị khi mở link. Chưa kiểm tra đích đến trong app iOS/Android hay hoa hồng thực tế. Nút tìm trên website là lựa chọn thay thế khi link quán không hoạt động.
- Cần xác nhận điều kiện website, đơn hợp lệ, ghi nhận qua app và việc hiển thị GrabFood song song trong điều khoản tài khoản trước phát hành thương mại. Không suy ra click thành đơn thành công.

## Kiểm thử

`pnpm test` và `pnpm build`. Test bao gồm URL không an toàn, giữ nguyên link tracking, Unicode/từ khóa đặc biệt, khu vực không hỗ trợ và không gán link quán cho món không khớp.

Kiểm thử thủ công: popup sau quay và khi chọn thẻ; không có nút sao chép; khu vực sau reload và cookie bị chặn; gợi ý quán chỉ cho món phù hợp; keyboard/Escape; desktop/mobile. Chuyển app và đối soát đơn cần thiết bị/tài khoản thực.

Kết quả kiểm tra local 20/09/2026: 20 test Node và bộ personal-pool qua; build Vite/TypeScript qua. Đã kiểm tra lượt quay thật và khóa điều khiển; trạng thái copy thành công; giả lập clipboard bị từ chối thì chọn sẵn đúng tên món; khu vực Hà Nội được giữ qua lần mở mới; hai món được gán đúng link, “Bún chả cá” không hiện affiliate; tiếng Anh và Escape. Kiểm tra riêng component trong popup ở desktop và 360 × 640 không tràn ngang, popup cuộn khi cần. Trang kiểm thử tạm đã được gỡ. Chưa giả lập cookie bị chặn trực tiếp trong browser; bộ test cookie hiện có kiểm tra tình huống đó.

Cập nhật 21/09/2026: bỏ ô/nút sao chép và thêm mở popup từ thẻ thực đơn. Đã kiểm tra bấm thẻ, Enter/Space, Escape trả focus đúng thẻ, đổi món và nút “Khám phá tiếp”; chọn trực tiếp giữ nguyên 6 lượt quay và lựa chọn gần nhất. Lượt quay thử tiếp theo khóa toàn bộ thẻ, hiện đúng món kết quả và tăng lên 7 lượt; mở lại trang vẫn giữ kết quả. Popup được kiểm tra trên desktop và 360 × 640. `pnpm test` (20 test và personal-pool), `pnpm build` đều qua.
