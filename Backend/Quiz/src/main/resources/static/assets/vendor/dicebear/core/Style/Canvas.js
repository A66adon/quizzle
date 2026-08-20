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
var _Canvas_data, _Canvas_elements;
import { Element } from './Element.js';
/**
 * Read-only view over a style definition's `canvas` block, exposing the
 * drawing area dimensions and the top-level element list.
 */
export class Canvas {
    constructor(data) {
        _Canvas_data.set(this, void 0);
        _Canvas_elements.set(this, void 0);
        __classPrivateFieldSet(this, _Canvas_data, data, "f");
    }
    /**
     * Returns the canvas width — the `width` value of the SVG `viewBox`.
     */
    width() {
        return __classPrivateFieldGet(this, _Canvas_data, "f").width;
    }
    /**
     * Returns the canvas height — the `height` value of the SVG `viewBox`.
     */
    height() {
        return __classPrivateFieldGet(this, _Canvas_data, "f").height;
    }
    /**
     * Returns the top-level elements rendered onto the canvas, lazily wrapped
     * as {@link Element} instances on first access.
     */
    elements() {
        __classPrivateFieldSet(this, _Canvas_elements, __classPrivateFieldGet(this, _Canvas_elements, "f") ?? __classPrivateFieldGet(this, _Canvas_data, "f").elements.map((el) => new Element(el)), "f");
        return __classPrivateFieldGet(this, _Canvas_elements, "f");
    }
}
_Canvas_data = new WeakMap(), _Canvas_elements = new WeakMap();
