# Open OCPP Trace Format — Specification

An implementation-independent, versioned JSON/JSONL format for recording OCPP
message exchanges — a shared contract between tools that produce OCPP traffic
(simulators, proxies, charging stations, CSMS implementations) and tools that
consume it (analyzers, debuggers, CI pipelines, reproducible bug reports).

This repository is neutral ground: the format lives here so that no single
project's release cadence or roadmap governs it.

## Repository layout

| Path | Contents |
| --- | --- |
| [`schema/`](./schema) | The machine-readable record schema (major version 1, currently v1.1). |
| [`fixtures/`](./fixtures) | Reference traces, each with the consumer view a conformant implementation derives from it. |
| [`conformance/`](./conformance) | What conformance means for producers and consumers, and the corpus self-check. |

## Validating the corpus

```
npm ci
npm test
```

The self-check validates every fixture record against the schema, verifies
`raw` fidelity, and recomputes each fixture's expected consumer view. CI runs
it on every push and pull request.

The format's current definition (v1.1) was designed in
[shiv3/ocpp-cp-simulator#188](https://github.com/shiv3/ocpp-cp-simulator/issues/188);
its prose specification lives in that repository's `docs/trace-format.md`
until it migrates here.
