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

  function isVariantMatch(node, variantName) {
    var normalizedVariantName = normalizeText(variantName);
    if (!normalizedVariantName) {
      return false;
    }

    var text = normalizeText(node.textContent || '');
    if (text === normalizedVariantName || text.indexOf(normalizedVariantName) !== -1) {
      return true;
    }

    var attributes = [
      node.getAttribute('data-variant'),
      node.getAttribute('data-option-value'),
      node.getAttribute('data-value'),
      node.getAttribute('aria-label'),
      node.getAttribute('title'),
    ];

    return attributes.some(function (attribute) {
      return normalizeText(attribute).indexOf(normalizedVariantName) !== -1;
    });
  }

  function setCircleStyle(node, colorHex, variantName) {
    if (node.getAttribute('data-custom-color-applied') === 'true') {
      return;
    }

    node.setAttribute('data-custom-color-applied', 'true');
    node.setAttribute('title', variantName);
    node.setAttribute('aria-label', variantName);
    node.style.backgroundColor = colorHex;
    node.style.borderColor = colorHex;
    node.style.borderRadius = '9999px';
    node.style.width = '32px';
    node.style.height = '32px';
    node.style.minWidth = '32px';
    node.style.minHeight = '32px';
    node.style.padding = '0';
    node.style.overflow = 'hidden';
    node.style.display = 'inline-flex';
    node.style.alignItems = 'center';
    node.style.justifyContent = 'center';
    node.style.color = 'transparent';
    node.style.fontSize = '0';
    node.style.lineHeight = '0';
    node.style.textIndent = '-9999px';
    node.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.08)';
  }

  function applyCustomColors(map) {
    var selectors = [
      '.btn-variant',
      '.swatch',
      '.variant-container button',
      '[data-variant]',
      '[data-option-value]',
      '[data-value]',
      'button',
      '[role="button"]',
    ];

    var nodes = document.querySelectorAll(selectors.join(', '));

    Object.keys(map || {}).forEach(function (variantName) {
      var colorHex = map[variantName];

      nodes.forEach(function (node) {
        if (isVariantMatch(node, variantName)) {
          setCircleStyle(node, colorHex, variantName);
        }
      });
    });
  }

  function startObserver(map) {
    applyCustomColors(map);

    var observer = new MutationObserver(function () {
      applyCustomColors(map);
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });

    window.addEventListener(
      'beforeunload',
      function () {
        observer.disconnect();
      },
      { once: true },
    );
  }

  async function bootstrap() {
    try {
      var productId = getProductId();
      if (!productId) {
        return;
      }

      var apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        return;
      }

      var response = await fetch(
        apiBaseUrl.replace(/\/$/, '') +
          '/api/public/custom-colors?product_id=' +
          encodeURIComponent(productId),
        {
          credentials: 'omit',
        },
      );

      if (!response.ok) {
        return;
      }

      var colors = await response.json();
      if (!colors || typeof colors !== 'object') {
        return;
      }

      startObserver(colors);
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