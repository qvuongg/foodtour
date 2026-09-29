#!/usr/bin/env python3
"""
Công cụ tự động gộp kết quả link rút gọn từ Shopee Affiliate vào:
1. File 'data/crawler_urls_pending_affiliate.csv'
2. Database Supabase (nếu có cấu hình key)

Cách dùng:
  # Tự động quét tất cả file kết quả từ Shopee trong thư mục data/ (AffiliateBatchCustomLinks*.csv / .xlsx)
  python3 scripts/merge-affiliate-results.py

  # Hoặc chỉ định rõ các file kết quả
  python3 scripts/merge-affiliate-results.py --files="data/AffiliateBatch1.csv,data/AffiliateBatch2.csv"
"""

import sys
import os
import glob
import csv
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import openpyxl
except ImportError:
    openpyxl = None

def load_env():
    env_path = ".env.local"
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    env_vars[k] = v
    return env_vars

def parse_result_file(file_path):
    """Đọc file kết quả từ Shopee (.csv hoặc .xlsx) và trả về dict {url_goc: link_aff}"""
    aff_map = {}
    if not os.path.exists(file_path):
        print(f"⚠️ File không tồn tại: {file_path}")
        return aff_map

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        with open(file_path, "r", encoding="utf-8-sig", errors="ignore") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 7:
                    orig = row[0].strip()
                    conv = row[6].strip()
                    if orig and conv and ("shope.ee" in conv or "s.shopee.vn" in conv):
                        aff_map[orig] = conv
    elif ext in [".xlsx", ".xls"] and openpyxl:
        wb = openpyxl.load_workbook(file_path, read_only=True)
        ws = wb.active
        for row in ws.iter_rows(values_only=True):
            if row and len(row) >= 7:
                orig = str(row[0] or "").strip()
                conv = str(row[6] or "").strip()
                if orig and conv and ("shope.ee" in conv or "s.shopee.vn" in conv):
                    aff_map[orig] = conv
        wb.close()
    return aff_map

def clean_url(raw_url):
    if not raw_url:
        return ""
    try:
        parsed = urllib.parse.urlparse(raw_url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".lower().rstrip("/")
    except:
        return raw_url.lower().rstrip("/")

def main():
    args = sys.argv[1:]
    files_arg = None
    sync_supabase = True

    for a in args:
        if a.startswith("--files="):
            files_arg = a.split("=", 1)[1].strip()
        elif a == "--no-supabase":
            sync_supabase = False

    result_files = []
    if files_arg:
        result_files = [f.strip() for f in files_arg.split(",") if f.strip()]
    else:
        # Tự động tìm tất cả file kết quả do Shopee xuất
        result_files = glob.glob("data/AffiliateBatchCustomLinks*.csv") + glob.glob("data/AffiliateBatchCustomLinks*.xlsx")

    if not result_files:
        print("❌ Không tìm thấy file kết quả Shopee Affiliate nào trong data/!")
        print("👉 Sau khi Shopee tạo xong link rút gọn, hãy tải 2 file kết quả về bỏ vào thư mục data/ rồi chạy lại lệnh này.")
        return

    print(f"🔍 Tìm thấy {len(result_files)} file kết quả từ Shopee:")
    for f in result_files:
        print(f"  - {f}")

    all_aff_map = {}
    for rf in result_files:
        m = parse_result_file(rf)
        print(f"  👉 Đã đọc {len(m):,} link chuyển đổi từ {os.path.basename(rf)}")
        all_aff_map.update(m)

    print(f"\n📊 Tổng cộng có {len(all_aff_map):,} link affiliate hợp lệ từ các file kết quả.")

    # 1. Cập nhật vào data/crawler_urls_pending_affiliate.csv
    pending_csv = "data/crawler_urls_pending_affiliate.csv"
    if os.path.exists(pending_csv):
        print(f"\n📝 Đang cập nhật vào {pending_csv}...")
        with open(pending_csv, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            rows = list(reader)

        updated_count = 0
        normalized_aff_map = {clean_url(k): v for k, v in all_aff_map.items()}

        for r in rows:
            if len(r) >= 4:
                url = r[3].strip()
                norm_u = clean_url(url)
                if norm_u in normalized_aff_map:
                    if len(r) == 4:
                        r.append(normalized_aff_map[norm_u])
                    else:
                        r[4] = normalized_aff_map[norm_u]
                    updated_count += 1

        with open(pending_csv, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)

        print(f"✅ Đã điền link affiliate cho {updated_count:,} / {len(rows):,} dòng trong {pending_csv}!")

    # 2. Cập nhật vào Supabase
    if sync_supabase:
        env = load_env()
        supabase_url = env.get("VITE_SUPABASE_URL", "https://cfjahscecuviajbemznx.supabase.co")
        key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("VITE_SUPABASE_ANON_KEY", "")

        if not key:
            print("\n⚠️ Không tìm thấy key Supabase trong .env.local, bỏ qua bước cập nhật database.")
            return

        print(f"\n🚀 Đang đồng bộ {len(all_aff_map):,} link affiliate lên Supabase Database...")
        # Sử dụng thread pool để đồng bộ nhanh
        success_count = 0
        items = list(all_aff_map.items())

        def patch_spot(orig_url, aff_url):
            try:
                parsed = urllib.parse.urlparse(orig_url)
                path_only = parsed.path.rstrip("/")
                if not path_only:
                    return False
                endpoint = f"{supabase_url}/rest/v1/restaurants?original_url=ilike.*{urllib.parse.quote(path_only)}*"
                data = json.dumps({"affiliate_url": aff_url}).encode("utf-8")
                req = urllib.request.Request(
                    endpoint,
                    data=data,
                    headers={
                        "Content-Type": "application/json",
                        "apikey": key,
                        "Authorization": f"Bearer {key}",
                    },
                    method="PATCH",
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return resp.status in (200, 204)
            except Exception:
                return False

        with ThreadPoolExecutor(max_workers=30) as executor:
            future_to_item = {executor.submit(patch_spot, u, a): (u, a) for u, a in items}
            for i, future in enumerate(as_completed(future_to_item), 1):
                if future.result():
                    success_count += 1
                if i % 1000 == 0 or i == len(items):
                    print(f"  Progress: {i:,}/{len(items):,} ({success_count:,} thành công)")

        print(f"🎉 Đã cập nhật thành công {success_count:,}/{len(items):,} link affiliate lên Supabase!")

if __name__ == "__main__":
    main()
