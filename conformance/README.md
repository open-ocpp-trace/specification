# Conformance

How to check an implementation against this repository, and the rules the
fixtures pin down. A JSON Schema tells you a record is shaped legally; these
fixtures tell you two implementations agree on what a trace means.

## What conformance means

A **producer** is conformant when the records it emits:

1. validate against [`../schema/trace-v1.schema.json`](../schema/trace-v1.schema.json);
2. carry the verbatim frame text in `raw` whenever the original bytes are
   available, and that text decodes to the same frame the record decomposes;
3. set `action` on every CALL, and, when setting the optional `action` on a
   CALLRESULT or CALLERROR, set it equal to the action of the CALL it
   correlates with;
4. keep extensions inside `meta`, never in undeclared top-level fields.

A **consumer** is conformant when it:

1. accepts any record that validates against the schema and ignores unknown
   fields (forward compatibility within a major version);
2. derives the consumer view defined below, reproducing each fixture's
   `expected.json` exactly.

## Correlation rule

A CALLRESULT or CALLERROR correlates with the most recent preceding CALL in
the trace that satisfies all three conditions:

1. same `messageId`;
2. opposite `direction`;
3. not already correlated with an earlier response.

A response with no such CALL is an **orphan response**. A CALL that no
response has correlated with by the end of the trace is an **unanswered
call**. The effective `action` of a correlated response is its CALL's
`action`; an orphan response has no effective action unless its record
carries one explicitly.

## The consumer view (`expected.json`)

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Schema version of the trace's records. |
| `counts.records` | Total records in the trace. |
| `counts.calls` / `counts.callResults` / `counts.callErrors` | Records per message type. |
| `records[]` | One entry per record, in trace order. |
| `records[].index` | Zero-based position in the trace. |
| `records[].messageType` | Echoed from the record. |
| `records[].messageId` | Echoed from the record. |
| `records[].action` | The effective action: explicit for a CALL, derived by correlation for a response. Absent when underivable. |
| `records[].correlatesWith` | For a correlated response, the index of its CALL. Absent otherwise. |
| `unansweredCalls` | Indexes of CALLs never correlated, ascending. |
| `orphanResponses` | Indexes of responses that correlate with nothing, ascending. |

Fields the view does not repeat (timestamps, payloads, directions, identity
fields) are covered by the schema and by the `raw` fidelity rule; the view
pins only what a consumer must compute.

## Checking an implementation

For each directory under [`../fixtures`](../fixtures): parse `trace.jsonl`
(one record per line), derive the consumer view, and compare it structurally
to `expected.json`. Any mismatch is a conformance failure. Producers can
additionally round-trip: emit a trace, feed it to a conformant consumer, and
confirm the view is what they intended.

## Checking this repository

```
npm ci
npm test
```

[`validate.mjs`](./validate.mjs) is the corpus self-check and the reference
consumer for the rules above. For every fixture it validates each record
against the schema, verifies `raw` decodes to the fields the record
decomposes, recomputes the consumer view with the correlation rule, and
requires an exact match with `expected.json`. CI runs it on every push and
pull request, so a fixture and its expected view cannot drift apart
unnoticed.
