const screens = {
  menu: document.getElementById('menuScreen'),
  settings: document.getElementById('settingsScreen'),
  history: document.getElementById('historyScreen'),
  game: document.getElementById('gameScreen'),
  end: document.getElementById('endScreen')
};

const state = {
  screen: 'menu',
  playing: false,
  score: 0,
  lives: 5,
  level: 1,
  exp: 0,
  requiredExp: 5000,
  timeElapsed: 0,
  spawnRate: 1.25,
  dropSpeed: 1.25,
  droplets: [],
  nextDropletId: 1,
  answer: '',
  spawnTimer: null,
  frameId: null,
  roundStartTime: 0,
  roundDestroyed: 0,
  roundStats: {
    byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0, pink: 0 },
    killTimes: [],
    graph: [],
    misses: 0
  },
  settings: {
    spawnRate: 1.25,
    dropSpeed: 1.25,
    modes: { addition: true, subtraction: true, multiplication: true, division: true, advanced: true }
  },
  history: []
};

const colorLabels = {
  grey: 'Xám',
  green: 'Xanh lá',
  blue: 'Xanh biển',
  purple: 'Tím',
  red: 'Đỏ',
  gold: 'Vàng',
  pink: 'Hồng'
};

const modeMeta = {
  addition: { label: 'Cộng', color: 'grey' },
  subtraction: { label: 'Trừ', color: 'green' },
  multiplication: { label: 'Nhân', color: 'blue' },
  division: { label: 'Chia', color: 'purple' },
  advanced: { label: 'Nâng cao', color: 'red' }
};

const scoreMap = {
  grey: 500,
  green: 1000,
  blue: 1500,
  purple: 2000,
  red: 5000,
  gold: 500,
  pink: 500
};

function setScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  state.screen = name;
}

function getRequiredExp(level) {
  return level === 1 ? 5000 : 5000 + (level - 1) * 1000;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateHUD() {
  document.getElementById('scoreValue').textContent = state.score;
  document.getElementById('livesValue').textContent = state.lives;
  document.getElementById('timeValue').textContent = `${(state.timeElapsed || 0).toFixed(2)}s`;
  document.getElementById('spawnValue').textContent = state.spawnRate.toFixed(2);
  document.getElementById('dropValue').textContent = state.dropSpeed.toFixed(2);
  document.getElementById('levelValue').textContent = state.level;

  const expPercent = state.requiredExp ? (state.exp / state.requiredExp) * 100 : 0;
  document.getElementById('expText').textContent = `${state.exp}/${state.requiredExp} - ${expPercent.toFixed(2)}%`;
  document.getElementById('expFill').style.width = `${clamp(expPercent, 0, 100)}%`;
}

function updateInputDisplay() {
  document.getElementById('answerDisplay').textContent = state.answer === '' ? '0' : state.answer;
}

function clearInput() {
  state.answer = '';
  updateInputDisplay();
}

function appendInputValue(value) {
  if (!/^[0-9]$/.test(value)) return;
  const current = state.answer;
  const next = current === '0' ? value : `${current}${value}`;
  state.answer = next.slice(0, 4);
  updateInputDisplay();
}

function saveSettings() {
  const spawnRate = Number(document.getElementById('spawnRateInput').value || 1.25);
  const dropSpeed = Number(document.getElementById('dropSpeedInput').value || 1.25);
  state.settings.spawnRate = clamp(spawnRate, 0.5, 10);
  state.settings.dropSpeed = clamp(dropSpeed, 0.5, 10);
  document.querySelectorAll('.mode-toggle').forEach((toggle) => {
    state.settings.modes[toggle.dataset.mode] = toggle.checked;
  });
  state.spawnRate = Number(state.settings.spawnRate.toFixed(2));
  state.dropSpeed = Number(state.settings.dropSpeed.toFixed(2));
  updateHUD();
  setScreen('menu');
}

function loadSettingsUI() {
  document.getElementById('spawnRateInput').value = state.settings.spawnRate.toFixed(2);
  document.getElementById('dropSpeedInput').value = state.settings.dropSpeed.toFixed(2);
  document.querySelectorAll('.mode-toggle').forEach((toggle) => {
    toggle.checked = !!state.settings.modes[toggle.dataset.mode];
  });
}

function enableMode(mode) {
  return state.settings.modes[mode] === true;
}

function factorial(num) {
  if (num < 0) return 0;
  let result = 1;
  for (let i = 2; i <= num; i += 1) result *= i;
  return result;
}

function buildNonNegativeFormula() {
  const modeNames = Object.keys(modeMeta).filter(enableMode);
  if (!modeNames.length) {
    return { answer: 0, label: '0', color: 'grey', isSpecial: false };
  }

  if (Math.random() < 0.04) {
    return {
      answer: 0,
      label: Math.random() < 0.5 ? '★' : '♥',
      color: Math.random() < 0.5 ? 'gold' : 'pink',
      isSpecial: true
    };
  }

  const chosenMode = randomChoice(modeNames);
  const color = modeMeta[chosenMode].color;
  let a = 0;
  let b = 0;
  let label = '';
  let answer = 0;

  switch (chosenMode) {
    case 'addition': {
      a = randomInt(0, 60);
      b = randomInt(0, 60);
      label = `${a} + ${b}`;
      answer = a + b;
      break;
    }
    case 'subtraction': {
      a = randomInt(0, 99);
      b = randomInt(0, a);
      label = `${a} - ${b}`;
      answer = a - b;
      break;
    }
    case 'multiplication': {
      a = randomInt(0, 20);
      b = randomInt(0, 20);
      label = `${a} × ${b}`;
      answer = a * b;
      break;
    }
    case 'division': {
      const divisor = randomInt(1, 20);
      const quotient = randomInt(0, 20);
      const dividend = divisor * quotient;
      label = `${dividend} ÷ ${divisor}`;
      answer = dividend / divisor;
      break;
    }
    case 'advanced': {
      const advancedRoll = randomInt(1, 4);
      if (advancedRoll === 1) {
        const value = randomInt(0, 10);
        label = `${value}!`;
        answer = factorial(value);
      } else if (advancedRoll === 2) {
        const value = randomInt(0, 20);
        label = `√${value ** 2}`;
        answer = value;
      } else if (advancedRoll === 3) {
        const base = randomInt(0, 20);
        const exponent = randomInt(0, 3);
        label = `${base}^${exponent}`;
        answer = Math.pow(base, exponent);
      } else {
        const x = randomInt(0, 25);
        const k = randomInt(0, 25);
        label = `x + ${k} = ${x + k}`;
        answer = x;
      }
      break;
    }
    default:
      label = '0';
      answer = 0;
  }

  answer = clamp(Math.round(answer), 0, 200);
  return { answer, label, color, isSpecial: false };
}

function spawnDroplet() {
  const { answer, label, color, isSpecial } = buildNonNegativeFormula();
  const board = document.getElementById('gameBoard');
  const boardRect = board.getBoundingClientRect();
  const left = randomInt(60, Math.max(70, boardRect.width - 60));
  const droplet = {
    id: state.nextDropletId++,
    x: left,
    y: 70,
    answer,
    label,
    color,
    isSpecial,
    speed: state.dropSpeed * (Math.random() * 0.8 + 0.9),
    element: document.createElement('div')
  };

  const element = droplet.element;
  element.className = `drop ${droplet.color}`;
  element.style.left = `${droplet.x}px`;
  element.style.top = `${droplet.y}px`;

  const labelNode = document.createElement('div');
  labelNode.className = 'drop-label';
  labelNode.textContent = label;

  if (label.length > 8) labelNode.style.fontSize = '0.95rem';
  else if (label.length > 5) labelNode.style.fontSize = '1.35rem';
  else labelNode.style.fontSize = '1.8rem';

  element.appendChild(labelNode);
  board.appendChild(element);
  state.droplets.push(droplet);
}

function startGame() {
  clearGame();
  state.playing = true;
  state.roundStartTime = performance.now();
  state.timeElapsed = 0;
  state.score = 0;
  state.lives = 5;
  state.level = 1;
  state.exp = 0;
  state.requiredExp = getRequiredExp(1);
  state.droplets = [];
  state.answer = '';
  updateInputDisplay();

  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  updateHUD();
  setScreen('game');

  const spawnIntervalMs = Math.max(300, 1000 / state.spawnRate);
  state.spawnTimer = setInterval(() => {
    if (state.playing) spawnDroplet();
  }, spawnIntervalMs);

  const step = () => {
    if (!state.playing) return;
    state.timeElapsed = (performance.now() - state.roundStartTime) / 1000;
    updateHUD();
    moveDroplets();
    state.frameId = requestAnimationFrame(step);
  };

  state.frameId = requestAnimationFrame(step);
}

function clearGame() {
  if (state.spawnTimer) clearInterval(state.spawnTimer);
  if (state.frameId) cancelAnimationFrame(state.frameId);
  clearInput();
  state.roundStats = {
    byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0, pink: 0 },
    killTimes: [],
    graph: [],
    misses: 0
  };
}

function moveDroplets() {
  const board = document.getElementById('gameBoard');
  const boardHeight = board.clientHeight || 500;
  const boardWidth = board.clientWidth || 500;

  for (const droplet of [...state.droplets]) {
    droplet.y += droplet.speed * 0.85 * (state.dropSpeed || 1);
    droplet.element.style.top = `${droplet.y}px`;
    droplet.element.style.left = `${clamp(droplet.x, 35, boardWidth - 35)}px`;

    if (droplet.y > boardHeight - 80) {
      missDroplets();
      return;
    }
  }
}

function addExp(amount) {
  state.exp += amount;
  while (state.exp >= state.requiredExp) {
    state.exp -= state.requiredExp;
    state.level += 1;
    state.requiredExp = getRequiredExp(state.level);
  }
  updateHUD();
}

function awardSpecialDrop(droplet) {
  const all = [...state.droplets];
  if (droplet.color === 'gold') {
    const total = all.reduce((sum, item) => sum + (scoreMap[item.color] || 500), 0);
    state.score += total;
    state.droplets.forEach((item) => item.element.remove());
    state.droplets = [];
    clearInput();
    updateHUD();
    return;
  }
  if (droplet.color === 'pink') {
    state.lives = clamp(state.lives + 1, 0, 999);
    state.score += 500;
    const idx = state.droplets.findIndex((item) => item.id === droplet.id);
    if (idx >= 0) {
      state.droplets[idx].element.remove();
      state.droplets.splice(idx, 1);
    }
    clearInput();
    updateHUD();
  }
}

function destroyDroplets(matches, source = 'answer') {
  if (!matches.length) return;

  const board = document.getElementById('gameBoard');
  const visible = [...state.droplets];
  const matchedIds = new Set(matches.map((drop) => drop.id));
  const scoreGain = matches.reduce((sum, droplet) => sum + (scoreMap[droplet.color] || 500), 0);

  if (source === 'answer') {
    state.score += scoreGain;
    matches.forEach((drop) => {
      state.roundStats.byColor[drop.color] = (state.roundStats.byColor[drop.color] || 0) + 1;
    });
    state.roundDestroyed += matches.length;
    state.roundStats.killTimes.push(state.timeElapsed);

    const popup = document.createElement('div');
    popup.className = 'popup-exp';
    popup.textContent = `+${scoreGain}`;
    popup.style.position = 'absolute';
    popup.style.left = `${matches[0].x}px`;
    popup.style.top = `${matches[0].y}px`;
    popup.style.zIndex = '20';
    popup.style.color = '#fff';
    popup.style.fontWeight = '900';
    popup.style.fontSize = '1.1rem';
    popup.style.textShadow = '0 2px 8px rgba(0,0,0,0.4)';
    board.appendChild(popup);
    setTimeout(() => popup.remove(), 500);

    addExp(scoreGain);
  }

  for (const droplet of visible) {
    if (matchedIds.has(droplet.id)) {
      droplet.element.remove();
    }
  }

  state.droplets = state.droplets.filter((d) => !matchedIds.has(d.id));
  clearInput();
  updateHUD();
}

function missDroplets() {
  if (!state.playing) return;
  state.lives -= 1;
  state.roundStats.misses += 1;

  state.droplets.forEach((d) => d.element.remove());
  state.droplets = [];

  if (state.lives <= 0) {
    endRound();
    return;
  }

  clearInput();
  updateHUD();
}

function handleEnter() {
  if (!state.playing || state.answer === '') return;

  const parsed = Number(state.answer);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 200) {
    clearInput();
    return;
  }

  const matches = state.droplets.filter((d) => d.answer === parsed);
  if (matches.length > 0) {
    destroyDroplets(matches, 'answer');
    return;
  }

  const specialMatch = state.droplets.find((d) => d.isSpecial && d.answer === parsed);
  if (specialMatch) {
    awardSpecialDrop(specialMatch);
    return;
  }

  clearInput();
}

function handleKeyPress(key) {
  if (!state.playing) return;
  if (key === 'clear') {
    clearInput();
    return;
  }
  if (key === 'enter') {
    handleEnter();
    return;
  }
  if (/^[0-9]$/.test(key)) {
    appendInputValue(key);
  }
}

function computeRate(seconds) {
  return seconds > 0 ? state.roundDestroyed / seconds : 0;
}

function saveHistoryRound(round) {
  const saved = JSON.parse(localStorage.getItem('math-rain-history') || '[]');
  saved.push(round);
  localStorage.setItem('math-rain-history', JSON.stringify(saved));
  state.history = saved;
}

function renderHistory() {
  const entries = JSON.parse(localStorage.getItem('math-rain-history') || '[]');
  state.history = entries;
  const sortMode = document.querySelector('[data-sort].active')?.dataset.sort || 'score';
  const ordered = [...entries].sort((a, b) => {
    if (sortMode === 'score') return b.point - a.point;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const historyContainer = document.getElementById('historyEntries');
  historyContainer.innerHTML = '';
  if (!ordered.length) {
    historyContainer.innerHTML = '<div class="history-item"><strong>Chưa có lượt nào</strong></div>';
  } else {
    ordered.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <strong>Điểm: ${entry.point} · ${new Date(entry.timestamp).toLocaleString()}</strong>
        <div>Giọt phá: ${entry.destroyed}</div>
        <div>Đánh giá: ${entry.fastestRate.toFixed(2)}/s nhanh nhất · ${entry.avgRate.toFixed(2)}/s trung bình</div>
      `;
      historyContainer.appendChild(item);
    });
  }

  const totals = entries.reduce((acc, entry) => {
    acc.point += entry.point;
    acc.destroyed += entry.destroyed;
    acc.duration += entry.duration;
    acc.games += 1;
    Object.keys(acc.byColor).forEach((color) => {
      acc.byColor[color] += entry.byColor[color] || 0;
    });
    return acc;
  }, { point: 0, destroyed: 0, duration: 0, games: 0, byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0, pink: 0 } });

  const lifetime = document.getElementById('lifetimeStats');
  lifetime.innerHTML = `
    <strong>Lifetime Stats</strong><br>
    Tổng Point: ${totals.point}<br>
    Tổng giọt phá: ${totals.destroyed}<br>
    Tổng thời lượng: ${(totals.duration / 1000).toFixed(2)}s<br>
    Tổng lượt chơi: ${totals.games}<br>
    Theo màu: ${Object.entries(colorLabels).map(([key, label]) => `${label}: ${totals.byColor[key]}`).join(' · ')}
  `;
}

function renderEndCard(roundSummary) {
  const endScore = document.getElementById('endScore');
  const endKills = document.getElementById('endKills');
  const fastestRate = document.getElementById('fastestRate');
  const avgRate = document.getElementById('avgRate');
  const colorSummary = document.getElementById('colorSummary');

  endScore.textContent = roundSummary.point;
  endKills.textContent = roundSummary.destroyed;
  fastestRate.textContent = roundSummary.fastestRate.toFixed(2);
  avgRate.textContent = roundSummary.avgRate.toFixed(2);

  colorSummary.innerHTML = '';
  Object.entries(colorLabels).forEach(([key, label]) => {
    const row = document.createElement('div');
    row.className = 'color-line';
    row.innerHTML = `<span>${label}</span><strong>${roundSummary.byColor[key]}</strong>`;
    colorSummary.appendChild(row);
  });

  const canvas = document.getElementById('speedGraph');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;

  const data = roundSummary.graph;
  const maxValue = Math.max(1, ...data.map((p) => p.value));

  ctx.beginPath();
  data.forEach((point, index) => {
    const x = 20 + (index / Math.max(1, data.length - 1)) * (canvas.width - 40);
    const y = canvas.height - 20 - (point.value / maxValue) * (canvas.height - 40);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#8ee9ff';
  ctx.stroke();

  ctx.fillStyle = '#dff7ff';
  ctx.font = '12px Segoe UI';
  ctx.fillText('0.0', 8, canvas.height - 12);
  ctx.fillText(`${maxValue.toFixed(1)}`, 8, 20);
}

function endRound() {
  state.playing = false;
  clearInterval(state.spawnTimer);
  cancelAnimationFrame(state.frameId);

  const durationMs = performance.now() - state.roundStartTime;
  const fastestRate = state.roundStats.killTimes.length ? Math.max(...state.roundStats.killTimes.map((t) => state.roundDestroyed / Math.max(0.1, t))) : 0;
  const avgRate = durationMs > 0 ? state.roundDestroyed / (durationMs / 1000) : 0;
  const graph = [];
  for (let i = 0; i < 12; i += 1) {
    const t = i / 12;
    const value = t * avgRate * (0.5 + Math.random() * 1.5);
    graph.push({ time: t, value });
  }

  const summary = {
    point: state.score,
    destroyed: state.roundDestroyed,
    byColor: { ...state.roundStats.byColor },
    fastestRate,
    avgRate,
    graph,
    duration: durationMs,
    timestamp: new Date().toISOString()
  };

  saveHistoryRound(summary);
  renderHistory();
  renderEndCard(summary);
  setScreen('end');
  updateHUD();
}

function bindEvents() {
  document.querySelectorAll('[data-screen]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-screen');
      if (target === 'game') startGame();
      else setScreen(target);
    });
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('settingsBackBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('historyBackBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('playAgainBtn').addEventListener('click', startGame);
  document.getElementById('endMenuBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('backToMenuBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('clearAnswerBtn').addEventListener('click', clearInput);
  document.getElementById('startBtn').addEventListener('click', startGame);

  document.querySelectorAll('.key').forEach((key) => {
    key.addEventListener('click', () => {
      const action = key.dataset.action;
      if (action) handleKeyPress(action);
      else handleKeyPress(key.dataset.value);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleKeyPress('enter');
    else if (event.key === 'Backspace' || event.key === 'Delete') handleKeyPress('clear');
    else if (/^[0-9]$/.test(event.key)) handleKeyPress(event.key);
  });

  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-sort]').forEach((item) => item.classList.toggle('active', item === button));
      renderHistory();
    });
  });
}

function init() {
  loadSettingsUI();
  renderHistory();
  setScreen('menu');
  updateHUD();
  bindEvents();
}

window.addEventListener('load', init);
