import { ValidationError } from './ValidationError.js';
/**
 * Thrown when avatar options fail schema validation.
 */
export class OptionsValidationError extends ValidationError {
    constructor(details) {
        super('Invalid options', details);
        this.name = 'OptionsValidationError';
    }
}
