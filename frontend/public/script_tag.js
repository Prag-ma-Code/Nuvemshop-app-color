(function () {
  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function getScriptElement() {
    var currentScript = document.currentScript;
    if (currentScript) {
      return currentScript;
    }
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1] || null;
  }

  function getApiBaseUrl() {
    var scriptElement = getScriptElement();
    var fallbackUrl = window.__NUVEMSHOP_CUSTOM_COLORS_API__ || '';
    if (!scriptElement || !scriptElement.src) {
      return fallbackUrl;
    }
    try {
      var url = new URL(scriptElement.src, window.location.href);
      return url.searchParams.get('api_base') || fallbackUrl;
    } catch (error) {
      return fallbackUrl;
    }
  }

  function getProductId() {
    if (!window.LS || !window.LS.product || !window.LS.product.id) {
      return '';
    }
    return String(window.LS.product.id);
  }

  function isVariantNode(node) {
    var tag = (node.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'a' || tag === 'span' || tag === 'label') {
      return true;
    }
    if (node.getAttribute('data-variant') !== null) return true;
    if (node.getAttribute('data-option-value') !== null) return true;
    if (node.getAttribute('data-value') !== null) return true;
    if (node.getAttribute('role') === 'button') return true;
    if (node.className && typeof node.className === 'string') {
      if (node.className.indexOf('swatch') !== -1) return true;
      if (node.className.indexOf('variant') !== -1) return true;
      if (node.className.indexOf('option') !== -1) return true;
    }
    return false;
  }

  function findVariantNodes() {
    var selectors = [
      '.swatch',
      '.btn-variant',
      '.variant-container button',
      '.variant-option',
      '[data-variant]',
      '[data-option-value]',
      '[data-value]',
      '.product-variant',
    ];
    var bySelector = document.querySelectorAll(selectors.join(', '));
    if (bySelector.length > 0) {
      return bySelector;
    }
    var all = document.querySelectorAll('button, a, span, label');
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (isVariantNode(all[i])) {
        filtered.push(all[i]);
      }
    }
    return filtered;
  }

  function applyMapping(map) {
    var nodes = findVariantNodes();
    var appliedKeys = {};

    Object.keys(map || {}).forEach(function (variantName) {
      var mapping = map[variantName];
      if (!mapping || typeof mapping !== 'object') return;

      var colorHex = mapping.color_hex;
      var displayName = mapping.display_name;
      var normalizedVariant = normalizeText(variantName);

      nodes.forEach(function (node) {
        var nodeText = normalizeText(node.textContent || '');
        if (!nodeText) return;

        if (nodeText.indexOf(normalizedVariant) === -1) return;

        var key = variantName + '-' + (node.id || node.dataset ? Math.random() : '');
        if (appliedKeys[key]) return;
        appliedKeys[key] = true;

        if (displayName && normalizeText(displayName) !== normalizedVariant) {
          var originalText = node.textContent || '';
          var regex = new RegExp(variantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          node.textContent = originalText.replace(regex, displayName);
        }

        if (colorHex) {
          var bgColor = node.style.backgroundColor || '';
          if (bgColor === '' || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
            node.style.backgroundColor = colorHex;
            node.style.borderColor = colorHex;
          }
        }
      });
    });
  }

  function startObserver(map) {
    applyMapping(map);

    var observer = new MutationObserver(function () {
      applyMapping(map);
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });

    window.addEventListener('beforeunload', function () {
      observer.disconnect();
    }, { once: true });
  }

  async function bootstrap() {
    try {
      var productId = getProductId();
      if (!productId) return;

      var apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) return;

      var response = await fetch(
        apiBaseUrl.replace(/\/$/, '') +
          '/api/public/custom-colors?product_id=' +
          encodeURIComponent(productId),
        { credentials: 'omit' },
      );

      if (!response.ok) return;

      var data = await response.json();
      if (!data || typeof data !== 'object') return;

      startObserver(data);
    } catch (error) {
      return;
    }
  }

  if (document.readyState === 'complete') {
    bootstrap();
  } else {
    window.addEventListener('load', bootstrap, { once: true });
  }
})();
