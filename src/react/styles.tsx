/**
 * Engine-owned styles (idle motion, click feedback, ceremony, greeting).
 * Packs carry no CSS; these styles belong to the engine React adapter.
 */

export function EngineStyles() {
  return (
    <style>{`
@keyframes vp-idle-float {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-2.2%); }
}
@keyframes vp-click-pop {
  0% { transform: translate(-50%, -50%) scale(1); }
  45% { transform: translate(-50%, -50%) scale(1.18); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
@keyframes vp-click-spark {
  0% { opacity: 1; transform: translate(-50%, -100%); }
  100% { opacity: 0; transform: translate(-50%, -220%); }
}
@keyframes vp-ceremony-beat {
  0% { opacity: 0; transform: translateY(14px); }
  18% { opacity: 1; transform: translateY(0); }
  82% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}
@keyframes vp-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 210, 120, 0); }
  50% { box-shadow: 0 0 42px rgba(255, 210, 120, 0.85); }
}
@keyframes vp-greeting-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes vp-scene-crossfade { from { opacity: 0; } to { opacity: 1; } }
@keyframes vp-scene-zoom-out { from { transform: scale(1.12); } to { transform: scale(1); } }
@keyframes vp-layer-build { from { opacity: 0; } to { opacity: 1; } }
@keyframes vp-camera-step-out { from { transform: scale(1.08); } to { transform: scale(1); } }
@keyframes vp-subject-swap { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes vp-scene-expand { from { clip-path: inset(12%); } to { clip-path: inset(0); } }
@keyframes vp-milestone-card { from { opacity: 0; } to { opacity: 1; } }
@keyframes vp-collection-add { from { filter: brightness(1.5); } to { filter: brightness(1); } }
@keyframes vp-spark-burst { from { opacity: 1; } to { opacity: 0; } }
@keyframes vp-confetti-lite { from { background-position: 0 0; } to { background-position: 24px 80px; } }
.vp-scene { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; background: #0d1220; }
.vp-node { position: absolute; transform-origin: center; }
.vp-scene-transition-instant, .vp-upgrade-transition-instant { animation: none; }
.vp-scene-transition-crossfade { animation: vp-scene-crossfade 320ms ease-out both; }
.vp-scene-transition-zoom-out { animation: vp-scene-zoom-out 420ms ease-out both; }
.vp-scene-transition-layer-build .vp-node { animation: vp-layer-build 260ms ease-out both; animation-delay: calc(var(--vp-node-index, 0) * 24ms); }
.vp-upgrade-transition-crossfade { animation: vp-scene-crossfade 320ms ease-out both; }
.vp-upgrade-transition-layer-build .vp-node { animation: vp-layer-build 260ms ease-out both; animation-delay: calc(var(--vp-node-index, 0) * 24ms); }
.vp-upgrade-transition-camera-step-out { animation: vp-camera-step-out 420ms ease-out both; }
.vp-upgrade-reveal-subject-swap .vp-subject-btn { animation: vp-subject-swap 300ms ease-out both; }
.vp-upgrade-reveal-scene-expand { animation: vp-scene-expand 360ms ease-out both; }
.vp-upgrade-reveal-milestone-card .vp-milestone-text { animation: vp-milestone-card 300ms ease-out both; }
.vp-upgrade-reveal-collection-add .vp-aggregate { animation: vp-collection-add 420ms ease-out both; }
.vp-celebration-glow-pulse { animation: vp-glow-pulse 1.5s ease-in-out 2; }
.vp-celebration-ambient-highlight { box-shadow: inset 0 0 32px rgba(125, 211, 252, 0.18); }
.vp-celebration-spark-burst::after, .vp-celebration-confetti-lite::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
.vp-celebration-spark-burst::after { background: radial-gradient(circle, #fde68a 0 2px, transparent 3px) 0 0 / 38px 38px; animation: vp-spark-burst 700ms ease-out both; }
.vp-celebration-confetti-lite::after { background: radial-gradient(circle, #7dd3fc 0 2px, transparent 3px) 0 0 / 24px 24px; animation: vp-confetti-lite 900ms linear both; }
.vp-node-img { display: block; width: 100%; height: 100%; object-fit: contain; }
.vp-subject-btn { position: absolute; transform-origin: center; border: 0; background: transparent; padding: 0; cursor: pointer; }
.vp-subject-btn[data-feedback-visible="true"]::after { content: attr(data-feedback); position: absolute; left: 50%; top: -20%; color: #fde68a; font-size: 13px; }
.vp-subject-btn:focus-visible { outline: 3px solid #7dd3fc; outline-offset: 3px; border-radius: 12px; }
.vp-aggregate { font-size: 13px; color: #e6edf7; background: rgba(13, 18, 32, 0.66); padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.vp-milestone-text { font-size: 14px; color: #f2f6ff; background: rgba(13, 18, 32, 0.6); padding: 4px 10px; border-radius: 8px; max-width: 60%; text-align: center; }
.vp-asset-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border: 2px dashed rgba(148, 163, 184, 0.8); border-radius: 10px; color: #dbe4f3; font-size: 12px; padding: 4px; text-align: center; background: rgba(30, 41, 59, 0.5); }
.vp-product-header { background: #ffffff; }
.vp-product-title { color: #17253e; background: #ffffff; }
.vp-product-tagline { color: #3a4e6b; background: #ffffff; }
.vp-panel { background: #111a2c; color: #e8eefb; border-radius: 12px; padding: 14px 16px; }
.vp-panel h3, .vp-title { margin: 0 0 8px; font-size: 14px; color: #c6d8f5; font-weight: 600; }
.vp-progressbar { position: relative; height: 10px; border-radius: 999px; background: #22304d; overflow: hidden; }
.vp-progressbar-fill { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: linear-gradient(90deg, #38bdf8, #a78bfa); }
.vp-progress-meta, .vp-scene-label { color: #9fb4d8; }
.vp-milestone-copy { color: #ffd88a; }
.vp-ceremony { position: fixed; inset: auto 0 12vh 0; display: flex; justify-content: center; pointer-events: none; z-index: 60; }
.vp-ceremony-inner { pointer-events: auto; min-width: 280px; max-width: 420px; background: rgba(10, 15, 28, 0.92); border: 1px solid rgba(125, 211, 252, 0.35); border-radius: 16px; padding: 16px 20px; color: #f4f7ff; text-align: center; animation: vp-greeting-in 220ms ease-out; }
.vp-ceremony-inner-reduced, .vp-ceremony-inner-reduced * { animation: none !important; transition: none !important; transform: none !important; translate: none !important; scale: none !important; }
.vp-ceremony-inner-reduced::before, .vp-ceremony-inner-reduced::after, .vp-ceremony-inner-reduced *::before, .vp-ceremony-inner-reduced *::after { content: none !important; animation: none !important; }
.vp-ceremony-beat { animation: vp-ceremony-beat 1s ease-in-out both; font-size: 17px; }
.vp-ceremony-static { font-size: 16px; line-height: 1.7; }
.vp-ceremony-skip { margin-top: 10px; font-size: 12px; color: #9db7e0; background: transparent; border: 1px solid rgba(157, 183, 224, 0.4); border-radius: 999px; padding: 3px 14px; cursor: pointer; }
.vp-ceremony-skip:focus-visible { outline: 2px solid #7dd3fc; }
.vp-greeting { position: relative; display: flex; align-items: center; gap: 10px; background: #17253e; border: 1px solid #52739f; color: #f4f7ff; border-radius: 12px; padding: 10px 14px; animation: vp-greeting-in 260ms ease-out; }
.vp-greeting-close { margin-left: auto; border: 0; background: transparent; color: #d9e7fb; cursor: pointer; font-size: 16px; line-height: 1; }
.vp-host-feedback { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 6px 14px; font-size: 14px; }
.vp-host-completed { background: #163927; color: #d4fbe1; }
.vp-host-failed { background: #293244; color: #f1f5f9; }
.vp-host-cancelled { background: #12364a; color: #e0f5ff; }
.vp-keepsake-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.vp-keepsake-item { display: flex; gap: 10px; align-items: center; border: 1px solid #24344f; border-radius: 10px; padding: 8px 10px; }
.vp-keepsake-item-unlocked { border-color: rgba(250, 204, 21, 0.45); background: rgba(250, 204, 21, 0.06); }
.vp-keepsake-title { font-weight: 600; font-size: 13px; }
.vp-keepsake-desc { font-size: 12px; color: #9fb4d8; }
.vp-selector { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.vp-selector button { border: 1px solid #2b3d5c; background: #16223a; color: #d7e3f7; border-radius: 999px; padding: 4px 14px; cursor: pointer; font-size: 13px; }
.vp-selector button[aria-pressed="true"] { border-color: #7dd3fc; color: #7dd3fc; }
.vp-selector button:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
.vp-waiting { display: grid; place-items: center; min-height: 200px; color: #b9c9e3; font-size: 15px; }
.vp-scene[data-reduced-motion="true"],
.vp-scene[data-reduced-motion="true"] *,
.vp-scene[data-reduced-motion="true"]::before,
.vp-scene[data-reduced-motion="true"]::after,
.vp-scene[data-reduced-motion="true"] *::before,
.vp-scene[data-reduced-motion="true"] *::after {
  animation: none !important;
  transition: none !important;
}
.vp-scene[data-reduced-motion="true"]::before,
.vp-scene[data-reduced-motion="true"]::after,
.vp-scene[data-reduced-motion="true"] *::before { content: none !important; }
`}</style>
  )
}
