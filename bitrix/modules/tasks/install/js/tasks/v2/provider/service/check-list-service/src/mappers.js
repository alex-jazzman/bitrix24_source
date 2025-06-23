import type { CheckListModel } from 'tasks.v2.model.check-list';
import { UserTypes } from 'tasks.v2.model.users';
import { CheckListSliderData } from './types';

export function prepareCheckLists(checklist: CheckListModel[]): CheckListModel[]
{
	const parentNodeIdMap = new Map();
	checklist.forEach((item: CheckListModel) => {
		parentNodeIdMap.set(item.id, item.nodeId);
	});

	return checklist.map((item: CheckListModel) => {
		const title = prepareTitle(item);
		const parentNodeId = item.parentId ? parentNodeIdMap.get(item.parentId) : 0;

		return { ...item, title, parentNodeId };
	});
}

export function mapModelToSliderData(checkLists: CheckListModel[]): CheckListSliderData[]
{
	return Object.fromEntries(
		checkLists.map((item) => {
			const accomplices = item.accomplices?.map((accomplice) => ({
				ID: accomplice.id,
				TYPE: 'A',
				NAME: accomplice.name,
				IMAGE: accomplice.image,
				IS_COLLABER: accomplice.type === UserTypes.Collaber ? 1 : '',
			}));

			const auditors = item.auditors?.map((auditor) => ({
				ID: auditor.id,
				TYPE: 'U',
				NAME: auditor.name,
				IMAGE: auditor.image,
				IS_COLLABER: auditor.type === UserTypes.Collaber ? 1 : '',
			}));

			const attachments = Object.fromEntries(item.attachments?.map((key) => [key, key]));
			const members = [...accomplices, ...auditors].reduce((acc, curr) => {
				acc[curr.ID] = curr;

				return acc;
			}, {});

			const title = prepareTitle(item);

			const node = Object.fromEntries(
				Object.entries({
					NODE_ID: item.nodeId,
					TITLE: title,
					CREATED_BY: item.creator?.id,
					TOGGLED_BY: item.toggledBy?.id,
					TOGGLED_DATE: item.toggledDate,
					MEMBERS: members,
					NEW_FILE_IDS: attachments,
					ATTACHMENTS: attachments,
					IS_COMPLETE: item.isComplete,
					IS_IMPORTANT: item.isImportant,
					PARENT_ID: item.parentId,
					SORT_INDEX: item.sortIndex,
					ACTIONS: {
						MODIFY: item.actions.modify,
						REMOVE: item.actions.remove,
						TOGGLE: item.actions.toggle,
					},
				}).filter(([, value]) => value !== null && value !== undefined),
			);

			return [item.nodeId, node];
		}),
	);
}

export function prepareTitle(item: CheckListModel): string
{
	const names = [
		...(item.accomplices ?? []).map((member) => member.name),
		...(item.auditors ?? []).map((member) => member.name),
	].join(' ');

	if (names)
	{
		return `${item.title} ${names}`;
	}

	return item.title;
}
