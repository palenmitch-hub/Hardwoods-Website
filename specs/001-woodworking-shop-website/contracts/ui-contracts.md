# UI Contracts: Woodworking Shop Website

**Feature**: 001-woodworking-shop-website
**Date**: 2026-05-06

## Overview

This document defines the public interface contracts for the website — the HTML page structure, navigation contract, CSS custom property API, and JavaScript public functions. Since this is a static site with no backend API, the "contracts" are the consistent patterns that every page must follow and the JavaScript functions that provide interactive behavior.

---

## 1. Page Structure Contract

Every HTML page MUST follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Page Title} | Mitch's Hardwoods</title>
  <meta name="description" content="{Page-specific description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="site-header">
    <!-- Logo + Nav + Cart Icon (shared across all pages) -->
  </header>

  <main>
    <!-- Page-specific content -->
  </main>

  <footer class="site-footer">
    <!-- Business info (shared across all pages) -->
  </footer>

  <!-- Cart slide-out panel (shared across all pages) -->
  <aside id="cart-panel" class="cart-panel" aria-label="Shopping cart" aria-hidden="true">
    <!-- Cart contents rendered by JS -->
  </aside>

  <script src="js/main.js"></script>
</body>
</html>
```

---

## 2. Navigation Contract

### Desktop (≥ 768px)

```text
┌─────────────────────────────────────────────────────────────┐
│  [Logo/Brand]     Home   Catalog   Gallery   Events   [🛒] │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

```text
┌──────────────────────────────────┐
│  [Logo/Brand]       [☰]   [🛒]  │
├──────────────────────────────────┤
│  Home                            │  ← Expands on hamburger click
│  Catalog                         │
│  Gallery                         │
│  Events                          │
└──────────────────────────────────┘
```

**Nav links** (exact, consistent across all pages):

| Label | href | Active class |
|-------|------|-------------|
| Home | `index.html` | `.nav-link--active` |
| Catalog | `catalog.html` | `.nav-link--active` |
| Gallery | `gallery.html` | `.nav-link--active` |
| Events | `events.html` | `.nav-link--active` |

**Cart icon**: Always visible in header, shows badge with item count. Badge hidden when count is 0.

---

## 3. CSS Custom Properties Contract (Design Tokens)

All theme values MUST be defined as custom properties on `:root` in `css/styles.css`. Components MUST reference these tokens — never hardcode color/spacing/font values.

```css
:root {
  /* Colors */
  --color-primary: #5C4033;
  --color-primary-dark: #3E2A1E;
  --color-accent: #8B6914;
  --color-green: #4A6741;
  --color-cream: #FAF6F0;
  --color-white: #FFFFFF;
  --color-gray-light: #E8E2DA;
  --color-gray: #7A7267;
  --color-text: #2C2420;

  /* Typography */
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-size-body: clamp(1rem, 2.5vw, 1.125rem);
  --font-size-h1: clamp(1.75rem, 5vw, 3rem);
  --font-size-h2: clamp(1.5rem, 4vw, 2.25rem);
  --font-size-h3: clamp(1.25rem, 3vw, 1.5rem);
  --font-size-small: clamp(0.875rem, 2vw, 0.9375rem);

  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 5rem;

  /* Layout */
  --max-width: 1200px;
  --border-radius: 8px;
  --border-radius-lg: 12px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

---

## 4. Product Card Contract

Every product card MUST use this HTML structure:

```html
<article class="product-card" 
         data-product-id="{id}" 
         data-product-name="{name}" 
         data-product-price="{price-in-cents}">
  <div class="product-card__image">
    <img src="images/products/{filename}" 
         alt="{descriptive alt text}" 
         loading="lazy" 
         width="400" height="300">
  </div>
  <div class="product-card__info">
    <h3 class="product-card__name">{Product Name}</h3>
    <p class="product-card__description">{Description text}</p>
    <span class="product-card__price">${XX.XX}</span>
    <div class="product-card__actions">
      <label for="qty-{id}" class="sr-only">Quantity</label>
      <input type="number" id="qty-{id}" class="product-card__qty" 
             value="1" min="1" step="1" aria-label="Quantity for {name}">
      <button class="btn btn--accent product-card__add" 
              type="button" aria-label="Add {name} to cart">
        Add to Cart
      </button>
    </div>
  </div>
</article>
```

---

## 5. JavaScript Public API Contract

### Cart Module (`js/main.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `addToCart` | `(id: string, name: string, price: number, qty: number): void` | Add or increment item in cart |
| `removeFromCart` | `(id: string): void` | Remove item from cart |
| `updateQty` | `(id: string, qty: number): void` | Set item quantity; removes if ≤ 0 |
| `getCart` | `(): CartItem[]` | Return current cart array |
| `getCartCount` | `(): number` | Return total item count |
| `clearCart` | `(): void` | Empty the cart |
| `openCartPanel` | `(): void` | Open slide-out cart panel |
| `closeCartPanel` | `(): void` | Close slide-out cart panel |
| `renderCartPanel` | `(): void` | Re-render cart panel contents |
| `updateCartBadge` | `(): void` | Update header cart count badge |

### Calendar Module (`js/main.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `renderCalendar` | `(year: number, month: number): void` | Render month grid into `#calendar-grid` |
| `navigateMonth` | `(direction: number): void` | Move +1 or -1 months and re-render |

### Form Validation (`js/main.js`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `validateCustomOrderForm` | `(form: HTMLFormElement): boolean` | Validate pattern + wood + contact fields |
| `submitQuoteRequest` | `(): Promise<void>` | POST cart contents to Formspree |

---

## 6. Footer Contract

Every page MUST include:

```html
<footer class="site-footer">
  <div class="footer__content">
    <div class="footer__brand">
      <p class="footer__name">Mitch's Hardwoods</p>
      <p class="footer__tagline">Handcrafted in Woodstock, GA</p>
    </div>
    <div class="footer__contact">
      <p><a href="tel:+1XXXXXXXXXX">(XXX) XXX-XXXX</a></p>
      <p><a href="mailto:email@example.com">email@example.com</a></p>
      <p>Woodstock, GA</p>
    </div>
  </div>
  <div class="footer__copyright">
    <p>&copy; 2026 Mitch's Hardwoods. All rights reserved.</p>
  </div>
</footer>
```

---

## 7. Formspree Integration Contract

### Custom Board Order

```text
POST https://formspree.io/f/{form-id}
Content-Type: application/x-www-form-urlencoded

name={customer-name}
&email={customer-email}
&phone={optional-phone}
&pattern={selected-pattern}
&wood_types={wood1,wood2,...}
&_gotcha=
&_subject=Custom Board Order - {customer-name}
```

### Quote Request

```text
POST https://formspree.io/f/{form-id}
Content-Type: application/json

{
  "cart_items": "2x Maple End-Grain Board ($45.00), 1x Classic Cedar Rocker ($325.00)",
  "cart_total": "$415.00",
  "_subject": "New Quote Request - May 6, 2026"
}
```

**Response handling**:
- Success (200): Display inline confirmation message, clear cart (quote) or reset form (custom order)
- Error (4xx/5xx): Display inline error message asking customer to try again or contact directly
