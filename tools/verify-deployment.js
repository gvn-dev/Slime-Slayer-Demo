const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
fs.mkdirSync(path.resolve('tmp'),{recursive:true});
const directory = fs.mkdtempSync(path.resolve('tmp') + path.sep + 'deploy-check-');
const database = path.join(directory, 'nested', 'accounts.sqlite');
let child;
async function start() {
  child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: '3002', NODE_ENV: 'production', TRUST_PROXY: 'true', SLIME_DB_PATH: database }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(Error('Startup timeout')), 10000);child.once('error',reject);child.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exited: '+code));});child.stdout.on('data', data => { if (String(data).includes('listening')) { clearTimeout(timeout); resolve(); } }); });
}
async function stop() { if (!child || child.exitCode !== null) return; const exited = new Promise(resolve => child.once('exit', resolve));child.kill('SIGTERM');await exited; }
const request = (route, options) => fetch('http://localhost:3002' + route, options);
const post = (route, body, headers = {}) => request(route, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
(async () => {
  await start();
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/', { method: 'HEAD' })).status, 200);
  assert.equal((await request('/api/health', { method: 'HEAD' })).status, 200);
  const created = await post('/api/account/register', { username: 'DeployCheck', password: 'verification-only-password', confirm: 'verification-only-password' });
  assert.equal(created.status, 200);
  const cookie = created.headers.get('set-cookie');assert.match(cookie, /Secure/);assert.match(cookie, /HttpOnly/);assert.match(cookie, /SameSite=Strict/);
  assert.equal((await post('/api/rooms', {}, { origin: 'https://untrusted.invalid' })).status, 403);
  const bad = await request('/api/rooms', { method: 'POST', headers: {'content-type':'application/json'},body:'{' });assert.equal(bad.status, 400);
  for(const asset of ['/app.js','/style.css','/art/Slime%20Slayer%20title%20art.png','/art/Roman%20coliseum%20arena.png','/audio/hills-of-the-colosseum.wav']){const response=await request(asset);assert.equal(response.status,200,asset);assert.equal(response.headers.get('x-content-type-options'),'nosniff');await response.arrayBuffer();}
  assert.equal((await request('/accounts.js')).status,404);assert.equal((await request('/data/accounts.sqlite')).status,404);
  const backupFile=path.join(directory,'backup.sqlite');
  await new Promise((resolve,reject)=>{const command=spawn(process.execPath,['tools/backup-accounts.js',backupFile],{env:{...process.env,SLIME_DB_PATH:database},stdio:'pipe'});command.once('error',reject);command.once('exit',code=>code===0?resolve():reject(Error('Backup failed')));});
  const snapshot=new DatabaseSync(backupFile,{readOnly:true});assert.equal(snapshot.prepare('SELECT username FROM accounts').get().username,'DeployCheck');snapshot.close();
  await stop();await start();
  const login=await post('/api/account/login',{username:'DeployCheck',password:'verification-only-password'});assert.equal(login.status,200);
  console.log('PASS: production startup, nested DB directory, HTTPS cookies, origin rejection, malformed JSON, HEAD/health, art/audio delivery, private-file isolation, SQLite backup, account persistence after restart.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await stop();const resolved=path.resolve(directory);if(!resolved.startsWith(path.resolve('tmp')+path.sep))throw Error('Unsafe cleanup path');fs.rmSync(resolved,{recursive:true,force:true});});
