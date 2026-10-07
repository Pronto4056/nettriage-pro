import { expect, it } from 'vitest';
import { readHistory, writeHistory, persistHistory } from '../src/lib/history';
const input = {
  ip: '10.0.0.2',
  mask: '/24',
  gateway: '10.0.0.1',
  dns: '',
  notes: '',
};
it('recovers corrupt storage visibly', () =>
  expect(readHistory({ getItem: () => '{bad' })).toEqual({
    sessions: [],
    error: 'Saved history could not be read. It has not been overwritten.',
  }));
it('rejects wrong record shape', () =>
  expect(
    readHistory({
      getItem: () => JSON.stringify({ version: 1, sessions: [{ id: 'x' }] }),
    }).error,
  ).toBeTruthy());
it('drops unknown properties at the history boundary', () => {
  const known = { ip: '', mask: '', gateway: '', dns: '', notes: '' };
  const stored = {
    version: 1,
    sessions: [
      {
        id: 'a',
        created: '2026-10-06T00:00:00.000Z',
        input: { ...known, extra: null },
      },
    ],
  };
  expect(
    readHistory({ getItem: () => JSON.stringify(stored) }).sessions[0].input,
  ).toEqual(known);
});
it('surfaces storage denial', () =>
  expect(
    writeHistory(
      {
        setItem: () => {
          throw Error('denied');
        },
      },
      [],
    ),
  ).toBe('History could not be saved in this browser.'));
it('round-trips a session', () => {
  let stored = '';
  writeHistory(
    {
      setItem: (_k, v) => {
        stored = v;
      },
    },
    [{ id: 'a', created: '2026-10-06T00:00:00.000Z', input }],
  );
  expect(readHistory({ getItem: () => stored }).sessions[0].input).toEqual(
    input,
  );
});
it('limits history to 50 sessions', () => {
  let stored = '';
  writeHistory(
    {
      setItem: (_k, v) => {
        stored = v;
      },
    },
    Array.from({ length: 51 }, (_, i) => ({
      id: String(i),
      created: new Date().toISOString(),
      input,
    })),
  );
  expect(readHistory({ getItem: () => stored }).sessions).toHaveLength(50);
});
it('preserves sessions and deletion controls when persistence fails', () => {
  const current = [{ id: 'a', created: '2026-10-06T00:00:00.000Z', input }];
  const result = persistHistory(
    {
      setItem: () => {
        throw Error('denied');
      },
    },
    current,
    [],
  );
  expect(result.sessions).toEqual(current);
  expect(result.error).toBeTruthy();
});
it('commits deletion only after it is persisted', () => {
  const current = [{ id: 'a', created: '2026-10-06T00:00:00.000Z', input }];
  let stored = '';
  const result = persistHistory(
    {
      setItem: (_k, v) => {
        stored = v;
      },
    },
    current,
    [],
  );
  expect(result.sessions).toEqual([]);
  expect(readHistory({ getItem: () => stored }).sessions).toEqual([]);
});
