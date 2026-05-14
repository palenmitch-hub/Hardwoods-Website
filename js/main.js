/* ============================================
   Mitch's Hardwoods — Main JavaScript
   Cart, Navigation, Calendar, Form Validation
   ============================================ */

(function () {
  'use strict';

  // ---- Constants ----
  var CART_KEY = 'mitchs-cart';
  var FORMSPREE_QUOTE_ID = '{FORMSPREE_QUOTE_ID}';

  // ---- Cart Module (T011) ----

  function getCart() {
    try {
      var data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(id, name, price, qty, engraving, options) {
    var cart = getCart();
    // Items with custom options get a unique suffix so they stay separate
    var cartId = id;
    if (options) {
      cartId = id + '::opt::' + JSON.stringify(options);
    } else if (engraving) {
      cartId = id + '::eng::' + engraving;
    }
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === cartId) {
        existing = cart[i];
        break;
      }
    }
    if (existing) {
      existing.qty += qty;
    } else {
      var entry = { id: cartId, name: name, price: price, qty: qty };
      if (engraving) entry.engraving = engraving;
      if (options) entry.options = options;
      cart.push(entry);
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (item) {
      return item.id !== id;
    });
    saveCart(cart);
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        cart[i].qty = qty;
        break;
      }
    }
    saveCart(cart);
  }

  function getCartCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].qty;
    }
    return count;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  // ---- Cart UI (T012) ----

  // Helper: total qty in cart for a base product id (sums across all option variants)
  function getCartQtyForProduct(baseId) {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var itemBaseId = cart[i].id.split('::')[0];
      if (itemBaseId === baseId) {
        total += cart[i].qty;
      }
    }
    return total;
  }

  // In-stock board inventory data (populated by loadBoardsInStock)
  var instockInventory = {}; // { 'instock-1': { qty: 3 }, ... }

  function updateCartBadge() {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    var count = getCartCount();
    badge.textContent = count;
    if (count === 0) {
      badge.setAttribute('hidden', '');
    } else {
      badge.removeAttribute('hidden');
    }
  }

  function formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function renderCartPanel() {
    var body = document.querySelector('.cart-panel__body');
    var footer = document.querySelector('.cart-panel__footer');
    if (!body || !footer) return;

    var cart = getCart();

    if (cart.length === 0) {
      body.innerHTML = '<p class="cart-panel__empty">Your cart is empty.</p>';
      footer.style.display = 'none';
      return;
    }

    var html = '';
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var itemTotal = item.price * item.qty;
      total += itemTotal;
      var engravingLine = item.engraving
        ? '<p class="cart-item__engraving">\u270E \u201C' + escapeHtml(item.engraving) + '\u201D</p>'
        : '';
      var optionsHtml = '';
      if (item.options) {
        var o = item.options;
        optionsHtml = '<div class="cart-item__options">';
        if (o.woodType) optionsHtml += '<span>Wood: ' + escapeHtml(o.woodType) + '</span>';
        if (o.mainWood) optionsHtml += '<span>Main: ' + escapeHtml(o.mainWood) + '</span>';
        if (o.stripeWood) optionsHtml += '<span>Stripe: ' + escapeHtml(o.stripeWood) + '</span>';
        if (o.accentWood) optionsHtml += '<span>Accent: ' + escapeHtml(o.accentWood) + '</span>';
        if (o.handles) optionsHtml += '<span>Handles: Yes (+$10)</span>';
        if (o.feet && o.feet !== 'none') optionsHtml += '<span>Feet: ' + escapeHtml(o.feet) + (o.feet === 'Basic' ? ' (+$5)' : ' (+$20)') + '</span>';
        if (o.engravingLines) {
          var lines = o.engravingLines;
          var engParts = [];
          if (lines.top) engParts.push(lines.top);
          if (lines.middle) engParts.push(lines.middle);
          if (lines.bottom) engParts.push(lines.bottom);
          if (engParts.length) optionsHtml += '<span>\u270E ' + escapeHtml(engParts.join(' / ')) + '</span>';
          if (lines.font) {
            var fontLabels = { 'serif': 'Serif', 'sans-serif': 'Sans-Serif', 'script': 'Script', 'monospace': 'Monospace' };
            optionsHtml += '<span>Font: ' + (fontLabels[lines.font] || lines.font) + '</span>';
          }
        }
        optionsHtml += '</div>';
      }
      html +=
        '<div class="cart-item">' +
          '<div class="cart-item__info">' +
            '<p class="cart-item__name">' + escapeHtml(item.name) + '</p>' +
            engravingLine +
            optionsHtml +
            '<p class="cart-item__detail">' +
              '<span class="cart-item__qty-controls">' +
                '<button type="button" class="cart-item__qty-btn cart-item__qty-minus" data-qty-id="' + encodeURIComponent(item.id) + '" aria-label="Decrease quantity">&minus;</button>' +
                '<span class="cart-item__qty-value">' + item.qty + '</span>' +
                '<button type="button" class="cart-item__qty-btn cart-item__qty-plus" data-qty-id="' + encodeURIComponent(item.id) + '" aria-label="Increase quantity">&plus;</button>' +
              '</span>' +
              ' &times; ' + formatPrice(item.price) +
            '</p>' +
          '</div>' +
          '<button class="cart-item__remove" data-remove-id="' + encodeURIComponent(item.id) + '" aria-label="Remove ' + escapeHtml(item.name) + ' from cart" type="button">&times;</button>' +
        '</div>';
    }
    body.innerHTML = html;
    footer.style.display = '';

    var totalEl = footer.querySelector('.cart-panel__total-amount');
    if (totalEl) {
      totalEl.textContent = formatPrice(total);
    }
  }

  function openCartPanel() {
    var panel = document.getElementById('cart-panel');
    var overlay = document.getElementById('cart-overlay');
    if (!panel) return;
    renderCartPanel();
    panel.classList.add('cart-panel--open');
    panel.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('cart-overlay--visible');
    document.body.style.overflow = 'hidden';

    var closeBtn = panel.querySelector('.cart-panel__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeCartPanel() {
    var panel = document.getElementById('cart-panel');
    var overlay = document.getElementById('cart-overlay');
    if (!panel) return;
    panel.classList.remove('cart-panel--open');
    panel.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('cart-overlay--visible');
    document.body.style.overflow = '';
  }

  // ---- Mobile Nav Enhancement (T013) ----

  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var label = document.querySelector('.nav-toggle-label');
    var navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('change', function () {
      var expanded = toggle.checked;
      if (label) label.setAttribute('aria-expanded', String(expanded));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.checked) {
        toggle.checked = false;
        if (label) {
          label.setAttribute('aria-expanded', 'false');
          label.focus();
        }
      }
    });

    // Focus trap when open
    navLinks.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !toggle.checked) return;
      var focusable = navLinks.querySelectorAll('a, button');
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // ---- Add to Cart Delegation (T014) ----

  var ENGRAVING_PRICE = 2000; // $20.00 in cents

  function isCuttingBoard(productId) {
    return productId && productId.indexOf('cb-') === 0;
  }

  function showEngravingModal(name, callback) {
    // Remove any existing modal
    var old = document.getElementById('engraving-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'engraving-modal';
    modal.className = 'engraving-modal';
    modal.innerHTML =
      '<div class="engraving-modal__backdrop"></div>' +
      '<div class="engraving-modal__dialog" role="dialog" aria-labelledby="eng-title">' +
        '<h3 id="eng-title">Add Custom Engraving?</h3>' +
        '<p>Add a personal engraving to your <strong>' + escapeHtml(name) + '</strong> for an additional <strong>$20.00</strong>.</p>' +
        '<div id="eng-text-wrap" class="engraving-modal__text-wrap" style="display:none">' +
          '<label for="eng-text">Engraving text (50 characters max)</label>' +
          '<input type="text" id="eng-text" class="engraving-modal__input" maxlength="50" placeholder="e.g. Happy Anniversary!">' +
          '<span id="eng-char-count" class="engraving-modal__char-count">0 / 50</span>' +
        '</div>' +
        '<div class="engraving-modal__actions">' +
          '<button type="button" class="btn btn--outline" id="eng-skip">No Thanks</button>' +
          '<button type="button" class="btn btn--accent" id="eng-add">Add Engraving</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var textWrap = document.getElementById('eng-text-wrap');
    var textInput = document.getElementById('eng-text');
    var charCount = document.getElementById('eng-char-count');
    var addBtn = document.getElementById('eng-add');
    var skipBtn = document.getElementById('eng-skip');
    var backdrop = modal.querySelector('.engraving-modal__backdrop');
    var engravingChosen = false;

    function cleanup() {
      modal.remove();
    }

    addBtn.addEventListener('click', function () {
      if (!engravingChosen) {
        // First click: show text field
        engravingChosen = true;
        textWrap.style.display = '';
        textInput.focus();
        addBtn.textContent = 'Confirm & Add to Cart';
      } else {
        // Second click: confirm
        var text = textInput.value.trim();
        if (!text) { textInput.focus(); return; }
        callback(text);
        cleanup();
      }
    });

    skipBtn.addEventListener('click', function () {
      callback(null);
      cleanup();
    });

    backdrop.addEventListener('click', function () {
      callback(null);
      cleanup();
    });

    textInput.addEventListener('input', function () {
      charCount.textContent = textInput.value.length + ' / 50';
    });

    // Trap focus and handle Escape
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        callback(null);
        cleanup();
      }
    });

    addBtn.focus();
  }

  function initAddToCart() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-card__add');
      if (!btn) return;

      var card = btn.closest('.product-card');
      if (!card) return;

      var id = card.getAttribute('data-product-id');
      var name = card.getAttribute('data-product-name');
      var price = parseInt(card.getAttribute('data-product-price'), 10);
      var qtyInput = card.querySelector('.product-card__qty');
      var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;

      if (isNaN(qty) || qty < 1) qty = 1;
      if (isNaN(price)) return;

      if (isCuttingBoard(id)) {
        showEngravingModal(name, function (engravingText) {
          var finalPrice = engravingText ? price + ENGRAVING_PRICE : price;
          var finalName = engravingText ? name + ' (Engraved)' : name;
          addToCart(id, finalName, finalPrice, qty, engravingText || undefined);
          updateCartBadge();
          showToast(qty + 'x ' + finalName + ' added to cart');
        });
      } else if (id && id.indexOf('chair-') === 0) {
        showChairWoodModal(name, price, qty, id, function (options, finalPrice) {
          addToCart(id, name, finalPrice, qty, undefined, options);
          updateCartBadge();
          showToast(qty + 'x ' + name + ' added to cart');
        });
      } else {
        addToCart(id, name, price, qty);
        updateCartBadge();
        showToast(qty + 'x ' + name + ' added to cart');
      }
    });
  }

  // ---- Toast (T014) ----

  function showToast(message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('toast--visible');
    });

    setTimeout(function () {
      toast.classList.remove('toast--visible');
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2500);
  }

  // ---- Quote Request (T015) ----

  function submitQuoteRequest() {
    var cart = getCart();
    if (cart.length === 0) return;

    var items = [];
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var desc = item.qty + 'x ' + item.name + ' (' + formatPrice(item.price) + ')';
      if (item.options) {
        var parts = [];
        if (item.options.woodType) parts.push('Wood: ' + item.options.woodType);
        if (item.options.mainWood) parts.push('Main: ' + item.options.mainWood);
        if (item.options.stripeWood) parts.push('Stripe: ' + item.options.stripeWood);
        if (item.options.accentWood) parts.push('Accent: ' + item.options.accentWood);
        if (item.options.handles) parts.push('Handles: Yes');
        if (item.options.feet) parts.push('Feet: ' + item.options.feet);
        if (item.options.engravingLines) {
          var el = item.options.engravingLines;
          var engParts = [];
          if (el.top) engParts.push(el.top);
          if (el.middle) engParts.push(el.middle);
          if (el.bottom) engParts.push(el.bottom);
          if (engParts.length) parts.push('Engraving: ' + engParts.join(' | '));
        }
        if (parts.length) desc += ' [' + parts.join(', ') + ']';
      }
      items.push(desc);
      total += item.price * item.qty;
    }

    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    var data = {
      cart_items: items.join(', '),
      cart_total: formatPrice(total),
      _subject: 'New Quote Request - ' + dateStr
    };

    var quoteBtn = document.querySelector('.cart-panel__quote-btn');
    if (quoteBtn) {
      quoteBtn.disabled = true;
      quoteBtn.textContent = 'Sending...';
    }

    fetch('https://formspree.io/f/' + FORMSPREE_QUOTE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        if (response.ok) {
          clearCart();
          updateCartBadge();
          renderCartPanel();
          showToast('Quote request sent! I\'ll be in touch.');
          setTimeout(closeCartPanel, 1500);
        } else {
          showToast('Something went wrong. Please try again.');
        }
      })
      .catch(function () {
        showToast('Network error. Please try again.');
      })
      .finally(function () {
        if (quoteBtn) {
          quoteBtn.disabled = false;
          quoteBtn.textContent = 'Request Quote';
        }
      });
  }

  // ---- Custom Order Form Validation (T031) ----

  function validateCustomOrderForm(form) {
    var valid = true;

    // Clear previous errors
    var errors = form.querySelectorAll('.field-error');
    for (var i = 0; i < errors.length; i++) {
      errors[i].classList.remove('field-error--visible');
    }

    // Pattern selected
    var patternSelected = form.querySelector('input[name="pattern"]:checked');
    if (!patternSelected) {
      showFieldError(form, 'pattern-error');
      valid = false;
    }

    // At least one wood type
    var woodChecked = form.querySelectorAll('input[name="wood_types"]:checked');
    if (woodChecked.length === 0) {
      showFieldError(form, 'wood-error');
      valid = false;
    }

    // Name
    var name = form.querySelector('input[name="name"]');
    if (!name || name.value.trim() === '') {
      showFieldError(form, 'name-error');
      valid = false;
    }

    // Email
    var email = form.querySelector('input[name="email"]');
    if (!email || email.value.trim() === '' || !isValidEmail(email.value)) {
      showFieldError(form, 'email-error');
      valid = false;
    }

    return valid;
  }

  function showFieldError(form, errorId) {
    var el = document.getElementById(errorId);
    if (el) el.classList.add('field-error--visible');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function initCustomOrderForm() {
    var form = document.querySelector('.custom-order-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateCustomOrderForm(form)) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      var formData = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            form.style.display = 'none';
            var success = document.getElementById('custom-order-success');
            if (success) success.classList.add('form-success--visible');
          } else {
            var errMsg = document.getElementById('custom-order-error');
            if (errMsg) errMsg.classList.add('form-error-message--visible');
          }
        })
        .catch(function () {
          var errMsg = document.getElementById('custom-order-error');
          if (errMsg) errMsg.classList.add('form-error-message--visible');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Custom Order';
          }
        });
    });
  }

  // ---- Quantity Validation (T043) ----

  function initQtyValidation() {
    document.addEventListener('input', function (e) {
      if (!e.target.classList.contains('product-card__qty')) return;
      var val = e.target.value.replace(/[^0-9]/g, '');
      var num = parseInt(val, 10);
      if (isNaN(num) || num < 1) num = 1;
      // Enforce max for in-stock boards
      var max = parseInt(e.target.getAttribute('max'), 10);
      if (!isNaN(max) && max > 0 && num > max) num = max;
      e.target.value = num;
    });
  }

  // ---- Events Calendar (T035) ----

  var EVENTS = [
    { name: 'Woodstock Arts Festival', date: '2026-06-14', location: 'Downtown Woodstock, GA' },
    { name: 'Roswell Farmers Market', date: '2026-06-21', location: 'Roswell Town Square' },
    { name: 'Marietta Square Art Walk', date: '2026-07-12', location: 'Marietta Square, GA' },
    { name: 'Canton First Saturday', date: '2026-08-01', location: 'Downtown Canton, GA' }
  ];

  var calendarYear, calendarMonth;

  function renderCalendar(year, month) {
    var grid = document.getElementById('calendar-grid');
    var title = document.getElementById('calendar-title');
    if (!grid) return;

    calendarYear = year;
    calendarMonth = month;

    var monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (title) title.textContent = monthNames[month] + ' ' + year;

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();

    // Build event lookup for this month
    var eventMap = {};
    for (var i = 0; i < EVENTS.length; i++) {
      var parts = EVENTS[i].date.split('-');
      var eYear = parseInt(parts[0], 10);
      var eMonth = parseInt(parts[1], 10) - 1;
      var eDay = parseInt(parts[2], 10);
      if (eYear === year && eMonth === month) {
        if (!eventMap[eDay]) eventMap[eDay] = [];
        eventMap[eDay].push(EVENTS[i]);
      }
    }

    var html = '';

    // Day headers
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (var d = 0; d < 7; d++) {
      html += '<div class="calendar-grid__header">' + days[d] + '</div>';
    }

    // Empty cells before first day
    for (var e = 0; e < firstDay; e++) {
      html += '<div class="calendar-grid__day calendar-grid__day--empty"></div>';
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      var classes = 'calendar-grid__day';
      if (isToday) classes += ' calendar-grid__day--today';

      var tooltipHtml = '';
      if (eventMap[day]) {
        classes += ' has-event';
        var names = [];
        for (var ev = 0; ev < eventMap[day].length; ev++) {
          names.push(eventMap[day][ev].name);
        }
        tooltipHtml = '<span class="event-tooltip">' + escapeHtml(names.join(', ')) + '</span>';
      }

      html += '<div class="' + classes + '" tabindex="' + (eventMap[day] ? '0' : '-1') + '">' +
        '<span>' + day + '</span>' + tooltipHtml + '</div>';
    }

    grid.innerHTML = html;
  }

  function navigateMonth(direction) {
    calendarMonth += direction;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    } else if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderCalendar(calendarYear, calendarMonth);
  }

  function initCalendar() {
    var grid = document.getElementById('calendar-grid');
    if (!grid) return;

    var now = new Date();
    renderCalendar(now.getFullYear(), now.getMonth());

    var prevBtn = document.getElementById('calendar-prev');
    var nextBtn = document.getElementById('calendar-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { navigateMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { navigateMonth(1); });
  }

  // ---- Past Event Hiding ----

  function hidePastEvents() {
    var items = document.querySelectorAll('.event-item');
    if (items.length === 0) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var hasVisible = false;

    for (var i = 0; i < items.length; i++) {
      var timeEl = items[i].querySelector('.event-item__date');
      if (!timeEl) continue;
      var dt = timeEl.getAttribute('datetime');
      if (!dt) continue;
      var eventDate = new Date(dt + 'T00:00:00');
      if (eventDate < today) {
        items[i].style.display = 'none';
      } else {
        hasVisible = true;
      }
    }

    if (!hasVisible) {
      var list = document.querySelector('.events-list ul');
      if (list) {
        var emptyMsg = document.createElement('p');
        emptyMsg.className = 'events-empty';
        emptyMsg.textContent = 'No upcoming events scheduled. Check back soon!';
        list.parentNode.insertBefore(emptyMsg, list.nextSibling);
      }
    }
  }

  // ---- Utility ----

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---- Products.md Data-Driven Rendering ----

  function parseProductsMd(text) {
    var categories = {};
    var currentCategory = null;
    var currentProduct = null;
    var lines = text.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Category header — line ending with ":"
      var catMatch = line.match(/^([A-Za-z][A-Za-z &]+):$/);
      if (catMatch) {
        currentCategory = catMatch[1].trim();
        categories[currentCategory] = [];
        currentProduct = null;
        continue;
      }

      if (!currentCategory) continue;

      // New product line — starts with a number and dot
      var numMatch = line.match(/^\d+\.\s*Name:\s*(.+)/);
      if (numMatch) {
        currentProduct = { name: numMatch[1].trim(), description: '', price: '', images: [] };
        categories[currentCategory].push(currentProduct);
        continue;
      }

      if (!currentProduct) continue;

      var descMatch = line.match(/^Description:\s*(.+)/);
      if (descMatch) { currentProduct.description = descMatch[1].trim(); continue; }

      var priceMatch = line.match(/^Price:\s*(.+)/);
      if (priceMatch) { currentProduct.price = priceMatch[1].trim(); continue; }

      var imgMatch = line.match(/^Images:\s*(.+)/);
      if (imgMatch) {
        currentProduct.images = imgMatch[1].split(',').map(function (s) { return s.trim(); });
        continue;
      }
    }
    return categories;
  }

  function slugify(name, index) {
    return 'cb-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + (index + 1);
  }

  function priceToCents(priceStr) {
    // Take the first dollar amount for data-product-price (used by cart)
    var m = priceStr.match(/\$?([\d,]+)/);
    return m ? parseInt(m[1].replace(',', ''), 10) * 100 : 0;
  }

  function buildProductCardHTML(product, id, isBasicBoard) {
    var safe = escapeHtml;
    var imgs = product.images;
    var hasCarousel = imgs.length > 1;
    var imageClass = 'product-card__image' + (hasCarousel ? ' product-carousel' : '');

    var imagesHtml = '';
    for (var i = 0; i < imgs.length; i++) {
      var activeClass = i === 0 ? ' product-carousel__slide--active' : '';
      var cssClass = hasCarousel ? 'product-carousel__slide' + activeClass : '';
      imagesHtml += '<img class="' + cssClass + '" src="images/products/' + safe(imgs[i]) +
        '.jpg" alt="' + safe(product.name) + ' - view ' + (i + 1) + '" loading="lazy">';
    }
    if (hasCarousel) {
      imagesHtml += '<button type="button" class="product-carousel__prev" aria-label="Previous photo">&lsaquo;</button>';
      imagesHtml += '<button type="button" class="product-carousel__next" aria-label="Next photo">&rsaquo;</button>';
    }

    var buttonLabel = isBasicBoard ? 'See All Options' : 'Add to Cart';
    var buttonClass = isBasicBoard ? 'btn btn--outline product-card__options-btn' : 'btn btn--accent product-card__add';
    var dataBasic = isBasicBoard ? ' data-basic-board="true"' : '';

    return '<article class="product-card" data-product-id="' + safe(id) +
      '" data-product-name="' + safe(product.name) +
      '" data-product-price="' + priceToCents(product.price) + '"' + dataBasic + '>' +
      '<div class="' + imageClass + '">' + imagesHtml + '</div>' +
      '<div class="product-card__info">' +
      '<h3 class="product-card__name">' + safe(product.name) + '</h3>' +
      '<p class="product-card__description">' + safe(product.description) + '</p>' +
      '<span class="product-card__price">' + safe(product.price) + '</span>' +
      '<div class="product-card__actions">' +
      '<label for="qty-' + safe(id) + '" class="sr-only">Quantity</label>' +
      '<input type="number" id="qty-' + safe(id) + '" class="product-card__qty" value="1" min="1" step="1" aria-label="Quantity for ' + safe(product.name) + '">' +
      '<button class="' + buttonClass + '" type="button" aria-label="' + buttonLabel + ' for ' + safe(product.name) + '">' + buttonLabel + '</button>' +
      '</div></div></article>';
  }

  // Map from Products.md category names → grid element IDs
  var CATEGORY_GRIDS = {
    'Basic Boards': 'basic-boards-grid'
  };

  function loadProductsFromMd() {
    var hasGrids = false;
    var keys = Object.keys(CATEGORY_GRIDS);
    for (var k = 0; k < keys.length; k++) {
      if (document.getElementById(CATEGORY_GRIDS[keys[k]])) { hasGrids = true; break; }
    }
    if (!hasGrids) return;

    fetch('Products.md')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var categories = parseProductsMd(text);
        var catNames = Object.keys(CATEGORY_GRIDS);
        for (var c = 0; c < catNames.length; c++) {
          var catName = catNames[c];
          var grid = document.getElementById(CATEGORY_GRIDS[catName]);
          if (!grid || !categories[catName]) continue;
          var products = categories[catName];
          var html = '';
          var isBasic = (catName === 'Basic Boards');
          for (var p = 0; p < products.length; p++) {
            var id = slugify(catName, p);
            html += buildProductCardHTML(products[p], id, isBasic);
          }
          grid.innerHTML = html;
        }
      })
      .catch(function (err) {
        console.error('Failed to load Products.md:', err);
      });
  }

  // ---- BoardsInStock.md Data-Driven Rendering ----

  function parseBoardsInStockMd(text) {
    var boards = [];
    var current = null;
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var numMatch = line.match(/^\d+\.\s*Name:\s*(.+)/);
      if (numMatch) {
        current = { name: numMatch[1].trim(), description: '', price: '', images: [], qty: 0 };
        boards.push(current);
        continue;
      }
      if (!current) continue;
      var priceMatch = line.match(/^Price:\s*(.+)/);
      if (priceMatch) { current.price = priceMatch[1].trim(); continue; }
      var qtyMatch = line.match(/^Qty:\s*(\d+)/);
      if (qtyMatch) { current.qty = parseInt(qtyMatch[1], 10); continue; }
      var imgMatch = line.match(/^Image:\s*(.+)/);
      if (imgMatch) {
        current.images = imgMatch[1].split(',').map(function (s) { return s.trim(); });
        continue;
      }
    }
    return boards;
  }

  function buildInStockCardHTML(product, id) {
    var safe = escapeHtml;
    var imgs = product.images;
    var hasCarousel = imgs.length > 1;
    var imageClass = 'product-card__image' + (hasCarousel ? ' product-carousel' : '');

    var imagesHtml = '';
    for (var i = 0; i < imgs.length; i++) {
      var activeClass = i === 0 ? ' product-carousel__slide--active' : '';
      var cssClass = hasCarousel ? 'product-carousel__slide' + activeClass : '';
      imagesHtml += '<img class="' + cssClass + '" src="images/products/' + safe(imgs[i]) +
        '.jpg" alt="' + safe(product.name) + ' - view ' + (i + 1) + '" loading="lazy">';
    }
    if (hasCarousel) {
      imagesHtml += '<button type="button" class="product-carousel__prev" aria-label="Previous photo">&lsaquo;</button>';
      imagesHtml += '<button type="button" class="product-carousel__next" aria-label="Next photo">&rsaquo;</button>';
    }

    var qtyAvail = product.qty || 0;
    var maxAttr = qtyAvail > 0 ? ' max="' + qtyAvail + '"' : '';

    return '<article class="product-card" data-product-id="' + safe(id) +
      '" data-product-name="' + safe(product.name) +
      '" data-product-price="' + priceToCents(product.price) +
      '" data-in-stock="true" data-qty-available="' + qtyAvail + '">' +
      '<div class="' + imageClass + '">' + imagesHtml + '</div>' +
      '<div class="product-card__info">' +
      '<h3 class="product-card__name">' + safe(product.name) + '</h3>' +
      (product.description ? '<p class="product-card__description">' + safe(product.description) + '</p>' : '') +
      '<span class="product-card__price">' + safe(product.price) + '</span>' +
      '<span class="product-card__stock-info">' + qtyAvail + ' available</span>' +
      '<div class="product-card__actions">' +
      '<label for="qty-' + safe(id) + '" class="sr-only">Quantity</label>' +
      '<input type="number" id="qty-' + safe(id) + '" class="product-card__qty" value="1" min="1"' + maxAttr + ' step="1" aria-label="Quantity for ' + safe(product.name) + '">' +
      '<button class="btn btn--outline product-card__instock-btn" type="button" aria-label="Options for ' + safe(product.name) + '">Add to Cart</button>' +
      '</div></div></article>';
  }

  function loadBoardsInStock() {
    var grid = document.getElementById('in-stock-grid');
    if (!grid) return;
    fetch('BoardsInStock.md')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var boards = parseBoardsInStockMd(text);
        var html = '';
        for (var i = 0; i < boards.length; i++) {
          var id = 'instock-' + (i + 1);
          instockInventory[id] = { qty: boards[i].qty || 0 };
          html += buildInStockCardHTML(boards[i], id);
        }
        grid.innerHTML = html;
      })
      .catch(function (err) {
        console.error('Failed to load BoardsInStock.md:', err);
      });
  }

  // ---- In-Stock Board Options Modal (Feet + Engraving only) ----

  function showInStockOptionsModal(productName, basePrice, qty, productId, callback) {
    var old = document.getElementById('instock-options-modal');
    if (old) old.remove();

    var BASIC_FEET_PRICE = 500;
    var BRASS_FEET_PRICE = 2000;
    var ENGRAVING_PRICE_OPT = 2000;

    var FEET_INFO = 'Basic feet are just small black ruberized feet and the Brass Feet are actual metal (brass) feet with a rubber O ring inlayed that adds another level of beauty and function.';
    var ENGRAVING_INFO = 'Choose your font, type out your message, and choose where on the board you would like it! Feel free to use multiple levels and alignments to make it your own!';

    var modal = document.createElement('div');
    modal.id = 'instock-options-modal';
    modal.className = 'board-options-modal';

    var dialogHtml =
      '<div class="board-options-modal__backdrop"></div>' +
      '<div class="board-options-modal__dialog" role="dialog" aria-labelledby="instock-opt-title" aria-modal="true">' +
        '<button type="button" class="board-options-modal__close" aria-label="Close">&times;</button>' +
        '<h3 id="instock-opt-title">' + escapeHtml(productName) + '</h3>' +
        '<p class="board-options-modal__subtitle">Add options to your board</p>' +
        '<span class="board-options-modal__price" id="instock-opt-price">' + formatPrice(basePrice) + '</span>' +

        // Feet
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Feet ' + buildInfoBubble(FEET_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="instock-feet-none" name="instockFeet" value="none" checked>' +
              '<label for="instock-feet-none">No Feet</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="instock-feet-basic" name="instockFeet" value="basic">' +
              '<label for="instock-feet-basic">Basic Feet<span class="opt-price">+$5</span></label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="instock-feet-brass" name="instockFeet" value="brass">' +
              '<label for="instock-feet-brass">Brass Feet<span class="opt-price">+$20</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Engraving
        '<div class="board-engraving-section">' +
          '<div class="board-opt-group">' +
            '<span class="board-opt-group__label">Custom Engraving ' + buildInfoBubble(ENGRAVING_INFO) + '</span>' +
            '<div class="board-opt-radios">' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="instock-eng-no" name="instockEng" value="no" checked>' +
                '<label for="instock-eng-no">No</label>' +
              '</div>' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="instock-eng-yes" name="instockEng" value="yes">' +
                '<label for="instock-eng-yes">Yes<span class="opt-price">+$20</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="board-engraving-fields" id="instock-eng-fields">' +
            '<div class="board-opt-group">' +
              '<span class="board-opt-group__label">Engraving Placement</span>' +
              '<div class="board-opt-radios">' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="instock-eng-front" name="instockEngPlacement" value="front">' +
                  '<label for="instock-eng-front">Front of Board</label>' +
                '</div>' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="instock-eng-back" name="instockEngPlacement" value="back">' +
                  '<label for="instock-eng-back">Back of Board</label>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="board-opt-group">' +
              '<label class="board-opt-group__label" for="instock-eng-font">Font</label>' +
              '<select id="instock-eng-font">' +
                '<option value="serif">Serif (Classic)</option>' +
                '<option value="sans-serif">Sans-Serif (Modern)</option>' +
                '<option value="script">Script (Elegant)</option>' +
                '<option value="monospace">Monospace (Clean)</option>' +
              '</select>' +
            '</div>' +
            '<div class="engraving-row"><div>' +
              '<label for="instock-eng-top">Top Line</label>' +
              '<input type="text" id="instock-eng-top" maxlength="40" placeholder="e.g. The Johnson Family">' +
            '</div><div>' +
              '<label for="instock-eng-top-align">Align</label>' +
              '<select id="instock-eng-top-align"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select>' +
            '</div></div>' +
            '<div class="engraving-row"><div>' +
              '<label for="instock-eng-mid">Middle Line</label>' +
              '<input type="text" id="instock-eng-mid" maxlength="40" placeholder="e.g. Est. 2024">' +
            '</div><div>' +
              '<label for="instock-eng-mid-align">Align</label>' +
              '<select id="instock-eng-mid-align"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select>' +
            '</div></div>' +
            '<div class="engraving-row"><div>' +
              '<label for="instock-eng-bot">Bottom Line</label>' +
              '<input type="text" id="instock-eng-bot" maxlength="40" placeholder="e.g. Made with Love">' +
            '</div><div>' +
              '<label for="instock-eng-bot-align">Align</label>' +
              '<select id="instock-eng-bot-align"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select>' +
            '</div></div>' +
            '<div class="engraving-preview" id="instock-eng-preview">' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="instock-prev-top">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="instock-prev-mid">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="instock-prev-bot">&nbsp;</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="board-options-modal__actions">' +
          '<button type="button" class="btn btn--outline" id="instock-opt-cancel">Cancel</button>' +
          '<button type="button" class="btn btn--accent" id="instock-opt-add">Add to Cart</button>' +
        '</div>' +
      '</div>';

    modal.innerHTML = dialogHtml;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var backdrop = modal.querySelector('.board-options-modal__backdrop');
    var closeBtn = modal.querySelector('.board-options-modal__close');
    var cancelBtn = document.getElementById('instock-opt-cancel');
    var addBtn = document.getElementById('instock-opt-add');
    var livePrice = document.getElementById('instock-opt-price');

    // Engraving toggle
    var engFields = document.getElementById('instock-eng-fields');
    var engRadios = modal.querySelectorAll('input[name="instockEng"]');
    engRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.value === 'yes') {
          engFields.classList.add('board-engraving-fields--visible');
        } else {
          engFields.classList.remove('board-engraving-fields--visible');
        }
        updatePrice();
      });
    });

    // Engraving preview
    var instockEngTopInput = document.getElementById('instock-eng-top');
    var instockEngMidInput = document.getElementById('instock-eng-mid');
    var instockEngBotInput = document.getElementById('instock-eng-bot');
    var instockEngTopAlign = document.getElementById('instock-eng-top-align');
    var instockEngMidAlign = document.getElementById('instock-eng-mid-align');
    var instockEngBotAlign = document.getElementById('instock-eng-bot-align');
    var instockEngFont = document.getElementById('instock-eng-font');
    var instockPrevTop = document.getElementById('instock-prev-top');
    var instockPrevMid = document.getElementById('instock-prev-mid');
    var instockPrevBot = document.getElementById('instock-prev-bot');
    var instockEngPreview = document.getElementById('instock-eng-preview');

    var INSTOCK_FONT_MAP = {
      'serif': 'Georgia, "Times New Roman", serif',
      'sans-serif': '"Inter", Arial, sans-serif',
      'script': '"Brush Script MT", "Segoe Script", cursive',
      'monospace': '"Courier New", Courier, monospace'
    };

    function updateInstockPreview() {
      updateInstockPreviewLine(instockPrevTop, instockEngTopInput.value, instockEngTopAlign.value);
      updateInstockPreviewLine(instockPrevMid, instockEngMidInput.value, instockEngMidAlign.value);
      updateInstockPreviewLine(instockPrevBot, instockEngBotInput.value, instockEngBotAlign.value);
      instockEngPreview.style.fontFamily = INSTOCK_FONT_MAP[instockEngFont.value] || '';
    }

    function updateInstockPreviewLine(el, text, align) {
      var t = text.trim();
      if (t) {
        el.textContent = t;
        el.classList.remove('engraving-preview__line--empty');
      } else {
        el.innerHTML = '&nbsp;';
        el.classList.add('engraving-preview__line--empty');
      }
      el.style.textAlign = align;
    }

    [instockEngTopInput, instockEngMidInput, instockEngBotInput].forEach(function (inp) {
      inp.addEventListener('input', updateInstockPreview);
    });
    [instockEngTopAlign, instockEngMidAlign, instockEngBotAlign, instockEngFont].forEach(function (sel) {
      sel.addEventListener('change', updateInstockPreview);
    });

    function calcPrice() {
      var total = basePrice;
      var feet = modal.querySelector('input[name="instockFeet"]:checked');
      if (feet) {
        if (feet.value === 'basic') total += BASIC_FEET_PRICE;
        if (feet.value === 'brass') total += BRASS_FEET_PRICE;
      }
      var eng = modal.querySelector('input[name="instockEng"]:checked');
      if (eng && eng.value === 'yes') total += ENGRAVING_PRICE_OPT;
      return total;
    }

    function updatePrice() {
      livePrice.textContent = formatPrice(calcPrice());
    }

    modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', updatePrice);
    });

    function cleanup() {
      modal.remove();
      document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cleanup();
    });

    addBtn.addEventListener('click', function () {
      var feetVal = modal.querySelector('input[name="instockFeet"]:checked').value;
      var engVal = modal.querySelector('input[name="instockEng"]:checked').value;
      var options = {
        feet: feetVal === 'none' ? null : (feetVal === 'basic' ? 'Basic' : 'Brass'),
        engravingLines: null
      };

      if (engVal === 'yes') {
        var placement = modal.querySelector('input[name="instockEngPlacement"]:checked');
        if (!placement) {
          var placementLabels = modal.querySelectorAll('input[name="instockEngPlacement"]');
          placementLabels.forEach(function (r) {
            var lbl = r.nextElementSibling;
            if (lbl) lbl.classList.add('board-opt-error-radio');
          });
          showToast('Please select engraving placement (Front or Back)');
          return;
        }
        var topText = document.getElementById('instock-eng-top').value.trim();
        var midText = document.getElementById('instock-eng-mid').value.trim();
        var botText = document.getElementById('instock-eng-bot').value.trim();
        if (!topText && !midText && !botText) {
          showToast('Please enter at least one engraving line');
          return;
        }
        options.engravingLines = {
          placement: placement.value,
          top: topText || '',
          topAlign: document.getElementById('instock-eng-top-align').value,
          middle: midText || '',
          middleAlign: document.getElementById('instock-eng-mid-align').value,
          bottom: botText || '',
          bottomAlign: document.getElementById('instock-eng-bot-align').value,
          font: document.getElementById('instock-eng-font').value
        };
      }

      var finalPrice = calcPrice();
      callback(options, finalPrice);
      cleanup();
    });

    closeBtn.focus();
  }

  // ---- In-Stock Board Click Handler ----

  function initInStockOptions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-card__instock-btn');
      if (!btn) return;
      var card = btn.closest('.product-card');
      if (!card) return;
      var id = card.getAttribute('data-product-id');
      var name = card.getAttribute('data-product-name');
      var price = parseInt(card.getAttribute('data-product-price'), 10);
      var qtyInput = card.querySelector('.product-card__qty');
      var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
      if (isNaN(qty) || qty < 1) qty = 1;
      if (isNaN(price)) return;

      // Enforce qty available limit
      var inv = instockInventory[id];
      if (inv && inv.qty > 0) {
        var alreadyInCart = getCartQtyForProduct(id);
        var remaining = inv.qty - alreadyInCart;
        if (remaining <= 0) {
          showToast('No more available — you already have ' + inv.qty + ' in your cart');
          return;
        }
        if (qty > remaining) {
          qty = remaining;
          if (qtyInput) qtyInput.value = qty;
          showToast('Only ' + remaining + ' more available — adjusted quantity');
        }
      }

      showInStockOptionsModal(name, price, qty, id, function (options, finalPrice) {
        addToCart(id, name, finalPrice, qty, undefined, options);
        updateCartBadge();
        // Update displayed stock on the card
        updateInStockDisplay(id);
        showToast(qty + 'x ' + name + ' added to cart');
      });
    });
  }

  // ---- Chair Wood Type Modal ----

  function showChairWoodModal(productName, basePrice, qty, productId, callback) {
    var old = document.getElementById('chair-wood-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'chair-wood-modal';
    modal.className = 'board-options-modal';

    var dialogHtml =
      '<div class="board-options-modal__backdrop"></div>' +
      '<div class="board-options-modal__dialog" role="dialog" aria-labelledby="chair-opt-title" aria-modal="true">' +
        '<button type="button" class="board-options-modal__close" aria-label="Close">&times;</button>' +
        '<h3 id="chair-opt-title">' + escapeHtml(productName) + '</h3>' +
        '<p class="board-options-modal__subtitle">Choose your wood type</p>' +
        '<span class="board-options-modal__price" id="chair-opt-price">' + formatPrice(basePrice) + '</span>' +
        '<div class="board-opt-group">' +
          '<label class="board-opt-group__label" for="chair-wood-select">Wood Type</label>' +
          '<select id="chair-wood-select">' +
            '<option value="">— Select —</option>' +
            '<option value="Cedar">Cedar</option>' +
            '<option value="Cypress">Cypress</option>' +
            '<option value="Two Tone (Cypress and African Mahogany)">Two Tone (Cypress and African Mahogany)</option>' +
          '</select>' +
        '</div>' +
        '<div class="board-options-modal__actions">' +
          '<button type="button" class="btn btn--outline" id="chair-opt-cancel">Cancel</button>' +
          '<button type="button" class="btn btn--accent" id="chair-opt-add">Add to Cart</button>' +
        '</div>' +
      '</div>';

    modal.innerHTML = dialogHtml;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var backdrop = modal.querySelector('.board-options-modal__backdrop');
    var closeBtn = modal.querySelector('.board-options-modal__close');
    var cancelBtn = document.getElementById('chair-opt-cancel');
    var addBtn = document.getElementById('chair-opt-add');
    var woodSelect = document.getElementById('chair-wood-select');

    function cleanup() {
      modal.remove();
      document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cleanup();
    });

    // Clear error on change
    woodSelect.addEventListener('change', function () {
      woodSelect.classList.remove('board-opt-error');
    });

    addBtn.addEventListener('click', function () {
      var wood = woodSelect.value;
      if (!wood) {
        woodSelect.classList.add('board-opt-error');
        showToast('Please select a wood type');
        return;
      }
      var options = { woodType: wood };
      callback(options, basePrice);
      cleanup();
    });

    closeBtn.focus();
  }

  // ---- Product Image Carousel ----

  // ---- Update In-Stock Display After Cart Change ----

  function updateInStockDisplay(productId) {
    var card = document.querySelector('[data-product-id="' + productId + '"]');
    if (!card) return;
    var inv = instockInventory[productId];
    if (!inv) return;
    var inCart = getCartQtyForProduct(productId);
    var remaining = Math.max(0, inv.qty - inCart);
    var stockInfo = card.querySelector('.product-card__stock-info');
    if (stockInfo) {
      stockInfo.textContent = remaining + ' available';
      if (remaining === 0) {
        stockInfo.classList.add('product-card__stock-info--sold-out');
      } else {
        stockInfo.classList.remove('product-card__stock-info--sold-out');
      }
    }
    var qtyInput = card.querySelector('.product-card__qty');
    if (qtyInput) {
      qtyInput.max = remaining;
      if (parseInt(qtyInput.value, 10) > remaining) {
        qtyInput.value = Math.max(1, remaining);
      }
    }
    var addBtn = card.querySelector('.product-card__instock-btn');
    if (addBtn) {
      addBtn.disabled = remaining <= 0;
      if (remaining <= 0) {
        addBtn.textContent = 'Sold Out';
      } else {
        addBtn.textContent = 'Add to Cart';
      }
    }
  }

  // ---- Featured Products (Homepage) ----

  function loadFeaturedProducts() {
    var grid = document.getElementById('featured-grid');
    if (!grid) return;

    var boardsPromise = fetch('BoardsInStock.md').then(function (r) { return r.text(); });
    var chairsPromise = fetch('Chairs.md').then(function (r) { return r.text(); });

    Promise.all([boardsPromise, chairsPromise]).then(function (results) {
      var boards = parseBoardsInStockMd(results[0]);
      var chairs = parseChairsMd(results[1]);
      var html = '';

      // 2 Available Now boards (first two from BoardsInStock.md)
      var boardCount = Math.min(2, boards.length);
      for (var i = 0; i < boardCount; i++) {
        var b = boards[i];
        var id = 'instock-' + (i + 1);
        var img = b.images.length ? b.images[0] : '';
        var priceCents = priceToCents(b.price);
        html +=
          '<article class="product-card" data-product-id="' + escapeHtml(id) +
            '" data-product-name="' + escapeHtml(b.name) +
            '" data-product-price="' + priceCents +
            '" data-in-stock="true" data-qty-available="' + (b.qty || 0) + '">' +
            '<div class="product-card__image">' +
              '<img src="images/products/' + escapeHtml(img) + '.jpg" alt="' + escapeHtml(b.name) + '" loading="lazy">' +
            '</div>' +
            '<div class="product-card__info">' +
              '<h3 class="product-card__name">' + escapeHtml(b.name) + '</h3>' +
              '<span class="product-card__badge">Available Now</span>' +
              '<span class="product-card__price">' + escapeHtml(b.price) + '</span>' +
              '<div class="product-card__actions">' +
                '<label for="qty-feat-' + escapeHtml(id) + '" class="sr-only">Quantity</label>' +
                '<input type="number" id="qty-feat-' + escapeHtml(id) + '" class="product-card__qty" value="1" min="1" max="' + (b.qty || 1) + '" step="1" aria-label="Quantity for ' + escapeHtml(b.name) + '">' +
                '<button class="btn btn--outline product-card__instock-btn" type="button" aria-label="Add ' + escapeHtml(b.name) + ' to cart">Add to Cart</button>' +
              '</div>' +
            '</div>' +
          '</article>';
      }

      // 1 other product (random chair)
      if (chairs.length > 0) {
        var randIdx = Math.floor(Math.random() * chairs.length);
        var c = chairs[randIdx];
        var chairId = 'chair-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + (randIdx + 1);
        var chairImg = c.images.length ? c.images[0] : '';
        var chairPriceCents = priceToCents(c.price);
        html +=
          '<article class="product-card" data-product-id="' + escapeHtml(chairId) +
            '" data-product-name="' + escapeHtml(c.name) + ' Adirondack Chair' +
            '" data-product-price="' + chairPriceCents + '">' +
            '<div class="product-card__image">' +
              '<img src="images/products/' + escapeHtml(chairImg) + '.jpg" alt="' + escapeHtml(c.name) + ' Adirondack Chair" loading="lazy">' +
            '</div>' +
            '<div class="product-card__info">' +
              '<h3 class="product-card__name">' + escapeHtml(c.name) + ' Adirondack Chair</h3>' +
              '<span class="product-card__badge product-card__badge--custom">Built to Order</span>' +
              '<span class="product-card__price">' + escapeHtml(c.price) + '</span>' +
              '<div class="product-card__actions">' +
                '<label for="qty-feat-' + escapeHtml(chairId) + '" class="sr-only">Quantity</label>' +
                '<input type="number" id="qty-feat-' + escapeHtml(chairId) + '" class="product-card__qty" value="1" min="1" step="1" aria-label="Quantity for ' + escapeHtml(c.name) + ' Adirondack Chair">' +
                '<button class="btn btn--accent product-card__add" type="button" aria-label="Add ' + escapeHtml(c.name) + ' Adirondack Chair to cart">Add to Cart</button>' +
              '</div>' +
            '</div>' +
          '</article>';
      }

      grid.innerHTML = html;
    }).catch(function (err) {
      console.error('Failed to load featured products:', err);
    });
  }

  // ---- Chairs.md Data-Driven Rendering ----

  function parseChairsMd(text) {
    var chairs = [];
    var current = null;
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var numMatch = line.match(/^\d+\.\s*Name\/Style:\s*(.+)/);
      if (numMatch) {
        current = { name: numMatch[1].trim(), description: '', price: '', images: [] };
        chairs.push(current);
        continue;
      }
      if (!current) continue;
      var descMatch = line.match(/^Description:\s*(.+)/);
      if (descMatch) { current.description = descMatch[1].trim(); continue; }
      var priceMatch = line.match(/^Price:\s*(.+)/);
      if (priceMatch) { current.price = '$' + priceMatch[1].trim(); continue; }
      var imgMatch = line.match(/^Images:\s*(.+)/);
      if (imgMatch) {
        current.images = imgMatch[1].split(',').map(function (s) { return s.trim(); });
        continue;
      }
    }
    return chairs;
  }

  function loadChairsFromMd() {
    var grid = document.getElementById('chairs-grid');
    if (!grid) return;
    fetch('Chairs.md')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var chairs = parseChairsMd(text);
        var html = '';
        for (var i = 0; i < chairs.length; i++) {
          var id = 'chair-' + chairs[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + (i + 1);
          html += buildProductCardHTML(chairs[i], id, false);
        }
        grid.innerHTML = html;
      })
      .catch(function (err) {
        console.error('Failed to load Chairs.md:', err);
      });
  }

  function initProductCarousels() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-carousel__prev, .product-carousel__next');
      if (!btn) return;
      var carousel = btn.closest('.product-carousel');
      var slides = carousel.querySelectorAll('.product-carousel__slide');
      if (slides.length < 2) return;
      var dir = btn.classList.contains('product-carousel__next') ? 1 : -1;
      var currentIdx = 0;
      slides.forEach(function (s, i) {
        if (s.classList.contains('product-carousel__slide--active')) currentIdx = i;
      });
      slides[currentIdx].classList.remove('product-carousel__slide--active');
      var next = (currentIdx + dir + slides.length) % slides.length;
      slides[next].classList.add('product-carousel__slide--active');
    });
  }

  // ---- Hero Slideshow ----

  function initHeroSlideshow() {
    var slides = document.querySelectorAll('.hero__slide');
    if (slides.length < 2) return;
    var current = 0;
    setInterval(function () {
      slides[current].classList.remove('hero__slide--active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('hero__slide--active');
    }, 5000);
  }

  // ---- Page Initialization (T016) ----

  document.addEventListener('DOMContentLoaded', function () {
    // Cart badge on every page
    updateCartBadge();

    // Cart panel controls
    var cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', function (e) {
        e.preventDefault();
        openCartPanel();
      });
    }

    var cartClose = document.querySelector('.cart-panel__close');
    if (cartClose) {
      cartClose.addEventListener('click', closeCartPanel);
    }

    var overlay = document.getElementById('cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeCartPanel);
    }

    // Close cart on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var panel = document.getElementById('cart-panel');
        if (panel && panel.classList.contains('cart-panel--open')) {
          closeCartPanel();
          if (cartToggle) cartToggle.focus();
        }
      }
    });

    // Cart remove buttons (delegated)
    document.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.cart-item__remove');
      if (!removeBtn) return;
      var id = decodeURIComponent(removeBtn.getAttribute('data-remove-id'));
      if (id) {
        removeFromCart(id);
        updateCartBadge();
        renderCartPanel();
        // Update the catalog card display if visible
        var baseId = id.split('::')[0];
        if (instockInventory[baseId]) {
          updateInStockDisplay(baseId);
        }
      }
    });

    // Cart qty +/- buttons (delegated)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.cart-item__qty-btn');
      if (!btn) return;
      var id = decodeURIComponent(btn.getAttribute('data-qty-id'));
      if (!id) return;
      var cart = getCart();
      var item = null;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) { item = cart[i]; break; }
      }
      if (!item) return;
      var newQty = item.qty;
      if (btn.classList.contains('cart-item__qty-plus')) {
        // Enforce in-stock limit
        var baseId = id.split('::')[0];
        if (instockInventory[baseId]) {
          var totalInCart = getCartQtyForProduct(baseId);
          if (totalInCart >= instockInventory[baseId].qty) {
            showToast('Only ' + instockInventory[baseId].qty + ' available');
            return;
          }
        }
        newQty++;
      } else if (btn.classList.contains('cart-item__qty-minus')) {
        newQty--;
      }
      updateQty(id, newQty);
      updateCartBadge();
      renderCartPanel();
      // Update the catalog card display if visible
      var baseIdUpdate = id.split('::')[0];
      if (instockInventory[baseIdUpdate]) {
        updateInStockDisplay(baseIdUpdate);
      }
    });

    // Quote request button
    var quoteBtn = document.querySelector('.cart-panel__quote-btn');
    if (quoteBtn) {
      quoteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitQuoteRequest();
      });
    }

    // Mobile nav
    initMobileNav();

    // Add to cart delegation
    initAddToCart();

    // Quantity validation
    initQtyValidation();

    // Calendar (events page only)
    initCalendar();

    // Custom order form
    initCustomOrderForm();

    // Hide past events
    hidePastEvents();

    // Hero slideshow
    initHeroSlideshow();

    // Product image carousels
    initProductCarousels();

    // Load products from Products.md
    loadProductsFromMd();

    // Load boards in stock from BoardsInStock.md
    loadBoardsInStock();

    // Load chairs from Chairs.md
    loadChairsFromMd();

    // Load featured products (homepage)
    loadFeaturedProducts();

    // Load wood inventory
    loadWoodInventory();

    // Board options modal handler
    initBoardOptions();

    // Pattern board options handler
    initPatternBoardOptions();

    // In-stock board options handler
    initInStockOptions();

    // Gallery slideshow
    initGallerySlideshow();

    // Scroll reveal animations (Rivian-style)
    initScrollReveal();
  });

  // ---- Wood Inventory ----

  var woodList = [];

  function loadWoodInventory() {
    fetch('Wood-Inventory.md')
      .then(function (res) { return res.text(); })
      .then(function (text) {
        woodList = text.split('\n')
          .map(function (l) { return l.trim(); })
          .filter(function (l) { return l.length > 0; });
      })
      .catch(function (err) {
        console.error('Failed to load Wood-Inventory.md:', err);
        woodList = ['Walnut', 'Maple', 'Cherry', 'Padauk', 'Wenge', 'Limba', 'Zebra'];
      });
  }

  // ---- Board Options Modal ----

  var STANDARD_WOODS = ['Walnut', 'Maple', 'Cherry'];

  function buildWoodSelect(name, labelText) {
    var html = '<div class="board-opt-group">' +
      '<label class="board-opt-group__label" for="opt-' + name + '">' + escapeHtml(labelText) + '</label>' +
      '<select id="opt-' + name + '" name="' + name + '">' +
      '<option value="">— Select —</option>' +
      '<option value="None">None</option>' +
      '<option value="Creators Choice">Creators Choice</option>';
    for (var i = 0; i < woodList.length; i++) {
      html += '<option value="' + escapeHtml(woodList[i]) + '">' + escapeHtml(woodList[i]) + '</option>';
    }
    html += '</select></div>';
    return html;
  }

  function buildInfoBubble(text) {
    return '<button type="button" class="info-bubble" aria-label="More info" title="' + escapeHtml(text) + '">' +
      '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="10" y="14.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">i</text></svg>' +
      '<span class="info-bubble__tooltip">' + escapeHtml(text) + '</span>' +
    '</button>';
  }

  function showBoardOptionsModal(productName, basePrice, qty, productId, callback) {
    var old = document.getElementById('board-options-modal');
    if (old) old.remove();

    var HANDLE_PRICE = 1000;
    var BASIC_FEET_PRICE = 500;
    var BRASS_FEET_PRICE = 2000;
    var ENGRAVING_PRICE_OPT = 2000;
    var ACCENT_WOOD_PRICE = 2000;
    var SET_PRICE = 5000;
    var EXOTIC_WOOD_PRICE = 5000;

    var HANDLES_INFO = 'These are cutout from the bottom of the board to make it easier to pick up, these are NOT physical handles that are attached or added on.';
    var FEET_INFO = 'Basic feet are just small black ruberized feet and the Brass Feet are actual metal (brass) feet with a rubber O ring inlayed that adds another level of beauty and function.';
    var ENGRAVING_INFO = 'Choose your font, type out your message, and choose where on the board you would like it! Feel free to use multiple levels and alignments to make it your own!';
    var SET_INFO = 'Choose this option to add a second matching board, this will be smaller and thinner with no juice groove, perfect to pull out for smaller or quick tasks!';

    // Wood color map
    var WOOD_COLORS = {
      'Walnut': { main: '#4a3728', grain: '#3d2d20' },
      'Maple': { main: '#f0d6a7', grain: '#e6c78f' },
      'Cherry': { main: '#a0522d', grain: '#8b4726' },
      'Padauk': { main: '#c0392b', grain: '#a93226' },
      'Purple Heart': { main: '#6b3fa0', grain: '#5b348a' },
      'Wenge': { main: '#2c1e0f', grain: '#1f1509' },
      'Limba': { main: '#d4b87a', grain: '#c4a86a' },
      'Zebra': { main: '#e8d5a3', grain: '#3d2d20' },
      'None': { main: '#888888', grain: '#777777' },
      'Creators Choice': { main: '#b8a080', grain: '#a89070' }
    };
    var DEFAULT_WOOD = { main: '#c8b090', grain: '#b8a080' };

    function getWoodColor(name) {
      return WOOD_COLORS[name] || DEFAULT_WOOD;
    }

    // Detect board type
    var boardType = 'default';
    var lowerName = productName.toLowerCase();
    if (lowerName.indexOf('1 stripe') !== -1) boardType = '1stripe';
    else if (lowerName.indexOf('multi stripe') !== -1) boardType = 'multistripe';
    else if (lowerName.indexOf('sporatic') !== -1 || lowerName.indexOf('sporadic') !== -1) boardType = 'sporadic';

    // Build wood selects based on board type
    var woodSelectsHtml = '';
    if (boardType === 'multistripe') {
      woodSelectsHtml = buildWoodSelect('mainWood', 'Main Wood') +
        buildWoodSelect('mainStripe', 'Main Stripe') +
        buildWoodSelect('stripeAccent1', 'Stripe Accent 1') +
        buildWoodSelect('stripeAccent2', 'Stripe Accent 2');
    } else if (boardType === 'sporadic') {
      woodSelectsHtml = buildWoodSelect('mainWood', 'Main Wood') +
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Add Another Wood</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-another-wood-no" name="anotherWood" value="no" checked>' +
              '<label for="opt-another-wood-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-another-wood-yes" name="anotherWood" value="yes">' +
              '<label for="opt-another-wood-yes">Yes<span class="opt-price">+$20</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="board-accent-wood-field" id="opt-accent-wood-field">' +
          buildWoodSelect('accentWood', 'Accent Wood') +
        '</div>';
    } else {
      // 1stripe and default
      woodSelectsHtml = buildWoodSelect('mainWood', 'Main Wood') +
        buildWoodSelect('stripeWood', 'Stripe Wood') +
        buildWoodSelect('accentWood', 'Stripe Accent Wood');
    }

    // Make it a Set option for basic boards
    var makeSetHtml = '';
    if (boardType === '1stripe' || boardType === 'multistripe' || boardType === 'sporadic') {
      makeSetHtml =
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Make it a Set ' + buildInfoBubble(SET_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-set-no" name="makeSet" value="no" checked>' +
              '<label for="opt-set-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-set-yes" name="makeSet" value="yes">' +
              '<label for="opt-set-yes">Yes<span class="opt-price">+$50</span></label>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    var modal = document.createElement('div');
    modal.id = 'board-options-modal';
    modal.className = 'board-options-modal';

    var dialogHtml =
      '<div class="board-options-modal__backdrop"></div>' +
      '<div class="board-options-modal__dialog" role="dialog" aria-labelledby="opt-title" aria-modal="true">' +
        '<button type="button" class="board-options-modal__close" aria-label="Close">&times;</button>' +
        '<h3 id="opt-title">' + escapeHtml(productName) + '</h3>' +
        '<p class="board-options-modal__subtitle">Customize your board</p>' +
        '<span class="board-options-modal__price" id="opt-live-price">' + formatPrice(basePrice) + '</span>' +

        // Board Preview
        '<div class="board-preview" id="opt-board-preview">' +
          '<svg id="opt-board-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" aria-label="Board preview"></svg>' +
        '</div>' +

        woodSelectsHtml +

        // Juice Groove
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Juice Groove</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-juice-no" name="juiceGroove" value="no" checked>' +
              '<label for="opt-juice-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-juice-yes" name="juiceGroove" value="yes">' +
              '<label for="opt-juice-yes">Yes<span class="opt-price">+$10</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Handles
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Handles ' + buildInfoBubble(HANDLES_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-handles-no" name="handles" value="no" checked>' +
              '<label for="opt-handles-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-handles-yes" name="handles" value="yes">' +
              '<label for="opt-handles-yes">Yes<span class="opt-price">+$10</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Feet
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Feet ' + buildInfoBubble(FEET_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-feet-none" name="feet" value="none" checked>' +
              '<label for="opt-feet-none">No Feet</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-feet-basic" name="feet" value="basic">' +
              '<label for="opt-feet-basic">Basic Feet<span class="opt-price">+$5</span></label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="opt-feet-brass" name="feet" value="brass">' +
              '<label for="opt-feet-brass">Brass Feet<span class="opt-price">+$20</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Engraving
        '<div class="board-engraving-section">' +
          '<div class="board-opt-group">' +
            '<span class="board-opt-group__label">Custom Engraving ' + buildInfoBubble(ENGRAVING_INFO) + '</span>' +
            '<div class="board-opt-radios">' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="opt-eng-no" name="engraving" value="no" checked>' +
                '<label for="opt-eng-no">No</label>' +
              '</div>' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="opt-eng-yes" name="engraving" value="yes">' +
                '<label for="opt-eng-yes">Yes<span class="opt-price">+$20</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="board-engraving-fields" id="opt-eng-fields">' +
            '<div class="board-opt-group">' +
              '<span class="board-opt-group__label">Engraving Placement</span>' +
              '<div class="board-opt-radios">' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="opt-eng-front" name="engPlacement" value="front">' +
                  '<label for="opt-eng-front">Front of Board</label>' +
                '</div>' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="opt-eng-back" name="engPlacement" value="back">' +
                  '<label for="opt-eng-back">Back of Board</label>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="board-opt-group">' +
              '<label class="board-opt-group__label" for="opt-eng-font">Font</label>' +
              '<select id="opt-eng-font" class="board-opt-group__select">' +
                '<option value="serif">Serif (Classic)</option>' +
                '<option value="sans-serif">Sans-Serif (Modern)</option>' +
                '<option value="script">Script (Elegant)</option>' +
                '<option value="monospace">Monospace (Clean)</option>' +
              '</select>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="opt-eng-top">Top Line</label>' +
                '<input type="text" id="opt-eng-top" maxlength="40" placeholder="e.g. The Johnson Family">' +
              '</div>' +
              '<div>' +
                '<label for="opt-eng-top-align">Align</label>' +
                '<select id="opt-eng-top-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="opt-eng-mid">Middle Line</label>' +
                '<input type="text" id="opt-eng-mid" maxlength="40" placeholder="e.g. Est. 2024">' +
              '</div>' +
              '<div>' +
                '<label for="opt-eng-mid-align">Align</label>' +
                '<select id="opt-eng-mid-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="opt-eng-bot">Bottom Line</label>' +
                '<input type="text" id="opt-eng-bot" maxlength="40" placeholder="e.g. Made with Love">' +
              '</div>' +
              '<div>' +
                '<label for="opt-eng-bot-align">Align</label>' +
                '<select id="opt-eng-bot-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-preview" id="opt-eng-preview">' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="opt-prev-top">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="opt-prev-mid">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="opt-prev-bot">&nbsp;</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        makeSetHtml +

        '<div class="board-options-modal__actions">' +
          '<button type="button" class="btn btn--outline" id="opt-cancel">Cancel</button>' +
          '<button type="button" class="btn btn--accent" id="opt-add-cart">Add to Cart</button>' +
        '</div>' +
      '</div>';

    modal.innerHTML = dialogHtml;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var dialog = modal.querySelector('.board-options-modal__dialog');
    var backdrop = modal.querySelector('.board-options-modal__backdrop');
    var closeBtn = modal.querySelector('.board-options-modal__close');
    var cancelBtn = document.getElementById('opt-cancel');
    var addCartBtn = document.getElementById('opt-add-cart');
    var livePrice = document.getElementById('opt-live-price');

    // ---- Board Preview Rendering ----
    var boardSvg = document.getElementById('opt-board-svg');

    function renderBoardPreview() {
      var mainWoodSel = document.getElementById('opt-mainWood');
      var mainColor = mainWoodSel ? getWoodColor(mainWoodSel.value) : DEFAULT_WOOD;

      var svg = '';
      var W = 300, H = 200;
      var padding = 10;
      var boardW = W - padding * 2;
      var boardH = H - padding * 2;
      var rx = 6;

      // Board outline
      svg += '<rect x="' + padding + '" y="' + padding + '" width="' + boardW + '" height="' + boardH + '" rx="' + rx + '" fill="' + mainColor.main + '" stroke="#222" stroke-width="1.5"/>';

      // Add grain lines to main wood
      for (var g = 0; g < 8; g++) {
        var gy = padding + 15 + g * (boardH / 9);
        svg += '<line x1="' + (padding + 5) + '" y1="' + gy + '" x2="' + (padding + boardW - 5) + '" y2="' + (gy + 3) + '" stroke="' + mainColor.grain + '" stroke-width="0.8" opacity="0.4"/>';
      }

      if (boardType === '1stripe' || boardType === 'default') {
        var stripeSel = document.getElementById('opt-stripeWood');
        var accentSel = document.getElementById('opt-accentWood');
        var stripeColor = stripeSel ? getWoodColor(stripeSel.value) : DEFAULT_WOOD;
        var accentColor = accentSel ? getWoodColor(accentSel.value) : DEFAULT_WOOD;

        // Center horizontal stripe
        var stripeH = 20;
        var stripeY = padding + (boardH - stripeH) / 2;
        svg += '<rect x="' + padding + '" y="' + stripeY + '" width="' + boardW + '" height="' + stripeH + '" rx="0" fill="' + stripeColor.main + '"/>';

        // Thin accent lines above and below stripe
        var accentH = 5;
        svg += '<rect x="' + padding + '" y="' + (stripeY - accentH - 2) + '" width="' + boardW + '" height="' + accentH + '" fill="' + accentColor.main + '"/>';
        svg += '<rect x="' + padding + '" y="' + (stripeY + stripeH + 2) + '" width="' + boardW + '" height="' + accentH + '" fill="' + accentColor.main + '"/>';

      } else if (boardType === 'multistripe') {
        var mainStripeSel = document.getElementById('opt-mainStripe');
        var accent1Sel = document.getElementById('opt-stripeAccent1');
        var accent2Sel = document.getElementById('opt-stripeAccent2');
        var mainStripeColor = mainStripeSel ? getWoodColor(mainStripeSel.value) : DEFAULT_WOOD;
        var accent1Color = accent1Sel ? getWoodColor(accent1Sel.value) : DEFAULT_WOOD;
        var accent2Color = accent2Sel ? getWoodColor(accent2Sel.value) : DEFAULT_WOOD;

        // Layout: outer stripe (main) | gap | accent2 | accent1 | center stripe (2x) | accent1 | accent2 | gap | outer stripe (main)
        var thinH = 8;
        var thickH = thinH * 2;
        var accent1H = 6;
        var accent2H = 6;
        var centerY = padding + boardH / 2;

        // Center main stripe
        svg += '<rect x="' + padding + '" y="' + (centerY - thickH / 2) + '" width="' + boardW + '" height="' + thickH + '" fill="' + mainStripeColor.main + '"/>';

        // Accent 1 directly above and below center stripe
        svg += '<rect x="' + padding + '" y="' + (centerY - thickH / 2 - accent1H) + '" width="' + boardW + '" height="' + accent1H + '" fill="' + accent1Color.main + '"/>';
        svg += '<rect x="' + padding + '" y="' + (centerY + thickH / 2) + '" width="' + boardW + '" height="' + accent1H + '" fill="' + accent1Color.main + '"/>';

        // Accent 2 directly outside accent 1
        var accent2TopY = centerY - thickH / 2 - accent1H - accent2H;
        var accent2BotY = centerY + thickH / 2 + accent1H;
        svg += '<rect x="' + padding + '" y="' + accent2TopY + '" width="' + boardW + '" height="' + accent2H + '" fill="' + accent2Color.main + '"/>';
        svg += '<rect x="' + padding + '" y="' + accent2BotY + '" width="' + boardW + '" height="' + accent2H + '" fill="' + accent2Color.main + '"/>';

        // Outer stripes evenly spaced between center group and board edge (main stripe color)
        var topEdge = padding;
        var botEdge = padding + boardH;
        var centerGroupTop = accent2TopY;
        var centerGroupBot = accent2BotY + accent2H;
        var outerTopY = topEdge + (centerGroupTop - topEdge - thinH) / 2;
        var outerBotY = centerGroupBot + (botEdge - centerGroupBot - thinH) / 2;

        svg += '<rect x="' + padding + '" y="' + outerTopY + '" width="' + boardW + '" height="' + thinH + '" fill="' + mainStripeColor.main + '"/>';
        svg += '<rect x="' + padding + '" y="' + outerBotY + '" width="' + boardW + '" height="' + thinH + '" fill="' + mainStripeColor.main + '"/>';

      } else if (boardType === 'sporadic') {
        var anotherWoodRadio = modal.querySelector('input[name="anotherWood"]:checked');
        var hasAccent = anotherWoodRadio && anotherWoodRadio.value === 'yes';
        var accentSel = document.getElementById('opt-accentWood');
        var accentColor = (hasAccent && accentSel) ? getWoodColor(accentSel.value) : null;

        // End-grain grid of uniform blocks with sporadic accent pieces
        var blockW = 22;
        var blockH = 22;
        var gapX = 3;
        var gapY = 3;
        var cols = Math.floor((boardW + gapX) / (blockW + gapX));
        var rows = Math.floor((boardH + gapY) / (blockH + gapY));
        var gridW = cols * blockW + (cols - 1) * gapX;
        var gridH = rows * blockH + (rows - 1) * gapY;
        var offsetX = padding + (boardW - gridW) / 2;
        var offsetY = padding + (boardH - gridH) / 2;

        // Pick 22-26 sporadic accent positions, at least 2 per column, none vertically adjacent
        var totalBlocks = cols * rows;
        var accentCount = Math.min(26, Math.max(22, Math.floor(totalBlocks * 0.35)));
        var accentPositions = {};

        // Helper: check if placing accent at (row, col) would be adjacent vertically
        function hasVerticalNeighbor(r, c) {
          if (r > 0 && accentPositions[(r - 1) * cols + c]) return true;
          if (r < rows - 1 && accentPositions[(r + 1) * cols + c]) return true;
          return false;
        }

        // First guarantee at least 2 accent pieces per column, non-adjacent
        var sporadicRowOffsets = [1, 4, 0, 5, 2, 6, 1, 3, 5, 2, 4, 0];
        for (var col2 = 0; col2 < cols; col2++) {
          var r1 = sporadicRowOffsets[col2 % sporadicRowOffsets.length] % rows;
          // Shift column 10 (index 9) accent pieces up by 1
          if (col2 === 9 && r1 > 0) r1 = r1 - 1;
          // Column 9 (index 8): shift top piece down 1
          if (col2 === 8) {
            r1 = (r1 + 1) % rows;
          }
          accentPositions[r1 * cols + col2] = true;
          // Pick r2 that is not adjacent to r1
          var r2 = sporadicRowOffsets[(col2 + 4) % sporadicRowOffsets.length] % rows;
          if (col2 === 9 && r2 > 0) r2 = r2 - 1;
          if (r2 === r1) r2 = (r1 + 2) % rows;
          if (Math.abs(r2 - r1) <= 1) r2 = (r1 + 2) % rows;
          if (r2 < 0) r2 += rows;
          accentPositions[r2 * cols + col2] = true;
        }

        // Fill remaining accent spots sporadically, enforcing no vertical adjacency
        var placed = Object.keys(accentPositions).length;
        var fillStep = Math.max(1, Math.floor(totalBlocks / (accentCount - placed + 1)));
        var fillOffsets = [0, 5, 2, 7, 1, 4, 6, 3, 0, 5, 2, 7, 1, 4, 6, 3];
        var fillIdx = 0;
        var maxIter = totalBlocks * 2;
        while (placed < accentCount && fillIdx < maxIter) {
          var pos = (fillIdx * fillStep + fillOffsets[fillIdx % fillOffsets.length]) % totalBlocks;
          var pRow = Math.floor(pos / cols);
          var pCol = pos % cols;
          // Skip column 9 (index 8) — only keep its 2 initial pieces
          if (!accentPositions[pos] && pCol !== 8 && !hasVerticalNeighbor(pRow, pCol)) {
            accentPositions[pos] = true;
            placed++;
          }
          fillIdx++;
        }

        var idx = 0;
        var halfBlock = (blockH + gapY) / 2;
        var boardBottom = padding + boardH;
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var bx = offsetX + col * (blockW + gapX);
            var by = offsetY + row * (blockH + gapY) + (col % 2 === 1 ? halfBlock : 0);
            var bh = blockH;
            // Clip blocks that extend past the board bottom
            if (by + bh > boardBottom) {
              bh = boardBottom - by;
              if (bh <= 0) { idx++; continue; }
            }
            var isAccent = accentColor && accentPositions[idx];
            var bColor = isAccent ? accentColor : mainColor;
            svg += '<rect x="' + bx + '" y="' + by + '" width="' + blockW + '" height="' + bh + '" fill="' + bColor.main + '" stroke="' + bColor.grain + '" stroke-width="0.5" rx="1"/>';
            idx++;
          }
        }
      }

      // Juice groove
      var juiceGroove = modal.querySelector('input[name="juiceGroove"]:checked');
      if (juiceGroove && juiceGroove.value === 'yes') {
        var grooveInset = 18;
        svg += '<rect x="' + (padding + grooveInset) + '" y="' + (padding + grooveInset) + '" width="' + (boardW - grooveInset * 2) + '" height="' + (boardH - grooveInset * 2) + '" rx="4" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2.5" stroke-dasharray="4 2"/>';
      }

      // Handles (cutouts on short sides)
      var handles = modal.querySelector('input[name="handles"]:checked');
      if (handles && handles.value === 'yes') {
        var handleW = 30;
        var handleH = 12;
        var hY = padding + (boardH - handleH) / 2;
        svg += '<rect x="' + (padding - 1) + '" y="' + hY + '" width="' + handleW + '" height="' + handleH + '" rx="4" fill="#1a1a1a" opacity="0.6"/>';
        svg += '<rect x="' + (padding + boardW - handleW + 1) + '" y="' + hY + '" width="' + handleW + '" height="' + handleH + '" rx="4" fill="#1a1a1a" opacity="0.6"/>';
      }

      // Feet
      var feet = modal.querySelector('input[name="feet"]:checked');
      if (feet && feet.value !== 'none') {
        var footR = feet.value === 'brass' ? 5 : 4;
        var footColor = feet.value === 'brass' ? '#c9a84c' : '#333';
        var footInset = 25;
        svg += '<circle cx="' + (padding + footInset) + '" cy="' + (padding + footInset) + '" r="' + footR + '" fill="' + footColor + '"/>';
        svg += '<circle cx="' + (padding + boardW - footInset) + '" cy="' + (padding + footInset) + '" r="' + footR + '" fill="' + footColor + '"/>';
        svg += '<circle cx="' + (padding + footInset) + '" cy="' + (padding + boardH - footInset) + '" r="' + footR + '" fill="' + footColor + '"/>';
        svg += '<circle cx="' + (padding + boardW - footInset) + '" cy="' + (padding + boardH - footInset) + '" r="' + footR + '" fill="' + footColor + '"/>';
      }

      boardSvg.innerHTML = svg;
    }

    // Initial render
    renderBoardPreview();

    // "Add Another Wood" toggle for sporadic boards
    if (boardType === 'sporadic') {
      var accentField = document.getElementById('opt-accent-wood-field');
      var anotherWoodRadios = modal.querySelectorAll('input[name="anotherWood"]');
      anotherWoodRadios.forEach(function (r) {
        r.addEventListener('change', function () {
          if (r.value === 'yes') {
            accentField.classList.add('board-accent-wood-field--visible');
          } else {
            accentField.classList.remove('board-accent-wood-field--visible');
          }
          updateLivePrice();
          renderBoardPreview();
        });
      });
    }

    // Engraving toggle
    var engFields = document.getElementById('opt-eng-fields');
    var engRadios = modal.querySelectorAll('input[name="engraving"]');
    engRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.value === 'yes') {
          engFields.classList.add('board-engraving-fields--visible');
        } else {
          engFields.classList.remove('board-engraving-fields--visible');
        }
        updateLivePrice();
      });
    });

    // Engraving preview updates
    var engTopInput = document.getElementById('opt-eng-top');
    var engMidInput = document.getElementById('opt-eng-mid');
    var engBotInput = document.getElementById('opt-eng-bot');
    var engTopAlign = document.getElementById('opt-eng-top-align');
    var engMidAlign = document.getElementById('opt-eng-mid-align');
    var engBotAlign = document.getElementById('opt-eng-bot-align');
    var engFontSelect = document.getElementById('opt-eng-font');
    var prevTop = document.getElementById('opt-prev-top');
    var prevMid = document.getElementById('opt-prev-mid');
    var prevBot = document.getElementById('opt-prev-bot');
    var engPreview = document.getElementById('opt-eng-preview');

    var FONT_MAP = {
      'serif': 'Georgia, "Times New Roman", serif',
      'sans-serif': '"Inter", Arial, sans-serif',
      'script': '"Brush Script MT", "Segoe Script", cursive',
      'monospace': '"Courier New", Courier, monospace'
    };

    function updatePreview() {
      updatePreviewLine(prevTop, engTopInput.value, engTopAlign.value);
      updatePreviewLine(prevMid, engMidInput.value, engMidAlign.value);
      updatePreviewLine(prevBot, engBotInput.value, engBotAlign.value);
      engPreview.style.fontFamily = FONT_MAP[engFontSelect.value] || '';
    }

    function updatePreviewLine(el, text, align) {
      var t = text.trim();
      if (t) {
        el.textContent = t;
        el.classList.remove('engraving-preview__line--empty');
      } else {
        el.innerHTML = '&nbsp;';
        el.classList.add('engraving-preview__line--empty');
      }
      el.style.textAlign = align;
    }

    [engTopInput, engMidInput, engBotInput].forEach(function (inp) {
      inp.addEventListener('input', updatePreview);
    });
    [engTopAlign, engMidAlign, engBotAlign, engFontSelect].forEach(function (sel) {
      sel.addEventListener('change', updatePreview);
    });

    // Live price calculation
    function isExoticWood(val) {
      if (!val || val === 'None' || val === 'Creators Choice') return false;
      return STANDARD_WOODS.indexOf(val) === -1;
    }

    function calcTotalPrice() {
      var total = basePrice;
      // Exotic main wood surcharge
      var mainWoodSel = document.getElementById('opt-mainWood');
      if (mainWoodSel && isExoticWood(mainWoodSel.value)) total += EXOTIC_WOOD_PRICE;
      var handles = modal.querySelector('input[name="handles"]:checked');
      if (handles && handles.value === 'yes') total += HANDLE_PRICE;
      var feet = modal.querySelector('input[name="feet"]:checked');
      if (feet) {
        if (feet.value === 'basic') total += BASIC_FEET_PRICE;
        if (feet.value === 'brass') total += BRASS_FEET_PRICE;
      }
      var eng = modal.querySelector('input[name="engraving"]:checked');
      if (eng && eng.value === 'yes') total += ENGRAVING_PRICE_OPT;
      var anotherWood = modal.querySelector('input[name="anotherWood"]:checked');
      if (anotherWood && anotherWood.value === 'yes') total += ACCENT_WOOD_PRICE;
      var juiceGroove = modal.querySelector('input[name="juiceGroove"]:checked');
      if (juiceGroove && juiceGroove.value === 'yes') total += 1000;
      var makeSet = modal.querySelector('input[name="makeSet"]:checked');
      if (makeSet && makeSet.value === 'yes') total += SET_PRICE;
      return total;
    }

    function updateLivePrice() {
      livePrice.textContent = formatPrice(calcTotalPrice());
    }

    // Attach price update and preview update to all radios and selects
    modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () { updateLivePrice(); renderBoardPreview(); });
    });
    modal.querySelectorAll('select').forEach(function (s) {
      s.addEventListener('change', function () { updateLivePrice(); renderBoardPreview(); });
    });

    // Cleanup
    function cleanup() {
      modal.remove();
      document.body.style.overflow = '';
    }

    // Close actions
    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cleanup();
    });

    // Validation helper — marks missing selects red
    function markSelect(id, isError) {
      var el = document.getElementById(id);
      if (!el) return;
      if (isError) {
        el.classList.add('board-opt-error');
      } else {
        el.classList.remove('board-opt-error');
      }
    }

    function markRadioGroup(name, isError) {
      var radios = modal.querySelectorAll('input[name="' + name + '"]');
      radios.forEach(function (r) {
        var lbl = r.nextElementSibling;
        if (lbl) {
          if (isError) lbl.classList.add('board-opt-error-radio');
          else lbl.classList.remove('board-opt-error-radio');
        }
      });
    }

    function clearAllErrors() {
      modal.querySelectorAll('.board-opt-error').forEach(function (el) {
        el.classList.remove('board-opt-error');
      });
      modal.querySelectorAll('.board-opt-error-radio').forEach(function (el) {
        el.classList.remove('board-opt-error-radio');
      });
    }

    // Clear error on change
    modal.querySelectorAll('select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        sel.classList.remove('board-opt-error');
      });
    });
    modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var lbl = r.closest('.board-opt-radios');
        if (lbl) {
          lbl.querySelectorAll('.board-opt-error-radio').forEach(function (el) {
            el.classList.remove('board-opt-error-radio');
          });
        }
      });
    });

    // Add to cart
    addCartBtn.addEventListener('click', function () {
      clearAllErrors();
      var options = {};
      var hasError = false;

      // Validate wood selections based on board type
      if (boardType === 'multistripe') {
        var mainWood = document.getElementById('opt-mainWood').value;
        var mainStripe = document.getElementById('opt-mainStripe').value;
        var stripeAccent1 = document.getElementById('opt-stripeAccent1').value;
        var stripeAccent2 = document.getElementById('opt-stripeAccent2').value;
        if (!mainWood) { markSelect('opt-mainWood', true); hasError = true; }
        if (!mainStripe) { markSelect('opt-mainStripe', true); hasError = true; }
        if (!stripeAccent1) { markSelect('opt-stripeAccent1', true); hasError = true; }
        if (!stripeAccent2) { markSelect('opt-stripeAccent2', true); hasError = true; }
        if (hasError) { showToast('Please fill in all highlighted fields'); return; }
        options.mainWood = mainWood;
        options.mainStripe = mainStripe;
        options.stripeAccent1 = stripeAccent1;
        options.stripeAccent2 = stripeAccent2;
      } else if (boardType === 'sporadic') {
        var mainWood = document.getElementById('opt-mainWood').value;
        if (!mainWood) { markSelect('opt-mainWood', true); hasError = true; }
        var anotherWoodVal = modal.querySelector('input[name="anotherWood"]:checked');
        if (anotherWoodVal && anotherWoodVal.value === 'yes') {
          var accentWood = document.getElementById('opt-accentWood').value;
          if (!accentWood) { markSelect('opt-accentWood', true); hasError = true; }
          else { options.accentWood = accentWood; }
        }
        if (hasError) { showToast('Please fill in all highlighted fields'); return; }
        options.mainWood = mainWood;
      } else {
        // 1stripe / default
        var mainWood = document.getElementById('opt-mainWood').value;
        var stripeWood = document.getElementById('opt-stripeWood').value;
        var accentWood = document.getElementById('opt-accentWood').value;
        if (!mainWood) { markSelect('opt-mainWood', true); hasError = true; }
        if (!stripeWood) { markSelect('opt-stripeWood', true); hasError = true; }
        if (!accentWood) { markSelect('opt-accentWood', true); hasError = true; }
        if (hasError) { showToast('Please fill in all highlighted fields'); return; }
        options.mainWood = mainWood;
        options.stripeWood = stripeWood;
        options.accentWood = accentWood;
      }

      var handlesVal = modal.querySelector('input[name="handles"]:checked').value;
      var feetVal = modal.querySelector('input[name="feet"]:checked').value;
      var engVal = modal.querySelector('input[name="engraving"]:checked').value;
      var juiceGrooveVal = modal.querySelector('input[name="juiceGroove"]:checked').value;

      options.handles = handlesVal === 'yes';
      options.feet = feetVal === 'none' ? null : (feetVal === 'basic' ? 'Basic' : 'Brass');
      options.juiceGroove = juiceGrooveVal === 'yes';
      options.engravingLines = null;

      // Make it a Set
      var makeSetRadio = modal.querySelector('input[name="makeSet"]:checked');
      if (makeSetRadio && makeSetRadio.value === 'yes') {
        options.makeSet = true;
      }

      if (engVal === 'yes') {
        // Validate engraving placement
        var engPlacement = modal.querySelector('input[name="engPlacement"]:checked');
        if (!engPlacement) {
          markRadioGroup('engPlacement', true);
          showToast('Please select engraving placement (Front or Back)');
          return;
        }

        var topText = engTopInput.value.trim();
        var midText = engMidInput.value.trim();
        var botText = engBotInput.value.trim();
        if (!topText && !midText && !botText) {
          showToast('Please enter at least one engraving line');
          return;
        }
        options.engravingLines = {
          placement: engPlacement.value,
          top: topText || '',
          topAlign: engTopAlign.value,
          middle: midText || '',
          middleAlign: engMidAlign.value,
          bottom: botText || '',
          bottomAlign: engBotAlign.value,
          font: engFontSelect.value
        };
      }

      var finalPrice = calcTotalPrice();
      callback(options, finalPrice);
      cleanup();
    });

    // Focus the dialog
    closeBtn.focus();
  }

  // ---- Board Options Click Handler ----

  function initBoardOptions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-card__options-btn');
      if (!btn) return;

      var card = btn.closest('.product-card');
      if (!card) return;

      var id = card.getAttribute('data-product-id');
      var name = card.getAttribute('data-product-name');
      var price = parseInt(card.getAttribute('data-product-price'), 10);
      var qtyInput = card.querySelector('.product-card__qty');
      var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
      if (isNaN(qty) || qty < 1) qty = 1;
      if (isNaN(price)) return;

      showBoardOptionsModal(name, price, qty, id, function (options, finalPrice) {
        addToCart(id, name, finalPrice, qty, undefined, options);
        updateCartBadge();
        showToast(qty + 'x ' + name + ' added to cart');
      });
    });
  }

  // ---- Pattern Board Options Modal ----

  function showPatternBoardOptionsModal(productName, basePrice, qty, productId, hasColorChoice, callback) {
    var old = document.getElementById('pattern-options-modal');
    if (old) old.remove();

    var HANDLE_PRICE = 1000;
    var BASIC_FEET_PRICE = 500;
    var BRASS_FEET_PRICE = 2000;
    var ENGRAVING_PRICE_OPT = 2000;
    var JUICE_GROOVE_PRICE = 1000;

    var HANDLES_INFO = 'These are cutout from the bottom of the board to make it easier to pick up, these are NOT physical handles that are attached or added on.';
    var FEET_INFO = 'Basic feet are just small black ruberized feet and the Brass Feet are actual metal (brass) feet with a rubber O ring inlayed that adds another level of beauty and function.';
    var ENGRAVING_INFO = 'Choose your font, type out your message, and choose where on the board you would like it! Feel free to use multiple levels and alignments to make it your own!';

    // Color choice section (only for Tight Weave and Large Weave)
    var colorChoiceHtml = '';
    if (hasColorChoice) {
      colorChoiceHtml =
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Choose Color</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-color-purple" name="patColor" value="Purple Heart" checked>' +
              '<label for="pat-color-purple">Purple Heart</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-color-padauk" name="patColor" value="Padauk">' +
              '<label for="pat-color-padauk">Padauk (Red)</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-color-cherry" name="patColor" value="Cherry">' +
              '<label for="pat-color-cherry">Cherry (Light Brown)</label>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    var modal = document.createElement('div');
    modal.id = 'pattern-options-modal';
    modal.className = 'board-options-modal';

    var dialogHtml =
      '<div class="board-options-modal__backdrop"></div>' +
      '<div class="board-options-modal__dialog" role="dialog" aria-labelledby="pat-opt-title" aria-modal="true">' +
        '<button type="button" class="board-options-modal__close" aria-label="Close">&times;</button>' +
        '<h3 id="pat-opt-title">' + escapeHtml(productName) + '</h3>' +
        '<p class="board-options-modal__subtitle">Customize your board</p>' +
        '<span class="board-options-modal__price" id="pat-opt-price">' + formatPrice(basePrice) + '</span>' +

        colorChoiceHtml +

        // Juice Groove
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Juice Groove</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-juice-no" name="patJuiceGroove" value="no" checked>' +
              '<label for="pat-juice-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-juice-yes" name="patJuiceGroove" value="yes">' +
              '<label for="pat-juice-yes">Yes<span class="opt-price">+$10</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Handles
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Handles ' + buildInfoBubble(HANDLES_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-handles-no" name="patHandles" value="no" checked>' +
              '<label for="pat-handles-no">No</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-handles-yes" name="patHandles" value="yes">' +
              '<label for="pat-handles-yes">Yes<span class="opt-price">+$10</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Feet
        '<div class="board-opt-group">' +
          '<span class="board-opt-group__label">Feet ' + buildInfoBubble(FEET_INFO) + '</span>' +
          '<div class="board-opt-radios">' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-feet-none" name="patFeet" value="none" checked>' +
              '<label for="pat-feet-none">No Feet</label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-feet-basic" name="patFeet" value="basic">' +
              '<label for="pat-feet-basic">Basic Feet<span class="opt-price">+$5</span></label>' +
            '</div>' +
            '<div class="board-opt-radio">' +
              '<input type="radio" id="pat-feet-brass" name="patFeet" value="brass">' +
              '<label for="pat-feet-brass">Brass Feet<span class="opt-price">+$20</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Engraving
        '<div class="board-engraving-section">' +
          '<div class="board-opt-group">' +
            '<span class="board-opt-group__label">Custom Engraving ' + buildInfoBubble(ENGRAVING_INFO) + '</span>' +
            '<div class="board-opt-radios">' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="pat-eng-no" name="patEngraving" value="no" checked>' +
                '<label for="pat-eng-no">No</label>' +
              '</div>' +
              '<div class="board-opt-radio">' +
                '<input type="radio" id="pat-eng-yes" name="patEngraving" value="yes">' +
                '<label for="pat-eng-yes">Yes<span class="opt-price">+$20</span></label>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="board-engraving-fields" id="pat-eng-fields">' +
            '<div class="board-opt-group">' +
              '<span class="board-opt-group__label">Engraving Placement</span>' +
              '<div class="board-opt-radios">' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="pat-eng-front" name="patEngPlacement" value="front">' +
                  '<label for="pat-eng-front">Front of Board</label>' +
                '</div>' +
                '<div class="board-opt-radio">' +
                  '<input type="radio" id="pat-eng-back" name="patEngPlacement" value="back">' +
                  '<label for="pat-eng-back">Back of Board</label>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="board-opt-group">' +
              '<label class="board-opt-group__label" for="pat-eng-font">Font</label>' +
              '<select id="pat-eng-font" class="board-opt-group__select">' +
                '<option value="serif">Serif (Classic)</option>' +
                '<option value="sans-serif">Sans-Serif (Modern)</option>' +
                '<option value="script">Script (Elegant)</option>' +
                '<option value="monospace">Monospace (Clean)</option>' +
              '</select>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="pat-eng-top">Top Line</label>' +
                '<input type="text" id="pat-eng-top" maxlength="40" placeholder="e.g. The Johnson Family">' +
              '</div>' +
              '<div>' +
                '<label for="pat-eng-top-align">Align</label>' +
                '<select id="pat-eng-top-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="pat-eng-mid">Middle Line</label>' +
                '<input type="text" id="pat-eng-mid" maxlength="40" placeholder="e.g. Est. 2024">' +
              '</div>' +
              '<div>' +
                '<label for="pat-eng-mid-align">Align</label>' +
                '<select id="pat-eng-mid-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-row">' +
              '<div>' +
                '<label for="pat-eng-bot">Bottom Line</label>' +
                '<input type="text" id="pat-eng-bot" maxlength="40" placeholder="e.g. Made with Love">' +
              '</div>' +
              '<div>' +
                '<label for="pat-eng-bot-align">Align</label>' +
                '<select id="pat-eng-bot-align">' +
                  '<option value="center">Center</option>' +
                  '<option value="left">Left</option>' +
                  '<option value="right">Right</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div class="engraving-preview" id="pat-eng-preview">' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="pat-prev-top">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="pat-prev-mid">&nbsp;</div>' +
              '<div class="engraving-preview__line engraving-preview__line--empty" id="pat-prev-bot">&nbsp;</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="board-options-modal__actions">' +
          '<button type="button" class="btn btn--outline" id="pat-opt-cancel">Cancel</button>' +
          '<button type="button" class="btn btn--accent" id="pat-opt-add">Add to Cart</button>' +
        '</div>' +
      '</div>';

    modal.innerHTML = dialogHtml;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var backdrop = modal.querySelector('.board-options-modal__backdrop');
    var closeBtn = modal.querySelector('.board-options-modal__close');
    var cancelBtn = document.getElementById('pat-opt-cancel');
    var addBtn = document.getElementById('pat-opt-add');
    var livePrice = document.getElementById('pat-opt-price');

    // Engraving toggle
    var engFields = document.getElementById('pat-eng-fields');
    var engRadios = modal.querySelectorAll('input[name="patEngraving"]');
    engRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.value === 'yes') {
          engFields.classList.add('board-engraving-fields--visible');
        } else {
          engFields.classList.remove('board-engraving-fields--visible');
        }
        updatePatPrice();
      });
    });

    // Engraving preview
    var patEngTopInput = document.getElementById('pat-eng-top');
    var patEngMidInput = document.getElementById('pat-eng-mid');
    var patEngBotInput = document.getElementById('pat-eng-bot');
    var patEngTopAlign = document.getElementById('pat-eng-top-align');
    var patEngMidAlign = document.getElementById('pat-eng-mid-align');
    var patEngBotAlign = document.getElementById('pat-eng-bot-align');
    var patEngFont = document.getElementById('pat-eng-font');
    var patPrevTop = document.getElementById('pat-prev-top');
    var patPrevMid = document.getElementById('pat-prev-mid');
    var patPrevBot = document.getElementById('pat-prev-bot');
    var patEngPreview = document.getElementById('pat-eng-preview');

    var PAT_FONT_MAP = {
      'serif': 'Georgia, "Times New Roman", serif',
      'sans-serif': '"Inter", Arial, sans-serif',
      'script': '"Brush Script MT", "Segoe Script", cursive',
      'monospace': '"Courier New", Courier, monospace'
    };

    function updatePatPreview() {
      updatePatPreviewLine(patPrevTop, patEngTopInput.value, patEngTopAlign.value);
      updatePatPreviewLine(patPrevMid, patEngMidInput.value, patEngMidAlign.value);
      updatePatPreviewLine(patPrevBot, patEngBotInput.value, patEngBotAlign.value);
      patEngPreview.style.fontFamily = PAT_FONT_MAP[patEngFont.value] || '';
    }

    function updatePatPreviewLine(el, text, align) {
      var t = text.trim();
      if (t) {
        el.textContent = t;
        el.classList.remove('engraving-preview__line--empty');
      } else {
        el.innerHTML = '&nbsp;';
        el.classList.add('engraving-preview__line--empty');
      }
      el.style.textAlign = align;
    }

    [patEngTopInput, patEngMidInput, patEngBotInput].forEach(function (inp) {
      inp.addEventListener('input', updatePatPreview);
    });
    [patEngTopAlign, patEngMidAlign, patEngBotAlign, patEngFont].forEach(function (sel) {
      sel.addEventListener('change', updatePatPreview);
    });

    // Price calculation
    function calcPatPrice() {
      var total = basePrice;
      var juiceGroove = modal.querySelector('input[name="patJuiceGroove"]:checked');
      if (juiceGroove && juiceGroove.value === 'yes') total += JUICE_GROOVE_PRICE;
      var handles = modal.querySelector('input[name="patHandles"]:checked');
      if (handles && handles.value === 'yes') total += HANDLE_PRICE;
      var feet = modal.querySelector('input[name="patFeet"]:checked');
      if (feet) {
        if (feet.value === 'basic') total += BASIC_FEET_PRICE;
        if (feet.value === 'brass') total += BRASS_FEET_PRICE;
      }
      var eng = modal.querySelector('input[name="patEngraving"]:checked');
      if (eng && eng.value === 'yes') total += ENGRAVING_PRICE_OPT;
      return total;
    }

    function updatePatPrice() {
      livePrice.textContent = formatPrice(calcPatPrice());
    }

    modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', updatePatPrice);
    });

    function cleanup() {
      modal.remove();
      document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cleanup();
    });

    addBtn.addEventListener('click', function () {
      var options = {};

      // Color choice
      if (hasColorChoice) {
        var colorVal = modal.querySelector('input[name="patColor"]:checked');
        options.color = colorVal ? colorVal.value : 'Purple Heart';
      }

      var juiceGrooveVal = modal.querySelector('input[name="patJuiceGroove"]:checked').value;
      var handlesVal = modal.querySelector('input[name="patHandles"]:checked').value;
      var feetVal = modal.querySelector('input[name="patFeet"]:checked').value;
      var engVal = modal.querySelector('input[name="patEngraving"]:checked').value;

      options.juiceGroove = juiceGrooveVal === 'yes';
      options.handles = handlesVal === 'yes';
      options.feet = feetVal === 'none' ? null : (feetVal === 'basic' ? 'Basic' : 'Brass');
      options.engravingLines = null;

      if (engVal === 'yes') {
        var engPlacement = modal.querySelector('input[name="patEngPlacement"]:checked');
        if (!engPlacement) {
          var placementLabels = modal.querySelectorAll('input[name="patEngPlacement"]');
          placementLabels.forEach(function (r) {
            var lbl = r.nextElementSibling;
            if (lbl) lbl.classList.add('board-opt-error-radio');
          });
          showToast('Please select engraving placement (Front or Back)');
          return;
        }
        var topText = patEngTopInput.value.trim();
        var midText = patEngMidInput.value.trim();
        var botText = patEngBotInput.value.trim();
        if (!topText && !midText && !botText) {
          showToast('Please enter at least one engraving line');
          return;
        }
        options.engravingLines = {
          placement: engPlacement.value,
          top: topText || '',
          topAlign: patEngTopAlign.value,
          middle: midText || '',
          middleAlign: patEngMidAlign.value,
          bottom: botText || '',
          bottomAlign: patEngBotAlign.value,
          font: patEngFont.value
        };
      }

      var finalPrice = calcPatPrice();
      callback(options, finalPrice);
      cleanup();
    });

    closeBtn.focus();
  }

  // ---- Pattern Board Options Click Handler ----

  function initPatternBoardOptions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.product-card__pattern-btn');
      if (!btn) return;

      var card = btn.closest('.product-card');
      if (!card) return;

      var id = card.getAttribute('data-product-id');
      var name = card.getAttribute('data-product-name');
      var price = parseInt(card.getAttribute('data-product-price'), 10);
      var patternType = card.getAttribute('data-pattern-board');
      var hasColorChoice = patternType === 'color';
      var qtyInput = card.querySelector('.product-card__qty');
      var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
      if (isNaN(qty) || qty < 1) qty = 1;
      if (isNaN(price)) return;

      showPatternBoardOptionsModal(name, price, qty, id, hasColorChoice, function (options, finalPrice) {
        addToCart(id, name, finalPrice, qty, undefined, options);
        updateCartBadge();
        showToast(qty + 'x ' + name + ' added to cart');
      });
    });
  }

  // ---- Gallery Slideshow ----

  function initGallerySlideshow() {
    var track = document.getElementById('gallery-track');
    if (!track) return;

    // Image sources from across the site
    var imageSources = [
      { dir: 'images/gallery/', files: [
        'Basic Cherry with Stripe.jpg',
        'Basic Walnut with Stipe.jpg',
        'Brick Pattern.jpg',
        'Checkered Pattern.jpg',
        'Intricate Large Weave.jpg',
        'Intricate Tight Weave.jpg',
        'Intricate Zigzag.jpg'
      ]},
      { dir: 'images/products/', files: [
        'bas-1stripe1.jpg', 'bas-1stripe2.jpg', 'bas-1stripe3.jpg', 'bas-1stripe4.jpg',
        'bas-multistripe1.jpg', 'bas-multistripe2.jpg',
        'bas-spor1.jpg', 'bas-spor2.jpg', 'bas-spor2eng.jpg', 'bas-spor3.jpg', 'bas-spor3eng.jpg',
        'bas-stripe3eng.jpg',
        'cherry-wenge.jpg', 'walnut-wenge.jpg',
        'easy-rider.jpg', 'easy-rider-grey.jpg', 'easy-rider-grey2.jpg',
        'high-top.jpg',
        'low-rider.jpg', 'low-rider-grey.jpg', 'low-rider-grey2.jpg',
        'rocker-2tone.jpg', 'rocker-2tone2.jpg', 'rocker-grey.jpg', 'rocker-grey2.jpg'
      ]},
      { dir: 'images/hero/', files: [
        '20250829_175953.jpg', '20260113_222804.jpg', '20260320_002415.jpg',
        '20260320_155548.jpg', '20260320_155606.jpg', '20260331_003349.jpg', '20260501_221956.jpg'
      ]}
    ];

    var allImages = [];
    for (var s = 0; s < imageSources.length; s++) {
      var src = imageSources[s];
      for (var f = 0; f < src.files.length; f++) {
        allImages.push(src.dir + src.files[f]);
      }
    }

    if (!allImages.length) return;

    // Size variants cycle
    var sizes = ['tall', 'wide', 'square', 'wide', 'tall', 'square'];

    // Build gallery items
    var html = '';
    for (var i = 0; i < allImages.length; i++) {
      var sizeClass = 'gallery-scroll__item--' + sizes[i % sizes.length];
      html += '<div class="gallery-scroll__item ' + sizeClass + '" data-gallery-idx="' + i + '">' +
        '<img src="' + allImages[i] + '" alt="Gallery image ' + (i + 1) + '" loading="lazy">' +
        '</div>';
    }
    track.innerHTML = html;

    // ---- Drag-to-scroll ----
    var scrollSection = document.getElementById('gallery-scroll');
    var isDragging = false;
    var startX = 0;
    var scrollLeft = 0;
    var currentTranslate = 0;
    var trackWidth = track.scrollWidth;
    var containerWidth = scrollSection.offsetWidth;
    var maxTranslate = 0;
    var minTranslate = -(trackWidth - containerWidth);
    var velocity = 0;
    var lastX = 0;
    var lastTime = 0;
    var animationId = null;

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function recalcBounds() {
      trackWidth = track.scrollWidth;
      containerWidth = scrollSection.offsetWidth;
      minTranslate = Math.min(0, -(trackWidth - containerWidth));
    }

    function setTranslate(val) {
      currentTranslate = clamp(val, minTranslate, maxTranslate);
      track.style.transform = 'translateX(' + currentTranslate + 'px)';
    }

    // Mouse drag
    scrollSection.addEventListener('mousedown', function (e) {
      if (e.target.closest('.gallery-lightbox')) return;
      isDragging = true;
      startX = e.pageX;
      scrollLeft = currentTranslate;
      lastX = e.pageX;
      lastTime = Date.now();
      velocity = 0;
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
      scrollSection.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = e.pageX - startX;
      setTranslate(scrollLeft + dx);

      // Track velocity for momentum
      var now = Date.now();
      var dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.pageX - lastX) / dt;
      }
      lastX = e.pageX;
      lastTime = now;
    });

    document.addEventListener('mouseup', function () {
      if (!isDragging) return;
      isDragging = false;
      scrollSection.style.cursor = '';
      // Momentum scroll
      startMomentum();
    });

    // Touch drag
    scrollSection.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      isDragging = true;
      startX = touch.pageX;
      scrollLeft = currentTranslate;
      lastX = touch.pageX;
      lastTime = Date.now();
      velocity = 0;
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    }, { passive: true });

    scrollSection.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      var touch = e.touches[0];
      var dx = touch.pageX - startX;
      setTranslate(scrollLeft + dx);

      var now = Date.now();
      var dt = now - lastTime;
      if (dt > 0) {
        velocity = (touch.pageX - lastX) / dt;
      }
      lastX = touch.pageX;
      lastTime = now;
    }, { passive: true });

    scrollSection.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      startMomentum();
    });

    function startMomentum() {
      var friction = 0.95;
      var momentumVel = velocity * 15; // amplify

      function animate() {
        if (Math.abs(momentumVel) < 0.5) return;
        momentumVel *= friction;
        setTranslate(currentTranslate + momentumVel);
        animationId = requestAnimationFrame(animate);
      }
      animationId = requestAnimationFrame(animate);
    }

    // Wheel scroll horizontal
    scrollSection.addEventListener('wheel', function (e) {
      e.preventDefault();
      recalcBounds();
      var delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      setTranslate(currentTranslate - delta * 1.5);
    }, { passive: false });

    // ---- 3D Tilt on hover ----
    var items = track.querySelectorAll('.gallery-scroll__item');
    items.forEach(function (item) {
      item.addEventListener('mousemove', function (e) {
        if (isDragging) return;
        var rect = item.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateY = ((x - centerX) / centerX) * 12;
        var rotateX = ((centerY - y) / centerY) * 12;
        item.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.03)';
      });

      item.addEventListener('mouseleave', function () {
        item.style.transform = '';
      });

      // Click to open lightbox
      item.addEventListener('click', function (e) {
        // Only open if not dragging (allow small threshold)
        if (Math.abs(e.pageX - startX) > 5) return;
        var idx = parseInt(item.getAttribute('data-gallery-idx'), 10);
        openLightbox(idx);
      });
    });

    // ---- Lightbox ----
    var lightbox = document.getElementById('gallery-lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxClose = lightbox.querySelector('.gallery-lightbox__close');
    var lightboxPrev = lightbox.querySelector('.gallery-lightbox__prev');
    var lightboxNext = lightbox.querySelector('.gallery-lightbox__next');
    var lightboxIdx = 0;

    function openLightbox(idx) {
      lightboxIdx = idx;
      lightboxImg.src = allImages[idx];
      lightboxImg.alt = 'Gallery image ' + (idx + 1) + ' of ' + allImages.length;
      lightbox.classList.add('gallery-lightbox--open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('gallery-lightbox--open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    lightboxPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      lightboxIdx = (lightboxIdx - 1 + allImages.length) % allImages.length;
      lightboxImg.src = allImages[lightboxIdx];
    });

    lightboxNext.addEventListener('click', function (e) {
      e.stopPropagation();
      lightboxIdx = (lightboxIdx + 1) % allImages.length;
      lightboxImg.src = allImages[lightboxIdx];
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('gallery-lightbox--open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        lightboxIdx = (lightboxIdx - 1 + allImages.length) % allImages.length;
        lightboxImg.src = allImages[lightboxIdx];
      }
      if (e.key === 'ArrowRight') {
        lightboxIdx = (lightboxIdx + 1) % allImages.length;
        lightboxImg.src = allImages[lightboxIdx];
      }
    });

    // Recalc on resize
    window.addEventListener('resize', recalcBounds);
    recalcBounds();
  }

  // ---- Scroll Reveal (Intersection Observer) ----

  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      for (var i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('reveal--visible');
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

})();
