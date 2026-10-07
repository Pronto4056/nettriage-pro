import { expect, it } from 'vitest';
import { analyze } from '../src/diagnostics/engine';
import { pingExamples } from '../src/components/PingInput';
import { dnsExamples } from '../src/components/DnsInput';
import { traceExamples } from '../src/components/TraceInput';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Findings } from '../src/components/Findings';
const config = {
  ip: '192.168.1.42',
  mask: '/24',
  gateway: '192.168.1.1',
  dns: '192.0.2.53',
  notes: '',
};
it.each([
  ['pingOutput', pingExamples.replies, 'ping-replies-0'],
  ['dnsOutput', dnsExamples.answer, 'dns-answer'],
  ['traceOutput', traceExamples.reached, 'trace-destination'],
] as const)(
  'excludes rejected %s even when trimming would fit the parser limit',
  (field, output, finding) => {
    const result = analyze({
      ...config,
      pingOutput: pingExamples.replies,
      dnsOutput: dnsExamples.answer,
      traceOutput: traceExamples.reached,
      [field]: ' '.repeat(20001) + output,
    });
    expect(result.errors[field]).toBeTruthy();
    expect(result.findings.some((f) => f.id === finding)).toBe(false);
    expect(result.findings.some((f) => f.id === 'configuration-invalid')).toBe(
      false,
    );
    expect(result.findings.some((f) => f.id === 'input-invalid')).toBe(true);
  },
);
it('retains usable command observations when configuration is invalid', () => {
  const result = analyze({
    ...config,
    ip: 'bad',
    pingOutput: pingExamples.replies,
    dnsOutput: dnsExamples.answer,
    traceOutput: traceExamples.reached,
  });
  expect(result.errors.ip).toBeTruthy();
  expect(result.network).toBeUndefined();
  for (const id of [
    'ping-replies-0',
    'dns-answer',
    'trace-destination',
    'configuration-invalid',
  ])
    expect(result.findings.some((f) => f.id === id)).toBe(true);
  expect(renderToStaticMarkup(createElement(Findings, { result }))).toContain(
    'Observed trace',
  );
});
it('combines successful observations without declaring complete health', () => {
  const result = analyze({
    ...config,
    pingOutput: pingExamples.replies,
    dnsOutput: dnsExamples.answer,
    traceOutput: traceExamples.reached,
  });
  expect(result.errors).toEqual({});
  for (const id of [
    'configuration',
    'ping-replies-0',
    'dns-answer',
    'trace-destination',
    'missing-evidence',
  ])
    expect(result.findings.some((f) => f.id === id)).toBe(true);
  expect(
    result.findings.find((f) => f.id === 'missing-evidence')?.confidence,
  ).toBe('Insufficient Evidence');
  expect(
    result.findings.some((f) =>
      /internet is working|network healthy/i.test(f.title),
    ),
  ).toBe(false);
});
it('keeps failed gateway probes inconclusive about offline status', () => {
  const pingOutput =
    'Pinging 192.168.1.1 with 32 bytes of data:\nRequest timed out.\nPing statistics for 192.168.1.1:\nPackets: Sent = 1, Received = 0, Lost = 1 (100% loss),';
  const result = analyze({ ...config, pingOutput });
  expect(
    result.findings.find((f) => f.id === 'ping-no-replies-0')?.evidence,
  ).toContain('supplied gateway');
  expect(result.findings.map((f) => f.title).join(' ')).not.toMatch(
    /offline|gateway failure/i,
  );
});
it('reports sampled failures without diagnosing complete connectivity loss', () => {
  const result = analyze({
    ...config,
    pingOutput:
      'Pinging 1.1.1.1 with 32 bytes of data:\nRequest timed out.\nPing statistics for 1.1.1.1:\nPackets: Sent = 1, Received = 0, Lost = 1 (100% loss),',
    dnsOutput: dnsExamples.timeout,
    traceOutput: traceExamples.bounded,
  });
  for (const id of ['ping-no-replies-0', 'dns-timeout', 'trace-not-seen'])
    expect(result.findings.some((f) => f.id === id)).toBe(true);
  expect(result.findings.some((f) => f.id === 'dns-versus-ping')).toBe(false);
});
it('does not elevate notes over measured samples', () => {
  const result = analyze({
    ...config,
    pingOutput: pingExamples.replies,
    notes: 'All hosts are offline and the router failed.',
  });
  expect(result.findings.some((f) => f.id === 'ping-replies-0')).toBe(true);
  expect(result.findings.some((f) => f.evidence.includes('All hosts'))).toBe(
    false,
  );
});
it('keeps DNS comparison confidence possible and trace silence distinct from loss', () => {
  const result = analyze({
    ...config,
    pingOutput: pingExamples.loss,
    dnsOutput: dnsExamples.timeout,
    traceOutput: traceExamples.reached,
  });
  expect(
    result.findings.find((f) => f.id === 'dns-versus-ping')?.confidence,
  ).toBe('Possible');
  expect(
    result.findings.find((f) => f.id === 'ping-loss-0')?.evidence,
  ).toContain('25%');
  expect(
    result.findings.find((f) => f.id === 'trace-silent')?.meaning,
  ).toContain('not end-to-end');
});
it('renders malicious pasted text as unsupported data, never executable markup', () => {
  const result = analyze({
    ...config,
    pingOutput: '<img src=x onerror=alert(1)>',
    dnsOutput: '<script>alert(1)</script>',
    traceOutput: '<iframe src=evil></iframe>',
  });
  const html = renderToStaticMarkup(createElement(Findings, { result }));
  expect(html).not.toContain('<script');
  expect(html).not.toContain('<iframe');
  expect(html).not.toContain('onerror=');
  for (const id of ['ping-unrecognized-0', 'dns-format', 'trace-format'])
    expect(result.findings.some((f) => f.id === id)).toBe(true);
});
