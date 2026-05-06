# Feature Specification: Woodworking Shop Website

**Feature Branch**: `001-woodworking-shop-website`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "Build a static website for custom woodworking shop ran out of my garage in Woodstock, GA. The site has a landing page with a hero section and a tagline, a product catalog page that shows 4 categories of cutting boards (Basic, Pattern, Intricate, and Custom) each category will have multiple examples of boards with a photo placeholder, and a way for me to add a name, description, and a price tag. Under the price for each board will be a button to 'Add to Cart' with a number count field to be able to add multiple. Also in the catalog will be Adirondack Chairs with 4 types available (Low Rider, Mid Stationary, High Top, and Rocker) each type will have photo placeholder, and a way for me to add a name, description, and a price tag. Under the price for each chair will be a button to 'Add to Cart' with a number count field to be able to add multiple. There will also be a Create Custom Board section where users will be able to pick a pattern and select what types of wood they would like the board to be made from and a way to submit that custom order. There also needs to be a gallery for me to upload photos of my projects. There also needs to be an Events section that will display both a calendar view and a list of upcoming events that I will be attending that people can see and buy my projects in person. The site should have a bold modern feel with clean topography."

## Clarifications

### Session 2026-05-06

- Q: After a customer adds items to their cart, what experience should they have? → A: Cart icon in header with count badge; clicking opens a slide-out panel listing items with quantities; a "Request Quote" button sends cart contents to the shop owner via form service.
- Q: What customer information does the custom board order form collect? → A: Customer name, email address, and optional phone number — minimum needed for follow-up.
- Q: Is the site single-page or multi-page, and where does each section live? → A: Multi-page — separate pages for Home, Catalog (includes custom board section), Gallery, and Events.
- Q: Are custom board patterns and wood types hardcoded or configurable? → A: Owner-configurable via data files, same as product listings; no hardcoded list.
- Q: Is there a general business contact section? → A: Footer on every page displays business name, Woodstock GA location, phone number, and email address.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Shop Cutting Boards (Priority: P1)

A customer visits the product catalog and browses cutting boards organized by category (Basic, Pattern, Intricate, Custom). They view photos, names, descriptions, and prices for each board. They select a quantity and add one or more boards to their cart.

**Why this priority**: The cutting board catalog is the core revenue driver and primary reason customers visit the site. Without the ability to browse and add products to a cart, the site has no commercial purpose.

**Independent Test**: Can be fully tested by navigating to the catalog page, viewing cutting boards across all four categories, verifying product details display correctly, adjusting quantity, and clicking "Add to Cart."

**Acceptance Scenarios**:

1. **Given** a customer is on the product catalog page, **When** they select the "Cutting Boards" section, **Then** they see four categories: Basic, Pattern, Intricate, and Custom, each displaying multiple boards.
2. **Given** a customer is viewing a cutting board listing, **When** they look at a product card, **Then** they see a photo (or placeholder), name, description, and price.
3. **Given** a customer wants to purchase a board, **When** they set the quantity field to 2 and click "Add to Cart," **Then** the item is added to their cart with a quantity of 2 and the cart icon count updates.
4. **Given** a customer has added items to their cart, **When** they click the cart icon in the header, **Then** a slide-out panel displays all added items with names, quantities, and a "Request Quote" button.
5. **Given** a customer is on a mobile device, **When** they browse cutting boards, **Then** the product cards stack vertically and remain fully readable with touch-friendly controls.

---

### User Story 2 - Browse and Shop Adirondack Chairs (Priority: P1)

A customer visits the product catalog and browses Adirondack Chairs organized by type (Low Rider, Mid Stationary, High Top, Rocker). They view photos, names, descriptions, and prices for each chair. They select a quantity and add chairs to their cart.

**Why this priority**: Chairs are a second major product line and use the same catalog interaction pattern as cutting boards, making them essential to complete the product offering.

**Independent Test**: Can be fully tested by navigating to the Adirondack Chairs section of the catalog, viewing all four types, verifying product details, adjusting quantity, and clicking "Add to Cart."

**Acceptance Scenarios**:

1. **Given** a customer is on the product catalog page, **When** they select the "Adirondack Chairs" section, **Then** they see four types: Low Rider, Mid Stationary, High Top, and Rocker, each displaying available chairs.
2. **Given** a customer is viewing a chair listing, **When** they look at a product card, **Then** they see a photo (or placeholder), name, description, and price.
3. **Given** a customer wants to purchase a chair, **When** they set the quantity to 1 and click "Add to Cart," **Then** the chair is added to their cart with a quantity of 1 and the cart icon count updates.

---

### User Story 3 - Landing Page First Impression (Priority: P2)

A new visitor arrives at the site's landing page and immediately sees a visually striking hero section with a bold tagline that communicates what the business offers and where it is located. The page conveys a modern, handcrafted feel and encourages the visitor to explore further.

**Why this priority**: The landing page is the entry point for all visitors and sets the tone for the brand. It must hook visitors quickly, but the catalog is more critical to transactional value.

**Independent Test**: Can be fully tested by loading the homepage and verifying the hero section displays with a tagline, the page is visually complete on mobile and desktop, and navigation links lead to other sections of the site.

**Acceptance Scenarios**:

1. **Given** a visitor loads the homepage, **When** the page renders, **Then** a full-width hero section is visible with a compelling tagline and a clear call-to-action.
2. **Given** a visitor is on the homepage, **When** they scroll or look for navigation, **Then** they find clear links to the product catalog, gallery, and events sections.
3. **Given** a visitor is on a mobile device, **When** the homepage loads, **Then** the hero section scales appropriately, text is readable, and no horizontal scrolling occurs.

---

### User Story 4 - Create a Custom Cutting Board Order (Priority: P2)

A customer wants a unique cutting board. They navigate to the "Create Custom Board" section, choose a pattern from a set of options, select the types of wood they want in the board, and submit their custom order request.

**Why this priority**: Custom orders differentiate the business from mass-market competitors and likely command higher margins. However, it depends on the catalog infrastructure being in place first.

**Independent Test**: Can be fully tested by navigating to the custom board section, selecting a pattern, choosing wood types, submitting the form, and verifying a confirmation is displayed.

**Acceptance Scenarios**:

1. **Given** a customer is on the custom board section, **When** the page loads, **Then** they see a list of available patterns to choose from (loaded from owner-configurable data files).
2. **Given** a customer has selected a pattern, **When** they proceed to wood selection, **Then** they can select one or more wood types from an owner-configurable list.
3. **Given** a customer has chosen a pattern and wood types, **When** they enter their name, email, and optionally phone number and click "Submit Order," **Then** they see a confirmation message acknowledging the custom order request was received.
4. **Given** a customer leaves required fields (name, email, pattern, or wood type) empty, **When** they try to submit, **Then** the form displays clear validation messages indicating what needs to be completed.

---

### User Story 5 - View Project Gallery (Priority: P3)

A visitor browses the gallery page to see photos of completed projects, getting a sense of the quality and variety of the shop's work.

**Why this priority**: The gallery builds trust and showcases craftsmanship but is supplementary to the core shopping experience.

**Independent Test**: Can be fully tested by navigating to the gallery page and verifying that uploaded photos display in an organized layout with proper image handling.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to the gallery page, **When** the page loads, **Then** they see a grid or masonry layout of project photos.
2. **Given** the shop owner has uploaded photos, **When** a visitor views the gallery, **Then** each photo loads at an appropriate resolution for the visitor's device.
3. **Given** a visitor is on a mobile device, **When** they browse the gallery, **Then** images are displayed in a single or two-column layout with no horizontal scrolling.

---

### User Story 6 - View Upcoming Events (Priority: P3)

A visitor checks the events section to see where the shop owner will be selling products in person. They can view events in both a calendar format and a list format, seeing dates, locations, and event names.

**Why this priority**: Events drive in-person sales and local awareness but are secondary to the core online catalog and shopping experience.

**Independent Test**: Can be fully tested by navigating to the events section and verifying that both a calendar view and a list view display upcoming events with correct details.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to the events section, **When** the page loads, **Then** they see a calendar view showing months with events marked on specific dates.
2. **Given** a visitor wants a quick overview, **When** they switch to or scroll to the list view, **Then** they see upcoming events sorted chronologically with event name, date, and location.
3. **Given** no upcoming events exist, **When** a visitor views the events section, **Then** they see a friendly message indicating no events are currently scheduled.
4. **Given** a visitor is on a mobile device, **When** they view the events section, **Then** the calendar and list views are fully usable and readable.

---

### User Story 7 - Shop Owner Manages Product Content (Priority: P2)

The shop owner (Mitch) needs a straightforward way to add, edit, and remove product listings (cutting boards and chairs) including name, description, price, and photo for each item. This is done by editing the site's content files directly — no admin panel is required for a static site.

**Why this priority**: Without the ability to manage content, the catalog would be static and useless for ongoing business operations. Tied to P1 stories as a content management prerequisite.

**Independent Test**: Can be fully tested by editing a product data file, adding a new cutting board entry with name, description, price, and photo path, rebuilding the site, and verifying the new product appears in the catalog.

**Acceptance Scenarios**:

1. **Given** the shop owner wants to add a new product, **When** they add an entry to the product data file with name, description, price, and photo path, **Then** the product appears in the correct category on the catalog page after rebuilding.
2. **Given** the shop owner wants to update a price, **When** they change the price value in the data file and rebuild, **Then** the updated price is displayed on the catalog page.
3. **Given** the shop owner wants to remove a product, **When** they delete the entry from the data file and rebuild, **Then** the product no longer appears on the catalog page.

---

### Edge Cases

- What happens when a customer sets the quantity to 0 or a negative number? The quantity field must enforce a minimum value of 1 and only accept whole numbers.
- What happens when no products exist in a cutting board category? The category heading still displays with a message like "Coming soon" instead of an empty section.
- What happens when a visitor tries to submit the custom board form without selecting a pattern or any wood type? The form displays inline validation errors and does not submit.
- What happens when the gallery has no photos uploaded? The gallery page displays a placeholder message indicating photos are coming soon.
- What happens when an event date has passed? Past events are automatically hidden or moved to a "Past Events" section so the list stays current.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Site MUST include a landing page with a full-width hero section displaying a tagline and a call-to-action.
- **FR-002**: Site MUST include a product catalog page with a "Cutting Boards" section containing four categories: Basic, Pattern, Intricate, and Custom.
- **FR-003**: Each cutting board category MUST display multiple product cards, each showing a photo (or placeholder), name, description, and price.
- **FR-004**: Each product card MUST include a quantity input field (minimum value of 1, whole numbers only) and an "Add to Cart" button.
- **FR-005**: Site MUST include an "Adirondack Chairs" section in the product catalog with four types: Low Rider, Mid Stationary, High Top, and Rocker.
- **FR-006**: Each chair type MUST display product cards with photo (or placeholder), name, description, price, quantity input, and "Add to Cart" button — identical interaction pattern to cutting boards.
- **FR-007**: Site MUST include a "Create Custom Board" section where users can select a pattern from a predefined set of options.
- **FR-008**: The custom board section MUST allow users to select one or more wood types for their board.
- **FR-009**: The custom board section MUST include a "Submit Order" action that displays a confirmation message upon successful submission.
- **FR-010**: Custom board form MUST validate that a pattern and at least one wood type are selected before allowing submission.
- **FR-011**: Site MUST include a gallery page displaying photos of completed projects in a responsive grid layout.
- **FR-012**: Site MUST include an events section with both a calendar view (showing event dates on a monthly grid) and a chronological list view of upcoming events.
- **FR-013**: Each event listing MUST display the event name, date, and location.
- **FR-014**: The site MUST provide a consistent navigation structure allowing visitors to reach any major section (Home, Catalog, Gallery, Events) from any page.
- **FR-015**: Product data (names, descriptions, prices, photo paths) MUST be stored in editable data files that the shop owner can update without modifying HTML templates.
- **FR-016**: The quantity input field MUST enforce a minimum value of 1 and only accept positive whole numbers.
- **FR-017**: The site MUST display a "Coming soon" message for any product category that has no entries rather than showing an empty section.
- **FR-018**: The site header MUST include a cart icon displaying the current number of items in the cart.
- **FR-019**: Clicking the cart icon MUST open a slide-out panel listing all added items with product name, quantity, and a "Request Quote" button.
- **FR-020**: The "Request Quote" button MUST send the cart contents (product names and quantities) to the shop owner via a third-party form service.
- **FR-021**: The custom board order form MUST collect customer name (required), email address (required), and phone number (optional) in addition to pattern and wood type selections.
- **FR-022**: The site MUST be structured as multiple pages: Home (landing page), Catalog (product listings and custom board section), Gallery, and Events.
- **FR-023**: Every page MUST include a footer displaying the business name, Woodstock GA location, phone number, and email address.
- **FR-024**: Custom board patterns and wood types MUST be stored in owner-editable data files, following the same content management approach as product listings.

### Key Entities

- **Product**: Represents a sellable item (cutting board or chair). Key attributes: name, description, price, photo, category/type.
- **Cutting Board Category**: A grouping of cutting board products. Values: Basic, Pattern, Intricate, Custom.
- **Chair Type**: A grouping of Adirondack Chair products. Values: Low Rider, Mid Stationary, High Top, Rocker.
- **Custom Board Order**: A customer-submitted request for a custom cutting board. Key attributes: selected pattern, selected wood types, customer name, customer email, optional phone number, submission timestamp.
- **Event**: An upcoming in-person selling event. Key attributes: name, date, location.
- **Gallery Photo**: A photo of a completed project. Key attributes: image file, optional caption.
- **Cart Item**: A product added to the shopping cart. Key attributes: product reference, quantity.
- **Quote Request**: A submission of the full cart contents to the shop owner. Key attributes: list of cart items (product + quantity), submitted via form service.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can browse the full product catalog and view all product details in under 3 seconds on a standard mobile connection.
- **SC-002**: Visitors can add any product to the cart within 2 interactions (set quantity + click "Add to Cart") from the product listing.
- **SC-003**: 95% of visitors can complete a custom board order submission on their first attempt without encountering confusion.
- **SC-004**: The site is fully functional and visually consistent across mobile (320px), tablet (768px), and desktop (1280px) viewports.
- **SC-005**: All pages score 90+ on Lighthouse accessibility audit.
- **SC-006**: The shop owner can add a new product to the catalog in under 5 minutes by editing a data file.
- **SC-007**: The events section accurately displays all upcoming events and automatically hides past events.
- **SC-008**: The gallery page loads all visible images without layout shift or broken placeholders.

## Assumptions

- The site is a static website with no server-side rendering or backend application server; interactive features (cart, custom order form) will use client-side functionality only.
- "Add to Cart" functionality stores cart state in the browser (client-side); no payment processing or checkout flow is included in this initial scope.
- The custom board order form submission will be handled via a third-party form service (e.g., Formspree, Netlify Forms) or mailto link; no custom backend is required.
- The shop owner will manage product data and gallery photos by editing data/content files directly and rebuilding/redeploying the site.
- Event data will be managed similarly to products — through editable data files maintained by the shop owner.
- The site will be hosted on a static hosting platform (e.g., GitHub Pages, Netlify, Vercel).
- "Bold modern feel with clean typography" aligns with the constitution's Modern Outdoor Aesthetic principle — earth-tone palette, generous whitespace, and modern sans-serif typography with optional display headings.
- The site targets English-speaking customers in the Woodstock, GA area and surrounding regions.
- No user authentication or account system is needed; all visitors are anonymous.
- The site is multi-page: Home, Catalog (including the Create Custom Board section), Gallery, and Events as separate HTML pages with shared navigation and footer.
- The cart slide-out panel and "Request Quote" functionality use client-side JavaScript with form submission via third-party service; no server-side processing.
- Custom board patterns and wood types are managed by the shop owner via editable data files, not hardcoded in the HTML.
