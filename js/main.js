import { EventBus } from './core/EventBus.js';
import { RNG } from './core/RNG.js';
import { Clock } from './core/Clock.js';
import { Sfx } from './core/Sfx.js';
import { createGameState, DAY_PHASES } from './core/GameState.js';
import { GameEngine } from './core/GameEngine.js';
import { World } from './world/World.js';
import { Renderer } from './render/Renderer.js';
import { products } from './data/products.js';
import { SaveSystem, AUTO_SLOT } from './systems/SaveSystem.js';
import { CustomerSystem } from './systems/CustomerSystem.js';
import { renderTitleScreen } from './ui/TitleScreen.js';
import { renderNewGameScreen } from './ui/NewGameScreen.js';
import { mountGameScreen } from './ui/GameUI.js';

const DEBUG = new URLSearchParams(location.search).has('debug');

const titleEl = document.getElementById('titleScreen');
const newGameEl = document.getElementById('newGameScreen');
const gameEl = document.getElementById('gameScreen');

let engine = null, world = null, renderer = null, sfx = null, gameApi = null;
let debugOn = DEBUG;
let rafId = null;
const clock = new Clock();

function showScreen(name) {
  titleEl.classList.toggle('hidden', name !== 'title');
  newGameEl.classList.toggle('hidden', name !== 'newgame');
  gameEl.classList.toggle('hidden', name !== 'game');
}

function bootTitle() {
  renderTitleScreen(titleEl, {
    onStart: () => showScreen('newgame') || mountNewGame(),
    onContinue: () => { const saved = SaveSystem.load(AUTO_SLOT); if (saved) startGame(saved); },
    getSettings: () => (engine ? engine.state.settings : { sound: true, music: true, vibration: true }),
    onSettingsChange: (s) => { if (engine) Object.assign(engine.state.settings, s); },
  });
  showScreen('title');
}

function mountNewGame() {
  renderNewGameScreen(newGameEl, {
    onConfirm: (name) => startGame(createGameState(name, products)),
    onBack: () => { showScreen('title'); bootTitle(); },
  });
}

function startGame(state) {
  const bus = new EventBus();
  const rng = new RNG();
  world = new World();
  engine = new GameEngine(state, world, bus, rng);
  renderer = new Renderer(document.createElement('canvas'));
  sfx = new Sfx(() => engine.state.settings);

  showScreen('game');
  gameApi = mountGameScreen(gameEl, engine, renderer, world, sfx, {
    onSave: () => SaveSystem.save(AUTO_SLOT, engine.state),
    onToTitle: () => { stopLoop(); SaveSystem.save(AUTO_SLOT, engine.state); showScreen('title'); bootTitle(); },
    gameOverHandlers: {
      onContinuePlay: () => { engine.state.gameOver = null; },
      onNewGamePlus: () => { stopLoop(); showScreen('newgame'); mountNewGame(); },
      onRestart: () => { stopLoop(); showScreen('newgame'); mountNewGame(); },
      onToTitle: () => { stopLoop(); showScreen('title'); bootTitle(); },
    },
  });

  if (state.phase === DAY_PHASES.PREP && !state.history.length && state.day === 1 && !state.weather) {
    engine.dispatch({ type: 'START_DAY' });
  } else if (state.phase === DAY_PHASES.REPORT && state.history.length) {
    engine.bus.emit('day:report', state.history[0]);
  }
  startLoop();
}

function startLoop() {
  clock.resume();
  const frame = (ts) => {
    const dt = clock.tick(ts);
    engine.update(dt);
    const fps = dt > 0 ? 1 / dt : 0;
    gameApi.renderFrame(fps, debugOn, dt);
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}
function stopLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; }

window.addEventListener('keydown', (e) => {
  if (!engine) return;
  if (e.key === '`') { debugOn = !debugOn; return; }
  if (!debugOn) return;
  if (e.key === 'F1') { engine.state.day += 1; }
  if (e.key === 'F2') { engine.state.money += 1_000_000; }
  if (e.key === 'F3') { engine.state.reputation = Math.min(100, engine.state.reputation + 10); }
  if (e.key === 'F4') { if (engine.state.phase === DAY_PHASES.OPEN) CustomerSystem.spawn(engine.state, engine.rng); }
  if (e.key === 'F5') { engine.state.activeEvent = null; engine.dispatch({ type: 'START_DAY' }); }
  if (e.key === 'F6') { engine.dispatch({ type: 'CLOSE_STORE' }); }
});

window.addEventListener('beforeunload', () => { if (engine) SaveSystem.save(AUTO_SLOT, engine.state); });

bootTitle();
