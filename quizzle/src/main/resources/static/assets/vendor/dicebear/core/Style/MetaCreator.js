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
var _MetaCreator_data;
/**
 * Read-only view over the `meta.creator` block of a style definition.
 */
export class MetaCreator {
    constructor(data) {
        _MetaCreator_data.set(this, void 0);
        __classPrivateFieldSet(this, _MetaCreator_data, data, "f");
    }
    /**
     * Returns the creator's display name, or `undefined` when not set.
     */
    name() {
        return __classPrivateFieldGet(this, _MetaCreator_data, "f").name;
    }
    /**
     * Returns the creator's homepage URL, or `undefined` when not set.
     */
    url() {
        return __classPrivateFieldGet(this, _MetaCreator_data, "f").url;
    }
}
_MetaCreator_data = new WeakMap();
