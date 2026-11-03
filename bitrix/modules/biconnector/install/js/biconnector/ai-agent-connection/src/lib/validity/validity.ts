import { Type } from 'main.core';
import { DateTimeFormat, Timezone } from 'main.date';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * A date of the contract as a person reads it. The string arrives in the ATOM format with the offset of the
 * server, and the platform formatter parses no such string, so the parsing is the standard means of the
 * language. The moment it gives is then shifted into the timezone of the portal user - the one every other
 * date of the product is read in, and not the one of the browser - and printed by the platform format of
 * the culture, with no template of ours. An empty or unparsable value gives nothing to show.
 */
export const formatValidity = (value: string | null): string | null => {
	if (!Type.isStringFilled(value))
	{
		return null;
	}

	const milliseconds = Date.parse(value);
	if (Number.isNaN(milliseconds))
	{
		return null;
	}

	const userDate = Timezone.UserTime.getDate(Math.floor(milliseconds / MILLISECONDS_PER_SECOND));

	return DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATETIME'), userDate);
};
