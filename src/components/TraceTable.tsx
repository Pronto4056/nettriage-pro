import type { TraceEvidence } from '../evidence/trace';
export function TraceTable({ trace }: { trace: TraceEvidence }) {
  if (!trace.valid) return null;
  return (
    <div
      className="trace-table-wrap"
      role="region"
      aria-label="Observed trace hop table"
      tabIndex={0}
    >
      <table className="trace-table">
        <caption>
          Observed trace to {trace.target} · probe observations, not verified
          topology
        </caption>
        <thead>
          <tr>
            <th scope="col">Hop</th>
            <th scope="col">Responders</th>
            <th scope="col">RTTs (ms)</th>
            <th scope="col">Silent probes</th>
            <th scope="col">Annotations</th>
          </tr>
        </thead>
        <tbody>
          {trace.hops.map((h) => (
            <tr key={h.index}>
              <th scope="row">{h.index}</th>
              <td>
                {h.responders.length ? h.responders.join(', ') : 'Unknown'}
              </td>
              <td>{h.rtts.length ? h.rtts.join(', ') : 'No response shown'}</td>
              <td>{h.silent}</td>
              <td>
                {h.annotations.length
                  ? [...new Set(h.annotations)].join(', ')
                  : 'None shown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="trace-table-hint muted">
        Swipe or scroll horizontally to see all columns.
      </p>
    </div>
  );
}
