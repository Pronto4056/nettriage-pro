export const dnsExamples = {
  answer: `Server: resolver.demo.invalid
Address: 192.0.2.53
Non-authoritative answer:
Name: example.com
Address: 192.0.2.20`,
  nxdomain: `;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
;; QUESTION SECTION:
;missing.example. IN A
;; SERVER: 192.0.2.53#53(192.0.2.53)`,
  timeout: `DNS request timed out.
    timeout was 2 seconds.
Server: resolver.demo.invalid
Address: 192.0.2.53
*** Request to resolver.demo.invalid timed-out`,
};
export function DnsInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <section className="ping-input" aria-labelledby="dns-title">
      <h2 id="dns-title">DNS evidence</h2>
      <p id="dns-help" className="muted">
        Optional · paste one complete English nslookup address lookup or dig IN
        A lookup. Resolver addresses are separate from answers. Nothing runs
        here. Text is saved in local history; remove sensitive details before
        pasting.
      </p>
      <label htmlFor="dnsOutput">Pasted DNS lookup output</label>
      <textarea
        id="dnsOutput"
        rows={8}
        maxLength={20000}
        value={value}
        spellCheck={false}
        aria-describedby={error ? 'dns-help dns-output-error' : 'dns-help'}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Server: … / ;; QUESTION SECTION: …"
      />
      {error && (
        <p className="field-error" id="dns-output-error">
          {error}
        </p>
      )}
      <details className="simulation-controls">
        <summary>Try a simulated DNS lookup</summary>
        <p className="muted">
          Simulated examples replace only this DNS evidence field.
        </p>
        <div className="actions">
          <button type="button" onClick={() => onChange(dnsExamples.answer)}>
            Simulated DNS answer
          </button>
          <button type="button" onClick={() => onChange(dnsExamples.nxdomain)}>
            Simulated NXDOMAIN
          </button>
          <button type="button" onClick={() => onChange(dnsExamples.timeout)}>
            Simulated DNS timeout
          </button>
        </div>
      </details>
    </section>
  );
}
