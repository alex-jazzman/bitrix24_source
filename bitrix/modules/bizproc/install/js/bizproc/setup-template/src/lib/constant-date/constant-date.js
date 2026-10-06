import { Extension, Loc, Type } from 'main.core';
import { DateTimeFormat, Timezone } from 'main.date';
import { createDate, DatePicker, type DatePickerOptions } from 'ui.date-picker';

export type ConstantTimezone = {
	value: string,
	text: string,
	// The current user zone comes with the `current` keyword instead of a numeric offset.
	offset: number | string,
};

export type ParsedConstantDateValue = {
	text: string,
	timezone: ?ConstantTimezone,
};

type SerializeValueOptions = {
	timezone?: ?ConstantTimezone,
	isDateTime?: boolean,
};

type BoundPickerOptions = {
	input: HTMLInputElement,
	pickerId: string,
	onSelect: () => void,
	pickerOptions?: DatePickerOptions,
};

const EXTENSION_NAME = 'bizproc.setup-template';

// Culture format codes of main.date: the only allowed source of date formats.
export const VALUE_FORMATS = Object.freeze({
	DATE: 'FORMAT_DATE',
	DATETIME: 'FORMAT_DATETIME',
	TIME: 'SHORT_TIME_FORMAT',
});

// The value carries a numeric offset only: Bitrix\Bizproc\BaseType\Value\Date reads nothing else.
const TIMEZONE_OFFSET_REGEX = /\s\[[\d-]+]$/;

const OPEN_PICKER_KEYS = new Set(['Enter', ' ', 'Spacebar']);

// Rows of the form that carry a real picker. Declared next to the rows themselves, so a consumer
// outside the extension (the preview of the setup wizard) does not repeat the class names.
export const PICKER_ROW_SELECTOR = '.bizproc-setup-template__date-row, .bizproc-setup-template__time-row';

// The zone of the current user: the only zone whose offset is not fixed in the list but read from
// the page, so the only one a stored offset may stop matching.
const USER_TIMEZONE_VALUE = 'current';

// A constant is filled in for the server or for the user, so the module-wide zone list is narrowed
// to these two and titled with the phrases of the form. The `time` field keeps the full list.
const TIMEZONE_TITLES = new Map([
	['', 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE_SERVER'],
	[USER_TIMEZONE_VALUE, 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE_USER'],
]);

let offeredTimezones: ?Array<ConstantTimezone> = null;

/**
 * Narrowing the module-wide zone list gives the same two zones for the whole page, so it is done
 * once: a multiple constant renders a control per row.
 */
export function getTimezones(): Array<ConstantTimezone>
{
	offeredTimezones ??= Object.freeze(
		Extension.getSettings(EXTENSION_NAME)
			.get('timezones', [])
			.filter((zone: ConstantTimezone) => TIMEZONE_TITLES.has(zone.value))
			.map((zone: ConstantTimezone) => ({ ...zone, text: Loc.getMessage(TIMEZONE_TITLES.get(zone.value)) })),
	);

	return offeredTimezones;
}

export function isPickerOpenKey(event: KeyboardEvent): boolean
{
	return OPEN_PICKER_KEYS.has(event.key);
}

/**
 * Picker attached to an input: its own events do not work inside the slider,
 * so the inner picker view is subscribed directly.
 */
export function createBoundPicker(options: BoundPickerOptions): DatePicker
{
	const { input, pickerId, onSelect, pickerOptions = {} } = options;
	const picker = new DatePicker({
		...pickerOptions,
		targetNode: input,
		popupOptions: {
			targetContainer: input.ownerDocument?.body || document.body,
		},
	});

	picker.getPicker(pickerId)?.subscribe('onSelect', () => {
		setTimeout(onSelect, 0);
	});

	return picker;
}

/**
 * DatePicker keeps dates in UTC parts, so they have to be formatted as UTC as well,
 * otherwise the value is shifted by the browser offset.
 */
export function formatDate(date: ?Date, formatCode: string = VALUE_FORMATS.DATE): string
{
	if (!Type.isDate(date))
	{
		return '';
	}

	return DateTimeFormat.format(DateTimeFormat.getFormat(formatCode), date, null, true);
}

/**
 * ALG-01: the offset of a zone in seconds, the only form the value may carry. The current user zone
 * comes with the `current` keyword instead of a number, so its offset is taken from the page — the
 * same CTimeZone offset the server puts into a value filled in for the current user.
 */
export function resolveNumericOffset(timezone: ?ConstantTimezone): number
{
	const offset = Number.parseInt(timezone?.offset, 10);

	return Number.isNaN(offset) ? Timezone.Offset.USER_TO_SERVER : offset;
}

/**
 * ALG-01: the only place where a picked date becomes a constant value.
 * The date itself is kept as entered, the timezone is encoded by the ` [offset]` suffix only.
 */
export function serializeValue(pickedDate: ?Date, options: SerializeValueOptions = {}): string
{
	const { timezone = null, isDateTime = false } = options;
	const text = formatDate(pickedDate, isDateTime ? VALUE_FORMATS.DATETIME : VALUE_FORMATS.DATE);
	if (text === '')
	{
		return '';
	}

	return Type.isStringFilled(timezone?.value) ? `${text} [${resolveNumericOffset(timezone)}]` : text;
}

/**
 * ALG-01: the zone a stored offset was saved with.
 *
 * A zone with a value is the only one this front serializes a suffix for, so it owns a matching
 * offset: on a portal where the user offset equals the server one the server zone would otherwise
 * shadow the zone the value was actually filled in for. Zone offsets are not unique among the rest,
 * so the first zone with the same offset wins.
 *
 * The offset of the server zone stays with the server zone anyway, because the front is not the only
 * writer: a value saved through a form goes into the constant by way of Bitrix\Bizproc\BaseType\Date,
 * whose extractValue() serializes it with a suffix even when no zone was picked.
 *
 * Any other unknown offset belongs to the user: their zone changed after the value was saved (a
 * profile change, a seasonal switch). Reading it as the server zone would drop the suffix on the
 * next edit of the row.
 */
function findOffsetTimezone(offset: number, timezones: Array<ConstantTimezone>): ?ConstantTimezone
{
	const zoneOfOffset = timezones.find(
		(zone: ConstantTimezone) => Type.isStringFilled(zone.value) && resolveNumericOffset(zone) === offset,
	);
	if (zoneOfOffset)
	{
		return zoneOfOffset;
	}

	const isServerOffset = timezones.some(
		(zone: ConstantTimezone) => !Type.isStringFilled(zone.value) && resolveNumericOffset(zone) === offset,
	);

	return isServerOffset
		? null
		: timezones.find((zone: ConstantTimezone) => zone.value === USER_TIMEZONE_VALUE) ?? null;
}

/**
 * ALG-01: splits a stored constant value into the site-formatted text and the timezone it was saved with.
 */
export function parseValue(modelValue: string, timezones: Array<ConstantTimezone> = []): ParsedConstantDateValue
{
	const value = Type.isString(modelValue) ? modelValue : '';
	const offsetText = value.match(TIMEZONE_OFFSET_REGEX)?.[0].replaceAll(/[\s[\]]/g, '') ?? null;
	const offset = offsetText === null ? null : Number.parseInt(offsetText, 10);

	return {
		text: value.replace(TIMEZONE_OFFSET_REGEX, ''),
		timezone: offset === null ? null : findOffsetTimezone(offset, timezones),
	};
}

/**
 * Site-formatted text back into a picker-compatible date (UTC parts), null when it is not a date.
 */
export function createDateFromText(text: string): ?Date
{
	const parsedDate = Type.isStringFilled(text) ? DateTimeFormat.parse(text) : null;

	return parsedDate === null ? null : createDate(parsedDate);
}
