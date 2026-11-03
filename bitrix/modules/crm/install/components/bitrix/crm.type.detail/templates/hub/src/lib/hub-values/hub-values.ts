import {
	DAYS_BEFORE_CLOSE_MAX,
	DAYS_BEFORE_CLOSE_MIN,
	LIVE_BOOLEAN_FIELD_NAMES,
} from '../../const/descriptor';

// The editable value keys of the SP form: the 16 live booleans plus the non-boolean fields. Source
// of truth for the store snapshot, isDirty comparison and revert. Kept as pure functions (no Pinia)
// so the dirty/commit/revert semantics are unit-testable in the bare harness; the store is a thin
// defineStore wrapper over these.
export const HUB_VALUE_KEYS: string[] = [
	...LIVE_BOOLEAN_FIELD_NAMES,
	'title',
	'description',
	'daysBeforeClose',
	'linkedUserFields',
	'relations',
	'customSectionId',
	'customSections',
	'isExternal',
];

export function defaultHubValues(): Record<string, unknown>
{
	const values: Record<string, unknown> = {};
	LIVE_BOOLEAN_FIELD_NAMES.forEach((name) => {
		values[name] = false;
	});
	values.title = '';
	values.description = '';
	values.daysBeforeClose = '';
	values.linkedUserFields = {};
	values.relations = { parent: [], child: [] };
	values.customSectionId = 0;
	values.customSections = [];
	values.isExternal = false;

	return values;
}

// Deep clone of only the editable value keys: the snapshot is an independent copy revert restores
// verbatim. The structured data here is JSON-safe.
export function pickHubValues(source: Record<string, unknown>): Record<string, unknown>
{
	const values: Record<string, unknown> = {};
	HUB_VALUE_KEYS.forEach((key) => {
		values[key] = source[key];
	});

	return JSON.parse(JSON.stringify(values)) as Record<string, unknown>;
}

export function areHubValuesEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean
{
	return JSON.stringify(a) === JSON.stringify(b);
}

// Mirrors TypeModel.setDaysBeforeClose: nil / empty string -> null, otherwise Number. The two guards
// prod delegated to <input type="number" min max> are done here, since BInput takes no min/max: a
// non-numeric value is reported as empty (that is what the native number input made of it) instead of
// letting NaN reach the payload, and a valid number is kept within the field bounds. Shared by the
// payload and by the store, so the value on screen cannot diverge from the one the server stores.
export function normalizeDaysBeforeClose(raw: unknown): number | null
{
	if (raw === null || raw === undefined || raw === '')
	{
		return null;
	}

	const days = Number(raw);
	if (Number.isNaN(days))
	{
		return null;
	}

	return Math.min(Math.max(days, DAYS_BEFORE_CLOSE_MIN), DAYS_BEFORE_CLOSE_MAX);
}

// The store keeps the field as free text, so the normalized number goes back as a string.
export function formatDaysBeforeClose(raw: unknown): string
{
	const days = normalizeDaysBeforeClose(raw);

	return days === null ? '' : String(days);
}
