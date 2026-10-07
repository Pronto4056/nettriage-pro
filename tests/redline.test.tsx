import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigurationMap } from '../src/components/ConfigurationMap';
import { CommandReference } from '../src/pages/Reference';
import { App } from '../src/App';
import { ConfirmClearHistory } from '../src/components/ConfirmClearHistory';

it('makes destructive history clearing explicit and cancellable', () => {
  const html = renderToStaticMarkup(
    <ConfirmClearHistory onCancel={() => {}} onConfirm={() => {}} />,
  );
  expect(html).toContain('<dialog');
  expect(html).toContain('aria-labelledby="clear-history-title"');
  expect(html).toContain('Cancel');
  expect(html).toContain('Clear saved sessions');
  expect(html).toContain('cannot be undone');
});

it('keeps all five navigation destinations in the redesigned shell', () => {
  const html = renderToStaticMarkup(<App />);
  for (const page of [
    'Dashboard',
    'Network triage',
    'History',
    'Guides',
    'Commands',
  ])
    expect(html).toContain(page);
  expect(html).toContain('Trace the facts.');
  expect(html).toContain('Follow the evidence.');
});
it('exposes the conceptual configuration map without claiming reachability', () => {
  const html = renderToStaticMarkup(<ConfigurationMap />);
  expect(html.match(/aria-pressed=/g)).toHaveLength(3);
  expect(html).toContain('not establish connectivity');
  expect(html).toContain('aria-live="polite"');
});
it('covers every command with separately labeled simulation output', () => {
  const html = renderToStaticMarkup(<CommandReference />);
  expect(html.match(/Simulated output/g)).toHaveLength(15);
  expect(html.match(/Example output &amp; interpretation/g)).toHaveLength(15);
  expect(html.match(/Actual Windows observation/g)).toHaveLength(7);
  expect(html).toContain('eight-hop');
  expect(html).toContain('not executed on Linux or macOS');
});
