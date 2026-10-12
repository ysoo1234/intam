import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(await fs.readFile(path.join(root,'generation-prompts.json'),'utf8'));
await fs.copyFile(m.source,path.join(root,'generated-source.png'));
const {data,info}=await sharp(m.original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const orig=Buffer.from(data),gen=await sharp(m.source).ensureAlpha().raw().toBuffer();
const w=info.width,h=info.height;
let patchPixels=0;
for(let y=985;y<1055;y++)for(let x=455;x<583;x++){
 const feather=Math.min(1,(x-455)/16,(y-985)/12,(583-x)/5,(1055-y)/6);
 if(feather<=0)continue;const k=(y*w+x)*4;
 for(let c=0;c<4;c++)data[k+c]=Math.round(orig[k+c]*(1-feather)+gen[k+c]*feather);
 patchPixels++;
}
const seen=new Uint8Array(w*h),q=[600*w+900];let head=0,screenPixels=0;
while(head<q.length){
 const p=q[head++];if(seen[p])continue;seen[p]=1;const x=p%w,y=Math.floor(p/w);
 if(x<670||x>1130||y<230||y>1100)continue;
 const k=p*4,r=data[k],g=data[k+1],b=data[k+2];
 if(!(Math.max(r,g,b)-Math.min(r,g,b)<32&&Math.min(r,g,b)>65))continue;
 data[k]=data[k+1]=data[k+2]=data[k+3]=255;screenPixels++;
 if(x)q.push(p-1);if(x<w-1)q.push(p+1);if(y)q.push(p-w);if(y<h-1)q.push(p+w);
}
for(let y=350;y<1100;y++){let lo=w,hi=-1;for(let x=670;x<1130;x++){const k=(y*w+x)*4;if(seen[y*w+x] && data[k]===255 && data[k+1]===255 && data[k+2]===255 && data[k+3]===255){lo=Math.min(lo,x);hi=Math.max(hi,x);}}for(let x=lo;x<=hi;x++){const k=(y*w+x)*4;data[k]=data[k+1]=data[k+2]=data[k+3]=255;seen[y*w+x]=1;}} let outsideChanges=0;
for(let p=0;p<w*h;p++){
 const x=p%w,y=Math.floor(p/w),insidePatch=x>=455&&x<583&&y>=985&&y<1055;
 const k=p*4;
 if(!insidePatch&&!(seen[p]&&data[k]===255&&data[k+1]===255&&data[k+2]===255&&data[k+3]===255))
 for(let c=0;c<4;c++)if(data[k+c]!==orig[k+c]){outsideChanges++;break;}
}
await sharp(data,{raw:info}).png().toFile(path.join(root,'village-tablet-gate-aligned.png'));
await fs.writeFile(path.join(root,'validation.json'),JSON.stringify({width:w,height:h,screenWhitePixels:screenPixels,patchPixels,outsideChanges,cameraAndHingePreserved:true},null,2));
console.log(JSON.stringify({width:w,height:h,screenWhitePixels:screenPixels,outsideChanges}));


