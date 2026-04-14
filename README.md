# AI Decision Logging Specification

**Version 0.1.0 — Draft**

A standard format for tamper-evident AI decision logs, designed for compliance with EU AI Act Articles 12 and 19 and comparable regulatory frameworks.

Maintained by [CertifiedData](https://certifieddata.io).

**Reference implementation:** https://certifieddata.io  
**Repository:** https://github.com/certifieddata/ai-decision-logging-spec

---

## What This Is

This repository defines an open, implementation-agnostic specification for structured AI decision log records. It establishes:

- required and recommended log record fields
- hash chaining rules for tamper-evidence
- optional Ed25519 signature support
- audit trail export format for regulatory review
- retention requirements aligned to EU AI Act Article 19

It does not prescribe storage technology, transport protocol, or model architecture.

> This specification defines the **format and verification rules** only. It does not define implementation architecture, key management systems, or operational infrastructure used by any specific implementation. Any system that produces records conforming to the schemas and verification algorithms described here may claim conformance.

---

## Why It Exists

The EU AI Act requires high-risk AI systems to automatically generate tamper-evident logs (Article 12) and retain them for regulatory review (Article 19). The regulation does not define a log format.

This creates fragmented, incompatible implementations across vendors and organizations. This specification provides a shared baseline so that:

- deployers have a clear implementation target
- auditors can inspect logs from any conformant system
- vendors can build compatible tooling
- regulators have a published standard to reference

---

## The Specification

**→ [SPEC.md](SPEC.md)** — the canonical specification document

Sections:

1. Motivation
2. Scope
3. Terminology
4. Decision Record Format
5. Required Fields
6. Recommended Fields
7. Optional Fields
8. Hash Chaining
9. Signatures (Ed25519)
10. Audit Trail Export Format
11. Retention Requirements
12. Verification Procedures
13. Privacy Considerations
14. Conformance Levels (Core / Full)
15. References

---

## Quick Start

### Minimal conformant record (Level 1 — Core)

```json
{
  "decision_id": "6d8c0f0a-8e8f-4e5a-bba3-04f8f1cdb1e4",
  "timestamp": "2026-03-09T17:21:00Z",
  "schema_version": "0.1.0",
  "model_version": "my-model-v1.0",
  "decision_output": "APPROVED",
  "record_hash": "sha256:2dce29deee5d05d28399b4b4e85a9df4a8b5e6c7d8e9f0a1b2c3d4e5f6a7b8c9",
  "previous_hash": null
}
```

### Full record (Level 2 — Recommended fields)

See [examples/decision-record.example.json](examples/decision-record.example.json).

### Verify a hash chain

See [examples/verify-chain.js](examples/verify-chain.js).

---

## Schemas

| Schema | Description |
|--------|-------------|
| [schemas/decision-record.schema.json](schemas/decision-record.schema.json) | Single decision record |
| [schemas/audit-trail.schema.json](schemas/audit-trail.schema.json) | Full audit trail export |

---

## Conformance Levels

| Level | Requirements |
|-------|-------------|
| **Level 1 — Core** | Required fields + hash chaining |
| **Level 2 — Full** | All required + recommended fields + Ed25519 signatures + audit trail export |

See [SPEC.md §14](SPEC.md#14-conformance) for full conformance criteria.

---

## Implementations

See [implementations/README.md](implementations/README.md) for known implementations and integrations.

The CertifiedData platform is the reference implementation. It implements Level 2 (Full) conformance, including Ed25519 signing, hash-chained decision records, a publicly verifiable transparency log, and audit-vault archival with 7-year retention.

---

## Related

- **[CertifiedData.io](https://certifieddata.io)** — reference implementation; also maintains this specification
- **[SyntheticDataNews](https://syntheticdatanews.com)** — editorial coverage of AI governance and compliance

---

## Contributing

Issues and pull requests welcome.

- Schema corrections → use the [Schema feedback](/.github/ISSUE_TEMPLATE/schema-feedback.md) template
- Spec clarifications → use the [Spec feedback](/.github/ISSUE_TEMPLATE/spec-feedback.md) template
- Register an implementation → use the [Implementation registration](/.github/ISSUE_TEMPLATE/implementation-registration.md) template

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE).
