# `<lazy-html-include>`

Easily include external HTML into your pages. It is based on Justin Fagnani's
[`html-include-element`](https://github.com/justinfagnani/html-include-element). It's not _lazy_ yet :-/ .. I will
extend it to use an intersection observer soon. It's functionality differs in so far as that it runs scripts if script
tags are contained in the included document.

## Overview

`<lazy-html-include>` is a web component that fetches HTML and includes it into your page.

```html

<lazy-html-include src="./my-local-file.html"></lazy-html-include>
```

`<lazy-html-include>` works with any framework, or no framework at all.

By default `<lazy-html-include>` renders the HTML in a shadow root, so it's isolated from the rest of the page. This can
be configured with the `no-shadow` attribute.

## Installation

Install from npm:

```bash
npm i lazy-html-include
```

Or load from a CDN like unpkg.com: `https://unpkg.com/lazy-html-include`

## Usage

`<lazy-html-include>` is distributed as standard JS modules, which are supported in all current major browsers.

You can load it into a page with a `<script>` tag:

```html

<head>
    <script type="module" src='https://unpkg.com/lazy-html-include'></script>
</head>
<body>
<lazy-html-include src="./my-local-file.html"></lazy-html-include>
</body>
```

Or import into a JavaScript module:

```js
import {LazyHtmlInclude} from 'lazy-html-include';
```

`<lazy-html-include>` fires a `load` even when the included file has been loaded. When including into shadow DOM (the
default behavior) the `load` event is fired after any `<link>` elements in the included file have loaded as well.

This allows you to hide the `<lazy-html-include>` element and show it after the `load` event fires to avoid flashes of
unstyled content.

### Same-origin policy and CORS

`<lazy-html-include>` uses the `fetch()` API to load the HTML. This means it uses the same-origin security model and
supports CORS. In order to load an external resource it must either be from the same origin as the page, or send CORS
headers. You can control the fetch mode with the `mode` attribute.

### Styling included HTML

When included into shadow DOM, the HTML and its styles are isolated from the rest of the page. Main page selectors will
not select into the content, and the included HTML can have `<style>` tags which will be scoped and not leak to the rest
of the page.

The content can be styled with CSS custom variables and other inheritable properties, like `color` and `font-family`. If
the HTML includes elements with `part` attributes, those elements can be styled with the `::part()` selector.

Included HTML can also have `<slot>` elements, which will allow children of `<lazy-html-include>` to be projected into
the HTML. These can be styled from within the included HTML with the `::slotted()` selector.

If the `no-shadow` attribute is present, then the included HTML can by styled with global styles. Beware though, styles
in the included HTML will apply to the whole page.

## Attributes

### `src`

The URL to fetch an HTML document from.

### `mode`

The fetch mode to use: "cors", "no-cors", or "same-origin". See the fetch() documents for more information.

### `no-shadow`

A boolean attribute, which if present, causes the element to include the fetched HTML into its light DOM children.

### `scope-scripts`

A boolean attribute, which if present, causes contained scripts to be executed with a `this` context. This allows
scripts to access the shadowRoot. Be careful with this option! Don't use it, if the included html is not trusted!

### `delegates-focus`

A boolean attribute, which if present, causes the element
to [delegate focus](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus) to the first focusable
element in the shadow root.

## Browser Support

Web components are supported by Chrome, Safari, Firefox, Opera and current versions of Edge.
