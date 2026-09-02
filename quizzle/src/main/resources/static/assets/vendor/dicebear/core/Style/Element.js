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
var _Element_data, _Element_children;
/**
 * Read-only view over a single render-tree element from a style definition.
 *
 * The same node type covers SVG elements, text, and component references —
 * `type()` discriminates between them.
 */
export class Element {
    constructor(data) {
        _Element_data.set(this, void 0);
        _Element_children.set(this, void 0);
        __classPrivateFieldSet(this, _Element_data, data, "f");
    }
    /**
     * Returns the element type discriminator (`svg`, `text`, `component`, …).
     */
    type() {
        return __classPrivateFieldGet(this, _Element_data, "f").type;
    }
    /**
     * Returns the element's tag/component name, or `undefined` for elements
     * that don't have one.
     */
    name() {
        return __classPrivateFieldGet(this, _Element_data, "f").name;
    }
    /**
     * Returns the element's textual value (for `text` elements) or template
     * fragment, or `undefined` when not applicable.
     */
    value() {
        return __classPrivateFieldGet(this, _Element_data, "f").value;
    }
    /**
     * Returns the element's raw attribute map, or `undefined` when no
     * attributes are defined.
     */
    attributes() {
        return __classPrivateFieldGet(this, _Element_data, "f").attributes;
    }
    /**
     * Returns the element's children, lazily wrapped as {@link Element}
     * instances on first access.
     */
    children() {
        __classPrivateFieldSet(this, _Element_children, __classPrivateFieldGet(this, _Element_children, "f") ?? (__classPrivateFieldGet(this, _Element_data, "f").children ?? []).map((child) => new Element(child)), "f");
        return __classPrivateFieldGet(this, _Element_children, "f");
    }
}
_Element_data = new WeakMap(), _Element_children = new WeakMap();
