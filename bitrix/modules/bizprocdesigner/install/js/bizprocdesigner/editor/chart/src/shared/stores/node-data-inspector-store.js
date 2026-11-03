import { defineStore } from 'ui.vue3.pinia';
import { Type } from 'main.core';
import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import {
	editorAPI,
	type NodeFilterFoundItems,
	type NodeFilterItemValues,
	type ValueRecord,
} from '../api';
import { type Block } from '../types';

import { type SelectedGridViewGroup } from '../../entities/node-data-inspector';

// The snapshot record and the on-demand record are one shape (DTO-01); the name stays for the
// panel surfaces that already read it.
export type LastRunValue = ValueRecord;

export type FoundItemValuesView = {
	values: NodeFilterItemValues | null,
	loading: boolean,
	errorCode: string | null,
};

type NodeDataInspectorStoreState = {
	block: Block | null,
	countRowsOnPage: number,
	currentPageNumber: number,
	selectedGridViewGroup: SelectedGridViewGroup | null,
	lastValues: { [expression: string]: LastRunValue },
	lastValuesLoading: boolean,
	lastValuesGeneration: number,
	foundItems: { [expression: string]: NodeFilterFoundItems },
	foundItemsLoading: { [expression: string]: boolean },
	foundItemsErrors: { [expression: string]: string | null },
	selectedFoundItemIds: { [expression: string]: string },
	foundItemsGeneration: number,
	foundItemsRequestGenerations: { [expression: string]: number },
	foundItemValuesCache: { [cacheKey: string]: NodeFilterItemValues },
	foundItemValuesLoading: { [cacheKey: string]: boolean },
	foundItemValuesErrors: { [cacheKey: string]: string | null },
	foundItemValuesRequestGenerations: { [cacheKey: string]: number },
}

// The early exit reads the error maps by value, so a refusal without a code must not look like
// "nothing went wrong".
const UNKNOWN_REFUSAL_CODE = 'UNKNOWN';

const isLastRunValuesRequestAllowed = (templateId: number): boolean => {
	if (!Type.isNumber(templateId) || templateId <= 0)
	{
		return false;
	}

	return Feature.instance().isAvailable(FeatureCode.lastRunValues);
};

// A node may hold several filters, so values are kept apart by expression and item ordinal.
const getFoundItemValuesCacheKey = (expression: string, itemId: string): string => `${expression}|${itemId}`;

export const useNodeDataInspectorStore = defineStore('bizprocdesigner-node-data-inspector-store', {
	state: (): NodeDataInspectorStoreState => ({
		block: null,
		countRowsOnPage: 10,
		currentPageNumber: 1,
		selectedGridViewGroup: null,
		activityData: null,
		lastValues: {},
		lastValuesLoading: false,
		lastValuesGeneration: 0,
		foundItems: {},
		foundItemsLoading: {},
		foundItemsErrors: {},
		selectedFoundItemIds: {},
		foundItemsGeneration: 0,
		foundItemsRequestGenerations: {},
		foundItemValuesCache: {},
		foundItemValuesLoading: {},
		foundItemValuesErrors: {},
		foundItemValuesRequestGenerations: {},
	}),
	getters: {
		foundItemValues: (
			state: NodeDataInspectorStoreState,
		): ((expression: string, itemId: string) => FoundItemValuesView) => {
			return (expression: string, itemId: string): FoundItemValuesView => {
				const cacheKey = getFoundItemValuesCacheKey(expression, itemId);

				return {
					values: state.foundItemValuesCache[cacheKey] ?? null,
					loading: state.foundItemValuesLoading[cacheKey] === true,
					errorCode: state.foundItemValuesErrors[cacheKey] ?? null,
				};
			};
		},
	},
	actions: {
		setBlock(block: Block): void
		{
			this.block = block;
			this.activityData = null;
			// The panel is not unmounted on a switch of the node, so nothing else would drop them.
			this.resetFoundItems();
		},
		setActivityData(activityData): void
		{
			this.activityData = activityData;
		},
		setCountRowsOnPage(count: number): void
		{
			this.countRowsOnPage = count;
		},
		setCurrentPageNumber(pageNumber: number): void
		{
			this.currentPageNumber = pageNumber;
		},
		resetPagination(): void
		{
			this.countRowsOnPage = 10;
			this.currentPageNumber = 1;
		},
		resetGridView(): void
		{
			this.selectedGridViewGroup = null;
			this.resetPagination();
		},
		selectGridViewGroup(group: NodeDataInspectorStoreState['selectedGridViewGroup']): void
		{
			this.selectedGridViewGroup = group;
			this.resetPagination();
		},
		async loadLastValues(templateId: number): Promise<void>
		{
			if (!isLastRunValuesRequestAllowed(templateId))
			{
				return;
			}

			// every open of the panel owns its own generation: the values of the previous
			// open are dropped right away and the freshest request wins
			this.lastValuesGeneration += 1;
			const generation = this.lastValuesGeneration;

			this.lastValues = {};
			this.lastValuesLoading = true;
			try
			{
				const values = await editorAPI.getLastRunValues({ templateId });

				// a newer request or a reset while this one was in flight turns the answer
				// into a snapshot nobody waits for anymore, so it is dropped
				if (generation === this.lastValuesGeneration)
				{
					this.lastValues = values;
				}
			}
			finally
			{
				if (generation === this.lastValuesGeneration)
				{
					this.lastValuesLoading = false;
				}
			}
		},
		// A loaded list, a refused one and a request in flight are all answers: the list is read anew
		// only after a reset.
		async loadFoundItems(templateId: number, expression: string): Promise<void>
		{
			if (!isLastRunValuesRequestAllowed(templateId) || !Type.isStringFilled(expression))
			{
				return;
			}

			if (
				this.foundItems[expression]
				|| this.foundItemsErrors[expression]
				|| this.foundItemsLoading[expression]
			)
			{
				return;
			}

			// An item is addressed by its ordinal in the list being replaced, so a fresh list
			// invalidates the values requests of this expression - and only of it.
			this.foundItemsGeneration += 1;
			this.invalidateFoundItemValues(expression);
			const generation = this.foundItemsGeneration;
			// Kept per expression: the list of one filter must not invalidate the answer of another.
			this.foundItemsRequestGenerations[expression] = generation;

			this.foundItemsLoading[expression] = true;
			try
			{
				const response = await editorAPI.getNodeFilterFoundItems({ templateId, expression });

				if (this.foundItemsRequestGenerations[expression] === generation)
				{
					this.foundItems[expression] = response;
					this.foundItemsErrors[expression] = null;
					this.selectedFoundItemIds[expression] = response.items[0]?.id ?? '';
				}
			}
			catch (error)
			{
				if (this.foundItemsRequestGenerations[expression] === generation)
				{
					this.foundItemsErrors[expression] = error?.code ?? UNKNOWN_REFUSAL_CODE;
				}
			}
			finally
			{
				if (this.foundItemsRequestGenerations[expression] === generation)
				{
					this.foundItemsLoading[expression] = false;
				}
			}
		},
		selectFoundItem(expression: string, itemId: string): void
		{
			const items = this.foundItems[expression]?.items ?? [];
			if (!items.some((item) => item.id === itemId))
			{
				return;
			}

			this.selectedFoundItemIds[expression] = itemId;
		},
		// Values are kept until a reset. Without the refusal in the early exit, coming back to an item
		// whose request failed would repeat it on its own.
		async loadFoundItemValues(
			templateId: number,
			expression: string,
			itemId: string,
			fields: Array<string>,
		): Promise<void>
		{
			if (
				!isLastRunValuesRequestAllowed(templateId)
				|| !Type.isStringFilled(expression)
				|| !Type.isStringFilled(itemId)
			)
			{
				return;
			}

			const cacheKey = getFoundItemValuesCacheKey(expression, itemId);
			if (this.foundItemValuesCache[cacheKey] || this.foundItemValuesErrors[cacheKey])
			{
				return;
			}

			// Kept per item, like the generations of the lists: filters of one node request their
			// values at the same time, and one counter for all of them would let the last request
			// throw away the answers of the others - silently, with no data and no error to retry.
			const generation = (this.foundItemValuesRequestGenerations[cacheKey] ?? 0) + 1;
			this.foundItemValuesRequestGenerations[cacheKey] = generation;

			this.foundItemValuesLoading[cacheKey] = true;
			try
			{
				const values = await editorAPI.getNodeFilterItemValues({
					templateId,
					expression,
					itemId,
					fields,
				});

				if (this.foundItemValuesRequestGenerations[cacheKey] === generation)
				{
					this.foundItemValuesCache[cacheKey] = values;
					this.foundItemValuesErrors[cacheKey] = null;
				}
			}
			catch (error)
			{
				if (this.foundItemValuesRequestGenerations[cacheKey] === generation)
				{
					this.foundItemValuesErrors[cacheKey] = error?.code ?? UNKNOWN_REFUSAL_CODE;
				}
			}
			finally
			{
				// Only the request whose generation is still current lowers the indicator. A request
				// aged by a reset can finish after the one made for the same key right after it, and
				// would take down an indicator belonging to a request still in flight. The aged ones
				// are put out by whoever aged them.
				if (this.foundItemValuesRequestGenerations[cacheKey] === generation)
				{
					this.foundItemValuesLoading[cacheKey] = false;
				}
			}
		},
		// The one way back to a list that was refused, and only by an action of the user: the early exit
		// of loadFoundItems() treats a refusal as an answer.
		retryFoundItems(templateId: number, expression: string): Promise<void>
		{
			this.foundItemsErrors[expression] = null;

			return this.loadFoundItems(templateId, expression);
		},
		// The one way back to an item whose values were refused, and only by an action of the user.
		retryFoundItemValues(
			templateId: number,
			expression: string,
			itemId: string,
			fields: Array<string>,
		): Promise<void>
		{
			this.foundItemValuesErrors[getFoundItemValuesCacheKey(expression, itemId)] = null;

			return this.loadFoundItemValues(templateId, expression, itemId, fields);
		},
		/**
		 * Ages the values requests in flight of one expression, or of all of them when it is null.
		 * The counters are never reset: only a number that keeps growing tells a late answer from
		 * the answer to a request made after the same key was invalidated. Ageing a request also
		 * puts out its indicator: the answer to it is not going to be written, so nothing else
		 * would ever lower it.
		 */
		invalidateFoundItemValues(expression: string | null): void
		{
			const prefix = expression === null ? null : getFoundItemValuesCacheKey(expression, '');

			Object.keys(this.foundItemValuesRequestGenerations).forEach((cacheKey) => {
				if (prefix === null || cacheKey.startsWith(prefix))
				{
					this.foundItemValuesRequestGenerations[cacheKey] += 1;
					this.foundItemValuesLoading[cacheKey] = false;
				}
			});
		},
		resetFoundItems(): void
		{
			this.foundItemsGeneration += 1;
			this.invalidateFoundItemValues(null);
			this.foundItems = {};
			this.foundItemsLoading = {};
			this.foundItemsErrors = {};
			this.selectedFoundItemIds = {};
			this.foundItemsRequestGenerations = {};
			this.foundItemValuesCache = {};
			this.foundItemValuesLoading = {};
			this.foundItemValuesErrors = {};
		},
		resetLastValues(): void
		{
			this.lastValuesGeneration += 1;
			this.lastValues = {};
			this.lastValuesLoading = false;
			// Found items belong to the snapshot they were read against.
			this.resetFoundItems();
		},
		resetDataInspector(): void
		{
			this.block = null;
			this.activityData = null;
			this.resetGridView();
			this.resetLastValues();
		},
	},
});
