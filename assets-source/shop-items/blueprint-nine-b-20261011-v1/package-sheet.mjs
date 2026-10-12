import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(await fs.readFile(path.join(dir,'generation-prompt.json'),'utf8'));
await fs.copyFile(m.source,path.join(dir,'generated-source.png'));
const {data,info}=await sharp(m.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const layers=[];
for(let i=0;i<9;i++){
 const col=i%3,row=Math.floor(i/3);
 const x0=Math.round(col*info.width/3),x1=Math.round((col+1)*info.width/3);
 const y0=Math.round(row*info.height/3),y1=Math.round((row+1)*info.height/3);
 let left=x1,right=x0,top=y1,bottom=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const input=await sharp(m.source).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(500,500,{fit:'fill'}).png().toBuffer();
 layers.push({input,left:50+col*550,top:50+row*550});
}
const out=path.join(dir,'blueprint-nine-sheet.png');
await sharp({create:{width:1700,height:1700,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(out);
console.log(JSON.stringify({file:out,width:1700,height:1700,cards:9,cardSize:500,gutter:50}));

