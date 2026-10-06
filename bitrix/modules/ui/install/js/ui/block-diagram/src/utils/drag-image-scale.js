// Chrome on Windows hands the custom drag image to the OS as a bitmap and degrades it into a blurred
// blob once its longer side grows too large; the blur depends on the longer side only, not on the area.
// DRAG_IMAGE_SIDE_LIMIT is not a measured-safe side (260 already blurred in the tests): it only marks
// where previews that already worked are left untouched, so scaling applies to clearly oversized nodes only.
// DRAG_IMAGE_TARGET_SIDE is the side measured as still sharp; a preview above the limit is zoomed down
// so its longer side becomes the target.
export const DRAG_IMAGE_SIDE_LIMIT = 260;
export const DRAG_IMAGE_TARGET_SIDE = 240;

export function resolveDragImageScale(width: number, height: number): number
{
	const maxSide = Math.max(width, height);

	if (!Number.isFinite(maxSide) || maxSide <= DRAG_IMAGE_SIDE_LIMIT)
	{
		return 1;
	}

	return DRAG_IMAGE_TARGET_SIDE / maxSide;
}
