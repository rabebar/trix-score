const STORAGE_KEY = "trix-score-prototype-v3";

const ROUND_TYPES = {
  king: { label: "شيخ الكبة", symbol: "K♥", hint: "اضغط ورقة الشيخ بجانب اللاعب الذي أكلها." },
  queens: { label: "البنات", symbol: "Q", hint: "وزّع أوراق البنات على اللاعبين الذين أكلوها." },
  diamonds: { label: "الديناري", symbol: "♦", hint: "حدّد عدد أوراق الديناري التي أكلها كل لاعب. يجب أن يكون المجموع 13." },
  tricks: { label: "لطش", symbol: "♣", hint: "حدّد عدد اللمّات التي أخذها كل لاعب. يجب أن يكون المجموع 13." },
  trix: { label: "تريكس", symbol: "7", hint: "اضغط أسماء اللاعبين حسب ترتيب انتهائهم من الأول إلى الرابع." }
};

const defaultState = {
  game: "trix",
  mode: "individual",
  targetScore: 31,
  handEndMode: "manual",
  players: ["أحمد", "محمد", "سامر", "عمر"],
  scores: [0, 0, 0, 0],
  history: [],
  activeRound: "king",
  kingdomNumber: 1,
  kingdomOwner: null,
  completedRounds: [],
  gameFinished: false,
  tarneebScores: [0, 0],
  tarneebHistory: [],
  tarneebDraft: null,
  handScores: [0, 0, 0, 0],
  handHistory: [],
  handDraft: null,
  complexScores: [0, 0, 0, 0],
  complexHistory: [],
  complexKingdom: 1,
  complexOwner: null,
  complexCompleted: [],
  complexRound: "complex",
  complexDraft: null,
  draft: null
};

let state = loadState();
let pendingRound = null;
let toastTimer = null;
let deferredInstallPrompt = null;

const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const playersForm = document.getElementById("playersForm");
const scoreStrip = document.getElementById("scoreStrip");
const roundTabs = document.getElementById("roundTabs");
const roundWorkspace = document.getElementById("roundWorkspace");
const historyList = document.getElementById("historyList");
const roundCounter = document.getElementById("roundCounter");
const kingdomStatus = document.getElementById("kingdomStatus");
const roundHeading = document.getElementById("roundHeading");
const undoButton = document.getElementById("undoButton");
const confirmDialog = document.getElementById("confirmDialog");
const modeControl = document.getElementById("modeControl");
const targetControl = document.getElementById("targetControl");
const handEndControl = document.getElementById("handEndControl");
const quickGuide = document.getElementById("quickGuide");
const quickGuideToggle = document.getElementById("quickGuideToggle");
const quickGuideContent = document.getElementById("quickGuideContent");
const installAppButton = document.getElementById("installAppButton");
const iosInstallDialog = document.getElementById("iosInstallDialog");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.players?.length === 4) return { ...defaultState, ...saved, draft: null };
  } catch (_) {}
  return structuredClone(defaultState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, draft: null }));
}

function renderSetup() {
  document.querySelectorAll(".game-choice").forEach(button => {
    const active = button.dataset.game === state.game;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll(".mode-choice").forEach(button => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll(".target-choice").forEach(button => {
    const active = Number(button.dataset.target) === state.targetScore;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll(".hand-end-choice").forEach(button => {
    const active = button.dataset.handEnd === state.handEndMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });

  modeControl.classList.toggle("hidden", state.game === "tarneeb");
  targetControl.classList.toggle("hidden", state.game !== "tarneeb");
  handEndControl.classList.toggle("hidden", state.game !== "hand");

  playersForm.innerHTML = state.players.map((name, index) => `
    <div class="player-field">
      <label for="player-${index}">اللاعب ${index + 1}</label>
      <input id="player-${index}" maxlength="18" value="${escapeHtml(name)}" autocomplete="off">
      ${(state.mode === "partnership" || state.game === "tarneeb") ? `<span class="team-hint">${index % 2 === 0 ? "الفريق الأول" : "الفريق الثاني"}</span>` : ""}
    </div>
  `).join("");
}

function startGame() {
  const names = [...playersForm.querySelectorAll("input")].map(input => input.value.trim());
  if (names.some(name => !name)) return showToast("اكتب أسماء اللاعبين الأربعة.");
  if (new Set(names).size !== 4) return showToast("استخدم اسمًا مختلفًا لكل لاعب.");
  state.players = names;
  state.gameFinished = false;
  if (state.game === "tarneeb") {
    state.mode = "partnership";
    state.tarneebScores = [0, 0];
    state.tarneebHistory = [];
    resetTarneebDraft();
    saveState();
    return showGame();
  }
  if (state.game === "hand") {
    state.handScores = state.mode === "partnership" ? [0, 0] : [0, 0, 0, 0];
    state.handHistory = [];
    resetHandDraft();
    saveState();
    return showGame();
  }
  if (state.game === "complex") {
    state.complexScores = [0, 0, 0, 0];
    state.complexHistory = [];
    state.complexKingdom = 1;
    state.complexOwner = null;
    state.complexCompleted = [];
    state.complexRound = "complex";
    resetComplexDraft();
    saveState();
    return showGame();
  }
  state.scores = [0, 0, 0, 0];
  state.history = [];
  state.activeRound = "king";
  state.kingdomNumber = 1;
  state.kingdomOwner = null;
  state.completedRounds = [];
  state.gameFinished = false;
  resetDraft();
  saveState();
  showGame();
}

function showGame() {
  setupScreen.classList.remove("active");
  gameScreen.classList.add("active");
  renderGame();
}

function showSetup() {
  gameScreen.classList.remove("active");
  setupScreen.classList.add("active");
  renderSetup();
}

function renderGame() {
  document.querySelector(".app-header h1").textContent =
    state.game === "tarneeb" ? "طرنيب" :
    state.game === "hand" ? "هاند" :
    state.game === "complex" ? "كومبلكس" : "تريكس";
  renderQuickGuide();
  if (state.game === "tarneeb") {
    renderTarneebGame();
    return;
  }
  if (state.game === "hand") {
    renderHandGame();
    return;
  }
  if (state.game === "complex") {
    renderComplexGame();
    return;
  }
  renderScores();
  renderRoundTabs();
  renderWorkspace();
  renderHistory();
}

function renderQuickGuide() {
  const guides = {
    trix: {
      title: "تسجيل تريكس",
      steps: [
        "اختر طلب الجولة من البطاقات في الأعلى.",
        "سجّل ما حدث على الطاولة، والتطبيق يحسب النقاط.",
        "علامة الصح تعني أن الطلب لُعب في المملكة الحالية.",
        "بعد الطلبات الخمسة تبدأ المملكة التالية تلقائيًا."
      ],
      note: "يمكنك التراجع عن آخر جولة إذا وقع خطأ."
    },
    complex: {
      title: "تسجيل كومبلكس",
      steps: [
        "اختر صاحب المملكة قبل بدء التسجيل.",
        "في جولة كومبلكس سجّل الشيخ والبنات والديناري واللطش معًا.",
        "الجولة الثانية هي تريكس وترتيب انتهاء اللاعبين.",
        "بعد الجولتين تنتقل المملكة تلقائيًا للاعب التالي."
      ],
      note: "الشيخ والبنات فقط يقبلان التدبيل."
    },
    tarneeb: {
      title: "تسجيل طرنيب",
      steps: [
        "اختر نوع الطرنيب من الأعلى.",
        "حدّد الفريق الطالب وقيمة الطلب.",
        "أدخل لمّات الفريق الطالب فقط؛ لمّات الفريق الآخر تُحسب تلقائيًا.",
        "تتوقف المباراة عند الهدف المختار: 31 أو 41 أو 61."
      ],
      note: "تأكد من النتيجة المتوقعة قبل حفظ الجولة."
    },
    hand: {
      title: "تسجيل هاند",
      steps: [
        "اختر موجب أو سالب لكل لاعب أو فريق.",
        "أدخل نتيجة الجولة كما اتفق عليها اللاعبون.",
        "حدّد من حقق هاند للتوثيق في السجل فقط.",
        "الفائز عند النهاية هو صاحب أقل مجموع."
      ],
      note: handEndModeLabel()
    }
  };
  const guide = guides[state.game];
  quickGuideContent.innerHTML = `
    <h3>${guide.title}</h3>
    <ol>${guide.steps.map(step => `<li>${step}</li>`).join("")}</ol>
    <p>${guide.note}</p>
  `;
  quickGuide.classList.remove("collapsed");
  quickGuideToggle.setAttribute("aria-expanded", "true");
  quickGuideToggle.lastElementChild.textContent = "⌃";
}

function teamNames(teamIndex) {
  return teamIndex === 0
    ? `${state.players[0]} و${state.players[2]}`
    : `${state.players[1]} و${state.players[3]}`;
}

function resetTarneebDraft() {
  state.tarneebDraft = { bidder: null, bid: 7, suit: "♥", bidderTricks: 0 };
}

function renderTarneebGame() {
  if (!state.tarneebDraft) resetTarneebDraft();
  scoreStrip.classList.add("partnership");
  scoreStrip.innerHTML = state.tarneebScores.map((score, teamIndex) => `
    <div class="score-player ${teamIndex === 1 ? "team-b" : ""}">
      <span class="score-name">${escapeHtml(teamNames(teamIndex))}</span>
      <span class="score-value">${formatScore(score)}</span>
    </div>
  `).join("");

  roundHeading.textContent = "سجّل جولة طرنيب";
  kingdomStatus.innerHTML = `<span>الهدف: ${state.targetScore} نقطة</span>`;
  roundCounter.textContent = `${state.tarneebHistory.length} ${state.tarneebHistory.length === 1 ? "جولة" : "جولات"}`;
  roundTabs.classList.remove("complex-tabs", "hand-tabs");
  roundTabs.classList.add("tarneeb-tabs");
  roundTabs.innerHTML = ["♥", "♦", "♠", "♣"].map(suit => `
    <button class="round-tab suit-tab ${state.tarneebDraft.suit === suit ? "active" : ""}" data-tarneeb-suit="${suit}" ${state.gameFinished ? "disabled" : ""}>
      <span class="tab-symbol ${"♥♦".includes(suit) ? "red" : ""}">${suit}</span>
      ${tarneebSuitName(suit)}
    </button>
  `).join("");

  renderTarneebWorkspace();
  renderTarneebHistory();
}

function tarneebSuitName(suit) {
  return { "♥": "كبة", "♦": "ديناري", "♠": "بستوني", "♣": "سباتي" }[suit];
}

function renderTarneebWorkspace() {
  if (state.gameFinished) {
    const winner = state.tarneebScores[0] >= state.tarneebScores[1] ? 0 : 1;
    roundWorkspace.innerHTML = `
      <div class="game-finished">
        <span aria-hidden="true">✓</span>
        <p class="game-finished-label">اكتملت مباراة الطرنيب</p>
        <h3>الفريق الفائز</h3>
        <strong class="winner-name">${escapeHtml(teamNames(winner))}</strong>
        <span class="winner-score">${formatScore(state.tarneebScores[winner])} نقطة</span>
      </div>
    `;
    return;
  }

  const draft = state.tarneebDraft;
  const otherTricks = 13 - draft.bidderTricks;
  roundWorkspace.innerHTML = `
    <div class="workspace-head">
      <h3>تفاصيل الجولة</h3>
      <p>اختر الفريق الطالب وقيمة الطلب، ثم سجّل عدد اللمّات التي حققها.</p>
    </div>

    <div class="tarneeb-field">
      <span class="control-label">الفريق الطالب</span>
      <div class="tarneeb-team-grid">
        ${[0, 1].map(team => `
          <button class="choice-button ${draft.bidder === team ? "active safe" : ""}" data-tarneeb-bidder="${team}">
            ${escapeHtml(teamNames(team))}
          </button>
        `).join("")}
      </div>
      ${draft.bidder === null ? `<p class="selection-warning">اختر الفريق الطالب قبل متابعة تسجيل الجولة.</p>` : ""}
    </div>

    <div class="tarneeb-field">
      <span class="control-label">قيمة الطلب</span>
      <div class="bid-grid">
        ${[7, 8, 9, 10, 11, 12, 13].map(bid => `
          <button class="bid-button ${draft.bid === bid ? "active" : ""}" data-tarneeb-bid="${bid}">
            ${bid === 13 ? `<strong>13</strong><small>كبّوت</small>` : bid}
          </button>
        `).join("")}
      </div>
    </div>

    <div class="tarneeb-field">
      <span class="control-label">لمّات الفريق الطالب</span>
      <div class="tarneeb-tricks">
        <button data-tarneeb-tricks="-1" aria-label="إنقاص">−</button>
        <strong>${draft.bidderTricks}</strong>
        <button data-tarneeb-tricks="1" aria-label="زيادة">+</button>
      </div>
      <div class="tarneeb-tricks-summary">
        ${draft.bidder === null
          ? `<span class="full-row">بانتظار اختيار الفريق الطالب.</span>`
          : `
            <span>${escapeHtml(teamNames(draft.bidder))}: <b>${draft.bidderTricks}</b></span>
            <span>${escapeHtml(teamNames(draft.bidder === 0 ? 1 : 0))}: <b>${otherTricks}</b></span>
          `}
      </div>
    </div>

    <div class="tarneeb-preview">
      ${renderTarneebPreview()}
    </div>
    <div class="workspace-actions">
      <button class="primary-button" id="prepareTarneebButton" ${draft.bidder === null ? "disabled" : ""}>تأكيد وحفظ الجولة</button>
    </div>
  `;
}

function renderTarneebPreview() {
  if (state.tarneebDraft.bidder === null) {
    return `<span class="full-row">اختر الفريق الطالب لعرض الحساب المتوقع.</span>`;
  }
  const changes = TarneebScoring.calculate(state.tarneebDraft);
  return [0, 1].map(team => `
    <span>${escapeHtml(teamNames(team))}: <strong>${formatSigned(changes[team])}</strong></span>
  `).join("");
}

function resetComplexDraft() {
  state.complexDraft = state.complexRound === "trix"
    ? { order: [] }
    : {
        king: { eater: null, doubled: false, doubler: null },
        queens: Object.fromEntries(["Q♠", "Q♥", "Q♦", "Q♣"].map(card => [
          card, { eater: null, doubled: false, doubler: null }
        ])),
        diamonds: [0, 0, 0, 0],
        tricks: [0, 0, 0, 0]
      };
}

function renderComplexGame() {
  if (!state.complexDraft) resetComplexDraft();
  const partnership = state.mode === "partnership";
  if (partnership) {
    const teams = [
      { name: teamNames(0), score: state.complexScores[0] + state.complexScores[2] },
      { name: teamNames(1), score: state.complexScores[1] + state.complexScores[3] }
    ];
    scoreStrip.classList.add("partnership");
    scoreStrip.innerHTML = teams.map((team, index) => `
      <div class="score-player ${index === 1 ? "team-b" : ""}">
        <span class="score-name">${escapeHtml(team.name)}</span>
        <span class="score-value">${formatScore(team.score)}</span>
      </div>
    `).join("");
  } else {
    scoreStrip.classList.remove("partnership");
    scoreStrip.innerHTML = state.players.map((name, index) => `
      <div class="score-player">
        <span class="score-name">${escapeHtml(name)}</span>
        <span class="score-value">${formatScore(state.complexScores[index])}</span>
      </div>
    `).join("");
  }

  roundHeading.textContent = "تريكس كومبلكس";
  kingdomStatus.innerHTML = `
    <span>المملكة ${state.complexKingdom} من 4</span>
    <button class="kingdom-owner" id="complexOwnerButton" ${state.complexCompleted.length ? "disabled" : ""}>
      ${state.complexOwner === null ? "اختر صاحب المملكة" : `صاحب المملكة: ${escapeHtml(state.players[state.complexOwner])}`}
    </button>
  `;
  roundCounter.textContent = `${state.complexHistory.length} ${state.complexHistory.length === 1 ? "جولة" : "جولات"}`;
  roundTabs.classList.remove("tarneeb-tabs", "hand-tabs");
  roundTabs.classList.add("complex-tabs");
  roundTabs.innerHTML = [
    { key: "complex", label: "كومبلكس", symbol: "KQ♦♣" },
    { key: "trix", label: "تريكس", symbol: "7" }
  ].map(round => `
    <button class="round-tab ${state.complexRound === round.key ? "active" : ""} ${state.complexCompleted.includes(round.key) ? "completed" : ""}"
      data-complex-round="${round.key}"
      ${state.complexOwner === null || state.complexCompleted.includes(round.key) || state.gameFinished ? "disabled" : ""}>
      <span class="tab-symbol">${round.symbol}</span>
      ${round.label}
      ${state.complexCompleted.includes(round.key) ? `<span class="completed-mark">✓</span>` : ""}
    </button>
  `).join("");

  renderComplexWorkspace();
  renderComplexHistory();
}

function renderComplexWorkspace() {
  if (state.gameFinished) {
    const entries = state.mode === "partnership"
      ? [
          { name: teamNames(0), score: state.complexScores[0] + state.complexScores[2] },
          { name: teamNames(1), score: state.complexScores[1] + state.complexScores[3] }
        ]
      : state.players.map((name, index) => ({ name, score: state.complexScores[index] }));
    entries.sort((a, b) => b.score - a.score);
    const winners = entries.filter(entry => entry.score === entries[0].score);
    roundWorkspace.innerHTML = `
      <div class="game-finished">
        <span aria-hidden="true">✓</span>
        <p class="game-finished-label">اكتملت ممالك الكومبلكس</p>
        <h3>${winners.length > 1 ? "تعادل في المركز الأول" : "الفائز بالمباراة"}</h3>
        <strong class="winner-name">${escapeHtml(winners.map(entry => entry.name).join(" و"))}</strong>
        <span class="winner-score">${formatScore(entries[0].score)} نقطة</span>
      </div>
    `;
    return;
  }

  if (state.complexOwner === null) {
    roundWorkspace.innerHTML = `
      <div class="selection-required">
        <span aria-hidden="true">؟</span>
        <h3>من صاحب المملكة الأولى؟</h3>
        <p>اختر صاحب المملكة من الزر في الأعلى، ثم ابدأ تسجيل الجولتين.</p>
      </div>
    `;
    return;
  }

  roundWorkspace.innerHTML = state.complexRound === "trix"
    ? renderComplexTrixRound()
    : renderComplexPenaltyRound();
}

function renderComplexPenaltyRound() {
  const draft = state.complexDraft;
  const diamondsTotal = draft.diamonds.reduce((sum, value) => sum + value, 0);
  const tricksTotal = draft.tricks.reduce((sum, value) => sum + value, 0);
  const queensReady = Object.values(draft.queens).every(queen => (
    queen.eater !== null && (!queen.doubled || queen.doubler !== null)
  ));
  const ready = draft.king.eater !== null &&
    (!draft.king.doubled || draft.king.doubler !== null) &&
    queensReady && diamondsTotal === 13 && tricksTotal === 13;

  return `
    <div class="workspace-head">
      <h3>جولة كومبلكس</h3>
      <p>سجّل جميع العقوبات التي حدثت في الجولة، ثم احفظها دفعة واحدة.</p>
    </div>

    <section class="complex-part">
      <div class="complex-part-title"><span class="playing-card red-card" data-rank="K" data-suit="♥">♥</span><strong>شيخ الكبة</strong></div>
      <div class="complex-player-choices">
        ${state.players.map((name, index) => `
          <button class="choice-button ${draft.king.eater === index ? "active safe" : ""}" data-complex-king-eater="${index}">${escapeHtml(name)}</button>
        `).join("")}
      </div>
      <label class="switch complex-double-toggle">
        <input type="checkbox" id="complexKingDouble" ${draft.king.doubled ? "checked" : ""}> الشيخ مدبّل
      </label>
      ${draft.king.doubled ? `
        <div class="complex-player-choices">
          ${state.players.map((name, index) => `
            <button class="choice-button ${draft.king.doubler === index ? "active" : ""}" data-complex-king-doubler="${index}">دبّله ${escapeHtml(name)}</button>
          `).join("")}
        </div>
      ` : ""}
    </section>

    <section class="complex-part">
      <div class="complex-part-title"><span class="queen-mark">Q</span><strong>البنات الأربع</strong></div>
      <div class="complex-queens">
        ${Object.entries(draft.queens).map(([card, queen]) => `
          <article class="complex-queen">
            <span class="playing-card ${"♥♦".includes(card[1]) ? "red-card" : ""}" data-rank="Q" data-suit="${card[1]}">${card[1]}</span>
            <div>
              <small>من أكلها؟</small>
              <div class="complex-player-choices">
                ${state.players.map((name, index) => `
                  <button class="choice-button ${queen.eater === index ? "active safe" : ""}" data-complex-queen-eater="${card}" data-player="${index}">${escapeHtml(name)}</button>
                `).join("")}
              </div>
              <div class="complex-queen-double">
                <button class="choice-button ${!queen.doubled ? "active safe" : ""}" data-complex-queen-double="${card}" data-player="none">غير مدبّلة</button>
                ${state.players.map((name, index) => `
                  <button class="choice-button ${queen.doubler === index ? "active" : ""}" data-complex-queen-double="${card}" data-player="${index}">دبّلها ${escapeHtml(name)}</button>
                `).join("")}
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    ${renderComplexCounterPart("الديناري", "♦", "diamonds", draft.diamonds, diamondsTotal)}
    ${renderComplexCounterPart("لطش", "♣", "tricks", draft.tricks, tricksTotal)}

    <div class="workspace-actions">
      <button class="primary-button" id="prepareComplexButton" ${ready ? "" : "disabled"}>
        ${ready ? "تأكيد وحفظ جولة الكومبلكس" : "أكمل تسجيل جميع العقوبات"}
      </button>
    </div>
  `;
}

function renderComplexCounterPart(label, symbol, field, counts, total) {
  return `
    <section class="complex-part">
      <div class="complex-part-title"><span class="counter-symbol ${symbol === "♦" ? "red" : ""}">${symbol}</span><strong>${label}</strong></div>
      <div class="trick-stepper">
        ${state.players.map((name, index) => `
          <div class="stepper-player">
            <strong>${escapeHtml(name)}</strong>
            <div class="stepper-controls">
              <button data-complex-count="${field}" data-player="${index}" data-delta="-1">−</button>
              <span class="stepper-value">${counts[index]}</span>
              <button data-complex-count="${field}" data-player="${index}" data-delta="1">+</button>
            </div>
          </div>
        `).join("")}
      </div>
      <p class="stepper-total">${total} من 13 ${total < 13 ? `· المتبقي ${13 - total}` : "· اكتمل العدد"}</p>
    </section>
  `;
}

function renderComplexTrixRound() {
  const order = state.complexDraft.order;
  return `
    <div class="workspace-head">
      <h3>جولة تريكس</h3>
      <p>اضغط أسماء اللاعبين حسب ترتيب انتهائهم.</p>
    </div>
    <div class="rank-grid">
      ${state.players.map((name, index) => {
        const rank = order.indexOf(index);
        return `
          <button class="rank-player ${rank >= 0 ? "selected" : ""}" data-complex-rank="${index}">
            <span class="rank-number">${rank >= 0 ? rank + 1 : "؟"}</span>
            <span>${escapeHtml(name)}</span>
          </button>
        `;
      }).join("")}
    </div>
    <div class="workspace-actions">
      <button class="primary-button" id="prepareComplexButton" ${order.length === 4 ? "" : "disabled"}>تأكيد وحفظ جولة تريكس</button>
    </div>
  `;
}

function resetHandDraft() {
  const scoreCount = state.mode === "partnership" ? 2 : 4;
  state.handDraft = {
    scores: Array(scoreCount).fill(null),
    signs: Array(scoreCount).fill(1),
    handMaker: null
  };
}

function renderHandGame() {
  const expectedScores = state.mode === "partnership" ? 2 : 4;
  if (!state.handDraft?.scores || state.handDraft.scores.length !== expectedScores) resetHandDraft();
  if (state.handDraft.handMaker === undefined) state.handDraft.handMaker = null;
  const partnership = state.mode === "partnership";
  scoreStrip.classList.toggle("partnership", partnership);
  const scoreNames = partnership ? [teamNames(0), teamNames(1)] : state.players;
  scoreStrip.innerHTML = state.handScores.map((score, index) => `
    <div class="score-player ${partnership && index === 1 ? "team-b" : ""}">
      <span class="score-name">${escapeHtml(scoreNames[index])}</span>
      <span class="score-value">${formatScore(score)}</span>
    </div>
  `).join("");

  roundHeading.textContent = "سجّل جولة هاند";
  kingdomStatus.innerHTML = `
    <span>الجولة ${state.handHistory.length + 1}</span>
    <span>${handEndModeLabel()}</span>
  `;
  roundCounter.textContent = `${state.handHistory.length} ${state.handHistory.length === 1 ? "جولة" : "جولات"}`;
  roundTabs.classList.add("hand-tabs");
  roundTabs.classList.remove("tarneeb-tabs", "complex-tabs");
  roundTabs.innerHTML = `
    <div class="hand-round-banner">
      <strong>الجولة ${state.handHistory.length + 1}</strong>
      <span>سجّل النتائج ثم احفظ</span>
    </div>
  `;

  renderHandWorkspace();
  renderHandHistory();
}

function handEndModeLabel() {
  if (state.handEndMode === "five") return "تنتهي تلقائيًا بعد 5 جولات";
  if (state.handEndMode === "minus200") return "تنتهي تلقائيًا عند سالب 200";
  return "إنهاء يدوي · الأقل نقاطًا يفوز";
}

function renderHandWorkspace() {
  if (state.gameFinished) {
    const entries = state.mode === "partnership"
      ? state.handScores.map((score, index) => ({ name: teamNames(index), score }))
      : state.handScores.map((score, index) => ({ name: state.players[index], score }));
    const ranking = entries.sort((a, b) => a.score - b.score);
    const winners = ranking.filter(entry => entry.score === ranking[0].score);
    roundWorkspace.innerHTML = `
      <div class="game-finished">
        <span aria-hidden="true">✓</span>
        <p class="game-finished-label">انتهت مباراة هاند</p>
        <h3>${winners.length > 1 ? "تعادل في المركز الأول" : "الفائز بالمباراة"}</h3>
        <strong class="winner-name">${escapeHtml(winners.map(entry => entry.name).join(" و"))}</strong>
        <span class="winner-score">${formatScore(ranking[0].score)} نقطة</span>
      </div>
    `;
    return;
  }

  const draft = state.handDraft;
  const names = state.mode === "partnership" ? [teamNames(0), teamNames(1)] : state.players;
  roundWorkspace.innerHTML = `
    <section class="hand-step">
      <div class="hand-step-head">
        <span>1</span>
        <div>
          <h3>هل حقق أحد هاند؟</h3>
          <p>اختياري، ويظهر في السجل فقط.</p>
        </div>
      </div>
      <div class="hand-maker-options">
        <button class="choice-button ${draft.handMaker === null ? "active safe" : ""}" data-hand-maker="none">لا أحد</button>
        ${state.players.map((name, index) => `
          <button class="choice-button ${draft.handMaker === index ? "active" : ""}" data-hand-maker="${index}">
            ${escapeHtml(name)}
          </button>
        `).join("")}
      </div>
    </section>

    <section class="hand-step">
      <div class="hand-step-head">
        <span>2</span>
        <div>
          <h3>أدخل نتائج الجولة</h3>
          <p>اختر موجب أو سالب، ثم اكتب الرقم.</p>
        </div>
      </div>
      <div class="hand-score-entry-grid">
      ${names.map((name, index) => `
        <div class="hand-score-entry">
          <strong>${escapeHtml(name)}</strong>
          <div class="hand-entry-controls">
            <div class="hand-sign-control">
              <button class="${draft.signs[index] === 1 ? "active positive" : ""}" data-hand-sign="${index}" data-sign="1" aria-label="نتيجة موجبة">+</button>
              <button class="${draft.signs[index] === -1 ? "active negative" : ""}" data-hand-sign="${index}" data-sign="-1" aria-label="نتيجة سالبة">−</button>
            </div>
            <div class="hand-score-input">
              <input type="number" min="0" step="1" inputmode="numeric" data-hand-score="${index}" value="${draft.scores[index] ?? ""}" placeholder="0" aria-label="نتيجة ${escapeHtml(name)}">
              <span>نقطة</span>
            </div>
          </div>
          <small class="${draft.signs[index] === -1 ? "negative" : "positive"}">
            النتيجة: ${draft.scores[index] === null ? "لم تُدخل" : formatSigned(draft.signs[index] * draft.scores[index])}
          </small>
        </div>
      `).join("")}
      </div>
    </section>

    <section class="hand-step save-step">
      <div class="hand-step-head">
        <span>3</span>
        <div>
          <h3>احفظ الجولة</h3>
          <p>ستُضاف النتائج إلى المجموع الحالي.</p>
        </div>
      </div>
      <button class="primary-button" id="prepareHandButton" ${draft.scores.some(score => score === null) ? "disabled" : ""}>تأكيد وحفظ الجولة</button>
    </section>

    <div class="finish-hand-area">
      <button class="finish-game-link" id="finishHandButton" ${state.handHistory.length ? "" : "disabled"}>
        ${state.handEndMode === "manual" ? "إنهاء المباراة واحتساب الفائز" : "إنهاء المباراة قبل الشرط المحدد"}
      </button>
      <small>${handEndModeLabel()}</small>
    </div>
  `;
}

function renderScores() {
  if (state.mode === "partnership") {
    const teams = [
      { names: `${state.players[0]} + ${state.players[2]}`, score: state.scores[0] + state.scores[2], className: "" },
      { names: `${state.players[1]} + ${state.players[3]}`, score: state.scores[1] + state.scores[3], className: "team-b" }
    ];
    scoreStrip.classList.add("partnership");
    scoreStrip.innerHTML = teams.map(team => `
      <div class="score-player ${team.className}">
        <span class="score-name">${escapeHtml(team.names)}</span>
        <span class="score-value">${formatScore(team.score)}</span>
      </div>
    `).join("");
    return;
  }

  scoreStrip.classList.remove("partnership");
  scoreStrip.innerHTML = state.players.map((name, index) => `
    <div class="score-player">
      <span class="score-name">${escapeHtml(name)}</span>
      <span class="score-value">${formatScore(state.scores[index])}</span>
    </div>
  `).join("");
}

function renderRoundTabs() {
  roundTabs.classList.remove("tarneeb-tabs", "hand-tabs", "complex-tabs");
  kingdomStatus.innerHTML = `
    <span>المملكة ${state.kingdomNumber} من 4</span>
    <button class="kingdom-owner" id="kingdomOwnerButton" ${state.completedRounds.length ? "disabled" : ""}>
      ${state.kingdomOwner === null ? "اختر صاحب المملكة" : `صاحب المملكة: ${escapeHtml(state.players[state.kingdomOwner])}`}
    </button>
  `;
  roundTabs.innerHTML = Object.entries(ROUND_TYPES).map(([key, round]) => `
    <button class="round-tab ${state.activeRound === key ? "active" : ""} ${state.completedRounds.includes(key) ? "completed" : ""}" data-round="${key}" ${state.completedRounds.includes(key) || state.gameFinished || state.kingdomOwner === null ? "disabled" : ""}>
      <span class="tab-symbol ${key === "king" || key === "diamonds" ? "red" : ""}">${round.symbol}</span>
      ${round.label}
      ${state.completedRounds.includes(key) ? `<span class="completed-mark" aria-label="تم لعبها">✓</span>` : ""}
    </button>
  `).join("");
}

function resetDraft() {
  if (state.activeRound === "king") state.draft = { eater: null, doubled: false, doubler: null };
  if (state.activeRound === "queens") state.draft = { assignments: {}, doubled: {}, doublers: {} };
  if (state.activeRound === "diamonds") state.draft = { counts: [0, 0, 0, 0] };
  if (state.activeRound === "tricks") state.draft = { counts: [0, 0, 0, 0] };
  if (state.activeRound === "trix") state.draft = { order: [] };
}

function renderWorkspace() {
  if (state.gameFinished) {
    const result = getFinalResult();
    roundWorkspace.innerHTML = `
      <div class="game-finished">
        <span aria-hidden="true">✓</span>
        <p class="game-finished-label">اكتملت الممالك الأربع</p>
        <h3>${result.title}</h3>
        <strong class="winner-name">${result.name}</strong>
        <span class="winner-score">${result.score}</span>
        <div class="final-ranking">
          ${result.ranking.map((entry, index) => `
            <div class="final-ranking-row ${index === 0 ? "winner" : ""}">
              <span>${index + 1}</span>
              <b>${escapeHtml(entry.name)}</b>
              <strong>${formatScore(entry.score)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    return;
  }
  if (state.kingdomOwner === null) {
    roundWorkspace.innerHTML = `
      <div class="selection-required">
        <span aria-hidden="true">؟</span>
        <h3>من صاحب المملكة الأولى؟</h3>
        <p>اضغط زر «اختر صاحب المملكة» في الأعلى، ثم ابدأ تسجيل الطلبات.</p>
      </div>
    `;
    return;
  }
  if (!state.draft) resetDraft();
  const round = ROUND_TYPES[state.activeRound];
  let content = "";
  if (state.activeRound === "king") content = renderKingRound();
  if (state.activeRound === "queens") content = renderCardAssignmentRound("queens");
  if (state.activeRound === "diamonds") content = renderCountRound("ورقة ديناري", "ورقة");
  if (state.activeRound === "tricks") content = renderCountRound("لطش", "لطش");
  if (state.activeRound === "trix") content = renderTrixRound();

  roundWorkspace.innerHTML = `
    <div class="workspace-head">
      <h3>${round.label}</h3>
      <p>${round.hint}</p>
    </div>
    ${content}
  `;
}

function getFinalResult() {
  if (state.mode === "partnership") {
    const ranking = [
      { name: `${state.players[0]} و${state.players[2]}`, score: state.scores[0] + state.scores[2] },
      { name: `${state.players[1]} و${state.players[3]}`, score: state.scores[1] + state.scores[3] }
    ].sort((a, b) => b.score - a.score);
    const tied = ranking[0].score === ranking[1].score;
    return {
      title: tied ? "المباراة انتهت بالتعادل" : "الفريق الفائز",
      name: tied ? `${ranking[0].name} و${ranking[1].name}` : escapeHtml(ranking[0].name),
      score: tied ? `النتيجة ${formatScore(ranking[0].score)} لكل فريق` : `${formatScore(ranking[0].score)} نقطة`,
      ranking
    };
  }

  const ranking = state.players
    .map((name, index) => ({ name, score: state.scores[index] }))
    .sort((a, b) => b.score - a.score);
  const winners = ranking.filter(player => player.score === ranking[0].score);
  return {
    title: winners.length > 1 ? "المباراة انتهت بالتعادل" : "الفائز بالمباراة",
    name: escapeHtml(winners.map(player => player.name).join(" و")),
    score: `${formatScore(ranking[0].score)} نقطة`,
    ranking
  };
}

function renderKingRound() {
  const draft = state.draft;
  const ready = draft.eater !== null && (!draft.doubled || draft.doubler !== null);
  let actionLabel = "تأكيد وحفظ الجولة";
  if (draft.doubled && draft.doubler === null) actionLabel = "اختر اللاعب الذي دبّل الشيخ";
  else if (draft.eater === null) actionLabel = "اختر اللاعب الذي أكل الشيخ";
  return `
    <div class="double-panel">
      <p>هل تم تدبيل شيخ الكبة قبل اللعب؟</p>
      <label class="switch"><input type="checkbox" id="kingDoubled" ${draft.doubled ? "checked" : ""}> مدبّل</label>
    </div>
    <div class="doubler-select ${draft.doubled ? "visible" : ""}" id="kingDoublerSelect">
      ${state.players.map((name, index) => `<button class="choice-button ${draft.doubler === index ? "active" : ""}" data-doubler="${index}">${escapeHtml(name)}</button>`).join("")}
    </div>
    <div class="player-targets">
      ${state.players.map((name, index) => `
        <button class="player-target ${draft.eater === index ? "selected" : ""}" data-eater="${index}">
          <span class="player-target-name">${escapeHtml(name)}</span>
          <span class="target-card-area">
            <span class="playing-card red-card ${draft.eater === index ? "assigned" : ""} ${draft.doubled ? "doubled" : ""}" data-rank="K" data-suit="♥">♥</span>
          </span>
        </button>
      `).join("")}
    </div>
    ${saveRoundButton(ready, actionLabel)}
  `;
}

function getRoundCards(type) {
  if (type === "queens") {
    const queens = [
      { id: "Q♠", rank: "Q", suit: "♠" },
      { id: "Q♥", rank: "Q", suit: "♥" },
      { id: "Q♦", rank: "Q", suit: "♦" },
      { id: "Q♣", rank: "Q", suit: "♣" }
    ];
    return queens.map(card => ({ ...card, red: "♥♦".includes(card.suit) }));
  }
  return [];
}

function renderCardAssignmentRound(type) {
  const cards = getRoundCards(type);
  const draft = state.draft;
  const assigned = draft.assignments;
  const pool = cards.filter(card => assigned[card.id] === undefined);
  const allAssigned = Object.keys(assigned).length === cards.length;
  const selectedCard = draft.selectedCard;
  const selectedDoubler = selectedCard ? draft.doublers[selectedCard] : undefined;

  return `
    <p class="stepper-total">اختر ورقة بنت، حدّد إن كانت مدبّلة، ثم اضغط اللاعب الذي أكلها.</p>
    ${selectedCard ? `
      <div class="queen-double-panel">
        <strong>تدبيل ${selectedCard}</strong>
        <div class="queen-double-options">
          <button class="choice-button ${!draft.doubled[selectedCard] ? "active safe" : ""}" data-queen-double="none">غير مدبّلة</button>
          ${state.players.map((name, index) => `<button class="choice-button ${selectedDoubler === index ? "active" : ""}" data-queen-double="${index}">دبّلها ${escapeHtml(name)}</button>`).join("")}
        </div>
      </div>
    ` : ""}
    <div class="card-pool" id="cardPool">
      ${pool.map(card => playingCard(card, type === "queens" && draft.doubled[card.id], false, draft.selectedCard === card.id)).join("") || `<span class="empty-state">تم توزيع جميع الأوراق.</span>`}
    </div>
    <div class="assignment-grid">
      ${state.players.map((name, playerIndex) => `
        <button class="assignment-row" data-assign-player="${playerIndex}">
          <h4>${escapeHtml(name)}</h4>
          <span class="assigned-cards">
            ${cards.filter(card => assigned[card.id] === playerIndex).map(card => playingCard(card, type === "queens" && draft.doubled[card.id], true)).join("")}
          </span>
        </button>
      `).join("")}
    </div>
    <input type="hidden" id="selectedCardId" value="${escapeHtml(draft.selectedCard || "")}">
    ${saveRoundButton(allAssigned)}
  `;
}

function playingCard(card, doubled = false, assigned = false, selected = false) {
  return `<button class="playing-card ${card.red ? "red-card" : ""} ${doubled ? "doubled" : ""} ${assigned ? "assigned" : ""} ${selected ? "selected-card" : ""}" data-card-id="${card.id}" data-rank="${card.rank}" data-suit="${card.suit}">${card.suit}</button>`;
}

function renderCountRound(itemLabel, unitLabel) {
  const total = state.draft.counts.reduce((sum, count) => sum + count, 0);
  return `
    <p class="stepper-total">سجّل عدد ${itemLabel} لكل لاعب.</p>
    <div class="trick-stepper">
      ${state.players.map((name, index) => `
        <div class="stepper-player">
          <strong>${escapeHtml(name)}</strong>
          <div class="stepper-controls">
            <button data-step="${index}" data-delta="-1" aria-label="إنقاص">−</button>
            <span class="stepper-value">${state.draft.counts[index]}</span>
            <button data-step="${index}" data-delta="1" aria-label="زيادة">+</button>
          </div>
        </div>
      `).join("")}
    </div>
    <p class="stepper-total">تم تسجيل ${total} من أصل 13 ${unitLabel}. ${total < 13 ? `المتبقي ${13 - total}.` : "اكتمل العدد."}</p>
    ${saveRoundButton(total === 13)}
  `;
}

function renderTrixRound() {
  const order = state.draft.order;
  return `
    <div class="rank-grid">
      ${state.players.map((name, index) => {
        const rank = order.indexOf(index);
        return `
          <button class="rank-player ${rank >= 0 ? "selected" : ""}" data-rank-player="${index}">
            <span class="rank-number">${rank >= 0 ? rank + 1 : "؟"}</span>
            <span>${escapeHtml(name)}</span>
          </button>
        `;
      }).join("")}
    </div>
    ${saveRoundButton(order.length === 4)}
  `;
}

function saveRoundButton(enabled, label = "تأكيد وحفظ الجولة") {
  return `<div class="workspace-actions"><button class="primary-button" id="prepareRoundButton" ${enabled ? "" : "disabled"}>${label}</button></div>`;
}

function prepareRound() {
  if (state.kingdomOwner === null) {
    showToast("اختر صاحب المملكة أولًا.");
    return;
  }
  const result = calculateRound();
  if (!result) return;
  pendingRound = result;
  document.getElementById("dialogTitle").textContent = `تأكيد جولة ${ROUND_TYPES[state.activeRound].label}`;
  document.getElementById("dialogSummary").innerHTML = state.players.map((name, index) => `
    <div class="dialog-score-row"><span>${escapeHtml(name)}</span><strong>${formatSigned(result.changes[index])}</strong></div>
  `).join("");
  confirmDialog.showModal();
}

function prepareTarneebRound() {
  const draft = structuredClone(state.tarneebDraft);
  if (draft.bidder === null) {
    showToast("اختر الفريق الطالب أولًا.");
    return;
  }
  const changes = TarneebScoring.calculate(draft);
  pendingRound = {
    game: "tarneeb",
    changes,
    detail: draft,
    createdAt: Date.now()
  };
  document.getElementById("dialogTitle").textContent = "تأكيد جولة طرنيب";
  document.getElementById("dialogSummary").innerHTML = [0, 1].map(team => `
    <div class="dialog-score-row">
      <span>${escapeHtml(teamNames(team))}</span>
      <strong>${formatSigned(changes[team])}</strong>
    </div>
  `).join("");
  confirmDialog.showModal();
}

function prepareHandRound() {
  const detail = structuredClone(state.handDraft);
  if (detail.scores.some(score => score === null)) {
    showToast("أدخل نتيجة كل لاعب أو فريق.");
    return;
  }
  const changes = detail.scores.map((score, index) => score * detail.signs[index]);
  pendingRound = { game: "hand", changes, detail, createdAt: Date.now() };
  const names = state.mode === "partnership" ? [teamNames(0), teamNames(1)] : state.players;
  document.getElementById("dialogTitle").textContent = `تأكيد جولة هاند ${state.handHistory.length + 1}`;
  document.getElementById("dialogSummary").innerHTML = names.map((name, index) => `
    <div class="dialog-score-row"><span>${escapeHtml(name)}</span><strong>${formatSigned(changes[index])}</strong></div>
  `).join("");
  confirmDialog.showModal();
}

function prepareComplexRound() {
  const detail = structuredClone(state.complexDraft);
  const changes = state.complexRound === "trix"
    ? ComplexScoring.calculateTrix(detail.order)
    : ComplexScoring.calculateComplex(detail);
  pendingRound = {
    game: "complex",
    type: state.complexRound,
    changes,
    detail,
    kingdomNumber: state.complexKingdom,
    kingdomOwner: state.complexOwner,
    createdAt: Date.now()
  };
  document.getElementById("dialogTitle").textContent =
    `تأكيد جولة ${state.complexRound === "trix" ? "تريكس" : "كومبلكس"}`;
  document.getElementById("dialogSummary").innerHTML = state.players.map((name, index) => `
    <div class="dialog-score-row"><span>${escapeHtml(name)}</span><strong>${formatSigned(changes[index])}</strong></div>
  `).join("");
  confirmDialog.showModal();
}

function calculateRound() {
  const draft = state.draft;
  const changes = TrixScoring.calculate(state.activeRound, draft);
  return {
    type: state.activeRound,
    changes,
    detail: structuredClone(draft),
    kingdomNumber: state.kingdomNumber,
    kingdomOwner: state.kingdomOwner,
    createdAt: Date.now()
  };
}

function commitRound() {
  if (!pendingRound) return;
  if (pendingRound.game === "complex") {
    const committed = pendingRound;
    state.complexScores = state.complexScores.map((score, index) => score + committed.changes[index]);
    state.complexHistory.unshift(committed);
    state.complexCompleted.push(committed.type);
    pendingRound = null;

    if (state.complexCompleted.length === 2 && state.complexKingdom < 4) {
      state.complexKingdom += 1;
      state.complexOwner = (state.complexOwner + 1) % 4;
      state.complexCompleted = [];
      state.complexRound = "complex";
    } else if (state.complexCompleted.length === 2) {
      state.gameFinished = true;
    } else {
      state.complexRound = state.complexCompleted.includes("complex") ? "trix" : "complex";
    }
    resetComplexDraft();
    saveState();
    confirmDialog.close();
    renderGame();
    showToast(state.gameFinished ? "اكتملت مباراة الكومبلكس." : "تم حفظ الجولة.");
    return;
  }
  if (pendingRound.game === "hand") {
    state.handScores = state.handScores.map((score, index) => score + pendingRound.changes[index]);
    state.handHistory.unshift(pendingRound);
    state.gameFinished = shouldFinishHandAutomatically();
    pendingRound = null;
    resetHandDraft();
    saveState();
    confirmDialog.close();
    renderGame();
    showToast(state.gameFinished ? "اكتمل شرط نهاية مباراة هاند." : "تم حفظ جولة هاند.");
    return;
  }
  if (pendingRound.game === "tarneeb") {
    state.tarneebScores = state.tarneebScores.map((score, team) => score + pendingRound.changes[team]);
    state.tarneebHistory.unshift(pendingRound);
    state.gameFinished = Math.max(...state.tarneebScores) >= state.targetScore;
    pendingRound = null;
    resetTarneebDraft();
    saveState();
    confirmDialog.close();
    renderGame();
    showToast(state.gameFinished ? "اكتملت المباراة." : "تم حفظ جولة الطرنيب.");
    return;
  }
  const committedType = pendingRound.type;
  state.scores = state.scores.map((score, index) => score + pendingRound.changes[index]);
  state.history.unshift(pendingRound);
  pendingRound = null;
  const progression = TrixProgression.afterCommit(state, committedType);
  const completedKingdom = progression.completedKingdom;
  state.kingdomNumber = progression.kingdomNumber;
  state.kingdomOwner = progression.kingdomOwner;
  state.completedRounds = progression.completedRounds;
  state.activeRound = progression.activeRound;
  state.gameFinished = progression.gameFinished;
  resetDraft();
  saveState();
  confirmDialog.close();
  renderGame();
  showToast(completedKingdom && !state.gameFinished ? "اكتملت المملكة وانتقل الدور للاعب التالي." : "تم حفظ الجولة وحساب النتائج.");
}

function shouldFinishHandAutomatically() {
  return HandEnd.shouldFinish({
    mode: state.handEndMode,
    roundCount: state.handHistory.length,
    scores: state.handScores
  });
}

function undoLastRound() {
  if (state.game === "complex") {
    const last = state.complexHistory.shift();
    if (!last) return;
    state.complexScores = state.complexScores.map((score, index) => score - last.changes[index]);
    state.complexKingdom = last.kingdomNumber;
    state.complexOwner = last.kingdomOwner;
    state.gameFinished = false;
    state.complexCompleted = state.complexHistory
      .filter(item => item.kingdomNumber === state.complexKingdom)
      .map(item => item.type);
    state.complexRound = last.type;
    state.complexDraft = structuredClone(last.detail);
    saveState();
    renderGame();
    showToast("تم التراجع عن آخر جولة.");
    return;
  }
  if (state.game === "hand") {
    const last = state.handHistory.shift();
    if (!last) return;
    state.handScores = state.handScores.map((score, index) => score - last.changes[index]);
    state.gameFinished = false;
    state.handDraft = structuredClone(last.detail);
    saveState();
    renderGame();
    showToast("تم التراجع عن آخر جولة.");
    return;
  }
  if (state.game === "tarneeb") {
    const last = state.tarneebHistory.shift();
    if (!last) return;
    state.tarneebScores = state.tarneebScores.map((score, team) => score - last.changes[team]);
    state.gameFinished = false;
    state.tarneebDraft = structuredClone(last.detail);
    saveState();
    renderGame();
    showToast("تم التراجع عن آخر جولة.");
    return;
  }
  const last = state.history.shift();
  if (!last) return;
  state.scores = state.scores.map((score, index) => score - last.changes[index]);
  const progression = TrixProgression.afterUndo(state.history, last);
  state.kingdomNumber = progression.kingdomNumber;
  state.kingdomOwner = progression.kingdomOwner;
  state.gameFinished = progression.gameFinished;
  state.completedRounds = progression.completedRounds;
  state.activeRound = progression.activeRound;
  resetDraft();
  saveState();
  renderGame();
  showToast("تم التراجع عن آخر جولة.");
}

function renderHandHistory() {
  undoButton.disabled = state.handHistory.length === 0;
  if (!state.handHistory.length) {
    historyList.innerHTML = `<p class="empty-state">لم تُسجّل أي جولة هاند بعد.</p>`;
    return;
  }
  const names = state.mode === "partnership" ? [teamNames(0), teamNames(1)] : state.players;
  const lowest = Math.min(...state.handScores);
  historyList.innerHTML = `
    <section class="history-totals">
      <div class="history-totals-head">
        <strong>النتيجة الحالية</strong>
        <span>الأقل نقاطًا يتصدر</span>
      </div>
      <div class="history-total-grid ${state.mode === "partnership" ? "tarneeb-total-grid" : ""}">
        ${names.map((name, index) => `
          <div class="history-total-player ${state.handScores[index] === lowest ? "leader" : ""}">
            <span>${escapeHtml(name)}</span>
            <strong>${formatScore(state.handScores[index])}</strong>
            ${state.handScores[index] === lowest ? `<small>المتصدر</small>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
    <section class="history-kingdom">
      <header class="history-kingdom-head">
        <span class="history-kingdom-number">هاند</span>
        <strong>${state.handHistory.length} ${state.handHistory.length === 1 ? "جولة" : "جولات"}</strong>
      </header>
      <div class="history-kingdom-rounds">
        ${[...state.handHistory].reverse().map((item, roundIndex) => `
          <div class="history-item">
            <div class="history-round-name">
              <span>${roundIndex + 1}</span>
              <div>
                <strong>نتيجة الجولة</strong>
                ${item.detail.handMaker === null || item.detail.handMaker === undefined
                  ? `<small>دون هاند</small>`
                  : `<small class="hand-badge">هاند: ${escapeHtml(state.players[item.detail.handMaker])}</small>`}
              </div>
            </div>
            <div class="history-scores ${state.mode === "partnership" ? "tarneeb-history-scores" : ""}">
              ${names.map((name, index) => `
                <span><b>${escapeHtml(name)}</b>${formatSigned(item.changes[index])}</span>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderComplexHistory() {
  undoButton.disabled = state.complexHistory.length === 0;
  if (!state.complexHistory.length) {
    historyList.innerHTML = `<p class="empty-state">لم تُسجّل أي جولة كومبلكس بعد.</p>`;
    return;
  }

  const highest = Math.max(...state.complexScores);
  const kingdoms = [...new Set(state.complexHistory.map(item => item.kingdomNumber))].sort((a, b) => b - a);
  historyList.innerHTML = `
    <section class="history-totals">
      <div class="history-totals-head">
        <strong>النتيجة الحالية</strong>
        <span>الأعلى نقاطًا يتصدر</span>
      </div>
      <div class="history-total-grid">
        ${state.players.map((name, index) => `
          <div class="history-total-player ${state.complexScores[index] === highest ? "leader" : ""}">
            <span>${escapeHtml(name)}</span>
            <strong>${formatScore(state.complexScores[index])}</strong>
            ${state.complexScores[index] === highest ? `<small>المتصدر</small>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
    ${kingdoms.map(kingdom => {
      const rounds = state.complexHistory.filter(item => item.kingdomNumber === kingdom);
      return `
        <section class="history-kingdom">
          <header class="history-kingdom-head">
            <span class="history-kingdom-number">المملكة ${kingdom}</span>
            <strong>صاحب المملكة: ${escapeHtml(state.players[rounds[0].kingdomOwner])}</strong>
          </header>
          <div class="history-kingdom-rounds">
            ${[...rounds].reverse().map((item, index) => `
              <div class="history-item">
                <div class="history-round-name">
                  <span>${index + 1}</span>
                  <strong>${item.type === "complex" ? "كومبلكس" : "تريكس"}</strong>
                </div>
                <div class="history-scores">
                  ${state.players.map((name, playerIndex) => `
                    <span><b>${escapeHtml(name)}</b>${formatSigned(item.changes[playerIndex])}</span>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }).join("")}
  `;
}

function renderTarneebHistory() {
  undoButton.disabled = state.tarneebHistory.length === 0;
  if (!state.tarneebHistory.length) {
    historyList.innerHTML = `<p class="empty-state">لم تُسجّل أي جولة طرنيب بعد.</p>`;
    return;
  }

  const leader = Math.max(...state.tarneebScores);
  historyList.innerHTML = `
    <section class="history-totals">
      <div class="history-totals-head">
        <strong>النتيجة الحالية</strong>
        <span>الهدف ${state.targetScore} نقطة</span>
      </div>
      <div class="history-total-grid tarneeb-total-grid">
        ${[0, 1].map(team => `
          <div class="history-total-player ${state.tarneebScores[team] === leader ? "leader" : ""}">
            <span>${escapeHtml(teamNames(team))}</span>
            <strong>${formatScore(state.tarneebScores[team])}</strong>
            ${state.tarneebScores[team] === leader ? `<small>المتصدر</small>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
    <section class="history-kingdom">
      <header class="history-kingdom-head">
        <span class="history-kingdom-number">طرنيب</span>
        <strong>${state.tarneebHistory.length} ${state.tarneebHistory.length === 1 ? "جولة" : "جولات"}</strong>
      </header>
      <div class="history-kingdom-rounds">
        ${[...state.tarneebHistory].reverse().map((item, index) => {
          const bidder = item.detail.bidder;
          return `
            <div class="history-item tarneeb-history-item">
              <div class="history-round-name">
                <span>${index + 1}</span>
                <strong>طلب ${item.detail.bid === 13 ? "كبّوت" : item.detail.bid} · ${tarneebSuitName(item.detail.suit)}</strong>
              </div>
              <div class="history-scores tarneeb-history-scores">
                <span>
                  <b>${escapeHtml(teamNames(bidder))}</b>
                  ${item.detail.bidderTricks} لمّات · ${formatSigned(item.changes[bidder])}
                </span>
                <span>
                  <b>${escapeHtml(teamNames(bidder === 0 ? 1 : 0))}</b>
                  ${13 - item.detail.bidderTricks} لمّات · ${formatSigned(item.changes[bidder === 0 ? 1 : 0])}
                </span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderHistory() {
  roundCounter.textContent = `${state.history.length} ${state.history.length === 1 ? "جولة" : "جولات"}`;
  undoButton.disabled = state.history.length === 0;
  if (!state.history.length) {
    historyList.innerHTML = `<p class="empty-state">لم تُسجّل أي جولة بعد.</p>`;
    return;
  }

  const highestScore = Math.max(...state.scores);
  const totals = `
    <section class="history-totals">
      <div class="history-totals-head">
        <strong>النتيجة الحالية</strong>
        <span>بعد ${state.history.length} ${state.history.length === 1 ? "جولة" : "جولات"}</span>
      </div>
      <div class="history-total-grid">
        ${state.players.map((name, index) => `
          <div class="history-total-player ${state.scores[index] === highestScore ? "leader" : ""}">
            <span>${escapeHtml(name)}</span>
            <strong>${formatScore(state.scores[index])}</strong>
            ${state.scores[index] === highestScore ? `<small>المتصدر</small>` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `;

  const kingdoms = [...new Set(state.history.map(item => item.kingdomNumber))].sort((a, b) => b - a);
  historyList.innerHTML = totals + kingdoms.map(kingdomNumber => {
    const rounds = state.history.filter(item => item.kingdomNumber === kingdomNumber);
    const ownerIndex = rounds[0].kingdomOwner;
    const orderedRounds = [...rounds].reverse();
    return `
      <section class="history-kingdom">
        <header class="history-kingdom-head">
          <span class="history-kingdom-number">المملكة ${kingdomNumber}</span>
          <strong>صاحب المملكة: ${escapeHtml(state.players[ownerIndex])}</strong>
        </header>
        <div class="history-kingdom-rounds">
          ${orderedRounds.map((item, index) => `
            <div class="history-item">
              <div class="history-round-name">
                <span>${index + 1}</span>
                <strong>${ROUND_TYPES[item.type].label}</strong>
              </div>
              <div class="history-scores">
                ${state.players.map((name, playerIndex) => `
                  <span><b>${escapeHtml(name)}</b> ${formatSigned(item.changes[playerIndex])}</span>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function selectRound(type) {
  if (state.completedRounds.includes(type) || state.gameFinished) return;
  state.activeRound = type;
  resetDraft();
  renderRoundTabs();
  renderWorkspace();
}

function handleWorkspaceClick(event) {
  if (state.game === "complex") {
    handleComplexWorkspaceClick(event);
    return;
  }
  if (state.game === "hand") {
    handleHandWorkspaceClick(event);
    return;
  }
  if (state.game === "tarneeb") {
    handleTarneebWorkspaceClick(event);
    return;
  }
  const eater = event.target.closest("[data-eater]");
  if (eater) {
    state.draft.eater = Number(eater.dataset.eater);
    return renderWorkspace();
  }

  const doubler = event.target.closest("[data-doubler]");
  if (doubler) {
    state.draft.doubler = Number(doubler.dataset.doubler);
    return renderWorkspace();
  }

  const card = event.target.closest("[data-card-id]");
  if (card) {
    const cardId = card.dataset.cardId;
    if (state.draft.assignments[cardId] !== undefined) {
      delete state.draft.assignments[cardId];
      delete state.draft.doubled?.[cardId];
      delete state.draft.doublers?.[cardId];
    } else if (state.activeRound === "queens" && state.draft.selectedCard === cardId) {
      state.draft.selectedCard = null;
    } else {
      state.draft.selectedCard = cardId;
    }
    return renderWorkspace();
  }

  const queenDouble = event.target.closest("[data-queen-double]");
  if (queenDouble && state.draft.selectedCard) {
    const cardId = state.draft.selectedCard;
    if (queenDouble.dataset.queenDouble === "none") {
      delete state.draft.doubled[cardId];
      delete state.draft.doublers[cardId];
    } else {
      state.draft.doubled[cardId] = true;
      state.draft.doublers[cardId] = Number(queenDouble.dataset.queenDouble);
    }
    return renderWorkspace();
  }

  const assignPlayer = event.target.closest("[data-assign-player]");
  if (assignPlayer && state.draft.selectedCard) {
    state.draft.assignments[state.draft.selectedCard] = Number(assignPlayer.dataset.assignPlayer);
    state.draft.selectedCard = null;
    return renderWorkspace();
  }

  const step = event.target.closest("[data-step]");
  if (step) {
    const index = Number(step.dataset.step);
    const delta = Number(step.dataset.delta);
    const next = state.draft.counts[index] + delta;
    const total = state.draft.counts.reduce((sum, count) => sum + count, 0);
    if (next >= 0 && next <= 13 && total + delta <= 13) state.draft.counts[index] = next;
    return renderWorkspace();
  }

  const rankPlayer = event.target.closest("[data-rank-player]");
  if (rankPlayer) {
    const player = Number(rankPlayer.dataset.rankPlayer);
    const existing = state.draft.order.indexOf(player);
    if (existing >= 0) state.draft.order.splice(existing, 1);
    else if (state.draft.order.length < 4) state.draft.order.push(player);
    return renderWorkspace();
  }

  if (event.target.closest("#prepareRoundButton")) prepareRound();
}

function handleComplexWorkspaceClick(event) {
  const kingEater = event.target.closest("[data-complex-king-eater]");
  if (kingEater) {
    state.complexDraft.king.eater = Number(kingEater.dataset.complexKingEater);
    renderComplexWorkspace();
    return;
  }

  const kingDoubler = event.target.closest("[data-complex-king-doubler]");
  if (kingDoubler) {
    state.complexDraft.king.doubler = Number(kingDoubler.dataset.complexKingDoubler);
    renderComplexWorkspace();
    return;
  }

  const queenEater = event.target.closest("[data-complex-queen-eater]");
  if (queenEater) {
    state.complexDraft.queens[queenEater.dataset.complexQueenEater].eater = Number(queenEater.dataset.player);
    renderComplexWorkspace();
    return;
  }

  const queenDouble = event.target.closest("[data-complex-queen-double]");
  if (queenDouble) {
    const queen = state.complexDraft.queens[queenDouble.dataset.complexQueenDouble];
    if (queenDouble.dataset.player === "none") {
      queen.doubled = false;
      queen.doubler = null;
    } else {
      queen.doubled = true;
      queen.doubler = Number(queenDouble.dataset.player);
    }
    renderComplexWorkspace();
    return;
  }

  const counter = event.target.closest("[data-complex-count]");
  if (counter) {
    const field = counter.dataset.complexCount;
    const player = Number(counter.dataset.player);
    const delta = Number(counter.dataset.delta);
    const values = state.complexDraft[field];
    const total = values.reduce((sum, value) => sum + value, 0);
    const next = values[player] + delta;
    if (next >= 0 && next <= 13 && total + delta <= 13) values[player] = next;
    renderComplexWorkspace();
    return;
  }

  const rank = event.target.closest("[data-complex-rank]");
  if (rank) {
    const player = Number(rank.dataset.complexRank);
    const order = state.complexDraft.order;
    const existing = order.indexOf(player);
    if (existing >= 0) order.splice(existing, 1);
    else if (order.length < 4) order.push(player);
    renderComplexWorkspace();
    return;
  }

  if (event.target.closest("#prepareComplexButton")) prepareComplexRound();
}

function handleHandWorkspaceClick(event) {
  if (event.target.closest("#finishHandButton")) {
    if (!state.handHistory.length) return;
    if (!confirm("هل تريد إنهاء مباراة هاند الآن واحتساب النتيجة النهائية؟")) return;
    state.gameFinished = true;
    saveState();
    renderGame();
    showToast("تم إنهاء المباراة واحتساب النتيجة.");
    return;
  }

  const handMaker = event.target.closest("[data-hand-maker]");
  if (handMaker) {
    state.handDraft.handMaker = handMaker.dataset.handMaker === "none"
      ? null
      : Number(handMaker.dataset.handMaker);
    renderHandWorkspace();
    return;
  }

  const sign = event.target.closest("[data-hand-sign]");
  if (sign) {
    const index = Number(sign.dataset.handSign);
    state.handDraft.signs[index] = Number(sign.dataset.sign);
    renderHandWorkspace();
    return;
  }

  if (event.target.closest("#prepareHandButton")) prepareHandRound();
}

function handleTarneebWorkspaceClick(event) {
  const bidder = event.target.closest("[data-tarneeb-bidder]");
  if (bidder) {
    state.tarneebDraft.bidder = Number(bidder.dataset.tarneebBidder);
    renderTarneebWorkspace();
    return;
  }

  const bid = event.target.closest("[data-tarneeb-bid]");
  if (bid) {
    state.tarneebDraft.bid = Number(bid.dataset.tarneebBid);
    renderTarneebWorkspace();
    return;
  }

  const trickButton = event.target.closest("[data-tarneeb-tricks]");
  if (trickButton) {
    const next = state.tarneebDraft.bidderTricks + Number(trickButton.dataset.tarneebTricks);
    if (next >= 0 && next <= 13) state.tarneebDraft.bidderTricks = next;
    renderTarneebWorkspace();
    return;
  }

  if (event.target.closest("#prepareTarneebButton")) prepareTarneebRound();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatScore(value) {
  return new Intl.NumberFormat("ar").format(value);
}

function formatSigned(value) {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : ""}${value}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

document.querySelectorAll(".game-choice").forEach(button => {
  button.addEventListener("click", () => {
    state.game = button.dataset.game;
    if (state.game === "tarneeb") state.mode = "partnership";
    renderSetup();
  });
});

document.querySelectorAll(".mode-choice").forEach(button => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    renderSetup();
  });
});

document.querySelectorAll(".target-choice").forEach(button => {
  button.addEventListener("click", () => {
    state.targetScore = Number(button.dataset.target);
    renderSetup();
  });
});

document.querySelectorAll(".hand-end-choice").forEach(button => {
  button.addEventListener("click", () => {
    state.handEndMode = button.dataset.handEnd;
    renderSetup();
  });
});

quickGuideToggle.addEventListener("click", () => {
  const collapsed = quickGuide.classList.toggle("collapsed");
  quickGuideToggle.setAttribute("aria-expanded", String(!collapsed));
  quickGuideToggle.lastElementChild.textContent = collapsed ? "⌄" : "⌃";
});

document.getElementById("startGameButton").addEventListener("click", startGame);
document.getElementById("newGameButton").addEventListener("click", () => {
  if ((state.history.length || state.tarneebHistory.length || state.handHistory.length || state.complexHistory.length) && !confirm("بدء مباراة جديدة سيحذف المباراة الحالية. هل أنت متأكد؟")) return;
  state = structuredClone(defaultState);
  localStorage.removeItem(STORAGE_KEY);
  showSetup();
});
roundTabs.addEventListener("click", event => {
  const complexRound = event.target.closest("[data-complex-round]");
  if (complexRound && state.game === "complex") {
    const type = complexRound.dataset.complexRound;
    if (state.complexCompleted.includes(type) || state.complexOwner === null) return;
    state.complexRound = type;
    resetComplexDraft();
    renderComplexGame();
    return;
  }
  const suit = event.target.closest("[data-tarneeb-suit]");
  if (suit && state.game === "tarneeb") {
    state.tarneebDraft.suit = suit.dataset.tarneebSuit;
    renderTarneebGame();
    return;
  }
  const tab = event.target.closest("[data-round]");
  if (tab) selectRound(tab.dataset.round);
});
kingdomStatus.addEventListener("click", event => {
  const complexOwner = event.target.closest("#complexOwnerButton");
  if (complexOwner && state.game === "complex") {
    if (state.complexCompleted.length) return;
    state.complexOwner = state.complexOwner === null ? 0 : (state.complexOwner + 1) % 4;
    saveState();
    renderComplexGame();
    return;
  }
  const button = event.target.closest("#kingdomOwnerButton");
  if (!button || state.completedRounds.length) return;
  state.kingdomOwner = state.kingdomOwner === null ? 0 : (state.kingdomOwner + 1) % 4;
  saveState();
  renderRoundTabs();
  renderWorkspace();
});
roundWorkspace.addEventListener("click", handleWorkspaceClick);
roundWorkspace.addEventListener("change", event => {
  if (event.target.id === "complexKingDouble") {
    state.complexDraft.king.doubled = event.target.checked;
    if (!event.target.checked) state.complexDraft.king.doubler = null;
    renderComplexWorkspace();
    return;
  }
  if (event.target.id === "kingDoubled") {
    state.draft.doubled = event.target.checked;
    if (!state.draft.doubled) state.draft.doubler = null;
    renderWorkspace();
  }
});
roundWorkspace.addEventListener("input", event => {
  const scoreInput = event.target.closest("[data-hand-score]");
  if (!scoreInput || state.game !== "hand") return;
  const index = Number(scoreInput.dataset.handScore);
  const value = scoreInput.value === "" ? null : Math.max(0, Math.trunc(Number(scoreInput.value)));
  state.handDraft.scores[index] = Number.isFinite(value) ? value : null;
  const summary = scoreInput.closest(".hand-score-entry")?.querySelector("small");
  if (summary) {
    summary.className = state.handDraft.signs[index] === -1 ? "negative" : "positive";
    summary.textContent = `النتيجة: ${value === null ? "لم تُدخل" : formatSigned(state.handDraft.signs[index] * value)}`;
  }
  const saveButton = document.getElementById("prepareHandButton");
  if (saveButton) saveButton.disabled = state.handDraft.scores.some(score => score === null);
});
undoButton.addEventListener("click", undoLastRound);
document.getElementById("cancelDialogButton").addEventListener("click", () => {
  pendingRound = null;
  confirmDialog.close();
});
document.getElementById("confirmDialogButton").addEventListener("click", commitRound);

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function updateInstallButton() {
  installAppButton.classList.toggle("hidden", isStandaloneApp());
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installAppButton.classList.add("hidden");
  showToast("تم تثبيت التطبيق بنجاح.");
});

installAppButton.addEventListener("click", async () => {
  if (isStandaloneApp()) {
    showToast("التطبيق مثبت على جهازك.");
    return;
  }

  if (isIosDevice()) {
    iosInstallDialog.showModal();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  showToast("اختر «تثبيت التطبيق» من قائمة المتصفح.");
});

document.getElementById("closeIosInstallDialog").addEventListener("click", () => {
  iosInstallDialog.close();
});

renderSetup();
if (state.history.length || state.tarneebHistory.length || state.handHistory.length || state.complexHistory.length) showGame();
updateInstallButton();
