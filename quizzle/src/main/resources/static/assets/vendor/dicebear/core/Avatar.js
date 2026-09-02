var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Avatar_svg, _Avatar_resolvedOptions;
import { Style } from './Style.js';
import { Options } from './Options.js';
import { Resolver } from './Resolver.js';
import { Renderer } from './Renderer.js';
// Emitted at most once per process: passing a raw definition is deprecated, but
// it was the documented usage for a long time, so a per-call warning would be
// noisy.
let definitionInputWarned = false;
/**
 * Top-level entry point for rendering an avatar from a style and options.
 *
 * Construction immediately resolves and renders the SVG; the various
 * accessor methods return different serializations of that result.
 */
export class Avatar {
    /**
     * Pass a {@link Style} instance. Passing a raw style definition is
     * deprecated and will be removed in v11; wrap it with `new Style(...)` and
     * reuse the instance across avatars.
     */
    constructor(styleInput, optionsInput) {
        _Avatar_svg.set(this, void 0);
        _Avatar_resolvedOptions.set(this, void 0);
        if (!(styleInput instanceof Style) && !definitionInputWarned) {
            definitionInputWarned = true;
            console.warn('[DiceBear] Passing a style definition to `new Avatar()` is deprecated ' +
                'and will be removed in v11. Wrap it in a Style first: ' +
                '`new Avatar(new Style(definition), options)`.');
        }
        const style = styleInput instanceof Style ? styleInput : new Style(styleInput);
        const options = new Options(optionsInput);
        const resolver = new Resolver(style, options);
        __classPrivateFieldSet(this, _Avatar_svg, new Renderer(style, resolver).render(), "f");
        __classPrivateFieldSet(this, _Avatar_resolvedOptions, resolver.resolved(), "f");
    }
    /**
     * Returns the rendered SVG markup.
     */
    toString() {
        return __classPrivateFieldGet(this, _Avatar_svg, "f");
    }
    /**
     * Returns the avatar as a JSON-serializable object containing the SVG and
     * the fully resolved options used to render it.
     */
    toJSON() {
        return {
            svg: __classPrivateFieldGet(this, _Avatar_svg, "f"),
            options: structuredClone(__classPrivateFieldGet(this, _Avatar_resolvedOptions, "f")),
        };
    }
    /**
     * Returns the SVG encoded as a `data:image/svg+xml` URI.
     */
    toDataUri() {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(__classPrivateFieldGet(this, _Avatar_svg, "f"))}`;
    }
}
_Avatar_svg = new WeakMap(), _Avatar_resolvedOptions = new WeakMap();
