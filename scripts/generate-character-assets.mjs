import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const check = process.argv.includes('--check')
const source = await readFile('assets/character-source/companion-alpha.png')
const hash = b => createHash('sha256').update(b).digest('hex')
const outputs = {}
const emit = async (path, value) => {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value)
  if (check) { if (!(await readFile(path)).equals(bytes)) throw new Error(`Asset drift: ${path}`) }
  else await writeFile(path, bytes)
  outputs[path] = hash(bytes)
}
const meta = await sharp(source).metadata()
if (!meta.hasAlpha || meta.width !== 1536 || meta.height !== 1024) throw new Error('Unexpected source')
let imports = '', rows = ''
const rects=[[16,319],[340,597],[639,896],[916,1224],[1240,1534],[20,290],[326,632],[637,910],[938,1194],[1260,1526]]
const sourceAnchors=[[82,54,-14],[73,52,12],[77,51,-8],[72,45,-28],[70,51,25],[76,52,10],[80,48,-18],[73,50,8],[29,50,-18],[72,51,-22]]
const anchors=[], bounds=[]
for (let i=0;i<10;i++) {
  const col=i%5, row=Math.floor(i/5)
  const [left,right]=rects[i]
  const top=row===0?0:525, bottom=row===0?525:1024
  const scale=Math.min(320/(right-left),540/(bottom-top))
  const [ax,ay,angle]=sourceAnchors[i]
  const oldLeft=Math.round(col*1536/5), oldWidth=Math.round((col+1)*1536/5)-oldLeft
  const oldScale=Math.min(320/oldWidth,540/(bottom-top))
  const sourceX=oldLeft+(ax/100*320-(320-oldWidth*oldScale)/2)/oldScale
  const sourceY=(ay/100*540-(540-(bottom-top)*oldScale)/2)/oldScale
  anchors.push([((sourceX-left)*scale+(320-(right-left)*scale)/2)/320*100,(sourceY*scale+(540-(bottom-top)*scale)/2)/540*100,angle])
  const png=await sharp(source).extract({left,top,width:right-left,height:bottom-top}).resize(320,540,{fit:'contain',background:'#00000000'}).png().toBuffer()
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  let x0=info.width,y0=info.height,x1=0,y1=0
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>0) {
    x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1)
  }
  bounds.push([x0,y0,x1,y1])
  const stats=await sharp(png).stats()
  if(stats.channels[3].min!==0 || stats.channels[3].max<240) throw new Error('Missing real alpha')
  await emit(`src/dsh/client/assets/companion/pose-${i}.png`,png)
  await emit(`src/dsh/client/assets/companion/pose-${i}.webp`,await sharp(png).webp({lossless:true,effort:6}).toBuffer())
  imports+=`import p${i} from './assets/companion/pose-${i}.png'\nimport w${i} from './assets/companion/pose-${i}.webp'\n`
  rows+=`  { png: p${i}, webp: w${i} },\n`
}
for(let i=1;i<=12;i++) imports+=`import l${i} from './assets/insignia/l${i}.svg'\n`
await emit('src/dsh/client/character-assets.generated.ts',imports+`\nexport const poseAnchors = ${JSON.stringify(anchors)} as const\nexport const poseAlphaBounds = ${JSON.stringify(bounds)} as const\nexport const companionAssets = [\n${rows}] as const\nexport const insigniaAssets = [${Array.from({length:12},(_,i)=>'l'+(i+1)).join(',')}] as const\n`)
await emit('assets/character-source/PROVENANCE.json',JSON.stringify({route:'CODEX_SIDEBAR_BROWSER / ART_PRODUCTION',sourceSha256:hash(source),conversation:'https://chatgpt.com/c/6aa02472-56a4-83ee-85e0-437db68b8e40',assetId:'file_0000000044308209aeaa3746f8d59939',selection:'Second generator transparent candidate; final notebook output had unsupported octet-stream export and is not consumed.',conversion:'Per-pose bounding crops exclude neighboring fingertips; split rows at y=525; transparent contain 320x540; PNG and lossless WebP; no alpha manipulation',outputs},null,2)+'\n')
console.log(`Character assets ${check?'check':'generation'} PASS`)
