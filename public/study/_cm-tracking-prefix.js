/* ============================================================================
 * CentuMania — PORTABLE TRACKING PREFIX  (the "prefix" injected into EVERY module)
 * Source of truth: distilled from the production-wired prehistory-stone-age.html.
 *
 * WHAT IT DOES (two layers, both silent no-ops when signed out / opened standalone):
 *   Layer 1 — window._send / cmSend → POST /api/study/interaction
 *             (node_opened | node_completed | mcq_attempt) → feeds the Centum Index.
 *   Layer 2 — cmEvent → POST /api/events ; cmBeacon → /api/events/beacon
 *             (material_opened, session_start/end, tab_switch, active seconds)
 *             → feeds student_metrics + the admin activity timeline.
 *
 * HOW TO USE PER MODULE:
 *   1. Set CM_MATERIAL_DEFAULT to this module's registry id (materials.ts id / htmlPath slug).
 *   2. Inject this whole block as an inline <script> near the top of the module's main <script>.
 *   3. Wire the module's own interactions to cmSend (the ONLY per-family work):
 *        - when a node/section opens:      cmSend('node_opened',   {nodeId, totalQuestions})
 *        - on a first-attempt MCQ answer:  cmSend('question_answered', {nodeId, questionIndex, firstAttemptCorrect})
 *        - when a node is cleared:          cmSend('node_completed', {nodeId, totalQuestions, correctOnFirstAttempt, firstAttemptAccuracyPct, timeSpentSeconds})
 *   Event names for cmEvent/cmBeacon MUST be in ALLOWED_EVENTS (src/lib/analytics/track.ts):
 *   login, material_opened, daily_material_completed, node_opened, node_completed,
 *   mcq_started, mcq_completed, session_start, session_end, node_open, tab_switch,
 *   test_start, answer, test_finish.  Anything else → 400.
 * ==========================================================================*/
(function(){
  var CM_MATERIAL_DEFAULT = '__MATERIAL_ID__'; /* ← replace per module */
  var CM_T0 = Date.now(), CM_ACTIVE = 0, _cmVisT = Date.now();

  function cmToken(){
    try{ var t=localStorage.getItem('cm:access_token'); if(t) return t; }catch(e){}
    try{ var stores=[localStorage,sessionStorage],s,i,k,d;
      for(s=0;s<stores.length;s++){ for(i=0;i<stores[s].length;i++){ k=stores[s].key(i);
        if(k&&k.indexOf('sb-')===0&&k.slice(-11)==='-auth-token'){ d=JSON.parse(stores[s].getItem(k)||'{}'); if(d&&d.access_token) return d.access_token; }
      }}
    }catch(e){}
    return null;
  }
  function cmMaterialId(){ try{ return localStorage.getItem('cm:material_id')||CM_MATERIAL_DEFAULT; }catch(e){ return CM_MATERIAL_DEFAULT; } }
  function cmSessionId(){
    try{ var id=sessionStorage.getItem('cm:analytics_session');
      if(!id){ id=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():(Math.random().toString(36).slice(2)+Date.now().toString(36)); sessionStorage.setItem('cm:analytics_session',id); }
      return id;
    }catch(e){ return 'anon-'+Math.random().toString(36).slice(2); }
  }

  /* Layer 1 — Centum Index interactions */
  window._send = window._send || function(event, payload){
    try{
      var token=cmToken(), materialId=cmMaterialId(), nodeId=payload&&payload.nodeId;
      if(!token||!materialId||!nodeId) return;
      var itype, meta;
      if(event==='node_opened'){ itype='node_opened'; meta={total_questions:payload.totalQuestions||0}; }
      else if(event==='question_answered'){ itype='mcq_attempt'; meta={question_index:payload.questionIndex!==undefined?payload.questionIndex:-1,is_correct:payload.firstAttemptCorrect===true}; }
      else if(event==='node_completed'){ itype='node_completed'; meta={total_questions:payload.totalQuestions||0,correct_first_attempt:payload.correctOnFirstAttempt||0,accuracy_pct:payload.firstAttemptAccuracyPct||0,time_spent_seconds:payload.timeSpentSeconds||0}; }
      else return;
      fetch('/api/study/interaction',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({interaction_type:itype,node_id:nodeId,material_id:materialId,session_id:cmSessionId(),timestamp:new Date().toISOString(),metadata:meta})}).catch(function(){});
    }catch(e){}
  };
  window.cmSend = function(ev,payload){ try{ if(typeof window._send==='function') window._send(ev,payload||{}); }catch(e){} };

  /* Layer 2 — engagement stream */
  window.cmEvent = function(name,meta){
    try{ var t=cmToken(); if(!t||typeof fetch!=='function') return;
      fetch('/api/events',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},
        body:JSON.stringify({event_name:name,session_id:cmSessionId(),event_timestamp:new Date().toISOString(),metadata:Object.assign({material_id:cmMaterialId()},meta||{})})}).catch(function(){});
    }catch(e){}
  };
  window.cmBeacon = function(name,meta){
    try{ var t=cmToken(); if(!t) return;
      var payload=JSON.stringify({_token:t,event_name:name,session_id:cmSessionId(),event_timestamp:new Date().toISOString(),metadata:Object.assign({material_id:cmMaterialId()},meta||{})});
      if(navigator.sendBeacon) navigator.sendBeacon('/api/events/beacon',new Blob([payload],{type:'application/json'}));
      else if(typeof fetch==='function') fetch('/api/events/beacon',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:payload}).catch(function(){});
    }catch(e){}
  };

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ CM_ACTIVE+=Date.now()-_cmVisT; window.cmBeacon('tab_switch',{seconds_active:Math.round(CM_ACTIVE/1000)}); }
    else{ _cmVisT=Date.now(); }
  });
  window.addEventListener('pagehide',function(){
    if(!document.hidden) CM_ACTIVE+=Date.now()-_cmVisT;
    window.cmBeacon('session_end',{seconds_total:Math.round((Date.now()-CM_T0)/1000),seconds_active:Math.round(CM_ACTIVE/1000)});
  });

  /* Boot — fires once the token is available (viewer sets it just before redirect) */
  window.cmEvent('material_opened',{});
  window.cmEvent('session_start',{});
})();
