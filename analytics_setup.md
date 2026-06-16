javascript
/**
 * GTM Custom HTML Tag – Advanced Click Tracking for Pricing CTAs
 *
 * Tracks clicks on pricing-related links (e.g., /signup or elements with
 * `.pricing-cta-button`) and fires a structured GA4 event via the dataLayer.
 *
 * @module PricingCTATracker
 * @version 2.0.0
 */

(function () {
  'use strict';

  /** Flag to ensure the handler is registered only once */
  let isInitialized = false;

  /**
   * Logger utility respecting the current debug level.
   * In production, debug logs can be suppressed by toggling
   * `window.__AIGON_PRICING_DEBUG` to `false` or removing the flag.
   *
   * @type {Object}
   * @property {function(...any): void} debug - Debug-level output
   * @property {function(...any): void} info - Informational output
   * @property {function(...any): void} warn - Warning output
   * @property {function(...any): void} error - Error output
   */
  const logger = {
    /** @returns {boolean} Whether debug logging is enabled */
    get _debugEnabled() {
      return typeof window.__AIGON_PRICING_DEBUG === 'undefined'
        ? true
        : Boolean(window.__AIGON_PRICING_DEBUG);
    },
    debug(...args) {
      if (this._debugEnabled) {
        console.debug('[PricingCTA]', ...args);
      }
    },
    info(...args) {
      console.info('[PricingCTA]', ...args);
    },
    warn(...args) {
      console.warn('[PricingCTA]', ...args);
    },
    error(...args) {
      console.error('[PricingCTA]', ...args);
    },
  };

  /**
   * Validates that the provided value is a non-empty string.
   *
   * @param {unknown} value - The value to validate
   * @param {string} name - The name of the parameter (for error messages)
   * @returns {string} The validated string
   * @throws {TypeError} If value is not a non-empty string
   */
  function validateString(value, name) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new TypeError(
        `[PricingCTA] "${name}" must be a non-empty string, got ${typeof value}`
      );
    }
    return value.trim();
  }

  /**
   * Validates that the provided value is a plain object (or null/undefined,
   * which are allowed and treated as empty objects).
   *
   * @param {unknown} value - The value to validate
   * @param {string} name - The name of the parameter
   * @returns {Record<string, unknown>} The validated object (coerced)
   * @throws {TypeError} If value is not a plain object
   */
  function validateObject(value, name) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      throw new TypeError(
        `[PricingCTA] "${name}" must be an object, got ${typeof value}`
      );
    }
    return value || {};
  }

  /**
   * Validates that the dataLayer is available on the window object.
   *
   * @returns {Array<Object>|null} The dataLayer array if available, null otherwise
   */
  function getDataLayer() {
    if (!window.dataLayer || !Array.isArray(window.dataLayer)) {
      logger.error('window.dataLayer is not defined or is not an array. Event will not be sent.');
      return null;
    }
    return window.dataLayer;
  }

  /**
   * Sanitizes a string for safe inclusion in analytics parameters.
   * Strips HTML tags and limits length to prevent abuse.
   *
   * @param {string} text - Raw text to sanitize
   * @returns {string} Sanitized, truncated string
   */
  function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    // Remove HTML tags, keep plain text, limit to 500 characters
    return text.replace(/<[^>]*>/g, '').slice(0, 500);
  }

  /**
   * Pushes a structured GA4 event for CTA clicks to the dataLayer.
   *
   * @param {string} eventName - The event name (e.g., 'pricing_cta_click')
   * @param {Record<string, unknown>} [params={}] - Additional event parameters
   * @returns {boolean} Whether the push succeeded
   */
  function pushEvent(eventName, params = {}) {
    try {
      const dl = getDataLayer();
      if (!dl) {
        logger.warn('dataLayer unavailable – event not sent');
        return false;
      }

      // Validate and sanitize inputs
      const safeName = validateString(eventName, 'eventName');
      const safeParams = validateObject(params, 'params');

      // Sanitize common text fields
      const sanitizedParams = { ...safeParams };
      if (sanitizedParams.cta_text) {
        sanitizedParams.cta_text = sanitizeText(String(sanitizedParams.cta_text));
      }
      if (sanitizedParams.cta_href) {
        sanitizedParams.cta_href = sanitizeText(String(sanitizedParams.cta_href));
      }

      // Build the push payload
      const payload = {
        event: safeName,
        'gtm.uniqueEventId': Date.now(),
        ...sanitizedParams,
        'event_callback': function () {
          logger.debug(`Event "${safeName}" sent successfully`);
        },
      };

      dl.push(payload);
      logger.info(`Event "${safeName}" pushed to dataLayer`);
      return true;
    } catch (err) {
      logger.error(`Failed to push event "${eventName}":`, err);
      return false;
    }
  }

  /**
   * Click handler that detects pricing-related CTAs and fires an event.
   *
   * @param {MouseEvent} event - The native click event
   * @returns {void}
   */
  function handleClick(event) {
    // Ensure we have a valid event and target
    if (!event || !event.target) {
      logger.debug('Invalid click event received');
      return;
    }

    const target = event.target.closest('a');
    if (!target) {
      logger.debug('Click on non-anchor element – ignoring');
      return;
    }

    /** @type {string|null} */
    const href = target.getAttribute('href') || '';
    const classList = target.classList;

    // Check if this anchor matches our criteria (signup link or pricing-cta-button)
    const isSignup = href.includes('/signup');
    const isPricingButton = classList.contains('pricing-cta-button');

    if (!isSignup && !isPricingButton) {
      logger.debug(`Click on non-matching link "${href}" – ignoring`);
      return;
    }

    // Optional: validate that href is a relative path to avoid external links
    if (href.startsWith('http://') || href.startsWith('https://')) {
      // External link – still track, but log a warning
      logger.warn(`Tracking external link: ${href}`);
    }

    // Extract and sanitize the link text
    const linkText = target.innerText.trim();

    // Fire the event
    pushEvent('pricing_cta_click', {
      cta_text: linkText,
      cta_href: href,
    });
  }

  /**
   * Initializes the click listener on the document.
   * Ensures it runs only once.
   *
   * @returns {void}
   */
  function init() {
    if (isInitialized) {
      logger.debug('Initialization already performed – skipping');
      return;
    }

    if (typeof document === 'undefined' || typeof document.addEventListener === 'undefined') {
      logger.error('Browser environment lacking document.addEventListener – cannot attach listener');
      return;
    }

    // Use capture phase to get events before they bubble (optional, good for nested elements)
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    isInitialized = true;
    logger.info('Pricing CTA click tracker initialized (capture phase, passive listener)');
  }

  // Auto-initialize when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();