// ============================================
// Mitch's Hardwoods — Order Management
// Google Apps Script (paste into script.google.com)
// ============================================

var OWNER_EMAIL = 'orders@mitchs-hardwoods.com';

// ---- POST Handler (new orders from website) ----

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
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

// ---- GET Handler (confirm/deny links from email) ----

function doGet(e) {
  var action = e.parameter.action;
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

  return HtmlService.createHtmlOutput(buildResultPage('Order Confirmed!', 'Confirmation email sent to ' + customerEmail + '.', 'success'));
}

// ---- Deny Order ----

function handleDenyOrder(order) {
  return HtmlService.createHtmlOutput(buildResultPage('Order Denied', 'Order ' + order.orderId + ' has been denied. No email was sent to the customer.', 'denied'));
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
