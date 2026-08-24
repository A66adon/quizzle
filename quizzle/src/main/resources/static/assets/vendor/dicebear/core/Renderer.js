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
var _Renderer_instances, _Renderer_style, _Renderer_resolver, _Renderer_defs, _Renderer_cachedSeedHash, _Renderer_cachedInitials, _Renderer_applyFlip, _Renderer_applyScale, _Renderer_applyBorderRadius, _Renderer_applyRotate, _Renderer_applyTranslate, _Renderer_renderBackground, _Renderer_randomizeIds, _Renderer_renderElements, _Renderer_renderElement, _Renderer_renderSvgElement, _Renderer_renderTextElement, _Renderer_renderComponentElement, _Renderer_buildTransforms, _Renderer_renderAttributes, _Renderer_resolveAttributeValue, _Renderer_resolveColorReference, _Renderer_buildGradientDef, _Renderer_resolveValue, _Renderer_resolveVariable, _Renderer_initials, _Renderer_hashSeed;
import { Fnv1a } from './Prng/Fnv1a.js';
import { Initials } from './Utils/Initials.js';
import { License } from './Utils/License.js';
import { Number } from './Utils/Number.js';
import { Xml } from './Utils/Xml.js';
/**
 * Walks a style's element tree and turns it into the final SVG markup.
 *
 * The renderer is single-use: it accumulates `<defs>` entries and per-render
 * caches across method calls, so a fresh instance is required per avatar.
 */
export class Renderer {
    constructor(style, resolver) {
        _Renderer_instances.add(this);
        _Renderer_style.set(this, void 0);
        _Renderer_resolver.set(this, void 0);
        _Renderer_defs.set(this, new Map());
        _Renderer_cachedSeedHash.set(this, void 0);
        _Renderer_cachedInitials.set(this, void 0);
        __classPrivateFieldSet(this, _Renderer_style, style, "f");
        __classPrivateFieldSet(this, _Renderer_resolver, resolver, "f");
    }
    /**
     * Builds the complete SVG document for the avatar.
     */
    render() {
        const canvas = __classPrivateFieldGet(this, _Renderer_style, "f").canvas();
        const background = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderBackground).call(this, canvas);
        let body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderElements).call(this, canvas.elements());
        // Order matters: scale and flip around center, then rotate, translate,
        // and finally clip with border radius (outermost wrapper).
        body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_applyScale).call(this, body, canvas);
        body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_applyFlip).call(this, body, canvas);
        body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_applyRotate).call(this, body, canvas);
        body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_applyTranslate).call(this, body, canvas);
        body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_applyBorderRadius).call(this, `${background}${body}`, canvas);
        const metadata = License.xml(__classPrivateFieldGet(this, _Renderer_style, "f").meta());
        const defs = __classPrivateFieldGet(this, _Renderer_defs, "f").size > 0
            ? `<defs>${Array.from(__classPrivateFieldGet(this, _Renderer_defs, "f").values()).join('')}</defs>`
            : '';
        const size = __classPrivateFieldGet(this, _Renderer_resolver, "f").size();
        const title = __classPrivateFieldGet(this, _Renderer_resolver, "f").title();
        const escapedTitle = title !== undefined ? Xml.escape(title) : undefined;
        const attrs = [
            'xmlns="http://www.w3.org/2000/svg"',
            `viewBox="0 0 ${Number.format(canvas.width())} ${Number.format(canvas.height())}"`,
        ];
        const rootAttributes = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderAttributes).call(this, __classPrivateFieldGet(this, _Renderer_style, "f").attributes());
        if (rootAttributes) {
            attrs.push(rootAttributes.trimStart());
        }
        if (escapedTitle !== undefined) {
            attrs.push('role="img"', `aria-label="${escapedTitle}"`);
        }
        else {
            attrs.push('aria-hidden="true"');
        }
        if (size !== undefined) {
            const sizeValue = Number.format(size);
            attrs.push(`width="${sizeValue}"`, `height="${sizeValue}"`);
        }
        const titleElement = escapedTitle !== undefined ? `<title>${escapedTitle}</title>` : '';
        let svg = `<svg ${attrs.join(' ')}><!-- Generated by DiceBear (https://www.dicebear.com) -->${metadata}${defs}${titleElement}${body}</svg>`;
        if (__classPrivateFieldGet(this, _Renderer_resolver, "f").idRandomization()) {
            svg = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_randomizeIds).call(this, svg);
        }
        return svg;
    }
}
_Renderer_style = new WeakMap(), _Renderer_resolver = new WeakMap(), _Renderer_defs = new WeakMap(), _Renderer_cachedSeedHash = new WeakMap(), _Renderer_cachedInitials = new WeakMap(), _Renderer_instances = new WeakSet(), _Renderer_applyFlip = function _Renderer_applyFlip(body, canvas) {
    const flip = __classPrivateFieldGet(this, _Renderer_resolver, "f").flip();
    if (flip === 'none') {
        return body;
    }
    const w = Number.format(canvas.width());
    const h = Number.format(canvas.height());
    let transform;
    switch (flip) {
        case 'horizontal':
            transform = `translate(${w}, 0) scale(-1, 1)`;
            break;
        case 'vertical':
            transform = `translate(0, ${h}) scale(1, -1)`;
            break;
        case 'both':
            transform = `translate(${w}, ${h}) scale(-1, -1)`;
            break;
    }
    return `<g transform="${transform}">${body}</g>`;
}, _Renderer_applyScale = function _Renderer_applyScale(body, canvas) {
    const scale = __classPrivateFieldGet(this, _Renderer_resolver, "f").scale();
    if (scale === 1) {
        return body;
    }
    const cx = canvas.width() / 2;
    const cy = canvas.height() / 2;
    return `<g transform="translate(${Number.format(cx)}, ${Number.format(cy)}) scale(${Number.format(scale)}) translate(${Number.format(-cx)}, ${Number.format(-cy)})">${body}</g>`;
}, _Renderer_applyBorderRadius = function _Renderer_applyBorderRadius(body, canvas) {
    const radius = __classPrivateFieldGet(this, _Renderer_resolver, "f").borderRadius();
    const id = `clip-${__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_hashSeed).call(this)}`;
    const rx = Number.format((radius / 100) * canvas.width());
    const ry = Number.format((radius / 100) * canvas.height());
    __classPrivateFieldGet(this, _Renderer_defs, "f").set(id, `<clipPath id="${id}"><rect width="${Number.format(canvas.width())}" height="${Number.format(canvas.height())}" rx="${rx}" ry="${ry}"/></clipPath>`);
    return `<g clip-path="url(#${id})">${body}</g>`;
}, _Renderer_applyRotate = function _Renderer_applyRotate(body, canvas) {
    const rotate = __classPrivateFieldGet(this, _Renderer_resolver, "f").rotate();
    if (rotate === 0) {
        return body;
    }
    const cx = canvas.width() / 2;
    const cy = canvas.height() / 2;
    return `<g transform="rotate(${Number.format(rotate)}, ${Number.format(cx)}, ${Number.format(cy)})">${body}</g>`;
}, _Renderer_applyTranslate = function _Renderer_applyTranslate(body, canvas) {
    const tx = __classPrivateFieldGet(this, _Renderer_resolver, "f").translateX();
    const ty = __classPrivateFieldGet(this, _Renderer_resolver, "f").translateY();
    if (tx === 0 && ty === 0) {
        return body;
    }
    const x = Number.format((tx / 100) * canvas.width());
    const y = Number.format((ty / 100) * canvas.height());
    return `<g transform="translate(${x}, ${y})">${body}</g>`;
}, _Renderer_renderBackground = function _Renderer_renderBackground(canvas) {
    const colors = __classPrivateFieldGet(this, _Renderer_resolver, "f").color('background');
    if (colors.length === 0) {
        return '';
    }
    return `<rect width="${Number.format(canvas.width())}" height="${Number.format(canvas.height())}" fill="${Xml.escape(__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveColorReference).call(this, 'background'))}"/>`;
}, _Renderer_randomizeIds = function _Renderer_randomizeIds(svg) {
    const suffix = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    const ids = new Set();
    for (const match of svg.matchAll(/\bid="([^"]+)"/g)) {
        ids.add(match[1]);
    }
    if (ids.size === 0) {
        return svg;
    }
    const escaped = Array.from(ids, (id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(id="|url\\(#|href="#)(${escaped.join('|')})("|\\))`, 'g');
    return svg.replace(pattern, (_, prefix, id, end) => `${prefix}${id}-${suffix}${end}`);
}, _Renderer_renderElements = function _Renderer_renderElements(elements) {
    return elements.map((el) => __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderElement).call(this, el)).join('');
}, _Renderer_renderElement = function _Renderer_renderElement(element) {
    switch (element.type()) {
        case 'element':
            return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderSvgElement).call(this, element);
        case 'text':
            return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderTextElement).call(this, element);
        case 'component':
            return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderComponentElement).call(this, element);
    }
}, _Renderer_renderSvgElement = function _Renderer_renderSvgElement(element) {
    const name = element.name();
    if (!name) {
        return '';
    }
    if (name === 'defs') {
        for (const child of element.children()) {
            const rendered = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderElement).call(this, child);
            if (rendered.length > 0) {
                const id = child.attributes()?.id;
                const key = typeof id === 'string' ? id : `_${__classPrivateFieldGet(this, _Renderer_defs, "f").size}`;
                __classPrivateFieldGet(this, _Renderer_defs, "f").set(key, rendered);
            }
        }
        return '';
    }
    const attrs = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderAttributes).call(this, element.attributes());
    const children = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderElements).call(this, element.children());
    if (children.length === 0) {
        // A wrapper whose children all rendered to nothing, because an optional
        // component came up empty, has no content left to group. It draws
        // nothing either way, but a masked group without content has an empty
        // bounding box, and strict SVG parsers reject the whole document over
        // it. Wrappers that carry an id stay, so references keep resolving.
        if (element.children().length > 0 &&
            element.attributes()?.id === undefined) {
            return '';
        }
        return `<${name}${attrs}/>`;
    }
    return `<${name}${attrs}>${children}</${name}>`;
}, _Renderer_renderTextElement = function _Renderer_renderTextElement(element) {
    const value = element.value();
    return value !== undefined ? Xml.escape(__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveValue).call(this, value)) : '';
}, _Renderer_renderComponentElement = function _Renderer_renderComponentElement(element) {
    const componentName = element.name();
    if (typeof componentName !== 'string') {
        return '';
    }
    const variantName = __classPrivateFieldGet(this, _Renderer_resolver, "f").variant(componentName);
    if (!variantName) {
        return '';
    }
    const component = __classPrivateFieldGet(this, _Renderer_style, "f").components().get(componentName);
    if (!component) {
        return '';
    }
    const variant = component.variants().get(variantName);
    if (!variant) {
        return '';
    }
    const id = `${component.sourceName()}-${variantName}-${__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_hashSeed).call(this)}`;
    if (!__classPrivateFieldGet(this, _Renderer_defs, "f").has(id)) {
        const body = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderElements).call(this, variant.elements());
        __classPrivateFieldGet(this, _Renderer_defs, "f").set(id, `<g id="${id}">${body}</g>`);
    }
    const transforms = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_buildTransforms).call(this, component);
    const userAttributes = element.attributes();
    let mergedAttributes = userAttributes;
    if (transforms.length > 0) {
        const userTransform = userAttributes?.transform;
        const allParts = typeof userTransform === 'string' && userTransform.length > 0
            ? [userTransform, ...transforms]
            : transforms;
        mergedAttributes = { ...userAttributes, transform: allParts.join(' ') };
    }
    const attrs = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_renderAttributes).call(this, mergedAttributes);
    return `<use${attrs} href="#${id}"/>`;
}, _Renderer_buildTransforms = function _Renderer_buildTransforms(component) {
    const { rotate, translateX, translateY, scale } = __classPrivateFieldGet(this, _Renderer_resolver, "f").componentTransform(component.name());
    if (translateX === 0 && translateY === 0 && rotate === 0 && scale === 1) {
        return [];
    }
    const transforms = [];
    const cx = component.width() / 2;
    const cy = component.height() / 2;
    const cxValue = Number.format(cx);
    const cyValue = Number.format(cy);
    if (translateX !== 0 || translateY !== 0) {
        const x = Number.format((translateX / 100) * component.width());
        const y = Number.format((translateY / 100) * component.height());
        transforms.push(`translate(${x}, ${y})`);
    }
    if (rotate !== 0) {
        transforms.push(`rotate(${Number.format(rotate)}, ${cxValue}, ${cyValue})`);
    }
    if (scale !== 1) {
        transforms.push(`translate(${cxValue}, ${cyValue}) scale(${Number.format(scale)}) translate(${Number.format(-cx)}, ${Number.format(-cy)})`);
    }
    return transforms;
}, _Renderer_renderAttributes = function _Renderer_renderAttributes(attributes) {
    if (!attributes) {
        return '';
    }
    const parts = [];
    for (const [key, value] of Object.entries(attributes)) {
        if (value === undefined) {
            continue;
        }
        parts.push(`${key}="${Xml.escape(__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveAttributeValue).call(this, value))}"`);
    }
    if (parts.length === 0) {
        return '';
    }
    return ` ${parts.join(' ')}`;
}, _Renderer_resolveAttributeValue = function _Renderer_resolveAttributeValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value.type === 'color') {
        return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveColorReference).call(this, value.name);
    }
    return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveVariable).call(this, value.name);
}, _Renderer_resolveColorReference = function _Renderer_resolveColorReference(name) {
    const colors = __classPrivateFieldGet(this, _Renderer_resolver, "f").color(name);
    const fill = __classPrivateFieldGet(this, _Renderer_resolver, "f").colorFill(name);
    if (fill === 'solid' || colors.length <= 1) {
        return colors[0] ?? 'none';
    }
    return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_buildGradientDef).call(this, name, colors, fill);
}, _Renderer_buildGradientDef = function _Renderer_buildGradientDef(name, colors, fill) {
    const rotation = __classPrivateFieldGet(this, _Renderer_resolver, "f").colorAngle(name);
    const id = `${name}-color-${__classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_hashSeed).call(this)}`;
    const tag = fill === 'linear' ? 'linearGradient' : 'radialGradient';
    const rotateAttr = rotation !== 0
        ? ` gradientTransform="rotate(${Number.format(rotation)}, 0.5, 0.5)"`
        : '';
    const stops = colors.map((color, i) => {
        const offset = Number.format((i / (colors.length - 1)) * 100);
        return `<stop offset="${offset}%" stop-color="${Xml.escape(color)}"/>`;
    });
    __classPrivateFieldGet(this, _Renderer_defs, "f").set(id, `<${tag} id="${id}"${rotateAttr}>${stops.join('')}</${tag}>`);
    return `url(#${id})`;
}, _Renderer_resolveValue = function _Renderer_resolveValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value.type === 'variable') {
        return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_resolveVariable).call(this, value.name);
    }
    return '';
}, _Renderer_resolveVariable = function _Renderer_resolveVariable(name) {
    switch (name) {
        case 'initial': {
            // charAt(0) would return a lone surrogate (ill-formed XML) for
            // supplementary-plane initials; take the full first code point
            // instead, like the PHP/Python/Rust/Go/Dart ports.
            const first = __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_initials).call(this).codePointAt(0);
            return first !== undefined ? String.fromCodePoint(first) : '';
        }
        case 'initials':
            return __classPrivateFieldGet(this, _Renderer_instances, "m", _Renderer_initials).call(this);
        case 'fontWeight':
            return Number.format(__classPrivateFieldGet(this, _Renderer_resolver, "f").fontWeight());
        case 'fontFamily':
            return __classPrivateFieldGet(this, _Renderer_resolver, "f").fontFamily();
    }
}, _Renderer_initials = function _Renderer_initials() {
    return (__classPrivateFieldSet(this, _Renderer_cachedInitials, __classPrivateFieldGet(this, _Renderer_cachedInitials, "f") ?? Initials.fromSeed(__classPrivateFieldGet(this, _Renderer_resolver, "f").seed()), "f"));
}, _Renderer_hashSeed = function _Renderer_hashSeed() {
    return (__classPrivateFieldSet(this, _Renderer_cachedSeedHash, __classPrivateFieldGet(this, _Renderer_cachedSeedHash, "f") ?? Fnv1a.hex((__classPrivateFieldGet(this, _Renderer_style, "f").meta().source().name() ?? '') + ':' + __classPrivateFieldGet(this, _Renderer_resolver, "f").seed()), "f"));
};
