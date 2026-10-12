from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
U='/root/.claude/uploads/b840985a-aba1-59f7-9753-aceca97f732d/'
sheets=[('a1dd8421-image.png',['ai-speaker','ai-wheelchair','autonomous-car','call-translator','crop-drone','delivery-robot','drone-taxi','face-lock','greenhouse-computer']),
 ('c46aa9e9-image.png',['harvest-robot','medical-reader','nutrition-kiosk','performance-interpreter','pet-care-robot','photo-translator','plant-camera','road-safety-cctv','robot-vacuum']),
 ('6daa86dd-image.png',['security-camera','smart-air-purifier','smart-band','smart-fridge','smart-watering','smart-washer','spell-checker','study-helper'])]
S=256;W=S*2
def strip_arrows(alpha):
  on=alpha>0.35
  l,k=ndimage.label(ndimage.binary_dilation(on,iterations=2))
  keep=np.ones_like(alpha)
  for j,o in enumerate(ndimage.find_objects(l)):
    h=o[0].stop-o[0].start; w=o[1].stop-o[1].start
    if max(h,w)/max(1,min(h,w))>5 and min(h,w)<30: keep[l==j+1]=0
  return alpha*keep
def card(li):
  cv=Image.new('RGBA',(W,W),(30,104,140,255)); d=ImageDraw.Draw(cv)
  for k in range(16,W,32):
    d.line((k,0,k,W),fill=(52,124,158,255),width=2); d.line((0,k,W,k),fill=(52,124,158,255),width=2)
  m,L=30,38
  for (x,y,dx,dy) in [(m,m,1,1),(W-m,m,-1,1),(m,W-m,1,-1),(W-m,W-m,-1,-1)]:
    d.line((x,y,x+dx*L,y),fill=(170,215,235,255),width=5); d.line((x,y,x,y+dy*L),fill=(170,215,235,255),width=5)
  mask=Image.new('L',(W,W),0); ImageDraw.Draw(mask).rounded_rectangle((0,0,W-1,W-1),radius=52,fill=255); cv.putalpha(mask)
  s=W*0.70/max(li.size); l2=li.resize((round(li.width*s),round(li.height*s)),Image.LANCZOS)
  cv.alpha_composite(l2,((W-l2.width)//2,(W-l2.height)//2)); return cv.resize((S,S),Image.LANCZOS)
cards={}
for f,names in sheets:
  a=np.asarray(Image.open(U+f).convert('RGBA')).astype(float)
  blue=(a[...,3]>200)&(a[...,2]>90)&(a[...,0]<120)
  lab,n=ndimage.label(ndimage.binary_opening(blue,iterations=3))
  objs=[o for o in ndimage.find_objects(lab) if (o[0].stop-o[0].start)>250 and (o[1].stop-o[1].start)>250]
  objs=sorted(objs,key=lambda o:(round(o[0].start/200),o[1].start))
  assert len(objs)==len(names),(f,len(objs))
  for nm,o in zip(names,objs):
    y0,y1,x0,x1=o[0].start,o[0].stop,o[1].start,o[1].stop
    c=a[y0+14:y1-14,x0+14:x1-14]; m=c[...,:3].min(-1)
    al=np.clip((m-110)/90,0,1)
    if f.startswith('a1dd'): al=strip_arrows(al)
    ys,xs=np.where(al>0.5)
    li=np.zeros(c.shape[:2]+(4,),np.uint8); li[...,:3]=255; li[...,3]=(al*255).astype(np.uint8)
    li=Image.fromarray(li).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    cards[nm]=card(li); cards[nm].save(f'out/{nm}.png')
names=[n for _,ns in sheets for n in ns]
sh=Image.new('RGBA',(7*(S+8)+8,4*(S+8)+8),(244,236,220,255))
for i,n in enumerate(names): sh.alpha_composite(cards[n],(8+(i%7)*(S+8),8+(i//7)*(S+8)))
sh.convert('RGB').resize((sh.width//2,sh.height//2)).save('all.png')
print(len(names))
