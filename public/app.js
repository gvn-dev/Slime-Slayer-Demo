(() => {
  'use strict';

  const HEROES = [
    { id: 'Ravela', role: 'Glass cannon · single-target archer', flavor: 'A deadly mark turns one clean shot into a finishing blow.', color: '#d8c7ef', art: 'Ravela character art.png' },
    { id: 'Fjord', role: 'Armored tank · close-range cleave', flavor: 'Slow, sturdy, and happiest surrounded by enemies.', color: '#ec9b4b', art: 'Fjord character art.png' },
    { id: 'Aram', role: 'Balanced duelist · parry and counter', flavor: 'A measured blade with a chance to stun attackers.', color: '#a4c5a1', art: 'Aram character art.png' },
    { id: 'Gavrilta', role: 'Control mage · poison and roots', flavor: 'Green magic slows a crowd and wears it down over time.', color: '#82d66e', art: 'Gavrilla character art.png' }
  ];
  const UPGRADES = [
    { id: 'power', icon: '⚔', name: 'Keen Edge', text: '+20% attack damage' },
    { id: 'vigor', icon: '✚', name: 'Coliseum Grit', text: '+20% max health and heal' },
    { id: 'swift', icon: '➤', name: 'Fleet Step', text: '+13% movement speed' },
    { id: 'focus', icon: '✦', name: 'Deep Focus', text: 'Abilities recharge 14% faster' }
  ];
  const MOVEMENT_KEY_CODES = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd' };
  const app = document.querySelector('#app');
  const toastNode = document.querySelector('#toast');
  const MAX_CANVAS_DPR = 1.25;
  const SNAPSHOT_DELAY_MS = 100;
  const storedPlayer = localStorage.getItem('slime-slayer-player-id');
  const playerId = storedPlayer || (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  localStorage.setItem('slime-slayer-player-id', playerId);
  let currentRoom = null;
  let currentScreen = 'menu';
  let selectedHero = null;
  let playerName = localStorage.getItem('slime-slayer-name') || '';
  let roomCode = localStorage.getItem('slime-slayer-room') || '';
  let lobbyKey = '';
  let pendingLobbyHeroChoice = null;
  let lobbyHeroSyncing = false;
  let lobbyHeroChoiceVersion = 0;
  let lobbyHeroActionAckAt = 0;
  let pollHandle = null;
  let drawHandle = null;
  let polling = false;
  let toastHandle = null;
  let volume = Number(localStorage.getItem('slime-slayer-volume') ?? 0.25);
  let keys = new Set();
  let moveVector = { x: 0, y: 0 };
  let smoothedMoveVector = { x: 0, y: 0 };
  let lastMovementUpdateAt = 0;
  let lastMoveAt = 0;
  let inputErrorShown = false;
  let legacyInputFallback = false;
  let soundContext = null;
  let lastSeenPhase = '';
  let snapshots = [];
  let canvasResizeObserver = null;
  let lastMinimapRenderAt = 0;
  let lastPartyStatusMarkup = '';
  let minimapDots = new Map();
  let overlayStateKey = '';
  const slimeSpriteCache = new Map();

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function hero(id) { return HEROES.find(h => h.id === id) || HEROES[0]; }
  function getSelf() { return currentRoom?.players?.find(p => p.id === playerId); }
  function showToast(message) {
    toastNode.textContent = message;
    toastNode.classList.add('show');
    clearTimeout(toastHandle);
    toastHandle = setTimeout(() => toastNode.classList.remove('show'), 2600);
  }
  async function api(url, body, method = 'POST') {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    let payload = {};
    try { payload = await response.json(); } catch { /* server returned no json */ }
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }
  function toastError(error) { showToast(error?.message || 'Something went wrong. Try again.'); }
  function persistName(value) {
    playerName = value.trim().slice(0, 18);
    localStorage.setItem('slime-slayer-name', playerName);
  }
  function setHero(value) {
    selectedHero = value;
  }
  function gearButton() { return '<button class="gear-btn" type="button" title="Settings and controls" aria-label="Settings and controls" data-action="settings">⚙</button>'; }
  function sound(frequency = 440, duration = 0.08, type = 'sine') {
    if (volume <= 0) return;
    try {
      soundContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = soundContext.createOscillator();
      const gain = soundContext.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(Math.max(0.001, volume * 0.07), soundContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + duration);
      osc.connect(gain); gain.connect(soundContext.destination);
      osc.start(); osc.stop(soundContext.currentTime + duration);
    } catch { /* audio is an optional browser feature */ }
  }
  function setScreen(name) {
    currentScreen = name;
    if (name !== 'game') stopDrawing();
  }

  function renderTitleScreen() {
    setScreen('title');
    app.innerHTML = `<section class="screen title-screen" aria-label="Slime Slayer title screen">
      <div class="title-art-placeholder" role="img" aria-label="Placeholder for title screen background art"></div>
      <div class="title-screen-content"><h1>Slime Slayer</h1><button class="press-start" type="button">Press to start</button></div>
    </section>`;
    app.querySelector('.title-screen').addEventListener('click', renderMenu);
  }

  function renderMenu() {
    setScreen('menu');
    app.innerHTML = `
      <section class="screen menu-screen intro-screen">
        ${gearButton()}
        <div class="menu-wrap">
          <header class="brand">
            <div class="brand-mark">✦</div>
            <h1>SLIME SLAYER</h1>
            <div class="subtitle">Coliseum Run · Roguelike</div>
          </header>
          <p class="intro">Hold the old arena against ten waves of slime. Choose a champion, survive together, and grow stronger after every round.</p>
          <div class="mode-select">
            <button class="mode-card" data-action="solo"><span class="mode-symbol">⚔</span><span class="mode-title">Solo</span><span class="mode-caption">Singleplayer</span></button>
            <button class="mode-card" data-action="party"><span class="mode-symbol">♟♟</span><span class="mode-title">Party</span><span class="mode-caption">Multiplayer</span></button>
          </div>
          <footer class="menu-foot">Up to four champions · No friendly fire · WASD / arrows to move · E to use your ability</footer>
        </div>
      </section>`;
    app.querySelector('[data-action="solo"]').addEventListener('click', () => { setHero(null); renderSoloSelect(); });
    app.querySelector('[data-action="party"]').addEventListener('click', renderPartyChoice);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
  }

  function renderPartyChoice() {
    setScreen('party-choice');
    app.innerHTML = `<section class="screen menu-screen sub-screen">${gearButton()}<div class="menu-wrap">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>PARTY</h1><div class="subtitle">Play together</div></header>
      <p class="intro">Create a party and invite friends with its room code, or join a party that is already waiting.</p>
      <div class="mode-select party-choice-grid"><button class="mode-card" data-action="create"><span class="mode-symbol">＋</span><span class="mode-title">Create a party</span><span class="mode-caption">Name your party and invite others</span></button>
      <button class="mode-card" data-action="join"><span class="mode-symbol">⌕</span><span class="mode-title">Join a party</span><span class="mode-caption">Enter a friend's five-character code</span></button></div>
    </div></section>`;
    app.querySelector('[data-action="back"]').addEventListener('click', renderMenu);
    app.querySelector('[data-action="create"]').addEventListener('click', () => showPartyDialog('create'));
    app.querySelector('[data-action="join"]').addEventListener('click', () => showPartyDialog('join'));
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
  }

  function showPartyDialog(kind) {
    const creating = kind === 'create';
    const modal = document.createElement('div');
    modal.className = 'overlay dialog-overlay';
    modal.id = 'party-dialog';
    modal.innerHTML = `<form class="overlay-card party-dialog" id="party-dialog-form"><div class="eyebrow">${creating ? 'New party' : 'Join a party'}</div>
      <h2>${creating ? 'Name your party' : 'Enter the party code'}</h2>
      <p class="small muted">${creating ? 'Your friends can join with the code shown in the lobby.' : 'Ask the party host for the five-character room code.'}</p>
      <label class="dialog-label" for="party-dialog-input">${creating ? 'Party name' : 'Party code'}</label>
      <input class="text-input dialog-input ${creating ? '' : 'code-input'}" id="party-dialog-input" maxlength="${creating ? 28 : 5}" placeholder="${creating ? 'The Slime Slayers' : 'ABCDE'}" value="${creating ? '' : esc(roomCode)}" ${creating ? 'required' : 'required autocomplete="off"'}>
      <div class="dialog-actions"><button class="btn quiet" type="button" data-action="cancel">Cancel</button><button class="btn" type="submit">${creating ? 'Create party' : 'Join party'}</button></div></form>`;
    document.body.append(modal);
    const input = modal.querySelector('input');
    input.focus();
    if (!creating) input.addEventListener('input', () => { input.value = input.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5); });
    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
    modal.addEventListener('keydown', event => { if (event.key === 'Escape') modal.remove(); });
    modal.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) { input.focus(); return; }
      modal.remove();
      if (creating) createRoom('coop', value);
      else joinRoom(value);
    });
  }

  function renderSoloSelect() {
    setScreen('solo-select');
    app.innerHTML = `<section class="screen solo-screen">${gearButton()}<div class="solo-wrap">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>CHOOSE YOUR HERO</h1><div class="subtitle">Solo challenge</div></header>
      <p class="intro">Pick a champion for your ten-wave run. Each hero brings a different weapon and ability.</p>
      <div class="solo-hero-grid">${HEROES.map(h => heroCard(h, false)).join('')}</div>
      <div class="solo-specials"><button class="special-choice ${selectedHero === 'Random' ? 'selected' : ''}" data-select-hero="Random"><span class="random-mark">?</span><span><strong>Random</strong><small>Let fate choose your champion</small></span></button></div>
      <div class="solo-bottom"><label class="sr-only" for="solo-player-name">Your name</label><input id="solo-player-name" class="text-input solo-name" maxlength="18" placeholder="Your name" value="${esc(playerName)}">
      <button class="btn" data-action="begin" ${selectedHero ? '' : 'disabled'}>Enter the arena</button></div>
    </div></section>`;
    app.querySelector('[data-action="back"]').addEventListener('click', renderMenu);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
    app.querySelector('#solo-player-name').addEventListener('input', event => persistName(event.target.value));
    app.querySelectorAll('[data-select-hero]').forEach(button => button.addEventListener('click', () => { setHero(button.dataset.selectHero || null); renderSoloSelectKeepName(); }));
    app.querySelector('[data-action="begin"]').addEventListener('click', () => {
      if (!selectedHero) return;
      persistName(app.querySelector('#solo-player-name')?.value || playerName);
      createRoom('solo');
    });
  }
  function heroCard(h, compact = false, selected = selectedHero === h.id) {
    return `<button class="hero-card ${compact ? 'compact-hero-card' : ''} ${selected ? 'selected' : ''}" data-select-hero="${h.id}" aria-pressed="${selected}">
      <div class="portrait"><img src="/art/${encodeURIComponent(h.art)}" alt="${h.id} character art"></div>
      <div class="hero-meta"><div class="hero-name"><span>${h.id}</span><span style="color:${h.color}">✦</span></div><div class="hero-role">${h.role}</div><div class="hero-flair">${h.flavor}</div></div></button>`;
  }
  function renderSoloSelectKeepName() {
    const name = app.querySelector('#solo-player-name')?.value || playerName;
    persistName(name);
    renderSoloSelect();
  }

  async function createRoom(mode, partyName = '') {
    persistName(app.querySelector('#solo-player-name')?.value || playerName);
    try {
      const result = await api('/api/rooms', { playerId, name: playerName, hero: mode === 'solo' ? selectedHero : null, partyName, mode });
      currentRoom = result.room;
      roomCode = currentRoom.code;
      localStorage.setItem('slime-slayer-room', roomCode);
      startPolling();
      if (mode === 'solo') {
        await act('start');
      } else renderLobby(true);
    } catch (error) { toastError(error); }
  }
  async function joinRoom(code) {
    const normalized = String(code || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);
    if (normalized.length !== 5) { showToast('Enter the five-character room code.'); return; }
    try {
      const result = await api(`/api/rooms/${normalized}/join`, { playerId, name: playerName, hero: null });
      currentRoom = result.room;
      roomCode = currentRoom.code;
      localStorage.setItem('slime-slayer-room', roomCode);
      startPolling();
      renderLobby(true);
    } catch (error) { toastError(error); }
  }
  async function act(action, value) {
    if (!roomCode) return;
    try {
      const result = await api(`/api/rooms/${roomCode}/action`, { playerId, action, value });
      if (result.room) acceptRoom(result.room);
      return result;
    } catch (error) { if (action !== 'move') toastError(error); throw error; }
  }
  function startPolling() {
    clearInterval(pollHandle);
    pollHandle = setInterval(poll, 100);
    poll();
  }
  async function poll() {
    if (polling || !roomCode || !playerId) return;
    polling = true;
    const pollStartedAt = performance.now();
    try {
      const result = await api(`/api/rooms/${roomCode}?playerId=${encodeURIComponent(playerId)}`, null, 'GET');
      // A GET that began before our character action was acknowledged may contain
      // the previous hero. Keep the immediate local choice until a later GET sees it.
      const preserveLobbyHero = currentScreen === 'lobby' && pollStartedAt < lobbyHeroActionAckAt;
      acceptRoom(result.room, preserveLobbyHero);
    } catch (error) {
      if (currentScreen === 'quitting') return;
      clearInterval(pollHandle);
      if (currentScreen !== 'menu') { localStorage.removeItem('slime-slayer-room'); roomCode = ''; currentRoom = null; renderMenu(); }
      showToast(error.message || 'Room connection lost.');
    } finally { polling = false; }
  }
  function acceptRoom(room, preserveLobbyHero = false) {
    const previousStatus = currentRoom?.status;
    const previousPhase = currentRoom?.game?.phase;
    const previousWave = currentRoom?.game?.wave;
    if ((pendingLobbyHeroChoice || preserveLobbyHero) && room.status === 'lobby') {
      const optimisticChoice = pendingLobbyHeroChoice ? pendingLobbyHeroChoice.choice : getSelf()?.hero;
      room = { ...room, players: room.players.map(player => player.id === playerId
        ? { ...player, hero: optimisticChoice, ready: false }
        : player) };
    }
    const newWave = room.status === 'playing' && room.game?.phase === 'wave'
      && (previousStatus !== 'playing' || previousPhase !== 'wave' || previousWave !== room.game.wave);
    if (newWave) {
      snapshots = [];
      lastMinimapRenderAt = 0;
    }
    recordSnapshot(room);
    currentRoom = room;
    if (room.status === 'playing') {
      if (currentScreen !== 'game') enterGame();
      else updateGameUI();
    } else if (room.status === 'finished') {
      if (currentScreen !== 'game') enterGame();
      updateGameUI();
      if (previousStatus !== 'finished') sound(room.game?.result === 'won' ? 660 : 180, .32, 'triangle');
    } else if (currentScreen === 'lobby') {
      updateLobby();
    }
    const phase = room.game?.phase || '';
    if (phase && phase !== previousPhase && phase === 'upgrade') sound(590, .12, 'triangle');
  }
  function recordSnapshot(room) {
    const game = room.game;
    snapshots.push({
      at: performance.now(), room,
      players: new Map((room.players || []).map(player => [player.id, player])),
      enemies: new Map((game?.enemies || []).map(enemy => [enemy.id, enemy])),
      projectiles: new Map((game?.projectiles || []).map(projectile => [projectile.id, projectile]))
    });
    if (snapshots.length > 8) snapshots.shift();
  }
  function renderFrame() {
    if (!snapshots.length) return { room: currentRoom, before: null, alpha: 1 };
    const target = performance.now() - SNAPSHOT_DELAY_MS;
    let before = snapshots[0];
    let after = snapshots[snapshots.length - 1];
    if (target < before.at) after = before;
    else {
      for (let i = 1; i < snapshots.length; i++) {
        if (snapshots[i].at >= target) {
          before = snapshots[i - 1];
          after = snapshots[i];
          break;
        }
        before = snapshots[i];
      }
    }
    const alpha = after.at > before.at ? Math.max(0, Math.min(1, (target - before.at) / (after.at - before.at))) : 1;
    return { room: after.room, before, alpha };
  }
  function renderLobby(initial = false) {
    setScreen('lobby');
    lobbyKey = '';
    app.innerHTML = `<section class="screen lobby-screen">${gearButton()}<div class="lobby-panel" id="lobby-panel"></div></section>`;
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
    updateLobby(true);
  }
  function lobbySignature() {
    if (!currentRoom) return '';
    return JSON.stringify({ code: currentRoom.code, status: currentRoom.status, host: currentRoom.hostId,
      players: currentRoom.players.map(p => [p.id, p.name, p.hero, p.ready, p.online]) });
  }
  function updateLobby(force = false) {
    if (!currentRoom || currentScreen !== 'lobby') return;
    const signature = lobbySignature();
    if (!force && signature === lobbyKey) return;
    lobbyKey = signature;
    const self = getSelf();
    const isHost = currentRoom.hostId === playerId;
    const panel = document.querySelector('#lobby-panel');
    if (!panel) return;
    const slots = Array.from({ length: 4 }, (_, index) => {
      const p = currentRoom.players[index];
      if (!p) return `<article class="party-slot vacant-slot"><div class="slot-heading"><span>PLAYER ${index + 1}</span><span>OPEN</span></div><div class="slot-portrait empty-portrait"><span>＋</span></div><div class="vacant-title">Open seat</div><div class="vacant-copy">Share your party code<br>to invite a player</div><div class="slot-status">Waiting to join</div></article>`;
      const isSelf = p.id === playerId;
      const h = HEROES.find(character => character.id === p.hero);
      const heroFace = h
        ? `<img class="slot-portrait" src="/art/${encodeURIComponent(h.art)}" alt="${esc(h.id)} character art">`
        : `<div class="slot-portrait empty-portrait ${p.hero === 'Random' ? 'random-portrait' : ''}"><span>${p.hero === 'Random' ? '?' : '＋'}</span></div>`;
      const nameControl = isSelf
        ? `<label class="name-input-label" for="lobby-player-name">Your name</label><input id="lobby-player-name" class="text-input lobby-name-input" maxlength="18" value="${esc(p.name)}" aria-label="Your player name">`
        : `<div class="slot-player-name">${esc(p.name)}</div>`;
      let selector = '';
      if (isSelf) {
        selector = `<div class="character-selector">
          <button class="character-arrow" type="button" data-step="-1" title="Previous character" aria-label="Previous character">←</button>
          <div class="character-current"><strong>${p.hero === 'Random' ? 'Random' : h?.id || 'Choose a character'}</strong><span>${h?.role || (p.hero === 'Random' ? 'A different available hero each run' : 'Use the arrows to browse heroes')}</span></div>
          <button class="character-arrow" type="button" data-step="1" title="Next character" aria-label="Next character">→</button>
        </div>`;
      } else {
        selector = `<div class="other-player-hero">${h ? `${esc(h.id)} · ${esc(h.role)}` : p.hero === 'Random' ? 'Random hero' : 'Choosing a character'}</div>`;
      }
      return `<article class="party-slot ${isSelf ? 'own-party-slot' : ''} ${p.ready ? 'player-ready' : ''}">
        <div class="slot-heading"><span>PLAYER ${index + 1}</span><span>${isSelf ? (p.id === currentRoom.hostId ? 'YOU · HOST' : 'YOU') : p.id === currentRoom.hostId ? 'HOST' : 'PARTY'}</span></div>
        ${heroFace}${selector}${nameControl}
        <div class="slot-status ${p.ready ? 'ready' : ''}">${p.ready ? 'READY' : p.online ? 'Not ready' : 'Reconnecting…'}</div>
      </article>`;
    }).join('');
    const onlinePlayers = currentRoom.players.filter(p => p.online);
    const canStart = onlinePlayers.length > 0 && onlinePlayers.every(p => p.ready && p.hero);
    const nameEditing = document.activeElement?.id === 'lobby-player-name';
    const nameSelection = nameEditing ? document.activeElement.selectionStart : null;
    panel.innerHTML = `
      <div class="eyebrow" style="text-align:center">YOUR PARTY</div>
      <h1 class="lobby-title">${esc(currentRoom.partyName || 'Gather your champions')}</h1>
      <div class="party-code-bar"><div><div class="room-code-label">Invite friends with this code</div><div class="room-code">${currentRoom.code}</div></div><button class="btn quiet" data-action="copy">Copy code</button></div>
      <div class="party-progress"><span>${currentRoom.players.length}/4 joined</span><span>Choose a hero and ready up</span></div>
      <div class="party-slot-grid">${slots}</div>
      <div class="lobby-actions"><span class="lobby-note">${isHost ? 'The host can start once everyone online is ready.' : 'The host will start the run when the party is ready.'}</span>
        <div class="lobby-action-buttons"><button class="btn quiet" data-action="leave">Leave party</button><button class="btn secondary" data-action="ready" ${(HEROES.some(character => character.id === self?.hero) || self?.hero === 'Random') ? '' : 'disabled'}>${self?.ready ? 'Cancel ready' : 'Ready up'}</button>${isHost ? `<button class="btn" data-action="start" ${canStart ? '' : 'disabled'}>Start the run</button>` : ''}</div>
      </div>`;
    panel.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => stepLobbyCharacter(Number(button.dataset.step))));
    panel.querySelector('[data-action="copy"]').addEventListener('click', copyCode);
    panel.querySelector('[data-action="ready"]').addEventListener('click', () => act('ready', !self?.ready));
    panel.querySelector('[data-action="leave"]').addEventListener('click', leaveRoom);
    panel.querySelector('[data-action="start"]')?.addEventListener('click', async () => { try { await act('start'); } catch { /* inline toast already shown */ } });
    const nameInput = panel.querySelector('#lobby-player-name');
    nameInput?.addEventListener('input', event => persistName(event.target.value));
    nameInput?.addEventListener('change', event => act('name', event.target.value));
    nameInput?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.target.blur(); } });
    if (nameEditing && nameInput) { nameInput.focus(); if (nameSelection != null) nameInput.setSelectionRange(nameSelection, nameSelection); }
  }
  function updateLocalLobbyHeroSelection() {
    const self = getSelf();
    const card = document.querySelector('#lobby-panel .own-party-slot');
    if (!self || !card) return;
    const selected = HEROES.find(character => character.id === self.hero);
    const portrait = card.querySelector('.slot-portrait');
    if (portrait) {
      portrait.outerHTML = selected
        ? `<img class="slot-portrait" src="/art/${encodeURIComponent(selected.art)}" alt="${esc(selected.id)} character art">`
        : `<div class="slot-portrait empty-portrait ${self.hero === 'Random' ? 'random-portrait' : ''}"><span>${self.hero === 'Random' ? '?' : '＋'}</span></div>`;
    }
    const title = card.querySelector('.character-current strong');
    const description = card.querySelector('.character-current span');
    if (title) title.textContent = selected?.id || (self.hero === 'Random' ? 'Random' : 'Choose a character');
    if (description) description.textContent = selected?.role || (self.hero === 'Random' ? 'A different available hero each run' : 'Use the arrows to browse heroes');
    card.classList.toggle('player-ready', Boolean(self.ready));
    const status = card.querySelector('.slot-status');
    if (status) {
      status.textContent = self.ready ? 'READY' : self.online ? 'Not ready' : 'Reconnecting…';
      status.classList.toggle('ready', Boolean(self.ready));
    }
    const readyButton = document.querySelector('#lobby-panel [data-action="ready"]');
    if (readyButton) {
      readyButton.disabled = !(selected || self.hero === 'Random');
      readyButton.textContent = self.ready ? 'Cancel ready' : 'Ready up';
    }
    const startButton = document.querySelector('#lobby-panel [data-action="start"]');
    if (startButton && !self.ready) startButton.disabled = true;
    lobbyKey = lobbySignature();
  }
  async function stepLobbyCharacter(direction) {
    if (!currentRoom) return;
    const currentPlayer = getSelf();
    if (!currentPlayer) { showToast('Your player slot is reconnecting. Please wait a moment.'); return; }
    const options = [...HEROES.map(character => character.id), 'Random'];
    let index = options.indexOf(currentPlayer.hero);
    // The initial blank slot is only an entry state; it is not repeated in the
    // carousel, so cycling never shows a second "Choose a character" option.
    if (index < 0) index = direction < 0 ? 0 : -1;
    const unavailable = new Set(currentRoom.players.filter(other => other.id !== playerId).map(other => other.hero).filter(Boolean));
    let nextChoice;
    for (let attempt = 0; attempt < options.length; attempt++) {
      index = (index + direction + options.length) % options.length;
      const choice = options[index];
      if (choice === 'Random' || !unavailable.has(choice)) { nextChoice = choice; break; }
    }
    if (nextChoice === undefined) return;

    pendingLobbyHeroChoice = { choice: nextChoice, version: ++lobbyHeroChoiceVersion };
    currentRoom = { ...currentRoom, players: currentRoom.players.map(player => player.id === playerId
      ? { ...player, hero: nextChoice, ready: false }
      : player) };
    updateLocalLobbyHeroSelection();
    syncLobbyHeroChoice();
  }
  async function syncLobbyHeroChoice() {
    if (lobbyHeroSyncing) return;
    lobbyHeroSyncing = true;
    while (pendingLobbyHeroChoice) {
      const requested = pendingLobbyHeroChoice;
      try {
        await act('character', requested.choice);
        if (pendingLobbyHeroChoice?.version === requested.version) {
          lobbyHeroActionAckAt = performance.now();
          pendingLobbyHeroChoice = null;
        }
      } catch {
        if (pendingLobbyHeroChoice?.version === requested.version) {
          pendingLobbyHeroChoice = null;
          setTimeout(poll, 0);
        }
      }
    }
    lobbyHeroSyncing = false;
    updateLobby();
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(currentRoom.code); showToast(`Room code ${currentRoom.code} copied.`); }
    catch { showToast(`Share room code: ${currentRoom.code}`); }
  }
  async function leaveRoom() {
    try { await act('leave'); } catch { /* room might already be gone */ }
    clearInterval(pollHandle);
    roomCode = ''; currentRoom = null;
    localStorage.removeItem('slime-slayer-room');
    renderMenu();
  }

  async function quitGame() {
    document.querySelector('#modal-root')?.remove();
    document.querySelector('#quit-confirm')?.remove();
    clearInterval(pollHandle);
    pollHandle = null;
    setScreen('quitting');
    keys.clear();
    moveVector = { x: 0, y: 0 };
    smoothedMoveVector = { x: 0, y: 0 };
    try { await act('leave'); } catch { /* Clear the local run even if the room has already expired. */ }
    snapshots = [];
    roomCode = '';
    currentRoom = null;
    localStorage.removeItem('slime-slayer-room');
    renderTitleScreen();
  }

  function enterGame() {
    if (!currentRoom) return;
    setScreen('game');
    smoothedMoveVector = { x: 0, y: 0 };
    lastMovementUpdateAt = performance.now();
    overlayStateKey = '';
    lastPartyStatusMarkup = '';
    minimapDots = new Map();
    lastSeenPhase = currentRoom.game?.phase || '';
    app.innerHTML = `
      <section class="game-screen">
        <header class="game-topbar">
          <div class="game-brand">SLIME SLAYER</div>
          <div class="wave-block"><div class="wave-label">Coliseum run</div><div class="wave-value" id="wave-label">Wave 1 / 10</div></div>
          <div class="progress-wrap"><div class="progress-label"><span id="progress-copy">The slimes are gathering</span><span id="enemy-count">0 enemies</span></div><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div></div>
          <div class="top-stats"><span id="fps-counter" title="Rendered frames per second">-- FPS</span><span>☠ <strong id="kill-count">0</strong></span><span class="score-stat">✦ <strong id="team-score">0</strong></span></div>
          <button class="icon-btn gear-icon" title="Settings and controls" aria-label="Settings and controls" data-action="help">⚙</button>
        </header>
        <div class="game-body">
          <div class="arena-wrap"><canvas id="arena-background" aria-hidden="true"></canvas><canvas id="arena" aria-label="Top-down slime arena"></canvas>
            <div class="mobile-pad" id="mobile-pad" aria-label="Move your champion"></div>
            <button class="mobile-ability" id="mobile-ability">ABILITY</button>
            <div class="overlay" id="game-overlay" hidden></div>
          </div>
          <aside class="side-panel">
            <section class="side-card"><div class="side-title">The party</div><div id="party-status"></div></section>
            <section class="side-card"><div class="side-title">Arena radar</div><div class="minimap" id="minimap"></div></section>
            <section class="side-card controls-card"><div class="side-title">Controls</div><div class="controls-line"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div><div class="controls-line"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Move</div><div class="controls-line"><kbd>E</kbd> Champion ability</div><div class="controls-line muted">Attacks happen automatically.</div></section>
          </aside>
        </div>
        <footer class="game-bottombar"><span id="hero-hud">${hero(getSelf()?.hero).id}</span><span class="muted">No friendly fire · revive between waves</span><button class="ability-chip" id="ability-chip">E · ${esc(getSelf()?.abilityName || 'Ability')}</button></footer>
      </section>`;
    document.querySelector('[data-action="help"]').addEventListener('click', showSettings);
    document.querySelector('#ability-chip').addEventListener('click', () => act('ability'));
    document.querySelector('#mobile-ability').addEventListener('click', () => act('ability'));
    setupMobilePad();
    warmSlimeSprites();
    startDrawing();
    startMovementLoop();
    updateGameUI();
  }
  function startDrawing() {
    stopDrawing();
    const canvas = document.querySelector('#arena');
    const background = document.querySelector('#arena-background');
    if (!canvas || !background) return;
    const ctx = canvas.getContext('2d');
    const backgroundCtx = background.getContext('2d');
    let lastW = 0, lastH = 0;
    let cssWidth = canvas.getBoundingClientRect().width;
    let cssHeight = canvas.getBoundingClientRect().height;
    canvasResizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) { cssWidth = rect.width; cssHeight = rect.height; }
    });
    canvasResizeObserver.observe(canvas);
    let frameCount = 0;
    let fpsWindowStart = performance.now();
    const draw = (time = performance.now()) => {
      if (!canvas.isConnected) { stopDrawing(); return; }
      const dpr = Math.min(MAX_CANVAS_DPR, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(cssWidth * dpr));
      const h = Math.max(1, Math.floor(cssHeight * dpr));
      if (w !== lastW || h !== lastH) {
        canvas.width = w; canvas.height = h; lastW = w; lastH = h;
        background.width = w; background.height = h;
        drawArenaBackground(backgroundCtx, w, h);
      }
      drawArena(ctx, w, h, renderFrame());
      frameCount++;
      if (time - fpsWindowStart >= 500) {
        const fpsNode = document.querySelector('#fps-counter');
        if (fpsNode) {
          const fps = Math.round(frameCount * 1000 / (time - fpsWindowStart));
          fpsNode.textContent = `${fps} FPS`;
          fpsNode.classList.toggle('fps-low', fps < 55);
        }
        frameCount = 0;
        fpsWindowStart = time;
      }
      drawHandle = requestAnimationFrame(draw);
    };
    draw();
  }
  function stopDrawing() {
    if (drawHandle) cancelAnimationFrame(drawHandle);
    drawHandle = null;
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = null;
  }
  function drawArenaBackground(ctx, width, height) {
    const scale = Math.min(width / 1200, height / 760);
    const ox = (width - 1200 * scale) / 2;
    const oy = (height - 760 * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#262329'; ctx.fillRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const g = ctx.createLinearGradient(0, 0, 1200, 760);
    g.addColorStop(0, '#49403c'); g.addColorStop(.48, '#393538'); g.addColorStop(1, '#29272d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 760);
    // Stonework and the coliseum's old circular fighting floor.
    ctx.strokeStyle = 'rgba(13,12,15,.23)'; ctx.lineWidth = 1;
    for (let x = 18; x < 1200; x += 58) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 760); ctx.stroke(); }
    for (let y = 18; y < 760; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(178,132,79,.045)';
    for (let i = 0; i < 55; i++) {
      const x = (i * 197 + 63) % 1180 + 10, y = (i * 113 + 37) % 740 + 10;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + i % 5, 1.4 + i % 3, i * .31, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(600, 380);
    ctx.strokeStyle = 'rgba(213,173,115,.23)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 0, 510, 310, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(17,15,18,.38)'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.ellipse(0, 0, 565, 350, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(226,187,123,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 430, 260, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(226,187,123,.13)'; ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * 2 * i / 24; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 440, Math.sin(a) * 270); ctx.lineTo(Math.cos(a) * 505, Math.sin(a) * 306); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(219,175,111,.07)'; ctx.beginPath(); ctx.ellipse(0, 0, 235, 145, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230,192,139,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 235, 145, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawArenaPillars(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawArena(ctx, width, height, frame) {
    const room = frame?.room || currentRoom;
    if (!room) return;
    const scale = Math.min(width / 1200, height / 760);
    const ox = (width - 1200 * scale) / 2;
    const oy = (height - 760 * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    for (const effect of room.game?.effects || []) drawEffect(ctx, effect);
    const alpha = frame?.alpha ?? 1;
    const oldProjectiles = frame?.before?.projectiles;
    for (const projectile of room.game?.projectiles || []) {
      const old = oldProjectiles?.get(projectile.id);
      const x = old ? old.x + (projectile.x - old.x) * alpha : projectile.x;
      const y = old ? old.y + (projectile.y - old.y) * alpha : projectile.y;
      ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = projectile.color || '#fff';
      ctx.fillStyle = projectile.color || '#fff'; ctx.beginPath(); ctx.arc(x, y, projectile.radius || 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const oldEnemies = frame?.before?.enemies;
    for (const enemy of room.game?.enemies || []) {
      const old = oldEnemies?.get(enemy.id);
      const x = old ? old.x + (enemy.x - old.x) * alpha : enemy.x;
      const y = old ? old.y + (enemy.y - old.y) * alpha : enemy.y;
      drawSlime(ctx, enemy, x, y);
    }
    const oldPlayers = frame?.before?.players;
    for (const player of room.players || []) {
      const old = oldPlayers?.get(player.id);
      const x = old ? old.x + (player.x - old.x) * alpha : player.x;
      const y = old ? old.y + (player.y - old.y) * alpha : player.y;
      const visualPlayer = old ? { ...player,
        hp: old.hp + (player.hp - old.hp) * alpha,
        alive: alpha < 1 ? old.alive : player.alive
      } : player;
      drawHero(ctx, visualPlayer, x, y);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawArenaPillars(ctx) {
    const pillars = [[72,72],[1128,72],[72,688],[1128,688],[600,48],[600,712],[44,380],[1156,380]];
    for (const [x,y] of pillars) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x+4,y+6,20,13,0,0,Math.PI*2); ctx.fill();
      const g = ctx.createLinearGradient(x-13,y-13,x+13,y+13); g.addColorStop(0,'#756456'); g.addColorStop(.48,'#4c4545'); g.addColorStop(1,'#302e33');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(231,197,145,.25)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  function slimeSprite(type, radius, color) {
    const key = `${type}:${radius}:${color}`;
    if (slimeSpriteCache.has(key)) return slimeSpriteCache.get(key);
    const size = radius * 2 + 24;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = size * scale; canvas.height = size * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale); ctx.translate(size / 2, size / 2);
    ctx.shadowColor = color; ctx.shadowBlur = type === 'king' ? 22 : 10;
    const grad = ctx.createRadialGradient(-radius * .28, -radius * .35, 2, 0, 0, radius * 1.25);
    grad.addColorStop(0, lighten(color, .55)); grad.addColorStop(.42, color); grad.addColorStop(1, '#202027');
    ctx.fillStyle = grad; ctx.beginPath();
    ctx.moveTo(-radius, radius * .2);
    ctx.bezierCurveTo(-radius * 1.05, -radius * .55, -radius * .55, -radius * 1.08, 0, -radius * .95);
    ctx.bezierCurveTo(radius * .8, -radius * 1.12, radius * 1.12, -radius * .28, radius, radius * .22);
    ctx.bezierCurveTo(radius * .75, radius * .9, -radius * .7, radius * .95, -radius, radius * .2);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#201d26';
    ctx.beginPath(); ctx.ellipse(-radius * .31, -radius * .05, Math.max(2, radius * .12), Math.max(3, radius * .18), 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(radius * .3, -radius * .05, Math.max(2, radius * .12), Math.max(3, radius * .18), 0, 0, Math.PI * 2); ctx.fill();
    const sprite = { canvas, size };
    slimeSpriteCache.set(key, sprite);
    return sprite;
  }
  function warmSlimeSprites() {
    const sprites = [
      ['blue',17,'#4ca4ee'], ['green',19,'#7fd05e'], ['red',22,'#f06c4c'],
      ['yellow',17,'#f5d452'], ['black',25,'#9683bb'], ['king',48,'#e04c63']
    ];
    for (const [type,radius,color] of sprites) slimeSprite(type,radius,color);
  }
  function drawSlime(ctx, e, x = e.x, y = e.y) {
    const r = e.size || 18;
    const sprite = slimeSprite(e.type, r, e.color);
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = e.stunnedUntil > Date.now() ? .65 : 1;
    ctx.drawImage(sprite.canvas, -sprite.size / 2, -sprite.size / 2, sprite.size, sprite.size);
    if (e.markedUntil > Date.now()) { ctx.strokeStyle='#fff4ce'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,r+5,0,Math.PI*2); ctx.stroke(); }
    if (e.hp < e.maxHp || e.type === 'king') {
      const bw = r*2.2; ctx.fillStyle='rgba(13,12,15,.8)'; ctx.fillRect(-bw/2,-r-11,bw,4);
      ctx.fillStyle=e.type==='king'?'#f1c86c':'#84d373'; ctx.fillRect(-bw/2,-r-11,bw*Math.max(0,e.hp/e.maxHp),4);
    }
    if (e.type==='king') { ctx.fillStyle='#f0d16f'; ctx.font='bold 15px Georgia'; ctx.textAlign='center'; ctx.fillText('♛',0,-r-14); }
    ctx.restore();
  }
  function drawHero(ctx, p, x = p.x, y = p.y) {
    const h = hero(p.hero);
    ctx.save(); ctx.translate(x,y);
    if (!p.alive) { ctx.globalAlpha=.42; }
    ctx.shadowColor=h.color; ctx.shadowBlur=p.id===playerId?19:11;
    ctx.fillStyle='rgba(12,12,15,.5)'; ctx.beginPath(); ctx.ellipse(1,5,19,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=h.color; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.strokeStyle=p.id===playerId?'#fff5db':'rgba(255,255,255,.65)'; ctx.lineWidth=p.id===playerId?3:2; ctx.stroke();
    ctx.fillStyle='#211c20'; ctx.font='700 12px Inter, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.hero.slice(0,1),0,1);
    if (p.marked) { ctx.strokeStyle='#f0bc58'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,21,0,Math.PI*2); ctx.stroke(); }
    ctx.fillStyle='#fff1d7'; ctx.font='600 11px Inter,sans-serif'; ctx.fillText(p.name.slice(0,12),0,-25);
    const w=34; ctx.fillStyle='rgba(15,13,14,.75)'; ctx.fillRect(-w/2,20,w,4); ctx.fillStyle=p.hp/p.maxHp>.33?'#83cb77':'#ef7260'; ctx.fillRect(-w/2,20,w*Math.max(0,p.hp/p.maxHp),4);
    if (!p.alive) { ctx.fillStyle='#fff'; ctx.font='700 9px Inter'; ctx.fillText('DOWN',0,34); }
    ctx.restore();
  }
  function drawEffect(ctx, effect) {
    const t = Math.max(0,effect.life/effect.maxLife);
    ctx.save(); ctx.globalAlpha=t; ctx.strokeStyle=effect.color; ctx.fillStyle=effect.color;
    const radius=effect.radius*(1.25-t*.25);
    if (effect.kind==='breath') {
      ctx.globalAlpha=t*.2; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=t*.85; ctx.lineWidth=7*t; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius*.84,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
    } else if (effect.kind==='roots') {
      ctx.globalAlpha=t*.13; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=t*.7; ctx.lineWidth=4; for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.moveTo(effect.x,effect.y);ctx.lineTo(effect.x+Math.cos(a)*radius,effect.y+Math.sin(a)*radius*.7);ctx.stroke();}
    } else {
      ctx.globalAlpha=t*(effect.kind==='pop'?.38:.72); ctx.lineWidth=effect.kind==='slash'?7:3;
      ctx.beginPath(); ctx.arc(effect.x,effect.y,Math.max(6,radius*(1-t*.35)),0,Math.PI*2); ctx.stroke();
      if(effect.kind==='pop'||effect.kind==='burst'){ctx.globalAlpha=t*.35;ctx.beginPath();ctx.arc(effect.x,effect.y,radius*.45*(1-t),0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
  }
  function lighten(hex, amount) {
    const n=parseInt(hex.slice(1),16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    return `rgb(${Math.round(r+(255-r)*amount)},${Math.round(g+(255-g)*amount)},${Math.round(b+(255-b)*amount)})`;
  }

  function updateGameUI() {
    if (!currentRoom || currentScreen !== 'game') return;
    const g=currentRoom.game; const self=getSelf();
    if (!g) return;
    const visualFrame=renderFrame();
    const visualRoom=visualFrame.alpha<1&&visualFrame.before?.room?visualFrame.before.room:visualFrame.room||currentRoom;
    const visualPlayers=visualRoom.players||currentRoom.players||[];
    const visualSelf=visualPlayers.find(player=>player.id===playerId)||self;
    const waveLabel=document.querySelector('#wave-label');
    if(waveLabel) waveLabel.textContent=`Wave ${g.wave} / 10`;
    const total=g.waveDuration||20; const progress=g.phase==='wave'?Math.min(100,g.waveElapsed/total*100):g.phase==='upgrade'?100:100;
    const fill=document.querySelector('#progress-fill'); if(fill) fill.style.width=`${progress}%`;
    const copy=document.querySelector('#progress-copy');
    if(copy) copy.textContent=g.phase==='upgrade'?'Choose an upgrade':g.phase==='won'?'The arena is clear':g.phase==='lost'?'The party has fallen':`Survive the wave · ${Math.max(0,Math.ceil(total-g.waveElapsed))}s`;
    const count=document.querySelector('#enemy-count'); if(count) count.textContent=`${g.enemies.length} ${g.enemies.length===1?'enemy':'enemies'}`;
    const kills=document.querySelector('#kill-count'); if(kills) kills.textContent=g.teamKills;
    const score=document.querySelector('#team-score'); if(score) score.textContent=(currentRoom.players||[]).reduce((sum,p)=>sum+p.score,0);
    const status=document.querySelector('#party-status');
    const statusMarkup=visualPlayers.map(p=>`<div class="party-row"><div class="party-dot" style="color:${hero(p.hero).color}">${p.hero[0]}</div><span>${esc(p.name)}${p.id===playerId?' · you':''}</span><strong>${Math.max(0,Math.ceil(p.hp))}</strong><div class="hp-track"><div class="hp-fill" style="width:${p.maxHp?Math.max(0,Math.round(p.hp/p.maxHp*100)):0}%;background:${p.alive?'#79bb70':'#e76850'}"></div></div></div>`).join('');
    if(status && statusMarkup!==lastPartyStatusMarkup) { status.innerHTML=statusMarkup; lastPartyStatusMarkup=statusMarkup; }
    const mini=document.querySelector('#minimap');
    const now=performance.now();
    if(mini && now-lastMinimapRenderAt>=200) {
      lastMinimapRenderAt=now;
      const entities=[...(currentRoom.players||[]).map(p=>({key:`player:${p.id}`,type:'player',entity:p,color:hero(p.hero).color})),...(g.enemies||[]).map(e=>({key:`enemy:${e.id}`,type:'enemy',entity:e,color:e.color}))];
      const activeKeys=new Set(entities.map(item=>item.key));
      for(const [key,dot] of minimapDots) {
        if(!activeKeys.has(key)) { dot.remove(); minimapDots.delete(key); }
      }
      for(const item of entities) {
        let dot=minimapDots.get(item.key);
        if(!dot) {
          dot=document.createElement('span'); dot.className=`map-dot ${item.type}`;
          mini.append(dot); minimapDots.set(item.key,dot);
        }
        dot.style.color=item.color; dot.style.background=item.color;
        dot.style.left=`${item.entity.x/1200*100}%`; dot.style.top=`${item.entity.y/760*100}%`;
      }
    }
    const chip=document.querySelector('#ability-chip');
    if(chip&&self){const left=Math.ceil(self.abilityCooldown);chip.textContent=left>0?`${left}s · ${self.abilityName||'Ability'}`:`E · ${self.abilityName||'Ability'}`;chip.classList.toggle('ready',left<=0&&self.alive);}
    const heroHud=document.querySelector('#hero-hud'); if(heroHud&&visualSelf) heroHud.textContent=`${visualSelf.hero} · ${Math.max(0,Math.ceil(visualSelf.hp))}/${visualSelf.maxHp} HP`;
    updateOverlay();
  }
  function updateOverlay() {
    const node=document.querySelector('#game-overlay');
    if(!node||!currentRoom?.game) return;
    const g=currentRoom.game; const self=getSelf();
    const stateKey=`${g.phase}:${g.wave}:${Boolean(self?.upgradePicked)}:${g.result||''}`;
    if(stateKey===overlayStateKey)return;
    overlayStateKey=stateKey;
    if(g.phase==='upgrade') {
      node.hidden=false;
      if(self?.upgradePicked) {
        node.innerHTML=`<div class="overlay-card"><div class="eyebrow">Wave ${g.wave} cleared</div><h2>Upgrade chosen</h2><p class="muted">Waiting for the other champions. The next wave begins when everyone is ready.</p><div class="small muted">Downed allies return at the center with some health.</div></div>`;
      } else {
        node.innerHTML=`<div class="overlay-card"><div class="eyebrow">Wave ${g.wave} cleared</div><h2>Choose an upgrade</h2><p class="muted small">Each champion chooses a lasting bonus before the next wave.</p><div class="upgrade-grid">${UPGRADES.map(u=>`<button class="upgrade-card" data-upgrade="${u.id}"><div class="upgrade-icon">${u.icon}</div><strong>${u.name}</strong><span>${u.text}</span></button>`).join('')}</div></div>`;
        node.querySelectorAll('[data-upgrade]').forEach(button=>button.addEventListener('click',async()=>{await act('upgrade',button.dataset.upgrade);sound(520,.1,'triangle');}));
      }
    } else if(g.phase==='won'||g.phase==='lost') {
      node.hidden=false;
      const score=(currentRoom.players||[]).reduce((sum,p)=>sum+p.score,0);
      const kills=g.teamKills||0;
      node.innerHTML=`<div class="overlay-card"><div class="eyebrow">${currentRoom.mode==='solo'?'Solo run':'Party run'} · ${g.phase==='won'?'victory':'run ended'}</div><h2>${g.phase==='won'?'The King Slime is defeated':'The slimes claim the arena'}</h2><p class="muted">${g.phase==='won'?'The coliseum is yours. A clean ten-wave clear.':'Your party survived '+(g.completedWaves||0)+' complete waves.'}</p><div class="results-score"><div class="result-box"><strong>${kills}</strong><span>Slimes defeated</span></div><div class="result-box"><strong>${Math.round(g.teamDamage||0)}</strong><span>Damage dealt</span></div><div class="result-box"><strong>${score}</strong><span>Party score</span></div></div><button class="btn" data-action="again">Back to the menu</button></div>`;
      node.querySelector('[data-action="again"]').addEventListener('click',leaveRoom);
    } else node.hidden=true;
  }

  function setupMobilePad() {
    const pad=document.querySelector('#mobile-pad'); if(!pad) return;
    const update=(event)=>{
      const rect=pad.getBoundingClientRect();
      const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      let x=(event.clientX-cx)/43,y=(event.clientY-cy)/43;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}
      moveVector={x,y};pad.classList.add('active');
      pad.style.setProperty('--stick-x', `${x * 28}px`);
      pad.style.setProperty('--stick-y', `${y * 28}px`);
    };
    pad.addEventListener('pointerdown',event=>{pad.setPointerCapture(event.pointerId);update(event);});
    pad.addEventListener('pointermove',event=>{if(pad.hasPointerCapture(event.pointerId))update(event);});
    const release=()=>{moveVector={x:0,y:0};pad.classList.remove('active');pad.style.setProperty('--stick-x','0px');pad.style.setProperty('--stick-y','0px');};
    pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);
  }
  function startMovementLoop() {
    if (window.moveLoop) clearInterval(window.moveLoop);
    lastMovementUpdateAt = performance.now();
    window.moveLoop=setInterval(()=>{
      const now=performance.now();
      const deltaSeconds=Math.min(.05,Math.max(0,(now-lastMovementUpdateAt)/1000));
      lastMovementUpdateAt=now;
      if(currentScreen!=='game'||currentRoom?.status!=='playing') {
        smoothedMoveVector={x:0,y:0};
        return;
      }
      let x=moveVector.x,y=moveVector.y;
      if(keys.has('ArrowLeft')||keys.has('a'))x-=1;
      if(keys.has('ArrowRight')||keys.has('d'))x+=1;
      if(keys.has('ArrowUp')||keys.has('w'))y-=1;
      if(keys.has('ArrowDown')||keys.has('s'))y+=1;
      const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
      // Ease changes in heading and speed so keyboard direction changes do not snap.
      const blend=1-Math.exp(-deltaSeconds/.045);
      smoothedMoveVector.x+=(x-smoothedMoveVector.x)*blend;
      smoothedMoveVector.y+=(y-smoothedMoveVector.y)*blend;
      const sendAt=Date.now();if(sendAt-lastMoveAt<(legacyInputFallback?80:40))return;lastMoveAt=sendAt;
      sendMovement(smoothedMoveVector.x,smoothedMoveVector.y);
    },16);
  }
  async function sendMovement(x,y) {
    const body=JSON.stringify({playerId,x,y});
    const options={method:'POST',headers:{'Content-Type':'application/json'},body};
    try {
      let response;
      if(legacyInputFallback) {
        response=await fetch(`/api/rooms/${roomCode}/action`,{...options,body:JSON.stringify({playerId,action:'move',x,y})});
      } else {
        response=await fetch(`/api/rooms/${roomCode}/input`,options);
        if(response.status===404) {
          // Keep movement working if an already-running server predates the lightweight input route.
          if(!legacyInputFallback) showToast('Older server detected; using compatibility movement. Restart the server for the optimized route.');
          legacyInputFallback=true;
          response=await fetch(`/api/rooms/${roomCode}/action`,{...options,body:JSON.stringify({playerId,action:'move',x,y})});
        }
      }
      if(!response.ok&&!inputErrorShown) {
        inputErrorShown=true;
        showToast(`Movement sync failed (${response.status}). Restart the game server and reload.`);
      }
    } catch {
      if(!inputErrorShown) { inputErrorShown=true; showToast('Movement sync failed. Check that the game server is running.'); }
    }
  }
  window.addEventListener('keydown',event=>{
    const key=MOVEMENT_KEY_CODES[event.code]||(event.key.length===1?event.key.toLowerCase():event.key);
    if(currentScreen==='title'&&(event.code==='Enter'||event.code==='Space')){event.preventDefault();renderMenu();return;}
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))event.preventDefault();
    if((key==='e'||key===' ')&&currentScreen==='game'&&!event.repeat){act('ability');return;}
    keys.add(key);
  });
  window.addEventListener('keyup',event=>{const key=MOVEMENT_KEY_CODES[event.code]||(event.key.length===1?event.key.toLowerCase():event.key);keys.delete(key);});
  window.addEventListener('blur',()=>{keys.clear();moveVector={x:0,y:0};smoothedMoveVector={x:0,y:0};lastMovementUpdateAt=performance.now();});

  function showSettings() {
    const existing=document.querySelector('#modal-root');
    if(existing){existing.remove();return;}
    const modal=document.createElement('div');modal.id='modal-root';modal.className='overlay';modal.style.position='fixed';modal.style.zIndex='30';
    const quitButton = currentScreen === 'game' ? '<button class="btn danger" data-action="quit">Quit game</button>' : '';
    modal.innerHTML=`<div class="overlay-card settings-card" style="text-align:left"><div class="eyebrow">Slime Slayer</div><h2>Settings &amp; quick rules</h2><p class="small muted">Move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys. Your hero attacks automatically when a slime is in range. Press <kbd>E</kbd> to use your champion ability.</p><p class="small muted">Survive the ten waves. Pick one upgrade after every cleared wave. In co-op, fallen champions return between waves. Red slimes burst when defeated. Watch for ranged shots from green, yellow, and black slimes.</p><label class="small" for="volume-slider">Sound effects <span id="volume-label">${Math.round(volume*100)}%</span></label><input id="volume-slider" type="range" min="0" max="100" value="${Math.round(volume*100)}" style="display:block;width:100%;margin:12px 0 19px"><div class="settings-actions">${quitButton}<button class="btn" data-action="close">Close</button></div></div>`;
    document.body.append(modal);
    modal.querySelector('[data-action="close"]').addEventListener('click',()=>modal.remove());
    modal.querySelector('[data-action="quit"]')?.addEventListener('click',()=>{modal.remove();showQuitConfirmation();});
    modal.addEventListener('click',event=>{if(event.target===modal)modal.remove();});
    modal.querySelector('#volume-slider').addEventListener('input',event=>{volume=Number(event.target.value)/100;localStorage.setItem('slime-slayer-volume',String(volume));modal.querySelector('#volume-label').textContent=`${Math.round(volume*100)}%`;sound(500,.08);});
  }

  function showQuitConfirmation() {
    const modal=document.createElement('div');
    modal.id='quit-confirm';modal.className='overlay quit-overlay';modal.style.position='fixed';modal.style.zIndex='31';
    modal.innerHTML=`<div class="overlay-card quit-card" role="alertdialog" aria-modal="true" aria-labelledby="quit-title" aria-describedby="quit-warning"><div class="eyebrow">Leave the arena?</div><h2 id="quit-title">Quit game</h2><p id="quit-warning" class="small muted">Your progress will be lost.</p><div class="quit-actions"><button class="btn quiet" type="button" data-action="cancel-quit">Keep playing</button><button class="btn danger" type="button" data-action="confirm-quit">Quit game</button></div></div>`;
    document.body.append(modal);
    modal.querySelector('[data-action="cancel-quit"]').addEventListener('click',()=>modal.remove());
    const confirmButton=modal.querySelector('[data-action="confirm-quit"]');
    confirmButton.addEventListener('click',()=>{confirmButton.disabled=true;confirmButton.textContent='Leaving…';void quitGame();});
    modal.addEventListener('click',event=>{if(event.target===modal)modal.remove();});
    modal.addEventListener('keydown',event=>{if(event.key==='Escape')modal.remove();});
    modal.querySelector('[data-action="cancel-quit"]').focus();
  }

  // Always begin with the title screen. A saved room code remains available in
  // Party → Join so a returning player can reconnect after starting at the title.
  renderTitleScreen();
})();
