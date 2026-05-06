# Data Model: Woodworking Shop Website

**Feature**: 001-woodworking-shop-website
**Date**: 2026-05-06

## Overview

All data is hardcoded directly in HTML. There is no database, no JSON files, and no build step. The shop owner edits HTML to manage content. This document defines the logical data structures used in JavaScript (cart, events calendar) and the HTML patterns for product/event content.

---

## Entities

### Product (HTML — hardcoded in catalog.html)

Represented as an `<article>` element with `data-*` attributes for JavaScript cart functionality.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `data-product-id` | string | yes | Unique identifier (e.g., `cb-basic-001`, `chair-lowrider-001`) |
| `data-product-name` | string | yes | Display name (e.g., "Maple End-Grain Board") |
| `data-product-price` | number | yes | Price in USD cents (e.g., `4500` = $45.00) |
| `data-product-category` | string | yes | Category key: `basic`, `pattern`, `intricate`, `custom`, `lowrider`, `mid-stationary`, `high-top`, `rocker` |

**Visual content** (in HTML, not data attributes):
- Photo: `<img>` with `src`, `alt`, `loading="lazy"`, `width`, `height`
- Name: `<h3>` text content
- Description: `<p>` text content
- Price: `<span class="product-price">` formatted as `$XX.XX`

**ID convention**:
- Cutting boards: `cb-{category}-{###}` (e.g., `cb-basic-001`, `cb-pattern-002`)
- Chairs: `chair-{type}-{###}` (e.g., `chair-lowrider-001`, `chair-rocker-002`)

---

### Cart Item (JavaScript — localStorage)

Stored in `localStorage` as a JSON-serialized array under key `mitchs-cart`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Product ID matching `data-product-id` |
| `name` | string | yes | Product display name |
| `price` | number | yes | Price in USD cents |
| `qty` | number | yes | Quantity (≥ 1, whole number) |

**Example**:
```json
[
  { "id": "cb-basic-001", "name": "Maple End-Grain Board", "price": 4500, "qty": 2 },
  { "id": "chair-rocker-001", "name": "Classic Cedar Rocker", "price": 32500, "qty": 1 }
]
```

**Operations**:
- `addToCart(id, name, price, qty)`: If item exists, increment qty; else push new entry
- `removeFromCart(id)`: Remove entry by ID
- `updateQty(id, qty)`: Set quantity; remove if qty ≤ 0
- `getCart()`: Parse and return array (empty array if key absent)
- `getCartCount()`: Sum of all qty values (displayed in header badge)
- `clearCart()`: Remove localStorage key

---

### Custom Board Order (HTML form → Formspree)

Form fields submitted as POST to Formspree endpoint.

| Field | HTML Name | Type | Required | Description |
|-------|-----------|------|----------|-------------|
| Customer Name | `name` | text | yes | Full name for follow-up |
| Email | `email` | email | yes | Email address |
| Phone | `phone` | tel | no | Optional phone number |
| Pattern | `pattern` | radio/select | yes | Selected board pattern |
| Wood Types | `wood_types` | checkbox group | yes (≥1) | Selected wood species |
| Honeypot | `_gotcha` | hidden text | no | Spam prevention (must be empty) |

**Patterns** (hardcoded as radio buttons or select options):
- End Grain
- Edge Grain
- Herringbone
- Chevron
- Brick
- Butcher Block

**Wood Types** (hardcoded as checkboxes):
- Maple
- Walnut
- Cherry
- Padauk
- Purple Heart
- White Oak

---

### Quote Request (JavaScript → Formspree)

Cart contents submitted via JavaScript `fetch()` POST when user clicks "Request Quote" in the slide-out panel.

| Field | Form Name | Type | Description |
|-------|-----------|------|-------------|
| Cart Items | `cart_items` | text | Formatted string of all items: "2x Maple End-Grain Board ($45.00), 1x Classic Cedar Rocker ($325.00)" |
| Cart Total | `cart_total` | text | Formatted total: "$415.00" |
| Timestamp | `_subject` | text | "New Quote Request - {date}" (also serves as Formspree email subject) |

---

### Event (HTML — hardcoded in events.html)

Represented as list items in the event list and as a JavaScript array for the calendar renderer.

**HTML list view** (static, works without JS):

| Content | Element | Description |
|---------|---------|-------------|
| Event Name | `<h3>` or `<strong>` | Display name |
| Date | `<time datetime="YYYY-MM-DD">` | Machine-readable + human-readable |
| Location | `<span class="event-location">` | Venue name and/or address |

**JavaScript calendar array** (for calendar grid rendering):

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Event display name |
| `date` | string | ISO date `YYYY-MM-DD` |
| `location` | string | Venue name/address |

**Example**:
```javascript
const EVENTS = [
  { name: "Woodstock Arts Festival", date: "2026-06-14", location: "Downtown Woodstock, GA" },
  { name: "Roswell Farmers Market", date: "2026-06-21", location: "Roswell Town Square" }
];
```

---

### Gallery Photo (HTML — hardcoded in gallery.html)

| Content | Element | Description |
|---------|---------|-------------|
| Image | `<img>` | `src`, `alt` (descriptive), `loading="lazy"`, `width`, `height` |
| Caption | `<figcaption>` (optional) | Brief description of the project |
| Container | `<figure>` | Wraps img + figcaption |

---

## Relationships

```text
Product ──(added to)──→ Cart Item ──(submitted as)──→ Quote Request
                                                         │
Custom Board Order ─────────────────────────────────────(via Formspree)──→ Shop Owner Email

Event ──(rendered in)──→ Calendar Grid (JS)
     ──(listed in)──→ Event List (HTML)

Gallery Photo ──(displayed in)──→ Gallery Grid (CSS)
```

## State Transitions

### Cart Lifecycle

```text
[Empty Cart] ──(Add to Cart)──→ [Cart with Items]
     ↑                              │    │
     │                              │    ├──(Update Qty)──→ [Cart with Items]
     │                              │    ├──(Remove Item)──→ [Cart with Items] or [Empty Cart]
     └──(Clear Cart / Quote Sent)───┘    └──(Request Quote)──→ [Quote Submitted] → [Empty Cart]
```

### Custom Board Order Lifecycle

```text
[Form Empty] ──(Fill Fields)──→ [Form Populated]
                                     │
                              ──(Submit)──→ [Validation Check]
                                     │              │
                                  [Fail]         [Pass]
                                     │              │
                              [Show Errors]   [POST to Formspree]
                                                    │
                                             [Show Confirmation]
```
