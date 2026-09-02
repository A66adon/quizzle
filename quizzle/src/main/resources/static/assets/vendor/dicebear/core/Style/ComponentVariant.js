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
var _ComponentVariant_data, _ComponentVariant_elements;
import { Element } from './Element.js';
/**
 * Read-only view over an entry in a component's `variants` block.
 */
export class ComponentVariant {
    constructor(data) {
        _ComponentVariant_data.set(this, void 0);
        _ComponentVariant_elements.set(this, void 0);
        __classPrivateFieldSet(this, _ComponentVariant_data, data, "f");
    }
    /**
     * Returns the variant's elements, lazily wrapped as {@link Element}
     * instances on first access.
     */
    elements() {
        __classPrivateFieldSet(this, _ComponentVariant_elements, __classPrivateFieldGet(this, _ComponentVariant_elements, "f") ?? __classPrivateFieldGet(this, _ComponentVariant_data, "f").elements.map((el) => new Element(el)), "f");
        return __classPrivateFieldGet(this, _ComponentVariant_elements, "f");
    }
    /**
     * Returns the weighted-pick weight for this variant, defaulting to `1`.
     */
    weight() {
        return __classPrivateFieldGet(this, _ComponentVariant_data, "f").weight ?? 1;
    }
    /**
     * Returns the variant's descriptive tags (e.g. `hairLength:long`), or an
     * empty list when none are authored. Consumed by the `tags` render option
     * to filter the variant pool.
     */
    tags() {
        return __classPrivateFieldGet(this, _ComponentVariant_data, "f").tags ?? [];
    }
    /**
     * Tests this variant against a single tag-filter token's grammar. With no
     * `value`, it matches a whole category: the bare `category` tag or any
     * `category:value` tag. With a `value`, it matches only the exact
     * `category:value` tag. The resolver composes these checks into the
     * allow/disallow filter structure.
     */
    hasTag(category, value) {
        if (value === undefined) {
            return this.tags().some((tag) => tag === category || tag.startsWith(`${category}:`));
        }
        return this.tags().includes(`${category}:${value}`);
    }
}
_ComponentVariant_data = new WeakMap(), _ComponentVariant_elements = new WeakMap();
