import { Type } from 'main.core';

import {
	type ActivityData,
	type Block,
} from '../../../../shared/types';
import {
	type TemplateDataProvider,
	type TemplateDataSnapshot,
} from '../../../../shared/utils/template-data-provider';
import { type InspectorViewItemBase } from '../../../../entities/node-data-inspector';

export type PreparedItemsRequestState = {
	version: number,
	isDestroyed: boolean,
};

export function createPreparedItemsRequestState(): PreparedItemsRequestState
{
	return {
		version: 0,
		isDestroyed: false,
	};
}

export function createPreparedItemsRequestVersion(state: PreparedItemsRequestState): number
{
	Object.assign(state, {
		version: state.version + 1,
	});

	return state.version;
}

export function destroyPreparedItemsRequestState(state: PreparedItemsRequestState): void
{
	Object.assign(state, {
		isDestroyed: true,
	});
	createPreparedItemsRequestVersion(state);
}

export async function prepareCurrentItems(
	provider: TemplateDataProvider,
	state: PreparedItemsRequestState,
	requestVersion: number,
	block: Block,
	activityData: ?ActivityData,
): Promise<TemplateDataSnapshot | null>
{
	const preparedItems = await provider.prepare(
		block,
		activityData,
		() => !state.isDestroyed && requestVersion === state.version,
	);
	if (state.isDestroyed || requestVersion !== state.version)
	{
		return null;
	}

	return preparedItems;
}

export function filterWorkflowData(
	data: { groups: Array<InspectorViewItemBase> },
	searchValue: string,
): { groups: Array<InspectorViewItemBase> }
{
	const filteredGroups = (Array.isArray(data?.groups) ? data.groups : [])
		.map((group) => filterGroup(group, searchValue))
		.filter(Boolean)
	;

	return {
		...data,
		groups: filteredGroups,
	};
}

function filterGroup(group: InspectorViewItemBase, searchValue: string): InspectorViewItemBase | null
{
	const filteredItems = filterItems(group?.items, searchValue);

	if (filteredItems.length === 0)
	{
		return null;
	}

	return {
		...group,
		items: filteredItems,
	};
}

function filterItems(items: ?Array<InspectorViewItemBase>, searchValue: string): Array<InspectorViewItemBase>
{
	const normalizedItems = Array.isArray(items) ? items : [];

	return normalizedItems
		.map((item) => {
			const itemText = Type.isStringFilled(item?.text) ? item.text.toLowerCase() : '';
			const isTextMatch = itemText.includes(searchValue);

			if (isTextMatch)
			{
				return item;
			}

			const childItems = filterItems(item?.items, searchValue);

			if (childItems.length > 0)
			{
				return {
					...item,
					items: childItems,
				};
			}

			return null;
		})
		.filter(Boolean)
	;
}
