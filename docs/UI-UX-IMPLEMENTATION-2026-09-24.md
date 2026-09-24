# UI/UX implementation — 24/09/2026

Implemented the approved UI/UX plan without adding catalog search or dependencies.

## Main changes

- One spin control group: fixed bottom dock on mobile and short landscape screens; inline on desktop. The first screen uses the available viewport height, with safe-area padding.
- Four visible category tabs with arrow, Home and End navigation. Language and sound move into an options dialog; community links remain in the footer.
- Mirror Hall keeps its concave perspective, tilt, reflection and slow idle drift. Card geometry never scales or lifts the center card. All dialogs suspend idle drift. Browsing remains separate from choosing a result.
- Budget dialog validates input without changing the dock height. Per-category budgets persist in a versioned cookie, migrating existing settings without overwriting personal dishes or legacy cookies. Vegetarian preference is remembered and applies only to Lunch, whose data carries vegetarian tags.
- Compact result dialog uses an image beside the title/price, a scrollable content area and a persistent close/continue footer. Prices use serving units from the dish/category.
- Personal lunch dishes retain validation, draft retry after failed saves, restore and delete cancellation. Closing dialogs returns focus to their own trigger.
- Ordering removes clipboard actions. A known matching restaurant uses its exact configured affiliate URL for the primary action and QR. Other dishes expose the general ShopeeFood destination honestly, with the existing city-specific web route separately available. QR is collapsed initially.

## Checks performed

Environment: pnpm 12.3.4. `pnpm test`, `pnpm build`, and `git diff --check` passed.

- 39 Node tests passed, plus the personal-pool test script.
- Existing spin probability and motion/profile duration code remain unchanged. Tests cover normal/reduced-motion timings and stopping at the selected winner.
- A real normal-motion spin returned **Cơm tấm** in both the center card and popup. Counter increased from 7 to 8 once. Spin, category and budget controls were disabled during the spin.
- Dragging the carousel did not open the result dialog or increase the counter.
- Lunch vegetarian selection remained remembered across categories; Drinks displayed 72 items with its vegetarian control disabled.
- A custom drink budget of 42,000 VND survived a page reload and switching back from Lunch, which retained 50,000 VND. The drink setting was restored to its previous preset after testing.
- Custom-budget validation rejected 99,000 VND for Drinks and focused the input. Applying a valid amount returned focus to the budget trigger.
- Personal-dish form rejected missing names and invalid prices. A temporary dish was saved, survived reload, and was removed after testing. The original catalog selection was restored.
- Removing the eight vegetarian dishes temporarily produced an empty vegetarian pool: the spin button was disabled and the recovery action restored the full list. Test changes were reverted.
- Arrow/Home/End category navigation, switching Vietnamese/English, Escape, and returning focus were exercised. Closing a catalog preview returned focus and scroll position to that dish.
- At 360 × 640, the Bún chả popup exposed the configured Hanoi restaurant action within the viewport (approximately y324–372). Expanding QR kept the footer accessible while the content scrolled.
- No browser console errors/warnings were reported in the final QA session.

### Viewport measurements

Measured in CSS pixels at scroll position 0. Every size showed all four tabs and the entire spin CTA, without horizontal document overflow.

| Viewport | CTA top–bottom | Smallest category target height |
| --- | --- | --- |
| 360 × 568 | 505–557 | 52 |
| 360 × 640 | 577–629 | 52 |
| 390 × 844 | 781–833 | 52 |
| 768 × 1024 | 549–601 | 44 |
| 1024 × 768 | 661–713 | 44 |
| 1280 × 720 | 613–665 | 44 |
| 1440 × 900 | 697–749 | 44 |
| 844 × 390 | 326–378 | 44 |

Screenshots are in `artifacts/ui-ux-2026-09-24/`: desktop, mobile and the mobile result popup.

## Remaining verification limits

- Browser viewport testing does not replace physical iOS/Android testing with browser chrome, keyboard and device safe areas.
- Reduced-motion behavior was checked in source and automated motion tests; the OS preference was not changed for a full manual session.
- Blocked/oversized-cookie behavior was tested by the cookie suite, not by changing the user's real browser privacy settings.
- Outgoing restaurant URL and QR generation were checked; app handoff, real delivery availability and affiliate commission attribution were not verified by placing an order.
- The private PRODUCT_PHILOSOPHY document was unavailable in the workspace; this implementation follows the available repository material and the approved plan, without claiming compliance with that missing document.
