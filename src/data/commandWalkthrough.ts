export interface CommandExample {
  command: string;
  invocation: string;
  output: string;
  interpretation: string;
  actual: { invocation: string; observedAt: string; summary: string } | null;
}
export const commandExamples: CommandExample[] = [
  {
    command: 'ipconfig /all',
    invocation: 'ipconfig /all',
    output:
      'Windows IP Configuration\n   Host Name . . . . . . . . . . . . : demo-host\nEthernet adapter Demo:\n   Physical Address. . . . . . . . . : 02-00-00-00-00-42\n   DHCP Enabled. . . . . . . . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : 192.0.2.42(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.0.2.1\n   DNS Servers . . . . . . . . . . . : 192.0.2.53',
    interpretation:
      'the interface has a /24, a gateway in that subnet, and a configured resolver. Nothing here proves that either server responds. Documentation addresses are used only for this illustration.',
    actual: {
      invocation: 'ipconfig /all',
      observedAt: 'October 6, 2026',
      summary:
        'Interface listing returned successfully. Local identifiers were discarded.',
    },
  },
  {
    command: 'ping 192.168.1.1',
    invocation: 'ping -n 4 192.0.2.1',
    output:
      'Pinging 192.0.2.1 with 32 bytes of data:\nReply from 192.0.2.1: bytes=32 time=1ms TTL=64\nReply from 192.0.2.1: bytes=32 time=1ms TTL=64\nReply from 192.0.2.1: bytes=32 time=2ms TTL=64\nReply from 192.0.2.1: bytes=32 time=1ms TTL=64\nPing statistics for 192.0.2.1:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms',
    interpretation:
      'four echo replies from the intended target support ICMP reachability during this sample. Four packets cannot establish long-term reliability, DNS health, or application health. In the actual test, 1.1.1.1 was used instead of an unknown private gateway.',
    actual: {
      invocation: 'ping -4 -n 4 -w 1000 1.1.1.1',
      observedAt: 'October 6, 2026',
      summary:
        '4 sent, 4 echo replies, 0 lost against public 1.1.1.1. The listed private gateway was not probed.',
    },
  },
  {
    command: 'tracert -d 1.1.1.1',
    invocation: 'tracert -d 1.1.1.1',
    output:
      'Tracing route to 1.1.1.1 over a maximum of 30 hops\n  1     1 ms     1 ms     2 ms  192.0.2.1\n  2     *        *        *     Request timed out.\n  3    12 ms    13 ms    12 ms  1.1.1.1\nTrace complete.',
    interpretation:
      'a destination reply after a silent intermediate hop demonstrates why a hop timeout must not be labeled a failed router. The real trace was capped at eight hops and did not see the destination; it cannot be treated as this successful synthetic example.',
    actual: {
      invocation: 'tracert -4 -d -h 8 -w 500 1.1.1.1',
      observedAt: 'October 6, 2026',
      summary:
        'The eight-hop trace did not see the destination. This bounded sample is inconclusive about the full path.',
    },
  },
  {
    command: 'nslookup example.com',
    invocation: 'nslookup example.com',
    output:
      'Server:  resolver.demo.invalid\nAddress:  192.0.2.53\nNon-authoritative answer:\nName:    example.com\nAddresses:  2001:db8::20\n          192.0.2.20',
    interpretation:
      'the resolver address comes before the answer and must not be mistaken for the resolved destination. Non-authoritative answers can be normal cached/recursive results. These answer addresses are invented documentation fixtures, not the current records for example.com.',
    actual: {
      invocation: 'nslookup -timeout=2 -retry=1 example.com',
      observedAt: 'October 6, 2026',
      summary:
        'The restricted attempt timed out despite exit 0. The unrestricted recheck returned the queried name with no timeouts.',
    },
  },
  {
    command: 'route print',
    invocation: 'route print',
    output:
      'IPv4 Route Table\nActive Routes:\nNetwork Destination        Netmask          Gateway       Interface  Metric\n          0.0.0.0          0.0.0.0        192.0.2.1      192.0.2.42      25\n        192.0.2.0    255.255.255.0         On-link       192.0.2.42     281',
    interpretation:
      'destinations without a more-specific matching route use the default next hop. The on-link route covers the local subnet. Do not change routes merely because one ping failed.',
    actual: {
      invocation: 'route print',
      observedAt: 'October 6, 2026',
      summary:
        'The IPv4 routing table returned successfully. A listed route does not verify forwarding.',
    },
  },
  {
    command: 'arp -a',
    invocation: 'arp -a',
    output:
      'Interface: 192.0.2.42 --- 0x6\n  Internet Address      Physical Address      Type\n  192.0.2.1             02-00-00-00-00-01     dynamic',
    interpretation:
      'the gateway address has a cached link-layer mapping. Dynamic does not mean verified right now; entries can age out or become stale.',
    actual: {
      invocation: 'arp -a',
      observedAt: 'October 6, 2026',
      summary:
        'The cache listing returned successfully. Cached mappings do not prove current neighbor reachability.',
    },
  },
  {
    command: 'netstat -ano',
    invocation: 'netstat -ano',
    output:
      'Proto  Local Address          Foreign Address        State           PID\nTCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       4242\nTCP    192.0.2.42:50000       192.0.2.20:443          ESTABLISHED     4242\nUDP    0.0.0.0:5353           *:*                                    5151',
    interpretation:
      'TCP includes a listener and an established socket. UDP has no TCP-style connection state. All endpoints and process IDs in this example are fictional.',
    actual: {
      invocation: 'netstat -ano',
      observedAt: 'October 6, 2026',
      summary:
        'The socket listing returned successfully. Endpoints and process IDs were discarded.',
    },
  },
  {
    command: 'ip address',
    invocation: 'ip address',
    output:
      '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n    link/ether 02:00:00:00:00:42 brd ff:ff:ff:ff:ff:ff\n    inet 192.0.2.42/24 brd 192.0.2.255 scope global eth0',
    interpretation:
      '/24 is directly supplied with the address; interface and link flags add context. Even LOWER_UP does not guarantee a working gateway, route, resolver, or destination.',
    actual: null,
  },
  {
    command: 'ip route',
    invocation: 'ip route',
    output:
      'default via 192.0.2.1 dev eth0 proto dhcp metric 100\n192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.42',
    interpretation:
      'the default gateway and connected route are consistent with the sample interface. Policy rules or other routing tables can change actual selection.',
    actual: null,
  },
  {
    command: 'ss -tun',
    invocation: 'ss -tun',
    output:
      'Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port\ntcp   ESTAB 0      0      192.0.2.42:50000  192.0.2.20:443',
    interpretation:
      'this command shows TCP/UDP sockets numerically, but is not the same as listing all listeners. Use `ss -tuln` for listening TCP/UDP sockets or `ss -tuna` for all TCP/UDP sockets.',
    actual: null,
  },
  {
    command: 'ping -c 4 1.1.1.1',
    invocation: 'ping -c 4 1.1.1.1',
    output:
      'PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12.1 ms\n64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12.0 ms\n64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=12.3 ms\n64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=12.1 ms\n--- 1.1.1.1 ping statistics ---\n4 packets transmitted, 4 packets received, 0.0% packet loss\nround-trip min/avg/max/stddev = 12.0/12.125/12.3/0.109 ms',
    interpretation:
      'representative BSD/macOS-style summary; Linux commonly uses different packet wording and an `rtt min/avg/max/mdev` summary. Do not require one exact text layout across platforms.',
    actual: null,
  },
  {
    command: 'traceroute -n 1.1.1.1',
    invocation: 'traceroute -n 1.1.1.1',
    output:
      'traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets\n 1  192.0.2.1  1.0 ms  1.1 ms  1.0 ms\n 2  * * *\n 3  1.1.1.1  12.0 ms  12.3 ms  12.1 ms',
    interpretation:
      'numeric hops avoid reverse DNS lookup delay. The silent second hop does not prevent the destination replying. Default Unix traceroute often uses UDP, so compare protocol differences when Windows tracert behaves differently.',
    actual: null,
  },
  {
    command: 'dig example.com',
    invocation: 'dig example.com',
    output:
      ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345\n;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0\n;; QUESTION SECTION:\n;example.com. IN A\n;; ANSWER SECTION:\nexample.com. 300 IN A 192.0.2.20\n;; SERVER: 192.0.2.53#53(192.0.2.53)',
    interpretation:
      'the header is successful and there is one A answer in this fixture. NOERROR without an address answer would require additional interpretation. A failure such as NXDOMAIN is different from a resolver timeout.',
    actual: null,
  },
  {
    command: 'ifconfig',
    invocation: 'ifconfig',
    output:
      'en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500\n    ether 02:00:00:00:00:42\n    inet 192.0.2.42 netmask 0xffffff00 broadcast 192.0.2.255\n    status: active',
    interpretation:
      '`0xffffff00` corresponds to 255.255.255.0 /24. This output does not provide the default route or establish DNS health.',
    actual: null,
  },
  {
    command: 'netstat -rn',
    invocation: 'netstat -rn',
    output:
      'Routing tables\nInternet:\nDestination        Gateway            Flags       Netif Expire\ndefault            192.0.2.1           UGScg       en0\n192.0.2            link#6             UCS         en0',
    interpretation:
      '`-r` selects routes, and `-n` suppresses name resolution. Do not interpret this output as the Windows netstat socket format.',
    actual: null,
  },
];
