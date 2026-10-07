import type { Input } from '../diagnostics/engine';
export interface Session {
  id: string;
  created: string;
  input: Input;
}
const KEY = 'nettriage.history.v1';
export function readHistory(storage: Pick<Storage, 'getItem'>): {
  sessions: Session[];
  error?: string;
} {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return { sessions: [] };
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.sessions) ||
      parsed.sessions.length > 50 ||
      !parsed.sessions.every(
        (s: Session) =>
          s &&
          typeof s.id === 'string' &&
          typeof s.created === 'string' &&
          Number.isFinite(Date.parse(s.created)) &&
          s.input &&
          ['ip', 'mask', 'gateway', 'dns', 'notes'].every(
            (k) => typeof s.input[k as keyof Input] === 'string',
          ),
      )
    )
      throw Error('Invalid history');
    return {
      sessions: parsed.sessions.map((s: Session) => ({
        id: s.id,
        created: s.created,
        input: {
          ip: s.input.ip,
          mask: s.input.mask,
          gateway: s.input.gateway,
          dns: s.input.dns,
          notes: s.input.notes,
        },
      })),
    };
  } catch {
    return {
      sessions: [],
      error: 'Saved history could not be read. It has not been overwritten.',
    };
  }
}
export function writeHistory(
  storage: Pick<Storage, 'setItem'>,
  sessions: Session[],
): string | undefined {
  try {
    storage.setItem(
      KEY,
      JSON.stringify({ version: 1, sessions: sessions.slice(0, 50) }),
    );
  } catch {
    return 'History could not be saved in this browser.';
  }
}
export function persistHistory(
  storage: Pick<Storage, 'setItem'>,
  current: Session[],
  next: Session[],
): { sessions: Session[]; error?: string } {
  const error = writeHistory(storage, next);
  return { sessions: error ? current : next.slice(0, 50), error };
}
