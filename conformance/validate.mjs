// Corpus self-check for the Open OCPP Trace fixtures.
//
// This script is the reference consumer for the format's derivation rules:
// it validates every fixture record against the JSON Schema, checks the
// invariants the schema alone cannot express (raw fidelity, action
// consistency), recomputes the consumer view from trace.jsonl using the
// correlation rule in conformance/README.md, and requires it to match
// expected.json exactly.
//
// Usage: npm test   (or: node conformance/validate.mjs)

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schema', 'trace-v1.schema.json'), 'utf8'));

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateRecord = ajv.compile(schema);

const MESSAGE_TYPE = { 2: 'CALL', 3: 'CALLRESULT', 4: 'CALLERROR' };

let failures = 0;
function problem(fixture, message) {
  failures += 1;
  console.error(`FAIL ${fixture}: ${message}`);
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
}

// The normative correlation rule: a CALLRESULT or CALLERROR correlates with
// the most recent preceding CALL that has the same messageId, travels in the
// opposite direction, and is not yet answered.
function buildConsumerView(records) {
  const view = records.map((r, index) => {
    const entry = { index, messageType: r.messageType, messageId: r.messageId };
    if (r.messageType === 'CALL') entry.action = r.action;
    return entry;
  });
  const answered = new Set();
  const orphanResponses = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.messageType === 'CALL') continue;
    let match = -1;
    for (let j = i - 1; j >= 0; j--) {
      const c = records[j];
      if (
        c.messageType === 'CALL' &&
        c.messageId === r.messageId &&
        c.direction !== r.direction &&
        !answered.has(j)
      ) {
        match = j;
        break;
      }
    }
    if (match === -1) {
      orphanResponses.push(i);
    } else {
      answered.add(match);
      view[i].action = records[match].action;
      view[i].correlatesWith = match;
    }
  }
  const unansweredCalls = records
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => r.messageType === 'CALL' && !answered.has(i))
    .map(({ i }) => i);
  const counts = {
    records: records.length,
    calls: records.filter((r) => r.messageType === 'CALL').length,
    callResults: records.filter((r) => r.messageType === 'CALLRESULT').length,
    callErrors: records.filter((r) => r.messageType === 'CALLERROR').length,
  };
  return {
    schemaVersion: records[0]?.schemaVersion ?? 'unknown',
    counts,
    records: view,
    unansweredCalls,
    orphanResponses,
  };
}

function checkRawFidelity(fixture, record, line) {
  if (record.raw === undefined) return;
  let frame;
  try {
    frame = JSON.parse(record.raw);
  } catch {
    problem(fixture, `line ${line}: raw is present but does not parse as JSON`);
    return;
  }
  if (!Array.isArray(frame)) {
    problem(fixture, `line ${line}: raw does not decode to an OCPP-J array`);
    return;
  }
  if (MESSAGE_TYPE[frame[0]] !== record.messageType) {
    problem(fixture, `line ${line}: raw frame kind ${frame[0]} contradicts messageType ${record.messageType}`);
  }
  if (record.messageId !== undefined && frame[1] !== record.messageId) {
    problem(fixture, `line ${line}: raw messageId contradicts record messageId`);
  }
  if (record.messageType === 'CALL') {
    if (frame[2] !== record.action) {
      problem(fixture, `line ${line}: raw action contradicts record action`);
    }
    if (record.payload !== undefined && !deepEqual(frame[3], record.payload)) {
      problem(fixture, `line ${line}: raw payload contradicts record payload`);
    }
  } else if (record.messageType === 'CALLRESULT') {
    if (record.payload !== undefined && !deepEqual(frame[2], record.payload)) {
      problem(fixture, `line ${line}: raw payload contradicts record payload`);
    }
  } else if (record.messageType === 'CALLERROR') {
    if (record.error?.code !== undefined && frame[2] !== record.error.code) {
      problem(fixture, `line ${line}: raw error code contradicts record error.code`);
    }
    if (record.error?.description !== undefined && frame[3] !== record.error.description) {
      problem(fixture, `line ${line}: raw error description contradicts record error.description`);
    }
    if (record.error?.details !== undefined && !deepEqual(frame[4], record.error.details)) {
      problem(fixture, `line ${line}: raw error details contradicts record error.details`);
    }
  }
}

const fixturesDir = join(root, 'fixtures');
const fixtureNames = readdirSync(fixturesDir).filter((name) =>
  statSync(join(fixturesDir, name)).isDirectory(),
);

if (fixtureNames.length === 0) {
  console.error('FAIL: no fixtures found');
  process.exit(1);
}

for (const name of fixtureNames.sort()) {
  const problemsBefore = failures;
  const dir = join(fixturesDir, name);
  const lines = readFileSync(join(dir, 'trace.jsonl'), 'utf8').split('\n').filter(Boolean);
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'));

  const records = [];
  lines.forEach((text, i) => {
    let record;
    try {
      record = JSON.parse(text);
    } catch {
      problem(name, `line ${i + 1}: not valid JSON`);
      return;
    }
    if (!validateRecord(record)) {
      problem(name, `line ${i + 1}: schema violation ${ajv.errorsText(validateRecord.errors)}`);
    }
    checkRawFidelity(name, record, i + 1);
    records.push(record);
  });

  const view = buildConsumerView(records);

  // A response that carries its own action must agree with its correlated CALL.
  view.records.forEach((entry, i) => {
    const own = records[i]?.action;
    if (entry.correlatesWith !== undefined && own !== undefined && own !== entry.action) {
      problem(name, `record ${i}: explicit action ${own} contradicts correlated CALL action ${entry.action}`);
    }
  });

  if (!deepEqual(view, expected)) {
    problem(name, 'recomputed consumer view does not match expected.json');
  }

  if (failures === problemsBefore) {
    console.log(`ok ${name} (${view.counts.records} records, ${view.unansweredCalls.length} unanswered, ${view.orphanResponses.length} orphans)`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found`);
  process.exit(1);
}
console.log(`\nall ${fixtureNames.length} fixtures conform`);
