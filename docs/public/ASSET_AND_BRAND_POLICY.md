# Asset and Brand Policy

Status: Public Preview documentation, current as of the DSH_PET_OVERLAY_ADAPTER_V8 authority. This is an IP-hygiene / release-readiness policy, **not** a legal opinion.

## Brand rule (V8 DEC-OVERLAY-027 / CTR-039)

The default product identity of the bundled pets and of every current
user-facing and distributed surface (runtime, WebP and PNG fallbacks,
total-failure fallback, collapsed state, menu naming, current README and
quickstart screenshots, built client bundle, package projection) binds **no
third-party company brand**. Asset-failure fallbacks show the selected pet's
own name or accessible description.

## Historical truth is preserved

Provenance records, historical Specs, investigations, evidence, and factual
interoperability descriptions keep their real content — including references
to the project's earlier branded-prototype period.
`HISTORICAL_REFERENCE != CURRENT_PRODUCT_IDENTITY`: nothing is erased or
falsified to look brand-neutral, and current identity is kept clearly
separate from historical evidence in inventories.

## Shipping-art rules (V8 CTR-042)

- Current shipping base character art carries no baked third-party brand
  text or logo, and no baked UI-style level numerals or labels.
- Fleet-scale meaning is expressed through representative population,
  spatial scale, environment, silhouette, or declarative metadata.
- Insignia accessibility titles are metadata, not visible marks; they are
  not affected by the numeral rule.
- Brand-neutral corrections replace shipped masters through the
  Owner-designated offline art route with recorded provenance and
  deterministic conversion. CSS-only masking of branded masters is forbidden.
- Runtime and build never call a generative model.

## Current-art inventory

`CURRENT_SHIPPING_ASSET_INVENTORY_CHECK` and regenerated contact sheets
cover: runtime vehicle assets, runtime companion assets, the orb fixture
assets, insignia, expression layers, generated PNG/WebP, masters consumed by
build, public README/docs screenshots, and bundle-inlined assets — each
classified for visible brand, visible numeral, provenance, and
runtime-vs-historical shipping.

## License — DECIDED (2026-09-11): Apache-2.0 (code) + CC BY 4.0 (assets)

The Owner selected the packet's recommended OPTION_B:

- **CODE** (source, build scripts, tests, code documentation): **Apache-2.0** — see `LICENSE` and the `license` field in `package.json`.
- **ORIGINAL_PROJECT_ASSETS** (bundled pet data, artwork, insignia, copy that the owner owns or can license): **CC BY 4.0** — see `LICENSE.assets`.
- **THIRD_PARTY / HISTORICAL EVIDENCE**: **not relicensed** by these notices. Third-party trademarks and logos (including DeepSeek and Pony.ai), third-party works and interfaces, third-party screenshots inside historical evidence, and any material cited in provenance records but not owned by the project keep their owners' rights; they are retained only for interoperability, historical record, or audit evidence.
- **AI-assisted assets**: CC BY 4.0 is granted only to the extent of the owner's actual rights; the license statements make no broader or exclusive-rights claims. Provenance records disclose the production route.
- `NOTICE` carries the attribution and third-party exclusions required by Apache-2.0 §4(d) distribution.

The decision packet (options, trade-offs) remains in
`docs/investigations/GOAL_OPEN_LICENSE_PACKET.md` for the record. Third-party
creators keep ownership of their own pet data and set their pet's
license/attribution metadata in their `definition.ts` and `LICENSE`.

This policy is an IP-hygiene / release-readiness statement, **not** a legal opinion.

## Third-party pet contributions

A creator pet is the creator's own data. The metadata contract
(`license`/`attribution`/`provenance` in the presentation definition plus the
pet's `LICENSE` file) travels with the pet. Contributions must satisfy the
brand and art rules above; AI-assisted assets are expected to say so honestly
in their provenance record.
