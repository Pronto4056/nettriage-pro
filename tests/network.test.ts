import { describe, expect, it } from 'vitest';
import { parseIPv4, parsePrefix, subnet, classify } from '../src/network/ipv4';
import { analyze } from '../src/diagnostics/engine';

describe('IPv4 and subnet mathematics', () => {
  it.each([
    '192.168.1.999',
    '192.168.1',
    'abc.def.ghi.jkl',
    '01.2.3.4',
    '-1.2.3.4',
    '1.2.3.4junk',
  ])('rejects %s', (ip) => expect(parseIPv4(ip)).toBeNull());
  it('uses unsigned arithmetic', () =>
    expect(parseIPv4('255.255.255.255')).toBe(4294967295));
  it.each([
    ['/0', 0],
    ['/24', 24],
    ['255.255.255.252', 30],
    ['255.255.255.254', 31],
    ['/32', 32],
    ['0.0.0.0', 0],
  ])('parses %s', (mask, prefix) => expect(parsePrefix(mask)).toBe(prefix));
  it.each(['/33', '/-1', '/1.5', '255.0.255.0', '255.255.255.1', ''])(
    'rejects mask %s',
    (mask) => expect(parsePrefix(mask)).toBeNull(),
  );
  it('calculates /24', () =>
    expect(subnet('192.168.1.42', 24)).toEqual({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      first: '192.168.1.1',
      last: '192.168.1.254',
      hosts: 254,
      mask: '255.255.255.0',
      prefix: 24,
    }));
  it.each([
    [0, 4294967294],
    [30, 2],
    [31, 2],
    [32, 1],
  ])('handles /%s host counts', (p, n) =>
    expect(subnet('10.0.0.0', p).hosts).toBe(n),
  );
  it('allows both /31 endpoints', () =>
    expect(subnet('10.0.0.0', 31).first).toBe('10.0.0.0'));
  it.each(['192.31.196.14', '192.52.193.27', '192.175.48.1'])(
    'recognizes special-purpose block %s',
    (ip) => expect(classify(ip)).toBe('Special-use'),
  );
  it('rejects invalid utility inputs', () =>
    expect(() => subnet('junk', 24)).toThrow());
  it.each([
    ['10.1.2.3', 'Private'],
    ['172.31.0.1', 'Private'],
    ['192.168.1.1', 'Private'],
    ['169.254.1.1', 'Link-local / APIPA'],
    ['127.8.1.1', 'Loopback'],
    ['224.0.0.1', 'Multicast'],
    ['0.0.0.0', 'Unspecified'],
    ['255.255.255.255', 'Limited broadcast'],
    ['100.64.0.1', 'Shared address space'],
    ['192.0.2.1', 'Documentation'],
    ['8.8.8.8', 'Public candidate'],
  ])('classifies %s', (ip, c) => expect(classify(ip)).toBe(c));
});
describe('configuration findings', () => {
  it('ignores unexpected history properties during normalization', () => {
    const input = {
      ip: '10.0.0.2',
      mask: '/24',
      gateway: '',
      dns: '',
      notes: '',
      extra: null,
    };
    expect(() => analyze(input)).not.toThrow();
    expect(analyze(input).network?.network).toBe('10.0.0.0');
  });
  it('does not call empty evidence healthy', () =>
    expect(
      analyze({
        ip: '',
        mask: '',
        gateway: '',
        dns: '',
        notes: '',
      }).findings.some((f) => f.confidence === 'Insufficient Evidence'),
    ).toBe(true));
  it('rejects invalid IP', () =>
    expect(
      analyze({ ip: 'bad', mask: '/24', gateway: '', dns: '', notes: '' })
        .errors.ip,
    ).toBeTruthy());
  it('detects APIPA', () =>
    expect(
      analyze({
        ip: '169.254.3.4',
        mask: '/16',
        gateway: '',
        dns: '',
        notes: '',
      }).findings.some((f) => f.id === 'apipa'),
    ).toBe(true));
  it('calculates gateway membership beyond the first three octets', () =>
    expect(
      analyze({
        ip: '10.0.1.4',
        mask: '/16',
        gateway: '10.0.2.1',
        dns: '',
        notes: '',
      }).findings.some((f) => f.id === 'gateway-outside'),
    ).toBe(false));
  it('flags outside gateway', () =>
    expect(
      analyze({
        ip: '192.168.1.4',
        mask: '/24',
        gateway: '192.168.2.1',
        dns: '',
        notes: '',
      }).findings.some((f) => f.id === 'gateway-outside'),
    ).toBe(true));
  it('flags network address under /24 but not /31', () => {
    expect(
      analyze({
        ip: '10.0.0.0',
        mask: '/24',
        gateway: '',
        dns: '',
        notes: '',
      }).findings.some((f) => f.id === 'host-boundary'),
    ).toBe(true);
    expect(
      analyze({
        ip: '10.0.0.0',
        mask: '/31',
        gateway: '',
        dns: '',
        notes: '',
      }).findings.some((f) => f.id === 'host-boundary'),
    ).toBe(false);
  });
});
