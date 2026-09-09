/** Isolated rendering of the production CharacterVisual and CSS, not a DSH runtime receipt. */
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
const result=await build({stdin:{contents:`
import React from 'react';import{createRoot}from'react-dom/client';
import{CharacterVisual,companionHitStyle}from'./src/dsh/client/CharacterVisual';
import{CHARACTER_DEFINITIONS,COMPANION_POSES,characterLevel}from'./src/dsh/client/characters';
import{adoptStyles}from'./src/dsh/client/styles';adoptStyles();
window.renderSheet=(size,mode)=>{
 const entries=mode==='expressions'?Object.keys(COMPANION_POSES).map(variant=>({variant,level:'l7'})):Array.from({length:12},(_,i)=>({variant:'idle',level:'l'+(i+1)}));
 root.render(<main><h1>{size===112?'SMALL · 112px':'LARGE · 216px'} / {mode} / reduced motion</h1><p>Production renderer + CSS · isolated fixture · native CSS pixel sizes</p><div className="grid">{entries.map(({variant,level})=>{const grade=characterLevel(level,'zh-CN');return <article key={level+variant}><div data-vehicle-pet-size={size===112?'small':'large'}><div className="vpo-shell" data-reduced-motion="true" style={{position:'relative',width:size,height:size}}><span className="vpo-characterArea"><span className="vpo-scene"><CharacterVisual character={CHARACTER_DEFINITIONS.companion} variant={variant} levelId={level} interactionCount={0}/></span><button className="vpo-petHit vpo-surface" style={companionHitStyle(variant,size)} /></span><span className="vpo-grade"><span className="vpo-gradeBrand">Pony.ai · {grade.grade}</span><span>{grade.description}</span></span></div></div><small>{variant}</small></article>})}</div></main>);
};const root=createRoot(document.getElementById('root'));
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',loader:{'.png':'dataurl','.webp':'dataurl','.svg':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}})
const browser=await chromium.launch({headless:true,channel:'chrome'})
try{
 const page=await browser.newPage({viewport:{width:1100,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'})
 await page.setContent('<style>body{margin:0;background:#edf3f4;color:#244853;font:14px system-ui}main{padding:24px}h1{font-size:22px}p{color:#61747b}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}article{padding:16px;background:white;border-radius:16px;display:grid;justify-items:center;gap:16px}small{color:#657b84}</style><div id="root"></div>')
 await page.addScriptTag({content:result.outputFiles[0].text})
 for(const size of [112,216]) for(const mode of ['expressions','levels']){
   await page.evaluate(({size,mode})=>window.renderSheet(size,mode),{size,mode})
   await page.waitForTimeout(200)
   await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())))
   await page.screenshot({path:`docs/investigations/character-v4/runtime-${size}-${mode}.png`,fullPage:true})
 }
}finally{await browser.close()}
console.log('Production renderer sheets PASS (isolated fixture, not DSH)')
