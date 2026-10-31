# Slime Slayer

A browser-playable prototype for the Slime Slayer co-op roguelike. It uses a small Node.js server and browser-native HTML, CSS, and canvas. There are no third-party runtime dependencies.

## Run locally

Install Node.js 22.13 or newer (Node.js 24 recommended), then run:

```powershell
node server.js
```

If npm is installed, `npm start` runs the same command.

Open <http://localhost:3000>. To play with another device on the same Wi-Fi, open the host computer's local network address on that device. Public play requires deploying this Node service to a public host.

## Included in this demo

- A simple Solo / Party opening screen. Solo leads to hero selection; Party lets the host name a room or lets other players join with a five-character code.
- A four-seat ready-up lobby with a player name field, left/right hero browsing, blank initial selection, Random selection, and server-enforced hero reservations.
- Host handoff and reconnect using the browser's saved player identity.
- Server-owned player movement, attacks, enemy behavior, health, wave progression, upgrades, score, and win/loss state.
- Ten waves that follow the slime lineup in the design outline, with a King Slime on wave ten.
- Automatic hero attacks, critical hits for every hero, four abilities, and three randomized upgrade choices after each cleared wave.
- Hero-keyed upgrade pools with three randomized choices after each cleared wave. All four heroes have dedicated thematic upgrade pools and card caps.
- Keyboard controls on desktop and an on-screen movement pad and ability button on touch screens.
- A live FPS readout while playing. Rendering follows the display's animation-frame rate; a 120 Hz display can render at up to 120 FPS.
- The four existing character illustrations in the selection screens. The game includes pixel-art character and slime sprites, title artwork, a Roman coliseum arena, looping music, and combat sound effects.

## Controls and rules

- Move with **WASD** or the **arrow keys**. On touch screens, drag the left movement pad.
- Attacks happen automatically when a slime is in range.
- Aram has a 10% base critical-hit chance; the other heroes have a 5% chance and 200% base critical damage. Champion stats show chance and damage separately.
- Press **E** or tap the ability button to use the chosen hero's ability.
- Ravela's Mark of Death instantly marks the nearest slime within bow range for 3.5 seconds, making it take 50% more damage from all sources. Its base cooldown is 12 seconds. Her passive has a 10% chance to fire at the two nearest slimes in one volley.
- Clear a wave to choose one permanent upgrade. The next wave starts after each connected player chooses, or after the short intermission expires.
- In co-op, a downed hero returns at the center between waves. If the whole party falls during a wave, the run ends.
- Green slimes fire shots, yellow slimes charge and dash, black slimes rain slime, and red slimes detonate after a warning fuse.

## Architecture notes

`server.js` owns rooms and the simulation. Browsers send movement and action requests, then poll the shared room state. This keeps the current prototype dependency-free and lets multiple browsers join one running server. Room state is held in memory, so a server restart clears active runs. For this demo, deploy one server instance; multiple instances would need shared room storage and coordination.

The simulation ticks at 30 Hz, while the browser interpolates received snapshots and renders with `requestAnimationFrame`. The arena background and slime sprites are cached, the background uses its own canvas layer, and the dynamic canvas resolution is capped to reduce high-DPI rendering cost. Actual FPS still depends on the device, browser, and display refresh rate; the in-game counter reports the measured rate.

For a public competition link, deploy the folder as a Node web service with `npm start` as its start command. The server listens on the `PORT` environment variable supplied by the host. A deploy host/account and a public URL have not been configured yet.

## Art files

Character portraits are served from the `Art` folder. `Gavrilta` uses `Gavrilla character art.png` as supplied. Pixel-art sprites, generated environment artwork and canvas effects are integrated; the hero portraits and visual colors are defined in `public/app.js` and `server.js`, while the scene layout is in `public/style.css`.

## Accounts and progression

Accounts use the built-in Node SQLite driver. The database is created automatically at data/accounts.sqlite. Keep this directory on persistent storage and back it up; usernames, password hashes, session records, run scores, champion XP, and achievements live here. No password is stored as plaintext. Passwords use a per-account salt and scrypt. Sessions use random, hashed, HttpOnly cookies that expire after 30 days. Public hosting should serve this app over HTTPS. There is no password recovery flow in this version.

The leaderboard lists every account with its best individual run score, including its share of wave bonuses, in pages of 50. Run scores and progression are calculated by the server and checkpointed on wave clears, defeat, and explicit leaving. Ending wave ten unlocks the relevant champion achievement. Continuing into endless retains the same run ID and only newly earned score adds XP, so continuing never double counts the first ten waves.

Each champion starts at level 1. Score becomes XP, with total XP for level L equal to 1,000 × (L − 1)². Level 2 needs 1,000 total XP; level 10 needs 81,000; level 100 needs 9,801,000. Progress is capped at level 100. Levels are cosmetic progression and do not modify combat balance.

At victory the host can replay or continue into endless. Endless retains upgrades and recovers fallen allies; regular slime difficulty scales with the wave. King Slimes appear only on multiples of ten: one at 10, two at 20, three at 30, and so on.

Tutorials display once per account, or once each guest run until the guest disables them for the current browser session. Multiplayer text chat is available in waiting lobbies only, with bounded messages and a send cooldown. Username checks cover common profanity, slurs, separators, repeated letters, and common leetspeak. A finite filter can still miss novel evasions or reject innocent names.

## Verification

Run node tools/verify-progression.js for isolated account and gameplay integration checks. It creates and removes a temporary SQLite database under tmp. Browser checks are in tools/verify-browser.js and use the local bundled Playwright runtime and Microsoft Edge; they run on a temporary port and database and save screenshots under output.

## Render deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the tested Render Blueprint, persistent SQLite disk configuration, account migration and backup steps, production checks, and current limitations. Deployment uses one Node web service with a paid persistent disk. This repository is prepared for deployment; a public service has not been created.
