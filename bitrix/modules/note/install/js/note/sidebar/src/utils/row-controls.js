// Room a row title leaves before the visible right edge on a hover device: the controls appear
// only under the pointer and the mask under them dissolves the tail of the title, so a plain row
// needs almost nothing - unlike one whose star stays lit without hover.
const RESERVE_HIDDEN = 8;
const RESERVE_ACTIVE_STAR = 32;
// A bell that says something (notifications arrive, or they are muted) stays on screen next to the
// star, so the title has to leave room for both. A bell that only appears on hover gets nothing -
// like every other hover control it may cover the tail of the title (see isNotifyBellPersistent).
const RESERVE_BELL = 24;

/**
 * Where there is no hover the row controls are on screen at all times. They ride with the row
 * instead of hugging the visible edge, so nothing overlaps the title and it keeps its full width.
 */
export function controlsAlwaysVisible(): boolean
{
	return typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches;
}

/**
 * Room the measure pass has to leave between a row title and the visible right edge.
 */
export function rowNameReserve(options: { isFavorite: boolean, hasBell?: boolean }): string
{
	const base = options.isFavorite ? RESERVE_ACTIVE_STAR : RESERVE_HIDDEN;

	return String(options.hasBell === true ? base + RESERVE_BELL : base);
}
