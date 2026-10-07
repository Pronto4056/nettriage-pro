export function parseIPv4(raw: string): number | null {
  const parts = raw.trim().split('.');
  if (
    parts.length !== 4 ||
    parts.some((p) => !/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255)
  )
    return null;
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}
export function formatIPv4(n: number): string {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 255).join('.');
}
export function parsePrefix(raw: string): number | null {
  const value = raw.trim();
  if (/^\/?\d{1,2}$/.test(value)) {
    const prefix = Number(value.replace('/', ''));
    return prefix <= 32 ? prefix : null;
  }
  const mask = parseIPv4(value);
  if (mask === null) return null;
  const bits = mask.toString(2).padStart(32, '0');
  return /^1*0*$/.test(bits)
    ? bits.indexOf('0') === -1
      ? 32
      : bits.indexOf('0')
    : null;
}
export function subnet(ip: string, prefix: number) {
  const address = parseIPv4(ip);
  if (
    address === null ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  )
    throw new Error('Invalid IPv4 or prefix');
  const size = 2 ** (32 - prefix);
  const start = Math.floor(address / size) * size;
  const end = start + size - 1;
  return {
    network: formatIPv4(start),
    broadcast: prefix >= 31 ? null : formatIPv4(end),
    first: formatIPv4(prefix >= 31 ? start : start + 1),
    last: formatIPv4(prefix >= 31 ? end : end - 1),
    hosts: prefix >= 31 ? size : size - 2,
    mask: formatIPv4(4294967296 - size),
    prefix,
  };
}
export function sameSubnet(a: string, b: string, prefix: number): boolean {
  return subnet(a, prefix).network === subnet(b, prefix).network;
}
export function classify(ip: string): string {
  const n = parseIPv4(ip);
  if (n === null) return 'Invalid';
  const inRange = (base: string, p: number) => sameSubnet(ip, base, p);
  if (n === 0) return 'Unspecified';
  if (n === 4294967295) return 'Limited broadcast';
  if (inRange('127.0.0.0', 8)) return 'Loopback';
  if (inRange('169.254.0.0', 16)) return 'Link-local / APIPA';
  if (
    inRange('10.0.0.0', 8) ||
    inRange('172.16.0.0', 12) ||
    inRange('192.168.0.0', 16)
  )
    return 'Private';
  if (inRange('224.0.0.0', 4)) return 'Multicast';
  if (inRange('240.0.0.0', 4) || inRange('0.0.0.0', 8)) return 'Reserved';
  if (inRange('100.64.0.0', 10)) return 'Shared address space';
  if (
    inRange('192.0.2.0', 24) ||
    inRange('198.51.100.0', 24) ||
    inRange('203.0.113.0', 24)
  )
    return 'Documentation';
  if (inRange('198.18.0.0', 15)) return 'Benchmarking';
  if (
    [
      '192.0.0.0',
      '192.88.99.0',
      '192.31.196.0',
      '192.52.193.0',
      '192.175.48.0',
    ].some((base) => inRange(base, 24))
  )
    return 'Special-use';
  return 'Public candidate';
}
