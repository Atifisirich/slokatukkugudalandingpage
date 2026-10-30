/* ==========================================================================
   Sloka International School, Tukkuguda: Admissions landing page
   Vanilla JS, no dependencies.

   1. ENQUIRY_CONFIG   CRM settings (the only part to edit when the CRM is ready)
   2. AGE_RULES        age-to-grade guide used by the grade finder
   3. Attribution      UTM / click-ID capture into hidden fields
   4. Shared choices   grade and area the parent picked, reused across the page
   5. Enquiry form     validation, sending, success state, dataLayer event
   6. CRM widget mode  swaps the built-in fields for the CRM's embed
   7. Grade finder     grade chips, date-of-birth check, pathway track, stage panels
   8. Campus tour      accessible tabs
   9. Distance check   area picker, directions, WhatsApp about the bus
   10. Page behaviour  reveal-on-scroll, FAQ accordion, mobile bar, tracking
   ========================================================================== */


/* 1. ENQUIRY_CONFIG
   --------------------------------------------------------------------------
   Two ways to connect the CRM:

   A) Endpoint (keeps this form and its design)
      mode: 'endpoint', set `endpoint`, then match `fieldMap` to the CRM's
      field names. Choose `encoding` to suit the CRM.

   B) Embed widget (CRM supplies its own form)  <- IN USE: ExtraaEdge form-9
      mode: 'widget', fill in `widget`. The widget is mounted inside the same
      card and picks up the scoped styles under `.crm-widget` in
      css/styles.css. A successful lead is detected from the widget's own
      API reply (see widget.isSuccess), which shows the "Received" stamp and
      fires the dataLayer event once. A CRM callback can also call
      window.SlokaEnquiry.success() directly.

   In endpoint mode, while `endpoint` is empty the form runs in preview mode:
   it validates and shows the success state, but sends nothing and does NOT
   push the enquiry_submitted event.
   -------------------------------------------------------------------------- */
var ENQUIRY_CONFIG = {
  mode: 'widget',                   // 'endpoint' | 'widget'

  endpoint: '',                     // [CRM ENDPOINT URL]
  method: 'POST',
  encoding: 'json',                 // 'json' | 'form' (x-www-form-urlencoded) | 'multipart'
  fetchMode: 'cors',                // use 'no-cors' for endpoints that return opaque responses (e.g. Google Apps Script)
  headers: {},                      // extra request headers. Never put secret API keys in front-end code.
  timeoutMs: 15000,

  // Decides whether the CRM accepted the lead. Adjust if the CRM returns
  // HTTP 200 with an error in the body, e.g. return body && body.status === 'success';
  isSuccess: function (response, body) {
    if (response.type === 'opaque') return true;   // no-cors: the browser cannot read the result
    return response.ok;
  },

  // Our field name -> CRM field name. Set a value to null to leave a field out.
  fieldMap: {
    parent_name:  'parent_name',
    mobile:       'mobile',
    email:        'email',
    grade:        'grade',
    area:         'area',           // from the distance checker, empty if not used
    utm_source:   'utm_source',
    utm_medium:   'utm_medium',
    utm_campaign: 'utm_campaign',
    utm_content:  'utm_content',
    utm_term:     'utm_term',
    gclid:        'gclid',
    fbclid:       'fbclid',
    page_url:     'page_url'
  },

  // Fixed values sent with every lead
  staticFields: {
    campus: 'Tukkuguda',
    lead_source: 'Admissions landing page 2027-28'
  },

  mobileFormat: 'e164',             // 'e164' sends +919876543210, 'national' sends 9876543210
  emailRequired: false,             // set true if the CRM needs an email address

  // ExtraaEdge widget supplied by the CRM team for Tukkuguda (form-9)
  widget: {
    containerId: 'ee-form-9',       // the id their script fills in
    html: '',                       // markup the CRM asks you to paste (without <script> tags)
    scriptSrc: 'https://eeconfigstaticfiles.blob.core.windows.net/staticfiles/sloka/ee-form-widget/form-9/widget.js',
    scriptAttributes: {},
    onMount: null,                  // function (container, attribution) { ... } for custom set-up

    // The widget pulls in about 300 KB (jQuery, select2, a date picker, fonts). Loading it
    // right after the page has painted, or on the first tap or scroll if that comes sooner,
    // keeps the page fast on 4G. Use 'immediate' to load it with the page instead.
    load: 'after-paint',

    // ExtraaEdge's widget.js starts on DOMContentLoaded, which has already happened when
    // it is loaded late, so the page replays that signal for it once it arrives.
    replayDomReady: true,

    // How a successful lead looks in the widget's API reply ({ result: "Success", message: "1" }).
    // Only this fires enquiry_submitted, so validation errors and failed calls never count.
    isSuccess: function (body) {
      return !!body && body.result === 'Success' && String(body.message) === '1';
    },

    // If the widget has not drawn its fields by then, show call / WhatsApp instead
    fallbackAfterMs: 15000
  },

  dataLayerEvent: 'enquiry_submitted',

  // Extra dataLayer events for the agency (grade picked, area checked, call / WhatsApp taps).
  // They never use the enquiry_submitted name. Set false to switch them off.
  trackInteractions: true,

  whatsapp: {
    number: '918520071222',         // [CONFIRM WHATSAPP NUMBER WITH SCHOOL]
    message: 'Hello, I would like to know about admissions for 2027-28 at Sloka International School, Tukkuguda.'
  }
};


/* 2. AGE_RULES  [CONFIRM AGE CRITERIA WITH SCHOOL]
   --------------------------------------------------------------------------
   Minimum age (completed years on the cut-off date) for each grade.
   The finder suggests the grade whose minimum age the child has reached,
   and the admissions team confirms the final placement.
   -------------------------------------------------------------------------- */
var AGE_RULES = {
  cutoff: { year: 2027, month: 6, day: 1 },
  grades: [
    { grade: 'Nursery',   minAge: 3 },
    { grade: 'PP1 / LKG', minAge: 4 },
    { grade: 'PP2 / UKG', minAge: 5 },
    { grade: 'Grade 1',   minAge: 6 },
    { grade: 'Grade 2',   minAge: 7 },
    { grade: 'Grade 3',   minAge: 8 },
    { grade: 'Grade 4',   minAge: 9 },
    { grade: 'Grade 5',   minAge: 10 },
    { grade: 'Grade 6',   minAge: 11 },
    { grade: 'Grade 7',   minAge: 12 },
    { grade: 'Grade 8',   minAge: 13 }
  ]
};


/* 2b. FEES  [CONFIRM FEE RANGES WITH SCHOOL]
   --------------------------------------------------------------------------
   Approximate annual fee for 2027–28, in rupees, as [lowest, highest].
   Leave a grade as null and the page shows the placeholder instead of a number.
   Example: 'Grade 2': [65000, 80000]  ->  "₹65,000 – ₹80,000 per year"
   -------------------------------------------------------------------------- */
var FEES = {
  'Nursery':   null,
  'PP1 / LKG': null,
  'PP2 / UKG': null,
  'Grade 1':   null,
  'Grade 2':   null,
  'Grade 3':   null,
  'Grade 4':   null,
  'Grade 5':   null,
  'Grade 6':   null,
  'Grade 7':   null,
  'Grade 8':   null
};


(function () {
  'use strict';

  var cfg = ENQUIRY_CONFIG;
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Re-runs the doorway opening on photos inside a panel that has just been shown
  function reopenPhotos(container) {
    if (reduceMotion) return;
    each(container.querySelectorAll('.photo'), function (ph) {
      ph.classList.remove('is-open');
      void ph.offsetWidth;   // restart the transition
      ph.classList.add('is-open');
    });
  }

  window.dataLayer = window.dataLayer || [];

  /* Turns on the hidden start states for motion. Done here, not in the HTML,
     so content stays visible if this file fails to load. */
  root.classList.add('js-motion');

  /* Loading screen (the Sloka flower): shown for at least 0.9 s after navigation
     starts, then lifted. CSS lifts it on its own at 2.6 s if this never runs. */
  if (!root.classList.contains('loader-skip')) {
    setTimeout(function () {
      root.classList.add('loader-done');
      var loader = document.getElementById('loader');
      if (loader) setTimeout(function () { loader.remove(); }, 900);
    }, Math.max(0, 900 - performance.now()));
  }

  function track(event, data) {
    if (!cfg.trackInteractions) return;
    var payload = { event: event };
    Object.keys(data || {}).forEach(function (k) { payload[k] = data[k]; });
    window.dataLayer.push(payload);
  }


  /* 3. Attribution
     ------------------------------------------------------------------------ */
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  var STORE_KEY = 'sloka_tkg_attribution';

  function readAttribution() {
    var params = new URLSearchParams(window.location.search);
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { stored = {}; }

    // Fresh ad parameters replace stored ones; otherwise keep what this visit arrived with.
    var hasFresh = ATTR_KEYS.some(function (k) { return params.get(k); });
    var out = {};
    ATTR_KEYS.forEach(function (k) {
      var v = hasFresh ? params.get(k) : stored[k];
      out[k] = v ? String(v).slice(0, 250) : '';
    });

    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(out)); } catch (e) { /* storage blocked: fine */ }

    out.page_url = window.location.href;
    return out;
  }

  var attribution = readAttribution();


  /* 4. Shared choices
     The grade and area a parent picks in the tools carry through to the
     form, the booking buttons and the WhatsApp messages.
     ------------------------------------------------------------------------ */
  var choice = { grade: '', area: '' };
  var form = document.getElementById('enquiry');
  var gradeSelect = form && form.elements.namedItem('grade');
  var gradeTouchedByParent = false;   // never overwrite a grade the parent chose in the form itself

  function whatsappLink(topic) {
    var msg = cfg.whatsapp.message;
    if (topic === 'bus') {
      msg = 'Hello, I would like to know if the Sloka Tukkuguda school bus covers ' + (choice.area || 'my area') + '.';
      if (choice.grade) msg += ' My child will join ' + choice.grade + ' in 2027-28.';
    } else {
      if (choice.grade) msg += ' My child will join ' + choice.grade + '.';
      if (choice.area) msg += ' We live in ' + choice.area + '.';
    }
    return 'https://wa.me/' + cfg.whatsapp.number + '?text=' + encodeURIComponent(msg);
  }

  function refreshChoices() {
    each(document.querySelectorAll('[data-whatsapp]'), function (a) {
      a.href = whatsappLink(a.getAttribute('data-whatsapp-topic'));
    });

    if (form) {
      form.elements.namedItem('area').value = choice.area;
      if (choice.grade && gradeSelect && !gradeTouchedByParent) gradeSelect.value = choice.grade;
    }

    // The context line describes what the built-in form will send, so it is not shown with the CRM widget
    var ctx = cfg.mode === 'widget' ? null : document.querySelector('[data-form-context]');
    if (ctx) {
      var parts = [];
      if (choice.grade) parts.push('Visit for <strong>' + escapeHtml(choice.grade) + '</strong>');
      if (choice.area) parts.push('from <strong>' + escapeHtml(choice.area) + '</strong>');
      ctx.innerHTML = parts.join(' ');
      ctx.hidden = !parts.length;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (gradeSelect) {
    gradeSelect.addEventListener('change', function () { gradeTouchedByParent = true; });
  }


  /* 5. Enquiry form
     ------------------------------------------------------------------------ */
  var card = document.querySelector('[data-enquiry]');
  var bodyEl = card && card.querySelector('[data-enquiry-body]');
  var successEl = card && card.querySelector('[data-enquiry-success]');
  var state = { sending: false, done: false, eventPushed: false, attempted: false };

  if (form) {
    // Fill hidden attribution fields
    Object.keys(attribution).forEach(function (k) {
      var input = form.elements.namedItem(k);
      if (input) input.value = attribution[k];
    });

    if (cfg.emailRequired) {
      var opt = form.querySelector('[data-email-optional]');
      if (opt) opt.hidden = true;
      form.elements.namedItem('email').required = true;
    }
  }

  var validators = {
    parent_name: function (v) {
      v = v.trim();
      if (!v) return 'Please enter your name.';
      if (v.length < 2 || !/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(v)) return 'Please enter a valid name (letters only).';
      return '';
    },
    mobile: function (v) {
      if (!v.trim()) return 'Please enter your mobile number.';
      if (!normaliseMobile(v)) return 'Please enter a valid 10-digit Indian mobile number.';
      return '';
    },
    email: function (v) {
      v = v.trim();
      if (!v) return cfg.emailRequired ? 'Please enter your email address.' : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Please enter a valid email address.';
      return '';
    },
    grade: function (v) {
      return v ? '' : 'Please choose the grade you are applying for.';
    }
  };

  // Accepts "98765 43210", "+91 98765-43210", "09876543210". Returns 10 digits or ''.
  function normaliseMobile(v) {
    var digits = String(v).replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : '';
  }

  function showError(name, message) {
    var input = form.elements.namedItem(name);
    var err = document.getElementById(input.getAttribute('aria-describedby').split(' ').pop());
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = message;
      err.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
    }
  }

  function validateField(name) {
    var message = validators[name](form.elements.namedItem(name).value);
    showError(name, message);
    return !message;
  }

  function validateAll() {
    var firstInvalid = null;
    Object.keys(validators).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements.namedItem(name);
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function setStatus(html) {
    var el = form.querySelector('[data-status]');
    if (!html) { el.hidden = true; el.innerHTML = ''; return; }
    el.innerHTML = html;
    el.hidden = false;
  }

  function setBusy(busy) {
    var btn = form.querySelector('[data-submit]');
    btn.disabled = busy;
    btn.textContent = busy ? 'Sending…' : 'Submit';
  }

  function buildPayload() {
    var data = {};
    var raw = {
      parent_name: form.elements.namedItem('parent_name').value.trim(),
      mobile: normaliseMobile(form.elements.namedItem('mobile').value),
      email: form.elements.namedItem('email').value.trim(),
      grade: form.elements.namedItem('grade').value,
      area: form.elements.namedItem('area').value
    };
    if (cfg.mobileFormat === 'e164') raw.mobile = '+91' + raw.mobile;

    // Re-read attribution so page_url reflects the address at submit time
    var attr = readAttribution();
    Object.keys(attr).forEach(function (k) { raw[k] = attr[k]; });

    Object.keys(raw).forEach(function (k) {
      var target = Object.prototype.hasOwnProperty.call(cfg.fieldMap, k) ? cfg.fieldMap[k] : k;
      if (target) data[target] = raw[k];
    });
    Object.keys(cfg.staticFields || {}).forEach(function (k) { data[k] = cfg.staticFields[k]; });
    return data;
  }

  function encodeBody(data) {
    if (cfg.encoding === 'form') {
      return { body: new URLSearchParams(data).toString(), type: 'application/x-www-form-urlencoded;charset=UTF-8' };
    }
    if (cfg.encoding === 'multipart') {
      var fd = new FormData();
      Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
      return { body: fd, type: null };   // browser sets the boundary
    }
    return { body: JSON.stringify(data), type: 'application/json' };
  }

  function send(data) {
    var encoded = encodeBody(data);
    var headers = {};
    Object.keys(cfg.headers || {}).forEach(function (k) { headers[k] = cfg.headers[k]; });
    if (encoded.type && cfg.fetchMode !== 'no-cors') headers['Content-Type'] = encoded.type;

    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, cfg.timeoutMs) : null;

    return fetch(cfg.endpoint, {
      method: cfg.method,
      mode: cfg.fetchMode,
      headers: headers,
      body: encoded.body,
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      var ct = res.headers && res.headers.get('content-type') || '';
      var parse = ct.indexOf('json') > -1 ? res.json().catch(function () { return null; }) : Promise.resolve(null);
      return parse.then(function (body) { return cfg.isSuccess(res, body); });
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  /* Shows the "Received" state. `isReal` is false in preview mode and for
     honeypot hits, so the dataLayer event only fires for real leads, once. */
  function showSuccess(isReal) {
    if (state.done) return;
    state.done = true;

    if (isReal && !state.eventPushed) {
      state.eventPushed = true;
      window.dataLayer.push({ event: cfg.dataLayerEvent });
    }

    var dateEl = successEl.querySelector('[data-received-date]');
    try {
      dateEl.textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { dateEl.textContent = ''; }

    bodyEl.hidden = true;
    successEl.hidden = false;
    var thanks = successEl.querySelector('[data-thanks]');
    thanks.focus({ preventScroll: true });
    if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  if (form && cfg.mode !== 'widget') {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.sending || state.done) return;

      state.attempted = true;
      setStatus('');
      if (!validateAll()) return;          // validation errors never reach the CRM or the dataLayer

      // Spam trap filled: pretend it worked, send nothing
      if (form.elements.namedItem('website').value) { showSuccess(false); return; }

      var payload = buildPayload();

      if (!cfg.endpoint) {
        if (window.console) console.info('[Sloka enquiry] Preview mode: no endpoint set, nothing sent. Payload:', payload);
        showSuccess(false);
        return;
      }

      state.sending = true;
      setBusy(true);
      send(payload).then(function (ok) {
        state.sending = false;
        if (ok) {
          showSuccess(true);
        } else {
          setBusy(false);
          setStatus('Sorry, we could not send your details just now. Please try again, or call <a href="tel:+918520071222">+91 85200 71222</a>.');
        }
      }).catch(function () {
        state.sending = false;
        setBusy(false);
        setStatus('The connection seems slow or offline. Please try again, or call <a href="tel:+918520071222">+91 85200 71222</a>.');
      });
    });

    // After the first submit attempt, re-check fields as the parent corrects them
    Object.keys(validators).forEach(function (name) {
      var input = form.elements.namedItem(name);
      var evt = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(evt, function () { if (state.attempted) validateField(name); });
      input.addEventListener('blur', function () { if (state.attempted || input.value) validateField(name); });
    });
  }


  /* 6. CRM widget mode
     ------------------------------------------------------------------------ */
  // A real lead from the widget: fire the event at once, then swap to the "Received" card
  function onWidgetSuccess() {
    if (state.eventPushed) return;
    state.eventPushed = true;
    window.dataLayer.push({ event: cfg.dataLayerEvent });
    setTimeout(function () { showSuccess(true); }, 1200);
  }

  // Watches the widget's API replies (it uses XMLHttpRequest) for a successful lead.
  function watchWidgetReplies(isSuccess) {
    var send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener('load', function () {
        if (this.responseType && this.responseType !== 'text') return;
        var body;
        try { body = JSON.parse(this.responseText); } catch (e) { return; }
        if (isSuccess(body)) onWidgetSuccess();
      });
      return send.apply(this, arguments);
    };
  }

  function mountWidget() {
    var w = cfg.widget || {};
    var slot = document.createElement('div');
    slot.className = 'crm-widget';
    slot.id = w.containerId || 'crm-widget';
    if (w.html) slot.innerHTML = w.html;

    // Placeholder fields while the widget loads, so the card keeps its size
    var skeleton = document.createElement('div');
    skeleton.className = 'crm-skeleton';
    skeleton.setAttribute('role', 'status');
    skeleton.innerHTML = '<span class="visually-hidden">Loading the enquiry form</span>' +
      '<i></i><i></i><i></i><i></i><i class="crm-skeleton__btn"></i>';

    var promise = document.createElement('p');
    promise.className = 'enquiry__promise';
    promise.innerHTML = 'Our admissions team will call you within one working day. <span class="tbc">[CONFIRM WITH SCHOOL]</span>';

    bodyEl.innerHTML = '';
    bodyEl.appendChild(skeleton);
    bodyEl.appendChild(slot);
    bodyEl.appendChild(promise);
    card.classList.add('enquiry-card--widget');

    if (typeof w.isSuccess === 'function') watchWidgetReplies(w.isSuccess);

    // Hide the skeleton once the widget has drawn its fields
    var ready = false;
    var markReady = function () {
      if (ready || !slot.querySelector('input, select, textarea, iframe')) return;
      ready = true;
      skeleton.remove();
      card.classList.add('is-widget-ready');
    };
    if ('MutationObserver' in window) new MutationObserver(markReady).observe(slot, { childList: true, subtree: true });

    // If it never arrives (blocked, offline), offer the phone and WhatsApp instead
    setTimeout(function () {
      if (ready) return;
      skeleton.remove();
      var fallback = document.createElement('div');
      fallback.className = 'crm-fallback';
      fallback.innerHTML = '<p>The enquiry form is taking a while to load. You can reach the admissions team directly:</p>' +
        '<a class="btn btn--maroon btn--block" href="tel:+918520071222">Call +91 85200 71222</a>' +
        '<a class="btn btn--whatsapp btn--block" href="' + whatsappLink() + '" target="_blank" rel="noopener">Chat on WhatsApp</a>';
      bodyEl.appendChild(fallback);
      track('crm_widget_unavailable', {});
    }, w.fallbackAfterMs || 15000);

    var loadScript = function () {
      if (!w.scriptSrc || loadScript.done) return;
      loadScript.done = true;
      var s = document.createElement('script');
      s.src = w.scriptSrc;
      s.async = true;
      Object.keys(w.scriptAttributes || {}).forEach(function (k) { s.setAttribute(k, w.scriptAttributes[k]); });
      s.onload = function () {
        // ExtraaEdge's loader waits for DOMContentLoaded; replay it if the page is already past that
        if (w.replayDomReady && document.readyState !== 'loading') window.dispatchEvent(new Event('DOMContentLoaded'));
      };
      document.head.appendChild(s);
    };

    if (w.load === 'immediate') {
      loadScript();
    } else {
      ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (evt) {
        window.addEventListener(evt, loadScript, { once: true, passive: true });
      });
      var afterLoad = function () {
        if ('requestIdleCallback' in window) requestIdleCallback(loadScript, { timeout: 1500 });
        else setTimeout(loadScript, 300);
      };
      if (document.readyState === 'complete') afterLoad();
      else window.addEventListener('load', afterLoad, { once: true });
    }

    if (typeof w.onMount === 'function') {
      try { w.onMount(slot, readAttribution()); } catch (e) { if (window.console) console.error('[Sloka enquiry] widget onMount failed', e); }
    }
  }

  if (card && cfg.mode === 'widget') mountWidget();

  // Public hooks for a CRM widget callback
  window.SlokaEnquiry = {
    success: function () { if (card) showSuccess(true); },
    attribution: function () { return readAttribution(); },
    choices: function () { return { grade: choice.grade, area: choice.area }; },
    config: cfg
  };


  /* 7. Grade finder
     ------------------------------------------------------------------------ */
  var finder = document.querySelector('[data-finder]');

  if (finder) {
    var stagePanels = finder.querySelectorAll('[data-stage-panel]');
    var stageBtns = finder.querySelectorAll('[data-stage-btn]');
    var marker = finder.querySelector('[data-track-marker]');
    var radios = finder.querySelectorAll('input[name="finder-grade"]');

    finder.classList.add('finder--ready');

    // Approximate fee and parent reviews for the chosen grade (or the whole stage)
    var STAGE_INFO = {
      early:   { name: 'Early Years (Nursery to UKG)', parents: 'Parents of Early Years children' },
      primary: { name: 'Primary (Grades 1–5)',         parents: 'Parents of Primary students' },
      middle:  { name: 'Middle School (Grades 6–8)',   parents: 'Parents of Middle School students' }
    };
    var feeFor = finder.querySelector('[data-fee-for]');
    var feeAmount = finder.querySelector('[data-fee-amount]');
    var reviewsFor = finder.querySelector('[data-reviews-for]');
    var reviews = finder.querySelectorAll('.grade-reviews__list .quote');
    var gradesInStage = function (stage) {
      return Array.prototype.filter.call(radios, function (r) { return r.getAttribute('data-stage') === stage; })
        .map(function (r) { return r.value; });
    };
    var rupees = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };

    var showDetails = function (grade, stage) {
      // Fee: the grade's own range, or the span of the stage's ranges when every grade is filled in
      var range = null;
      if (grade) {
        range = FEES[grade];
      } else {
        var ranges = gradesInStage(stage).map(function (g) { return FEES[g]; });
        if (ranges.every(Boolean)) {
          range = [Math.min.apply(null, ranges.map(function (r) { return r[0]; })),
                   Math.max.apply(null, ranges.map(function (r) { return r[1]; }))];
        }
      }
      feeFor.textContent = grade || STAGE_INFO[stage].name;
      feeAmount.innerHTML = range
        ? rupees(range[0]) + ' – ' + rupees(range[1]) + '<small>per year (approximate)</small>'
        : '<span class="tbc">[FEE RANGE TO BE CONFIRMED BY SCHOOL]</span>';

      // Review: this grade first, then the rest of the stage, then one for every grade
      var byGrade = [], byStage = [], general = [];
      each(reviews, function (q) {
        var g = q.getAttribute('data-grade');
        var st = q.getAttribute('data-stage');
        if (grade && g === grade) byGrade.push(q);
        else if (st === stage) byStage.push(q);
        else if (st === 'all') general.push(q);
      });
      var shown = byGrade.concat(byStage, general).slice(0, 1);   // one review keeps the sheet simple
      each(reviews, function (q) { q.classList.toggle('is-hidden', shown.indexOf(q) === -1); });
      reviewsFor.textContent = byGrade.length ? 'Parents of ' + grade + ' students' : STAGE_INFO[stage].parents;
    };

    var currentStage = '';
    var showStage = function (stage) {
      if (stage === currentStage) return;
      var switching = currentStage !== '';   // on first show, the scroll observer opens the photo
      currentStage = stage;
      each(stagePanels, function (p) {
        var on = p.getAttribute('data-stage-panel') === stage;
        p.classList.toggle('is-active', on);
        if (on && switching) reopenPhotos(p);
      });
      each(stageBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-stage-btn') === stage)); });
      // A stage picked on the track shows stage-wide details unless the chosen grade belongs to it
      var gradeHere = choice.grade && gradesInStage(stage).indexOf(choice.grade) > -1 ? choice.grade : '';
      showDetails(gradeHere, stage);
    };

    var setGrade = function (radio, source) {
      choice.grade = radio.value;
      radio.checked = true;
      showStage(radio.getAttribute('data-stage'));
      showDetails(choice.grade, radio.getAttribute('data-stage'));

      marker.hidden = false;
      marker.style.setProperty('--pos', radio.getAttribute('data-index'));

      each(finder.querySelectorAll('[data-grade-name]'), function (el) { el.textContent = 'a ' + choice.grade + ' student'; });
      each(finder.querySelectorAll('[data-grade-suffix]'), function (el) { el.textContent = ' for ' + choice.grade; });

      refreshChoices();
      track('finder_grade_selected', { grade: choice.grade, method: source });
    };

    showStage('early');

    each(radios, function (r) {
      r.addEventListener('change', function () { if (r.checked) setGrade(r, 'chip'); });
    });

    each(stageBtns, function (b) {
      b.addEventListener('click', function () { showStage(b.getAttribute('data-stage-btn')); });
    });

    // Date-of-birth check
    var yearSel = finder.querySelector('[data-year-options]');
    var monthSel = finder.querySelector('#dob-month');
    var resultEl = finder.querySelector('[data-age-result]');
    var cut = AGE_RULES.cutoff;

    for (var y = cut.year - 2; y >= cut.year - 16; y--) {
      var o = document.createElement('option');
      o.value = o.textContent = String(y);
      yearSel.appendChild(o);
    }

    finder.querySelector('[data-agecheck]').addEventListener('click', function () {
      var m = parseInt(monthSel.value, 10);
      var yr = parseInt(yearSel.value, 10);
      resultEl.hidden = false;
      if (!m || !yr) {
        resultEl.textContent = 'Please choose your child\'s birth month and year.';
        (m ? yearSel : monthSel).focus();
        return;
      }

      // Age in whole months on the cut-off date (day of birth taken as the 1st)
      var months = (cut.year * 12 + cut.month) - (yr * 12 + m);
      var years = Math.floor(months / 12);
      var rest = months % 12;
      var ageText = years + ' year' + (years === 1 ? '' : 's') + (rest ? ' ' + rest + ' month' + (rest === 1 ? '' : 's') : '');
      var rules = AGE_RULES.grades;
      var match = null;
      for (var i = rules.length - 1; i >= 0; i--) {
        if (years >= rules[i].minAge) { match = { rule: rules[i], index: i }; break; }
      }

      if (!match) {
        resultEl.innerHTML = 'Your child will be about ' + ageText + ' on 1 June 2027, a little young for Nursery that year. Our admissions team can advise on the right time to join.';
        return;
      }
      if (match.index === rules.length - 1 && years > rules[match.index].minAge) {
        resultEl.innerHTML = 'Your child will be about ' + ageText + ' on 1 June 2027. Sloka Tukkuguda currently runs up to Grade 8, so please talk to our admissions team.';
        return;
      }

      resultEl.innerHTML = 'Your child will be about ' + ageText + ' on 1 June 2027, which usually fits <strong>' + escapeHtml(match.rule.grade) + '</strong>.';
      var radio = finder.querySelector('input[name="finder-grade"][value="' + match.rule.grade + '"]');
      if (radio) setGrade(radio, 'date_of_birth');
    });
  }


  /* 8. Campus tour (tabs pattern: arrow keys move between spaces)
     ------------------------------------------------------------------------ */
  var tour = document.querySelector('[data-tour]');

  if (tour) {
    var tabs = Array.prototype.slice.call(tour.querySelectorAll('[role="tab"]'));
    tour.classList.add('tour--ready');

    var selectTab = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (on && panel.hidden) { panel.hidden = false; reopenPhotos(panel); }
        else panel.hidden = !on;
      });
      if (focus) tab.focus({ preventScroll: true });
      // Keep the chosen tab in view in the horizontal list on phones. Only the list
      // scrolls sideways; the page itself never moves.
      var list = tab.parentElement;
      if (list.scrollWidth > list.clientWidth) {
        var target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    selectTab(tabs[0], false);

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        selectTab(tab, false);
        track('campus_tour_view', { space: tab.getAttribute('data-tour-key') });
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next, true); }
      });
    });

    // Links elsewhere on the page ("See the Aero Bay Lab") open a given space
    each(document.querySelectorAll('[data-tour-jump]'), function (link) {
      link.addEventListener('click', function () {
        var tab = tour.querySelector('[data-tour-key="' + link.getAttribute('data-tour-jump') + '"]');
        if (tab) selectTab(tab, false);
      });
    });
  }


  /* 9. Distance and transport checker
     ------------------------------------------------------------------------ */
  var commute = document.querySelector('[data-commute]');

  if (commute) {
    var areaBtns = commute.querySelectorAll('[data-area]');
    var areaSelect = commute.querySelector('[data-area-select]');
    var kmOut = commute.querySelector('[data-km-out]');
    var lineOut = commute.querySelector('[data-commute-line]');
    var dirLink = commute.querySelector('[data-directions]');
    var destination = '6F5H+4M5, Tukkuguda, Telangana 501359';
    var kmByArea = {};
    each(areaBtns, function (b) { kmByArea[b.getAttribute('data-area')] = b.getAttribute('data-km'); });

    var setArea = function (name) {
      var known = Object.prototype.hasOwnProperty.call(kmByArea, name);
      choice.area = name === 'other' ? '' : name;

      each(areaBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-area') === name)); });
      areaSelect.value = name;

      var dir = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination);
      if (known) {
        kmOut.textContent = kmByArea[name].replace(' km', '');
        lineOut.textContent = 'Approximate distance from ' + name + ' to Sloka Tukkuguda.';
        dir += '&origin=' + encodeURIComponent(name + ', Telangana');
        dirLink.textContent = 'Directions from ' + name;
      } else {
        kmOut.textContent = '?';
        lineOut.textContent = 'Tell us where you live and the admissions team will check the nearest bus route.';
        dirLink.textContent = 'Get Directions';
      }
      dirLink.href = dir;

      refreshChoices();
      track('area_checked', { area: name });
    };

    each(areaBtns, function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { setArea(b.getAttribute('data-area')); });
    });
    areaSelect.addEventListener('change', function () { if (areaSelect.value) setArea(areaSelect.value); });
  }


  /* 10. Page behaviour
     ------------------------------------------------------------------------ */
  refreshChoices();

  // Reveal on scroll: adds .is-inview once, then stops watching.
  var watched = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    each(watched, function (el) { el.classList.add('is-inview'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    each(watched, function (el) { io.observe(el); });
  }

  // Photos open like the doorway as they come into view
  var photos = document.querySelectorAll('.photo');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    each(photos, function (el) { el.classList.add('is-open'); });
  } else {
    var photoIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-open');
          photoIo.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    each(photos, function (el) { photoIo.observe(el); });
  }

  // Hero fly-in: the building zooms toward the entrance as the page starts to scroll.
  // Desktop pins the photo (.hero--zoom) while the copy and form scroll away; phones
  // get a lighter zoom on the photo band. Values go to CSS variables on the hero.
  var hero = document.querySelector('.hero');
  if (hero && !reduceMotion) {
    var heroBg = hero.querySelector('.hero__bg');
    var wideHero = window.matchMedia('(min-width: 960px)');
    var heroTick = false;
    var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
    var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

    var paintHero = function () {
      heroTick = false;
      var rect = hero.getBoundingClientRect();
      var hs = hero.style;
      if (wideHero.matches) {
        var travel = hero.offsetHeight - heroBg.offsetHeight;      // how long the photo stays pinned
        var p = clamp01(-rect.top / travel);
        hs.setProperty('--hz', (1 + 0.85 * easeInOut(p)).toFixed(4));
        // Keep the shade while the headline and form are still on screen, so they stay readable
        var gridBottom = hero.querySelector('.hero__grid').getBoundingClientRect().bottom;
        hs.setProperty('--shade', clamp01(gridBottom / (window.innerHeight * 0.85)).toFixed(3));
        hs.setProperty('--arrive', clamp01((p - 0.6) / 0.3).toFixed(3));
      } else {
        var q = clamp01(-rect.top / heroBg.offsetHeight);
        hs.setProperty('--hz', (1 + 0.3 * q).toFixed(4));
      }
    };

    var setHeroMode = function () {
      hero.classList.toggle('hero--zoom', wideHero.matches);
      paintHero();
    };
    if (wideHero.addEventListener) wideHero.addEventListener('change', setHeroMode);
    setHeroMode();

    window.addEventListener('scroll', function () {
      if (!heroTick && hero.getBoundingClientRect().bottom > 0) { heroTick = true; requestAnimationFrame(paintHero); }
    }, { passive: true });
    window.addEventListener('resize', paintHero);
  }

  // Signature moment: the "Step inside" doorway opens as the page scrolls.
  // Values are written as CSS variables; the stylesheet turns them into the arch.
  var doorway = document.querySelector('[data-doorway]');
  if (doorway && !reduceMotion && 'IntersectionObserver' in window) {
    doorway.classList.add('doorway--live');
    var doorImg = doorway.querySelector('img');
    doorImg.loading = 'eager';   // it fills the screen, so fetch it before the parent arrives
    var ticking = false;
    var active = false;
    var clamp = function (v) { return Math.min(1, Math.max(0, v)); };
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

    // Campus story: slides that follow the opening, each with its own stretch of scroll
    var slides = Array.prototype.slice.call(doorway.querySelectorAll('.doorway__slide'));
    var dots = doorway.querySelectorAll('.doorway__dots li');
    var easeSlide = function (t) { return 1 - Math.pow(1 - t, 3); };

    var paint = function () {
      ticking = false;
      var vw = doorway.clientWidth;
      var vh = window.innerHeight;
      var rect = doorway.getBoundingClientRect();
      var scrolled = -rect.top;
      var OPEN = vh * 1.8;                   // scroll used by the doors opening (matches the CSS height)
      var SLIDE = vh * 0.8;                  // scroll per campus photo
      var p = clamp(scrolled / OPEN);
      var phone = vw < 760;

      // Each slide rises over 70% of its stretch, then holds
      var rise = slides.map(function (el, i) {
        return easeSlide(clamp((scrolled - OPEN - i * SLIDE) / (SLIDE * 0.7)));
      });
      slides.forEach(function (el, i) {
        var t = rise[i];
        var covered = rise[i + 1] || 0;
        el.style.setProperty('--t', t.toFixed(4));
        el.style.setProperty('--o', covered.toFixed(3));
        el.style.setProperty('--c', (clamp((t - 0.55) / 0.35) * (1 - covered)).toFixed(3));
        el.style.setProperty('--v', t > 0.001 ? 'visible' : 'hidden');
      });
      var firstRise = rise[0] || 0;
      var shown = rise.filter(function (t) { return t > 0.5; }).length;
      each(dots, function (d, i) { d.classList.toggle('is-on', i === shown); });
      doorway.style.setProperty('--dots', clamp((p - 0.7) / 0.2).toFixed(3));
      var header = document.querySelector('.site-header').offsetHeight;

      // Closed doorway size
      var archW = phone ? vw * 0.62 : Math.min(440, vw * 0.32);
      var archH = (vh - header) * (phone ? 0.5 : 0.74);
      var top = header + (vh - header - archH) / 2;

      var o = ease(clamp(p / 0.7));          // 0 = closed arch, 1 = full screen
      var s = doorway.style;
      s.setProperty('--ct', (top * (1 - o)).toFixed(1) + 'px');
      s.setProperty('--cb', ((vh - top - archH) * (1 - o)).toFixed(1) + 'px');
      s.setProperty('--cs', (((vw - archW) / 2) * (1 - o)).toFixed(1) + 'px');
      s.setProperty('--cr', ((archW / 2) * (1 - o)).toFixed(1) + 'px');
      s.setProperty('--zoom', ((1.18 - 0.18 * o) * (1 - 0.06 * firstRise)).toFixed(3));
      s.setProperty('--wo', (1 - clamp((p - 0.25) / 0.3)).toFixed(3));
      var ro = clamp((p - 0.62) / 0.25) * (1 - firstRise);   // the entrance caption gives way to the first photo
      s.setProperty('--ro', ro.toFixed(3));
      s.setProperty('--rv', ro > 0.02 ? 'visible' : 'hidden');
    };

    var onScroll = function () {
      if (active && !ticking) { ticking = true; requestAnimationFrame(paint); }
    };

    // Only listen while the scene is near the screen
    new IntersectionObserver(function (entries) {
      active = entries[0].isIntersecting;
      if (active) paint();
    }, { rootMargin: '200px 0px' }).observe(doorway);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { if (active) paint(); });
    paint();
  }

  // Booking links: after the scroll, move focus to the card heading
  // (not an input, so the phone keyboard does not pop up).
  each(document.querySelectorAll('[data-to-form]'), function (link) {
    link.addEventListener('click', function () {
      if (link.hasAttribute('data-book-grade') && choice.grade && gradeSelect && !gradeTouchedByParent) gradeSelect.value = choice.grade;
      var target = state.done ? successEl.querySelector('[data-thanks]') : document.getElementById('enquiry-title');
      if (target) setTimeout(function () { target.focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    });
  });

  // Call and WhatsApp taps, for the agency's reporting
  each(document.querySelectorAll('[data-track]'), function (el) {
    var area = el.closest('section, header, footer, nav');
    var location = area ? (area.id || area.className.split(' ')[0]) : '';
    el.addEventListener('click', function () { track(el.getAttribute('data-track'), { location: location }); });
  });

  // FAQ "Ask Sloka" chat
  var faqItems = document.querySelectorAll('.faq__item');
  each(faqItems, function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      // One answer open at a time (fallback for browsers without <details name>)
      each(faqItems, function (other) { if (other !== item && other.open) other.open = false; });
      // Brief typing indicator before the reply appears
      if (!reduceMotion) {
        item.classList.add('is-typing');
        clearTimeout(item._typingTimer);
        item._typingTimer = setTimeout(function () { item.classList.remove('is-typing'); }, 650);
      }
      track('faq_open', { question: item.querySelector('summary').textContent.trim().slice(0, 80) });
    });
  });

  var faqSearch = document.querySelector('[data-faq-search]');
  if (faqSearch) {
    var topicBtns = document.querySelectorAll('[data-faq-topic]');
    var faqCount = document.querySelector('[data-faq-count]');
    var faqEmpty = document.querySelector('[data-faq-empty]');
    var faqEcho = document.querySelector('[data-faq-echo]');
    var askLink = document.querySelector('[data-faq-ask]');
    var askLabel = document.querySelector('[data-faq-ask-label]');
    var topic = 'all';
    var searchTimer = null;

    // Searchable text for each question: question, answer and extra keywords
    each(faqItems, function (item) {
      item._haystack = (item.textContent + ' ' + (item.getAttribute('data-keywords') || '')).toLowerCase();
    });

    var askHref = function (question) {
      var msg = question
        ? 'Hello, I have a question about admissions at Sloka International School, Tukkuguda: ' + question
        : cfg.whatsapp.message;
      return 'https://wa.me/' + cfg.whatsapp.number + '?text=' + encodeURIComponent(msg);
    };

    var applyFaqFilter = function () {
      var q = faqSearch.value.trim();
      var words = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
      var shown = 0;

      each(faqItems, function (item) {
        var topicOk = topic === 'all' || item.getAttribute('data-topic') === topic;
        var textOk = words.every(function (w) { return item._haystack.indexOf(w) > -1; });
        var visible = topicOk && textOk;
        item.classList.toggle('is-filtered', !visible);
        if (!visible && item.open) item.open = false;
        if (visible) shown++;
      });

      faqEmpty.hidden = shown > 0 || !q;
      faqEcho.textContent = q;
      askLink.href = askHref(shown === 0 ? q : '');
      askLabel.textContent = shown === 0 && q ? 'Send this question on WhatsApp' : 'Ask on WhatsApp';

      if (!q && topic === 'all') faqCount.textContent = '';
      else if (shown === 0) faqCount.textContent = 'No matching questions yet';
      else faqCount.textContent = shown === 1 ? '1 question found' : shown + ' questions found';
    };

    faqSearch.addEventListener('input', function () {
      applyFaqFilter();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        if (faqSearch.value.trim()) track('faq_search', { query: faqSearch.value.trim().slice(0, 80) });
      }, 1200);
    });

    each(topicBtns, function (btn) {
      btn.addEventListener('click', function () {
        topic = btn.getAttribute('data-faq-topic');
        each(topicBtns, function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        applyFaqFilter();
      });
    });

    applyFaqFilter();
  }

  // Mobile contact bar: step aside while the form is on screen or being typed into
  var bar = document.querySelector('.mobile-bar');
  var formSection = document.getElementById('enquiry-form');
  if (bar && formSection) {
    var formVisible = false;
    var typing = false;
    var updateBar = function () { bar.classList.toggle('is-hidden', formVisible || typing); };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        updateBar();
      }, { threshold: 0.15 }).observe(formSection);
    }
    document.addEventListener('focusin', function (e) {
      typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
      updateBar();
    });
    document.addEventListener('focusout', function () {
      typing = false;
      setTimeout(updateBar, 50);
    });
  }

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
