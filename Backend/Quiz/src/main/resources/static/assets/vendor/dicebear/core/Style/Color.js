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
var _Color_data;
/**
 * Read-only view over an entry in a style definition's `colors` block.
 */
export class Color {
    constructor(data) {
        _Color_data.set(this, void 0);
        __classPrivateFieldSet(this, _Color_data, data, "f");
    }
    /**
     * Returns the candidate color values, in definition order.
     */
    values() {
        return __classPrivateFieldGet(this, _Color_data, "f").values;
    }
    /**
     * Returns the colors that the resolver should avoid picking, or an empty
     * list when the field is unset.
     */
    notEqualTo() {
        return __classPrivateFieldGet(this, _Color_data, "f").notEqualTo ?? [];
    }
    /**
     * Returns the name of another color that this one should contrast against,
     * or `undefined` when no contrast constraint is defined.
     */
    contrastTo() {
        return __classPrivateFieldGet(this, _Color_data, "f").contrastTo;
    }
}
_Color_data = new WeakMap();
