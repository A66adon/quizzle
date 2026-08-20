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
var _Prng_instances, _Prng_seed, _Prng_uniqueByCodePoint, _Prng_compareByCodePoint;
import { Fnv1a } from './Prng/Fnv1a.js';
import { Mulberry32 } from './Prng/Mulberry32.js';
/**
 * Key-based pseudorandom number generator.
 *
 * Each method takes a key that, combined with the seed, produces a
 * deterministic value. The same seed + key always yields the same result,
 * regardless of call order.
 */
export class Prng {
    constructor(seed) {
        _Prng_instances.add(this);
        _Prng_seed.set(this, void 0);
        __classPrivateFieldSet(this, _Prng_seed, seed, "f");
    }
    /**
     * Picks a single item from `items` deterministically. Returns `undefined`
     * for an empty list. Duplicate values (by string representation) are
     * collapsed before picking so that input order and duplication do not
     * affect the result.
     */
    pick(key, items) {
        if (items.length === 0) {
            return undefined;
        }
        if (items.length === 1) {
            return items[0];
        }
        const unique = __classPrivateFieldGet(this, _Prng_instances, "m", _Prng_uniqueByCodePoint).call(this, items);
        if (unique.length === 1) {
            return unique[0];
        }
        const sorted = unique.sort(__classPrivateFieldGet(this, _Prng_instances, "m", _Prng_compareByCodePoint));
        const index = Math.floor(this.getValue(key) * sorted.length);
        return sorted[index];
    }
    /**
     * Picks a key from `weights` proportional to its weight. When all weights
     * are zero, falls back to an unweighted {@link pick}. Returns `undefined`
     * for an empty map.
     */
    weightedPick(key, weights) {
        const keys = Object.keys(weights);
        if (keys.length === 0) {
            return undefined;
        }
        if (keys.length === 1) {
            return keys[0];
        }
        const sorted = keys.sort(__classPrivateFieldGet(this, _Prng_instances, "m", _Prng_compareByCodePoint));
        const totalWeight = sorted.reduce((sum, k) => sum + weights[k], 0);
        if (totalWeight === 0) {
            return this.pick(key, sorted);
        }
        const threshold = this.getValue(key) * totalWeight;
        let cumulative = 0;
        for (const k of sorted) {
            cumulative += weights[k];
            if (threshold < cumulative) {
                return k;
            }
        }
        return sorted[sorted.length - 1];
    }
    /**
     * Returns `true` with the given probability (0–100, default 50).
     */
    bool(key, likelihood = 50) {
        return this.getValue(key) * 100 < likelihood;
    }
    /**
     * Returns a deterministic float in `range`, rounded to four decimal places.
     * With `range.step > 0`, the result is drawn uniformly from
     * `{ min + i*step | 0 ≤ i ≤ floor((max - min) / step) }`, so both endpoints
     * of an evenly-divisible range are equally likely. Non-positive or absent
     * step means continuous. `min`/`max` are sorted internally, so a reversed
     * pair is tolerated.
     */
    float(key, range) {
        const min = Math.min(range.min, range.max);
        const max = Math.max(range.min, range.max);
        const step = range.step ?? 0;
        let value;
        if (step > 0) {
            const buckets = Math.floor((max - min) / step) + 1;
            const i = Math.floor(this.getValue(key) * buckets);
            value = min + i * step;
        }
        else {
            value = min + this.getValue(key) * (max - min);
        }
        return Math.round(value * 10000) / 10000;
    }
    /**
     * Returns a deterministic integer in `range`. `min`/`max` are sorted
     * internally, so a reversed pair is tolerated. `range.step` is accepted
     * for symmetry with {@link float} but ignored — integers already step by 1.
     */
    integer(key, range) {
        const min = Math.min(range.min, range.max);
        const max = Math.max(range.min, range.max);
        return Math.floor(this.getValue(key) * (max - min + 1)) + min;
    }
    /**
     * Fisher-Yates shuffle with chained Mulberry32 state. Duplicate values
     * (by string representation) are collapsed before shuffling, so a
     * caller's slice off the front cannot accidentally produce a repeated
     * value.
     */
    shuffle(key, items) {
        if (items.length <= 1) {
            return [...items];
        }
        const result = __classPrivateFieldGet(this, _Prng_instances, "m", _Prng_uniqueByCodePoint).call(this, items).sort(__classPrivateFieldGet(this, _Prng_instances, "m", _Prng_compareByCodePoint));
        const prng = new Mulberry32(Fnv1a.hash(__classPrivateFieldGet(this, _Prng_seed, "f") + ':' + key));
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(prng.nextFloat() * (i + 1));
            const temp = result[i];
            result[i] = result[j];
            result[j] = temp;
        }
        return result;
    }
    /**
     * Returns a single float in `[0, 1)` derived from `seed:key`. The same
     * seed/key pair always produces the same value.
     */
    getValue(key) {
        return new Mulberry32(Fnv1a.hash(__classPrivateFieldGet(this, _Prng_seed, "f") + ':' + key)).nextFloat();
    }
}
_Prng_seed = new WeakMap(), _Prng_instances = new WeakSet(), _Prng_uniqueByCodePoint = function _Prng_uniqueByCodePoint(items, keyFn = String) {
    const seen = new Set();
    const result = [];
    for (const item of items) {
        const repr = keyFn(item);
        if (!seen.has(repr)) {
            seen.add(repr);
            result.push(item);
        }
    }
    return result;
}, _Prng_compareByCodePoint = function _Prng_compareByCodePoint(a, b) {
    const sa = String(a);
    const sb = String(b);
    if (sa < sb) {
        return -1;
    }
    if (sa > sb) {
        return 1;
    }
    return 0;
};
