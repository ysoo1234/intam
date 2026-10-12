import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const refs=JSON.parse(await fs.readFile(path.join(dir,'references.json'),'utf8'));
const layers=[];
for(let i=0;i<refs.length;i++){
 const input=await sharp(refs[i]).resize(280,280,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 layers.push({input,left:(i%3)*320+20,top:Math.floor(i/3)*320+20});
}
await sharp({create:{width:960,height:960,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(path.join(dir,'reference-contact-sheet.png'));

