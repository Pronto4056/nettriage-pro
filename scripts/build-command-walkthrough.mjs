// Keep UI examples grounded in the reviewed, explicitly synthetic report.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const listed = [
  'ipconfig /all',
  'ping 192.168.1.1',
  'tracert -d 1.1.1.1',
  'nslookup example.com',
  'route print',
  'arp -a',
  'netstat -ano',
  'ip address',
  'ip route',
  'ss -tun',
  'ping -c 4 1.1.1.1',
  'traceroute -n 1.1.1.1',
  'dig example.com',
  'ifconfig',
  'netstat -rn',
];
const invocations = [...listed];
invocations[1] = 'ping -n 4 192.0.2.1';
const actual = JSON.parse(
  readFileSync('docs/command-execution.json', 'utf8'),
).results;
const dns = JSON.parse(readFileSync('docs/dns-execution-recheck.json', 'utf8'))
  .results[0];
const observations = [
  'Interface listing returned successfully. Local identifiers were discarded.',
  '4 sent, 4 echo replies, 0 lost against public 1.1.1.1. The listed private gateway was not probed.',
  'The eight-hop trace did not see the destination. This bounded sample is inconclusive about the full path.',
  'The restricted attempt timed out despite exit 0. The unrestricted recheck returned the queried name with no timeouts.',
  'The IPv4 routing table returned successfully. A listed route does not verify forwarding.',
  'The cache listing returned successfully. Cached mappings do not prove current neighbor reachability.',
  'The socket listing returned successfully. Endpoints and process IDs were discarded.',
];
const report = readFileSync('docs/command-verification.md', 'utf8');
const sections = Array.from(
  report.matchAll(
    /### (\d+)\. ([^\n]+)\n+```text\n([\s\S]*?)\n```\n+([\s\S]*?)(?=\n### |\n## |$)/g,
  ),
);
if (sections.length !== 15)
  throw new Error('Expected all 15 reviewed examples');
const examples = sections.map((match, index) => ({
  command: listed[index],
  invocation: invocations[index],
  output: match[3],
  interpretation: match[4].trim().replace(/^Read: /, ''),
  actual:
    index < 7
      ? {
          invocation: index === 3 ? dns.command : actual[index].command,
          observedAt: 'October 6, 2026',
          summary: observations[index],
        }
      : null,
}));
mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/commandWalkthrough.ts',
  'export interface CommandExample { command: string; invocation: string; output: string; interpretation: string; actual: {invocation: string; observedAt: string; summary: string} | null }\nexport const commandExamples: CommandExample[] = ' +
    JSON.stringify(examples, null, 2) +
    ';\n',
);
