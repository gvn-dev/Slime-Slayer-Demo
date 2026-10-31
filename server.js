const http = require('node:http');
const accounts = require('./accounts');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const rooms = new Map();
const WORLD = { width: 1200, height: 1200 };
const ARENA_RADIUS = 560;
const PLAYER_HIT_RADIUS = 12;
const ROOM_TTL = 30 * 60 * 1000;
const PLAYER_OFFLINE_MS = 9000;
const CHARACTER_ART = {
  Ravela: 'Ravela character art.png',
  Fjord: 'Fjord character art.png',
  Aram: 'Aram character art.png',
  Gavrilta: 'Gavrilla character art.png'
};
const GAME_ART = ['Slime Slayer title art.png','Roman coliseum arena.png','Ravela golden achievement.png','Fjord golden achievement.png','Aram golden achievement.png','Gavrilta golden achievement.png','King slime pixel sprite.png',
  'Ravela top-down sprite.png', 'Ravela bone bow.png', 'Ravela bone arrow.png',
  'Fjord top-down sprite.png', 'Fjord fire shield.png', 'Fjord war mace.png',
  'Aram top-down sprite.png', 'Aram shortsword.png',
  'Gavrilta top-down sprite.png', 'Gavrilta thorn staff.png',
  'Blue slime pixel sprite.png', 'Green slime pixel sprite.png', 'Red slime pixel sprite.png',
  'Yellow slime pixel sprite.png', 'Black slime pixel sprite.png',
  'Blue slime potion.png', 'Green slime potion.png', 'Red slime potion.png',
  'Yellow slime potion.png', 'Black slime potion.png'
];

const HEROES = {
  Ravela: { hp: 25, defense: 0, speed: 175, damage: 30, range: 340, interval: 0.62, regen: 0, abilityCooldown: 12, markBonus: 0.5, markDuration: 3.5, doubleShotChance: 0.1, critChance: 0.05, critMultiplier: 2, kind: 'arrow', color: '#e4d7f5', ability: 'Mark of Death' },
  Fjord: { hp: 200, defense: 20, speed: 100, damage: 31, range: 90, fireBreathRange: 250, interval: 1.05, regen: 1, abilityCooldown: 10, fireBreathMultiplier: 3, fireBreathAngle: 80, markBonus: 0, critChance: 0.05, critMultiplier: 2, kind: 'cleave', color: '#ed9b4b', ability: 'Fire Breath' },
  Aram: { hp: 50, defense: 0, speed: 145, damage: 28, range: 100, riposteRadius: 150, riposteInvulnerabilityTime: 1.3, riposteStunDuration: 1.25, interval: 0.62, regen: 0.05, abilityCooldown: 14, markBonus: 0, passiveChance: 0.1, critChance: 0.1, critMultiplier: 2, kind: 'sword', color: '#a6c3a3', ability: 'Riposte' },
  Gavrilta: { hp: 30, defense: 0, speed: 130, damage: 15, range: 300, attackRadius: 70, interval: 1.12, regen: 0.05, poisonDamage: 5, poisonDuration: 2.8, poisonInterval: 0.5, passiveRootDuration: 1, overgrowthRadius: 150, overgrowthRootDuration: 1.7, overgrowthPoisonDamage: 9, overgrowthPoisonDuration: 2.8, abilityCooldown: 10, markBonus: 0, critChance: 0.05, critMultiplier: 2, kind: 'thorn', color: '#82db77', ability: 'Overgrowth' }
};

const UPGRADE_POOLS = {
  Ravela: ['ravela-range', 'ravela-defense', 'ravela-mark-strength', 'ravela-shot-damage', 'ravela-regen', 'ravela-mark-duration', 'ravela-double-shot', 'ravela-mark-cooldown', 'ravela-health', 'ravela-move-speed', 'ravela-attack-speed', 'ravela-crit-chance', 'ravela-crit-damage'],
  Fjord: ['fjord-range', 'fjord-defense', 'fjord-vigor', 'fjord-breath-damage', 'fjord-mace-damage', 'fjord-regen', 'fjord-mark-duration', 'fjord-breath-width', 'fjord-breath-cooldown', 'fjord-hp', 'fjord-move-speed', 'fjord-attack-speed', 'fjord-crit-chance', 'fjord-crit-damage'],
  Aram: ['aram-range', 'aram-defense', 'aram-vigor', 'aram-riposte-invulnerability', 'aram-slash-damage', 'aram-regen', 'aram-riposte-stun', 'aram-riposte-radius', 'aram-riposte-cooldown', 'aram-hp', 'aram-move-speed', 'aram-attack-speed', 'aram-crit-chance', 'aram-crit-damage'],
  Gavrilta: ['gavrilta-range', 'gavrilta-defense', 'gavrilta-vigor', 'gavrilta-root-duration', 'gavrilta-thorn-damage', 'gavrilta-regen', 'gavrilta-binding-vines', 'gavrilta-overgrowth-radius', 'gavrilta-overgrowth-cooldown', 'gavrilta-hp', 'gavrilta-move-speed', 'gavrilta-attack-speed', 'gavrilta-crit-chance', 'gavrilta-crit-damage']
};

const RAVELA_UPGRADE_MAX = {
  'ravela-range': 10, 'ravela-defense': 5, 'ravela-mark-strength': 10,
  'ravela-shot-damage': 10, 'ravela-regen': 5, 'ravela-mark-duration': 5,
  'ravela-double-shot': 10, 'ravela-mark-cooldown': 5, 'ravela-health': 5,
  'ravela-move-speed': 5, 'ravela-attack-speed': 10,
  'ravela-crit-chance': 9, 'ravela-crit-damage': 10
};

const FJORD_UPGRADE_MAX = {
  'fjord-range': 10, 'fjord-defense': 5, 'fjord-vigor': 5,
  'fjord-breath-damage': 10, 'fjord-mace-damage': 10, 'fjord-regen': 5,
  'fjord-mark-duration': 5, 'fjord-breath-width': 8, 'fjord-breath-cooldown': 5,
  'fjord-hp': 5, 'fjord-move-speed': 5, 'fjord-attack-speed': 10,
  'fjord-crit-chance': 9, 'fjord-crit-damage': 10
};

const ARAM_UPGRADE_MAX = {
  'aram-range': 10, 'aram-defense': 5, 'aram-vigor': 5,
  'aram-riposte-invulnerability': 5, 'aram-slash-damage': 10,
  'aram-regen': 5, 'aram-riposte-stun': 6, 'aram-riposte-radius': 8,
  'aram-riposte-cooldown': 6, 'aram-hp': 5, 'aram-move-speed': 5,
  'aram-attack-speed': 10, 'aram-crit-chance': 9, 'aram-crit-damage': 10
};

const GAVRILTA_UPGRADE_MAX = {
  'gavrilta-range': 10, 'gavrilta-defense': 5, 'gavrilta-vigor': 5,
  'gavrilta-root-duration': 6, 'gavrilta-thorn-damage': 10, 'gavrilta-regen': 5,
  'gavrilta-binding-vines': 10, 'gavrilta-overgrowth-radius': 8,
  'gavrilta-overgrowth-cooldown': 6, 'gavrilta-hp': 5,
  'gavrilta-move-speed': 5, 'gavrilta-attack-speed': 10,
  'gavrilta-crit-chance': 9, 'gavrilta-crit-damage': 10
};

const ENEMY = {
  blue:   { name: 'Blue Slime',   hp: 32, speed: 62, damage: 8,  size: 20, color: '#4ca4ee', points: 3, attackWindup: 0.55 },
  green:  { name: 'Green Slime',  hp: 50, speed: 35, damage: 5,  size: 22, color: '#7fd05e', points: 10, attackWindup: 0.65, attackRange: 190 },
  red:    { name: 'Red Slime',    hp: 100, speed: 30, damage: 35, size: 27, color: '#f06c4c', points: 30, explosionRadius: 105, detonationTime: 1.75 },
  yellow: { name: 'Yellow Slime', hp: 40, speed: 75, damage: 15, size: 16, color: '#f5d452', points: 100, dashRange: 200, dashChargeTime: 2, dashDuration: 0.32 },
  black:  { name: 'Black Slime',  hp: 150, speed: 30, damage: 40, size: 30, color: '#9683bb', points: 500, attackRange: 270, attackRadius: 58, attackTravelTime: 2.5 },
  king:   { name: 'King Slime',   hp: 2000, speed: 20, damage: 35, size: 65, color: '#428cdd', points: 2500 }
};

const WAVE_TYPES = {
  1: ['blue'],
  2: ['blue', 'green'],
  3: ['green'],
  4: ['blue', 'green', 'red'],
  5: ['red'],
  6: ['green', 'red', 'yellow'],
  7: ['yellow'],
  8: ['red', 'yellow', 'black'],
  9: ['black'],
  10: ['blue', 'green', 'red', 'yellow', 'black']
};
const POWERUP_DROP_BY_ENEMY = { blue: 'hp', green: 'regen', red: 'attack', yellow: 'attackSpeed', black: 'moveSpeed' };
const POWERUP_LABELS = { hp: 'HP UP', regen: 'REGEN UP', attack: 'ATK UP', attackSpeed: 'ATK SPD UP', moveSpeed: 'MOVE SPD UP' };

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function clampToArena(x, y, inset = 0) {
  const centerX = WORLD.width / 2;
  const centerY = WORLD.height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.hypot(dx, dy);
  const maxDistance = Math.max(0, ARENA_RADIUS - inset);
  if (distance <= maxDistance || distance === 0) return { x, y };
  const scale = maxDistance / distance;
  return { x: centerX + dx * scale, y: centerY + dy * scale };
}
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1) : 0;
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}
function moveEnemyToward(enemy, target, dt, stopDistance = 0) {
  if (enemy.rootedUntil > Date.now() || enemy.slowUntil > Date.now()) return;
  const dx = target.x - enemy.x, dy = target.y - enemy.y, distance = Math.hypot(dx, dy);
  if (distance <= stopDistance || distance < 1) return;
  const travel = Math.min(enemy.speed * dt, distance - stopDistance);
  const next = clampToArena(enemy.x + dx / distance * travel, enemy.y + dy / distance * travel, Math.max(16, enemy.size));
  enemy.x = next.x; enemy.y = next.y;
}
function cleanName(value) {
  const name = String(value || '').trim().replace(/[<>]/g, '').slice(0, 18);
  if(name && !accounts.allowedName(name)) throw new Error('Please choose a suitable player name. Abusive names are not allowed.');
  return name || 'Slime Slayer';
}
function cleanPartyName(value) {
  const name = String(value || '').trim().replace(/[<>]/g, '').slice(0, 28);
  return name || 'Slime Slayer Party';
}
function newId() { return randomUUID(); }
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while ([...rooms.values()].some(room => room.code === code));
  return code;
}
function makePlayer(id, name, hero) {
  const chosenHero = HEROES[hero] ? hero : hero === 'Random' ? 'Random' : null;
  const stats = HEROES[chosenHero] || HEROES.Ravela;
  return {
    id, name: cleanName(name), hero: chosenHero, ready: false,
    x: WORLD.width / 2, y: WORLD.height / 2, hp: stats.hp, maxHp: stats.hp,
    alive: true, score: 0, damage: 0, kills: 0, deaths: 0, move: { x: 0, y: 0 }, facing: { x: 1, y: 0 },
    attackCooldown: 0, abilityCooldown: 0, stunnedUntil: 0, rootedUntil: 0, markedUntil: 0,
    invulnerableUntil: 0, buff: { damage: 1, speed: 1, maxHp: 1, cooldown: 1, range: 1, attackSpeed: 1, abilityCooldown: 1, markBonus: 0, defense: 0 },
    permanentBuffs: { maxHp: 0, regen: 0, damage: 1, attackSpeed: 1, speed: 1, counts: { hp: 0, regen: 0, attack: 0, attackSpeed: 0, moveSpeed: 0 } },
    upgradeLevels: {}, upgradePicked: false, upgradeChoices: [], lastSeen: Date.now(), lastInput: 0
  };
}
function heroStats(player, room = null) {
  const base = HEROES[player.hero] || HEROES.Ravela;
  const permanent = player.permanentBuffs || { maxHp: 0, regen: 0, damage: 1, attackSpeed: 1, speed: 1 };
  const levels = player.upgradeLevels || {};
  const ravela = player.hero === 'Ravela';
  const fjord = player.hero === 'Fjord';
  const aram = player.hero === 'Aram';
  const gavrilta = player.hero === 'Gavrilta';
  const level = id => levels[`ravela-${id}`] || 0;
  const fjordLevel = id => levels[`fjord-${id}`] || 0;
  const aramLevel = id => levels[`aram-${id}`] || 0;
  const gavriltaLevel = id => levels[`gavrilta-${id}`] || 0;
  const partyMarkDurationBonus = ravela && room
    ? Math.min(2.5, (room.players || []).filter(member => member.hero === 'Fjord').reduce((sum, member) => sum + 0.5 * (member.upgradeLevels?.['fjord-mark-duration'] || 0), 0))
    : 0;
  const damageUpgrade = ravela ? 1.15 ** level('shot-damage') : 1;
  const maceDamageUpgrade = fjord ? 1.15 ** fjordLevel('mace-damage') : 1;
  const slashDamageUpgrade = aram ? 1.15 ** aramLevel('slash-damage') : 1;
  const thornDamageUpgrade = gavrilta ? 1.15 ** gavriltaLevel('thorn-damage') : 1;
  const rangeUpgrade = ravela ? 1.1 ** level('range') : fjord ? 1.1 ** fjordLevel('range') : aram ? 1.1 ** aramLevel('range') : gavrilta ? 1.1 ** gavriltaLevel('range') : 1;
  const speedUpgrade = ravela ? 1 + 0.1 * level('move-speed') : fjord ? 1 + 0.1 * fjordLevel('move-speed') : aram ? 1 + 0.1 * aramLevel('move-speed') : gavrilta ? 1 + 0.1 * gavriltaLevel('move-speed') : 1;
  const attackSpeedUpgrade = ravela ? 1 + 0.1 * level('attack-speed') : fjord ? 1 + 0.1 * fjordLevel('attack-speed') : aram ? 1 + 0.1 * aramLevel('attack-speed') : gavrilta ? 1 + 0.1 * gavriltaLevel('attack-speed') : 1;
  const flatHpUpgrade = ravela ? 5 * level('health') : fjord ? 5 * fjordLevel('hp') : aram ? 5 * aramLevel('hp') : gavrilta ? 5 * gavriltaLevel('hp') : 0;
  const riposteRadiusUpgrade = aram ? 1.1 ** aramLevel('riposte-radius') : 1;
  const overgrowthRadiusUpgrade = gavrilta ? 1.1 ** gavriltaLevel('overgrowth-radius') : 1;
  return {
    ...base,
    maxHp: Math.round(base.hp * player.buff.maxHp * (fjord ? 1.2 ** fjordLevel('vigor') : aram ? 1.2 ** aramLevel('vigor') : gavrilta ? 1.2 ** gavriltaLevel('vigor') : 1) + flatHpUpgrade + permanent.maxHp),
    speed: base.speed * player.buff.speed * speedUpgrade * permanent.speed,
    damage: base.damage * player.buff.damage * (gavrilta ? thornDamageUpgrade : damageUpgrade) * permanent.damage,
    maceDamage: fjord ? base.damage * player.buff.damage * maceDamageUpgrade : undefined,
    slashDamage: aram ? base.damage * player.buff.damage * slashDamageUpgrade : undefined,
    range: base.range * player.buff.range * rangeUpgrade,
    fireBreathRange: base.fireBreathRange ? base.fireBreathRange * player.buff.range * rangeUpgrade : undefined,
    riposteRadius: base.riposteRadius ? base.riposteRadius * player.buff.range * rangeUpgrade * riposteRadiusUpgrade : undefined,
    attackRadius: gavrilta ? base.attackRadius : undefined,
    overgrowthRadius: gavrilta ? base.overgrowthRadius * player.buff.range * rangeUpgrade * overgrowthRadiusUpgrade : undefined,
    overgrowthRootDuration: gavrilta ? base.overgrowthRootDuration + 0.25 * gavriltaLevel('root-duration') : undefined,
    overgrowthPoisonDamage: gavrilta ? base.overgrowthPoisonDamage + gavriltaLevel('binding-vines') : undefined,
    overgrowthPoisonDuration: gavrilta ? base.overgrowthPoisonDuration + 0.3 * gavriltaLevel('binding-vines') : undefined,
    poisonDamage: gavrilta ? base.poisonDamage + gavriltaLevel('binding-vines') : base.poisonDamage,
    poisonDuration: gavrilta ? base.poisonDuration + 0.3 * gavriltaLevel('binding-vines') : undefined,
    poisonInterval: gavrilta ? base.poisonInterval : undefined,
    passiveRootDuration: gavrilta ? base.passiveRootDuration + 0.2 * gavriltaLevel('root-duration') : undefined,
    riposteInvulnerabilityTime: base.riposteInvulnerabilityTime ? base.riposteInvulnerabilityTime + 0.2 * aramLevel('riposte-invulnerability') : undefined,
    riposteStunDuration: base.riposteStunDuration ? base.riposteStunDuration + 0.25 * aramLevel('riposte-stun') : undefined,
    interval: base.interval * player.buff.cooldown / (player.buff.attackSpeed * attackSpeedUpgrade * permanent.attackSpeed),
    abilityCooldown: (ravela ? Math.max(1, base.abilityCooldown - level('mark-cooldown')) : fjord ? Math.max(1, base.abilityCooldown - fjordLevel('breath-cooldown')) : aram ? Math.max(1, base.abilityCooldown - aramLevel('riposte-cooldown')) : gavrilta ? Math.max(1, base.abilityCooldown - gavriltaLevel('overgrowth-cooldown')) : base.abilityCooldown) * player.buff.cooldown * player.buff.abilityCooldown,
    fireBreathMultiplier: base.fireBreathMultiplier ? Math.min(5, base.fireBreathMultiplier + 0.2 * fjordLevel('breath-damage')) : undefined,
    fireBreathAngle: base.fireBreathAngle ? Math.min(160, base.fireBreathAngle + 10 * fjordLevel('breath-width')) : undefined,
    markBonus: base.markBonus + player.buff.markBonus + (ravela ? 0.1 * level('mark-strength') : 0),
    markDuration: base.markDuration ? base.markDuration + (ravela ? 2 * level('mark-duration') + partyMarkDurationBonus : 0) : undefined,
    doubleShotChance: (base.doubleShotChance || 0) + (ravela ? 0.05 * level('double-shot') : 0),
    regen: (base.regen || 0) + (ravela ? 0.1 * level('regen') : fjord ? 0.1 * fjordLevel('regen') : aram ? 0.1 * aramLevel('regen') : gavrilta ? 0.1 * gavriltaLevel('regen') : 0) + permanent.regen,
    defense: Math.min(75, base.defense + player.buff.defense + (ravela ? 5 * level('defense') : fjord ? 5 * fjordLevel('defense') : aram ? 5 * aramLevel('defense') : gavrilta ? 5 * gavriltaLevel('defense') : 0)),
    critChance: base.critChance + (player.buff.critChance || 0) + (ravela ? 0.05 * level('crit-chance') : fjord ? 0.05 * fjordLevel('crit-chance') : aram ? 0.05 * aramLevel('crit-chance') : gavrilta ? 0.05 * gavriltaLevel('crit-chance') : 0),
    critMultiplier: base.critMultiplier + (player.buff.critDamage || 0) + (ravela ? 0.05 * level('crit-damage') : fjord ? 0.05 * fjordLevel('crit-damage') : aram ? 0.05 * aramLevel('crit-damage') : gavrilta ? 0.05 * gavriltaLevel('crit-damage') : 0)
  };
}
function rollUpgradeChoices(player, room) {
  const maxLevels = player.hero === 'Ravela' ? RAVELA_UPGRADE_MAX : player.hero === 'Fjord' ? FJORD_UPGRADE_MAX : player.hero === 'Aram' ? ARAM_UPGRADE_MAX : player.hero === 'Gavrilta' ? GAVRILTA_UPGRADE_MAX : null;
  const pool = [...(UPGRADE_POOLS[player.hero] || UPGRADE_POOLS.Ravela)]
    .filter(id => !maxLevels || (player.upgradeLevels?.[id] || 0) < maxLevels[id])
    .filter(id => id !== 'fjord-mark-duration' || (room?.mode === 'coop' && room.players.some(member => member.hero === 'Ravela')));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
function getRoom(identifier) {
  const value = String(identifier || '');
  return rooms.get(value) || [...rooms.values()].find(room => room.code === value.toUpperCase() || room.joinToken === value) || null;
}
function isOnline(player, now = Date.now()) { return now - player.lastSeen < PLAYER_OFFLINE_MS; }
function moveHost(room) {
  if (room.players.some(p => p.id === room.hostId && isOnline(p))) return;
  const next = room.players.filter(p => isOnline(p)).sort((a, b) => a.createdAt - b.createdAt)[0];
  if (next) room.hostId = next.id;
}
function addPlayer(room, id, name, hero) {
  const player = makePlayer(id, name, hero);
  player.createdAt = Date.now();
  room.players.push(player);
  room.lastActivity = Date.now();
  return player;
}
function newGame() {
  return {
    runId: newId(), endless: false, phase: 'intro', wave: 1, waveElapsed: 0, waveDuration: 20, spawnTimer: 0,
    enemies: [], projectiles: [], effects: [], powerups: [], spawnIndex: 0, bossSpawned: false,
    nextId: 1, startedAt: Date.now(), elapsedTime: 0, completedWaves: 0, teamKills: 0, teamDamage: 0, waveBonus: 0,
    phaseTimer: 0, roomMode: 'coop', paused: false
  };
}
function publicRoom(room, viewerId) {
  const now = Date.now();
  return {
    chat: room.status === 'lobby' ? (room.chat || []) : [], serverTime: now, id: room.id, code: room.mode === 'coop' && room.visibility === 'private' ? room.code : null,
    joinToken: room.mode === 'coop' ? room.joinToken : null,
    visibility: room.visibility || 'private', mode: room.mode, partyName: room.partyName, status: room.status, hostId: room.hostId,
    isHost: room.hostId === viewerId,
    players: room.players.map(p => ({
      id: p.id, name: p.name, characterLevels: accounts.levels(p.accountId), hero: p.hero, ready: p.ready, online: isOnline(p, now),
      x: p.x, y: p.y, facing: p.facing, hp: p.hp, maxHp: p.maxHp, alive: p.alive, score: p.score,
      damage: p.damage, kills: p.kills, deaths: p.deaths, abilityCooldown: p.abilityCooldown,
      stats: heroStats(p, room), upgradeLevels: p.upgradeLevels,
      abilityName: HEROES[p.hero]?.ability, upgradePicked: p.upgradePicked,
      upgradeChoices: p.id === viewerId ? p.upgradeChoices : undefined,
      buff: p.buff, permanentPowerups: p.permanentBuffs?.counts || {}, marked: p.markedUntil > now
    })),
    game: room.game ? {
      runId: room.game.runId, endless: room.game.endless, phase: room.game.phase, wave: room.game.wave, waveElapsed: room.game.waveElapsed,
      waveDuration: room.game.waveDuration, enemies: room.game.enemies,
      projectiles: room.game.projectiles, effects: room.game.effects, powerups: room.game.powerups,
      elapsedTime: room.game.elapsedTime, phaseTimer: room.game.phaseTimer, paused: room.game.paused,
      completedWaves: room.game.completedWaves, teamKills: room.game.teamKills,
      teamDamage: room.game.teamDamage, waveBonus: room.game.waveBonus, remaining: room.game.enemies.length,
      result: room.game.result || null
    } : null
  };
}
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 32_000) { reject(new Error('Request too large')); req.destroy(); }
    });
    req.on('error', reject);
    req.on('aborted',()=>reject(new Error('Request aborted')));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}
function newEffect(game, x, y, color, radius, kind = 'ring', duration = 0.42) {
  const effect = { id: game.nextId++, x, y, color, radius, kind, life: duration, maxLife: duration, createdAt: Date.now() };
  game.effects.push(effect);
  return effect;
}
function spawnEnemy(room, type) {
  const game = room.game;
  const spec = ENEMY[type];
  if (!game || !spec) return;
  const angle = Math.random() * Math.PI * 2;
  const spawnRadius = ARENA_RADIUS - spec.size - 8;
  const x = WORLD.width / 2 + Math.cos(angle) * spawnRadius;
  const y = WORLD.height / 2 + Math.sin(angle) * spawnRadius;
  const scale = type === 'king' ? 1 : 1 + (game.wave - 1) * 0.13;
  game.enemies.push({
    id: game.nextId++, type, name: spec.name, x, y, hp: Math.ceil(spec.hp * scale),
    maxHp: Math.ceil(spec.hp * scale), speed: spec.speed * (1 + (game.wave - 1) * 0.025),
    damage: spec.damage * (1 + (game.wave - 1) * 0.08), size: spec.size,
    color: spec.color, points: spec.points, cooldown: 0.7 + Math.random() * 1.5,
    stunnedUntil: 0, rootedUntil: 0, slowUntil: 0, markedUntil: 0, markBonus: 0,
    attackCharge: null, dashHit: false,
    dotUntil: 0, dotNext: 0, dotDamage: 0, dotInterval: 500, dotBy: null, attackType: 'contact'
  });
}
function damagePlayer(player, amount, now) {
  if (!player.alive || player.invulnerableUntil > now) return false;
  let damage = amount * (1 - heroStats(player).defense / 100);
  if (player.markedUntil > now) damage *= 1.25;
  const appliedDamage = Math.max(1, Math.round(damage));
  const previousHp = player.hp;
  player.hp = Math.max(0, player.hp - appliedDamage);
  player.score += Math.round((previousHp - player.hp) * 2);
  if (player.hp <= 0) {
    player.alive = false;
    player.deaths++;
    player.score -= 500;
    player.move = { x: 0, y: 0 };
    return true;
  }
  return false;
}
function damageEnemy(room, enemy, amount, playerId, now, options = {}) {
  const game = room.game;
  if (!game.enemies.includes(enemy)) return;
  const player = room.players.find(p => p.id === playerId);
  const markedBonus = enemy.markedUntil > now ? (enemy.markBonus ?? 0.25) : 0;
  const critical = Boolean(player && options.canCrit !== false && Math.random() < heroStats(player).critChance);
  const hit = Math.max(1, amount * (1 + markedBonus) * (critical ? heroStats(player).critMultiplier : 1));
  enemy.hp -= hit;
  game.teamDamage += hit;
  if (player) { player.damage += hit; player.score += hit; }
  if (player) { const number = newEffect(game, enemy.x, enemy.y - enemy.size, critical ? '#ffe18a' : '#fff5df', 0, 'damage-number', 0.85); number.text = String(Math.round(hit)); number.critical = critical; }
  if (critical) newEffect(game, enemy.x, enemy.y, '#ffe18a', enemy.size * 2.3, 'critical', 0.72);
  if (enemy.hp > 0) return;
  game.enemies = game.enemies.filter(e => e !== enemy);
  game.teamKills++;
  if (player) { player.kills++; player.score += enemy.points; }
  newEffect(game, enemy.x, enemy.y, enemy.color, enemy.size * 1.9, 'pop', 0.32);
  if (Math.random() < 0.05) {
    const type = POWERUP_DROP_BY_ENEMY[enemy.type] || Object.values(POWERUP_DROP_BY_ENEMY)[Math.floor(Math.random() * 5)];
    game.powerups.push({ id: game.nextId++, type, x: enemy.x, y: enemy.y, createdAt: now });
  }
}
function collectPowerup(room, player, powerup, now) {
  const buffs = player.permanentBuffs ||= { maxHp: 0, regen: 0, damage: 1, attackSpeed: 1, speed: 1, counts: { hp: 0, regen: 0, attack: 0, attackSpeed: 0, moveSpeed: 0 } };
  buffs.counts ||= { hp: 0, regen: 0, attack: 0, attackSpeed: 0, moveSpeed: 0 };
  const countKey = powerup.type;
  buffs.counts[countKey] = (buffs.counts[countKey] || 0) + 1;
  if (powerup.type === 'hp') {
    buffs.maxHp += 10;
    player.maxHp = heroStats(player, room).maxHp;
    player.hp = Math.min(player.maxHp, player.hp + 10);
  } else if (powerup.type === 'regen') buffs.regen += 0.2;
  else if (powerup.type === 'attack') buffs.damage *= 1.1;
  else if (powerup.type === 'attackSpeed') buffs.attackSpeed *= 1.1;
  else if (powerup.type === 'moveSpeed') buffs.speed *= 1.1;
  newEffect(room.game, powerup.x, powerup.y, '#f5edda', 28, 'powerup-pickup', 0.8);
  const pickup = room.game.effects[room.game.effects.length - 1];
  pickup.text = POWERUP_LABELS[powerup.type] || 'POWER UP';
}
function damageAreaPlayers(room, x, y, radius, amount, now) {
  for (const player of room.players) {
    if (!player.alive || Math.hypot(player.x - x, player.y - y) > radius + PLAYER_HIT_RADIUS) continue;
    const downed = damagePlayer(player, amount, now);
    if (downed && room.mode === 'solo') endRun(room, 'lost');
  }
}
function damageAreaEnemies(room, x, y, radius, amount, now, excludedId = null) {
  for (const enemy of [...room.game.enemies]) {
    if (enemy.id === excludedId || Math.hypot(enemy.x - x, enemy.y - y) > radius + enemy.size * 0.25) continue;
    damageEnemy(room, enemy, amount, null, now, { canCrit: false });
  }
}
function hitPlayerWithSlime(room, enemy, player, amount, now) {
  if (player.hero === 'Aram' && Math.random() < heroStats(player).passiveChance) {
    enemy.stunnedUntil = now + (enemy.type === 'king' ? 1500 : 3000);
    newEffect(room.game, player.x, player.y, '#d9f2e2', 72, 'ring', 0.3);
    return;
  }
  const downed = damagePlayer(player, amount, now);
  if (enemy.type === 'green') player.rootedUntil = now + 700;
  if (downed && room.mode === 'solo') endRun(room, 'lost');
}
function detonateRedSlime(room, enemy, now) {
  const radius = ENEMY.red.explosionRadius;
  const x = enemy.x, y = enemy.y;
  newEffect(room.game, x, y, '#e9554d', radius, 'red-detonation', 0.5);
  damageEnemy(room, enemy, enemy.hp + 1, null, now, { canCrit: false });
  damageAreaPlayers(room, x, y, radius, ENEMY.red.damage, now);
  damageAreaEnemies(room, x, y, radius, ENEMY.red.damage, now, enemy.id);
}
function landBlackSlimeRain(room, enemy, attack, now) {
  const radius = ENEMY.black.attackRadius;
  const x = attack.targetX, y = attack.targetY;
  newEffect(room.game, x, y, '#8b789c', radius, 'black-rain-impact', 0.48);
  damageAreaPlayers(room, x, y, radius, ENEMY.black.damage, now);
  damageAreaEnemies(room, x, y, radius, ENEMY.black.damage, now, enemy.id);
}
function nearestEnemy(game, x, y, range = Infinity, excluded = null) {
  let best = null;
  let bestDistance = range;
  for (const enemy of game.enemies) {
    if (enemy === excluded || enemy.id === excluded) continue;
    const d = Math.hypot(enemy.x - x, enemy.y - y);
    if (d < bestDistance) { best = enemy; bestDistance = d; }
  }
  return best;
}
function canStart(room) {
  const onlinePlayers = room.players.filter(p => isOnline(p));
  return onlinePlayers.length > 0 && onlinePlayers.every(p => p.ready && p.hero);
}
function assignRandomHeroes(room) {
  const claimed = new Set(room.players.map(p => p.hero).filter(hero => HEROES[hero]));
  const available = Object.keys(HEROES).filter(hero => !claimed.has(hero));
  for (const player of room.players) {
    if (player.hero && player.hero !== 'Random') continue;
    const index = Math.floor(Math.random() * available.length);
    player.hero = available.splice(index, 1)[0];
    player.maxHp = HEROES[player.hero].hp;
    player.hp = player.maxHp;
  }
}
function beginWave(room, wave) {
  const game = room.game;
  game.wave = wave;
  game.phase = 'intro';
  game.phaseTimer = 3.2;
  game.waveElapsed = 0;
  game.waveDuration = wave % 10 === 0 ? 28 : 20;
  game.spawnTimer = wave === 10 ? 1 : 0.8;
  game.bossSpawned = false;
  game.enemies = [];
  for (const p of room.players) {
    p.upgradePicked = false;
    p.upgradeChoices = [];
    p.move = { x: 0, y: 0 };
    if (p.alive === false && room.mode === 'coop') {
      p.alive = true;
      p.hp = Math.max(1, Math.ceil(heroStats(p).maxHp * 0.55));
      p.x = WORLD.width / 2;
      p.y = WORLD.height / 2;
      p.invulnerableUntil = Date.now() + (game.phaseTimer + 1.8) * 1000;
    }
  }
  newEffect(game, WORLD.width / 2, WORLD.height / 2, '#ffe2a1', 190, 'ring', 0.8);
}
function endRun(room, result) {
  if (!room.game) return;
  room.game.phase = result;
  room.game.result = result;
  for (const p of room.players) accounts.saveRun(room,p);
  room.status = 'finished';
  for (const p of room.players) p.move = { x: 0, y: 0 };
}
function enemySound(game,enemy,sound){const cue=newEffect(game,enemy.x,enemy.y,'#fff',0,'enemy-audio',.45);cue.sound=sound;}
function updateEnemy(room, enemy, dt, now) {
  const game = room.game;
  if (enemy.stunnedUntil > now) return;
  if (enemy.dotUntil > now && enemy.dotNext <= now) {
    enemy.dotNext = now + (enemy.dotInterval || 500);
    damageEnemy(room, enemy, enemy.dotDamage, enemy.dotBy, now);
    if (!game.enemies.includes(enemy)) return;
  }
  const spec = ENEMY[enemy.type];
  let target = null, targetDistance = Infinity;
  for (const player of room.players) {
    if (!player.alive) continue;
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distance < targetDistance) { target = player; targetDistance = distance; }
  }
  if (enemy.type === 'king') {
    const living = room.players.filter(p => p.alive), close = living.filter(p => Math.hypot(p.x-enemy.x,p.y-enemy.y)<125);
    const c = enemy.attackCharge;
    if (c) {
      c.progress = clamp((now-c.startedAt)/(c.duration*1000),0,1);
      if(c.progress>=1){
        if(c.kind==='king-range') {
          enemySound(game,enemy,'triple');
          const aim=Math.atan2(c.targetY-enemy.y,c.targetX-enemy.x);
          for(const offset of [-0.19,0,0.19]) { const angle=aim+offset;
            game.projectiles.push({id:game.nextId++,type:'enemy',from:enemy.id,target:c.targetPlayerId,x:enemy.x,y:enemy.y,tx:enemy.x+Math.cos(angle)*1100,ty:enemy.y+Math.sin(angle)*1100,speed:260,damage:15,color:enemy.color,radius:10});
          }
        } else {
          if(c.kind==='king-jump'){enemy.x=c.targetX;enemy.y=c.targetY;enemySound(game,enemy,'heavySlime');}
          if(c.kind==='king-melee')enemySound(game,enemy,'heavySlime');
          for(const p of living) if(Math.hypot(p.x-enemy.x,p.y-enemy.y)<c.radius+PLAYER_HIT_RADIUS){
            if(c.kind==='king-spin'){const a=Math.atan2(p.y-enemy.y,p.x-enemy.x);Object.assign(p,clampToArena(p.x+Math.cos(a)*180,p.y+Math.sin(a)*180,PLAYER_HIT_RADIUS));}
            else hitPlayerWithSlime(room,enemy,p,c.kind==='king-jump'?35:35,now);
          }
        }
        enemy.attackCharge=null;enemy.cooldown=c.kind==='king-spin'?0.3:1.8;
        if(c.kind==='king-spin') enemy.kingFollowup=Math.random()<0.5?'king-jump':'king-range';
      }
      return;
    }
    enemy.cooldown=Math.max(0,enemy.cooldown-dt);
    if(!target)return;
    if(enemy.cooldown>0){moveEnemyToward(enemy,target,dt,95);return;}
    const flanked=close.some(a=>close.some(b=>a!==b&&(a.x-enemy.x)*(b.x-enemy.x)+(a.y-enemy.y)*(b.y-enemy.y)<0));
    let kind=enemy.kingFollowup || (flanked?'king-spin':close.length>=2?'king-melee':['king-melee','king-range','king-jump','king-spin'][Math.floor(Math.random()*4)]);
    enemy.kingFollowup=null;
    if(kind==='king-melee'&&targetDistance>115)kind='king-range';
    const chosen=kind==='king-jump'?living[Math.floor(Math.random()*living.length)]:target;
    enemy.attackCharge={kind,startedAt:now,duration:kind==='king-jump'?2:kind==='king-spin'?0.9:0.8,progress:0,targetPlayerId:chosen.id,targetX:chosen.x,targetY:chosen.y,radius:kind==='king-jump'?65:kind==='king-spin'?150:110};
    return;
  }
  const charge = enemy.attackCharge;

  if (charge?.kind === 'red-fuse') {
    charge.progress = clamp((now - charge.startedAt) / (spec.detonationTime * 1000), 0, 1);
    if (charge.progress >= 1) detonateRedSlime(room, enemy, now);
    return;
  }
  if (charge?.kind === 'black-rain') {
    charge.progress = clamp((now - charge.startedAt) / (spec.attackTravelTime * 1000), 0, 1);
    if (charge.progress >= 1) {
      landBlackSlimeRain(room, enemy, charge, now);
      enemy.attackCharge = null;
      enemy.cooldown = 2.4;
    }
    return;
  }
  if (charge?.kind === 'blue-strike') {
    const chargedTarget = room.players.find(player => player.id === charge.targetPlayerId && player.alive);
    if (!chargedTarget || Math.hypot(chargedTarget.x - enemy.x, chargedTarget.y - enemy.y) > enemy.size + 30) {
      enemy.attackCharge = null; enemy.cooldown = 0.2;
    } else {
      charge.targetX = chargedTarget.x; charge.targetY = chargedTarget.y;
      charge.progress = clamp((now - charge.startedAt) / (spec.attackWindup * 1000), 0, 1);
      if (charge.progress >= 1) {
        hitPlayerWithSlime(room, enemy, chargedTarget, enemy.damage, now);
        newEffect(game, chargedTarget.x, chargedTarget.y, '#e9554d', 30, 'blue-strike-hit', 0.3);
        enemy.attackCharge = null; enemy.cooldown = 1.05;
      }
      return;
    }
  }
  if (charge?.kind === 'green-shot') {
    const chargedTarget = room.players.find(player => player.id === charge.targetPlayerId && player.alive);
    if (!chargedTarget || Math.hypot(chargedTarget.x - enemy.x, chargedTarget.y - enemy.y) > spec.attackRange + 10) {
      enemy.attackCharge = null; enemy.cooldown = 0.2;
    } else {
      charge.targetX = chargedTarget.x; charge.targetY = chargedTarget.y;
      charge.progress = clamp((now - charge.startedAt) / (spec.attackWindup * 1000), 0, 1);
      if (charge.progress >= 1) {
        enemySound(game,enemy,'greenSlime');
        const dx = chargedTarget.x - enemy.x, dy = chargedTarget.y - enemy.y;
        const aimLength = Math.max(1, Math.hypot(dx, dy));
        game.projectiles.push({
          id: game.nextId++, type: 'enemy', from: enemy.id, target: chargedTarget.id,
          x: enemy.x, y: enemy.y, originX: enemy.x, originY: enemy.y,
          createdAt: now, launchedThisTick: true, tx: chargedTarget.x, ty: chargedTarget.y,
          maxRange: Math.hypot(dx, dy), distanceTravelled: 0, dirX: dx / aimLength, dirY: dy / aimLength,
          speed: 210, damage: enemy.damage, color: enemy.color, radius: 8, slow: true, mark: false
        });
        enemy.attackCharge = null; enemy.cooldown = 2.8;
      }
      return;
    }
  }
  if (charge?.kind === 'yellow-dash') {
    const dashTarget = room.players.find(player => player.id === charge.targetPlayerId && player.alive);
    if (charge.phase !== 'dash') {
      if (!dashTarget || Math.hypot(dashTarget.x - enemy.x, dashTarget.y - enemy.y) > spec.dashRange) {
        enemy.attackCharge = null; enemy.cooldown = 0.12;
      } else {
        charge.targetX = dashTarget.x; charge.targetY = dashTarget.y;
        charge.progress = clamp((now - charge.startedAt) / (spec.dashChargeTime * 1000), 0, 1);
        if (charge.progress >= 1) {
          const dx = dashTarget.x - enemy.x, dy = dashTarget.y - enemy.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          enemySound(game,enemy,'lightning');
          charge.phase = 'dash'; charge.fromX = enemy.x; charge.fromY = enemy.y;
          charge.toX = dashTarget.x; charge.toY = dashTarget.y;
          charge.dirX = dx / distance; charge.dirY = dy / distance;
          charge.dashStartedAt = now; charge.duration = spec.dashDuration; charge.lastX = enemy.x; charge.lastY = enemy.y;
          charge.progress = 0; charge.hit = false;
        }
        return;
      }
    } else {
      const progress = clamp((now - charge.dashStartedAt) / (charge.duration * 1000), 0, 1);
      const dashLength = Math.hypot(charge.toX - charge.fromX, charge.toY - charge.fromY);
      const next = clampToArena(charge.fromX + charge.dirX * dashLength * progress,
        charge.fromY + charge.dirY * dashLength * progress, enemy.size);
      const prevX = charge.lastX ?? enemy.x, prevY = charge.lastY ?? enemy.y;
      enemy.x = next.x; enemy.y = next.y; charge.progress = progress;
      if (dashTarget && !charge.hit && distanceToSegment(dashTarget.x, dashTarget.y, prevX, prevY, enemy.x, enemy.y) <= PLAYER_HIT_RADIUS + enemy.size * 0.45) {
        hitPlayerWithSlime(room, enemy, dashTarget, enemy.damage, now);
        charge.hit = true;
        newEffect(game, enemy.x, enemy.y, '#f5d452', 34, 'yellow-dash-impact', 0.35);
      }
      charge.lastX = enemy.x; charge.lastY = enemy.y;
      if (progress >= 1 || charge.hit) { enemy.attackCharge = null; enemy.cooldown = 1.2; }
      return;
    }
  }

  enemy.cooldown = Math.max(0, enemy.cooldown - dt);
  if (!target) return;
  if (enemy.type === 'red') {
    if (targetDistance <= spec.explosionRadius) {
      enemy.attackCharge = { kind: 'red-fuse', startedAt: now, duration: spec.detonationTime, progress: 0, targetPlayerId: target.id };
    } else moveEnemyToward(enemy, target, dt, spec.explosionRadius);
  } else if (enemy.type === 'yellow') {
    if (targetDistance <= spec.dashRange) {
      enemy.attackCharge = { kind: 'yellow-dash', phase: 'charge', startedAt: now, duration: spec.dashChargeTime, progress: 0, targetPlayerId: target.id, targetX: target.x, targetY: target.y };
    } else moveEnemyToward(enemy, target, dt, spec.dashRange);
  } else if (enemy.type === 'black') {
    if (targetDistance <= spec.attackRange && enemy.cooldown <= 0) {
      enemy.attackCharge = { kind: 'black-rain', phase: 'rain', startedAt: now, duration: spec.attackTravelTime, progress: 0,
        targetPlayerId: target.id, originX: enemy.x, originY: enemy.y, targetX: target.x, targetY: target.y };
    } else if (targetDistance > spec.attackRange) moveEnemyToward(enemy, target, dt, spec.attackRange - 8);
  } else if (enemy.type === 'green') {
    if (targetDistance <= spec.attackRange && enemy.cooldown <= 0) {
      enemy.attackCharge = { kind: 'green-shot', startedAt: now, duration: spec.attackWindup, progress: 0, targetPlayerId: target.id, targetX: target.x, targetY: target.y };
    } else if (targetDistance > spec.attackRange) moveEnemyToward(enemy, target, dt, spec.attackRange - 8);
  } else if (enemy.type === 'blue') {
    const attackRange = enemy.size + 30;
    if (targetDistance <= attackRange && enemy.cooldown <= 0) {
      enemy.attackCharge = { kind: 'blue-strike', startedAt: now, duration: spec.attackWindup, progress: 0, targetPlayerId: target.id, targetX: target.x, targetY: target.y };
    } else if (targetDistance > attackRange) moveEnemyToward(enemy, target, dt, attackRange - 6);
  } else if (targetDistance <= enemy.size + 30 && enemy.cooldown <= 0) {
    hitPlayerWithSlime(room, enemy, target, enemy.damage, now);
    enemy.cooldown = 1.05;
  } else if (targetDistance > enemy.size + 30) moveEnemyToward(enemy, target, dt, enemy.size + 22);
}
function updateGame(room, dt, now) {
  const game = room.game;
  if (!game || room.status !== 'playing' || game.paused) return;
  for (const effect of game.effects) effect.life -= dt;
  game.effects = game.effects.filter(effect => effect.life > 0);
  if (game.phase === 'intro') {
    game.phaseTimer = Math.max(0, game.phaseTimer - dt);
    if (game.phaseTimer <= 0) game.phase = 'wave';
    return;
  }
  if (game.phase === 'upgrade') {
    if (room.mode === 'coop') game.phaseTimer = Math.max(0, game.phaseTimer - dt);
    const everyoneChosen = room.players.length > 0 && room.players.every(p => p.upgradePicked);
    const choiceExpired = room.mode === 'coop' && game.phaseTimer <= 0;
    if (everyoneChosen || choiceExpired) {
      if (choiceExpired) {
        for (const player of room.players) player.upgradePicked = true;
      }
      if (game.wave === 10 && !game.endless) endRun(room, 'won');
      else beginWave(room, game.wave + 1);
    }
    return;
  }
  if (game.phase !== 'wave') return;
  game.elapsedTime += dt;
  game.waveElapsed += dt;
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 && game.waveElapsed < game.waveDuration && game.enemies.length < 36) {
    const types = WAVE_TYPES[game.wave] || ['blue','green','red','yellow','black'];
    const type = types[Math.floor(Math.random() * types.length)];
    spawnEnemy(room, type);
    game.spawnIndex++;
    game.spawnTimer = Math.max(0.52, 1.75 - game.wave * 0.09) * (0.8 + Math.random() * 0.4);
  }
  if (game.wave % 10 === 0 && !game.bossSpawned && game.waveElapsed > 2) {
    for (let i=0;i<Math.floor(game.wave/10);i++) spawnEnemy(room, 'king');
    game.bossSpawned = true;
  }

  for (const player of room.players) {
    if (!isOnline(player, now)) player.move = { x: 0, y: 0 };
    player.tickStartX = player.x;
    player.tickStartY = player.y;
    if (!player.alive) continue;
    const stats = heroStats(player);
    player.maxHp = stats.maxHp;
    player.hp = Math.min(player.maxHp, player.hp + dt * stats.regen);
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
    const move = now < player.rootedUntil || now < player.stunnedUntil ? { x: 0, y: 0 } : player.move;
    const playerPosition = clampToArena(
      player.x + move.x * stats.speed * dt,
      player.y + move.y * stats.speed * dt,
      28
    );
    player.x = playerPosition.x;
    player.y = playerPosition.y;
    for (const powerup of [...game.powerups]) {
      if (Math.hypot(powerup.x - player.x, powerup.y - player.y) > PLAYER_HIT_RADIUS + 16) continue;
      game.powerups = game.powerups.filter(item => item.id !== powerup.id);
      collectPowerup(room, player, powerup, now);
    }
    if (player.attackCooldown <= 0) {
      const target = nearestEnemy(game, player.x, player.y, stats.range);
      if (target) {
        player.attackCooldown = stats.interval;
        if (stats.kind === 'cleave') {
          const aimX = target.x - player.x;
          const aimY = target.y - player.y;
          const aimLength = Math.max(1, Math.hypot(aimX, aimY));
          const effect = newEffect(game, player.x, player.y, '#f6a34d', stats.range, 'mace-sweep', 0.34);
          effect.angle = Math.atan2(aimY, aimX);
          effect.coneAngle = 2 * Math.PI / 3;
          effect.sourcePlayerId = player.id;
          for (const enemy of [...game.enemies]) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.hypot(dx, dy);
            const facingDot = (dx * aimX + dy * aimY) / Math.max(1, distance * aimLength);
            if (distance <= stats.range && facingDot >= 0.5) damageEnemy(room, enemy, stats.maceDamage, player.id, now);
          }
        } else if (stats.kind === 'sword') {
          const slash = newEffect(game, player.x, player.y, '#dce6e8', stats.range, 'sword-sweep', 0.24);
          slash.angle = Math.atan2(target.y - player.y, target.x - player.x);
          slash.sourcePlayerId = player.id;
          damageEnemy(room, target, stats.slashDamage ?? stats.damage, player.id, now);
        } else if (stats.kind === 'thorn') {
          const effect = newEffect(game, target.x, target.y, '#779b4c', stats.attackRadius, 'thorn-burst', 0.68);
          effect.sourcePlayerId = player.id;
          effect.targetEnemyId = target.id;
          for (const enemy of [...game.enemies]) {
            if (Math.hypot(enemy.x - target.x, enemy.y - target.y) > stats.attackRadius + enemy.size * 0.35) continue;
            damageEnemy(room, enemy, stats.damage, player.id, now);
            if (!game.enemies.includes(enemy)) continue;
            enemy.dotUntil = now + stats.poisonDuration * 1000;
            enemy.dotInterval = stats.poisonInterval * 1000;
            enemy.dotNext = now + enemy.dotInterval;
            enemy.dotDamage = stats.poisonDamage * stats.poisonInterval;
            enemy.dotBy = player.id;
            enemy.rootedUntil = Math.max(enemy.rootedUntil, now + stats.passiveRootDuration * 1000);
          }
        } else {
          const targets = [target];
          if (player.hero === 'Ravela' && Math.random() < stats.doubleShotChance) {
            const secondTarget = nearestEnemy(game, player.x, player.y, stats.range, target);
            if (secondTarget) targets.push(secondTarget);
          }
          for (const projectileTarget of targets) {
            const aimX = projectileTarget.x - player.x;
            const aimY = projectileTarget.y - player.y;
            const aimLength = Math.max(1, Math.hypot(aimX, aimY));
            if (player.hero === 'Ravela') player.facing = { x: aimX / aimLength, y: aimY / aimLength };
            game.projectiles.push({
              id: game.nextId++, type: 'hero', from: player.id, target: projectileTarget.id,
              x: player.x, y: player.y, originX: player.x, originY: player.y,
              createdAt: now, launchedThisTick: true, speed: stats.kind === 'arrow' ? 560 : 390,
              maxRange: stats.range, distanceTravelled: 0, dirX: aimX / aimLength, dirY: aimY / aimLength,
              damage: stats.damage, color: stats.kind === 'arrow' ? '#f2e8ff' : '#8ee677',
              radius: stats.kind === 'arrow' ? 6 : 9, poison: stats.kind === 'orb', poisonDamage: stats.poisonDamage, mark: false
            });
            if(player.hero==='Ravela'){const cue=newEffect(game,player.x,player.y,'#fff',0,'bow-shot',.35);cue.projectileId=game.projectiles[game.projectiles.length-1].id;cue.sourcePlayerId=player.id;}
          }
        }
        if (player.hero === 'Aram' && Math.random() < stats.passiveChance) target.stunnedUntil = now + (target.type === 'king' ? 350 : 700);
      }
    }
  }

  for (const enemy of [...game.enemies]) updateEnemy(room, enemy, dt, now);

  for (const projectile of [...game.projectiles]) {
    if (projectile.launchedThisTick) {
      projectile.launchedThisTick = false;
      continue;
    }
    const isHeroProjectile = projectile.type === 'hero';
    const target = isHeroProjectile
      ? game.enemies.find(e => e.id === projectile.target)
      : room.players.find(p => p.id === projectile.target && p.alive);
    const maxRange = Number.isFinite(projectile.maxRange) ? projectile.maxRange : 0;
    const distanceTravelled = projectile.distanceTravelled || 0;
    const remainingRange = Math.max(0, maxRange - distanceTravelled);
    if (remainingRange <= 0.001) { game.projectiles = game.projectiles.filter(p => p !== projectile); continue; }
    if (!target) {
      const directionLength = Math.hypot(projectile.dirX || 0, projectile.dirY || 0);
      if (!directionLength) { game.projectiles = game.projectiles.filter(p => p !== projectile); continue; }
      const travel = Math.min(projectile.speed * dt, remainingRange);
      projectile.x += projectile.dirX / directionLength * travel;
      projectile.y += projectile.dirY / directionLength * travel;
      projectile.distanceTravelled = distanceTravelled + travel;
      projectile.launchedThisTick = false;
      if (projectile.distanceTravelled >= maxRange - 0.001) game.projectiles = game.projectiles.filter(p => p !== projectile);
      continue;
    }
    const dx = (isHeroProjectile ? target.x : projectile.tx) - projectile.x;
    const dy = (isHeroProjectile ? target.y : projectile.ty) - projectile.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    projectile.dirX = dx / dist;
    projectile.dirY = dy / dist;
    const step = Math.min(projectile.speed * dt, remainingRange);
    const travel = Math.min(step, dist);
    const moveX = dx / dist * travel;
    const moveY = dy / dist * travel;
    const nextX = projectile.x + moveX;
    const nextY = projectile.y + moveY;
    let hit = isHeroProjectile && dist <= step + (target.size || 15);

    if (!isHeroProjectile) {
      // Compare both paths over the same tick. Comparing the projectile's
      // full segment with only the player's end position shifts hits in time.
      const playerStartX = target.tickStartX ?? target.x;
      const playerStartY = target.tickStartY ?? target.y;
      const relativeStartX = projectile.x - playerStartX;
      const relativeStartY = projectile.y - playerStartY;
      const projectileTickFraction = step > 0 ? travel / step : 0;
      const relativeMoveX = moveX - (target.x - playerStartX) * projectileTickFraction;
      const relativeMoveY = moveY - (target.y - playerStartY) * projectileTickFraction;
      const relativeLengthSquared = relativeMoveX * relativeMoveX + relativeMoveY * relativeMoveY;
      const projection = relativeLengthSquared > 0
        ? clamp(-(relativeStartX * relativeMoveX + relativeStartY * relativeMoveY) / relativeLengthSquared, 0, 1)
        : 0;
      const closestRelativeX = relativeStartX + relativeMoveX * projection;
      const closestRelativeY = relativeStartY + relativeMoveY * projection;
      const hitRadius = PLAYER_HIT_RADIUS + (projectile.radius || 0);
      hit = Math.hypot(closestRelativeX, closestRelativeY) <= hitRadius;
      if (hit) {
        projectile.x += moveX * projection;
        projectile.y += moveY * projection;
      }
    }

    if (hit) {
      if (projectile.type === 'hero') {
        damageEnemy(room, target, projectile.damage, projectile.from, now);
        if (projectile.poison && game.enemies.includes(target)) {
          target.dotUntil = now + 2500;
          target.dotNext = now + 500;
          target.dotDamage = projectile.poisonDamage || 5;
          target.dotBy = projectile.from;
          target.rootedUntil = Math.max(target.rootedUntil, now + 1000);
        }
        if (projectile.mark && game.enemies.includes(target)) {
          target.markedUntil = now + 3000;
          target.markStartedAt = now;
          target.markDurationMs = 3000;
        }
      } else {
        const player = target;
        if (player.hero === 'Aram' && Math.random() < heroStats(player).passiveChance) {
          newEffect(game, player.x, player.y, '#d9f2e2', 64, 'ring', 0.35);
        } else {
          const downed = damagePlayer(player, projectile.damage, now);
          if (projectile.mark) player.markedUntil = now + 3500;
          if (projectile.slow) player.rootedUntil = Math.max(player.rootedUntil, now + 650);
          if (downed && room.mode === 'solo') endRun(room, 'lost');
        }
      }
      const impact = newEffect(game, projectile.x, projectile.y, projectile.color, 26, 'pop', 0.18);
      impact.projectileId = projectile.id;
      game.projectiles = game.projectiles.filter(p => p !== projectile);
    } else if (dist <= step || step >= remainingRange) {
      // A ranged attack that reaches its aimed point without intersecting its
      // moving target is a miss; it must not linger there and damage later.
      game.projectiles = game.projectiles.filter(p => p !== projectile);
    } else {
      projectile.x = nextX;
      projectile.y = nextY;
      projectile.distanceTravelled = distanceTravelled + travel;
      projectile.launchedThisTick = false;
    }
  }

  if (room.players.length && room.players.every(p => !p.alive)) {
    endRun(room, 'lost');
    return;
  }
  if (game.waveElapsed >= game.waveDuration && game.enemies.length === 0) {
    game.completedWaves = Math.max(game.completedWaves, game.wave);
    game.waveBonus += 200;
    for (const p of room.players) accounts.saveRun(room,p);
    if (game.wave === 10 && !game.endless) { endRun(room, 'won'); return; }
    game.phase = 'upgrade';
    game.phaseTimer = room.mode === 'coop' ? 20 : null;
    for (const p of room.players) {
      p.upgradePicked = false;
      p.upgradeChoices = rollUpgradeChoices(p, room);
    }
    newEffect(game, WORLD.width / 2, WORLD.height / 2, '#ffe8a2', 220, 'ring', 0.8);
  }
}

function useAbility(room, player) {
  const game = room.game;
  const now = Date.now();
  if (!game || game.paused || game.phase !== 'wave' || !player.alive || player.abilityCooldown > 0) return;
  const stats = heroStats(player, room);
  player.abilityCooldown = stats.abilityCooldown;
  if (player.hero === 'Ravela') {
    const target = nearestEnemy(game, player.x, player.y, stats.range);
    if (target) {
      const currentBonus = target.markedUntil > now ? (target.markBonus || 0) : 0;
      target.markedUntil = now + stats.markDuration * 1000;
      target.markStartedAt = now;
      target.markDurationMs = stats.markDuration * 1000;
      target.markBonus = Math.max(currentBonus, stats.markBonus);
      newEffect(game, target.x, target.y, '#f5e5ff', 82, 'mark', 0.55);
    }
  } else if (player.hero === 'Fjord') {
    const target = nearestEnemy(game, player.x, player.y, stats.fireBreathRange);
    const aimX = target ? target.x - player.x : 0;
    const aimY = target ? target.y - player.y : 1;
    const aimLength = Math.max(0.0001, Math.hypot(aimX, aimY));
    const fx = aimX / aimLength;
    const fy = aimY / aimLength;
    player.facing = { x: fx, y: fy };
    const effect = newEffect(game, player.x, player.y, '#ff7847', stats.fireBreathRange, 'breath', 1);
    effect.angle = Math.atan2(fy, fx);
    effect.coneAngle = stats.fireBreathAngle * Math.PI / 180;
    effect.sourcePlayerId = player.id;
    for (const enemy of [...game.enemies]) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const d = Math.hypot(dx, dy);
      const dot = (dx * fx + dy * fy) / Math.max(1, d);
      if (d < stats.fireBreathRange && dot > Math.cos(stats.fireBreathAngle * Math.PI / 360)) {
        damageEnemy(room, enemy, stats.damage * stats.fireBreathMultiplier, player.id, now);
      }
    }
  } else if (player.hero === 'Aram') {
    player.invulnerableUntil = now + stats.riposteInvulnerabilityTime * 1000;
    const effect = newEffect(game, player.x, player.y, '#d9f0da', stats.riposteRadius, 'riposte-wave', 1);
    effect.sourcePlayerId = player.id;
    for (const enemy of game.enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < stats.riposteRadius) enemy.stunnedUntil = now + stats.riposteStunDuration * (enemy.type === 'king' ? 500 : 1000);
    }
  } else {
    const cast = newEffect(game, player.x, player.y, '#83ba55', 0, 'staff-cast', 0.42);
    cast.sourcePlayerId = player.id;
    const wave = newEffect(game, player.x, player.y, '#83ba55', stats.overgrowthRadius, 'overgrowth-wave', 0.72);
    wave.sourcePlayerId = player.id;
    wave.travelDuration = 0.52;
    for (const enemy of [...game.enemies]) {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < stats.overgrowthRadius) {
        const effect = newEffect(game, enemy.x, enemy.y, '#83ba55', enemy.size + 22, 'overgrowth-vines', Math.max(0.82, Math.min(1.1, distance / 520 + 0.62)));
        effect.sourcePlayerId = player.id;
        effect.targetEnemyId = enemy.id;
        effect.originX = player.x;
        effect.originY = player.y;
        effect.travelDuration = 0.52;
        enemy.rootedUntil = now + stats.overgrowthRootDuration * 1000;
        enemy.dotUntil = now + stats.overgrowthPoisonDuration * 1000;
        enemy.dotInterval = 500;
        enemy.dotNext = now + enemy.dotInterval;
        enemy.dotDamage = stats.overgrowthPoisonDamage * 0.5;
        enemy.dotBy = player.id;
      }
    }
  }
}

function serveStatic(req, res, pathname) {
  let file;
  if (pathname === '/' || pathname === '/index.html') file = path.join(PUBLIC, 'index.html');
  else if (pathname === '/app.js') file = path.join(PUBLIC, 'app.js');
  else if (pathname === '/style.css') file = path.join(PUBLIC, 'style.css');
  else if (pathname==='/audio/hills-of-the-colosseum.wav'||pathname==='/audio/slime-run-start.wav') file=path.join(PUBLIC,'audio',path.basename(pathname));
  else if (pathname.startsWith('/art/')) {
    const key = decodeURIComponent(pathname.slice(5));
    const allowed = [...Object.values(CHARACTER_ART), ...GAME_ART];
    if (!allowed.includes(key)) return send(res, 404, { error: 'Not found' });
    file = path.join(ROOT, 'Art', key);
  } else return send(res, 404, { error: 'Not found' });
  const ext = path.extname(file).toLowerCase();
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.wav': 'audio/wav' };
  fs.readFile(file, (error, data) => {
    if (error) return send(res, 404, { error: 'Not found' });
    res.setHeader('Content-Length',data.length);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.png' ? 'public, max-age=3600' : 'no-cache' });
    res.end(req.method==='HEAD'?undefined:data);
  });
}

let shuttingDown=false;
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  if(shuttingDown)return send(res,503,{error:'Server restarting. Please reconnect shortly.'});
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if(req.method==='POST' && req.headers.origin && !['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin)) return send(res,403,{error:'Request origin rejected.'});
    if (await accounts.route(req,res,url,readJson,send)) return;
    const signedIn = accounts.auth(req);
    if ((req.method === 'GET'||req.method==='HEAD') && url.pathname === '/api/health') return send(res, 200, { ok: true, rooms: rooms.size });
    if (req.method === 'GET' && url.pathname === '/api/groups') {
      const now = Date.now();
      const groups = [...rooms.values()]
        .filter(room => room.mode === 'coop' && room.status === 'lobby' && room.players.some(player => isOnline(player, now)))
        .map(room => {
          const leader = room.players.find(player => player.id === room.hostId);
          const playerCount = room.players.filter(player => isOnline(player, now)).length;
          return {
            id: room.id, name: room.partyName || 'Gather your champions',
            visibility: room.visibility || 'private', status: room.status,
            leaderName: leader?.name || 'Party leader', playerCount,
            maxPlayers: 4, canJoin: room.visibility !== 'closed' && playerCount < 4
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return send(res, 200, { groups });
    }
    if (req.method === 'POST' && url.pathname === '/api/rooms') {
      const body = await readJson(req);
      const mode = body.mode === 'solo' ? 'solo' : 'coop';
      const playerId = String(body.playerId || newId()).slice(0, 80);
      const visibility = mode === 'coop' && body.visibility === 'public' ? 'public' : 'private';
      const code = mode === 'coop' ? makeCode() : null;
      const room = {
        id: newId(), code, joinToken: mode === 'coop' ? newId() : null, mode,
        visibility,
        partyName: mode === 'coop' ? cleanPartyName(body.partyName) : '',
        status: 'lobby', hostId: playerId, players: [], game: null, lastActivity: Date.now()
      };
      rooms.set(room.id, room);
      const player = addPlayer(room, playerId, signedIn?.username || body.name, body.hero);
      player.accountId = signedIn?.id || null;
      if (mode === 'solo') player.ready = true;
      return send(res, 201, { room: publicRoom(room, playerId), playerId });
    }
    if (parts[0] === 'api' && parts[1] === 'rooms' && parts[2]) {
      const roomIdentifier = decodeURIComponent(parts[2]);
      const room = getRoom(roomIdentifier);
      if (!room) return send(res, 404, { error: 'Room not found. Check the code and try again.' });
      if (req.method === 'GET' && parts.length === 3) {
        const playerId = String(url.searchParams.get('playerId') || '');
        const player = room.players.find(p => p.id === playerId);
        if (!player) return send(res, 403, { error: 'This player is not in the room.' });
        if (player.accountId && player.accountId !== signedIn?.id) return send(res,403,{error:'Sign in to the account that joined this run.'});
        player.lastSeen = Date.now();
        room.lastActivity = Date.now();
        moveHost(room);
        return send(res, 200, { room: publicRoom(room, playerId) });
      }
      if (req.method === 'POST' && parts[3] === 'join') {
        const body = await readJson(req);
        const playerId = String(body.playerId || newId()).slice(0, 80);
        let player = room.players.find(p => p.id === playerId);
        if (!player) {
          if (room.mode !== 'coop') return send(res, 403, { error: 'Single-player runs cannot be joined.' });
          if (room.visibility === 'closed') return send(res, 403, { error: 'This party is locked and is not accepting new players.' });
          const linkAuthorized = roomIdentifier === room.joinToken && body.joinToken === room.joinToken;
          if (room.visibility === 'public' && roomIdentifier !== room.id && !linkAuthorized) {
            return send(res, 403, { error: 'Join this public party from the Server List.' });
          }
          if (room.visibility === 'private' && roomIdentifier.toUpperCase() !== room.code && !linkAuthorized) {
            return send(res, 403, { error: 'Enter this party’s invite code to unlock it.' });
          }
          if (body.expectedRoomId && body.expectedRoomId !== room.id) {
            return send(res, 403, { error: 'That code does not unlock this party.' });
          }
        }
        if (player) {
          player.lastSeen = Date.now();
          if(player.accountId && player.accountId!==signedIn?.id) return send(res,403,{error:'This player belongs to another account.'});
          player.name = signedIn?.username || cleanName(body.name || player.name);
        } else {
          if (room.status !== 'lobby') return send(res, 409, { error: 'This game has already started.' });
          room.players = room.players.filter(p => isOnline(p) || p.id === room.hostId);
          if (room.players.length >= 4) return send(res, 409, { error: 'This room already has four players.' });
          player = addPlayer(room, playerId, signedIn?.username || body.name, body.hero);
          player.accountId = signedIn?.id || null;
          moveHost(room);
        }
        return send(res, 200, { room: publicRoom(room, playerId), playerId });
      }
      if (req.method === 'POST' && parts[3] === 'input') {
        const body = await readJson(req);
        const playerId = String(body.playerId || '');
        const player = room.players.find(p => p.id === playerId);
        if (!player) return send(res, 403, { error: 'This player is not in the room.' });
        if (player.accountId && player.accountId !== signedIn?.id) return send(res,403,{error:'Sign in to the account that joined this run.'});
        const now = Date.now();
        player.lastSeen = now;
        room.lastActivity = now;
        if (room.status === 'playing' && !room.game?.paused && room.game?.phase === 'wave' && now - player.lastInput >= 20) {
          let x = clamp(Number(body.x) || 0, -1, 1);
          let y = clamp(Number(body.y) || 0, -1, 1);
          const len = Math.hypot(x, y);
          if (len > 1) { x /= len; y /= len; }
          player.move = { x, y };
          if (len > 0.1) player.facing = { x: x / len, y: y / len };
          player.lastInput = now;
        }
        res.writeHead(204, { 'Cache-Control': 'no-store' });
        return res.end();
      }
      if (req.method === 'POST' && parts[3] === 'action') {
        const body = await readJson(req);
        const playerId = String(body.playerId || '');
        const player = room.players.find(p => p.id === playerId);
        if (!player) return send(res, 403, { error: 'This player is not in the room.' });
        if (player.accountId && player.accountId !== signedIn?.id) return send(res,403,{error:'Sign in to the account that joined this run.'});
        player.lastSeen = Date.now();
        room.lastActivity = Date.now();
        const action = String(body.action || '');
        if (action === 'chat') {
          if(room.mode!=='coop'||room.status!=='lobby') return send(res,409,{error:'Chat is available in the waiting lobby only.'});
          const text=String(body.value||'').trim().slice(0,200);
          if(!text) return send(res,400,{error:'Enter a message first.'});
          if(Date.now()-(player.lastChat||0)<1200)return send(res,429,{error:'Wait a moment before sending another message.'});
          player.lastChat=Date.now();(room.chat ||= []).push({id:newId(),name:player.name,text,at:Date.now()});room.chat=room.chat.slice(-50);
        } else if(action==='endless'||action==='replay'){
          if(room.status!=='finished')return send(res,409,{error:'Finish the current run first.'});
          if(room.hostId!==player.id)return send(res,403,{error:'Only the host can choose the next run.'});
          if(action==='endless'){
            if(room.game.phase!=='won'||room.game.endless)return send(res,409,{error:'Endless mode unlocks after completing ten waves.'});
            room.status='playing';room.game.endless=true;room.game.result=null;
            for(const p of room.players){p.alive=true;p.hp=Math.max(p.hp,p.maxHp*.5);p.upgradePicked=false;p.upgradeChoices=rollUpgradeChoices(p,room);}
            room.game.phase='upgrade';room.game.phaseTimer=room.mode==='coop'?20:null;
          }else{
            room.players=room.players.map(p=>Object.assign(makePlayer(p.id,p.name,p.hero),{accountId:p.accountId,ready:true}));
            room.status='playing';room.game=newGame();room.game.roomMode=room.mode;beginWave(room,1);
          }
        } else if (action === 'visibility') {
          if (room.mode !== 'coop' || room.status !== 'lobby') return send(res, 409, { error: 'Party access can only be changed in a multiplayer lobby.' });
          if (room.hostId !== player.id) return send(res, 403, { error: 'Only the host can change party access.' });
          if (!['public', 'private', 'closed'].includes(body.value)) return send(res, 400, { error: 'Choose Public, Private, or Closed.' });
          room.visibility = body.value;
        } else if (action === 'character' && room.status === 'lobby') {
          const choice = body.value === '' || body.value == null ? null : body.value;
          if (choice !== null && choice !== 'Random' && !HEROES[choice]) return send(res, 400, { error: 'Unknown hero.' });
          if (HEROES[choice] && room.players.some(other => other.id !== player.id && other.hero === choice)) {
            return send(res, 409, { error: `${choice} has already been chosen by another player.` });
          }
          player.hero = choice;
          player.maxHp = HEROES[player.hero]?.hp || HEROES.Ravela.hp;
          player.hp = player.maxHp;
          player.ready = false;
        } else if (action === 'name' && room.status === 'lobby') {
          player.name = signedIn?.username || cleanName(body.value);
        } else if (action === 'ready' && room.status === 'lobby') {
          player.ready = Boolean(body.value);
        } else if (action === 'start' && room.status === 'lobby') {
          if (room.hostId !== player.id) return send(res, 403, { error: 'Only the host can start the run.' });
          if (!canStart(room)) return send(res, 409, { error: 'Every online player must choose a character and ready up first.' });
          assignRandomHeroes(room);
          room.status = 'playing';
          room.game = newGame();
          room.game.roomMode = room.mode;
          beginWave(room, 1);
        } else if (action === 'pause') {
          if (room.mode !== 'solo' || room.status !== 'playing' || !['intro', 'wave'].includes(room.game?.phase)) {
            return send(res, 409, { error: 'Pause is available during solo gameplay.' });
          }
          room.game.paused = Boolean(body.value);
          if (room.game.paused) player.move = { x: 0, y: 0 };
        } else if (action === 'move' && room.status === 'playing' && !room.game?.paused && room.game?.phase === 'wave') {
          const now = Date.now();
          if (now - player.lastInput > 20) {
            let x = clamp(Number(body.x) || 0, -1, 1);
            let y = clamp(Number(body.y) || 0, -1, 1);
            const len = Math.hypot(x, y);
            if (len > 1) { x /= len; y /= len; }
            player.move = { x, y };
            if (len > 0.1) player.facing = { x: x / len, y: y / len };
            player.lastInput = now;
          }
        } else if (action === 'ability') {
          useAbility(room, player);
        } else if (action === 'upgrade' && room.status === 'playing' && room.game?.phase === 'upgrade' && !player.upgradePicked) {
          const upgrades = {
            power: () => { player.buff.damage *= 1.2; },
            vigor: () => { player.buff.maxHp *= 1.2; player.maxHp = heroStats(player).maxHp; player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.25)); },
            swift: () => { player.buff.speed *= 1.13; },
            focus: () => { player.buff.cooldown *= 0.86; },
            'ravela-range': () => {},
            'ravela-defense': () => {},
            'ravela-mark-strength': () => {},
            'ravela-shot-damage': () => {},
            'ravela-regen': () => {},
            'ravela-mark-duration': () => {},
            'ravela-double-shot': () => {},
            'ravela-mark-cooldown': () => {},
            'ravela-health': () => {},
            'ravela-move-speed': () => {},
            'ravela-attack-speed': () => {},
            'ravela-crit-chance': () => {},
            'ravela-crit-damage': () => {},
            'fjord-range': () => {},
            'fjord-defense': () => {},
            'fjord-vigor': () => {},
            'fjord-breath-damage': () => {},
            'fjord-mace-damage': () => {},
            'fjord-regen': () => {},
            'fjord-mark-duration': () => {},
            'fjord-breath-width': () => {},
            'fjord-breath-cooldown': () => {},
            'fjord-hp': () => {},
            'fjord-move-speed': () => {},
            'fjord-attack-speed': () => {},
            'fjord-crit-chance': () => {},
            'fjord-crit-damage': () => {},
            'aram-range': () => {},
            'aram-defense': () => {},
            'aram-vigor': () => {},
            'aram-riposte-invulnerability': () => {},
            'aram-slash-damage': () => {},
            'aram-regen': () => {},
            'aram-riposte-stun': () => {},
            'aram-riposte-radius': () => {},
            'aram-riposte-cooldown': () => {},
            'aram-hp': () => {},
            'aram-move-speed': () => {},
            'aram-attack-speed': () => {},
            'aram-crit-chance': () => {},
            'aram-crit-damage': () => {},
            'gavrilta-range': () => {},
            'gavrilta-defense': () => {},
            'gavrilta-vigor': () => {},
            'gavrilta-root-duration': () => {},
            'gavrilta-thorn-damage': () => {},
            'gavrilta-regen': () => {},
            'gavrilta-binding-vines': () => {},
            'gavrilta-overgrowth-radius': () => {},
            'gavrilta-overgrowth-cooldown': () => {},
            'gavrilta-hp': () => {},
            'gavrilta-move-speed': () => {},
            'gavrilta-attack-speed': () => {},
            'gavrilta-crit-chance': () => {},
            'gavrilta-crit-damage': () => {}
          };
          if (!Array.isArray(player.upgradeChoices) || !player.upgradeChoices.includes(body.value) || !upgrades[body.value]) return send(res, 400, { error: 'Upgrade was not offered to this player.' });
          upgrades[body.value]();
          if (player.hero === 'Ravela' || player.hero === 'Fjord' || player.hero === 'Aram' || player.hero === 'Gavrilta') {
            player.upgradeLevels[body.value] = (player.upgradeLevels[body.value] || 0) + 1;
            player.maxHp = heroStats(player, room).maxHp;
            if (body.value === 'fjord-vigor' || body.value === 'aram-vigor' || body.value === 'gavrilta-vigor') player.hp = Math.min(player.maxHp, player.hp + Math.ceil(player.maxHp * 0.25));
          }
          player.upgradePicked = true;
          player.upgradeChoices = [];
        } else if (action === 'leave') {
          accounts.saveRun(room,player);
          room.players = room.players.filter(p => p.id !== player.id);
          moveHost(room);
          if (!room.players.length) rooms.delete(room.id);
          return send(res, 200, { ok: true, left: true });
        }
        moveHost(room);
        return send(res, 200, { room: publicRoom(room, playerId) });
      }
      return send(res, 404, { error: 'Not found' });
    }
    if (req.method === 'GET'||req.method==='HEAD') return serveStatic(req, res, url.pathname);
    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    const clientError=error instanceof URIError||/Invalid JSON|Request too large|Request aborted|suitable player name/.test(error.message||'');
    if(!clientError)console.error('Request failed:',error);
    return send(res,clientError?400:500,{error:clientError?error.message:'Server could not complete the request. Please try again.'});
  }
});

const TICK_MS = Math.round(1000 / 30);
let previousTickAt = Date.now();
const tickHandle=setInterval(() => {
  const now = Date.now();
  const dt = clamp((now - previousTickAt) / 1000, 0, 0.1);
  previousTickAt = now;
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL) { for(const player of room.players)accounts.saveRun(room,player);rooms.delete(code); continue; }
    moveHost(room);
    updateGame(room, dt, now);
  }
}, TICK_MS);

function shutdown(signal){
  if(shuttingDown)return;shuttingDown=true;clearInterval(tickHandle);
  console.log('Shutting down:',signal);
  for(const room of rooms.values())for(const player of room.players)try{accounts.saveRun(room,player);}catch(error){console.error('Progress checkpoint failed:',error);}
  const timeout=setTimeout(()=>process.exit(1),9000);timeout.unref();
  server.close(()=>{try{accounts.close();}catch(error){console.error(error);process.exitCode=1;}clearTimeout(timeout);});
  server.closeIdleConnections();
}
process.once('SIGTERM',()=>shutdown('SIGTERM'));
process.once('SIGINT',()=>shutdown('SIGINT'));
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Slime Slayer demo listening on http://localhost:${PORT}`);
});
