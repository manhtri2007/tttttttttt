const screens = {
  menu: document.getElementById('menuScreen'),
  settings: document.getElementById('settingsScreen'),
  history: document.getElementById('historyScreen'),
  game: document.getElementById('gameScreen'),
  end: document.getElementById('endScreen')
};

const MAX_DROPLETS = 12;
const PROGRESS_STORAGE_KEY = 'math-rain-progress';
const SETTINGS_STORAGE_KEY = 'math-rain-settings';

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
  lastHudUpdate: 0,
  boardWidth: 500,
  boardHeight: 500,
  roundStartTime: 0,
  roundDestroyed: 0,
  lastHistoryEntry: null,
  roundStats: {
    byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0 },
    killTimes: [],
    graph: [],
    misses: 0
  },
  settings: {
    spawnRate: 1.25,
    dropSpeed: 1.25,
    modes: {}
  },
  history: []
};

const colorLabels = {
  grey: 'Xám',
  green: 'Xanh lá',
  blue: 'Xanh biển',
  purple: 'Tím',
  red: 'Đỏ',
  gold: 'Vàng'
};

const modeGroups = [
  {
    key: 'addition', label: 'Phép Cộng', color: 'grey',
    options: ['Phép cộng từ 1 đến 3', 'Phép cộng từ 0 đến 5', 'Phép cộng có tổng lên đến 10', 'Phép cộng có tổng lên đến 15', 'Phép cộng có tổng lên đến 20', 'Cộng 3 số hạng, từ 0 đến 10', 'Cộng 3 số hạng, từ 0 đến 20', 'Cộng 2 số dương có 2 chữ số bất kỳ', 'Phép cộng tìm số còn thiếu (VD: 3 + x = 5)', 'Phép cộng lên đến 5 số hạng', 'Phép cộng có tổng lên đến 1000', 'Phép cộng nâng cao']
  },
  {
    key: 'subtraction', label: 'Phép Trừ', color: 'green',
    options: ['Phép trừ từ 0 đến 5', 'Phép trừ từ 0 đến 10', 'Phép trừ từ 0 đến 20 (dễ)', 'Phép trừ từ 0 đến 20', 'Phép cộng và trừ từ 0 đến 20', 'Phép trừ tìm số còn thiếu', 'Phép trừ 3 số hạng', 'Phép cộng và trừ 3 số hạng', 'Phép cộng và trừ lên đến 5 số hạng', 'Phép trừ từ 0 đến 100', 'Phép trừ từ 0 đến 1000', 'Phép trừ nâng cao']
  },
  {
    key: 'multiplication', label: 'Phép Nhân', color: 'blue',
    options: ['Bảng cửu chương từ 1 đến 5', 'Bảng cửu chương 6', 'Bảng cửu chương 7', 'Bảng cửu chương từ 0 đến 7', 'Bảng cửu chương 8', 'Bảng cửu chương 9', 'Bảng cửu chương 10', 'Bảng cửu chương từ 0 đến 10', 'Bảng cửu chương 2 và 3 (tìm số còn thiếu)', 'Bảng cửu chương 4 và 5 (tìm số còn thiếu)', 'Bảng cửu chương 6 và 7 (tìm số còn thiếu)', 'Bảng cửu chương 8 và 9 (tìm số còn thiếu)', 'Bảng cửu chương từ 0 đến 10 (tìm số còn thiếu)', 'Bảng nhân từ 11 đến 12', 'Bảng nhân từ 13 đến 15']
  },
  {
    key: 'division', label: 'Phép Chia', color: 'purple',
    options: ['Phép chia cho 2', 'Phép chia cho 3', 'Phép chia cho 4', 'Phép chia cho 5', 'Phép chia cho các số từ 1 đến 5', 'Phép chia cho 6', 'Phép chia cho 7', 'Phép chia cho 8', 'Phép chia cho 9', 'Phép chia cho 10', 'Phép chia cho các số từ 1 đến 10', 'Phép nhân và phép chia từ 1 đến 10', 'Phép chia cho các số từ 1 đến 10 (tìm số còn thiếu)', 'Phép chia cho 11 và 12', 'Phép chia cho các số từ 13 đến 15']
  },
  {
    key: 'integers', label: 'Số nguyên', color: 'red',
    options: ['Phép trừ với số âm ra kết quả dương', 'Cộng các số nguyên từ -10 đến 10', 'Cộng các số nguyên từ -20 đến 20', 'Trừ các số nguyên từ -10 đến 10', 'Trừ các số nguyên từ -20 đến 20', 'Cộng và trừ các số nguyên từ -10 đến 10 gồm 3 số hạng', 'Cộng và trừ các số nguyên lên đến 5 số hạng', 'Nhân các số nguyên từ -10 đến 10 (2 số cùng dấu)', 'Chia các số nguyên từ -10 đến 10 (cùng dấu)', 'Nhân và chia kết hợp lên đến 4 số nguyên']
  },
  {
    key: 'advanced', label: 'Nâng cao', color: 'red',
    options: ['Giai thừa (Giới hạn từ 0! đến 10!)', 'Căn bậc 2 (Giới hạn đáp án từ 0 đến 20)', 'Lũy thừa (Giới hạn cơ số từ -20 đến 20, mũ từ 0 đến 3)']
  }
];

const mathModes = modeGroups.flatMap((group) => group.options.map((label, index) => ({
  id: `${group.key}-${index + 1}`,
  group: group.key,
  groupLabel: group.label,
  color: group.color,
  index,
  label
})));

function createDefaultModeState() {
  return Object.fromEntries(mathModes.map((mode) => [mode.id, true]));
}

const scoreMap = {
  grey: 500,
  green: 1000,
  blue: 1500,
  purple: 2000,
  red: 5000,
  gold: 500
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

function saveProgress() {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
    level: state.level,
    exp: state.exp
  }));
}

function loadProgress() {
  const saved = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || 'null');
  if (!saved) return;

  state.level = Math.max(1, Number(saved.level) || 1);
  state.requiredExp = getRequiredExp(state.level);
  state.exp = clamp(Number(saved.exp) || 0, 0, state.requiredExp - 1);
}

function showGameScreen() {
  clearGame();
  state.playing = false;
  state.timeElapsed = 0;
  state.score = 0;
  state.lives = 5;
  loadProgress();
  state.droplets = [];
  state.answer = '';
  document.getElementById('gameBoard').innerHTML = '';
  updateInputDisplay();
  updateHUD();
  setScreen('game');
}

function clearInput() {
  state.answer = '';
  updateInputDisplay();
}

function appendInputValue(value) {
  if (!/^[0-9]$/.test(value)) return;
  const current = state.answer;
  const next = current === '0' ? value : `${current}${value}`;
  state.answer = next.slice(0, 7);
  updateInputDisplay();
}

function saveSettings() {
  const spawnRate = Number(document.getElementById('spawnRateInput').value || 1.25);
  const dropSpeed = Number(document.getElementById('dropSpeedInput').value || 1.25);
  state.settings.spawnRate = clamp(spawnRate, 0.5, 10);
  state.settings.dropSpeed = clamp(dropSpeed, 0.5, 10);
  state.settings.modes = {};
  document.querySelectorAll('.mode-toggle').forEach((toggle) => {
    state.settings.modes[toggle.dataset.mode] = toggle.checked;
  });
  state.spawnRate = Number(state.settings.spawnRate.toFixed(2));
  state.dropSpeed = Number(state.settings.dropSpeed.toFixed(2));
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  updateHUD();
  setScreen('menu');
}

function loadSettingsUI() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || 'null');
  if (saved) {
    state.settings.spawnRate = clamp(Number(saved.spawnRate) || 1.25, 0.5, 10);
    state.settings.dropSpeed = clamp(Number(saved.dropSpeed) || 1.25, 0.5, 10);
    state.settings.modes = { ...createDefaultModeState(), ...(saved.modes || {}) };
    state.spawnRate = Number(state.settings.spawnRate.toFixed(2));
    state.dropSpeed = Number(state.settings.dropSpeed.toFixed(2));
  }
  renderMathModes();
  document.getElementById('spawnRateInput').value = state.settings.spawnRate.toFixed(2);
  document.getElementById('dropSpeedInput').value = state.settings.dropSpeed.toFixed(2);
  document.querySelectorAll('.mode-toggle').forEach((toggle) => {
    toggle.checked = !!state.settings.modes[toggle.dataset.mode];
  });
}

function renderMathModes() {
  const container = document.getElementById('mathModes');
  if (!container) return;
  if (!Object.keys(state.settings.modes).length) state.settings.modes = createDefaultModeState();

  container.innerHTML = modeGroups.map((group) => `
    <section class="math-mode-group">
      <h3>${group.label}</h3>
      <div class="math-mode-options">
        ${group.options.map((label, index) => {
          const id = `${group.key}-${index + 1}`;
          return `<label class="math-mode-option"><input type="checkbox" class="mode-toggle" data-mode="${id}" ${state.settings.modes[id] !== false ? 'checked' : ''} /><span>${label}</span></label>`;
        }).join('')}
      </div>
    </section>
  `).join('');
}

function isModeEnabled(mode) {
  return state.settings.modes[mode.id] === true;
}

function factorial(num) {
  if (num < 0) return 0;
  let result = 1;
  for (let i = 2; i <= num; i += 1) result *= i;
  return result;
}

function makeAddition(terms, maxValue = 20) {
  const values = Array.from({ length: terms }, () => randomInt(0, maxValue));
  return { label: values.join(' + '), answer: values.reduce((sum, value) => sum + value, 0) };
}

function makeBoundedAddition(maxValue) {
  const first = randomInt(0, maxValue);
  const second = randomInt(0, maxValue - first);
  return { label: `${first} + ${second}`, answer: first + second };
}

function makeSubtraction(maxValue = 20, terms = 2) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const values = Array.from({ length: terms }, () => randomInt(0, maxValue));
    values.sort((a, b) => b - a);
    const answer = values.slice(1).reduce((result, value) => result - value, values[0]);
    if (answer >= 0) return { label: values.join(' - '), answer };
  }
  return { label: `${maxValue} - 0`, answer: maxValue };
}

function makeMultiplication(min, max) {
  const a = randomInt(min, max);
  const b = randomInt(min, max);
  return { label: `${a} × ${b}`, answer: a * b };
}

function makeDivision(minDivisor, maxDivisor) {
  const divisor = randomInt(minDivisor, maxDivisor);
  const quotient = randomInt(0, 20);
  return { label: `${divisor * quotient} ÷ ${divisor}`, answer: quotient };
}

function makeMissing(operation, maxValue) {
  const answer = operation === '÷' ? randomInt(1, Math.max(1, maxValue)) : randomInt(0, maxValue);
  const other = randomInt(0, maxValue);
  if (operation === '+') return { label: `${other} + x = ${other + answer}`, answer };
  if (operation === '-') return { label: `${answer + other} - x = ${other}`, answer };
  if (operation === '÷') return { label: `${other * answer} ÷ x = ${other}`, answer };
  return { label: `${other} × x = ${other * answer}`, answer };
}

function makeIntegerFormula(mode) {
  const range = mode.index === 2 || mode.index === 4 ? 20 : 10;
  const randomNonNegativeResult = (terms, allowSubtraction) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const values = Array.from({ length: terms }, () => randomInt(-range, range));
      const operators = values.slice(1).map(() => allowSubtraction && Math.random() < 0.5 ? '-' : '+');
      const answer = values.slice(1).reduce((result, value, index) => operators[index] === '-' ? result - value : result + value, values[0]);
      if (answer >= 0) return { label: `${values[0]} ${operators.map((operator, index) => `${operator} ${values[index + 1]}`).join(' ')}`, answer };
    }
    return { label: `${range} + 0`, answer: range };
  };

  if (mode.index === 0) {
    const positive = randomInt(0, range);
    const negative = -randomInt(1, range);
    return { label: `${positive} - (${negative})`, answer: positive - negative };
  }
  if (mode.index === 3 || mode.index === 4) {
    const first = randomInt(-range, range);
    const second = randomInt(-range, first);
    return { label: `${first} - (${second})`, answer: first - second };
  }
  if (mode.index === 7) {
    const first = randomInt(0, range);
    const second = randomInt(0, range);
    const sign = Math.random() < 0.5 ? '' : '-';
    return { label: `${sign}${first} × ${sign}${second}`, answer: first * second };
  }
  if (mode.index === 8) {
    const divisor = randomInt(1, range);
    const quotient = randomInt(0, range);
    const sign = Math.random() < 0.5 ? '' : '-';
    return { label: `${sign}${divisor * quotient} ÷ ${sign}${divisor}`, answer: quotient };
  }
  if (mode.index === 9) return randomNonNegativeResult(4, true);
  return randomNonNegativeResult(mode.index === 6 ? randomInt(3, 5) : mode.index === 5 ? 3 : 2, mode.index >= 5);
}

function buildNonNegativeFormula() {
  const enabled = mathModes.filter(isModeEnabled);
  if (!enabled.length) return { answer: 0, label: 'Bật ít nhất một chế độ', color: 'grey', isSpecial: false };

  const mode = randomChoice(enabled);
  let formula;
  if (mode.group === 'addition') {
    const limits = [3, 5, 10, 15, 20, 10, 20, 99, 20, 20, 250, 100];
    if (mode.index === 8) formula = makeMissing('+', 20);
    else if (mode.index === 5) formula = makeAddition(3, limits[mode.index]);
    else if (mode.index === 6) formula = makeAddition(3, limits[mode.index]);
    else if (mode.index === 9) formula = makeAddition(randomInt(3, 5), limits[mode.index]);
    else if (mode.index === 10) formula = makeAddition(2, limits[mode.index]);
    else if (mode.index === 11) formula = makeAddition(randomInt(2, 5), limits[mode.index]);
    else if (mode.index >= 2 && mode.index <= 4) formula = makeBoundedAddition(limits[mode.index]);
    else formula = makeAddition(2, limits[mode.index]);
  } else if (mode.group === 'subtraction') {
    const limits = [5, 10, 20, 20, 20, 20, 20, 20, 20, 100, 1000, 100];
    if (mode.index === 5) formula = makeMissing('-', 20);
    else formula = makeSubtraction(limits[mode.index], mode.index === 6 || mode.index === 7 ? 3 : mode.index === 8 ? randomInt(3, 5) : 2);
  } else if (mode.group === 'multiplication') {
    const ranges = [[1, 5], [6, 6], [7, 7], [0, 7], [8, 8], [9, 9], [10, 10], [0, 10], [2, 3], [4, 5], [6, 7], [8, 9], [0, 10], [11, 12], [13, 15]];
    if (mode.index >= 8 && mode.index <= 12) formula = makeMissing('×', ranges[mode.index][1]);
    else formula = makeMultiplication(...ranges[mode.index]);
  } else if (mode.group === 'division') {
    const ranges = [[2, 2], [3, 3], [4, 4], [5, 5], [1, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10], [1, 10], [1, 10], [1, 10], [11, 12], [13, 15]];
    if (mode.index === 12) formula = makeMissing('÷', ranges[mode.index][1]);
    else if (mode.index === 11) formula = Math.random() < 0.5 ? makeDivision(1, 10) : makeMultiplication(1, 10);
    else formula = makeDivision(...ranges[mode.index]);
  } else if (mode.group === 'integers') {
    formula = makeIntegerFormula(mode);
  } else {
    const value = randomInt(0, 10);
    if (mode.index === 0) formula = { label: `${value}!`, answer: factorial(value) };
    else if (mode.index === 1) { const root = randomInt(0, 20); formula = { label: `√${root ** 2}`, answer: root }; }
    else {
      let base = randomInt(-20, 20);
      const exponent = randomInt(0, 3);
      if (base < 0 && exponent % 2 === 1) base = Math.abs(base);
      formula = { label: `${base}^${exponent}`, answer: Math.pow(base, exponent) };
    }
  }

  const color = Math.random() < 0.18 ? 'gold' : mode.color;
  return { answer: clamp(Math.round(formula.answer), 0, 9999999), label: formula.label, color, isSpecial: color === 'gold' };
}

function spawnDroplet() {
  if (state.droplets.length >= MAX_DROPLETS) return;

  const { answer, label, color, isSpecial } = buildNonNegativeFormula();
  const board = document.getElementById('gameBoard');
  const left = randomInt(60, Math.max(70, state.boardWidth - 60));
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
  element.style.transform = `translate3d(${droplet.x}px, ${droplet.y}px, 0) translate(-50%, -50%)`;

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
  loadProgress();
  state.droplets = [];
  state.answer = '';
  updateInputDisplay();

  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  state.boardWidth = board.clientWidth || 500;
  state.boardHeight = board.clientHeight || 500;
  state.lastHudUpdate = 0;
  updateHUD();
  setScreen('game');

  const spawnIntervalMs = Math.max(330, 1000 / state.spawnRate);
  state.spawnTimer = setInterval(() => {
    if (state.playing) {
      if (state.droplets.length < MAX_DROPLETS) spawnDroplet();
    }
  }, spawnIntervalMs);

  const step = () => {
    if (!state.playing) return;
    const now = performance.now();
    state.timeElapsed = (now - state.roundStartTime) / 1000;
    if (now - state.lastHudUpdate >= 100) {
      updateHUD();
      state.lastHudUpdate = now;
    }
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
    byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0 },
    killTimes: [],
    graph: [],
    misses: 0
  };
}

function moveDroplets() {
  for (const droplet of state.droplets) {
    droplet.y += droplet.speed * 0.85 * (state.dropSpeed || 1);
    droplet.element.style.transform = `translate3d(${clamp(droplet.x, 35, state.boardWidth - 35)}px, ${droplet.y}px, 0) translate(-50%, -50%)`;

    if (droplet.y > state.boardHeight - 80) {
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
  saveProgress();
  updateHUD();
}

function activateSpecialDrop(drop) {
  const activeDrops = [...state.droplets];
  if (drop.color === 'gold') {
    const scoreGain = activeDrops.reduce((sum, item) => sum + (scoreMap[item.color] || 500), 0);
    activeDrops.forEach((item) => {
      state.roundStats.byColor[item.color] = (state.roundStats.byColor[item.color] || 0) + 1;
      item.element.remove();
    });
    state.roundDestroyed += activeDrops.length;
    state.roundStats.killTimes.push(state.timeElapsed);
    state.score += scoreGain;
    state.droplets = [];
    addExp(scoreGain);
    clearInput();
    updateHUD();
    return;
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
  if (!Number.isInteger(parsed) || parsed < 0) {
    clearInput();
    return;
  }

  const specialMatch = state.droplets.find((d) => d.isSpecial && d.answer === parsed);
  if (specialMatch) {
    activateSpecialDrop(specialMatch);
    return;
  }

  const matches = state.droplets.filter((d) => d.answer === parsed);
  if (matches.length > 0) {
    destroyDroplets(matches, 'answer');
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

function renderHistoryDetail(entry) {
  const detail = document.getElementById('historyDetail');
  if (!entry) {
    detail.innerHTML = '';
    return;
  }

  const rows = Object.entries(colorLabels).map(([key, label]) => `
    <div class="history-detail-row">
      <span>${label}</span>
      <strong>${entry.byColor[key] || 0}</strong>
    </div>
  `).join('');

  detail.innerHTML = `
    <div class="history-detail-card">
      <div class="history-detail-grid">
        <div><span>Point</span><strong>${entry.point}</strong></div>
        <div><span>Giọt phá</span><strong>${entry.destroyed}</strong></div>
        <div><span>Tốc độ nhanh nhất</span><strong>${entry.fastestRate.toFixed(2)}</strong></div>
        <div><span>Tốc độ trung bình</span><strong>${entry.avgRate.toFixed(2)}</strong></div>
      </div>
      <div class="history-detail-color-list">${rows}</div>
      <canvas class="history-detail-graph" width="380" height="140"></canvas>
    </div>
  `;

  const canvas = detail.querySelector('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = entry.graph || [];
  const maxValue = Math.max(1, ...data.map((p) => p.value));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = 14 + (index / Math.max(1, data.length - 1)) * (canvas.width - 28);
    const y = canvas.height - 16 - (point.value / maxValue) * (canvas.height - 28);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#8ee9ff';
  ctx.lineWidth = 2;
  ctx.stroke();
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
    renderHistoryDetail(null);
    return;
  }

  ordered.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>Điểm: ${entry.point} · ${new Date(entry.timestamp).toLocaleString()}</strong>
      <div>Giọt phá: ${entry.destroyed}</div>
      <div>Đánh giá: ${entry.fastestRate.toFixed(2)}/s nhanh nhất · ${entry.avgRate.toFixed(2)}/s trung bình</div>
    `;
    item.addEventListener('click', () => {
      state.lastHistoryEntry = entry;
      renderHistoryDetail(entry);
    });
    historyContainer.appendChild(item);
  });

  if (state.lastHistoryEntry) {
    const selected = ordered.find((entry) => entry.timestamp === state.lastHistoryEntry.timestamp) || ordered[0];
    renderHistoryDetail(selected);
  } else {
    renderHistoryDetail(ordered[0]);
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
  }, { point: 0, destroyed: 0, duration: 0, games: 0, byColor: { grey: 0, green: 0, blue: 0, purple: 0, red: 0, gold: 0 } });

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
      if (target === 'game') showGameScreen();
      else setScreen(target);
    });
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('settingsBackBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('historyBackBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('playAgainBtn').addEventListener('click', startGame);
  document.getElementById('endMenuBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('backToMenuBtn').addEventListener('click', () => setScreen('menu'));
  document.getElementById('clearAnswerBtn').addEventListener('click', () => {
    clearInput();
    document.getElementById('clearAnswerBtn').blur();
  });
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
  loadProgress();
  loadSettingsUI();
  renderHistory();
  setScreen('menu');
  updateHUD();
  bindEvents();
}

window.addEventListener('load', init);
