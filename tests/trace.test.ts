import { expect, it } from 'vitest';
import { parseTrace } from '../src/evidence/trace';
import { traceFindings } from '../src/diagnostics/traceRules';
it.each([
  'traceroute to x (1.1.1.1), 30 hops max, 60 byte packets\n1 host (1.1.1.1 1 ms',
  'traceroute to x (1.1.1.1), 30 hops max, 60 byte packets\n1 1.1.1.1) 1 ms',
  'Tracing route to host [1.1.1.1 over a maximum of 30 hops\n1 1 ms 1 ms 1 ms host [1.1.1.1',
  'Tracing route to 1.1.1.1 over a maximum of 30 hops\n1 1 ms 1 ms 1 ms host [1.1.1.1',
])(
  'rejects unpaired address delimiters instead of confirming destination',
  (text) => {
    expect(parseTrace(text).valid).toBe(false);
    expect(traceFindings(text).some((f) => f.id === 'trace-destination')).toBe(
      false,
    );
  },
);
it.each([
  '9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999',
])('rejects nonfinite response times', (value) => {
  expect(
    parseTrace(
      `traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets\n1 1.1.1.1 ${value} ms`,
    ).valid,
  ).toBe(false);
});
const win = `Tracing route to 1.1.1.1 over a maximum of 30 hops
  1     1 ms     1 ms     2 ms  192.0.2.1
  2     *        *        *     Request timed out.
  3    12 ms    13 ms    12 ms  1.1.1.1
Trace complete.`;
const unix = `traceroute to example.com (1.1.1.1), 30 hops max, 60 byte packets
 1  192.0.2.1  1.0 ms  1.1 ms  1.0 ms
 2  * * *
 3  1.1.1.1  12.0 ms  12.3 ms 12.1 ms`;
it.each([win, unix])(
  'extracts hop observations and target response',
  (text) => {
    const parsed = parseTrace(text);
    expect(parsed.valid).toBe(true);
    expect(parsed.target).toBe('1.1.1.1');
    expect(parsed.hops).toHaveLength(3);
    expect(parsed.hops[1].silent).toBe(3);
    expect(parsed.reached).toBe(true);
    expect(traceFindings(text).some((f) => f.id === 'trace-destination')).toBe(
      true,
    );
    expect(
      traceFindings(text).some((f) => f.id === 'trace-silent-forwarding'),
    ).toBe(true);
  },
);
it('supports Windows hostname headers and sub-millisecond RTTs', () => {
  const text = win
    .replace(
      '1.1.1.1 over a maximum of 30 hops',
      'example.com [1.1.1.1]\nover a maximum of 30 hops:',
    )
    .replace('1 ms', '<1 ms')
    .replace('192.0.2.1', 'router.demo [192.0.2.1]');
  expect(parseTrace(text)).toMatchObject({ valid: true, reached: true });
  expect(parseTrace(text).hops[0].rtts[0]).toBe('<1');
});
it('preserves Unix multiple responders at one hop', () => {
  const text = unix.replace(
    '192.0.2.1  1.0 ms  1.1 ms  1.0 ms',
    'gw.demo (192.0.2.1) 1.0 ms 192.0.2.2 1.1 ms *',
  );
  expect(parseTrace(text).hops[0]).toMatchObject({
    responders: ['192.0.2.1', '192.0.2.2'],
    silent: 1,
    rtts: ['1.0', '1.1'],
  });
});
it.each(['!H', '!N', '!P', '!X'])(
  'does not call destination error %s a successful trace',
  (annotation) => {
    const text = unix.replace(
      '1.1.1.1  12.0 ms  12.3 ms 12.1 ms',
      `1.1.1.1 12.0 ms ${annotation} 12.3 ms ${annotation} 12.1 ms ${annotation}`,
    );
    expect(parseTrace(text)).toMatchObject({ valid: true, reached: false });
    expect(traceFindings(text).some((f) => f.id === 'trace-errors')).toBe(true);
  },
);
it('keeps a bounded missing-destination trace inconclusive', () => {
  const text = unix.replace(' 3  1.1.1.1  12.0 ms  12.3 ms 12.1 ms', '');
  expect(parseTrace(text).reached).toBe(false);
  expect(
    traceFindings(text).find((f) => f.id === 'trace-not-seen')?.confidence,
  ).toBe('Insufficient Evidence');
  expect(
    traceFindings(text)
      .map((f) => f.title)
      .join(' '),
  ).not.toMatch(/offline|router failure/i);
});
it('does not trust a completion footer without a target hop', () => {
  expect(
    parseTrace(win.replace('  3    12 ms    13 ms    12 ms  1.1.1.1\n', ''))
      .reached,
  ).toBe(false);
});
it.each([
  win.replace('  3    12', '  2    12'),
  win.replace('  3    12', '  31    12'),
  win.replace('192.0.2.1', '999.0.2.1'),
  win.replace('Request timed out.', '1.1.1.1'),
  win + '\n' + win,
  unix + '\nnot a supported row',
  unix.replace('12.0 ms', '-12.0 ms'),
])(
  'rejects malformed or conflicting trace instead of confirming target',
  (text) => {
    expect(parseTrace(text).valid).toBe(false);
    expect(traceFindings(text).some((f) => f.id === 'trace-destination')).toBe(
      false,
    );
  },
);
it.each([
  '',
  'random output',
  'traceroute to localhost (::1), 30 hops max, 60 byte packets',
  'Tracing route to 1.1.1.1 over a maximum of 30 hops\nTrace complete.',
  'x'.repeat(20001),
])('degrades gracefully for unsupported or empty traces', (text) =>
  expect(parseTrace(text).valid).toBe(false),
);
