# Linh thú FoodTour v2 — bàn giao và kiểm thử

Ngày 02/10/2026. Đã tích hợp trên local; chưa triển khai production.

## Phần hoàn tất

- Màn hình linh thú riêng: artwork mèo ôm bát 188px trên mobile thông thường, thu còn 130px khi màn hình thấp; phong cách khối mềm bằng SVG local. Sáu phụ kiện theo cấp, không thêm thư viện hoặc tài nguyên ngoài.
- XP và cấp là tiến độ chính; đã gỡ chuỗi ngày khỏi giao diện. Thanh hiển thị tiến độ trong cấp; 18 XP ở cấp 2 là 53,3%. Đổi tên 2–20 grapheme, hỗ trợ tiếng Việt và emoji. Xem lại các cấp đã mở bằng hai mũi tên cạnh linh thú; nút dừng ở giới hạn, không lộ tạo hình chưa mở. Phản ứng chào không cộng XP, chia sẻ theo cơ chế hiện có.
- Sổ tay riêng giữ 72 mục, các bộ lọc và hàng khoảng 52px. Đi lại bằng nút, browser Back; Escape/đóng trả focus về nơi mở.
- Tiến độ v2 lưu XP và ID đã thử trong cùng snapshot, chống cộng trùng kết quả quay. Thông báo lỗi lưu và Retry; hợp nhất thao tác hai tab bằng Web Locks.
- “Cách nuôi bé” có hai hàng trung tính: quay +1 XP và mở quán ShopeeFood +2 XP. Thưởng mở quán tối đa một lần/ngày, dùng chung giữa các quán và tab; không cộng khi mở lại popup từ pet.
- Widget giữ vùng trên carousel; huy hiệu hiển thị cấp. Không đổi thuật toán, profile hoặc nhịp quay. Các thay đổi bộ lọc/bố cục có sẵn trong workspace được giữ lại.

## Kết quả vòng triển khai trước

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm test` | 98/98 unit test đạt; kiểm tra personal pool đạt |
| `pnpm build` | TypeScript và Vite production build đạt |
| `git diff --check` | Đạt |
| `FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-companion.browser.mjs` | 28/28: layout, focus, đổi tên, Back, cấp, reduced motion và quay thực tế |
| `FOODTOUR_QA_ENGINES=chromium,webkit node tests/city-journal.browser.mjs` | 16/16: bộ lọc, hàng gọn, trạng thái trống, ±5 XP, reload, keyboard |
| `FOODTOUR_QA_ENGINES=chromium,webkit node tests/foodie-progress.browser.mjs` | 16/16: migration, lỗi lưu/Retry, hai tab, người mới, +2 XP mở quán/cap qua ngày, link không hợp lệ, deep link đồng bộ |
| Kiểm tra bổ sung Chromium/WebKit | Chữ modal tăng 200%; viewport thấp 390×400 khi nhập tên; nút đóng và thao tác vẫn truy cập được, không tràn ngang |

Viewport kiểm tra gồm 320×568, 360×640, 390×740, 390×844, 430×932, ngang 740×390 và desktop 1280×900. Nút quay trang chính và trong pet modal thấy ngay ở các viewport dọc mặc định. Ở màn hình ngang thấp, nội dung modal cuộn để tới thao tác. Khi chữ phóng lớn hoặc trình bày lỗi lưu, cho phép nội dung cuộn tự nhiên.

Hai lần quay lên cấp 99→100 và 199→200 được kiểm tra với reduced motion và chuyển động thường: popup kết quả vẫn xuất hiện, đúng +1 XP, không tự mở pet modal, thời lượng theo profile cũ.

Lỗi phát hiện và sửa: sau khi đổi tên gặp lỗi storage, Retry lưu thành công nhưng thông báo lỗi cũ còn hiện. Bản cuối đã xóa lỗi cũ đúng khi tên được ghi thành công, giữ lỗi nhập tên nếu người dùng đang sửa bản khác. Regression đạt trên hai engine.

Các context QA độc lập, chặn kết nối ngoài; không mở link affiliate, gửi nội dung chia sẻ hoặc sửa dữ liệu browser thật của người dùng. Dữ liệu 18/90/99/199 XP và 7 ngày trong ảnh là fixture, không phải số liệu sản phẩm.

## Dữ liệu và thay đổi hành vi đã chốt

- Khóa chính: `foodtour_foodie_progress_v2`; trường `schemaVersion: 2`, `xp`, chuỗi/ngày, tên, bộ đếm, `checkedSpotIds`, `completedSpinIds`.
- Hai khóa v1 `foodtour_foodie_streak_v1` và `foodtour_must_try_checklist_v1` giữ nguyên byte làm bản sao trước chuyển đổi. Không tính lại XP từ checkbox. Nếu v2 JSON hỏng, bản raw được giữ ở `foodtour_foodie_progress_v2_recovery` trước khôi phục.
- Người mới bắt đầu 3 XP; trường chuỗi cũ vẫn có 0 ngày để tương thích, không còn UI chuỗi; ngày đầu chỉ có sau lượt quay hoàn tất. Giữ nguyên chuỗi và điểm của người dùng cũ. Không cộng thêm thưởng điểm danh. Thưởng mở quán +2 XP giới hạn một lần/ngày theo Việt Nam.
- Cấp tính từ XP hiện tại; bỏ dấu đã thử trừ 5 XP (sàn 0) và có thể giảm cấp/phụ kiện. Không có lịch sử phụ kiện đã mở khóa độc lập.
- `rewardedRestaurantDates` chống cộng trùng +2 XP theo ngày; `lastRestaurantRewardDate` lấy ngày lớn nhất, không suy ra đã đặt hàng/hoa hồng. Parser v2 cũ bổ sung trường trống, không cấp thưởng hồi tố.
- Ngày mới dùng `Asia/Ho_Chi_Minh`. V1 chỉ lưu YYYY-MM-DD theo thiết bị, không có timestamp/múi giờ gốc: giữ nguyên ngày cũ, không thể chuyển chính xác người từng dùng ở múi giờ khác quanh nửa đêm.
- Khi storage bị chặn, thay đổi chờ nằm trong bộ nhớ phiên; cần Retry thành công trước reload/đóng trang. Trình duyệt không hỗ trợ Web Locks chỉ bảo đảm tuần tự trong một tab.

Khôi phục thủ công khi cần: xuất/copy cả ba khóa và recovery trước; đóng các tab ứng dụng khác. Chỉ sau khi giữ bản sao, xóa khóa v2 rồi tải lại sẽ chuyển lại dữ liệu v1. Cách này chỉ trở về thời điểm trước nâng cấp và không chứa các tiến độ phát sinh trong v2, nên không dùng như nút reset thông thường.

## Tài nguyên và giới hạn

- `index.html`: bảng bàn giao ảnh chụp desktop/mobile và liên kết ứng dụng local.
- `mascot-levels.html` / `mascot-levels.png`: sáu tạo hình ở cỡ lớn và nhỏ; SVG gốc được tạo trong source, không sao chép mascot tham chiếu.
- `browser-qa/`, `journal-qa/`, `progress-qa/`: ảnh chụp và JSON báo cáo.
- `accessibility-qa/`: ảnh chữ phóng lớn, báo cáo viewport nhỏ khi nhập tên. Đây là mô phỏng, không phải bàn phím iOS thật.

Chưa thử iPhone/Android vật lý, VoiceOver/TalkBack hoặc bảng chia sẻ hệ điều hành thật. WebKit tự động không thay thế kiểm tra Safari iPhone. Hiệu quả retention/chuyển đổi cần đánh giá sau với người dùng thật.

Đã triển khai phần thưởng mở quán của P3 theo phản hồi mới. Tủ phụ kiện và huy hiệu lịch sử vẫn để sau.

## Kiểm thử bổ sung cho ShopeeFood

- Bấm CTA quán thực tế đã render cộng +2; bấm lại, mở quán khác và reload cùng ngày không cộng lại. Ngày Việt Nam kế tiếp nhận +2 mới.
- Link rút gọn của quán được đối chiếu với URL gốc quán hiện có trong database/cấu hình. Link app hub chung, trang chủ, tìm kiếm, Grab, xem popup hoặc nút chuyển từ pet không được thưởng.
- Hai tab bấm đồng thời vẫn chỉ nhận một thưởng/ngày. Nếu storage lỗi, điều hướng vẫn được thực hiện trong sự kiện bấm, tiến độ ở trạng thái chờ; Retry lưu đúng một lần.
- Test chặn mạng ngoài và thay riêng điểm gán location trong module trả về trình duyệt test bằng bộ ghi nhận cục bộ. URL deep link vẫn được tạo đồng bộ với nguyên link affiliate; không mở app ngoài hoặc phát sinh click affiliate thật trong QA.
- 28 + 16 = 44 kịch bản Chromium/WebKit chạy lại cho đợt phản hồi này, tất cả đạt. Báo cáo journal 16/16 thuộc vòng kiểm tra trước; các kiểm tra điều hướng và ±5 XP vẫn có trong bộ regression đợt này.
- Artwork/mute/thuật toán chọn món không thay đổi. Chưa kiểm tra native app ShopeeFood hoặc attribution thực tế.


## Cập nhật cuối: xem cấp bằng hai mũi tên

- Bỏ lưới cấp và khung xem riêng; chỉ một linh thú lớn ở giữa, hai nút trái/phải 44px ở hai bên. Nút dừng tại cấp 1 và cấp hiện tại; không render tạo hình chưa mở trong DOM.
- Trạng thái xem thuộc riêng `FoodiePetLevels`, không ghi storage hoặc đổi XP/cấp thật. Tên cấp thay đổi theo linh thú đang xem; tiến độ bên dưới vẫn giữ dữ liệu thật. Mở lại modal hoặc cấp thực tế thay đổi sẽ trở về cấp hiện tại.
- Nút giới hạn dùng `aria-disabled` với handler bị chặn bằng giới hạn giá trị, vẫn giữ focus để người dùng bàn phím có thể đi ngược lại. Phím trái/phải chỉ áp dụng trong vùng linh thú, không chiếm phím khi nhập tên.
- Chuyển tạo hình nhẹ 160ms, tắt với reduced motion. Quay hoàn tất vẫn +1 XP không giới hạn; không sửa engine/nhịp quay trong cập nhật này.
- Đã sửa lỗi pressed state toàn cục ghi đè transform căn giữa, khiến nút lệch khỏi điểm chạm: căn nút bằng `top` thay vì transform.

Kết quả cuối: **26/26 kiểm tra giao diện + 2/2 kiểm tra không tự cộng XP**, trên Chromium và WebKit. Gồm viewport 320×568, 360×640, 390×844, 430×932 và desktop 1280×900; cấp 1/5/6; chuột thật, bàn phím, thao tác liên tiếp, focus, giới hạn cấp, chỉ một linh thú, không đổi storage, đóng/mở lại, thay đổi cấp thực, reduced motion và nút quay nằm trong màn hình đầu. Kiểm tra thêm cấp 5 ở 320×568 không tràn ngang, nút quay vẫn thấy ngay.

`pnpm test`: 98/98 unit test và personal pool đạt. `pnpm build` và `git diff --check` đạt. Báo cáo mới ở `arrow-qa/report-filtered.json` và `progress-qa/report-filtered.json`. Các ảnh trong `browser-qa/` lưu phiên bản trước, không đại diện phần xem cấp hiện tại. Chưa thử thiết bị iPhone/Android vật lý.
