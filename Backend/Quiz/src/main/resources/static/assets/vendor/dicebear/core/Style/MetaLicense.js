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
var _MetaLicense_data;
/**
 * Read-only view over the `meta.license` block of a style definition.
 */
export class MetaLicense {
    constructor(data) {
        _MetaLicense_data.set(this, void 0);
        __classPrivateFieldSet(this, _MetaLicense_data, data, "f");
    }
    /**
     * Returns the license name (e.g. `"CC BY 4.0"`), or `undefined` when not set.
     */
    name() {
        return __classPrivateFieldGet(this, _MetaLicense_data, "f").name;
    }
    /**
     * Returns the license URL, or `undefined` when not set.
     */
    url() {
        return __classPrivateFieldGet(this, _MetaLicense_data, "f").url;
    }
    /**
     * Returns the full license text, or `undefined` when not set.
     */
    text() {
        return __classPrivateFieldGet(this, _MetaLicense_data, "f").text;
    }
}
_MetaLicense_data = new WeakMap();
