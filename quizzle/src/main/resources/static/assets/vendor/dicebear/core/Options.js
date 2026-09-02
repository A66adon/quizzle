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
var _Options_instances, _Options_data, _Options_tags, _Options_dynamic, _Options_asArray, _Options_toRange;
import { OptionsValidator } from './Validator/OptionsValidator.js';
/**
 * Validates the raw user-supplied options and exposes them through typed
 * accessors. Each accessor returns the user's input in a normalized form
 * (always an array for options that accept either a scalar or an array, or
 * `undefined` when the option is not set), so consumers — chiefly
 * {@link Resolver} — never have to do their own normalization.
 *
 * Resolution against the style definition and the PRNG happens in
 * {@link Resolver}; this class is purely about reading user input.
 */
export class Options {
    constructor(data = {}) {
        _Options_instances.add(this);
        _Options_data.set(this, void 0);
        _Options_tags.set(this, void 0);
        OptionsValidator.validate(data);
        __classPrivateFieldSet(this, _Options_data, structuredClone(data), "f");
    }
    seed() {
        return __classPrivateFieldGet(this, _Options_data, "f").seed;
    }
    size() {
        return __classPrivateFieldGet(this, _Options_data, "f").size;
    }
    idRandomization() {
        return __classPrivateFieldGet(this, _Options_data, "f").idRandomization;
    }
    title() {
        return __classPrivateFieldGet(this, _Options_data, "f").title;
    }
    flip() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, __classPrivateFieldGet(this, _Options_data, "f").flip);
    }
    fontFamily() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, __classPrivateFieldGet(this, _Options_data, "f").fontFamily);
    }
    fontWeight() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, __classPrivateFieldGet(this, _Options_data, "f").fontWeight);
    }
    scale() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_data, "f").scale);
    }
    borderRadius() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_data, "f").borderRadius);
    }
    rotate() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_data, "f").rotate);
    }
    translateX() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_data, "f").translateX);
    }
    translateY() {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_data, "f").translateY);
    }
    /**
     * Returns the global `tags` filter as parsed tokens, or an empty array when
     * unset. Each raw token (`category` / `category:value`, optionally
     * `!`-prefixed to disallow) is decoded into `{ category, value?, negated }` so
     * the resolver composes the filter without parsing the grammar itself. An
     * empty list means no tag filtering (classic behavior). Memoized, since the
     * resolver reads it once per component.
     */
    tags() {
        return (__classPrivateFieldSet(this, _Options_tags, __classPrivateFieldGet(this, _Options_tags, "f") ?? __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, __classPrivateFieldGet(this, _Options_data, "f").tags).map((token) => {
            const negated = token.startsWith('!');
            const body = negated ? token.slice(1) : token;
            const sep = body.indexOf(':');
            return sep === -1
                ? { category: body, negated }
                : { category: body.slice(0, sep), value: body.slice(sep + 1), negated };
        }), "f"));
    }
    /**
     * Returns the user-set variant constraint for `name` as a weighted map, or
     * `undefined` when `${name}Variant` is unset. A bare string or string list
     * is normalized to a map with each entry weighted `1`.
     */
    componentVariant(name) {
        const raw = __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}Variant`);
        if (raw === undefined) {
            return undefined;
        }
        if (typeof raw === 'string') {
            return { [raw]: 1 };
        }
        if (Array.isArray(raw)) {
            return Object.fromEntries(raw.map((v) => [v, 1]));
        }
        return raw;
    }
    componentProbability(name) {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}Probability`);
    }
    /**
     * Asymmetric on purpose: returns `undefined` (rather than `[]`) when
     * `${name}Color` is unset so the resolver can fall back to the style
     * definition's color values.
     */
    color(name) {
        const raw = __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}Color`);
        return raw === undefined
            ? undefined
            : __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, raw);
    }
    colorFill(name) {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_asArray).call(this, __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}ColorFill`));
    }
    colorAngle(name) {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}ColorAngle`));
    }
    colorFillStops(name) {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_toRange).call(this, __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}ColorFillStops`));
    }
    colorOrder(name) {
        return __classPrivateFieldGet(this, _Options_instances, "m", _Options_dynamic).call(this, `${name}ColorOrder`);
    }
}
_Options_data = new WeakMap(), _Options_tags = new WeakMap(), _Options_instances = new WeakSet(), _Options_dynamic = function _Options_dynamic(key) {
    return __classPrivateFieldGet(this, _Options_data, "f")[key];
}, _Options_asArray = function _Options_asArray(value) {
    if (value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}, _Options_toRange = function _Options_toRange(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'number') {
        return { min: value, max: value };
    }
    if (value.length === 0) {
        return undefined;
    }
    return { min: Math.min(...value), max: Math.max(...value) };
};
