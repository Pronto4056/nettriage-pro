import { parseTrace } from '../evidence/trace';
import type { Finding } from './engine';
export function traceFindings(raw: string): Finding[] {
  if (!raw.trim()) return [];
  const trace = parseTrace(raw);
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
  if (!trace.valid) {
    add(
      'trace-format',
      'Traceroute output needs interpretation',
      'warning',
      'Insufficient Evidence',
      [...new Set(trace.warnings)].join(' '),
      'Unsupported or conflicting text cannot establish the observed path or destination response.',
      'Paste one complete selected English IPv4 tracert or traceroute output, including its header.',
    );
    return findings;
  }
  add(
    'trace-observations',
    'Trace hop observations extracted',
    'info',
    'Confirmed',
    `${trace.target}: ${trace.hops.length} observed hop rows; highest index ${trace.hops.at(-1)!.index}; header maximum ${trace.maxHops}.`,
    'Indices are probe TTL positions, not a verified count of physical routers. Paths and responding interfaces can vary by probe. RTTs include forward and return travel; do not subtract adjacent-hop values to estimate link delay.',
    'Compare a bounded repeat with the same target, interface and probe method.',
  );
  if (trace.reached)
    add(
      'trace-destination',
      'Destination address responded in the trace',
      'info',
      'Confirmed',
      `${trace.target} appears as a responder with a response time and no recognized failure annotation at that hop.`,
      'The pasted output supports a response from that address for the trace probe method. It does not establish DNS or application health. Unix UDP and Windows ICMP probes can behave differently.',
      'Test the intended application and compare permitted probes from the same interface and time.',
    );
  else
    add(
      'trace-not-seen',
      'Destination response not established',
      'info',
      'Insufficient Evidence',
      `${trace.target} has no supported successful response in the observed rows.`,
      'The trace may be bounded, incomplete or affected by filtering and probe policy. This does not prove the host is offline or identify a failed router.',
      'Review the hop bound and probe method, then compare numeric ping and the intended service.',
    );
  const silent = trace.hops.filter((h) => h.silent > 0);
  if (silent.length)
    add(
      'trace-silent',
      'Silent trace probes observed',
      'info',
      'Confirmed',
      `${silent.reduce((n, h) => n + h.silent, 0)} asterisk-marked probes across ${silent.length} hop rows.`,
      'Asterisks mean no response was shown within the probe wait. Rate limits, filtering or routing may affect responses; these counts are not end-to-end packet-loss measurements.',
      'Compare later hop replies and repeat a bounded trace before drawing a path conclusion.',
    );
  if (
    trace.hops.some(
      (h, i) =>
        h.silent > 0 &&
        h.rtts.length === 0 &&
        trace.hops.slice(i + 1).some((l) => l.rtts.length > 0),
    )
  )
    add(
      'trace-silent-forwarding',
      'Later replies follow a silent hop',
      'info',
      'Confirmed',
      'At least one fully silent row is followed by a responding row.',
      'Silence at one TTL did not prevent later responses in this sample. It cannot be treated as proof that the device at that hop failed to forward traffic.',
      'Keep the silent row as unknown; examine destination and application evidence.',
    );
  const errors = trace.hops.filter((h) => h.annotations.length);
  if (errors.length)
    add(
      'trace-errors',
      'ICMP failure annotations observed',
      'warning',
      'Confirmed',
      errors
        .map((h) => `Hop ${h.index}: ${[...new Set(h.annotations)].join(', ')}`)
        .join('; '),
      'Recognized !H, !N, !P or !X annotations describe host/network/protocol-unreachable or prohibited responses for these probes. The reporting device and underlying cause need more evidence.',
      'Review the reporting addresses, route and applicable access policy; compare the intended service separately.',
    );
  return findings;
}
