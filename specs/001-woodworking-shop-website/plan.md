# Implementation Plan: Woodworking Shop Website

**Branch**: `001-woodworking-shop-website` | **Date**: 2026-05-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-woodworking-shop-website/spec.md`

## Summary

Build a multi-page static website for Mitch's Hardwoods, a custom woodworking shop in Woodstock, GA. The site includes a landing page with hero section, a product catalog with cutting boards (4 categories) and Adirondack chairs (4 types), a custom board order form, a project gallery, and an events calendar/list. Built with vanilla HTML, CSS, and JavaScript — no frameworks or build tools. Product and event data are hardcoded directly in the HTML. Cart state is managed client-side with localStorage. The custom order form submits via Formspree. All pages share a common stylesheet and responsive navigation.

## Technical Context

**Language/Version**: HTML5, CSS3, ES6+ JavaScript (vanilla)
**Primary Dependencies**: None — no frameworks, libraries, or build tools
**Storage**: N/A (static files only; cart uses localStorage; form via Formspree)
**Testing**: Manual browser testing + Lighthouse audits
**Target Platform**: Modern browsers (latest 2 versions of Chrome, Firefox, Safari, Edge; iOS Safari, Android Chrome)
**Project Type**: Static website (multi-page)
**Performance Goals**: < 1 MB homepage initial load; < 3 seconds on standard mobile connection
**Constraints**: No server-side processing; no build step; pure static files deployable to GitHub Pages / Netlify / any static host
**Scale/Scope**: 4 HTML pages, 1 shared CSS file, 1 shared JS file, ~20–30 product cards total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Semantic & Accessible HTML | ✅ PASS | All pages use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`. One `<h1>` per page. Sequential heading hierarchy. All images have `alt`. WCAG 2.1 AA targeted. |
| II. Mobile-First Responsive Design | ✅ PASS | Base styles target mobile; `min-width` breakpoints for tablet/desktop. CSS Grid/Flexbox only. Touch targets ≥ 44×44px. Fluid typography via `clamp()`. No horizontal scroll. |
| III. Modern Outdoor Aesthetic | ✅ PASS | Earth-tone palette (browns, greens, golds, grays, cream). Sans-serif body + display heading font. Generous whitespace. Rounded UI elements. |
| IV. Clean CSS Architecture | ✅ PASS | Single CSS file with custom properties for all theme tokens. BEM-style class naming. No frameworks. No `!important`. Max 3-level specificity. |
| V. Performance & Simplicity | ✅ PASS | Vanilla JS for progressive enhancement only. No third-party deps except Formspree endpoint. Images lazy-loaded. Target < 1 MB homepage. |

**Gate result: PASS** — all 5 principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-woodworking-shop-website/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
├── index.html           # Landing page (hero + tagline + CTA)
├── catalog.html         # Product catalog (cutting boards, chairs, custom board form)
├── gallery.html         # Project photo gallery
├── events.html          # Events calendar + list view
├── css/
│   └── styles.css       # Single shared stylesheet (reset, layout, components, utilities)
├── js/
│   └── main.js          # Shared JS (cart, mobile nav, calendar, form validation)
└── images/
    ├── hero/            # Hero section background/photos
    ├── products/        # Product photos (cutting boards + chairs)
    ├── gallery/         # Gallery project photos
    └── icons/           # Cart icon, nav hamburger, etc. (SVG inline preferred)
```

**Structure Decision**: Flat static site — each page is a standalone `.html` file at the root. One shared CSS file in `css/` and one shared JS file in `js/`. Images organized by purpose in `images/` subdirectories. No build step, no templating engine. The shop owner edits HTML directly to add/remove products and events.

## Complexity Tracking

No constitution violations — table not needed.
