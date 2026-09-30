# FoodTour — What To Eat & Drink Today? 🍜🥤

[Tiếng Việt](README.md) · **English**

A modern web application solving the classic dilemma: *"What to eat or drink today?"* with an exciting **CS2-style case opening roulette reel**, combined with real-world 3km nearby restaurant discovery via Supabase PostGIS and seamless 1-tap direct ordering through the ShopeeFood app.

---

## 🌟 Key Features

### 1. 🎰 CS2-Style Food Roulette Reel
- **4 Rich Categories:**
  - **Lunch:** Rice, noodles, pho, rolls, vegetarian... with budget selector and strict vegetarian filter.
  - **Drinks:** Salt coffee, bubble milk tea, peach lemongrass tea, fresh juices, smoothies...
  - **Snacks:** Vietnamese street food, grilled rice paper, fried fermented pork rolls, avocado ice cream...
  - **Pubs / Gatherings:** Hotpot, BBQ, drinks and gatherings with friends.
- **Authentic Case Opening Experience:** Realistic CS2 mechanical click sounds, smooth momentum deceleration, and celebratory confetti.

### 2. 📍 3km Nearby Restaurant Discovery via Supabase PostGIS
- Automatic GPS detection (only when permitted by the user).
- Direct queries to the Supabase PostGIS RPC function `get_nearby_restaurants` to fetch restaurants open within a 3,000m radius.
- Smart relevance filter (`dish-relevance`): Strictly prevents mismatches (e.g. spinning "Hanoi Bun Cha" will never return fish noodle soup; non-veg dishes reject vegetarian places).
- Multi-tier ranking: Review count ➔ Rating score (⭐) ➔ Physical proximity.

### 3. 🥤 Dedicated Beverage Experience
- **Famous Brands Carousel:**
  - Features top national F&B chains: *Highlands Coffee, Phúc Long, Phê La, Katinat, The Coffee House, Starbucks, Mixue, ToCoToCo, Cộng Cà Phê, Gong Cha, KOI Thé*.
  - Authentic brand vector logos, sleek compact card design, horizontal 1-touch swipeable track on mobile.
- **District Spots Checklist:**
  - Auto-detects the user's current urban district (e.g., Da Nang: *Liên Chiểu, Hải Châu, Thanh Khê, Sơn Trà, Ngũ Hành Sơn, Cẩm Lệ*).
  - Dynamic curated top spots fetched from Supabase with an interactive visit tracker.

### 4. ⚡ Direct ShopeeFood Mobile Deep Link
- Universal deep linking (`shopee-deeplink.ts`): Tapping **"Order"** on iOS Safari or Android directly launches the Shopee / ShopeeFood native mobile app, **completely bypassing intermediate web redirects**.
- Automatically attaches official affiliate tracking parameters (`mmp_pid`, `utm_source`, `utm_medium`, `utm_campaign`, `sub_id`).

### 5. 🕷️ Crawler & Data Automation Suite
- **ShopeeFood Crawler (`scripts/crawl-drinks.mjs`):** Crawls restaurants and beverage spots across 3 major cities (*Da Nang, Hanoi, Ho Chi Minh City*) with automatic district query expansion.
- **Shopee Batch Link Exporter (`scripts/export-batch-custom-links.py`):** Exports thousands of URLs into standard Shopee Affiliate Excel batches for short link generation.
- **Database Synchronizer (`scripts/merge-affiliate-results.py`):** Automatically ingests converted Shopee affiliate links and batch-updates `affiliate_url` on Supabase using multi-threaded concurrent requests.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Styling & Icons** | Vanilla CSS Modules + CSS Custom Properties, [Lucide React](https://lucide.dev/) |
| **Database & Spatial** | [Supabase](https://supabase.com/) (PostgreSQL 15 + PostGIS extension) |
| **Crawler & Automation** | [Playwright](https://playwright.dev/) (Chromium Stealth), Python 3 (openpyxl) |
| **Testing** | Node.js Test Runner (`node --test`) + [esbuild](https://esbuild.github.io/) |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `22.12+`
- **pnpm**: `9.x+`
- **Python**: `3.9+` (with `openpyxl` installed if processing Excel batches)

### Steps

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/qvuongg/foodtour.git
   cd foodtour
   pnpm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For crawling & database synchronization
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 🧪 Testing & Building

```bash
# Run all 60 automated unit tests
pnpm test

# Run TypeScript typechecks
pnpm typecheck

# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

---

## 📊 Crawling & Data Synchronization

### 1. Crawl beverage spots
```bash
# Crawl all 3 target cities: Hanoi, Da Nang, Ho Chi Minh City
node scripts/crawl-drinks.mjs --all

# Or crawl a single city in fast mode:
node scripts/crawl-drinks.mjs --city=da-nang --fast
```

### 2. Export batch files for Shopee Affiliate
Pre-generated at [`data/Batch Custom Links_Drink.xlsx`](data/Batch%20Custom%20Links_Drink.xlsx).  
Upload this file to **Shopee Affiliate Portal > Custom Link > Batch**, then download the converted `AffiliateBatchCustomLinks...` file into `data/`.

### 3. Sync affiliate links to Supabase
```bash
python3 scripts/merge-affiliate-results.py
```

---

## 🔒 Privacy & Data

- **Location Data:** GPS coordinates are solely used in the client browser to calculate distances via PostGIS RPC functions. **No location logs or personal identities are stored**.
- **User Preferences:** Spin counts and custom dish preferences are stored locally in the user's browser cookies.
