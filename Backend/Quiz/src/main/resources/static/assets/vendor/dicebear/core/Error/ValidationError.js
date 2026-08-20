/**
 * Base class for schema validation errors. Carries the prefix in `message`
 * and the per-field failures in {@link details}.
 */
export class ValidationError extends Error {
    constructor(prefix, details) {
        const parts = [];
        for (const detail of details) {
            const segments = [];
            if (detail.instancePath) {
                segments.push(detail.instancePath);
            }
            if (detail.message) {
                segments.push(detail.message);
            }
            parts.push(segments.join(' '));
        }
        super(`${prefix}: ${parts.join(', ')}`);
        this.name = 'ValidationError';
        this.details = details;
    }
}
