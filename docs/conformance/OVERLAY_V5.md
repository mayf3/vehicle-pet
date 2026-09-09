# Overlay V5 interaction conformance

Implementation candidate: `286a7b978c05449261941be39a2bb08b0e71048a`.
Base: `0167ef410dfa2dc7bfe6698a5ad586958afa19e3` (accepted Overlay V5, PR31).
Owner scope and execution route: `docs/investigations/OVERLAY_V5_IMPLEMENTATION.md` and existing `GOAL_CHARACTER_OWNER_DISPATCH.md`. No production activation.

The resident vehicle has no background or inherited ambient-highlight inset shadow. Both characters stay static under absent/on/off legacy preferences and OS settings; expressions still change. Settings open via double-click, Shift+Enter or ContextMenu, with single-click reaction and drag suppression preserved. The four settings are character, size, Full Journey and collapse. One persistent scheduler samples 20–40 second recurring deadlines, suppresses hidden/recent-input attempts without catchup, and keeps category history on character switches. A pointer-inert two-line footer projects only listed running/pending metadata, sanitizes/bounds plain titles, rotates multiple sessions every six seconds and reserves 32px in complete-surface geometry.

## Executed evidence

- EVD-V5-01 → CTR-003/005/008/010/015/021/025/026 and ACC-125: final candidate typecheck/lint plus 130 DSH unit/DOM tests PASS. Includes keyboard settings/focus, absent legacy controls, public-list membership/current-first ordering/hostile title/plain text/rotation cleanup and randomized timer bounds/continuous speech beyond three lines in all active categories, input/hidden suppression, switch continuity and disposal.
- EVD-V5-02 → CTR-015/019/025/026 and ACC-125: final candidate `pnpm test:dsh:e2e --grep OVERLAY_V5`, 2/2 PASS on real pinned Harness. Computed transparent background and no inset shadow; zero running animations with legacy false; double-click menu, Escape focus; two recurring distinct catalog bubbles; actual running metadata appears and disappears; a pending background session remains displayed after opening another session without rebinding the adapter; 390px footer bounds.
- EVD-V5-03 → CTR-003/017/020/025 and ACC-125: final candidate `pnpm test:dsh:e2e:coexistence`, 2/2 PASS. Vehicle and companion SMALL/LARGE with real installed whale; no new pet/footer obstruction of composer/send/whale default footprint.
- EVD-V5-04: development regression `pnpm verify` PASS (158 unit/DOM, 12 prototype browser, 18 contract tests, build/assets); `pnpm verify:dsh` PASS (128 then-current DSH unit/DOM, 38 real-Harness browser tests, package/bundle/lifecycle/contracts/assets). This broad run began at b617b1a; the final delta removes only compact inset shadow and formats the new components, adds targeted tests and commits generated bundle. Its mandated HMR rebuilds used the updated source. Do not label the broad run an immutable final-head run: final-head affected checks are EVD-V5-01/02/03 and the independent exact-source/bundle review.
- Final bundle/package checks and character asset check PASS. Governance verifier and `git diff --check` PASS. Engine, Pack/thresholds, original car/companion assets, usage/progress paths and accepted authorities are unchanged from Base.

Final production bundle SHA256: `da607a3d5d0d3fb2932f9b7cd4915e7153c259b19b6b2d703f0b38a3a33bccd7`. Independent reviewer rebuilt it in memory and verified byte identity of bundle/sourcemap and all 64 embedded sources against the fixed candidate.

Pinned Harness: `f77b5a2fcebc2d9138f6608a60636f2294868d42`. Chrome 1440×900 and 390px narrow viewport. Disposable test homes: `/tmp/vehicle-pet-overlay-dsh-home-r1` on 3081 and `/tmp/vehicle-pet-overlay-v5-coexist-home` on 3086. Scripted mock LLM, no real model calls. Full summaries and raw local-log hashes: [verification.txt](overlay-v5/verification.txt).

Six `v5-*.png` images and three coexistence PNGs under `overlay-v5/` are unedited final-candidate browser captures. The coexistence filenames retain V4 names from the existing tests but depict V5. They establish the new surface's geometry, not absence of every pre-existing host/whale toast overlap. Static images establish appearance; temporal claims use executed DOM/browser assertions.

## Independent review

`authority_preflight_review`: source ACCEPT at b617b1a; final delta/bundle/authority ACCEPT at 286a7b9, blocker union empty. Final evidence and visual review receipts are appended after completion.

Production activation remains forbidden. Updating the existing disposable 3085 preview is separate from applying to the user's production profile.

Final visual receipt: `character_visual_review` independently viewed all six V5 captures and three coexistence captures and read final test logs. ACCEPT at 286a7b9; blocker count zero. Confirmed transparent car, four-item menu, legible speech/status/title, new surface separation from whale/input/send and unclipped footer at 390px. This does not certify the host's entire mobile layout or remove existing unrelated toasts.

Preview update: the existing disposable 3085 home was preserved, its local plugin link repointed from the V4 worktree to the V5 worktree through `dsh plugin --profile web add`, and its known read-only server restarted. Existing sessions and browser preferences are retained; no production profile or real model call was involved.
