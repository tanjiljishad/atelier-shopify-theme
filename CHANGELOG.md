# Changelog

All notable changes to the Atelier theme are documented here, one entry per
build milestone. Dates reflect when the milestone was completed.

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
