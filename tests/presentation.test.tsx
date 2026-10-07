import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Findings } from '../src/components/Findings';
import { analyze } from '../src/diagnostics/engine';
it('labels absent configuration as insufficient evidence rather than completed calculations', () => {
  const result = analyze({ ip: '', mask: '', gateway: '', dns: '', notes: '' });
  expect(renderToStaticMarkup(<Findings result={result} />)).toContain(
    'More evidence needed',
  );
});
