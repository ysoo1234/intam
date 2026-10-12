import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(await fs.readFile(path.join(dir,'generation-prompt.json'),'utf8'));
await fs.copyFile(m.source,path.join(dir,'generated-source.png'));
const {data:original,info}=await sharp(m.original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {data:edited,info:ei}=await sharp(m.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(ei.width!==info.width||ei.height!==info.height)throw Error('Registration mismatch');
const out=Buffer.from(original),mask=new Uint8Array(info.width*info.height);
for(let x=150;x<583;x++){
 let edge=-1;for(let y=880;y<1070;y++)if(original[(y*info.width+x)*4+3]>128)edge=y;
 if(edge<0)continue;
 for(let y=edge-45;y<=edge+12;y++){
  const p=y*info.width+x,k=p*4;
  const t=Math.min(1,(y-(edge-45))/14,(x-150)/18);
  if(t<=0)continue;
  mask[p]=1;
  const a0=original[k+3]/255,a1=edited[k+3]/255,a=a0*(1-t)+a1*t;
  for(let c=0;c<3;c++)out[k+c]=a?Math.round((original[k+c]*a0*(1-t)+edited[k+c]*a1*t)/a):0;
  out[k+3]=Math.round(a*255);
 }
}
let outsideDifferences=0,changedPixels=0,rightPanelDifferences=0;
for(let p=0;p<mask.length;p++){
 const k=p*4;let differs=false;for(let c=0;c<4;c++)if(out[k+c]!==original[k+c])differs=true;
 if(differs){changedPixels++;if(!mask[p])outsideDifferences++;if(p%info.width>=583)rightPanelDifferences++;}
}
const output=path.join(dir,'village-tablet-left-bottom-raised.png');
await sharp(out,{raw:info}).png().toFile(output);
await fs.writeFile(path.join(dir,'validation.json'),JSON.stringify({width:info.width,height:info.height,changedPixels,outsideDifferences,rightPanelAndHingeDifferences:rightPanelDifferences,editRegion:'Left cover lower silhouette strip only, x=150..582'},null,2));
console.log(JSON.stringify({output,width:info.width,height:info.height,changedPixels,outsideDifferences,rightPanelDifferences}));

