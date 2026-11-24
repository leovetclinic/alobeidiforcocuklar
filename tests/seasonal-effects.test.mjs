import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const vite = await createServer({ configFile: false, server: { middlewareMode: true } });
after(() => vite.close());
const { SeasonalEffects } = await vite.ssrLoadModule('/components/seasonal-effects.tsx');
const effect = { id: 1, active: true, preset: 'winter', motion: 'fall', speed: 'normal', density: 30, opacity: 50, elementSize: 24, desktopEnabled: true, mobileEnabled: true };
const render = (props = {}) => renderToStaticMarkup(React.createElement(SeasonalEffects, { effects: [effect], ...props }));
test('every particle has a visible fallback position for reduced motion', () => {
  const html = render();
  assert.equal((html.match(/--particle-top:/g) || []).length, 13);
  assert.ok(!html.includes('seasonal-hide-mobile'));
});
test('mobile and desktop visibility remain separately configurable', () => {
  assert.ok(render({ effects: [{ ...effect, mobileEnabled: false }] }).includes('seasonal-hide-mobile'));
  assert.ok(render({ effects: [{ ...effect, desktopEnabled: false }] }).includes('seasonal-hide-desktop'));
});
test('disabled, inactive, suppressed and future effects stay hidden', () => {
  for (const props of [{ disabled: true }, { suppress: true }, { effects: [{ ...effect, active: false }] }, { effects: [{ ...effect, startDate: '2999-01-01' }] }]) assert.equal(render(props), '');
});
