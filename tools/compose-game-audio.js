// Original procedural score: Hills of the Colosseum, 80 bars, 150 BPM, D minor.
// Circular note tails and reverberation make a continuous 128-second music loop.
const fs=require('fs'),path=require('path');const SR=24000,N=SR*128,TAU=Math.PI*2;
const left=new Float32Array(N),right=new Float32Array(N);let seed=0x5196;
function noise(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/2147483648-1;}
function note(start,duration,midi,amp,voice,pan=0){const f=440*2**((midi-69)/12),length=Math.ceil(duration*SR),offset=Math.round(start*SR);let low=0;
 for(let i=0;i<length;i++){const t=i/SR,p=i/length;let env,s;
 if(voice==='harp'){env=(1-Math.exp(-t*220))*Math.exp(-t*2.5)*Math.min(1,(duration-t)/.12);s=Math.sin(TAU*f*t)+.42*Math.sin(TAU*f*2*t)*Math.exp(-t*2)+.2*Math.sin(TAU*f*3*t)*Math.exp(-t*5)+.08*Math.sin(TAU*f*5*t)*Math.exp(-t*9);}
 else if(voice==='pluck'){env=(1-Math.exp(-t*110))*Math.exp(-t*3.3)*(1-p);s=Math.sin(TAU*f*t)+.3*Math.sin(TAU*f*2*t)*Math.exp(-t*5)+.16*Math.sin(TAU*f*3*t);}
 else if(voice==='drum'){env=(1-Math.exp(-t*250))*Math.exp(-t*7)*(1-p);s=Math.sin(TAU*(f*t+18*(1-Math.exp(-t*20))/20))*.8+noise()*.2*Math.exp(-t*14);}
 else if(voice==='fiddle'||voice==='shawm'){
   env=Math.min(1,t/.012)*Math.min(1,(duration-t)/.045)*(.88+.12*Math.sin(TAU*7*t));s=0;
   for(let h=1;h<=8;h++){const harmonic=voice==='shawm'?(h%2?1:.25):1;s+=Math.sin(TAU*f*h*t+.025*h*Math.sin(TAU*5.5*t))*harmonic/(h*1.5);}
 }
 else if(voice==='snare'){env=(1-Math.exp(-t*500))*Math.exp(-t*19);s=noise()*.75+Math.sin(TAU*165*t)*.25;}
 else if(voice==='shaker'){env=Math.sin(Math.PI*p)**2*Math.exp(-p*4);s=noise()*.6;}
 else{env=Math.min(1,t/(voice==='brass'?.15:.45))*Math.min(1,(duration-t)/.6);s=0;const harmonics=voice==='brass'?6:4;for(let h=1;h<=harmonics;h++)s+=Math.sin(TAU*f*h*t+.015*h*Math.sin(TAU*5*t))/(h*(voice==='brass'?1.2:2));if(voice==='strings')s+=.25*Math.sin(TAU*f*1.003*t);env*=.85+.15*Math.sin(Math.PI*p);}
 const sample=s*env*amp,index=(offset+i)%N;left[index]+=sample*Math.sqrt((1-pan)/2);right[index]+=sample*Math.sqrt((1+pan)/2);
 }}
const chords=[[38,50,53,57],[34,46,50,53],[41,48,53,57],[36,48,52,55],[38,50,53,57],[34,46,50,53],[43,50,53,58],[33,45,49,52]];
const progressions=[
 [0,0,6,7,0,1,6,7,0,4,1,7,6,1,7,7],
 [0,6,1,7,0,4,6,7,1,6,0,7,4,1,6,7],
 [0,1,6,6,4,1,7,7,0,6,1,7,6,4,7,7],
 [6,6,0,7,1,4,6,7,0,6,1,7,4,6,7,7],
 [0,0,6,7,1,6,4,7,0,1,6,7,4,6,7,7]
];
const themes=[
 [62,null,65,64,62,null,60,57,58,null,62,60,61,null,57,null],
 [69,72,74,null,72,69,67,65,67,null,69,72,70,67,64,null],
 [74,null,null,77,76,null,72,null,70,null,69,null,67,65,64,null],
 [62,65,67,69,70,69,67,null,65,64,62,60,61,64,69,null],
 [74,77,81,79,77,76,74,null,72,70,69,67,65,64,61,null]
];
const beat=.4,barLength=1.6;
for(let bar=0;bar<80;bar++){
 const section=Math.floor(bar/16),local=bar%16,time=bar*barLength,c=chords[progressions[section][local]],phrase=Math.floor(local/4);
 const intensity=[.60,.85,.48,.95,1.08][section]*(.87+.13*(local%4)/3);
 // Dark bowed bass and shifting upper suspensions create long dramatic phrases.
 note(time,2.25,c[0],.12,'strings',-.3);
 note(time+.05,2.1,c[1],.065,'strings',.35);
 if(local%2===0){note(time,3.4,c[2]+12,.065*intensity,'strings',-.5);note(time+.15,3.2,c[3],.055,'strings',.5);}
 if(local%8===6){note(time,.65,c[1]+1,.035,'strings',-.15);}
 // Change percussion density and accents by section, with space for the harp interlude.
 for(let b=0;b<4;b++){
   if(section!==2||b===0||b===3)note(time+b*beat,.52,b%2===0?26:33,(b===0?.3:.18)*intensity,'drum',b%2?.22:-.22);
   if(section!==0&&section!==2&&b%2===1)note(time+b*beat,.2,45,.11*intensity,'snare',.15);
   if((section===1||section>=3)&&((local+b)%3!==0))note(time+b*beat+.3,.22,36,.1*intensity,'drum',-.3);
   if(section>=3&&b%2===0)note(time+b*beat+.2,.12,74,.05,'shaker',.65);
 }
 // Harp shapes change direction, spacing, register and density over each phrase.
 const harpPattern=section===2?[0,2,1,3,2,1]:section===0?[0,1,3,2]:[0,2,1,3,1,2,3,2];
 for(let step=0;step<harpPattern.length;step++){
   if((bar+step)%11===0)continue;
   const idx=phrase%2?harpPattern[harpPattern.length-1-step]:harpPattern[step];
   const n=c[Math.min(idx,3)]+(section===2?24:12);
   note(time+step*barLength/harpPattern.length,1.65,n,section===2?.09:.055,'harp',step%2?.55:-.45);
 }
 if(section===1||section>=3){for(let step=0;step<8;step++){if((step+local)%7===0)continue;note(time+step*.2,.18,c[1+((step+phrase)%3)],.08*intensity,'fiddle',-.45);}}
 // Each section develops its own melody, with held notes and answering phrases.
 const melody=themes[section];
 for(let b=0;b<4;b++){
   const index=(local*4+b+phrase*2)%melody.length,m=melody[index];if(m===null)continue;
   if(section===0&&b%2===1)continue;
   const length=section===2?1.25:b===3?.7:.36;
   note(time+b*beat,length,m,section===2?.07:.075*intensity,section===2||section===0?'strings':'fiddle',.2);
 }
 if(section>=3&&local%4===0){note(time,1.1,c[1],.09*intensity,'brass',-.2);note(time+.1,.95,c[1]+7,.06*intensity,'brass',.2);}
 if(section===4&&local%8>=6)note(time+.4,.65,c[2]+12,.045,'shawm',.2);
 if(local%8===7&&section!==2){for(let roll=0;roll<6;roll++)note(time+1+roll*.1,.2,40+roll,.055+roll*.012,'snare',roll%2?.25:-.25);}
}
// Wrap each reverb tap into the loop, including tails from the last bar.
const dryL=left.slice(),dryR=right.slice();for(const [delay,gain] of [[.173,.13],[.337,.10],[.677,.07],[1.113,.04]]){const shift=Math.round(delay*SR);for(let i=0;i<N;i++){const j=(i+shift)%N;left[j]+=dryR[i]*gain;right[j]+=dryL[i]*gain;}}
function writeWav(filename,l,r,rate){let peak=0;for(let i=0;i<l.length;i++)peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));const gain=.86/Math.max(.01,peak),data=Buffer.alloc(44+l.length*4);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(2,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*4,28);data.writeUInt16LE(4,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(l.length*4,40);for(let i=0;i<l.length;i++){data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,l[i]*gain))*32767),44+i*4);data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,r[i]*gain))*32767),46+i*4);}fs.writeFileSync(path.join(__dirname,'..','public','audio',filename),data);console.log(filename, (l.length/rate).toFixed(2)+'s', 'peak',peak.toFixed(3));}
fs.mkdirSync(path.join(__dirname,'..','public','audio'),{recursive:true});writeWav('hills-of-the-colosseum.wav',left,right,SR);
const n=Math.round(SR*1.15),sl=new Float32Array(n),sr=new Float32Array(n);let filtered=0;for(let i=0;i<n;i++){const t=i/SR;filtered+=.12*(noise()-filtered);let s=filtered*.5*Math.exp(-t*4);for(const [start,freq,decay] of [[.02,165,10],[.16,110,13],[.31,235,16],[.49,85,12],[.68,180,20]]){const age=t-start;if(age>0){s+=Math.sin(TAU*(freq*age-55*age*age))*.28*Math.exp(-age*decay)*(1-Math.exp(-age*200));s+=filtered*.8*Math.exp(-age*decay);}}s*=Math.min(1,t/.01)*Math.min(1,(1.15-t)/.08);sl[i]=s;sr[i]=s*.95;}if(!fs.existsSync(path.join(__dirname,'..','public','audio','slime-run-start.wav')))writeWav('slime-run-start.wav',sl,sr,SR);
