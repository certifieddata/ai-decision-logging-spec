# Contributing

Contributions to the AI Decision Logging Specification are welcome.

---

## Types of Contributions

### Specification Feedback

If you believe a field definition, normative requirement, or algorithm description is incorrect, unclear, or incomplete, open an issue using the **Spec feedback** template.

When proposing a change to normative language (MUST, SHOULD, MAY), please include:

- the specific SPEC.md section and line
- the existing text
- proposed replacement text
- rationale, including any regulatory or technical basis

### Schema Corrections

If a JSON Schema field type, pattern, or description is incorrect, open an issue using the **Schema feedback** template.

### Implementation Registration

If you have implemented this specification in a library, platform, or service, open an issue using the **Implementation registration** template to be listed in [implementations/README.md](implementations/README.md).

### Pull Requests

Pull requests are welcome for:

- corrections to factual errors
- improvements to examples
- new example implementations in additional languages
- typo and grammar fixes

Pull requests that change normative language in SPEC.md will be reviewed carefully. Significant normative changes will be discussed as issues before merging.

---

## Versioning

This specification follows [Semantic Versioning](https://semver.org/):

- **Patch** (`0.1.x`) — corrections, clarifications, non-normative changes
- **Minor** (`0.x.0`) — backward-compatible additions (new optional fields, new examples)
- **Major** (`x.0.0`) — breaking changes to required fields, hash algorithm, or wire format

All changes are recorded in [CHANGELOG.md](CHANGELOG.md).

---

## Code of Conduct

Be direct and technical. Focus on the specification, not the person.
