import { Core } from 'im.v2.application.core';
import { getUsersFromRecentItems } from 'im.v2.lib.search';

// The carousel holds six tiles at most: the notes chat plus up to five interlocutors.
const CAROUSEL_USERS_LIMIT = 5;

/**
 * Composition of the recent chats carousel in the order its tiles are rendered: the notes chat first, then
 * the most recent interlocutors. The only place the chat of the notes tile is worked out - the tile itself
 * and the traversal order both take it from here, so a click and an Enter on that tile cannot part ways.
 */
export function getCarouselItems(): string[]
{
	const notesDialogId = Core.getUserId().toString();
	const userDialogIds = getUsersFromRecentItems({ withFakeUsers: false, userLimit: CAROUSEL_USERS_LIMIT })
		.map(({ dialogId }) => dialogId);

	return [notesDialogId, ...userDialogIds];
}
