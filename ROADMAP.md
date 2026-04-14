# Roadmap

This document describes the planned evolution of the AI Decision Logging Specification. All items are subject to change based on community feedback and regulatory developments.

---

## Current: v0.1.0 (Released March 2026)

**Scope:** Core decision record format + hash chaining + Ed25519 signatures + audit trail export

Key capabilities:
- Required and optional field definitions (SPEC.md §4–5)
- SHA-256 hash chaining algorithm (SPEC.md §7)
- Ed25519 signature scheme with RFC 8785 canonicalization (SPEC.md §8)
- Audit trail export format (SPEC.md §9)
- Level 1 (Core) and Level 2 (Full) conformance levels (SPEC.md §12)
- Retention guidance for EU AI Act alignment (SPEC.md §10)
- Privacy / sterilization support (SPEC.md §11)

---

## Planned: v0.2.0

**Theme:** Conformance tooling and extensibility

| Item | Status | Notes |
|------|--------|-------|
| Community conformance test suite | Planned | Reference test vectors for Level 1 and Level 2 |
| `extensions` field in decision record | Draft | Namespaced extensions without breaking core schema |
| Streaming / NDJSON audit trail format | Under discussion | For high-volume operational logging |
| Batch record hashing guidance | Under discussion | For systems that log thousands of decisions per second |
| Additional language bindings for verify-chain | Planned | Python, Go in addition to Node.js |

**Target:** Q3 2026

---

## Planned: v0.3.0

**Theme:** Multi-system and federated audit trails

| Item | Status | Notes |
|------|--------|-------|
| Cross-system audit trail linkage | Planned | For pipelines spanning multiple AI systems |
| Human review record type | Under discussion | Capture human-in-the-loop decisions in the same chain |
| Redaction specification | Under discussion | Formal rules for sterilizing PII while preserving chain integrity |
| `jurisdiction` field enumeration | Planned | Currently free-form string; may add recommended values |

**Target:** Q1 2027

---

## Planned: v1.0.0

**Theme:** Stability and post-quantum readiness

| Item | Status | Notes |
|------|--------|-------|
| Stable API freeze | Planned | No breaking changes after v1.0 without major version bump |
| Post-quantum signature algorithm | Research | NIST PQC finalists (ML-DSA/Dilithium) as optional alternative to Ed25519 |
| Formal conformance certification program | Under discussion | Third-party certification against v1.0 conformance suite |
| ISO/IEC submission | Under discussion | Explore standardization pathway |

**Target:** 2027

---

## Deferred / Won't Do (v0.x)

| Item | Rationale |
|------|-----------|
| Blockchain anchoring | Out of scope for core spec; can be implemented as extension |
| Algorithm agility (multiple sig algorithms) | Complexity outweighs benefit at this stage |
| API transport definition | Left to implementors; avoids prescribing infrastructure |
| Key management requirements | Implementor choice; see SPEC.md §8.3 |

---

## How to Influence the Roadmap

Open an issue at https://github.com/certifieddata/ai-decision-logging-spec with the label `roadmap`. Provide:
- The use case you're trying to solve
- Current workaround (if any)
- Proposed change or extension

Roadmap decisions are made via the governance process in [GOVERNANCE.md](GOVERNANCE.md).
