# ADR-0001: Licensing

## Status

Accepted. Proposed by juherr (issue #1), endorsed by sepehr-safari
(2026-07-16), confirmed by shiv3 (2026-07-19).

## Context

This repository mixes two kinds of artifact that call for different licenses:
specification text (prose and semantics) and machine-readable, code-like
artifacts (the JSON Schema, the fixtures, and the conformance tests). Without a
license the default is all-rights-reserved, which blocks the adoption a
vendor-neutral format depends on: tool maintainers cannot safely read,
implement, redistribute, or build on it. The decision has to be recorded before
anything stable is published, because relicensing later needs the consent of
every contributor.

## Decision

- Specification text (prose, semantics): CC-BY-4.0.
- Schemas, fixtures, and conformance tests (machine-readable): Apache-2.0.
- Contributions: Developer Certificate of Origin (DCO), signalled by a
  `Signed-off-by` line on each commit. No CLA.

## Consequences

- Implementers can read, implement, redistribute, and build on the format under
  well-understood terms.
- Apache-2.0 carries an explicit patent grant, the right default for artifacts
  that multiple independent parties implement against. CC-BY-4.0 has no patent
  grant, but everything actually implementable (the schema, fixtures, and tests)
  is under Apache-2.0, so the combination covers the realistic risk without the
  extra process of a purpose-built specification license.
- DCO keeps contribution lightweight: no legal entity or signed agreement is
  required, which fits an organization that is deliberately not a legal entity.
- The licenses are recorded in `LICENSE` (Apache-2.0) and `LICENSE-docs`
  (CC-BY-4.0), and pointed at from the README. `CONTRIBUTING.md` documents the
  DCO sign-off. SPDX identifiers are added to the schema and conformance files
  where practical; that lands together with those files.
