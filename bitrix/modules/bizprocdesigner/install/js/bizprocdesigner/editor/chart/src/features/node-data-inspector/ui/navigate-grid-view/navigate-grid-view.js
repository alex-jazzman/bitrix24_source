import { mapActions, mapState } from 'ui.vue3.pinia';

import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { GridViewPagination } from '../../../../shared/ui';

const ROWS_COUNT_LIST = [10, 20];

/**
 * Store adapter over the shared {@see GridViewPagination}: binds the inspector grid's page and
 * page size from the node-data-inspector store.
 */
// @vue/component
export const NavigateGridView = {
	name: 'NavigateGridView',
	components: { GridViewPagination },
	props:
	{
		totalRowsCount:
		{
			type: Number,
			required: true,
		},
	},
	data(): { rowsCountList: Array<number> }
	{
		return {
			rowsCountList: ROWS_COUNT_LIST,
		};
	},
	computed:
	{
		...mapState(useNodeDataInspectorStore, ['countRowsOnPage', 'currentPageNumber']),
	},
	methods:
	{
		...mapActions(useNodeDataInspectorStore, ['setCountRowsOnPage', 'setCurrentPageNumber']),
		onChangePageSize(count: number): void
		{
			this.setCountRowsOnPage(count);
			this.setCurrentPageNumber(1);
		},
	},
	template: `
		<GridViewPagination
			test-id="nodeDataInspectorPager"
			:page="currentPageNumber"
			:page-size="countRowsOnPage"
			:total-rows-count="totalRowsCount"
			:page-size-options="rowsCountList"
			@change-page="setCurrentPageNumber"
			@change-page-size="onChangePageSize"
		/>
	`,
};
