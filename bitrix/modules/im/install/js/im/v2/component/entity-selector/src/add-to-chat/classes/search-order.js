import { type Item, type ItemNode } from 'ui.entity-selector';

import { Core } from 'im.v2.application.core';
import { isPersonEntity } from 'im.v2.lib.entity-selector-config';

// The place a row took in the answer it came with. The tab appends its results in the order its own
// relevance put them (SearchTab.appendResults), and OrderedArray weighs the row being inserted
// against the rows already standing, always as the second argument - so stamping both sides of a
// comparison records exactly that order. A comparator answering 0 would not keep it: an equal node
// is inserted in front of the one already there, and the list would turn itself over row by row.
const arrivalOrder: WeakMap<Item, number> = new WeakMap();
let lastArrival = 0;

const rememberArrival = (item: Item): number => {
	if (!arrivalOrder.has(item))
	{
		lastArrival += 1;
		arrivalOrder.set(item, lastArrival);
	}

	return arrivalOrder.get(item);
};

const compareByArrival = (itemA: Item, itemB: Item): number => {
	return rememberArrival(itemA) - rememberArrival(itemB);
};

// SORT-02: the search tab is one flat list, and people stand in it in the order the invitation window
// has always stood them (im.v2.lib.search, sortByDate): the person talked to later first, anyone
// talked to at all above someone the messenger has never seen, the portal above the extranet, and
// everything the rule leaves equal in the order the answer brought it. A bot is one of the people
// here, the way it was in the old window. The org structure is new to this list and goes below the
// people, in the relevance the search put on it.
export const compareSearchNodes = (nodeA: ItemNode, nodeB: ItemNode): number => {
	const itemA: Item = nodeA.getItem();
	const itemB: Item = nodeB.getItem();

	rememberArrival(itemA);
	rememberArrival(itemB);

	const isPersonA = isPersonEntity(itemA.getEntityId());
	const isPersonB = isPersonEntity(itemB.getEntityId());

	if (isPersonA !== isPersonB)
	{
		return isPersonA ? -1 : 1;
	}

	return isPersonA ? comparePeopleItems(itemA, itemB) : compareStructureItems(itemA, itemB);
};

const comparePeopleItems = (itemA: Item, itemB: Item): number => {
	const timeA = getLastMessageTime(itemA);
	const timeB = getLastMessageTime(itemB);

	if (timeA !== null && timeB !== null && timeA !== timeB)
	{
		return timeB - timeA;
	}

	if (timeA === null && timeB !== null)
	{
		return 1;
	}

	if (timeA !== null && timeB === null)
	{
		return -1;
	}

	if (timeA === null && timeB === null)
	{
		const isExtranetA = isExtranetPerson(String(itemA.getId()));
		const isExtranetB = isExtranetPerson(String(itemB.getId()));
		if (isExtranetA !== isExtranetB)
		{
			return isExtranetA ? 1 : -1;
		}
	}

	return compareByArrival(itemA, itemB);
};

// The date the search list is ordered by: the last message of the conversation, the same one the old
// window read (im.v2.lib.search, getRecentItemDate). The answer carries it where the provider of the
// recent list sends it; a row of any other provider is asked of the messenger store.
const getLastMessageTime = (item: Item): number | null => {
	const dateFromAnswer = item.getCustomData().get('dateMessage');
	if (dateFromAnswer)
	{
		const time = new Date(dateFromAnswer).getTime();

		return Number.isNaN(time) ? null : time;
	}

	const message = Core.getStore().getters['recent/getMessage'](String(item.getId()));

	return message?.date ? message.date.getTime() : null;
};

// All the item itself holds of the cascade the search tab sorts the org structure by (search-tab,
// appendResults): the context sort first, then the global one, a value ahead of nothing, the larger
// one above. What neither of them tells apart keeps the order of the answer.
const compareStructureItems = (itemA: Item, itemB: Item): number => {
	const byContextSort = compareSortValues(itemA.getContextSort(), itemB.getContextSort());
	if (byContextSort !== 0)
	{
		return byContextSort;
	}

	const byGlobalSort = compareSortValues(itemA.getGlobalSort(), itemB.getGlobalSort());
	if (byGlobalSort !== 0)
	{
		return byGlobalSort;
	}

	return compareByArrival(itemA, itemB);
};

const compareSortValues = (sortA: number | null, sortB: number | null): number => {
	if (sortA === null && sortB === null)
	{
		return 0;
	}

	if (sortA === null || sortB === null)
	{
		return sortA === null ? 1 : -1;
	}

	return sortB - sortA;
};

const isExtranetPerson = (dialogId: string): boolean => {
	return Core.getStore().getters['users/isExtranet'](dialogId);
};
