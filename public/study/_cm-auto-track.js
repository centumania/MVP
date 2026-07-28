/**
 * CentuMania — UNIVERSAL module tracking (drop-in, zero per-module edits).
 *
 * Add ONE line near the end of any /study/*.html module:
 *     <script src="/study/_cm-auto-track.js"></script>
 *
 * WHY: modules were hand-authored over time and instrumented inconsistently —
 * some sent the full two-layer signal, some only engagement, some nothing at
 * all. Anything a student does in an un-instrumented module is invisible to
 * the Centum Index and to the admin activity view. This script gives EVERY
 * module the same baseline without touching its internals.
 *
 * WHAT IT SENDS
 *   Layer 2 — engagement  → POST /api/events (+ /api/events/beacon on exit)
 *       material_opened, session_start, tab_switch, session_end (+ active secs)
 *   Layer 1 — mastery     → POST /api/study/interaction  (feeds Centum Index)
 *       node_opened / mcq_attempt / node_completed, but ONLY when the module
 *       exposes a hook this script recognises (see wireMastery below). Modules
 *       with a bespoke quiz engine still need their own wiring — this script
 *       never guesses at correctness.
 *
 * SAFE BY DESIGN
 *   - No-ops silently when signed out or opened standalone (no token).
 *   - Bails out entirely if the module already has its own tracking, so the
 *     45 already-instrumented modules can never double-count.
 *   - material_id is derived from the file name, which is exactly the module id
 *     convention used by programs.ts (`moduleHtmlPath = /study/{id}.html`).
 *   - Wraps existing functions rather than replacing them: the module's own
 *     behaviour runs first and is returned untouched, so a failure here can
 *     never break a lesson.
 */
(function () {
  'use strict';

  // ── Never double-instrument ────────────────────────────────────────────────
  // Some modules already carry a hand-written prefix (it sets one of these
  // flags) which sends the ENGAGEMENT layer but not the mastery layer. For
  // those we must stay silent on engagement — double-counting would inflate
  // every student's activity — while still wiring mastery, which is the whole
  // reason the tag was added to such a file. Running twice over is a no-op.
  if (window.__cmAutoTrack) return;
  window.__cmAutoTrack = 1;
  var HAS_OWN_ENGAGEMENT = !!(window.__cmTrackInit || window.__cmTrackU);

  var T0 = Date.now(), ACTIVE = 0, visT = Date.now();

  function token() {
    try { var t = localStorage.getItem('cm:access_token'); if (t) return t; } catch (e) {}
    try {
      var stores = [localStorage, sessionStorage], s, i, k, d;
      for (s = 0; s < stores.length; s++) {
        for (i = 0; i < stores[s].length; i++) {
          k = stores[s].key(i);
          if (k && k.indexOf('sb-') === 0 && k.slice(-11) === '-auth-token') {
            d = JSON.parse(stores[s].getItem(k) || '{}');
            if (d && d.access_token) return d.access_token;
          }
        }
      }
    } catch (e) {}
    return null;
  }

  // /study/polity-part1.html -> polity-part1  (matches programs.ts module ids)
  function materialId() {
    try {
      var override = localStorage.getItem('cm:material_id');
      if (override) return override;
    } catch (e) {}
    try {
      var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
      return file || 'unknown-module';
    } catch (e) { return 'unknown-module'; }
  }

  function sessionId() {
    try {
      var s = sessionStorage.getItem('cm:analytics_session');
      if (!s) {
        s = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Date.now().toString(36) + '-' + Math.random().toString(16).slice(2));
        sessionStorage.setItem('cm:analytics_session', s);
      }
      return s;
    } catch (e) { return 'anon-' + Date.now(); }
  }

  var MAT = materialId();

  // ── Layer 2: engagement stream ─────────────────────────────────────────────
  function ev(name, meta) {
    try {
      var t = token(); if (!t) return;
      fetch('/api/events', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({
          event_name: name, session_id: sessionId(),
          event_timestamp: new Date().toISOString(),
          metadata: Object.assign({ material_id: MAT }, meta || {})
        })
      }).catch(function () {});
    } catch (e) {}
  }

  // Beacons carry the token in the BODY — sendBeacon cannot set headers.
  function beacon(name, meta) {
    try {
      var t = token(); if (!t) return;
      var payload = JSON.stringify({
        _token: t, event_name: name, session_id: sessionId(),
        event_timestamp: new Date().toISOString(),
        metadata: Object.assign({ material_id: MAT }, meta || {})
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/events/beacon', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/events/beacon', {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' }, body: payload
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // ── Layer 1: Centum Index interactions ─────────────────────────────────────
  function interact(type, nodeId, meta) {
    try {
      var t = token(); if (!t || !nodeId) return;
      fetch('/api/study/interaction', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({
          interaction_type: type, node_id: String(nodeId), material_id: MAT,
          session_id: sessionId(), timestamp: new Date().toISOString(),
          metadata: meta || {}
        })
      }).catch(function () {});
    } catch (e) {}
  }

  // Expose the same names the hand-written prefixes use, so per-module code can
  // call them later without caring which instrumentation it got.
  window.cmEvent = window.cmEvent || ev;
  window.cmBeacon = window.cmBeacon || beacon;
  window.cmInteract = window.cmInteract || interact;

  // ── Mastery auto-wiring (only for hooks we can read correctness from) ──────
  // The shared quiz engine used by several modules exposes:
  //   chooseOpt(nodeId, questionIndex, optionIndex, el)  — an answer
  //   finishAttempt(node)                                — node finished
  // and records canonical first-attempt accuracy on S.faa[nodeId][qi]. We wrap
  // them: the module's own function runs FIRST and its return value is passed
  // through untouched, so behaviour is identical with or without this script.
  function wireMastery() {
    var wired = false;

    if (typeof window.chooseOpt === 'function' && !window.chooseOpt.__cmWrapped) {
      var origChoose = window.chooseOpt;
      var seen = {}; // nodeId:qi -> true, so retries never re-report
      window.chooseOpt = function (nid, qi, oi, el) {
        var out = origChoose.apply(this, arguments);
        try {
          var key = nid + ':' + qi;
          if (!seen[key]) {
            seen[key] = true;
            var correct;
            // Prefer the module's own first-attempt record when present.
            if (window.S && S.faa && S.faa[nid] && S.faa[nid][qi] !== undefined) {
              correct = S.faa[nid][qi] === true;
            }
            if (correct !== undefined) {
              interact('mcq_attempt', nid, {
                question_index: qi, is_correct: correct, node_type: 'mastery'
              });
            }
          }
        } catch (e) {}
        return out;
      };
      window.chooseOpt.__cmWrapped = 1;
      wired = true;
    }

    if (typeof window.finishAttempt === 'function' && !window.finishAttempt.__cmWrapped) {
      var origFinish = window.finishAttempt;
      window.finishAttempt = function (node) {
        var out = origFinish.apply(this, arguments);
        try {
          var nid = node && (node.id || node.nodeId);
          if (nid) {
            var faa = (window.S && S.faa && S.faa[nid]) || {};
            var keys = Object.keys(faa);
            var right = 0;
            for (var i = 0; i < keys.length; i++) if (faa[keys[i]] === true) right++;
            interact('node_completed', nid, {
              total_questions: keys.length,
              correct_first_attempt: right,
              accuracy_pct: keys.length ? Math.round((right / keys.length) * 100) : 0,
              time_spent_seconds: Math.round((Date.now() - T0) / 1000),
              node_type: 'mastery'
            });
            ev('node_completed', { node_id: nid, correct_first_attempt: right, total: keys.length });
          }
        } catch (e) {}
        return out;
      };
      window.finishAttempt.__cmWrapped = 1;
      wired = true;
    }

    return wired;
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  // Engagement only when the module isn't already reporting it itself.
  if (!HAS_OWN_ENGAGEMENT) {
    ev('material_opened', {});
    ev('session_start', {});

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        ACTIVE += Date.now() - visT;
        beacon('tab_switch', { seconds_active: Math.round(ACTIVE / 1000) });
      } else {
        visT = Date.now();
      }
    });

    window.addEventListener('pagehide', function () {
      if (!document.hidden) ACTIVE += Date.now() - visT;
      beacon('session_end', {
        seconds_total: Math.round((Date.now() - T0) / 1000),
        seconds_active: Math.round(ACTIVE / 1000)
      });
    });
  }

  // The quiz engine is usually defined in a later <script>; retry briefly so we
  // attach whenever it appears, then stop (no permanent timer).
  if (!wireMastery()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (wireMastery() || ++tries > 20) clearInterval(iv);
    }, 250);
  }
})();
