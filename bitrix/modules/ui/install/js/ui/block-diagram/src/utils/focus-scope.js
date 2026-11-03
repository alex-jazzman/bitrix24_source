/**
 * Whether the focus stands on one of the surfaces the diagram answers the keyboard on. The surfaces
 * are named by the caller and not taken from the root alone: a consumer places the minimap and the
 * zoom bar by hand and normally lands them outside the root, while both promise the keys of the
 * diagram work there.
 */
export function isFocusOnAnyOf(surfaces: Array<HTMLElement | null>): boolean
{
	const activeElement = document.activeElement;

	return surfaces.some((surface) => Boolean(surface) && surface.contains(activeElement));
}
