/**
 * Thrown when a color in the style definition references itself, directly or
 * indirectly. The {@link chain} field reproduces the resolution path.
 */
export class CircularColorReferenceError extends Error {
    constructor(chain) {
        const path = chain.join(' → ');
        super(`Circular color reference: ${path}`);
        this.name = 'CircularColorReferenceError';
        this.chain = chain;
    }
}
