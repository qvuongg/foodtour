# Đưa Foodtour lên Vercel

1. Truy cập https://vercel.com/new và đăng nhập.
2. Kết nối GitHub và cho Vercel quyền truy cập repo `qvuongg/foodtour`.
3. Chọn **Import** ở repo `foodtour`.
4. Giữ **Root Directory** là thư mục gốc (`./`), framework **Vite**.
5. Cấu hình build đã nằm trong `vercel.json`: pnpm 12.3.4, lệnh build `pnpm run build`, output `dist`. Không cần nhập biến môi trường.
6. Nhấn **Deploy**. Khi trạng thái là **Ready**, mở địa chỉ `.vercel.app` được cấp.

Ứng dụng yêu cầu Node.js từ 22.12 trở lên (xem `package.json`). Có thể chọn Node.js 22.x trong Project Settings → Build and Deployment nếu cần.

Sau khi kết nối Git, mỗi lần đẩy commit lên nhánh production `main`, Vercel tự triển khai phiên bản mới. Các nhánh khác có bản Preview.

Đây là frontend tĩnh, không cần backend hay cơ sở dữ liệu. Sở thích và danh sách món được lưu bằng cookie theo trình duyệt và tên miền; dữ liệu localhost không tự chuyển sang tên miền Vercel.

Nếu cần gắn tên miền riêng, mở Settings → Domains trong dự án Vercel và làm theo bản ghi DNS mà Vercel cung cấp.

Tài liệu: https://vercel.com/docs/frameworks/frontend/vite
