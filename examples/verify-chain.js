/**
 * verify-chain.js
 *
 * Verifies the hash chain integrity of an AI Decision Logging Specification
 * audit trail export.
 *
 * Implements the verification procedure from SPEC.md §12.
 *
 * No dependencies — uses only Node.js built-ins.
 *
 * Usage:
 *   node verify-chain.js audit-trail-export.example.json
 *   node verify-chain.js path/to/your/export.json
 */

const crypto = require("crypto");
const fs = require("fs");

// ─── Canonicalization (RFC 8785 simplified) ──────────────────────────────────
//
// Full RFC 8785 requires recursive sorted-key serialization.
// This implementation handles the common case: flat and one-level-deep objects.
// For production use, consider a dedicated RFC 8785 library.

function canonicalize(obj) {
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalize).join(",") + "]";
  }
  if (obj !== null && typeof obj === "object") {
    const sorted = Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
      .join(",");
    return "{" + sorted + "}";
  }
  return JSON.stringify(obj);
}

function sha256(str) {
  return "sha256:" + crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

// ─── Single record verification ───────────────────────────────────────────────

function verifyRecord(record) {
  // Remove signature before hashing (per SPEC.md §8.1)
  const { signature, record_hash, ...body } = record;

  // Also exclude _comment if present (not part of spec, just example annotation)
  delete body._comment;

  const canonical = canonicalize(body);
  const computed = sha256(canonical);

  if (computed !== record_hash) {
    return {
      ok: false,
      decision_id: record.decision_id,
      reason: `record_hash mismatch — expected ${record_hash}, computed ${computed}`,
    };
  }

  return { ok: true, decision_id: record.decision_id, record_hash };
}

// ─── Chain verification ───────────────────────────────────────────────────────

function verifyChain(decisions) {
  const results = [];

  for (let i = 0; i < decisions.length; i++) {
    const record = decisions[i];

    // Verify individual record hash
    const recordResult = verifyRecord(record);
    if (!recordResult.ok) {
      results.push({ index: i, ...recordResult });
      continue;
    }

    // Verify chain linkage
    if (i === 0) {
      if (record.previous_hash !== null) {
        results.push({
          index: i,
          ok: false,
          decision_id: record.decision_id,
          reason: `genesis record must have previous_hash: null, got ${record.previous_hash}`,
        });
        continue;
      }
    } else {
      const expectedPrev = decisions[i - 1].record_hash;
      if (record.previous_hash !== expectedPrev) {
        results.push({
          index: i,
          ok: false,
          decision_id: record.decision_id,
          reason: `chain break — expected previous_hash ${expectedPrev}, got ${record.previous_hash}`,
        });
        continue;
      }
    }

    results.push({ index: i, ok: true, decision_id: record.decision_id });
  }

  return results;
}

// ─── Audit trail export verification ─────────────────────────────────────────

function verifyAuditTrail(exportObj) {
  console.log("═".repeat(60));
  console.log("AI Decision Logging Spec — Chain Verification");
  console.log("Spec version:", exportObj.schema_version ?? "(missing)");
  console.log("Audit trail:", exportObj.audit_trail_id);
  console.log("Period:", exportObj.period?.from, "→", exportObj.period?.to);
  console.log("Total records:", exportObj.total_decisions ?? exportObj.decisions?.length);
  console.log("─".repeat(60));

  const decisions = exportObj.decisions ?? [];

  if (decisions.length === 0) {
    console.log("⚠ No decision records found.");
    return;
  }

  // Verify total_decisions matches array length
  if (exportObj.total_decisions !== undefined && exportObj.total_decisions !== decisions.length) {
    console.error(`❌ total_decisions (${exportObj.total_decisions}) does not match decisions array length (${decisions.length})`);
  }

  // Verify chain
  const results = verifyChain(decisions);

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.ok) {
      console.log(`✅ [${r.index}] ${r.decision_id}`);
      passed++;
    } else {
      console.error(`❌ [${r.index}] ${r.decision_id}: ${r.reason}`);
      failed++;
    }
  }

  // Verify chain_integrity summary
  if (exportObj.chain_integrity) {
    const ci = exportObj.chain_integrity;
    const actualFirst = decisions[0]?.record_hash;
    const actualLast = decisions[decisions.length - 1]?.record_hash;

    if (ci.first_record_hash && ci.first_record_hash !== actualFirst) {
      console.error(`❌ chain_integrity.first_record_hash mismatch`);
      failed++;
    }
    if (ci.last_record_hash && ci.last_record_hash !== actualLast) {
      console.error(`❌ chain_integrity.last_record_hash mismatch`);
      failed++;
    }
  }

  console.log("─".repeat(60));
  console.log(`Result: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("✅ Chain intact — audit trail has not been altered.");
  } else {
    console.error("❌ Chain broken — audit trail may have been altered.");
    process.exit(1);
  }

  // Note: Ed25519 signature verification requires the issuer public key.
  // Fetch from exportObj.integrity.public_key_url and verify using Node.js
  // crypto.createVerify("ed25519") against the canonical export body.
  if (exportObj.integrity?.signature) {
    console.log("ℹ Signature present — Ed25519 signature verification not performed in this example.");
    console.log("  Key URL:", exportObj.integrity.public_key_url ?? "(not specified)");
  }

  console.log("═".repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const filePath = process.argv[2] ?? "./audit-trail-export.example.json";

try {
  const raw = fs.readFileSync(filePath, "utf8");
  const exportObj = JSON.parse(raw);
  verifyAuditTrail(exportObj);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
