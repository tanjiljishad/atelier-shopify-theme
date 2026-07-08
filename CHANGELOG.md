# Changelog

All notable changes to the Atelier theme are documented here, one entry per
build milestone. Dates reflect when the milestone was completed.

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
