# Inventory Email Automation Setup

This adds a "send an email and update Available" workflow using Google Apps Script.

## 1) Create/Use a Dedicated Inbox

Recommended inbox:
- inventory@mitchs-hardwoods.com

In Gmail, create this label for inventory messages:
- MitchHardwoods/Inventory/New

The script also finds new messages addressed to `inventory@mitchs-hardwoods.com`, so manually applying the label is optional. The label is still useful for manually retrying or organizing messages.

The script will move processed items to:
- MitchHardwoods/Inventory/Processed
- MitchHardwoods/Inventory/Error (if parsing fails)

## 2) Subject Format (Required)

Use this exact subject format:
- Name | Price | Qty | ProductNumber

Example:
- Walnut with Wenge and Maple Stripe | 100 | 1 | 0003

Attach one or more images (JPG, PNG, or WEBP).

When multiple images are attached, they are saved for the same board as:
- name-price-qty-product#-01.jpg
- name-price-qty-product#-02.jpg
- etc.

When one image is attached, it is saved as:
- name-price-qty-product#.jpg

To remove inventory by Product #, use subject format:
- REMOVE | ProductNumber

To mark sold and remove from inventory (while keeping sales record), use:
- SOLD | ProductNumber

Example:
- REMOVE | 0003
- SOLD | 0003

To update an existing board's Name, Price, and/or Quantity, use subject format:
- UPDATE | ProductNumber

Put the new details in the email body, one per line:
```
Name: Walnut with Wenge and Maple Stripe
Price: 120
Quantity: 1
```

- If you attach new image(s) to an UPDATE email, they replace all existing photos for that product number.
- If you don't attach any images, the existing photos are kept and simply renamed to match the updated Name/Price/Qty.
- All three body fields (Name, Price, Quantity) are required.

Example:
- Subject: UPDATE | 0003
- Body:
  - Name: Walnut with Wenge and Maple Stripe
  - Price: 120
  - Quantity: 1

If you leave ProductNumber blank on add emails, the script auto-assigns the next available number.

Examples:
- Walnut with Wenge and Maple Stripe | 100 | 1 |
- Purple Heart Basket Weave | 250 | 1 |

Numbering behavior:
- Product numbers are never reused.
- If 0002 is sold/removed, next auto-assigned number after 0001 and 0002 is 0003.

## 3) Add Script Properties in Apps Script

In Apps Script:
- Project Settings
- Script Properties

Add:
- INVENTORY_WEBHOOK_KEY = <your-random-secret>
- INVENTORY_HISTORY_KEY = <your-random-report-key>
- GITHUB_TOKEN = <optional GitHub PAT with repo contents write access>
- GITHUB_OWNER = <your GitHub org/user>
- GITHUB_REPO = <your repo name, e.g. Hardwoods-Website>
- GITHUB_BRANCH = main

Notes:
- GitHub properties are optional, but required for full auto-publish to your website repo.
- Without GitHub properties, the script still parses and validates email + attachment but cannot publish inventory files.

## 4) Deploy/Authorize Apps Script

- Paste/update `google-apps-script.js` in script.google.com
- Run `setupInventoryEmailLabels` once to create labels
- Run `testProcessInventoryInbox` once to authorize permissions

## 5) Trigger Processing Automatically

Create a trigger in Apps Script:
- Function: `processInventoryInbox`
- Event source: Time-driven
- Frequency: Every 5 minutes (or as desired)

## 6) Optional: Process On-Demand via Webhook

POST to your Apps Script web app URL with JSON:

```json
{
  "action": "processInventoryInbox",
  "key": "<INVENTORY_WEBHOOK_KEY>"
}
```

## 7) What Happens on Success

For each valid email in `MitchHardwoods/Inventory/New`:
1. Subject is parsed.
2. If action is Add (`Name | Price | Qty | ProductNumber`):
   - Image attachment(s) are required and validated.
   - Filename is generated as:
     - One image: `name-price-qty-product#.ext`
     - Multiple images: `name-price-qty-product#-01.ext`, `...-02.ext`, etc.
   - If GitHub is configured, images are uploaded to `images/products/available/` and `inventory-manifest.json` is updated.
3. If action is Update (`UPDATE | ProductNumber` + Name/Price/Quantity in the body):
   - If image(s) are attached, they replace all existing photos for that product number.
   - If no images are attached, existing photos are kept and renamed to match the new Name/Price/Qty.
   - Old manifest entries for that product number are removed and replaced with the new filenames.
4. If action is Remove:
   - All inventory image files matching `product#` are deleted from `images/products/available/`
   - Matching entries are removed from `images/products/available/inventory-manifest.json`
5. If action is Sold:
   - Same inventory removal behavior as Remove
   - A sold record is saved in Apps Script `ScriptProperties` with `productNumber`, timestamp, and removed filenames
6. Thread is labeled Processed and marked read.
7. Owner gets a summary email.

## 8) Error Handling

If the email format is wrong, no image is attached (for Add), required fields are missing (for Update), or product number is not found (for Remove/Sold/Update):
- Thread gets label `MitchHardwoods/Inventory/Error`
- Owner gets an "Inventory Processing Error" email with required format.

## 9) Website Display Behavior

All images that share the same board id (`product#`) are grouped into one product card.
Customers can:
1. Use carousel arrows on the card.
2. Click the image and navigate all photos in the lightbox.

## 10) Full Historical Report

The script now keeps a complete inventory history log of:
- Add events
- Update events
- Remove events
- Sold events
- Processing errors

Secure report endpoints:
- Dashboard:
   - `?action=viewInventoryHistory&key=<INVENTORY_HISTORY_KEY>`
- CSV export:
   - `?action=exportInventoryHistoryCsv&key=<INVENTORY_HISTORY_KEY>`

Quick way to get the link emailed to owner:
- Run Apps Script function: `sendInventoryHistoryLink`

Notes:
- If `INVENTORY_HISTORY_KEY` is not set, a default key is created automatically.
- For security, set your own strong `INVENTORY_HISTORY_KEY` in Script Properties.
