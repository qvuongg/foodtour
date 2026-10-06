import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "foodtour-shopee-deeplink-"));
buildSync({
  entryPoints: ["src/lib/shopee-deeplink.ts"],
  outfile: join(out, "shopee-deeplink.mjs"),
  bundle: true,
  format: "esm",
});

const {
  handleShopeeFoodClick,
  openShopeeAppDeepLink,
} = await import(pathToFileURL(join(out, "shopee-deeplink.mjs")).href);

function setupMockEnvironment(userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)") {
  let locationHref = "";
  let dispatchedEvents = [];

  globalThis.window = {
    location: {
      get href() {
        return locationHref;
      },
      set href(val) {
        locationHref = val;
      },
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
      return true;
    },
    setTimeout: (fn, ms) => {
      return { unref() {} };
    },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  globalThis.document = {
    hidden: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  globalThis.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  try {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: userAgent,
      configurable: true,
      writable: true,
    });
  } catch {
    globalThis.navigator = { userAgent };
  }

  return {
    getHref: () => locationHref,
    setHref: (val) => {
      locationHref = val;
    },
    getEvents: () => dispatchedEvents,
  };
}

test("Shopee Deeplink: Mobile click on regular shopeefood.vn URL opens native app deep link", () => {
  const env = setupMockEnvironment();
  let defaultPrevented = false;
  const mockEvent = {
    preventDefault() {
      defaultPrevented = true;
    },
  };

  const directUrl = "https://shopeefood.vn/da-nang/ba-ngoc-bun-thit-nuong";
  handleShopeeFoodClick(directUrl, mockEvent);

  assert.equal(defaultPrevented, true, "Phải chặn điều hướng trình duyệt mặc định");
  const href = env.getHref();
  assert.ok(
    href.startsWith("shopeevn://main?apprl="),
    `Phải kích hoạt URL scheme shopeevn://, nhận được: ${href}`,
  );
  assert.ok(href.includes(encodeURIComponent(directUrl)));
  assert.ok(href.includes("push=1"));
});

test("Shopee Deeplink: Mobile click on shortened affiliate link (shope.ee) opens native app deep link directly", () => {
  const env = setupMockEnvironment();
  let defaultPrevented = false;
  const mockEvent = {
    preventDefault() {
      defaultPrevented = true;
    },
  };

  const affiliateUrl = "https://shope.ee/9fLGOSa5it";
  handleShopeeFoodClick(affiliateUrl, mockEvent);

  assert.equal(
    defaultPrevented,
    true,
    "Phải chặn điều hướng Safari để không mở trang trung gian",
  );
  const href = env.getHref();
  assert.ok(
    href.startsWith("shopeevn://main?apprl="),
    `Phải mở app qua shopeevn scheme cho link shope.ee, nhận được: ${href}`,
  );
  assert.ok(href.includes(encodeURIComponent(affiliateUrl)));
  assert.ok(href.includes("push=1"));
});

test("Shopee Deeplink: Mobile click on s.shopee.vn affiliate link opens native app deep link directly", () => {
  const env = setupMockEnvironment();
  let defaultPrevented = false;
  const mockEvent = {
    preventDefault() {
      defaultPrevented = true;
    },
  };

  const affiliateUrl = "https://s.shopee.vn/test888";
  handleShopeeFoodClick(affiliateUrl, mockEvent);

  assert.equal(defaultPrevented, true);
  const href = env.getHref();
  assert.equal(
    href,
    `shopeevn://main?apprl=${encodeURIComponent(affiliateUrl)}&push=1`,
  );
});

test("Shopee Deeplink: Desktop click preserves native browser behavior without triggering app scheme", () => {
  const env = setupMockEnvironment(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
  let defaultPrevented = false;
  const mockEvent = {
    preventDefault() {
      defaultPrevented = true;
    },
  };

  const url = "https://shope.ee/9fLGOSa5it";
  handleShopeeFoodClick(url, mockEvent);

  assert.equal(defaultPrevented, false, "Trên desktop không được preventDefault để thẻ <a> tự mở");
  assert.equal(env.getHref(), "", "Trên desktop không được chuyển hướng sang shopeevn://");
});

test("Shopee Deeplink: openShopeeAppDeepLink wraps target URL into shopeevn scheme", () => {
  const env = setupMockEnvironment();
  const url = "https://shopeefood.vn/ha-noi/phe-la-nguyen-van-cu";
  openShopeeAppDeepLink(url);

  assert.equal(
    env.getHref(),
    `shopeevn://main?apprl=${encodeURIComponent(url)}&push=1`,
  );
});
