import { parsePing } from '../evidence/ping';
import type { Finding } from './engine';

export function pingFindings(raw: string, gateway = ''): Finding[] {
  if (!raw.trim()) return [];
  const evidence = parsePing(raw);
  const findings: Finding[] = [];
  const add = (
    id: string,
    title: string,
    severity: Finding['severity'],
    confidence: Finding['confidence'],
    observed: string,
    meaning: string,
    next: string,
  ) =>
    findings.push({
      id,
      title,
      severity,
      confidence,
      evidence: observed,
      meaning,
      next,
    });
  for (const [i, sample] of evidence.samples.entries()) {
    const target = `${sample.target}${sample.target === gateway.trim() ? ' (supplied gateway)' : ''}`;
    if (sample.warnings.length)
      add(
        `ping-format-${i}`,
        'Ping sample needs interpretation',
        'warning',
        'Insufficient Evidence',
        `${target}: ${sample.warnings.join(' ')}`,
        'Unsupported, incomplete or conflicting output cannot establish complete statistics.',
        'Paste the complete English IPv4 output, including the header and packet summary.',
      );
    if (!sample.valid) continue;
    if (sample.echoReplies > 0)
      add(
        `ping-replies-${i}`,
        'Target returned ICMP echo replies',
        'info',
        'Confirmed',
        `${target}: ${sample.echoReplies} observed echo replies in sample ${i + 1}.`,
        'The pasted sample supports ICMP response from this address at the time of collection. It does not verify DNS, applications or ongoing reliability.',
        'Compare a numeric destination and DNS lookup from the same interface and time.',
      );
    if (sample.unreachable > 0)
      add(
        `ping-unreachable-${i}`,
        'ICMP destination-unreachable messages observed',
        'warning',
        'Confirmed',
        `${target}: ${sample.unreachable} unreachable messages in sample ${i + 1}.`,
        'A reporting host or router could not deliver these probes. Windows may count these errors as received packets; they are not echo replies from the target.',
        'Inspect the reporting address and local route table, then compare gateway and numeric destination probes.',
      );
    if (sample.complete && sample.received === 0)
      add(
        `ping-no-replies-${i}`,
        'No ICMP replies in this sample',
        'warning',
        'Confirmed',
        `${target}: ${sample.sent} sent, 0 received.`,
        'No replies were reported. Filtering, host unavailability, routing problems or ICMP policy remain possible; this does not prove the host is offline.',
        'Compare the gateway and another permitted numeric destination; verify the intended service separately.',
      );
    if (sample.complete && sample.loss! > 0)
      add(
        `ping-loss-${i}`,
        'Packet loss reported in the sample',
        'warning',
        'Confirmed',
        `${target}: ${sample.loss}% loss across ${sample.sent} probes.`,
        'This is a bounded ICMP measurement, not a long-term reliability estimate or a diagnosis of the cause.',
        'Repeat a bounded sample and compare targets, interfaces and collection times.',
      );
    if (
      sample.complete &&
      sample.received! > 0 &&
      sample.echoReplies === 0 &&
      sample.unreachable === 0
    )
      add(
        `ping-summary-${i}`,
        'Received packets reported without echo lines',
        'info',
        'Insufficient Evidence',
        `${target}: summary reports ${sample.received} received packets.`,
        'The excerpt does not show whether those packets were matching echo replies. Windows received counts can include ICMP errors.',
        'Include the individual response lines before confirming target reachability.',
      );
    if (sample.averageMs !== undefined && sample.echoReplies > 0)
      add(
        `ping-latency-${i}`,
        'Average round-trip time reported',
        'info',
        'Confirmed',
        `${target}: ${sample.averageMs} ms average.`,
        'Latency depends on destination distance, connection type and load. No universal healthy threshold is assumed.',
        'Compare with an established baseline for this target and connection.',
      );
    if (!sample.complete && !sample.echoReplies && !sample.unreachable)
      add(
        `ping-incomplete-${i}`,
        'Ping result remains incomplete',
        'info',
        'Insufficient Evidence',
        `${target}: no matching echo replies or complete summary.`,
        'An incomplete sample cannot establish packet loss or target response.',
        'Paste the complete bounded command output.',
      );
  }
  const byTarget = new Map<string, Set<boolean>>();
  for (const s of evidence.samples.filter(
    (s) => s.valid && (s.echoReplies > 0 || (s.complete && s.received === 0)),
  )) {
    const states = byTarget.get(s.target) ?? new Set<boolean>();
    states.add(s.echoReplies > 0);
    byTarget.set(s.target, states);
  }
  if ([...byTarget.values()].some((s) => s.size > 1))
    add(
      'ping-differing-samples',
      'Samples show differing ICMP observations',
      'warning',
      'Confirmed',
      'The same target has echo replies in one sample and no replies in another.',
      'These may have different times, routes, interfaces or policies. The samples are not merged and do not prove a simultaneous contradiction.',
      'Record time and interface for each run and repeat a bounded comparison.',
    );
  for (const [i, warning] of evidence.warnings.entries())
    add(
      `ping-unrecognized-${i}`,
      'Ping output could not be interpreted',
      'warning',
      'Insufficient Evidence',
      warning,
      'No network conclusion can be drawn from this unsupported sample.',
      'Paste complete English Windows, Linux or macOS IPv4 ping output.',
    );
  return findings;
}
