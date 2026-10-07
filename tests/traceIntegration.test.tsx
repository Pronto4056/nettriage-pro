import { expect, it } from 'vitest';
import { analyze } from '../src/diagnostics/engine';
import { readHistory, writeHistory } from '../src/lib/history';
import { renderToStaticMarkup } from 'react-dom/server';
import { TraceInput } from '../src/components/TraceInput';
import { TraceTable } from '../src/components/TraceTable';
const blank = { ip: '', mask: '', gateway: '', dns: '', notes: '' };
const traceOutput =
  'traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets\n1 192.0.2.1 1 ms * *\n2 1.1.1.1 12 ms 13 ms 12 ms';
it('analyzes trace-only input without requiring interface fields', () => {
  const result = analyze({ ...blank, traceOutput });
  expect(result.errors).toEqual({});
  expect(result.trace?.reached).toBe(true);
  expect(result.findings.some((f) => f.id === 'trace-destination')).toBe(true);
  expect(
    result.findings.find((f) => f.id === 'missing-evidence')?.evidence,
  ).not.toContain('traceroute evidence were not');
});
it('rejects excessive trace output at the engine boundary', () =>
  expect(
    analyze({ ...blank, traceOutput: 'x'.repeat(20001) }).errors.traceOutput,
  ).toBeTruthy());
it('retains raw trace input across history reopening', () => {
  let stored = '';
  writeHistory(
    {
      setItem: (_k, v) => {
        stored = v;
      },
    },
    [
      {
        id: 'trace',
        created: '2026-10-06T00:00:00Z',
        input: { ...blank, traceOutput },
      },
    ],
  );
  const input = readHistory({ getItem: () => stored }).sessions[0].input;
  expect(input.traceOutput).toBe(traceOutput);
  expect(analyze(input).trace?.reached).toBe(true);
});
it.each([null, 42, {}, 'x'.repeat(20001)])(
  'preserves unreadable history with malformed optional trace input',
  (traceOutput) => {
    const stored = JSON.stringify({
      version: 1,
      sessions: [
        {
          id: 'trace',
          created: '2026-10-06T00:00:00Z',
          input: { ...blank, traceOutput },
        },
      ],
    });
    expect(readHistory({ getItem: () => stored }).error).toBeTruthy();
  },
);
it('labels bounded trace input and discloses local persistence', () => {
  const html = renderToStaticMarkup(
    <TraceInput value="" onChange={() => {}} />,
  );
  expect(html).toContain('for="traceOutput"');
  expect(html).toContain('maxLength="20000"');
  expect(html).toContain('local history');
  expect(html).toContain('Simulated');
});
it('presents responder facts in a semantic table without calling stars loss', () => {
  const trace = analyze({ ...blank, traceOutput }).trace!;
  const html = renderToStaticMarkup(<TraceTable trace={trace} />);
  expect(html).toContain('<caption>');
  expect(html).toContain('scope="col"');
  expect(html).toContain('192.0.2.1');
  expect(html).toContain('Silent probes');
  expect(html).not.toContain('packet loss');
});
