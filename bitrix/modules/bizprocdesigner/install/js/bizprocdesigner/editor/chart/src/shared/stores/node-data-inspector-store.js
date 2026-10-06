import { defineStore } from 'ui.vue3.pinia';
import { Type } from 'main.core';
import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import { editorAPI } from '../api';
import { type Block } from '../types';

import { type SelectedGridViewGroup } from '../../entities/node-data-inspector';

export type LastRunValue = {
	value: string | number | boolean | null | Array<string | number | boolean | null>,
	type: string,
	multiple: boolean,
	truncated: boolean,
	totalCount: number | null,
};

type NodeDataInspectorStoreState = {
	block: Block | null,
	countRowsOnPage: number,
	currentPageNumber: number,
	selectedGridViewGroup: SelectedGridViewGroup | null,
	lastValues: { [expression: string]: LastRunValue },
	lastValuesLoading: boolean,
	lastValuesGeneration: number,
}

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
	}),
	actions: {
		setBlock(block: Block): void
		{
			this.block = block;
			this.activityData = null;
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
			if (!Type.isNumber(templateId) || templateId <= 0)
			{
				return;
			}

			if (!Feature.instance().isAvailable(FeatureCode.lastRunValues))
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
		resetLastValues(): void
		{
			this.lastValuesGeneration += 1;
			this.lastValues = {};
			this.lastValuesLoading = false;
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
