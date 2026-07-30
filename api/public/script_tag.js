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

  function getConfigParam(name) {
    var windowKey = '__NUVEMSHOP_CUSTOM_COLORS_' + name.toUpperCase() + '__';
    if (window[windowKey]) return window[windowKey];

    var scriptElement = getScriptElement();
    if (!scriptElement || !scriptElement.src) return '';
    try {
      var url = new URL(scriptElement.src, window.location.href);
      return url.searchParams.get(name) || '';
    } catch (e) {
      return '';
    }
  }

  function getProductId() {
    if (!window.LS || !window.LS.product || !window.LS.product.id) return '';
    return String(window.LS.product.id);
  }

  function getQuickshopProductId() {
    var modal = document.getElementById('quickshop-modal');
    if (!modal) return '';
    var isVisible = modal.style.display !== 'none' ||
                    modal.classList.contains('modal-show') ||
                    modal.classList.contains('in');
    if (!isVisible) return '';
    var container = modal.querySelector('.js-quickshop-container') || modal;
    return container.getAttribute('data-product-id') || '';
  }

  function findVariantNodes(scope) {
    return (scope || document).querySelectorAll('.js-variant-button');
  }

  function resetAppliedColors(scope) {
    if (!scope) return;
    var applied = scope.querySelectorAll('[data-custom-color-applied="true"]');
    applied.forEach(function (node) {
      node.removeAttribute('data-custom-color-applied');
      var contentSpan = node.querySelector('.btn-variant-content');
      if (contentSpan) {
        contentSpan.style.background = '';
      }
    });
  }

  function applyMapping(map, scope) {
    var nodes = findVariantNodes(scope || document);

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

  var colorsCache = {};

  async function fetchColorsFromSupabase(productId) {
    var supabaseUrl = getConfigParam('supabase_url');
    var supabaseAnonKey = getConfigParam('supabase_anon_key');
    if (!supabaseUrl || !supabaseAnonKey) return null;

    try {
      var url = supabaseUrl.replace(/\/$/, '') +
        '/rest/v1/custom_colors?product_id=eq.' +
        encodeURIComponent(productId) + '&select=*';
      var response = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer ' + supabaseAnonKey,
        },
      });
      if (!response.ok) return null;
      var records = await response.json();
      if (!Array.isArray(records)) return null;

      var map = {};
      records.forEach(function (record) {
        if (record.variant_name && record.color_hex) {
          map[record.variant_name] = {
            color_hex: record.color_hex,
            display_name: record.display_name || undefined,
          };
        }
      });
      return Object.keys(map).length > 0 ? map : null;
    } catch (error) {}
    return null;
  }

  async function fetchColorsFromApi(productId) {
    var apiBaseUrl = getConfigParam('api_base');
    if (!apiBaseUrl) return null;

    try {
      var response = await fetch(
        apiBaseUrl.replace(/\/$/, '') +
          '/api/public/custom-colors?product_id=' +
          encodeURIComponent(productId),
        { credentials: 'omit' },
      );
      if (!response.ok) return null;
      var data = await response.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    } catch (error) {}
    return null;
  }

  async function fetchColors(productId) {
    if (colorsCache[productId]) return colorsCache[productId];

    var data = await fetchColorsFromSupabase(productId);
    if (!data) {
      data = await fetchColorsFromApi(productId);
    }
    if (data) {
      colorsCache[productId] = data;
      return data;
    }
    return null;
  }

  function handleQuickshopModal() {
    var modal = document.getElementById('quickshop-modal');
    if (!modal) return;

    var isVisible = modal.style.display !== 'none' ||
                    modal.classList.contains('modal-show') ||
                    modal.classList.contains('in');
    if (!isVisible) return;

    var productId = getQuickshopProductId();
    if (!productId) return;

    if (modal.getAttribute('data-color-product-id') === productId) return;

    fetchColors(productId).then(function (map) {
      if (!map) return;
      resetAppliedColors(modal);
      applyMapping(map, modal);
      modal.setAttribute('data-color-product-id', productId);
    });
  }

  function observeModalVisibility() {
    var modal = document.getElementById('quickshop-modal');
    if (!modal) return;

    var modalObserver = new MutationObserver(function () {
      handleQuickshopModal();
    });

    modalObserver.observe(modal, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.addEventListener('beforeunload', function () {
      modalObserver.disconnect();
    }, { once: true });

    handleQuickshopModal();
  }

  function startObserver(map) {
    applyMapping(map);

    var mainObserver = new MutationObserver(function () {
      applyMapping(map);
      handleQuickshopModal();
    });

    mainObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: false,
    });

    observeModalVisibility();

    window.addEventListener('beforeunload', function () {
      mainObserver.disconnect();
    }, { once: true });
  }

  function setupModalOnly() {
    var mainObserver = new MutationObserver(function () {
      handleQuickshopModal();
    });

    mainObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: false,
    });

    observeModalVisibility();

    window.addEventListener('beforeunload', function () {
      mainObserver.disconnect();
    }, { once: true });
  }

  async function bootstrap() {
    try {
      var productId = getProductId();

      if (productId) {
        var data = await fetchColors(productId);
        if (data) {
          startObserver(data);
          return;
        }
      }

      setupModalOnly();
    } catch (error) {
      return;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
