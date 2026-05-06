# Quickstart: Woodworking Shop Website

**Feature**: 001-woodworking-shop-website

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A text editor (VS Code recommended)
- Git (for version control)
- A Formspree account (free tier — for form submissions)

No build tools, package managers, or server software required.

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Mitchs_Hardwoods_website
```

### 2. Open in browser

Open `index.html` directly in your browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or use VS Code Live Server extension for auto-reload
```

### 3. Configure Formspree (required for forms)

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create two forms:
   - "Custom Board Orders"
   - "Quote Requests"
3. Copy each form's endpoint ID (e.g., `f/xyzabcde`)
4. Update `catalog.html`: Replace `{FORMSPREE_CUSTOM_ORDER_ID}` in the custom board form's `action` attribute
5. Update `js/main.js`: Replace `{FORMSPREE_QUOTE_ID}` in the `submitQuoteRequest()` function

### 4. Add your business contact info

Edit the `<footer>` section in each HTML file:
- Replace `(XXX) XXX-XXXX` with your phone number
- Replace `email@example.com` with your email address

## File Structure

```text
├── index.html        # Home / Landing page
├── catalog.html      # Product catalog + custom board form
├── gallery.html      # Project photo gallery
├── events.html       # Events calendar + list
├── css/
│   └── styles.css    # All styles (edit design tokens at top)
├── js/
│   └── main.js       # All interactivity (cart, calendar, forms)
└── images/
    ├── hero/         # Hero section images
    ├── products/     # Product photos
    ├── gallery/      # Gallery photos
    └── icons/        # SVG icons (if not inline)
```

## Common Tasks

### Add a new cutting board

1. Open `catalog.html`
2. Find the appropriate category section (e.g., `<!-- Basic Boards -->`)
3. Copy an existing `<article class="product-card">` block
4. Update:
   - `data-product-id` (unique, e.g., `cb-basic-003`)
   - `data-product-name`
   - `data-product-price` (in cents — e.g., `4500` for $45.00)
   - `<img src>` and `alt` text
   - `<h3>` name, `<p>` description, `<span>` price display
   - `id` and `aria-label` on the quantity input
5. Save and refresh browser

### Add a new Adirondack chair

Same process as cutting boards — find the chair type section and copy/edit an `<article class="product-card">` block. Use `chair-{type}-{###}` for the product ID.

### Add a gallery photo

1. Place the optimized image in `images/gallery/`
2. Open `gallery.html`
3. Add a `<figure>` element inside the gallery grid:
   ```html
   <figure class="gallery__item">
     <img src="images/gallery/my-project.webp" 
          alt="Description of the project" 
          loading="lazy" width="600" height="400">
     <figcaption>Optional caption</figcaption>
   </figure>
   ```

### Add a new event

1. Open `events.html`
2. Add to the events list HTML:
   ```html
   <li class="event-item">
     <h3 class="event-item__name">Event Name</h3>
     <time class="event-item__date" datetime="2026-07-04">July 4, 2026</time>
     <span class="event-item__location">Venue, City, GA</span>
   </li>
   ```
3. Add to the `EVENTS` JavaScript array in `events.html` or `js/main.js`:
   ```javascript
   { name: "Event Name", date: "2026-07-04", location: "Venue, City, GA" }
   ```

### Change colors or fonts

Edit the CSS custom properties at the top of `css/styles.css` under `:root { ... }`. All components reference these tokens.

## Deployment

The site is purely static files. Deploy to any static hosting:

- **GitHub Pages**: Push to `main` branch, enable Pages in repo settings
- **Netlify**: Drag-and-drop the project folder or connect the Git repo
- **Any web server**: Upload all files maintaining the directory structure

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cart not persisting | Check browser localStorage is enabled; clear and retry |
| Forms not submitting | Verify Formspree endpoint IDs are correctly set |
| Images not loading | Verify file paths match; check image filenames are lowercase |
| Calendar not rendering | Ensure JavaScript is enabled; check browser console for errors |
| Mobile nav not working | The checkbox-based nav works without JS; check CSS is loaded |
