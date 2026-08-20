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
var _Component_instances, _Component_data, _Component_name, _Component_source, _Component_translate, _Component_variants, _Component_asBase;
import { ComponentTranslate } from './ComponentTranslate.js';
import { ComponentVariant } from './ComponentVariant.js';
/**
 * Read-only view over an entry in a style definition's `components` block.
 *
 * An entry is either a base component with its own dimensions and variants
 * or an alias declared via `extends`. Aliases are pure references — they
 * inherit dimensions, variants, and all transforms from the source.
 */
export class Component {
    constructor(name, data, source) {
        _Component_instances.add(this);
        _Component_data.set(this, void 0);
        _Component_name.set(this, void 0);
        _Component_source.set(this, void 0);
        _Component_translate.set(this, void 0);
        _Component_variants.set(this, void 0);
        __classPrivateFieldSet(this, _Component_data, data, "f");
        __classPrivateFieldSet(this, _Component_name, name, "f");
        __classPrivateFieldSet(this, _Component_source, source, "f");
    }
    /**
     * Returns the entry's own name as declared in the style definition. For
     * aliases this is the alias key, not the source component's name (use
     * {@link sourceName} for the canonical user-option key prefix).
     */
    name() {
        return __classPrivateFieldGet(this, _Component_name, "f");
    }
    /**
     * Returns the source component name when this entry is an alias, or
     * `undefined` for a base component.
     */
    extendsName() {
        return 'extends' in __classPrivateFieldGet(this, _Component_data, "f") ? __classPrivateFieldGet(this, _Component_data, "f").extends : undefined;
    }
    /**
     * Returns the canonical user-option key prefix: the source component's
     * name when this entry is an alias, otherwise the entry's own name.
     */
    sourceName() {
        return this.extendsName() ?? __classPrivateFieldGet(this, _Component_name, "f");
    }
    /**
     * Returns the component's intrinsic width in canvas coordinates. For
     * aliases the source component's width is returned.
     */
    width() {
        return __classPrivateFieldGet(this, _Component_source, "f") ? __classPrivateFieldGet(this, _Component_source, "f").width() : __classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).width;
    }
    /**
     * Returns the component's intrinsic height in canvas coordinates. For
     * aliases the source component's height is returned.
     */
    height() {
        return __classPrivateFieldGet(this, _Component_source, "f") ? __classPrivateFieldGet(this, _Component_source, "f").height() : __classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).height;
    }
    /**
     * Returns the probability (0–100) that this component is rendered.
     * Aliases delegate to the source; defaults to 100 (always visible).
     */
    probability() {
        if (__classPrivateFieldGet(this, _Component_source, "f")) {
            return __classPrivateFieldGet(this, _Component_source, "f").probability();
        }
        return __classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).probability ?? 100;
    }
    /**
     * Returns the rotation range, or `undefined` when unset.
     * Aliases delegate to the source.
     */
    rotate() {
        return __classPrivateFieldGet(this, _Component_source, "f") ? __classPrivateFieldGet(this, _Component_source, "f").rotate() : __classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).rotate;
    }
    /**
     * Returns the scale range, or `undefined` when unset.
     * Aliases delegate to the source.
     */
    scale() {
        return __classPrivateFieldGet(this, _Component_source, "f") ? __classPrivateFieldGet(this, _Component_source, "f").scale() : __classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).scale;
    }
    /**
     * Returns the translate descriptor. Aliases delegate to the source.
     */
    translate() {
        if (__classPrivateFieldGet(this, _Component_source, "f")) {
            return __classPrivateFieldGet(this, _Component_source, "f").translate();
        }
        __classPrivateFieldSet(this, _Component_translate, __classPrivateFieldGet(this, _Component_translate, "f") ?? new ComponentTranslate(__classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).translate ?? {}), "f");
        return __classPrivateFieldGet(this, _Component_translate, "f");
    }
    /**
     * Returns a name → {@link ComponentVariant} map for all defined variants.
     * Aliases delegate to the source component's variants.
     */
    variants() {
        if (__classPrivateFieldGet(this, _Component_source, "f")) {
            return __classPrivateFieldGet(this, _Component_source, "f").variants();
        }
        __classPrivateFieldSet(this, _Component_variants, __classPrivateFieldGet(this, _Component_variants, "f") ?? new Map(Object.entries(__classPrivateFieldGet(this, _Component_instances, "m", _Component_asBase).call(this).variants).map(([name, data]) => [
            name,
            new ComponentVariant(data),
        ])), "f");
        return __classPrivateFieldGet(this, _Component_variants, "f");
    }
}
_Component_data = new WeakMap(), _Component_name = new WeakMap(), _Component_source = new WeakMap(), _Component_translate = new WeakMap(), _Component_variants = new WeakMap(), _Component_instances = new WeakSet(), _Component_asBase = function _Component_asBase() {
    return __classPrivateFieldGet(this, _Component_data, "f");
};
