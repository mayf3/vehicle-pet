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
.vp-scene { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; background: #0d1220; }
.vp-scene-inner { position: absolute; inset: 0; }
.vp-node { position: absolute; transform-origin: center; }
.vp-node-img { display: block; width: 100%; height: 100%; object-fit: contain; }
.vp-subject-btn { position: absolute; transform-origin: center; border: 0; background: transparent; padding: 0; cursor: pointer; }
.vp-subject-btn:focus-visible { outline: 3px solid #7dd3fc; outline-offset: 3px; border-radius: 12px; }
.vp-aggregate { font-size: 13px; color: #e6edf7; background: rgba(13, 18, 32, 0.66); padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.vp-milestone-text { font-size: 14px; color: #f2f6ff; background: rgba(13, 18, 32, 0.6); padding: 4px 10px; border-radius: 8px; max-width: 60%; text-align: center; }
.vp-asset-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border: 2px dashed rgba(148, 163, 184, 0.8); border-radius: 10px; color: #dbe4f3; font-size: 12px; padding: 4px; text-align: center; background: rgba(30, 41, 59, 0.5); }
.vp-panel { background: #111a2c; color: #e8eefb; border-radius: 12px; padding: 14px 16px; }
.vp-panel h3 { margin: 0 0 8px; font-size: 14px; color: #9fb4d8; font-weight: 600; }
.vp-progressbar { position: relative; height: 10px; border-radius: 999px; background: #22304d; overflow: hidden; }
.vp-progressbar-fill { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: linear-gradient(90deg, #38bdf8, #a78bfa); }
.vp-ceremony { position: fixed; inset: auto 0 12vh 0; display: flex; justify-content: center; pointer-events: none; z-index: 60; }
.vp-ceremony-inner { pointer-events: auto; min-width: 280px; max-width: 420px; background: rgba(10, 15, 28, 0.92); border: 1px solid rgba(125, 211, 252, 0.35); border-radius: 16px; padding: 16px 20px; color: #f4f7ff; text-align: center; animation: vp-greeting-in 220ms ease-out; }
.vp-ceremony-beat { animation: vp-ceremony-beat 1s ease-in-out both; font-size: 17px; }
.vp-ceremony-static { font-size: 16px; line-height: 1.7; }
.vp-ceremony-skip { margin-top: 10px; font-size: 12px; color: #9db7e0; background: transparent; border: 1px solid rgba(157, 183, 224, 0.4); border-radius: 999px; padding: 3px 14px; cursor: pointer; }
.vp-ceremony-skip:focus-visible { outline: 2px solid #7dd3fc; }
.vp-greeting { position: relative; display: flex; align-items: center; gap: 10px; background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(167, 139, 250, 0.16)); border: 1px solid rgba(125, 211, 252, 0.35); color: #eaf2ff; border-radius: 12px; padding: 10px 14px; animation: vp-greeting-in 260ms ease-out; }
.vp-greeting-close { margin-left: auto; border: 0; background: transparent; color: #9db7e0; cursor: pointer; font-size: 16px; line-height: 1; }
.vp-host-feedback { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 6px 14px; font-size: 14px; }
.vp-host-completed { background: rgba(74, 222, 128, 0.15); color: #86efac; }
.vp-host-failed { background: rgba(148, 163, 184, 0.16); color: #cbd5e1; }
.vp-host-cancelled { background: rgba(125, 211, 252, 0.14); color: #bae6fd; }
.vp-keepsake-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.vp-keepsake-item { display: flex; gap: 10px; align-items: center; border: 1px solid #24344f; border-radius: 10px; padding: 8px 10px; }
.vp-keepsake-item-unlocked { border-color: rgba(250, 204, 21, 0.45); background: rgba(250, 204, 21, 0.06); }
.vp-keepsake-title { font-weight: 600; font-size: 13px; }
.vp-keepsake-desc { font-size: 12px; color: #9fb4d8; }
.vp-selector { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.vp-selector button { border: 1px solid #2b3d5c; background: #16223a; color: #d7e3f7; border-radius: 999px; padding: 4px 14px; cursor: pointer; font-size: 13px; }
.vp-selector button[aria-pressed="true"] { border-color: #7dd3fc; color: #7dd3fc; }
.vp-selector button:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
.vp-waiting { display: grid; place-items: center; min-height: 200px; color: #93a8cc; font-size: 15px; }
`}</style>
  )
}
