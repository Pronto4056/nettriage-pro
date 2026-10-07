import { expect, it } from 'vitest';
import { parseDns } from '../src/evidence/dns';
import { dnsFindings } from '../src/diagnostics/dnsRules';
const lookup = `Server: resolver.demo.invalid
Address: 192.0.2.53
Non-authoritative answer:
Name: example.com
Address: 192.0.2.20`;
const dig = `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 123
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
;; QUESTION SECTION:
;example.com. IN A
;; ANSWER SECTION:
example.com. 300 IN A 192.0.2.20
;; ADDITIONAL SECTION:
other.example. 300 IN A 192.0.2.99
;; SERVER: 192.0.2.53#53(192.0.2.53)`;
it('separates nslookup resolver and actual answer', () => {
  expect(parseDns(lookup)).toMatchObject({
    valid: true,
    query: 'example.com',
    resolver: '192.0.2.53',
    addresses: ['192.0.2.20'],
    status: 'ANSWER',
  });
});
it('does not interpret the resolver-only Address as resolution success', () => {
  const parsed = parseDns('Server: resolver.demo.invalid\nAddress: 192.0.2.53');
  expect(parsed.addresses).toEqual([]);
  expect(parsed.status).toBe('UNKNOWN');
});
it('reads dig answer section only', () => {
  expect(parseDns(dig)).toMatchObject({
    valid: true,
    query: 'example.com',
    addresses: ['192.0.2.20'],
    status: 'ANSWER',
  });
});
it('follows a matching dig CNAME chain before accepting its address', () => {
  const text = dig
    .replace('ANSWER: 1', 'ANSWER: 2')
    .replace(
      'example.com. 300 IN A 192.0.2.20',
      'example.com. 300 IN CNAME edge.example.com.\nedge.example.com. 60 IN A 192.0.2.20',
    );
  expect(parseDns(text).addresses).toEqual(['192.0.2.20']);
});
it('rejects unrelated answer records rather than claiming the queried name resolved', () => {
  expect(
    parseDns(
      dig.replace('example.com. 300 IN A', 'unrelated.example. 300 IN A'),
    ).valid,
  ).toBe(false);
});
it('distinguishes NOERROR with no address answer', () => {
  const text = dig
    .replace('ANSWER: 1', 'ANSWER: 0')
    .replace(';; ANSWER SECTION:\nexample.com. 300 IN A 192.0.2.20\n', '');
  expect(parseDns(text).status).toBe('NO_ADDRESS');
  expect(dnsFindings(text).some((f) => f.id === 'dns-answer')).toBe(false);
});
it.each(['NXDOMAIN', 'SERVFAIL', 'REFUSED'])(
  'recognizes dig %s without calling it a timeout',
  (status) => {
    const text = dig
      .replace('ANSWER: 1', 'ANSWER: 0')
      .replace('NOERROR', status)
      .replace('example.com. 300 IN A 192.0.2.20', '');
    expect(parseDns(text)).toMatchObject({ valid: true, status });
  },
);
it.each([
  ['Non-existent domain', 'NXDOMAIN'],
  ['Server failed', 'SERVFAIL'],
  ['Query refused', 'REFUSED'],
])('recognizes nslookup %s', (message, status) => {
  expect(
    parseDns(
      `Server: resolver.demo.invalid\nAddress: 192.0.2.53\n*** resolver.demo.invalid can't find example.com: ${message}`,
    ),
  ).toMatchObject({ valid: true, query: 'example.com', status, addresses: [] });
});
it('recognizes resolver timeout without asserting records do not exist', () => {
  const text =
    'DNS request timed out.\n timeout was 2 seconds.\nServer: resolver.demo.invalid\nAddress: 192.0.2.53\n*** Request to resolver.demo.invalid timed-out';
  expect(parseDns(text)).toMatchObject({ status: 'TIMEOUT', addresses: [] });
  expect(dnsFindings(text).some((f) => f.id === 'dns-timeout')).toBe(true);
});
it.each([
  lookup + '\nDNS request timed out.',
  dig + '\n;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 456',
  lookup + '\n' + lookup,
])('rejects mixed statuses or merged runs', (text) => {
  expect(parseDns(text).valid).toBe(false);
  expect(dnsFindings(text).some((f) => f.id === 'dns-answer')).toBe(false);
});
it.each([
  lookup.replace('192.0.2.20', '999.0.2.20'),
  dig.replace('192.0.2.20', '999.0.2.20'),
])('rejects malformed answer addresses', (text) =>
  expect(parseDns(text).valid).toBe(false),
);
it('keeps IPv6-only nslookup output unsupported rather than failed', () => {
  expect(parseDns(lookup.replace('192.0.2.20', '2001:db8::20'))).toMatchObject({
    status: 'UNKNOWN',
    addresses: [],
  });
});
it.each([
  'random notes',
  dig.replace(';example.com. IN A', ';example.com. IN AAAA'),
  dig.replace(';; QUESTION SECTION:\n;example.com. IN A\n', ''),
  'x'.repeat(20001),
])('degrades gracefully for unsupported output', (text) => {
  expect(parseDns(text).valid).toBe(false);
});
it('flags a resolver discrepancy without implying the configured resolver was queried', () => {
  expect(
    dnsFindings(lookup, '1.1.1.1').some(
      (f) => f.id === 'dns-resolver-mismatch',
    ),
  ).toBe(true);
});
it('compares successful numeric ICMP with DNS failure cautiously', () => {
  const ping =
    'Pinging 1.1.1.1 with 32 bytes of data:\nReply from 1.1.1.1: bytes=32 time=12ms TTL=57';
  const failed =
    "Server: resolver.demo.invalid\nAddress: 192.0.2.53\n*** resolver.demo.invalid can't find example.com: Server failed";
  expect(
    dnsFindings(failed, '', ping).find((f) => f.id === 'dns-versus-ping')
      ?.confidence,
  ).toBe('Possible');
  expect(
    dnsFindings(
      failed,
      '',
      ping.replace(
        'bytes=32 time=12ms TTL=57',
        'Destination host unreachable.',
      ),
    ).some((f) => f.id === 'dns-versus-ping'),
  ).toBe(false);
});
it('accepts indented nslookup aliases without treating them as addresses', () => {
  const text =
    lookup + '\n    Aliases: www.example.com\n             app.example.com';
  expect(parseDns(text)).toMatchObject({
    valid: true,
    addresses: ['192.0.2.20'],
    status: 'ANSWER',
  });
});
it('rejects an incomplete dig answer section whose declared count is nonzero', () => {
  expect(
    parseDns(dig.replace('example.com. 300 IN A 192.0.2.20', '')).valid,
  ).toBe(false);
});
it('rejects a dig response combined with an nslookup failure', () => {
  const text =
    dig + "\n*** resolver can't find missing.example: Non-existent domain";
  expect(parseDns(text).valid).toBe(false);
  expect(dnsFindings(text).some((f) => f.id === 'dns-answer')).toBe(false);
});
it('never treats a reversed resolver block as an answer block', () => {
  const text =
    'Name: example.com\nAddress: 192.0.2.20\nServer: resolver.demo.invalid\nAddress: 192.0.2.53';
  expect(parseDns(text)).toMatchObject({
    valid: false,
    status: 'UNKNOWN',
    addresses: [],
  });
});
it('requires an actual dig header rather than a status word in arbitrary prose', () => {
  expect(
    parseDns(
      dig.replace(
        ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 123',
        'status: NOERROR,',
      ),
    ).valid,
  ).toBe(false);
});
