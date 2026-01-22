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

let sessionStartTime = null;   // real-world ms
let sessionEndTime = null;     // real-world ms
let sessionElapsedMs = 0;      // ms duration

// Counters
let clues = []
let bikProcCount = 0;
let bikProcRoll = 0;

// Bik page purchases
const BIK_PURCHASES_KEY = "bikPagePurchases";
const BIK_PAGE_MINUTES = 45; // one Bik page = 45 min active time
let bikPurchases = []; // { pages, totalPrice, timestamp }


// Save snapshot storage
let saveSnapshot = null;

// Save key
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

  // neon-green-ish overlay for clarity
  const color = A1lib.mixColor(0, 255, 0);

  alt1.overLayRect(
    color,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    2000,   // lasts 2 seconds
    2       // 2px thickness
  );
}


// -------------------------
// Buff tracking (Scripture of Bik)
// -------------------------

let buffReader = null;
let buffBorderImg = null;
let bikImg = null;
let bikBuffInfo = null; // BuffInfo instance for Scripture of Bik


// base64 (no "data:image/png;base64," prefix, just the payload)


// -------------------------
// Buff tracking (Scripture of Bik)
// -------------------------

// Scripture of Bik icon (27x27)
const BIK_BASE64 =
"iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAYAAACN1PRVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAT6SURBVEhLvZbLc9tUFMZDoU1LbOXKliU/ZPkh2ZbsxA/ZTmxLJk5b8sBNnEehpdACM+x4LDrDdMMwnbIBumBVGIbplBULdmzLH/cx515LfjQMu2rmi0/uyOd3v3OPjrxy75cUXpdW6M/JwOY69RycDao486o492o494UmAwc7d1R8/3yAg28ZtnYSmHgOzofBPdX/VQib9Cs49WycEYxA/AaR6LZfw8G2hYPvGHY/ZWjpcZhKBK6pYbSTxe0h3bOUnG+W5HBR3hC23zYx3irhxKvgxBMO513uty10WwxNncHVNbT0GI+Pn8kY9Y0QQtCLVZvBdpwcbmwWsO+auLVdmpV06nTPNXlyEoHahopOTsXWl5cxfipj8kMMh10L/iAz52pO82XsZDPoFXUBbRRw0F6EEqQ+hQUiWDevwTWUcG33gYzP/pH5Jv/zzOpaCq6eQc/UMbQN7G7ksdcy8V7Xwo1mAQ0qn8PQKiwCm7oMV1e56P+HX3Xw6EkPk8dxjLulaWWWzsxhKmpxDXU1hVY6zV16pSyHbmZk1NMMo48ZRvcZvP1l4EyDmwx3/mTYu6dg6GmY9CrhuYWwyrqKspQQUCWJRjKFjpHBRiaBeoahlmQYPWA4/YNh8ivD4PqrIFKruYbzFxI+ecmw+3UUe62i6Eh/zpkZUUJZEYVDN5QkrLiMeoqhkZnBjn4W8eHjJZCuoGlJ8HwFp8+voP35Vbzrmhy0ACtFE0JSgjskp6YUx2aGYXOaLICNf5pz+RvD6B49Dgl+j6vH0c9p6FoxOHkFZ1PQuW/PYFY0IUTOokL0ZWqMFk9CncYwfiZhy52Cfpf4NCFAS5d5uTuGAs/UUM/E0CgmcT68AEZuQnfRBHJr8rQ0AhTAqqNVvPM+w62nDN79VeHGEDBbldEvaBhaGqS3r3JXZ74datYgksohxUgcxayEWmqdtzWNJpe3N0NvKLqRSkgxgdqGwmFUgW5OgW9qMBMSmtbU1dDmrhacUcvzhpDjfNfdGrkiSCJ0Rsn7O4tN0cmraGWpCgp35SQZKrrCp8lkUBYlnJYyhG0XdLiZNPy7DE/+6vJzCRIGoItEU4Q+uzkVvqUhF4uglU/iej0v5i2fQpXFCUJjavkKEvI49yoomBpU6n5eQ8eIIxmNok2j75VJVJrBaIGulZWVBbmNWLhODzY9b3Q+AiI6ljqQzqqirSO1JmEjIYYCQftmFsOKgd1aYQY72i6HSSv9NTiNa/yd1TlUw3VKTCB67qhLR2eMn1fQgatvXobNVDiyimpM49BWKo2uocOzjBmMXp7z16aZwNVLl5BcW11Y5+VzGG58Ico7fiQ+jVgEmbV1DgvkyBpq8SRvPjedXoSRgvLRNahl0bOzPJ5f/+DHFB6+2Ag3cPpNXFRkXV1QWVJhUyypcJg2V8ZeGUf9Co4GQgHg1tQxxU7tjTD+6G/hKNhEPhJDhakoLwEJRCJoCDueAujz2LPDRPSjJojv3hfOKPY/jIZx7fgabCXB3xa8hOsXa1bGQQWTKYQuipdhg+EMVhleCeNyUuGd10yl+WCgkl0EncE8AQsgHOTbmPgOTnxHOMirOBy/JcDVLJ8UFO9U8xiUDPSKWbT1DG/7jXgSVVnjEDo7mr2zMnpUvkB2qGAD5PDEc3DdzWO4mecx/ZY86ts47JRws1nkD7BfzvK3fFtPozmF8iaZd/a69C9kG89ZMecWQwAAAABJRU5ErkJggg==";

// Buff border (27x27, green outline)
const BORDER_BASE64 =
"iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAYAAACN1PRVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABCSURBVEhL7daxDQAgDANBwxasxmCsS4jECE8K5JdcX+s219iqKrGTXi+dfs2SjCEZQzKGZAzJGJIxJGNI/2KFj1gK6ntTCO2Nfp8AAAAASUVORK5CYII=";


function loadBuffAssets() {
  const pBorder = A1lib.ImageDetect.imageDataFromBase64(BORDER_BASE64).then(img => {
    buffBorderImg = img;
    console.log("buffBorderImg loaded", img.width, img.height);
  });

  const pBik = A1lib.ImageDetect.imageDataFromBase64(BIK_BASE64).then(img => {
    bikImg = img;
    console.log("bikImg loaded", img.width, img.height);

    // Create a BuffInfo that can "improve" the template over time
    bikBuffInfo = new BuffInfo(bikImg, false, "scripture_bik", true);
  });

  return Promise.all([pBorder, pBik]);
}

function initBuffReader() {
  if (!buffBorderImg) {
    console.warn("initBuffReader: buffBorderImg not loaded yet");
    return;
  }

  buffReader = new BuffReader({
    debuffs: false,
    buffBorder: buffBorderImg
  });

  const fullImg = A1lib.captureHoldFullRs();
  if (!fullImg) {
    console.warn("initBuffReader: captureHoldFullRs() returned null");
    return;
  }

  const found = buffReader.find(fullImg);
  console.log("Buff bar found:", found, found ? buffReader.getCaptRect() : null);

  if (found) {
    drawBuffBarOverlay();
  }
}


// Draw a rectangle around the detected buff bar
function drawBuffBarOverlay() {
  if (!buffReader || !buffReader.pos) return;

  const rect = buffReader.getCaptRect();
  if (!rect) return;

  const color = A1lib.mixColor(0, 255, 0); // green
  alt1.overLayRect(
    color,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    2000, // ms visible
    2     // thickness
  );
}

function isBikActive() {
  if (!buffReader || !buffReader.pos || !bikBuffInfo) return false;

  const state = buffReader.read(); // array of Buff
  if (!state) return false;

  // More forgiving matcher that can improve the template
  const match = BuffReader.matchBuff(state, bikBuffInfo);

  return !!match;
}


function setupBuffTracking() {
  loadBuffAssets().then(() => {
    initBuffReader();

    setInterval(() => {
/*
      if(isBikActive()){
        startTimer();
      } else{
        stopTimer()
      }
        */
    }, 300); // roughly one RS tick
  });
}

setupBuffTracking();



// -------------------------
// Helpers functions
// -------------------------
function saveDrops() {
  localStorage.setItem("clueDrops", JSON.stringify(clues));
  saveSessionTiming()
}

function saveSessionTiming() {
  const info = {
    totalSessionMs: getSessionElapsedMs(), // full elapsed in this single session
    savedAt: Date.now()
  };
  localStorage.setItem("clueSessionTiming", JSON.stringify(info));
}


function msUntilNextTick(elapsed) {
    const tick = 600; // RuneScape tick = 0.6 seconds
    const remainder = elapsed % tick;
    return remainder === 0 ? 0 : (tick - remainder);
}
function recordDrop(source, tier, quantity) {
  const drop = {
    timestamp: Date.now(),     // real-world time
    sessionTime: getSessionElapsedMs(),  // ms into this session
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
  // use the exact same notion of "elapsed" as the timer
  const ms = getSessionElapsedMs(); // uses performance.now() - startTime when running
  return ms > 0 ? ms / 3600000 : 0; // convert to hours
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
    console.log(line);

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
  // initialise counters
  var totals =     { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var bikTotals =  { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var prosperTot = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
  var lootTotals = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };

  clues.forEach(function (d) {
    var tier = d.tier;           // "easy", "medium", ...
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
    var suffix = tier.charAt(0).toUpperCase() + tier.slice(1); // "easy" -> "Easy"

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

  // --------------------------
  // HEADER HANDLING
  // --------------------------
  if (bikMatrixMode === "cluesPerHour") {
    // Tier | Clues/h | gp/clue
    thead.innerHTML = `
      <tr style="border-bottom:2px solid #b18b29;">
        <th>Tier</th>
        <th>Clues/h</th>
        <th>gp/clue</th>
      </tr>`;
  } else {
    // Normal header (percent / count)
    thead.innerHTML = `
      <tr style="border-bottom:2px solid #b18b29;">
        <th>Tier</th>
        <th>1x</th>
        <th>2x</th>
        <th>3x</th>
      </tr>`;
  }

  // --------------------------
  // BODY ROWS
  // --------------------------
  let totalCluesFromBik = 0;

  tiers.forEach(tier => {
    const iconPath = `images/${tier}_clue_scroll.png`;

    // total clues for this tier (for some calculations)
    let tierTotalClues = 0;
    quantities.forEach(q => tierTotalClues += counts[tier][q] * q);
    totalCluesFromBik += tierTotalClues;

    if (bikMatrixMode === "cluesPerHour") {
      // per-tier clues/h
      const rate = hours > 0 ? (tierTotalClues / hours).toFixed(2) : "0.00";

      // gp/clue per tier from costInfo
      let costStr = "-";
      if (costInfo.hasData && costInfo.tierCostPerClue && costInfo.tierCostPerClue[tier] > 0) {
        const gp = Math.round(costInfo.tierCostPerClue[tier]);
        costStr = gp.toLocaleString() + " gp";
      }

      tbody.innerHTML += `
        <tr>
          <td><img class="npcIcon" src="${iconPath}" width="24"></td>
          <td>${rate}</td>
          <td>${costStr}</td>
        </tr>`;

    } else {
      // percent / count modes
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

  // --------------------------
  // FOOTER ROW
  // --------------------------
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

  // All Bik procs in this session, sorted by sessionTime
  const bikDrops = clues
    .filter(d => d.source === "bik_book" && typeof d.sessionTime === "number")
    .sort((a, b) => a.sessionTime - b.sessionTime);

  // If we have no procs yet, the whole session is one big current+worst dry streak
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

  // Current dry streak = time since last proc
  const lastProcTime = bikDrops[bikDrops.length - 1].sessionTime;
  const currentDryMinutes = Math.floor(Math.max(0, nowMs - lastProcTime) / 60000);
  const currentProbPercent = Math.pow(1 - PROC_CHANCE_PER_MIN, currentDryMinutes) * 100;

  // Worst historical dry streak:
  //  - from start -> first proc
  //  - between consecutive procs
  //  - current streak since last proc
  let worstDryMinutes = Math.floor(bikDrops[0].sessionTime / 60000); // start -> first proc

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
  const modes = [
    { id: "bikModePercent",   mode: "percent" },
    { id: "bikModeCount",     mode: "count" },
    { id: "bikModeCluesHour", mode: "cluesPerHour" }
  ];

  modes.forEach(m => {
    const btn = document.getElementById(m.id);
    if (!btn) return;
    if (bikMatrixMode === m.mode) {
      btn.style.backgroundColor = "#b18b29";
      btn.style.color = "#000";
    } else {
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }
  });
}

const modePercentBtn   = document.getElementById("bikModePercent");
const modeCountBtn     = document.getElementById("bikModeCount");
const modeCluesHourBtn = document.getElementById("bikModeCluesHour");

if (modePercentBtn) {
  modePercentBtn.addEventListener("click", () => {
    bikMatrixMode = "percent";
    renderBikMatrix();
  });
}

if (modeCountBtn) {
  modeCountBtn.addEventListener("click", () => {
    bikMatrixMode = "count";
    renderBikMatrix();
  });
}

if (modeCluesHourBtn) {
  modeCluesHourBtn.addEventListener("click", () => {
    bikMatrixMode = "cluesPerHour";
    renderBikMatrix();
  });
}



function loadSessionIntoTracker() {
  // --- load clues ---
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

  // --- load timer/elapsed ---
  const rawTiming = localStorage.getItem("clueSessionTiming");
  if (rawTiming) {
    try {
      const info = JSON.parse(rawTiming);
      const elapsed = info.totalSessionMs || 0;

      isRunning = false;                    // never auto-start
      pausedTime = elapsed;                 // store as paused time
      startTime = performance.now() - elapsed; // so Start resumes from here

      updateTimerDisplay(pausedTime);       // show loaded time
    } catch (e) {
      console.error("Failed to parse clueSessionTiming from storage", e);
      pausedTime = 0;
      updateTimerDisplay(0);
    }
  } else {
    pausedTime = 0;
    updateTimerDisplay(0);
  }

  // Update clue table to match loaded data
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


function loadSettings() {
    const raw = localStorage.getItem("ppTrackerSettings");
    if (raw) {
        try {
            const data = JSON.parse(raw);
            setting_autoStart = !!data.autoStart;
            setting_stickyFingers = !!data.stickyFingers;
        } catch (e) {}
    }

    // Reflect in UI
    document.getElementById("autoStartCheckbox").checked = setting_autoStart;
    document.getElementById("stickyFingersCheckbox").checked = setting_stickyFingers;
}

function saveSettings() {
    const data = {
        autoStart: setting_autoStart,
        stickyFingers: setting_stickyFingers
    };
    localStorage.setItem("ppTrackerSettings", JSON.stringify(data));
}

// -------------------------
// Save/load system (MULTI SAVE)
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
  const container = document.getElementById("historyContent");
  if (!container) return;

  if (!bikPurchases || bikPurchases.length === 0) {
    container.innerHTML = "<div>No Bik page purchases recorded yet.</div>";
    return;
  }

  // Newest first
  const sorted = bikPurchases.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Total / average
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

// Delete Bik purchase by timestamp
function deleteBikPurchase(ts) {
  bikPurchases = bikPurchases.filter(p => p.timestamp !== ts);
  saveBikPurchases();
  renderBikHistory(); // re-render instantly
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
  const tiers = ["easy", "medium", "hard", "elite", "master"];

  // 1) Purchases: how many pages did we buy, what's the total cost?
  let totalPurchasedPages = 0;
  let totalPurchasedCost = 0;

  if (Array.isArray(bikPurchases)) {
    bikPurchases.forEach(p => {
      totalPurchasedPages += p.pages || 0;
      totalPurchasedCost += p.totalPrice || 0;
    });
  }

  if (totalPurchasedPages <= 0 || totalPurchasedCost <= 0) {
    return {
      hasData: false,
      tierClueCounts: {},
      tierCostPerClue: {}
    };
  }

  const avgPageCost = totalPurchasedCost / totalPurchasedPages; // gp per page

  // 2) How much paid time have we actually used?
  const minutesPlayed = getSessionElapsedMs() / 1000 / 60;
  const pagesConsumedRaw = minutesPlayed / 45; // 45 min per page

  const pagesConsumed = Math.min(pagesConsumedRaw, totalPurchasedPages);
  const costConsumed = pagesConsumed * avgPageCost;

  // 3) Count Bik clues per tier
  const tierClueCounts = {};
  tiers.forEach(t => (tierClueCounts[t] = 0));

  clues.forEach(d => {
    if (d.source === "bik_book" && d.tier && tierClueCounts.hasOwnProperty(d.tier)) {
      tierClueCounts[d.tier] += d.quantity || 1;
    }
  });

  // 4) Cost per clue per tier
  const tierCostPerClue = {};
  tiers.forEach(tier => {
    const count = tierClueCounts[tier];
    if (costConsumed > 0 && count > 0) {
      tierCostPerClue[tier] = costConsumed / count;
    } else {
      tierCostPerClue[tier] = 0;
    }
  });

  return {
    hasData: costConsumed > 0,
    minutesPlayed,
    pagesConsumed,
    totalPurchasedPages,
    totalPurchasedCost,
    avgPageCost,
    costConsumed,
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

    // quantity rules
    let qty = 1;
    if (src === "bik_book") {
      qty = Math.floor(Math.random() * 3) + 1; // 1–3
      bikProcCount++;
    }

    // random timestamp within the past 3 hours
    const timestamp = now - Math.floor(Math.random() * threeHours);
    clues.push({
    timestamp: timestamp,
    sessionTime: Math.floor(Math.random() * (3 * 60 * 60 * 1000)), // random in 3 hours
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

  // Newest first: sort by timestamp descending
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
  // Keep only digits, so it handles "45 784 124", "45,784,124", etc.
  const clean = str.replace(/[^\d]/g, "");
  const value = parseInt(clean, 10);
  return Number.isNaN(value) ? 0 : value;
}

const addBikPurchaseBtn = document.getElementById("addBikPurchaseBtn");
if (addBikPurchaseBtn) {
  addBikPurchaseBtn.addEventListener("click", () => {
    const pagesInput = document.getElementById("bikPagesInput");
    const priceInput = document.getElementById("bikPriceInput");
    if (!pagesInput || !priceInput) return;

    const pages = parseInt(pagesInput.value, 10);
    const totalPrice = parsePriceInput(priceInput.value);

    if (!pages || pages <= 0) {
      console.warn("Invalid pages value");
      return;
    }
    if (!totalPrice || totalPrice <= 0) {
      console.warn("Invalid price value");
      return;
    }

    const purchase = {
      pages: pages,
      totalPrice: totalPrice,
      timestamp: Date.now()
    };

    bikPurchases.push(purchase);
    saveBikPurchases();
    renderBikPurchases();

    // Optional: clear inputs
    pagesInput.value = "";
    priceInput.value = "";
  });
}

function getBikCostAnalytics() {
  // 1. purchased totals
  let totalPurchasedPages = 0;
  let totalPurchasedCost = 0;

  bikPurchases.forEach(p => {
    totalPurchasedPages += p.pages || 0;
    totalPurchasedCost += p.totalPrice || 0;
  });

  // 2. earned pages from Bik
  let totalBikPagesEarned = 0;
  clues.forEach(d => {
    if (d.source === "bik_book") {
      totalBikPagesEarned += d.quantity || 1;
    }
  });

  // 3. average cost basis
  const avgPageCost = totalPurchasedPages > 0
    ? totalPurchasedCost / totalPurchasedPages
    : 0;

  // 4. price per clue = price per page
  const gpPerClue = avgPageCost;

  return {
    totalPurchasedPages,
    totalPurchasedCost,
    totalBikPagesEarned,
    avgPageCost,
    gpPerClue
  };
}


