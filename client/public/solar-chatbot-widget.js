(function() {
  var BASE_URL = "https://divyanshisolar.in";
  var SESSION_ID = Math.random().toString(36).substring(2, 15);
  var lang = "en";
  var nodeConfigs = [];
  var currentStepId = null;
  var isOpen = false;
  var partnerRef = window.SOLAR_BOT_REF || "";

  function saveLead(data) {
    var payload = Object.assign({ sessionId: SESSION_ID }, data);
    if (partnerRef) payload.ref = partnerRef;
    fetch(BASE_URL + "/api/public/web-lead", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function() {});
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent = [
      "#solar-bot-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;cursor:pointer;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(249,115,22,0.5);transition:transform 0.2s;}",
      "#solar-bot-bubble:hover{transform:scale(1.1);}",
      "#solar-bot-window{position:fixed;bottom:100px;right:24px;z-index:99999;width:360px;height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:none;flex-direction:column;overflow:hidden;font-family:sans-serif;}",
      "#solar-bot-window.open{display:flex;}",
      "#solar-bot-header{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;}",
      "#solar-bot-header h3{margin:0;font-size:15px;font-weight:700;}",
      "#solar-bot-header p{margin:0;font-size:11px;opacity:0.85;}",
      "#solar-bot-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;}",
      "#solar-bot-messages{flex:1;overflow-y:auto;padding:12px;background:#f8f9fa;}",
      ".sb-msg{margin-bottom:10px;display:flex;}",
      ".sb-msg.bot{justify-content:flex-start;}",
      ".sb-msg.user{justify-content:flex-end;}",
      ".sb-bubble{max-width:80%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.5;}",
      ".sb-msg.bot .sb-bubble{background:#fff;color:#111;border:1px solid #eee;border-radius:4px 16px 16px 16px;}",
      ".sb-msg.user .sb-bubble{background:#f97316;color:#fff;border-radius:16px 4px 16px 16px;}",
      ".sb-buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;}",
      ".sb-btn{padding:7px 14px;background:#fff;border:1.5px solid #f97316;color:#f97316;border-radius:20px;font-size:12px;cursor:pointer;}",
      ".sb-btn:hover{background:#f97316;color:#fff;}",
      "#solar-bot-input-area{padding:10px 12px;border-top:1px solid #eee;display:flex;gap:8px;background:#fff;}",
      "#solar-bot-input{flex:1;border:1.5px solid #ddd;border-radius:20px;padding:8px 14px;font-size:13px;outline:none;}",
      "#solar-bot-input:focus{border-color:#f97316;}",
      "#solar-bot-send{background:#f97316;border:none;border-radius:50%;width:36px;height:36px;color:#fff;cursor:pointer;font-size:16px;}",
      ".sb-lang-btn{padding:4px 10px;border-radius:12px;border:1.5px solid #f97316;background:#fff;color:#f97316;font-size:11px;cursor:pointer;margin-right:4px;}",
      ".sb-lang-btn.active{background:#f97316;color:#fff;}"
    ].join("");
    document.head.appendChild(style);
  }

  function createWidget() {
    var bubble = document.createElement("div");
    bubble.id = "solar-bot-bubble";
    bubble.title = "Solar Bot";
    bubble.innerHTML = '<svg width="28" height="28" viewBox="0 0 48 48" fill="none"><rect x="6" y="12" width="36" height="22" rx="2" fill="#fff" opacity="0.9"/><line x1="6" y1="23" x2="42" y2="23" stroke="#f97316" stroke-width="1.5"/><line x1="18" y1="12" x2="18" y2="34" stroke="#f97316" stroke-width="1.5"/><line x1="30" y1="12" x2="30" y2="34" stroke="#f97316" stroke-width="1.5"/><line x1="24" y1="34" x2="24" y2="42" stroke="#fff" stroke-width="2"/><circle cx="38" cy="8" r="5" fill="#FFD600"/></svg>';
    bubble.onclick = toggleWidget;
    document.body.appendChild(bubble);

    var win = document.createElement("div");
    win.id = "solar-bot-window";
    win.innerHTML = '<div id="solar-bot-header"><div><h3>&#9728;&#65039; PM Surya Ghar Solar Bot</h3><p>Free Solar Consultation</p></div><button id="solar-bot-close">&#x2715;</button></div><div id="solar-bot-messages"><div id="sb-lang-row"></div></div><div id="solar-bot-input-area"><input id="solar-bot-input" type="text" placeholder="Type your answer..."/><button id="solar-bot-send">&#10148;</button></div>';
    document.body.appendChild(win);

    document.getElementById("solar-bot-close").onclick = toggleWidget;
    document.getElementById("solar-bot-send").onclick = handleSend;
    document.getElementById("solar-bot-input").addEventListener("keypress", function(e){ if(e.key==="Enter") handleSend(); });
    renderLangRow();
  }

  function renderLangRow() {
    var row = document.getElementById("sb-lang-row");
    if (!row) return;
    row.innerHTML = '<button class="sb-lang-btn'+(lang==="en"?" active":"")+'" onclick="window._sbLang(\'en\')">English</button><button class="sb-lang-btn'+(lang==="hi"?" active":"")+'" onclick="window._sbLang(\'hi\')">&#2361;&#2367;&#2306;&#2342;&#2368;</button>';
  }

  window._sbLang = function(l) {
    lang = l; saveLead({language:l});
    var msgs = document.getElementById("solar-bot-messages");
    msgs.innerHTML = '<div id="sb-lang-row"></div>';
    renderLangRow();
    currentStepId = null;
    runStep(nodeConfigs[0] ? nodeConfigs[0].stepId : "step_1");
  };

  function toggleWidget() {
    isOpen = !isOpen;
    document.getElementById("solar-bot-window").classList.toggle("open", isOpen);
    if (isOpen && !currentStepId) loadAndStart();
  }

  function loadAndStart() {
    fetch(BASE_URL + "/api/public/chatbot-nodes?t=" + Date.now())
      .then(function(r){return r.json();})
      .then(function(d){
        if (Array.isArray(d)) nodeConfigs = d.filter(function(n){return n.isActive;});
        runStep(nodeConfigs[0] ? nodeConfigs[0].stepId : "step_1");
      }).catch(function(){addBotMsg("Welcome! How can I help you with solar?", []);});
  }

  function runStep(stepId) {
    currentStepId = stepId;
    var node = nodeConfigs.find(function(n){return n.stepId===stepId;});
    if (!node) return;
    var msg = lang==="hi" ? (node.messageHi||node.messageEn) : node.messageEn;
    var opts = node.options ? node.options.split(",").map(function(o){return o.trim();}) : [];
    setTimeout(function(){ addBotMsg(msg, opts); }, 300);
  }

  function addBotMsg(text, opts) {
    var msgs = document.getElementById("solar-bot-messages");
    var div = document.createElement("div");
    div.className = "sb-msg bot";
    var html = '<div class="sb-bubble">'+text.replace(/\n/g,"<br>")+'</div>';
    if (opts && opts.length) {
      html += '<div class="sb-buttons">'+opts.map(function(o){
        return '<button class="sb-btn" onclick="window._sbAnswer(\''+o.replace(/\'/g,"\\'")+'\')">' + o + '</button>';
      }).join("")+'</div>';
      document.getElementById("solar-bot-input-area").style.display="none";
    } else {
      document.getElementById("solar-bot-input-area").style.display="flex";
    }
    div.innerHTML = html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  window._sbAnswer = function(answer) {
    addUserMsg(answer); processAnswer(answer);
  };

  function handleSend() {
    var inp = document.getElementById("solar-bot-input");
    var val = inp.value.trim(); if(!val) return;
    inp.value = ""; addUserMsg(val); processAnswer(val);
  }

  function addUserMsg(text) {
    var msgs = document.getElementById("solar-bot-messages");
    var div = document.createElement("div");
    div.className = "sb-msg user";
    div.innerHTML = '<div class="sb-bubble">'+text+'</div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function processAnswer(answer) {
    var node = nodeConfigs.find(function(n){return n.stepId===currentStepId;});
    if (!node) return;
    if (node.savesField) saveLead({[node.savesField]: answer});
    var nextId = null;
    if (node.nextStepRules) {
      var rules = typeof node.nextStepRules==="string" ? JSON.parse(node.nextStepRules) : node.nextStepRules;
      for (var i=0;i<rules.length;i++) {
        if (answer.toLowerCase().includes(rules[i].match.toLowerCase())) { nextId=rules[i].goToStep; break; }
      }
    }
    if (!nextId) {
      var idx = nodeConfigs.findIndex(function(n){return n.stepId===currentStepId;});
      if (idx>=0 && idx+1<nodeConfigs.length) nextId = nodeConfigs[idx+1].stepId;
    }
    if (nextId) { setTimeout(function(){runStep(nextId);},500); }
    else { setTimeout(function(){ addBotMsg(lang==="hi"?"धन्यवाद! हमारी टीम जल्द संपर्क करेगी। ☀️":"Thank you! Our team will contact you soon. ☀️",[]); },500); }
  }

  injectStyles();
  createWidget();
})();
