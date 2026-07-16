# Fixtures

Reference traces in the Open OCPP Trace Format, each paired with the consumer
view a conformant implementation must derive from it.

Layout per fixture:

```
<name>/
  trace.jsonl     # the trace: one format record per line
  expected.json   # the consumer view derived from it (see ../conformance/README.md)
```

## Corpus

| Fixture | Records | Calls | Results | Errors | Unanswered | Situation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| [`normal-session`](./normal-session) | 22 | 11 | 11 | 0 | 0 | Complete charging session: boot, authorize, start transaction, meter values, stop transaction. |
| [`failed-auth`](./failed-auth) | 14 | 7 | 7 | 0 | 0 | Authorization rejected by the CSMS; no transaction is started. |
| [`connector-fault`](./connector-fault) | 20 | 10 | 10 | 0 | 0 | Connector faults mid-session; the transaction stops with a fault reason. |
| [`station-offline`](./station-offline) | 14 | 7 | 7 | 0 | 0 | Transaction starts but the trace ends with no StopTransaction. |
| [`unexpected-stop-reason`](./unexpected-stop-reason) | 18 | 9 | 9 | 0 | 0 | StopTransaction carries an unusual but legal stop reason. |
| [`meter-value-gap`](./meter-value-gap) | 16 | 8 | 8 | 0 | 0 | Transaction with no MeterValues between start and stop. |
| [`invalid-stop-reason`](./invalid-stop-reason) | 18 | 9 | 9 | 0 | 0 | StopTransaction carries a stop reason outside the OCPP 1.6 enumeration. |
| [`unexpected-start`](./unexpected-start) | 8 | 4 | 4 | 0 | 0 | StartTransaction with no preceding BootNotification or Authorize. |
| [`status-transition-violation`](./status-transition-violation) | 10 | 5 | 5 | 0 | 0 | Connector status jumps from Available directly to Finishing. |
| [`diagnostics-failure`](./diagnostics-failure) | 8 | 4 | 4 | 0 | 0 | DiagnosticsStatusNotification reports a failed diagnostics run. |
| [`slow-csms-response`](./slow-csms-response) | 4 | 2 | 2 | 0 | 0 | CSMS answers a BootNotification after a 15 second delay. |
| [`meter-anomaly`](./meter-anomaly) | 14 | 7 | 7 | 0 | 0 | Meter readings decrease during an active transaction. |
| [`short-session`](./short-session) | 12 | 6 | 6 | 0 | 0 | Full session lasting only a few seconds. |
| [`heartbeat-irregular`](./heartbeat-irregular) | 8 | 4 | 4 | 0 | 0 | Heartbeat cadence deviates from the interval the CSMS requested. |
| [`unresponsive-csms`](./unresponsive-csms) | 3 | 2 | 1 | 0 | 1 | BootNotification is never answered; a later Heartbeat is. |

## Provenance and properties

- All data is synthetic. Station identifiers, transaction ids, and idTag
  values are invented and carry no real-world information.
- The corpus was seeded from the OCPP DebugKit scenario suite (OCPP 1.6J),
  converted record by record into this format.
- Responses deliberately omit the optional `action` field, so a consumer must
  derive it by correlation to reproduce `expected.json`.
- `raw` is present on every record and decodes to exactly the frame the
  record decomposes.
- `connectorId` is populated on requests whose OCPP 1.6 payload carries a
  top-level `connectorId`.

## Known coverage gaps

Contributions are welcome for what this corpus does not yet exercise:

- CALLERROR records (the `error` object rules are specified but uncovered)
- `messageId` reuse within one trace
- traces spanning multiple charge points
- OCPP 2.0.1 sessions
- SOAP transport records
- malformed frames, once their representation is settled in the specification
