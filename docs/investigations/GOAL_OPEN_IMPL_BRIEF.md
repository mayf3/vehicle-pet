# GOAL_OPEN_IMPL_BRIEF — Goal「开放」implementation change brief (non-authoritative)

```text
ROUTE_STAGE = IMPLEMENTATION (V8 accepted in base d77008a, implementation_authority: contracts)
AUTHORITY_ACTION = REUSE (DSH_PET_OVERLAY_ADAPTER_V8@d77008a; ENGINE_V4, PD_V1, USAGE_PROGRESS_SOURCE_V2 carried)
PLAN_LEVEL = EXEC_PLAN
ASSURANCE_LEVEL = DURABLE
WRITE_SURFACE = $HOME/workspace/project/vehicle-pet-open-impl (branch open/impl-v8, fresh from d77008a)
```

## Goal

Implement V8 §17: brand-neutral identity, declarative bundled pet presentations over declarative journeys, decoupled grade presentation — ending at READY_FOR_PUBLIC_PREVIEW per dispatch §23 minus the Owner license gate.

## Gap

Active code still hard-codes two pets (CharacterId union, CHARACTER_DEFINITIONS, COMPANION_POSES, BEHAVIOR_PROFILES, per-character speech JSON, fixed menu, `resolveDshProductPackId` constant default, unknown-id→vehicle coercion, fixed crop tables in `generate-character-assets.mjs`), brands the product Pony.ai in three code seams plus baked masters, and ships no creator kit / current docs / license packet.

## Slices (each ends verify-green)

1. **Generic pet presentation registry**: `PetPresentationDefinition` (recipe vocabulary fixed: `engine-scene | pose-sprite`; pet facts = data); vehicle + companion migrated as reference implementations; `PetId = string`; preference fail-soft to documented default; dynamic user-selectable menu; behavior profiles + speech + levels move into per-pet data. No behavior change for existing pets.
2. **Brand-neutral + grade policy code**: grade caption loses brand text and shows per-policy content (default: description only; exact number per policy + always in DOM a11y + Full Journey); total-failure fallback shows the pet's own name; insignia per policy (`wearable` for companion reference, `none` allowed); `PUBLIC_BRAND_RUNTIME_CHECK` / `PUBLIC_BRAND_FALLBACK_CHECK` / `LEVEL_PRESENTATION_POLICY_CHECK` / `PREFERENCE_MIGRATION_CHECK` / `DYNAMIC_CHARACTER_REGISTRY_CHECK` contract tests.
3. **Multi-pack journeys + third-pet path**: generic data-only pack authoring (pack dirs discovered/wired at build time; creators never edit build scripts); fixture pet (`orb-fixture`-class, distinct id + visual identity, own journey pack with own thresholds/stage names/scenes) + `examples/` creator template + `validate/preview/build` tooling + `THIRD_PARTY_NO_CORE_EDIT_ACCEPTANCE` + `PET_DEFINITION_SCHEMA_CHECK` / unknown-field / bad-asset fail checks + engine-bundles presents declared user-selectable pets (seedling stays internal).
4. **Public docs + hygiene**: README rewritten current; `docs/creator/GETTING_STARTED.md`, `docs/creator/PET_DEFINITION_REFERENCE.md`, `docs/public/PRIVACY_AND_DATA_BOUNDARY.md`, `docs/public/ASSET_AND_BRAND_POLICY.md`, `docs/public/SUPPORTED_ENVIRONMENTS.md`; `README_CURRENTNESS_CHECK` (bounded assertions, no full-text snapshot); `PACKAGE_PUBLIC_HYGIENE_CHECK`; sanitized-evidence convention; LICENSE options packet (`docs/investigations/GOAL_OPEN_LICENSE_PACKET.md`) — NO license decision.
5. **Art**: brand-neutral regeneration of both characters' shipping masters via the Owner-designated ChatGPT sidebar route (bounded wait if unavailable; goal does not stop), deterministic conversion, provenance, regenerated contact sheets + current-art inventory (`CURRENT_SHIPPING_ASSET_INVENTORY_CHECK`); scale text re-expressed via population/environment per CTR-042.
6. **Verification + audits**: full `pnpm verify` + `pnpm verify:dsh`; disposable-DSH lifecycle; three independent audits (code/architecture, creator experience, visual/public hygiene) → ONE blocker union → ONE fix round → ONE re-audit → conformance record → merge → clean-room fixed-ref verification.

## Stop boundary

READY_FOR_PUBLIC_PREVIEW, or a real Owner gate (dispatch §24 OWNER_GATE_REASONS; expected: `OWNER_LICENSE_DECISION_GATE`). PRODUCTION_APPLY_ALLOWED = NO. Token economy, thresholds, usage seam, growth data: untouched.

## Expansion trigger

Any engine Contract change requirement → RE_PREFLIGHT against ENGINE_V4 (per preflight I2 contingency).
