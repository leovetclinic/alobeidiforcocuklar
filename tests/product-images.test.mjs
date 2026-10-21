import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Run the real handlers with deferred network responses to reproduce saving
// while a later color's image is still uploading.
for (const [path, handler] of [['app/admin/page.tsx', 'add'], ['app/admin/products/[id]/page.tsx', 'save']]) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const upload = source.slice(source.indexOf('  async function upload('), source.indexOf(`  async function ${handler}(`));
  const saveStart = source.indexOf(`  async function ${handler}(`);
  const saveEnd = handler === 'add' ? source.indexOf('  async function remove(', saveStart) : source.indexOf('  if (!p)', saveStart);
  function harness(fail = false) {
    let release;
    let items = [{ images: [] }, { images: [], hasSizes: true, sizeStocks: { S: 2, M: 3 } }];
    const requests = [];
    const context = {
      pendingUploads: { current: 0 }, saving: false, variants: items, p: { variants: items }, id: 1,
      setUploading() {}, setSaving() {}, setNotice() {}, load() {}, blank: () => ({ images: [] }),
      compressProductImage: async x => x,
      FormData: class { append() {} get(key) { return key === 'price' ? 100 : 'test'; } },
      setVariants(fn) { items = typeof fn === 'function' ? fn(items) : fn; context.variants = items; },
      setP(fn) { context.p = fn(context.p); items = context.p.variants; },
      fetch: async (url, options) => {
        if (url === '/api/upload') {
          await new Promise(resolve => { release = resolve; });
          return { ok: !fail, json: async () => fail ? { error: 'upload failed' } : { url: '/second.jpg' } };
        }
        requests.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({}) };
      },
    };
    vm.createContext(context);
    vm.runInContext(ts.transpile(`${upload}\n${source.slice(saveStart, saveEnd)}`), context);
    return { context, requests, release: () => release(), items: () => items };
  }
  test(`${handler}: blocks early save and includes uploaded image on every size`, async () => {
    const h = harness();
    const uploading = h.context.upload(1, ['photo']);
    await new Promise(resolve => setImmediate(resolve));
    await h.context[handler]({ preventDefault() {}, currentTarget: { reset() {} } });
    assert.equal(h.requests.length, 0);
    h.release();
    await uploading;
    assert.equal(h.context.pendingUploads.current, 0);
    assert.equal(h.items()[1].images[0].url, '/second.jpg');
    await h.context[handler]({ preventDefault() {}, currentTarget: { reset() {} } });
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].variants.length, 3);
    for (const variant of h.requests[0].variants.slice(1)) assert.equal(variant.images[0].url, '/second.jpg');
  });
  test(`${handler}: failed upload releases the busy guard without adding a broken image`, async () => {
    const h = harness(true);
    const uploading = h.context.upload(1, ['photo']);
    await new Promise(resolve => setImmediate(resolve));
    h.release();
    await uploading;
    assert.equal(h.context.pendingUploads.current, 0);
    assert.equal(h.items()[1].images.length, 0);
  });
}
