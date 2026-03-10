# Changelog

Spec versions follow [Semantic Versioning](https://semver.org/).

---

## v0.1.0 — 2026-03-10

Initial draft release.

**Specification (SPEC.md)**

- Required fields: `decision_id`, `timestamp`, `schema_version`, `model_version`, `decision_output`, `record_hash`, `previous_hash`
- Recommended fields: `policy_version`, `session_id`, `input_reference`, `confidence_score`, `human_oversight_flag`, `artifact_certificate_id`, `operator_id`, `why`
- Optional fields: `factors`, `system_id`, `jurisdiction`, `sterilized`, `signature`
- Hash chaining: SHA-256, RFC 8785 canonicalization, null previous_hash for genesis records
- Signature: Ed25519 (RFC 8032), JWKS public key publication
- Audit trail export format: ordered decisions array + chain_integrity summary + optional export-level signature
- Retention: 6-month minimum for EU AI Act Article 19; sector-specific guidance included
- Verification procedures: single record, chain, and audit trail export
- Privacy considerations: no PII in public records, `why` field for right to explanation
- Conformance levels: Level 1 (Core) and Level 2 (Full)

**Schemas**

- `schemas/decision-record.schema.json` — JSON Schema draft 2020-12 for single decision record
- `schemas/audit-trail.schema.json` — JSON Schema draft 2020-12 for audit trail export

**Examples**

- `examples/decision-record.example.json` — Level 2 conformant record
- `examples/audit-trail-export.example.json` — Level 2 conformant export with two-record chain
- `examples/verify-chain.js` — Node.js hash chain verification script

**Supporting files**

- `implementations/README.md` — implementation registry
- `CONTRIBUTING.md` — contribution guidelines
- `CITATION.cff` — structured citation metadata
- Issue templates: spec feedback, schema feedback, implementation registration
