(() => {
  'use strict';

  const HEROES = [
    { id: 'Ravela', role: 'Glass cannon · single-target archer', flavor: 'A deadly mark turns one clean shot into a finishing blow.', color: '#d8c7ef', art: 'Ravela character art.png', ability: 'Mark of Death', abilityDescription: 'Strike the nearest slime and mark it to take 25% more damage for a short time.', stats: { hp: 20, attack: 24, speed: 175, range: 340, interval: 0.62, regen: 1, defense: 0 } },
    { id: 'Fjord', role: 'Armored tank · close-range cleave', flavor: 'Slow, sturdy, and happiest surrounded by enemies.', color: '#ec9b4b', art: 'Fjord character art.png', ability: 'Fire Breath', abilityDescription: 'Breathe fire in front of Fjord, damaging slimes in a wide cone.', stats: { hp: 85, attack: 31, speed: 112, range: 94, interval: 1.05, regen: 1, defense: 0 } },
    { id: 'Aram', role: 'Balanced duelist · parry and counter', flavor: 'A measured blade with a chance to stun attackers.', color: '#a4c5a1', art: 'Aram character art.png', ability: 'Riposte', abilityDescription: 'Become briefly invulnerable and stun nearby slimes.', stats: { hp: 50, attack: 22, speed: 145, range: 96, interval: 0.62, regen: 1, defense: 0 } },
    { id: 'Gavrilta', role: 'Control mage · poison and roots', flavor: 'Green magic slows a crowd and wears it down over time.', color: '#82d66e', art: 'Gavrilla character art.png', ability: 'Wild Growth', abilityDescription: 'Root nearby slimes and poison them over time.', stats: { hp: 30, attack: 15, speed: 130, range: 300, interval: 1.12, regen: 1, defense: 0 } }
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
  let roomKey = localStorage.getItem('slime-slayer-room') || '';
  let roomCode = localStorage.getItem('slime-slayer-room-code') || (/^[a-z0-9]{5}$/i.test(roomKey) ? roomKey : '');
  let browseGroupsTimer = null;
  let browseGroups = [];
  let browseUnlockTarget = null;
  const browseUnlockCodes = new Map();
  let lobbyKey = '';
  let pendingLobbyHeroChoice = null;
  let lobbyHeroSyncing = false;
  let lobbyHeroChoiceVersion = 0;
  let lobbyHeroActionAckAt = 0;
  let pollHandle = null;
  let drawHandle = null;
  let polling = false;
  let toastHandle = null;
  let volume = readUnitSetting('slime-slayer-sfx-volume', readUnitSetting('slime-slayer-volume', 0.25));
  let masterVolume = readUnitSetting('slime-slayer-master-volume', 1);
  let musicVolume = readUnitSetting('slime-slayer-music-volume', 0.35);
  let brightness = readBrightnessSetting();
  let showFpsCounter = localStorage.getItem('slime-slayer-show-fps') !== 'false';
  let showPingDisplay = localStorage.getItem('slime-slayer-show-ping') !== 'false';
  let measuredPingMs = null;
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
  function readUnitSetting(key, fallback) {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const value = Number(stored);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
  }
  function readBrightnessSetting() {
    const key = 'slime-slayer-brightness';
    const scaleKey = 'slime-slayer-brightness-scale';
    const stored = localStorage.getItem(key);
    if (stored === null) {
      localStorage.setItem(scaleKey, '0-100-centered');
      return 50;
    }
    const value = Number(stored);
    if (!Number.isFinite(value)) return 50;
    const normalized = localStorage.getItem(scaleKey) === '0-100-centered'
      ? Math.max(0, Math.min(100, value))
      : Math.max(0, Math.min(100, Math.round(value / 2)));
    localStorage.setItem(key, String(normalized));
    localStorage.setItem(scaleKey, '0-100-centered');
    return normalized;
  }
  function applyBrightness() {
    app.style.filter = brightness === 50 ? '' : `brightness(${brightness / 50})`;
  }
  function hero(id) { return HEROES.find(h => h.id === id) || HEROES[0]; }
  function getSelf() { return currentRoom?.players?.find(p => p.id === playerId); }
  function formatRunTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainder = total % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }
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
    if (volume <= 0 || masterVolume <= 0) return;
    try {
      soundContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = soundContext.createOscillator();
      const gain = soundContext.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(Math.max(0.001, volume * masterVolume * 0.07), soundContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + duration);
      osc.connect(gain); gain.connect(soundContext.destination);
      osc.start(); osc.stop(soundContext.currentTime + duration);
    } catch { /* audio is an optional browser feature */ }
  }
  function setScreen(name) {
    currentScreen = name;
    if (name !== 'game') stopDrawing();
    if (name !== 'browse-groups') {
      clearInterval(browseGroupsTimer);
      browseGroupsTimer = null;
    }
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
            <div class="subtitle">Roguelike</div>
          </header>
          <p class="intro"><span class="intro-lead">Hold the coliseum against a tsunami of slime!</span><span class="intro-support">Choose your champion to brave the tides alone or survive with your fellow adventurers</span></p>
          <div class="mode-select">
            <button class="mode-card" data-action="solo"><span class="mode-symbol">⚔</span><span class="mode-title">Solo</span><span class="mode-caption">Singleplayer</span></button>
            <button class="mode-card" data-action="party"><span class="mode-symbol party-pawns" aria-hidden="true">♟♟♟♟</span><span class="mode-title">Party</span><span class="mode-caption">Multiplayer</span></button>
          </div>
          <footer class="menu-foot">Up to four players · WASD / arrows / drag to move · E / tap button to use your ability</footer>
          <button class="btn quiet credits-trigger" type="button" data-action="credits">Credits</button>
        </div>
      </section>`;
    app.querySelector('[data-action="solo"]').addEventListener('click', () => { setHero(null); renderSoloSelect(); });
    app.querySelector('[data-action="party"]').addEventListener('click', renderPartyChoice);
    app.querySelector('[data-action="credits"]').addEventListener('click', renderCredits);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
  }

  function renderCredits() {
    setScreen('credits');
    app.innerHTML = `<section class="screen menu-screen credits-screen">${gearButton()}<div class="menu-wrap">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>CREDITS</h1><div class="subtitle">Slime Slayer</div></header>
      <article class="credits-panel">
        <section class="credits-section"><h2>GAME DESIGN &amp; CREATIVE DIRECTION</h2><h3>Gavin Heard</h3><ul>
          <li>Lead Game Designer</li><li>Creative Director</li><li>Game Concept &amp; Original Vision</li><li>Creative Planning &amp; Development</li><li>Gameplay Mechanics &amp; Rules Design</li><li>Project Direction</li>
        </ul></section>
        <section class="credits-section"><h2>DEVELOPMENT &amp; ART</h2><h3>ChatGPT6-Luna</h3><ul>
          <li>AI Programming Assistant</li><li>Game Systems &amp; Technical Development</li><li>Multiplayer Systems &amp; Synchronization</li><li>Visual Design &amp; Art Direction</li><li>Digital Art &amp; Creative Asset Development</li><li>Technical Problem-Solving</li>
        </ul></section>
        <section class="credits-section credits-acknowledgment"><h2>SPECIAL ACKNOWLEDGMENT</h2>
          <p>Created in collaboration with ChatGPT as an entry for the <strong>ChatGPT Create a Multiplayer Game Competition</strong>, hosted through <strong>Handshake</strong>.</p>
          <p class="credits-signoff"><strong>Designed by Gavin Heard. Developed with AI assistance from ChatGPT6-Luna.</strong></p>
        </section>
        <p class="credits-thanks"><strong><em>Thank you for playing &lt;3.</em></strong></p>
      </article>
    </div></section>`;
    app.querySelector('[data-action="back"]').addEventListener('click', renderMenu);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
  }

  function renderPartyChoice() {
    setScreen('party-choice');
    app.innerHTML = `<section class="screen menu-screen sub-screen">${gearButton()}<div class="menu-wrap">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>PARTY</h1><div class="subtitle">Play together</div></header>
      <p class="intro">Create a private party with an invite code, open a public party, join by code, or view the server list.</p>
      <div class="mode-select party-choice-grid"><button class="mode-card" data-action="create"><span class="mode-symbol">＋</span><span class="mode-title">Create a party</span><span class="mode-caption">Choose Private or Public</span></button>
      <button class="mode-card" data-action="join"><span class="mode-symbol">⌕</span><span class="mode-title">Join a party</span><span class="mode-caption">Enter a friend's five-character code</span></button></div>
      <button class="mode-card browse-groups-card" data-action="browse"><span class="mode-symbol">◉</span><span><span class="mode-title">Server List</span><span class="mode-caption">Find public parties or unlock a private one</span></span></button>
    </div></section>`;
    app.querySelector('[data-action="back"]').addEventListener('click', renderMenu);
    app.querySelector('[data-action="create"]').addEventListener('click', () => showPartyDialog('create'));
    app.querySelector('[data-action="join"]').addEventListener('click', () => showPartyDialog('join'));
    app.querySelector('[data-action="browse"]').addEventListener('click', renderBrowseGroups);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
  }

  function showPartyDialog(kind) {
    const creating = kind === 'create';
    const modal = document.createElement('div');
    modal.className = 'overlay dialog-overlay';
    modal.id = 'party-dialog';
    modal.innerHTML = `<form class="overlay-card party-dialog" id="party-dialog-form"><div class="eyebrow">${creating ? 'New party' : 'Join a party'}</div>
      <h2>${creating ? 'Name your party' : 'Enter the party code'}</h2>
      <p class="small muted">${creating ? 'Choose Private for an invite code or Public to appear in the server list.' : 'Ask the party host for the five-character room code.'}</p>
      <label class="dialog-label" for="party-dialog-input">${creating ? 'Party name' : 'Party code'}</label>
      <input class="text-input dialog-input ${creating ? '' : 'code-input'}" id="party-dialog-input" maxlength="${creating ? 28 : 5}" placeholder="${creating ? 'The Slime Slayers' : 'ABCDE'}" value="${creating ? '' : esc(roomCode)}" ${creating ? 'required' : 'required autocomplete="off"'}>
      ${creating ? `<fieldset class="visibility-fieldset"><legend>Who can join?</legend><div class="visibility-options"><label class="visibility-option"><input type="radio" name="party-visibility" value="private" checked><span><strong>Private</strong><small>Show an invite code in your lobby</small></span></label><label class="visibility-option"><input type="radio" name="party-visibility" value="public"><span><strong>Public</strong><small>Appear in the server list without a code</small></span></label></div></fieldset>` : ''}
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
      const visibility = creating
        ? modal.querySelector('input[name="party-visibility"]:checked')?.value || 'private'
        : null;
      modal.remove();
      if (creating) createRoom('coop', value, visibility);
      else joinRoom(value);
    });
  }

  function renderBrowseGroups() {
    setScreen('browse-groups');
    browseUnlockTarget = null;
    browseGroups = [];
    app.innerHTML = `<section class="screen browse-screen">${gearButton()}<div class="browse-panel">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>SERVER LIST</h1><div class="subtitle">Find a party waiting in the coliseum</div></header>
      <p class="intro">Join an open public party, or enter the invite code for a private group.</p>
      <div class="group-filters">
        <label class="group-filter">Search party or leader<input class="text-input" id="group-search" type="search" placeholder="Party name or leader" autocomplete="off"></label>
        <label class="group-filter">Party size<select class="text-input" id="group-player-filter"><option value="any">Any number</option><option value="1">1 player</option><option value="2">2 players</option><option value="3">3 players</option><option value="4">4 players</option></select></label>
        <label class="group-filter">Access<select class="text-input" id="group-visibility-filter"><option value="all">All access types</option><option value="public">Public only</option><option value="private">Private only</option><option value="closed">Closed only</option></select></label>
      </div>
      <div class="group-list-heading"><div class="small muted" id="group-results-count">Loading parties…</div><button class="btn quiet" type="button" data-action="refresh-groups">Refresh</button></div>
      <div class="group-list" id="group-list" aria-live="polite"></div>
    </div></section>`;
    app.querySelector('[data-action="back"]').addEventListener('click', renderPartyChoice);
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
    app.querySelector('[data-action="refresh-groups"]').addEventListener('click', loadBrowseGroups);
    app.querySelector('#group-search').addEventListener('input', renderGroupList);
    app.querySelector('#group-player-filter').addEventListener('change', renderGroupList);
    app.querySelector('#group-visibility-filter').addEventListener('change', renderGroupList);
    clearInterval(browseGroupsTimer);
    browseGroupsTimer = setInterval(loadBrowseGroups, 5000);
    loadBrowseGroups();
  }

  async function loadBrowseGroups() {
    if (currentScreen !== 'browse-groups') return;
    try {
      const result = await api('/api/groups', null, 'GET');
      if (currentScreen !== 'browse-groups') return;
      browseGroups = Array.isArray(result.groups) ? result.groups : [];
      renderGroupList();
    } catch (error) {
      if (currentScreen !== 'browse-groups') return;
      const list = document.querySelector('#group-list');
      const count = document.querySelector('#group-results-count');
      if (count) count.textContent = 'Could not load groups';
      if (list) list.innerHTML = `<div class="empty-groups">${esc(error.message || 'Could not load groups. Try refreshing.')}</div>`;
    }
  }

  function renderGroupList() {
    const list = document.querySelector('#group-list');
    const count = document.querySelector('#group-results-count');
    if (!list || !count || currentScreen !== 'browse-groups') return;
    const search = (document.querySelector('#group-search')?.value || '').trim().toLocaleLowerCase();
    const playerFilter = document.querySelector('#group-player-filter')?.value || 'any';
    const visibilityFilter = document.querySelector('#group-visibility-filter')?.value || 'all';
    const filtered = browseGroups.filter(group => {
      const matchesSearch = !search || `${group.name} ${group.leaderName}`.toLocaleLowerCase().includes(search);
      const matchesPlayers = playerFilter === 'any' || Number(group.playerCount) === Number(playerFilter);
      const matchesVisibility = visibilityFilter === 'all' || group.visibility === visibilityFilter;
      return matchesSearch && matchesPlayers && matchesVisibility;
    });
    count.textContent = `${filtered.length} ${filtered.length === 1 ? 'party' : 'parties'} · refreshes automatically`;
    const markup = filtered.length ? filtered.map(group => {
      const privateGroup = group.visibility === 'private';
      const closedGroup = group.visibility === 'closed';
      const full = !group.canJoin && !closedGroup;
      const action = closedGroup
        ? '<button class="btn quiet" type="button" disabled>Party locked</button>'
        : full
        ? '<button class="btn quiet" type="button" disabled>Party full</button>'
        : privateGroup
          ? browseUnlockTarget === group.id
            ? `<form class="group-unlock-form" data-private-unlock="${esc(group.id)}"><label for="unlock-${esc(group.id)}">Invite code</label><div><input class="text-input code-input group-code-input" id="unlock-${esc(group.id)}" name="code" maxlength="5" placeholder="ABCDE" autocomplete="off" required value="${esc(browseUnlockCodes.get(group.id) || '')}"><button class="btn" type="submit">Unlock &amp; join</button></div></form>`
            : `<button class="btn quiet" type="button" data-unlock-group="${esc(group.id)}">Enter code to unlock</button>`
          : `<button class="btn" type="button" data-join-group="${esc(group.id)}">Join public party</button>`;
      const lockedGroup = privateGroup || closedGroup;
      const accessLabel = closedGroup ? 'Closed · Locked' : privateGroup ? 'Private · Locked' : 'Public';
      return `<article class="group-card ${lockedGroup ? 'group-card-private' : ''}"><div class="group-card-info"><div class="group-card-title-row"><h2>${esc(group.name)}</h2><span class="group-access-badge ${lockedGroup ? 'private' : 'public'}">${accessLabel}</span></div><div class="group-card-details"><span>Leader: <strong>${esc(group.leaderName)}</strong></span><span>${group.playerCount}/${group.maxPlayers} players</span><span>Waiting for players</span></div></div><div class="group-card-action">${action}</div></article>`;
    }).join('') : '<div class="empty-groups">No parties match those filters right now.</div>';
    if (list.contains(document.activeElement) && document.activeElement.matches('.group-code-input')) return;
    if (list.innerHTML !== markup) {
      list.innerHTML = markup;
      list.querySelectorAll('[data-join-group]').forEach(button => button.addEventListener('click', () => joinRoom(button.dataset.joinGroup, { publicJoin: true })));
      list.querySelectorAll('[data-unlock-group]').forEach(button => button.addEventListener('click', () => {
        browseUnlockTarget = button.dataset.unlockGroup;
        renderGroupList();
        list.querySelector('.group-code-input')?.focus();
      }));
      list.querySelectorAll('.group-unlock-form').forEach(form => {
        const input = form.querySelector('input[name="code"]');
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);
          browseUnlockCodes.set(form.dataset.privateUnlock, input.value);
        });
        form.addEventListener('submit', event => {
          event.preventDefault();
          const code = input.value.trim();
          if (code.length !== 5) { input.focus(); return; }
          joinRoom(code, { expectedRoomId: form.dataset.privateUnlock });
        });
      });
    }
  }

  function renderSoloSelect() {
    setScreen('solo-select');
    app.innerHTML = `<section class="screen solo-screen">${gearButton()}<div class="solo-wrap">
      <button class="back-link" data-action="back">← Back</button>
      <header class="brand compact-brand"><div class="brand-mark">✦</div><h1>CHOOSE YOUR HERO</h1><div class="subtitle">Solo challenge</div></header>
      <p class="intro">Select your champion. Each hero has a unique weapon and ability.</p>
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
      <div class="hero-meta"><div class="hero-name"><span>${h.id}</span><span style="color:${h.id==='Ravela'?'#000000':h.color}">✦</span></div><div class="hero-role">${h.role}</div><div class="hero-flair">${h.flavor}</div></div></button>`;
  }
  function renderSoloSelectKeepName() {
    const name = app.querySelector('#solo-player-name')?.value || playerName;
    persistName(name);
    renderSoloSelect();
  }

  function rememberRoomIdentity(room) {
    const nextKey = room?.id || room?.code || '';
    if (nextKey) roomKey = nextKey;
    if (roomKey && localStorage.getItem('slime-slayer-room') !== roomKey) localStorage.setItem('slime-slayer-room', roomKey);
    const nextCode = room?.mode === 'coop' && room?.visibility !== 'public' ? room?.code || '' : '';
    roomCode = nextCode;
    if (nextCode && localStorage.getItem('slime-slayer-room-code') !== nextCode) localStorage.setItem('slime-slayer-room-code', nextCode);
    else if (!nextCode && localStorage.getItem('slime-slayer-room-code')) localStorage.removeItem('slime-slayer-room-code');
  }
  function clearRoomIdentity() {
    roomKey = '';
    roomCode = '';
    localStorage.removeItem('slime-slayer-room');
    localStorage.removeItem('slime-slayer-room-code');
  }
  async function createRoom(mode, partyName = '', visibility = 'private') {
    persistName(app.querySelector('#solo-player-name')?.value || playerName);
    try {
      const result = await api('/api/rooms', { playerId, name: playerName, hero: mode === 'solo' ? selectedHero : null, partyName, mode, visibility });
      currentRoom = result.room;
      rememberRoomIdentity(currentRoom);
      startPolling();
      if (mode === 'solo') {
        await act('start');
      } else renderLobby(true);
    } catch (error) { toastError(error); }
  }
  async function joinRoom(identifier, options = {}) {
    const publicJoin = Boolean(options.publicJoin);
    const inviteJoin = Boolean(options.inviteToken);
    const key = publicJoin || inviteJoin
      ? String(identifier || '')
      : String(identifier || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);
    if (!publicJoin && !inviteJoin && key.length !== 5) { showToast('Enter the five-character room code.'); return; }
    if (publicJoin && !key) return;
    if (inviteJoin && !key) return;
    try {
      const expectedRoomId = options.expectedRoomId || (publicJoin ? key : '');
      const result = await api(`/api/rooms/${encodeURIComponent(key)}/join`, {
        playerId, name: playerName, hero: null,
        ...(inviteJoin ? { joinToken: key } : {}),
        ...(expectedRoomId ? { expectedRoomId } : {})
      });
      currentRoom = result.room;
      rememberRoomIdentity(currentRoom);
      startPolling();
      renderLobby(true);
    } catch (error) {
      if (inviteJoin) renderTitleScreen();
      toastError(error);
    }
  }
  async function act(action, value) {
    if (!roomKey) return;
    try {
      const result = await api(`/api/rooms/${encodeURIComponent(roomKey)}/action`, { playerId, action, value });
      if (result.room) acceptRoom(result.room);
      return result;
    } catch (error) { if (action !== 'move') toastError(error); throw error; }
  }
  function startPolling() {
    clearInterval(pollHandle);
    measuredPingMs = null;
    pollHandle = setInterval(poll, 100);
    poll();
  }
  async function poll() {
    if (polling || !roomKey || !playerId) return;
    polling = true;
    const pollStartedAt = performance.now();
    try {
      const result = await api(`/api/rooms/${encodeURIComponent(roomKey)}?playerId=${encodeURIComponent(playerId)}`, null, 'GET');
      const pingSample = performance.now() - pollStartedAt;
      measuredPingMs = measuredPingMs === null ? pingSample : measuredPingMs * .7 + pingSample * .3;
      // A GET that began before our character action was acknowledged may contain
      // the previous hero. Keep the immediate local choice until a later GET sees it.
      const preserveLobbyHero = currentScreen === 'lobby' && pollStartedAt < lobbyHeroActionAckAt;
      acceptRoom(result.room, preserveLobbyHero);
    } catch (error) {
      if (currentScreen === 'quitting') return;
      clearInterval(pollHandle);
      if (currentScreen !== 'menu') { clearRoomIdentity(); currentRoom = null; renderMenu(); }
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
    rememberRoomIdentity(room);
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
    const at = performance.now();
    const renderEventAt = serverAt => Number.isFinite(serverAt) && Number.isFinite(room.serverTime)
      ? at - Math.max(0, room.serverTime - serverAt)
      : null;
    snapshots.push({
      at, room,
      players: new Map((room.players || []).map(player => [player.id, player])),
      enemies: new Map((game?.enemies || []).map(enemy => [enemy.id, enemy])),
      projectiles: new Map((game?.projectiles || []).map(projectile => [projectile.id, {
        ...projectile, renderCreatedAt: renderEventAt(projectile.createdAt)
      }])),
      effects: new Map((game?.effects || []).map(effect => [effect.id, {
        ...effect, renderCreatedAt: renderEventAt(effect.createdAt)
      }]))
    });
    if (snapshots.length > 8) snapshots.shift();
  }
  function renderFrame() {
    const target = performance.now() - SNAPSHOT_DELAY_MS;
    if (!snapshots.length) return { room: currentRoom, before: null, after: null, targetAt: target, alpha: 1 };
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
    return { room: after.room, before, after, targetAt: target, alpha };
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
    return JSON.stringify({ id: currentRoom.id, code: currentRoom.code, visibility: currentRoom.visibility, status: currentRoom.status, host: currentRoom.hostId,
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
      if (!p) return `<article class="party-slot vacant-slot"><div class="slot-heading"><span>PLAYER ${index + 1}</span><span>${currentRoom.visibility === 'closed' ? 'LOCKED' : 'OPEN'}</span></div><div class="slot-portrait empty-portrait ${currentRoom.visibility === 'closed' ? 'locked-slot-portrait' : ''}"><span>${currentRoom.visibility === 'closed' ? '🔒' : '＋'}</span></div><div class="vacant-title">${currentRoom.visibility === 'closed' ? 'Party locked' : 'Open seat'}</div><div class="vacant-copy">${currentRoom.visibility === 'public' ? 'Find this party in<br>the server list' : currentRoom.visibility === 'closed' ? 'Party is closed<br>to new players' : 'Share your party code<br>to invite a player'}</div><div class="slot-status">${currentRoom.visibility === 'closed' ? 'Locked' : 'Waiting to join'}</div></article>`;
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
    const accessNames = { public: 'Public', private: 'Private', closed: 'Closed' };
    const currentAccessName = accessNames[currentRoom.visibility] || 'Private';
    const partyAccessBar = currentRoom.visibility === 'public'
      ? `<div class="party-public-banner"><strong>Public party</strong><span>Anyone can find this group</span></div>`
      : currentRoom.visibility === 'closed'
        ? `<div class="party-public-banner party-closed-banner"><strong>Party closed</strong><span>New players cannot join until the host reopens it.</span></div>`
        : `<div class="party-code-bar"><div class="room-code-label">Invite friends with this code</div><div class="party-code-share"><div class="room-code">${esc(currentRoom.code)}</div><button class="btn quiet" data-action="copy">Copy code</button></div></div>`;
    const accessControl = isHost
      ? `<div class="party-access-menu"><button class="btn quiet party-access-trigger" type="button" data-action="toggle-access" aria-expanded="false">Access: ${currentAccessName} <span aria-hidden="true">▾</span></button><div class="party-access-options" hidden><div class="party-access-heading">Who can join?</div>${[['public','Public','Listed in the server list'],['private','Private','Code or invite link required'],['closed','Closed','Block all new players']].map(([value,label,detail]) => `<button type="button" class="party-access-option ${currentRoom.visibility === value ? 'selected' : ''}" data-party-access="${value}" ${currentRoom.visibility === value ? 'aria-current="true"' : ''}><strong>${label}</strong><small>${detail}</small></button>`).join('')}</div></div>`
      : `<span class="party-access-readonly">Access: ${currentAccessName}</span>`;
    panel.innerHTML = `
      <div class="party-lobby-toolbar">${accessControl}<button class="btn quiet" type="button" data-action="copy-link">Copy invite link</button></div>
      <div class="eyebrow" style="text-align:center">YOUR PARTY</div>
      <h1 class="lobby-title">${esc(currentRoom.partyName || 'Gather your champions')}</h1>
      ${partyAccessBar}
      <div class="party-progress"><span>${currentRoom.players.length}/4 joined</span><span>Choose a hero and ready up</span></div>
      <div class="party-slot-grid">${slots}</div>
      <div class="lobby-actions"><span class="lobby-note">${isHost ? 'The host can start once everyone is ready' : 'The host will start the run when the party is ready.'}</span>
        <div class="lobby-action-buttons"><button class="btn quiet" data-action="leave">Leave party</button><button class="btn secondary" data-action="ready" ${(HEROES.some(character => character.id === self?.hero) || self?.hero === 'Random') ? '' : 'disabled'}>${self?.ready ? 'Cancel ready' : 'Ready up'}</button>${isHost ? `<button class="btn" data-action="start" ${canStart ? '' : 'disabled'}>Start the run</button>` : ''}</div>
      </div>`;
    panel.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => stepLobbyCharacter(Number(button.dataset.step))));
    panel.querySelector('[data-action="copy"]')?.addEventListener('click', copyCode);
    panel.querySelector('[data-action="copy-link"]')?.addEventListener('click', copyJoinLink);
    const accessTrigger = panel.querySelector('[data-action="toggle-access"]');
    accessTrigger?.addEventListener('click', () => {
      const options = panel.querySelector('.party-access-options');
      const opening = options.hidden;
      options.hidden = !opening;
      accessTrigger.setAttribute('aria-expanded', String(opening));
    });
    panel.querySelectorAll('[data-party-access]').forEach(button => button.addEventListener('click', async () => {
      try { await act('visibility', button.dataset.partyAccess); } catch { /* access update error is shown by act */ }
    }));
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
    if (!currentRoom?.code) return;
    try { await navigator.clipboard.writeText(currentRoom.code); showToast(`Room code ${currentRoom.code} copied.`); }
    catch { showToast(`Share room code: ${currentRoom.code}`); }
  }
  async function copyJoinLink() {
    if (!currentRoom?.joinToken) { showToast('The invite link is unavailable for this party.'); return; }
    const link = `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(currentRoom.joinToken)}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast(currentRoom.visibility === 'closed' ? 'Invite link copied; it will work if the host reopens the party.' : 'Code-free invite link copied.');
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = link;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.append(fallback);
      fallback.select();
      const copied = document.execCommand('copy');
      fallback.remove();
      showToast(copied
        ? (currentRoom.visibility === 'closed' ? 'Invite link copied; it will work if the host reopens the party.' : 'Code-free invite link copied.')
        : `Copy this invite link: ${link}`);
    }
  }
  async function leaveRoom() {
    try { await act('leave'); } catch { /* room might already be gone */ }
    clearInterval(pollHandle);
    clearRoomIdentity(); currentRoom = null;
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
    clearRoomIdentity();
    currentRoom = null;
    renderTitleScreen();
  }

  function enterGame() {
    if (!currentRoom) return;
    const solo = currentRoom.mode === 'solo';
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
          <div class="wave-block"><div class="wave-value" id="wave-label">Wave 1 / 10</div></div>
          <div class="progress-wrap"><div class="progress-label"><span id="progress-copy">The slimes are gathering</span><span id="enemy-count">0 enemies</span></div><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div></div>
          <div class="top-stats"><span class="run-clock" title="Run time">TIME <strong id="game-timer">00:00</strong></span><span id="fps-counter" title="Rendered frames per second" ${showFpsCounter?'':'hidden'}>-- FPS</span><span class="ping-counter" id="ping-display" ${showPingDisplay?'':'hidden'}>PING <strong id="ping-value">-- ms</strong></span></div>
          <button class="icon-btn gear-icon" title="Settings and controls" aria-label="Settings and controls" data-action="help">⚙</button>
        </header>
        <div class="game-body">
          <div class="arena-wrap"><canvas id="arena-background" aria-hidden="true"></canvas><canvas id="arena" aria-label="Top-down slime arena"></canvas>
            <div class="mobile-pad" id="mobile-pad" aria-label="Move your champion"></div>
            <div class="overlay" id="game-overlay" hidden></div>
          </div>
          <aside class="side-panel">
            <section class="side-card radar-card"><div class="side-title">Arena Radar</div><div class="minimap" id="minimap"></div></section>
            <section class="side-card"><div class="side-title">Champion Stats</div><div id="party-status"></div></section>
            <section class="side-card run-totals-card"><div class="side-title">Run Stats</div><div class="run-total"><span>Time:</span><strong id="run-time">00:00</strong></div><div class="run-total"><span>Kills:</span><strong id="kill-count">0</strong></div><div class="run-total"><span>Damage Done:</span><strong id="team-damage">0</strong></div><div class="run-total"><span>${solo ? 'Score:' : 'Party Score:'}</span><strong id="team-score">0</strong></div></section>
            <section class="side-card controls-card"><div class="side-title">Controls</div><div class="controls-line"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</div><div class="controls-line"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Move</div><div class="controls-line"><kbd>E</kbd> Champion ability</div><div class="controls-line muted">Get in range to attack</div></section>
            <section class="side-card ability-card"><div class="side-title">Special Ability</div><div class="ability-name" id="ability-name">${esc(getSelf()?.abilityName || hero(getSelf()?.hero).ability)}</div><p class="ability-description" id="ability-description">${esc(hero(getSelf()?.hero).abilityDescription)}</p><div class="ability-cooldown-row"><span>Cooldown</span><strong id="ability-cooldown">10s</strong></div><button class="ability-chip sidebar-ability" id="ability-chip" type="button">E · ${esc(getSelf()?.abilityName || 'Ability')}</button></section>
          </aside>
        </div>
        <footer class="game-bottombar"><div class="hero-hud-group"><span id="hero-hud">${hero(getSelf()?.hero).id}</span><div class="hero-hp-track" id="hero-hp-track" role="progressbar" aria-label="Champion HP" aria-valuemin="0" aria-valuemax="${getSelf()?.maxHp || 100}" aria-valuenow="${Math.max(0, Math.ceil(getSelf()?.hp ?? 0))}"><div class="hero-hp-fill" id="hero-hp-fill" style="width:100%"></div></div></div><div class="game-footer-right"><span class="muted">${solo ? 'Solo · SURVIVE' : 'Multiplayer · SURVIVE'}</span>${solo ? '<button class="icon-btn solo-pause-btn" id="solo-pause" type="button" aria-label="Pause game" aria-pressed="false">ll</button>' : ''}</div></footer>
      </section>`;
    document.querySelector('[data-action="help"]').addEventListener('click', showSettings);
    document.querySelector('#ability-chip').addEventListener('click', () => act('ability'));
    const pauseButton=document.querySelector('#solo-pause');
    pauseButton?.addEventListener('click',async()=>{
      pauseButton.disabled=true;
      try { await act('pause',!Boolean(currentRoom?.game?.paused)); }
      catch { /* act already displays the server error */ }
      finally { if(pauseButton.isConnected) pauseButton.disabled=false; }
    });
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
        if (showFpsCounter && fpsNode) {
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
    const scale = Math.min(width / 1200, height / 1200);
    const ox = (width - 1200 * scale) / 2;
    const oy = (height - 1200 * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#262329'; ctx.fillRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const g = ctx.createLinearGradient(0, 0, 1200, 1200);
    g.addColorStop(0, '#49403c'); g.addColorStop(.48, '#393538'); g.addColorStop(1, '#29272d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 1200);
    // Stonework around the circular coliseum floor.
    ctx.strokeStyle = 'rgba(13,12,15,.23)'; ctx.lineWidth = 1;
    for (let x = 18; x < 1200; x += 58) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1200); ctx.stroke(); }
    for (let y = 18; y < 1200; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(178,132,79,.045)';
    for (let i = 0; i < 90; i++) {
      const x = (i * 197 + 63) % 1180 + 10, y = (i * 113 + 37) % 1180 + 10;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + i % 5, 1.4 + i % 3, i * .31, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(600, 600);
    ctx.beginPath(); ctx.rect(-600, -600, 1200, 1200); ctx.arc(0, 0, 565, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(14,13,17,.38)'; ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(213,173,115,.23)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 510, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(17,15,18,.38)'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.arc(0, 0, 565, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(226,187,123,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 430, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(226,187,123,.13)'; ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * 2 * i / 24; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 440, Math.sin(a) * 440); ctx.lineTo(Math.cos(a) * 505, Math.sin(a) * 505); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(219,175,111,.07)'; ctx.beginPath(); ctx.arc(0, 0, 235, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230,192,139,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 235, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawArenaPillars(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawArena(ctx, width, height, frame) {
    const room = frame?.room || currentRoom;
    if (!room) return;
    const scale = Math.min(width / 1200, height / 1200);
    const ox = (width - 1200 * scale) / 2;
    const oy = (height - 1200 * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const effects = visualEffects(frame, room);
    for (const effect of effects) drawEffect(ctx, effect);
    const alpha = frame?.alpha ?? 1;
    drawProjectiles(ctx, room, frame, alpha);
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
  function visualEffects(frame, room) {
    const before = frame?.before?.effects || new Map();
    const after = frame?.after?.effects || new Map((room.game?.effects || []).map(effect => [effect.id, effect]));
    const targetAt = frame?.targetAt ?? performance.now();
    const visible = [];
    const ids = new Set([...before.keys(), ...after.keys()]);
    for (const id of ids) {
      const effect = after.get(id) || before.get(id);
      const bornAt = Number.isFinite(effect.renderCreatedAt)
        ? effect.renderCreatedAt
        : after.has(id) && frame?.after
          ? frame.after.at - (effect.maxLife - effect.life) * 1000
          : null;
      let life;
      if (Number.isFinite(bornAt)) {
        if (targetAt < bornAt) continue;
        life = effect.maxLife - (targetAt - bornAt) / 1000;
      } else {
        life = effect.life - (targetAt - (frame?.before?.at ?? targetAt)) / 1000;
      }
      life = Math.max(0, Math.min(effect.maxLife, life));
      if (life > 0) visible.push({ ...effect, life });
    }
    return visible;
  }
  function projectilePositionAt(projectile, at, snapshotRoom, snapshotAt = null) {
    if (Number.isFinite(projectile.renderCreatedAt)) {
      if (at < projectile.renderCreatedAt) return null;
      const speed = projectile.speed || 0;
      if (Number.isFinite(snapshotAt) && Number.isFinite(projectile.maxRange)
        && Number.isFinite(projectile.distanceTravelled) && Number.isFinite(projectile.dirX) && Number.isFinite(projectile.dirY)) {
        const remaining = Math.max(0, projectile.maxRange - projectile.distanceTravelled);
        const elapsed = Math.max(0, (at - snapshotAt) / 1000);
        const travel = Math.min(remaining, speed * elapsed);
        if (remaining <= 0.001 || (travel >= remaining && elapsed > 0)) return null;
        return { x: projectile.x + projectile.dirX * travel, y: projectile.y + projectile.dirY * travel };
      }
      let target = null;
      if (projectile.type === 'enemy') target = { x: projectile.tx, y: projectile.ty };
      else target = snapshotRoom?.game?.enemies?.find(enemy => enemy.id === projectile.target);
      if (target && Number.isFinite(projectile.originX) && Number.isFinite(projectile.originY)) {
        const dx = target.x - projectile.originX;
        const dy = target.y - projectile.originY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const elapsed = (at - projectile.renderCreatedAt) / 1000;
        if (speed > 0 && elapsed >= distance / speed) return null;
        const traveled = Math.min(distance, speed * elapsed);
        return { x: projectile.originX + dx / distance * traveled, y: projectile.originY + dy / distance * traveled };
      }
    }
    return { x: projectile.x, y: projectile.y };
  }
  function drawProjectiles(ctx, room, frame, alpha) {
    const before = frame?.before?.projectiles || new Map();
    const after = frame?.after?.projectiles || new Map((room.game?.projectiles || []).map(projectile => [projectile.id, projectile]));
    const afterEffects = frame?.after?.effects || new Map((room.game?.effects || []).map(effect => [effect.id, effect]));
    const impactByProjectile = new Map([...afterEffects.values()]
      .filter(effect => effect.projectileId != null)
      .map(effect => [effect.projectileId, effect]));
    const targetAt = frame?.targetAt ?? performance.now();
    const ids = new Set([...before.keys(), ...after.keys()]);
    for (const id of ids) {
      const old = before.get(id);
      const current = after.get(id);
      const projectile = current || old;
      let point = null;
      if (old && current && frame?.before !== frame?.after) {
        point = { x: old.x + (current.x - old.x) * alpha, y: old.y + (current.y - old.y) * alpha };
      } else if (old && !current) {
        const impact = impactByProjectile.get(id);
        if (impact) {
          const impactAt = Number.isFinite(impact.renderCreatedAt)
            ? impact.renderCreatedAt
            : (frame?.after?.at ?? targetAt) - (impact.maxLife - impact.life) * 1000;
          if (targetAt <= impactAt) {
            const span = Math.max(1, impactAt - (frame?.before?.at ?? targetAt));
            const progress = Math.max(0, Math.min(1, (targetAt - (frame?.before?.at ?? targetAt)) / span));
            point = { x: old.x + (impact.x - old.x) * progress, y: old.y + (impact.y - old.y) * progress };
          }
        } else {
          point = projectilePositionAt(old, targetAt, frame?.before?.room || room, frame?.before?.at ?? null);
        }
      } else {
        const snapshotRoom = current ? (frame?.after?.room || room) : (frame?.before?.room || room);
        point = projectilePositionAt(projectile, targetAt, snapshotRoom);
      }
      if (!point) continue;
      ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = projectile.color || '#fff';
      ctx.fillStyle = projectile.color || '#fff'; ctx.beginPath(); ctx.arc(point.x, point.y, projectile.radius || 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  function drawArenaPillars(ctx) {
    const pillars = Array.from({ length: 8 }, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI / 4;
      return [600 + Math.cos(angle) * 535, 600 + Math.sin(angle) * 535];
    });
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
    if (e.markedUntil > Date.now()) {
      ctx.save(); ctx.fillStyle='#fff0bd'; ctx.shadowColor='#f2bd62'; ctx.shadowBlur=10;
      ctx.font='bold 13px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('☠',0,-r-21); ctx.restore();
    }
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
    const maxLife = Number.isFinite(effect.maxLife) && effect.maxLife > 0 ? effect.maxLife : 1;
    const life = Number.isFinite(effect.life) ? effect.life : 0;
    const effectRadius = Number.isFinite(effect.radius) ? Math.max(0, effect.radius) : 0;
    const t = Math.max(0,Math.min(1,life/maxLife));
    ctx.save(); ctx.globalAlpha=t; ctx.strokeStyle=effect.color; ctx.fillStyle=effect.color;
    const radius=Math.max(0,effectRadius*(1.25-t*.25));
    if (effect.kind==='breath') {
      ctx.globalAlpha=t*.2; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=t*.85; ctx.lineWidth=7*t; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius*.84,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
    } else if (effect.kind==='roots') {
      ctx.globalAlpha=t*.13; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=t*.7; ctx.lineWidth=4; for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.moveTo(effect.x,effect.y);ctx.lineTo(effect.x+Math.cos(a)*radius,effect.y+Math.sin(a)*radius*.7);ctx.stroke();}
    } else {
      ctx.globalAlpha=t*(effect.kind==='pop'?.38:.72); ctx.lineWidth=effect.kind==='slash'?7:3;
      ctx.beginPath(); ctx.arc(effect.x,effect.y,Math.max(6,radius*(1-t*.35)),0,Math.PI*2); ctx.stroke();
      if(effect.kind==='pop'||effect.kind==='burst'){ctx.globalAlpha=t*.35;ctx.beginPath();ctx.arc(effect.x,effect.y,Math.max(0,radius*.45*(1-t)),0,Math.PI*2);ctx.fill();}
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
    const runTime=formatRunTime(g.elapsedTime);
    const timer=document.querySelector('#game-timer'); if(timer) timer.textContent=runTime;
    const sidebarTime=document.querySelector('#run-time'); if(sidebarTime) sidebarTime.textContent=runTime;
    const pingNode=document.querySelector('#ping-value'); if(pingNode) pingNode.textContent=measuredPingMs===null?'-- ms':`${Math.round(measuredPingMs)} ms`;
    const pauseButton=document.querySelector('#solo-pause');
    if(pauseButton){
      const paused=Boolean(g.paused);
      pauseButton.hidden=currentRoom.mode!=='solo'||currentRoom.status!=='playing'||g.phase==='upgrade';
      pauseButton.textContent=paused?'▶':'ll';
      pauseButton.setAttribute('aria-label',paused?'Resume game':'Pause game');
      pauseButton.setAttribute('aria-pressed',String(paused));
    }
    const total=g.waveDuration||20; const progress=g.phase==='wave'?Math.min(100,g.waveElapsed/total*100):g.phase==='upgrade'?100:g.phase==='intro'?0:100;
    const fill=document.querySelector('#progress-fill'); if(fill) fill.style.width=`${progress}%`;
    const copy=document.querySelector('#progress-copy');
    if(copy) copy.textContent=g.phase==='upgrade'?'Choose an upgrade':g.phase==='intro'?'Prepare for the next wave':g.phase==='won'?'The arena is clear':g.phase==='lost'?(currentRoom.mode==='solo'?'You have fallen':'The party has fallen'):`Survive the slime. ${Math.max(0,Math.ceil(total-g.waveElapsed))}s`;
    const count=document.querySelector('#enemy-count'); if(count) count.textContent=`${g.enemies.length} ${g.enemies.length===1?'enemy':'enemies'}`;
    const kills=document.querySelector('#kill-count'); if(kills) kills.textContent=g.teamKills;
    const damage=document.querySelector('#team-damage'); if(damage) damage.textContent=Math.round(g.teamDamage||0);
    const score=document.querySelector('#team-score'); if(score) score.textContent=Math.round((currentRoom.players||[]).reduce((sum,p)=>sum+p.score,0)+(g.waveBonus||0));
    const status=document.querySelector('#party-status');
    const statusMarkup=visualPlayers.map(p=>{
      const profile=hero(p.hero); const stats=profile.stats;
      return `<div class="party-row"><div class="party-row-heading"><div class="party-dot" style="color:${profile.color}">${profile.id[0]}</div><div class="party-player-name"><strong>${esc(p.name)}${p.id===playerId?' [You]':''}</strong><small>${esc(profile.id)}</small></div><span class="party-hp">HP ${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}</span></div><div class="hp-track"><div class="hp-fill" style="width:${p.maxHp?Math.max(0,Math.round(p.hp/p.maxHp*100)):0}%;background:${p.alive?'#79bb70':'#e76850'}"></div></div><div class="hero-stat-line"><span><small>Attack:</small> <strong>${stats.attack}</strong></span><span><small>Range:</small> <strong>${stats.range}</strong></span><span><small>Speed:</small> <strong>${stats.speed}</strong></span><span><small>Attack Speed:</small> <strong>${(1/stats.interval).toFixed(1)}/s</strong></span><span><small>Regen:</small> <strong>${stats.regen} HP/20s</strong></span><span><small>Defense:</small> <strong>${stats.defense}</strong></span></div><div class="player-run-line"><span>Damage Done: ${Math.round(p.damage||0)}</span><span>Kills: ${p.kills||0}</span>${currentRoom.mode==='coop'?`<span>Deaths: ${p.deaths||0}</span>`:''}</div></div>`;
    }).join('');
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
        dot.style.left=`${item.entity.x/1200*100}%`; dot.style.top=`${item.entity.y/1200*100}%`;
      }
    }
    if(self){
      const abilityProfile=hero(self.hero);
      const abilityName=self.abilityName||abilityProfile.ability||'Ability';
      const abilityNameNode=document.querySelector('#ability-name'); if(abilityNameNode) abilityNameNode.textContent=abilityName;
      const abilityDescription=document.querySelector('#ability-description'); if(abilityDescription) abilityDescription.textContent=abilityProfile.abilityDescription||'';
      const abilityCooldown=document.querySelector('#ability-cooldown'); if(abilityCooldown) abilityCooldown.textContent=`${(10*(self.buff?.cooldown||1)).toFixed(1).replace(/\.0$/,'')}s`;
      const chip=document.querySelector('#ability-chip');
      if(chip){const left=Math.ceil(self.abilityCooldown);chip.textContent=left>0?`${left}s · ${abilityName}`:`E · ${abilityName}`;chip.classList.toggle('ready',left<=0&&self.alive&&!g.paused);chip.disabled=left>0||!self.alive||g.paused;}
    }
    const heroHud=document.querySelector('#hero-hud');
    const heroHpTrack=document.querySelector('#hero-hp-track');
    const heroHpFill=document.querySelector('#hero-hp-fill');
    if(heroHud&&visualSelf) {
      const hp=Math.max(0,Math.ceil(visualSelf.hp));
      const maxHp=Math.max(1,visualSelf.maxHp||1);
      const hpRatio=Math.max(0,Math.min(1,visualSelf.hp/maxHp));
      heroHud.textContent=`${visualSelf.hero} · ${hp}/${visualSelf.maxHp} HP`;
      if(heroHpTrack) {
        heroHpTrack.setAttribute('aria-valuemax',String(maxHp));
        heroHpTrack.setAttribute('aria-valuenow',String(hp));
      }
      if(heroHpFill) {
        heroHpFill.style.width=`${hpRatio*100}%`;
        heroHpFill.style.background=hpRatio>.55?'#83cb77':hpRatio>.3?'#e6ba62':'#ef7260';
      }
    }
    updateOverlay();
  }
  function updateOverlay() {
    const node=document.querySelector('#game-overlay');
    if(!node||!currentRoom?.game) return;
    const g=currentRoom.game; const self=getSelf();
    const phaseDisplayTimer=g.phase==='upgrade'?Math.ceil(g.phaseTimer||0):g.phase==='intro'?(g.wave===1&&(g.phaseTimer||0)>1.6?'title':'wave'):'';
    const stateKey=`${g.phase}:${g.wave}:${Boolean(self?.upgradePicked)}:${phaseDisplayTimer}:${g.result||''}`;
    if(stateKey===overlayStateKey)return;
    overlayStateKey=stateKey;
    node.classList.toggle('wave-intro-overlay',g.phase==='intro');
    if(g.phase==='intro') {
      node.hidden=false;
      const romans=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      const showTitle=g.wave===1&&(g.phaseTimer||0)>1.6;
      node.innerHTML=`<div class="wave-intro-copy">${showTitle?'<div class="wave-intro-title">SURVIVE THE SLIME</div>':`<div class="wave-intro-number">Wave ${romans[Math.max(0,Math.min(9,(g.wave||1)-1))]}</div>`}</div>`;
    } else if(g.phase==='upgrade') {
      node.hidden=false;
      if(self?.upgradePicked) {
        const waitCopy=`Waiting for the other players. New wave begins in ${Math.max(0,Math.ceil(g.phaseTimer||0))}s.`;
        const reviveCopy=currentRoom.mode==='solo'?'A solo run ends when your champion falls.':'Downed allies return at the center with some health.';
        node.innerHTML=`<div class="overlay-card"><div class="eyebrow">Wave ${g.wave} cleared</div><h2>Upgrade chosen</h2><p class="muted">${waitCopy}</p><div class="small muted">${reviveCopy}</div></div>`;
      } else {
        const multiplayer=currentRoom.mode==='coop';
        const timerCopy=multiplayer?`Choose before the timer ends: ${Math.max(0,Math.ceil(g.phaseTimer||0))}s`:'The run stays paused until you choose.';
        const upgradeCopy=`Choose one lasting bonus for your run. ${timerCopy}`;
        node.innerHTML=`<div class="overlay-card"><div class="eyebrow">Wave ${g.wave} cleared</div><h2>Choose an upgrade</h2><p class="muted small">${upgradeCopy}</p><div class="upgrade-grid">${UPGRADES.map(u=>`<button class="upgrade-card" data-upgrade="${u.id}"><div class="upgrade-icon">${u.icon}</div><strong>${u.name}</strong><span>${u.text}</span></button>`).join('')}</div><button class="btn quiet reject-upgrades" data-upgrade="skip">Reject all choices</button></div>`;
        node.querySelectorAll('[data-upgrade]').forEach(button=>button.addEventListener('click',async()=>{await act('upgrade',button.dataset.upgrade);sound(520,.1,'triangle');}));
      }
    } else if(g.phase==='won'||g.phase==='lost') {
      node.hidden=false;
      const solo=currentRoom.mode==='solo';
      const players=currentRoom.players||[];
      const score=Math.round(players.reduce((sum,p)=>sum+p.score,0)+(g.waveBonus||0));
      const kills=g.teamKills||0;
      const individualScore=Math.round(players.find(p=>p.id===playerId)?.score||0);
      const survivalCopy=solo?'You survived '+(g.completedWaves||0)+' waves.':'Your party survived '+(g.completedWaves||0)+' waves.';
      const runLabel=solo?(g.phase==='won'?'Solo · Victory':'Solo · Run Lost'):`Party run · ${g.phase==='won'?'victory':'Run Lost'}`;
      const runTime=formatRunTime(g.elapsedTime);
      const resultStats=solo
        ? `<div class="results-score solo-results"><div class="result-box"><strong>${runTime}</strong><span>Time</span></div><div class="result-box"><strong>${kills}</strong><span>Slimes defeated</span></div><div class="result-box"><strong>${Math.round(g.teamDamage||0)}</strong><span>Damage dealt</span></div><div class="result-box"><strong>${score}</strong><span>Score</span></div></div>`
        : `<div class="results-score party-results"><div class="result-box"><strong>${runTime}</strong><span>Time</span></div><div class="result-box"><strong>${kills}</strong><span>Slimes defeated</span></div><div class="result-box"><strong>${Math.round(g.teamDamage||0)}</strong><span>Damage dealt</span></div><div class="result-box"><strong>${individualScore}</strong><span>Individual Score</span></div><div class="result-box"><strong>${score}</strong><span>Party Score</span></div></div>`;
      node.innerHTML=`<div class="overlay-card"><div class="eyebrow">${runLabel}</div><h2>${g.phase==='won'?'The King Slime is defeated':'The slimes claim the arena'}</h2><p class="muted">${g.phase==='won'?'The coliseum is yours. A clean ten-wave clear.':survivalCopy}</p>${resultStats}<button class="btn" data-action="again">Back to the menu</button></div>`;
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
      if(currentScreen!=='game'||currentRoom?.status!=='playing'||currentRoom?.game?.paused) {
        smoothedMoveVector={x:0,y:0};
        moveVector={x:0,y:0};
        keys.clear();
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
        response=await fetch(`/api/rooms/${encodeURIComponent(roomKey)}/action`,{...options,body:JSON.stringify({playerId,action:'move',x,y})});
      } else {
        response=await fetch(`/api/rooms/${encodeURIComponent(roomKey)}/input`,options);
        if(response.status===404) {
          // Keep movement working if an already-running server predates the lightweight input route.
          if(!legacyInputFallback) showToast('Older server detected; using compatibility movement. Restart the server for the optimized route.');
          legacyInputFallback=true;
          response=await fetch(`/api/rooms/${encodeURIComponent(roomKey)}/action`,{...options,body:JSON.stringify({playerId,action:'move',x,y})});
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
    const isSolo=currentRoom?.mode==='solo';
    modal.innerHTML=`<div class="overlay-card settings-card" style="text-align:left">
      <div class="eyebrow">Slime Slayer</div><h2>Settings &amp; quick rules</h2>
      <p class="small muted">Move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys. Your hero attacks automatically when a slime is in range. Press <kbd>E</kbd> to use your champion ability.</p>
      <p class="small muted">Survive the ten waves and pick one upgrade after each cleared wave. ${isSolo?'A solo run ends when your champion falls.':'In co-op, fallen champions return between waves.'} Red slimes burst when defeated. Watch for ranged shots from green, yellow, and black slimes.</p>
      <div class="settings-group">
        <div class="settings-group-title">Audio</div>
        <label class="setting-label" for="master-volume-slider"><span>Master volume</span><output id="master-volume-label">${Math.round(masterVolume*100)}%</output></label>
        <input class="setting-range" id="master-volume-slider" type="range" min="0" max="100" value="${Math.round(masterVolume*100)}">
        <label class="setting-label" for="music-volume-slider"><span>Music</span><output id="music-volume-label">${Math.round(musicVolume*100)}%</output></label>
        <input class="setting-range" id="music-volume-slider" type="range" min="0" max="100" value="${Math.round(musicVolume*100)}">
        <p class="settings-note muted">A music track has not been added yet; this level will apply when one is available.</p>
        <label class="setting-label" for="sfx-volume-slider"><span>Sound effects</span><output id="sfx-volume-label">${Math.round(volume*100)}%</output></label>
        <input class="setting-range" id="sfx-volume-slider" type="range" min="0" max="100" value="${Math.round(volume*100)}">
      </div>
      <div class="settings-group brightness-group">
        <div class="settings-group-title">Display</div>
        <label class="setting-label" for="brightness-slider"><span>Brightness</span><output id="brightness-label">${brightness}%</output></label>
        <input class="setting-range" id="brightness-slider" type="range" min="0" max="100" step="1" value="${brightness}">
        <label class="setting-toggle" for="fps-display-toggle"><span>Show FPS counter</span><input id="fps-display-toggle" type="checkbox" ${showFpsCounter?'checked':''}></label>
        <label class="setting-toggle" for="ping-display-toggle"><span>Show ping</span><input id="ping-display-toggle" type="checkbox" ${showPingDisplay?'checked':''}></label>
      </div>
      <div class="settings-actions">${quitButton}<button class="btn" data-action="close">Close</button></div>
    </div>`;
    document.body.append(modal);
    modal.querySelector('[data-action="close"]').addEventListener('click',()=>modal.remove());
    modal.querySelector('[data-action="quit"]')?.addEventListener('click',()=>{modal.remove();showQuitConfirmation();});
    modal.addEventListener('click',event=>{if(event.target===modal)modal.remove();});
    const bindVolume=(inputId,labelId,storageKey,setValue,preview=false)=>{
      modal.querySelector(`#${inputId}`).addEventListener('input',event=>{
        const percent=Number(event.target.value);
        const level=percent/100;
        setValue(level);
        localStorage.setItem(storageKey,String(level));
        modal.querySelector(`#${labelId}`).textContent=`${percent}%`;
        if(preview)sound(500,.08);
      });
    };
    bindVolume('master-volume-slider','master-volume-label','slime-slayer-master-volume',value=>{masterVolume=value;},true);
    bindVolume('music-volume-slider','music-volume-label','slime-slayer-music-volume',value=>{musicVolume=value;},true);
    bindVolume('sfx-volume-slider','sfx-volume-label','slime-slayer-sfx-volume',value=>{volume=value;},true);
    modal.querySelector('#brightness-slider').addEventListener('input',event=>{
      brightness=Number(event.target.value);
      localStorage.setItem('slime-slayer-brightness',String(brightness));
      modal.querySelector('#brightness-label').textContent=`${brightness}%`;
      applyBrightness();
      sound(660,.08,'triangle');
    });
    modal.querySelector('#fps-display-toggle').addEventListener('change',event=>{
      showFpsCounter=event.target.checked;
      localStorage.setItem('slime-slayer-show-fps',String(showFpsCounter));
      const fpsNode=document.querySelector('#fps-counter'); if(fpsNode) fpsNode.hidden=!showFpsCounter;
    });
    modal.querySelector('#ping-display-toggle').addEventListener('change',event=>{
      showPingDisplay=event.target.checked;
      localStorage.setItem('slime-slayer-show-ping',String(showPingDisplay));
      const pingDisplay=document.querySelector('#ping-display'); if(pingDisplay) pingDisplay.hidden=!showPingDisplay;
    });
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

  // Invite links use an unguessable room token and bypass the manual code prompt.
  applyBrightness();
  const inviteToken = new URLSearchParams(window.location.search).get('invite');
  if (inviteToken) {
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.hash}`);
    app.innerHTML = '<section class="screen title-screen"><div class="title-screen-content"><h1>Joining party…</h1></div></section>';
    void joinRoom(inviteToken, { inviteToken: true });
  } else renderTitleScreen();
})();
