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
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('script_tag.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  }

  function getApiBaseUrl() {
    var scriptElement = getScriptElement();
    var fallbackUrl = window.__NUVEMSHOP_CUSTOM_COLORS_API__ || '';
    if (!scriptElement || !scriptElement.src) return fallbackUrl;
    try {
      var url = new URL(scriptElement.src, window.location.href);
      return url.searchParams.get('api_base') || fallbackUrl;
    } catch (error) {
      return fallbackUrl;
    }
  }

  function getProductId() {
    if (!window.LS || !window.LS.product || !window.LS.product.id) return '';
    return String(window.LS.product.id);
  }

  function findVariantNodes() {
    return document.querySelectorAll('.js-variant-button');
  }

  function applyMapping(map) {
    var nodes = findVariantNodes();

    Object.keys(map || {}).forEach(function (variantName) {
      var mapping = map[variantName];
      if (!mapping || typeof mapping !== 'object') return;

      var colorHex = mapping.color_hex;
      var displayName = mapping.display_name;
      var normalizedVariant = normalizeText(variantName);

      nodes.forEach(function (node) {
        var optionValue = normalizeText(node.getAttribute('data-option') || '');
        if (optionValue !== normalizedVariant) return;

        if (node.getAttribute('data-custom-color-applied') === 'true') return;
        node.setAttribute('data-custom-color-applied', 'true');

        node.setAttribute('data-option', displayName);
        node.setAttribute('title', displayName);

        var contentSpan = node.querySelector('.btn-variant-content');
        if (contentSpan) {
          contentSpan.setAttribute('data-name', displayName);
          contentSpan.textContent = displayName;
          if (colorHex) {
            contentSpan.style.background = colorHex;
          }
        } else if (displayName) {
          var regex = new RegExp(variantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          node.textContent = node.textContent.replace(regex, displayName);
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
      attributes: false,
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
