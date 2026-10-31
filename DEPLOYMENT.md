# Deploy Slime Slayer on Render

This repository is a complete Node web service: it serves the website, game art, audio, multiplayer API, and SQLite accounts from the same origin. Deploy it as a **Web Service**, not a Static Site. No image or audio generation is needed during deployment.

## Deploy

1. Put the project in a Git repository and push it to GitHub or another Git provider supported by Render. Include `Art`, `public/audio`, `accounts.js`, `server.js`, `package.json`, `package-lock.json`, and `render.yaml`. Do not commit account databases, `.env`, or temporary files.
2. In Render, create a **Blueprint** from that repository. Render reads `render.yaml`.
3. Review the paid Starter service and persistent disk configuration before creating it. The disk is required to retain SQLite accounts across deploys. The supplied Blueprint mounts 1 GB at `/var/data` and writes the database to `/var/data/slime-slayer/accounts.sqlite`.
4. Deploy. The build installs the dependency-free production package and checks JavaScript syntax. `npm start` runs the server. Render supplies `PORT`; the server binds to `0.0.0.0`.
5. Open the assigned HTTPS URL and verify `/api/health` returns `{"ok":true,"rooms":0}` before starting a run. Create a test account, finish or leave a run, sign out and sign in again, then test a private party with a second browser or device.
6. Add your custom domain in Render if desired. Keep the browser app and API on the same origin. Invite links use the current website origin automatically.

The Blueprint pins Node 24.22.1 and sets `NODE_ENV=production`, `TRUST_PROXY=true`, and `SLIME_DB_PATH`. In production session cookies are Secure, HttpOnly, and SameSite=Strict. Authentication rate limits use the nearest forwarded client address only when `TRUST_PROXY=true`; leave it false for a direct local server. Set no API keys: the deployed game does not use the image API.

## Persistence and restarts

Use **one instance**. Rooms and active combat remain in process memory; SQLite holds accounts, sessions, scores, XP, and achievements. Deploying or restarting ends active rooms. Graceful SIGTERM checkpoints account progress and closes SQLite after requests drain, but active runs cannot resume after a restart. Do not enable multiple replicas or use an ephemeral disk for account data.

Render disks require a paid service, are available at runtime rather than build time, and prevent zero-downtime deploys. See [Render persistent disks](https://render.com/docs/disks) and [Blueprint configuration](https://render.com/docs/blueprint-spec).

## Backups and existing local accounts

Create a consistent SQLite snapshot, including committed WAL data, with:

```sh
node tools/backup-accounts.js ./backups/accounts-backup.sqlite
```

The tool reads `SLIME_DB_PATH`, or uses `data/accounts.sqlite` locally. It refuses to overwrite existing backups. Copy the backup off the server and protect it: it contains usernames, password hashes, session records, and progression.

To migrate existing local accounts, make this snapshot locally. Stop the Render service before restoring it to `/var/data/slime-slayer/accounts.sqlite`; do not replace an open SQLite database, and do not combine an old database file with newer `-wal` or `-shm` files. Start the service afterward and verify sign-in. A fresh Render deployment otherwise starts with an empty account database.

## Checks

- `npm run check`: syntax checks, no database writes.
- `npm test`: isolated progression, account and gameplay checks, using a temporary database.
- `node tools/verify-deployment.js`: isolated HTTP checks with production settings and a temporary nested database directory.
- `npm run test:browser`: desktop and mobile browser checks. For this optional check, install Playwright locally with `npm install --no-save playwright`, then `npx playwright install chromium`. On Windows the test uses installed Edge; elsewhere it uses Chromium. `BROWSER_EXECUTABLE` can override the browser path, and `PLAYWRIGHT_MODULE` can supply a separately installed package.

No test accounts are created in the production database. Test ports 3001 and 3002 must be free.

## Current limits

There is no password-recovery or email-verification flow. Username filtering is conservative and finite. This preparation does not publish the game or create a Render service. Monitor Render logs and health checks after deployment, and back up account data before updates.
