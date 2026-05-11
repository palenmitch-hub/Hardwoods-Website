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
        newQty++;
      } else if (btn.classList.contains('cart-item__qty-minus')) {
        newQty--;
      }
      updateQty(id, newQty);
      updateCartBadge();
      renderCartPanel();
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

    // Load chairs from Chairs.md
    loadChairsFromMd();

    // Load wood inventory
    loadWoodInventory();

    // Board options modal handler
    initBoardOptions();

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

    // Attach price update to all radios and selects
    modal.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', updateLivePrice);
    });
    modal.querySelectorAll('select').forEach(function (s) {
      s.addEventListener('change', updateLivePrice);
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
