import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await fs.readFile(path.join(dir,'generation-prompt.json'),'utf8'));
await fs.copyFile(manifest.source,path.join(dir,'generated-source.png'));
const meta=await sharp(manifest.source).metadata();
const layers=[];
for(let i=0;i<4;i++){
 const left=Math.round(i*meta.width/4),right=Math.round((i+1)*meta.width/4);
 const width=right-left;
 const w=Math.round(width*512/meta.height);
 const input=await sharp(manifest.source).extract({left,top:0,width,height:meta.height}).resize(w,512).png().toBuffer();
 layers.push({input,left:i*512+Math.round((512-w)/2),top:0});
}
const output=path.join(dir,'stamp-midi-high-angle-sheet.png');
await sharp({create:{width:2048,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(output);
await fs.writeFile(path.join(dir,'validation.json'),JSON.stringify({width:2048,height:512,cells:4,cellSize:512,uniformScale:512/meta.height,alpha:true},null,2));
console.log(output);

