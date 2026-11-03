import { type AvailableStep } from './record';

// Current supply step. The shell renders only records whose availableFromStep is
// not greater than this. Raising it to 2 is the single edit that reveals the later-step records.
export const SUPPLY_STEP: AvailableStep = 1;

export const DefaultControlType = Object.freeze({
	Toggle: 'toggle',
	Field: 'field',
	Text: 'text',
	Navigation: 'navigation',
});
