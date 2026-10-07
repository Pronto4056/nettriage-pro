export const pingExamples = {
  replies: `Pinging 1.1.1.1 with 32 bytes of data:
Reply from 1.1.1.1: bytes=32 time=12ms TTL=57
Reply from 1.1.1.1: bytes=32 time=14ms TTL=57
Ping statistics for 1.1.1.1:
Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),
Minimum = 12ms, Maximum = 14ms, Average = 13ms`,
  loss: `PING 1.1.1.1 (1.1.1.1): 56 data bytes
64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12.0 ms
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=13.0 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=12.5 ms
4 packets transmitted, 3 packets received, 25.0% packet loss
round-trip min/avg/max/stddev = 12.0/12.5/13.0/0.408 ms`,
  unreachable: `Pinging 192.0.2.20 with 32 bytes of data:
Reply from 192.0.2.1: Destination host unreachable.
Reply from 192.0.2.1: Destination host unreachable.
Ping statistics for 192.0.2.20:
Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),`,
};
export function PingInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <section className="ping-input" aria-labelledby="ping-title">
      <h2 id="ping-title">Ping evidence</h2>
      <p id="ping-help" className="muted">
        Optional · paste complete English Windows, Linux or macOS IPv4 ping
        output. Include each run's header and summary. Nothing is executed here.
        Pasted text is saved in local history; remove sensitive details before
        pasting.
      </p>
      <label htmlFor="pingOutput">Pasted ping output</label>
      <textarea
        id="pingOutput"
        rows={8}
        maxLength={20000}
        value={value}
        spellCheck={false}
        aria-describedby={error ? 'ping-help ping-error' : 'ping-help'}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pinging 1.1.1.1 with 32 bytes of data: …"
      />
      {error && (
        <p className="field-error" id="ping-error">
          {error}
        </p>
      )}
      <details className="simulation-controls">
        <summary>Try a simulated sample</summary>
        <p className="muted">
          Simulated examples replace only this evidence field.
        </p>
        <div className="actions">
          <button type="button" onClick={() => onChange(pingExamples.replies)}>
            Simulated replies
          </button>
          <button type="button" onClick={() => onChange(pingExamples.loss)}>
            Simulated packet loss
          </button>
          <button
            type="button"
            onClick={() => onChange(pingExamples.unreachable)}
          >
            Simulated unreachable
          </button>
        </div>
      </details>
    </section>
  );
}
