const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const root = __dirname;
const generated = 'C:/Users/dkssu/.codex/generated_images/01a128f0-80bc-7800-be7c-ed31e599be34';
const variants = [
 ['01-faithful','exec-b814c90d-1de1-4321-9316-850f96c81097.png'],
 ['02-clean','exec-c34de430-da9f-4c12-985d-2559e10eba9a.png'],
 ['03-minimal','exec-6f7f778e-afe5-4f71-a4fb-97cb02e61839.png']
];
async function main() {
 const layers=[], checks=[];
 for (let k=0;k<variants.length;k++) {
  const [key,file]=variants[k];
  const original=path.join(root,key+'-generated.png');
  fs.copyFileSync(path.join(generated,file),original);
  const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=0,bottom=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
   if(data[(y*info.width+x)*4+3]>16) {left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  }
  const width=right-left+1,height=bottom-top+1;
  const fitted=await sharp(original).extract({left,top,width,height}).resize(900,900,{fit:'inside'}).png().toBuffer();
  const meta=await sharp(fitted).metadata();
  const final=path.join(root,key+'.png');
  await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite([{input:fitted,left:Math.floor((1024-meta.width)/2),top:Math.floor((1024-meta.height)/2)}]).png().toFile(final);
  const sizes=[];
  for(const n of [16,32,48]) {
   const buf=await sharp(final).resize(n,n).png().toBuffer();
   fs.writeFileSync(path.join(root,key+'-'+n+'.png'),buf); sizes.push({n,buf});
  }
  const hdr=Buffer.alloc(6+16*sizes.length);hdr.writeUInt16LE(1,2);hdr.writeUInt16LE(sizes.length,4);
  let offset=hdr.length;
  sizes.forEach(({n,buf},i)=>{const p=6+16*i;hdr[p]=n;hdr[p+1]=n;hdr.writeUInt16LE(1,p+4);hdr.writeUInt16LE(32,p+6);hdr.writeUInt32LE(buf.length,p+8);hdr.writeUInt32LE(offset,p+12);offset+=buf.length;});
  fs.writeFileSync(path.join(root,key+'.ico'),Buffer.concat([hdr,...sizes.map(s=>s.buf)]));
  layers.push({input:await sharp(final).resize(300,300).toBuffer(),left:k*340+20,top:30});
  layers.push({input:sizes[0].buf,left:k*340+121,top:375});
  layers.push({input:sizes[1].buf,left:k*340+181,top:367});
  checks.push({key,originalSize:[info.width,info.height],contentBounds:{left,top,right,bottom},output:[1024,1024],alpha:info.channels===4});
 }
 const labels=Buffer.from(`<svg width="1020" height="440"><style>text{font-family:Arial,sans-serif;fill:#34495e;text-anchor:middle}</style>${variants.map(([key],i)=>`<text x="${i*340+170}" y="350" font-size="19">${key.replace('-',' · ')}</text><text x="${i*340+129}" y="421" font-size="12">16 px</text><text x="${i*340+197}" y="421" font-size="12">32 px</text>`).join('')}</svg>`);
 layers.push({input:labels,left:0,top:0});
 await sharp({create:{width:1020,height:440,channels:4,background:'#f3f6fa'}}).composite(layers).png().toFile(path.join(root,'midi-options-preview.png'));
 fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(checks,null,2));
 console.log(JSON.stringify(checks));
}
main().catch(e=>{console.error(e);process.exit(1)});
