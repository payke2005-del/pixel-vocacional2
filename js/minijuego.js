// ==========================================================================
// MINIJUEGO: ATRAPA EL BUG (Carrera de Informática)
// ==========================================================================

// --- CONFIGURACIÓN ---
const MINIGAME_TIME_LIMIT = 20;      // segundos
const MINIGAME_SPAWN_MS = 500;       // cada cuánto aparece un emoji
const MINIGAME_EMOJI_MS = 1000;      // cuánto dura visible el emoji
const MINIGAME_SCORE_WIN = 50;       // puntos para desbloquear logro

// --- ESTADO ---
let minigameTimerInterval = null;
let minigameSpawnInterval = null;
let minigameTimeLeft = MINIGAME_TIME_LIMIT;
let minigameScore = 0;
let minigameRunning = false;

// --- REFERENCIAS DOM ---
const timerEl = document.getElementById('minigame-timer');
const scoreEl = document.getElementById('minigame-score');
const areaEl = document.getElementById('minigame-area');
const endMsgEl = document.getElementById('minigame-end-message');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('btn-start-minigame');
const exitBtn = document.getElementById('btn-exit-minigame');

// --- FUNCIONES ---

function startGame() {
  if (minigameRunning) return;

  minigameRunning = true;
  minigameTimeLeft = MINIGAME_TIME_LIMIT;
  minigameScore = 0;

  timerEl.textContent = minigameTimeLeft;
  scoreEl.textContent = minigameScore;
  areaEl.innerHTML = '';
  endMsgEl.classList.add('hidden');

  startBtn.classList.add('hidden');
  exitBtn.classList.add('hidden');

  // Temporizador regresivo (20 segundos)
  minigameTimerInterval = setInterval(() => {
    minigameTimeLeft--;
    timerEl.textContent = minigameTimeLeft;
    if (minigameTimeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Spawn de emojis cada 500ms
  minigameSpawnInterval = setInterval(spawnEmoji, MINIGAME_SPAWN_MS);
  spawnEmoji(); // primero al instante
}

function getRandomPosition() {
  const maxX = Math.max(0, areaEl.clientWidth - 40);
  const maxY = Math.max(0, areaEl.clientHeight - 40);
  return {
    x: Math.floor(Math.random() * maxX),
    y: Math.floor(Math.random() * maxY)
  };
}

function spawnEmoji() {
  if (!minigameRunning) return;

  const isBug = Math.random() < 0.7;
  const emoji = isBug ? '🐛' : '📁';
  const { x, y } = getRandomPosition();

  const item = document.createElement('div');
  item.className = `minigame-item ${isBug ? 'bug' : 'file'}`;
  item.textContent = emoji;
  item.style.left = x + 'px';
  item.style.top = y + 'px';

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    handleItemClick(item, isBug);
  });

  areaEl.appendChild(item);

  // Desaparece solo después de 1 segundo
  setTimeout(() => {
    if (item.parentElement === areaEl) {
      areaEl.removeChild(item);
    }
  }, MINIGAME_EMOJI_MS);
}

function handleItemClick(item, isBug) {
  if (!minigameRunning) return;
  areaEl.removeChild(item);

  if (isBug) {
    minigameScore += 10;
    scoreEl.textContent = minigameScore;
    if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
  } else {
    minigameScore = Math.max(0, minigameScore - 5);
    scoreEl.textContent = minigameScore;
    showErrorFeedback(item.style.left, item.style.top);
    if (typeof SoundSystem !== 'undefined') SoundSystem.play('error');
  }
}

function showErrorFeedback(left, top) {
  const feedback = document.createElement('div');
  feedback.className = 'minigame-item error';
  feedback.textContent = '-5';
  feedback.style.left = left;
  feedback.style.top = top;
  feedback.style.fontSize = '1.5rem';
  feedback.style.cursor = 'default';
  areaEl.appendChild(feedback);
  setTimeout(() => {
    if (feedback.parentElement === areaEl) areaEl.removeChild(feedback);
  }, 1000);
}

function endGame() {
  minigameRunning = false;
  clearInterval(minigameTimerInterval);
  clearInterval(minigameSpawnInterval);

  // Limpiar emojis restantes
  areaEl.innerHTML = '';

  // Mostrar resultado final
  finalScoreEl.textContent = minigameScore;
  endMsgEl.classList.remove('hidden');

  startBtn.classList.remove('hidden');
  exitBtn.classList.remove('hidden');

  // Logro: superar 50 puntos
  if (minigameScore > MINIGAME_SCORE_WIN) {
    if (typeof AchievementsSystem !== 'undefined'
        && typeof AchievementsSystem.unlock === 'function') {
      AchievementsSystem.unlock('informatico_pro');
    }
  }
}

// --- CONEXIÓN DE BOTONES ---
function initMinigameButtons() {
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof SoundSystem !== 'undefined') SoundSystem.play('click');
      startGame();
    });
  }
  // El botón de salir se conecta desde app.js para usar showView() del closure.
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMinigameButtons);
} else {
  initMinigameButtons();
}
