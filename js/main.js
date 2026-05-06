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

  function addToCart(id, name, price, qty) {
    var cart = getCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        existing = cart[i];
        break;
      }
    }
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: id, name: name, price: price, qty: qty });
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
      html +=
        '<div class="cart-item">' +
          '<div class="cart-item__info">' +
            '<p class="cart-item__name">' + escapeHtml(item.name) + '</p>' +
            '<p class="cart-item__detail">Qty: ' + item.qty + ' &times; ' + formatPrice(item.price) + '</p>' +
          '</div>' +
          '<button class="cart-item__remove" data-remove-id="' + escapeHtml(item.id) + '" aria-label="Remove ' + escapeHtml(item.name) + ' from cart" type="button">&times;</button>' +
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

      addToCart(id, name, price, qty);
      updateCartBadge();
      showToast(qty + 'x ' + name + ' added to cart');
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
      items.push(item.qty + 'x ' + item.name + ' (' + formatPrice(item.price) + ')');
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

  function buildProductCardHTML(product, id) {
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

    return '<article class="product-card" data-product-id="' + safe(id) +
      '" data-product-name="' + safe(product.name) +
      '" data-product-price="' + priceToCents(product.price) + '">' +
      '<div class="' + imageClass + '">' + imagesHtml + '</div>' +
      '<div class="product-card__info">' +
      '<h3 class="product-card__name">' + safe(product.name) + '</h3>' +
      '<p class="product-card__description">' + safe(product.description) + '</p>' +
      '<span class="product-card__price">' + safe(product.price) + '</span>' +
      '<div class="product-card__actions">' +
      '<label for="qty-' + safe(id) + '" class="sr-only">Quantity</label>' +
      '<input type="number" id="qty-' + safe(id) + '" class="product-card__qty" value="1" min="1" step="1" aria-label="Quantity for ' + safe(product.name) + '">' +
      '<button class="btn btn--accent product-card__add" type="button" aria-label="Add ' + safe(product.name) + ' to cart">Add to Cart</button>' +
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
          for (var p = 0; p < products.length; p++) {
            var id = slugify(catName, p);
            html += buildProductCardHTML(products[p], id);
          }
          grid.innerHTML = html;
        }
      })
      .catch(function (err) {
        console.error('Failed to load Products.md:', err);
      });
  }

  // ---- Product Image Carousel ----

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
      var id = removeBtn.getAttribute('data-remove-id');
      if (id) {
        removeFromCart(id);
        updateCartBadge();
        renderCartPanel();
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
  });

})();
