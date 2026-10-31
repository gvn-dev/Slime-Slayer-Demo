const fs=require('fs'),zlib=require('zlib'),path=require('path');
const utility=fs.readFileSync(path.join(__dirname,'draw-slime-powerup-sprites.js'),'utf8');
// Reuse the project's PNG writer; decode PNG filters to retain the character's original silhouette.
const vm=require('vm');let source=utility.slice(0,utility.indexOf('const bodies ='));source+='\nglobalThis.writeAsset=writePng;';const context={require,__dirname,Buffer,console};vm.runInNewContext(source,context);
for(const hero of ['Ravela','Fjord','Aram','Gavrilta']){
 const png=fs.readFileSync(path.join(__dirname,'..','Art',(hero==='Gavrilta'?'Gavrilla':hero)+' character art.png'));let at=8,w,h,channels,parts=[];
 while(at<png.length){const size=png.readUInt32BE(at),type=png.toString('ascii',at+4,at+8),data=png.subarray(at+8,at+8+size);if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);if(data[8]!==8||![2,6].includes(data[9]))throw Error('Unsupported source PNG');channels=data[9]===6?4:3;}if(type==='IDAT')parts.push(data);at+=12+size;}
 const raw=zlib.inflateSync(Buffer.concat(parts)),stride=w*channels,decoded=Buffer.alloc(h*stride),rgba=Buffer.alloc(w*h*4);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=channels?decoded[y*stride+x-channels]:0,b=y?decoded[(y-1)*stride+x]:0,c=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;decoded[y*stride+x]=(raw[y*(stride+1)+x+1]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}}
 for(let i=0;i<w*h;i++){const l=(decoded[i*channels]*.3+decoded[i*channels+1]*.59+decoded[i*channels+2]*.11)/255;rgba[i*4]=Math.round(65+190*l);rgba[i*4+1]=Math.round(40+186*l);rgba[i*4+2]=Math.round(15+120*l);rgba[i*4+3]=channels===4?decoded[i*channels+3]:255;}
 context.writeAsset(hero+' golden achievement.png',{width:w,height:h,data:rgba});
}
