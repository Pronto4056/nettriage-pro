import { parseDns } from '../evidence/dns';
import { parsePing } from '../evidence/ping';
import type { Finding } from './engine';
export function dnsFindings(
  raw: string,
  configuredResolver = '',
  pingOutput = '',
): Finding[] {
  if (!raw.trim()) return [];
  const dns = parseDns(raw);
  const findings: Finding[] = [];
  const add = (
    id: string,
    title: string,
    severity: Finding['severity'],
    confidence: Finding['confidence'],
    evidence: string,
    meaning: string,
    next: string,
  ) =>
    findings.push({ id, title, severity, confidence, evidence, meaning, next });
  const context = `${dns.query ?? 'Query name unknown'}${dns.resolver ? ` via ${dns.resolver}` : '; resolver address unknown'}`;
  if (dns.warnings.length)
    add(
      'dns-format',
      'DNS output needs interpretation',
      'warning',
      'Insufficient Evidence',
      dns.warnings.join(' '),
      'Incomplete, conflicting or unsupported text cannot establish the full lookup result.',
      'Paste one complete English nslookup address response or dig IN A lookup.',
    );
  if (!dns.valid) return findings;
  if (
    dns.resolver &&
    configuredResolver.trim() &&
    dns.resolver !== configuredResolver.trim()
  )
    add(
      'dns-resolver-mismatch',
      'Observed resolver differs from the supplied configuration',
      'warning',
      'Confirmed',
      `Configured: ${configuredResolver.trim()}; lookup output: ${dns.resolver}.`,
      'The supplied resolver has not been verified by this lookup. An explicit server argument, different interface or different collection time may explain the difference.',
      'Repeat a lookup against the intended configured resolver and record the interface and time.',
    );
  if (dns.status === 'ANSWER')
    add(
      'dns-answer',
      'IPv4 DNS address answer observed',
      'info',
      'Confirmed',
      `${context}: ${dns.addresses.join(', ')}.`,
      'The pasted lookup contains an IPv4 address answer. It does not establish that the address is reachable or its application is healthy. For nslookup, the displayed answer name may be canonical; the original request is not always shown.',
      'Test the intended service and compare the query name, resolver and collection time.',
    );
  if (dns.status === 'NO_ADDRESS')
    add(
      'dns-no-address',
      'DNS response has no IPv4 address answer',
      'info',
      'Confirmed',
      `${context}: NOERROR with no matching A answer.`,
      'NOERROR does not guarantee an address exists for this record type. Other record types, canonical-name continuation or DNS policy may matter.',
      'Check the requested record type and complete canonical-name chain before changing resolver settings.',
    );
  if (dns.status === 'TIMEOUT')
    add(
      'dns-timeout',
      'DNS lookup timeout observed',
      'warning',
      'Confirmed',
      `${context}: timeout/no-server-response text was recognized.`,
      'No usable response is shown in this sample. Filtering, resolver availability, routing or query conditions may explain it; a timeout does not prove the queried name is absent.',
      'Repeat a bounded lookup against the intended resolver and compare another permitted resolver if appropriate.',
    );
  if (['NXDOMAIN', 'SERVFAIL', 'REFUSED'].includes(dns.status))
    add(
      `dns-${dns.status.toLowerCase()}`,
      `DNS ${dns.status} response observed`,
      'warning',
      'Confirmed',
      `${context}: ${dns.status}.`,
      dns.status === 'NXDOMAIN'
        ? 'The resolver reported NXDOMAIN for this lookup in its DNS view. A queried name or a canonical-name target may be absent. This is distinct from a timeout and does not prove every resolver has the same view.'
        : dns.status === 'SERVFAIL'
          ? 'The resolver could not complete the lookup. Upstream, validation or server conditions remain possible; the cause is not established.'
          : 'The resolver refused this query. Access policy or query restrictions may explain the result.',
      'Check the spelling and query type, record the resolver, and repeat from the intended interface.',
    );
  if (dns.status === 'UNKNOWN' && !dns.warnings.length)
    add(
      'dns-unknown',
      'DNS result remains unknown',
      'info',
      'Insufficient Evidence',
      context,
      'No supported address-query result was extracted.',
      'Include the full English lookup output.',
    );
  const numericReplies = parsePing(pingOutput).samples.some(
    (s) => s.valid && s.echoReplies > 0,
  );
  if (
    numericReplies &&
    ['TIMEOUT', 'SERVFAIL', 'REFUSED', 'NXDOMAIN'].includes(dns.status)
  )
    add(
      'dns-versus-ping',
      'ICMP replies and DNS failure are both present',
      'warning',
      'Possible',
      'A valid IPv4 ping sample has matching echo replies; the DNS sample has a failure or timeout.',
      'Some numeric ICMP response is supported while this lookup failed. The tests may involve different targets, times or interfaces; this does not prove DNS is the only problem or the configured resolver is broken.',
      'Repeat numeric ping and the same-name lookup from the same interface and time, then test the intended application.',
    );
  return findings;
}
