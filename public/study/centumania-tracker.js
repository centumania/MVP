/**
 * centumania-tracker.js
 *
 * Universal tracking shim for Centumania HTML study maps.
 * Inject this script AFTER the map's own <script> block (before </body>).
 *
 * How it works:
 *   1. Reads auth token + material_id from localStorage (written by the
 *      Next.js materials/viewer page immediately before the redirect).
 *   2. Detects which of the four map "flavours" is running and patches
 *      its tracking hook(s):
 *        • PhysicsMap-style  → overrides window._send()
 *        • ChemMap-style     → overrides window.trackEvent()
 *        • NumSystem-style   → overrides window.selectAns() + window.startStage()
 *                               + window.showResult()
 *        • BioMap-style      → overrides window.render() + window.toggleDone()
 *                               + event-delegation on [data-mcq] buttons
 *   3. All interactions POST to /api/study/interaction with a Bearer token.
 *
 * Constraints:
 *   • Zero visual changes — no DOM modification, only function replacement.
 *   • No new libraries — plain ES5-compatible JS.
 *   • Silently swallows all errors — tracking must never break the map.
 */
(function () {
  'use strict';

  // ── Storage keys ────────────────────────────────────────────────────────────
  var TOKEN_KEY    = 'cm:access_token';
  var MATERIAL_KEY = 'cm:material_id';
  var SESSION_KEY  = 'cm:analytics_session';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function getToken()     { try { return localStorage.getItem(TOKEN_KEY);    } catch (e) { return null; } }
  function getMaterialId(){ try { return localStorage.getItem(MATERIAL_KEY); } catch (e) { return null; } }

  function getSessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return Math.random().toString(36).slice(2);
    }
  }

  /**
   * Send one interaction to the backend.
   * @param {string} interactionType  'node_opened' | 'node_completed' | 'mcq_attempt'
   * @param {string} nodeId           HTML node ID string
   * @param {object} metadata         Type-specific fields
   */
  function post(interactionType, nodeId, metadata) {
    try {
      var token      = getToken();
      var materialId = getMaterialId();
      if (!token || !materialId || !nodeId) return;

      fetch('/api/study/interaction', {
        method:    'POST',
        headers:   {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          interaction_type: interactionType,
          node_id:          nodeId,
          material_id:      materialId,
          session_id:       getSessionId(),
          timestamp:        new Date().toISOString(),
          metadata:         metadata || {}
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Flavour 1: PhysicsMap-style (_send + BACKEND_URL) ───────────────────────
  // PhysicsMap calls: _send('node_opened',   {nodeId, totalQuestions})
  //                   _send('question_answered', {nodeId, questionIndex, firstAttemptCorrect})
  //                   _send('node_completed', {nodeId, totalQuestions, correctOnFirstAttempt,
  //                                             firstAttemptAccuracyPct, timeSpentSeconds})
  function patchPhysicsMap() {
    if (typeof window._send !== 'function') return;
    window._send = function (event, payload) {
      try {
        var nodeId = (payload && payload.nodeId) ? payload.nodeId : '';
        if (!nodeId) return;
        if (event === 'node_opened') {
          post('node_opened', nodeId, {
            total_questions: payload.totalQuestions || 0
          });
        } else if (event === 'question_answered') {
          post('mcq_attempt', nodeId, {
            question_index: payload.questionIndex !== undefined ? payload.questionIndex : -1,
            is_correct:     payload.firstAttemptCorrect === true
          });
        } else if (event === 'node_completed') {
          post('node_completed', nodeId, {
            total_questions:       payload.totalQuestions         || 0,
            correct_first_attempt: payload.correctOnFirstAttempt  || 0,
            accuracy_pct:          payload.firstAttemptAccuracyPct || 0,
            time_spent_seconds:    payload.timeSpentSeconds        || 0
          });
        }
        // node_abandoned: not tracked separately — node_progress.is_completed=false captures it
      } catch (e) {}
    };
  }

  // ── Flavour 2: ChemMap-style (trackEvent + /api/progress) ───────────────────
  // ChemMap calls: trackEvent('node_opened',     {nodeId, totalQuestions})
  //                trackEvent('question_answered', {nodeId, questionIndex, firstAttemptCorrect,
  //                                                  timeIntoNodeSeconds})
  //                trackEvent('node_completed',   {nodeId, totalQuestions, correctOnFirstAttempt,
  //                                                  firstAttemptAccuracyPct, timeSpentSeconds})
  function patchChemMap() {
    if (typeof window.trackEvent !== 'function') return;
    window.trackEvent = function (event, payload) {
      try {
        var nodeId = (payload && payload.nodeId) ? payload.nodeId : '';
        if (!nodeId) return;
        if (event === 'node_opened') {
          post('node_opened', nodeId, {
            total_questions: payload.totalQuestions || 0
          });
        } else if (event === 'question_answered') {
          post('mcq_attempt', nodeId, {
            question_index: payload.questionIndex !== undefined ? payload.questionIndex : -1,
            is_correct:     payload.firstAttemptCorrect === true
          });
        } else if (event === 'node_completed') {
          post('node_completed', nodeId, {
            total_questions:       payload.totalQuestions         || 0,
            correct_first_attempt: payload.correctOnFirstAttempt  || 0,
            accuracy_pct:          payload.firstAttemptAccuracyPct || 0,
            time_spent_seconds:    payload.timeSpentSeconds        || 0
          });
        }
      } catch (e) {}
    };
  }

  // ── Flavour 3: NumSystem-style (selectAns + startStage + showResult) ─────────
  // NumSystem global state: window.G = { world, stage, qs, qIdx, correct, wrong, answered }
  // Stages: 'recognition' | 'shortcut' | 'trap' | 'trap_quiz' | 'pyq' | 'mastery' | 'practice'
  // Stage key IS the node_type for most stages (mapped server-side for trap_quiz/practice).
  function patchNumSystem() {
    if (typeof window.selectAns !== 'function') return;

    // --- selectAns: fires per-question MCQ attempt ---
    var _origSelectAns = window.selectAns;
    window.selectAns = function (idx) {
      // Read state BEFORE the original function potentially resets it
      var G    = window.G;
      var qIdx = (G && G.qIdx !== undefined) ? G.qIdx : 0;
      var q    = (G && G.qs) ? G.qs[qIdx] : null;

      _origSelectAns(idx);  // run original first

      try {
        if (!G || !G.world || !q) return;
        var nodeId    = G.world.id + '_' + (G.stage || '');
        var isCorrect = (idx === q.ans);
        post('mcq_attempt', nodeId, {
          question_index: qIdx,
          is_correct:     isCorrect,
          node_type:      G.stage || 'recognition'
        });
      } catch (e) {}
    };

    // --- startStage: fires node_opened when a new stage begins ---
    if (typeof window.startStage === 'function') {
      var _origStartStage = window.startStage;
      window.startStage = function (key) {
        _origStartStage(key);
        try {
          var G = window.G;
          if (!G || !G.world) return;
          post('node_opened', G.world.id + '_' + key, {
            total_questions: G.qs ? G.qs.length : 0,
            node_type:       key
          });
        } catch (e) {}
      };
    }

    // --- showResult: fires node_completed at end of a stage ---
    if (typeof window.showResult === 'function') {
      var _origShowResult = window.showResult;
      window.showResult = function () {
        // Read G before showResult potentially resets stage state
        var G       = window.G;
        var worldId = (G && G.world) ? G.world.id : '';
        var stage   = (G && G.stage) ? G.stage : '';
        var totalQ  = (G && G.qs) ? G.qs.length : 0;
        var correct = (G && G.correct !== undefined) ? G.correct : 0;

        _origShowResult();

        try {
          if (!worldId || !stage) return;
          post('node_completed', worldId + '_' + stage, {
            total_questions:       totalQ,
            correct_first_attempt: correct,
            accuracy_pct:          totalQ > 0 ? Math.round(correct / totalQ * 100) : 0,
            node_type:             stage
          });
        } catch (e) {}
      };
    }
  }

  // ── Flavour 4: BioMap-style (render + toggleDone + DOM delegation) ───────────
  // BioMap globals: window.flat (sections array), window.cur (current index),
  //                 window.store (progress store), window.render(), window.toggleDone()
  // MCQ buttons:    <button class="opt" data-i="{choiceIdx}" data-a="{correctIdx}">
  //                 inside <div class="mcq" data-mcq="{sectionId}_{qi}">
  function patchBioMap() {
    var hasBioGlobals = (typeof window.flat !== 'undefined' && typeof window.cur !== 'undefined');
    var hasWireMcq   = (typeof window.wireMcq === 'function');
    if (!hasBioGlobals && !hasWireMcq) return;

    // --- Event delegation: catches ALL MCQ answer clicks (incl. initial render) ---
    // data-a is only present on bio-map style buttons (chem/physics use data-oi, not data-a)
    document.addEventListener('click', function (e) {
      try {
        var target = e.target;
        if (!target || !target.closest) return;
        var opt = target.closest('[data-a]');
        if (!opt) return;
        var box = opt.closest('[data-mcq]');
        if (!box) return;
        if (box.dataset.lock) return; // already answered (quiz mode lock)

        var mcqId = box.dataset.mcq || '';
        if (!mcqId) return;
        // Exclude quiz-mode MCQs (id starts with "quiz_")
        if (mcqId.indexOf('quiz_') === 0) return;

        // Split "sectionId_qi" from the end
        var lastUnderscore = mcqId.lastIndexOf('_');
        if (lastUnderscore < 0) return;
        var nodeId = mcqId.slice(0, lastUnderscore);
        var qi     = parseInt(mcqId.slice(lastUnderscore + 1), 10);
        if (!nodeId || isNaN(qi)) return;

        var chosen  = parseInt(opt.dataset.i, 10);
        var correct = parseInt(opt.dataset.a, 10);
        post('mcq_attempt', nodeId, {
          question_index: qi,
          is_correct:     (chosen === correct)
        });
      } catch (e2) {}
    }, true); // capture phase fires before the onclick handler locks the MCQ

    // --- render() override: fires node_opened on section navigation ---
    if (typeof window.render === 'function') {
      var _origRender      = window.render;
      var _cmLastNodeId    = null;
      window.render = function () {
        _origRender();
        try {
          var mode = window.mode;
          if (mode && mode !== 'study') return; // skip quiz/revise modes
          var s = window.flat && window.flat[window.cur];
          if (!s || s.id === _cmLastNodeId) return;
          _cmLastNodeId = s.id;
          post('node_opened', s.id, {
            total_questions: (s.mcqs ? s.mcqs.length : 0)
          });
        } catch (e) {}
      };
    }

    // --- toggleDone() override: fires node_completed when student marks a section ---
    if (typeof window.toggleDone === 'function') {
      var _origToggleDone = window.toggleDone;
      window.toggleDone = function () {
        _origToggleDone();
        try {
          var s   = window.flat && window.flat[window.cur];
          var done = window.store && window.store.done;
          if (s && done && done.indexOf(s.id) !== -1) {
            // Just marked as done
            post('node_completed', s.id, {
              total_questions:       s.mcqs ? s.mcqs.length : 0,
              correct_first_attempt: 0,
              accuracy_pct:          0
            });
          }
        } catch (e) {}
      };
    }
  }

  // ── Daily test score submission ──────────────────────────────────────────────
  // Called by the map once when quiz mode ends. First submission per IST day wins —
  // the DB unique(user_id, test_date) constraint silently rejects reshuffles.
  function postTestScore(score, total, timeTakenS) {
    try {
      var token      = getToken();
      var materialId = getMaterialId();
      if (!token || !materialId) return;

      fetch('/api/study/daily-test/submit', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          material_id:  materialId,
          score:        score,
          total:        total,
          time_taken_s: timeTakenS || null
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    patchPhysicsMap();
    patchChemMap();
    patchNumSystem();
    patchBioMap();
    // Expose to map scripts so they can submit scores without importing this module
    window._cmPostTestScore = postTestScore;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Injected after DOMContentLoaded — all map scripts have already run
    init();
  }

}());
