import { EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';

import { GridEvent, Phrase } from '../../const';
import { FavoriteApi } from '../../infrastructure/service/favorite/favorite';
import { loc } from '../../lib/loc/loc';

/**
 * The registry arrives as an argument rather than being resolved here: two grids share the screen
 * and the one that started last owns the global resolution, so a scenario that asked for it by
 * itself would move the star of a message onto the drafts.
 */
type FavoriteRegistry = {
	setFavorite(rowId: string, isFavorite: boolean): void,
};

/**
 * The star answers the click before the server does and takes the answer back when the server
 * refuses. Either way the outcome is said out loud: the star carries no text of its own.
 */
export async function toggleFavorite(
	registry: FavoriteRegistry,
	rowId: string,
	isFavorite: boolean,
): Promise<void>
{
	const target = !isFavorite;

	registry.setFavorite(rowId, target);
	LiveAnnouncer.announce(loc(target ? Phrase.FavoriteAdded : Phrase.FavoriteRemoved));

	try
	{
		await FavoriteApi.setState(rowId, target);
		// said once the state is stored and never before: the number beside "favorites" in the left menu
		// is counted on this word alone (`list.es6.js:1301`), and a state the server refused is no state
		EventEmitter.emit(GridEvent.FavoritesChanged, { id: rowId, isFavorite: target });
	}
	catch
	{
		registry.setFavorite(rowId, isFavorite);
		LiveAnnouncer.announce(loc(Phrase.FavoriteError));
	}
}
