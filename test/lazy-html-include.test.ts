import { assert } from '@esm-bundle/chai';

import { LazyHtmlInclude } from '../src/LazyHtmlInclude.js';
import '../src/lazy-html-include.js';

suite('lazy-html-include', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    document.body.removeChild(container);
  });

  test('includes some HTML', async () => {
    container.innerHTML = `
      <lazy-html-include src="./test/test-1.html"></lazy-html-include>
    `;
    const include: LazyHtmlInclude = container.querySelector(
      'lazy-html-include'
    ) as LazyHtmlInclude;
    await new Promise(res => {
      include.addEventListener('load', () => res(undefined));
    });
    assert.equal(include.shadowRoot.children[0].tagName, 'STYLE');
    assert.equal(include.shadowRoot.children[1].outerHTML, '<h1>TEST</h1>');
  });

  test('includes some HTML in light DOM', async () => {
    container.innerHTML = `
      <lazy-html-include no-shadow src="./test/test-1.html"></lazy-html-include>
    `;
    const include: LazyHtmlInclude = container.querySelector(
      'lazy-html-include'
    ) as LazyHtmlInclude;
    await new Promise(res => {
      include.addEventListener('load', () => res(undefined));
    });
    assert.equal(include.innerHTML.trim(), '<h1>TEST</h1>');
  });

  test('preserves light DOM when including to shadow DOM', async () => {
    container.innerHTML = `
      <lazy-html-include src="./test/test-1.html">TEST</lazy-html-include>
    `;
    const include: LazyHtmlInclude = container.querySelector(
      'lazy-html-include'
    ) as LazyHtmlInclude;
    await new Promise(res => {
      include.addEventListener('load', () => res(undefined));
    });
    assert.equal(include.innerHTML, 'TEST');
  });

  test('waits for styles to load', async () => {
    container.innerHTML = `
      <lazy-html-include src="./test/test-styles.html">TEST</lazy-html-include>
    `;
    const include: LazyHtmlInclude = container.querySelector(
      'lazy-html-include'
    ) as LazyHtmlInclude;
    await new Promise(res => {
      include.addEventListener('load', () => {
        assert.isNotNull(include.shadowRoot.querySelector('link')!.sheet);
        res(undefined);
      });
    });
  });

  // TODO: tests for mode & changing src attribute
});
