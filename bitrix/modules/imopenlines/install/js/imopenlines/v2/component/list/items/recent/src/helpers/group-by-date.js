import { Core } from 'im.v2.application.core';

import { type ImolModelRecentItem } from 'imopenlines.v2.model';

export type DateGroup = {
	date: Date,
	items: ImolModelRecentItem[],
};

const getMessageDate = (messageId: number): ?Date => {
	const message = Core.getStore().getters['messages/getById'](messageId);

	return message ? message.date : null;
};

const getDayKey = (date: Date): number => {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

export const groupByDate = (recentItems: ImolModelRecentItem[], order: 'asc' | 'desc' = 'desc'): DateGroup[] => {
	const groupsByDay: Map<number, DateGroup> = new Map();

	recentItems.forEach((item) => {
		const messageDate = getMessageDate(item.messageId);
		if (!messageDate)
		{
			return;
		}

		const dayKey = getDayKey(messageDate);

		let group = groupsByDay.get(dayKey);
		if (!group)
		{
			group = { date: messageDate, items: [] };
			groupsByDay.set(dayKey, group);
		}
		else if (messageDate > group.date)
		{
			group.date = messageDate;
		}

		group.items.push(item);
	});

	return [...groupsByDay.values()].sort((a, b) => (order === 'asc' ? a.date - b.date : b.date - a.date));
};
