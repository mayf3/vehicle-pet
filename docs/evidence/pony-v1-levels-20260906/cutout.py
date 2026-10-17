import sys,json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src,dst=map(Path,sys.argv[1:3])
original=Image.open(src)
if original.mode=='RGBA' and original.getchannel('A').getextrema()[0]==0:
 dst.parent.mkdir(parents=True,exist_ok=True); original.save(dst); original.save(dst.with_suffix('.webp'),lossless=True)
 print(json.dumps({'file':str(dst),'method':'native alpha preserved'}));sys.exit(0)
im=original.convert('RGB'); a=np.asarray(im)
# Only neutral light pixels connected to the canvas boundary are background.
# Closed white body panels remain inside the vehicle's dark contour.
neutral=(a.max(2).astype(int)-a.min(2).astype(int)<42)&(a.min(2)>170)
labels,_=ndi.label(neutral)
border=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]))
bg=np.isin(labels,border[border!=0]); fg=~bg
parts,n=ndi.label(fg); sizes=np.bincount(parts.ravel()); sizes[0]=0
fg=np.isin(parts,np.where(sizes>300)[0])
fg=ndi.binary_fill_holes(fg)
rgba=np.dstack([a,fg.astype(np.uint8)*255]); rgba[~fg,:3]=0
out=Image.fromarray(rgba,'RGBA'); dst.parent.mkdir(parents=True,exist_ok=True);out.save(dst)
out.save(dst.with_suffix('.webp'),lossless=True)
print(json.dumps({'file':str(dst),'size':out.size,'transparent_fraction':float((~fg).mean()),'alpha_extrema':out.getchannel('A').getextrema(),'method':'boundary-connected neutral background extraction, enclosed body retained'}))
