# Companion integration — Overlay V4 conformance

Implementation candidate: `ca2728598039932dafeef1b3b4ea30675d482287`.
Integration Base: `49ad1e460d7585eb8a17278f6ea4dd809fc07535`.
Authority: accepted `DSH_PET_OVERLAY_ADAPTER_V4` (PR29, authority head e2357a719b986b8c80dd41e828b8f7000560bf3d), with accepted Engine V4 and Usage Progress V2 unchanged. Owner authorization and stop boundary are persisted in `docs/investigations/GOAL_CHARACTER_OWNER_DISPATCH.md` and `GOAL_CHARACTER_IMPLEMENTATION_V4.md`.

Implementation: exactly two presentation recipes in the existing overlay, same Engine/Pack/progress/ledger/receipts; one optional character preference in the existing browser-local record. Ten companion expressions and twelve on-body SVG insignia share one state machine and speech scheduler. Both characters have Pony.ai and exact descriptive grades; L1–L5 use occupancy/escort/remote-operator meanings, while L6–L12 remain unchanged. Unknown character IDs fall back to vehicle without discarding other valid preferences. WebP falls back to the same pose's PNG, then the identity carrier. Production build contains all assets and no model calls or test progress hooks.

The Character Bible and source-art sheets are in `docs/investigations/character-v4`. `runtime-112/216-{expressions,levels}.png` use the production renderer and CSS at native CSS pixels with reduced motion; these are isolated rendering fixtures, not DSH runtime receipts. `assets/character-source/PROVENANCE.json` records the permitted ChatGPT sidebar art route and deterministic source/output hashes.

## Evidence relations

- EVD-CHAR-001 → CTR-022 / ACC-122: preference fallback and storage event tests, DOM selection/remount, and pinned-Harness character selection/reload with unchanged Engine preferences/journals/keepsakes. These verify the shared presentation path; scripted mock LLM usage is not real model billing or production data proof.
- EVD-CHAR-002 → CTR-023 / ACC-123: bilingual operational mapping, twelve-grade sheets, independent visual review, both resident sizes and actual whale/composer coexistence. SMALL internal badge details are not reliably legible; external brand, exact grade and description carry the precise meaning.
- EVD-CHAR-003 → CTR-024 / ACC-124: 120 grade/pose DOM combinations, direct PNG-alpha bounds tests for ten poses at two sizes, PNG fallback, per-character catalog floors and locale length limits, and shared scheduler switch/cooldown/terminal-dedup tests. Source alpha and deterministic output checks establish transparency/provenance.
- EVD-CHAR-004 → CTR-003/017/020/024: actual pinned-Harness lifecycle, placement, reduced motion, locale, full journey, disposal/HMR, data preservation and quiet-period terminal single-feedback check. The old Engine feedback still dispatches and expires; while the shared bubble is visible, its duplicate visual surface is hidden.

## Independent review

`authority_preflight_review` did not author implementation. Code ACCEPT was issued at 2c0ddaf4cb8bab9c4d2d275328f4e97d66ec0c1a and retained after independently checking the pose-only ca27285 delta. B01 (fixed hitbox vs alpha) and B02 (same-anchor terminal feedback) are closed; no remaining code blockers or Spec gaps.

`character_visual_review` independently inspected the identity/master, three source-art sheets and four production-renderer sheets. The cancelled-pose crop defect was corrected at ca27285 and independently closed. Asset visual blockers: zero. The 2c0ddaf DSH screenshots established that the new companion/grade/feedback did not obscure the whale, composer or send button. A separate existing host toast overlapped the send area in those early screenshots, so they do not establish a globally unobstructed screen. Final runtime evidence is recorded below.

## Executed results

All required commands completed successfully against ca2728598039932dafeef1b3b4ea30675d482287:

- `pnpm verify`: PASS — 158 unit/DOM tests, 12 prototype browser tests, 18 contract tests, typecheck/lint/build and deterministic asset checks.
- `pnpm verify:dsh`: PASS — 122 DSH unit/DOM tests, 38 pinned real-Harness browser tests; bundle, package, lifecycle, typecheck/lint/contracts and asset checks. The suite includes the final terminal-single-feedback regression.
- `pnpm test:dsh:e2e:coexistence`: PASS — 2/2, both vehicle and companion at default placement with whale; companion LARGE/SMALL and actual pointer-operated selector/menu.
- `verify_governance.py --target . --require-accepted`: PASS; `git diff --check`: PASS.
- Engine, Pack/level thresholds, Usage Progress and OverlayProgressSource paths are byte-unchanged from Base. The production browser bundle was restored after HMR testing and is byte-identical to the committed candidate; SHA256 `8e7562c806ac15667bed69867f6db44d78fa6de2efb2f754e681bf012ce17b31`.

Environment: pinned Harness `f77b5a2fcebc2d9138f6608a60636f2294868d42`; Chrome, 1440×900 plus mobile/narrow viewports in the main suite. Disposable homes `/tmp/vehicle-pet-overlay-dsh-home-r1` (3081) and `/tmp/vehicle-pet-overlay-dsh-coexist-home` (3085); scripted mock LLM on 8901 and test supervisor on 8902. No production home, real model billing, production profile install or deployment was performed.

Executed summaries and raw local-log hashes are persisted in [verification.txt](character-v4/verification.txt). Committed PNGs under `character-v4/` capture final-head terminal, LARGE/SMALL grade geometry and whale coexistence. The final terminal image received independent visual ACCEPT: one Chinese line, readable Pony.ai/operational grade, no new input/send obstruction. The final coexistence rerun uses the same accepted geometry and exact candidate assets.

Verification completed UTC: 2026-09-09T00:48:42.402789+00:00 .

Production application remains forbidden. Final independent evidence review and merge receipt are separate from these test outcomes.

Final preview capture: the existing disposable coexistence home was restarted read-only on 3085 with the same production bundle. A fresh headless Chrome context selected an already recorded mock session, switched host locale to Chinese and selected the companion through its menu; no prompt was sent. `character-v4-final-zh.png` and `character-v4-final-menu.png` show this final-head Chinese preview. The existing host summary toast remains at the lower right even after waiting; it is unrelated to the new character. No whole-screen absence-of-occlusion claim is made, and it was not removed by pixel editing or hidden through host DOM mutation.
