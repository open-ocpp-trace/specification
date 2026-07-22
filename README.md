# Open OCPP Trace Format — Specification

An implementation-independent, versioned JSON/JSONL format for recording OCPP
message exchanges — a shared contract between tools that produce OCPP traffic
(simulators, proxies, charging stations, CSMS implementations) and tools that
consume it (analyzers, debuggers, CI pipelines, reproducible bug reports).

This repository is neutral ground: the format lives here so that no single
project's release cadence or roadmap governs it.

## License

- Specification text (this README and the prose in `docs/`) is licensed under
  CC-BY-4.0 (`LICENSE-docs`).
- The schema, fixtures, and conformance tests are licensed under Apache-2.0
  (`LICENSE`).

Contributions are accepted under the Developer Certificate of Origin; see
[`CONTRIBUTING.md`](CONTRIBUTING.md). The rationale for this split is recorded
in [ADR-0001](docs/adr/0001-licensing.md).
