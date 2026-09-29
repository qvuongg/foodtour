#!/usr/bin/env python3
"""
Công cụ xuất danh sách link ShopeeFood từ crawler_urls_pending_affiliate.csv
sang các file Excel 'Batch Custom Links' chuẩn mẫu Shopee Affiliate.

Quy định Shopee Affiliate:
- Chỉ tải lên file Excel (.xlsx / .xls)
- Tối đa 10,000 link mỗi file

Cách dùng:
  python3 scripts/export-batch-custom-links.py
  python3 scripts/export-batch-custom-links.py --max-per-file=10000
  python3 scripts/export-batch-custom-links.py --split-even
"""

import sys
import os
import csv
import shutil
import math

try:
    import openpyxl
except ImportError:
    print("❌ Cần cài đặt openpyxl: pip3 install openpyxl")
    sys.exit(1)

def main():
    args = sys.argv[1:]
    input_file = "data/crawler_urls_pending_affiliate.csv"
    template_file = "data/Batch Custom Links.xlsx"
    max_per_file = 10000
    split_even = False

    for a in args:
        if a.startswith("--input="):
            input_file = a.split("=", 1)[1].strip()
        elif a.startswith("--max-per-file="):
            max_per_file = int(a.split("=", 1)[1].strip())
        elif a == "--split-even":
            split_even = True

    if not os.path.exists(input_file):
        print(f"❌ Không tìm thấy file đầu vào: {input_file}")
        sys.exit(1)

    print(f"📂 Đang đọc dữ liệu từ: {input_file}...")
    with open(input_file, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        # Cột thứ 4 (index 3) là Link ShopeeFood Gốc
        urls = [r[3].strip() for r in reader if len(r) > 3 and r[3].strip()]

    total_urls = len(urls)
    print(f"✅ Đã nạp {total_urls:,} links từ CSV.")

    if total_urls == 0:
        print("⚠️ Không có link nào để xuất.")
        return

    # Xác định cách chia file
    if split_even:
        num_files = math.ceil(total_urls / max_per_file)
        chunk_size = math.ceil(total_urls / num_files)
        chunks = [urls[i:i + chunk_size] for i in range(0, total_urls, chunk_size)]
    else:
        chunks = [urls[i:i + max_per_file] for i in range(0, total_urls, max_per_file)]

    print(f"📦 Sẽ chia thành {len(chunks)} file Excel (tối đa {max_per_file:,} link/file):")

    for idx, chunk in enumerate(chunks, 1):
        out_name = f"Batch Custom Links_Part{idx}.xlsx"
        out_path = os.path.join("data", out_name)

        if os.path.exists(template_file):
            wb = openpyxl.load_workbook(template_file)
            ws = wb.active
            if ws.max_row > 1:
                ws.delete_rows(2, ws.max_row - 1)
        else:
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Sheet1"
            ws.append(["Liên kết gốc", "Sub_id1", "Sub_id2", "Sub_id3", "Sub_id4", "Sub_id5"])

        for u in chunk:
            ws.append([u, None, None, None, None, None])

        wb.save(out_path)
        print(f"  📄 File {idx}: {out_name} -> {len(chunk):,} link (tổng {ws.max_row:,} dòng)")

        # Tạo bản sao với tên có khoảng trắng 'Batch Custom Links X.xlsx' để người dùng dễ chọn
        alt_name = f"Batch Custom Links {idx}.xlsx"
        shutil.copyfile(out_path, os.path.join("data", alt_name))

    print("\n🎉 Hoàn thành xuất các file Excel Batch Custom Links!")
    print("👉 Hãy đăng nhập Shopee Affiliate Portal (https://affiliate.shopee.vn) > Custom Link > Batch")
    print("👉 Tải từng file lên để Shopee chuyển đổi hàng loạt sang link rút gọn (shope.ee / s.shopee.vn).")

if __name__ == "__main__":
    main()
