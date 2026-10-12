import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'generation-prompts.json'), 'utf8'));
const originals = path.join(root, 'originals');
const output = path.join(root, 'png');
await fs.mkdir(originals, { recursive: true });
await fs.mkdir(output, { recursive: true });
const checks = [];
const thumbs = [];
function bounds(data, width, height, x0, x1) {
  let left=x1, top=height, right=x0, bottom=0;
  for(let y=0;y<height;y++) for(let x=x0;x<x1;x++) {
    if(data[(y*width+x)*4+3] > 16) {
      left=Math.min(left,x); right=Math.max(right,x);
      top=Math.min(top,y); bottom=Math.max(bottom,y);
    }
  }
  return {left, top, width:right-left+1, height:bottom-top+1};
}
for (const [i, item] of manifest.characters.entries()) {
  const original = path.join(originals, item.id+'.png');
  await fs.copyFile(item.sourcePath, original);
  const { data, info }=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const half=Math.floor(info.width/2);
  const boxes=[bounds(data,info.width,info.height,0,half),bounds(data,info.width,info.height,half,info.width)];
  const scale=Math.min(item.targetHeight/Math.max(...boxes.map(b=>b.height)),434/Math.max(...boxes.map(b=>b.width)));
  const layers=[];
  for (const [side,box] of boxes.entries()) {
    const width=Math.round(box.width*scale),height=Math.round(box.height*scale);
    const resized=await sharp(original).extract(box).resize(width,height).png().toBuffer();
    const pixels=await sharp(resized).ensureAlpha().raw().toBuffer();
    const tight=bounds(pixels,width,height,0,width);
    const input=await sharp(resized).extract(tight).png().toBuffer();
    layers.push({input,left:side*454+Math.round((454-tight.width)/2),top:680-tight.height});
  }
  const file=path.join(output,item.id+'.png');
  await sharp({create:{width:908,height:680,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(file);
  const final=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const finalBoxes=[bounds(final.data,908,680,0,454),bounds(final.data,908,680,454,908)];
  let clear=0;
  for(let p=3;p<final.data.length;p+=4) if(final.data[p]===0) clear++;
  if(final.info.width!==908 || final.info.height!==680 || !clear || finalBoxes.some(b=>b.top+b.height!==680)) throw new Error('Validation failed: '+item.id);
  checks.push({id:item.id,grade:item.grade,targetHeight:item.targetHeight,width:908,height:680,transparentPixels:clear,halves:finalBoxes});
  thumbs.push({input:await sharp(file).resize(454,340).png().toBuffer(),left:20+(i%4)*484+15,top:80+Math.floor(i/4)*394+8});
}
const W=1976,H=80+3*394+20;
let svg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f4f3ef"/><text x="35" y="38" font-family="Arial" font-size="27" fill="#23334a">Review students 13–24 · 12 characters / 24 expressions</text><text x="35" y="62" font-family="Arial" font-size="16" fill="#5b6470">Each pair: worried (left), happy (right) · Final PNG: 908 × 680 · Transparent background</text>`;
for(const [i,item] of manifest.characters.entries()) {
 const x=20+(i%4)*484,y=80+Math.floor(i/4)*394;
 svg+=`<rect x="${x}" y="${y}" width="474" height="384" rx="10" fill="#ffffff" stroke="#d9dcd9"/><text x="${x+237}" y="${y+372}" text-anchor="middle" font-family="Arial" font-size="18" fill="#23334a">${item.id} · Grade ${item.grade}</text>`;
}
svg+='</svg>';
await sharp(Buffer.from(svg)).composite(thumbs).png().toFile(path.join(root,'contact-sheet.png'));
await fs.writeFile(path.join(root,'validation.json'),JSON.stringify({count:checks.length,files:checks},null,2));
console.log(JSON.stringify({count:checks.length,dimensions:'908x680',alpha:'present in every file',baseline:679,output,contact:path.join(root,'contact-sheet.png')}));


