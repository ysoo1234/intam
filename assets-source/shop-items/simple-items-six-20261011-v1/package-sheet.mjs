import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await fs.readFile(path.join(root,'generation-prompts.json'),'utf8'));
await fs.copyFile(manifest.source,path.join(root,'generated-source.png'));
await fs.copyFile(manifest.draft,path.join(root,'generated-draft.png'));
const {data,info}=await sharp(manifest.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const layers=[],cells=[];
for(let i=0;i<6;i++) {
 const col=i%3,row=Math.floor(i/3);
 const x0=Math.round(col*info.width/3),x1=Math.round((col+1)*info.width/3);
 const y0=Math.round(row*info.height/2),y1=Math.round((row+1)*info.height/2);
 let left=x1,right=x0,top=y1,bottom=y0;
 for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) if(data[(y*info.width+x)*4+3]>16) {
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(right<left||bottom<top) throw new Error('Missing icon '+(i+1));
 const width=right-left+1,height=bottom-top+1;
 const scale=375/Math.max(width,height),w=Math.round(width*scale),h=Math.round(height*scale);
 const input=await sharp(manifest.source).extract({left,top,width,height}).resize(w,h).png().toBuffer();
 layers.push({input,left:col*500+Math.round((500-w)/2),top:row*500+Math.round((500-h)/2)});
 cells.push({item:i+1,column:col+1,row:row+1,width:w,height:h});
}
const final=path.join(root,'simple-items-six-sheet.png');
await sharp({create:{width:1500,height:1000,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(final);
const out=await sharp(final).ensureAlpha().raw().toBuffer({resolveWithObject:true});

await fs.writeFile(path.join(root,'validation.json'),JSON.stringify({width:1500,height:1000,grid:'3x2',cellSize:500,iconMaxSize:375,emptyCells:[],alpha:true,cells},null,2));
console.log(JSON.stringify({file:final,width:out.info.width,height:out.info.height,icons:6,cellSize:500,iconMaxSize:375,emptyCells:[]}));

