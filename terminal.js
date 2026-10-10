/* Main AI Terminal: chat (gpt-oss-20b) plus the Flashcards, Syllabus Analyzer and Exam Generator tabs. */
(function () {
  'use strict';
  var SS = window.SS, el = SS.el, t = SS.t;
  var hist = [], pending = false;
  var log, input, sendBtn, noteEl, root;

  function addMsg(role, text) {
    var m = el('div', 'msg ' + role);
    if (role !== 'sys') m.appendChild(el('span', 'who', (role === 'you' ? t('you') : t('guide')) + ' ›'));
    var b = el('span', 'body', text); m.appendChild(b);
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    return { row: m, body: b };
  }
  function renderIntro() {
    if (!log || hist.length || pending) return;
    log.textContent = '';
    addMsg('guide', t('term_intro'));
  }

  async function ask(text) {
    pending = true; sendBtn.disabled = true; noteEl.textContent = '';
    if (!hist.length) log.textContent = '';
    hist.push({ role: 'user', content: text }); addMsg('you', text);
    var out = addMsg('guide', ''); out.body.classList.add('dots');
    var messages = [{ role: 'system', content: SS.AI.tutorSystem(false) }].concat(hist.slice(-12));
    try {
      var reply = await SS.AI.chat('main', messages, { onText: function (x) { out.body.classList.remove('dots'); out.body.textContent = x; log.scrollTop = log.scrollHeight; } });
      if (!reply) throw new Error('empty');
      out.body.classList.remove('dots'); out.body.textContent = reply;
      hist.push({ role: 'assistant', content: reply });
      noteEl.textContent = SS.AI.note();
    } catch (e) {
      hist.pop();
      out.row.remove();
      addMsg('sys', SS.AI.errorText(e));
    }
    pending = false; sendBtn.disabled = false; log.scrollTop = log.scrollHeight; input.focus();
  }

  function openTab(name) {
    SS.$$('.tab', root).forEach(function (b) { var on = b.getAttribute('data-tab') === name; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    SS.$$('.panel', root).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== name; });
    if (name === 'chat' && input) input.focus();
  }
  SS.tools.openTab = openTab;

  SS.registerView('term', {
    init: function (r) {
      root = r;
      r.innerHTML =
        '<div class="wrap tool-page">' +
        '<div class="term-head"><h1 data-i18n="term_h"></h1><button class="btn ghost" id="homeBtn" type="button" data-i18n="home"></button></div>' +
        '<div class="tabs" role="tablist">' +
        '<button class="tab" role="tab" data-tab="chat" data-i18n="tab_chat"></button>' +
        '<button class="tab" role="tab" data-tab="flash" data-i18n="tab_flash"></button>' +
        '<button class="tab" role="tab" data-tab="syl" data-i18n="tab_syl"></button>' +
        '<button class="tab" role="tab" data-tab="exam" data-i18n="tab_exam"></button></div>' +
        '<section class="panel" data-panel="chat" role="tabpanel">' +
        '<p class="sub" data-i18n="term_sub"></p>' +
        '<div class="term"><div class="term-log" id="log" role="log" aria-live="polite"></div>' +
        '<form class="term-form" id="termForm"><textarea id="termInput" rows="1" data-i18n-ph="term_ph" aria-label="Question"></textarea>' +
        '<button class="btn" id="sendBtn" type="submit" data-i18n="send"></button></form></div>' +
        '<div class="term-foot"><span class="ai-note" id="chatNote"></span><button class="btn ghost" id="clearBtn" type="button" data-i18n="clear"></button></div></section>' +
        '<section class="panel" data-panel="flash" role="tabpanel" hidden></section>' +
        '<section class="panel" data-panel="syl" role="tabpanel" hidden></section>' +
        '<section class="panel" data-panel="exam" role="tabpanel" hidden></section></div>';
      log = SS.$('#log', r); input = SS.$('#termInput', r); sendBtn = SS.$('#sendBtn', r); noteEl = SS.$('#chatNote', r);

      SS.$$('.tab', r).forEach(function (b) { b.addEventListener('click', function () { openTab(b.getAttribute('data-tab')); }); });
      SS.$('#homeBtn', r).addEventListener('click', function () { SS.showView('home'); });
      SS.tools.flash(SS.$('[data-panel="flash"]', r));
      SS.tools.syl(SS.$('[data-panel="syl"]', r));
      SS.tools.exam(SS.$('[data-panel="exam"]', r));

      SS.$('#termForm', r).addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!v || pending) return;
        input.value = ''; input.style.height = 'auto';
        ask(v);
      });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); SS.$('#termForm', r).requestSubmit(); } });
      input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; });
      SS.$('#clearBtn', r).addEventListener('click', function () { if (pending) return; hist = []; noteEl.textContent = ''; renderIntro(); });
      openTab('chat');
      renderIntro();
    },
    onShow: function () { renderIntro(); }
  });
  SS.onLang(function () { renderIntro(); });
  SS.onAuth(function (ok) { if (!ok) { hist = []; if (log) { log.textContent = ''; renderIntro(); } } });
})();
