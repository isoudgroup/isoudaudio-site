# Product naming registry

Public model pattern: S-CATEGORY-NNN. OH = over-ear, SP = sports, OE = open-ear, SR = smart ring. Numbers increment independently within a category, are permanent, and are never reused. Colors, packaging and size are variant fields, not new base model codes. New categories require a unique registered two-letter code.

| Original model (internal) | Public code |
|---|---|
| SY-T7 | S-OH-001 |
| SY-23 | S-OH-002 |
| G1 | S-SP-001 |
| YS032-HD | S-SP-002 |
| M162 | S-OE-001 |
| M113 | S-OE-002 |
| M129 | S-OE-003 |
| HK03 | S-SR-001 |

Maintain content/site/products.mjs: model is public; sourceModel and assetKey preserve provenance and asset lookup. Existing slugs stay stable to preserve indexed URLs. All cards, details, image alt, titles, structured product data and inquiry presets derive from the public model. Original models must not reappear in public copy.

The editable user ledger is /Users/jackmini/Desktop/isoud产品命名对照表.xlsx. Append to its ProductRegistry table; do not regenerate over user additions. Check unique codes and source mapping before release. Workbook edits do not automatically deploy the website. Sync this ledger and source together for each added model.

The browser favicon embeds the original approved assets/preview/logo.png without redrawing the mark. Its versioned URL avoids the prior generic i icon cache.

## Added 2026-10-24

IE = In-Ear; CH = Communication Headset; EM = Electronic Earmuffs. Codes describe categories, not certification.

| Original reference | Public code | Notes |
|---|---|---|
| Burgundy over-ear dossier, no original model | S-OH-003 | Colors remain variants |
| Black and yellow-green AVIF headset references | S-CH-001 | Visual family only; exact hardware/model equivalence unconfirmed |
| Digital display wireless earbuds graphic and screenshot | S-IE-001 | Two references for one product |
| M30 electronic earmuff graphic | S-EM-001 | Do not copy NRR24 or 120 mm driver claim as verified |

Next available: S-OH-004, S-SP-003, S-OE-004, S-SR-002, S-IE-002, S-CH-002, S-EM-002. Check the live ledger again before allocating. Supplied data and prompt provenance are in ../materials/new-products-2026-10-24.
