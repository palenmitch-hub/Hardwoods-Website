# Tasks: Woodworking Shop Website

**Input**: Design documents from `specs/001-woodworking-shop-website/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

```text
├── index.html           # Landing page
├── catalog.html         # Product catalog + custom board form
├── gallery.html         # Project photo gallery
├── events.html          # Events calendar + list
├── css/
│   └── styles.css       # Single shared stylesheet
├── js/
│   └── main.js          # Shared JS (cart, nav, calendar, forms)
└── images/
    ├── hero/
    ├── products/
    ├── gallery/
    └── icons/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project directory structure and placeholder assets

- [X] T001 Create directory structure: `css/`, `js/`, `images/hero/`, `images/products/`, `images/gallery/`, `images/icons/`
- [X] T002 [P] Create placeholder product images (400×300 colored blocks) in `images/products/` — one per sample product (minimum 2 per cutting board category + 1 per chair type = 12 files)
- [X] T003 [P] Create placeholder hero image (1200×600) in `images/hero/hero-bg.webp`
- [X] T004 [P] Create placeholder gallery images (600×400, 6 files) in `images/gallery/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared stylesheet, JavaScript module, header/nav, footer, and cart infrastructure used by ALL pages

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create `css/styles.css` with CSS reset, `:root` custom properties (all design tokens from contracts: colors, typography, spacing, layout, transitions), base typography rules (`font-family`, `font-size`, fluid `clamp()` values), and global box-sizing
- [X] T006 Add responsive layout utilities to `css/styles.css`: `.container` (max-width + auto margin), `.sr-only` (screen reader only), `.btn` base styles, `.btn--accent` and `.btn--primary` variants with hover/focus states, grid utilities
- [X] T007 Add site header styles to `css/styles.css`: `.site-header` layout (sticky, dark background), logo/brand text, nav link styles, cart icon + badge, mobile hamburger toggle styles using checkbox hack (`.nav-toggle:checked ~ .nav-links`), responsive breakpoint at 768px
- [X] T008 Add site footer styles to `css/styles.css`: `.site-footer` layout (dark background, light text), `.footer__content` two-column layout (brand + contact), `.footer__copyright` bottom bar, responsive stacking on mobile
- [X] T009 Add product card styles to `css/styles.css`: `.product-card` layout (image + info), `.product-card__image` with aspect-ratio container and `object-fit: cover`, `.product-card__name`, `.product-card__description`, `.product-card__price` (accent color, bold), `.product-card__actions` (qty input + button inline), responsive card grid using `auto-fill, minmax(280px, 1fr)`
- [X] T010 Add cart slide-out panel styles to `css/styles.css`: `.cart-panel` (fixed position, right side, full height, off-screen by default), `.cart-panel--open` (slide in), overlay backdrop, cart item list layout, "Request Quote" button, close button, responsive width (full on mobile, 400px on desktop)
- [X] T011 Create `js/main.js` with cart module: `getCart()`, `addToCart(id, name, price, qty)`, `removeFromCart(id)`, `updateQty(id, qty)`, `getCartCount()`, `clearCart()` — all reading/writing `localStorage` key `mitchs-cart` as JSON array per data-model.md
- [X] T012 Add cart UI functions to `js/main.js`: `updateCartBadge()` (reads count, updates `#cart-count` text, shows/hides badge), `renderCartPanel()` (reads cart, builds item list HTML with remove buttons, shows total, shows "Request Quote" button or empty-cart message), `openCartPanel()` / `closeCartPanel()` (toggles `.cart-panel--open` class + `aria-hidden`, adds overlay click-to-close)
- [X] T013 Add mobile nav enhancement to `js/main.js`: On DOMContentLoaded, find `.nav-toggle` checkbox and `.nav-links`, toggle `aria-expanded` on label when checkbox changes, add smooth height animation, add focus trap when menu is open (Tab cycles through nav links only), close menu on Escape key
- [X] T014 Add "Add to Cart" event delegation to `js/main.js`: On DOMContentLoaded, attach click listener on `document` for `.product-card__add` buttons — read `data-product-id`, `data-product-name`, `data-product-price` from closest `.product-card`, read quantity from sibling `.product-card__qty` input, call `addToCart()`, call `updateCartBadge()`, show brief toast/feedback "Added to cart"
- [X] T015 Add `submitQuoteRequest()` to `js/main.js`: Read cart via `getCart()`, format as "2x Product Name ($XX.XX)" string, calculate total, POST to Formspree endpoint via `fetch()` with `cart_items`, `cart_total`, `_subject` fields per contracts, show inline confirmation on success, show error message on failure, call `clearCart()` and `updateCartBadge()` on success
- [X] T016 Add page initialization to `js/main.js`: On DOMContentLoaded, call `updateCartBadge()`, attach cart icon click → `openCartPanel()`, attach cart panel close button → `closeCartPanel()`, attach "Request Quote" button → `submitQuoteRequest()`

**Checkpoint**: Foundation ready — shared styles, JS cart, nav, and page shell are functional. User story implementation can begin.

---

## Phase 3: User Story 1 — Browse and Shop Cutting Boards (Priority: P1) 🎯 MVP

**Goal**: Customers can browse cutting boards in 4 categories and add them to cart

**Independent Test**: Open `catalog.html`, see 4 cutting board categories each with product cards showing photo/name/description/price, set quantity, click "Add to Cart", see cart icon update, open slide-out panel and see items listed

### Implementation for User Story 1

- [X] T017 [US1] Create `catalog.html` with full page shell per contracts (DOCTYPE, head with meta/fonts/CSS, header with nav + cart icon, main, footer, cart panel aside, script tag) — leave `<main>` content area with a Cutting Boards `<section>` containing `<h1>` "Product Catalog" and `<h2>` "Cutting Boards"
- [X] T018 [US1] Add Basic Boards category to `catalog.html`: `<section>` with `<h3>` "Basic Boards", 2 sample `<article class="product-card">` elements per product card contract — each with `data-product-id` (e.g., `cb-basic-001`), `data-product-name`, `data-product-price`, placeholder `<img>`, name `<h3>`, description `<p>`, price `<span>`, quantity `<input>`, "Add to Cart" `<button>`
- [X] T019 [P] [US1] Add Pattern Boards category to `catalog.html`: `<section>` with `<h3>` "Pattern Boards", 2 sample product cards following same contract (IDs: `cb-pattern-001`, `cb-pattern-002`)
- [X] T020 [P] [US1] Add Intricate Boards category to `catalog.html`: `<section>` with `<h3>` "Intricate Boards", 2 sample product cards (IDs: `cb-intricate-001`, `cb-intricate-002`)
- [X] T021 [P] [US1] Add Custom Boards category to `catalog.html`: `<section>` with `<h3>` "Custom Boards", 2 sample product cards (IDs: `cb-custom-001`, `cb-custom-002`)

**Checkpoint**: Cutting board catalog is fully browsable with 8 sample boards across 4 categories, cart add/view works end-to-end.

---

## Phase 4: User Story 2 — Browse and Shop Adirondack Chairs (Priority: P1)

**Goal**: Customers can browse Adirondack chairs in 4 types and add them to cart

**Independent Test**: Scroll to Adirondack Chairs section on `catalog.html`, see 4 chair types each with product cards, add chair to cart, verify it appears in slide-out panel alongside any cutting boards

### Implementation for User Story 2

- [X] T022 [US2] Add Adirondack Chairs section to `catalog.html`: `<h2>` "Adirondack Chairs" section after cutting boards, with `<h3>` "Low Rider" subsection and 1 sample product card (ID: `chair-lowrider-001`) per product card contract
- [X] T023 [P] [US2] Add Mid Stationary chairs subsection to `catalog.html`: `<h3>` "Mid Stationary", 1 sample product card (ID: `chair-mid-stationary-001`)
- [X] T024 [P] [US2] Add High Top chairs subsection to `catalog.html`: `<h3>` "High Top", 1 sample product card (ID: `chair-high-top-001`)
- [X] T025 [P] [US2] Add Rocker chairs subsection to `catalog.html`: `<h3>` "Rocker", 1 sample product card (ID: `chair-rocker-001`)

**Checkpoint**: Full product catalog (cutting boards + chairs) is browsable. Cart works across all product types.

---

## Phase 5: User Story 3 — Landing Page First Impression (Priority: P2)

**Goal**: Visitors see a visually striking hero section with tagline and CTA on the homepage

**Independent Test**: Open `index.html`, see full-width hero with background image, bold tagline, CTA button linking to catalog, responsive on mobile/tablet/desktop, navigation works to all pages

### Implementation for User Story 3

- [X] T026 [US3] Create `index.html` with full page shell per contracts, hero `<section class="hero">` containing `<h1>` tagline (e.g., "Handcrafted Hardwood — Built in Woodstock, GA"), `<p>` subtitle, and CTA `<a class="btn btn--accent" href="catalog.html">` "Shop Our Collection"
- [X] T027 [US3] Add hero section styles to `css/styles.css`: `.hero` full-viewport-height section with background image (`images/hero/hero-bg.webp`), dark overlay for text contrast, centered text layout via Flexbox, responsive font sizing, CTA button prominent styling
- [X] T028 [US3] Add homepage content sections below hero in `index.html`: "Featured Products" preview section (3 cards linking to catalog), "About" blurb section with brief shop description, "Visit Us at Events" teaser linking to events page — all using semantic `<section>` elements with proper heading hierarchy (`<h2>`)

**Checkpoint**: Homepage is complete with hero, featured content, and navigation to all other pages.

---

## Phase 6: User Story 4 — Create a Custom Cutting Board Order (Priority: P2)

**Goal**: Customers can select a pattern, choose wood types, enter contact info, and submit a custom board order

**Independent Test**: Scroll to "Create Custom Board" section on `catalog.html`, select a pattern (radio), check 2+ wood types, enter name and email, submit form, see confirmation message

### Implementation for User Story 4

- [X] T029 [US4] Add "Create Your Custom Board" `<section>` to `catalog.html` after product listings: `<h2>`, introductory `<p>`, and `<form action="https://formspree.io/f/{FORMSPREE_CUSTOM_ORDER_ID}" method="POST" class="custom-order-form">` with pattern selection (radio buttons for End Grain, Edge Grain, Herringbone, Chevron, Brick, Butcher Block), wood type checkboxes (Maple, Walnut, Cherry, Padauk, Purple Heart, White Oak), name input (required), email input (required), phone input (optional), hidden `_gotcha` honeypot field, hidden `_subject` field, and submit button "Submit Custom Order"
- [X] T030 [US4] Add custom order form styles to `css/styles.css`: `.custom-order-form` layout, fieldset styling for pattern group and wood group, radio/checkbox custom styling (hide native + styled pseudo-element), input/label spacing, validation error message styling (`.field-error`), confirmation message styling (`.form-success`), responsive form layout (single column mobile, two columns desktop)
- [X] T031 [US4] Add `validateCustomOrderForm()` to `js/main.js`: On form submit, prevent default, check pattern radio selected, check ≥1 wood type checkbox checked, check name and email non-empty + email format valid, show inline `.field-error` messages next to invalid fields, return false if invalid. If valid, allow form submission (or submit via `fetch()` and show `.form-success` confirmation message inline)

**Checkpoint**: Custom board order form is fully functional with validation and Formspree submission.

---

## Phase 7: User Story 5 — View Project Gallery (Priority: P3)

**Goal**: Visitors can browse a photo gallery of completed projects

**Independent Test**: Open `gallery.html`, see responsive grid of project photos with captions, images lazy-load, layout adapts from 1 column (mobile) to 3+ columns (desktop)

### Implementation for User Story 5

- [X] T032 [US5] Create `gallery.html` with full page shell per contracts, `<h1>` "Project Gallery", `<section class="gallery">` containing 6 sample `<figure class="gallery__item">` elements — each with `<img>` (lazy-loaded, placeholder src, descriptive `alt`, `width`/`height`) and optional `<figcaption>`
- [X] T033 [US5] Add gallery styles to `css/styles.css`: `.gallery` CSS Grid with `auto-fill, minmax(280px, 1fr)`, gap spacing, `.gallery__item` with `overflow: hidden` and `border-radius`, `img` with `object-fit: cover` and `width: 100%`, `figcaption` styling, hover effect (subtle scale or shadow), responsive column count (1 col at 320px, 2 at 600px, 3+ at 900px)

**Checkpoint**: Gallery page displays photo grid with responsive layout and lazy loading.

---

## Phase 8: User Story 6 — View Upcoming Events (Priority: P3)

**Goal**: Visitors can see upcoming events in both a calendar view and a list view

**Independent Test**: Open `events.html`, see monthly calendar grid with event dates highlighted, see chronological event list below, navigate months with prev/next buttons, list view works without JavaScript

### Implementation for User Story 6

- [X] T034 [US6] Create `events.html` with full page shell per contracts, `<h1>` "Upcoming Events", a `<section class="events-calendar">` with `<div id="calendar-grid">` container and prev/next month buttons, and a `<section class="events-list">` with `<h2>` "Event List" and a `<ul>` containing 4 sample event `<li class="event-item">` elements — each with `<h3>` event name, `<time datetime="YYYY-MM-DD">` date, and `<span class="event-item__location">` location. Add `<noscript>` message above calendar: "Enable JavaScript to view the calendar. See the event list below."
- [X] T035 [US6] Add `EVENTS` array and `renderCalendar(year, month)` function to `js/main.js`: Define events as JS array matching events.html list data, build 7-column CSS Grid of day cells for the given month, highlight days matching event dates with `.has-event` class and colored dot, show event name on hover/click via tooltip or expandable detail. Add `navigateMonth(direction)` to shift ±1 month and re-render. On DOMContentLoaded (only on events page), render current month's calendar.
- [X] T036 [US6] Add calendar and event list styles to `css/styles.css`: `.events-calendar` section layout, `#calendar-grid` 7-column CSS Grid, day cell styling (padding, border, min-height), `.has-event` dot indicator (colored circle via `::after`), month navigation buttons, `.events-list` section, `.event-item` card layout (name, date, location), responsive calendar (smaller cells on mobile), event list stacking

**Checkpoint**: Events page shows navigable calendar with highlighted event dates and a static event list. Works without JS (list only).

---

## Phase 9: User Story 7 — Shop Owner Manages Product Content (Priority: P2)

**Goal**: The shop owner can easily add/edit/remove products and events by editing HTML directly

**Independent Test**: Copy an existing product card block in `catalog.html`, change the name/price/ID, save, refresh browser — new product appears in the correct category. Remove the block — product disappears.

### Implementation for User Story 7

- [X] T037 [US7] Add HTML comments to `catalog.html` marking where to add/remove products: `<!-- ADD NEW BASIC BOARDS BELOW -->`, `<!-- ADD NEW PATTERN BOARDS BELOW -->`, etc. for each cutting board category and chair type. Include a commented-out template product card block with instructions for copying.
- [X] T038 [US7] Add HTML comments to `events.html` marking where to add/remove events: `<!-- ADD NEW EVENTS BELOW -->` in the list section, and a note to also add the event to the `EVENTS` JS array. Include a commented-out template event block with instructions.
- [X] T039 [US7] Add HTML comments to `gallery.html` marking where to add/remove photos: `<!-- ADD NEW GALLERY PHOTOS BELOW -->` with a commented-out template `<figure>` block and instructions for adding images to `images/gallery/`.

**Checkpoint**: All content-editable sections have clear HTML comments and template blocks. Owner can manage content by editing HTML.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsive refinements, accessibility hardening, performance, and final validation

- [X] T040 [P] Add responsive media queries refinement pass to `css/styles.css`: Verify all components at 320px, 768px, and 1280px breakpoints — fix any overflow, spacing, or readability issues across all pages
- [X] T041 [P] Add accessibility hardening across all HTML files: Verify sequential heading hierarchy (one `<h1>` per page), all `<img>` have descriptive `alt` text (or `alt=""` for decorative), all interactive elements have visible focus indicators (`:focus-visible` outlines in `css/styles.css`), all form inputs have associated `<label>` elements, cart panel has `aria-hidden`/`aria-label`, nav toggle has `aria-expanded`
- [X] T042 [P] Add skip-to-content link to all pages: `<a href="#main-content" class="skip-link">Skip to content</a>` as first element in `<body>`, visually hidden until focused, `<main id="main-content">` as target
- [X] T043 Add quantity input validation enhancement to `js/main.js`: On `input` event for `.product-card__qty` fields, enforce `min="1"`, strip non-numeric characters, prevent 0 or negative values, round to whole number
- [X] T044 Run quickstart.md validation: Open each page in browser, verify all navigation links work, all product cards display correctly, cart add/view/quote flow works, custom order form validates and submits, gallery displays photos, events calendar renders and list displays, footer shows on every page, mobile nav works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (directories + placeholders exist) — BLOCKS all user stories
- **US1 Cutting Boards (Phase 3)**: Depends on Phase 2 — creates `catalog.html` used by US2 and US4
- **US2 Chairs (Phase 4)**: Depends on Phase 3 (T017 creates `catalog.html` that US2 appends to)
- **US3 Landing Page (Phase 5)**: Depends on Phase 2 only — can run in parallel with Phase 3/4
- **US4 Custom Orders (Phase 6)**: Depends on Phase 3 (T017 creates `catalog.html`)
- **US5 Gallery (Phase 7)**: Depends on Phase 2 only — can run in parallel with Phase 3–6
- **US6 Events (Phase 8)**: Depends on Phase 2 only — can run in parallel with Phase 3–7
- **US7 Content Mgmt (Phase 9)**: Depends on Phases 3, 4, 7, 8 (HTML files must exist to add comments)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundational → US1 — no dependency on other stories. Creates `catalog.html`.
- **US2 (P1)**: Foundational → US1 (T017) → US2 — adds chair sections to existing `catalog.html`.
- **US3 (P2)**: Foundational → US3 — fully independent. Creates `index.html`.
- **US4 (P2)**: Foundational → US1 (T017) → US4 — adds custom order form to existing `catalog.html`.
- **US5 (P3)**: Foundational → US5 — fully independent. Creates `gallery.html`.
- **US6 (P3)**: Foundational → US6 — fully independent. Creates `events.html`.
- **US7 (P2)**: All content pages must exist → US7 — adds management comments to existing files.

### Within Each User Story

- Page shell before content sections
- Content sections before interactive enhancements
- CSS styles can be written alongside or after HTML
- JS enhancements after HTML structure exists

### Parallel Opportunities

- Phase 1: T002, T003, T004 can all run in parallel
- Phase 2: T005–T010 (CSS tasks) are independent and can run in parallel; T011–T016 (JS tasks) are sequential
- Phase 3: T019, T020, T021 can run in parallel after T017–T018
- Phase 4: T023, T024, T025 can run in parallel after T022
- Phase 5: Entire phase can run in parallel with Phases 3–4 (different file: `index.html`)
- Phase 7: Entire phase can run in parallel with Phases 3–6 (different file: `gallery.html`)
- Phase 8: Entire phase can run in parallel with Phases 3–7 (different file: `events.html`)
- Phase 10: T040, T041, T042 can run in parallel

---

## Parallel Example: Maximum Parallelism After Phase 2

```text
Phase 2 complete (foundation ready)
        │
        ├── Worker A: Phase 3 (US1 cutting boards → catalog.html)
        │       └── Phase 4 (US2 chairs → catalog.html)
        │               └── Phase 6 (US4 custom form → catalog.html)
        │
        ├── Worker B: Phase 5 (US3 landing page → index.html)
        │
        ├── Worker C: Phase 7 (US5 gallery → gallery.html)
        │
        └── Worker D: Phase 8 (US6 events → events.html)
                │
                └── All converge → Phase 9 (US7 content mgmt) → Phase 10 (Polish)
```

---

## Implementation Strategy

**MVP**: Phase 1 → Phase 2 → Phase 3 (User Story 1 only) = browsable cutting board catalog with working cart. This alone delivers the core value proposition.

**Incremental delivery**:
1. MVP: Cutting board catalog with cart (Phases 1–3)
2. Add chairs to catalog (Phase 4)
3. Landing page (Phase 5) — site now has a proper entry point
4. Custom orders (Phase 6) — revenue differentiator
5. Gallery + Events (Phases 7–8) — trust building + local engagement
6. Content management + Polish (Phases 9–10) — long-term maintainability
