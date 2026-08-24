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
var _OptionsDescriptor_instances, _a, _OptionsDescriptor_rotateRange, _OptionsDescriptor_translateRange, _OptionsDescriptor_descriptor, _OptionsDescriptor_style, _OptionsDescriptor_build;
import { COLOR_ORDER_FIXED, COLOR_ORDER_RANDOM } from './StyleOptions.js';
/**
 * Builds a descriptor of every option a given style accepts. Tooling such as
 * the editor uses the result to render form controls and validation hints
 * without having to introspect the style itself.
 */
export class OptionsDescriptor {
    constructor(style) {
        _OptionsDescriptor_instances.add(this);
        _OptionsDescriptor_descriptor.set(this, void 0);
        _OptionsDescriptor_style.set(this, void 0);
        __classPrivateFieldSet(this, _OptionsDescriptor_style, style, "f");
    }
    /**
     * Returns a deep clone of the descriptor, building it lazily on first call.
     */
    toJSON() {
        __classPrivateFieldSet(this, _OptionsDescriptor_descriptor, __classPrivateFieldGet(this, _OptionsDescriptor_descriptor, "f") ?? __classPrivateFieldGet(this, _OptionsDescriptor_instances, "m", _OptionsDescriptor_build).call(this), "f");
        return structuredClone(__classPrivateFieldGet(this, _OptionsDescriptor_descriptor, "f"));
    }
}
_a = OptionsDescriptor, _OptionsDescriptor_descriptor = new WeakMap(), _OptionsDescriptor_style = new WeakMap(), _OptionsDescriptor_instances = new WeakSet(), _OptionsDescriptor_build = function _OptionsDescriptor_build() {
    const result = {
        seed: { type: 'string' },
        size: { type: 'number', min: 1, max: 4096 },
        idRandomization: { type: 'boolean' },
        title: { type: 'string' },
        flip: {
            type: 'enum',
            values: ['none', 'horizontal', 'vertical', 'both'],
            list: true,
        },
        fontFamily: { type: 'string', list: true },
        fontWeight: { type: 'number', min: 1, max: 1000, list: true },
        scale: { type: 'range', min: 0, max: 10 },
        borderRadius: { type: 'range', min: 0, max: 50 },
        rotate: __classPrivateFieldGet(_a, _a, "f", _OptionsDescriptor_rotateRange),
        translateX: __classPrivateFieldGet(_a, _a, "f", _OptionsDescriptor_translateRange),
        translateY: __classPrivateFieldGet(_a, _a, "f", _OptionsDescriptor_translateRange),
    };
    const tags = new Set();
    for (const [name, component] of __classPrivateFieldGet(this, _OptionsDescriptor_style, "f").components()) {
        if (component.extendsName() !== undefined) {
            continue;
        }
        const variants = component.variants();
        result[`${name}Variant`] = {
            type: 'enum',
            values: Array.from(variants.keys()).sort(),
            list: true,
            weighted: true,
        };
        result[`${name}Probability`] = { type: 'number', min: 0, max: 100 };
        for (const variant of variants.values()) {
            for (const tag of variant.tags()) {
                tags.add(tag);
            }
        }
    }
    for (const name of [...__classPrivateFieldGet(this, _OptionsDescriptor_style, "f").colors().keys(), 'background']) {
        const color = __classPrivateFieldGet(this, _OptionsDescriptor_style, "f").colors().get(name);
        const contrastTo = color?.contrastTo();
        const notEqualTo = color?.notEqualTo() ?? [];
        result[`${name}Color`] = {
            type: 'color',
            list: true,
            ...(contrastTo ? { contrastTo } : {}),
            ...(notEqualTo.length > 0
                ? { notEqualTo: Array.from(notEqualTo) }
                : {}),
        };
        result[`${name}ColorFill`] = {
            type: 'enum',
            values: ['solid', 'linear', 'radial'],
            list: true,
        };
        result[`${name}ColorFillStops`] = { type: 'range', min: 2 };
        result[`${name}ColorAngle`] = __classPrivateFieldGet(_a, _a, "f", _OptionsDescriptor_rotateRange);
        result[`${name}ColorOrder`] = {
            type: 'enum',
            values: [COLOR_ORDER_RANDOM, COLOR_ORDER_FIXED],
        };
    }
    // Only advertise the `tags` filter when the style actually carries tags.
    // The values are the sorted union of every tag across the style's variants,
    // but `open` marks them as suggestions: the filter also accepts `!`
    // disallows and bare categories. Only an unknown category is ignored. An
    // unknown value inside a category the style does use matches nothing, so
    // every variant tagged on that axis is dropped.
    if (tags.size > 0) {
        result.tags = {
            type: 'enum',
            values: Array.from(tags).sort(),
            list: true,
            open: true,
        };
    }
    return result;
};
_OptionsDescriptor_rotateRange = { value: { type: 'range', min: -360, max: 360 } };
_OptionsDescriptor_translateRange = { value: { type: 'range', min: -1000, max: 1000 } };
