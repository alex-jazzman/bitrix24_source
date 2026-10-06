import {Dom, Extension, Tag, Text, Type} from 'main.core';

/**
 * A zone as the backend offers it: `offset` is a number of seconds, or `current` - the zone of
 * whoever is looking, which only the server can turn into a number.
 */
export type Timezone = {
	value: string,
	text: string,
	offset: number | string,
};

/** A stored date taken apart: the part a control shows and the offset travelling next to it. */
export type OffsetValue = {
	value: string,
	offset: string | null,
};

export type TimezoneMatch = {
	/**
	 * At offset 0 the explicit "server time" zone (the one with an empty value) wins over any
	 * zone that merely shares the offset. `datetime` reads a zero offset as server time;
	 * `date` has no such zone and matches by offset alone.
	 */
	preferEmptyZoneAtZeroOffset?: boolean,
};

export type TimezoneSelectParams = {
	timezones: Timezone[],
	selected: Timezone | undefined,
	name: string,
	ariaLabel: string,
	testId: string,
	disabled: boolean,
};

// The stored form of a date joins it with its zone as `<date> [offset]`. The expression is the
// one the backend writes and reads back (Value\Date::serialize), so it is kept verbatim: a
// looser pattern here would make the two sides disagree about where the date ends.
const OFFSET_SUFFIX: RegExp = /\s\[(-?\d+)]$/;

/**
 * Splits a stored value into the date a control displays and the offset a zone select holds.
 * Both parts always come from the same reading, so a caller cannot strip the suffix by one rule
 * and read the offset by another.
 */
export function splitOffsetValue(rawValue: string): OffsetValue
{
	if (!Type.isStringFilled(rawValue))
	{
		return {value: '', offset: null};
	}

	const match = rawValue.match(OFFSET_SUFFIX);

	return {
		value: rawValue.replace(OFFSET_SUFFIX, ''),
		offset: match ? match[1] : null,
	};
}

/**
 * Zones a field offers: the property wins, the extension settings fill the gap. The settings id
 * is an argument because every date type is configured on its own - the lists differ and must
 * not be merged.
 */
export function readTimezones(propertySettings: unknown, extensionId: string): Timezone[]
{
	const propertyZones = Type.isPlainObject(propertySettings)
		? (propertySettings as { timezones?: unknown }).timezones
		: null;

	if (Type.isArrayFilled(propertyZones))
	{
		return propertyZones as Timezone[];
	}

	const extensionZones = Extension.getSettings(extensionId).get('timezones');

	return Type.isArray(extensionZones) ? (extensionZones as Timezone[]) : [];
}

/**
 * The one rule for "which zone does this offset mean", shared by the initial render and by
 * writing a value - the two must not disagree, or writing a value would move the zone.
 * Exactly one zone is picked: several zones share an offset, and marking them all selected
 * would leave the choice to the browser.
 */
export function findTimezoneByOffset(
	timezones: Timezone[],
	offset: string | null,
	match: TimezoneMatch = {},
): Timezone | undefined
{
	if (Type.isNull(offset))
	{
		return timezones.find((zone) => zone.value === 'current');
	}

	if (offset === '0' && match.preferEmptyZoneAtZeroOffset === true)
	{
		return timezones.find((zone) => zone.value === '')
			?? timezones.find((zone) => String(zone.offset) === offset);
	}

	return timezones.find((zone) => String(zone.offset) === offset);
}

/**
 * The zone select standing next to a date control. Answers `null` when there is nothing to
 * choose from - a field with no zones renders no select at all.
 */
export function buildTimezoneSelect(params: TimezoneSelectParams): HTMLElement | null
{
	if (params.timezones.length === 0)
	{
		return null;
	}

	const select: HTMLElement = Tag.render`
		<select
			class="bizproc-type-control-date-lc"
			name="${Text.encode(`tz_${params.name}`)}"
			aria-label="${Text.encode(params.ariaLabel)}"
			data-testid="${Text.encode(params.testId)}"
		></select>
	`;

	if (params.disabled)
	{
		Dom.attr(select, 'disabled', 'disabled');
	}

	params.timezones.forEach((zone) => {
		const option: HTMLElement = Tag.render`
			<option value="${Text.encode(String(zone.value))}">${Text.encode(String(zone.text))}</option>
		`;

		if (zone === params.selected)
		{
			Dom.attr(option, 'selected', 'selected');
		}

		Dom.append(option, select);
	});

	return select;
}
