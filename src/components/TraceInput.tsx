export const traceExamples = {
  reached: `Tracing route to 1.1.1.1 over a maximum of 30 hops
  1  1 ms  1 ms  2 ms  192.0.2.1
  2  *  *  *  Request timed out.
  3  12 ms  13 ms  12 ms  1.1.1.1
Trace complete.`,
  bounded: `traceroute to 1.1.1.1 (1.1.1.1), 3 hops max, 60 byte packets
 1 192.0.2.1 1 ms 1 ms 2 ms
 2 * * *
 3 * * *`,
  prohibited: `traceroute to 1.1.1.1 (1.1.1.1), 30 hops max, 60 byte packets
 1 192.0.2.1 1 ms 1 ms 2 ms
 2 192.0.2.2 3 ms !X 3 ms !X 4 ms !X`,
};
export function TraceInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <section className="ping-input" aria-labelledby="trace-title">
      <h2 id="trace-title">Traceroute evidence</h2>
      <p className="muted" id="trace-help">
        Optional · paste one selected English IPv4 tracert or traceroute output,
        starting at its header. Silent hops do not prove router failure. Nothing
        executes here. Text is saved in local history; remove sensitive details
        before pasting.
      </p>
      <label htmlFor="traceOutput">Pasted traceroute output</label>
      <textarea
        id="traceOutput"
        rows={8}
        maxLength={20000}
        value={value}
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? 'trace-help trace-error' : 'trace-help'}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tracing route to … / traceroute to …"
      />
      {error && (
        <p className="field-error" id="trace-error">
          {error}
        </p>
      )}
      <details className="simulation-controls">
        <summary>Try a simulated trace</summary>
        <p className="muted">
          Simulated examples replace only this traceroute evidence field.
        </p>
        <div className="actions">
          <button type="button" onClick={() => onChange(traceExamples.reached)}>
            Simulated destination response
          </button>
          <button type="button" onClick={() => onChange(traceExamples.bounded)}>
            Simulated bounded trace
          </button>
          <button
            type="button"
            onClick={() => onChange(traceExamples.prohibited)}
          >
            Simulated prohibited probes
          </button>
        </div>
      </details>
    </section>
  );
}
