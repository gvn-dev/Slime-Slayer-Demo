const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
process.env.SLIME_DB_PATH=path.resolve('tmp/verification.sqlite');
const accounts=require('../accounts');
function req(cookie='',body={}){return {headers:{cookie,host:'localhost'},socket:{remoteAddress:'test'},method:'POST',body};}
async function call(endpoint,body={},cookie='',method='POST'){const r=req(cookie,body);r.method=method;let result;const res={headers:{},setHeader(k,v){this.headers[k]=v;}};await accounts.route(r,res,new URL(endpoint,'http://localhost'),async()=>body,(res,status,payload)=>{result={status,...payload,cookie:res.headers['Set-Cookie']?.split(';')[0]};});return result;}
(async()=>{
 const created=await call('/api/account/register',{username:'VerifyHero',password:'test-only-password',confirm:'test-only-password'});assert.equal(created.status,200);assert.equal(created.account.characters[0].level,1);
 assert.equal((await call('/api/account/register',{username:'verifyhero',password:'test-only-password',confirm:'test-only-password'})).status,409);
 assert.equal((await call('/api/account/login',{username:'VerifyHero',password:'bad-password'})).status,401);
 for(const username of ['f_u_c_k','N4Z1','shiiit','normalHero'])assert.equal(accounts.allowedName(username),username==='normalHero');
 const login=await call('/api/account/login',{username:'VERIFYHERO',password:'test-only-password'});assert.equal(login.status,200);const account=accounts.auth(req(login.cookie));assert.ok(account);
 const p={accountId:account.id,hero:'Aram',score:12000};const room={players:[p],game:{runId:'verify-run',completedWaves:10,waveBonus:200,endless:false}};accounts.saveRun(room,p);accounts.saveRun(room,p);
 let profile=(await call('/api/account',{},login.cookie,'GET')).account;assert.equal(profile.characters.find(c=>c.hero==='Aram').xp,12200);assert.equal(profile.characters.find(c=>c.hero==='Aram').achievement,true);
 p.score=16000;room.game.endless=true;accounts.saveRun(room,p);profile=(await call('/api/account',{},login.cookie,'GET')).account;assert.equal(profile.characters.find(c=>c.hero==='Aram').xp,16200);assert.equal(profile.highscore,16200);
 assert.equal((await call('/api/leaderboard',{},'','GET')).rows[0].username,'VerifyHero');
 await call('/api/account/tutorial',{},login.cookie);assert.equal((await call('/api/account',{},login.cookie,'GET')).account.tutorialSeen,true);
 let shutdownClosed=false;const accountProxy={...accounts,close:()=>{shutdownClosed=true;}};
 const source=fs.readFileSync('server.js','utf8');const context={require:n=>n==='./accounts'?accountProxy:require(n),__dirname:path.resolve('.'),process:{env:{},once:()=>{}},console,Buffer,setInterval:()=>0,clearInterval:()=>{},setTimeout,clearTimeout,URL};vm.createContext(context);vm.runInContext(source.slice(0,source.indexOf("server.listen(PORT"))+`;globalThis.gameApi={makePlayer,newGame,beginWave,updateGame,damageEnemy,useAbility,ENEMY,publicRoom,server,rooms,shutdown};`,context);const api=context.gameApi;
 const player=api.makePlayer('tester','Tester','Aram');const r={id:'test',mode:'solo',status:'playing',players:[player],hostId:player.id,game:api.newGame()};api.beginWave(r,20);r.game.endless=true;r.game.phase='wave';r.game.waveElapsed=2.1;r.game.spawnTimer=100;api.updateGame(r,0,Date.now());assert.equal(r.game.enemies.filter(e=>e.type==='king').length,2);
 r.game.enemies[0].x=player.x;r.game.enemies[0].y=player.y;player.abilityCooldown=0;const now=Date.now();api.useAbility(r,player);assert.ok(r.game.enemies[0].stunnedUntil-now<=625);
 api.damageEnemy(r,r.game.enemies[0],10,player.id,now,{canCrit:false});assert.ok(r.game.effects.some(e=>e.kind==='damage-number'&&e.text==='10'));
 api.rooms.set(r.id,r);
 const {Readable}=require('node:stream');
 const action=(action,value)=>new Promise(resolve=>{const request=Readable.from([JSON.stringify({playerId:player.id,action,value})]);request.method='POST';request.url='/api/rooms/test/action';request.headers={host:'localhost'};const response={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status){this.status=status;},end(body){resolve({status:this.status,...JSON.parse(body)});}};api.server.emit('request',request,response);});
 r.game.enemies=[];r.game.projectiles=[];r.game.wave=10;r.game.endless=false;r.game.waveElapsed=30;r.game.bossSpawned=true;r.game.spawnTimer=100;r.game.phase='wave';api.updateGame(r,0,Date.now());assert.equal(r.game.phase,'won');assert.equal(r.game.completedWaves,10);
 assert.equal((await action('endless')).status,200);assert.equal(r.game.endless,true);assert.equal(r.game.phase,'upgrade');r.players[0].upgradePicked=true;api.updateGame(r,0,Date.now());assert.equal(r.game.wave,11);assert.equal(r.game.phase,'intro');
 r.status='finished';r.game.phase='lost';assert.equal((await action('replay')).status,200);assert.equal(r.game.wave,1);assert.equal(r.game.endless,false);assert.equal(r.players[0].score,0);
 await call('/api/account/logout',{},login.cookie);assert.equal(accounts.auth(req(login.cookie)),null);
 r.players[0].accountId=account.id;r.players[0].score=2345;
 api.server.close=callback=>callback();api.server.closeIdleConnections=()=>{};api.shutdown('verification');assert.equal(shutdownClosed,true);
 const check=new (require('node:sqlite').DatabaseSync)(process.env.SLIME_DB_PATH,{readOnly:true});assert.equal(check.prepare('SELECT score FROM runs WHERE run=? AND account=?').get(r.game.runId,account.id).score,2345);check.close();
 console.log('PASS: graceful-shutdown checkpoint; victory → endless → wave 11, replay resets run, logout revokes sessions; account creation, uniqueness, login, profanity, sessions, XP deduplication, achievements, high scores, tutorial persistence, two kings at wave 20, halved boss stun, damage numbers.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{accounts.close();for(const file of ['tmp/verification.sqlite','tmp/verification.sqlite-wal','tmp/verification.sqlite-shm'])if(fs.existsSync(file))fs.unlinkSync(file);});
