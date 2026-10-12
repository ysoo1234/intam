import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const m=JSON.parse(await fs.readFile(path.join(root,'generation-prompts.json'),'utf8'));
await fs.copyFile(m.selectedSource,path.join(root,'generated-source.png'));
await fs.copyFile(m.alternateSource,path.join(root,'generated-alternate.png'));
const {data,info}=await sharp(m.selectedSource).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let cleared=0;
for(let i=0;i<data.length;i+=4)if(data[i+3]<=8){if(data[i+3])cleared++;data[i]=data[i+1]=data[i+2]=data[i+3]=0;}
const native=await sharp(data,{raw:info}).png().toBuffer();
await fs.writeFile(path.join(root,'game-panel-clean-native.png'),native);
const output=path.join(root,'game-panel-clean-3840.png');
await sharp(native).resize({width:3840,kernel:'lanczos3'}).png().toFile(output);
const meta=await sharp(output).metadata();
await fs.writeFile(path.join(root,'export-details.json'),JSON.stringify({nativeWidth:info.width,nativeHeight:info.height,exportWidth:meta.width,exportHeight:meta.height,upscaled:true,alphaNoiseRemoved:cleared,alphaNoiseThreshold:8},null,2));
console.log(JSON.stringify({file:output,width:meta.width,height:meta.height,nativeWidth:info.width,nativeHeight:info.height,alphaNoiseRemoved:cleared}));

