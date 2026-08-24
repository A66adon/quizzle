var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Xml_entities, _Xml_pattern;
/**
 * Minimal XML escaping helper for SVG/XML text and attribute content.
 */
export class Xml {
    /**
     * Returns `value` with the five XML predefined entities escaped.
     */
    static escape(value) {
        return value.replace(__classPrivateFieldGet(_a, _a, "f", _Xml_pattern), (ch) => __classPrivateFieldGet(_a, _a, "f", _Xml_entities)[ch]);
    }
}
_a = Xml;
_Xml_entities = { value: {
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
    } };
_Xml_pattern = { value: new RegExp(`[${Object.keys(__classPrivateFieldGet(_a, _a, "f", _Xml_entities)).join('')}]`, 'g') };
