import 'ui.system.input';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';
import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';

import './navigate-grid-view.css';

const ROWS_COUNT_LIST = [10, 20];

// @vue/component
export const NavigateGridView = {
	name: 'NavigateGridView',
	components: { BMenu },
	props:
	{
		totalRowsCount:
		{
			type: Number,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed:
	{
		...mapState(useNodeDataInspectorStore, ['countRowsOnPage', 'currentPageNumber']),
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.pageCountDropdown,
				cacheable: false,
				items: ROWS_COUNT_LIST.map((count) => {
					return {
						title: count,
						onClick: () => {
							this.setCountRowsOnPage(count);
							this.setCurrentPageNumber(1);
						},
					};
				}),
			};
		},
		lastPageNumber(): number
		{
			return Math.ceil(this.totalRowsCount / this.countRowsOnPage) || 1;
		},
		isFirstPage(): boolean
		{
			return this.currentPageNumber === 1;
		},
		isLastPage(): boolean
		{
			return this.currentPageNumber === this.lastPageNumber;
		},
	},
	methods:
	{
		...mapActions(useNodeDataInspectorStore, ['setCountRowsOnPage', 'setCurrentPageNumber']),
		onMovePrevPage(): void
		{
			if (!this.isFirstPage)
			{
				this.setCurrentPageNumber(this.currentPageNumber - 1);
			}
		},
		onMoveNextPage(): void
		{
			if (!this.isLastPage)
			{
				this.setCurrentPageNumber(this.currentPageNumber + 1);
			}
		},
		onMoveLastPage(): void
		{
			if (!this.isLastPage)
			{
				this.setCurrentPageNumber(this.lastPageNumber);
			}
		},
	},
	template: `
		<div class="editor-chart-inspector-grid-view-pagination">
			<div class="editor-chart-inspector-grid-view-pagination__navigation">
				<span class="editor-chart-inspector-grid-view-pagination__navigation_current-page">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_CURRENT_PAGE') }}
					<span class="editor-chart-inspector-grid-view-pagination__navigation_page-num">
						{{ currentPageNumber }}
					</span>
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isFirstPage }"
					@click="onMovePrevPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_PREV_PAGE') }}
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isLastPage }"
					@click="onMoveNextPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_NEXT_PAGE') }}
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:class="{ '--inactive': isLastPage }"
					@click="onMoveLastPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_LAST_PAGE') }}
				</span>
			</div>
			<div class="editor-chart-inspector-grid-view-pagination__rows-count">
				<span class="editor-chart-inspector-grid-view-pagination__rows-count_label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_ROWS_COUNT') }}
				</span>
				<div
					class="editor-chart-inspector-grid-view-pagination__rows-count_dropdown ui-system-input-container"
					ref="pageCountDropdown"
					@click="isMenuShown = true"
				>
					<input
						:value="countRowsOnPage"
						class="ui-system-input-value"
						type="text"
						readonly
					/>
					<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown"></div>
				</div>
				<BMenu
					v-if="isMenuShown"
					:options="menuOptions"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`,
};
