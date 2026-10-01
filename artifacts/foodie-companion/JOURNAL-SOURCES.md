# Nguồn cho sổ tay món đã thử

Rà soát ngày **01/10/2026**. Danh sách có **72 mục**: mỗi thành phố gồm **18 món ăn và 6 đồ uống**. Mỗi thành phố giữ nguyên 10 mục cũ và bổ sung 14 mục mới. Danh sách dùng để ghi lại trải nghiệm, không phải dữ liệu quán đang mở cửa hay thực đơn đang bán.

## Nguyên tắc biên tập

- Giữ toàn bộ ID và tên của 30 mục cũ (`hn-1`…`hn-10`, `dn-1`…`dn-10`, `hcm-1`…`hcm-10`) để dữ liệu đã đánh dấu tiếp tục khớp đúng món.
- Thêm `kind: "food" | "drink"`; món chè/kem là món ăn, không gộp vào đồ uống chỉ vì đựng trong ly. “Món nước” được đáp ứng cả bằng đồ uống lẫn các món dùng nước như bún, bánh canh, súp.
- Đồ uống là gợi ý khám phá trong thành phố, không khẳng định tất cả đều có nguồn gốc tại đó. Những lựa chọn phổ biến toàn quốc như nước mía và trà quất/tắc được ghi rõ trong bảng nguồn.
- Các mục mới chỉ có tên, loại và mô tả ngắn Việt/Anh. Không suy đoán giá, địa chỉ, xếp hạng hay quán phục vụ. Các trường giá/quán/quận/huy hiệu nay là tùy chọn.
- Tên món, giá và quán của 30 mục cũ được bảo toàn để không mở rộng phạm vi thay đổi. **Không coi thông tin quán/giá cũ là đã được xác minh trong lần nâng cấp này.** Một số địa chỉ còn dùng tên quận cũ.
- Không đổi khóa localStorage, cơ chế cộng/trừ điểm hay logic quay. Khi thêm món, mẫu số hoàn thành thành phố tăng lên; số món đã đánh dấu vẫn giữ nguyên.
- Nội dung mô tả được viết lại ngắn gọn; không sử dụng ảnh hoặc sao chép bài viết từ nguồn. Một số trang du lịch có nội dung dịch tự động; chỉ dùng các thông tin về tên món, thành phần và ngữ cảnh có thể đối chiếu.

## Hà Nội

| Mục mới | Căn cứ và phạm vi |
| --- | --- |
| `hn-11` Bún thang; `hn-12` Bún cá; `hn-13` Mì vằn thắn; `hn-14` Miến lươn | [10 món ăn Hà Nội nhất định phải thử — Vietnam Tourism](https://www.vietnam.travel/vi/things-to-do/10-must-try-hanoian-dishes) giới thiệu các món này, trong đó miến có thể dùng với lươn, dạng nước hoặc xào. [Cẩm nang ẩm thực Hà Nội](https://www.vietnam.travel/vi/things-to-do/ha-noi-food-guide-best-street-food-dishes-sample) bổ sung miến lươn trộn. |
| `hn-15` Bánh tôm Hồ Tây | [Cẩm nang ẩm thực Hà Nội — Vietnam Tourism](https://www.vietnam.travel/vi/things-to-do/ha-noi-food-guide-best-street-food-dishes-sample) mô tả bánh tôm và khoai chiên, ăn cùng rau/nước chấm. |
| `hn-16` Cháo sườn; `hn-17` Cốm làng Vòng; `hn-19` Bánh trôi tàu | [Hương vị mùa thu Hà Nội — Vietnam Tourism](https://vietnam.travel/vi/things-to-do/hanoi%E2%80%99s-flavours-autumn) mô tả cháo sườn, cốm và bánh nếp nhân đậu trong nước gừng. Tên làng Vòng được đối chiếu qua [Cục Du lịch Quốc gia Việt Nam](https://vietnamtourism.vn/index.php/news/items/27644). |
| `hn-18` Xôi khúc | [Khám phá ẩm thực đường phố Hà Nội cùng Sens Asia — Vietnam Tourism](https://www.vietnam.travel/vi/things-to-do/exploring-hanoi-street-food-sens-asia) mô tả xôi khúc với lá khúc, nếp, đậu xanh và thịt. |
| `hn-20` Trà sen Tây Hồ | [Từ sen Tây Hồ đến chén trà — chuyên trang du lịch nông thôn của Cục Du lịch](https://nongthon.vietnamtourism.gov.vn/tu-sen-tay-ho-den-chen-tra-hanh-trinh-giu-lai-huong-vi-ha-noi-xua/) xác nhận ngữ cảnh nghề trà sen Tây Hồ. |
| `hn-21` Nước sấu | [Cơ sở dữ liệu ngành Du lịch, mục nhà hàng 1233](https://csdl.vietnamtourism.gov.vn/rest/?item=1233) giới thiệu nước sấu trong thực đơn đồ uống của quán theo hương vị Hà Nội. Đối chiếu ngữ cảnh quả sấu Hà Nội từ [Cục Du lịch](https://vietnamtourism.vn/index.php/news/items/27644). Đây là lựa chọn đồ uống, không chỉ định quán. |
| `hn-22` Cà phê sữa chua | [5 fantastic Vietnamese coffees — Vietnam Tourism](https://vietnam.travel/things-to-do/5-fantastic-vietnamese-coffees) mô tả đồ uống và sự hiện diện ở Hà Nội. |
| `hn-23` Trà quất; `hn-24` Nước mía | [Cool off: 7 delightful Vietnamese drinks — Vietnam Tourism](https://vietnam.travel/things-to-do/cool-7-delightful-vietnamese-drinks). Hai đồ uống phổ biến ở Việt Nam, được biên tập vào sổ tay như lựa chọn giải khát; không gán là đặc sản riêng của Hà Nội. |

## Đà Nẵng

| Mục mới | Căn cứ và phạm vi |
| --- | --- |
| `dn-11` Bánh canh cá lóc | [Bánh canh — Cổng thông tin du lịch Đà Nẵng](https://danangfantasticity.com/en/banh-canh) ghi nhận bánh canh cá lóc trong các dạng bánh canh tại thành phố. |
| `dn-12` Bún bò Huế | [Thưởng thức các món sợi nổi tiếng ở Đà Nẵng — Danang Fantasticity](https://danangfantasticity.com/en/kham-pha/thuong-thuc-cac-mon-soi-noi-tieng-o-da-nang). Mô tả giữ rõ nguồn gốc phong cách Huế, tránh gọi đây là món xuất xứ Đà Nẵng. |
| `dn-13` Bánh bèo chén; `dn-14` Bánh đập; `dn-15` Mít trộn; `dn-16` Kem bơ; `dn-19` Hến xào | [Lạc bước giữa thiên đường ẩm thực đường phố Đà Nẵng — Danang Fantasticity](https://danangfantasticity.com/cn/am-thuc-dia-phuong/lac-buoc-giua-thien-duong-am-thuc-duong-pho-da-nang). Trang được đọc bằng nội dung tiếng Việt dù URL đang có tiền tố ngôn ngữ khác. Mục hến xào giữ rõ ngữ cảnh **Hội An**, không nhập nhằng với nguồn gốc ở trung tâm Đà Nẵng. |
| `dn-17` Ốc hút | [Helio Center — Danang Fantasticity](https://danangfantasticity.com/ja/helio-center-vn) liệt kê ốc hút trong nhóm món ăn vặt tại chợ đêm. Chỉ dùng để xác nhận loại món; không xác nhận lịch hoạt động hiện tại của địa điểm. |
| `dn-18` Cá nục hấp cuốn bánh tráng | [Thế giới món cuốn đặc trưng tại Đà Nẵng — Danang Fantasticity](https://danangfantasticity.com/en/am-thuc-dia-phuong/thuong-thuc-nhung-mon-cuon-dac-trung-o-da-nang) mô tả món cá nục và rau ăn cùng bánh tráng. |
| `dn-20` Cà phê cốt dừa | [Cà phê cốt dừa tại Đà Nẵng — Danang Fantasticity](https://danangfantasticity.com/en/khuyen-mai/thuong-thuc-ca-phe-cot-dua-thom-ngon-tai-diamond-sea-hotel-danang) xác nhận ngữ cảnh món; [Vietnam Tourism](https://vietnam.travel/things-to-do/5-fantastic-vietnamese-coffees) mô tả cách kết hợp cà phê và dừa. Bài đầu là chương trình cũ, không dùng giá hay ưu đãi trong ứng dụng. |
| `dn-21` Nước mía; `dn-24` Trà quất | [7 đồ uống Việt Nam — Vietnam Tourism](https://vietnam.travel/things-to-do/cool-7-delightful-vietnamese-drinks). Đây là lựa chọn giải khát phổ biến toàn quốc, không phải tuyên bố đặc sản gốc Đà Nẵng. |
| `dn-22` Nước chanh dây | [The Holiday Beach Club Đà Nẵng — Danang Fantasticity](https://danangfantasticity.com/ru/bar-pub-vn/holiday-beach-club-da-nang) từng liệt kê đồ uống này trong thực đơn. Chỉ xác nhận loại đồ uống, không dùng các nhận định sức khỏe, giá hay giờ bán của bài cũ. |
| `dn-23` Nước mơ | [Mỳ Quảng Cô Sáu — Danang Fantasticity](https://danangfantasticity.com/ja/my-quang-co-sau) ghi nhận mơ ngâm trong nhóm đồ uống tại địa phương. Không tạo mục quán hoặc link đặt hàng. |

## TP. Hồ Chí Minh

| Mục mới | Căn cứ và phạm vi |
| --- | --- |
| `hcm-11` Gỏi cuốn; `hcm-12` Bánh xèo miền Nam; `hcm-13` Bò bía mặn; `hcm-14` Súp cua | [12 món ăn đường phố — cổng du lịch TP.HCM](https://visithcmc.net/news/12-mon-an-duong-pho-cuc-ngon-chi-duoi-20-ngan) mô tả thành phần và cách ăn. Không nhập giá cũ của bài viết. |
| `hcm-15` Sủi cảo | [Thông cáo Chợ Lớn Food Story 2024 — cổng du lịch TP.HCM](https://visithcmc.net/en/news/thong-cao-bao-chi-su-kien-ra-mat-le-hoi-am-thuc-cho-lon-food-story-lan-2-nam-2024-chu-de-my-vi-mi-va-banh) xác nhận sủi cảo trong ngữ cảnh ẩm thực Việt–Hoa Chợ Lớn. |
| `hcm-16` Bún mắm; `hcm-17` Bún thịt nướng | [Quận Tân Phú — cổng du lịch TP.HCM](https://visithcmc.net/news/tim-hieu-ve-quan-tan-phu-tphcm-lich-su-quan-dia-diem-vui-choi) giới thiệu hai món này. Mô tả bún mắm chỉ nêu cách ăn phổ biến, không suy ra món/quán nào được xếp hạng cao. |
| `hcm-18` Phở kiểu miền Nam; `hcm-19` Bánh flan | [Explore delicious dishes in Ho Chi Minh City — Vietnam Tourism](https://vietnam.travel/things-to-do/explore-delicious-dishes-ho-chi-minh-city) ghi nhận phở miền Nam và bánh flan trong phần món ngọt. |
| `hcm-20` Bạc xỉu | [5 fantastic Vietnamese coffees — Vietnam Tourism](https://vietnam.travel/things-to-do/5-fantastic-vietnamese-coffees) mô tả tỷ lệ nhiều sữa hơn cà phê và ngữ cảnh Sài Gòn. |
| `hcm-21` Nước sâm | [5 delightful drinks in HCMC — cổng du lịch TP.HCM](https://visithcmc.net/en/news/5-mon-do-uong-hap-dan-de-giai-nhiet-khi-den-thanh-pho-ho-chi-minh) có mục “Vietnamese Herbal Tea (Nước sâm)”. Lần kiểm tra này bản chỉ mục tìm kiếm đọc được mục đó, nhưng tải trực tiếp toàn trang bị timeout/reset; không sử dụng các chi tiết quán hay công dụng sức khỏe chưa đọc được. |
| `hcm-22` Nước mía; `hcm-23` Sinh tố trái cây; `hcm-24` Trà tắc | [7 đồ uống Việt Nam — Vietnam Tourism](https://vietnam.travel/things-to-do/cool-7-delightful-vietnamese-drinks). Đây là đồ uống phổ biến, không khẳng định nguồn gốc riêng của Sài Gòn. “Trà tắc” dùng cách gọi miền Nam cho nhóm trà quất. |

## Giới hạn dữ liệu

Đây là danh sách được tuyển chọn, không phải danh mục đầy đủ mọi đặc sản hoặc dữ liệu thời gian thực. Các nguồn quảng bá du lịch xác nhận bối cảnh món ăn; không thay thế việc xác minh địa chỉ quán, giá, tình trạng bán, thành phần gây dị ứng hoặc liên kết affiliate. Một số bài cũ và một số URL có tiền tố ngôn ngữ khác nhưng nội dung tiếng Việt. Hai nguồn `vietnamtourism.vn/.../27644` và bài đồ uống TP.HCM có giới hạn tải trực tiếp nêu trên; thông tin sử dụng được kiểm tra trong bản chỉ mục tìm kiếm.
