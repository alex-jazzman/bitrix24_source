import { defineStore } from 'ui.vue3.pinia';

import { type Block } from '../types';

import { type SelectedGridViewGroup } from '../../entities/node-data-inspector';

type NodeDataInspectorStoreState = {
	block: Block | null,
	countRowsOnPage: number,
	currentPageNumber: number,
	selectedGridViewGroup: SelectedGridViewGroup | null,
}

export const useNodeDataInspectorStore = defineStore('bizprocdesigner-node-data-inspector-store', {
	state: (): NodeDataInspectorStoreState => ({
		block: null,
		countRowsOnPage: 10,
		currentPageNumber: 1,
		selectedGridViewGroup: null,
		activityData: null,
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
		resetDataInspector(): void
		{
			this.block = null;
			this.activityData = null;
			this.resetGridView();
		},
	},
});
