# Atelier — Manual QA Checklist

For testing on a live Shopify development store before launch or Theme
Store submission. Static Theme Check and `node --check` catch syntax and
lint issues; everything below can only be verified by actually clicking
through a populated store.

Set up a development store with: at least 20 products across 3+ collections
(include some sold-out, some with only one variant, some with 4+ options),
a blog with 5+ posts and comments enabled, a customer account with order
history, at least 2 countries/languages published, and both a discount code
and a free-shipping threshold configured.

---

## Homepage

- [ ] Hero renders correctly with image, video, and no-media configurations
- [ ] Every homepage section (featured collection, featured product, image
      banner, image with text, testimonials, brand logos, FAQ, newsletter,
      Instagram feed, call-to-action) renders with real content and with
      Theme Editor defaults
- [ ] Scroll-reveal animations fire once, don't re-trigger on scroll-back
- [ ] Parallax (image banner) only active on desktop, disabled under
      reduced-motion

## Collection

- [ ] Grid renders at 2/3/4 configured columns; grid-switcher persists choice
- [ ] All filter types: checkbox, swatch (color), price range, boolean
- [ ] Sort select re-binds correctly after every filter change (regression
      test for the Milestone 6 sort-rebinding bug)
- [ ] Filter sidebar (desktop) vs. filter drawer (mobile) — same state,
      correct breakpoint switch
- [ ] Empty collection / zero filter results shows the empty state, not a
      blank grid
- [ ] Pagination works forward/back, preserves active filters in the URL
- [ ] Editorial tiles (if configured) don't break grid column math

## Product (PDP)

- [ ] Gallery: desktop stacked vs. mobile carousel, both real media and a
      single-image product
- [ ] Zoom/lightbox opens, closes, keyboard-navigable
- [ ] Video and 3D model blocks play/interact correctly if present
- [ ] Variant picker: swatches and dropdowns both update price, media,
      inventory label, SKU, and the hidden variant-id input (regression test
      for the Milestone 7 stale-variant-id bug)
- [ ] Out-of-stock variant combinations correctly disable rather than hide
- [ ] Add to cart: button morphs to loading → "Added" → cart drawer opens
- [ ] Sticky mobile add-to-cart bar appears after scrolling past the buy box
- [ ] Product accordions (details/shipping/returns/FAQ) open one at a time
      if configured single-open
- [ ] Complete-the-look bundle: checkbox math updates the total live, single
      combined add-to-cart request
- [ ] Native product recommendations render (both `related` and
      `complementary` intent, if configured)
- [ ] Recently viewed populates after visiting 2+ PDPs, excludes the current
      product
- [ ] Trust badges / share button render and share button copies a real URL

## Cart

- [ ] Cart drawer opens from header, from quick-add, from PDP add-to-cart
- [ ] Quantity +/-, direct input, and remove all update the drawer AND the
      header count from a single request
- [ ] Free-shipping progress bar reflects the real cart subtotal and updates
      live
- [ ] Cart page (full page, not drawer) mirrors every drawer capability
- [ ] Cart note and discount code fields submit and reflect in the order
- [ ] Gift wrap line item (if enabled) adds/removes correctly
- [ ] Empty cart shows the empty state with a real "continue shopping" link
- [ ] Removing the last item transitions cleanly to the empty state

## Search

- [ ] Predictive search (header) returns products/collections/pages/articles
      with debounced typing, no request pile-up
- [ ] Full search results page renders mixed result types correctly
- [ ] Zero-result search shows popular-search chips and/or a recommended
      collection fallback
- [ ] Search works with special characters and very short/very long queries

## Blog

- [ ] Blog index: featured article, tag filter (`/tagged/x` URLs), grid,
      pagination
- [ ] Article page: hero image, author/date/reading time, rich content
      (tables, embedded video, images) all render correctly
- [ ] Native comments: submit, moderation-pending state, and posted state
- [ ] Related articles and share button both work

## Customer accounts

- [ ] Register, login, and both error and success states for each
- [ ] Password recovery: request email, reset link, set new password
- [ ] Account activation link (for accounts created by an admin)
- [ ] Account dashboard shows real order history; order detail page shows
      real line items/status/tracking
- [ ] Address book: add, edit, delete, set-default all work; deletion
      confirms before submitting
- [ ] Logout actually clears the session

## Gift card

- [ ] Gift card page renders code, balance, expiry, and QR/print correctly
- [ ] "Copy code" actually copies; print stylesheet produces a usable printout
- [ ] Expired and disabled gift card states both render distinctly

## Password page (store password-protected)

- [ ] Password form accepts the real store password and rejects a wrong one
      with a real error message
- [ ] Dark mode / color mode script still resolves correctly on this layout

## 404

- [ ] 404 page renders with working links back into the store (not dead ends)

## Contact

- [ ] Contact form submits via Shopify's native `contact` form and shows a
      real success state
- [ ] Store info (address/phone/email/hours) and social links match the
      values entered in Theme Settings → Store info & social

## Theme Editor

- [ ] Every section can be added/removed/reordered without an error
- [ ] Footer: all 8 block types (menu, rich text, newsletter, social,
      contact, image, payment icons, custom Liquid) add/remove/reorder
      cleanly and render immediately in the editor preview
- [ ] Every setting described in the README's customization guide actually
      changes something visible when toggled
- [ ] No setting produces a visibly broken layout at its min/max range value

## Localization

- [ ] Country selector (footer) actually changes currency/pricing
- [ ] Language selector (footer) actually changes storefront copy
- [ ] `en.default.json` strings all have real values (no raw translation
      keys leaking into the UI)

## Dark mode

- [ ] All four `color_scheme_mode` settings behave correctly: always light,
      always dark, visitor toggle (persists across reload), follow system
      (matches OS `prefers-color-scheme` and updates live if the OS setting
      changes while the tab is open)
- [ ] Every section/component readable and on-brand in both schemes,
      including the footer's default dark scheme

## Mobile / Tablet / Desktop

- [ ] Full click-through of Homepage → Collection → PDP → Cart → Checkout at
      375px, 768px, and 1440px+ viewport widths
- [ ] Touch targets are comfortably tappable (44×44px minimum) on real mobile
      hardware, not just a resized desktop browser
- [ ] Mobile nav drawer, filter drawer, and cart drawer don't fight each
      other if triggered in sequence

## Checkout flow

- [ ] Cart → checkout handoff carries the correct line items, discounts, and
      gift wrap/note
- [ ] Shop Pay / PayPal express checkout buttons (if enabled) work from the
      buy box without interfering with the regular add-to-cart button click
      handler

## Discounts

- [ ] A cart-level discount code applied in the theme's discount field
      actually reduces the total shown at checkout
- [ ] Automatic discounts reflect correctly in cart subtotal/free-shipping
      progress math

## Shipping

- [ ] Free-shipping threshold in Theme Settings matches a real shipping
      discount/rate configured in Shopify admin — the progress bar should
      hit "unlocked" at the same subtotal checkout actually grants free
      shipping

## Taxes

- [ ] Tax-inclusive vs. tax-exclusive pricing display (per store settings)
      matches what checkout actually charges

## Payments

- [ ] At least one real test transaction through to order confirmation
- [ ] Payment icons shown in cart/footer match the payment methods actually
      enabled on the store

## Accessibility

- [ ] Full keyboard-only pass: tab through header → mega menu → every PDP
      control → cart drawer → checkout link, no keyboard trap anywhere
- [ ] Screen reader pass (VoiceOver and/or NVDA) on: PDP variant switching,
      cart drawer updates, form errors, toast notifications
- [ ] Run axe-core or Lighthouse accessibility audit on Homepage, Collection,
      PDP, Cart, and Search

## Performance

- [ ] Lighthouse/PageSpeed run on Homepage, Collection, and PDP with real
      product images at production sizes
- [ ] Confirm no console errors/warnings on any template
- [ ] Confirm dynamic imports actually stay out of the network tab on pages
      that don't need them (e.g., no `product-gallery.js` fetched on the
      cart page)

## Cross-browser

- [ ] Latest Chrome, Safari, Firefox, Edge on desktop
- [ ] Safari iOS and Chrome Android on real devices (not just emulators) —
      particularly the cart drawer's scroll-lock and the sticky mobile
      add-to-cart bar, both of which are the most likely to behave
      differently on real mobile Safari
