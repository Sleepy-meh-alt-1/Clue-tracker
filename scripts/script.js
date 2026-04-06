A1lib.identifyApp("appconfig.json");
// -------------------------
// Variables
// -------------------------
console.log(Object.keys(A1lib));

// Alt1 stuff
let reader = new Chatbox.default();
const appColor = A1lib.mixColor(255, 199, 0);
const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;
let chatInterval = null;

// Timer
let isRunning = false;
let startTime = 0;
let pausedTime = 0;
let timerInterval = null;
let displayInterval = null;

let sessionStartTime = null;
let sessionEndTime = null;
let sessionElapsedMs = 0;

// Counters
let clues = []
let bikProcCount = 0;
let bikProcRoll = 0;

// Bik page purchases
const BIK_PURCHASES_KEY = "bikPagePurchases";
const BIK_PAGE_MINUTES = 45;
let bikPurchases = []; // { pages, totalPrice, timestamp }

const pingAudio = new Audio("noise/ping.mp3");
pingAudio.volume = 0.5;

let saveSnapshot = null;
const SAVE_KEY = "cluetracker";

let bikMatrixMode = "percent"; // "percent" | "count" | "cluesPerHour"



// -------------------------
// UI Buttons
// -------------------------
document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("stopBtn").addEventListener("click", stopTimer);
document.getElementById("resetBtn").addEventListener("click", resetTimer);


loadSessionIntoTracker();
updateGui();
loadBikPurchases();


function drawBuffBarOverlay() {
  if (!buffReader || !buffReader.pos) return;

  const rect = buffReader.getCaptRect();
  if (!rect) return;

  const color = A1lib.mixColor(0, 255, 0);

  alt1.overLayRect(
    color,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    2000,
    2
  );
}


// -------------------------
// Buff tracking
// -------------------------
const BIK = {
  width: 27,
  height: 15,
  data: "GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFxwy/xccMv8XHzb/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFxwy/xccMv8XHDL/Fxwy/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUXUL/FUc9/xccMv8XHDL/Fxwy/xccMP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNeQv8QoFP/EJdR/xVCPP8XHDL/Fxwx/xccMP8XHDD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhsw/xNeQv8QoFP/EY9P/xNeQv8SgEv/Fxww/xccMP8XHDD/Fxwy/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQHC3/Fxwy/xNeQv8QoFP/EYpN/xNeQv8QoFP/EJlR/xRaQP8XHDT/Fxwy/xccM/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMcMf8WHDL/Fxwy/xNeQv8OlU3/FjI4/xCgU/8Om1H/EnxK/xccM/8XHDL/Fhsw/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAFhwy/xUcMf8XHDL/Fxwy/xNeQv8JQCv/FFVA/xGLTv8JXjv/Fxwy/xceNP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/"
};

const SPIRIT = {
  width: 27,
  height: 14,
  data: "GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/xmWWv8Zllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABKorX/Q5Kk/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIna//Qo6f/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACtoaD/npWU/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACtoaD/nJOR/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACrcqz/mGWa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACnJ7//lSOr/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACnJ7//lCOq/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmJ77/kyOp/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKgnwP+lJ7z/kyOp/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqCfA/6gnwP+jJrv/kyCo/4UemP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/GZZa/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApyfA/6cnwP+iJLr/kyCo/4cem/9vHID/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZllr/"
};

const TRACKED_BUFFS = [
  { name: "BIK", img: BIK },
  { name: "SPIRIT", img: SPIRIT }
];

let spiritMissingLastTick = false;

function updateTooltip(hasSpirit, hasBik) {
  if (!hasSpirit) {
    alt1.setTooltip("SPIRIT inactive!");
  } else if (!hasBik) {
    alt1.setTooltip("BIK inactive!");
  } else {
    alt1.clearTooltip();
  }
}

function buffscanner() {
  const rsBind = alt1.bindRegion(0, 0, alt1.rsWidth, alt1.rsHeight);

  let matches = [];

  for (let buff of TRACKED_BUFFS) {
    const result = JSON.parse(
      alt1.bindFindSubImg(
        rsBind,
        buff.img.data,
        buff.img.width,
        0, 0,
        alt1.rsWidth,
        alt1.rsHeight
      )
    );

    for (let m of result) {
      matches.push({ ...m, type: buff.name });
    }
  }

  const hasSpirit = matches.some(m => m.type === "SPIRIT");
  const hasBik = matches.some(m => m.type === "BIK");

  if (setting_spirit && !hasSpirit) {
    playPingSound();
  }

  if (setting_autoStart && !hasBik) {
    playPingSound();
  }

  updateTooltip(hasSpirit, hasBik);

  if (setting_autoStart) {
    hasBik ? startTimer() : stopTimer();
  }

  setTimeout(buffscanner, 600);
}

buffscanner();



// -------------------------
// Helpers functions
// -------------------------
function playPingSound() {
  pingAudio.currentTime = 0;
  pingAudio.play().catch(err => console.log("Audio blocked:", err));
}

function saveDrops() {
  localStorage.setItem("clueDrops", JSON.stringify(clues));
  saveSessionTiming()
}

function saveSessionTiming() {
  const info = {
    totalSessionMs: getSessionElapsedMs(),
    savedAt: Date.now()
  };
  localStorage.setItem("clueSessionTiming", JSON.stringify(info));
}


function msUntilNextTick(elapsed) {
    const tick = 600;
    const remainder = elapsed % tick;
    return remainder === 0 ? 0 : (tick - remainder);
}
function recordDrop(source, tier, quantity) {
  const drop = {
    timestamp: Date.now(),
    sessionTime: getSessionElapsedMs(),
    source: source,
    tier: tier,
    quantity: quantity
  };

  clues.push(drop);
  saveDrops();
}

function getSourceTierQuantityCounts() {
  const counts = {};

  clues.forEach(function (d) {
    const key = d.source + "|" + d.tier + "|" + d.quantity;
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

function parseTierFromLine(line) {
    const match = line.match(/\((easy|medium|hard|elite|master)\)/i);
    return match ? match[1].toLowerCase() : null;
}

function parseQuantityFromLine(line) {
    const match = line.match(/(\d+)\s*x/i);
    return match ? parseInt(match[1], 10) : 1;
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function getSessionElapsedMs() {
  if (isRunning) {
    return performance.now() - startTime;
  } else {
    return pausedTime;
  }
}


// -------------------------
// Alt1 chatbox setup
// -------------------------
window.setTimeout(() => {
    reader.readargs = {
        colors: [
            A1lib.mixColor(255, 255, 255),
            A1lib.mixColor(0, 255, 0),
            A1lib.mixColor(30, 255, 0),
            A1lib.mixColor(30, 255, 0)
        ],
        backwards: true,
    };

    $(".nis").append("<span>Searching for chatboxes</span>");
    $(".nis").append("<div>If this is showing long, chatbox reading might not work.</div>");
    reader.find();

    const findChat = setInterval(() => {
        if (reader.pos === null) reader.find();
        else {
            $(".nis span:contains('Searching for chatboxes')").remove();
            $(".nis div:contains('chatbox reading might not work')").remove();
            clearInterval(findChat);
            reader.pos.mainbox = reader.pos.boxes[0];
            showSelectedChat(reader.pos);

            chatInterval = setInterval(() => {
                readChatbox();
            }, 200);
        }
    }, 1000);
}, 0);

function showSelectedChat(chat) {
    try {
        alt1.overLayRect(
            appColor,
            chat.mainbox.rect.x,
            chat.mainbox.rect.y,
            chat.mainbox.rect.width,
            chat.mainbox.rect.height,
            2000,
            5
        );
    } catch {}
}

// -------------------------
// Chatbox parsing
// -------------------------
function readChatbox() {
    const opts = reader.read() || [];
    let chatStr = "";
    let chatArr;

    if (opts.length) {
        for (let line in opts) {
            if (!opts[line].text.match(timestampRegex) && line == "0") continue;
            if (opts[line].text.match(timestampRegex)) {
                if (line > 0) chatStr += "\n";
                chatStr += opts[line].text + " ";
                continue;
            }
            chatStr += opts[line].text;
        }
    }

    if (chatStr.trim()) chatArr = chatStr.trim().split("\n");

    if (chatArr) {
        for (let line of chatArr) {
            const chatLine = line.trim();
            if (chatLine && !isInHistory(chatLine)) {
                checkLine(chatLine);
            }
        }
        updateChatHistory(chatArr);
    }
}

function isInHistory(chatLine) {
    if (!sessionStorage.chatHistory) return false;
    return sessionStorage.chatHistory.split("\n").includes(chatLine);
}

function updateChatHistory(chatArr) {
    if (!sessionStorage.chatHistory) {
        sessionStorage.chatHistory = chatArr.join("\n");
        return;
    }
    let history = sessionStorage.chatHistory.split("\n");
    while (history.length > 100) history.shift();
    chatArr.forEach(line => history.push(line.trim()));
    sessionStorage.chatHistory = history.join("\n");
}


function getBikAnalyticsForUI() {
  const tiers = ["easy", "medium", "hard", "elite", "master"];
  const quantities = [1, 2, 3];

  const counts = {};
  let totalProcs = 0;

  tiers.forEach(t => {
    counts[t] = {1: 0, 2: 0, 3: 0};
  });

  clues.forEach(d => {
    if (d.source === "bik_book") {
      const tier = d.tier;
      const qty = d.quantity;
      if (counts[tier] && counts[tier][qty] !== undefined) {
        counts[tier][qty]++;
        totalProcs++;
      }
    }
  });

  bikProcRoll  = Math.floor(getSessionElapsedMs()/1000/60)
  
  return { counts, totalProcs };
}


function getAnalyticsSessionHours() {
  const ms = getSessionElapsedMs(); 
  return ms > 0 ? ms / 3600000 : 0;
}

// -------------------------
// Timer logic
// -------------------------
function startTimer() {
    if (isRunning) return;
    isRunning = true;

    startTime = performance.now() - pausedTime;

    timerInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        updateTimerDisplay(elapsed);
        updateGui();
    }, 50);

    startDisplayLoop();
}

function startDisplayLoop() {
    function tick() {
        if (!isRunning) return;
        const elapsed = performance.now() - startTime;
        const nextDelay = msUntilNextTick(elapsed);

        displayInterval = setTimeout(tick, nextDelay);
    }

    const elapsed = performance.now() - startTime;
    const firstDelay = msUntilNextTick(elapsed);

    displayInterval = setTimeout(tick, firstDelay);
}


function stopTimer() {
    if (!isRunning) return;

    isRunning = false;

    clearInterval(timerInterval);
    timerInterval = null;

    let rawElapsed = performance.now() - startTime;
    let wait = msUntilNextTick(rawElapsed);
    pausedTime = rawElapsed;

    updateTimerDisplay(pausedTime);
    updateGui();
    saveDrops();

    if (displayInterval) {
        clearTimeout(displayInterval);
        displayInterval = null;
    }
}

function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);

    isRunning = false;
    startTime = 0;
    pausedTime = 0;

    clues = []
    updateTimerDisplay(0);
    updateGui();
    saveDrops();
    if (displayInterval) {
        clearInterval(displayInterval);
        displayInterval = null;
    }
}

// -------------------------
// Chat line interpretation
// -------------------------
function checkLine(line) {
    if (!isRunning) return;

    line = line.toLowerCase();

    if (line.includes("your prosper perk allows you to find a new treasure trail")) {
        const tier = parseTierFromLine(line);
        if (tier) {
            recordDrop("prosper", tier, 1);
        }
    }

    if (line.includes("a catalyst of alteration appears")) {
        bikProcCount++;
    }

    if (line.includes("the catalyst of alteration contained")) {
        const tier = parseTierFromLine(line);
        const qty = parseQuantityFromLine(line);

        if (tier && qty) {
            recordDrop("bik_book", tier, qty);
        }
    }
    updateGui()
}


// -------------------------
// GUI update
// -------------------------

function updateGui() {
  var totals =     { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var bikTotals =  { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var prosperTot = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var lootTotals = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };

  clues.forEach(function (d) {
    var tier = d.tier;
    var qty  = d.quantity || 1;

    if (!totals.hasOwnProperty(tier)) return;

    totals[tier] += qty;

    if (d.source === "bik_book") {
      bikTotals[tier] += qty;
    } else if (d.source === "prosper") {
      prosperTot[tier] += qty;
    } else if (d.source === "loot_beam") {
      lootTotals[tier] += qty;
    }
  });

  var tiers = ["easy", "medium", "hard", "elite", "master"];

  tiers.forEach(function (tier) {
    var suffix = tier.charAt(0).toUpperCase() + tier.slice(1);

    setText("total"   + suffix, totals[tier]);
    setText("bik"     + suffix, bikTotals[tier]);
    setText("prosper" + suffix, prosperTot[tier]);
    setText("loot"    + suffix, lootTotals[tier]);
  });

  renderBikMatrix()
}

function renderBikMatrix() {
  const tbl = document.getElementById("bikMatrix");
  if (!tbl) return;

  const thead = tbl.querySelector("thead");
  const tbody = tbl.querySelector("tbody");
  tbody.innerHTML = "";

  const { counts, totalProcs } = getBikAnalyticsForUI();
  const tiers = ["easy", "medium", "hard", "elite", "master"];
  const quantities = [1, 2, 3];

  const hours = getAnalyticsSessionHours();
  const costInfo = getBikTierCostPerClue();

  if (bikMatrixMode === "cluesPerHour") {
    // Tier | Clues/h | gp/clue
    thead.innerHTML = `
      <tr style="border-bottom:2px solid #b18b29;">
        <th>Tier</th>
        <th>Clues/h</th>
        <th>gp/clue</th>
      </tr>`;
  } else {
    thead.innerHTML = `
      <tr style="border-bottom:2px solid #b18b29;">
        <th>Tier</th>
        <th>1x</th>
        <th>2x</th>
        <th>3x</th>
      </tr>`;
  }

  let totalCluesFromBik = 0;

  tiers.forEach(tier => {
    const iconPath = `images/${tier}_clue_scroll.png`;

    let tierTotalClues = 0;
    quantities.forEach(q => tierTotalClues += counts[tier][q] * q);
    totalCluesFromBik += tierTotalClues;

    if (bikMatrixMode === "cluesPerHour") {
      const rate = hours > 0 ? (tierTotalClues / hours) : "0.00";

      let costStr = "-";
      if (costInfo.hasData && costInfo.tierCostPerClue && costInfo.tierCostPerClue[tier] > 0) {
        const gp = Math.round(costInfo.avgPageCost/3*4/rate);
        costStr = gp.toLocaleString() + " gp";
      }

      tbody.innerHTML += `
        <tr>
          <td><img class="npcIcon" src="${iconPath}" width="24"></td>
          <td>${rate.toFixed(2)}</td>
          <td>${costStr}</td>
        </tr>`;

    } else {
      let row = `<tr><td><img class="npcIcon" src="${iconPath}" width="24"></td>`;
      quantities.forEach(q => {
        const count = counts[tier][q];
        let cell = "";

        if (bikMatrixMode === "percent") {
          const pct = totalProcs > 0 ? (count / totalProcs * 100) : 0;
          cell = pct.toFixed(2) + "%";
        } else if (bikMatrixMode === "count") {
          cell = count;
        }

        row += `<td>${cell}</td>`;
      });
      row += `</tr>`;
      tbody.innerHTML += row;
    }
  });

  let footerText = "";

  const percent = bikProcRoll > 0
    ? ((totalProcs / bikProcRoll) * 100).toFixed(2)
    : "0.00";

  footerText = `Total Bik procs: ${totalProcs} / ${bikProcRoll} (${percent}%)`;

  // Dry streak info (current + worst)
  const dryInfo = getBikDryStreakInfo();
  if (dryInfo.hasData) {
    if (dryInfo.currentDryMinutes > 0) {
      const curMin = dryInfo.currentDryMinutes;
      const curPct = dryInfo.currentProbPercent.toFixed(2);
      footerText += `<br>Current Bik dry streak: ${curMin} min (${curPct}% chance).`;
    }

    if (dryInfo.worstDryMinutes > 0) {
      const worstMin = dryInfo.worstDryMinutes;
      const worstPct = dryInfo.worstProbPercent.toFixed(2);
      footerText += `<br>Worst Bik dry streak: ${worstMin} min (${worstPct}% chance).`;
    }
  }

  tbody.innerHTML += `
    <tr style="border-top:2px solid #b18b29;">
      <td colspan="${bikMatrixMode === 'cluesPerHour' ? 3 : 4}">${footerText}</td>
    </tr>
  `;


  updateBikModeButtons && updateBikModeButtons();
}


function getBikDryStreakInfo() {
  const PROC_CHANCE_PER_MIN = 0.17;

  const nowMs = getSessionElapsedMs();
  if (nowMs <= 0) {
    return { hasData: false };
  }

  const bikDrops = clues
    .filter(d => d.source === "bik_book" && typeof d.sessionTime === "number")
    .sort((a, b) => a.sessionTime - b.sessionTime);

  if (!bikDrops.length) {
    const dryMinutes = Math.floor(nowMs / 60000);
    const prob = Math.pow(1 - PROC_CHANCE_PER_MIN, dryMinutes) * 100;

    return {
      hasData: true,
      currentDryMinutes: dryMinutes,
      currentProbPercent: prob,
      worstDryMinutes: dryMinutes,
      worstProbPercent: prob
    };
  }

  const lastProcTime = bikDrops[bikDrops.length - 1].sessionTime;
  const currentDryMinutes = Math.floor(Math.max(0, nowMs - lastProcTime) / 60000);
  const currentProbPercent = Math.pow(1 - PROC_CHANCE_PER_MIN, currentDryMinutes) * 100;

  let worstDryMinutes = Math.floor(bikDrops[0].sessionTime / 60000);

  for (let i = 1; i < bikDrops.length; i++) {
    const gapMs = bikDrops[i].sessionTime - bikDrops[i - 1].sessionTime;
    const gapMin = Math.floor(gapMs / 60000);
    if (gapMin > worstDryMinutes) {
      worstDryMinutes = gapMin;
    }
  }

  if (currentDryMinutes > worstDryMinutes) {
    worstDryMinutes = currentDryMinutes;
  }

  const worstProbPercent = Math.pow(1 - PROC_CHANCE_PER_MIN, worstDryMinutes) * 100;

  return {
    hasData: true,
    currentDryMinutes,
    currentProbPercent,
    worstDryMinutes,
    worstProbPercent
  };
}

function updateBikModeButtons() {
  const buttons = document.querySelectorAll("#bikModeGroup button");

  buttons.forEach(btn => {
    const modeMap = {
      percent: "percent",
      count: "count",
      clues: "cluesPerHour"
    };

    const mode = modeMap[btn.dataset.mode];
    btn.classList.toggle("active", bikMatrixMode === mode);
  });
}

const bikModeGroup = document.getElementById("bikModeGroup");

if (bikModeGroup) {
  bikModeGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const modeMap = {
      percent: "percent",
      count: "count",
      clues: "cluesPerHour"
    };

    bikMatrixMode = modeMap[btn.dataset.mode];
    renderBikMatrix();
  });
}



function loadSessionIntoTracker() {
  loadSettings();
  const rawClues = localStorage.getItem("clueDrops");
  if (rawClues) {
    try {
      clues = JSON.parse(rawClues);
    } catch (e) {
      console.error("Failed to parse clueDrops from storage", e);
      clues = [];
    }
  } else {
    clues = [];
  }

  const rawTiming = localStorage.getItem("clueSessionTiming");
  if (rawTiming) {
    try {
      const info = JSON.parse(rawTiming);
      const elapsed = info.totalSessionMs || 0;

      isRunning = false;
      pausedTime = elapsed;
      startTime = performance.now() - elapsed;

      updateTimerDisplay(pausedTime);
    } catch (e) {
      console.error("Failed to parse clueSessionTiming from storage", e);
      pausedTime = 0;
      updateTimerDisplay(0);
    }
  } else {
    pausedTime = 0;
    updateTimerDisplay(0);
  }

  updateGui();
}



function deleteSession(i) {
    let saves = JSON.parse(localStorage.getItem(SAVE_KEY)) || [];
    saves.splice(i, 1);
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
}

// Timer
function updateTimerDisplay(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let milliseconds = Math.round(ms % 1000);

    const formatted =
        String(hours).padStart(2, '0') + ":" +
        String(minutes).padStart(2, '0') + ":" +
        String(seconds).padStart(2, '0') + "." +
        String(milliseconds).padStart(3, '0');

    document.getElementById("timer").textContent = formatted;
}


// -------------------------
// Settings
// -------------------------
document.getElementById("autoStartCheckbox").addEventListener("change", e => {
    setting_autoStart = e.target.checked;
    saveSettings();
});

document.getElementById("spiritCheckbox").addEventListener("change", e => {
    setting_spirit = e.target.checked;
    saveSettings();
});


function loadSettings() {
    const raw = localStorage.getItem("ppTrackerSettings");
    if (raw) {
        try {
            const data = JSON.parse(raw);
            setting_autoStart = !!data.autoStart;
            setting_spirit = !!data.stickyFingers;
        } catch (e) {}
    }

    document.getElementById("autoStartCheckbox").checked = setting_autoStart;
    document.getElementById("spiritCheckbox").checked = setting_spirit;
}

function saveSettings() {
    const data = {
        autoStart: setting_autoStart,
        stickyFingers: setting_spirit
    };
    localStorage.setItem("ppTrackerSettings", JSON.stringify(data));
}

// -------------------------
// Save/load system
// -------------------------
function loadBikPurchases() {
  const raw = localStorage.getItem(BIK_PURCHASES_KEY);
  if (!raw) {
    bikPurchases = [];
    return;
  }

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      bikPurchases = data;
    } else {
      bikPurchases = [];
    }
  } catch (e) {
    console.error("Failed to parse bikPagePurchases from storage", e);
    bikPurchases = [];
  }
}


function saveBikPurchases() {
  localStorage.setItem(BIK_PURCHASES_KEY, JSON.stringify(bikPurchases));
}


function renderBikHistory() {
  console.log(bikPurchases)
  const container = document.getElementById("historyContent");
  if (!container) return;

  if (!bikPurchases || bikPurchases.length === 0) {
    container.innerHTML = "<div>No Bik page purchases recorded yet.</div>";
    return;
  }

  const sorted = bikPurchases.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let totalPages = 0;
  let totalPrice = 0;
  sorted.forEach(p => {
    totalPages += p.pages || 0;
    totalPrice += p.totalPrice || 0;
  });

  const avgPageCost = totalPages > 0
    ? totalPrice / totalPages
    : 0;

  const gpPerHour = avgPageCost > 0 ? avgPageCost * (60 / 45) : 0;

  let html = `
    <div style="margin-bottom:8px; font-size:13px;">
      <div><strong>Average price per Bik page:</strong> ${Math.round(avgPageCost).toLocaleString()} gp</div>
      <div><strong>Cost per hour:</strong> ${Math.round(gpPerHour).toLocaleString()} gp/h</div>
      <div>Total pages: ${totalPages.toLocaleString()} - Total spent: ${totalPrice.toLocaleString()} gp</div>
    </div>
    
    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px;">
<thead>
  <tr style="border-bottom:1px solid #b18b29;">
    <th>Time</th>
    <th>Pages</th>
    <th>Total price</th>
    <th>gp/page</th>
    <th>Delete</th>
  </tr>
</thead>
      <tbody>
  `;

  
  sorted.forEach(p => {
    const ts = p.timestamp ? new Date(p.timestamp) : null;
    const timeStr = ts ? `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}` : "-";
    const pages = p.pages || 0;
    const price = p.totalPrice || 0;
    const perPage = pages > 0 ? Math.round(price / pages) : 0;
html += `
  <tr>
    <td>${timeStr}</td>
    <td>${pages}</td>
    <td>${price.toLocaleString()}</td>
    <td>${perPage.toLocaleString()}</td>
    <td>
      <button class="delete-bik-btn" data-ts="${p.timestamp}" 
        style="
          padding:0;
          margin:0;
          width:16px;
          height:16px;
          line-height:14px;
          text-align:center;
          font-size:12px;
          border:none;
          border-radius:3px;
          background:#cc2e2e;
          color:white;
          cursor:pointer;
        ">
        x
      </button>
    </td>
  </tr>
`;



  });

  html += `
      </tbody>
    </table>
  `;

  const cost = getBikCostAnalytics();
html += `
  <div style="margin-bottom:8px; font-size:13px;">
    <strong>Cost per Bik clue:</strong> ${Math.round(cost.gpPerClue).toLocaleString()} gp
  </div>
`;




  container.innerHTML = html;
}

function deleteBikPurchase(ts) {
  bikPurchases = bikPurchases.filter(p => p.timestamp !== ts);
  saveBikPurchases();
  renderBikHistory();
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-bik-btn")) {
    const ts = parseInt(e.target.getAttribute("data-ts"), 10);
    if (!Number.isNaN(ts)) {
      deleteBikPurchase(ts);
    }
  }
});

function getBikTierCostPerClue() {
  console.log("??")
  const tiers = ["easy", "medium", "hard", "elite", "master"];

  if (!Array.isArray(bikPurchases) || !Array.isArray(clues)) {
    return {
      hasData: false,
      tierClueCounts: {},
      tierCostPerClue: {}
    };
  }

  let totalPurchasedPages = 0;
  let totalPurchasedCost = 0;

  bikPurchases.forEach(p => {
    totalPurchasedPages += p.pages || 0;
    totalPurchasedCost += p.totalPrice || 0;
  });

  if (totalPurchasedPages <= 0 || totalPurchasedCost <= 0) {
    return {
      hasData: false,
      tierClueCounts: {},
      tierCostPerClue: {}
    };
  }

  // 📊 Count clues per tier
  const tierClueCounts = {};
  tiers.forEach(t => (tierClueCounts[t] = 0));

  clues.forEach(d => {
    if (
      d.source === "bik_book" &&
      d.tier &&
      tierClueCounts.hasOwnProperty(d.tier)
    ) {
      const qty = d.quantity || 1;
      tierClueCounts[d.tier] += qty;
    }
  });

  const totalClues = Object.values(tierClueCounts).reduce((a, b) => a + b, 0);

  if (totalClues === 0) {
    return {
      hasData: false,
      tierClueCounts,
      tierCostPerClue: {}
    };
  }

  const tierCostPerClue = {};
  tiers.forEach(tier => {
    const count = tierClueCounts[tier];
    tierCostPerClue[tier] = count > 0
      ? totalPurchasedCost / count
      : 0;
  });

  return {
    hasData: true,
    totalPurchasedPages,
    totalPurchasedCost,
    totalClues,
    avgPageCost: totalPurchasedCost / totalPurchasedPages,
    tierClueCounts,
    tierCostPerClue
  };
}


function populateDummyData(count = 50) {
  const sources = ["prosper", "bik_book", "loot_beam"];
  const tiers = ["easy", "medium", "hard", "elite", "master"];

  const now = Date.now();
  const threeHours = 3 * 60 * 60 * 1000; // 3h in ms

  for (let i = 0; i < count; i++) {
    const src = sources[Math.floor(Math.random() * sources.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];

    let qty = 1;
    if (src === "bik_book") {
      qty = Math.floor(Math.random() * 3) + 1; // 1–3
      bikProcCount++;
    }

    const timestamp = now - Math.floor(Math.random() * threeHours);
    clues.push({
    timestamp: timestamp,
    sessionTime: Math.floor(Math.random() * (3 * 60 * 60 * 1000)),
    source: src,
    tier: tier,
    quantity: qty
    });

    saveDrops();
    updateGui();
    }
}


//populateDummyData(50); // generates 50 random drops

function renderHistory() {
  const container = document.getElementById("historyContent");
  if (!container) return;

  if (!clues || clues.length === 0) {
    container.innerHTML = "<div>No drops recorded yet.</div>";
    return;
  }

  const sorted = clues.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let html = `
    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px;">
      <thead>
        <tr style="border-bottom:1px solid #b18b29;">
          <th>Time</th>
          <th>Source</th>
          <th>Tier</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach(d => {
    const ts = d.timestamp ? new Date(d.timestamp) : null;
    const timeStr = ts ? ts.toLocaleTimeString() : "-";
    const src = d.source || "-";
    const tier = d.tier || "-";
    const qty = d.quantity != null ? d.quantity : 1;

    html += `
      <tr>
        <td>${timeStr}</td>
        <td>${src}</td>
        <td>${tier}</td>
        <td>${qty}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

const showHistoryBtn = document.getElementById("showHistoryBtn");
if (showHistoryBtn) {
  showHistoryBtn.addEventListener("click", () => {
    const titleEl = document.getElementById("historyModalTitle");
    if (titleEl) titleEl.textContent = "Clue history";
    renderHistory();
    $("#historyModal").modal("show");
  });
}

const showBikHistoryBtn = document.getElementById("showBikHistoryBtn");
if (showBikHistoryBtn) {
  showBikHistoryBtn.addEventListener("click", () => {
    const titleEl = document.getElementById("historyModalTitle");
    if (titleEl) titleEl.textContent = "Bik page history";
    renderBikHistory();
    $("#historyModal").modal("show");
  });
}


function parsePriceInput(str) {
  if (!str) return 0;
  const clean = str.replace(/[^\d]/g, "");
  const value = parseInt(clean, 10);
  return Number.isNaN(value) ? 0 : value;
}

const addBikPurchaseBtn = document.getElementById("addBikPurchaseBtn");

if (addBikPurchaseBtn) {
  addBikPurchaseBtn.addEventListener("click", () => {
    const pagesInput = document.getElementById("bikPagesInput");
    const priceInput = document.getElementById("bikPriceInput");
    const errorEl = document.getElementById("bikPurchaseError");

    if (!pagesInput || !priceInput || !errorEl) return;

    const pages = parseInt(pagesInput.value, 10);
    const totalPrice = parsePriceInput(priceInput.value);

    errorEl.textContent = "";

    if (!pages || pages <= 0) {
      errorEl.textContent = "Enter a valid number of pages.";
      return;
    }

    if (!totalPrice || totalPrice <= 0) {
      errorEl.textContent = "Enter a valid total price.";
      return;
    }

    pricePerPage = totalPrice/pages;

    const purchase = {
      pages,
      totalPrice,
      pricePerPage,
      timestamp: Date.now()
    };

    bikPurchases.push(purchase);
    saveBikPurchases();

    errorEl.style.color = "#6fff9c";
    errorEl.textContent = "Purchase added!";

    pagesInput.value = "";
    priceInput.value = "";

    setTimeout(() => {
      errorEl.textContent = "";
      errorEl.style.color = "#ff6b6b";
    }, 2000);
  });
}

function getBikCostAnalytics() {
  let totalPurchasedPages = 0;
  let totalPurchasedCost = 0;

  bikPurchases.forEach(p => {
    totalPurchasedPages += p.pages || 0;
    totalPurchasedCost += p.totalPrice || 0;
  });

  let totalBikPagesEarned = 0;
  clues.forEach(d => {
    if (d.source === "bik_book") {
      totalBikPagesEarned += d.quantity || 1;
    }
  });

  const avgPageCost = totalPurchasedPages > 0
    ? totalPurchasedCost / totalPurchasedPages
    : 0;

  const gpPerClue = avgPageCost;

  return {
    totalPurchasedPages,
    totalPurchasedCost,
    totalBikPagesEarned,
    avgPageCost,
    gpPerClue
  };
}