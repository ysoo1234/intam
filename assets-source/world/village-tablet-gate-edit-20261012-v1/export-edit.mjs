import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(await fs.readFile(path.join(dir,'generation-prompts.json'),'utf8'));
await fs.copyFile(m.source,path.join(dir,'generated-source.png'));
const {data,info}=await sharp(m.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const w=info.width,h=info.height;
const seen=new Uint8Array(w*h), queue=[600*w+900];let head=0,count=0;
while(head<queue.length){
 const p=queue[head++];if(seen[p])continue;seen[p]=1;
 const x=p%w,y=Math.floor(p/w);if(x<670||x>1130||y<230||y>1100)continue;
 const k=p*4,r=data[k],g=data[k+1],b=data[k+2];
 if(!(Math.max(r,g,b)-Math.min(r,g,b)<32&&Math.min(r,g,b)>65))continue;
 data[k]=data[k+1]=data[k+2]=data[k+3]=255;count++;
 if(x)queue.push(p-1);if(x<w-1)queue.push(p+1);if(y)queue.push(p-w);if(y<h-1)queue.push(p+w);
}
for(let y=295;y<345;y++)for(let x=865;x<925;x++){const k=(y*w+x)*4;if(data[k+2]>data[k]+10&&data[k]<90&&data[k+1]<110){data[k]=20;data[k+1]=40;data[k+2]=80;data[k+3]=255;}}
for(let k=0;k<data.length;k+=4)if(data[k+3]<=8){data[k]=data[k+1]=data[k+2]=data[k+3]=0;}
const high=await sharp(data,{raw:info}).png().toBuffer();
await fs.writeFile(path.join(dir,'village-tablet-gate-edited-highres.png'),high);
await sharp(high).resize(640,608,{fit:'fill'}).png().toFile(path.join(dir,'village-tablet-gate-edited.png'));
await fs.writeFile(path.join(dir,'export-details.json'),JSON.stringify({width:640,height:608,screenWhitePixels:count,sourceWidth:w,sourceHeight:h},null,2));
console.log(JSON.stringify({width:640,height:608,screenWhitePixels:count}));

