(() => {
  'use strict';

  const HEROES = [
    { id: 'Ravela', role: 'Glass cannon · single-target archer', flavor: 'Mark a target so every hero can hit harder.', color: '#d8c7ef', starColor: '#17141b', art: 'Ravela character art.png', ability: 'Mark of Death', abilityDescription: 'Instantly mark the nearest slime within bow range. All damage to it increases by 50%.', passive: { name: 'Double Shot', description: 'Chance to fire one volley at the two nearest enemies.', statLabel: 'Double Shot Chance', statKey: 'doubleShotChance', format: 'percent' }, stats: { hp: 25, attack: 30, speed: 175, range: 340, interval: 0.62, regen: 0, defense: 0, abilityCooldown: 12, markBonus: 0.5, markDuration: 3.5, doubleShotChance: 0.1, critChance: 5, critMultiplier: 2 } },
    { id: 'Fjord', role: 'Armored tank · close-range mace fighter', flavor: 'A steadfast brawler with a crushing mace and a fiery breath.', color: '#ec9b4b', starColor: '#e7a64e', art: 'Fjord character art.png', ability: 'Fire Breath', abilityDescription: 'Fjord belches forth fire at astonishing speed', passive: { name: 'Iron Hide', description: 'Fjord takes reduced damage from every hit.', statLabel: 'Damage Reduction', statKey: 'defense', format: 'percentPoints' }, stats: { hp: 200, attack: 31, speed: 100, range: 90, fireBreathRange: 250, interval: 1.05, regen: 1, defense: 20, abilityCooldown: 10, fireBreathMultiplier: 3, fireBreathAngle: 80, critChance: 5, critMultiplier: 2 } },
    { id: 'Aram', role: 'Balanced duelist · parry and counter', flavor: 'A measured blade with a chance to stun attackers.', color: '#a4c5a1', starColor: '#c3cbd4', art: 'Aram character art.png', ability: 'Riposte', abilityDescription: 'Become briefly invulnerable and stun nearby slimes.', passive: { name: 'Parry', description: 'Basic attacks have a chance to stun their target.', statLabel: 'Stun Chance', statKey: 'passiveChance', format: 'percent' }, stats: { hp: 50, attack: 28, speed: 145, range: 100, riposteRadius: 150, riposteInvulnerabilityTime: 1.3, riposteStunDuration: 1.25, interval: 0.62, regen: 0.05, defense: 0, abilityCooldown: 14, passiveChance: 0.1, critChance: 10, critMultiplier: 2 } },
    { id: 'Gavrilta', role: 'Control mage · poison and roots', flavor: 'Green magic slows a crowd and wears it down over time.', color: '#82d66e', starColor: '#7064c2', art: 'Gavrilla character art.png', ability: 'Overgrowth', abilityDescription: 'Sends poisonous roots surging toward nearby enemies, binding them and dealing poison damage.', passive: { name: 'Binding Vines', description: 'Thorn bursts poison and briefly root every slime caught in the bramble radius.', statLabel: 'Poison Damage', statKey: 'poisonDamage', format: 'perSecond' }, stats: { hp: 30, attack: 15, speed: 130, range: 300, attackRadius: 70, overgrowthRadius: 150, overgrowthRootDuration: 1.7, overgrowthPoisonDamage: 9, overgrowthPoisonDuration: 2.8, passiveRootDuration: 1, poisonInterval: 0.5, interval: 1.12, regen: 0.05, defense: 0, poisonDamage: 5, abilityCooldown: 10, critChance: 5, critMultiplier: 2 } }
  ];
  const UPGRADE_CARDS = {
    power: { icon: '⚔', name: 'Keen Edge', text: '+20% attack damage' },
    vigor: { icon: '✚', name: 'Coliseum Grit', text: '+20% max health and heal' },
    swift: { icon: '➤', name: 'Fleet Step', text: '+13% movement speed' },
    focus: { icon: '✦', name: 'Deep Focus', text: 'Attacks and abilities recharge 14% faster' },
    'ravela-range': { icon: '➶', name: "Hunter's Reach", text: '+10% range' },
    'ravela-defense': { icon: '⬟', name: 'Warded Armor', text: '+5% defense' },
    'ravela-mark-strength': { icon: '✦', name: 'Deadlier Mark', text: '10% Mark of Death damage increase' },
    'ravela-shot-damage': { icon: '⚔', name: 'Piercing Shot', text: '+15% bow damage' },
    'ravela-regen': { icon: '✚', name: 'Regrowth', text: '+0.1 HP/s' },
    'ravela-mark-duration': { icon: '⌛', name: 'Lingering Mark', text: '+2s Mark of Death debuff duration' },
    'ravela-double-shot': { icon: '➠', name: 'Twin Arrows', text: '+5% double shot chance' },
    'ravela-mark-cooldown': { icon: '⌛', name: 'Quickened Mark', text: '−1s Mark of Death cooldown' },
    'ravela-health': { icon: '✚', name: 'Vitality', text: '+5 HP' },
    'ravela-move-speed': { icon: '➤', name: 'Fleet Step', text: '+10% movement speed' },
    'ravela-attack-speed': { icon: '➠', name: 'Rapid Volley', text: '+10% attack speed' },
    'ravela-crit-chance': { icon: '✧', name: 'Keen Eye', text: '+5% critical hit chance' },
    'ravela-crit-damage': { icon: '✦', name: 'Lethal Aim', text: '+5% critical damage' },
    'fjord-range': { icon: '➶', name: 'Siege Reach', text: '+10% range for mace and Fire Breath' },
    'fjord-defense': { icon: '⬟', name: 'Blackened Plate', text: '+5% damage reduction' },
    'fjord-vigor': { icon: '✚', name: 'Wyrmheart', text: '+20% max health and heal' },
    'fjord-breath-damage': { icon: '♨', name: "Dragon's Furnace", text: '+0.2× Fire Breath damage, up to 5× attack' },
    'fjord-mace-damage': { icon: '⚒', name: 'Cratering Mace', text: '+15% mace damage' },
    'fjord-regen': { icon: '✚', name: 'Banked Embers', text: '+0.1 HP/s regeneration' },
    'fjord-mark-duration': { icon: '⌛', name: 'Lingering Brand', text: '+0.5s to party Mark of Death, up to +2.5s' },
    'fjord-breath-width': { icon: '♨', name: 'Wide Inferno', text: '+10° Fire Breath cone width' },
    'fjord-breath-cooldown': { icon: '⌛', name: 'Quick Bellows', text: '−1s Fire Breath cooldown' },
    'fjord-hp': { icon: '✚', name: 'Stoneblood', text: '+5 max HP' },
    'fjord-move-speed': { icon: '➤', name: 'War March', text: '+10% movement speed' },
    'fjord-attack-speed': { icon: '⚒', name: 'Swift Swing', text: '+10% mace attack speed' },
    'fjord-crit-chance': { icon: '✧', name: 'Hot Eye', text: '+5% critical hit chance' },
    'fjord-crit-damage': { icon: '✦', name: 'Shattering Blow', text: '+5% critical damage' },
    'aram-range': { icon: '➶', name: 'Cloakbound Reach', text: '+10% range for shortsword and Riposte' },
    'aram-defense': { icon: '⬟', name: 'Duskcloak Guard', text: '+5% damage reduction' },
    'aram-vigor': { icon: '✚', name: "Oathkeeper's Resolve", text: '+20% max health and heal' },
    'aram-riposte-invulnerability': { icon: '⬟', name: 'Unbroken Riposte', text: '+0.2s Riposte invulnerability' },
    'aram-slash-damage': { icon: '⚔', name: 'Silver Oath', text: '+15% shortsword damage' },
    'aram-regen': { icon: '✚', name: 'Stillwater Vigor', text: '+0.1 HP/s regeneration' },
    'aram-riposte-stun': { icon: '✦', name: 'Countering Measure', text: '+0.25s Riposte stun' },
    'aram-riposte-radius': { icon: '◉', name: 'Radiant Parry', text: '+10% Riposte radius' },
    'aram-riposte-cooldown': { icon: '⌛', name: 'Quickened Riposte', text: '−1s Riposte cooldown' },
    'aram-hp': { icon: '✚', name: "Knight's Endurance", text: '+5 max HP' },
    'aram-move-speed': { icon: '➤', name: 'Cloakstep', text: '+10% movement speed' },
    'aram-attack-speed': { icon: '⚔', name: 'Dancing Steel', text: '+10% shortsword attack speed' },
    'aram-crit-chance': { icon: '✧', name: "Fencer's Eye", text: '+5% critical hit chance' },
    'aram-crit-damage': { icon: '✦', name: 'Oathsplitter', text: '+5% critical damage' },
    'gavrilta-range': { icon: '➶', name: 'Briarbound Reach', text: '+10% bramble sprout and Overgrowth range' },
    'gavrilta-defense': { icon: '⬟', name: 'Thornweave Mantle', text: '+5% damage reduction' },
    'gavrilta-vigor': { icon: '✚', name: 'Elderroot Vitality', text: '+20% max health and heal' },
    'gavrilta-root-duration': { icon: '⌛', name: 'Snaring Tendrils', text: '+0.25s Overgrowth root and +0.2s Binding Vines root' },
    'gavrilta-thorn-damage': { icon: '♧', name: 'Briarspike Bloom', text: '+15% thorn burst damage' },
    'gavrilta-regen': { icon: '✚', name: 'Verdant Renewal', text: '+0.1 HP/s regeneration' },
    'gavrilta-binding-vines': { icon: '♧', name: 'Venomous Binding', text: '+1 poison damage/s and +0.3s poison duration' },
    'gavrilta-overgrowth-radius': { icon: '◉', name: 'Rootreach Circle', text: '+10% Overgrowth radius' },
    'gavrilta-overgrowth-cooldown': { icon: '⌛', name: 'Quickened Overgrowth', text: '−1s Overgrowth cooldown' },
    'gavrilta-hp': { icon: '✚', name: 'Heartwood Reserve', text: '+5 max HP' },
    'gavrilta-move-speed': { icon: '➤', name: 'Greenstep', text: '+10% movement speed' },
    'gavrilta-attack-speed': { icon: '♧', name: 'Thornwhisper Rhythm', text: '+10% thorn burst attack speed' },
    'gavrilta-crit-chance': { icon: '✧', name: 'Witchwood Insight', text: '+5% critical hit chance' },
    'gavrilta-crit-damage': { icon: '✦', name: 'Bramble Ruin', text: '+5% critical damage' }
  };
  let accountEpoch=0;
  let account = null, connectionFailures = 0, tutorialRun = null;
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
  let minimapDots = new Map();
  let overlayStateKey = '';
  const slimeSpriteCache = new Map();
  const ravelaAimAngles = new Map();
  const fjordAimAngles = new Map();
  const aramAimAngles = new Map();
  const gavriltaAimAngles = new Map();
  const markSmokeOrigins = new Map();
  const ARENA_ART=loadGameArt('Roman coliseum arena.png');
  let arenaArtDrawn=false;
  const RAVELA_GAME_ART = {
    sprite: loadGameArt('Ravela top-down sprite.png'),
    bow: loadGameArt('Ravela bone bow.png'),
    arrow: loadGameArt('Ravela bone arrow.png')
  };
  const FJORD_GAME_ART = {
    sprite: loadGameArt('Fjord top-down sprite.png'),
    shield: loadGameArt('Fjord fire shield.png'),
    mace: loadGameArt('Fjord war mace.png')
  };
  const ARAM_GAME_ART = {
    sprite: loadGameArt('Aram top-down sprite.png'),
    sword: loadGameArt('Aram shortsword.png')
  };
  const GAVRILTA_GAME_ART = {
    sprite: loadGameArt('Gavrilta top-down sprite.png'),
    staff: loadGameArt('Gavrilta thorn staff.png')
  };
  const SLIME_PIXEL_ART = {
    king: loadGameArt('King slime pixel sprite.png'),
    blue: loadGameArt('Blue slime pixel sprite.png'),
    green: loadGameArt('Green slime pixel sprite.png'),
    red: loadGameArt('Red slime pixel sprite.png'),
    yellow: loadGameArt('Yellow slime pixel sprite.png'),
    black: loadGameArt('Black slime pixel sprite.png')
  };
  const POWERUP_ART = {
    hp: loadGameArt('Blue slime potion.png'),
    regen: loadGameArt('Green slime potion.png'),
    attack: loadGameArt('Red slime potion.png'),
    attackSpeed: loadGameArt('Yellow slime potion.png'),
    moveSpeed: loadGameArt('Black slime potion.png')
  };
  const POWERUP_LABELS = { hp: 'HP UP', regen: 'REGEN UP', attack: 'ATK UP', attackSpeed: 'ATK SPD UP', moveSpeed: 'MOVE SPD UP' };

  function loadGameArt(filename) {
    const image = new Image();
    image.src = `/art/${encodeURIComponent(filename)}?v=2026103031-12`;
    return image;
  }

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
  function sidebarMetricRows(rows) {
    return rows.map(([label, value, rowClass = '']) => `<div class="ability-cooldown-row ${esc(rowClass)}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }
  function formatSidebarSeconds(value) {
    return `${Number(value).toFixed(1).replace(/\.0$/, '')}s`;
  }
  function abilitySidebarMetrics(profile, stats) {
    const range = Number(stats.range ?? profile.stats.range);
    const fireBreathRange = Number(stats.fireBreathRange ?? profile.stats.fireBreathRange ?? range);
    const markDuration = Number(stats.markDuration ?? profile.stats.markDuration ?? 3.5);
    const markBonus = Number(stats.markBonus ?? profile.stats.markBonus ?? 0.5);
    const attack = Number(stats.damage ?? stats.attack ?? profile.stats.attack);
    const breathMultiplier = Number(stats.fireBreathMultiplier ?? profile.stats.fireBreathMultiplier ?? 3);
    const breathAngle = Number(stats.fireBreathAngle ?? profile.stats.fireBreathAngle ?? 80);
    const riposteRadius = Number(stats.riposteRadius ?? profile.stats.riposteRadius ?? 150);
    const riposteInvulnerability = Number(stats.riposteInvulnerabilityTime ?? profile.stats.riposteInvulnerabilityTime ?? 1.3);
    const riposteStun = Number(stats.riposteStunDuration ?? profile.stats.riposteStunDuration ?? 1.25);
    const breathMultiplierText = breathMultiplier.toFixed(1).replace(/\.0$/, '');
    switch (profile.id) {
      case 'Ravela': return [
        ['Mark range', String(Math.round(range))],
        ['Mark duration', formatSidebarSeconds(markDuration)],
        ['Damage increase', `${Math.round(markBonus * 100)}%`]
      ];
      case 'Fjord': return [
        ['Breath range', String(Math.round(fireBreathRange))],
        ['Cone width', `${Math.round(breathAngle)}°`],
        ['Damage', `${Math.round(attack * breathMultiplier)} (${breathMultiplierText}× ATK)`, 'fjord-damage-metric']
      ];
      case 'Aram': return [
        ['Invulnerability', formatSidebarSeconds(riposteInvulnerability)],
        ['Riposte radius', String(Math.round(riposteRadius))],
        ['Stun duration', formatSidebarSeconds(riposteStun)]
      ];
      case 'Gavrilta': return [
        ['Root radius', String(Math.round(stats.overgrowthRadius ?? profile.stats.overgrowthRadius))],
        ['Root duration', formatSidebarSeconds(stats.overgrowthRootDuration ?? profile.stats.overgrowthRootDuration)],
        ['Poison damage', `${stats.overgrowthPoisonDamage ?? profile.stats.overgrowthPoisonDamage}/second`],
        ['Poison duration', formatSidebarSeconds(stats.overgrowthPoisonDuration ?? profile.stats.overgrowthPoisonDuration)]
      ];
      default: return [];
    }
  }
  function passiveSidebarMetrics(profile, stats) {
    const passive = profile.passive;
    const rawValue = Number(stats[passive.statKey] ?? profile.stats[passive.statKey] ?? 0);
    const value = passive.format === 'percent'
      ? `${Math.round(rawValue * 100)}%`
      : passive.format === 'percentPoints'
        ? `${Math.round(rawValue)}%`
        : passive.format === 'perTick'
          ? `${rawValue}/tick`
          : passive.format === 'perSecond'
            ? `${rawValue}/second`
          : String(rawValue);
    const rows = [[passive.statLabel, value]];
    if (profile.id === 'Aram') rows.push(['Stun duration', '0.7s']);
    if (profile.id === 'Gavrilta') rows.push(['Poison interval', formatSidebarSeconds(stats.poisonInterval ?? profile.stats.poisonInterval)], ['Root duration', formatSidebarSeconds(stats.passiveRootDuration ?? profile.stats.passiveRootDuration)], ['Burst radius', String(Math.round(stats.attackRadius ?? profile.stats.attackRadius))]);
    return rows;
  }
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
    let response;
    try { response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', signal: AbortSignal.timeout(10000)
    }); } catch(error) { throw new Error(navigator.onLine ? 'Cannot reach the game server. Check your connection and try again.' : 'You are offline. Reconnect to continue.'); }
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
  const combatAudio={run:null,seen:new Set(),cache:new Map(),active:new Set(),charges:new Map()};
  function combatBuffer(kind){
    if(combatAudio.cache.has(kind))return combatAudio.cache.get(kind);
    const rate=24000,durations={arrow:.24,mace:.38,sword:.27,brush:.48,riposte:1.05,mark:1.5,fire:1.25,bell:2.2,squelch:.41,greenSlime:.46,blackSlime:.56,heavySlime:.7,triple:.62,jump:1.8,wind:.92,electric:2,lightning:.33,explosion:.85,hover:.12},duration=durations[kind];
    const buffer=gameAudio.context.createBuffer(1,Math.ceil(rate*duration),rate),out=buffer.getChannelData(0);let seed=1783,low=0,phase=0;
    for(let i=0;i<out.length;i++){
      const t=i/rate,p=t/duration;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const n=(seed>>>0)/2147483648-1;low+=.08*(n-low);const high=n-low;let v=0;
      if(kind==='hover'){v=(Math.sin(2*Math.PI*(1750*t+1500*t*t))+.3*Math.sin(2*Math.PI*2800*t))*.16*Math.exp(-t*34)*(1-Math.exp(-t*700));}
      if(kind==='arrow'){const env=Math.exp(-t*25)*(1-Math.exp(-t*300));v=high*.36*env+Math.sin(2*Math.PI*(430*t-420*t*t))*.22*Math.exp(-t*35);}
      if(kind==='mace'){const env=Math.sin(Math.PI*p)**1.2;v=low*1.6*env+high*.14*env+Math.sin(2*Math.PI*(90*t-60*t*t))*.11*Math.exp(-t*9);}
      if(kind==='sword'){const env=Math.sin(Math.PI*p)**1.4;v=high*.27*env+low*.35*env+Math.sin(2*Math.PI*(1350*t+300*t*t))*.06*Math.exp(-t*14);}
      if(kind==='brush'){const rustle=(.6+.4*Math.sin(2*Math.PI*23*t))*Math.sin(Math.PI*p);v=(high*.25+low*.8)*rustle;v+=Math.sin(2*Math.PI*145*t)*.06*Math.exp(-t*15);}
      if(kind==='riposte'){v=(Math.sin(2*Math.PI*1480*t)+.45*Math.sin(2*Math.PI*2220*t)+.24*Math.sin(2*Math.PI*3715*t))*.14*Math.exp(-t*5)*(1-Math.exp(-t*200))+high*.15*Math.exp(-t*30);}
      if(kind==='mark'){const rise=Math.sin(Math.PI*p)**2;v=low*.9*rise+Math.sin(2*Math.PI*(55*t-8*t*t))*.15*rise+Math.sin(2*Math.PI*(940*t-200*t*t))*.035*rise;for(const at of [.62,.82]){const age=t-at;if(age>=0)v+=Math.sin(2*Math.PI*48*age)*.32*Math.exp(-age*19)*(1-Math.exp(-age*160));}}
      if(kind==='fire'){const env=Math.min(1,t/.08)*Math.min(1,(duration-t)/.3);v=(low*1.15+high*.18)*env*(.75+.25*Math.sin(2*Math.PI*17*t));if(n>.96)v+=high*.1*env;}
      if(kind==='bell'){const env=(1-Math.exp(-t*250))*Math.exp(-t*2);for(const [ratio,amp] of [[1,.2],[2.01,.12],[2.76,.09],[4.07,.06],[5.4,.025]])v+=Math.sin(2*Math.PI*392*ratio*t)*amp*env*Math.exp(-t*(ratio-1)*.35);}
      if(['squelch','greenSlime','blackSlime','heavySlime'].includes(kind)){
        const heavy=kind==='heavySlime',f=heavy?65:kind==='blackSlime'?85:kind==='greenSlime'?145:190;
        const env=(1-Math.exp(-t*110))*Math.exp(-t*(heavy?5:9));v=(Math.sin(2*Math.PI*(f*t-45*t*t))*.34+low*1.5)*env;
        for(const at of [.08,.17]){const age=t-at;if(age>0)v+=Math.sin(2*Math.PI*(f*1.7*age-100*age*age))*.12*Math.exp(-age*22);}
      }
      if(kind==='triple'){for(const at of [0,.055,.11]){const age=t-at;if(age>=0){const env=(1-Math.exp(-age*80))*Math.exp(-age*9);v+=(low*.9+high*.15+Math.sin(2*Math.PI*(125*age-60*age*age))*.12)*env;}}}
      if(kind==='jump'){const pulse=Math.exp(-t*7)+Math.exp(-(((t-1.5)/.2)**2));v=(low*1.9+high*.2)*pulse*Math.min(1,t*70);}
      if(kind==='wind'){const env=Math.sin(Math.PI*p)**.7;v=(low*1.7+high*.12)*env*(.65+.35*Math.sin(2*Math.PI*12*t))+Math.sin(2*Math.PI*90*t)*.09*env;}
      if(kind==='electric'){phase+=2*Math.PI*(180+900*p*p)/rate;v=(Math.sin(phase)+.25*Math.sin(phase*2.013))*.11*(.2+.8*p)+high*.1*(.3+.7*p)*(.6+.4*Math.sin(2*Math.PI*(9*t+12*t*t)));}
      if(kind==='lightning'){v=(high*.55+low*1.1)*Math.exp(-t*12)*(1-Math.exp(-t*500))+Math.sin(2*Math.PI*(100*t-70*t*t))*.15*Math.exp(-t*13);}
      if(kind==='explosion'){const env=(1-Math.exp(-t*400))*Math.exp(-t*7);v=(low*2.3+high*.25+Math.sin(2*Math.PI*(65*t-25*t*t))*.4)*env;}
      const edge=Math.min(1,t/.004)*Math.min(1,(duration-t)/.035);out[i]=Math.tanh(v)*edge;
    }
    combatAudio.cache.set(kind,buffer);return buffer;
  }
  function playCombatAudio(kind,x){
    if(!gameAudio.context||gameAudio.context.state!=='running'||document.hidden||volume<=0||masterVolume<=0||combatAudio.active.size>=18)return;
    const source=gameAudio.context.createBufferSource();source.buffer=combatBuffer(kind);source.playbackRate.value=kind==='bell'||kind==='mark'?1:.96+Math.random()*.08;
    const gain=gameAudio.context.createGain();gain.gain.value=kind==='hover'?.2:kind==='mark'||kind==='bell'?.8:.65;
    const pan=gameAudio.context.createStereoPanner();pan.pan.value=Math.max(-.65,Math.min(.65,((x??600)-(getSelf()?.x??600))/700));
    source.connect(gain);gain.connect(pan);pan.connect(gameAudio.sfxGain);combatAudio.active.add(source);
    source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();combatAudio.active.delete(source);};source.start();source.combatGain=gain;return source;
  }
  function syncCombatAudio(){
    const g=currentRoom?.game;if(!g||g.paused||g.phase!=='wave')return;
    if(combatAudio.run!==g.runId){combatAudio.run=g.runId;combatAudio.seen.clear();}
    const types={'bow-shot':'arrow','mace-sweep':'mace','sword-sweep':'sword','thorn-burst':'brush','riposte-wave':'riposte',mark:'mark',breath:'fire','staff-cast':'bell','blue-strike-hit':'squelch','black-rain-impact':'blackSlime','red-detonation':'explosion'};
    for(const e of g.effects||[]){const soundKind=e.kind==='enemy-audio'?e.sound:types[e.kind];if(!soundKind)continue;const key=e.kind==='bow-shot'?'shot:'+e.projectileId:'fx:'+e.id;if(combatAudio.seen.has(key))continue;combatAudio.seen.add(key);if(e.life>.04)playCombatAudio(soundKind,e.x);}
    const liveCharges=new Set();
    for(const enemy of g.enemies||[]){const c=enemy.attackCharge;if(!c)continue;
      const kind=c.kind==='yellow-dash'&&c.phase!=='dash'?'electric':c.kind==='king-jump'?'jump':c.kind==='king-spin'?'wind':null;
      if(!kind)continue;const key='charge:'+enemy.id+':'+c.startedAt;liveCharges.add(key);
      if(!combatAudio.seen.has(key)){combatAudio.seen.add(key);const source=playCombatAudio(kind,enemy.x);if(source)combatAudio.charges.set(key,source);}
    }
    for(const [key,source] of combatAudio.charges)if(!liveCharges.has(key)||g.paused){source.combatGain.gain.setTargetAtTime(0,gameAudio.context.currentTime,.012);try{source.stop(gameAudio.context.currentTime+.05);}catch{}combatAudio.charges.delete(key);}
    // Support running servers that predate the persistent bow-shot cue.
    for(const p of g.projectiles||[]){if(p.type!=='hero'||currentRoom.players.find(player=>player.id===p.from)?.hero!=='Ravela')continue;const key='shot:'+p.id;if(combatAudio.seen.has(key))continue;combatAudio.seen.add(key);playCombatAudio('arrow',p.originX??p.x);}
    if(combatAudio.seen.size>2048)combatAudio.seen=new Set([...combatAudio.seen].slice(-1024));
  }

  const gameAudio={context:null,musicGain:null,sfxGain:null,buffers:null,loading:null,source:null,run:null,played:new Set()};
  function syncGameAudio(){
    const audio=gameAudio;if(!audio.context)return;
    const g=currentRoom?.game,active=currentScreen==='game'&&currentRoom?.status==='playing';
    audio.musicGain.gain.setTargetAtTime(active&&!g?.paused&&!document.hidden?masterVolume*musicVolume*.42:0,audio.context.currentTime,.12);
    audio.sfxGain.gain.setTargetAtTime(masterVolume*volume*.7,audio.context.currentTime,.025);
    if(!active||g?.paused||document.hidden){for(const source of combatAudio.active){source.combatGain.gain.setTargetAtTime(0,audio.context.currentTime,.012);try{source.stop(audio.context.currentTime+.05);}catch{}}combatAudio.charges.clear();}
    if(!active){if(audio.source){audio.source.stop();audio.source.disconnect();audio.source=null;}audio.run=null;return;}
    syncCombatAudio();
    if(!audio.buffers)return;
    if(audio.run!==g.runId){if(audio.source){audio.source.stop();audio.source.disconnect();}const track=audio.context.createBufferSource();track.buffer=audio.buffers.music;track.loop=true;track.connect(audio.musicGain);track.start();audio.source=track;audio.run=g.runId;}
    if(!audio.played.has(g.runId)){audio.played.add(g.runId);if(audio.played.size>128)audio.played.delete(audio.played.values().next().value);const slime=audio.context.createBufferSource();slime.buffer=audio.buffers.slime;slime.connect(audio.sfxGain);slime.start();slime.onended=()=>slime.disconnect();}
  }
  async function unlockGameAudio(){
    try{
      const audio=gameAudio;
      if(!audio.context){audio.context=new(window.AudioContext||window.webkitAudioContext)();audio.musicGain=audio.context.createGain();audio.sfxGain=audio.context.createGain();audio.musicGain.gain.value=0;audio.musicGain.connect(audio.context.destination);audio.sfxGain.connect(audio.context.destination);}
      if(audio.context.state==='suspended')await audio.context.resume();
      if(!audio.loading)audio.loading=Promise.all(['hills-of-the-colosseum.wav','slime-run-start.wav'].map(async name=>{const response=await fetch('/audio/'+name+'?v=20261030-44');if(!response.ok)throw Error('Audio asset unavailable');return audio.context.decodeAudioData(await response.arrayBuffer());})).then(([music,slime])=>{audio.buffers={music,slime};syncGameAudio();}).catch(()=>{audio.loading=null;});
      syncGameAudio();
    }catch{/* Browsers may defer audio until another explicit gesture. */}
  }
  document.addEventListener('pointerover',event=>{if(event.pointerType==='touch')return;const button=event.target.closest?.('button,[role="button"],input[type="submit"],input[type="button"]');if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||(event.relatedTarget&&button.contains(event.relatedTarget)))return;playCombatAudio('hover');},{passive:true});
  document.addEventListener('pointerdown',()=>void unlockGameAudio(),{passive:true});
  document.addEventListener('keydown',()=>void unlockGameAudio());
  document.addEventListener('visibilitychange',syncGameAudio);

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
    updateAccountIdentity();
    currentScreen = name;
    syncGameAudio();
    if (name !== 'game') stopDrawing();
    if (name !== 'browse-groups') {
      clearInterval(browseGroupsTimer);
      browseGroupsTimer = null;
    }
  }

  function renderTitleScreen() {
    setScreen('title');
    app.innerHTML = `<section class="screen title-screen" aria-label="Slime Slayer title screen">
      <div class="title-art" role="img" aria-label="Ravela, Fjord, Aram and Gavrilta stand before a slime-covered grassy hill and the great coliseum"></div>
      <div class="title-screen-content"><h1>Slime Slayer</h1><button class="press-start" type="button">Press to start</button></div>
    </section>`;
    app.querySelector('.title-screen').addEventListener('click', renderMenu);
  }

  function upgradeAppearance(id){
    if(/regen/.test(id))return {icon:'♻',color:'#80db99'};
    if(/hp|health|vigor/.test(id))return {icon:'♥',color:'#f78191'};
    if(/defense|invulnerability/.test(id))return {icon:'⬟',color:'#a6cce9'};
    if(/attack-speed/.test(id))return {icon:'ϟ',color:'#ffe078'};
    if(/move-speed|swift/.test(id))return {icon:'➤',color:'#7ddcdd'};
    if(/cooldown|focus/.test(id))return {icon:'⌛',color:'#9eb9ff'};
    if(/crit/.test(id))return {icon:'✦',color:'#f4b8ff'};
    if(/range|radius|width/.test(id))return {icon:'◎',color:'#97d2fa'};
    if(/damage|power|shot|slash|mace/.test(id))return {icon:'⚔',color:'#ffac70'};
    return {icon:UPGRADE_CARDS[id]?.icon||'✦',color:'#bba4ef'};
  }
  function updateAccountIdentity(){
    let label=document.querySelector('#account-identity');
    if(!label){label=document.createElement('button');label.type='button';label.id='account-identity';label.className='account-identity';label.onclick=showSignOut;document.body.append(label);}
    label.textContent=account?.username||'';label.setAttribute('aria-label',account?'Sign out of '+account.username:'Account');label.title='Click to sign out';label.hidden=!account;document.body.classList.toggle('has-account',Boolean(account));
  }
  function levelBadge(level,name){return '<span class="level-shield" aria-label="'+esc(name)+' level '+level+'"><span>'+level+'</span></span>';}
  async function refreshAccount(){const epoch=accountEpoch;try{const result=await api('/api/account',null,'GET');if(epoch!==accountEpoch)return;account=result.account;if(account)persistName(account.username);updateAccountIdentity();}catch(e){toastError(e);}}
  function showSignOut(){
    if(!account)return;
    const modal=accountModal('Sign out', '<p>Sign out of <strong>'+esc(account.username)+'</strong>?</p>'+(currentRoom?'<p class="muted">This also leaves your current party or run. Earned account progress will be saved.</p>':'')+'<button class="btn" id="confirm-signout">Sign out</button>');
    modal.querySelector('#confirm-signout').onclick=async e=>{e.target.disabled=true;try{
      accountEpoch++;
      if(currentRoom)await act('leave');
      await api('/api/account/logout',{});
      account=null;accountEpoch++;clearInterval(pollHandle);clearRoomIdentity();currentRoom=null;
      persistName('');localStorage.removeItem('slime-slayer-name');localStorage.setItem('slime-account-signout',String(Date.now()));
      updateAccountIdentity();document.querySelector('#modal-root')?.remove();modal.remove();renderMenu();
    }catch(error){toastError(error);e.target.disabled=false;}};
  }
  window.addEventListener('storage',event=>{if(event.key==='slime-account-signout'){accountEpoch++;account=null;clearInterval(pollHandle);clearRoomIdentity();currentRoom=null;persistName('');updateAccountIdentity();document.querySelector('#account-modal')?.remove();document.querySelector('#modal-root')?.remove();renderMenu();}});

  function accountModal(title,content){
    document.querySelector('#account-modal')?.remove();const modal=document.createElement('div');modal.id='account-modal';modal.className='overlay account-overlay';
    modal.innerHTML=`<section class="overlay-card account-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button class="btn quiet modal-close" aria-label="Close">×</button><h2>${esc(title)}</h2>${content}</section>`;
    document.body.append(modal);modal.querySelector('.modal-close').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.tutorial!=='true')modal.remove();if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,a')].filter(n=>!n.disabled);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}});modal.querySelector('input,button')?.focus();return modal;
  }
  function showAccount(register=false){
    if(account){void showAchievements();return;}
    const modal=accountModal(register?'Create account':'Welcome back',`<p class="muted small">Save scores, unlock champion achievements, and earn character levels.</p><form id="auth-form"><label>Username<input class="text-input" name="username" minlength="3" maxlength="18" pattern="[A-Za-z0-9_]{3,18}" autocomplete="username" required></label><label>Password<input class="text-input" name="password" type="password" minlength="8" maxlength="128" autocomplete="${register?'new-password':'current-password'}" required></label>${register?'<label>Confirm password<input class="text-input" name="confirm" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label>':''}<p class="form-error" role="alert"></p><button class="btn" type="submit">${register?'Create account':'Sign in'}</button></form><button class="btn quiet auth-toggle">${register?'Already have an account? Sign in':'New here? Create account'}</button><p class="small muted">Usernames are unique, ignoring capitalization. Use 3–18 letters, numbers, or underscores. Passwords require at least 8 characters.</p>`);
    modal.querySelectorAll('input[type="password"]').forEach((input,index)=>{
      const wrap=document.createElement('span');wrap.className='password-field';input.replaceWith(wrap);wrap.append(input);
      const toggle=document.createElement('button');toggle.type='button';toggle.className='password-eye';toggle.setAttribute('aria-label','Show '+(index?'confirmation password':'password'));toggle.setAttribute('aria-pressed','false');
      toggle.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
      toggle.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',(show?'Hide ':'Show ')+(index?'confirmation password':'password'));};wrap.append(toggle);
    });
    modal.querySelector('.auth-toggle').onclick=()=>showAccount(!register);
    modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const form=e.target;const button=form.querySelector('button[type="submit"]');button.disabled=true;const b=Object.fromEntries(new FormData(form));try{accountEpoch++;account=(await api(`/api/account/${register?'register':'login'}`,b)).account;persistName(account.username);modal.remove();renderMenu();}catch(error){modal.querySelector('.form-error').textContent=error.message;}finally{button.disabled=false;}};
  }
  async function showLeaderboard(page=0){
    const modal=accountModal('Global high scores','<p role="status">Loading scores…</p>');
    try{const data=await api(`/api/leaderboard?page=${page}`,null,'GET');modal.querySelector('[role="status"]').outerHTML=`<p class="muted small">Best individual run per account · ${data.total} accounts</p><div class="leaderboard-scroll"><table class="global-table"><thead><tr><th>Rank</th><th>Player</th><th>Best score</th></tr></thead><tbody>${data.rows.map((r,i)=>`<tr><td>${page*50+i+1}</td><td>${esc(r.username)}</td><td>${r.score.toLocaleString()}</td></tr>`).join('')||'<tr><td colspan="3">No accounts yet. Be the first!</td></tr>'}</tbody></table></div><div class="result-actions"><button class="btn quiet" data-page="${page-1}" ${page===0?'disabled':''}>Previous</button><span>Page ${page+1}</span><button class="btn quiet" data-page="${page+1}" ${(page+1)*50>=data.total?'disabled':''}>Next</button></div>`;modal.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showLeaderboard(Number(b.dataset.page)));}catch(e){modal.querySelector('[role="status"]').textContent=e.message;}
  }
  async function showAchievements(){
    await refreshAccount();if(!account){showAccount();return;}
    accountModal(`${account.username} · Champion legacy`,`<p>High score: <strong>${account.highscore.toLocaleString()}</strong></p><p class="muted small">Complete ten waves with each champion to earn their golden splash portrait.</p><div class="achievement-grid">${account.characters.map(p=>`<article class="achievement-tile ${p.achievement?'unlocked':'locked'}"><div class="achievement-frame"><img src="/art/${encodeURIComponent(p.hero+' golden achievement.png')}?v=20261030-33" alt="Golden ${p.hero} achievement" width="80" height="80"></div><strong>${p.hero}</strong><span>${p.achievement?'Ten-wave champion':'Complete 10 waves to unlock'}</span></article>`).join('')}</div>`);
  }
  async function showTutorial(){
    if(account?.tutorialSeen||(!account&&sessionStorage.getItem('slime-hide-tutorial')))return;
    if(currentScreen!=='game')return;
    const solo=currentRoom?.mode==='solo';if(solo&&!currentRoom.game.paused)await act('pause',true).catch(()=>{});
    const modal=accountModal('Your first steps in the arena',`<p>Move with WASD or arrow keys. On a phone, drag the thumbstick. Your champion attacks nearby slimes automatically.</p><p>Press E or tap the ability button to cast your special ability. Avoid red warnings, collect potions, and choose an upgrade after each wave.</p><p>Clear ten waves to win, then continue into endless mode. Escape pauses solo play or opens the leave prompt in multiplayer.</p>${account?'':'<label class="setting-toggle tutorial-toggle"><input type="checkbox" id="hide-tutorial"><span>Don’t show again during this browser session</span></label>'}<button class="btn" id="tutorial-done">Ready to fight</button>`);
    modal.dataset.tutorial='true';
    const dismiss=async()=>{if(account){try{await api('/api/account/tutorial',{});account.tutorialSeen=true;}catch(e){toastError(e);}}else if(modal.querySelector('#hide-tutorial')?.checked)sessionStorage.setItem('slime-hide-tutorial','1');modal.remove();if(solo&&currentRoom?.status==='playing')await act('pause',false).catch(()=>{});};
    modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();void dismiss();}});
    modal.querySelector('#tutorial-done').onclick=dismiss;modal.querySelector('.modal-close').onclick=dismiss;modal.addEventListener('click',e=>{if(e.target===modal)void dismiss();});
  }

  function renderMenu() {
    setScreen('menu');
    app.innerHTML = `
      <section class="screen menu-screen intro-screen">
        ${gearButton()}
        <div class="menu-wrap">
          <header class="brand">
            <div class="brand-mark">✦</div>
            <h1>Slime Slayer</h1>
            <div class="subtitle">Roguelike</div>
          </header>
          <p class="intro"><span class="intro-lead">Hold the coliseum against a tsunami of slime!</span><span class="intro-support">Choose your champion to brave the tides alone or survive with your fellow adventurers</span></p>
          <div class="mode-select">
            <button class="mode-card" data-action="solo"><span class="mode-symbol">⚔</span><span class="mode-title">Solo</span><span class="mode-caption">Singleplayer</span></button>
            <button class="mode-card" data-action="party"><span class="mode-symbol party-pawns" aria-hidden="true">♟♟♟♟</span><span class="mode-title">Party</span><span class="mode-caption">Multiplayer</span></button>
          </div>
          <div class="account-menu">${account?'':'<button class="btn quiet" data-action="account">Sign in / Create account</button>'}<button class="btn quiet" data-action="leaderboard">Global leaderboard</button>${account?'<button class="btn quiet" data-action="achievements">Achievements</button>':''}</div><footer class="menu-foot">Up to four players · WASD / arrows / drag to move · E / tap button to use your ability</footer>
          <button class="btn quiet credits-trigger" type="button" data-action="credits">Credits</button>
        </div>
      </section>`;
    app.querySelector('[data-action="account"]')?.addEventListener('click',()=>showAccount());
    app.querySelector('[data-action="leaderboard"]').addEventListener('click',()=>showLeaderboard());
    app.querySelector('[data-action="achievements"]')?.addEventListener('click',showAchievements);
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
      <div class="solo-bottom"><label class="sr-only" for="solo-player-name">Your name</label><input id="solo-player-name" ${account?'readonly':''} class="text-input solo-name" maxlength="18" placeholder="Your name" value="${esc(playerName)}">
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
      <div class="portrait"><img src="/art/${encodeURIComponent(h.art)}" alt="${h.id} character art">${account?levelBadge(account.characters.find(p=>p.hero===h.id)?.level||1,h.id):''}</div>
      <div class="hero-meta"><div class="hero-name"><span>${h.id}</span><span class="hero-star" style="color:${h.starColor}">✦</span></div><div class="hero-role">${h.role}</div><div class="hero-flair">${h.flavor}</div></div></button>`;
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
    const requestedRoomKey = roomKey;
    try {
      const result = await api(`/api/rooms/${encodeURIComponent(roomKey)}?playerId=${encodeURIComponent(playerId)}`, null, 'GET');
      if(roomKey!==requestedRoomKey)return;
      const pingSample = performance.now() - pollStartedAt;
      measuredPingMs = measuredPingMs === null ? pingSample : measuredPingMs * .7 + pingSample * .3;
      // A GET that began before our character action was acknowledged may contain
      // the previous hero. Keep the immediate local choice until a later GET sees it.
      const preserveLobbyHero = currentScreen === 'lobby' && pollStartedAt < lobbyHeroActionAckAt;
      if(connectionFailures) showToast('Connection restored.'); connectionFailures=0;
      acceptRoom(result.room, preserveLobbyHero);
    } catch (error) {
      if (roomKey !== requestedRoomKey || currentScreen === 'quitting') return;
      connectionFailures++;
      if(connectionFailures<5 && !/not found|not in the room|Sign in/i.test(error.message)){if(connectionFailures===1)showToast('Connection interrupted. Reconnecting…');return;}
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
    syncGameAudio();
    if(room.status==='playing' && room.game?.runId!==tutorialRun) { tutorialRun=room.game?.runId; setTimeout(showTutorial,100); }
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
    const effects = new Map((game?.effects || []).map(effect => {
      const snapshotEffect = { ...effect, renderCreatedAt: renderEventAt(effect.createdAt) };
      if (effect.kind === 'mark') {
        const key = `${room.id}:${game?.startedAt || 0}:${effect.id}`;
        let origin = markSmokeOrigins.get(key);
        if (!origin) {
          const source = (room.players || []).filter(player => player.hero === 'Ravela')
            .sort((a, b) => Math.hypot(a.x - effect.x, a.y - effect.y) - Math.hypot(b.x - effect.x, b.y - effect.y))[0];
          if (source) {
            const distance = Math.hypot(source.x - effect.x, source.y - effect.y);
            origin = { originX: source.x, originY: source.y, travelDuration: Math.max(.08, Math.min(.22, distance / 2100)) };
            markSmokeOrigins.set(key, origin);
            if (markSmokeOrigins.size > 128) markSmokeOrigins.delete(markSmokeOrigins.keys().next().value);
          }
        }
        if (origin) Object.assign(snapshotEffect, origin);
      }
      return [effect.id, snapshotEffect];
    }));
    snapshots.push({
      at, room,
      players: new Map((room.players || []).map(player => [player.id, player])),
      enemies: new Map((game?.enemies || []).map(enemy => [enemy.id, enemy])),
      projectiles: new Map((game?.projectiles || []).map(projectile => [projectile.id, {
        ...projectile, renderCreatedAt: renderEventAt(projectile.createdAt)
      }])),
      effects
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
    app.innerHTML = `<section class="screen lobby-screen">${gearButton()}<div class="lobby-panel" id="lobby-panel"></div><section class="lobby-chat"><h2>Party chat</h2><div id="chat-messages" role="log" aria-live="polite"></div><form id="chat-form"><input class="text-input" id="chat-input" placeholder="Message your party…" maxlength="200" aria-label="Party message" required><button class="btn" type="submit">Send</button></form></section></section>`;
    app.querySelector('[data-action="settings"]').addEventListener('click', showSettings);
    document.querySelector('#chat-form').onsubmit=async e=>{e.preventDefault();const input=document.querySelector('#chat-input');const text=input.value;try{await act('chat',text);input.value='';}catch{}};
    updateLobby(true);
  }
  function lobbySignature() {
    if (!currentRoom) return '';
    return JSON.stringify({ id: currentRoom.id, code: currentRoom.code, visibility: currentRoom.visibility, status: currentRoom.status, host: currentRoom.hostId,
      players: currentRoom.players.map(p => [p.id, p.name, p.hero, p.ready, p.online]) });
  }
  function updateLobby(force = false) {
    if (!currentRoom || currentScreen !== 'lobby') return;
    const messages=document.querySelector('#chat-messages');
    if(messages && messages.dataset.last!==(currentRoom.chat?.at(-1)?.id||'')){messages.innerHTML=(currentRoom.chat||[]).map(m=>'<p><strong>'+esc(m.name)+':</strong> '+esc(m.text)+'</p>').join('');messages.dataset.last=currentRoom.chat?.at(-1)?.id||'';messages.scrollTop=messages.scrollHeight;}
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
        ? `<div class="lobby-portrait-wrap"><img class="slot-portrait" src="/art/${encodeURIComponent(h.art)}" alt="${esc(h.id)} character art">${p.characterLevels?levelBadge(p.characterLevels[h.id]||1,h.id):''}</div>`
        : `<div class="slot-portrait empty-portrait ${p.hero === 'Random' ? 'random-portrait' : ''}"><span>${p.hero === 'Random' ? '?' : '＋'}</span></div>`;
      const nameControl = isSelf
        ? `<label class="name-input-label" for="lobby-player-name">Your name</label><input id="lobby-player-name" class="text-input lobby-name-input" ${account?'readonly':''} maxlength="18" value="${esc(p.name)}" aria-label="Your player name">`
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
    const portrait = card.querySelector('.lobby-portrait-wrap') || card.querySelector('.slot-portrait');
    if (portrait) {
      portrait.outerHTML = selected
        ? `<div class="lobby-portrait-wrap"><img class="slot-portrait" src="/art/${encodeURIComponent(selected.art)}" alt="${esc(selected.id)} character art">${self.characterLevels?levelBadge(self.characterLevels[selected.id]||1,selected.id):''}</div>`
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
    const selfHeroProfile = hero(getSelf()?.hero);
    setScreen('game');
    smoothedMoveVector = { x: 0, y: 0 };
    lastMovementUpdateAt = performance.now();
    overlayStateKey = '';
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
          <aside class="left-panel" aria-label="Controls and player leaderboard">
            <section class="side-card controls-card"><div class="side-title">Controls</div><div class="controls-line"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Move</span></div><div class="controls-line"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><span>Move</span></div><div class="controls-line"><kbd>E</kbd><span>Champion ability</span></div><div class="controls-line muted">Attacks happen automatically</div></section>
            ${solo ? `<section class="side-card solo-character-card"><div class="side-title">Your Champion</div><img class="solo-character-art" src="/art/${encodeURIComponent(selfHeroProfile.art)}" alt="${esc(selfHeroProfile.id)} character art"><div class="solo-character-name">${esc(selfHeroProfile.id)}</div></section>` : ''}
            ${solo ? '' : '<section class="side-card leaderboard-card"><div class="side-title">Player Leaderboard</div><div class="leaderboard-list" id="leaderboard-list"></div></section>'}
            <section class="side-card ability-card"><div class="side-title">Special Ability</div><div class="ability-name" id="ability-name">${esc(selfHeroProfile.ability || getSelf()?.abilityName || 'Ability')}</div><p class="ability-description" id="ability-description">${esc(selfHeroProfile.abilityDescription)}</p><div class="ability-cooldown-row"><span>Cooldown</span><strong id="ability-cooldown">10s</strong></div><div class="sidebar-metrics" id="ability-stats"></div><button class="ability-chip sidebar-ability" id="ability-chip" type="button">E · ${esc(selfHeroProfile.ability || getSelf()?.abilityName || 'Ability')}</button></section>
          </aside>
          <div class="arena-wrap"><canvas id="arena-background" aria-hidden="true"></canvas><canvas id="arena" aria-label="Top-down slime arena"></canvas>
            <button class="mobile-cast btn" id="mobile-cast" aria-label="Cast special ability">Ability</button><div class="mobile-pad" id="mobile-pad" aria-label="Move your champion"></div>
            <div class="overlay" id="game-overlay" hidden></div>
          </div>
          <aside class="side-panel" aria-label="Arena information and champion stats">
            <section class="side-card radar-card"><div class="side-title">Arena Radar</div><div class="minimap" id="minimap"></div></section>
            <section class="side-card champion-stats-card"><div class="side-title">${solo ? 'Champion Stats' : 'Party Champion Stats'}</div><div id="party-status"></div></section>
            <section class="side-card run-totals-card"><div class="side-title">Run Stats</div><div class="run-total"><span>Time:</span><strong id="run-time">00:00</strong></div><div class="run-total"><span>Kills:</span><strong id="kill-count">0</strong></div><div class="run-total"><span>Damage Done:</span><strong id="team-damage">0</strong></div><div class="run-total"><span>${solo ? 'Score:' : 'Party Score:'}</span><strong id="team-score">0</strong></div></section>
            <section class="side-card passive-card"><div class="side-title">Passive Ability</div><div class="ability-name" id="passive-name">${esc(selfHeroProfile.passive.name)}</div><p class="ability-description" id="passive-description">${esc(selfHeroProfile.passive.description)}</p><div class="sidebar-metrics" id="passive-stats"></div></section>
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
    document.querySelector('#mobile-cast').onclick=()=>act('ability').catch(()=>{});
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
      if (w !== lastW || h !== lastH || (!arenaArtDrawn && ARENA_ART.complete && ARENA_ART.naturalWidth)) {
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
    if(ARENA_ART.complete && ARENA_ART.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.save();ctx.filter="brightness(80%)";ctx.drawImage(ARENA_ART,-48,-55,1296,1344);ctx.restore();arenaArtDrawn=true;ctx.setTransform(1,0,0,1,0,0);return;}
    arenaArtDrawn=false;
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
    for (const effect of effects) drawEffect(ctx, effect, room, frame);
    drawPowerups(ctx, room);
    const alpha = frame?.alpha ?? 1;
    drawProjectiles(ctx, room, frame, alpha);
    const oldEnemies = frame?.before?.enemies;
    for (const enemy of room.game?.enemies || []) {
      const old = oldEnemies?.get(enemy.id);
      const x = old ? old.x + (enemy.x - old.x) * alpha : enemy.x;
      const y = old ? old.y + (enemy.y - old.y) * alpha : enemy.y;
      drawEnemyTelegraph(ctx, enemy, x, y, room, frame);
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
      drawHero(ctx, visualPlayer, x, y, room, frame);
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
      const source = room.players?.find(player => player.id === projectile.from);
      if (projectile.type === 'hero' && source?.hero === 'Ravela') {
        const dx = current && old ? current.x - old.x : projectile.dirX || 1;
        const dy = current && old ? current.y - old.y : projectile.dirY || 0;
        const angle = Math.hypot(dx, dy) > 0.001 ? Math.atan2(dy, dx) : Math.atan2(projectile.dirY || 0, projectile.dirX || 1);
        const outline = hero(source.hero).starColor;
        ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(angle);
        const arrowArt = RAVELA_GAME_ART.arrow;
        if (arrowArt.complete && arrowArt.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(arrowArt, -14, -5.25, 28, 10.5);
        } else {
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = outline; ctx.lineWidth = 3.3;
          ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(9, 0); ctx.stroke();
          ctx.strokeStyle = '#d9ceb4'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(8, 0); ctx.stroke();
          ctx.fillStyle = '#f0e5ca'; ctx.strokeStyle = outline; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(6, -4); ctx.lineTo(8, 0); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = outline; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-16, -3); ctx.moveTo(-12, 0); ctx.lineTo(-16, 3); ctx.stroke();
        }
        ctx.restore();
      } else {
        const outline = source?.hero ? hero(source.hero).starColor : '#ddd6c8';
        ctx.save();
        ctx.fillStyle = projectile.color || '#fff'; ctx.strokeStyle = outline; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.arc(point.x, point.y, projectile.radius || 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
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
    const sprites = [['king',48,'#e04c63']];
    for (const [type,radius,color] of sprites) slimeSprite(type,radius,color);
  }
  function drawSlime(ctx, e, x = e.x, y = e.y) {
    const r = e.size || 18;
    if(e.type==='king' && e.attackCharge?.kind==='king-jump') {
      ctx.save();ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,65,40,0,0,Math.PI*2);ctx.fill();ctx.restore();return;
    }
    const pixelArt = SLIME_PIXEL_ART[e.type];
    const hasPixelArt = Boolean(pixelArt?.complete && pixelArt.naturalWidth > 0);
    const sprite = hasPixelArt ? null : slimeSprite(e.type, r, e.color);
    const drawSize = hasPixelArt ? r * 2 + 20 : sprite.size;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = e.stunnedUntil > Date.now() ? .65 : 1;
    if (hasPixelArt) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pixelArt, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else ctx.drawImage(sprite.canvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    const markRemaining = (e.markedUntil || 0) - Date.now();
    if (markRemaining > 0) {
      const markDuration = Math.max(1, e.markDurationMs || 3500);
      const fade = Math.max(0, Math.min(1, markRemaining / markDuration));
      ctx.save(); ctx.globalAlpha *= fade; ctx.fillStyle='#fff';
      ctx.font='bold 24px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.lineWidth=1.25; ctx.strokeStyle='rgba(24,21,25,.92)'; ctx.strokeText('☠',0,-r-24); ctx.fillText('☠',0,-r-24); ctx.restore();
    }
    if (e.hp < e.maxHp || e.type === 'king') {
      const bw = e.type==='king'?190:r*2.2; ctx.fillStyle='rgba(13,12,15,.8)'; ctx.fillRect(-bw/2,-r-11,bw,e.type==='king'?9:4);
      ctx.fillStyle=e.type==='king'?'#f1c86c':'#84d373'; ctx.fillRect(-bw/2,-r-11,bw*Math.max(0,e.hp/e.maxHp),e.type==='king'?9:4);
    }
    if(e.hp<e.maxHp||e.type==='king'){ctx.strokeStyle='#e7c573';ctx.lineWidth=1;const width=e.type==='king'?190:r*2.2;ctx.strokeRect(-width/2-1,-r-12,width+2,e.type==='king'?11:6);}

    ctx.restore();
  }
  function visualEnemyPosition(enemy, frame) {
    const previous = frame?.before?.enemies?.get(enemy.id);
    const current = frame?.after?.enemies?.get(enemy.id) || enemy;
    if (previous && current && frame?.before !== frame?.after) {
      const alpha = Math.max(0, Math.min(1, frame?.alpha ?? 1));
      return { x: previous.x + (current.x - previous.x) * alpha, y: previous.y + (current.y - previous.y) * alpha };
    }
    return { x: enemy.x, y: enemy.y };
  }
  function visualPlayerPosition(player, frame) {
    const previous = frame?.before?.players?.get(player.id);
    const current = frame?.after?.players?.get(player.id) || player;
    if (previous && current && frame?.before !== frame?.after) {
      const alpha = Math.max(0, Math.min(1, frame?.alpha ?? 1));
      return { x: previous.x + (current.x - previous.x) * alpha, y: previous.y + (current.y - previous.y) * alpha };
    }
    return { x: player.x, y: player.y };
  }
  function drawPowerups(ctx, room) {
    for (const powerup of room?.game?.powerups || []) {
      const image = POWERUP_ART[powerup.type];
      const label = POWERUP_LABELS[powerup.type] || 'POWER UP';
      const bob = Math.sin(performance.now() / 250 + Number(powerup.id || 0)) * 1.2;
      ctx.save(); ctx.translate(powerup.x, powerup.y);
      ctx.fillStyle = 'rgba(9,9,12,.46)'; ctx.beginPath(); ctx.ellipse(0, 8, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      if (image?.complete && image.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, -13, -20 + bob, 26, 29);
      } else {
        ctx.fillStyle = '#e4dfce'; ctx.strokeStyle = '#211e22'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-8, -11 + bob, 16, 21, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#6db957'; ctx.fillRect(-6, 1 + bob, 12, 6);
      }
      ctx.fillStyle = 'rgba(15,13,17,.86)'; ctx.strokeStyle = 'rgba(222,194,142,.65)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-25, 11, 50, 11, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6e6c6'; ctx.font = '700 7px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 16.5);
      ctx.restore();
    }
  }
  function drawWarningCircle(ctx, x, y, radius, progress) {
    const intensity = 0.15 + Math.max(0, Math.min(1, progress)) * 0.78;
    ctx.save(); ctx.globalAlpha = intensity;
    ctx.fillStyle = '#dd413b'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = Math.min(1, intensity + 0.08); ctx.strokeStyle = '#f05249'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = intensity * 0.62; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, radius * 0.84, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawWarningPath(ctx, x1, y1, x2, y2, progress, width = 3) {
    const intensity = 0.15 + Math.max(0, Math.min(1, progress)) * 0.78;
    ctx.save(); ctx.globalAlpha = intensity; ctx.strokeStyle = '#ed4842'; ctx.lineWidth = width;
    ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#f45c52'; ctx.beginPath(); ctx.arc(x2, y2, 4 + intensity * 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawDashLightning(ctx, x1, y1, x2, y2, seed, progress) {
    const dx = x2 - x1, dy = y2 - y1, distance = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / distance, ny = dx / distance;
    ctx.save(); ctx.lineCap = 'square'; ctx.globalAlpha = 0.86;
    for (let bolt = 0; bolt < 2; bolt++) {
      const points = [[x1, y1]];
      for (let i = 1; i < 8; i++) {
        const u = i / 8;
        const jitter = (effectRandom(seed, i, Math.floor(progress * 15) + bolt * 9) - 0.5) * 24;
        points.push([x1 + dx * u + nx * jitter, y1 + dy * u + ny * jitter]);
      }
      points.push([x2, y2]);
      ctx.strokeStyle = '#302b25'; ctx.lineWidth = bolt ? 4 : 5; ctx.beginPath();
      ctx.moveTo(...points[0]); for (const point of points.slice(1)) ctx.lineTo(...point); ctx.stroke();
      ctx.strokeStyle = bolt ? '#f6dc79' : '#fff0a3'; ctx.lineWidth = bolt ? 1.7 : 2.2; ctx.beginPath();
      ctx.moveTo(...points[0]); for (const point of points.slice(1)) ctx.lineTo(...point); ctx.stroke();
      const mid = points[3 + bolt];
      ctx.strokeStyle = '#e6c85d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid[0], mid[1]);
      ctx.lineTo(mid[0] + nx * 9, mid[1] + ny * 9); ctx.lineTo(mid[0] + nx * 13 - dx / distance * 4, mid[1] + ny * 13 - dy / distance * 4); ctx.stroke();
    }
    ctx.restore();
  }
  function drawEnemyTelegraph(ctx, enemy, x, y, room, frame) {
    const charge = enemy.attackCharge;
    if (!charge) return;
    const progress = Math.max(0, Math.min(1, charge.progress || 0));
    const player = room?.players?.find(item => item.id === charge.targetPlayerId);
    const targetPoint = player ? visualPlayerPosition(player, frame) : { x: charge.targetX ?? x, y: charge.targetY ?? y };
    if(charge.kind.startsWith('king-')) {
      const jump=charge.kind==='king-jump';
      drawWarningCircle(ctx,jump?charge.targetX:x,jump?charge.targetY:y,charge.radius,progress);
      if(charge.kind==='king-spin'){ctx.save();ctx.strokeStyle='#badfff';ctx.lineWidth=4;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x,y,70+i*12,progress*16+i,progress*16+i+1.8);ctx.stroke();}ctx.restore();}
    } else if (charge.kind === 'red-fuse') {
      drawWarningCircle(ctx, x, y, 105, progress);
    } else if (charge.kind === 'blue-strike') {
      drawWarningCircle(ctx, targetPoint.x, targetPoint.y, 26, progress);
    } else if (charge.kind === 'green-shot') {
      drawWarningPath(ctx, x, y, targetPoint.x, targetPoint.y, progress, 2.5);
    } else if (charge.kind === 'yellow-dash') {
      const endX = charge.phase === 'dash' ? charge.toX : targetPoint.x;
      const endY = charge.phase === 'dash' ? charge.toY : targetPoint.y;
      drawWarningPath(ctx, charge.phase === 'dash' ? charge.fromX : x, charge.phase === 'dash' ? charge.fromY : y, endX, endY, charge.phase === 'dash' ? 1 : progress, 3.5);
      if (charge.phase === 'dash') drawDashLightning(ctx, charge.fromX, charge.fromY, x, y, enemy.id, progress);
      else {
        const flicker = performance.now() / 55;
        for (let i = 0; i < 3; i++) {
          const angle = flicker + i * Math.PI * 2 / 3;
          const sx = x + Math.cos(angle) * (enemy.size + 3), sy = y + Math.sin(angle) * (enemy.size + 3);
          ctx.save(); ctx.globalAlpha = 0.36 + progress * 0.48; ctx.strokeStyle = '#f4de83'; ctx.lineWidth = 1.7;
          ctx.beginPath(); ctx.moveTo(sx - 4, sy - 3); ctx.lineTo(sx, sy); ctx.lineTo(sx - 2, sy + 5); ctx.stroke(); ctx.restore();
        }
      }
    } else if (charge.kind === 'black-rain') {
      const endX = charge.targetX, endY = charge.targetY;
      drawWarningCircle(ctx, endX, endY, 58, progress);
      ctx.save();
      for (let drop = 0; drop < 6; drop++) {
        const delay = drop * 0.075;
        if (progress < delay) continue;
        const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
        const arcX = charge.originX + (endX - charge.originX) * p;
        const arcY = charge.originY + (endY - charge.originY) * p - Math.sin(p * Math.PI) * (48 + drop % 3 * 5);
        const shadowX = charge.originX + (endX - charge.originX) * p;
        const shadowY = charge.originY + (endY - charge.originY) * p;
        const scale = 0.72 + (drop % 3) * 0.15;
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#19171f'; ctx.beginPath(); ctx.ellipse(shadowX, shadowY, 6 * scale, 3.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.72 + (drop % 2) * 0.2; ctx.fillStyle = '#584d68'; ctx.strokeStyle = '#211e29'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(arcX, arcY, (7 + Math.sin(p * Math.PI) * 3) * scale, (6 + Math.sin(p * Math.PI) * 2) * scale, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b09cc4'; ctx.fillRect(arcX - 2 * scale, arcY - 3 * scale, 3 * scale, 2 * scale);
      }
      ctx.restore();
    }
  }
  function ravelaBowAimAngle(player, x, y, room, frame) {
    const enemies = room?.game?.enemies || [];
    const serverNow = room?.serverTime || Date.now();
    let target = enemies
      .filter(enemy => enemy.markedUntil > serverNow)
      .sort((a, b) => (b.markStartedAt || 0) - (a.markStartedAt || 0))[0] || null;
    if (!target) {
      const latestShot = (room?.game?.projectiles || [])
        .filter(projectile => projectile.type === 'hero' && projectile.from === player.id && serverNow - (projectile.createdAt || 0) < 900)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
      if (latestShot) target = enemies.find(enemy => enemy.id === latestShot.target) || null;
    }
    if (!target) {
      const range = Number(player.stats?.range) || HEROES[0].stats.range;
      let closestDistance = range;
      for (const enemy of enemies) {
        const position = visualEnemyPosition(enemy, frame);
        const distance = Math.hypot(position.x - x, position.y - y);
        if (distance <= closestDistance) { target = enemy; closestDistance = distance; }
      }
    }
    const targetPosition = target ? visualEnemyPosition(target, frame) : null;
    const requestedAngle = targetPosition ? Math.atan2(targetPosition.y - y, targetPosition.x - x) : null;
    const restAngle = Math.atan2(7, 18);
    const targetAimBlend = requestedAngle === null ? 0 : 1;
    const now = performance.now();
    const previous = ravelaAimAngles.get(player.id);
    if (!previous) {
      const angle = requestedAngle ?? restAngle;
      ravelaAimAngles.set(player.id, { angle, aimBlend: targetAimBlend, at: now });
      return { angle, aimBlend: targetAimBlend };
    }
    const targetAngle = requestedAngle ?? restAngle;
    const delta = Math.atan2(Math.sin(targetAngle - previous.angle), Math.cos(targetAngle - previous.angle));
    const elapsed = Math.max(0, Math.min(100, now - previous.at));
    const angle = previous.angle + delta * (1 - Math.exp(-elapsed / 70));
    const previousBlend = previous.aimBlend ?? (requestedAngle === null ? 0 : 1);
    const aimBlend = previousBlend + (targetAimBlend - previousBlend) * (1 - Math.exp(-elapsed / 90));
    ravelaAimAngles.set(player.id, { angle, aimBlend, at: now });
    return { angle, aimBlend };
  }
  function fjordWeaponAimAngle(player, x, y, room, frame) {
    const enemies = room?.game?.enemies || [];
    const range = Math.max(
      Number(player.stats?.range) || HEROES.find(profile => profile.id === 'Fjord').stats.range,
      Number(player.stats?.fireBreathRange) || 0
    );
    let target = null;
    let closestDistance = range;
    for (const enemy of enemies) {
      const position = visualEnemyPosition(enemy, frame);
      const distance = Math.hypot(position.x - x, position.y - y);
      if (distance <= closestDistance) { target = enemy; closestDistance = distance; }
    }
    const targetPosition = target ? visualEnemyPosition(target, frame) : null;
    const requestedAngle = targetPosition ? Math.atan2(targetPosition.y - y, targetPosition.x - x) : null;
    const restAngle = Math.PI / 2;
    const now = performance.now();
    const previous = fjordAimAngles.get(player.id);
    if (!previous) {
      const angle = requestedAngle ?? restAngle;
      fjordAimAngles.set(player.id, { angle, at: now });
      return { angle, hasTarget: target !== null };
    }
    const targetAngle = requestedAngle ?? restAngle;
    const delta = Math.atan2(Math.sin(targetAngle - previous.angle), Math.cos(targetAngle - previous.angle));
    const elapsed = Math.max(0, Math.min(100, now - previous.at));
    const angle = previous.angle + delta * (1 - Math.exp(-elapsed / 70));
    fjordAimAngles.set(player.id, { angle, at: now });
    return { angle, hasTarget: target !== null };
  }
  function aramSwordAimAngle(player, x, y, room, frame) {
    const enemies = room?.game?.enemies || [];
    const range = Number(player.stats?.range) || HEROES.find(profile => profile.id === 'Aram').stats.range;
    let target = null;
    let closestDistance = range;
    for (const enemy of enemies) {
      const position = visualEnemyPosition(enemy, frame);
      const distance = Math.hypot(position.x - x, position.y - y);
      if (distance <= closestDistance) { target = enemy; closestDistance = distance; }
    }
    const targetPosition = target ? visualEnemyPosition(target, frame) : null;
    const requestedAngle = targetPosition ? Math.atan2(targetPosition.y - y, targetPosition.x - x) : null;
    const restAngle = Math.PI / 2;
    const now = performance.now();
    const previous = aramAimAngles.get(player.id);
    if (!previous) {
      const angle = requestedAngle ?? restAngle;
      aramAimAngles.set(player.id, { angle, at: now });
      return { angle, hasTarget: target !== null };
    }
    const targetAngle = requestedAngle ?? restAngle;
    const delta = Math.atan2(Math.sin(targetAngle - previous.angle), Math.cos(targetAngle - previous.angle));
    const elapsed = Math.max(0, Math.min(100, now - previous.at));
    const angle = previous.angle + delta * (1 - Math.exp(-elapsed / 70));
    aramAimAngles.set(player.id, { angle, at: now });
    return { angle, hasTarget: target !== null };
  }
  function drawHero(ctx, p, x = p.x, y = p.y, room = currentRoom, frame = null) {
    const h = hero(p.hero);
    ctx.save(); ctx.translate(x,y);
    if (!p.alive) { ctx.globalAlpha=.42; }
    const ravelaSprite = p.hero === 'Ravela' && RAVELA_GAME_ART.sprite.complete && RAVELA_GAME_ART.sprite.naturalWidth > 0;
    const fjordSprite = p.hero === 'Fjord' && FJORD_GAME_ART.sprite.complete && FJORD_GAME_ART.sprite.naturalWidth > 0;
    const aramSprite = p.hero === 'Aram' && ARAM_GAME_ART.sprite.complete && ARAM_GAME_ART.sprite.naturalWidth > 0;
    const gavriltaSprite = p.hero === 'Gavrilta' && GAVRILTA_GAME_ART.sprite.complete && GAVRILTA_GAME_ART.sprite.naturalWidth > 0;
    const pixelSprite = ravelaSprite || fjordSprite || aramSprite || gavriltaSprite;
    ctx.fillStyle='rgba(12,12,15,.5)'; ctx.beginPath(); ctx.ellipse(1,5,pixelSprite?23.75:19,pixelSprite?12.5:10,0,0,Math.PI*2); ctx.fill();
    if (ravelaSprite) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(RAVELA_GAME_ART.sprite, -27.5, -30, 55, 60);
      ctx.restore();
      const bow = RAVELA_GAME_ART.bow;
      if (bow.complete && bow.naturalWidth > 0) {
        const bowWidth = 28, bowHeight = 40, aim = ravelaBowAimAngle(p, x, y, room, frame);
        const orbitRadius = 20;
        const gripX = Math.cos(aim.angle) * orbitRadius;
        const gripY = Math.sin(aim.angle) * orbitRadius;
        ctx.save(); ctx.translate(gripX, gripY); ctx.rotate(aim.angle * aim.aimBlend); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bow, -bowWidth * (7 / 24), -bowHeight * (21 / 44), bowWidth, bowHeight);
        ctx.restore();
      }
    } else if (fjordSprite) {
      const aim = fjordWeaponAimAngle(p, x, y, room, frame);
      const aimAngle = aim.angle;
      const shield = FJORD_GAME_ART.shield;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(FJORD_GAME_ART.sprite, -29.5, -30, 59, 60);
      ctx.restore();
      if (shield.complete && shield.naturalWidth > 0) {
        const shieldOrbitAngle = aim.hasTarget ? aimAngle - 0.58 : Math.atan2(8, 28);
        const shieldRadius = aim.hasTarget ? 28 : Math.hypot(28, 8);
        ctx.save(); ctx.translate(Math.cos(shieldOrbitAngle) * shieldRadius, Math.sin(shieldOrbitAngle) * shieldRadius);
        ctx.rotate(aim.hasTarget ? shieldOrbitAngle + Math.PI / 2 : -0.18); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(shield, -17, -21, 34, 42);
        ctx.restore();
      }
      const swinging = (room?.game?.effects || []).some(effect => effect.kind === 'mace-sweep' && effect.sourcePlayerId === p.id);
      const mace = FJORD_GAME_ART.mace;
      if (!swinging && mace.complete && mace.naturalWidth > 0) {
        ctx.save();
        const handRadius = 13;
        ctx.translate(Math.cos(aimAngle + 0.3) * handRadius, Math.sin(aimAngle + 0.3) * handRadius);
        ctx.rotate(aimAngle); ctx.imageSmoothingEnabled = false;
        ctx.drawImage(mace, -6, -10, 38, 23);
        ctx.restore();
      }
    } else if (aramSprite) {
      const aim = aramSwordAimAngle(p, x, y, room, frame);
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ARAM_GAME_ART.sprite, -27.5, -30, 55, 60);
      ctx.restore();
      const swinging = (room?.game?.effects || []).some(effect => effect.kind === 'sword-sweep' && effect.sourcePlayerId === p.id);
      const sword = ARAM_GAME_ART.sword;
      if (!swinging && sword.complete && sword.naturalWidth > 0) {
        if (aim.hasTarget) {
          const orbitAngle = aim.angle + 0.3;
          ctx.save(); ctx.translate(Math.cos(orbitAngle) * 17, Math.sin(orbitAngle) * 17);
          ctx.rotate(aim.angle);
        } else {
          ctx.save(); ctx.translate(16, 8);
          ctx.rotate(Math.PI / 2 - 0.38);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sword, -6, -8, 38, 16);
        ctx.restore();
      }
    } else if (gavriltaSprite) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(GAVRILTA_GAME_ART.sprite, -27.5, -30, 55, 60);
      ctx.restore();
      const staff = GAVRILTA_GAME_ART.staff;
      if (staff.complete && staff.naturalWidth > 0) {
        const raising = (room?.game?.effects || []).some(effect => effect.sourcePlayerId === p.id && ['staff-cast', 'thorn-burst', 'overgrowth-vines'].includes(effect.kind));
        ctx.save();
        ctx.translate(15, raising ? 1 : 6);
        ctx.rotate(raising ? -0.39 : -0.23);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(staff, -8, -25, 18, 50);
        ctx.restore();
      }
    } else {
      ctx.fillStyle=h.color; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=h.starColor; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#211c20'; ctx.font='700 12px Inter, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.hero.slice(0,1),0,1);
    }
    if (p.marked) { ctx.strokeStyle='#f0bc58'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,pixelSprite?31:21,0,Math.PI*2); ctx.stroke(); }
    ctx.fillStyle='#fff1d7'; ctx.font='600 11px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.name.slice(0,12),0,pixelSprite?-36:-25);
    const w=34; const healthY=pixelSprite?32:20; ctx.fillStyle='rgba(15,13,14,.75)'; ctx.fillRect(-w/2,healthY,w,4); ctx.fillStyle=p.hp/p.maxHp>.33?'#83cb77':'#ef7260'; ctx.fillRect(-w/2,healthY,w*Math.max(0,p.hp/p.maxHp),4); ctx.strokeStyle='#e7c573';ctx.lineWidth=1;ctx.strokeRect(-w/2-1,healthY-1,w+2,6);
    if (!p.alive) { ctx.fillStyle='#fff'; ctx.font='700 9px Inter'; ctx.fillText('DOWN',0,pixelSprite?49:34); }
    ctx.restore();
  }
  function drawBreathFlame(ctx, x, y, angle, length, width, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#a82a20';
    ctx.beginPath();
    ctx.moveTo(-length * 0.65, -width * 0.28);
    ctx.quadraticCurveTo(-length * 0.28, -width * 0.95, length * 0.03, -width * 0.38);
    ctx.quadraticCurveTo(length * 0.48, -width * 0.28, length, 0);
    ctx.quadraticCurveTo(length * 0.45, width * 0.34, length * 0.02, width * 0.4);
    ctx.quadraticCurveTo(-length * 0.32, width * 0.86, -length * 0.65, width * 0.28);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f05a22';
    ctx.beginPath();
    ctx.moveTo(-length * 0.48, -width * 0.2);
    ctx.quadraticCurveTo(-length * 0.04, -width * 0.55, length * 0.62, 0);
    ctx.quadraticCurveTo(-length * 0.02, width * 0.48, -length * 0.48, width * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffad36';
    ctx.beginPath();
    ctx.moveTo(-length * 0.32, -width * 0.12);
    ctx.quadraticCurveTo(-length * 0.01, -width * 0.37, length * 0.38, 0);
    ctx.quadraticCurveTo(-length * 0.01, width * 0.31, -length * 0.32, width * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe79a';
    ctx.beginPath();
    ctx.moveTo(-length * 0.2, -width * 0.08);
    ctx.quadraticCurveTo(length * 0.03, -width * 0.19, length * 0.2, 0);
    ctx.quadraticCurveTo(length * 0.02, width * 0.16, -length * 0.2, width * 0.08);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function effectRandom(seed, index, channel = 0) {
    const value = Math.sin((seed + 1) * 12.9898 + (index + 1) * 78.233 + channel * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }
  function drawThornBurst(ctx, effect, room, frame, t, maxLife) {
    const target = room?.game?.enemies?.find(enemy => enemy.id === effect.targetEnemyId);
    const point = target ? visualEnemyPosition(target, frame) : { x: effect.x, y: effect.y };
    const age = maxLife * (1 - t);
    const growth = Math.max(0, Math.min(1, age / 0.24));
    const fade = Math.min(1, t * 3.2);
    const radius = Math.max(18, effect.radius || 70);
    const seed = Number(effect.id) || 0;
    ctx.save(); ctx.translate(point.x, point.y); ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(69,92,44,.12)'; ctx.beginPath(); ctx.arc(0, 0, radius * (0.55 + growth * 0.45), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(39,48,31,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, radius * (0.42 + growth * 0.52), 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + (effectRandom(seed, i, 0) - 0.5) * 0.16;
      const startRadius = radius * (0.23 + effectRandom(seed, i, 1) * 0.3);
      const length = (12 + effectRandom(seed, i, 2) * 18) * growth;
      const bx = Math.cos(angle) * startRadius, by = Math.sin(angle) * startRadius;
      const tx = Math.cos(angle) * (startRadius + length), ty = Math.sin(angle) * (startRadius + length);
      ctx.globalAlpha = fade * (0.72 + effectRandom(seed, i, 3) * 0.25);
      ctx.strokeStyle = '#282a22'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = i % 3 === 0 ? '#b2c66b' : '#76964b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      for (let thorn = 0; thorn < 2; thorn++) {
        const along = 0.42 + thorn * 0.25;
        const sx = bx + (tx - bx) * along, sy = by + (ty - by) * along;
        const side = thorn % 2 === 0 ? 1 : -1;
        const branch = 4 + effectRandom(seed, i, thorn + 4) * 4;
        const ex = sx + Math.cos(angle + side * 0.92) * branch * growth;
        const ey = sy + Math.sin(angle + side * 0.92) * branch * growth;
        ctx.strokeStyle = '#303126'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#9bb85c'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawOvergrowthWave(ctx, effect, t, maxLife) {
    const age = maxLife * (1 - t);
    const travel = Number(effect.travelDuration) || 0.52;
    const progress = Math.max(0, Math.min(1, age / travel));
    const fade = age <= travel ? 0.76 : Math.max(0, 0.76 * (1 - (age - travel) / Math.max(0.01, maxLife - travel)));
    const radius = Math.max(0, effect.radius || 0) * progress;
    if (radius < 1 || fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade * 0.18;
    ctx.fillStyle = '#75994a';
    ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = fade * 0.72;
    ctx.strokeStyle = '#273022'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#a9c96b'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
    // A faint trailing edge makes the wave read as a moving front alongside the vines.
    if (progress > 0.09) {
      ctx.globalAlpha = fade * 0.22; ctx.strokeStyle = '#7d9f50'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, radius * 0.91, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function drawOvergrowthVines(ctx, effect, room, frame, t, maxLife) {
    const source = room?.players?.find(player => player.id === effect.sourcePlayerId);
    const target = room?.game?.enemies?.find(enemy => enemy.id === effect.targetEnemyId);
    const from = Number.isFinite(effect.originX) && Number.isFinite(effect.originY)
      ? { x: effect.originX, y: effect.originY }
      : source ? visualPlayerPosition(source, frame) : { x: effect.x, y: effect.y };
    const to = target ? visualEnemyPosition(target, frame) : { x: effect.x, y: effect.y };
    const dx = to.x - from.x, dy = to.y - from.y, distance = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / distance, ny = dx / distance;
    const age = maxLife * (1 - t), travel = Number(effect.travelDuration) || 0.52;
    const progress = Math.max(0, Math.min(1, age / travel));
    const seed = Number(effect.id) || 0;
    const pointAt = u => ({
      x: from.x + dx * u + nx * Math.sin(u * Math.PI * 5 + seed * 0.4 + age * 5) * Math.sin(u * Math.PI) * 7,
      y: from.y + dy * u + ny * Math.sin(u * Math.PI * 5 + seed * 0.4 + age * 5) * Math.sin(u * Math.PI) * 7
    });
    if (progress > 0) {
      const steps = Math.max(2, Math.ceil(18 * progress));
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * progress, b = ((i + 1) / steps) * progress;
        const pa = pointAt(a), pb = pointAt(b);
        const underground = (i + Math.floor(seed)) % 4 === 0;
        ctx.globalAlpha = t * (underground ? 0.4 : 0.85);
        ctx.strokeStyle = '#25271e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.strokeStyle = underground ? '#586c3b' : '#80a94b'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        if (i > 0 && i % 3 === 0 && !underground) {
          const thornX = (pa.x + pb.x) / 2, thornY = (pa.y + pb.y) / 2;
          ctx.strokeStyle = '#313126'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(thornX, thornY); ctx.lineTo(thornX + nx * 5, thornY + ny * 5 - 2); ctx.stroke();
          ctx.strokeStyle = '#a5bf65'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(thornX, thornY); ctx.lineTo(thornX + nx * 5, thornY + ny * 5 - 2); ctx.stroke();
        }
      }
      ctx.restore();
    }
    const wrap = Math.max(0, Math.min(1, (age - travel) / 0.14));
    if (!wrap) return;
    const size = target?.size || Math.max(16, effect.radius - 22);
    ctx.save(); ctx.translate(to.x, to.y + size * 0.28); ctx.globalAlpha = t * wrap; ctx.lineCap = 'round';
    for (let loop = 0; loop < 3; loop++) {
      const rx = size * (0.48 + loop * 0.12), ry = size * (0.23 + loop * 0.035);
      const start = -0.55 + loop * 1.95 + seed * 0.11;
      ctx.strokeStyle = '#25271e'; ctx.lineWidth = 5 - loop * 0.5; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, -0.12 + loop * 0.1, start, start + Math.PI * 1.58); ctx.stroke();
      ctx.strokeStyle = loop === 1 ? '#a6c668' : '#6f9744'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, -0.12 + loop * 0.1, start, start + Math.PI * 1.58); ctx.stroke();
    }
    ctx.strokeStyle = '#2b2b20'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-size * 0.3, -size * 0.12); ctx.quadraticCurveTo(0, size * 0.2, size * 0.32, -size * 0.08); ctx.stroke();
    ctx.strokeStyle = '#a3c263'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-size * 0.3, -size * 0.12); ctx.quadraticCurveTo(0, size * 0.2, size * 0.32, -size * 0.08); ctx.stroke();
    ctx.restore();
  }
  function drawEffect(ctx, effect, room = currentRoom, frame = null) {
    const maxLife = Number.isFinite(effect.maxLife) && effect.maxLife > 0 ? effect.maxLife : 1;
    const life = Number.isFinite(effect.life) ? effect.life : 0;
    const effectRadius = Number.isFinite(effect.radius) ? Math.max(0, effect.radius) : 0;
    const t = Math.max(0,Math.min(1,life/maxLife));
    ctx.save(); ctx.globalAlpha=t; ctx.strokeStyle=effect.color; ctx.fillStyle=effect.color;
    const radius=Math.max(0,effectRadius*(1.25-t*.25));
    if ((effect.kind==='bow-shot'||effect.kind==='enemy-audio')) {
      // Audio-only shot event.
    } else if (effect.kind==='damage-number') {
      ctx.font=effect.critical?'bold 19px Georgia':'bold 15px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#16131d';
      const y=effect.y-14-(1-t)*38;ctx.strokeText(effect.text,effect.x,y);ctx.fillText(effect.text,effect.x,y);
    } else if (effect.kind==='overgrowth-wave') {
      drawOvergrowthWave(ctx, effect, t, maxLife);
    } else if (effect.kind==='staff-cast') {
      // This short-lived cue raises Gavrilta's staff without adding a second floor effect.
    } else if (effect.kind==='thorn-burst') {
      drawThornBurst(ctx, effect, room, frame, t, maxLife);
    } else if (effect.kind==='overgrowth-vines') {
      drawOvergrowthVines(ctx, effect, room, frame, t, maxLife);
    } else if (effect.kind==='powerup-pickup') {
      ctx.globalAlpha = t; ctx.fillStyle = '#fff0c5'; ctx.strokeStyle = '#211d20'; ctx.lineWidth = 2;
      ctx.font = '700 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = effect.text || 'POWER UP';
      ctx.strokeText(label, effect.x, effect.y - 12 - (1 - t) * 18); ctx.fillText(label, effect.x, effect.y - 12 - (1 - t) * 18);
    } else if (effect.kind==='red-detonation' || effect.kind==='black-rain-impact' || effect.kind==='blue-strike-hit' || effect.kind==='yellow-dash-impact') {
      const progress = 1 - t;
      ctx.globalAlpha = t * 0.72; ctx.strokeStyle = effect.color; ctx.lineWidth = 4 * t;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, Math.max(8, effectRadius * progress), 0, Math.PI * 2); ctx.stroke();
      if (effect.kind === 'black-rain-impact') {
        ctx.globalAlpha = t * 0.28; ctx.fillStyle = '#6c5b7d'; ctx.beginPath(); ctx.arc(effect.x, effect.y, effectRadius * progress * 0.7, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 9; i++) {
          const a = i * Math.PI * 2 / 9, d = effectRadius * progress * (0.45 + effectRandom(effect.id, i, 2) * 0.35);
          ctx.fillStyle = '#9181a5'; ctx.beginPath(); ctx.arc(effect.x + Math.cos(a) * d, effect.y + Math.sin(a) * d, 3 + (i % 2), 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (effect.kind==='critical') {
      ctx.globalAlpha=t; ctx.fillStyle=effect.color; ctx.shadowColor=effect.color; ctx.shadowBlur=10;
      ctx.font='700 12px Inter,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('CRITICAL!',effect.x,effect.y-16-(1-t)*18);
    } else if (effect.kind==='mark') {
      drawMarkSmoke(ctx, effect, room, frame);
      ctx.globalAlpha=t*.9; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(effect.x,effect.y,radius,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=t; ctx.font='700 16px Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('✦',effect.x,effect.y);
    } else if (effect.kind==='mace-sweep') {
      const source = effect.sourcePlayerId
        ? room?.players?.find(player => player.id === effect.sourcePlayerId)
        : room?.players?.filter(player => player.hero === 'Fjord')
          .sort((a, b) => Math.hypot(a.x - effect.x, a.y - effect.y) - Math.hypot(b.x - effect.x, b.y - effect.y))[0];
      const sourcePosition = source ? visualPlayerPosition(source, frame) : null;
      const originX = sourcePosition?.x ?? effect.x;
      const originY = sourcePosition?.y ?? effect.y;
      const centerAngle = Number.isFinite(effect.angle) ? effect.angle : -Math.PI / 2;
      const halfAngle = Number.isFinite(effect.coneAngle) ? effect.coneAngle / 2 : Math.PI / 3;
      const progress = 1 - t;
      const startAngle = centerAngle - halfAngle;
      const sweepAngle = startAngle + progress * halfAngle * 2;
      const swingRadius = Math.min(72, Math.max(36, effectRadius * 0.76));
      const totalSweep = halfAngle * 2;
      const angularSpeed = totalSweep / maxLife;
      const trailDuration = 0.12;
      const trailStart = Math.max(startAngle, sweepAngle - angularSpeed * trailDuration);
      const trailSegments = 8;
      ctx.lineCap = 'round';
      for (let i = 0; i < trailSegments; i++) {
        const segmentStart = trailStart + (sweepAngle - trailStart) * i / trailSegments;
        const segmentEnd = trailStart + (sweepAngle - trailStart) * (i + 1) / trailSegments;
        const segmentAge = Math.max(0, (sweepAngle - (segmentStart + segmentEnd) / 2) / angularSpeed);
        const fade = Math.max(0, 1 - segmentAge / trailDuration);
        if (!fade) continue;
        ctx.globalAlpha = 0.48 * fade;
        ctx.strokeStyle = '#d99a54'; ctx.lineWidth = 8 * fade;
        ctx.beginPath(); ctx.arc(originX, originY, swingRadius, segmentStart, segmentEnd); ctx.stroke();
      }
      const mace = FJORD_GAME_ART.mace;
      if (mace.complete && mace.naturalWidth > 0) {
        ctx.save();
        ctx.translate(originX + Math.cos(sweepAngle) * swingRadius, originY + Math.sin(sweepAngle) * swingRadius);
        ctx.rotate(sweepAngle); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.92;
        ctx.drawImage(mace, -34, -13, 44, 27);
        ctx.restore();
      }
    } else if (effect.kind==='sword-sweep') {
      const source = room?.players?.find(player => player.id === effect.sourcePlayerId);
      const sourcePosition = source ? visualPlayerPosition(source, frame) : null;
      const originX = sourcePosition?.x ?? effect.x;
      const originY = sourcePosition?.y ?? effect.y;
      const centerAngle = Number.isFinite(effect.angle) ? effect.angle : -Math.PI / 2;
      const progress = 1 - t;
      const startAngle = centerAngle - 0.8;
      const endAngle = centerAngle + 0.12;
      const sweepAngle = startAngle + (endAngle - startAngle) * progress;
      const swingRadius = Math.min(48, Math.max(32, effectRadius * 0.46));
      const angularSpeed = (endAngle - startAngle) / maxLife;
      const trailDuration = 0.1;
      const trailStart = Math.max(startAngle, sweepAngle - angularSpeed * trailDuration);
      ctx.lineCap = 'round'; ctx.strokeStyle = '#cbd8dc';
      for (let i = 0; i < 7; i++) {
        const from = trailStart + (sweepAngle - trailStart) * i / 7;
        const to = trailStart + (sweepAngle - trailStart) * (i + 1) / 7;
        const age = Math.max(0, (sweepAngle - (from + to) / 2) / angularSpeed);
        const fade = Math.max(0, 1 - age / trailDuration);
        if (!fade) continue;
        ctx.globalAlpha = 0.48 * fade; ctx.lineWidth = 4 * fade;
        ctx.beginPath(); ctx.arc(originX, originY, swingRadius, from, to); ctx.stroke();
      }
      const sword = ARAM_GAME_ART.sword;
      if (sword.complete && sword.naturalWidth > 0) {
        ctx.save();
        ctx.translate(originX + Math.cos(sweepAngle) * swingRadius, originY + Math.sin(sweepAngle) * swingRadius);
        ctx.rotate(sweepAngle); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.96;
        ctx.drawImage(sword, -22, -9, 44, 18);
        ctx.restore();
      }
    } else if (effect.kind==='riposte-wave') {
      const source = room?.players?.find(player => player.id === effect.sourcePlayerId);
      const sourcePosition = source ? visualPlayerPosition(source, frame) : null;
      const originX = sourcePosition?.x ?? effect.x;
      const originY = sourcePosition?.y ?? effect.y;
      const age = maxLife * (1 - t);
      const ringTravel = 0.68;
      const ringDelay = 0.12;
      const waveProgress = Math.max(0, Math.min(1, age / ringTravel));
      for (let ring = 0; ring < 3; ring++) {
        const ringAge = age - ring * ringDelay;
        if (ringAge < 0) continue;
        const progress = Math.max(0, Math.min(1, ringAge / ringTravel));
        const afterglow = Math.max(0, 1 - Math.max(0, ringAge - ringTravel) / 0.25);
        const ringRadius = effectRadius * progress;
        ctx.globalAlpha = 0.62 * afterglow * (1 - ring * 0.12);
        ctx.strokeStyle = ring === 1 ? '#d1e1e5' : '#edf3f0';
        ctx.lineWidth = 3 - ring * 0.55;
        ctx.beginPath(); ctx.arc(originX, originY, ringRadius, 0, Math.PI * 2); ctx.stroke();
      }
      const seed = Number(effect.id) || 0;
      const sparkleCount = 24;
      for (let i = 0; i < sparkleCount; i++) {
        const birth = effectRandom(seed, i, 6) * 0.34;
        if (age < birth) continue;
        const sparkleAge = age - birth;
        const startAngle = effectRandom(seed, i, 0) * Math.PI * 2;
        const radial = 0.12 + effectRandom(seed, i, 1) * 0.82;
        const direction = effectRandom(seed, i, 2) < 0.5 ? -1 : 1;
        const angularSpeed = 0.55 + effectRandom(seed, i, 3) * 1.2;
        const angle = startAngle + direction * sparkleAge * angularSpeed;
        const sparkleProgress = Math.max(0, Math.min(1, sparkleAge / 0.58));
        const distance = effectRadius * Math.min(waveProgress, 0.06 + radial * sparkleProgress);
        const x = originX + Math.cos(angle) * distance;
        const y = originY + Math.sin(angle) * distance;
        const twinkle = 0.5 + 0.5 * Math.sin(sparkleAge * (24 + effectRandom(seed, i, 4) * 10) + startAngle);
        const size = 1.1 + twinkle * 1.9;
        const rotation = direction * sparkleAge * (1.8 + effectRandom(seed, i, 5) * 2.4);
        ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
        ctx.globalAlpha = (0.18 + twinkle * 0.56) * Math.max(0, 1 - age / maxLife * 0.25);
        ctx.strokeStyle = '#f3f7ff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.moveTo(0, -size); ctx.lineTo(0, size); ctx.stroke();
        ctx.fillStyle = '#b8d5e5'; ctx.fillRect(-0.8, -0.8, 1.6, 1.6);
        ctx.restore();
      }
    } else if (effect.kind==='breath') {
      const source = effect.sourcePlayerId
        ? room?.players?.find(player => player.id === effect.sourcePlayerId)
        : room?.players?.filter(player => player.hero === 'Fjord')
          .sort((a, b) => Math.hypot(a.x - effect.x, a.y - effect.y) - Math.hypot(b.x - effect.x, b.y - effect.y))[0];
      const sourcePosition = source ? visualPlayerPosition(source, frame) : null;
      const originX = sourcePosition?.x ?? effect.x;
      const originY = sourcePosition?.y ?? effect.y;
      const angle = Number.isFinite(effect.angle) ? effect.angle : sourcePosition ? Math.atan2(effect.y - sourcePosition.y, effect.x - sourcePosition.x) : -Math.PI / 2;
      const halfAngle = Number.isFinite(effect.coneAngle) ? effect.coneAngle / 2 : Math.acos(0.2);
      const progress = 1 - t;
      const reach = effectRadius * progress;
      const age = maxLife * progress;
      const fade = Math.min(1, t * 6);
      const seed = Number(effect.id) || 0;
      if (reach > 8) {
        const fronts = 3;
        const segments = 10;
        const span = halfAngle * 2;
        ctx.lineCap = 'round';
        for (let front = 0; front < fronts; front++) {
          const radius = reach * (1 - front * 0.075);
          const alpha = fade * (0.28 - front * 0.065);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = front === 0 ? '#ffc35e' : front === 1 ? '#ff8b35' : '#ef4e25';
          ctx.lineWidth = 7 - front * 1.5;
          for (let segment = 0; segment < segments; segment++) {
            const step = span / segments;
            const jitter = Math.sin(age * 13 + segment * 2.1 + front * 1.7 + seed) * step * 0.08;
            const start = angle - halfAngle + segment * step + jitter;
            const end = start + step * (0.64 + 0.08 * Math.sin(segment * 4.3 + age * 9 + front));
            ctx.beginPath(); ctx.arc(originX, originY, radius, start, end); ctx.stroke();
          }
        }
      }
      const laneCount = 28;
      const flameCount = 112;
      for (let i = 0; i < flameCount; i++) {
        const laneIndex = i % laneCount;
        const cohort = Math.floor(i / laneCount);
        const birth = cohort * 0.23 + (laneIndex % 7) * 0.014;
        if (age < birth) continue;
        const phase = Math.max(0, Math.min(1, (age - birth) / 0.62));
        const lane = (laneIndex / (laneCount - 1)) * 2 - 1;
        const wobble = Math.sin(age * 21 + i * 2.7 + seed) * 0.055;
        const spread = Math.max(-1, Math.min(1, lane + wobble)) * (0.28 + phase * 0.72);
        const flameAngle = angle + spread * halfAngle;
        const distance = effectRadius * Math.min(progress, 0.06 + phase * 0.94);
        const x = originX + Math.cos(flameAngle) * distance;
        const y = originY + Math.sin(flameAngle) * distance;
        const flicker = 0.75 + 0.25 * Math.sin(age * 29 + i * 4.1 + seed * 0.4);
        const length = (12 + 15 * phase) * flicker;
        const width = (5 + 7 * phase) * flicker;
        const alpha = fade * (0.28 + 0.18 * phase) * (0.68 + 0.32 * flicker);
        drawBreathFlame(ctx, x, y, flameAngle, length, width, alpha);
      }
      ctx.globalAlpha = fade * 0.34;
      ctx.fillStyle = '#ffbd58';
      for (let i = 0; i < 24; i++) {
        const cohort = Math.floor(i / 8);
        const birth = cohort * 0.23 + (i % 8) * 0.016;
        if (age < birth) continue;
        const phase = Math.max(0, Math.min(1, (age - birth) / 0.58));
        const spread = (Math.sin(i * 8.7 + seed) * 0.8) * halfAngle;
        const emberAngle = angle + spread;
        const distance = effectRadius * Math.min(progress, 0.08 + phase * 0.92);
        const x = originX + Math.cos(emberAngle) * distance;
        const y = originY + Math.sin(emberAngle) * distance;
        const size = 1.5 + (i % 3) * 0.7;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
    } else if (effect.kind==='cone') {
      const source = effect.sourcePlayerId
        ? room?.players?.find(player => player.id === effect.sourcePlayerId)
        : room?.players?.filter(player => player.hero === 'Fjord')
          .sort((a, b) => Math.hypot(a.x - effect.x, a.y - effect.y) - Math.hypot(b.x - effect.x, b.y - effect.y))[0];
      const sourcePosition = source ? visualPlayerPosition(source, frame) : null;
      const originX = sourcePosition?.x ?? effect.x;
      const originY = sourcePosition?.y ?? effect.y;
      const angle = Number.isFinite(effect.angle) ? effect.angle : sourcePosition ? Math.atan2(effect.y - sourcePosition.y, effect.x - sourcePosition.x) : -Math.PI / 2;
      const halfAngle = Number.isFinite(effect.coneAngle) ? effect.coneAngle / 2 : Math.acos(0.2);
      const progress = 1 - t;
      const reach = effectRadius * progress;
      const alpha = (0.22 + 0.62 * progress) * Math.pow(1 - progress, 0.55);
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.moveTo(originX, originY);
      ctx.arc(originX, originY, reach, angle - halfAngle, angle + halfAngle);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = alpha * 0.95; ctx.lineWidth = 2 + progress * 2;
      ctx.beginPath(); ctx.moveTo(originX, originY);
      ctx.lineTo(originX + Math.cos(angle - halfAngle) * reach, originY + Math.sin(angle - halfAngle) * reach);
      ctx.arc(originX, originY, reach, angle - halfAngle, angle + halfAngle);
      ctx.lineTo(originX, originY); ctx.stroke();
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
  function drawMarkSmoke(ctx, effect, room, frame) {
    const source = room?.players?.filter(player => player.hero === 'Ravela')
      .map(player => ({ player, point: visualPlayerPosition(player, frame) }))
      .sort((a, b) => Math.hypot(a.point.x - effect.x, a.point.y - effect.y) - Math.hypot(b.point.x - effect.x, b.point.y - effect.y))[0];
    const originX = Number.isFinite(effect.originX) ? effect.originX : source?.point.x;
    const originY = Number.isFinite(effect.originY) ? effect.originY : source?.point.y;
    if (!Number.isFinite(originX) || !Number.isFinite(originY)) return;
    const dx=effect.x-originX,dy=effect.y-originY;
    const distance=Math.hypot(dx,dy);
    if(distance<1) return;
    const travel = Math.max(.08, Number.isFinite(effect.travelDuration) ? effect.travelDuration : Math.max(.08, Math.min(.22, distance / 2100)));
    const elapsed=Math.max(0,effect.maxLife-effect.life);
    const fadeOut = Math.max(0, Math.min(1, (elapsed - travel) / .16));
    if (fadeOut >= 1) return;
    const progress=Math.max(0,Math.min(1,elapsed/travel));
    const normalX=-dy/distance,normalY=dx/distance;
    ctx.save();
    ctx.lineCap='round'; ctx.strokeStyle='rgba(8,7,10,.72)'; ctx.lineWidth=4.5;
    ctx.globalAlpha*=.34*(1-fadeOut)*(.75+progress*.25);
    ctx.beginPath(); ctx.moveTo(originX,originY); ctx.lineTo(originX+dx*progress,originY+dy*progress); ctx.stroke();
    const puffCount=9;
    for(let i=0;i<puffCount;i++) {
      const fraction=progress*(1-i/(puffCount-1));
      const jitter=Math.sin(effect.id*.37+i*1.91+progress*5.2)*(2+i*.18);
      const px=originX+dx*fraction+normalX*jitter;
      const py=originY+dy*fraction+normalY*jitter;
      const radius=3.5+(i%3)*1.4+progress*1.6;
      const opacity=.48*(1-i/(puffCount+2))*(.9+progress*.1)*(1-fadeOut);
      const gradient=ctx.createRadialGradient(px,py,0,px,py,radius);
      gradient.addColorStop(0,`rgba(7,6,9,${opacity})`);
      gradient.addColorStop(.6,`rgba(11,9,13,${opacity*.7})`);
      gradient.addColorStop(1,'rgba(11,9,13,0)');
      ctx.globalAlpha=1; ctx.fillStyle=gradient; ctx.beginPath(); ctx.arc(px,py,radius,0,Math.PI*2); ctx.fill();
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
    if(waveLabel) waveLabel.textContent=`Wave ${g.wave}${g.endless?' · Endless':' / 10'}`;
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
    if(status){
      const statusMarkup=visualPlayers.map(p=>{
        const profile=hero(p.hero); const stats=p.stats||profile.stats; const buff=p.buff||{};
        const attack=stats.maceDamage??stats.slashDamage??stats.damage??(stats.attack*(buff.damage||1));
        const range=stats.range??profile.stats.range*(buff.range||1);
        const speed=stats.speed??profile.stats.speed*(buff.speed||1);
        const interval=stats.interval??profile.stats.interval*(buff.cooldown||1)/(buff.attackSpeed||1);
        const attackSpeed=1/Math.max(.01,interval);
        const defense=stats.defense??Math.min(75,profile.stats.defense+(buff.defense||0));
        const critChance=stats.critChance==null?profile.stats.critChance:stats.critChance*100;
        const critDamage=stats.critMultiplier==null?profile.stats.critMultiplier*100:stats.critMultiplier*100;
        const regen=Number(stats.regen||0).toFixed(2).replace(/\.?0+$/,'');
        const hp=Math.max(0,Math.ceil(p.hp||0));
        const maxHp=Math.max(1,p.maxHp||stats.maxHp||profile.stats.hp);
        const hpPercent=Math.max(0,Math.min(100,Math.round(hp/maxHp*100)));
        return `<div class="party-row"><div class="party-row-heading"><div class="party-dot" style="color:${profile.color}">${profile.id[0]}</div><div class="party-player-name"><strong>${esc(p.name)}${p.id===playerId?' [You]':''}</strong><small>${esc(profile.id)}</small></div><span class="party-hp">HP ${hp}/${maxHp}</span></div><div class="hp-track"><div class="hp-fill" style="width:${hpPercent}%;background:${p.alive?'#79bb70':'#e76850'}"></div></div><div class="hero-stat-line"><span><small>Attack:</small> <strong>${Math.round(attack)}</strong></span><span><small>Range:</small> <strong>${Math.round(range)}</strong></span><span><small>Speed:</small> <strong>${Math.round(speed)}</strong></span><span><small>Attack Speed:</small> <strong>${attackSpeed.toFixed(1)}/s</strong></span><span><small>Regen:</small> <strong>${regen} HP/s</strong></span><span><small>Defense:</small> <strong>${Math.round(defense)}%</strong></span><span><small>Crit Chance:</small> <strong>${Math.round(critChance)}%</strong></span><span><small>Crit Damage:</small> <strong>${Math.round(critDamage)}%</strong></span></div><div class="player-run-line"><span>Score: ${Math.round(p.score||0)}</span><span>Damage: ${Math.round(p.damage||0)}</span><span>Kills: ${p.kills||0}</span>${currentRoom.mode==='coop'?`<span>Deaths: ${p.deaths||0}</span>`:''}</div></div>`;
      }).join('');
      if(status.innerHTML!==statusMarkup) status.innerHTML=statusMarkup||'<div class="leaderboard-empty">Waiting for players…</div>';
    }
    const leaderboard=document.querySelector('#leaderboard-list');
    if(leaderboard){
      const ranked=[...visualPlayers].sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0)||(Number(b.kills)||0)-(Number(a.kills)||0)||String(a.name).localeCompare(String(b.name)));
      const leaderboardMarkup=ranked.map((p,index)=>{
        const profile=hero(p.hero);
        const hpPercent=p.maxHp?Math.max(0,Math.min(100,Math.round(p.hp/p.maxHp*100))):0;
        return `<div class="leaderboard-row ${p.id===playerId?'is-self':''}"><span class="leaderboard-rank">${index+1}</span><img class="leaderboard-portrait" src="/art/${encodeURIComponent(profile.art)}" alt="${esc(profile.id)} portrait"><span class="leaderboard-player"><strong>${esc(p.name)}${p.id===playerId?' · YOU':''}</strong><small>${esc(profile.id)} · ${Math.round(p.kills||0)} kills</small></span><span class="leaderboard-score">${Math.round(p.score||0)}</span><span class="leaderboard-hp" aria-label="${hpPercent}% health"><i style="width:${hpPercent}%;background:${p.alive?'#79bb70':'#e76850'}"></i></span></div>`;
      }).join('');
      if(leaderboard.innerHTML!==leaderboardMarkup) leaderboard.innerHTML=leaderboardMarkup||'<div class="leaderboard-empty">Waiting for players…</div>';
    }
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
      const selfStats=self.stats||abilityProfile.stats;
      const abilityName=abilityProfile.ability||self.abilityName||'Ability';
      const abilityNameNode=document.querySelector('#ability-name'); if(abilityNameNode) abilityNameNode.textContent=abilityName;
      const abilityDescription=document.querySelector('#ability-description'); if(abilityDescription) abilityDescription.textContent=abilityProfile.abilityDescription||'';
      const abilityCooldown=document.querySelector('#ability-cooldown'); if(abilityCooldown) abilityCooldown.textContent=`${(selfStats.abilityCooldown??(abilityProfile.stats.abilityCooldown*(self.buff?.cooldown||1)*(self.buff?.abilityCooldown||1))).toFixed(1).replace(/\.0$/,'')}s`;
      const abilityStats=document.querySelector('#ability-stats');
      if(abilityStats){const markup=sidebarMetricRows(abilitySidebarMetrics(abilityProfile,selfStats));if(abilityStats.innerHTML!==markup)abilityStats.innerHTML=markup;}
      const passive=abilityProfile.passive;
      const passiveName=document.querySelector('#passive-name'); if(passiveName) passiveName.textContent=passive.name;
      const passiveDescription=document.querySelector('#passive-description'); if(passiveDescription) passiveDescription.textContent=passive.description;
      const passiveStats=document.querySelector('#passive-stats');
      if(passiveStats){const markup=sidebarMetricRows(passiveSidebarMetrics(abilityProfile,selfStats));if(passiveStats.innerHTML!==markup)passiveStats.innerHTML=markup;}
      const chip=document.querySelector('#ability-chip');
      const mobileCast=document.querySelector('#mobile-cast');if(mobileCast){mobileCast.disabled=!self?.alive||g.paused||self.abilityCooldown>0;mobileCast.textContent=self.abilityCooldown>0?Math.ceil(self.abilityCooldown)+'s':'Ability';}
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
    const choiceKey=(self?.upgradeChoices||[]).join(',');
    const stateKey=`${g.phase}:${g.wave}:${Boolean(self?.upgradePicked)}:${phaseDisplayTimer}:${choiceKey}:${g.result||''}`;
    if(stateKey===overlayStateKey)return;
    overlayStateKey=stateKey;
    node.classList.toggle('wave-intro-overlay',g.phase==='intro');
    if(g.phase==='intro') {
      node.hidden=false;
      const romans=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      const showTitle=g.wave===1&&(g.phaseTimer||0)>1.6;
      node.innerHTML=`<div class="wave-intro-copy">${showTitle?'<div class="wave-intro-title">SURVIVE THE SLIME</div>':`<div class="wave-intro-number">Wave ${(g.wave<=10?romans[g.wave-1]:g.wave)}</div>`}</div>`;
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
        const upgradeCards=(self?.upgradeChoices||[]).map(id=>({id,card:UPGRADE_CARDS[id]})).filter(item=>item.card);
        node.innerHTML=`<div class="overlay-card"><div class="eyebrow">Wave ${g.wave} cleared</div><h2>Choose an upgrade</h2><p class="muted small">${upgradeCopy}</p><div class="upgrade-grid">${upgradeCards.map(({id,card})=>`<button class="upgrade-card" data-upgrade="${id}"><div class="upgrade-icon" style="color:${upgradeAppearance(id).color}">${upgradeAppearance(id).icon}</div><strong>${card.name}</strong><span>${card.text}</span></button>`).join('')}</div></div>`;
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
      node.innerHTML=`<div class="overlay-card"><div class="eyebrow">${runLabel}</div><h2>${g.phase==='won'?'The King Slime is defeated':'The slimes claim the arena'}</h2><p class="muted">${g.phase==='won'?'The coliseum is yours. A clean ten-wave clear.':survivalCopy}</p>${resultStats}<div class="result-actions">${currentRoom.isHost?'<button class="btn" data-action="replay">Play again</button>':''}${g.phase==='won'&&!g.endless&&currentRoom.isHost?'<button class="btn secondary" data-action="endless">Continue to endless</button>':''}${!currentRoom.isHost?'<p class="muted">The host chooses whether to replay or continue.</p>':''}<button class="btn quiet" data-action="again">Main menu</button></div></div>`;
      node.querySelector('[data-action="again"]').addEventListener('click',leaveRoom);
      for(const action of ['replay','endless']) node.querySelector(`[data-action="${action}"]`)?.addEventListener('click',()=>act(action).catch(()=>{}));
      void refreshAccount();
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
    if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
    if(key==='Escape' && currentScreen==='game' && !event.repeat){event.preventDefault();if(document.querySelector('.overlay:not(#game-overlay)'))return;if(currentRoom.mode==='solo')void act('pause',!currentRoom.game.paused).catch(()=>{});else showQuitConfirmation();return;}
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
      <p class="small muted">Move with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys. Your hero attacks automatically when a slime is in range. Critical hits deal bonus damage; Aram begins with 10% critical chance and the other champions begin with 5%. Press <kbd>E</kbd> to use your champion ability.</p>
      <p class="small muted">Survive the ten waves and choose one of three randomized upgrades after each cleared wave. Ravela's Mark of Death instantly marks a slime within bow range, making it take 50% more damage for 3.5 seconds. ${isSolo?'A solo run ends when your champion falls.':'In co-op, fallen champions return between waves.'} Watch the red warnings: red slimes detonate, yellow slimes charge, green slimes shoot, and black slimes rain slime.</p>
      <div class="settings-group">
        <div class="settings-group-title">Audio</div>
        <label class="setting-label" for="master-volume-slider"><span>Master volume</span><output id="master-volume-label">${Math.round(masterVolume*100)}%</output></label>
        <input class="setting-range" id="master-volume-slider" type="range" min="0" max="100" value="${Math.round(masterVolume*100)}">
        <label class="setting-label" for="music-volume-slider"><span>Music</span><output id="music-volume-label">${Math.round(musicVolume*100)}%</output></label>
        <input class="setting-range" id="music-volume-slider" type="range" min="0" max="100" value="${Math.round(musicVolume*100)}">
        <p class="settings-note muted">Hills of the Colosseum · original looping instrumental.</p>
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
      <div class="settings-actions">${account?'<button class="btn quiet" data-action="signout">Sign out</button>':''}${quitButton}<button class="btn" data-action="close">Close</button></div>
    </div>`;
    document.body.append(modal);
    modal.querySelector('[data-action="signout"]')?.addEventListener('click',showSignOut);
    modal.querySelector('[data-action="close"]').addEventListener('click',()=>modal.remove());
    modal.querySelector('[data-action="quit"]')?.addEventListener('click',()=>{modal.remove();showQuitConfirmation();});
    modal.addEventListener('click',event=>{if(event.target===modal)modal.remove();});
    const bindVolume=(inputId,labelId,storageKey,setValue,preview=false)=>{
      modal.querySelector(`#${inputId}`).addEventListener('input',event=>{
        const percent=Number(event.target.value);
        const level=percent/100;
        setValue(level);
        syncGameAudio();
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
  void refreshAccount().then(()=>{
  if (inviteToken) {
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.hash}`);
    app.innerHTML = '<section class="screen title-screen"><div class="title-screen-content"><h1>Joining party…</h1></div></section>';
    void joinRoom(inviteToken, { inviteToken: true });
  } else renderTitleScreen();
  });
})();
