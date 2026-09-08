/**
 * Overlay styles: one adopted `<style>` element with a stable data attribute,
 * installed at apply and removed on disposal (CTR-OVERLAY-012). The outer
 * layer is click-through (`pointer-events: none`); only the pet hitbox,
 * launcher, secondary menu, and dialog re-enable pointer events
 * (CTR-OVERLAY-008 hygiene).
 */
/** Adopt the overlay stylesheet; the disposer removes it. Idempotent. */
export declare function adoptStyles(target?: Pick<Document, 'querySelector' | 'createElement' | 'head'>): () => void;
//# sourceMappingURL=styles.d.ts.map