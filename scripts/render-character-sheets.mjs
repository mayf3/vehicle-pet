import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
const dir='docs/investigations/character-v4'
const labels=JSON.parse(await readFile('src/dsh/client/pets/vehicle/levels.json','utf8'))
const generated=await readFile('src/dsh/client/character-assets.generated.ts','utf8')
const anchors=JSON.parse(/export const poseAnchors = (.*) as const/.exec(generated)[1])
const uri=async(p,type)=>`data:image/${type};base64,${(await readFile(p)).toString('base64')}`
async function cell(level,pose,x,y,size=216) {
 const w=size*320/540, [ax,ay,angle]=anchors[pose],px=x+(260-w)/2,py=y+12
 const icon=w*.15,cx=px+w*ax/100,cy=py+size*ay/100
 return `<rect x="${x+4}" y="${y+4}" width="252" height="292" rx="16" fill="white"/><image x="${px}" y="${py}" width="${w}" height="${size}" href="${await uri(`src/dsh/client/assets/companion/pose-${pose}.png`,'png')}"/><image x="${cx-icon/2}" y="${cy-icon/2}" width="${icon}" height="${icon}" transform="rotate(${angle} ${cx} ${cy})" href="${await uri(`src/dsh/client/assets/insignia/l${level+1}.svg`,'svg+xml')}"/><text x="${x+130}" y="${py+size+24}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#285461">L${level+1} · ${labels[level].en}</text><text x="${x+130}" y="${py+size+46}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#30454e">${labels[level]['zh-CN']} · ${labels[level].en}</text>`
}
for(const [name,entries,cols] of [['level-contact-sheet',Array.from({length:12},(_,i)=>[i,0,216]),4],['expression-sheet',Array.from({length:10},(_,i)=>[6,i,216]),5],['small-large-sheet',[[1,0,112],[1,0,216]],2]]) {
 let content='';for(let i=0;i<entries.length;i++) content+=await cell(...entries[i].slice(0,2),(i%cols)*260,Math.floor(i/cols)*300,entries[i][2])
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cols*260}" height="${Math.ceil(entries.length/cols)*300}"><rect width="100%" height="100%" fill="#edf3f4"/>${content}</svg>`
 await writeFile(`${dir}/${name}.svg`,svg)
 await sharp(Buffer.from(svg)).png().toFile(`${dir}/${name}.png`)
}
console.log('Three transparent-asset review sheets rendered; runtime screenshots remain separate evidence.')
