import { Type } from 'main.core';
import { type DatePickerPreset } from '../date-picker-options';

export function getPresetSubtitle(
	preset: DatePickerPreset,
	dates: Date[] | null,
	buildAutoSubtitle: (dates: Date[]) => string | null,
): string | null
{
	if (dates === null)
	{
		return null;
	}

	if (preset.subtitle === '')
	{
		return null;
	}

	if (Type.isFunction(preset.subtitle))
	{
		let result = null;
		try
		{
			result = preset.subtitle(dates);
		}
		catch (error)
		{
			console.warn('DatePicker: failed to compute preset subtitle.', error);

			return null;
		}

		return Type.isStringFilled(result) ? result : null;
	}

	if (Type.isString(preset.subtitle))
	{
		return preset.subtitle;
	}

	return buildAutoSubtitle(dates);
}
