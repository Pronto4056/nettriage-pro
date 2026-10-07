import { parseIPv4 } from '../network/ipv4';
export type DnsStatus =
  | 'ANSWER'
  | 'NO_ADDRESS'
  | 'NXDOMAIN'
  | 'SERVFAIL'
  | 'REFUSED'
  | 'TIMEOUT'
  | 'UNKNOWN';
export interface DnsEvidence {
  valid: boolean;
  status: DnsStatus;
  query?: string;
  resolver?: string;
  addresses: string[];
  warnings: string[];
}
export const DNS_LIMIT = 20000;
const name = (value: string) => value.toLowerCase().replace(/\.$/, '');
const domain = (value: string) =>
  value.length <= 253 &&
  value
    .split('.')
    .every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
export function parseDns(raw: string): DnsEvidence {
  const out: DnsEvidence = {
    valid: true,
    status: 'UNKNOWN',
    addresses: [],
    warnings: [],
  };
  const invalid = (message: string) => {
    out.valid = false;
    out.warnings.push(message);
  };
  if (!raw.trim() || raw.length > DNS_LIMIT) {
    invalid(
      raw.length > DNS_LIMIT
        ? 'DNS output exceeds 20,000 characters.'
        : 'No DNS output supplied.',
    );
    return out;
  }
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n');
  const timeout =
    /DNS request timed out|Request to .+ timed-out|communications error.*timed out|no servers could be reached/i.test(
      text,
    );
  const statuses = [
    ...text.matchAll(
      /^;;\s*->>HEADER<<-\s*opcode:\s*QUERY,\s*status:\s*([A-Z]+),/gm,
    ),
  ].map((m) => m[1]);
  if (statuses.length) {
    if (statuses.length !== 1)
      invalid('Multiple DNS responses were found. Paste one lookup at a time.');
    if (/^\s*(?:Server:|Name:|\*+.*?(?:can't find|cannot find))/im.test(text))
      invalid('Mixed nslookup and dig output cannot be combined.');
    const questions: string[] = [];
    const records: { owner: string; type: string; value: string }[] = [];
    let section = '';
    for (const line of lines) {
      const heading = line.match(/^;;\s+([A-Z]+) SECTION:/);
      if (heading) {
        section = heading[1];
        continue;
      }
      if (line.startsWith(';;')) {
        section = '';
        continue;
      }
      if (section === 'QUESTION' && line.trim()) {
        const question = line.match(/^;([^\s]+)\s+IN\s+A\s*$/);
        if (!question) invalid('Only an IN A question is supported.');
        else questions.push(name(question[1]));
      }
      if (section === 'ANSWER' && line.trim()) {
        const record = line.match(/^([^\s]+)\s+\d+\s+IN\s+(\S+)\s+(\S+)\s*$/);
        if (!record) invalid('An answer record could not be interpreted.');
        else
          records.push({
            owner: name(record[1]),
            type: record[2],
            value: record[3],
          });
      }
      const resolver = line.match(/^;; SERVER:\s*([\d.]+)#\d+/)?.[1];
      if (resolver) {
        if (parseIPv4(resolver) !== null) out.resolver = resolver;
        else invalid('Resolver IPv4 address is malformed.');
      }
    }
    // SERVER metadata is outside sections and can be suppressed; its absence is unknown.
    const resolver = text.match(/^;; SERVER:\s*([\d.]+)#\d+/m)?.[1];
    if (resolver) {
      if (parseIPv4(resolver) !== null) out.resolver = resolver;
      else invalid('Resolver IPv4 address is malformed.');
    }
    if (questions.length !== 1 || !domain(questions[0] ?? ''))
      invalid('Exactly one valid IN A question is required.');
    else out.query = questions[0];
    const answerCount = text.match(/\bANSWER:\s*(\d+)/)?.[1];
    if (answerCount === undefined || Number(answerCount) !== records.length)
      invalid(
        'The answer count and pasted answer records disagree. Include the complete lookup.',
      );
    const allowed = new Set<string>(out.query ? [out.query] : []);
    let current = out.query;
    while (current) {
      const aliases = records.filter(
        (r) => r.owner === current && r.type === 'CNAME',
      );
      if (aliases.length > 1) {
        invalid('Conflicting canonical-name records were found.');
        break;
      }
      if (!aliases.length) break;
      const next = name(aliases[0].value);
      if (!domain(next) || allowed.has(next)) {
        invalid('The canonical-name chain is invalid or cyclic.');
        break;
      }
      if (records.some((r) => r.owner === current && r.type === 'A'))
        invalid('An owner has both canonical-name and address records.');
      allowed.add(next);
      current = next;
    }
    for (const record of records) {
      if (!allowed.has(record.owner))
        invalid(
          'An answer record does not belong to the queried name or its canonical-name chain.',
        );
      if (record.type === 'A') {
        if (parseIPv4(record.value) === null)
          invalid('An answer IPv4 address is malformed.');
        else out.addresses.push(record.value);
      } else if (record.type !== 'CNAME')
        invalid(
          'This answer record type is outside IPv4 address-query support.',
        );
    }
    if (timeout)
      invalid(
        'Timeout messages and a DNS response appear together; paste one complete lookup.',
      );
    const status = statuses[0];
    if (status === 'NOERROR')
      out.status = out.addresses.length ? 'ANSWER' : 'NO_ADDRESS';
    else if (['NXDOMAIN', 'SERVFAIL', 'REFUSED'].includes(status)) {
      out.status = status as DnsStatus;
      if (out.addresses.length)
        invalid('Failure status conflicts with address answers.');
    } else invalid('This DNS response status is unsupported.');
  } else {
    if (
      (text.match(/^\s*Server:/gm)?.length ?? 0) > 1 ||
      (text.match(/^\s*Name:/gm)?.length ?? 0) > 1
    )
      invalid(
        'Multiple nslookup responses were found. Paste one lookup at a time.',
      );
    const failures = [
      ...text.matchAll(
        /^\s*\*+.*?(?:can't find|cannot find)\s+(\S+):\s*(Non-existent domain|NXDOMAIN|Server failed|SERVFAIL|Query refused|REFUSED)/gim,
      ),
    ];
    if (failures.length > 1) invalid('Multiple failure results were found.');
    const resolverLine = lines.findIndex((l) => /^\s*Server:/i.test(l));
    const answerLine = lines.findIndex((l) => /^\s*Name:/i.test(l));
    if (answerLine >= 0 && resolverLine > answerLine)
      invalid(
        'A resolver block follows an answer block; paste one complete lookup in its original order.',
      );
    if (resolverLine >= 0) {
      const address = lines
        .slice(resolverLine + 1, answerLine >= 0 ? answerLine : undefined)
        .find((l) => /^\s*Address:/i.test(l))
        ?.match(/Address:\s*([^\s#]+)/i)?.[1];
      if (address) {
        if (parseIPv4(address) !== null) out.resolver = address;
        else if (!address.includes(':'))
          invalid('Resolver IPv4 address is malformed.');
      }
    }
    if (answerLine >= 0) {
      const answerName = lines[answerLine].match(/Name:\s*(\S+)/i)?.[1];
      if (answerName && domain(name(answerName))) out.query = name(answerName);
      else invalid('The answer name is malformed.');
      let addresses = false;
      for (const line of lines.slice(answerLine + 1)) {
        const start = line.match(/^\s*Address(?:es)?:\s*(.*)$/i);
        if (!start && /^\s*[A-Za-z][\w -]*:/.test(line)) addresses = false;
        if (start) addresses = true;
        else if (addresses && /^\s*\S+/.test(line) && !/^\s+/.test(line))
          addresses = false;
        const value =
          start?.[1] ??
          (addresses && /^\s+/.test(line) ? line.trim() : undefined);
        if (value) {
          if (parseIPv4(value) !== null) out.addresses.push(value);
          else if (value.includes(':'))
            out.warnings.push(
              'IPv6 answer text is present but is outside this parser’s IPv4 support.',
            );
          else {
            invalid('An answer IPv4 address is malformed.');
            addresses = false;
          }
        }
      }
      if (out.addresses.length) out.status = 'ANSWER';
      else
        out.warnings.push('No supported IPv4 address answer was recognized.');
    }
    if (failures.length) {
      if (answerLine >= 0 || timeout)
        invalid(
          'Failure, timeout or answer evidence conflicts within this pasted lookup.',
        );
      const failure = failures[0];
      out.query = name(failure[1]);
      if (!domain(out.query)) invalid('The failed query name is malformed.');
      out.status = /Non-existent domain|NXDOMAIN/i.test(failure[2])
        ? 'NXDOMAIN'
        : /Server failed|SERVFAIL/i.test(failure[2])
          ? 'SERVFAIL'
          : 'REFUSED';
    } else if (timeout) {
      if (answerLine >= 0)
        invalid(
          'Timeout and answer evidence conflict within this pasted lookup.',
        );
      out.status = 'TIMEOUT';
    }
    if (answerLine < 0 && !failures.length && !timeout)
      invalid('No supported DNS answer or failure was recognized.');
  }
  out.addresses = [...new Set(out.addresses)];
  if (!out.valid) {
    out.status = 'UNKNOWN';
    out.addresses = [];
  }
  return out;
}
