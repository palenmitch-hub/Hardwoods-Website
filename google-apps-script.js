// ============================================
// Mitch's Hardwoods — Order Management
// Google Apps Script (paste into script.google.com)
// ============================================

var OWNER_EMAIL = 'orders@mitchs-hardwoods.com';
var VIEW_ORDERS_KEY = 'mitchhardwoods2026';

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
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- GET Handler (confirm/deny/view links) ----

function doGet(e) {
  var action = e.parameter.action;

  // View confirmed orders dashboard
  if (action === 'viewOrders') {
    var key = e.parameter.key;
    if (key !== VIEW_ORDERS_KEY) {
      return HtmlService.createHtmlOutput(buildResultPage('Access Denied', 'Invalid access key.', 'warning'));
    }
    return HtmlService.createHtmlOutput(buildOrdersDashboard());
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
