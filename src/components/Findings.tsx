import type { Result } from '../diagnostics/engine';
export function Findings({ result }: { result: Result }) {
  if (Object.keys(result.errors).length) return null;
  const warnings = result.findings.filter((f) => f.severity !== 'info').length;
  return (
    <section aria-labelledby="results-title" className="results">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            ANALYSIS / CONFIGURATION &amp; EVIDENCE
          </span>
          <h2 id="results-title">
            {warnings
              ? 'Findings need review'
              : result.findings.some(
                    (f) => f.id.startsWith('ping-') || f.id.startsWith('dns-'),
                  )
                ? 'Evidence analyzed'
                : result.network
                  ? 'Calculations complete'
                  : 'More evidence needed'}
          </h2>
        </div>
        <span className="badge">{warnings} review items</span>
      </div>
      {result.network && (
        <div className="subnet-grid">
          <div>
            <span>Network</span>
            <strong>
              {result.network.network}/{result.network.prefix}
            </strong>
          </div>
          <div>
            <span>Address category</span>
            <strong>{result.category}</strong>
          </div>
          <div>
            <span>Usable range</span>
            <strong>
              {result.network.first} — {result.network.last}
            </strong>
          </div>
          <div>
            <span>Broadcast</span>
            <strong>
              {result.network.broadcast ?? 'Not applicable (/31 or /32)'}
            </strong>
          </div>
        </div>
      )}
      {result.findings.map((f) => (
        <details
          className={`finding ${f.severity}`}
          key={f.id}
          open={f.severity !== 'info' || f.id === 'missing-evidence'}
        >
          <summary>
            <span className="finding-dot" />
            <strong>{f.title}</strong>
            <span className="finding-label">
              {f.severity} · {f.confidence}
            </span>
          </summary>
          <div className="finding-body">
            <p>
              <b>Evidence</b>
              {f.evidence}
            </p>
            <p>
              <b>Meaning</b>
              {f.meaning}
            </p>
            <p>
              <b>Next test</b>
              {f.next}
            </p>
          </div>
        </details>
      ))}
    </section>
  );
}
