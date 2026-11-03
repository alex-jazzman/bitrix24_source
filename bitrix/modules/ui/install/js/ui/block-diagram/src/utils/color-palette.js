import { Type } from 'main.core';

// A palette is a plain dictionary of CSS colors keyed by a name or an index from a saved template,
// so anything else - a list, an instance, an entry that is not a color - is a mistake of the
// consumer. Shared by the property validators of every component taking a palette, so the map and
// the bar judge a palette by one and the same rule. It only reports: the drawing path keeps its own
// fallbacks, and an empty palette is a valid one.
export function isValidColorPalette(palette: { [string]: string }): boolean
{
	if (!Type.isPlainObject(palette))
	{
		return false;
	}

	return Object.values(palette).every((color: string) => Type.isStringFilled(color));
}
