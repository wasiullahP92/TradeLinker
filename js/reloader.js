/**
 * TradeLinker Reusable Reloader & Robust Error Handling Engine
 * Implements unified loading states, refresh controls, retry fallbacks,
 * duplicate submission protection, and accessibility across TradeLinker.
 * 
 * Techminds (Wasi Ullah & Hamad Ullah)
 */

const TLReloader = {
  activeOperations: new Set(),
  inputBackups: new Map(),
  overlayEl: null,
  announcerEl: null,
  isInitialized: false,

  init() {
    if (this.isInitialized) return;
    this.ensureDomElements();
    this.isInitialized = true;
  },

  ensureDomElements() {
    // 1. Screen Reader Live Announcer
    if (!document.getElementById("tl-sr-announcer")) {
      const announcer = document.createElement("div");
      announcer.id = "tl-sr-announcer";
      announcer.className = "tl-sr-only";
      announcer.setAttribute("role", "status");
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      document.body.appendChild(announcer);
      this.announcerEl = announcer;
    } else {
      this.announcerEl = document.getElementById("tl-sr-announcer");
    }

    // 2. Fullscreen Reloader Overlay Modal
    if (!document.getElementById("tl-reloader-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "tl-reloader-overlay";
      overlay.className = "tl-reloader-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Loading content");

      overlay.innerHTML = `
        <div class="tl-reloader-modal" id="tl-reloader-modal">
          <div style="text-align: center;">
            <img src="assets/images/tradelinker-logo.png" alt="TradeLinker Logo" class="tl-reloader-logo" id="tl-overlay-logo" onerror="this.style.display='none'">
          </div>
          <div class="tl-reloader-orbit tl-reloader-orbit-lg" id="tl-overlay-orbit" style="margin: 0 auto;">
            <div class="tl-reloader-track-outer"></div>
            <div class="tl-reloader-track-inner"></div>
            <div class="tl-reloader-center-glyph">
              <img src="assets/images/tradelinker-monogram.png" alt="TradeLinker" class="tl-reloader-monogram-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
          </div>
          <h3 class="tl-reloader-title" id="tl-overlay-title">Loading TradeLinker</h3>
          <p class="tl-reloader-message" id="tl-overlay-msg">Connecting with verified professionals...</p>
          <div class="tl-reloader-progress" id="tl-overlay-progress">
            <div class="tl-reloader-progress-bar"></div>
          </div>
          <div id="tl-overlay-cancel-wrap" style="margin-top: 18px; display: none;">
            <button class="tl-btn tl-btn-ghost tl-btn-sm" id="tl-overlay-cancel-btn">Cancel Request</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      this.overlayEl = overlay;
    } else {
      this.overlayEl = document.getElementById("tl-reloader-overlay");
    }
  },

  // --------------------------------------------------------------------------
  // 1. Fullscreen / Modal Loading Overlays
  // --------------------------------------------------------------------------
  showOverlay({
    title = "Processing Request",
    message = "Please wait while TradeLinker completes your request...",
    showLogo = true,
    showProgress = true,
    cancelable = false,
    onCancel = null
  } = {}) {
    this.init();
    const titleEl = document.getElementById("tl-overlay-title");
    const msgEl = document.getElementById("tl-overlay-msg");
    const logoEl = document.getElementById("tl-overlay-logo");
    const progressEl = document.getElementById("tl-overlay-progress");
    const cancelWrap = document.getElementById("tl-overlay-cancel-wrap");
    const cancelBtn = document.getElementById("tl-overlay-cancel-btn");

    if (titleEl) {
      titleEl.textContent = title;
      titleEl.innerText = title;
    }
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.innerText = message;
    }
    if (logoEl) logoEl.style.display = showLogo ? "inline-block" : "none";
    if (progressEl) progressEl.style.display = showProgress ? "block" : "none";

    if (cancelWrap && cancelBtn) {
      if (cancelable && typeof onCancel === "function") {
        cancelWrap.style.display = "block";
        cancelBtn.onclick = () => {
          this.hideOverlay();
          onCancel();
        };
      } else {
        cancelWrap.style.display = "none";
      }
    }

    this.overlayEl.classList.add("is-visible");
    this.announce(`${title}: ${message}`);
  },

  hideOverlay() {
    if (!this.overlayEl) return;
    this.overlayEl.classList.remove("is-visible");
    this.announce("Operation complete.");
  },

  showStartupSplash({ durationMs = 800, onComplete = null } = {}) {
    this.showOverlay({
      title: "TradeLinker",
      message: "Connecting People with Trusted Professionals...",
      showLogo: true,
      showProgress: true
    });

    setTimeout(() => {
      this.hideOverlay();
      if (typeof onComplete === "function") onComplete();
    }, durationMs);
  },

  // --------------------------------------------------------------------------
  // 2. Button Loading State Control
  // --------------------------------------------------------------------------
  setButtonLoading(button, isLoading, loadingText = null) {
    if (!button) return;
    if (isLoading) {
      if (!button.dataset.tlOrigHtml) {
        button.dataset.tlOrigHtml = button.innerHTML;
      }
      button.classList.add("tl-btn-is-loading");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      
      const spinner = document.createElement("span");
      spinner.className = "tl-btn-spinner";
      spinner.setAttribute("aria-hidden", "true");
      button.appendChild(spinner);

      if (loadingText) {
        this.announce(loadingText);
      }
    } else {
      button.classList.remove("tl-btn-is-loading");
      button.disabled = false;
      button.removeAttribute("aria-busy");
      const spinner = button.querySelector(".tl-btn-spinner");
      if (spinner) spinner.remove();
      if (button.dataset.tlOrigHtml) {
        button.innerHTML = button.dataset.tlOrigHtml;
        delete button.dataset.tlOrigHtml;
      }
    }
  },

  // --------------------------------------------------------------------------
  // 3. Inline Container Loaders & Skeletons
  // --------------------------------------------------------------------------
  showInlineLoader(container, { text = "Loading data...", subtext = "Connecting to TradeLinker services...", size = "default" } = {}) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;

    const orbitClass = size === "sm" ? "tl-reloader-orbit-sm" : size === "lg" ? "tl-reloader-orbit-lg" : "tl-reloader-orbit";

    el.setAttribute("aria-busy", "true");
    el.innerHTML = `
      <div class="tl-inline-loader" role="status">
        <div class="${orbitClass}">
          <div class="tl-reloader-track-outer"></div>
          <div class="tl-reloader-track-inner"></div>
          <div class="tl-reloader-center-glyph">
            <img src="assets/images/tradelinker-monogram.png" alt="TradeLinker" class="tl-reloader-monogram-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
        </div>
        <div class="tl-inline-loader-text">${text}</div>
        ${subtext ? `<div class="tl-inline-loader-subtext">${subtext}</div>` : ""}
      </div>
    `;
    this.announce(text);
  },

  hideInlineLoader(container) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;
    el.removeAttribute("aria-busy");
  },

  renderSkeleton(container, type = "card", count = 3) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;

    el.setAttribute("aria-busy", "true");
    let html = "";

    if (type === "card") {
      html = Array.from({ length: count }).map(() => `
        <div class="tl-skeleton-card">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div class="tl-skeleton-box tl-skeleton-avatar"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div class="tl-skeleton-box tl-skeleton-title"></div>
              <div class="tl-skeleton-box tl-skeleton-line-short"></div>
            </div>
          </div>
          <div class="tl-skeleton-box tl-skeleton-line" style="margin-top: 6px;"></div>
          <div class="tl-skeleton-box tl-skeleton-line" style="width: 80%;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <div class="tl-skeleton-box" style="height: 18px; width: 80px;"></div>
            <div class="tl-skeleton-box tl-skeleton-btn"></div>
          </div>
        </div>
      `).join("");
    } else if (type === "table") {
      html = Array.from({ length: count }).map(() => `
        <tr>
          <td><div class="tl-skeleton-box" style="height: 16px; width: 120px;"></div></td>
          <td><div class="tl-skeleton-box" style="height: 16px; width: 180px;"></div></td>
          <td><div class="tl-skeleton-box" style="height: 16px; width: 90px;"></div></td>
          <td><div class="tl-skeleton-box" style="height: 24px; width: 70px; border-radius: 999px;"></div></td>
          <td><div class="tl-skeleton-box" style="height: 32px; width: 80px; border-radius: 6px;"></div></td>
        </tr>
      `).join("");
    } else if (type === "profile") {
      html = `
        <div class="tl-skeleton-card" style="padding: 32px;">
          <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
            <div class="tl-skeleton-box" style="width: 88px; height: 88px; border-radius: 50%;"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
              <div class="tl-skeleton-box" style="height: 26px; width: 220px;"></div>
              <div class="tl-skeleton-box" style="height: 16px; width: 150px;"></div>
              <div class="tl-skeleton-box" style="height: 16px; width: 180px;"></div>
            </div>
          </div>
          <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 12px;">
            <div class="tl-skeleton-box" style="height: 16px; width: 100%;"></div>
            <div class="tl-skeleton-box" style="height: 16px; width: 95%;"></div>
            <div class="tl-skeleton-box" style="height: 16px; width: 70%;"></div>
          </div>
        </div>
      `;
    }

    el.innerHTML = html;
  },

  // --------------------------------------------------------------------------
  // 4. Robust Wrapper with Duplicate Submission Lock (Idempotency)
  // --------------------------------------------------------------------------
  async withLoading(operationKey, asyncFn, {
    button = null,
    loadingText = "Processing...",
    overlay = false,
    overlayTitle = "Processing",
    overlayMsg = "Please wait...",
    form = null,
    fallbackContainer = null,
    onSuccess = null,
    onError = null
  } = {}) {
    this.init();

    // 1. Guard against concurrent duplicate triggers
    if (this.activeOperations.has(operationKey)) {
      console.warn(`[TLReloader] Operation '${operationKey}' is already active. Suppressing duplicate request.`);
      return { success: false, duplicateSuppressed: true };
    }

    this.activeOperations.add(operationKey);

    // 2. Preserve form inputs if a form is provided
    let preservedInputs = null;
    if (form) {
      const formEl = typeof form === "string" ? document.getElementById(form) : form;
      if (formEl) {
        preservedInputs = this.captureFormInputs(formEl);
        this.inputBackups.set(operationKey, { formEl, data: preservedInputs });
      }
    }

    // 3. Activate visual loaders
    if (button) this.setButtonLoading(button, true, loadingText);
    if (overlay) this.showOverlay({ title: overlayTitle, message: overlayMsg });

    try {
      const result = await asyncFn();

      // On successful completion, purge stored input backup
      this.inputBackups.delete(operationKey);

      if (typeof onSuccess === "function") {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      console.error(`[TLReloader] Error during '${operationKey}':`, err);

      // Render accessible fallback card if a container is specified
      if (fallbackContainer) {
        const errorType = err.type || (navigator.onLine === false ? "network_error" : "unexpected_error");
        this.showFallback(fallbackContainer, errorType, {
          title: err.title || "Operation Failed",
          message: err.message || "An error occurred while processing your request.",
          technicalDetails: err.stack || err.toString(),
          preservedData: preservedInputs,
          onRetry: () => {
            // Restore preserved inputs if form exists
            if (form && preservedInputs) {
              const formEl = typeof form === "string" ? document.getElementById(form) : form;
              this.restoreFormInputs(formEl, preservedInputs);
            }
            // Execute retry
            this.withLoading(operationKey, asyncFn, {
              button,
              loadingText,
              overlay,
              overlayTitle,
              overlayMsg,
              form,
              fallbackContainer,
              onSuccess,
              onError
            });
          }
        });
      }

      if (typeof onError === "function") {
        onError(err);
      }

      return { success: false, error: err };
    } finally {
      // Guaranteed teardown - never leave stuck spinners!
      if (button) this.setButtonLoading(button, false);
      if (overlay) this.hideOverlay();
      this.activeOperations.delete(operationKey);
    }
  },

  // --------------------------------------------------------------------------
  // 5. Interactive Refresh & Retry Control Bar
  // --------------------------------------------------------------------------
  attachRefreshControl(targetContainer, refreshCallback, {
    label = "Refresh Data",
    initialTimestamp = new Date(),
    showTime = true,
    customClass = ""
  } = {}) {
    const container = typeof targetContainer === "string" ? document.getElementById(targetContainer) : targetContainer;
    if (!container) return null;

    const barId = "refresh-bar-" + Math.floor(Math.random() * 10000);
    const timeFormatted = initialTimestamp ? initialTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Just now";

    const barHtml = `
      <div class="tl-refresh-bar ${customClass}" id="${barId}">
        <div class="tl-refresh-info">
          <span>Data status:</span>
          ${showTime ? `<span class="tl-refresh-time-badge" id="${barId}-time">Updated ${timeFormatted}</span>` : ""}
          <span id="${barId}-status" style="font-size: 0.75rem; color: var(--tl-teal-600); display: none;">✓ Updated just now</span>
        </div>
        <button class="tl-refresh-btn" id="${barId}-btn" type="button" aria-label="${label}">
          <span data-tl-icon="reload" data-tl-class="tl-icon-sm"></span>
          <span>${label}</span>
        </button>
      </div>
    `;

    container.insertAdjacentHTML("afterbegin", barHtml);

    if (typeof TLIcons !== "undefined") {
      TLIcons.renderAll();
    }

    const btn = container.querySelector(`#${barId}-btn`) || document.getElementById(`${barId}-btn`);
    const timeEl = container.querySelector(`#${barId}-time`) || document.getElementById(`${barId}-time`);
    const statusEl = container.querySelector(`#${barId}-status`) || document.getElementById(`${barId}-status`);

    let isRefreshing = false;

    const triggerRefresh = async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      btn.disabled = true;
      btn.classList.add("is-refreshing");
      if (statusEl) statusEl.style.display = "none";
      this.announce("Refreshing data...");

      try {
        await refreshCallback();
        const now = new Date();
        const newTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (timeEl) timeEl.innerText = `Updated ${newTime}`;
        if (statusEl) {
          statusEl.style.display = "inline";
          setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 3500);
        }
        this.announce("Data refreshed successfully.");
      } catch (err) {
        console.error("[TLReloader] Refresh failed:", err);
        if (statusEl) {
          statusEl.style.display = "inline";
          statusEl.style.color = "#DC2626";
          statusEl.innerText = "✗ Refresh failed";
          setTimeout(() => { if (statusEl) statusEl.style.display = "none"; }, 4000);
        }
        this.announce("Refresh failed. Please check network connection.");
      } finally {
        isRefreshing = false;
        btn.disabled = false;
        btn.classList.remove("is-refreshing");
      }
    };

    btn.onclick = triggerRefresh;

    return {
      barElement: document.getElementById(barId),
      trigger: triggerRefresh
    };
  },

  // --------------------------------------------------------------------------
  // 6. Application Fallback & Error State Interfaces
  // --------------------------------------------------------------------------
  showFallback(targetContainer, type, {
    title = null,
    message = null,
    onRetry = null,
    retryText = "Try Again",
    secondaryAction = null, // { text: "Return Home", href: "index.html" or onClick }
    preservedData = null,
    technicalDetails = null
  } = {}) {
    const container = typeof targetContainer === "string" ? document.getElementById(targetContainer) : targetContainer;
    if (!container) return;

    const defaults = {
      network_error: {
        icon: "wifiOff",
        wrapClass: "offline",
        title: "Connection Interrupted",
        desc: "Unable to reach TradeLinker servers. Please verify your internet connection and try again."
      },
      db_failure: {
        icon: "database",
        wrapClass: "error",
        title: "Service Temporarily Unavailable",
        desc: "The database request could not be fulfilled at this moment. Our engineers have been alerted."
      },
      empty_results: {
        icon: "inbox",
        wrapClass: "empty",
        title: "No Matching Results Found",
        desc: "We couldn't find any service listings or verified specialists matching your criteria. Try adjusting your filters."
      },
      unauthorized: {
        icon: "shieldAlert",
        wrapClass: "unauthorized",
        title: "Access Restricted",
        desc: "You do not have permission to view or modify this resource. Please sign in with an authorized account."
      },
      not_found: {
        icon: "helpCircle",
        wrapClass: "error",
        title: "Resource Not Found",
        desc: "The booking, service, or profile you requested does not exist or has been removed."
      },
      session_expired: {
        icon: "shieldAlert",
        wrapClass: "unauthorized",
        title: "Your Session Has Expired",
        desc: "For your account security, sessions automatically expire after periods of inactivity. Please sign in to resume."
      },
      unexpected_error: {
        icon: "alertTriangle",
        wrapClass: "error",
        title: "An Unexpected Error Occurred",
        desc: "TradeLinker encountered an issue processing your request. Your entered data has been preserved."
      }
    };

    const cfg = defaults[type] || defaults.unexpected_error;
    const finalTitle = title || cfg.title;
    const finalDesc = message || cfg.desc;

    let hasPreserved = false;
    if (preservedData && Object.keys(preservedData).length > 0) {
      hasPreserved = true;
    }

    const cardId = "fallback-card-" + Math.floor(Math.random() * 10000);

    const html = `
      <div class="tl-fallback-card" id="${cardId}" role="alert">
        <div class="tl-fallback-icon-wrap ${cfg.wrapClass}">
          <span data-tl-icon="${cfg.icon}" data-tl-class="tl-icon-lg"></span>
        </div>
        <h3 class="tl-fallback-title">${finalTitle}</h3>
        <p class="tl-fallback-desc">${finalDesc}</p>

        ${hasPreserved ? `
          <div class="tl-preserved-input-badge">
            <span data-tl-icon="check" data-tl-class="tl-icon-xs"></span>
            <span>Your unsaved form inputs have been preserved</span>
          </div>
        ` : ""}

        <div class="tl-fallback-actions">
          ${typeof onRetry === "function" ? `
            <button class="tl-btn tl-btn-primary" id="${cardId}-retry-btn" type="button">
              <span data-tl-icon="reload" data-tl-class="tl-icon-sm"></span>
              <span>${retryText}</span>
            </button>
          ` : ""}
          ${secondaryAction ? `
            <button class="tl-btn tl-btn-outline" id="${cardId}-sec-btn" type="button">
              ${secondaryAction.text}
            </button>
          ` : ""}
        </div>

        ${technicalDetails ? `
          <button class="tl-fallback-details-toggle" type="button" onclick="const el=document.getElementById('${cardId}-tech'); el.style.display=el.style.display==='block'?'none':'block';">
            Show Technical Diagnostic Details
          </button>
          <div class="tl-fallback-details-content" id="${cardId}-tech">
            ${this.escapeHtml(technicalDetails)}
          </div>
        ` : ""}
      </div>
    `;

    container.innerHTML = html;

    if (typeof TLIcons !== "undefined") {
      TLIcons.renderAll();
    }

    // Bind actions
    if (typeof onRetry === "function") {
      const retryBtn = document.getElementById(`${cardId}-retry-btn`);
      if (retryBtn) retryBtn.onclick = onRetry;
    }

    if (secondaryAction) {
      const secBtn = document.getElementById(`${cardId}-sec-btn`);
      if (secBtn) {
        secBtn.onclick = () => {
          if (typeof secondaryAction.onClick === "function") {
            secondaryAction.onClick();
          } else if (secondaryAction.href) {
            window.location.href = secondaryAction.href;
          }
        };
      }
    }

    this.announce(`Notice: ${finalTitle}. ${finalDesc}`);
  },

  // --------------------------------------------------------------------------
  // 7. Form Input Preservation Helpers
  // --------------------------------------------------------------------------
  captureFormInputs(form) {
    if (!form) return {};
    const data = {};
    const elements = form.querySelectorAll("input, select, textarea");
    elements.forEach(el => {
      if (!el.name && !el.id) return;
      const key = el.name || el.id;
      if (el.type === "checkbox") {
        data[key] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) data[key] = el.value;
      } else if (el.type !== "password") { // Never store passwords in memory
        data[key] = el.value;
      }
    });
    return data;
  },

  restoreFormInputs(form, data) {
    if (!form || !data) return;
    Object.keys(data).forEach(key => {
      const el = form.elements[key] || form.querySelector(`[name="${key}"], #${key}`);
      if (!el) return;
      if (el.type === "checkbox") {
        el.checked = Boolean(data[key]);
      } else if (el.type === "radio") {
        if (el.value === data[key]) el.checked = true;
      } else if (el.type !== "password") {
        el.value = data[key];
      }
    });
  },

  // --------------------------------------------------------------------------
  // 8. Accessibility & Screen Reader Announcer
  // --------------------------------------------------------------------------
  announce(message) {
    if (!this.announcerEl) {
      this.ensureDomElements();
    }
    if (this.announcerEl) {
      // Clear then set to re-trigger assistive tech
      this.announcerEl.innerText = "";
      setTimeout(() => {
        if (this.announcerEl) this.announcerEl.innerText = message;
      }, 50);
    }
  },

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  window.TLReloader = TLReloader;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => TLReloader.init());
  } else {
    TLReloader.init();
  }
}
