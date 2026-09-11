# GOAL_OPEN_LICENSE_PACKET — code/asset licensing decision packet

Status: investigation (non-authoritative). `LICENSE_SELECTION = OWNER_DECISION_REQUIRED`. This packet makes NO decision; it exists so the Owner can close `OWNER_LICENSE_DECISION_GATE` with one reply. Nothing in this Goal depends on the choice: all technical work proceeds and the Goal may pause only at this gate.

## OPTION_A — MIT (code) + CC BY 4.0 (assets), split licensing

- Exact files to land: `LICENSE` (MIT), `LICENSE.assets` or per-pack
  `LICENSE` (CC BY 4.0), `package.json` `"license": "MIT"` + a note field,
  policy doc update, creator template LICENSE text.
- Trade-offs: simplest possible permissive story; CC BY requires attribution
  (provenance metadata contract already carries it). Maximal reuse freedom;
  no patent grant.

## OPTION_B — Apache-2.0 (code) + CC BY 4.0 (assets) — RECOMMENDED

- Exact files to land: `LICENSE` (Apache-2.0 full text), `NOTICE` (attribution
  + provenance pointers), `package.json` `"license": "Apache-2.0"`,
  `docs/public/ASSET_AND_BRAND_POLICY.md` update, creator template update.
- Trade-offs: explicit patent grant matters for a framework others may build
  on; slightly longer license text; still fully permissive for preview
  distribution. Assets stay CC BY 4.0 so art attribution (including honest
  AI-assisted provenance notes) travels with the art.

## OPTION_C — MIT (code) + CC BY-NC 4.0 (assets)

- Exact files: as OPTION_A with NC asset license.
- Trade-offs: non-commercial restriction protects the art but poisons reuse
  (many downstream uses become ambiguous), which conflicts with the
  creator-framework purpose. Listed for completeness; not recommended.

## RECOMMENDATION

**OPTION_B** (Apache-2.0 + CC BY 4.0, code/assets split): the framework wants
a patent grant; the art wants attribution with provenance; the split keeps
the two stories honest. One Owner reply ("B") lands the whole packet.

## Gates this does NOT decide

No npm publication, no GitHub Release, no announcement, no visibility change
— each remains a separate Owner gate per the Goal dispatch.
