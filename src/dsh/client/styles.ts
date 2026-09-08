/**
 * Overlay styles: one adopted `<style>` element with a stable data attribute,
 * installed at apply and removed on disposal (CTR-OVERLAY-012). The outer
 * layer is click-through (`pointer-events: none`); only the pet hitbox,
 * launcher, secondary menu, and dialog re-enable pointer events
 * (CTR-OVERLAY-008 hygiene).
 */

const STYLE_ID = 'vehicle-pet/overlay-styles'

const css = `
.vpo-root{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,sans-serif)}
.vpo-shell{position:absolute;pointer-events:none;transition:left 200ms cubic-bezier(.22,1,.36,1),top 200ms cubic-bezier(.22,1,.36,1),width 200ms cubic-bezier(.22,1,.36,1),height 200ms cubic-bezier(.22,1,.36,1);contain:layout style}
.vpo-shell[data-dragging="true"]{transition:none;z-index:2}
.vpo-surface{position:relative;padding:0;border:1px solid transparent;background:transparent;outline:none;-webkit-tap-highlight-color:transparent}
/* Hitbox honesty (V3 CTR-OVERLAY-003): the interactive surface is the
   transparent hit button sized to the visible sprite bbox, not the square
   sprite canvas. The full-canvas scene below it is pointer-inert. */
.vpo-petHit{position:absolute;pointer-events:auto;border-radius:14px;cursor:grab;touch-action:none}
.vpo-petHit:active{cursor:grabbing}
.vpo-petHit:focus-visible,.vpo-launcher:focus-visible,.vpo-menu :focus-visible,.vpo-dialog :focus-visible,.vpo-toolsTrigger:focus-visible{outline:2px solid var(--color-accent,#2f80ed);outline-offset:2px}
.vpo-petHit[data-live="running"]{box-shadow:0 0 0 3px color-mix(in srgb,var(--color-accent,#2f80ed) 45%,transparent);animation:vpo-working-pulse 1.6s ease-in-out infinite}
.vpo-petHit[data-live="needs-input"]{box-shadow:0 0 0 3px color-mix(in srgb,#e6a23c 60%,transparent);animation:vpo-waiting-wobble 1.1s ease-in-out infinite}
.vpo-petHit[data-live="terminal"]{box-shadow:0 0 0 3px color-mix(in srgb,#67c23a 55%,transparent)}
.vpo-petHit[data-live="terminal"][data-terminal="failed"]{box-shadow:0 0 0 3px color-mix(in srgb,#f56c6c 55%,transparent)}
.vpo-petHit[data-live="terminal"][data-terminal="cancelled"]{box-shadow:0 0 0 3px color-mix(in srgb,#909399 55%,transparent)}
.vpo-scene{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;border-radius:16px;overflow:hidden;pointer-events:none}
.vpo-scene .vp-scene{aspect-ratio:auto;width:100%;height:100%}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"]{background:radial-gradient(circle at 45% 38%,color-mix(in srgb,var(--color-surface,#fff) 94%,#dcecff) 0%,color-mix(in srgb,var(--color-accent,#2f80ed) 12%,var(--color-surface,#fff)) 100%)}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"] .vp-subject-btn{animation:none!important}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"] .vp-subject-btn::after{display:none!important}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"][data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vp-idle-float 3.6s ease-in-out infinite}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"][data-reduced-motion="false"] .vpo-expr{animation:vp-idle-float 3.6s ease-in-out infinite}
.vpo-launcher{position:absolute;inset:0;width:100%;height:100%;padding:0;border:1px solid color-mix(in srgb,var(--color-border,#9bb7cb) 60%,transparent);background:color-mix(in srgb,var(--color-surface,#fff) 84%,transparent);box-shadow:0 4px 16px rgba(16,52,76,.22);border-radius:999px;cursor:pointer;outline:none;display:grid;place-items:center;pointer-events:auto}
.vpo-launcherDot{width:44%;height:44%;border-radius:50%;background:radial-gradient(circle at 32% 30%,color-mix(in srgb,var(--color-accent,#2f80ed) 30%,#ffffff) 0%,var(--color-accent,#2f80ed) 70%);box-shadow:0 1px 4px rgba(22,55,82,.35)}
.vpo-badge{position:absolute;z-index:3;top:-4px;right:-4px;min-width:10px;height:10px;border-radius:999px;background:#e6a23c;box-shadow:0 0 0 2px var(--color-surface,#fff)}
/* Static per-variant expression layer (V3 CTR-OVERLAY-014): positioned inside
   the subject box by the per-level face anchor table; never interactive and
   never hidden by reduced motion (CTR-OVERLAY-015). */
.vpo-expr{position:absolute;z-index:3;aspect-ratio:1/1;pointer-events:none}
.vpo-exprImg{display:block;width:100%;height:100%}
/* Speech bubble (V3 CTR-OVERLAY-017): single polite surface above (or below)
   the pet; auto-dismissed by the scheduler; never focusable. */
.vpo-bubble{position:absolute;z-index:6;left:50%;transform:translateX(-50%);width:max-content;max-width:min(260px,calc(100vw - 32px));box-sizing:border-box;padding:9px 13px;border-radius:14px;background:color-mix(in srgb,var(--color-surface,#fff) 96%,transparent);border:1px solid color-mix(in srgb,var(--color-border,#a8bdcc) 72%,transparent);box-shadow:0 10px 28px rgba(10,37,57,.2);font-size:12px;line-height:1.45;color:var(--color-text,#17324d);pointer-events:none;text-align:center}
.vpo-bubble[data-placement="above"]{bottom:calc(100% + 8px)}
.vpo-bubble[data-placement="below"]{top:calc(100% + 8px)}
/* Secondary settings affordance (V3 CTR-OVERLAY-005): the trigger row is
   revealed by hover/focus only — low-distraction by default — and the menu
   itself is a narrow non-modal group. */
.vpo-tools{position:absolute;z-index:7;left:50%;transform:translateX(-50%);top:calc(100% + 4px);opacity:0;pointer-events:none;transition:opacity .18s ease}
.vpo-shell:hover .vpo-tools,.vpo-shell:focus-within .vpo-tools,.vpo-tools.vpo-tools-open{opacity:1;pointer-events:auto}
.vpo-toolsTrigger{display:flex;align-items:center;justify-content:center;min-width:30px;height:26px;padding:0 9px;border-radius:999px;font-size:14px;line-height:1}
.vpo-menu{position:absolute;z-index:8;box-sizing:border-box;display:grid;gap:8px;padding:10px 12px;border-radius:14px;background:color-mix(in srgb,var(--color-surface,#fff) 96%,transparent);border:1px solid color-mix(in srgb,var(--color-border,#a8bdcc) 72%,transparent);box-shadow:0 14px 40px rgba(10,37,57,.22);font-size:12px;line-height:1.4;color:var(--color-text,#17324d);pointer-events:auto}
.vpo-menu[data-horizontal="left"]{left:0}.vpo-menu[data-horizontal="right"]{right:0}
.vpo-menu[data-vertical="above"]{bottom:calc(100% + 26px)}.vpo-menu[data-vertical="below"]{top:calc(100% + 26px)}
.vpo-menuRow{display:grid;gap:5px}
.vpo-menuLabel{opacity:.65}
.vpo-control{font:inherit;min-height:28px;padding:4px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--color-border,#a8bdcc) 72%,transparent);background:color-mix(in srgb,var(--color-surface,#fff) 84%,transparent);color:inherit;cursor:pointer;text-align:start}
.vpo-control[aria-pressed="true"]{border-color:var(--color-accent,#2f80ed)}
.vpo-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.vpo-dialogBackdrop{position:fixed;inset:0;pointer-events:auto;background:var(--dsw-alias-bg-mask-3,rgba(13,18,32,.46));display:grid;place-items:center;padding:24px;z-index:4}
.vpo-dialog{--vpo-dialog-surface:var(--dsw-alias-bg-layer-2,var(--color-surface,#fff));--vpo-dialog-panel:var(--dsw-alias-bg-layer-1,#f5f7fa);--vpo-dialog-text:var(--dsw-alias-label-primary,var(--color-text,#17324d));--vpo-dialog-muted:var(--dsw-alias-label-secondary,#43566f);--vpo-dialog-border:var(--dsw-alias-border-l2,#8291a3);--vpo-dialog-focus:var(--dsw-alias-state-business-primary,#1d63c4);position:relative;pointer-events:auto;width:min(860px,calc(100vw - 48px));max-height:min(82vh,760px);overflow:auto;border-radius:16px;background:var(--vpo-dialog-surface);color:var(--vpo-dialog-text);box-shadow:0 24px 80px rgba(6,20,34,.45);padding:16px 18px 22px}
.vpo-dialogHeader{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--vpo-dialog-surface);padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--vpo-dialog-border)}
.vpo-dialogTitle{font-size:16px;font-weight:700;margin:0;color:var(--vpo-dialog-text)}
.vpo-dialogBody{display:grid;gap:14px}
.vpo-dialog .vpo-control{background:var(--vpo-dialog-panel);color:var(--vpo-dialog-text);border-color:var(--vpo-dialog-border)}
.vpo-dialog :focus-visible{outline-color:var(--vpo-dialog-focus)}
.vpo-engineScope .vp-panel{background:var(--vpo-dialog-panel);color:var(--vpo-dialog-text);border:1px solid var(--vpo-dialog-border);border-radius:12px;padding:10px 12px}
.vpo-engineScope .vp-panel h3,.vpo-engineScope .vp-title,.vpo-engineScope .vp-keepsake-title,.vpo-engineScope .vp-milestone-copy{color:var(--vpo-dialog-text)}
.vpo-engineScope .vp-progress-meta,.vpo-engineScope .vp-scene-label,.vpo-engineScope .vp-keepsake-desc{color:var(--vpo-dialog-muted)}
.vpo-engineScope .vp-keepsake-item{border-color:var(--vpo-dialog-border)}
@media (prefers-reduced-motion: reduce){.vpo-shell,.vpo-petHit{transition:none!important;animation:none!important}}
@keyframes vpo-working-pulse{0%,100%{box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent,#2f80ed) 25%,transparent)}50%{box-shadow:0 0 0 4px color-mix(in srgb,var(--color-accent,#2f80ed) 55%,transparent)}}
@keyframes vpo-waiting-wobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-1.5px)}75%{transform:translateX(1.5px)}}
/* Click reaction and per-state small motion ride the subject sprite. The
   shell carries the effective live state because the scene and the hit
   button are siblings; every rule is gated by the scene's effective
   reduced-motion flag, so an explicit reduced-motion choice silences them
   all (V3 CTR-OVERLAY-015 degrades the click reaction to the variant
   change). */
.vpo-shell[data-live="running"] .vp-scene[data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vpo-drive-rock .9s ease-in-out infinite}
.vpo-shell[data-live="running"] .vpo-expr{animation:vpo-drive-rock .9s ease-in-out infinite}
.vpo-shell[data-live="needs-input"] .vp-scene[data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vpo-attention-glow 1.3s ease-in-out infinite}
.vpo-shell[data-live="needs-input"] .vpo-expr{animation:vpo-attention-glow 1.3s ease-in-out infinite}
.vpo-shell[data-live="terminal"][data-terminal="completed"] .vp-scene[data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vpo-happy-hop 1.5s ease-out 1}
.vpo-shell[data-live="terminal"][data-terminal="completed"] .vpo-expr{animation:vpo-happy-hop 1.5s ease-out 1}
.vpo-shell[data-live="terminal"][data-terminal="failed"] .vp-scene[data-reduced-motion="false"] .vp-subject-btn>.vp-node-img,
.vpo-shell[data-live="terminal"][data-terminal="cancelled"] .vp-scene[data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vpo-quiet-sag 1.8s ease-in-out 1}
.vpo-shell[data-live="terminal"][data-terminal="failed"] .vpo-expr,
.vpo-shell[data-live="terminal"][data-terminal="cancelled"] .vpo-expr{animation:vpo-quiet-sag 1.8s ease-in-out 1}
@keyframes vpo-drive-rock{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-2px) rotate(-1deg)}75%{transform:translateY(-1px) rotate(1deg)}}
@keyframes vpo-attention-glow{0%,100%{filter:drop-shadow(0 0 0 rgba(230,162,60,0))}50%{filter:drop-shadow(0 0 9px rgba(230,162,60,.85))}}
@keyframes vpo-happy-hop{0%{transform:translateY(0)}30%{transform:translateY(-10px) scale(1.05)}55%{transform:translateY(0)}75%{transform:translateY(-4px)}100%{transform:translateY(0)}}
@keyframes vpo-quiet-sag{0%,100%{transform:translateY(0);filter:none}50%{transform:translateY(2px);filter:saturate(.55) brightness(.94)}}
`

/** Adopt the overlay stylesheet; the disposer removes it. Idempotent. */
export function adoptStyles(target: Pick<Document, 'querySelector' | 'createElement' | 'head'> = document): () => void {
  const selector = `style[data-plugin-css="${STYLE_ID}"]`
  if (target.querySelector(selector) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'vehicle-pet'
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = css
  target.head.append(tag)
  return () => {
    tag.remove()
  }
}
