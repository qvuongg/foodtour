import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = mkdtempSync(join(tmpdir(), "tnag-food-ordering-"));
try {
  buildSync({
    entryPoints: ["src/lib/food-ordering.ts"],
    outfile: join(out, "food-ordering.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
  });
  const {
    ORDERING_CITIES,
    resolveShopeeFoodLink,
    shopeeFoodSearchUrl,
    resolveDishAffiliateLink,
  } = createRequire(import.meta.url)(join(out, "food-ordering.cjs"));
  const fallback = { href: "https://shopeefood.vn/", affiliate: false };

  test("Missing or malformed configuration falls back to the official homepage", () => {
    for (const value of [
      undefined,
      "",
      "   ",
      "not a URL",
      "/food",
      "https://",
    ]) {
      assert.deepEqual(resolveShopeeFoodLink(value), fallback, String(value));
    }
  });

  test("Official links preserve tracking bytes, encoding, order and fragments", () => {
    const urls = [
      "https://shopeefood.vn/",
      "https://www.shopeefood.vn/ho-chi-minh/quan-an?x=1&x=2#menu",
      "https://shopee.vn/food?redirect=https%3a%2f%2fshopeefood.vn%2f&tag=a+b%20c",
      "https://s.shopee.vn/AbCd123?sub_id=food%2Fpho&sign=A%2bB%3d#section",
      "HTTPS://S.SHOPEE.VN/CaseSensitive?utm_source=TruaNayAnGi",
      "https://shopeefood.vn:443/food?encoded=%7e%2f",
    ];
    for (const href of urls) {
      assert.deepEqual(resolveShopeeFoodLink(href), { href, affiliate: true });
    }
  });

  test("Only surrounding whitespace is removed from valid configuration", () => {
    const href = "https://s.shopee.vn/AbCd?sub_id=food%20tour";
    assert.deepEqual(resolveShopeeFoodLink(` \n\t${href}\r\n `), {
      href,
      affiliate: true,
    });
  });

  test("Unsafe schemes, host lookalikes, credentials and custom ports fail closed", () => {
    const urls = [
      "http://shopeefood.vn/",
      "//shopeefood.vn/",
      "javascript:alert(1)",
      "data:text/html,https://shopeefood.vn/",
      "https://evil.example/",
      "https://shopee.vn.evil.example/",
      "https://evilshopee.vn/",
      "https://shopeefood.vn.evil.example/",
      "https://evilshopeefood.vn/",
      "https://shopeefood.vn@evil.example/",
      "https://evil.example@shopeefood.vn/",
      "https://user:password@s.shopee.vn/",
      "https://shopeefood.vn:8443/",
      "https://s.shopee.vn:80/",
      "https://shopeefood.vn./",
      "https://shoрee.vn/",
    ];
    for (const href of urls) {
      assert.deepEqual(resolveShopeeFoodLink(href), fallback, href);
    }
  });

  test("Embedded controls are rejected before URL parsing can normalize them", () => {
    const urls = [
      "https://s.sho\tpee.vn/path",
      "https://s.shopee.vn/track\ning",
      "https://s.shopee.vn/?id=a\rb",
      "https://shopeefood.vn/\u0000path",
      "https://shopeefood.vn/\u007fpath",
    ];
    for (const href of urls) {
      assert.deepEqual(
        resolveShopeeFoodLink(href),
        fallback,
        JSON.stringify(href),
      );
    }
  });

  test("Search links encode Vietnamese dish names and only use verified cities", () => {
    assert.deepEqual(ORDERING_CITIES, [
      { value: "ho-chi-minh", label: "TP. HCM" },
      { value: "ha-noi", label: "Hà Nội" },
    ]);
    assert.equal(
      shopeeFoodSearchUrl("Cơm tấm", "ho-chi-minh"),
      "https://shopeefood.vn/ho-chi-minh/danh-sach-dia-diem-giao-tan-noi?q=C%C6%A1m%20t%E1%BA%A5m",
    );
    const customName = "Phở & bún? #1/2";
    const result = new URL(shopeeFoodSearchUrl(customName, "ha-noi"));
    assert.equal(result.pathname, "/ha-noi/danh-sach-dia-diem-giao-tan-noi");
    assert.equal(result.searchParams.get("q"), customName);
    assert.equal(result.searchParams.size, 1);
    assert.equal(result.hash, "");
  });

  test("Invalid or missing search inputs return the homepage", () => {
    for (const [dish, city] of [
      ["Cơm tấm", ""],
      ["Cơm tấm", "unknown"],
      ["Cơm tấm", "../ha-noi"],
      ["Cơm tấm", "ha-noi?q=other"],
      ["", "ha-noi"],
      [" \n ", "ha-noi"],
      ["\ud800", "ha-noi"],
    ]) {
      assert.equal(shopeeFoodSearchUrl(dish, city), fallback.href);
    }
  });

  const verifiedRestaurantLink =
    "https://s.shopee.vn/ExampleOnly?sub_id=test%2Ffood&sign=a%2bB%3d#menu";
  const verifiedDishes = JSON.stringify(["Cơm tấm", "Cơm sườn"]);
  test("An exact verified dish binding preserves the restaurant tracking URL", () => {
    for (const dish of ["Cơm tấm", "  CƠM TẤM  ", "Cơm tấm".normalize("NFD")]) {
      assert.deepEqual(
        resolveDishAffiliateLink(verifiedRestaurantLink, verifiedDishes, dish),
        { href: verifiedRestaurantLink, affiliate: true },
      );
    }
  });

  test("An unrelated or partially matching dish never opens the restaurant link", () => {
    for (const dish of ["Phở", "Cơm tấm chay", "Cơm", "Com tam"]) {
      assert.deepEqual(
        resolveDishAffiliateLink(verifiedRestaurantLink, verifiedDishes, dish),
        fallback,
      );
    }
  });

  test("An absent or blank winning dish cannot enable the restaurant suggestion", () => {
    for (const dish of [undefined, "", "   "]) {
      assert.deepEqual(
        resolveDishAffiliateLink(verifiedRestaurantLink, verifiedDishes, dish),
        fallback,
      );
    }
  });

  test("Missing or malformed dish bindings safely disable the restaurant suggestion", () => {
    for (const dishes of [
      undefined,
      "",
      "Cơm tấm",
      "{",
      "null",
      "42",
      '"Cơm tấm"',
      "{}",
      "[]",
      '["Cơm tấm", 1]',
      '["Cơm tấm", null]',
      '["Cơm tấm", "   "]',
    ]) {
      assert.deepEqual(
        resolveDishAffiliateLink(verifiedRestaurantLink, dishes, "Cơm tấm"),
        fallback,
      );
    }
  });

  test("Matching dish bindings cannot enable absent or unsafe affiliate links", () => {
    for (const url of [
      undefined,
      "",
      "https://evil.example/",
      "http://s.shopee.vn/test",
    ]) {
      assert.deepEqual(
        resolveDishAffiliateLink(url, verifiedDishes, "Cơm tấm"),
        fallback,
      );
    }
    assert.deepEqual(
      resolveDishAffiliateLink(verifiedRestaurantLink, '[""]', ""),
      fallback,
    );
  });
} finally {
  rmSync(out, { recursive: true, force: true });
}
