import { expect, it } from 'vitest';
import { parsePing } from '../src/evidence/ping';
import { pingFindings } from '../src/diagnostics/pingRules';

const windows = `Pinging 1.1.1.1 with 32 bytes of data:
Reply from 1.1.1.1: bytes=32 time=12ms TTL=57
Reply from 1.1.1.1: bytes=32 time=14ms TTL=57
Ping statistics for 1.1.1.1:
Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),
Minimum = 12ms, Maximum = 14ms, Average = 13ms`;
const failure = `Pinging 1.1.1.1 with 32 bytes of data:
Request timed out.
Ping statistics for 1.1.1.1:
Packets: Sent = 1, Received = 0, Lost = 1 (100% loss),`;
it('extracts target echo replies and latency from Windows', () => {
  expect(parsePing(windows).samples[0]).toMatchObject({
    target: '1.1.1.1',
    sent: 2,
    received: 2,
    loss: 0,
    echoReplies: 2,
    averageMs: 13,
    valid: true,
  });
  expect(
    pingFindings(windows).some(
      (f) => f.id === 'ping-replies-0' && f.confidence === 'Confirmed',
    ),
  ).toBe(true);
});
it('does not count Windows unreachable messages as echo replies', () => {
  const text = windows.replace(
    /Reply from 1.1.1.1: bytes=32 time=\d+ms TTL=57/g,
    'Reply from 192.0.2.1: Destination host unreachable.',
  );
  expect(parsePing(text).samples[0]).toMatchObject({
    echoReplies: 0,
    unreachable: 2,
  });
  expect(pingFindings(text).some((f) => f.id.startsWith('ping-replies'))).toBe(
    false,
  );
  expect(
    pingFindings(text).some((f) => f.id.startsWith('ping-unreachable')),
  ).toBe(true);
});
it.each([
  [
    'linux',
    '4 packets transmitted, 3 received, 25% packet loss, time 3000ms\nrtt min/avg/max/mdev = 10.0/12.5/15.0/2.0 ms',
  ],
  [
    'mac',
    '4 packets transmitted, 3 packets received, 25.0% packet loss\nround-trip min/avg/max/stddev = 10.0/12.5/15.0/2.0 ms',
  ],
])(
  'reads %s numeric summary without inventing observed replies',
  (_name, summary) => {
    const sample = parsePing(
      `PING example.com (192.0.2.20): 56 data bytes\n${summary}`,
    ).samples[0];
    expect(sample).toMatchObject({
      target: '192.0.2.20',
      sent: 4,
      received: 3,
      loss: 25,
      averageMs: 12.5,
      echoReplies: 0,
      valid: true,
    });
  },
);
it('supports Linux replies with reverse names and macOS sequence numbers', () => {
  const sample = parsePing(
    'PING example.com (192.0.2.20) 56(84) bytes of data.\n64 bytes from example.com (192.0.2.20): icmp_seq=1 ttl=54 time=12.0 ms\n64 bytes from 192.0.2.20: icmp_seq=2 ttl=54 time=11.0 ms',
  ).samples[0];
  expect(sample.echoReplies).toBe(2);
  expect(sample.complete).toBe(false);
  expect(
    pingFindings(
      'PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12 ms',
    ).some((f) => f.id === 'ping-replies-0'),
  ).toBe(true);
});
it('reports no replies without asserting host offline', () => {
  const findings = pingFindings(failure);
  expect(findings.some((f) => f.id === 'ping-no-replies-0')).toBe(true);
  expect(
    findings
      .map((f) => f.meaning)
      .join(' ')
      .toLowerCase(),
  ).toContain('filtering');
  expect(findings.map((f) => f.title).join(' ')).not.toMatch(/offline/i);
});
it('retains differing same-target samples and does not combine their packet statistics', () => {
  expect(parsePing(`${windows}\n${failure}`).samples).toHaveLength(2);
  expect(
    pingFindings(`${windows}\n${failure}`).some(
      (f) => f.id === 'ping-differing-samples',
    ),
  ).toBe(true);
});
it.each([
  windows.replace('Received = 2', 'Received = 5'),
  windows.replace('(0% loss)', '(101% loss)'),
  windows.replace('Lost = 0', 'Lost = 1'),
  windows.replace(
    'Received = 2, Lost = 0 (0% loss)',
    'Received = 0, Lost = 2 (100% loss)',
  ),
  windows.replace(
    'Ping statistics for 1.1.1.1:',
    'Ping statistics for 8.8.8.8:',
  ),
])('rejects contradictory statistics instead of confirming them', (text) => {
  expect(parsePing(text).samples[0].valid).toBe(false);
  expect(pingFindings(text).some((f) => f.id.startsWith('ping-replies'))).toBe(
    false,
  );
});
it('does not establish target reachability from a different responder', () => {
  const text = windows.replace(/Reply from 1.1.1.1/g, 'Reply from 8.8.8.8');
  expect(parsePing(text).samples[0].valid).toBe(false);
});
it.each([
  '',
  'unrecognized text',
  'PING ::1(::1) 56 data bytes',
  'Pinging 999.1.1.1 with 32 bytes of data:',
  'Request timed out.',
])('degrades gracefully for unsupported or partial text %s', (text) => {
  expect(parsePing(text).samples).toEqual([]);
  expect(pingFindings(text).some((f) => f.id.startsWith('ping-replies'))).toBe(
    false,
  );
});
it('bounds large input and sample count without silently truncating evidence', () => {
  expect(parsePing('x'.repeat(20001)).samples).toEqual([]);
  expect(parsePing('x'.repeat(20001)).warnings.length).toBeGreaterThan(0);
  expect(parsePing(Array(21).fill(failure).join('\n')).samples).toEqual([]);
});
it('rejects a Unix summary naming a different target', () => {
  const text =
    'PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12 ms\n--- 8.8.8.8 ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss';
  expect(parsePing(text).samples[0].valid).toBe(false);
});
it('rejects Windows timeout lines inconsistent with lost counts', () => {
  expect(
    parsePing(
      windows.replace('Ping statistics', 'Request timed out.\nPing statistics'),
    ).samples[0].valid,
  ).toBe(false);
});
it.each([
  windows.replace('Average = 13ms', 'Average = 50ms'),
  windows.replace('Minimum = 12ms', 'Minimum = 30ms'),
  'PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12 ms\nrtt min/avg/max/mdev = 10/50/15/1 ms',
])('rejects latency summary outside the reported range', (text) => {
  expect(parsePing(text).samples[0].valid).toBe(false);
});
it('reports partial loss and latency as measurements, without arbitrary healthy thresholds', () => {
  const text =
    'PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=120 ms\n4 packets transmitted, 3 received, 25% packet loss\nrtt min/avg/max/mdev = 110/120/130/2 ms';
  const findings = pingFindings(text);
  expect(
    findings.some((f) => f.id === 'ping-loss-0' && f.evidence.includes('25%')),
  ).toBe(true);
  expect(
    findings.some(
      (f) => f.id === 'ping-latency-0' && f.evidence.includes('120 ms'),
    ),
  ).toBe(true);
});
