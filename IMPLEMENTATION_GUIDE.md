# Implementation Guide

This guide walks implementors through building a conformant AI Decision Logging system. It covers the critical path from a minimal Level 1 implementation to a full Level 2 system with signing and audit trail export.

---

## Prerequisites

- Familiarity with SHA-256 hashing
- Familiarity with JSON
- For Level 2: Ed25519 key pair generation and signing

Libraries used in examples: Node.js built-ins (`crypto`, `fs`). The same operations are available in Python (`hashlib`, `cryptography`), Go (`crypto/sha256`, `crypto/ed25519`), and most other runtimes.

---

## Step 1: Define Your Decision Record Structure

A minimal Level 1 conformant record requires these fields (see [SPEC.md §4](SPEC.md)):

```json
{
  "decision_id": "6d8c0f0a-8e8f-4e5a-bba3-04f8f1cdb1e4",
  "timestamp": "2026-03-09T17:21:00Z",
  "schema_version": "0.1.0",
  "model_version": "my-model-v1.0",
  "decision_output": "APPROVED",
  "record_hash": "sha256:<hex>",
  "previous_hash": "sha256:<hex> | null"
}
```

Capture these values at decision time, before computing the record hash.

---

## Step 2: Compute the Record Hash

The `record_hash` is the SHA-256 hash of the canonical (RFC 8785 JCS) serialization of the record body **excluding** the `record_hash` field itself.

```javascript
const crypto = require("crypto");

function computeRecordHash(record) {
  // Exclude record_hash from the body being hashed
  const { record_hash, signature, ...body } = record;

  // Canonical serialization: keys in sorted order (RFC 8785 JCS)
  const canonical = JSON.stringify(body, Object.keys(body).sort());

  return "sha256:" + crypto.createHash("sha256").update(canonical).digest("hex");
}
```

**Important:** The canonical form uses sorted keys at all nesting levels. For deeply nested objects, apply the sort recursively or use a JCS library.

---

## Step 3: Implement Hash Chaining

Each record's `previous_hash` must be the `record_hash` of the immediately preceding record in the session or audit trail. The first record in a chain sets `previous_hash` to `null`.

```javascript
function buildChain(decisions) {
  let previousHash = null;

  return decisions.map((decision) => {
    const record = {
      ...decision,
      previous_hash: previousHash,
    };

    record.record_hash = computeRecordHash(record);
    previousHash = record.record_hash;

    return record;
  });
}
```

This creates a tamper-evident chain: modifying any record invalidates all subsequent hashes.

---

## Step 4: Verify Chain Integrity

To verify a chain of records:

```javascript
function verifyChain(records) {
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Verify record hash
    const computed = computeRecordHash(record);
    if (computed !== record.record_hash) {
      throw new Error(`Record ${i} hash mismatch: ${record.decision_id}`);
    }

    // Verify chain linkage
    if (i > 0) {
      const expectedPrevious = records[i - 1].record_hash;
      if (record.previous_hash !== expectedPrevious) {
        throw new Error(`Record ${i} previous_hash mismatch: ${record.decision_id}`);
      }
    } else {
      if (record.previous_hash !== null) {
        throw new Error(`First record must have previous_hash: null`);
      }
    }
  }

  return true;
}
```

See [examples/verify-chain.js](examples/verify-chain.js) for the complete reference implementation.

---

## Step 5: Add Ed25519 Signatures (Level 2)

For Level 2 conformance, each record must be signed with an Ed25519 private key. The signature covers the canonical body excluding the `signature` field.

### Key Generation (one-time setup)

```javascript
const { generateKeyPairSync } = require("crypto");

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
```

Store the private key securely (HSM or cloud KMS in production). Publish the public key at a well-known URL (e.g., `/.well-known/signing-keys.json`).

### Signing a Record

```javascript
function signRecord(record, privateKeyPem) {
  const { signature, ...body } = record;
  const canonical = JSON.stringify(body, Object.keys(body).sort());

  const sign = crypto.createSign("ed25519");
  sign.update(canonical);
  return sign.sign(privateKeyPem, "base64url");
}
```

Attach the result as `record.signature`.

### Verifying a Signature

```javascript
function verifySignature(record, publicKeyPem) {
  const { signature, ...body } = record;
  const canonical = JSON.stringify(body, Object.keys(body).sort());

  const verify = crypto.createVerify("ed25519");
  verify.update(canonical);
  return verify.verify(publicKeyPem, Buffer.from(signature, "base64url"));
}
```

---

## Step 6: Build Audit Trail Export

An audit trail export bundles a time-bounded set of decision records with chain integrity metadata and an export-level signature.

See [schemas/audit-trail.schema.json](schemas/audit-trail.schema.json) for the full schema and [examples/audit-trail-export.example.json](examples/audit-trail-export.example.json) for a complete example.

Minimum required fields for the export envelope:

```json
{
  "audit_trail_id": "<uuid>",
  "schema_version": "0.1.0",
  "created_at": "<ISO 8601>",
  "period": { "from": "<ISO 8601>", "to": "<ISO 8601>" },
  "system_id": "your-system-id",
  "operator_id": "your-org-id",
  "model_version": "your-model-version",
  "total_decisions": 100,
  "decisions": [ /* ... array of decision records ... */ ],
  "chain_integrity": {
    "first_record_hash": "sha256:...",
    "last_record_hash": "sha256:...",
    "chain_verified": true,
    "verification_timestamp": "<ISO 8601>"
  }
}
```

---

## Step 7: Handle Privacy (Sterilization)

If a decision record contains PII that must be redacted before export, set `"sterilized": true` on the record and replace sensitive field values with a hash or placeholder.

**Important:** The `record_hash` must be computed from the **original** (unsterilized) body. This means the hash of a sterilized record cannot be independently verified by a recipient who only has the sterilized version — this is intentional. The hash chain's integrity can still be verified end-to-end by the system that holds the original records.

Document your sterilization policy in your system's privacy documentation.

---

## Common Pitfalls

| Pitfall | Correct Approach |
|---------|-----------------|
| Sorting only top-level keys | Sort keys at all nesting levels for JCS compliance |
| Including `record_hash` in the hash computation | Always exclude `record_hash` and `signature` before hashing |
| Using wall-clock time for chain ordering | Use record insertion order, not timestamp order |
| Storing private keys in application config | Use HSM or cloud KMS in production |
| Generating UUID v4 `decision_id` in the wrong scope | Generate per-decision, not per-session |

---

## Conformance Checklist

### Level 1 (Core)
- [ ] All required fields present (SPEC.md §4)
- [ ] `decision_id` is a valid UUID
- [ ] `timestamp` is ISO 8601 with timezone
- [ ] `record_hash` is `sha256:<64 hex chars>`
- [ ] `record_hash` is computed from canonical body excluding `record_hash`
- [ ] `previous_hash` is `null` for first record, or matches preceding `record_hash`
- [ ] Chain verifies end-to-end with no gaps

### Level 2 (Full)
- [ ] All Level 1 requirements met
- [ ] `signature` is base64url-encoded Ed25519 over canonical body
- [ ] `public_key_url` is accessible and returns JWKS
- [ ] Audit trail export schema is valid per `schemas/audit-trail.schema.json`
- [ ] Export-level signature covers canonical export body

---

## Further Reading

- [SPEC.md](SPEC.md) — Full specification
- [GOVERNANCE.md](GOVERNANCE.md) — How to contribute or propose changes
- [ROADMAP.md](ROADMAP.md) — What's coming next
- [REFERENCE_IMPLEMENTATIONS.md](REFERENCE_IMPLEMENTATIONS.md) — Known implementations
- [CertifiedData.io](https://certifieddata.io) — Reference implementation and specification maintainer
