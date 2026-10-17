from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import numpy as np,json,hashlib,shutil
from scipy import ndimage as ndi
p=Path(__file__).parent;prev=p.parent/'pony-v1-levels-20260906'
font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
counts=['3 辆','10 辆','100 辆','1,000 辆','1 万辆','10 万辆','100 万辆']
for n in range(1,6):shutil.copy2(prev/f'l{n}.png',p/f'l{n}.png')
for n in range(6,13):
 im=Image.open(p/f'raw-l{n}.png').convert('RGBA');a=np.array(im)
 labels,_=ndi.label(a[:,:,3]>16);sizes=np.bincount(labels.ravel());sizes[0]=0;keep=np.isin(labels,np.where(sizes>30)[0]);a[~keep]=0
 im=Image.fromarray(a);im=im.crop(im.getbbox());im.thumbnail((920,710),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(1024,1024));out.alpha_composite(im,((1024-im.width)//2,285+(710-im.height)//2))
 d=ImageDraw.Draw(out);d.text((50,32),'1 人监管',font=ImageFont.truetype(font,42),fill='#168BE8',stroke_width=1,stroke_fill='#F4F9FD');d.text((48,86),counts[n-6],font=ImageFont.truetype(font,112),fill='#168BE8',stroke_width=2,stroke_fill='#F4F9FD')
 out.save(p/f'l{n}.png')
sheet=Image.new('RGBA',(1600,1320));records=[]
for n in range(1,13):
 im=Image.open(p/f'l{n}.png');im.save(p/f'l{n}.webp',lossless=True);(p/'sprites480').mkdir(exist_ok=True)
 sm=im.resize((480,480),Image.Resampling.LANCZOS);sm.save(p/'sprites480'/f'l{n}.png');sm.save(p/'sprites480'/f'l{n}.webp',lossless=True)
 a=np.array(im.getchannel('A'));records.append({'level':n,'alpha_extrema':im.getchannel('A').getextrema(),'transparent_fraction':float((a==0).mean()),'unchanged_from_previous':n<=5,'sha256':hashlib.sha256((p/f'l{n}.png').read_bytes()).hexdigest()})
 x=((n-1)%4)*400;y=((n-1)//4)*440;sheet.alpha_composite(im.resize((380,380),Image.Resampling.LANCZOS),(x+10,y+40));ImageDraw.Draw(sheet).text((x+14,y+8),f'L{n}',font=ImageFont.truetype(font,22),fill='#3289BD')
sheet.save(p/'overview.png');bg=Image.new('RGB',sheet.size,'#142437');bg.paste(sheet,mask=sheet.getchannel('A'));bg.save(p/'review-dark.jpg',quality=94)
(p/'quality.json').write_text(json.dumps(records,indent=2));print('12 levels built; L1-L5 copied unchanged')
