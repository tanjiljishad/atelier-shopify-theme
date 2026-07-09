# Changelog

All notable changes to the Atelier theme are documented here, one entry per
build milestone. Dates reflect when the milestone was completed.

## Milestone 8 — Premium Cart Experience

**New components**
Cart drawer (right-side, merchant-configurable width, free-shipping
progress, line items, "Pairs well with" upsell, subtotal/tax note/checkout/
view-cart footer, empty state), cart page (2-column: items + sticky order-
summary card with discount-to-checkout link, gift-wrap placeholder, shipping
estimate messaging, tax note, grayscale payment icons, trust badges,
recommendations, recently viewed), shared cart line item (drawer + page,
same row, same primitives), free-shipping progress bar (accessible
`role="progressbar"`), cart note (collapsed disclosure), live cart badge in
the header (already built in Milestone 3, now genuinely driven by every
add/change/remove this milestone performs).

**Files created**
`sections/cart-drawer.liquid`; `snippets/cart-line-item.liquid`,
`free-shipping-bar.liquid`, `cart-upsell.liquid`, `cart-note.liquid`,
`cart-empty-state.liquid`, `gift-wrap-field.liquid`; `assets/cart-utils.js`,
`cart-drawer.js`, `cart-page.js`.

**Files modified**
`sections/main-cart.liquid` (full rebuild), `sections/header.liquid` (cart
icon now also carries `data-drawer-open` when the drawer is enabled),
`sections/header-group.json` (+cart-drawer section, always present),
`snippets/header-action.liquid` (documented — no functional change needed;
`href` + `drawer_target` already worked together), `snippets/product-
recommendations.liquid` (+optional `heading`/`intent` params so the cart
page can pass its own merchant-configurable cross-sell title and
`intent: 'complementary'` without this snippet growing cart-specific
knowledge), `snippets/recently-viewed.liquid` + `assets/recently-viewed.js`
(+"no product to record" mode for the cart page, spec: "appears on PDP +
cart page only"), `assets/theme.js` (cart-drawer.js added to the eager
header-group imports; cart-page.js dynamically gated), `config/
settings_schema.json` + `settings_data.json` (+"Cart" settings group),
`locales/en.default.json` (+~25 strings), `assets/theme.css` (+~450 lines:
sections 50–55).

**Architectural decisions**
- **Every cart mutation uses Shopify's native `sections` parameter** on
  `/cart/change.js` / `/cart/update.js` — one request both performs the
  mutation and returns fresh server-rendered HTML for the drawer/page
  section, so line-item markup, prices, and free-shipping math are never
  reimplemented in JS. Same fetch-and-extract-by-section-id philosophy as
  `predictive-search.js`/`collection-filters.js`, applied to the cart API
  instead of the generic Section Rendering endpoint — the Shopify-native
  choice over hand-rolling cart state in JavaScript.
- **`CartSurfaceController` (assets/cart-utils.js)** is the one place that
  knows how to debounce a quantity change, serialize requests, animate a
  removal, save a note, and swap in fresh content — `cart-drawer.js` and
  `cart-page.js` each instantiate it against their own container/section id
  rather than duplicating ~150 lines of "talk to the cart API safely"
  twice, directly per instruction #4.
- **Every cart mutation is serialized through one request queue**, not
  fired independently. Each response is a *full* re-render of the surface;
  if two requests were ever in flight at once, whichever response landed
  second would silently overwrite whatever the first had just applied, even
  with per-request `AbortController` cancellation (which only protects
  against a *stale* response, not an *out-of-order* one from a different
  line). Serializing removes the race entirely. Per-line debouncing (400ms)
  keeps a long-press's rapid repeat down to one queued request per line.
- **The drawer never replaces itself, only its inner content.** Every
  listener is delegated from the stable `.drawer__panel` and only
  `[data-cart-drawer-inner]` is swapped after a mutation — the same
  "replace an inner container, never the JS-controlling outer element"
  discipline `collection-filters.js` established in Milestone 6, applied
  here from the start rather than discovered via a bug.
- **`cart:updated` is the integration point for surfaces that don't know
  the drawer exists** — the upsell strip's `<quick-add-button>` (Milestone
  4), the PDP buy box (Milestone 7), and complete-the-look's batch add each
  do their own independent `/cart/add.js` call with zero knowledge of any
  drawer. Rather than teach three existing, working components about a
  drawer that didn't exist when they were built, `cart-drawer.js`/
  `cart-page.js` listen for the `cart:updated` event they already all
  dispatch: any occurrence not tagged with this surface's own section id as
  its source means the content is stale, so it force-refreshes and (drawer
  only, and only when enabled and not already on the cart page) opens —
  exactly the "cart drawer slides open" ATC feedback flagged as a
  Milestone 7 follow-up, delivered with one new listener and zero changes
  to any of those three files.
- **Discount codes redirect to checkout with `?discount=CODE`**, via a real
  `method="get"` form — Shopify's storefront has no API to apply a code to
  the cart itself pre-checkout, so a field that tried to would either be
  fake or need a private/app API this theme can't assume exists. This is
  the correct Shopify-native behavior, not a limitation: the code still
  gets applied, just at the point in the flow where Shopify actually
  validates codes.
- **Shipping estimator downgraded to messaging.** The PDF's cart-page text
  describes a full country/zip → rates calculator; this milestone's own
  brief already downgrades that to "shipping estimate messaging," which is
  what's built (same static-line pattern as the PDP buy box). A real rate
  table needs the async shipping-rates API and genuine shipping-zone data
  that don't exist in a generic theme — showing a wrong computed rate is a
  worse outcome than a general estimate. Flagged below as a Milestone 9
  candidate for a store that wants to invest in it.
- **Gift wrap stays an explicit placeholder**, same precedent as wishlist/
  compare in Milestone 3: a real, fully styled switch with no backend
  behind it, since adding a real gift-wrap line item needs a specific
  product only a merchant can create. Wiring it for real later is a
  one-line change (the switch's `change` event is the only thing missing).
- **No cart-specific animation toggle**, despite it being one of the
  brief's example settings — `settings.animations_enabled` (global,
  Milestone 1) already gates every reveal/transition sitewide; adding a
  second, cart-scoped toggle would be exactly the kind of duplicate setting
  instruction #4 warns against. Every cart transition (drawer slide,
  removal collapse) already reads reduced-motion/performance-mode through
  the shared `motion.js` primitives, same as everywhere else in the theme.

**Bug fixes (caught before shipping)**
Two separate `{% liquid %}...{% endliquid %}` mistakes (`cart-line-item.liquid`,
plus the same error pattern already fixed once in `buy-box.liquid` during
Milestone 7 — `liquid` is not a paired block tag) broke both files outright;
removed. A `postCart` call was written expecting per-request
`AbortController` cancellation to fully solve the "rapid clicks" race
condition; on review this only protects a *stale* response for the *same*
line, not two *different* lines' responses landing out of order and
overwriting each other — replaced with the serialized-queue design
described above before it ever shipped. `cart-page.js`'s first draft passed
the *same* element as both the stable event-delegation root and the
swappable content target — since `CartSurfaceController.swap()` looks for
the target *inside* the container, this would have silently failed to find
anything to replace on every single cart-page update; fixed by delegating
from the swap target's stable parent instead. `assets/cart-drawer.js`
referenced `window.Atelier.settings.cartRemovedMessage`/`cartUpdatedMessage`
for its `aria-live` announcements — neither was ever actually added to that
global object, which would have announced the literal string "undefined"
to screen readers; replaced with a small per-section i18n JSON blob, same
pattern as `variant-picker.liquid`'s (Milestone 7). Several stray unused
`data-*` hooks (`data-cart-items`, `data-cart-drawer-count`,
`data-cart-subtotal` ×2, four attributes on the free-shipping bar) were
caught on self-review and removed — this milestone's full-content-swap
architecture never needed surgical per-element targeting, so they were
dead from the moment they were written.

**Known follow-ups for Milestone 9**
Cart-upsell's `{% recommendations %}` call evaluates on *every* page load
once a visitor has anything in their cart (it's rendered inline in
`cart-drawer.liquid`, which is always present via `header-group.json`) —
bounded to sessions with a non-empty cart, but if that server-render cost
ever proves measurable, making it async-loaded only on drawer-open (same
pattern as Milestone 7's PDP recommendations) is the fix. The shipping
estimator is messaging only, not a real country/zip → rate calculator (see
architectural decisions above) — a candidate if a store specifically wants
computed rates pre-checkout. Gift wrap is a real, styled, inert placeholder
with no product behind it. None of this milestone's AJAX cart paths have
been checked against a live store with real shipping zones, tax settings,
or an actual gift-wrap product configured — all built strictly to Shopify's
documented Cart API contract, untestable further from a static QA preview.

---

## Milestone 7 — Premium Product Experience

**New components**
Product gallery (desktop vertical stacked scroll + thumbnail rail, mobile
swipe carousel + dot progress — one shared DOM, CSS repositions it per
breakpoint; image/video/external video/3D model support via Shopify's own
media filters; keyboard arrow navigation; scrollspy-driven thumb/dot sync;
per-item loading skeleton), fullscreen zoom lightbox (scroll/pinch zoom to
2.5×, arrows, focus-trapped), live variant switching (price/media/URL/SKU/
availability update in place, unavailable combinations re-strike live, no
reload), sticky buy box (title/vendor/badges/rating/price/inventory/variant
picker/quantity/ATC/express checkout/shipping note/wishlist/compare/share/
trust badges/accordions/SKU/type), AJAX add-to-cart (spinner → "Added ✓" →
header cart count, real-form fallback on failure), size guide disclosure,
product info accordions (Description/Materials & Care/Shipping & Returns/
FAQ/Downloads, metafield-driven, hidden when empty), trust badge rows,
"Complete the look" bundle (checkbox multi-select, combined price, single
batched add-to-cart request), native product recommendations (Shopify's own
engine, fetched async so it never delays first paint), recently viewed
(localStorage snapshot, client-rendered), sticky mobile ATC bar (appears once
the in-flow button scrolls away), reviews via a merchant-configured `@app`
block slot (no review app integrated — clean placeholder architecture per
spec).

**Files created**
`sections/related-products.liquid`; `snippets/product-gallery.liquid`,
`product-media-item.liquid`, `product-lightbox.liquid`, `buy-box.liquid`,
`trust-badges.liquid`, `product-accordions.liquid`, `share-button.liquid`,
`sticky-add-to-cart.liquid`, `complete-the-look.liquid`,
`product-recommendations.liquid`, `recently-viewed.liquid`;
`assets/product-gallery.js`, `product-lightbox.js`, `variant-picker.js`,
`product-form.js`, `sticky-add-to-cart.js`, `complete-the-look.js`,
`product-recommendations.js`, `recently-viewed.js`, `share-button.js`.

**Files modified**
`sections/main-product.liquid` (full rebuild), `snippets/variant-picker.liquid`
(upgraded from a plain div to a `<variant-picker>` custom element carrying a
server-rendered variant/i18n JSON blob, + optional size-guide slot),
`snippets/breadcrumb.liquid` (+`product` param), `snippets/icon-sprite.liquid`
(+maximize, share-2, truck, rotate-ccw, shield-check, lock — gallery/lightbox
arrows reuse the existing chevron-down rotation utility instead of new
symbols), `assets/commerce-utils.js` (+`renderPriceHtml`, shared by
variant-picker.js, sticky-add-to-cart.js, and recently-viewed.js so the
sale/regular price markup shape lives in exactly one place), `assets/theme.js`
(+9 dynamic import gates), `assets/theme.css` (+~1000 lines: sections 40–49),
`config/settings_schema.json` (+"Product page" settings group — gallery
ratio/thumbnail position, dynamic checkout/shipping note/trust badges/
accordion toggle, recommendations/recently-viewed visibility),
`config/settings_data.json`, `locales/en.default.json` (+~40 strings).

**Architectural decisions**
- **Gallery is one DOM, two layouts, zero JS branching on viewport** — same
  trick as Milestone 6's filter sidebar/drawer split: desktop CSS stacks
  every media item in a vertical scroll column with a thumbnail rail; mobile
  CSS switches the identical markup to a horizontal scroll-snap carousel with
  dots. Swipe/scroll is native browser behavior throughout (same philosophy
  as `product-slider.js`) — JS only handles scrollspy, thumb-click-to-scroll,
  arrow keys, and the zoom handoff.
- **Lightbox is its own component, not `<theme-drawer>` with different CSS.**
  A drawer slides in from a screen edge over a scrim; the lightbox centers
  and fades/scales over the full viewport and owns zoom-stage state a drawer
  has no concept of. It still depends on the same `createFocusTrap`/
  `lockScroll`/`unlockScroll` primitives from `motion.js` every other overlay
  uses, so focus containment and scroll-locking behave identically everywhere
  — only the presentation and the zoom logic are unique to it.
- **Variant data ships once, server-rendered, as JSON — not re-derived in
  JS.** `variant-picker.liquid` embeds every variant's id/price/compare-at/
  sku/inventory/media/options plus the handful of translated strings the live
  updates need. `variant-picker.js` reads that JSON and rebuilds the price/
  inventory markup client-side (via the shared `renderPriceHtml` helper) —
  one source of truth for "what does this variant cost / how many are left,"
  not a parallel client-side reimplementation of pricing or stock logic.
- **ATC is a click listener on the button, never a form `submit` listener.**
  Shopify's `payment_button` filter injects its own express-checkout buttons
  into the same `<form>`, and those must submit it for real to reach
  checkout. Intercepting the form's `submit` event would risk swallowing
  those; only ever intercepting the one primary ATC button's click leaves
  them untouched.
- **Cart drawer is explicitly out of scope this milestone**, so "cart drawer
  slides open" (spec §7 ATC feedback) isn't wired — ATC dispatches the same
  `cart:updated` event the header's cart count has listened for since
  Milestone 3, and stops at the button's own "Added ✓" feedback. Whichever
  milestone builds the drawer only needs one more `cart:updated` listener;
  nothing here changes.
- **"Notify me" instead of a dead "Sold out" button.** Spec §7: an
  unavailable variant combination stays a real, enabled, clickable control —
  never `disabled`, only `aria-disabled` + a relabeled CTA. "Sold out" as
  fixed text lives on the separate `product-labels` badge; the ATC button's
  own label always reflects the *currently selected* variant's availability.
- **Recently viewed stores a display snapshot, not just an id.** Unlike
  wishlist/compare (which only ever re-render products already present on the
  current page), recently viewed has to show products from pages the visitor
  already left — there's no Liquid object for those on this page load.
  Rather than an extra `/products/{handle}.js` fetch per stored item on every
  PDP visit, a small snapshot (title/url/image/price) is written to
  localStorage at view time and rendered straight from that — zero added
  requests, at the cost of a stale price/title if a merchant edits either
  later. A reasonable trade for a below-the-fold, non-transactional module.
- **Recommendations fetch async via Shopify's own
  `routes.product_recommendations_url`**, requesting a small dedicated
  `related-products.liquid` section rather than re-rendering the (now much
  heavier) `main-product` section itself for a recommendations request — same
  fetch-and-extract pattern as `predictive-search.js`/`collection-filters.js`,
  applied to Shopify's native recommendation engine instead of a custom one.
  Never blocks the PDP's own first paint.
- **Size guide is a `<details>` disclosure, not a new modal component.**
  Scope call: a full measurement-table modal (unit toggle, diagram) wasn't in
  this milestone's explicit checklist, and a disclosure reuses the exact same
  native-first pattern `accordion-item.liquid` already established, rather
  than introducing a second overlay system alongside the lightbox for one
  optional, metafield-gated feature.
- **Reviews are a bare `@app` block slot**, per instruction — no Judge.me/
  Loox/Yotpo integration. The section reserves a labeled, anchor-linked
  position (the buy box's rating line already links to `#Reviews-{{
  section.id }}`) and renders whatever app blocks a merchant drops in via
  `{% render block %}`; the theme has zero opinion on which app.

**Bug fixes (caught before shipping)**
`{% liquid %}...{% endliquid %}` isn't valid syntax (`liquid` is not a paired
block tag) — a leftover `{% endliquid %}` in `buy-box.liquid` broke the whole
file; removed. A hyphenated key (`data-product-form: true`) inside the
`{% form %}` tag's parameter list is invalid Liquid — switched to `class:`
and updated the JS selector to match. `<details>` (the size-guide disclosure)
is not valid content inside `<legend>` per the HTML content model — a first
draft nested it there; restructured as `<legend>` and `<details>` as
siblings inside the `<fieldset>`, repositioned via CSS instead of markup
nesting. `variant-picker.js` originally never wrote the live-selected variant
id back into the form's hidden `id` input, so a switched variant would still
add the *original* variant to cart; fixed as part of the same update that
rewrites price/inventory/SKU. The sort-select rebinding gap found in the
collection-filters follow-up (below) surfaced the same class of bug here
early: `<product-recommendations>` had no explicit CSS `display`, so as an
unknown custom element it would default to `display: inline` around its own
grid content — given an explicit `display: block`, matching every other
custom element's own convention. "Complete the look" and its outer section
wrapper checked bundle size independently (`> 0` in one place, an internal
`| where: 'available'` re-filter in the other) — a bundle of all-sold-out
picks would render a visible, empty, card-tinted section; both gates now
filter for availability and require at least 2 items (spec: "2–3 items")
before rendering anything.

**Known follow-ups for Milestone 8**
The AJAX add-to-cart path (and the express checkout buttons alongside it)
hasn't been checked against a live store with real payment methods enabled —
`payment_button`'s output depends entirely on the merchant's Settings →
Payments configuration, untestable from a static QA preview. 3D model
(`model_viewer_tag`) and external video rendering are implemented per
Shopify's documented filters but unverified against real model/video media,
since none exists in the QA preview's product set. Recently viewed's
snapshot-at-view-time approach means a merchant price change won't reflect
in an already-stored snapshot until the visitor revisits that product page —
acceptable for now, worth a TTL or revalidation pass if it becomes a support
question. Cart drawer (explicitly out of scope here) is the natural
Milestone 8: `cart:updated` is already dispatched everywhere it needs to be
listened for.

---

## Milestone 6 — Collection Experience

**New components**
Collection banner (compact image+scrim or minimal text-only, breadcrumb,
description), collection toolbar (filter toggle with active-count chip,
result count, 2/3/4 grid switcher, sort), filters built entirely on Shopify
Search & Discovery (`collection.filters` — availability/vendor/type/price/
color/size/material/tags all come from the same generic renderer, no custom
filter engine), active-filter chips + clear all, product grid with optional
editorial break tiles every 8 products, pagination (rebuilt — load-more or
numbered, over the same `paginate` object), premium empty state (two
messages: truly-empty collection vs. zero filter matches). Quick add/quick
view are connected via the existing product-card, not reimplemented.

**Files created**
`sections/main-collection-banner.liquid`; `snippets/breadcrumb.liquid`,
`collection-toolbar.liquid`, `collection-filters.liquid`,
`collection-filter-value.liquid`, `active-filters.liquid`,
`collection-empty-state.liquid`; `assets/collection-filters.js`,
`collection-grid.js`.

**Files modified**
`sections/main-collection-product-grid.liquid` (full rebuild),
`snippets/pagination.liquid` (full rebuild — now also handles "load more"),
`snippets/checkbox.liquid` (+`id` optional, +`extra_class` param — see
decisions), `snippets/icon-sprite.liquid` (+sliders-horizontal, +grid-2x2,
+grid-3x3, +layout-grid, +x), `templates/collection.json`, `assets/theme.css`
(+~700 lines: sections 33–39), `assets/theme.js`, `locales/en.default.json`.

**Architectural decisions**
- **One `#FacetFiltersForm`, not two.** Desktop sidebar and mobile drawer
  can't both exist as separate real forms with the same id — that's invalid
  HTML and breaks `form="..."` lookups. Instead, `<theme-drawer>` (Milestone
  3's generic drawer, unmodified) wraps the one real form; a CSS override
  under `@media (min-width: 990px)` neutralizes every fixed/overlay/transform
  rule for `.collection-filters-panel--sidebar`, turning the exact same node
  into a plain static column. One source of truth, zero duplicate markup.
- **Sidebar applies instantly, drawer applies on submit.** Both read from the
  same form and the same JS class; the only difference is *when* `apply()`
  fires — on every `change` event when acting as a sidebar (desktop, visible,
  low-friction), or only on the "Show N results" submit (drawer — mobile
  always, desktop optionally), so checking several boxes behind a covered
  page doesn't jump content around before a visitor is done choosing.
- **Filtering/sorting/pagination reuse the Section Rendering API fetch
  pattern from predictive-search.js** (Milestone 3) rather than a new AJAX
  approach — same technique, applied to a different section/target, not
  copy-pasted code.
- **No price histogram** — per earlier project guidance, `collection.filters`'
  native price_range type (two number inputs) is used as-is; the filter
  architecture (one generic renderer per filter type) already has a clean
  slot to add a histogram later without restructuring anything.
- **Extended `checkbox.liquid` instead of writing a parallel filter-checkbox
  implementation** — added an optional `extra_class` param (for the
  zero-result "muted" state) and made `id` optional (a label-wrapped input
  doesn't need `for`/`id` to be clickable). Confirmed via Theme Check: this
  snippet's orphan warning cleared once `collection-filter-value.liquid`
  genuinely called it instead of re-implementing the same markup.
- Color/pattern filter swatches reuse the exact `.variant-swatch` CSS from
  the Milestone 4 variant picker (checkbox semantics instead of radio, since
  multiple colors can be filtered at once) — one swatch look everywhere,
  not two.

**Bug fixes (caught before shipping)**
After swapping in fresh filter/sort/pagination results, the pagination and
"load more" click listeners were never re-attached to the new DOM node —
delegated from the old (now-removed) container, they'd have silently stopped
working after the very first AJAX update. Fixed by re-binding after every
swap. A fragile regex was stripping `section_id` from the fallback
navigation URL in the network-failure path — replaced with the same
`URLSearchParams` approach used everywhere else for consistency and
correctness. An `extra_class` value built via a nonsensical `remove`/`prepend`
filter chain (a copy-paste-era mistake caught on self-review before it ever
reached Theme Check) — replaced with a plain `assign`/`if`.

**Known follow-ups for Milestone 7**
The AJAX filter engine hasn't been checked against a real store with Search
& Discovery actually configured — `collection.filters` returns nothing on a
store without filterable metafields/options set up, so the empty-filters
path (no sidebar rendered at all) needs a real check too. Price range's
`{{ filter.param_name }}.gte`/`.lte` field names are a well-documented
Shopify convention but untested against a live price filter. The `.rte`
dead-class issue (flagged since Milestone 2) remains in `main-page.liquid`.

---

## Milestone 5 — Homepage Experience

**New components**
15 homepage sections: Hero (full-bleed/split, image/video, Ken-Burns, 9-cell
text position, video pause control), Featured Collections, Best Sellers
(rebuilt from the old featured-collection scaffold), Image Banner (rebuilt
with parallax + scrim), Product Slider (peek + snap + progress bar),
Testimonials (rotating single-quote or 3-up grid), Video/Brand Story
(click-to-play), Brand Logos, Instagram Feed (placeholder), Newsletter
(native Shopify customer form), plus four not in the PDF's core homepage
flow but requested directly: Image with Text, Collection Grid (incl.
editorial 2×2 layout), Featured Product, FAQ, and Call to Action — all fully
built and available via "Add section," not force-inserted into the default
homepage (see architectural decisions).

**Files created**
`sections/hero.liquid`, `featured-collections.liquid`, `product-slider.liquid`,
`image-with-text.liquid`, `collection-grid.liquid`, `featured-product.liquid`,
`testimonials.liquid`, `video-section.liquid`, `brand-logos.liquid`,
`instagram-feed.liquid`, `newsletter.liquid`, `faq.liquid`,
`call-to-action.liquid`; `snippets/section-heading.liquid`,
`product-form-button.liquid`, `star-rating.liquid`; `assets/hero.js`,
`parallax.js`, `product-slider.js`, `testimonials.js`, `video-section.js`.

**Files modified**
`sections/featured-collection.liquid` (rebuilt as "Best sellers"),
`image-banner.liquid` (rebuilt with parallax/scrim/ghost CTA),
`snippets/product-card.liquid` (quick-add extracted to the new shared
`product-form-button.liquid`; rating now uses `star-rating.liquid`),
`snippets/icon-sprite.liquid` (+pause, +play), `templates/index.json` (full
homepage layout, PDF §6 order), `assets/theme.css` (+~950 lines: sections
21–32), `assets/theme.js` (lazy imports for 5 new modules),
`locales/en.default.json`.

**Architectural decisions**
- Split the PDF's §6 homepage list from this milestone's broader ask: the
  10 sections the PDF actually specifies for the homepage flow are what
  `templates/index.json` ships by default, in that exact order. The 5
  additional section types you asked for (image-with-text, collection-grid,
  featured-product, FAQ, call-to-action) aren't in the PDF's specific
  homepage arrangement, so they're fully built and selectable via "Add
  section" rather than force-inserted — that keeps the default homepage an
  exact match to the design doc while still delivering everything asked for.
- Extracted product-card's quick-add/sold-out/choose-options branch into
  `snippets/product-form-button.liquid` before featured-product needed the
  identical logic — avoids a second copy of that three-way branch.
- "Card-tint" section alternation (spec §6) is a dedicated `section_background`
  select per section, not a reuse of the 5-scheme system — schemes carry a
  full text/border/accent relationship change; this alternation is
  specifically "swap the background for the card tint, nothing else,"
  which the scheme system doesn't map onto precisely.
- Homepage's 128px section rhythm (vs. the shared `.section` class's 96px)
  is a `.section--rhythm` modifier applied only to the sections built this
  milestone, not a change to the shared base class other (out-of-scope)
  templates also use.
- Newsletter submits as a real, non-AJAX POST through Shopify's native
  `customer` form (`contact[tags]=newsletter`) rather than the spec's
  same-page "300ms crossfade" swap — an optimistic client-side success
  state would risk telling a visitor they're subscribed before the server
  actually confirms it. Correctness over the animation nuance.
- Video/brand-story section deliberately doesn't autoplay/loop like the
  hero — it's real content a visitor chooses to watch, not ambient motion,
  so it's click-to-play with visible controls and `preload="none"`.
- `image-with-text`'s "alternating direction on repeat" uses `section.index`
  parity so each additional instance a merchant adds auto-mirrors the last,
  with a manual left/right override for when a merchant wants to break it.

**Bug fixes (caught before shipping)**
An invalid Liquid filter chain in the star-rating loop
(`class: i <= rating | class: 'icon--filled'` — not real syntax) caught
before it ever reached Theme Check, fixed by extracting the whole loop into
`snippets/star-rating.liquid` with a plain if/else. A CSS cascade bug where
`.section--rhythm`'s `padding-block` shorthand (declared late in the file)
would have silently overridden `.section--before-footer`'s `padding-bottom`
(Milestone 1, declared earlier) at equal specificity — both resolve to the
same physical property, so declaration order decided the winner rather than
intent. Fixed with an explicit `.section--rhythm.section--before-footer`
compound rule that wins regardless of order. A `data-parallax="{{ enable_parallax }}"`
attribute that would have matched the CSS/JS selector even when set to
"false" (attribute-presence selectors don't check the value) — fixed to
only render the attribute at all when parallax is actually enabled.

**Known follow-ups for Milestone 6**
Product-slider's `.product-slider__item` flex-basis math (`calc((100% - 60px)
/ 4 - 15px + 15%)`) approximates spec's "4-up with ~15% next-card peek" but
wasn't checked against the real geometry in a browser — worth confirming.
Instagram feed and brand logos remain placeholders with no live API/app
integration, as scoped. The `.rte` dead-class issue flagged in Milestones 2–4
is still unaddressed (main-page/main-collection-product-grid/main-product).

---

## Milestone 4 — Commerce Components & Product Building Blocks

**New components**
Product card (primary/secondary hover-crossfade or zoom, responsive images,
sold-out/sale/low-stock states, labels, rating placeholder, wishlist/compare
hooks, quick view hook, quick add — the last two real and working, not just
scaffolding), collection card (standard + overlay modes), variant picker
(pills/swatches/dropdown auto-selected per option, sold-out-but-clickable
values, full native keyboard support), product labels (sale/new/sold-out/
preorder/low-stock/custom-metafield, priority-ordered), inventory indicator
(in-stock/low-stock/out-of-stock/backorder, text or bar style), shared
commerce utilities (`formatMoney`, `findMatchingVariant` — explicit forward
architecture for the product-page milestone's live variant switching).

**Files created**
`snippets/collection-card.liquid`, `snippets/variant-picker.liquid`,
`snippets/product-labels.liquid`, `snippets/inventory-indicator.liquid`,
`assets/commerce-utils.js`, `assets/product-list-toggle.js`,
`assets/wishlist.js`, `assets/compare.js`, `assets/quick-add.js`,
`assets/quick-view.js`.

**Files modified**
`snippets/product-card.liquid` (full rebuild), `snippets/responsive-image.liquid`
(+`wrap: false` bare-image mode, +focal point support), `snippets/icon-sprite.liquid`
(+eye, +star), `config/settings_schema.json` + `settings_data.json` (+Product
cards group: image ratio, secondary-image/hover-effect toggle, vendor/rating
visibility, quick-add toggle, badge position, "new" badge duration, low-stock
threshold), `layout/theme.liquid` (+`moneyFormat` in the settings bootstrap),
`assets/theme.js` (lazy imports for the 4 new optional modules), `assets/theme.css`
(+~650 lines: product card, collection card, variant picker, inventory
indicator), `locales/en.default.json` (~20 new strings).

**Architectural decisions**
- Quick Add really adds to cart via Shopify's native `/cart/add.js` +
  `/cart.js` AJAX endpoints — those are platform features available on every
  store regardless of theme, so this didn't need to wait for a cart *drawer*
  UI to be genuinely functional. It dispatches the same `cart:updated` event
  `assets/header.js` has listened for since Milestone 3, so the header count
  updates for real with zero changes on that side. What it deliberately
  doesn't do: open a cart panel afterward (none exists yet) or handle multi-
  variant selection (renders a "Choose options" link to the PDP instead).
- Wishlist/compare are genuinely working toggles today (add/remove a product
  id from a storage-adapter-backed list, live count in the header), just
  with no listing *page* yet — `assets/product-list-toggle.js` is one shared
  implementation both call rather than two near-identical files.
- Variant picker renders real native `<input type="radio">` groups (visually
  styled as pills/swatches) instead of custom ARIA widgets, so keyboard
  arrow-key navigation within an option group is free from the browser —
  same "native control + styled sibling" pattern as checkbox-field/switch-field
  from Milestone 2. Unavailable values stay enabled radios (never `disabled`)
  since spec requires them to stay clickable for a future "notify me" flow.
- Mega menu vs. dropdown split, variant switching JS, and the quick-view
  modal are all explicitly deferred — this milestone builds the markup
  contracts (data attributes, event names) those future milestones read,
  not the features themselves, per the stated scope.
- New global "Product cards" settings group was added deliberately — product-
  card is a snippet with no schema of its own, called from many different
  sections, so any setting controlling it has to live somewhere global;
  putting it in settings_schema.json (rather than duplicating an "image
  ratio" setting into every section that will eventually call it) is the
  option that doesn't duplicate. Collection-card's `mode`, by contrast, is a
  render parameter, not a global setting — its presentation is expected to
  vary per calling section rather than stay identical everywhere.
- Skipped duplicate card radius/shadow settings — product cards already
  inherit `--radius-card` from Milestone 1's Corners group; adding a second,
  card-specific radius control would just be two settings fighting over the
  same visual property.

**Bug fixes (caught before shipping)**
A `{%- comment -%}...{%- endcomment -%}` nested inside a `{% liquid %}` block
in `product-card.liquid` — the `liquid` tag has its own line-based syntax
that doesn't accept `{% %}`-delimited tags inside it; fixed by switching to
its `#`-prefixed line-comment syntax. Two genuinely ambiguous filter chains
in `product-labels.liquid` — `'text' | t: percent: x, tone: 'sale'` inside a
`render` tag's argument list parses `tone` as a second argument to `t`, not
to `render` (found via a real "unused variable" Theme Check warning, not a
guess) — fixed by precomputing the translated string into its own variable
first, same fix pattern as Milestone 3's `header.liquid` labels.

**Known follow-ups for Milestone 5**
`collection-card`, `variant-picker`, and `inventory-indicator` have no
consumer yet (expected — collection/product page layouts are out of scope
this milestone) so they're unverified in real page context, only in the
static QA preview. Rating display only ever appears if a reviews app has
already written to the `reviews.rating` / `reviews.rating_count` metafields
— untested against a real app's actual field shape since none is installed.

---

## Milestone 3 — Global Header & Navigation System

**New components**
Announcement bar (rotating messages, dismissible, countdown architecture
stubbed for later), generic `<theme-drawer>` base (scrim, focus trap, scroll
lock, Escape) reused by both mobile nav and search, desktop navigation (mega
menu + standard dropdown, hover-intent + full keyboard support), mobile nav
drawer (nested panel-push navigation with a history stack), predictive search
(debounced/abortable, Section-Rendering-API-backed, recent searches), full
header (sticky modes, subtle shrink, hide/reveal on scroll, transparent-on-
home crossfade, configurable logo position/height/spacing), header actions
(search/account/cart real; wishlist/compare wired as extensible hooks with no
functionality yet, per scope).

**Files created**
`assets/drawer.js`, `assets/header.js`, `assets/mobile-nav.js`,
`assets/mega-menu.js`, `assets/predictive-search.js`,
`assets/announcement-bar.js`, `sections/announcement-bar.liquid`,
`sections/predictive-search.liquid`, `snippets/header-action.liquid`,
`snippets/header-nav.liquid`, `snippets/header-mega-menu.liquid`,
`snippets/header-dropdown.liquid`, `snippets/mobile-nav.liquid`,
`snippets/search-drawer.liquid`, `CHANGELOG.md`.

**Files modified**
`sections/header.liquid` (full rebuild), `sections/header-group.json` (+
announcement-bar), `snippets/icon-sprite.liquid` (+6 icons: search, user,
shopping-bag, heart, git-compare, menu), `assets/motion.js` (+lockScroll/
unlockScroll), `assets/theme.css` (+~700 lines: announcement bar, drawers,
header, desktop nav, mobile nav, search drawer), `assets/theme.js` (eager
imports for the always-present header/drawer/search modules), `locales/
en.default.json` (header/nav/search strings).

**Architectural decisions**
- `<theme-drawer>` is a shared base class; `<mobile-nav-drawer>` *extends* it
  (real JS inheritance) rather than reimplementing open/close/focus-trap/
  scroll-lock — and the same base will carry the cart drawer in a later
  milestone.
- Mega menu vs. standard dropdown is chosen per-item by actual depth (mega
  menu only for items with grandchildren, and only when enabled) rather than
  a per-item setting, since Shopify's navigation editor has no field to
  attach that choice to a specific menu item.
- Mega menu promo images are matched to a menu item by exact title string
  (a `mega_menu_promo` block setting), the least-fragile option available
  without building a custom metaobject system — documented as a real
  constraint, not hidden.
- Predictive search renders through a section fetched via the Section
  Rendering API rather than the raw predictive-search JSON endpoint, so
  results reuse the theme's own price/image/icon snippets instead of
  reimplementing money/currency formatting in JS.
- Transparent header borrows Scheme 2's (dark) token set for text/icon
  contrast against arbitrary hero photography, rather than hardcoding a fixed
  "ivory" color — keeps it inside the token system instead of bypassing it.
- Wishlist/compare header actions read live counts from the same storage
  adapter a future milestone will write to, and the cart count listens for a
  `cart:updated` event nothing dispatches yet — both are real, working hooks
  today; the future milestones only need to write the storage key / dispatch
  the event, no header changes required then.
- No new global theme settings — every new setting (logo width/position,
  sticky mode, transparent toggle, mega menu enable, etc.) lives in
  `sections/header.liquid`'s own schema, which is where Shopify convention
  puts header-specific configuration.

**Bug fixes (caught before shipping)**
A `sizes` attribute built by chaining `| append` then `| times: 0.7` on the
result (multiplying a string, not a number) — reordered into a precomputed
numeric variable first. A mobile-menu-toggle button using `.hide-tablet-down`
(hides ≤989px — backwards; the hamburger needs to show there and hide on
desktop) — replaced with a dedicated `@media (min-width: 990px)` rule instead
of a mismatched utility class. A drawer close-state CSS specificity trap
where `[side='left'] .drawer__panel` would have outranked `.is-open
.drawer__panel` for left-side drawers — resolved by funneling both through a
single `--drawer-offset` custom property so there's only one property to
win the cascade on, not a `transform` specificity fight.

**Known Theme Check false positives (investigated, not real bugs)**
`| t` filter chains inside a `{% render %}` tag's keyword arguments appear to
confuse Theme Check's static snippet-reference and unused-variable analysis
(flagged `header-action.liquid` as orphaned and a conditionally-reassigned
variable as unused, despite both being genuinely used) — confirmed by
precomputing the translated labels into plain variables first, which cleared
both warnings and reads more cleanly anyway.

## Milestone 2 — Core Design System & UI Primitives

**New components**
Typography system (headings, body, kicker/caption, prose rich-text incl. lists/
blockquote/code), button system (primary/secondary/outline/ghost/text/icon,
with loading and disabled states), form controls (text/textarea/select field,
checkbox, radio, switch, quantity input, validation states), badge, price,
base card, loading skeleton, divider, tooltip, accordion (native `<details>`
+ animated enhancement), tabs (ARIA APG pattern + sliding underline), inline
SVG icon sprite (plus, minus, chevron-down, check, circle-alert).

**Files created**
`snippets/icon-sprite.liquid`, `snippets/icon.liquid`, `snippets/badge.liquid`,
`snippets/card.liquid`, `snippets/skeleton.liquid`, `snippets/divider.liquid`,
`snippets/responsive-image.liquid`, `snippets/field.liquid`,
`snippets/checkbox.liquid`, `snippets/switch.liquid`,
`snippets/quantity-input.liquid`, `snippets/accordion-item.liquid`,
`snippets/tooltip.liquid`, `assets/quantity-input.js`, `assets/accordion.js`,
`assets/tabs.js`, `assets/tooltip.js`.

**Files modified**
`snippets/price.liquid` (rebuilt on tokens, tabular-nums, sale/compare-at),
`assets/theme.css` (+typography/buttons/forms/core components/utilities),
`assets/theme.js` (conditional lazy `import()` per custom element),
`config/settings_schema.json` + `settings_data.json` (+Buttons group —
`button_shadow`), `layout/theme.liquid` (icon sprite render, uppercase/shadow
html classes), `locales/en.default.json` (quantity + price strings).

**Architectural decisions**
- Native HTML controls (`<details>`, real checkbox/radio inputs) enhanced by
  JS rather than custom ARIA widgets, wherever a native equivalent existed —
  less code, fewer accessibility edge cases.
- Tooltip: started on the native Popover API, reversed course after
  recognizing popover content renders in the top layer detached from its
  trigger's containing block, breaking simple anchored positioning. Shipped
  on plain `position: relative`/`absolute` with a CSS `:hover`/`:focus-within`
  baseline (JS only adds touch-tap and Escape).
- Disabled buttons support both native `disabled` and `aria-disabled="true"`,
  since spec requires disabled controls to stay in the tab order (native
  `disabled` removes them entirely).
- Skipped a global `button_hover_effect` setting — cleanly controlling
  different hover mechanics across 5 button variants with one toggle wasn't
  worth the complexity yet; shipped only the unambiguous `button_shadow`.
- Conditional dynamic `import()` per custom element in `theme.js`, so a page
  with no accordion never fetches `accordion.js`.

**Known follow-ups carried forward**
`sections/main-page.liquid`, `main-collection-product-grid.liquid`, and
`main-product.liquid` still reference the pre-Milestone-1 `.rte` class, which
no longer exists (superseded by `.prose`). Out of scope until those sections
are rebuilt.

---

## Milestone 1 — Foundations

**New components**
Design token layer (color, type, spacing, radius, shadow, motion, z-index),
5-scheme color system (`color_scheme_group`) with a unified
`[data-color-mode]` mechanism for light/dark/system/user-toggle resolution,
self-hosted variable-font typography (Marcellus + Instrument Sans, latin +
latin-ext, `font-display: swap`), global CSS reset/base/utilities, storage
adapter abstraction (swappable localStorage-backed interface for future
wishlist/compare/recently-viewed), shared motion controller (scroll-reveal
IntersectionObserver, focus-trap utility).

**Files created**
`snippets/theme-fonts.liquid`, `snippets/theme-tokens.liquid`,
`snippets/theme-color-scheme-vars.liquid`, `assets/theme-storage.js`,
`assets/motion.js`, plus 4 self-hosted `.woff2` font files.

**Files modified**
`config/settings_schema.json` + `settings_data.json` (full rebuild — Colors,
Typography, Layout, Corners, Animations, Advanced), `assets/theme.css`
(reset/base/utilities/a11y/performance foundation), `assets/theme.js`
(entry point, `window.Atelier` namespace), `layout/theme.liquid` (full head
rewire, inline FOUC-free dark-mode script, skip link, aria-live announcer).

**Architectural decisions**
- Used Shopify's native `color_scheme_group` (5 schemes) as the single
  mechanism for *both* per-section color painting and site-wide dark/light
  mode — scheme-1 is the light default, scheme-2 is dark; the dark-mode
  toggle just swaps which scheme id is active at `:root` via one
  `[data-color-mode]` attribute, rather than running two parallel systems.
- Rejected a per-scheme `shadow` color setting after realizing dynamic
  per-scheme shadow tinting via `color-mix()` has no safe fallback path for
  unsupported browsers (custom properties can't do the progressive-
  enhancement re-declaration trick regular properties can) — shadows stay
  fixed, spec-normative rgba tokens instead.
- Range settings use whole-number units (percent, hundredths-of-an-em as
  integers) throughout, because Shopify's `range` setting requires a step
  divisible by 0.1 — discovered via Theme Check, not assumed upfront.

**Bug fixes (caught before shipping, via Theme Check / self-review)**
Font asset paths moved from a nested `assets/fonts/` folder to flat
`assets/` (Shopify's asset pipeline doesn't support subdirectories); replaced
hand-written `<link rel="preload">` with Shopify's `preload_tag` filter;
removed an inert `img { loading: lazy; }` CSS rule (`loading` is an HTML
attribute, not a CSS property); fixed two required-but-empty `theme_info`
fields (`theme_documentation_url`, `theme_support_email`) that failed schema
validation.
