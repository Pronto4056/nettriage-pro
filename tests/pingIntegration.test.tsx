import { expect, it } from 'vitest';
import { analyze } from '../src/diagnostics/engine';
import { readHistory, writeHistory } from '../src/lib/history';
import { renderToStaticMarkup } from 'react-dom/server';
import { PingInput } from '../src/components/PingInput';
import { Findings } from '../src/components/Findings';
const blank = { ip: '', mask: '', gateway: '', dns: '', notes: '' };
const pingOutput =
  'Pinging 1.1.1.1 with 32 bytes of data:\nReply from 1.1.1.1: bytes=32 time=12ms TTL=57\nPing statistics for 1.1.1.1:\nPackets: Sent = 1, Received = 1, Lost = 0 (0% loss),';
it('analyzes evidence without requiring interface configuration', () => {
  const result = analyze({ ...blank, pingOutput });
  expect(result.errors).toEqual({});
  expect(result.findings.some((f) => f.id === 'ping-replies-0')).toBe(true);
  expect(
    result.findings.find((f) => f.id === 'missing-evidence')?.evidence,
  ).not.toContain('No command-output');
  expect(renderToStaticMarkup(<Findings result={result} />)).toContain(
    'Evidence analyzed',
  );
});
it('rejects excessive evidence at the engine boundary', () => {
  expect(
    analyze({ ...blank, pingOutput: 'x'.repeat(20001) }).errors.pingOutput,
  ).toBeTruthy();
});
it('persists and reopens pasted evidence', () => {
  let stored = '';
  writeHistory(
    {
      setItem: (_k, v) => {
        stored = v;
      },
    },
    [
      {
        id: 'a',
        created: '2026-10-06T00:00:00Z',
        input: { ...blank, pingOutput },
      },
    ],
  );
  const session = readHistory({ getItem: () => stored }).sessions[0];
  expect(session.input.pingOutput).toBe(pingOutput);
  expect(
    analyze(session.input).findings.some((f) => f.id === 'ping-replies-0'),
  ).toBe(true);
});
it.each([null, 42, {}, 'x'.repeat(20001)])(
  'preserves malformed history without feeding invalid optional evidence to the parser',
  (pingOutput) => {
    const raw = JSON.stringify({
      version: 1,
      sessions: [
        {
          id: 'a',
          created: '2026-10-06T00:00:00Z',
          input: { ...blank, pingOutput },
        },
      ],
    });
    expect(readHistory({ getItem: () => raw }).error).toBeTruthy();
  },
);
it('provides labeled evidence input and discloses browser-local storage', () => {
  const html = renderToStaticMarkup(<PingInput value="" onChange={() => {}} />);
  expect(html).toContain('for="pingOutput"');
  expect(html).toContain('maxLength="20000"');
  expect(html).toContain('local history');
  expect(html).toContain('Simulated');
});
