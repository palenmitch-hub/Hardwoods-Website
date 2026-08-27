// ============================================
// Mitch's Hardwoods — Order Management
// Google Apps Script (paste into script.google.com)
// ============================================

var OWNER_EMAIL = 'orders@mitchs-hardwoods.com';
var VIEW_ORDERS_KEY = 'mitchhardwoods2026';
var INVENTORY_EMAIL = 'inventory@mitchs-hardwoods.com';
var INVENTORY_LABEL_NEW = 'MitchHardwoods/Inventory/New';
var INVENTORY_LABEL_PROCESSED = 'MitchHardwoods/Inventory/Processed';
var INVENTORY_LABEL_ERROR = 'MitchHardwoods/Inventory/Error';
var INVENTORY_HISTORY_DEFAULT_KEY = 'inventory-history-2026';

// ---- POST Handler (new orders from website) ----

function doPost(e) {
  try {
    // Support both JSON body and form-encoded payload
    var data;
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = JSON.parse(e.postData.contents);
    }
    if (data.action === 'submitOrder') {
      return handleSubmitOrder(data);
    }
    if (data.action === 'submitQuoteRequest') {
      return handleSubmitQuoteRequest(data);
    }
    if (data.action === 'processInventoryInbox') {
      return handleProcessInventoryInbox(data);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleProcessInventoryInbox(data) {
  var key = data && data.key ? String(data.key) : '';
  var configuredKey = PropertiesService.getScriptProperties().getProperty('INVENTORY_WEBHOOK_KEY') || '';
  if (!configuredKey || key !== configuredKey) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var result = processInventoryInbox();
  return ContentService.createTextOutput(JSON.stringify({ success: true, result: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- GET Handler (confirm/deny/view links) ----

function doGet(e) {
  var action = e.parameter.action;

  if (action === 'inventoryAdmin') {
    var adminKey = e.parameter.key || '';
    if (!adminKey || adminKey !== getInventoryAdminKey_()) {
      return HtmlService.createHtmlOutput(buildResultPage('Access Denied', 'Invalid inventory manager key.', 'warning'));
    }
    return HtmlService.createHtmlOutput(buildInventoryAdminPage()).setTitle('Inventory Manager');
  }

  // View confirmed orders dashboard
  if (action === 'viewOrders') {
    var key = e.parameter.key;
    if (key !== VIEW_ORDERS_KEY) {
      return HtmlService.createHtmlOutput(buildResultPage('Access Denied', 'Invalid access key.', 'warning'));
    }
    return HtmlService.createHtmlOutput(buildOrdersDashboard());
  }

  // View inventory history dashboard
  if (action === 'viewInventoryHistory') {
    var historyKey = e.parameter.key;
    if (historyKey !== getInventoryHistoryAccessKey_()) {
      return HtmlService.createHtmlOutput(buildResultPage('Access Denied', 'Invalid access key.', 'warning'));
    }
    return HtmlService.createHtmlOutput(buildInventoryHistoryDashboard(historyKey));
  }

  // Export inventory history as CSV
  if (action === 'exportInventoryHistoryCsv') {
    var csvKey = e.parameter.key;
    if (csvKey !== getInventoryHistoryAccessKey_()) {
      return ContentService.createTextOutput('Unauthorized')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput(buildInventoryHistoryCsv())
      .setMimeType(ContentService.MimeType.CSV);
  }

  var orderData = e.parameter.data;

  if (!orderData) {
    return HtmlService.createHtmlOutput(buildResultPage('Invalid Link', 'This link is not valid.', 'warning'));
  }

  try {
    var order = JSON.parse(Utilities.newBlob(Utilities.base64Decode(orderData)).getDataAsString());
  } catch (err) {
    return HtmlService.createHtmlOutput(buildResultPage('Invalid Link', 'Could not read order data.', 'warning'));
  }

  if (action === 'confirm') {
    return handleConfirmOrder(order);
  } else if (action === 'deny') {
    return handleDenyOrder(order);
  }

  return HtmlService.createHtmlOutput(buildResultPage('Invalid Request', 'Unknown action.', 'warning'));
}

// ---- Submit New Order ----

function handleSubmitOrder(data) {
  var orderId = data.orderId;

  // Encode order data for confirm/deny links
  var orderPayload = {
    orderId: orderId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    contactMethod: data.contactMethod,
    items: data.items,
    total: data.total,
    date: data.date
  };
  var encoded = Utilities.base64Encode(JSON.stringify(orderPayload));

  var scriptUrl = ScriptApp.getService().getUrl();
  var confirmUrl = scriptUrl + '?action=confirm&data=' + encoded;
  var denyUrl = scriptUrl + '?action=deny&data=' + encoded;

  // Plain text body
  var itemsList = '';
  for (var i = 0; i < data.items.length; i++) {
    itemsList += '  - ' + data.items[i] + '\n';
  }
  var body = 'New Order Received!\n\n' +
    'Order ID: ' + orderId + '\n' +
    'Date: ' + data.date + '\n\n' +
    'Customer Info:\n' +
    '  Name: ' + data.firstName + ' ' + data.lastName + '\n' +
    '  Email: ' + data.email + '\n' +
    '  Phone: ' + data.phone + '\n' +
    '  Preferred Contact: ' + data.contactMethod + '\n\n' +
    'Items Ordered:\n' + itemsList + '\n' +
    'Total: ' + data.total + '\n\n' +
    '---\n\n' +
    'CONFIRM ORDER: ' + confirmUrl + '\n\n' +
    'DENY ORDER: ' + denyUrl;

  // HTML body
  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">' +
    '<h2 style="color: #333; margin-top: 0;">New Order Received!</h2>' +
    '<p style="color: #666;"><strong>Order ID:</strong> ' + orderId + '</p>' +
    '<p style="color: #666;"><strong>Date:</strong> ' + data.date + '</p>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<h3 style="color: #333;">Customer Info</h3>' +
    '<table style="width: 100%; border-collapse: collapse;">' +
    '<tr><td style="padding: 6px 0; color: #888;">Name</td><td style="padding: 6px 0;">' + data.firstName + ' ' + data.lastName + '</td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0;"><a href="mailto:' + data.email + '">' + data.email + '</a></td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Phone</td><td style="padding: 6px 0;"><a href="tel:' + data.phone + '">' + data.phone + '</a></td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Preferred Contact</td><td style="padding: 6px 0;">' + data.contactMethod + '</td></tr>' +
    '</table>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<h3 style="color: #333;">Items Ordered</h3>' +
    '<ul style="padding-left: 20px; color: #444;">';
  for (var j = 0; j < data.items.length; j++) {
    htmlBody += '<li style="padding: 4px 0;">' + data.items[j] + '</li>';
  }
  htmlBody += '</ul>' +
    '<p style="font-size: 20px; font-weight: bold; color: #c9a96e;">Total: ' + data.total + '</p>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<div style="text-align: center; margin: 32px 0;">' +
    '<a href="' + confirmUrl + '" style="display: inline-block; padding: 14px 36px; background-color: #5a9a5a; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-right: 12px;">&#10004; Confirm Order</a>' +
    '<a href="' + denyUrl + '" style="display: inline-block; padding: 14px 36px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">&#10006; Deny Order</a>' +
    '</div></div>';

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'New Order ' + orderId + ' — ' + data.firstName + ' ' + data.lastName,
    body: body,
    htmlBody: htmlBody
  });

  return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Quote Request (Other Products "Contact for Pricing") ----

function handleSubmitQuoteRequest(data) {
  var body = 'New Quote Request Received!\n\n' +
    'Product: ' + data.product + '\n' +
    'Date: ' + data.date + '\n\n' +
    'Customer Info:\n' +
    '  Name: ' + data.firstName + ' ' + data.lastName + '\n' +
    '  Email: ' + data.email + '\n' +
    '  Phone: ' + data.phone + '\n' +
    '  Preferred Contact: ' + data.contactMethod + '\n\n' +
    'Description / Size Needed:\n' + data.description;

  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">' +
    '<h2 style="color: #333; margin-top: 0;">New Quote Request</h2>' +
    '<p style="color: #666;"><strong>Product:</strong> ' + data.product + '</p>' +
    '<p style="color: #666;"><strong>Date:</strong> ' + data.date + '</p>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<h3 style="color: #333;">Customer Info</h3>' +
    '<table style="width: 100%; border-collapse: collapse;">' +
    '<tr><td style="padding: 6px 0; color: #888;">Name</td><td style="padding: 6px 0;">' + data.firstName + ' ' + data.lastName + '</td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0;"><a href="mailto:' + data.email + '">' + data.email + '</a></td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Phone</td><td style="padding: 6px 0;"><a href="tel:' + data.phone + '">' + data.phone + '</a></td></tr>' +
    '<tr><td style="padding: 6px 0; color: #888;">Preferred Contact</td><td style="padding: 6px 0;">' + data.contactMethod + '</td></tr>' +
    '</table>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<h3 style="color: #333;">Description / Size Needed</h3>' +
    '<p style="color: #444; white-space: pre-wrap;">' + data.description + '</p>' +
    '</div>';

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Quote Request — ' + data.product + ' — ' + data.firstName + ' ' + data.lastName,
    body: body,
    htmlBody: htmlBody
  });

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Confirm Order ----

function handleConfirmOrder(order) {
  var customerEmail = order.email;
  var customerName = order.firstName + ' ' + order.lastName;
  var orderId = order.orderId;

  // Store confirmed order
  saveConfirmedOrder(order);

  var itemsText = order.items.join('\n');

  // Send confirmation email to customer
  var subject = 'Order Confirmed — ' + orderId + ' | Mitch\'s Hardwoods';
  var body = 'Hi ' + customerName + ',\n\n' +
    'Great news! Your order has been confirmed.\n\n' +
    'Order ID: ' + orderId + '\n\n' +
    'Items:\n' + itemsText + '\n\n' +
    'Total: ' + order.total + '\n\n' +
    'We\'ll be in touch soon regarding payment and delivery details.\n\n' +
    'Thank you for choosing Mitch\'s Hardwoods!\n\n' +
    '— Mitch Palen';

  var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">' +
    '<div style="text-align: center; margin-bottom: 24px;"><span style="display: inline-block; width: 64px; height: 64px; line-height: 64px; background: #5a9a5a; color: white; border-radius: 50%; font-size: 32px;">&#10004;</span></div>' +
    '<h2 style="color: #333; text-align: center; margin-top: 0;">Order Confirmed!</h2>' +
    '<p>Hi ' + customerName + ',</p>' +
    '<p>Great news! Your order has been confirmed.</p>' +
    '<p><strong>Order ID:</strong> ' + orderId + '</p>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<h3 style="color: #333;">Your Items</h3>' +
    '<ul style="padding-left: 20px; color: #444;">';
  for (var i = 0; i < order.items.length; i++) {
    htmlBody += '<li style="padding: 4px 0;">' + order.items[i] + '</li>';
  }
  htmlBody += '</ul>' +
    '<p style="font-size: 20px; font-weight: bold; color: #c9a96e;">Total: ' + order.total + '</p>' +
    '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
    '<p>We\'ll be in touch soon regarding payment and delivery details.</p>' +
    '<p>Thank you for choosing Mitch\'s Hardwoods!</p>' +
    '<p style="color: #888;">— Mitch Palen</p>' +
    '</div>';

  MailApp.sendEmail({
    to: customerEmail,
    subject: subject,
    body: body,
    htmlBody: htmlBody
  });

  // Send confirmation copy to owner
  var scriptUrl = ScriptApp.getService().getUrl();
  var viewOrdersUrl = scriptUrl + '?action=viewOrders&key=' + VIEW_ORDERS_KEY;

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'CONFIRMED: Order ' + orderId + ' — ' + customerName,
    body: 'Order ' + orderId + ' has been confirmed.\n\nCustomer: ' + customerName + '\nEmail: ' + customerEmail + '\nItems: ' + order.items.join(', ') + '\nTotal: ' + order.total + '\n\nView all confirmed orders: ' + viewOrdersUrl,
    htmlBody: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f0fdf0; padding: 32px; border-radius: 12px; border: 2px solid #5a9a5a;">' +
      '<h2 style="color: #5a9a5a; margin-top: 0;">&#10004; Order Confirmed</h2>' +
      '<p><strong>Order ID:</strong> ' + orderId + '</p>' +
      '<p><strong>Customer:</strong> ' + customerName + '</p>' +
      '<p><strong>Email:</strong> ' + customerEmail + '</p>' +
      '<p><strong>Items:</strong> ' + order.items.join(', ') + '</p>' +
      '<p><strong>Total:</strong> ' + order.total + '</p>' +
      '<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">' +
      '<p style="text-align: center;"><a href="' + viewOrdersUrl + '" style="display: inline-block; padding: 12px 28px; background-color: #c9a96e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View All Confirmed Orders</a></p>' +
      '</div>'
  });

  return HtmlService.createHtmlOutput(buildResultPage('Order Confirmed!', 'Confirmation email sent to ' + customerEmail + '. Order saved to your records.', 'success'));
}

// ---- Deny Order ----

function handleDenyOrder(order) {
  return HtmlService.createHtmlOutput(buildResultPage('Order Denied', 'Order ' + order.orderId + ' has been denied. No email was sent to the customer.', 'denied'));
}

// ---- Order Storage (PropertiesService) ----

function saveConfirmedOrder(order) {
  var store = PropertiesService.getScriptProperties();
  var ordersJson = store.getProperty('confirmedOrders') || '[]';
  var orders = JSON.parse(ordersJson);

  order.confirmedAt = new Date().toISOString();
  orders.push(order);

  store.setProperty('confirmedOrders', JSON.stringify(orders));
}

function getConfirmedOrders() {
  var store = PropertiesService.getScriptProperties();
  var ordersJson = store.getProperty('confirmedOrders') || '[]';
  return JSON.parse(ordersJson);
}

// ---- Inventory Email Automation ----

function setupInventoryEmailLabels() {
  ensureGmailLabel(INVENTORY_LABEL_NEW);
  ensureGmailLabel(INVENTORY_LABEL_PROCESSED);
  ensureGmailLabel(INVENTORY_LABEL_ERROR);
}

function getInventoryAdminKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('INVENTORY_ADMIN_KEY');
  if (!key) {
    key = Utilities.getUuid();
    props.setProperty('INVENTORY_ADMIN_KEY', key);
  }
  return key;
}

function sendInventoryAdminLink() {
  var url = ScriptApp.getService().getUrl() + '?action=inventoryAdmin&key=' + encodeURIComponent(getInventoryAdminKey_());
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Inventory Manager Link',
    body: 'Open your private Inventory Manager:\n\n' + url
  });
  Logger.log(url);
}

function requireInventoryAdmin_(key) {
  if (!key || key !== getInventoryAdminKey_()) throw new Error('Unauthorized inventory manager request.');
  var cfg = loadGitHubConfig_();
  if (!cfg.enabled) throw new Error('GitHub is not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO first.');
  return cfg;
}

function getInventoryAdminData(key) {
  var cfg = requireInventoryAdmin_(key);
  var entries = listGitHubDirectory_(cfg, 'images/products/available');
  var manifest = getInventoryManifestFromGitHub_(cfg);
  var metadata = getInventoryMetadataFromGitHub_(cfg);
  var entryByName = {};
  for (var e = 0; e < entries.length; e++) {
    if (entries[e] && entries[e].name) entryByName[entries[e].name] = entries[e];
  }
  var products = {};
  var imagePattern = /^(.+)-(\d+(?:\.\d{1,2})?)-(\d+)-([A-Za-z0-9]+)(?:-(\d+))?\.(jpe?g|png|webp)$/i;

  for (var i = 0; i < manifest.length; i++) {
    var fileName = String(manifest[i] || '');
    var entry = entryByName[fileName];
    var match = fileName.match(imagePattern);
    if (!match) continue;
    var number = match[4];
    if (!products[number]) {
      var productMeta = metadata[String(number).toLowerCase()] || {};
      products[number] = {
        productNum: number,
        name: match[1],
        price: parseFloat(match[2]),
        qty: parseInt(match[3], 10),
        type: productMeta.type || 'cutting-board',
        preAdded: productMeta.preAdded || {},
        images: [],
        imageUrls: []
      };
    }
    products[number].images.push(fileName);
    products[number].imageUrls.push(entry && entry.download_url ? entry.download_url : '');
  }
  return Object.keys(products).map(function (number) { return products[number]; }).sort(function (a, b) {
    return String(a.productNum).localeCompare(String(b.productNum), undefined, { numeric: true });
  });
}

function saveInventoryAdminProduct(data, key) {
  var cfg = requireInventoryAdmin_(key);
  data = data || {};
  var productNum = String(data.productNum || '').trim();
  if (!productNum) productNum = getNextInventoryProductNumber_(cfg);
  if (!/^[A-Za-z0-9]+$/.test(productNum)) throw new Error('Product number must contain only letters and numbers.');
  var name = String(data.name || '').trim();
  var price = Number(data.price);
  var qty = Number(data.qty);
  var type = String(data.type || 'cutting-board').toLowerCase();
  if (!name || !isFinite(price) || price <= 0 || !isFinite(qty) || qty <= 0 || Math.floor(qty) !== qty) throw new Error('Name, price, and quantity are required.');
  if (['cutting-board', 'charcuterie', 'other'].indexOf(type) === -1) throw new Error('Invalid product type.');

  var images = Array.isArray(data.images) ? data.images : [];
  var blobs = [];
  for (var i = 0; i < images.length; i++) {
    var image = images[i] || {};
    if (!image.base64) continue;
    blobs.push(Utilities.newBlob(Utilities.base64Decode(image.base64), image.mimeType || 'image/jpeg', image.name || ('product-' + (i + 1) + '.jpg')));
  }

  updateInventoryOnGitHub_(cfg, { productNum: productNum, name: name, price: price, qty: qty }, blobs);
  updateInventoryMetadataOnGitHub_(cfg, productNum, {
    type: type,
    preAdded: { juiceGroove: !!data.juiceGroove, handles: !!data.handles, feet: !!data.feet },
    typeSpecified: true,
    preAddedSpecified: true
  });
  return { success: true, productNum: productNum };
}

function removeInventoryAdminProduct(productNum, key) {
  var cfg = requireInventoryAdmin_(key);
  var result = removeInventoryByProductNumberOnGitHub_(cfg, String(productNum || '').trim());
  if (!result.removedCount) throw new Error('No inventory images found for Product #' + productNum + '.');
  return { success: true };
}

function getInventoryMetadataFromGitHub_(cfg) {
  var existing = getGitHubFileIfExists_(cfg, 'images/products/available/inventory-metadata.json');
  if (!existing || !existing.content) return {};
  try {
    var records = JSON.parse(Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString());
    return records && typeof records === 'object' ? records : {};
  } catch (e) {
    return {};
  }
}

function processInventoryInbox() {
  setupInventoryEmailLabels();

  var labelNew = GmailApp.getUserLabelByName(INVENTORY_LABEL_NEW);
  var labelProcessed = GmailApp.getUserLabelByName(INVENTORY_LABEL_PROCESSED);
  var labelError = GmailApp.getUserLabelByName(INVENTORY_LABEL_ERROR);

  var query = '(label:"' + INVENTORY_LABEL_NEW + '" OR to:' + INVENTORY_EMAIL + ')' +
    ' -label:"' + INVENTORY_LABEL_PROCESSED + '" -label:"' + INVENTORY_LABEL_ERROR + '"';
  var threads = GmailApp.search(query, 0, 20);
  var processedCount = 0;
  var errorCount = 0;
  var details = [];

  for (var t = 0; t < threads.length; t++) {
    var thread = threads[t];
    var messages = thread.getMessages();
    if (!messages || messages.length === 0) continue;

    var message = messages[messages.length - 1];
    var subject = message.getSubject() || '';

    try {
      var parsed = parseInventorySubject(subject);
      var isUpdateSubject = /^\s*UPDATE\s*\|/i.test(subject);
      var github = loadGitHubConfig_();
      var actionSummary = '';

      if (parsed) {
        var productAssignment = resolveInventoryProductNumber_(parsed, github);
        parsed.productNum = productAssignment.productNum;
        var inventoryMetadata = parseInventoryMetadata_(message.getPlainBody ? message.getPlainBody() : '');

        var imageBlobs = getImageAttachments(message);
        if (!imageBlobs || imageBlobs.length === 0) {
          throw new Error('No image attachment found. Attach at least one JPG, PNG, or WEBP image.');
        }

        var fileNames = [];
        for (var a = 0; a < imageBlobs.length; a++) {
          var ext = getExtensionFromBlob(imageBlobs[a]);
          var fileName = buildInventoryFileName(parsed, ext, a + 1, imageBlobs.length);
          fileNames.push(fileName);
        }

        var pushed = false;
        if (github.enabled) {
          for (var gi = 0; gi < imageBlobs.length; gi++) {
            pushInventoryImageToGitHub_(github, fileNames[gi], imageBlobs[gi]);
          }
          updateInventoryManifestOnGitHub_(github, fileNames);
          updateInventoryMetadataOnGitHub_(github, parsed.productNum, inventoryMetadata);
          pushed = true;
        }

        actionSummary =
          'Inventory email processed successfully.\n\n' +
          'Action: Add / Update Board\n' +
          'Product #: ' + parsed.productNum + (productAssignment.wasAutoAssigned ? ' (auto-assigned)' : '') + '\n' +
          'Generated filename(s):\n- ' + fileNames.join('\n- ') + '\n' +
          (pushed
            ? 'Status: Images + manifest pushed to GitHub.'
            : 'Status: GitHub push skipped (configure script properties to enable auto-publish).') + '\n\n' +
          'Original email subject: ' + subject;

        details.push({ action: 'add', subject: subject, productNumber: parsed.productNum, autoAssigned: productAssignment.wasAutoAssigned, fileNames: fileNames, pushedToGitHub: pushed });
        logInventoryHistory_({
          action: 'add',
          productNumber: parsed.productNum,
          subject: subject,
          fileNames: fileNames,
          autoAssigned: productAssignment.wasAutoAssigned,
          pushedToGitHub: pushed,
          status: 'success'
        });
      } else if (isUpdateSubject) {
        var updateInfo = parseInventoryUpdateCommand(message);
        if (!updateInfo) {
          throw new Error('Invalid UPDATE subject. Use format: UPDATE | ProductNumber with body: Name | Price | Quantity. Optional lines: Type: cutting-board|charcuterie|other and Pre-added: Juice Groove, Handles, Feet.');
        }
        if (!github.enabled) {
          throw new Error('GitHub is not configured. Product update requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO script properties.');
        }

        var imageBlobsForUpdate = getImageAttachments(message);
        var updateResult = updateInventoryOnGitHub_(github, updateInfo, imageBlobsForUpdate);
        updateInventoryMetadataOnGitHub_(github, updateInfo.productNum, updateInfo.metadata);

        actionSummary =
          'Inventory email processed successfully.\n\n' +
          'Action: Update Board\n' +
          'Product #: ' + updateInfo.productNum + '\n' +
          'Name: ' + updateInfo.name + '\n' +
          'Price: ' + updateInfo.price + '\n' +
          'Quantity: ' + updateInfo.qty + '\n' +
          (imageBlobsForUpdate.length > 0
            ? 'New image(s) saved as:\n- ' + updateResult.fileNames.join('\n- ')
            : 'Existing image(s) renamed to:\n- ' + updateResult.fileNames.join('\n- ')) + '\n\n' +
          'Original email subject: ' + subject;

        details.push({ action: 'update', subject: subject, productNumber: updateInfo.productNum, fileNames: updateResult.fileNames, removedFiles: updateResult.removedFiles });
        logInventoryHistory_({
          action: 'update',
          productNumber: updateInfo.productNum,
          subject: subject,
          fileNames: updateResult.fileNames,
          removedFiles: updateResult.removedFiles,
          status: 'success'
        });
      } else {
        var removal = parseInventoryRemovalCommand(message);
        if (!removal) {
          throw new Error('Invalid inventory email. Use add: Name | Price | Qty | ProductNumber (ProductNumber optional), update: UPDATE | ProductNumber, remove: REMOVE | ProductNumber, or sold: SOLD | ProductNumber.');
        }
        if (!github.enabled) {
          throw new Error('GitHub is not configured. Product removal requires GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO script properties.');
        }

        var removed = removeInventoryByProductNumberOnGitHub_(github, removal.productNum);
        if (removed.removedCount === 0) {
          throw new Error('No inventory files found for Product #' + removal.productNum + '.');
        }

        if (removal.action === 'sold') {
          recordSoldInventory_(removal.productNum, removed.removedFiles, message.getSubject());
        }

        actionSummary =
          'Inventory email processed successfully.\n\n' +
          'Action: ' + (removal.action === 'sold' ? 'Mark as Sold + Remove Board' : 'Remove Board') + '\n' +
          'Product #: ' + removal.productNum + '\n' +
          'Removed images: ' + removed.removedCount + '\n' +
          'Removed from manifest: ' + removed.removedFromManifest + '\n\n' +
          'Original email subject: ' + subject;

        details.push({ action: removal.action, subject: subject, productNumber: removal.productNum, removedCount: removed.removedCount, removedFromManifest: removed.removedFromManifest, removedFiles: removed.removedFiles });
        logInventoryHistory_({
          action: removal.action,
          productNumber: removal.productNum,
          subject: subject,
          removedCount: removed.removedCount,
          removedFromManifest: removed.removedFromManifest,
          removedFiles: removed.removedFiles,
          status: 'success'
        });
      }

      MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: 'Inventory Processed',
        body: actionSummary
      });

      thread.removeLabel(labelNew);
      thread.removeLabel(labelError);
      thread.addLabel(labelProcessed);
      thread.markRead();

      processedCount += 1;
    } catch (err) {
      var errorBody =
        'Inventory email could not be processed.\n\n' +
        'Error: ' + err.message + '\n\n' +
        'Expected formats:\n' +
        '1) Add board: Name | Price | Qty | ProductNumber (ProductNumber optional)\n' +
        '2) Update board: UPDATE | ProductNumber (body: Name | Price | Quantity; optional Type and Pre-added lines)\n' +
        '3) Remove board: REMOVE | ProductNumber\n' +
        '4) Sold board: SOLD | ProductNumber\n\n' +
        'Examples:\n' +
        'Walnut with Wenge and Maple Stripe | 100 | 1 | 0003\n' +
        'Walnut with Wenge and Maple Stripe | 100 | 1 |\n' +
        'UPDATE | 0003\n' +
        '  Walnut and Padauk | 125 | 2\n' +
        'REMOVE | 0003\n' +
        'SOLD | 0003\n\n' +
        'Attach one or more images. Multiple images will be saved as -01, -02, etc. Attaching new images on an UPDATE email replaces the existing ones; leaving images off keeps the existing photos.\n\n' +
        'Original subject:\n' + subject;

      MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: 'Inventory Processing Error',
        body: errorBody
      });

      thread.addLabel(labelError);
      thread.markRead();

      errorCount += 1;
      details.push({ subject: subject, error: String(err.message || err) });
      logInventoryHistory_({
        action: 'error',
        productNumber: '',
        subject: subject,
        error: String(err.message || err),
        status: 'error'
      });
    }
  }

  return {
    checkedThreads: threads.length,
    processed: processedCount,
    errors: errorCount,
    details: details
  };
}

function parseInventorySubject(subject) {
  var parts = String(subject || '').split('|').map(function (p) { return p.trim(); });
  if (parts.length < 3 || parts.length > 4) return null;

  var name = parts[0];
  var priceNum = parseFloat(parts[1]);
  var qtyNum = parseInt(parts[2], 10);
  var productNum = parts.length === 4 ? parts[3] : '';

  if (!name) return null;
  if (/^(remove|sold)\b/i.test(name)) return null;
  if (isNaN(priceNum) || priceNum <= 0) return null;
  if (isNaN(qtyNum) || qtyNum <= 0) return null;
  if (productNum && !/^[A-Za-z0-9]+$/.test(productNum)) return null;

  return {
    name: name,
    price: priceNum,
    qty: qtyNum,
    productNum: productNum
  };
}

function parseInventoryRemovalCommand(message) {
  var subject = String(message.getSubject() || '').trim();
  var body = String(message.getPlainBody ? message.getPlainBody() : '').trim();
  var combined = subject + '\n' + body;

  var direct = subject.match(/^\s*(REMOVE|SOLD)\s*\|\s*([A-Za-z0-9]+)\s*$/i);
  if (direct) {
    return {
      action: direct[1].toLowerCase() === 'sold' ? 'sold' : 'remove',
      productNum: direct[2]
    };
  }

  var explicit = combined.match(/(?:^|\b)(remove|sold|sold\s*out|delete)\s*[|:#-]*\s*([A-Za-z0-9]+)(?:\b|$)/i);
  if (explicit && explicit[2]) {
    var keyword = explicit[1].toLowerCase();
    return {
      action: keyword.indexOf('sold') === 0 ? 'sold' : 'remove',
      productNum: explicit[2]
    };
  }

  return null;
}

function parseInventoryUpdateCommand(message) {
  var subject = String(message.getSubject() || '').trim();
  var subjectMatch = subject.match(/^\s*UPDATE\s*\|\s*([A-Za-z0-9]+)\s*$/i);
  if (!subjectMatch) return null;

  var body = String(message.getPlainBody ? message.getPlainBody() : '');
  var bodyLine = body.split(/\r?\n/).filter(function (line) { return line.trim(); })[0] || '';
  var parts = bodyLine.split('|').map(function (part) { return part.trim(); });

  if (parts.length !== 3 || !parts[0] || !/^\$?\d+(?:\.\d{1,2})?$/.test(parts[1]) || !/^\d+$/.test(parts[2])) {
    throw new Error('UPDATE email body must use the format "Name | Price | Quantity" (e.g. "Walnut and Padauk | 125 | 2").');
  }

  var priceNum = parseFloat(parts[1].replace('$', ''));
  var qtyNum = parseInt(parts[2], 10);
  if (isNaN(priceNum) || priceNum <= 0) {
    throw new Error('UPDATE email Price must be a positive number.');
  }
  if (isNaN(qtyNum) || qtyNum <= 0) {
    throw new Error('UPDATE email Quantity must be a positive whole number.');
  }

  return {
    productNum: subjectMatch[1],
    name: parts[0],
    price: priceNum,
    qty: qtyNum,
    metadata: parseInventoryMetadata_(body)
  };
}

function parseInventoryMetadata_(body) {
  var text = String(body || '');
  var typeMatch = text.match(/^\s*type\s*:\s*(cutting-board|charcuterie|other)\s*$/im);
  var optionsMatch = text.match(/^\s*pre-added\s*:\s*(.*?)\s*$/im);
  var optionsText = optionsMatch ? optionsMatch[1].toLowerCase() : '';
  return {
    type: typeMatch ? typeMatch[1].toLowerCase() : 'cutting-board',
    preAdded: {
      juiceGroove: /juice\s*groove/.test(optionsText),
      handles: /handles?/.test(optionsText),
      feet: /feet/.test(optionsText)
    },
    typeSpecified: !!typeMatch,
    preAddedSpecified: !!optionsMatch
  };
}

function updateInventoryOnGitHub_(cfg, updateInfo, imageBlobs) {
  var dirPath = 'images/products/available';
  var normalizedProduct = String(updateInfo.productNum || '').toLowerCase();
  var imagePattern = /^.+-\d+(?:\.\d{1,2})?-\d+-([A-Za-z0-9]+)(?:-(\d+))?\.(?:jpe?g|png|webp)$/i;
  var entries = listGitHubDirectory_(cfg, dirPath);
  var existingFiles = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry || entry.type !== 'file') continue;
    var m = String(entry.name || '').match(imagePattern);
    if (!m) continue;
    if (String(m[1]).toLowerCase() === normalizedProduct) {
      existingFiles.push({ entry: entry, index: m[2] ? parseInt(m[2], 10) : 1 });
    }
  }
  existingFiles.sort(function (a, b) { return a.index - b.index; });

  var newParsed = { name: updateInfo.name, price: updateInfo.price, qty: updateInfo.qty, productNum: updateInfo.productNum };
  var newFileNames = [];

  if (imageBlobs && imageBlobs.length > 0) {
    // Replace all existing photos with the newly attached ones
    for (var d = 0; d < existingFiles.length; d++) {
      deleteGitHubFile_(cfg, existingFiles[d].entry.path, existingFiles[d].entry.sha, 'Remove old inventory image before update: ' + existingFiles[d].entry.name);
    }

    for (var a = 0; a < imageBlobs.length; a++) {
      var ext = getExtensionFromBlob(imageBlobs[a]);
      var fileName = buildInventoryFileName(newParsed, ext, a + 1, imageBlobs.length);
      pushInventoryImageToGitHub_(cfg, fileName, imageBlobs[a]);
      newFileNames.push(fileName);
    }
  } else {
    if (existingFiles.length === 0) {
      throw new Error('No existing inventory images found for Product #' + updateInfo.productNum + '. Attach at least one image to add it as new.');
    }

    // No new photos attached: keep existing photos, just rename them to reflect the new Name/Price/Qty
    for (var e = 0; e < existingFiles.length; e++) {
      var oldEntry = existingFiles[e].entry;
      var extMatch = String(oldEntry.name).match(/\.(jpe?g|png|webp)$/i);
      var oldExt = extMatch ? (extMatch[1].toLowerCase() === 'jpeg' ? 'jpg' : extMatch[1].toLowerCase()) : 'jpg';
      var newFileName = buildInventoryFileName(newParsed, oldExt, e + 1, existingFiles.length);
      if (newFileName !== oldEntry.name) {
        copyGitHubFile_(cfg, oldEntry.path, dirPath + '/' + newFileName, 'Rename inventory image for update: ' + oldEntry.name + ' -> ' + newFileName);
        deleteGitHubFile_(cfg, oldEntry.path, oldEntry.sha, 'Remove old inventory image after rename: ' + oldEntry.name);
      }
      newFileNames.push(newFileName);
    }
  }

  removeInventoryFromManifestOnGitHub_(cfg, normalizedProduct);
  updateInventoryManifestOnGitHub_(cfg, newFileNames);

  return {
    fileNames: newFileNames,
    removedFiles: existingFiles.map(function (f) { return f.entry.name; })
  };
}

function copyGitHubFile_(cfg, oldPath, newPath, message) {
  var existing = getGitHubFileIfExists_(cfg, oldPath);
  if (!existing || !existing.content) {
    throw new Error('Could not read existing file to copy: ' + oldPath);
  }

  var payload = {
    message: message || ('Copy ' + oldPath + ' to ' + newPath),
    content: existing.content.replace(/\n/g, ''),
    branch: cfg.branch
  };

  var existingAtNewPath = getGitHubFileIfExists_(cfg, newPath);
  if (existingAtNewPath && existingAtNewPath.sha) payload.sha = existingAtNewPath.sha;

  putGitHubFile_(cfg, newPath, payload);
}

function resolveInventoryProductNumber_(parsed, github) {
  var candidate = String(parsed.productNum || '').trim();
  if (candidate) {
    rememberInventoryProductNumber_(candidate);
    return { productNum: candidate, wasAutoAssigned: false };
  }
  var nextNum = getNextInventoryProductNumber_(github);
  return { productNum: nextNum, wasAutoAssigned: true };
}

function getNextInventoryProductNumber_(github) {
  var props = PropertiesService.getScriptProperties();
  var initialized = props.getProperty('INVENTORY_LAST_PRODUCT_NUMBER_INITIALIZED') === '1';
  if (!initialized) {
    var maxKnown = getMaxKnownInventoryProductNumber_(github);
    props.setProperty('INVENTORY_LAST_PRODUCT_NUMBER', String(maxKnown));
    props.setProperty('INVENTORY_LAST_PRODUCT_NUMBER_INITIALIZED', '1');
  }

  var last = parseInt(props.getProperty('INVENTORY_LAST_PRODUCT_NUMBER') || '0', 10);
  if (isNaN(last) || last < 0) last = 0;
  var next = last + 1;
  props.setProperty('INVENTORY_LAST_PRODUCT_NUMBER', String(next));
  return formatInventoryProductNumber_(next);
}

function rememberInventoryProductNumber_(productNum) {
  var n = parseInt(String(productNum), 10);
  if (isNaN(n) || n < 0) return;
  var props = PropertiesService.getScriptProperties();
  var last = parseInt(props.getProperty('INVENTORY_LAST_PRODUCT_NUMBER') || '0', 10);
  if (isNaN(last) || n > last) {
    props.setProperty('INVENTORY_LAST_PRODUCT_NUMBER', String(n));
  }
  props.setProperty('INVENTORY_LAST_PRODUCT_NUMBER_INITIALIZED', '1');
}

function getMaxKnownInventoryProductNumber_(github) {
  var maxNum = 0;
  var sold = getSoldInventoryRecords_();
  for (var i = 0; i < sold.length; i++) {
    var sn = parseInt(String(sold[i].productNumber || ''), 10);
    if (!isNaN(sn) && sn > maxNum) maxNum = sn;
  }

  if (github && github.enabled) {
    var manifest = getInventoryManifestFromGitHub_(github);
    var re = /^.+-\d+(?:\.\d{1,2})?-\d+-([A-Za-z0-9]+)(?:-(\d+))?\.(?:jpe?g|png|webp)$/i;
    for (var m = 0; m < manifest.length; m++) {
      var mm = String(manifest[m] || '').match(re);
      if (!mm || !mm[1]) continue;
      var n = parseInt(String(mm[1]), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  }

  return maxNum;
}

function formatInventoryProductNumber_(num) {
  var s = String(num);
  while (s.length < 4) s = '0' + s;
  return s;
}

function getImageAttachments(message) {
  var attachments = message.getAttachments({ includeInlineImages: false, includeAttachments: true });
  var images = [];
  for (var i = 0; i < attachments.length; i++) {
    var blob = attachments[i];
    var contentType = String(blob.getContentType() || '').toLowerCase();
    if (contentType.indexOf('image/') === 0) {
      images.push(blob);
      continue;
    }
    var name = String(blob.getName() || '').toLowerCase();
    if (/\.(jpg|jpeg|png|webp)$/.test(name)) {
      images.push(blob);
    }
  }
  return images;
}

function getExtensionFromBlob(blob) {
  var contentType = String(blob.getContentType() || '').toLowerCase();
  if (contentType === 'image/jpeg' || contentType === 'image/jpg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';

  var name = String(blob.getName() || '').toLowerCase();
  var m = name.match(/\.(jpg|jpeg|png|webp)$/);
  if (!m) return 'jpg';
  return m[1] === 'jpeg' ? 'jpg' : m[1];
}

function buildInventoryFileName(parsed, extension, imageIndex, totalImages) {
  var safeName = parsed.name
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  var priceStr = Number(parsed.price).toFixed(2).replace(/\.00$/, '');
  var baseName = safeName + '-' + priceStr + '-' + parsed.qty + '-' + parsed.productNum;
  if ((totalImages || 0) > 1) {
    var idx = Number(imageIndex || 1);
    var idxStr = idx < 10 ? ('0' + idx) : String(idx);
    return baseName + '-' + idxStr + '.' + extension;
  }
  return baseName + '.' + extension;
}

function ensureGmailLabel(name) {
  var lbl = GmailApp.getUserLabelByName(name);
  if (!lbl) GmailApp.createLabel(name);
}

function loadGitHubConfig_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GITHUB_TOKEN') || '';
  var owner = props.getProperty('GITHUB_OWNER') || '';
  var repo = props.getProperty('GITHUB_REPO') || '';
  var branch = props.getProperty('GITHUB_BRANCH') || 'main';
  return {
    enabled: !!(token && owner && repo),
    token: token,
    owner: owner,
    repo: repo,
    branch: branch
  };
}

function getInventoryManifestFromGitHub_(cfg) {
  var path = 'images/products/available/inventory-manifest.json';
  var existing = getGitHubFileIfExists_(cfg, path);
  if (!existing || !existing.content) return [];
  var decoded = Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString();
  try {
    var parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function pushInventoryImageToGitHub_(cfg, fileName, blob) {
  var path = 'images/products/available/' + fileName;
  var bytes = blob.getBytes();
  var b64 = Utilities.base64Encode(bytes);
  var existing = getGitHubFileIfExists_(cfg, path);

  var payload = {
    message: 'Add inventory image: ' + fileName,
    content: b64,
    branch: cfg.branch
  };
  if (existing && existing.sha) payload.sha = existing.sha;

  putGitHubFile_(cfg, path, payload);
}

function updateInventoryManifestOnGitHub_(cfg, fileNames) {
  var path = 'images/products/available/inventory-manifest.json';
  var existing = getGitHubFileIfExists_(cfg, path);
  var list = [];

  if (existing && existing.content) {
    var decoded = Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString();
    try {
      var parsed = JSON.parse(decoded);
      if (parsed && parsed.push) list = parsed;
    } catch (e) {
      list = [];
    }
  }

  var incoming = Array.isArray(fileNames) ? fileNames : [fileNames];
  for (var i = 0; i < incoming.length; i++) {
    if (list.indexOf(incoming[i]) === -1) {
      list.push(incoming[i]);
    }
  }

  list.sort(function (a, b) {
    var re = /^.+-\d+(?:\.\d{1,2})?-\d+-([A-Za-z0-9]+)(?:-(\d+))?\.(?:jpe?g|png|webp)$/i;
    var ma = a.match(re);
    var mb = b.match(re);
    var ka = ma ? ma[1] : a;
    var kb = mb ? mb[1] : b;
    var cmp = ka.localeCompare(kb, undefined, { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    var ia = ma && ma[2] ? parseInt(ma[2], 10) : 1;
    var ib = mb && mb[2] ? parseInt(mb[2], 10) : 1;
    return ia - ib;
  });

  var manifestText = JSON.stringify(list, null, 2) + '\n';
  var payload = {
    message: 'Update inventory manifest',
    content: Utilities.base64Encode(manifestText),
    branch: cfg.branch
  };
  if (existing && existing.sha) payload.sha = existing.sha;

  putGitHubFile_(cfg, path, payload);
}

function removeInventoryByProductNumberOnGitHub_(cfg, productNumber) {
  var dirPath = 'images/products/available';
  var entries = listGitHubDirectory_(cfg, dirPath);
  var normalizedProduct = String(productNumber || '').toLowerCase();
  var imagePattern = /^.+-\d+(?:\.\d{1,2})?-\d+-([A-Za-z0-9]+)(?:-(\d+))?\.(?:jpe?g|png|webp)$/i;
  var toDelete = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry || entry.type !== 'file') continue;
    var m = String(entry.name || '').match(imagePattern);
    if (!m) continue;
    if (String(m[1]).toLowerCase() === normalizedProduct) {
      toDelete.push(entry);
    }
  }

  for (var d = 0; d < toDelete.length; d++) {
    deleteGitHubFile_(cfg, toDelete[d].path, toDelete[d].sha, 'Remove inventory image: ' + toDelete[d].name);
  }

  var removedFromManifest = removeInventoryFromManifestOnGitHub_(cfg, normalizedProduct);
  removeInventoryMetadataOnGitHub_(cfg, normalizedProduct);

  return {
    removedCount: toDelete.length,
    removedFromManifest: removedFromManifest,
    removedFiles: toDelete.map(function (entry) { return entry.name; })
  };
}

function updateInventoryMetadataOnGitHub_(cfg, productNumber, metadata) {
  var path = 'images/products/available/inventory-metadata.json';
  var existing = getGitHubFileIfExists_(cfg, path);
  var records = {};
  if (existing && existing.content) {
    try {
      records = JSON.parse(Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString());
      if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
    } catch (e) {
      records = {};
    }
  }
  var key = String(productNumber).toLowerCase();
  var previous = records[key] || {};
  var incoming = metadata || parseInventoryMetadata_('');
  records[key] = {
    type: incoming.typeSpecified || !previous.type ? incoming.type : previous.type,
    preAdded: incoming.preAddedSpecified || !previous.preAdded ? incoming.preAdded : (previous.preAdded || {})
  };
  var payload = {
    message: 'Update inventory metadata for product #' + productNumber,
    content: Utilities.base64Encode(JSON.stringify(records, null, 2) + '\n'),
    branch: cfg.branch
  };
  if (existing && existing.sha) payload.sha = existing.sha;
  putGitHubFile_(cfg, path, payload);
}

function removeInventoryMetadataOnGitHub_(cfg, productNumber) {
  var path = 'images/products/available/inventory-metadata.json';
  var existing = getGitHubFileIfExists_(cfg, path);
  if (!existing || !existing.content) return;
  var records;
  try {
    records = JSON.parse(Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString());
  } catch (e) {
    return;
  }
  var key = String(productNumber).toLowerCase();
  if (!records || !records[key]) return;
  delete records[key];
  putGitHubFile_(cfg, path, {
    message: 'Remove inventory metadata for product #' + productNumber,
    content: Utilities.base64Encode(JSON.stringify(records, null, 2) + '\n'),
    branch: cfg.branch,
    sha: existing.sha
  });
}

function recordSoldInventory_(productNumber, removedFiles, sourceSubject) {
  var props = PropertiesService.getScriptProperties();
  var key = 'soldInventoryRecords';
  var raw = props.getProperty(key) || '[]';
  var list = [];
  try {
    list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [];
  } catch (e) {
    list = [];
  }

  list.push({
    productNumber: String(productNumber),
    soldAt: new Date().toISOString(),
    removedFiles: removedFiles || [],
    sourceSubject: String(sourceSubject || '')
  });

  props.setProperty(key, JSON.stringify(list));
  rememberInventoryProductNumber_(productNumber);
}

function getSoldInventoryRecords_() {
  var raw = PropertiesService.getScriptProperties().getProperty('soldInventoryRecords') || '[]';
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function getInventoryHistoryAccessKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('INVENTORY_HISTORY_KEY');
  if (!key) {
    key = INVENTORY_HISTORY_DEFAULT_KEY;
    props.setProperty('INVENTORY_HISTORY_KEY', key);
  }
  return key;
}

function logInventoryHistory_(entry) {
  var props = PropertiesService.getScriptProperties();
  var key = 'inventoryHistoryLog';
  var raw = props.getProperty(key) || '[]';
  var list = [];
  try {
    list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [];
  } catch (e) {
    list = [];
  }

  list.push({
    at: new Date().toISOString(),
    action: String(entry.action || ''),
    status: String(entry.status || 'success'),
    productNumber: String(entry.productNumber || ''),
    subject: String(entry.subject || ''),
    fileNames: Array.isArray(entry.fileNames) ? entry.fileNames : [],
    removedFiles: Array.isArray(entry.removedFiles) ? entry.removedFiles : [],
    removedCount: Number(entry.removedCount || 0),
    removedFromManifest: Number(entry.removedFromManifest || 0),
    autoAssigned: !!entry.autoAssigned,
    pushedToGitHub: !!entry.pushedToGitHub,
    error: String(entry.error || '')
  });

  props.setProperty(key, JSON.stringify(list));
}

function getInventoryHistoryLog_() {
  var raw = PropertiesService.getScriptProperties().getProperty('inventoryHistoryLog') || '[]';
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function buildInventoryHistoryDashboard(accessKey) {
  var history = getInventoryHistoryLog_();
  var soldRecords = getSoldInventoryRecords_();
  var totalAdds = 0;
  var totalUpdates = 0;
  var totalRemoves = 0;
  var totalSold = 0;
  var totalErrors = 0;

  for (var i = 0; i < history.length; i++) {
    var action = String(history[i].action || '').toLowerCase();
    if (action === 'add') totalAdds += 1;
    if (action === 'update') totalUpdates += 1;
    if (action === 'remove') totalRemoves += 1;
    if (action === 'sold') totalSold += 1;
    if (action === 'error') totalErrors += 1;
  }

  var scriptUrl = ScriptApp.getService().getUrl();
  var csvUrl = scriptUrl + '?action=exportInventoryHistoryCsv&key=' + encodeURIComponent(accessKey);

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Inventory History | Mitch\'s Hardwoods</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;margin:0;padding:24px;}' +
    '.wrap{max-width:1100px;margin:0 auto;}' +
    'h1{color:#c9a96e;margin:0 0 8px;font-size:28px;}' +
    '.sub{color:rgba(255,255,255,.6);margin-bottom:20px;}' +
    '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;}' +
    '.stat{background:#141414;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:14px;}' +
    '.stat .label{font-size:12px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px;}' +
    '.stat .value{font-size:24px;color:#fff;font-weight:700;}' +
    '.actions{margin:12px 0 20px;}' +
    '.btn{display:inline-block;padding:10px 16px;border-radius:8px;text-decoration:none;background:#c9a96e;color:#111;font-weight:700;}' +
    '.table{width:100%;border-collapse:collapse;background:#141414;border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden;}' +
    '.table th,.table td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px;text-align:left;vertical-align:top;}' +
    '.table th{background:#1b1b1b;color:rgba(255,255,255,.75);font-weight:600;}' +
    '.pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;}' +
    '.pill-add{background:#21452a;color:#8dd39e;}' +
    '.pill-update{background:#1f3a52;color:#8ec9f6;}' +
    '.pill-remove{background:#4b2d12;color:#f6c690;}' +
    '.pill-sold{background:#3b234d;color:#d8b4fe;}' +
    '.pill-error{background:#4b1d1d;color:#ffb4b4;}' +
    '.muted{color:rgba(255,255,255,.55);font-size:12px;}' +
    '.empty{padding:24px;text-align:center;color:rgba(255,255,255,.5);}' +
    '</style></head><body><div class="wrap">' +
    '<h1>Inventory History</h1>' +
    '<p class="sub">Full historical log of add, update, remove, sold, and error events.</p>' +
    '<div class="stats">' +
      '<div class="stat"><div class="label">Adds</div><div class="value">' + totalAdds + '</div></div>' +
      '<div class="stat"><div class="label">Updates</div><div class="value">' + totalUpdates + '</div></div>' +
      '<div class="stat"><div class="label">Removes</div><div class="value">' + totalRemoves + '</div></div>' +
      '<div class="stat"><div class="label">Sold</div><div class="value">' + totalSold + '</div></div>' +
      '<div class="stat"><div class="label">Errors</div><div class="value">' + totalErrors + '</div></div>' +
      '<div class="stat"><div class="label">Sold Records</div><div class="value">' + soldRecords.length + '</div></div>' +
    '</div>' +
    '<div class="actions"><a class="btn" href="' + csvUrl + '">Download CSV</a></div>';

  if (history.length === 0) {
    html += '<div class="empty">No inventory history has been recorded yet.</div>';
  } else {
    html += '<table class="table"><thead><tr>' +
      '<th>Date/Time</th><th>Action</th><th>Product #</th><th>Details</th><th>Status</th>' +
      '</tr></thead><tbody>';

    for (var h = history.length - 1; h >= 0; h--) {
      var row = history[h];
      var actionLabel = String(row.action || '').toLowerCase();
      var pillClass = actionLabel === 'add' ? 'pill-add' : (actionLabel === 'update' ? 'pill-update' : (actionLabel === 'remove' ? 'pill-remove' : (actionLabel === 'sold' ? 'pill-sold' : 'pill-error')));
      var dt = row.at ? new Date(row.at).toLocaleString() : 'N/A';
      var detailParts = [];
      if (row.fileNames && row.fileNames.length) detailParts.push('files: ' + row.fileNames.join(', '));
      if (row.removedFiles && row.removedFiles.length) detailParts.push('removed: ' + row.removedFiles.join(', '));
      if (row.autoAssigned) detailParts.push('auto-assigned product#');
      if (row.removedCount) detailParts.push('removedCount=' + row.removedCount);
      if (row.error) detailParts.push('error=' + row.error);
      if (row.subject) detailParts.push('subject=' + row.subject);

      html += '<tr>' +
        '<td>' + dt + '</td>' +
        '<td><span class="pill ' + pillClass + '">' + escapeHtmlText_(actionLabel || 'unknown') + '</span></td>' +
        '<td>' + escapeHtmlText_(row.productNumber || '') + '</td>' +
        '<td class="muted">' + escapeHtmlText_(detailParts.join(' | ')) + '</td>' +
        '<td>' + escapeHtmlText_(row.status || '') + '</td>' +
      '</tr>';
    }
    html += '</tbody></table>';
  }

  html += '</div></body></html>';
  return html;
}

function buildInventoryHistoryCsv() {
  var history = getInventoryHistoryLog_();
  var rows = [
    [
      'at', 'action', 'status', 'productNumber', 'subject', 'fileNames', 'removedFiles', 'removedCount', 'removedFromManifest', 'autoAssigned', 'pushedToGitHub', 'error'
    ]
  ];

  for (var i = 0; i < history.length; i++) {
    var r = history[i];
    rows.push([
      r.at || '',
      r.action || '',
      r.status || '',
      r.productNumber || '',
      r.subject || '',
      (r.fileNames || []).join('; '),
      (r.removedFiles || []).join('; '),
      String(r.removedCount || 0),
      String(r.removedFromManifest || 0),
      r.autoAssigned ? 'true' : 'false',
      r.pushedToGitHub ? 'true' : 'false',
      r.error || ''
    ]);
  }

  return toCsv_(rows);
}

function toCsv_(rows) {
  return rows.map(function (row) {
    return row.map(function (cell) {
      var val = String(cell == null ? '' : cell);
      if (/[,"\n]/.test(val)) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',');
  }).join('\n');
}

function escapeHtmlText_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendInventoryHistoryLink() {
  var key = getInventoryHistoryAccessKey_();
  var url = ScriptApp.getService().getUrl() + '?action=viewInventoryHistory&key=' + encodeURIComponent(key);
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Inventory History Report Link',
    body: 'Open your full inventory history report:\n\n' + url + '\n\nCSV export is available from that page.'
  });
}

function removeInventoryFromManifestOnGitHub_(cfg, normalizedProduct) {
  var path = 'images/products/available/inventory-manifest.json';
  var existing = getGitHubFileIfExists_(cfg, path);
  if (!existing || !existing.content) return 0;

  var decoded = Utilities.newBlob(Utilities.base64Decode(existing.content.replace(/\n/g, ''))).getDataAsString();
  var list = [];
  try {
    var parsed = JSON.parse(decoded);
    if (parsed && parsed.push) list = parsed;
  } catch (e) {
    list = [];
  }

  var re = /^.+-\d+(?:\.\d{1,2})?-\d+-([A-Za-z0-9]+)(?:-(\d+))?\.(?:jpe?g|png|webp)$/i;
  var kept = [];
  var removed = 0;
  for (var i = 0; i < list.length; i++) {
    var item = String(list[i] || '');
    var m = item.match(re);
    var itemProduct = m && m[1] ? String(m[1]).toLowerCase() : '';
    if (itemProduct === normalizedProduct) {
      removed += 1;
      continue;
    }
    kept.push(item);
  }

  if (removed > 0) {
    var manifestText = JSON.stringify(kept, null, 2) + '\n';
    var payload = {
      message: 'Remove inventory entries for product #' + normalizedProduct,
      content: Utilities.base64Encode(manifestText),
      branch: cfg.branch,
      sha: existing.sha
    };
    putGitHubFile_(cfg, path, payload);
  }

  return removed;
}

function getGitHubFileIfExists_(cfg, path) {
  var url = githubContentsUrl_(cfg, path) + '?ref=' + encodeURIComponent(cfg.branch);
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json'
    }
  });

  var code = resp.getResponseCode();
  if (code === 404) return null;
  if (code < 200 || code >= 300) {
    throw new Error('GitHub read failed (' + code + '): ' + resp.getContentText());
  }
  var file = JSON.parse(resp.getContentText());
  if (file && file.type === 'file' && !file.content && file.download_url) {
    var rawResp = UrlFetchApp.fetch(file.download_url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        Authorization: 'Bearer ' + cfg.token,
        Accept: 'application/vnd.github.raw+json'
      }
    });
    var rawCode = rawResp.getResponseCode();
    if (rawCode >= 200 && rawCode < 300) {
      file.content = Utilities.base64Encode(rawResp.getContent());
    }
  }
  return file;
}

function listGitHubDirectory_(cfg, path) {
  var url = githubContentsUrl_(cfg, path) + '?ref=' + encodeURIComponent(cfg.branch);
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json'
    }
  });

  var code = resp.getResponseCode();
  if (code === 404) return [];
  if (code < 200 || code >= 300) {
    throw new Error('GitHub directory read failed (' + code + '): ' + resp.getContentText());
  }

  var parsed = JSON.parse(resp.getContentText());
  return Array.isArray(parsed) ? parsed : [];
}

function putGitHubFile_(cfg, path, payload) {
  var url = githubContentsUrl_(cfg, path);
  var resp = UrlFetchApp.fetch(url, {
    method: 'put',
    muteHttpExceptions: true,
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json'
    }
  });
  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('GitHub write failed (' + code + '): ' + resp.getContentText());
  }
}

function deleteGitHubFile_(cfg, path, sha, message) {
  var url = githubContentsUrl_(cfg, path);
  var payload = {
    message: message || ('Delete ' + path),
    sha: sha,
    branch: cfg.branch
  };

  var resp = UrlFetchApp.fetch(url, {
    method: 'delete',
    muteHttpExceptions: true,
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      Authorization: 'Bearer ' + cfg.token,
      Accept: 'application/vnd.github+json'
    }
  });

  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('GitHub delete failed (' + code + '): ' + resp.getContentText());
  }
}

function githubContentsUrl_(cfg, path) {
  var encodedPath = String(path || '').split('/').map(function (segment) {
    return encodeURIComponent(segment);
  }).join('/');
  return 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + '/contents/' + encodedPath;
}

function testProcessInventoryInbox() {
  var result = processInventoryInbox();
  Logger.log(JSON.stringify(result));
}

// ---- Confirmed Orders Dashboard ----

function buildOrdersDashboard() {
  var orders = getConfirmedOrders();

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Confirmed Orders | Mitch\'s Hardwoods</title>' +
    '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0;}' +
    'body{font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px;}' +
    '.header{max-width:1000px;margin:0 auto 32px;text-align:center;}' +
    '.header h1{font-size:28px;margin-bottom:8px;color:#c9a96e;}' +
    '.header p{color:rgba(255,255,255,0.5);font-size:14px;}' +
    '.orders{max-width:1000px;margin:0 auto;}' +
    '.order-card{background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin-bottom:16px;}' +
    '.order-card__header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;}' +
    '.order-card__id{font-size:18px;font-weight:bold;color:#c9a96e;}' +
    '.order-card__date{font-size:13px;color:rgba(255,255,255,0.4);}' +
    '.order-card__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:16px;}' +
    '.order-card__label{font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;}' +
    '.order-card__value{font-size:14px;color:#fff;margin-top:2px;}' +
    '.order-card__value a{color:#c9a96e;text-decoration:none;}' +
    '.order-card__items{border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;}' +
    '.order-card__items ul{list-style:none;padding:0;}' +
    '.order-card__items li{padding:4px 0;color:rgba(255,255,255,0.7);font-size:14px;}' +
    '.order-card__items li:before{content:"• ";color:#c9a96e;}' +
    '.order-card__total{font-size:20px;font-weight:bold;color:#c9a96e;margin-top:12px;}' +
    '.empty{text-align:center;padding:64px 24px;color:rgba(255,255,255,0.4);}' +
    '.badge{display:inline-block;background:#5a9a5a;color:#fff;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:bold;text-transform:uppercase;}' +
    '@media(max-width:600px){.order-card__grid{grid-template-columns:1fr;}}' +
    '</style></head><body>' +
    '<div class="header"><h1>Confirmed Orders</h1>' +
    '<p>' + orders.length + ' order' + (orders.length !== 1 ? 's' : '') + ' confirmed</p></div>' +
    '<div class="orders">';

  if (orders.length === 0) {
    html += '<div class="empty"><p>No confirmed orders yet.</p></div>';
  } else {
    // Show newest first
    for (var i = orders.length - 1; i >= 0; i--) {
      var o = orders[i];
      var confirmedDate = o.confirmedAt ? new Date(o.confirmedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A';

      html += '<div class="order-card">' +
        '<div class="order-card__header">' +
        '<span class="order-card__id">' + o.orderId + '</span>' +
        '<span class="badge">Confirmed</span>' +
        '</div>' +
        '<div class="order-card__grid">' +
        '<div><div class="order-card__label">Customer</div><div class="order-card__value">' + o.firstName + ' ' + o.lastName + '</div></div>' +
        '<div><div class="order-card__label">Email</div><div class="order-card__value"><a href="mailto:' + o.email + '">' + o.email + '</a></div></div>' +
        '<div><div class="order-card__label">Phone</div><div class="order-card__value"><a href="tel:' + o.phone + '">' + o.phone + '</a></div></div>' +
        '<div><div class="order-card__label">Preferred Contact</div><div class="order-card__value">' + o.contactMethod + '</div></div>' +
        '<div><div class="order-card__label">Order Date</div><div class="order-card__value">' + (o.date || 'N/A') + '</div></div>' +
        '<div><div class="order-card__label">Confirmed</div><div class="order-card__value">' + confirmedDate + '</div></div>' +
        '</div>' +
        '<div class="order-card__items"><div class="order-card__label" style="margin-bottom:8px;">Items</div><ul>';
      for (var j = 0; j < o.items.length; j++) {
        html += '<li>' + o.items[j] + '</li>';
      }
      html += '</ul></div>' +
        '<div class="order-card__total">Total: ' + o.total + '</div>' +
        '</div>';
    }
  }

  html += '</div></body></html>';
  return html;
}

// ---- Test Function (run this to authorize) ----

function testSendEmail() {
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Test - Mitch\'s Hardwoods Order System',
    body: 'If you received this email, the order system is working!'
  });
}

function buildInventoryAdminPage() {
  var key = JSON.stringify(getInventoryAdminKey_());
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Inventory Manager</title><style>' +
    '*{box-sizing:border-box}body{font:15px Arial,sans-serif;margin:0;background:#f4f1eb;color:#29251f}main{max-width:1100px;margin:0 auto;padding:28px 18px}h1{margin:0 0 6px;color:#5b3d25}p{color:#746b60}.layout{display:grid;grid-template-columns:minmax(280px,1fr) minmax(300px,1fr);gap:22px;align-items:start}.panel{background:#fff;border:1px solid #d9d0c4;border-radius:8px;padding:20px;box-shadow:0 5px 20px #47351b12}label{display:block;font-weight:700;margin:12px 0 5px}input,select{width:100%;padding:10px;border:1px solid #cfc4b6;border-radius:5px;font:inherit}input[type=checkbox]{width:auto;margin-right:8px}.checks{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0}.checks label{font-weight:400;margin:0}.actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}button{border:0;border-radius:5px;padding:10px 15px;font-weight:700;cursor:pointer;background:#5b3d25;color:#fff}button.secondary{background:#e8e0d6;color:#382b20}button.danger{background:#a33b2e}.status{min-height:22px;margin-top:12px;color:#5b3d25}.product{display:grid;grid-template-columns:76px 1fr auto;gap:12px;align-items:center;border-top:1px solid #e4ddd4;padding:12px 0}.product:first-child{border-top:0}.product img{width:76px;height:60px;object-fit:cover;border-radius:4px;background:#eee}.product h3{font-size:16px;margin:0 0 4px}.product small{color:#776e64}.product .actions{margin:0}.product .actions button{padding:7px 9px;font-size:12px}@media(max-width:720px){.layout{grid-template-columns:1fr}.product{grid-template-columns:58px 1fr}.product img{width:58px;height:52px}.product .actions{grid-column:2}}' +
    '</style></head><body><main><h1>Inventory Manager</h1><p>Add, update, replace photos, or remove Available Now products.</p><div class="layout"><section class="panel"><h2 id="form-title">Add product</h2><form id="product-form"><input type="hidden" id="original-number"><label for="product-number">Product number <small>(leave blank to assign next)</small></label><input id="product-number" pattern="[A-Za-z0-9]+"><label for="product-name">Name</label><input id="product-name" required><label for="product-price">Price</label><input id="product-price" type="number" min="0.01" step="0.01" required><label for="product-qty">Quantity</label><input id="product-qty" type="number" min="1" step="1" value="1" required><label for="product-type">Type</label><select id="product-type"><option value="cutting-board">Cutting board</option><option value="charcuterie">Charcuterie</option><option value="other">Other</option></select><label>Already included on this product</label><div class="checks"><label><input type="checkbox" id="opt-groove">Juice Groove</label><label><input type="checkbox" id="opt-handles">Handles</label><label><input type="checkbox" id="opt-feet">Feet</label></div><label for="product-images">Photos <small>(select files to replace existing photos)</small></label><input id="product-images" type="file" accept="image/jpeg,image/png,image/webp" multiple><div class="actions"><button type="submit">Save product</button><button type="button" class="secondary" id="clear">Clear</button></div><div class="status" id="status" aria-live="polite"></div></form></section><section class="panel"><h2>Available products</h2><div id="products">Loading...</div></section></div></main><script>' +
    'var KEY=' + key + ',products=[];var $=function(id){return document.getElementById(id)};function status(text){$("status").textContent=text}function call(method,args,done){var runner=google.script.run.withSuccessHandler(done).withFailureHandler(function(e){status(e.message||String(e))});runner[method].apply(runner,args||[])}function load(){call("getInventoryAdminData",[KEY],function(data){products=data||[];render()})}function render(){var out="";products.forEach(function(p){var thumb=p.imageUrls&&p.imageUrls[0]?"<img src=\""+p.imageUrls[0]+"\" alt=\"\">":"<div></div>";out+="<article class=product>"+thumb+"<div><h3>"+esc(p.name)+"</h3><small>#"+esc(p.productNum)+" - $"+Number(p.price).toFixed(2)+" - "+p.qty+" available - "+esc(p.type)+"</small></div><div class=actions><button onclick=edit("+JSON.stringify(p.productNum)+")>Edit</button><button class=danger onclick=removeProduct("+JSON.stringify(p.productNum)+")>Remove</button></div></article>"});$("products").innerHTML=out||"<p>No products found.</p>"}function esc(v){return String(v||"").replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}function edit(number){var p=products.filter(function(x){return x.productNum===number})[0];if(!p)return;$("form-title").textContent="Edit product #"+number;$("original-number").value=number;$("product-number").value=number;$("product-name").value=p.name;$("product-price").value=p.price;$("product-qty").value=p.qty;$("product-type").value=p.type||"cutting-board";$("opt-groove").checked=!!p.preAdded.juiceGroove;$("opt-handles").checked=!!p.preAdded.handles;$("opt-feet").checked=!!p.preAdded.feet;window.scrollTo(0,0)}function removeProduct(number){if(!confirm("Remove product #"+number+" from Available Now?"))return;status("Removing...");call("removeInventoryAdminProduct",[number,KEY],function(){status("Removed product #"+number);load()})}function clearForm(){$("product-form").reset();$("original-number").value="";$("form-title").textContent="Add product";$("product-images").value=""}function readImages(files,done){var result=[],left=files.length;if(!left)return done(result);Array.prototype.forEach.call(files,function(file){var reader=new FileReader();reader.onload=function(){result.push({name:file.name,mimeType:file.type,base64:String(reader.result).split(",")[1]});if(!--left)done(result)};reader.readAsDataURL(file)})}$("clear").onclick=clearForm;$("product-form").onsubmit=function(e){e.preventDefault();var data={productNum:$("product-number").value.trim(),name:$("product-name").value.trim(),price:$("product-price").value,qty:$("product-qty").value,type:$("product-type").value,juiceGroove:$("opt-groove").checked,handles:$("opt-handles").checked,feet:$("opt-feet").checked};status("Saving...");readImages($("product-images").files,function(images){data.images=images;call("saveInventoryAdminProduct",[data,KEY],function(result){status("Saved product #"+result.productNum);clearForm();load()})})};load();</script></body></html>';
}

// ---- Result Page Template ----

function buildResultPage(title, message, type) {
  var color = type === 'success' ? '#5a9a5a' : (type === 'denied' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#6b7280'));
  var icon = type === 'success' ? '&#10004;' : (type === 'denied' ? '&#10006;' : (type === 'warning' ? '&#9888;' : '&#8505;'));

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + title + ' | Mitch\'s Hardwoods</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff;}' +
    '.card{background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:48px;max-width:480px;width:90%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5);}' +
    '.icon{width:64px;height:64px;line-height:64px;margin:0 auto 16px;background:' + color + ';color:#fff;border-radius:50%;font-size:28px;}' +
    'h1{font-size:24px;margin-bottom:12px;}' +
    'p{color:rgba(255,255,255,0.6);line-height:1.6;margin:0;}' +
    '</style></head>' +
    '<body><div class="card">' +
    '<div class="icon">' + icon + '</div>' +
    '<h1>' + title + '</h1>' +
    '<p>' + message + '</p>' +
    '</div></body></html>';
}
