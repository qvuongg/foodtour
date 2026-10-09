#!/usr/bin/env python3
"""
Công cụ xuất danh sách link Voucher ShopeeFood sang:
1. data/voucher_links_pending_affiliate.csv (danh sách kiểm tra chi tiết kèm affiliate tracking url)
2. data/Batch_Voucher_Custom_Links.xlsx (file Excel chuẩn mẫu Shopee Affiliate có Sub_id1 chữ số sạch sẽ)
3. data/Batch_Voucher_Custom_Links_NoSubId.xlsx (file Excel chuẩn mẫu Shopee Affiliate để trống Sub_id1)

Quy định Shopee Affiliate Batch Custom Links:
- Sub_id1: Chỉ bao gồm chữ cái và chữ số [a-zA-Z0-9], KHÔNG được chứa dấu gạch ngang '-', gạch dưới '_', khoảng trắng hoặc ký tự đặc biệt.
- Chiều dài khuyến nghị: 3 - 16 ký tự.
- Để trống Sub_id1 hoàn toàn hợp lệ và có tỷ lệ chuyển đổi thành công 100%.

Cách dùng:
  python3 scripts/export-voucher-custom-links.py
"""

import os
import sys
import csv
import subprocess
import json

try:
    import openpyxl
except ImportError:
    print("❌ Cần cài đặt openpyxl: pip3 install openpyxl")
    sys.exit(1)

# Danh sách 25 Voucher ShopeeFood theo 3 thành phố lớn với sub_id chuẩn alphanumeric
VOUCHERS_DATA = [
    # TP. HỒ CHÍ MINH (ho-chi-minh)
    {
        "id": "hcm-freeship-0d",
        "city": "ho-chi-minh",
        "sub_id": "hcmfreeship",
        "title": "Freeship 0Đ Toàn Sàn Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    },
    {
        "id": "hcm-dai-tiec-50",
        "city": "ho-chi-minh",
        "sub_id": "hcmdaitiec",
        "title": "Đại Tiệc Muôn Vị Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=giam+50",
    },
    {
        "id": "hcm-com-trua-35k",
        "city": "ho-chi-minh",
        "sub_id": "hcmcomtrua",
        "title": "Cơm Trưa Công Sở Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=com+trua",
    },
    {
        "id": "hcm-tra-sua-30k",
        "city": "ho-chi-minh",
        "sub_id": "hcmtrasua",
        "title": "Trà Sữa & Cà Phê Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    },
    {
        "id": "hcm-den-sg-an-gi",
        "city": "ho-chi-minh",
        "sub_id": "hcmdensg",
        "title": "Đến Sài Gòn Ăn Gì - Món Chuẩn Vị",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=com+tam",
    },
    {
        "id": "hcm-quan-moi-40k",
        "city": "ho-chi-minh",
        "sub_id": "hcmquanmoi",
        "title": "Thử Quán Mới - Deal Làm Quen",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    },
    {
        "id": "hcm-len-don-nhom-105k",
        "city": "ho-chi-minh",
        "sub_id": "hcmdonnhom",
        "title": "Lên Đơn Nhóm Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    },
    {
        "id": "hcm-quan-ruot-30k",
        "city": "ho-chi-minh",
        "sub_id": "hcmquanruot",
        "title": "Quán Ruột Dân Sành Ăn Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=quan+quen",
    },
    {
        "id": "hcm-di-cho-50",
        "city": "ho-chi-minh",
        "sub_id": "hcmdicho",
        "title": "Chợ Tươi Ngon Đỉnh Sài Gòn",
        "original_url": "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=mart",
    },

    # HÀ NỘI (ha-noi)
    {
        "id": "hn-freeship-0d",
        "city": "ha-noi",
        "sub_id": "hnfreeship",
        "title": "Hà Nội Freeship Xtra 0Đ",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    },
    {
        "id": "hn-pho-co-35k",
        "city": "ha-noi",
        "sub_id": "hnphoco",
        "title": "Ăn Phố Cổ - Chuẩn Vị Hà Thành",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=pho",
    },
    {
        "id": "hn-com-trua-50",
        "city": "ha-noi",
        "sub_id": "hncomtrua",
        "title": "Cơm Trưa Văn Phòng Hà Nội",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=com+trua",
    },
    {
        "id": "hn-tra-chanh-30k",
        "city": "ha-noi",
        "sub_id": "hntrachanh",
        "title": "Trà Sữa & Cà Phê Trứng Hà Nội",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    },
    {
        "id": "hn-lau-nuong-70k",
        "city": "ha-noi",
        "sub_id": "hnlaunuong",
        "title": "Lẩu & Nướng Hà Thành Tụ Tập",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=lau+nuong",
    },
    {
        "id": "hn-an-vat-25k",
        "city": "ha-noi",
        "sub_id": "hnanvat",
        "title": "Ăn Vặt Cổng Trường & Giờ Chiều",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=an+vat",
    },
    {
        "id": "hn-quan-moi-40k",
        "city": "ha-noi",
        "sub_id": "hnquanmoi",
        "title": "Quán Mới Đất Thủ Đô - Chào Bạn",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    },
    {
        "id": "hn-dat-nhom-100k",
        "city": "ha-noi",
        "sub_id": "hndatnhom",
        "title": "Đặt Nhóm Đồng Nghiệp Hà Nội",
        "original_url": "https://shopeefood.vn/ha-noi/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    },

    # ĐÀ NẴNG (da-nang)
    {
        "id": "dn-freeship-0d",
        "city": "da-nang",
        "sub_id": "dnfreeship",
        "title": "Đà Nẵng Freeship 0Đ Phố Biển",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=freeship",
    },
    {
        "id": "dn-mi-quang-35k",
        "city": "da-nang",
        "sub_id": "dnmiquang",
        "title": "Mì Quảng & Đặc Sản Miền Trung",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=mi+quang",
    },
    {
        "id": "dn-hai-san-50k",
        "city": "da-nang",
        "sub_id": "dnhaisan",
        "title": "Hải Sản Tươi Sống Phố Biển",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=hai+san",
    },
    {
        "id": "dn-tra-sua-25k",
        "city": "da-nang",
        "sub_id": "dntrasua",
        "title": "Trà Sữa & Cà Phê Gió Biển",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=tra+sua",
    },
    {
        "id": "dn-an-vat-cho-dem-20k",
        "city": "da-nang",
        "sub_id": "dnanvat",
        "title": "Ăn Vặt Chợ Đêm & Cầu Rồng",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=an+vat",
    },
    {
        "id": "dn-com-ga-30k",
        "city": "da-nang",
        "sub_id": "dncomga",
        "title": "Cơm Gà & Bún Bò Đà Thành",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=com+ga",
    },
    {
        "id": "dn-quan-moi-40k",
        "city": "da-nang",
        "sub_id": "dnquanmoi",
        "title": "Quán Mới Đà Nẵng - Deal Khám Phá",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=quan+moi",
    },
    {
        "id": "dn-tiec-nhom-90k",
        "city": "da-nang",
        "sub_id": "dntiecnhom",
        "title": "Khui Tiệc Nhóm Bạn Đà Nẵng",
        "original_url": "https://shopeefood.vn/da-nang/danh-sach-dia-diem-giao-tan-noi?q=dat+nhom",
    },
]

def build_affiliate_url(original_url, city, sub_id):
    sep = "&" if "?" in original_url else "?"
    return (
        f"{original_url}{sep}mmp_pid=an_17316810077"
        f"&utm_source=an_17316810077"
        f"&utm_medium=affiliate_food"
        f"&utm_campaign=foodtour_voucher_{city}"
        f"&sub_id={sub_id}"
    )

def main():
    os.makedirs("data", exist_ok=True)
    csv_file = "data/voucher_links_pending_affiliate.csv"
    excel_subid_file = "data/Batch_Voucher_Custom_Links.xlsx"
    excel_nosubid_file = "data/Batch_Voucher_Custom_Links_NoSubId.xlsx"

    # Kiểm tra tính hợp lệ của tất cả sub_id (chỉ chữ và số [a-zA-Z0-9])
    for item in VOUCHERS_DATA:
        sub = item["sub_id"]
        if not sub.isalnum():
            print(f"❌ LỖI: sub_id '{sub}' chứa ký tự không hợp lệ! Chỉ được dùng [a-zA-Z0-9].")
            sys.exit(1)
        if len(sub) > 16:
            print(f"❌ LỖI: sub_id '{sub}' quá dài (> 16 ký tự).")
            sys.exit(1)

    # 1. Xuất file CSV chi tiết
    with open(csv_file, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "city", "title", "sub_id", "original_url", "affiliate_tracking_url"])
        for item in VOUCHERS_DATA:
            aff_url = build_affiliate_url(item["original_url"], item["city"], item["sub_id"])
            writer.writerow([
                item["id"],
                item["city"],
                item["title"],
                item["sub_id"],
                item["original_url"],
                aff_url,
            ])
    print(f"✅ Đã tạo file CSV: {csv_file} ({len(VOUCHERS_DATA)} dòng)")

    # 2. Xuất file Excel chuẩn Shopee Affiliate có Sub_id1 sạch (Batch_Voucher_Custom_Links.xlsx)
    wb_subid = openpyxl.Workbook()
    ws_subid = wb_subid.active
    ws_subid.title = "Sheet1"
    ws_subid.append(["Liên kết gốc", "Sub_id1", "Sub_id2", "Sub_id3", "Sub_id4", "Sub_id5"])
    for item in VOUCHERS_DATA:
        ws_subid.append([item["original_url"], item["sub_id"], None, None, None, None])
    wb_subid.save(excel_subid_file)
    print(f"✅ Đã tạo file Excel có Sub_id: {excel_subid_file} ({len(VOUCHERS_DATA)} dòng)")

    # 3. Xuất file Excel chuẩn Shopee Affiliate KHÔNG CÓ Sub_id1 (Batch_Voucher_Custom_Links_NoSubId.xlsx)
    # Đây là phương án dự phòng 100% thành công không phụ thuộc vào bộ lọc Sub_id của Shopee
    wb_nosubid = openpyxl.Workbook()
    ws_nosubid = wb_nosubid.active
    ws_nosubid.title = "Sheet1"
    ws_nosubid.append(["Liên kết gốc", "Sub_id1", "Sub_id2", "Sub_id3", "Sub_id4", "Sub_id5"])
    for item in VOUCHERS_DATA:
        ws_nosubid.append([item["original_url"], None, None, None, None, None])
    wb_nosubid.save(excel_nosubid_file)
    print(f"✅ Đã tạo file Excel không Sub_id: {excel_nosubid_file} ({len(VOUCHERS_DATA)} dòng)")

    print("\n-------------------------------------------------------------")
    print("🎯 HƯỚNG DẪN TẢI LÊN SHOPEE AFFILIATE:")
    print("1. File khuyên dùng: data/Batch_Voucher_Custom_Links.xlsx")
    print("   -> Sub_id1 đã được làm sạch 100% (chỉ gồm chữ cái viết thường và số, không có dấu '-', độ dài 7-11 ký tự).")
    print("2. File dự phòng: data/Batch_Voucher_Custom_Links_NoSubId.xlsx")
    print("   -> Sub_id1 để trống hoàn toàn (giống các mẻ nhà hàng trước, đảm bảo 100% thành công).")
    print("3. Tải lên tại: https://affiliate.shopee.vn -> Custom Link -> Batch (Tải lên hàng loạt).")
    print("-------------------------------------------------------------")

if __name__ == "__main__":
    main()
