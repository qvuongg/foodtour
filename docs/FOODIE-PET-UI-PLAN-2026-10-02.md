# Linh thú ẩm thực — kế hoạch nâng cấp UI/UX và sản phẩm

Ngày: 02/10/2026. Trạng thái: **đã triển khai P0–P2 trên local**. Đã bổ sung thưởng mở quán ShopeeFood +2 XP theo phản hồi; tủ phụ kiện và huy hiệu chưa triển khai. Báo cáo tại `artifacts/foodie-pet-v2/QA.md`.

Kế hoạch này dựa trên bản đề xuất người dùng, ảnh tham chiếu trong tài liệu và source hiện tại. Nhận xét về tham chiếu chỉ dựa trên ảnh đã xem; không khẳng định đã trải nghiệm tính năng hoặc biết luật tích điểm của TikTok.

## Điều chỉnh đã triển khai theo phản hồi mới

- Xem cấp trực tiếp trên linh thú chính bằng hai nút trái/phải, bỏ lưới cấp và khung xem riêng. Nút trái dừng ở cấp 1; nút phải dừng ở cấp hiện tại, không cho xem tạo hình chưa mở. Nút ở giới hạn chuyển xám, giữ focus và không làm thay đổi dữ liệu.
- Tên cấp dưới linh thú đổi theo cấp đang xem; phần tiến độ luôn phản ánh cấp và XP thật. Khi mở lại modal hoặc cấp thực tế thay đổi, trở về linh thú hiện tại. Hỗ trợ phím trái/phải trong vùng linh thú và reduced motion.
- Quay chọn món **không giới hạn số lượt hoặc XP trong ngày**. Mỗi lượt hoàn tất có ID riêng được +1 XP; callback trùng không được tính như một lượt mới. Giới hạn thưởng mở quán không áp dụng cho quay.

- Gỡ toàn bộ chuỗi ngày và mốc ngày khỏi giao diện; XP là tiến độ chính. Dữ liệu chuỗi cũ được giữ để tương thích, không hiển thị hoặc dùng làm điều kiện nhận thưởng.
- “Cách nuôi bé”: Quay chọn món +1 XP và Mở quán trên ShopeeFood +2 XP. Hai hàng nền kem nhẹ, không dùng CTA cam sáng cho nút quay trong modal. Sổ tay +5 XP vẫn có đường truy cập gọn.
- +2 XP tính khi bấm liên kết quán hợp lệ, tối đa một lần/ngày theo giờ Việt Nam, dùng chung giữa các quán/tab. Không coi click là đơn hàng thành công. Link ngắn cần có quán tương ứng trong catalog/database; mở trang chủ/tìm kiếm/hub chung không nhận thưởng.
- Hàng ShopeeFood trong màn hình linh thú mở lại kết quả món đã chọn; chỉ nút mở quán thật trong kết quả mới cộng XP. Khi chưa chọn món, có hướng dẫn rõ.
- Đã kiểm tra cộng điểm, lỗi lưu/Retry, nhiều tab, qua ngày và giữ thao tác mở app trong cùng sự kiện bấm. Chưa xác nhận trên ứng dụng ShopeeFood cài thực tế.

Phần dưới lưu lại định hướng ban đầu; các điều chỉnh trên thay thế những mục nói về chuỗi ngày hoặc trì hoãn thưởng mở quán.

## 1. Quyết định thiết kế

**Tách linh thú thành một không gian riêng, làm nhân vật thành tâm điểm và giữ sổ tay dễ truy cập.** Lấy cảm hứng từ tỷ lệ nhân vật, ánh sáng mềm và thứ tự thông tin trong ảnh tham chiếu. Xây dựng nhận diện mèo ôm bát của FoodTour với màu kem, cam đất và phụ kiện ẩm thực Việt.

Giá trị chính vẫn là giúp chọn được món. Linh thú ghi nhận hành trình sử dụng, không khiến người dùng phải quay thêm hoặc bấm link quán chỉ để tích điểm.

### Những điểm cần sửa trong plan gốc

| Điểm trong plan gốc | Nâng cấp đề xuất |
| --- | --- |
| Hiện trạng có 30 món | Hiện đã có **72 mục**, 18 món ăn + 6 đồ uống/thành phố, ba thành phố. Giữ bộ lọc và hàng 52px đã tinh chỉnh. |
| Bấm link = đặt món, `totalOrders` | Chỉ biết người dùng yêu cầu mở link. Gọi là **Khám phá quán**, `restaurantOpen`; không hiển thị số đơn hàng hoặc đặt thành công. |
| +1 quay, thêm +1 điểm danh ở đoạn sau | Chốt bản đầu: lượt quay đầu ngày vẫn **+1**, đồng thời duy trì chuỗi; không tự cộng thêm một thưởng trùng. |
| Đổi luật nhưng bỏ qua checklist | Giữ **+5/−5** cho đánh dấu/bỏ đánh dấu. Tách giao diện không làm mất tiến độ hoặc nguồn điểm cũ. |
| Lưu đồng thời `xp` và `score` | Chỉ một nguồn điểm sau chuyển đổi; `score` cũ được chuyển sang `xp` một lần. |
| Timeline như huy hiệu lịch sử | Hiện chưa có lịch sử ngày hoặc huy hiệu đã sở hữu. Bản đầu dùng mốc của chuỗi hiện tại, không dựng lại lịch sử không có dữ liệu. |
| Có nút Trang phục, dấu ba chấm | Chỉ đưa nút lên khi có chức năng thật. Bản đầu dùng **Xem các cấp**; tủ phụ kiện chọn mặc là giai đoạn sau. |
| Thêm nhiều hiệu ứng để giống tham chiếu | Đầu tư vào silhouette, ánh sáng, biểu cảm và một chuyển động chính mỗi thời điểm. Tránh cả thanh XP, pet, lửa và pháo hoa cùng chạy. |

## 2. Kiến trúc trải nghiệm

```text
Widget linh thú trên carousel / nút linh thú trên desktop
    → Linh thú của bạn
        → Cách nuôi bé / tiến độ / chuỗi ngày
        → Xem các cấp: mở rộng trong cùng màn hình
        → Mở sổ tay: chuyển sang Sổ tay ẩm thực

Menu chính
    → Linh thú của bạn
    → Sổ tay ẩm thực
        → Thành phố / Món ăn–Đồ uống / Trạng thái
```

- Pet modal không chứa danh sách món, tab thành phố hoặc bộ lọc của sổ tay.
- Giữ một liên kết nhỏ **Sổ tay ẩm thực →** để chức năng không bị giấu sau menu. Liên kết chuyển màn hình, không mở hai modal chồng nhau.
- Sổ tay giữ tên dễ hiểu; không cần đổi thành tên dài như “Hành trình ẩm thực 3 miền”. Bỏ hero linh thú ở đầu sổ tay sau khi tách, dành diện tích cho danh sách.
- Chỉ một overlay hoạt động. Đóng trả focus về nơi mở phù hợp; nếu chuyển pet → sổ tay, nút quay lại trở về pet, đóng hoàn toàn trở về trang chính. Trình tự Back/Escape được định nghĩa thống nhất và kiểm thử.
- Widget ở vùng trống phía trên bên phải carousel giữ vị trí hiện tại. Không tăng kích thước widget chỉ vì nhân vật trong modal lớn hơn. Nút quay ngoài trang vẫn thấy ngay khi mở webapp.

## 3. Art direction: mèo ôm bát có chiều sâu mềm

### Giữ nhận diện

- Giữ tai mèo, khuôn mặt và chiếc bát làm dấu hiệu nhận diện xuyên suốt các cấp.
- Đầu hơi lớn, thân gọn, chân/paws rõ; mắt có điểm sáng, má và miệng đủ diễn cảm.
- Chất liệu gợi mô hình đất sét mềm: khối lớn mịn, điểm sáng phía trên trái, bóng tiếp xúc dưới chân, phần xa tối hơn vừa phải.
- Mỗi cấp chỉ đổi 1–2 điểm nổi bật. Không chồng mũ, kính, vương miện, vòng sáng và nhiều đạo cụ cùng lúc.
- Bát và khăn cơ bản hiện có thuộc nhận diện nền; người dùng cũ không mất chúng khi chuyển hệ cấp.

### Chất lượng tài nguyên

Với ảnh tham chiếu, cảm giác “thật” đến từ tạo hình và chiếu sáng, không chỉ từ gradient phía sau. SVG hiện tại có ưu điểm nhẹ nhưng vẫn thiên về minh họa nét. Nếu muốn gần chất lượng khối mềm trong ảnh, cần nâng cấp asset trước khi tăng hiệu ứng.

**Hướng đề xuất:** thiết kế một mascot 2.5D gốc, duyệt ở cỡ 48px và 180px, sau đó mới phát triển sáu cấp. Chọn SVG nhiều lớp nếu đạt chất lượng, hoặc ảnh render trong suốt AVIF/WebP nếu cần khối mềm hơn; tài nguyên lưu local. Không dùng WebGL trong bản đầu. Không kéo giãn một ảnh phẳng rồi gọi đó là mascot 3D.

Đầu ra thiết kế cần có: hình chính diện, phiên bản thu nhỏ, accessory từng cấp, trạng thái bình thường/vui/nhận XP/lên cấp và bản tĩnh reduced motion. Mặt, tai và đạo cụ không được đổi tỷ lệ tùy ý giữa các cấp.

### Màu và chữ

| Thành phần | Định hướng |
| --- | --- |
| Nền modal | Kem `#F7F3EB`, nối tiếp webapp |
| Vùng sân khấu | Điểm sáng đào nhạt `#F6DEC9`, tan vào nền; không phủ cam đậm toàn màn hình |
| Chữ chính | Than `#20211F` |
| CTA và tiến độ | Cam đất khoảng `#B93C23`; kiểm tra tương phản trên màu thực tế |
| Điểm nhấn | Lime nhẹ, xanh ngọc trầm hoặc tím mận trên phụ kiện; không nhuộm toàn UI theo cấp |
| Typography | Font hiện có hỗ trợ tiếng Việt; tên 20–22px, nội dung 13–14px, chú thích 11–12px |

## 4. Bố cục mobile

### Thứ tự nội dung

```text
┌────────────────────────────────┐
│ Bé Há Mồm  [sửa tên]        [×] │
│                                │
│       [MÈO ÔM BÁT LỚN]         │
│      ánh sáng + bóng mềm       │
│                                │
│ Cấp 2 · Bé khám phá      18 XP  │
│ [████████░░░░░░░░]             │
│ Còn 7 XP để lên cấp 3          │
│ Xem các cấp                 ›  │
│                                │
│ Cách nuôi bé                   │
│ Quay chọn món          +1 XP › │
│ Khám phá sổ tay        +5 XP › │
│                                │
│ Chuỗi ngày           🔥 3 ngày │
│ Mốc tiếp theo: 10 ngày         │
│ [3 ✓] [10] [30] [100] [200]    │
└────────────────────────────────┘
```

Wireframe minh họa hệ sáu cấp mục tiêu. 18 XP là ví dụ thiết kế, không tự ghi vào dữ liệu thật. Nhóm hoạt động chỉ hiển thị các hành vi đã được triển khai.

### Tỷ lệ và thích ứng

| Vùng | Màn hình khoảng 390×844 | Màn hình thấp khoảng 320×568 |
| --- | --- | --- |
| Modal | Tối đa 92dvh, một vùng cuộn, safe area | Cùng nguyên tắc, không ép toàn bộ nội dung vào một màn |
| Header | 52–56px; đóng/sửa tên có vùng chạm 44px | Giữ vùng chạm, tránh thêm nút phụ |
| Mascot | Vùng artwork khoảng 176–192px; sân khấu 200–220px | Artwork 128–144px; sân khấu khoảng 156px |
| XP | Khoảng 52–64px; số bên ngoài thanh | Giữ nội dung đọc được, không thu chữ để nhét |
| Hàng hoạt động | Khoảng 52–56px, tên + mức XP + hành động | Có thể xuống dòng; ưu tiên hành động quay thấy được |
| Chuỗi ngày | Một khối gọn khoảng 72–96px | Cuộn xuống xem; không chiếm diện tích hero |

Kích thước là mục tiêu để kiểm thử, không phải số cứng bất chấp nội dung. Ở 390×844 phải thấy pet, cấp, tiến độ và hành động chính ngay khi mở. Ở màn hình thấp vẫn thấy pet, tiến độ và có đường tới hành động chính; phần phụ cuộn tự nhiên. Font phóng lớn được phép tăng chiều cao.

### Điều chỉnh so với ảnh tham chiếu

- Nhân vật có khoảng thở rõ; không đặt trong một card nhỏ ở góc.
- Không bọc mọi phần trong card lớn. Hero hòa vào nền; hoạt động chung một khối; streak là dải nhẹ phía dưới.
- Giữ nút đóng bên phải như ứng dụng hiện có. Bấm tên hoặc icon sửa mở nhập tên trong cùng màn hình.
- “Trang phục” chưa xuất hiện ở bản đầu. **Xem các cấp** mở một phần gọn gồm cấp đã đạt, cấp tiếp theo và phần thưởng phụ kiện.
- Mỗi thời điểm có một CTA chính: **Quay chọn món**. Không thêm “Quay liên tục để tăng XP”. Từ màn kết quả, không tự bật pet đè lên món đã chọn.

## 5. Cấp, XP và chuỗi ngày phải đọc khác nhau

### Sáu cấp đề xuất

| Cấp | Tổng XP | Danh hiệu gợi ý | Nâng cấp ngoại hình |
| --- | --- | --- | --- |
| 1 | 0–9 | Mầm vị ngon | Mèo nền, bát nhỏ, mầm lá |
| 2 | 10–24 | Bé khám phá | Thìa gỗ, khăn có chi tiết mới |
| 3 | 25–49 | Bạn sành ăn | Mũ lưỡi trai nhỏ, xiên ăn vặt |
| 4 | 50–99 | Sành vị phố | Kính râm, bát phở |
| 5 | 100–199 | Đầu bếp vị giác | Mũ bếp gọn thay mũ ảo thuật |
| 6 | 200+ | Thực thần | Vương miện nhỏ màu vàng ấm, điểm sáng tiết chế |

Các tên là nội dung đề xuất có thể tinh chỉnh; tên riêng người dùng đặt vẫn giữ nguyên. Cấp cuối gọi **Cấp 6**, không dùng “6+” khi chưa có cấp 7.

### Thanh tiến độ

- Hiển thị `Cấp 2 · 18 XP` và `Còn 7 XP để lên cấp 3`.
- Fill theo tiến độ **trong cấp**: `(xp − mốc cấp hiện tại) / (mốc cấp tiếp theo − mốc cấp hiện tại)`.
- Ví dụ 18 XP nằm giữa 10 và 25: **8/15 = 53,3%**. Không hiển thị thanh 72% do lấy 18/25 trong khi đang nói tiến độ cấp 2.
- Sọc kẹo là họa tiết nhẹ, chỉ chạy ngắn lúc tăng XP. Số nằm ngoài thanh để dễ đọc; không chạy sọc vô hạn.
- Cấp 6: thanh hoàn tất, chữ “Đã mở khóa đủ 6 cấp”, vẫn hiển thị tổng XP; không hiện mốc giả hoặc phép chia không có đích.
- Widget ngoài carousel có thể đổi huy hiệu từ số lửa sang **Cấp N**, với +XP thoáng qua khi có thưởng. Chuỗi ngày để trong modal, tránh một biểu tượng lửa đại diện đồng thời cả điểm lẫn ngày.

### Chuỗi ngày và huy hiệu

- Bản đầu: “Chuỗi hiện tại”, mốc tiếp theo và các mốc 3/10/30/100/200 của chuỗi đó. Mỗi trạng thái có dấu/nhãn, không chỉ khác màu.
- Nếu dữ liệu ngày đã cũ: “Chuỗi trước: N ngày — quay món để bắt đầu lại”. Không trình bày một chuỗi đã gián đoạn như đang hoạt động.
- Nghỉ một ngày không mất XP hoặc phụ kiện. Không dùng câu khiến người dùng thấy có lỗi vì không quay lại.
- “Huy hiệu đã sở hữu” vĩnh viễn là tính năng riêng, cần dữ liệu mở khóa. Không dựng lịch hoạt động 7 ngày hoặc thành tích quá khứ từ `dailyStreak` đơn lẻ.

## 6. Chốt lại quy tắc kiếm điểm

| Hành vi | Quy tắc bản đầu đề xuất | Phản hồi |
| --- | --- | --- |
| Quay hoàn tất | +1, đúng một lần/lượt quay | `+1 XP`; kết quả món vẫn là ưu tiên |
| Lượt quay đầu ngày | Cũng +1, đồng thời cập nhật chuỗi; không bonus riêng | “Đã duy trì chuỗi hôm nay” khi có dữ liệu xác nhận |
| Tick món trong sổ tay | +5 như hiện tại | Phản hồi ngắn tại sổ tay/widget |
| Bỏ tick | −5 như hiện tại, sàn 0 | Hoàn tác rõ; không phát animation ăn mừng |
| Mở/quay lại modal | Không cộng | Không phát lại thưởng cũ |
| Đổi tên/xem cấp | Không cộng | Lưu thành công/lỗi rõ ràng |

**Thưởng khám phá quán +2 XP là thay đổi sản phẩm riêng, nên đưa sau bản nâng cấp UI.** Nếu triển khai, chốt như sau:

- Gọi là “Khám phá quán”, không phải “Đặt món thành công”. Thống kê là lượt yêu cầu mở quán, không phải số đơn.
- Thưởng tối đa **một lần/ngày**, dùng chung hạn mức giữa các nút ShopeeFood đủ điều kiện. Không cộng lại khi người dùng bấm nhiều quán, fallback deep link hoặc quay về app.
- Chỉ tính hành động mở liên kết quán hợp lệ do người dùng bấm. Mở trang chủ, tìm kiếm chung, bấm xin vị trí, QR hoặc link lỗi không được coi là đã khám phá một quán.
- Không thưởng cho link ngoài khác chỉ vì nó nằm trong vùng “quán gần bạn”. Luật và nhãn phải thống nhất.
- Việc không cấp GPS không chặn quay hoặc duy trì chuỗi; có quán hợp lệ được cấu hình sẵn vẫn mở bình thường.
- Giữ thao tác mở app trong sự kiện bấm hiện tại; không đợi animation, âm thanh hoặc cập nhật từ mạng mới điều hướng.
- Phản hồi khi quay lại là “+2 XP khám phá quán” nếu sự kiện đã được ghi nhận, không tự khẳng định app ngoài mở được hoặc giao dịch đã thành công.
- Đây là giả thuyết sản phẩm để đánh giá. Số click tăng riêng lẻ không chứng minh trải nghiệm tốt hơn hay tăng đơn hàng.

### Tránh nhiệm vụ gây hiểu sai

Bản đầu dùng tiêu đề **Cách nuôi bé**. Quay là hành động có thể lặp, nên không dùng một checkbox “đã hoàn thành nhiệm vụ” rồi vẫn thưởng không giới hạn. Nếu sau này hiển thị “hôm nay đã quay N lượt”, phải có bộ đếm theo ngày thực sự. Không tự suy ra từ `totalSpins`.

## 7. Motion và tương tác

| Trạng thái | Hành vi đề xuất |
| --- | --- |
| Bình thường | Thở/nhấp nhô 2–4px, chu kỳ 4–6 giây; chớp mắt thưa, bóng nền mềm |
| Chạm pet | Một phản ứng 400–600ms; không có XP, không yêu cầu chạm liên tục |
| Nhận XP | Một nhịp vui/ăn, số +XP trong khoảng 0,8–1,2 giây, thanh tăng 300–500ms |
| Lên cấp | Đổi phụ kiện và một điểm sáng ngắn ≤1,2 giây; thông báo tên cấp, không chặn thao tác |
| Đang quay / có overlay khác | Dừng hiệu ứng không cần thiết; không tự mở pet modal |
| Nền/tab bị ẩn | Dừng animation; quay lại không phát lại hàng loạt sự kiện |
| Reduced motion | Bản tĩnh, thay text/giá trị; không float, sọc chạy hoặc hạt bay |

Ưu tiên transform/opacity, không animate blur/shadow lớn toàn màn hình. Âm thanh tùy cài đặt đang có, không thêm tiếng “ting” khi người dùng đã tắt tiếng. Không phát hai âm thanh thưởng đè lên âm thanh kết quả quay. Đợt đầu có thể chỉ dùng phản hồi hình ảnh.

## 8. Dữ liệu, chuyển đổi và quyền sở hữu tiến độ

### Những gì hiện có

`score`, `dailyStreak`, `lastActiveDate`, `petName`, `totalSpins`, `totalChecklistTested`; checklist lưu ID riêng. Hiện người mới khởi tạo có 3 điểm và 1 ngày. Chưa có lịch sử đơn, bộ đếm theo ngày hoặc tủ phụ kiện lựa chọn được.

### Nguyên tắc chuyển đổi sang sáu cấp

1. Có `schemaVersion: 2`; chuyển `score` sang `xp` một lần. Không lưu hai tổng điểm độc lập. Bộ tương thích cũ chỉ là giá trị suy ra trong giai đoạn chuyển tiếp.
2. Giữ 3 điểm hiện có, tên, chuỗi, tổng lượt quay, số món và toàn bộ 72 ID checklist. Không tính lại XP từ checkbox vì sẽ mất phần điểm quay/khởi tạo.
3. Giữ bản dữ liệu v1 để có thể khôi phục nếu migration lỗi. Chạy migration nhiều lần không cộng thưởng hoặc nhân bản mở khóa.
4. Nếu muốn người mới bắt đầu 0 ngày và chỉ có ngày đầu sau lượt quay đầu, ghi thành thay đổi riêng của bản engine. Không lặng lẽ sửa tiến độ người dùng cũ.
5. `dailyActivity` cần cả ngày và bộ đếm; chuyển sang ngày mới phải reset bộ đếm. Bản đề xuất chọn ngày lịch `Asia/Ho_Chi_Minh` cho tính năng tại Việt Nam; kiểm thử riêng tác động với dữ liệu cũ vốn lấy ngày thiết bị.
6. Không backfill số lượt quay/khám phá “hôm nay” hoặc lịch hoạt động khi dữ liệu cũ không có. Chỉ đếm từ khi nâng cấp và ghi rõ nếu cần.
7. Checklist có thể làm XP giảm. Cấp được tính lại theo XP; **phụ kiện tự đổi theo cấp** trong MVP. Nếu muốn “đã mở khóa thì giữ mãi”, phải thêm `unlockedCosmeticIds` và mô tả rõ; không hứa điều này khi chưa lưu dữ liệu riêng.
8. Bát/khăn nền vẫn có ở mọi cấp. Các phụ kiện cũ đủ điều kiện theo XP được ánh xạ sang cấp mới; không reset toàn bộ ngoại hình khi migration.

### Ghi điểm an toàn

- `spinCompleted` có ID duy nhất; callback lặp không cộng hai lần. Không cộng khi bắt đầu quay hoặc hủy.
- Checklist ghi trạng thái mong muốn `setChecked(id, true/false)`; lặp cùng một trạng thái không cộng/trừ thêm.
- Nếu thêm +2 khám phá: khóa thưởng theo ngày, dùng chung toàn bộ nơi mở link đủ điều kiện; debounce nút đơn lẻ không đủ.
- Hàm tính điểm là pure; không ghi localStorage trong React state updater. Ghi dữ liệu qua một lớp quản lý chung.
- Cần cập nhật điểm và checklist nhất quán; xử lý ghi dở dang, storage bị chặn/hết dung lượng và thao tác ở hai tab. Không hiển thị “đã lưu” khi write thất bại.
- Tên thú: cắt khoảng trắng thừa, 2–20 ký tự hiển thị, hỗ trợ dấu tiếng Việt; có Lưu/Hủy, Enter/Escape, thông báo lỗi. `petName` đã tồn tại nên không tạo khóa riêng trùng lặp.
- localStorage phù hợp với tiến độ vui trên thiết bị, không chứng minh giao dịch và không phải cơ chế chống gian lận cho phần thưởng quy đổi giá trị.

## 9. Cấu trúc triển khai đề xuất

| Phần | Trách nhiệm |
| --- | --- |
| `FoodiePetModal` | Bố cục, focus, đóng/mở và điều hướng sang sổ tay |
| `FoodiePet` | Asset/lớp phụ kiện và trạng thái animation; không tự cộng điểm |
| `PetProgress` | Cấp, XP, tiến độ có ngữ nghĩa cho trình đọc màn hình |
| `PetActivities` | Các nguồn điểm thật và hành động phù hợp |
| `PetStreakSummary` | Chuỗi hiện tại/mốc tiếp theo; không tạo lịch sử giả |
| `PetLevelPreview` | Xem cấp đã đạt/khóa, phần thưởng tiếp theo |
| `CityChecklistModal` | Sổ tay riêng, giữ hàng 52px và bộ lọc đang dùng |
| Engine điểm | Quy tắc, sự kiện, migration và lưu trữ |
| Trang chính | Điều phối overlay và kết nối kết quả quay; không đổi thuật toán/nhịp quay |

Tận dụng Base UI Dialog, icon và hệ tokens hiện có. Không thêm backend, tài khoản, SDK theo dõi, WebGL hoặc thư viện animation chỉ để phục vụ bản UI này.

## 10. Trình tự triển khai

**P0 — Duyệt tạo hình và bố cục:** dựng hai màn hình 390×844 và 320×568, pet lớn và widget nhỏ; một nhân vật nền, sáu biến thể phụ kiện; preview tĩnh cho bình thường/lên cấp. Chốt silhouette trước khi làm nhiều animation.

**P1 — Tách UI:** pet modal riêng, journal riêng, điều hướng/focus, hero lớn, tiến độ rõ, đổi tên và xem các cấp. Bản tích hợp đầu giữ engine đang chạy; mockup sáu cấp được đánh dấu là preview cho đến khi engine mới sẵn sàng. Giữ UI widget và nút quay ngoài trang ổn định.

**P2 — Engine sáu cấp:** migration XP, idempotence, định nghĩa ngày và trạng thái chuỗi, bảo toàn checklist; kết nối các animation theo sự kiện thực. Chỉ phát hành màn hình sáu cấp khi migration và test đã đạt.

**P3 — Mở rộng có mục tiêu:** đánh giá thưởng “khám phá quán” một lần/ngày; sau đó mới xem xét tủ phụ kiện và huy hiệu lịch sử. Mỗi tính năng có dữ liệu và tương tác thật, không thêm nút giữ chỗ vào sản phẩm.

## 11. Kiểm thử và tiêu chí nghiệm thu

### Thị giác và mobile

- Người mới hiểu trong vài giây: đây là thú của mình, đang cấp mấy, còn bao nhiêu XP và làm gì tiếp.
- 390×844: nhân vật, tiến độ và hành động chính thấy ngay; 320×568 không bị tràn ngang/cắt nút đóng. Nội dung tiếng Anh và tên dài vẫn dùng được.
- Widget không che món, caption, bộ lọc hoặc nút quay; journal vẫn giữ hàng gọn.
- Kiểm tra mở bàn phím đổi tên, xoay màn hình, safe area, chữ phóng lớn, touch ≥44px và contrast thực tế.
- Chromium và WebKit tự động; kiểm tra Safari iPhone/Chrome Android thực nếu có thiết bị. Mô phỏng không được báo là đã thử máy thật.

### Logic và lưu trữ

- Biên cấp: 0/9/10/24/25/49/50/99/100/199/200 và vượt 200; tiến độ 18 XP đúng 53,3% trong cấp.
- Migration dữ liệu cũ 3/90/100/200 điểm; giữ tên, dấu đã thử và các nguồn điểm. Migration lặp, JSON lỗi, dữ liệu thiếu hoặc giá trị âm/không hữu hạn.
- +1 đúng một lần sau spin; +5/−5 đúng khi tick/bỏ tick; không cộng khi xem pet hoặc khi render lại.
- Đổi ngày, quay qua nửa đêm, bỏ ngày, múi giờ, hai tab và app background. Nếu +2 được bật: double click, nhiều nút/quán, link fallback, link lỗi, reload và trở lại app.
- Lưu lỗi có thông báo; không mất dữ liệu khi chuyển overlay, đổi ngôn ngữ hoặc tải lại.

### Tương tác

- Focus vào đúng điểm mở; Escape đóng đúng lớp; bàn phím tới được mọi điều khiển.
- Lên cấp không tự mở modal che kết quả quay. Reduced motion tắt chuyển động; mute không phát âm thanh thưởng.
- Các bộ test hiện tại, test mới phù hợp và `pnpm build` đều đạt. Đây là tiêu chí cần chạy khi triển khai, không phải kết quả đã kiểm thử của bản plan.

### Đánh giá giá trị

Trước phát hành, thử luồng “xem pet → biết cách kiếm XP → quay món → xem tiến độ → mở sổ tay” với người dùng thật nếu có. Theo dõi khả năng hiểu cấp/chuỗi và việc tìm được món; không đánh giá thành công chỉ bằng thời gian trong modal hoặc số click affiliate. Các giả thuyết retention/chuyển đổi cần đo sau triển khai, không gán số tăng trưởng kỳ vọng khi chưa có dữ liệu.

## 12. Bộ bàn giao khi triển khai

1. File thiết kế mobile và bảng phụ kiện/cấp, có phiên bản màn hình thấp và trạng thái thật.
2. Asset gốc và quy tắc màu/kích thước/motion, tài nguyên local và nguồn/giấy phép nếu dùng.
3. Component đã tích hợp, migration có thể kiểm tra và danh sách thay đổi hành vi rõ ràng.
4. Ảnh chụp trước/sau, báo cáo test, giới hạn chưa kiểm tra và hướng khôi phục dữ liệu khi cần.

**Ưu tiên đầu tiên:** tách màn hình và nâng chất lượng tạo hình. Điểm thưởng mở quán, tủ phụ kiện và lịch sử huy hiệu được bổ sung sau khi nền UI và dữ liệu đã chắc chắn.
