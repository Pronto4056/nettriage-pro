import { parseIPv4 } from '../network/ipv4';
export const TRACE_LIMIT = 20000;
export interface TraceHop {
  index: number;
  responders: string[];
  rtts: string[];
  silent: number;
  annotations: string[];
}
export interface TraceEvidence {
  valid: boolean;
  target?: string;
  maxHops?: number;
  hops: TraceHop[];
  reached: boolean;
  warnings: string[];
}
export function parseTrace(raw: string): TraceEvidence {
  const out: TraceEvidence = {
    valid: true,
    hops: [],
    reached: false,
    warnings: [],
  };
  const invalid = (message: string) => {
    out.valid = false;
    out.warnings.push(message);
  };
  if (!raw.trim() || raw.length > TRACE_LIMIT) {
    invalid(
      raw.length > TRACE_LIMIT
        ? 'Trace output exceeds 20,000 characters.'
        : 'No traceroute output supplied.',
    );
    return out;
  }
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const headers = lines.filter((l) =>
    /^Tracing route to |^traceroute to /.test(l),
  );
  if (headers.length !== 1) {
    invalid('Exactly one supported English IPv4 trace header is required.');
    return out;
  }
  const start = lines.indexOf(headers[0]);
  if (start !== 0) {
    invalid(
      'Paste the trace from its header, without unrelated command output.',
    );
    return out;
  }
  const windows = /^Tracing route to /.test(headers[0]);
  const header = windows
    ? headers[0].match(
        /^Tracing route to (\S+\s+\[[\d.]+\]|[\d.]+)(?:\s+over a maximum of (\d+) hops:?)?$/,
      )
    : headers[0].match(
        /^traceroute to \S+ \(([\d.]+)\), (\d+) hops max, \d+ byte packets$/,
      );
  const target = header
    ? windows
      ? (header[1].match(/\[([\d.]+)\]$/)?.[1] ?? header[1])
      : header[1]
    : undefined;
  if (!target || parseIPv4(target) === null) {
    invalid('The trace target/header is unsupported or malformed.');
    return out;
  }
  out.target = target;
  let firstRow = 1;
  let maximum: string | undefined = header?.[2];
  if (windows && !maximum) {
    maximum = lines[1]?.match(/^over a maximum of (\d+) hops:?$/)?.[1];
    firstRow = 2;
  }
  out.maxHops = Number(maximum);
  if (!Number.isInteger(out.maxHops) || out.maxHops < 1 || out.maxHops > 255) {
    invalid('The maximum-hop bound is invalid or unsupported.');
    return out;
  }
  let previous = 0;
  let footer = false;
  for (const line of lines.slice(firstRow)) {
    if (windows && line === 'Trace complete.') {
      if (footer) invalid('Repeated completion footers are ambiguous.');
      footer = true;
      continue;
    }
    if (footer) {
      invalid('Unexpected output follows the completion footer.');
      continue;
    }
    const row = line.match(/^(\d+)\s+(.+)$/);
    if (!row) {
      invalid(
        'A trace line could not be interpreted. Include one complete supported trace.',
      );
      continue;
    }
    const hop: TraceHop = {
      index: Number(row[1]),
      responders: [],
      rtts: [],
      silent: 0,
      annotations: [],
    };
    if (hop.index <= previous || hop.index < 1 || hop.index > out.maxHops) {
      invalid(
        'Hop numbers are repeated, out of order or outside the header bound.',
      );
    }
    previous = hop.index;
    if (windows) {
      const parts = row[2].match(
        /^((?:(?:\*|<?\d+(?:\.\d+)?\s*ms)\s+){1,10})(.+)$/,
      );
      if (!parts) {
        invalid('A Windows hop row has an unsupported probe layout.');
        continue;
      }
      for (const probe of parts[1].matchAll(
        /\*|(< ?\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*ms/g,
      )) {
        if (probe[0] === '*') hop.silent++;
        else hop.rtts.push(probe[1].replace(/ /g, ''));
      }
      if (parts[2] === 'Request timed out.') {
        if (hop.rtts.length)
          invalid('A timed-out row also reports response times.');
      } else {
        const addressMatch = parts[2].match(
          /^(?:([\d.]+)|\S+\s+\[([\d.]+)\])$/,
        );
        const address = addressMatch?.[1] ?? addressMatch?.[2];
        if (!address || parseIPv4(address) === null)
          invalid('A Windows responder address is malformed or unsupported.');
        else hop.responders.push(address);
        if (!hop.rtts.length)
          invalid('A responder address is shown without a response time.');
      }
    } else {
      let rest = row[2];
      let responder: string | undefined;
      let unusedAddress = false;
      while (rest.trim()) {
        rest = rest.trim();
        const address = rest.match(
          /^(?:((?:\d+\.){3}\d+)|[A-Za-z0-9._-]+\s+\(((?:\d+\.){3}\d+)\))(?=\s|$)/,
        );
        if (address) {
          if (unusedAddress)
            invalid('A responder address has no following probe response.');
          const addressValue = address[1] ?? address[2];
          if (parseIPv4(addressValue) === null)
            invalid('A Unix responder IPv4 address is malformed.');
          responder = addressValue;
          unusedAddress = true;
          rest = rest.slice(address[0].length);
          continue;
        }
        const star = rest.match(/^\*(?=\s|$)/);
        if (star) {
          hop.silent++;
          rest = rest.slice(1);
          continue;
        }
        const latency = rest.match(/^(<?\d+(?:\.\d+)?)\s*ms(?=\s|$)/);
        if (latency) {
          if (!responder) invalid('A response time has no responder address.');
          else hop.responders.push(responder);
          hop.rtts.push(latency[1]);
          unusedAddress = false;
          rest = rest.slice(latency[0].length).trim();
          const annotation = rest.match(/^!(H|N|P|X)(?=\s|$)/);
          if (annotation) {
            hop.annotations.push(`!${annotation[1]}`);
            rest = rest.slice(annotation[0].length);
          }
          continue;
        }
        invalid('A Unix hop row has unsupported text or annotations.');
        break;
      }
      if (unusedAddress)
        invalid('A responder address has no following response time.');
      hop.responders = [...new Set(hop.responders)];
    }
    if (
      hop.rtts.some(
        (value) => !Number.isFinite(Number(value.replace(/^</, ''))),
      )
    )
      invalid('A response time is not finite.');
    if (hop.silent + hop.rtts.length < 1 || hop.silent + hop.rtts.length > 10)
      invalid('The probe count in a hop is unsupported.');
    out.hops.push(hop);
  }
  if (!out.hops.length || out.hops.length > 255)
    invalid('No supported hop rows were found, or there are too many rows.');
  out.reached =
    out.valid &&
    out.hops.some(
      (h) =>
        h.responders.includes(out.target!) &&
        h.rtts.length > 0 &&
        h.annotations.length === 0,
    );
  return out;
}
