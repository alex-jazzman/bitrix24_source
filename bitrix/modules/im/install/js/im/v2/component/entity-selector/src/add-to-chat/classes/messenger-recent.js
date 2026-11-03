import { type Item, type ItemNode, type ItemOptions } from 'ui.entity-selector';

import { Core } from 'im.v2.application.core';
import { SearchEntityIdTypes, SelectorEntity } from 'im.v2.const';
import { type EntitySelectorConfigOptions } from 'im.v2.lib.entity-selector-config';
import { RecentManager } from 'im.v2.lib.recent';
import { getUsersFromRecentItems } from 'im.v2.lib.search';
import { type ImModelUser } from 'im.v2.model';

// The recent list of the messenger read locally: people, no guests, and no deeper than the page the
// server answers with (RecentProvider::LIMIT), so the prefill stays a preview of that answer. The
// rule repeats the one the recent entity asks the provider for (MESSENGER_RECENT_OPTIONS).
const MESSENGER_RECENT_STORE_FILTER = { withFakeUsers: true, withGuests: false, userLimit: 30 };

const MILLISECONDS_IN_SECOND = 1000;

// The same list the recent entity asks the server for, read from the messenger store instead.
// It puts the tab on screen with the window frame; ui.entityselector.load then refines it, and
// the dialog keeps items by entity and id, so the answer reuses these rows rather than doubling them.
export const getMessengerRecentItems = (options: EntitySelectorConfigOptions = {}): ItemOptions[] => {
	if (options.withRecent !== true)
	{
		return [];
	}

	return getUsersFromRecentItems(MESSENGER_RECENT_STORE_FILTER)
		.map(({ dialogId }) => buildMessengerRecentItem(dialogId))
	;
};

const buildMessengerRecentItem = (dialogId: string): ItemOptions => {
	const user: ImModelUser = Core.getStore().getters['users/get'](dialogId, true);

	return {
		id: dialogId,
		entityId: SelectorEntity.recent,
		entityType: SearchEntityIdTypes.imUser,
		title: user.name,
		avatar: getAvatarUrl(user),
		sort: getMessengerSortSeconds(dialogId),
		customData: { id: user.id },
	};
};

const getAvatarUrl = (user: ImModelUser): string | void => {
	if (user.avatar.length === 0)
	{
		return undefined;
	}

	return decodeURI(user.avatar);
};

// The tab stands in the order of the messenger chat list, so the row and the comparator below read
// the same date the recent collection sorts by: a draft or an activity newer than the last message,
// the start of the day behind a birthday placeholder, the message date otherwise.
const getMessengerSortTime = (dialogId: string): number | null => {
	const sortDate: Date | null | void = RecentManager.getSortDate(dialogId);

	return sortDate ? sortDate.getTime() : null;
};

// The provider puts a unix timestamp in sort (RecentProvider::getBlankItem), so the local row keeps
// the same scale and stays a preview of the answer rather than a value of its own.
const getMessengerSortSeconds = (dialogId: string): number => {
	const sortTime = getMessengerSortTime(dialogId);

	return sortTime === null ? 0 : Math.floor(sortTime / MILLISECONDS_IN_SECOND);
};

// The recent tab of the invitation window is ordered the way the messenger orders its chat list:
// by the same sort date descending, equal dates apart by dialog id (recent model, #compareByDate).
export const compareRecentNodes = (nodeA: ItemNode, nodeB: ItemNode): number => {
	const itemA: Item = nodeA.getItem();
	const itemB: Item = nodeB.getItem();
	const timeA = getNodeSortTime(itemA);
	const timeB = getNodeSortTime(itemB);

	if (timeA === timeB)
	{
		return String(itemA.getId()) > String(itemB.getId()) ? 1 : -1;
	}

	return timeB - timeA;
};

// A row the server sent and the messenger store never saw keeps the order the provider gave it:
// its unix seconds are brought to the scale of the store dates.
const getNodeSortTime = (item: Item): number => {
	const sortTime = getMessengerSortTime(String(item.getId()));
	if (sortTime !== null)
	{
		return sortTime;
	}

	return (item.getSort() ?? 0) * MILLISECONDS_IN_SECOND;
};
