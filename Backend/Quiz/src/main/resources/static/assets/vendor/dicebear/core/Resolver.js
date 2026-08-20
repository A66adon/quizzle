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
var _Resolver_instances, _Resolver_style, _Resolver_options, _Resolver_prng, _Resolver_colorResolving, _Resolver_result, _Resolver_tagFilterCache, _Resolver_probability, _Resolver_isVisible, _Resolver_variantWeights, _Resolver_tagFilter, _Resolver_tagFilteredNames, _Resolver_resolveColor, _Resolver_order, _Resolver_colorFillStops, _Resolver_memoFloat, _Resolver_memo;
import { Prng } from './Prng.js';
import { Color } from './Utils/Color.js';
import { CircularColorReferenceError } from './Error/CircularColorReferenceError.js';
import { COLOR_ORDER_FIXED, COLOR_ORDER_RANDOM, } from './StyleOptions.js';
/**
 * Bundles the three inputs needed to derive any deterministic value for an
 * avatar — the {@link Style}, the validated user {@link Options}, and a
 * seeded {@link Prng} — and exposes them as named accessors. Each accessor
 * memoizes its result so that repeated calls cannot drift. The memo also
 * serves as the informational snapshot returned by {@link resolved} — every
 * value the resolver picks during one resolution lands there, except for
 * the raw seed.
 */
export class Resolver {
    constructor(style, options) {
        _Resolver_instances.add(this);
        _Resolver_style.set(this, void 0);
        _Resolver_options.set(this, void 0);
        _Resolver_prng.set(this, void 0);
        _Resolver_colorResolving.set(this, []);
        _Resolver_result.set(this, {});
        _Resolver_tagFilterCache.set(this, void 0);
        __classPrivateFieldSet(this, _Resolver_style, style, "f");
        __classPrivateFieldSet(this, _Resolver_options, options, "f");
        __classPrivateFieldSet(this, _Resolver_prng, new Prng(this.seed()), "f");
    }
    seed() {
        // Deliberately not memoized — the seed is the only input we keep out of
        // the {@link resolved} snapshot, so a serialized avatar never leaks it.
        return __classPrivateFieldGet(this, _Resolver_options, "f").seed() ?? '';
    }
    size() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'size', () => __classPrivateFieldGet(this, _Resolver_options, "f").size());
    }
    idRandomization() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'idRandomization', () => __classPrivateFieldGet(this, _Resolver_options, "f").idRandomization() ?? false);
    }
    title() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'title', () => __classPrivateFieldGet(this, _Resolver_options, "f").title());
    }
    flip() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'flip', () => __classPrivateFieldGet(this, _Resolver_prng, "f").pick('flip', __classPrivateFieldGet(this, _Resolver_options, "f").flip()) ?? 'none');
    }
    fontFamily() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'fontFamily', () => __classPrivateFieldGet(this, _Resolver_prng, "f").pick('fontFamily', __classPrivateFieldGet(this, _Resolver_options, "f").fontFamily()) ??
            'system-ui');
    }
    fontWeight() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, 'fontWeight', () => __classPrivateFieldGet(this, _Resolver_prng, "f").pick('fontWeight', __classPrivateFieldGet(this, _Resolver_options, "f").fontWeight()) ?? 400);
    }
    scale() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, 'scale', __classPrivateFieldGet(this, _Resolver_options, "f").scale(), 1);
    }
    borderRadius() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, 'borderRadius', __classPrivateFieldGet(this, _Resolver_options, "f").borderRadius(), 0);
    }
    rotate() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, 'rotate', __classPrivateFieldGet(this, _Resolver_options, "f").rotate(), 0);
    }
    translateX() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, 'translateX', __classPrivateFieldGet(this, _Resolver_options, "f").translateX(), 0);
    }
    translateY() {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, 'translateY', __classPrivateFieldGet(this, _Resolver_options, "f").translateY(), 0);
    }
    /**
     * Selects a variant for the given component. The pool the PRNG draws from is
     * built from the per-component `${name}Variant` option and the global `tags`
     * filter (see {@link #variantWeights}). Only variants that exist in the style
     * definition are considered.
     */
    variant(name) {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, `${name}Variant`, () => {
            const component = __classPrivateFieldGet(this, _Resolver_style, "f").components().get(name);
            if (!component || !__classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_isVisible).call(this, name, component)) {
                return undefined;
            }
            return __classPrivateFieldGet(this, _Resolver_prng, "f").weightedPick(`${name}Variant`, __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_variantWeights).call(this, component));
        });
    }
    color(name) {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, `${name}Color`, () => __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_resolveColor).call(this, name));
    }
    colorFill(name) {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, `${name}ColorFill`, () => __classPrivateFieldGet(this, _Resolver_prng, "f").pick(`${name}ColorFill`, __classPrivateFieldGet(this, _Resolver_options, "f").colorFill(name)) ??
            'solid');
    }
    colorAngle(name) {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, `${name}ColorAngle`, __classPrivateFieldGet(this, _Resolver_options, "f").colorAngle(name), 0);
    }
    colorOrder(name) {
        // Deliberately not memoized: unlike colorFill this is no PRNG pick, so it
        // stays out of the {@link resolved} snapshot.
        return __classPrivateFieldGet(this, _Resolver_options, "f").colorOrder(name) ?? COLOR_ORDER_RANDOM;
    }
    /**
     * Picks the rotate/translateX/translateY/scale values for a single
     * component. Memoized per `name`, so the four values land in
     * {@link resolved} as `${name}Rotate` / `${name}TranslateX` /
     * `${name}TranslateY` / `${name}Scale` for downstream introspection.
     */
    componentTransform(name) {
        const component = __classPrivateFieldGet(this, _Resolver_style, "f").components().get(name);
        return {
            rotate: __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, `${name}Rotate`, component?.rotate(), 0),
            translateX: __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, `${name}TranslateX`, component?.translate().x(), 0),
            translateY: __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, `${name}TranslateY`, component?.translate().y(), 0),
            scale: __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memoFloat).call(this, `${name}Scale`, component?.scale(), 1),
        };
    }
    /**
     * Returns an informational snapshot of every value the resolver picked.
     * Includes top-level options (scale/rotate/translate/…), per-component
     * variants/probabilities/colors, and per-component transform picks. The
     * raw seed is deliberately excluded.
     *
     * The snapshot is NOT a round-trip-able options object — extra keys like
     * `${name}Rotate` are not part of {@link StyleOptions} and feeding the
     * snapshot back into a new {@link Avatar} is not supported. Callers that
     * need to reproduce an avatar should pass the original `seed` and
     * user-supplied options.
     *
     * The returned object aliases the internal cache; callers that need
     * isolation (e.g. {@link Avatar.toJSON}) clone it themselves.
     */
    resolved() {
        return __classPrivateFieldGet(this, _Resolver_result, "f");
    }
}
_Resolver_style = new WeakMap(), _Resolver_options = new WeakMap(), _Resolver_prng = new WeakMap(), _Resolver_colorResolving = new WeakMap(), _Resolver_result = new WeakMap(), _Resolver_tagFilterCache = new WeakMap(), _Resolver_instances = new WeakSet(), _Resolver_probability = function _Resolver_probability(component) {
    const raw = __classPrivateFieldGet(this, _Resolver_options, "f").componentProbability(component.sourceName());
    return raw ?? component.probability();
}, _Resolver_isVisible = function _Resolver_isVisible(name, component) {
    return __classPrivateFieldGet(this, _Resolver_prng, "f").bool(`${name}Probability`, __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_probability).call(this, component));
}, _Resolver_variantWeights = function _Resolver_variantWeights(component) {
    const variants = component.variants();
    const named = __classPrivateFieldGet(this, _Resolver_options, "f").componentVariant(component.sourceName());
    const weights = {};
    const names = named
        ? Object.keys(named)
        : __classPrivateFieldGet(this, _Resolver_options, "f").tags().length > 0
            ? __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_tagFilteredNames).call(this, variants)
            : variants.keys();
    for (const name of names) {
        const variant = variants.get(name);
        if (variant !== undefined) {
            weights[name] = named ? named[name] : variant.weight();
        }
    }
    return weights;
}, _Resolver_tagFilter = function _Resolver_tagFilter() {
    if (__classPrivateFieldGet(this, _Resolver_tagFilterCache, "f")) {
        return __classPrivateFieldGet(this, _Resolver_tagFilterCache, "f");
    }
    const allows = new Map();
    const bares = new Set();
    const disallows = [];
    const bareDisallows = new Set();
    for (const { category, value, negated } of __classPrivateFieldGet(this, _Resolver_options, "f").tags()) {
        if (negated) {
            disallows.push({ category, value });
            if (value === undefined) {
                bareDisallows.add(category);
            }
        }
        else if (value !== undefined) {
            const values = allows.get(category) ?? [];
            values.push(value);
            allows.set(category, values);
        }
        else {
            bares.add(category);
        }
    }
    __classPrivateFieldSet(this, _Resolver_tagFilterCache, {
        // Materialize the allow groups once, not on every variant.
        allowGroups: [...allows],
        bares,
        disallows,
        bareDisallows,
    }, "f");
    return __classPrivateFieldGet(this, _Resolver_tagFilterCache, "f");
}, _Resolver_tagFilteredNames = function _Resolver_tagFilteredNames(variants) {
    const { allowGroups, bares, disallows, bareDisallows } = __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_tagFilter).call(this);
    // A bare token only binds where its category is in use, so this narrowing
    // — unlike the classification above — is genuinely per-component.
    const required = [...bares].filter((category) => {
        if (bareDisallows.has(category)) {
            return false;
        }
        for (const variant of variants.values()) {
            if (variant.hasTag(category)) {
                return true;
            }
        }
        return false;
    });
    const names = [];
    for (const [name, variant] of variants) {
        const allowed = allowGroups.every(([category, values]) => !variant.hasTag(category) ||
            values.some((value) => variant.hasTag(category, value))) && required.every((category) => variant.hasTag(category));
        const disallowed = disallows.some(({ category, value }) => variant.hasTag(category, value));
        if (allowed && !disallowed) {
            names.push(name);
        }
    }
    return names;
}, _Resolver_resolveColor = function _Resolver_resolveColor(name) {
    const userColors = __classPrivateFieldGet(this, _Resolver_options, "f").color(name);
    const styleColor = __classPrivateFieldGet(this, _Resolver_style, "f").colors().get(name);
    const source = userColors ?? styleColor?.values() ?? [];
    let candidates = source.map((c) => Color.toHex(c));
    const fixed = this.colorOrder(name) === COLOR_ORDER_FIXED;
    const verbatim = userColors !== undefined && fixed;
    const fill = this.colorFill(name);
    const stops = fill === 'solid'
        ? 1
        : __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_colorFillStops).call(this, name, verbatim ? candidates.length : 2);
    if (!styleColor) {
        return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_order).call(this, name, candidates, fixed, verbatim).slice(0, stops);
    }
    // Detect circular references (e.g. a.contrastTo = b, b.contrastTo = a)
    if (__classPrivateFieldGet(this, _Resolver_colorResolving, "f").includes(name)) {
        throw new CircularColorReferenceError(__classPrivateFieldGet(this, _Resolver_colorResolving, "f").concat(name));
    }
    __classPrivateFieldGet(this, _Resolver_colorResolving, "f").push(name);
    const contrastTo = styleColor.contrastTo();
    const notEqualTo = styleColor.notEqualTo();
    try {
        if (contrastTo && !verbatim) {
            const refColor = this.color(contrastTo)[0];
            if (refColor) {
                candidates = Color.sortByContrast(candidates, refColor);
            }
        }
        if (notEqualTo.length > 0) {
            const excluded = [];
            for (const ref of notEqualTo) {
                for (const color of this.color(ref)) {
                    excluded.push(color);
                }
            }
            candidates = Color.filterNotEqualTo(candidates, excluded);
        }
    }
    finally {
        __classPrivateFieldGet(this, _Resolver_colorResolving, "f").pop();
    }
    // Skip shuffle when sorted by contrast to preserve the ordering
    const ordered = contrastTo
        ? candidates
        : __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_order).call(this, name, candidates, fixed, verbatim);
    return ordered.slice(0, stops);
}, _Resolver_order = function _Resolver_order(name, candidates, fixed, verbatim) {
    if (!fixed) {
        return __classPrivateFieldGet(this, _Resolver_prng, "f").shuffle(`${name}Color`, candidates);
    }
    if (verbatim) {
        return candidates;
    }
    // Deprecated: DiceBear 11 will take the palette in its definition order
    // here, the same verbatim rule as user-supplied colors, and drop this
    // sort (see CHANGELOG.md, "Deprecated").
    return Array.from(new Set(candidates)).sort();
}, _Resolver_colorFillStops = function _Resolver_colorFillStops(name, fallback) {
    const range = __classPrivateFieldGet(this, _Resolver_options, "f").colorFillStops(name);
    return range
        ? __classPrivateFieldGet(this, _Resolver_prng, "f").integer(`${name}ColorFillStops`, range)
        : fallback;
}, _Resolver_memoFloat = function _Resolver_memoFloat(key, range, fallback) {
    return __classPrivateFieldGet(this, _Resolver_instances, "m", _Resolver_memo).call(this, key, () => range ? __classPrivateFieldGet(this, _Resolver_prng, "f").float(key, range) : fallback);
}, _Resolver_memo = function _Resolver_memo(key, compute) {
    if (key in __classPrivateFieldGet(this, _Resolver_result, "f")) {
        return __classPrivateFieldGet(this, _Resolver_result, "f")[key];
    }
    const value = compute();
    __classPrivateFieldGet(this, _Resolver_result, "f")[key] = value;
    return value;
};
