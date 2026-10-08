const http = require('node:http');
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

const HEROES = {
  Ravela: { hp: 20, speed: 175, damage: 24, range: 340, interval: 0.62, kind: 'arrow', color: '#e4d7f5', ability: 'Mark of Death' },
  Fjord: { hp: 85, speed: 112, damage: 31, range: 94, interval: 1.05, kind: 'cleave', color: '#ed9b4b', ability: 'Fire Breath' },
  Aram: { hp: 50, speed: 145, damage: 22, range: 96, interval: 0.62, kind: 'sword', color: '#a6c3a3', ability: 'Riposte' },
  Gavrilta: { hp: 30, speed: 130, damage: 15, range: 300, interval: 1.12, kind: 'orb', color: '#82db77', ability: 'Wild Growth' }
};

const ENEMY = {
  blue:   { name: 'Blue Slime',   hp: 32, speed: 64, damage: 6,  size: 17, color: '#4ca4ee', points: 10 },
  green:  { name: 'Green Slime',  hp: 48, speed: 38, damage: 5,  size: 19, color: '#7fd05e', points: 14 },
  red:    { name: 'Red Slime',    hp: 76, speed: 30, damage: 12, size: 22, color: '#f06c4c', points: 20 },
  yellow: { name: 'Yellow Slime', hp: 42, speed: 76, damage: 10, size: 17, color: '#f5d452', points: 24 },
  black:  { name: 'Black Slime',  hp: 124, speed: 34, damage: 12, size: 25, color: '#9683bb', points: 32 },
  king:   { name: 'King Slime',   hp: 980, speed: 22, damage: 21, size: 48, color: '#e04c63', points: 500 }
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
function cleanName(value) {
  const name = String(value || '').trim().replace(/[<>]/g, '').slice(0, 18);
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
    invulnerableUntil: 0, buff: { damage: 1, speed: 1, maxHp: 1, cooldown: 1 },
    upgradePicked: false, lastSeen: Date.now(), lastInput: 0
  };
}
function heroStats(player) {
  const base = HEROES[player.hero] || HEROES.Ravela;
  return {
    ...base,
    maxHp: Math.round(base.hp * player.buff.maxHp),
    speed: base.speed * player.buff.speed,
    damage: base.damage * player.buff.damage,
    interval: base.interval * player.buff.cooldown
  };
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
    phase: 'wave', wave: 1, waveElapsed: 0, waveDuration: 20, spawnTimer: 0,
    enemies: [], projectiles: [], effects: [], spawnIndex: 0, bossSpawned: false,
    nextId: 1, startedAt: Date.now(), completedWaves: 0, teamKills: 0, teamDamage: 0,
    phaseTimer: 0, roomMode: 'coop'
  };
}
function publicRoom(room, viewerId) {
  const now = Date.now();
  return {
    serverTime: now, id: room.id, code: room.mode === 'coop' && room.visibility === 'private' ? room.code : null,
    joinToken: room.mode === 'coop' ? room.joinToken : null,
    visibility: room.visibility || 'private', mode: room.mode, partyName: room.partyName, status: room.status, hostId: room.hostId,
    isHost: room.hostId === viewerId,
    players: room.players.map(p => ({
      id: p.id, name: p.name, hero: p.hero, ready: p.ready, online: isOnline(p, now),
      x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, alive: p.alive, score: p.score,
      damage: p.damage, kills: p.kills, deaths: p.deaths, abilityCooldown: p.abilityCooldown,
      abilityName: HEROES[p.hero]?.ability, upgradePicked: p.upgradePicked,
      buff: p.buff, marked: p.markedUntil > now
    })),
    game: room.game ? {
      phase: room.game.phase, wave: room.game.wave, waveElapsed: room.game.waveElapsed,
      waveDuration: room.game.waveDuration, enemies: room.game.enemies,
      projectiles: room.game.projectiles, effects: room.game.effects,
      completedWaves: room.game.completedWaves, teamKills: room.game.teamKills,
      teamDamage: room.game.teamDamage, remaining: room.game.enemies.length,
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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    stunnedUntil: 0, rootedUntil: 0, slowUntil: 0, markedUntil: 0,
    dotUntil: 0, dotNext: 0, dotDamage: 0, dotBy: null, attackType: 'contact'
  });
}
function damagePlayer(player, amount, now) {
  if (!player.alive || player.invulnerableUntil > now) return false;
  const stats = heroStats(player);
  let damage = amount * (player.hero === 'Fjord' ? 0.8 : 1);
  if (player.markedUntil > now) damage *= 1.25;
  player.hp = Math.max(0, player.hp - Math.max(1, Math.round(damage)));
  if (player.hp <= 0) {
    player.alive = false;
    player.deaths++;
    player.move = { x: 0, y: 0 };
    return true;
  }
  return false;
}
function damageEnemy(room, enemy, amount, playerId, now) {
  const game = room.game;
  if (!game.enemies.includes(enemy)) return;
  const hit = Math.max(1, amount * (enemy.markedUntil > now ? 1.25 : 1));
  enemy.hp -= hit;
  game.teamDamage += hit;
  const player = room.players.find(p => p.id === playerId);
  if (player) { player.damage += hit; player.score += hit; }
  if (enemy.hp > 0) return;
  game.enemies = game.enemies.filter(e => e !== enemy);
  game.teamKills++;
  if (player) { player.kills++; player.score += enemy.points; }
  newEffect(game, enemy.x, enemy.y, enemy.color, enemy.size * 1.9, 'pop', 0.32);
  if (enemy.type === 'red') {
    newEffect(game, enemy.x, enemy.y, '#ff7654', 105, 'ring', 0.5);
    for (const target of room.players) {
      if (target.alive && Math.hypot(target.x - enemy.x, target.y - enemy.y) < 105) damagePlayer(target, 16, now);
    }
    for (const other of [...game.enemies]) {
      if (other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 105) damageEnemy(room, other, 40, playerId, now);
    }
  }
}
function nearestEnemy(game, x, y, range = Infinity) {
  let best = null;
  let bestDistance = range;
  for (const enemy of game.enemies) {
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
  game.phase = 'wave';
  game.waveElapsed = 0;
  game.waveDuration = wave === 10 ? 28 : 20;
  game.spawnTimer = wave === 10 ? 1 : 0.8;
  game.bossSpawned = false;
  game.enemies = [];
  for (const p of room.players) {
    p.upgradePicked = false;
    if (p.alive === false && room.mode === 'coop') {
      p.alive = true;
      p.hp = Math.max(1, Math.ceil(heroStats(p).maxHp * 0.55));
      p.x = WORLD.width / 2;
      p.y = WORLD.height / 2;
      p.invulnerableUntil = Date.now() + 1800;
    }
  }
  newEffect(game, WORLD.width / 2, WORLD.height / 2, '#ffe2a1', 190, 'ring', 0.8);
}
function endRun(room, result) {
  if (!room.game) return;
  room.game.phase = result;
  room.game.result = result;
  room.status = 'finished';
  for (const p of room.players) p.move = { x: 0, y: 0 };
}
function updateGame(room, dt, now) {
  const game = room.game;
  if (!game || room.status !== 'playing') return;
  if (game.phase === 'upgrade') {
    game.phaseTimer -= dt;
    const active = room.players.filter(p => isOnline(p, now));
    if (active.length && active.every(p => p.upgradePicked) || game.phaseTimer <= 0) {
      if (game.wave >= 10) endRun(room, 'won');
      else beginWave(room, game.wave + 1);
    }
    return;
  }
  if (game.phase !== 'wave') return;
  game.waveElapsed += dt;
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 && game.waveElapsed < game.waveDuration && game.enemies.length < 36) {
    const types = WAVE_TYPES[game.wave] || ['blue'];
    const type = types[Math.floor(Math.random() * types.length)];
    spawnEnemy(room, type);
    game.spawnIndex++;
    game.spawnTimer = Math.max(0.52, 1.75 - game.wave * 0.09) * (0.8 + Math.random() * 0.4);
  }
  if (game.wave === 10 && !game.bossSpawned && game.waveElapsed > 2) {
    spawnEnemy(room, 'king');
    game.bossSpawned = true;
  }

  for (const effect of game.effects) effect.life -= dt;
  game.effects = game.effects.filter(effect => effect.life > 0);

  for (const player of room.players) {
    if (!isOnline(player, now)) player.move = { x: 0, y: 0 };
    player.tickStartX = player.x;
    player.tickStartY = player.y;
    if (!player.alive) continue;
    const stats = heroStats(player);
    player.maxHp = stats.maxHp;
    player.hp = Math.min(player.maxHp, player.hp + dt * 0.05);
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
    if (player.attackCooldown <= 0) {
      const target = nearestEnemy(game, player.x, player.y, stats.range);
      if (target) {
        player.attackCooldown = stats.interval;
        if (stats.kind === 'cleave') {
          newEffect(game, player.x, player.y, '#f6a34d', 96, 'slash', 0.3);
          for (const enemy of [...game.enemies]) {
            if (Math.hypot(enemy.x - player.x, enemy.y - player.y) <= 96) damageEnemy(room, enemy, stats.damage, player.id, now);
          }
        } else if (stats.kind === 'sword') {
          newEffect(game, (player.x + target.x) / 2, (player.y + target.y) / 2, '#e8e7cc', 54, 'slash', 0.23);
          damageEnemy(room, target, stats.damage, player.id, now);
        } else {
          const aimX = target.x - player.x;
          const aimY = target.y - player.y;
          const aimLength = Math.max(1, Math.hypot(aimX, aimY));
          game.projectiles.push({
            id: game.nextId++, type: 'hero', from: player.id, target: target.id,
            x: player.x, y: player.y, originX: player.x, originY: player.y,
            createdAt: now, launchedThisTick: true, speed: stats.kind === 'arrow' ? 560 : 390,
            maxRange: stats.range, distanceTravelled: 0, dirX: aimX / aimLength, dirY: aimY / aimLength,
            damage: stats.damage, color: stats.kind === 'arrow' ? '#f2e8ff' : '#8ee677',
            radius: stats.kind === 'arrow' ? 6 : 9, poison: stats.kind === 'orb', mark: false
          });
        }
        if (player.hero === 'Aram' && Math.random() < 0.1) target.stunnedUntil = now + 700;
      }
    }
  }

  for (const enemy of [...game.enemies]) {
    if (enemy.stunnedUntil > now) continue;
    if (enemy.dotUntil > now && enemy.dotNext <= now) {
      enemy.dotNext = now + 500;
      damageEnemy(room, enemy, enemy.dotDamage, enemy.dotBy, now);
      if (!game.enemies.includes(enemy)) continue;
    }
    let target = null;
    let targetDistance = Infinity;
    for (const p of room.players) {
      if (!p.alive) continue;
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (d < targetDistance) { target = p; targetDistance = d; }
    }
    if (!target) continue;
    const spec = ENEMY[enemy.type];
    const ranged = ['green', 'yellow', 'black'].includes(enemy.type);
    const preferredRange = enemy.type === 'yellow' ? 300 : enemy.type === 'black' ? 270 : 170;
    const shouldShoot = ranged && targetDistance < preferredRange && targetDistance > 92;
    const shouldApproach = !ranged || (!shouldShoot && targetDistance > enemy.size + 22);
    if (shouldApproach && enemy.rootedUntil < now && enemy.slowUntil < now) {
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const enemyPosition = clampToArena(
        enemy.x + dx / d * enemy.speed * dt,
        enemy.y + dy / d * enemy.speed * dt,
        Math.max(16, enemy.size)
      );
      enemy.x = enemyPosition.x;
      enemy.y = enemyPosition.y;
    }
    enemy.cooldown -= dt;
    if (enemy.cooldown > 0) continue;
    if (ranged && (shouldShoot || targetDistance < 90)) {
      const mark = enemy.type === 'black';
      const aimX = target.x - enemy.x;
      const aimY = target.y - enemy.y;
      const aimLength = Math.max(1, Math.hypot(aimX, aimY));
      game.projectiles.push({
        id: game.nextId++, type: 'enemy', from: enemy.id, target: target.id,
        x: enemy.x, y: enemy.y, originX: enemy.x, originY: enemy.y,
        createdAt: now, launchedThisTick: true, tx: target.x, ty: target.y,
        maxRange: Math.hypot(aimX, aimY), distanceTravelled: 0, dirX: aimX / aimLength, dirY: aimY / aimLength,
        speed: enemy.type === 'yellow' ? 300 : 210, damage: enemy.damage,
        color: enemy.color, radius: enemy.type === 'black' ? 12 : 8,
        slow: enemy.type === 'green', mark
      });
      enemy.cooldown = enemy.type === 'yellow' ? 1.7 : enemy.type === 'black' ? 2.4 : 2.8;
    } else if (!ranged && targetDistance < enemy.size + 30) {
      if (enemy.type === 'red') {
        // Red slimes rush the party and burst in a small flame blast.
        damageEnemy(room, enemy, enemy.hp + 1, null, now);
      } else if (target.hero === 'Aram' && Math.random() < 0.1) {
        enemy.stunnedUntil = now + 3000;
        newEffect(game, target.x, target.y, '#d9f2e2', 72, 'ring', 0.3);
      } else {
        const downed = damagePlayer(target, enemy.damage, now);
        if (enemy.type === 'green') target.rootedUntil = now + 700;
        if (downed && room.mode === 'solo') endRun(room, 'lost');
      }
      enemy.cooldown = enemy.type === 'red' ? 1.25 : 1.05;
    } else {
      enemy.cooldown = 0.4;
    }
  }

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
          target.dotDamage = 5;
          target.dotBy = projectile.from;
          target.rootedUntil = Math.max(target.rootedUntil, now + 1000);
        }
        if (projectile.mark && game.enemies.includes(target)) target.markedUntil = now + 3000;
        const attacker = room.players.find(p => p.id === projectile.from);
        if (attacker?.hero === 'Ravela' && game.enemies.includes(target) && Math.random() < 0.1) target.markedUntil = now + 3000;
      } else {
        const player = target;
        if (player.hero === 'Aram' && Math.random() < 0.1) {
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
    if (game.wave === 10) { endRun(room, 'won'); return; }
    game.phase = 'upgrade';
    game.phaseTimer = 24;
    for (const p of room.players) p.upgradePicked = false;
    newEffect(game, WORLD.width / 2, WORLD.height / 2, '#ffe8a2', 220, 'ring', 0.8);
  }
}

function useAbility(room, player) {
  const game = room.game;
  const now = Date.now();
  if (!game || game.phase !== 'wave' || !player.alive || player.abilityCooldown > 0) return;
  const stats = heroStats(player);
  player.abilityCooldown = 10 * player.buff.cooldown;
  if (player.hero === 'Ravela') {
    const target = nearestEnemy(game, player.x, player.y, 480);
    if (target) {
      damageEnemy(room, target, stats.damage * 4.2, player.id, now);
      if (game.enemies.includes(target)) target.markedUntil = now + 3500;
      newEffect(game, target.x, target.y, '#f5e5ff', 82, 'burst', 0.42);
    }
  } else if (player.hero === 'Fjord') {
    const fx = player.facing.x || 1;
    const fy = player.facing.y || 0;
    newEffect(game, player.x + fx * 80, player.y + fy * 80, '#ff7847', 230, 'breath', 0.55);
    for (const enemy of [...game.enemies]) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const d = Math.hypot(dx, dy);
      const dot = (dx * fx + dy * fy) / Math.max(1, d);
      if (d < 245 && dot > 0.2) damageEnemy(room, enemy, stats.damage * 3.1, player.id, now);
    }
  } else if (player.hero === 'Aram') {
    player.invulnerableUntil = now + 1300;
    newEffect(game, player.x, player.y, '#d9f0da', 145, 'pulse', 0.55);
    for (const enemy of game.enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 150) enemy.stunnedUntil = now + 2600;
    }
  } else {
    newEffect(game, player.x, player.y, '#85e85f', 175, 'roots', 0.62);
    for (const enemy of game.enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 175) {
        enemy.rootedUntil = now + 1700;
        enemy.dotUntil = now + 2800;
        enemy.dotNext = now + 350;
        enemy.dotDamage = 9;
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
  else if (pathname.startsWith('/art/')) {
    const key = decodeURIComponent(pathname.slice(5));
    const allowed = Object.values(CHARACTER_ART);
    if (!allowed.includes(key)) return send(res, 404, { error: 'Not found' });
    file = path.join(ROOT, 'Art', key);
  } else return send(res, 404, { error: 'Not found' });
  const ext = path.extname(file).toLowerCase();
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
  fs.readFile(file, (error, data) => {
    if (error) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': ext === '.png' ? 'public, max-age=3600' : 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, rooms: rooms.size });
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
      const player = addPlayer(room, playerId, body.name, body.hero);
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
          player.name = cleanName(body.name || player.name);
        } else {
          if (room.status !== 'lobby') return send(res, 409, { error: 'This game has already started.' });
          room.players = room.players.filter(p => isOnline(p) || p.id === room.hostId);
          if (room.players.length >= 4) return send(res, 409, { error: 'This room already has four players.' });
          player = addPlayer(room, playerId, body.name, body.hero);
          moveHost(room);
        }
        return send(res, 200, { room: publicRoom(room, playerId), playerId });
      }
      if (req.method === 'POST' && parts[3] === 'input') {
        const body = await readJson(req);
        const playerId = String(body.playerId || '');
        const player = room.players.find(p => p.id === playerId);
        if (!player) return send(res, 403, { error: 'This player is not in the room.' });
        const now = Date.now();
        player.lastSeen = now;
        room.lastActivity = now;
        if (room.status === 'playing' && room.game?.phase === 'wave' && now - player.lastInput >= 20) {
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
        player.lastSeen = Date.now();
        room.lastActivity = Date.now();
        const action = String(body.action || '');
        if (action === 'visibility') {
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
          player.name = cleanName(body.value);
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
        } else if (action === 'move' && room.status === 'playing' && room.game?.phase === 'wave') {
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
            focus: () => { player.buff.cooldown *= 0.86; }
          };
          if (!upgrades[body.value]) return send(res, 400, { error: 'Unknown upgrade.' });
          upgrades[body.value]();
          player.upgradePicked = true;
          player.score += 100;
        } else if (action === 'leave') {
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
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed.' });
  }
});

const TICK_MS = Math.round(1000 / 30);
let previousTickAt = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = clamp((now - previousTickAt) / 1000, 0, 0.1);
  previousTickAt = now;
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL) { rooms.delete(code); continue; }
    moveHost(room);
    updateGame(room, dt, now);
  }
}, TICK_MS);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Slime Slayer demo listening on http://localhost:${PORT}`);
});
