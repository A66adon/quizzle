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
var _Style_instances, _a, _Style_data, _Style_meta, _Style_canvas, _Style_components, _Style_colors, _Style_validateAliases, _Style_isAlias;
import { StyleValidator } from './Validator/StyleValidator.js';
import { StyleValidationError } from './Error/StyleValidationError.js';
import { Meta } from './Style/Meta.js';
import { Canvas } from './Style/Canvas.js';
import { Component } from './Style/Component.js';
import { Color } from './Style/Color.js';
/**
 * Validated, lazily-decomposed wrapper around a style definition. Construction
 * runs the JSON Schema validator and stores a deep clone of the input so that
 * later mutation of the source object cannot leak into the rendered avatar.
 */
export class Style {
    constructor(data) {
        _Style_instances.add(this);
        _Style_data.set(this, void 0);
        _Style_meta.set(this, void 0);
        _Style_canvas.set(this, void 0);
        _Style_components.set(this, void 0);
        _Style_colors.set(this, void 0);
        StyleValidator.validate(data);
        __classPrivateFieldSet(this, _Style_data, structuredClone(data), "f");
        __classPrivateFieldGet(this, _Style_instances, "m", _Style_validateAliases).call(this);
    }
    /**
     * Returns the definition's `$id`, or `undefined` when not set.
     */
    id() {
        return __classPrivateFieldGet(this, _Style_data, "f").$id;
    }
    /**
     * Returns the definition's `$schema` URI, or `undefined` when not set.
     */
    schema() {
        return __classPrivateFieldGet(this, _Style_data, "f").$schema;
    }
    /**
     * Returns the definition's `$comment`, or `undefined` when not set.
     */
    comment() {
        return __classPrivateFieldGet(this, _Style_data, "f").$comment;
    }
    /**
     * Returns the {@link Meta} view, lazily constructed on first access.
     */
    meta() {
        __classPrivateFieldSet(this, _Style_meta, __classPrivateFieldGet(this, _Style_meta, "f") ?? new Meta(__classPrivateFieldGet(this, _Style_data, "f").meta ?? {}), "f");
        return __classPrivateFieldGet(this, _Style_meta, "f");
    }
    /**
     * Returns a deep clone of the root SVG attributes from the definition,
     * defaulting to an empty object.
     */
    attributes() {
        return structuredClone(__classPrivateFieldGet(this, _Style_data, "f").attributes ?? {});
    }
    /**
     * Returns a deep clone of the underlying definition.
     */
    definition() {
        return structuredClone(__classPrivateFieldGet(this, _Style_data, "f"));
    }
    /**
     * Returns the {@link Canvas} view, lazily constructed on first access.
     */
    canvas() {
        __classPrivateFieldSet(this, _Style_canvas, __classPrivateFieldGet(this, _Style_canvas, "f") ?? new Canvas(__classPrivateFieldGet(this, _Style_data, "f").canvas), "f");
        return __classPrivateFieldGet(this, _Style_canvas, "f");
    }
    /**
     * Returns a name → {@link Component} map for all defined components, built
     * lazily on first access.
     */
    components() {
        if (__classPrivateFieldGet(this, _Style_components, "f")) {
            return __classPrivateFieldGet(this, _Style_components, "f");
        }
        const entries = Object.entries(__classPrivateFieldGet(this, _Style_data, "f").components ?? {});
        const map = new Map();
        for (const [name, data] of entries) {
            if (!__classPrivateFieldGet(_a, _a, "m", _Style_isAlias).call(_a, data)) {
                map.set(name, new Component(name, data));
            }
        }
        for (const [name, data] of entries) {
            if (__classPrivateFieldGet(_a, _a, "m", _Style_isAlias).call(_a, data)) {
                map.set(name, new Component(name, data, map.get(data.extends)));
            }
        }
        __classPrivateFieldSet(this, _Style_components, map, "f");
        return __classPrivateFieldGet(this, _Style_components, "f");
    }
    /**
     * Returns a name → {@link Color} map for all defined colors, built lazily
     * on first access.
     */
    colors() {
        __classPrivateFieldSet(this, _Style_colors, __classPrivateFieldGet(this, _Style_colors, "f") ?? new Map(Object.entries(__classPrivateFieldGet(this, _Style_data, "f").colors ?? {}).map(([name, data]) => [
            name,
            new Color(data),
        ])), "f");
        return __classPrivateFieldGet(this, _Style_colors, "f");
    }
}
_a = Style, _Style_data = new WeakMap(), _Style_meta = new WeakMap(), _Style_canvas = new WeakMap(), _Style_components = new WeakMap(), _Style_colors = new WeakMap(), _Style_instances = new WeakSet(), _Style_validateAliases = function _Style_validateAliases() {
    const components = __classPrivateFieldGet(this, _Style_data, "f").components;
    if (!components) {
        return;
    }
    const errors = [];
    for (const [name, data] of Object.entries(components)) {
        if (!__classPrivateFieldGet(_a, _a, "m", _Style_isAlias).call(_a, data)) {
            continue;
        }
        const target = data.extends;
        const targetData = components[target];
        if (!targetData) {
            errors.push({
                instancePath: `/components/${name}/extends`,
                message: `references unknown component "${target}"`,
            });
            continue;
        }
        if (__classPrivateFieldGet(_a, _a, "m", _Style_isAlias).call(_a, targetData)) {
            errors.push({
                instancePath: `/components/${name}/extends`,
                message: `references alias "${target}" — alias chains are not allowed`,
            });
        }
    }
    if (errors.length > 0) {
        throw new StyleValidationError(errors);
    }
}, _Style_isAlias = function _Style_isAlias(data) {
    return 'extends' in data;
};
