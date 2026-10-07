import { parseIPv4 } from '../network/ipv4';

export interface PingSample {
  target: string;
  echoReplies: number;
  unreachable: number;
  timeouts: number;
  sent?: number;
  received?: number;
  loss?: number;
  averageMs?: number;
  complete: boolean;
  valid: boolean;
  warnings: string[];
}
export interface PingEvidence {
  samples: PingSample[];
  warnings: string[];
}
export const PING_LIMIT = 20000;

// Headers delimit runs; summaries alone cannot identify a sample's target reliably.
export function parsePing(raw: string): PingEvidence {
  const result: PingEvidence = { samples: [], warnings: [] };
  if (!raw.trim()) return result;
  if (raw.length > PING_LIMIT) {
    result.warnings.push(
      'Ping output exceeds 20,000 characters. Paste a smaller complete sample.',
    );
    return result;
  }
  const lines = raw.replace(/\r/g, '').split('\n');
  const starts = lines.flatMap((line, i) =>
    /^\s*(?:Pinging\s|PING\s)/.test(line) ? [i] : [],
  );
  if (!starts.length || starts.length > 20) {
    result.warnings.push(
      starts.length > 20
        ? 'At most 20 ping samples can be analyzed together.'
        : 'No supported English IPv4 ping header was recognized.',
    );
    return result;
  }
  for (let index = 0; index < starts.length; index++) {
    const block = lines.slice(starts[index], starts[index + 1] ?? lines.length);
    const header = block[0];
    const win = header.match(
      /^\s*Pinging\s+(?:\S+\s+\[)?(\d+\.\d+\.\d+\.\d+)\]?\s+with\s+\d+\s+bytes of data:/,
    );
    const unix = header.match(/^\s*PING\s+(?:\S+\s+)?\((\d+\.\d+\.\d+\.\d+)\)/);
    const target = win?.[1] ?? unix?.[1];
    const headerName = header
      .match(/^\s*(?:PING|Pinging)\s+(\S+)\s+[\[(]/)?.[1]
      ?.toLowerCase()
      .replace(/\.$/, '');
    if (!target || parseIPv4(target) === null) {
      result.warnings.push(
        `Sample ${index + 1}: unsupported target or ping header. Only English IPv4 output is supported.`,
      );
      continue;
    }
    const sample: PingSample = {
      target,
      echoReplies: 0,
      unreachable: 0,
      timeouts: 0,
      complete: false,
      valid: true,
      warnings: [],
    };
    let summaries = 0;
    let windowsSummary = false;
    const invalid = (message: string) => {
      sample.valid = false;
      sample.warnings.push(message);
    };
    for (const line of block.slice(1)) {
      if (/destination (?:host|net|port|protocol)?\s*unreachable/i.test(line))
        sample.unreachable++;
      if (/request timed out|request timeout for icmp_seq/i.test(line))
        sample.timeouts++;
      const reply =
        line.match(
          /^\s*Reply from (\d+\.\d+\.\d+\.\d+):\s*bytes=\d+\s+time[=<][\d.]+ms\s+TTL=\d+/i,
        ) ??
        line.match(
          /^\s*\d+ bytes from (?:\S+\s+\()?((?:\d+\.){3}\d+)\)?:.*icmp_seq[= ]\d+.*ttl=\d+.*time[=<][\d.]+\s*ms/i,
        );
      if (reply) {
        if (reply[1] === target) sample.echoReplies++;
        else
          invalid(
            'An echo reply source differs from the requested target; do not attribute it to that target.',
          );
      }
      const statTarget = line.match(/^\s*Ping statistics for ([\d.]+):/);
      if (statTarget && statTarget[1] !== target)
        invalid('The statistics target differs from the ping header.');
      const unixStatTarget = line
        .match(/^\s*---\s+(.+?)\s+ping statistics\s+---\s*$/)?.[1]
        ?.toLowerCase()
        .replace(/\.$/, '');
      if (
        unixStatTarget &&
        unixStatTarget !== target &&
        unixStatTarget !== headerName
      )
        invalid('The Unix statistics target differs from the ping header.');
      const ws = line.match(
        /Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)\s*\(([\d.]+)% loss\)/i,
      );
      const us = line.match(
        /^\s*(\d+) packets transmitted,\s*(\d+) (?:packets )?received,.*?([\d.]+)% packet loss/,
      );
      if (ws || us) {
        summaries++;
        windowsSummary = !!ws;
        sample.sent = Number((ws ?? us)![1]);
        sample.received = Number((ws ?? us)![2]);
        sample.loss = Number(ws?.[4] ?? us?.[3]);
        sample.complete = true;
        if (ws && Number(ws[3]) !== sample.sent - sample.received)
          invalid('Sent, received and lost counts disagree.');
      }
      const windowsLatency = line.match(
        /Minimum\s*=\s*([\d.]+)ms,\s*Maximum\s*=\s*([\d.]+)ms,\s*Average\s*=\s*([\d.]+)ms/i,
      );
      const unixLatency = line.match(
        /(?:rtt|round-trip) min\/avg\/max\/(?:mdev|stddev)\s*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/[\d.]+\s*ms/,
      );
      if (windowsLatency || unixLatency) {
        const tuple = windowsLatency ?? unixLatency!;
        const minimum = Number(tuple[1]);
        const maximum = Number(tuple[windowsLatency ? 2 : 3]);
        sample.averageMs = Number(tuple[windowsLatency ? 3 : 2]);
        if (
          ![minimum, maximum, sample.averageMs].every(
            (n) => Number.isFinite(n) && n >= 0,
          ) ||
          minimum > sample.averageMs ||
          sample.averageMs > maximum
        )
          invalid(
            'The latency average is outside the reported minimum and maximum.',
          );
      }
    }
    if (sample.complete) {
      const { sent, received, loss } = sample as Required<PingSample>;
      if (summaries !== 1)
        invalid(
          'Multiple summaries inside one sample are ambiguous. Paste each run with its own header.',
        );
      if (
        !Number.isSafeInteger(sent) ||
        !Number.isSafeInteger(received) ||
        sent <= 0 ||
        received < 0 ||
        received > sent ||
        !Number.isFinite(loss) ||
        loss < 0 ||
        loss > 100 ||
        Math.abs(loss - ((sent - received) / sent) * 100) > 1
      )
        invalid('Packet statistics are invalid or inconsistent.');
      if (
        sample.echoReplies > received ||
        (windowsSummary &&
          (sample.echoReplies + sample.unreachable > received ||
            sample.timeouts > sent - received ||
            sample.echoReplies + sample.unreachable + sample.timeouts > sent))
      )
        invalid('Observed reply/error lines disagree with received counts.');
    } else
      sample.warnings.push(
        'No complete packet summary was recognized; loss and total packet counts remain unknown.',
      );
    if (
      sample.averageMs !== undefined &&
      (!Number.isFinite(sample.averageMs) || sample.averageMs < 0)
    )
      invalid('Latency is invalid.');
    result.samples.push(sample);
  }
  return result;
}
