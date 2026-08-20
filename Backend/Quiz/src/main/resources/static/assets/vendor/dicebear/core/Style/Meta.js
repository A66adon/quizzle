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
var _Meta_data, _Meta_license, _Meta_creator, _Meta_source;
import { MetaLicense } from './MetaLicense.js';
import { MetaCreator } from './MetaCreator.js';
import { MetaSource } from './MetaSource.js';
/**
 * Lazily-constructed view over a style definition's `meta` block, exposing
 * the license, creator, and source descriptors.
 */
export class Meta {
    constructor(data) {
        _Meta_data.set(this, void 0);
        _Meta_license.set(this, void 0);
        _Meta_creator.set(this, void 0);
        _Meta_source.set(this, void 0);
        __classPrivateFieldSet(this, _Meta_data, data, "f");
    }
    /**
     * Returns the license descriptor, defaulting to an empty object when the
     * style definition omits the field.
     */
    license() {
        __classPrivateFieldSet(this, _Meta_license, __classPrivateFieldGet(this, _Meta_license, "f") ?? new MetaLicense(__classPrivateFieldGet(this, _Meta_data, "f").license ?? {}), "f");
        return __classPrivateFieldGet(this, _Meta_license, "f");
    }
    /**
     * Returns the creator descriptor, defaulting to an empty object when the
     * style definition omits the field.
     */
    creator() {
        __classPrivateFieldSet(this, _Meta_creator, __classPrivateFieldGet(this, _Meta_creator, "f") ?? new MetaCreator(__classPrivateFieldGet(this, _Meta_data, "f").creator ?? {}), "f");
        return __classPrivateFieldGet(this, _Meta_creator, "f");
    }
    /**
     * Returns the source descriptor, defaulting to an empty object when the
     * style definition omits the field.
     */
    source() {
        __classPrivateFieldSet(this, _Meta_source, __classPrivateFieldGet(this, _Meta_source, "f") ?? new MetaSource(__classPrivateFieldGet(this, _Meta_data, "f").source ?? {}), "f");
        return __classPrivateFieldGet(this, _Meta_source, "f");
    }
}
_Meta_data = new WeakMap(), _Meta_license = new WeakMap(), _Meta_creator = new WeakMap(), _Meta_source = new WeakMap();
