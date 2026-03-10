# AI Decision Logging Specification

**Version:** 0.1.0
**Status:** Draft
**Published:** 2026-03-10
**Maintained by:** [SyntheticDataNews](https://syntheticdatanews.com)
**Repository:** https://github.com/synthetic-data-news/ai-decision-logging-spec

---

## Abstract

This specification defines a standard format for tamper-evident AI decision logs. It establishes required and optional fields, hash chaining rules, signature requirements, and audit trail export structure for AI systems subject to logging obligations under the EU AI Act and comparable regulatory frameworks.

The goal is a minimal, implementable format that satisfies Article 12 (automatic logging) and Article 19 (log retention) of the EU AI Act without prescribing implementation technology.

---

## Status of This Document

This document is a **Draft specification**. It has not been submitted to a standards body. Feedback is welcome via GitHub Issues.

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Scope](#2-scope)
3. [Terminology](#3-terminology)
4. [Decision Record Format](#4-decision-record-format)
5. [Required Fields](#5-required-fields)
6. [Recommended Fields](#6-recommended-fields)
7. [Optional Fields](#7-optional-fields)
8. [Hash Chaining](#8-hash-chaining)
9. [Signatures](#9-signatures)
10. [Audit Trail Export Format](#10-audit-trail-export-format)
11. [Retention Requirements](#11-retention-requirements)
12. [Verification Procedures](#12-verification-procedures)
13. [Privacy Considerations](#13-privacy-considerations)
14. [Conformance](#14-conformance)
15. [References](#15-references)

---

## 1. Motivation

The EU AI Act Article 12 requires that high-risk AI systems automatically log system events in a way that enables post-hoc reconstruction of decisions. The regulation does not prescribe a specific log format.

This leaves organizations implementing compliant AI systems without a shared technical baseline. The absence of a common format creates:

- incompatible audit trail structures across vendors
- difficulty for regulators and auditors inspecting logs from different systems
- repeated re-invention of hash chaining and signature schemes
- uncertainty about what fields constitute a "sufficient" log record

This specification addresses all four problems by defining a minimal, open, implementation-agnostic log format.

---

## 2. Scope

This specification covers:

- the structure of individual AI decision log records
- hash chaining rules for tamper-evidence
- optional signature fields for cryptographic integrity proofs
- the structure of audit trail exports (sequences of decision records)
- retention and availability requirements

This specification does **not** cover:

- the internal operation of AI models
- how input data is stored or referenced
- transport protocols for log delivery
- storage backends or database schemas
- the content of the `why` field beyond structural requirements

---

## 3. Terminology

**Decision record** — a structured log entry capturing a single AI system decision event.

**Audit trail** — an ordered, tamper-evident sequence of decision records covering a defined time period.

**Hash chain** — a sequence of records where each record includes the cryptographic hash of the previous record, making retroactive modification detectable.

**Genesis record** — the first record in a hash chain. Its `previous_hash` field is `null`.

**Sterilized record** — a decision record in which sensitive input fields have been redacted or summarized for public or regulatory export, while preserving the structural integrity of the chain.

**Artifact certificate** — a signed record attesting to the provenance and integrity of an AI artifact such as a training dataset or model checkpoint. See [AI Artifact Certificate Specification](https://syntheticdatanews.com/synthetic-data/certification).

**Deployer** — an organization that operates a high-risk AI system in a production environment. Corresponds to "deployer" in EU AI Act Article 3(4).

**Provider** — an organization that develops and places a high-risk AI system on the market. Corresponds to "provider" in EU AI Act Article 3(3).

---

## 4. Decision Record Format

A decision record is a **JSON object**. All field names are lowercase with underscores. Field values MUST conform to the types specified in Section 5–7.

Records MUST be serialized as valid JSON per [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259).

Records MUST be canonicalized using [RFC 8785 (JSON Canonicalization Scheme)](https://www.rfc-editor.org/rfc/rfc8785) before hashing or signing.

---

## 5. Required Fields

The following fields MUST be present in every decision record.

### `decision_id`

- **Type:** string (UUID v4)
- **Description:** A globally unique identifier for this decision event. MUST be a valid UUID v4.
- **Example:** `"6d8c0f0a-8e8f-4e5a-bba3-04f8f1cdb1e4"`

### `timestamp`

- **Type:** string (ISO 8601 date-time with timezone)
- **Description:** The UTC timestamp of the decision event. MUST include timezone offset. SHOULD be UTC (`Z`).
- **Example:** `"2026-03-09T17:21:00Z"`

### `schema_version`

- **Type:** string (semver)
- **Description:** The version of this specification used to produce the record. Enables forward compatibility.
- **Example:** `"0.1.0"`

### `model_version`

- **Type:** string
- **Description:** A version identifier for the model or system that produced this decision. Format is implementation-defined but MUST be stable and deterministic (i.e., the same model version always produces the same identifier).
- **Example:** `"anomaly-detector-v1.4"`

### `decision_output`

- **Type:** string
- **Description:** The output, classification, recommendation, or action produced by the AI system for this event. MUST be human-readable. MUST NOT contain personally identifiable information in public or sterilized records.
- **Example:** `"APPROVED"`, `"HIGH_RISK"`, `"NORMAL"`

### `record_hash`

- **Type:** string (format: `sha256:<64 hex chars>`)
- **Description:** The SHA-256 hash of this record's canonical form (RFC 8785), computed after all other fields are set. The `signature` field MUST be excluded from the canonical body used for hashing.
- **Example:** `"sha256:2dce29deee5d05d28399b4b4e85a9df4a8b5e6c7d8e9f0a1b2c3d4e5f6a7b8c9"`

### `previous_hash`

- **Type:** string (same format as `record_hash`) | `null`
- **Description:** The `record_hash` of the immediately preceding record in the chain. MUST be `null` for genesis records. MUST match the `record_hash` of the prior record exactly.
- **Example:** `"sha256:605f6b4cc9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7"`

---

## 6. Recommended Fields

The following fields SHOULD be present in decision records for high-risk AI systems subject to EU AI Act obligations.

### `policy_version`

- **Type:** string
- **Description:** The version of the business rule set, policy document, or operational configuration active at the time of the decision.
- **Example:** `"ops-policy-v2.1"`

### `session_id`

- **Type:** string
- **Description:** An identifier grouping related decision events within a single operational session or batch run.
- **Example:** `"sess-20260309-prod-7f4a"`

### `input_reference`

- **Type:** string
- **Description:** A reference to the input that triggered this decision. MAY be a hash, an opaque identifier, or a summary. MUST NOT be the full input content in public records. SHOULD be sufficient to reconstruct the input in a controlled audit context.
- **Example:** `"sha256:a3f1...batch-20260309T172000Z"`

### `confidence_score`

- **Type:** number (0.0–1.0)
- **Description:** The model's confidence in the decision output, if the model produces a probability or confidence value.
- **Example:** `0.97`

### `human_oversight_flag`

- **Type:** boolean
- **Description:** Whether a human reviewed, approved, or overrode this decision before it was acted upon.
- **Example:** `false`

### `artifact_certificate_id`

- **Type:** string (UUID v4)
- **Description:** The `certificate_id` of the certified artifact (e.g., training dataset) associated with this decision. Links this decision record to the artifact certification chain.
- **Example:** `"233805c1-a1b2-4c3d-8e9f-0a1b2c3d4e5f"`

### `operator_id`

- **Type:** string
- **Description:** An identifier for the deployer or operator responsible for this AI system. SHOULD be stable across records from the same deployer.
- **Example:** `"org-acme-prod"`

### `why`

- **Type:** string
- **Description:** A human-readable explanation or rationale summary for this decision. SHOULD be concise (1–3 sentences). MAY be sterilized or summarized for public records. Supports GDPR Article 22 right to explanation and EU AI Act transparency requirements.
- **Example:** `"Score within normal seasonal range. No anomalous signals detected."`

---

## 7. Optional Fields

The following fields MAY be included.

### `factors`

- **Type:** array of strings
- **Description:** Structured list of signals or features that contributed to this decision.
- **Example:** `["seasonality_adjusted", "no_latency_spike", "anomaly_score_0.03"]`

### `system_id`

- **Type:** string
- **Description:** Identifier for the AI system or deployment context. Useful when multiple systems share a log store.

### `jurisdiction`

- **Type:** string (ISO 3166-1 alpha-2 country code or `"EU"`)
- **Description:** The regulatory jurisdiction under which this log record was created. Informs retention and access rules.
- **Example:** `"EU"`, `"DE"`, `"US"`

### `signature`

- **Type:** string (base64url-encoded Ed25519 signature)
- **Description:** An Ed25519 signature over the canonical record body (RFC 8785, excluding the `signature` field). If present, the signing key MUST be published at a stable well-known URL. See Section 9.

---

## 8. Hash Chaining

Hash chaining creates a tamper-evident sequence of decision records. Any modification to a prior record invalidates the hash chain from that point forward, making unauthorized alteration detectable during audit.

### 8.1 Chain Construction

Records MUST be appended in chronological order. For each record:

1. Populate all fields except `record_hash` and (optionally) `signature`.
2. Set `previous_hash` to the `record_hash` of the immediately preceding record. For the first record (genesis), set `previous_hash` to `null`.
3. Serialize the record body to canonical JSON (RFC 8785).
4. Compute `record_hash = "sha256:" + hex(SHA-256(canonical_body))`.
5. Optionally compute and set `signature` (see Section 9).

### 8.2 Chain Verification

To verify a chain:

1. For each record in order, recompute the canonical form and verify `record_hash` matches.
2. Verify that each record's `previous_hash` equals the `record_hash` of the preceding record.
3. Verify that the genesis record has `previous_hash: null`.

A chain is **intact** if all hashes verify. A chain is **broken** if any hash does not match — this indicates alteration or corruption at or after the failing record.

### 8.3 Chain Segments and Gaps

If a log store is partitioned (e.g., by day or by session), each segment MAY form its own chain. Segment boundaries SHOULD be documented. Cross-segment continuity MAY be maintained by including the last hash of the prior segment as the `previous_hash` of the first record in the next segment.

---

## 9. Signatures

Per-record signatures provide a stronger integrity guarantee than hash chaining alone, because they can be verified without access to the full chain.

### 9.1 Algorithm

Implementations using signatures MUST use **Ed25519** (RFC 8032). Other algorithms MUST NOT be used.

### 9.2 Canonical Body

The signed body is the canonical JSON (RFC 8785) of the record object with the `signature` field excluded.

### 9.3 Public Key Publication

If signatures are used, the signing key MUST be published at a stable, publicly accessible URL in a format compatible with [JWKS (RFC 7517)](https://datatracker.ietf.org/doc/html/rfc7517). The URL SHOULD follow the pattern:

```
https://{authority}/.well-known/signing-keys.json
```

### 9.4 Key Rotation

Signing keys SHOULD be rotated periodically. All previously issued signatures remain verifiable against the key that signed them. Historical public keys MUST be retained indefinitely with their validity periods documented.

---

## 10. Audit Trail Export Format

An audit trail is an ordered collection of decision records covering a defined time period, packaged for regulatory export or audit review.

### 10.1 Structure

An audit trail export is a JSON object with the following fields:

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `audit_trail_id` | REQUIRED | UUID | Unique identifier for this export |
| `schema_version` | REQUIRED | semver string | Spec version used |
| `created_at` | REQUIRED | ISO 8601 | When this export was generated |
| `period.from` | REQUIRED | ISO 8601 | Start of audit period (inclusive) |
| `period.to` | REQUIRED | ISO 8601 | End of audit period (inclusive) |
| `system_id` | RECOMMENDED | string | AI system identifier |
| `operator_id` | RECOMMENDED | string | Deployer identifier |
| `model_version` | RECOMMENDED | string | Model version during this period |
| `artifact_certificate_id` | RECOMMENDED | UUID | Primary certified artifact reference |
| `total_decisions` | RECOMMENDED | integer | Count of records in `decisions` array |
| `decisions` | REQUIRED | array | Ordered decision records |
| `chain_integrity.first_record_hash` | RECOMMENDED | sha256 string | Hash of first record |
| `chain_integrity.last_record_hash` | RECOMMENDED | sha256 string | Hash of last record |
| `chain_integrity.chain_verified` | RECOMMENDED | boolean | Whether chain was verified at export |
| `integrity.signature_algorithm` | REQUIRED if signed | `"Ed25519"` | Algorithm used to sign the export |
| `integrity.public_key_url` | REQUIRED if signed | URI | Signing key URL |
| `integrity.signature` | REQUIRED if signed | base64url string | Signature over canonical export body |

### 10.2 Export Signature

When an audit trail export is signed, the signed body is the canonical JSON (RFC 8785) of the export object with `integrity.signature` excluded.

### 10.3 Sterilized Exports

Public or externally shared exports MAY omit or summarize sensitive fields (`input_reference`, `factors`) in individual records. The structural integrity of the hash chain MUST be preserved in sterilized exports. Sterilized records MUST include a `sterilized: true` boolean field.

---

## 11. Retention Requirements

### 11.1 Minimum Retention Period

Deployers of high-risk AI systems subject to EU AI Act Article 19 MUST retain logs for a minimum of **six months** from the date of each record.

### 11.2 Sector-Specific Requirements

Sector regulations may impose longer retention periods. Implementations SHOULD support configurable retention windows:

| Sector | Recommended Retention |
|--------|----------------------|
| General high-risk AI | 6 months minimum |
| Financial services (MiFID, DORA) | 5–7 years |
| Healthcare (MDR) | Up to 15 years |
| Critical infrastructure | Per national requirements |

### 11.3 Availability

Retained logs MUST be available for export within a reasonable timeframe upon request from a competent regulatory authority. SHOULD be producible within 5 business days for routine requests.

### 11.4 Integrity During Retention

Logs MUST be stored in a manner that preserves hash chain integrity. Any storage system that permits modification of existing records without detection is non-compliant.

---

## 12. Verification Procedures

### 12.1 Single Record Verification

To verify a single record:

1. Obtain the record JSON.
2. Remove the `signature` field (if present).
3. Serialize to canonical form (RFC 8785).
4. Compute `SHA-256(canonical_form)`.
5. Verify the result matches `record_hash`.
6. If `signature` is present, verify against the issuer's public key.

### 12.2 Chain Verification

To verify a full chain:

1. Verify each record individually (Step 12.1).
2. For each record after the genesis, verify `previous_hash` matches `record_hash` of the prior record.
3. Verify the genesis record has `previous_hash: null`.

### 12.3 Audit Trail Export Verification

To verify an audit trail export:

1. If `integrity.signature` is present, verify the export-level signature.
2. Verify `total_decisions` matches the length of the `decisions` array.
3. Verify the full record chain (Step 12.2).
4. Verify `chain_integrity.first_record_hash` and `chain_integrity.last_record_hash` match the actual first and last record hashes.

---

## 13. Privacy Considerations

### 13.1 Input Data

Decision records MUST NOT contain raw personal data in the `input_reference` field or any other field. Input references SHOULD be opaque identifiers or hashes.

### 13.2 Output Data

`decision_output` MUST NOT identify an individual directly. Where outputs are tied to individuals in internal systems, the linkage SHOULD be maintained externally and not embedded in the log record.

### 13.3 GDPR Interaction

Decision records themselves are not personal data under GDPR, provided they contain no directly identifying information. However, where decision records are linkable to individuals (e.g., via `session_id`), GDPR obligations apply to the complete linked dataset.

### 13.4 Right to Explanation

The `why` field supports compliance with GDPR Article 22 (automated decision-making) and EU AI Act Article 13 (transparency). Implementations SHOULD populate this field for all decisions that may affect individuals.

---

## 14. Conformance

An implementation is **conformant** with this specification if it:

1. Produces decision records that include all Required fields (Section 5) with values matching the specified types and formats.
2. Implements hash chaining per Section 8.
3. Produces audit trail exports matching the structure in Section 10.
4. Retains logs for the minimum period specified in Section 11.

An implementation MAY claim conformance at one of two levels:

- **Level 1 — Core**: Required fields + hash chaining only.
- **Level 2 — Full**: All required and recommended fields + signatures + audit trail export.

---

## 15. References

- [EU AI Act, Article 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — Logging requirements for high-risk AI systems
- [EU AI Act, Article 19](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — Log retention obligations
- [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) — Key words for use in RFCs
- [RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517) — JSON Web Key (JWK)
- [RFC 8032](https://datatracker.ietf.org/doc/html/rfc8032) — Edwards-Curve Digital Signature Algorithm (EdDSA) — Ed25519
- [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) — The JavaScript Object Notation (JSON) Data Interchange Format
- [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) — JSON Canonicalization Scheme (JCS)
- [AI Governance Knowledge Repository](https://github.com/synthetic-data-news/ai-governance-knowledge) — Related reference material
- [SyntheticDataNews — Decision Logging](https://syntheticdatanews.com/ai-governance/decision-logging)
- [SyntheticDataNews — AI Audit Trails](https://syntheticdatanews.com/ai-governance/audit-trails)

---

*Maintained by [SyntheticDataNews](https://syntheticdatanews.com). Feedback welcome via [GitHub Issues](https://github.com/synthetic-data-news/ai-decision-logging-spec/issues).*
