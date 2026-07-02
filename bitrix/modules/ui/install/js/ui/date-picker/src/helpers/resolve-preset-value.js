import { Type } from 'main.core';
import type { DatePickerPreset, DatePickerSelectionMode } from '../date-picker-options';
import { createDate } from './create-date';

export function resolvePresetValue(
	preset: DatePickerPreset,
	selectionMode: DatePickerSelectionMode,
	dateFormat: string = null,
): Date[] | null
{
	let raw = null;
	try
	{
		raw = Type.isFunction(preset.value) ? preset.value() : preset.value;
	}
	catch (error)
	{
		console.warn('DatePicker: failed to resolve preset value.', error);

		return null;
	}

	if (selectionMode === 'range')
	{
		const arr = Type.isArray(raw) ? raw.slice(0, 2) : [raw, raw];
		if (arr.length < 2)
		{
			return null;
		}

		let start = createDate(arr[0], dateFormat);
		let end = createDate(arr[1], dateFormat);
		if (start === null || end === null)
		{
			return null;
		}

		if (start > end)
		{
			[start, end] = [end, start];
		}

		return [start, end];
	}

	if (selectionMode === 'multiple')
	{
		const arr = Type.isArray(raw) ? raw : [raw];
		const dates = arr
			.map((value) => createDate(value, dateFormat))
			.filter((value) => value !== null)
		;

		return dates.length === 0 ? null : dates;
	}

	const value = Type.isArray(raw) ? raw[0] : raw;
	const date = createDate(value, dateFormat);

	return date === null ? null : [date];
}
