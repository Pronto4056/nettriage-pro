import { expect, it } from 'vitest';
import { analyze } from '../src/diagnostics/engine';
import { readHistory, writeHistory } from '../src/lib/history';
import { renderToStaticMarkup } from 'react-dom/server';
import { DnsInput } from '../src/components/DnsInput';
const blank = { ip: '', mask: '', gateway: '', dns: '', notes: '' };
const dnsOutput =
  'Server: resolver.demo.invalid\nAddress: 192.0.2.53\nName: example.com\nAddress: 192.0.2.20';
it('analyzes DNS-only evidence without configuration', () => {
  const result = analyze({ ...blank, dnsOutput });
  expect(result.errors).toEqual({});
  expect(result.findings.some((f) => f.id === 'dns-answer')).toBe(true);
  expect(
    result.findings.find((f) => f.id === 'missing-evidence')?.evidence,
  ).not.toContain('DNS and application evidence were not');
});
it('rejects excessive DNS input at the engine boundary', () =>
  expect(
    analyze({ ...blank, dnsOutput: 'x'.repeat(20001) }).errors.dnsOutput,
  ).toBeTruthy());
it('retains DNS text through local storage and reanalysis', () => {
  let saved = '';
  writeHistory(
    {
      setItem: (_k, v) => {
        saved = v;
      },
    },
    [
      {
        id: 'dns',
        created: '2026-10-06T00:00:00Z',
        input: { ...blank, dnsOutput },
      },
    ],
  );
  const input = readHistory({ getItem: () => saved }).sessions[0].input;
  expect(input.dnsOutput).toBe(dnsOutput);
  expect(analyze(input).findings.some((f) => f.id === 'dns-answer')).toBe(true);
});
it.each([null, 42, {}, 'x'.repeat(20001)])(
  'reports malformed optional DNS history without overwrite',
  (dnsOutput) => {
    const stored = JSON.stringify({
      version: 1,
      sessions: [
        {
          id: 'dns',
          created: '2026-10-06T00:00:00Z',
          input: { ...blank, dnsOutput },
        },
      ],
    });
    expect(readHistory({ getItem: () => stored }).error).toBeTruthy();
  },
);
it('exposes labeled DNS input with length limit and privacy disclosure', () => {
  const html = renderToStaticMarkup(<DnsInput value="" onChange={() => {}} />);
  expect(html).toContain('for="dnsOutput"');
  expect(html).toContain('maxLength="20000"');
  expect(html).toContain('local history');
  expect(html).toContain('Simulated');
});
