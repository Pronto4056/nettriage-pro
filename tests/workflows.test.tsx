// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { traceExamples } from '../src/components/TraceInput';
let root: Root;
let container: HTMLDivElement;
const key = 'nettriage.history.v1';
async function click(text: string) {
  const button = [...container.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!button) throw Error(`Button missing: ${text}`);
  await act(async () => {
    button.click();
  });
}
async function field(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `#${id}`,
  )!;
  const prototype =
    input.tagName === 'TEXTAREA'
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
      input,
      value,
    );
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function mount() {
  await act(async () => {
    root.render(<App />);
  });
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await mount();
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('does not save empty or invalid forms and focuses the first invalid field', async () => {
  await click('Network triage');
  await click('Analyze evidence ↗');
  expect(localStorage.getItem(key)).toBeNull();
  await field('ip', 'bad');
  await field('mask', '/24');
  await click('Analyze evidence ↗');
  expect(localStorage.getItem(key)).toBeNull();
  expect(document.activeElement?.id).toBe('ip');
});
it('saves, reopens and deletes command-only sessions with an accurate label', async () => {
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  expect(container.querySelectorAll('.trace-table tbody tr')).toHaveLength(3);
  await click('History');
  const open = [...container.querySelectorAll('.session button')].find((b) =>
    b.textContent?.includes('Review'),
  ) as HTMLButtonElement;
  expect(open.textContent).toContain('Command evidence');
  await act(async () => {
    open.click();
  });
  expect(
    (container.querySelector('#traceOutput') as HTMLTextAreaElement).value,
  ).toBe(traceExamples.reached);
  await field('traceOutput', 'unknown');
  expect(container.querySelector('.results')).toBeNull();
  await click('Reset');
  expect(
    (container.querySelector('#traceOutput') as HTMLTextAreaElement).value,
  ).toBe('');
  await click('History');
  await click('Delete');
  expect(JSON.parse(localStorage.getItem(key)!).sessions).toEqual([]);
});
it('preserves corrupt history while allowing diagnosis', async () => {
  await act(async () => {
    root.unmount();
  });
  localStorage.setItem(key, '{bad');
  root = createRoot(container);
  await mount();
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  expect(container.querySelector('.trace-table')).not.toBeNull();
  expect(localStorage.getItem(key)).toBe('{bad');
  expect(container.textContent).toContain('not saved');
});
it('shows results when storage refuses saving', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('denied');
  });
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  expect(container.querySelector('.trace-table')).not.toBeNull();
  expect(container.textContent).toContain('not saved');
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
});
it('copies the intended command through the clipboard boundary', async () => {
  let copied = '';
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  await click('Commands');
  await click('Copy');
  expect(copied).toBe('ipconfig /all');
});
it('shows valid command evidence beside invalid configuration without saving', async () => {
  await click('Network triage');
  await field('ip', 'bad');
  await field('mask', '/24');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  expect(container.querySelector('#ip-error')).not.toBeNull();
  expect(container.querySelector('.trace-table')).not.toBeNull();
  expect(localStorage.getItem(key)).toBeNull();
});
it('restores evidence after unmount and remount', async () => {
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  await act(async () => {
    root.unmount();
  });
  root = createRoot(container);
  await mount();
  await click('History');
  const open = container.querySelector('.session button') as HTMLButtonElement;
  await act(async () => {
    open.click();
  });
  expect(
    (container.querySelector('#traceOutput') as HTMLTextAreaElement).value,
  ).toBe(traceExamples.reached);
});
it('allows analysis after initial storage-read denial', async () => {
  await act(async () => {
    root.unmount();
  });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error('denied');
  });
  root = createRoot(container);
  await mount();
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  expect(container.querySelector('.trace-table')).not.toBeNull();
  expect(container.textContent).toContain('not saved');
});
it('keeps a visible session when deletion cannot be persisted', async () => {
  await click('Network triage');
  await field('traceOutput', traceExamples.reached);
  await click('Analyze evidence ↗');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('denied');
  });
  await click('History');
  await click('Delete');
  expect(container.querySelectorAll('.session')).toHaveLength(1);
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
});
it('reports clipboard rejection with a manual-copy fallback', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async () => {
        throw Error('denied');
      },
    },
  });
  await click('Commands');
  await click('Copy');
  expect(container.querySelector('[role="status"]')?.textContent).toMatch(
    /select|copy|clipboard/i,
  );
});
