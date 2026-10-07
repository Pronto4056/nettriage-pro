# Command reference verification and walkthrough

Seven Windows entries were actually executed. Eight Linux/macOS entries were reviewed against primary documentation and demonstrated with synthetic output; they were not executed on those platforms. This report verifies operating-system commands, not NetTriage command-output parsers, which are still planned.

## Actual execution results

Raw machine output stayed in memory and was discarded. Saved evidence includes no local IP addresses, hostnames, resolver identities, MAC addresses, route destinations, remote socket endpoints, or process IDs. See [sanitized execution evidence](command-execution.json) and [DNS recheck](dns-execution-recheck.json).

| Listed entry           | Actual test invocation                     | Observation                                                                                                 | Assessment                                                                                      |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ipconfig /all`        | Same command                               | Exit 0; one IPv4-address field returned                                                                     | Listing worked; configuration is a snapshot, not connectivity proof                             |
| `ping 192.168.1.1`     | `ping -4 -n 4 -w 1000 1.1.1.1`             | 4 sent, 4 echo replies, 0 lost                                                                              | Public test succeeded; the sample private gateway was not probed                                |
| `tracert -d 1.1.1.1`   | `tracert -4 -d -h 8 -w 500 1.1.1.1`        | Exit 0; 8 hop rows; destination not seen                                                                    | Tool ran; bounded trace is inconclusive about the full path                                     |
| `nslookup example.com` | `nslookup -timeout=2 -retry=1 example.com` | Restricted run timed out despite exit 0. Recheck outside restriction returned the queried name, no timeouts | Successful DNS answer on recheck; initial timeout must not be attributed to the user's resolver |
| `route print`          | Same command                               | Exit 0; IPv4 route table returned                                                                           | Listing worked; does not test forwarding                                                        |
| `arp -a`               | Same command                               | Exit 0; 10 cache rows                                                                                       | Listing worked; cache contents do not prove a neighbor is currently reachable                   |
| `netstat -ano`         | Same command                               | Exit 0; 154 TCP/UDP rows                                                                                    | Listing worked; socket state is not a malware verdict                                           |

The DNS behavior changed when only the execution restriction changed. This supports an environment-related explanation for the initial failure; it does not identify the exact filtering mechanism. Process exit 0 alone was insufficient to classify DNS success. The same caution applies to traceroute completion.

## Complete 15-entry test matrix

| #   | OS          | Command                 | Purpose / expected output                                     | Evidence mode                                                           | Limitations                                                                                                                              |
| --- | ----------- | ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Windows     | `ipconfig /all`         | Interface address, mask, gateway, DHCP, and DNS configuration | Actual listing; synthetic walkthrough below                             | Includes disconnected/virtual interfaces. Lease/configuration data is not reachability evidence.                                         |
| 2   | Windows     | `ping 192.168.1.1`      | ICMP response and RTT statistics from an example gateway      | Actual bounded public-target adaptation; synthetic gateway output below | Replace the sample with the actual gateway. No reply can reflect filtering; an unreachable message can come from an intermediate sender. |
| 3   | Windows     | `tracert -d 1.1.1.1`    | Numeric hop addresses and probe response times                | Actual bounded adaptation; synthetic full trace below                   | Limit reached ≠ destination down. Some routers forward traffic without answering TTL-expired probes.                                     |
| 4   | Windows     | `nslookup example.com`  | Resolver identity, queried name, and returned records/errors  | Actual query and restriction recheck; synthetic walkthrough             | Distinguish resolver address from answer addresses. Timeouts, NXDOMAIN, and SERVFAIL have different meanings.                            |
| 5   | Windows     | `route print`           | Interfaces plus IPv4/IPv6 routes, gateways, and metrics       | Actual listing; synthetic walkthrough                                   | The routing table chooses forwarding behavior; a route entry does not prove the next hop works.                                          |
| 6   | Windows     | `arp -a`                | IPv4 neighbor cache with addresses/MACs/types                 | Actual listing; synthetic walkthrough                                   | Empty or stale entries can be valid. ARP does not cover remote hosts or IPv6 neighbor discovery.                                         |
| 7   | Windows     | `netstat -ano`          | Numeric sockets, state, and process IDs; includes listeners   | Actual listing; synthetic walkthrough                                   | UDP is connectionless; a UDP row is not an established connection. Snapshot alone cannot identify malicious activity.                    |
| 8   | Linux       | `ip address`            | Interface state and IPv4/IPv6 addresses/prefixes              | Simulated, not executed                                                 | An UP interface/address is not proof of internet connectivity. Tool availability depends on iproute2.                                    |
| 9   | Linux       | `ip route`              | Default and more-specific routes                              | Simulated, not executed                                                 | Default output usually covers the main IPv4 table, not every policy-routing table.                                                       |
| 10  | Linux       | `ss -tun`               | Numeric TCP/UDP socket state                                  | Simulated, not executed                                                 | Without `-a`/`-l`, this is not a complete listening-socket inventory. Add `-l` for listeners, or `-a` for all.                           |
| 11  | Linux/macOS | `ping -c 4 1.1.1.1`     | Four probes and sample loss/RTT statistics                    | Simulated, not executed                                                 | Count is bounded; timeout flags differ by OS. ICMP success does not establish DNS or HTTPS health.                                       |
| 12  | Linux/macOS | `traceroute -n 1.1.1.1` | Numeric hop response times                                    | Simulated, not executed                                                 | Typically uses UDP probes, unlike Windows tracert's ICMP. May be uninstalled or restricted. Some paths differ by probe protocol.         |
| 13  | Linux/macOS | `dig example.com`       | DNS header status, answer section, and responding server      | Simulated, not executed                                                 | Tool may be unavailable. NOERROR with no address answer is possible; NXDOMAIN is a name-level negative response.                         |
| 14  | macOS       | `ifconfig`              | Interface flags, addresses, and masks                         | Simulated, not executed                                                 | Some masks are hexadecimal. Interfaces can be virtual or inactive; default routes and DNS require other commands.                        |
| 15  | macOS       | `netstat -rn`           | Numeric IPv4/IPv6 routing tables                              | Simulated, not executed                                                 | This is a route-table mode, not a socket listing. Flags/columns differ from Windows netstat.                                             |

## Walkthrough — all output below is synthetic

Every code block in this section is a hand-authored representative fixture. None is captured from this computer or a claim of execution on Linux/macOS. Documentation address blocks and invented host/MAC identifiers are used for privacy. Real output varies by OS release, locale, installed version, and network.

### 1. Windows: ipconfig /all

```text
Windows IP Configuration
   Host Name . . . . . . . . . . . . : demo-host
Ethernet adapter Demo:
   Physical Address. . . . . . . . . : 02-00-00-00-00-42
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.0.2.42(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.0.2.1
   DNS Servers . . . . . . . . . . . : 192.0.2.53
```

Read: the interface has a /24, a gateway in that subnet, and a configured resolver. Nothing here proves that either server responds. Documentation addresses are used only for this illustration.

### 2. Windows: ping a gateway

```text
Pinging 192.0.2.1 with 32 bytes of data:
Reply from 192.0.2.1: bytes=32 time=1ms TTL=64
Reply from 192.0.2.1: bytes=32 time=1ms TTL=64
Reply from 192.0.2.1: bytes=32 time=2ms TTL=64
Reply from 192.0.2.1: bytes=32 time=1ms TTL=64
Ping statistics for 192.0.2.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 1ms, Maximum = 2ms, Average = 1ms
```

Read: four echo replies from the intended target support ICMP reachability during this sample. Four packets cannot establish long-term reliability, DNS health, or application health. In the actual test, 1.1.1.1 was used instead of an unknown private gateway.

### 3. Windows: tracert -d

```text
Tracing route to 1.1.1.1 over a maximum of 30 hops
  1     1 ms     1 ms     2 ms  192.0.2.1
  2     *        *        *     Request timed out.
  3    12 ms    13 ms    12 ms  1.1.1.1
Trace complete.
```

Read: a destination reply after a silent intermediate hop demonstrates why a hop timeout must not be labeled a failed router. The real trace was capped at eight hops and did not see the destination; it cannot be treated as this successful synthetic example.

### 4. Windows: nslookup

```text
Server:  resolver.demo.invalid
Address:  192.0.2.53
Non-authoritative answer:
Name:    example.com
Addresses:  2001:db8::20
          192.0.2.20
```

Read: the resolver address comes before the answer and must not be mistaken for the resolved destination. Non-authoritative answers can be normal cached/recursive results. These answer addresses are invented documentation fixtures, not the current records for example.com.

### 5. Windows: route print

```text
IPv4 Route Table
Active Routes:
Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0        192.0.2.1      192.0.2.42      25
        192.0.2.0    255.255.255.0         On-link       192.0.2.42     281
```

Read: destinations without a more-specific matching route use the default next hop. The on-link route covers the local subnet. Do not change routes merely because one ping failed.

### 6. Windows: arp -a

```text
Interface: 192.0.2.42 --- 0x6
  Internet Address      Physical Address      Type
  192.0.2.1             02-00-00-00-00-01     dynamic
```

Read: the gateway address has a cached link-layer mapping. Dynamic does not mean verified right now; entries can age out or become stale.

### 7. Windows: netstat -ano

```text
Proto  Local Address          Foreign Address        State           PID
TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       4242
TCP    192.0.2.42:50000       192.0.2.20:443          ESTABLISHED     4242
UDP    0.0.0.0:5353           *:*                                    5151
```

Read: TCP includes a listener and an established socket. UDP has no TCP-style connection state. All endpoints and process IDs in this example are fictional.

### 8. Linux: ip address

```text
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    link/ether 02:00:00:00:00:42 brd ff:ff:ff:ff:ff:ff
    inet 192.0.2.42/24 brd 192.0.2.255 scope global eth0
```

Read: /24 is directly supplied with the address; interface and link flags add context. Even LOWER_UP does not guarantee a working gateway, route, resolver, or destination.

### 9. Linux: ip route

```text
default via 192.0.2.1 dev eth0 proto dhcp metric 100
192.0.2.0/24 dev eth0 proto kernel scope link src 192.0.2.42
```

Read: the default gateway and connected route are consistent with the sample interface. Policy rules or other routing tables can change actual selection.

### 10. Linux: ss -tun

```text
Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port
tcp   ESTAB 0      0      192.0.2.42:50000  192.0.2.20:443
```

Read: this command shows TCP/UDP sockets numerically, but is not the same as listing all listeners. Use `ss -tuln` for listening TCP/UDP sockets or `ss -tuna` for all TCP/UDP sockets.

### 11. Linux/macOS: ping -c 4

```text
PING 1.1.1.1 (1.1.1.1): 56 data bytes
64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12.1 ms
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12.0 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=12.3 ms
64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=12.1 ms
--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 12.0/12.125/12.3/0.109 ms
```

Read: representative BSD/macOS-style summary; Linux commonly uses different packet wording and an `rtt min/avg/max/mdev` summary. Do not require one exact text layout across platforms.

### 12. Linux/macOS: traceroute -n

```text
traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets
 1  192.0.2.1  1.0 ms  1.1 ms  1.0 ms
 2  * * *
 3  1.1.1.1  12.0 ms  12.3 ms  12.1 ms
```

Read: numeric hops avoid reverse DNS lookup delay. The silent second hop does not prevent the destination replying. Default Unix traceroute often uses UDP, so compare protocol differences when Windows tracert behaves differently.

### 13. Linux/macOS: dig

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
;; QUESTION SECTION:
;example.com. IN A
;; ANSWER SECTION:
example.com. 300 IN A 192.0.2.20
;; SERVER: 192.0.2.53#53(192.0.2.53)
```

Read: the header is successful and there is one A answer in this fixture. NOERROR without an address answer would require additional interpretation. A failure such as NXDOMAIN is different from a resolver timeout.

### 14. macOS: ifconfig

```text
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
    ether 02:00:00:00:00:42
    inet 192.0.2.42 netmask 0xffffff00 broadcast 192.0.2.255
    status: active
```

Read: `0xffffff00` corresponds to 255.255.255.0 /24. This output does not provide the default route or establish DNS health.

### 15. macOS: netstat -rn

```text
Routing tables
Internet:
Destination        Gateway            Flags       Netif Expire
default            192.0.2.1           UGScg       en0
192.0.2            link#6             UCS         en0
```

Read: `-r` selects routes, and `-n` suppresses name resolution. Do not interpret this output as the Windows netstat socket format.

## Recommended reference corrections

No production changes were applied during this review.

1. Make the sample-gateway substitution prominent before copying `ping 192.168.1.1`; it is not a universal gateway.
2. Offer bounded Windows examples (`-n 4 -w 1000`, and tracert `-h 8 -w 500`) alongside the basic syntax; label shortened traces as incomplete samples.
3. Explain that Linux `ss -tun` does not include every listener; add `ss -tuln` / `ss -tuna` as purpose-specific alternatives.
4. Explain UDP-vs-ICMP traceroute differences and optional-tool availability.
5. Explain resolver-vs-answer addresses for nslookup, answer count for dig, and the distinct meanings of DNS errors.
6. Keep execution separate from interpretation: a zero process exit does not guarantee a successful network test, as this DNS run demonstrated.

## Primary references

- [Microsoft ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig), [ping](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping), [TRACERT behavior](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/trace-route-troubleshoot-tcp-ip-problems), [nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup).
- [Microsoft route](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/route_ws2008), [arp](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/arp), [netstat](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netstat).
- [iproute2 ip manual](https://man7.org/linux/man-pages/man8/ip.8.html), [ss manual](https://man7.org/linux/man-pages/man8/ss.8.html), [Linux ping manual](https://man7.org/linux/man-pages/man8/ping.8.html), [traceroute manual](https://man7.org/linux/man-pages/man8/traceroute.8.html).
- [BIND DNS tool manuals](https://bind9.readthedocs.io/en/latest/manpages.html).
- [Apple ifconfig source manual](https://github.com/apple-oss-distributions/network_cmds/blob/main/ifconfig.tproj/ifconfig.8), [Apple netstat source manual](https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1).

## Reproduce Windows checks

From this project directory, run `./scripts/verify-commands.ps1` in PowerShell. The script uses read-only listings and bounded public-target probes, caps each process at 20 seconds, and persists summaries only. It never changes interfaces, routes, DNS configuration, or firewall settings. Review the JSON observations instead of treating process exit codes as network-health verdicts.
