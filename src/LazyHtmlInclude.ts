const LINK_LOAD_SUPPORTED = 'onload' in HTMLLinkElement.prototype;

/**
 * Firefox may throw an error when accessing a not-yet-loaded cssRules property.
 * @return {boolean}
 * @param link
 */
function isLinkAlreadyLoaded(link: HTMLLinkElement) {
  try {
    return !!(link.sheet && link.sheet.cssRules);
  }
  catch (error) {
    if (error instanceof Error && (error.name === 'InvalidAccessError' || error.name === 'SecurityError'))
      return false;
    else
      throw error;
  }
}

/**
 * Resolves when a `<link>` element has loaded its resource.
 * Gracefully degrades for browsers that don't support the `load` event on links.
 * in which case, it immediately resolves, causing a FOUC, but displaying content.
 * resolves immediately if the stylesheet has already been loaded.
 * @param  {HTMLLinkElement} link
 * @return {Promise<StyleSheet>}
 */
async function linkLoaded(link: HTMLLinkElement) {
  return new Promise((resolve, reject) => {
    if (!LINK_LOAD_SUPPORTED) resolve(undefined);
    else if (isLinkAlreadyLoaded(link)) resolve(link.sheet);
    else {
      link.addEventListener('load', () => resolve(link.sheet), { once: true });
      link.addEventListener('error', reject, { once: true });
    }
  });
}

/**
 * Embeds HTML into a document.
 *
 * The HTML is fetched from the URL contained in the `src` attribute, using the
 * fetch() API. A 'load' event is fired when the HTML is updated.
 *
 * The request is made using CORS by default. This can be chaned with the `mode`
 * attribute.
 *
 * By default, the HTML is embedded into a shadow root. If the `no-shadow`
 * attribute is present, the HTML will be embedded into the child content.
 *
 */
export class LazyHtmlInclude extends HTMLElement {
  declare shadowRoot: ShadowRoot;

  static get observedAttributes() {
    return ['src', 'mode', 'no-shadow'];
  }

  /**
   * The URL to fetch an HTML document from.
   *
   * Setting this property causes a fetch the HTML from the URL.
   */
  get src() {
    return this.getAttribute('src') as string;
  }

  set src(value: string) {
    this.setAttribute('src', value);
  }

  /**
   * The fetch mode to use: "cors", "no-cors", or "same-origin".
   * See the fetch() documents for more information.
   *
   * Setting this property does not re-fetch the HTML.
   */
  get mode() {
    return this.getAttribute('mode') as RequestMode;
  }

  set mode(value: RequestMode) {
    this.setAttribute('mode', value);
  }

  /**
   * If true, replaces the innerHTML of this element with the text response
   * fetch. Setting this property does not re-fetch the HTML.
   */
  get noShadow() {
    return this.hasAttribute('no-shadow');
  }

  set noShadow(value: boolean) {
    if (value) {
      this.setAttribute('no-shadow', '');
    } else {
      this.removeAttribute('no-shadow');
    }
  }

  get scopeScripts() {
    return this.hasAttribute('scope-scripts');
  }

  set scopeScripts(value: boolean) {
    if (value) {
      this.setAttribute('scope-scripts', '');
    } else {
      this.removeAttribute('scope-scripts');
    }
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open', delegatesFocus: this.hasAttribute('delegates-focus')});
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
    `;
  }

  async attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === 'src') {
      let text = '';
      try {
        const mode = this.mode || 'cors';
        const response = await fetch(newValue, {mode});
        if (!response.ok) {
          throw new Error(`html-include fetch failed: ${response.statusText}`);
        }
        text = await response.text();
        if (this.src !== newValue) {
          // the src attribute was changed before we got the response, so bail
          return;
        }
      }
      catch(e) {
        console.error(e);
      }
      // Don't destroy the light DOM if we're using shadow DOM, so that slotted content is respected
      if (this.noShadow) this.innerHTML = text;
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
        </style>
        ${this.noShadow ? '<slot></slot>' : text}
      `;

      // If we're not using shadow DOM, then the consuming root
      // is responsible to load its own resources
      if (!this.noShadow) {
        await Promise.all([...Array.from(this.shadowRoot.querySelectorAll('link'))].map(linkLoaded));

        var scripts = [...Array.from(this.shadowRoot.querySelectorAll("script"))];
        console.log(scripts);

        for (var script of scripts) {
          if (script.src) {
            const mode = this.mode || 'cors';
            const response = await fetch(script.src, {mode});
            if (!response.ok) {
              throw new Error(`html-include fetch failed: ${response.statusText}`);
            }
            const text = await response.text();
            new Function(text).call(this.scopeScripts ? this : window);
          }
          else {
            /*
            const newScript = document.createElement("script");
            Array.from(script.attributes).forEach( attr => { newScript.setAttribute(attr.name, attr.value) });
            const scriptText = document.createTextNode(script.innerHTML);
            newScript.appendChild(scriptText);
            script.parentNode!.replaceChild(newScript, script);
            */
            new Function(script.innerText).call(this.scopeScripts ? this : window);
          }
        }
      }

      this.dispatchEvent(new Event('load'));
    }
  }
}
