# Research: Woodworking Shop Website

**Feature**: 001-woodworking-shop-website
**Date**: 2026-05-06

## Research Tasks

### 1. Cart State Management with localStorage (Vanilla JS)

**Decision**: Use `localStorage` to persist cart state across pages and sessions.

**Rationale**:
- Cart must persist across 4 separate HTML pages — `sessionStorage` would work within a session but `localStorage` survives browser close, giving returning customers their cart back.
- Cart data is small (product ID, name, price, quantity per item) — well within the 5 MB localStorage limit.
- No security concern since cart contains no sensitive data (just product names + quantities).
- JSON serialization/deserialization is trivial for the cart array structure.

**Implementation pattern**:
- Store cart as JSON array: `[{ id, name, price, qty }, ...]`
- On "Add to Cart": read → find/increment or push → write
- On page load: read → update cart icon badge count
- On slide-out open: read → render cart items list
- On "Request Quote": read → format as form fields → POST to Formspree

**Alternatives considered**:
- `sessionStorage`: Rejected — doesn't persist across sessions; customers may revisit.
- Cookies: Rejected — size-limited, sent with every request, unnecessary overhead.
- IndexedDB: Rejected — overkill for a simple array of 5–30 items.

---

### 2. Form Submission for Custom Orders and Quote Requests

**Decision**: Use Formspree (free tier) for both custom board orders and cart quote requests.

**Rationale**:
- Formspree provides a POST endpoint that forwards form data to the shop owner's email — no backend required.
- Free tier allows 50 submissions/month, sufficient for a small local business.
- Works with standard HTML `<form>` or `fetch()` POST from JavaScript.
- Supports custom redirect (thank-you message) and honeypot spam filtering.
- No account required for the customer; shop owner sets up once.

**Implementation pattern**:
- Custom board form: standard `<form action="https://formspree.io/f/{id}" method="POST">` with hidden fields for pattern/wood selections.
- Quote request: JavaScript `fetch()` POST with cart contents serialized as form fields.
- Both display inline confirmation message on success (no page redirect).
- Honeypot field (`_gotcha`) added for bot prevention.

**Alternatives considered**:
- Netlify Forms: Rejected — ties hosting to Netlify specifically.
- mailto: link: Rejected — inconsistent UX across devices/mail clients; no confirmation.
- Google Forms embed: Rejected — doesn't match site aesthetic; limited customization.

---

### 3. Mobile Navigation Pattern (No JS for Core Access)

**Decision**: CSS-only hamburger menu using `<input type="checkbox">` + `<label>` pattern, enhanced with JS for smooth animation and focus trap.

**Rationale**:
- Constitution mandates navigation MUST be fully functional without JavaScript.
- The checkbox hack uses a hidden `<input type="checkbox">` toggled by a `<label>`, with CSS `:checked` sibling selector to show/hide nav links.
- Keyboard accessible: `<label>` is focusable with `tabindex`, checkbox is natively keyboard-operable.
- JavaScript enhancement adds smooth slide animation, focus trap for accessibility, and `aria-expanded` toggling.

**Implementation pattern**:
- Hidden checkbox + visible label (hamburger icon) in HTML
- CSS: `.nav-toggle:checked ~ .nav-links { display: flex; }`
- JS enhancement: toggle `aria-expanded`, animate height, trap focus within open menu
- Desktop: checkbox and label hidden via media query; nav links always visible

**Alternatives considered**:
- JS-only hamburger: Rejected — violates constitution principle V (progressive enhancement) and II (nav without JS).
- `<details>/<summary>`: Rejected — semantically incorrect for navigation; inconsistent browser styling.
- Always-visible nav (no hamburger): Rejected — too many links for 320px viewport.

---

### 4. Calendar View Implementation (Vanilla JS)

**Decision**: Build a simple month-grid calendar renderer in vanilla JS that highlights event dates.

**Rationale**:
- No library needed for a basic monthly calendar grid.
- Events are hardcoded in HTML as a data structure (JS array or `data-*` attributes).
- The calendar grid is a 7-column CSS Grid (Sun–Sat) with day number cells.
- Event dates are highlighted with a dot/badge; clicking shows event details.
- Progressive enhancement: the list view (HTML-only) works without JS; the calendar view requires JS to render the grid dynamically.

**Implementation pattern**:
- Events defined as a JS array: `[{ name, date, location }, ...]`
- `renderCalendar(year, month)` function builds the grid cells
- Event dates get a CSS class (`.has-event`) with a colored dot
- "Previous/Next" month buttons for navigation
- Fallback: `<noscript>` message directing users to the list view below

**Alternatives considered**:
- Full Calendar library: Rejected — large dependency; constitution forbids unnecessary third-party resources.
- Static HTML table per month: Rejected — can't navigate months; would need 12+ tables.
- List view only: Rejected — spec explicitly requires both calendar and list views (FR-012).

---

### 5. Image Handling for Product Photos and Gallery

**Decision**: Use placeholder images initially with `<img>` tags using `loading="lazy"`, `width`/`height` attributes for layout stability, and `srcset` for responsive sizes.

**Rationale**:
- Constitution requires lazy loading below the fold, responsive images, and WebP/AVIF with fallbacks.
- For initial launch, placeholder images (solid color blocks or generic wood texture) with proper `alt` text.
- `width` and `height` attributes prevent layout shift (CLS = 0).
- `srcset` with 2–3 sizes (400w, 800w, 1200w) covers mobile through desktop.
- Gallery uses CSS Grid with `object-fit: cover` for consistent card sizing.

**Implementation pattern**:
- `<img src="images/products/board-1.webp" alt="Walnut end-grain cutting board" loading="lazy" width="400" height="300" srcset="... 400w, ... 800w">`
- Gallery: CSS Grid with `auto-fill, minmax(280px, 1fr)` for responsive columns
- Product cards: fixed aspect ratio container with `object-fit: cover`
- Owner replaces placeholder files with real photos in `images/` directories

**Alternatives considered**:
- `<picture>` element with format fallbacks: Viable addition for WebP → JPEG fallback. Will use for hero image; simple `<img>` with `.webp` for product cards (modern browsers all support WebP).
- External image hosting (Cloudinary): Rejected — adds external dependency; constitution prefers no unnecessary third-party resources.

---

### 6. Color Palette and Typography Selection

**Decision**: Earth-tone palette with Inter (body) and Playfair Display (headings) from Google Fonts.

**Rationale**:
- Constitution requires earth-tone colors and modern sans-serif body + optional serif/display headings.
- User requested "bold modern feel with clean typography."

**Color palette**:
- `--color-primary`: `#5C4033` (rich walnut brown — primary brand color)
- `--color-primary-dark`: `#3E2A1E` (dark espresso — hover states, header/footer backgrounds)
- `--color-accent`: `#8B6914` (muted gold — CTAs, highlights, price tags)
- `--color-green`: `#4A6741` (forest green — secondary accent, success states)
- `--color-cream`: `#FAF6F0` (warm cream — page background)
- `--color-white`: `#FFFFFF` (card backgrounds)
- `--color-gray-light`: `#E8E2DA` (warm gray — borders, dividers)
- `--color-gray`: `#7A7267` (medium gray — secondary text)
- `--color-text`: `#2C2420` (near-black warm — body text)

**Typography**:
- Body: Inter, system-ui, -apple-system, sans-serif (clean, highly readable)
- Headings: Playfair Display, Georgia, serif (craftsmanship feel, bold weight)
- Font loading: `<link rel="preconnect">` + `font-display: swap` for no FOIT
- Fluid sizing: `clamp(1rem, 2.5vw, 1.125rem)` body, `clamp(1.75rem, 5vw, 3rem)` h1

**Contrast check** (against `--color-cream` `#FAF6F0`):
- `--color-text` `#2C2420`: ratio ≈ 11.2:1 ✅ (exceeds 4.5:1)
- `--color-gray` `#7A7267`: ratio ≈ 4.6:1 ✅ (meets 4.5:1 for normal text)
- `--color-accent` `#8B6914` on white: ratio ≈ 5.1:1 ✅
- White text on `--color-primary-dark` `#3E2A1E`: ratio ≈ 12.8:1 ✅

**Alternatives considered**:
- System fonts only: Rejected — "bold modern feel" benefits from a distinct heading font.
- Montserrat + Lora: Viable but Inter + Playfair Display offers better contrast between geometric body and elegant headings.
- Self-hosted fonts: Viable but Google Fonts CDN offers better caching across sites; only 2 fonts loaded.

---

## Summary of Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| Cart state | localStorage JSON array | Persists across pages/sessions, simple, no deps |
| Form submission | Formspree (free tier) | No backend needed, email forwarding, spam filtering |
| Mobile nav | CSS checkbox hack + JS enhancement | Works without JS per constitution |
| Calendar | Vanilla JS month-grid renderer | No library needed, progressive enhancement with list fallback |
| Images | Lazy-loaded `<img>` with `srcset`, WebP | Constitution-compliant, layout-stable |
| Color/typography | Earth-tone palette, Inter + Playfair Display | Constitution aesthetic + user's "bold modern" request |
| Data management | Hardcoded in HTML | User's explicit directive; owner edits HTML directly |
