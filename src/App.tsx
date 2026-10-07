import { useState } from 'react';
import type { FormEvent } from 'react';
import { analyze, type Input, type Result } from './diagnostics/engine';
import { readHistory, persistHistory, type Session } from './lib/history';
import { Findings } from './components/Findings';
import { ConfigurationMap } from './components/ConfigurationMap';
import { ConfirmClearHistory } from './components/ConfirmClearHistory';
import { PingInput } from './components/PingInput';
import { Guides, CommandReference } from './pages/Reference';
const blank: Input = { ip: '', mask: '', gateway: '', dns: '', notes: '' };
const example: Input = {
  ip: '192.168.10.42',
  mask: '/24',
  gateway: '192.168.20.1',
  dns: '1.1.1.1',
  notes: 'Synthetic example: gateway appears to be on a different subnet.',
};
const pages = [
  'Dashboard',
  'Network triage',
  'History',
  'Guides',
  'Commands',
] as const;
type Page = (typeof pages)[number];
export function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [input, setInput] = useState<Input>(blank);
  const [result, setResult] = useState<Result>();
  const [initial] = useState(() => {
    try {
      return readHistory(window.localStorage);
    } catch {
      return {
        sessions: [] as Session[],
        error: 'History storage is unavailable in this browser.',
      };
    }
  });
  const [sessions, setSessions] = useState(initial.sessions);
  const [storageError, setStorageError] = useState(initial.error);
  const [status, setStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  function navigate(next: Page) {
    setPage(next);
    requestAnimationFrame(() => {
      document.getElementById('main')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
  function updateHistory(next: Session[]) {
    try {
      const committed = persistHistory(window.localStorage, sessions, next);
      setStorageError(committed.error);
      setSessions(committed.sessions);
      return !committed.error;
    } catch {
      setStorageError('History could not be saved in this browser.');
      return false;
    }
  }
  function edit(field: keyof Input, value: string) {
    setInput({ ...input, [field]: value });
    setResult(undefined);
    setStatus('');
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const next = analyze(input);
    setResult(next);
    if (Object.keys(next.errors).length) {
      setStatus('Review the marked fields. No session was saved.');
      return;
    }
    if (Object.values(input).every((v) => !v.trim())) {
      setStatus('Add configuration to save a session.');
      return;
    }
    if (initial.error && storageError) {
      setStatus(
        'Analysis complete. Existing unreadable history was preserved; this session was not saved.',
      );
      return;
    }
    const saved = updateHistory(
      [
        {
          id: crypto.randomUUID(),
          created: new Date().toISOString(),
          input: { ...input },
        },
        ...sessions,
      ].slice(0, 50),
    );
    setStatus(
      saved
        ? 'Analysis complete. Session saved on this browser.'
        : 'Analysis complete. Results are available here, but this session was not saved.',
    );
  }
  function start(sample = false) {
    setInput(sample ? example : blank);
    setResult(undefined);
    setStatus('');
    navigate('Network triage');
  }
  function open(session: Session) {
    setInput(session.input);
    setResult(analyze(session.input));
    setStatus(
      'Viewing a saved session. Findings recalculated from the supplied configuration and evidence.',
    );
    navigate('Network triage');
  }
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('Dashboard');
          }}
        >
          <span>
            NETTRIAGE <b>/ PRO</b>
          </span>
        </a>
        <nav aria-label="Primary">
          {pages.map((p) => (
            <button
              key={p}
              className={page === p ? 'active' : ''}
              aria-current={page === p ? 'page' : undefined}
              onClick={() => navigate(p)}
            >
              {p}
            </button>
          ))}
        </nav>
        <span className="header-context">LOCAL / RULE-BASED</span>
      </header>
      <div className="workspace">
        <header className="topbar">
          <span>
            WORKSPACE <span className="slash">/</span> {page}
          </span>
          <span className="local-badge">● Browser-local analysis</span>
        </header>
        <main id="main" tabIndex={-1}>
          {storageError && (
            <div className="notice" role="alert">
              {storageError}
            </div>
          )}
          {page === 'Dashboard' && (
            <>
              <div className="hero">
                <div>
                  <span className="eyebrow">
                    NETWORK TROUBLESHOOTING / RECONSIDERED
                  </span>
                  <h1>
                    Trace the facts.
                    <br />
                    <em>Follow the evidence.</em>
                  </h1>
                  <p className="intro">
                    Turn network configuration into clear findings.
                    <br />
                    Understand the relationship before choosing the next test.
                  </p>
                  <div className="actions">
                    <button className="primary" onClick={() => start()}>
                      Start network triage <span>↗</span>
                    </button>
                    <button onClick={() => start(true)}>
                      Explore an example
                    </button>
                  </div>
                </div>
                <ConfigurationMap />
              </div>
              <div className="section-head">
                <h2>Your workspace</h2>
                <span className="muted">
                  Real sessions. No simulated metrics.
                </span>
              </div>
              <div className="stats">
                <article className="panel">
                  <span>Saved sessions</span>
                  <strong>{sessions.length}</strong>
                  <small>Stored in this browser</small>
                </article>
                <article className="panel">
                  <span>Engine approach</span>
                  <strong className="text-stat">Rule-based</strong>
                  <small>Repeatable configuration checks</small>
                </article>
                <article className="panel">
                  <span>Current milestone</span>
                  <strong className="text-stat">Ping evidence</strong>
                  <small>DNS and traceroute parsing are next</small>
                </article>
              </div>
              <div className="section-head">
                <h2>Recent activity</h2>
                <button onClick={() => navigate('History')}>
                  View history ↗
                </button>
              </div>
              {sessions.length ? (
                <div className="panel session-list">
                  {sessions.slice(0, 3).map((s) => (
                    <button key={s.id} onClick={() => open(s)}>
                      <span>
                        <strong>{s.input.ip || 'Partial configuration'}</strong>
                        <small>{new Date(s.created).toLocaleString()}</small>
                      </span>
                      <span>Open →</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="panel empty">
                  <span className="empty-symbol">⌁</span>
                  <h3>A clear starting point.</h3>
                  <p>
                    Your first diagnostic session will appear here.
                    <br />
                    Start with an interface address and its subnet.
                  </p>
                  <button onClick={() => start()}>
                    Create your first session →
                  </button>
                </div>
              )}
            </>
          )}
          {page === 'Network triage' && (
            <>
              <span className="eyebrow">01 / CONFIGURATION &amp; EVIDENCE</span>
              <h1>Build a clearer picture.</h1>
              <p className="intro">
                Enter interface configuration, pasted ping evidence, or both.
                Blank fields remain unknown.
              </p>
              <div className="triage-layout">
                <form
                  className="panel triage-form"
                  onSubmit={submit}
                  noValidate
                >
                  <div className="section-head">
                    <h2>Interface configuration</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(example);
                        setResult(undefined);
                        setStatus('Synthetic example loaded.');
                      }}
                    >
                      Load example
                    </button>
                  </div>
                  <div className="form-grid">
                    {(
                      [
                        ['ip', 'IPv4 address', '192.168.1.42'],
                        ['mask', 'Subnet mask or CIDR', '/24 or 255.255.255.0'],
                        ['gateway', 'Default gateway', '192.168.1.1'],
                        ['dns', 'DNS server', '1.1.1.1'],
                      ] as const
                    ).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label htmlFor={key}>
                          {label}
                          <small>
                            {key === 'ip' || key === 'mask'
                              ? 'Paired for subnet checks'
                              : 'Optional'}
                          </small>
                        </label>
                        <input
                          id={key}
                          value={input[key]}
                          placeholder={placeholder}
                          autoComplete="off"
                          spellCheck={false}
                          aria-invalid={!!result?.errors[key]}
                          aria-describedby={
                            result?.errors[key] ? `${key}-error` : undefined
                          }
                          onChange={(e) => edit(key, e.target.value)}
                        />
                        {result?.errors[key] && (
                          <p className="field-error" id={`${key}-error`}>
                            {result.errors[key]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <label htmlFor="notes">
                    Symptoms / notes{' '}
                    <small>
                      Optional · retained as context, not parsed evidence
                    </small>
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={5000}
                    value={input.notes}
                    onChange={(e) => edit('notes', e.target.value)}
                    placeholder="What happened, and what have you already tested?"
                  />
                  <PingInput
                    value={input.pingOutput ?? ''}
                    onChange={(value) => edit('pingOutput', value)}
                    error={result?.errors.pingOutput}
                  />
                  <div className="actions">
                    <button className="primary" type="submit">
                      Analyze evidence ↗
                    </button>
                    <button type="button" onClick={() => start()}>
                      Reset
                    </button>
                  </div>
                  <p role="status" className="form-status">
                    {status}
                  </p>
                </form>
                <aside className="panel help-card">
                  <span className="eyebrow">HOW TO READ RESULTS</span>
                  <h2>Evidence comes first.</h2>
                  <p>
                    <b>Confirmed</b> is a fact supported by the supplied values.
                  </p>
                  <p>
                    <b>Likely / Possible</b> are interpretations requiring more
                    tests.
                  </p>
                  <p>
                    <b>Insufficient Evidence</b> means the tool cannot reach a
                    conclusion.
                  </p>
                  <hr />
                  <p>
                    This build checks IPv4 configuration and pasted English IPv4
                    ping samples. DNS and traceroute parsing will follow.
                  </p>
                  <button onClick={() => navigate('Commands')}>
                    Find a useful command →
                  </button>
                </aside>
              </div>
              {result && <Findings result={result} />}
            </>
          )}
          {page === 'History' && (
            <>
              <span className="eyebrow">LOCAL SESSION LOG</span>
              <div className="section-head">
                <h1>Your diagnostic history.</h1>
                {sessions.length > 0 && (
                  <button
                    className="danger"
                    onClick={() => setConfirmClear(true)}
                  >
                    Clear history
                  </button>
                )}
              </div>
              {confirmClear && (
                <ConfirmClearHistory
                  onCancel={() => setConfirmClear(false)}
                  onConfirm={() => {
                    if (updateHistory([])) setStatus('History cleared.');
                    setConfirmClear(false);
                  }}
                />
              )}
              <p className="intro">
                Up to 50 configuration and evidence snapshots. Reopening
                recalculates findings with the current engine.
              </p>
              {sessions.length ? (
                <div className="panel session-list">
                  {sessions.map((s) => (
                    <article className="session" key={s.id}>
                      <button onClick={() => open(s)}>
                        <span>
                          <strong>
                            {s.input.ip || 'Partial configuration'}{' '}
                            <span className="muted">{s.input.mask}</span>
                          </strong>
                          <small>{new Date(s.created).toLocaleString()}</small>
                        </span>
                        <span>Review →</span>
                      </button>
                      <button
                        className="danger"
                        aria-label={`Delete session ${s.input.ip} from ${s.created}`}
                        onClick={() =>
                          updateHistory(sessions.filter((x) => x.id !== s.id))
                        }
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="panel empty">
                  <h2>No saved sessions yet.</h2>
                  <p>
                    Complete a configuration analysis to build your history.
                  </p>
                  <button onClick={() => start()}>Start triage →</button>
                </div>
              )}
            </>
          )}
          {page === 'Guides' && <Guides />}
          {page === 'Commands' && <CommandReference />}
          <footer>
            NETTRIAGE PRO{' '}
            <span>
              Configuration is evidence. Connectivity requires testing.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
