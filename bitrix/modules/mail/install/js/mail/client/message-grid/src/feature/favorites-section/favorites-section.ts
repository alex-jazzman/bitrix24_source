import { LiveAnnouncer } from 'ui.a11y';

import { FAVORITES_SECTION, isFavoritesSectionUrl } from 'mail.favorites-filter-state';

import { GridMode, type GridModeValue, type GridScreen, Phrase } from '../../const';
import { loc, locPlural } from '../../lib/loc/loc';
import { isListImprovementsEnabled } from '../../lib/screen-flags/screen-flags';
import { type GridRow } from '../../model/grid/types';

/**
 * The registry arrives as an argument: the grid that started last owns the global resolution, so a
 * scenario that asked for one by itself would put the section on the drafts.
 */
type SectionRegistry = {
	mode: GridModeValue,
	screen: GridScreen | null,
	rows: GridRow[],
	setListSection(section: string | null): void,
};

/**
 * The section of the favorites is an address, not a filter: the screen writes `list_section` into
 * the address, the left menu and the shared helper of the filter state read it from there, and the
 * server builds the narrowing off it (`FilterStateReader::applyFavoritesSection`).
 *
 * A grid that draws the drafts stands in no section, and a screen with the improvements of the list
 * off offers no section at all.
 */
export function applySectionFromUrl(registry: SectionRegistry, url: string): void
{
	if (registry.mode !== GridMode.Message || !isListImprovementsEnabled())
	{
		return;
	}

	registry.setListSection(isFavoritesSectionUrl(url) ? FAVORITES_SECTION : null);
}

/**
 * Says how many messages the section holds, or that it holds none: neither the star of a row nor the
 * section carries text a screen reader could go by.
 *
 * The section is read off the registry rather than off the address - the registry is what the page
 * was asked for with.
 */
export function announceFavoritesSection(registry: SectionRegistry): void
{
	if (registry.screen?.listSection !== FAVORITES_SECTION)
	{
		return;
	}

	const count = registry.rows.length;

	LiveAnnouncer.announce(
		count > 0
			? locPlural(Phrase.FavoritesShown, count, { '#COUNT#': String(count) })
			: loc(Phrase.FavoritesEmpty),
	);
}
