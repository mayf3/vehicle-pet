from pathlib import Path
import json,hashlib
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
p=Path(__file__).parent
records=[]
sheet=Image.new('RGBA',(1600,1320),(0,0,0,0))
for n in range(1,13):
 f=p/f'l{n}.png'; im=Image.open(f).convert('RGBA'); arr=np.array(im)
 labels,_=ndi.label(arr[:,:,3]>16); sizes=np.bincount(labels.ravel());sizes[0]=0
 keep=np.isin(labels,np.where(sizes>30)[0]);arr[~keep]=0
 im=Image.fromarray(arr); im=im.crop(im.getbbox());im.thumbnail((944,944),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(1024,1024),(0,0,0,0));out.alpha_composite(im,((1024-im.width)//2,(1024-im.height)//2));out.save(f);out.save(f.with_suffix('.webp'),lossless=True)
 small=out.resize((480,480),Image.Resampling.LANCZOS);(p/'sprites480').mkdir(exist_ok=True);small.save(p/'sprites480'/f'l{n}.png');small.save(p/'sprites480'/f'l{n}.webp',lossless=True)
 a=np.array(out.getchannel('A'));assert a[0].max()==a[-1].max()==a[:,0].max()==a[:,-1].max()==0
 records.append({'level':n,'file':f.name,'mode':out.mode,'size':out.size,'alpha_extrema':out.getchannel('A').getextrema(),'transparent_fraction':float((a==0).mean()),'all_canvas_borders_transparent':True,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
 thumb=out.resize((380,380),Image.Resampling.LANCZOS);x=((n-1)%4)*400;y=((n-1)//4)*440;sheet.alpha_composite(thumb,(x+10,y+30));ImageDraw.Draw(sheet).text((x+18,y+8),f'L{n}',fill='#357dab',stroke_width=0,font_size=22)
sheet.save(p/'overview.png')
for bg,name in [('#142437','review-dark.jpg'),('#f6f9fc','review-light.jpg')]:
 flat=Image.new('RGB',sheet.size,bg);flat.paste(sheet,mask=sheet.getchannel('A'));flat.save(p/name,quality=92)
(p/'quality.json').write_text(json.dumps(records,indent=2))
print(json.dumps({'count':len(records),'all_alpha_verified':True}))
