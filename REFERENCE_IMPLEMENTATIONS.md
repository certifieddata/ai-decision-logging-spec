# Reference Implementations

This document lists known implementations of the AI Decision Logging Specification. Inclusion here does not constitute endorsement; it indicates that the implementation has self-reported conformance or has been independently verified against the specification.

---

## Conformance Levels

| Level | Name | Requirements |
|-------|------|--------------|
| Level 1 | Core | Required fields, SHA-256 hash chaining, record integrity |
| Level 2 | Full | Level 1 + Ed25519 signatures, audit trail export, artifact certificate linkage |

See [SPEC.md](SPEC.md) §14 for full conformance criteria.

---

## Verified Implementations

### CertifiedData
- **URL:** https://certifieddata.io
- **Conformance:** Level 2 (Full)
- **Verification:** Self-reported; independent audit pending
- **Notes:** Reference implementation and specification maintainer. Implements:
  - Ed25519 per-record signing via `certificate_signing_keys` (public keys published at `/.well-known/signing-keys.json`)
  - Hash-chained `decision_records` with `record_hash`, `previous_hash`, and `canonical_payload`
  - Parallel public chain in `public_decision_log` for redacted / public-safe record exports
  - Periodic signed integrity anchors in `log_checkpoints`
  - Artifact certification via `certificates` and `certificate_transparency_log`
  - Audit-vault archival in `audit_vault_records` with 7-year retention

---

## Registering an Implementation

To register your implementation:

1. Open an issue using the [Implementation Registration template](.github/ISSUE_TEMPLATE/implementation-registration.md)
2. Provide:
   - Implementation name and URL
   - Claimed conformance level (Level 1 or Level 2)
   - Evidence of conformance (test suite results, independent audit, or self-assessment)
   - Contact email for verification questions
3. Maintainers will review and add to this document upon verification

---

## Conformance Test Suite

A community conformance test suite is planned for v0.2.0. See [ROADMAP.md](ROADMAP.md) for timeline.

Until then, implementors may use the examples in [examples/](examples/) as reference test vectors.

---

## Implementation Notes

### Key Management
The specification does not mandate any key management system. Implementors are free to use:
- Hardware security modules (HSMs)
- Cloud KMS (AWS KMS, Google Cloud KMS, Azure Key Vault)
- Software key stores
- Certificate authority infrastructure

### Storage
The specification does not mandate a storage layer. Decision records may be stored in:
- Relational databases
- Document stores
- Append-only logs
- Distributed ledgers

### Transport
The specification does not define an API transport layer. Audit trail exports may be delivered via:
- REST API
- File download (JSON)
- Streaming (NDJSON)
- Message queues

---

*To propose changes to this document, open a pull request or issue at https://github.com/certifieddata/ai-decision-logging-spec.*
