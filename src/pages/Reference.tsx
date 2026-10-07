import { useState } from 'react';
import { commandExamples } from '../data/commandWalkthrough';
const commands = [
  [
    'Windows',
    'ipconfig /all',
    'Inspect interface addresses, DHCP leases, gateways, and configured resolvers.',
  ],
  [
    'Windows',
    'ping 192.168.1.1',
    'Test ICMP response from a sample gateway. Replace with your gateway; lack of a reply is inconclusive.',
  ],
  [
    'Windows',
    'tracert -d 1.1.1.1',
    'Observe responding hops without reverse DNS delays. A timeout alone does not locate a failed router.',
  ],
  [
    'Windows',
    'nslookup example.com',
    'Ask the configured resolver for a name; note which server answered.',
  ],
  ['Windows', 'route print', 'Inspect default routes and next hops.'],
  [
    'Windows',
    'arp -a',
    'Inspect cached IPv4 neighbor mappings; a stale entry does not prove current availability.',
  ],
  [
    'Windows',
    'netstat -ano',
    'Inspect connections and listening sockets with process IDs.',
  ],
  ['Linux', 'ip address', 'Inspect interface addresses and prefix lengths.'],
  ['Linux', 'ip route', 'Inspect the routing table and default gateway.'],
  ['Linux', 'ss -tun', 'Inspect TCP/UDP socket state.'],
  [
    'Linux / macOS',
    'ping -c 4 1.1.1.1',
    'Collect a bounded ICMP sample to a numeric destination.',
  ],
  [
    'Linux / macOS',
    'traceroute -n 1.1.1.1',
    'Inspect responding hops. Protocol and filtering differences can affect the path shown.',
  ],
  [
    'Linux / macOS',
    'dig example.com',
    'Inspect DNS status and the answer section. NOERROR does not always mean an address answer exists.',
  ],
  [
    'macOS',
    'ifconfig',
    'Inspect interfaces and addresses; masks may be shown in hexadecimal.',
  ],
  ['macOS', 'netstat -rn', 'Inspect routes numerically.'],
];
export function CommandReference() {
  const [notice, setNotice] = useState('');
  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setNotice(`Copied: ${command}`);
    } catch {
      setNotice('Copy unavailable. Select the command text to copy it.');
    }
  }
  return (
    <>
      <span className="eyebrow">FIELD REFERENCE</span>
      <h1>Commands with a purpose.</h1>
      <p className="intro">
        Run commands in your own terminal. NetTriage never executes them or
        probes your network.
      </p>
      <p className="walkthrough-intro">
        All 15 entries include simulated output and interpretation. Seven
        include actual Windows observations from October 6, 2026. These examples
        were not executed on Linux or macOS. No commands run from this page.
      </p>
      <p role="status">{notice}</p>
      <div className="command-list">
        {commands.map(([os, command, meaning]) => {
          const example = commandExamples.find(
            (item) => item.command === command,
          )!;
          return (
            <article className="panel command" key={command}>
              <span className="eyebrow">{os}</span>
              <div>
                <code>{command}</code>
                <button
                  onClick={() => copy(command)}
                  aria-label={`Copy ${command}`}
                >
                  Copy
                </button>
              </div>
              <p>{meaning}</p>
              <details className="command-example">
                <summary>Example output &amp; interpretation</summary>
                <div className="example-content">
                  {example.actual && (
                    <div className="actual-observation">
                      <span className="eyebrow">
                        Actual Windows observation · {example.actual.observedAt}
                      </span>
                      <code>{example.actual.invocation}</code>
                      <p>{example.actual.summary}</p>
                    </div>
                  )}
                  <span className="example-label">
                    Simulated output · illustrative fixture
                  </span>
                  <p className="example-invocation">
                    <b>Example invocation</b>
                    <code>{example.invocation}</code>
                  </p>
                  <pre>
                    <code>{example.output}</code>
                  </pre>
                  <p>
                    <b>How to read it</b> {example.interpretation}
                  </p>
                  {!example.actual && (
                    <p className="example-limit">
                      Not executed on {os}. This fixture demonstrates output
                      structure and interpretation only.
                    </p>
                  )}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}
const guides = [
  [
    'No internet connection',
    [
      'Confirm which interface is active and inspect its IPv4, prefix, gateway, and DNS configuration.',
      'Test the gateway, then a known numeric destination. Compare results rather than relying on one ping.',
      'Test name resolution separately. A working numeric destination with a failed lookup points toward a resolver or name issue.',
    ],
  ],
  [
    'Cannot reach the gateway',
    [
      'Verify subnet membership and the default route, including any explicit on-link route.',
      'Check link status and neighbor/ARP state.',
      'A failed ping can reflect ICMP filtering. Test an authorized router service and compare another device on the same link.',
    ],
  ],
  [
    'DNS not resolving',
    [
      'Record the query name, query type, resolver address, and exact response.',
      'Compare the configured resolver with an authorized alternate resolver.',
      'Distinguish NXDOMAIN, timeout, SERVFAIL, and an empty successful response. Check numeric connectivity separately.',
    ],
  ],
  [
    'Destination unreachable / routing issues',
    [
      'Record the device that reported unreachable and the message type.',
      'Review the local route and gateway before assuming an upstream problem.',
      'Use traceroute as supporting evidence. Missing intermediate replies do not prove forwarding failure.',
    ],
  ],
  [
    'Intermittent connection / packet loss',
    [
      'Collect a longer, bounded ping sample to the gateway and a numeric destination.',
      'Compare wired and wireless results and note timestamps.',
      'ICMP rate limiting can resemble loss. Correlate with application behavior and interface counters before changing equipment.',
    ],
  ],
];
export function Guides() {
  return (
    <>
      <span className="eyebrow">TROUBLESHOOTING PLAYBOOKS</span>
      <h1>Follow the evidence.</h1>
      <p className="intro">
        Start locally, test one relationship at a time, and keep uncertainty
        visible.
      </p>
      <div className="guide-list">
        {guides.map(([title, steps]) => (
          <article className="panel" key={title as string}>
            <h2>{title}</h2>
            <ol>
              {(steps as string[]).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </>
  );
}
