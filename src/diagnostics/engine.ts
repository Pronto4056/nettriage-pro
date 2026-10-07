import {
  classify,
  parseIPv4,
  parsePrefix,
  sameSubnet,
  subnet,
} from '../network/ipv4';
import { pingFindings } from './pingRules';
import { PING_LIMIT } from '../evidence/ping';
import { DNS_LIMIT } from '../evidence/dns';
import { dnsFindings } from './dnsRules';
export type Confidence =
  'Confirmed' | 'Likely' | 'Possible' | 'Insufficient Evidence';
export type Severity = 'info' | 'warning' | 'error';
export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  evidence: string;
  meaning: string;
  next: string;
}
export interface Input {
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
  notes: string;
  pingOutput?: string;
  dnsOutput?: string;
}
export interface Result {
  errors: Partial<Record<keyof Input, string>>;
  findings: Finding[];
  network?: ReturnType<typeof subnet>;
  category?: string;
}
export function analyze(raw: Input): Result {
  const input: Input = {
    ip: raw.ip.trim(),
    mask: raw.mask.trim(),
    gateway: raw.gateway.trim(),
    dns: raw.dns.trim(),
    notes: raw.notes.trim(),
    pingOutput: (raw.pingOutput ?? '').trim(),
    dnsOutput: (raw.dnsOutput ?? '').trim(),
  };
  const result: Result = { errors: {}, findings: [] };
  if ((raw.pingOutput?.length ?? 0) > PING_LIMIT)
    result.errors.pingOutput =
      'Paste at most 20,000 characters of ping output.';
  if ((raw.dnsOutput?.length ?? 0) > DNS_LIMIT)
    result.errors.dnsOutput = 'Paste at most 20,000 characters of DNS output.';
  const add = (
    id: string,
    title: string,
    severity: Severity,
    confidence: Confidence,
    evidence: string,
    meaning: string,
    next: string,
  ) =>
    result.findings.push({
      id,
      title,
      severity,
      confidence,
      evidence,
      meaning,
      next,
    });
  for (const field of ['ip', 'gateway', 'dns'] as const) {
    if (input[field] && parseIPv4(input[field]) === null)
      result.errors[field] =
        'Enter four decimal octets from 0 to 255, without leading zeros.';
  }
  const prefix = parsePrefix(input.mask);
  if (input.mask && prefix === null)
    result.errors.mask =
      'Enter /0 through /32 or a contiguous dotted-decimal mask.';
  if (!input.ip && (input.mask || input.gateway))
    result.errors.ip =
      'An IPv4 address is needed for subnet and gateway checks.';
  if (input.ip && !input.mask)
    result.errors.mask = 'Enter a mask or CIDR prefix to calculate the subnet.';
  if (Object.keys(result.errors).length) return result;
  if (input.ip && prefix !== null) {
    result.network = subnet(input.ip, prefix);
    result.category = classify(input.ip);
    if (result.category === 'Link-local / APIPA')
      add(
        'apipa',
        'Link-local address assigned',
        'warning',
        'Confirmed',
        input.ip,
        'This address is limited to the local link. Automatic fallback after a DHCP failure is possible, but intentional link-local configuration is also possible.',
        'Review DHCP lease details and the intended interface configuration.',
      );
    if (
      [
        'Loopback',
        'Unspecified',
        'Limited broadcast',
        'Multicast',
        'Reserved',
      ].includes(result.category)
    )
      add(
        'special-host',
        'Address needs configuration review',
        'warning',
        'Confirmed',
        `${input.ip}: ${result.category}`,
        'This is not an ordinary unicast interface address for routed connectivity. Context matters; loopback can be intentional.',
        'Compare this address with the active physical or virtual interface.',
      );
    if (
      prefix < 31 &&
      [result.network.network, result.network.broadcast].includes(input.ip)
    )
      add(
        'host-boundary',
        'Subnet boundary used as host address',
        'error',
        'Confirmed',
        `${input.ip}/${prefix}`,
        'This is the network or directed broadcast address under the supplied prefix.',
        'Check the assigned host address against the usable range.',
      );
    if (prefix >= 31)
      add(
        'narrow-prefix',
        prefix === 31 ? 'Point-to-point subnet' : 'Single host route',
        'info',
        'Confirmed',
        `${input.ip}/${prefix}`,
        prefix === 31
          ? 'Both addresses can be endpoints on a point-to-point link. This does not verify the link type.'
          : 'A /32 identifies one address. An off-subnet gateway can be intentional with an explicit route.',
        'Verify interface type and routing table before changing this configuration.',
      );
    if (input.gateway) {
      if (input.gateway === input.ip)
        add(
          'gateway-self',
          'Gateway equals host address',
          'warning',
          'Confirmed',
          input.gateway,
          'The supplied host and gateway values are identical. Ordinary host configurations use a separate next hop.',
          'Check the actual default route and interface address.',
        );
      if (!sameSubnet(input.ip, input.gateway, prefix))
        add(
          'gateway-outside',
          'Gateway outside the supplied subnet',
          'warning',
          'Confirmed',
          `${input.gateway} is outside ${result.network.network}/${prefix}`,
          'Ordinary directly connected gateways share the host subnet. Explicit on-link routes, tunnels, and host routes can be exceptions.',
          'Inspect the route table and confirm the intended next hop.',
        );
      const gatewayCategory = classify(input.gateway);
      if (
        [
          'Loopback',
          'Unspecified',
          'Limited broadcast',
          'Multicast',
          'Reserved',
        ].includes(gatewayCategory) ||
        (prefix < 31 &&
          [result.network.network, result.network.broadcast].includes(
            input.gateway,
          ))
      )
        add(
          'gateway-address',
          'Gateway address needs review',
          'warning',
          'Confirmed',
          `${input.gateway}: ${gatewayCategory}`,
          'This gateway is a special-use address or subnet boundary rather than an ordinary next hop.',
          'Verify the default route against the router interface address.',
        );
    }
    add(
      'configuration',
      'Configuration calculations complete',
      'info',
      'Confirmed',
      `${result.network.network}/${prefix} · ${result.network.hosts.toLocaleString()} host addresses`,
      'Subnet arithmetic verifies relationships, not reachability or internet service.',
      'Collect gateway ping, numeric destination ping, and DNS lookup output.',
    );
  }
  if (
    input.dns &&
    ['Unspecified', 'Limited broadcast', 'Multicast', 'Reserved'].includes(
      classify(input.dns),
    )
  )
    add(
      'dns-address',
      'DNS server address needs review',
      'warning',
      'Confirmed',
      input.dns,
      'This is not an ordinary unicast resolver address. Loopback resolvers, when supplied, can be intentional.',
      'Check the configured resolver and perform a lookup against it.',
    );
  result.findings.push(...pingFindings(input.pingOutput!, input.gateway));
  result.findings.push(
    ...dnsFindings(input.dnsOutput!, input.dns, input.pingOutput),
  );
  add(
    'missing-evidence',
    'Broader connectivity remains unverified',
    'info',
    'Insufficient Evidence',
    input.dnsOutput
      ? 'Pasted DNS evidence was evaluated; application and traceroute evidence were not.'
      : input.pingOutput
        ? 'Pasted ping evidence was evaluated; DNS and application evidence were not.'
        : 'No command-output analysis has been performed.',
    'Configuration, ICMP and DNS samples cannot establish complete internet or application health. Pasted evidence is user-supplied and may come from different interfaces or times.',
    'Compare gateway and numeric destination probes, then collect DNS lookup and intended-service evidence.',
  );
  return result;
}
