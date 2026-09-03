/**
 * Overlay styles: one adopted `<style>` element with a stable data attribute,
 * installed at apply and removed on disposal (CTR-OVERLAY-012). The outer
 * layer is click-through (`pointer-events: none`); only the pet, launcher,
 * panel, and dialog re-enable pointer events (CTR-OVERLAY-008 hygiene).
 */

const STYLE_ID = 'vehicle-pet/overlay-styles'

const css = `
.vpo-root{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;font-family:var(--font-sans,ui-sans-serif,system-ui,-apple-system,sans-serif)}
.vpo-shell{position:absolute;pointer-events:none;transition:left 200ms cubic-bezier(.22,1,.36,1),top 200ms cubic-bezier(.22,1,.36,1),width 200ms cubic-bezier(.22,1,.36,1),height 200ms cubic-bezier(.22,1,.36,1);contain:layout style}
.vpo-shell[data-dragging="true"]{transition:none;z-index:2}
.vpo-surface{position:relative;width:100%;height:100%;padding:0;border:1px solid transparent;background:transparent;display:grid;place-items:center;cursor:grab;touch-action:none;border-radius:20px;outline:none;pointer-events:auto;-webkit-tap-highlight-color:transparent}
.vpo-surface:active{cursor:grabbing}
.vpo-surface:focus-visible,.vpo-launcher:focus-visible,.vpo-panel :focus-visible,.vpo-dialog :focus-visible{outline:2px solid var(--color-accent,#2f80ed);outline-offset:2px}
.vpo-pet{border-radius:20px;transition:box-shadow 200ms ease}
.vpo-surface[data-live="running"]{box-shadow:0 0 0 3px color-mix(in srgb,var(--color-accent,#2f80ed) 45%,transparent);animation:vpo-working-pulse 1.6s ease-in-out infinite}
.vpo-surface[data-live="needs-input"]{box-shadow:0 0 0 3px color-mix(in srgb,#e6a23c 60%,transparent);animation:vpo-waiting-wobble 1.1s ease-in-out infinite}
.vpo-surface[data-live="terminal"]{box-shadow:0 0 0 3px color-mix(in srgb,#67c23a 55%,transparent)}
.vpo-surface[data-live="terminal"][data-terminal="failed"]{box-shadow:0 0 0 3px color-mix(in srgb,#f56c6c 55%,transparent)}
.vpo-surface[data-live="terminal"][data-terminal="cancelled"]{box-shadow:0 0 0 3px color-mix(in srgb,#909399 55%,transparent)}
.vpo-scene{width:100%;height:100%;aspect-ratio:auto;border-radius:16px;overflow:hidden}
.vpo-scene .vp-scene{aspect-ratio:auto;width:100%;height:100%}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"]{background:radial-gradient(circle at 45% 38%,color-mix(in srgb,var(--color-surface,#fff) 94%,#dcecff) 0%,color-mix(in srgb,var(--color-accent,#2f80ed) 12%,var(--color-surface,#fff)) 100%)}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"] .vp-subject-btn{animation:none!important}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"] .vp-subject-btn::after{display:none!important}
.vpo-scene .vp-scene[data-presentation-mode="compact-overlay"][data-reduced-motion="false"] .vp-subject-btn>.vp-node-img{animation:vp-idle-float 3.6s ease-in-out infinite}
.vpo-launcher{position:relative;width:100%;height:100%;padding:0;border:1px solid color-mix(in srgb,var(--color-border,#9bb7cb) 60%,transparent);background:color-mix(in srgb,var(--color-surface,#fff) 84%,transparent);box-shadow:0 4px 16px rgba(16,52,76,.22);border-radius:999px;cursor:pointer;outline:none;display:grid;place-items:center;pointer-events:auto}
.vpo-launcherDot{width:44%;height:44%;border-radius:50%;background:radial-gradient(circle at 32% 30%,color-mix(in srgb,var(--color-accent,#2f80ed) 30%,#ffffff) 0%,var(--color-accent,#2f80ed) 70%);box-shadow:0 1px 4px rgba(22,55,82,.35)}
.vpo-badge{position:absolute;z-index:3;top:-4px;right:-4px;min-width:10px;height:10px;border-radius:999px;background:#e6a23c;box-shadow:0 0 0 2px var(--color-surface,#fff)}
.vpo-progress{position:absolute;z-index:2;left:16%;right:16%;bottom:6px;height:4px;border-radius:999px;background:color-mix(in srgb,var(--color-border,#9bb7cb) 55%,transparent);overflow:hidden;pointer-events:none}
.vpo-progressFill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,color-mix(in srgb,var(--color-accent,#2f80ed) 70%,#7fd1a8),var(--color-accent,#2f80ed));transition:width 600ms cubic-bezier(.22,1,.36,1)}
@media (prefers-reduced-motion: reduce){.vpo-progressFill{transition:none}}
.vpo-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.vpo-panel{position:absolute;pointer-events:auto;width:min(320px,calc(100vw - 32px));max-height:calc(100vh - 152px);overflow:auto;box-sizing:border-box;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--color-surface,#fff) 95%,transparent);border:1px solid color-mix(in srgb,var(--color-border,#a8bdcc) 72%,transparent);box-shadow:0 14px 40px rgba(10,37,57,.22);font-size:13px;line-height:1.45;color:var(--color-text,#17324d)}
.vpo-panel[data-horizontal="left"]{left:0}.vpo-panel[data-horizontal="right"]{right:0}
.vpo-panel[data-vertical="above"]{bottom:calc(100% + 8px)}.vpo-panel[data-vertical="below"]{top:calc(100% + 8px)}
.vpo-panelHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.vpo-panelTitle{font-size:14px;font-weight:700}
.vpo-panelClose{width:26px;height:26px;min-height:26px;padding:0;border-radius:999px}
.vpo-meta{display:grid;grid-template-columns:max-content 1fr;gap:4px 10px;margin:0 0 8px}
.vpo-meta dt{opacity:.65}.vpo-meta dd{margin:0;overflow-wrap:anywhere}
.vpo-actions{display:grid;gap:6px;margin-top:8px}
.vpo-control{font:inherit;min-height:30px;padding:5px 10px;border-radius:8px;border:1px solid color-mix(in srgb,var(--color-border,#a8bdcc) 72%,transparent);background:color-mix(in srgb,var(--color-surface,#fff) 84%,transparent);color:inherit;cursor:pointer;text-align:start}
.vpo-control[aria-pressed="true"]{border-color:var(--color-accent,#2f80ed)}
.vpo-packRow{display:flex;gap:6px;flex-wrap:wrap}
.vpo-packRow .vpo-control{flex:1 1 auto}
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
@media (prefers-reduced-motion: reduce){.vpo-shell,.vpo-surface{transition:none!important;animation:none!important}}
@keyframes vpo-working-pulse{0%,100%{box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent,#2f80ed) 25%,transparent)}50%{box-shadow:0 0 0 4px color-mix(in srgb,var(--color-accent,#2f80ed) 55%,transparent)}}
@keyframes vpo-waiting-wobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-1.5px)}75%{transform:translateX(1.5px)}}
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
