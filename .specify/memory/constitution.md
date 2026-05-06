<!--
Sync Impact Report
- Version change: N/A → 1.0.0 (initial ratification)
- Added principles:
  - I. Semantic & Accessible HTML
  - II. Mobile-First Responsive Design
  - III. Modern Outdoor Aesthetic
  - IV. Clean CSS Architecture
  - V. Performance & Simplicity
- Added sections:
  - Technical Standards
  - Development Workflow
  - Governance
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed
- Follow-up TODOs: None
-->

# Mitch's Hardwoods Website Constitution

## Core Principles

### I. Semantic & Accessible HTML

- All markup MUST use semantic HTML5 elements (`<header>`,
  `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, etc.)
  instead of generic `<div>` containers.
- Every page MUST meet WCAG 2.1 Level AA compliance.
- Heading hierarchy MUST be sequential (`h1` → `h2` → `h3`)
  with exactly one `<h1>` per page.
- All images MUST include descriptive `alt` text. Decorative
  images MUST use `alt=""` with `role="presentation"`.
- Interactive elements MUST be keyboard-navigable and include
  visible focus indicators.
- ARIA attributes MUST only be used when native HTML semantics
  are insufficient; prefer native elements over ARIA overrides.
- Color contrast ratios MUST meet 4.5:1 for normal text and
  3:1 for large text.

**Rationale**: A hardwood business serves diverse customers
including contractors and homeowners of all abilities. Accessible,
semantic markup ensures the site is usable by everyone and
ranks well in search engines.

### II. Mobile-First Responsive Design

- All CSS layouts MUST be authored mobile-first: base styles
  target small screens, with `min-width` media queries adding
  complexity for larger viewports.
- Touch targets (buttons, links, form controls) MUST be at
  least 44×44 CSS pixels.
- Layouts MUST use CSS Grid and/or Flexbox; no float-based
  layouts are permitted.
- Typography MUST use fluid scaling (e.g., `clamp()`) to
  ensure readability across viewport sizes.
- No horizontal scrolling is permitted at any standard
  viewport width (320px and above).
- Navigation MUST be fully functional on mobile without
  requiring JavaScript for core access.

**Rationale**: Customers frequently browse from job sites and
mobile devices. Mobile-first ensures the primary experience is
fast and usable on smaller screens.

### III. Modern Outdoor Aesthetic

- The visual design MUST evoke natural hardwood and outdoor
  themes through an earth-tone color palette (warm browns,
  forest greens, muted golds, stone grays, cream whites).
- Imagery MUST feature high-quality photos of hardwood
  products, natural textures, and outdoor settings.
- Whitespace MUST be used generously to create a clean,
  uncluttered layout that lets content breathe.
- Typography MUST pair a modern sans-serif body font with
  an optional serif or display font for headings to convey
  craftsmanship and warmth.
- UI elements (buttons, cards, borders) SHOULD incorporate
  subtle natural textures or rounded edges rather than sharp,
  corporate styling.

**Rationale**: The brand identity MUST communicate quality
craftsmanship and connection to natural materials, building
trust with customers seeking premium hardwood products.

### IV. Clean CSS Architecture

- CSS MUST be organized with custom properties (variables)
  for all theme values: colors, spacing, typography, and
  border radii.
- Specificity MUST be kept minimal; avoid nesting beyond
  three levels and never use `!important` except for
  documented utility overrides.
- Class naming MUST follow a consistent convention (e.g.,
  BEM or simple descriptive names); no inline styles
  except for dynamic computed values.
- No CSS frameworks (Bootstrap, Tailwind, etc.) unless
  explicitly justified and approved; prefer hand-authored
  CSS to maintain lightweight, purpose-built styles.
- All CSS MUST be valid per W3C standards; vendor prefixes
  MUST only be added when required for target browser
  support.

**Rationale**: A small business website does not need
framework overhead. Clean, hand-crafted CSS is easier to
maintain, faster to load, and produces exactly the desired
aesthetic.

### V. Performance & Simplicity

- JavaScript MUST be used sparingly and only for interactive
  enhancements; core content and navigation MUST be fully
  functional without JavaScript (progressive enhancement).
- Images MUST be served in modern formats (WebP or AVIF)
  with appropriate fallbacks and responsive `srcset`/`sizes`
  attributes.
- Total page weight for initial load SHOULD remain under
  1 MB on the homepage; critical CSS SHOULD be inlined.
- No unnecessary third-party dependencies; every external
  resource MUST be justified by a clear user-facing benefit.
- HTML and CSS MUST be validated and free of errors before
  any feature is considered complete.

**Rationale**: Fast load times directly impact customer
retention and search ranking. Simplicity reduces maintenance
burden and keeps the site robust over time.

## Technical Standards

- **Markup**: HTML5 with semantic elements; no deprecated
  tags or attributes.
- **Styling**: CSS3 with custom properties; organized into
  logical partials (reset, layout, components, utilities).
- **Images**: WebP/AVIF primary with JPEG/PNG fallbacks;
  all images optimized and lazy-loaded below the fold.
- **Browser Support**: Latest two versions of Chrome,
  Firefox, Safari, and Edge; iOS Safari and Android Chrome.
- **Hosting**: Static site deployment; no server-side
  rendering required unless scope changes.
- **Version Control**: Git with feature branches; all
  changes via pull requests.

## Development Workflow

- Every feature MUST be developed on a dedicated feature
  branch and merged via pull request.
- All HTML MUST pass W3C validation before merge.
- All CSS MUST pass W3C CSS validation before merge.
- Accessibility MUST be verified with automated tooling
  (e.g., axe, Lighthouse) and manual keyboard navigation
  testing.
- Responsive behavior MUST be tested at minimum three
  breakpoints: 320px (mobile), 768px (tablet), 1280px
  (desktop).
- Images MUST be optimized (compressed, properly sized)
  before committing to the repository.

## Governance

This constitution supersedes all other development
practices for the Mitch's Hardwoods Website project.
All code contributions MUST comply with every principle
defined above.

- **Amendments**: Any change to this constitution MUST be
  documented with a version bump, rationale, and updated
  date. Breaking changes to principles require a MAJOR
  version increment.
- **Versioning**: Constitution versions follow semantic
  versioning (MAJOR.MINOR.PATCH). MAJOR for principle
  removals or incompatible redefinitions, MINOR for new
  principles or material expansions, PATCH for
  clarifications and wording fixes.
- **Compliance Review**: Every pull request MUST include
  a self-check against these principles. Violations MUST
  be resolved or explicitly justified before merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-06 | **Last Amended**: 2026-05-06
