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
var _MetaSource_data;
/**
 * Read-only view over the `meta.source` block of a style definition.
 */
export class MetaSource {
    constructor(data) {
        _MetaSource_data.set(this, void 0);
        __classPrivateFieldSet(this, _MetaSource_data, data, "f");
    }
    /**
     * Returns the source name (e.g. the original work title), or `undefined`
     * when not set.
     */
    name() {
        return __classPrivateFieldGet(this, _MetaSource_data, "f").name;
    }
    /**
     * Returns the URL of the source, or `undefined` when not set.
     */
    url() {
        return __classPrivateFieldGet(this, _MetaSource_data, "f").url;
    }
}
_MetaSource_data = new WeakMap();
