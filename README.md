# Slime Slayer

A browser-playable prototype for the Slime Slayer co-op roguelike. It uses a small Node.js server and browser-native HTML, CSS, and canvas. There are no third-party runtime dependencies.

## Run locally

Install Node.js 18 or newer, then run:

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
- Hero-keyed upgrade pools with three randomized choices after each cleared wave. Ravela has thirteen dedicated upgrades with per-card caps; the other heroes retain the existing four general upgrades for now.
- Keyboard controls on desktop and an on-screen movement pad and ability button on touch screens.
- A live FPS readout while playing. Rendering follows the display's animation-frame rate; a 120 Hz display can render at up to 120 FPS.
- The four existing character illustrations in the selection screens. Arena sprites, effects, and the coliseum are canvas placeholders designed to be replaced as the final art is created.

## Controls and rules

- Move with **WASD** or the **arrow keys**. On touch screens, drag the left movement pad.
- Attacks happen automatically when a slime is in range.
- Every hero has a 5% base critical-hit chance and 200% base critical damage. Champion stats show chance and damage separately.
- Press **E** or tap the ability button to use the chosen hero's ability.
- Ravela's Mark of Death instantly marks the nearest slime within bow range for 3.5 seconds, making it take 50% more damage from all sources. Its base cooldown is 12 seconds. Her passive has a 10% chance to fire at the two nearest slimes in one volley.
- Clear a wave to choose one permanent upgrade. The next wave starts after each connected player chooses, or after the short intermission expires.
- In co-op, a downed hero returns at the center between waves. If the whole party falls during a wave, the run ends.
- Green, yellow, and black slimes can attack from range. Red slimes burst when defeated.

## Architecture notes

`server.js` owns rooms and the simulation. Browsers send movement and action requests, then poll the shared room state. This keeps the current prototype dependency-free and lets multiple browsers join one running server. Room state is held in memory, so a server restart clears active runs. For this demo, deploy one server instance; multiple instances would need shared room storage and coordination.

The simulation ticks at 30 Hz, while the browser interpolates received snapshots and renders with `requestAnimationFrame`. The arena background and slime sprites are cached, the background uses its own canvas layer, and the dynamic canvas resolution is capped to reduce high-DPI rendering cost. Actual FPS still depends on the device, browser, and display refresh rate; the in-game counter reports the measured rate.

For a public competition link, deploy the folder as a Node web service with `npm start` as its start command. The server listens on the `PORT` environment variable supplied by the host. A deploy host/account and a public URL have not been configured yet.

## Art files

Character portraits are served from the `Art` folder. `Gavrilta` uses `Gavrilla character art.png` as supplied. The hand-drawn canvas sprites and effects are temporary placeholders; the hero portraits and visual colors are defined in `public/app.js` and `server.js`, while the scene layout is in `public/style.css`.
