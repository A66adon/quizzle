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
var _Mulberry32_state;
const UINT32_MAX_PLUS_1 = 2 ** 32;
/**
 * Mulberry32 PRNG — stateful, matching the C reference by Tommy Ettinger.
 *
 * C original:
 * ```c
 * uint32_t z = (x += 0x6D2B79F5UL);
 * z = (z ^ (z >> 15)) * (z | 1UL);
 * z ^= z + (z ^ (z >> 7)) * (z | 61UL);
 * return z ^ (z >> 14);
 * ```
 *
 * @see https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export class Mulberry32 {
    constructor(seed) {
        _Mulberry32_state.set(this, void 0);
        __classPrivateFieldSet(this, _Mulberry32_state, seed, "f");
    }
    /**
     * Advances the state and returns the next unsigned 32-bit value.
     */
    next() {
        const z = (__classPrivateFieldSet(this, _Mulberry32_state, (__classPrivateFieldGet(this, _Mulberry32_state, "f") + 0x6d2b79f5) | 0, "f"));
        let t = Math.imul(z ^ (z >>> 15), z | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return (t ^ (t >>> 14)) >>> 0;
    }
    /**
     * Advances the state and returns the next value in `[0, 1)`.
     */
    nextFloat() {
        return this.next() / UINT32_MAX_PLUS_1;
    }
    /**
     * Returns the current internal state, useful for snapshotting.
     */
    state() {
        return __classPrivateFieldGet(this, _Mulberry32_state, "f");
    }
}
_Mulberry32_state = new WeakMap();
