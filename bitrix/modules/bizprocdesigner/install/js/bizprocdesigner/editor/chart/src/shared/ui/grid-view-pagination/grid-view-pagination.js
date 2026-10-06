import 'ui.system.input';

import { useLoc } from '../../composables';

import './grid-view-pagination.css';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20];

let pageSizeControlUid = 0;

// @vue/component
export const GridViewPagination = {
	name: 'GridViewPagination',
	props:
	{
		page:
		{
			type: Number,
			required: true,
		},
		pageSize:
		{
			type: Number,
			required: true,
		},
		totalRowsCount:
		{
			type: Number,
			required: true,
		},
		pageSizeOptions:
		{
			type: Array,
			default: (): Array<number> => DEFAULT_PAGE_SIZE_OPTIONS,
		},
		testId:
		{
			type: String,
			default: null,
		},
	},
	emits: ['change-page', 'change-page-size'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): { pageSizeInputId: string }
	{
		return {
			pageSizeInputId: `bp-grid-view-page-size-${pageSizeControlUid += 1}`,
		};
	},
	computed:
	{
		lastPageNumber(): number
		{
			return Math.ceil(this.totalRowsCount / this.pageSize) || 1;
		},
		isFirstPage(): boolean
		{
			return this.page === 1;
		},
		isLastPage(): boolean
		{
			return this.page >= this.lastPageNumber;
		},
	},
	methods:
	{
		subTestId(suffix: string): ?string
		{
			return this.testId === null ? null : `${this.testId}-${suffix}`;
		},
		onMovePrevPage(): void
		{
			if (!this.isFirstPage)
			{
				this.$emit('change-page', this.page - 1);
			}
		},
		onMoveNextPage(): void
		{
			if (!this.isLastPage)
			{
				this.$emit('change-page', this.page + 1);
			}
		},
		onMoveLastPage(): void
		{
			if (!this.isLastPage)
			{
				this.$emit('change-page', this.lastPageNumber);
			}
		},
		onChangePageSize(event: Event): void
		{
			this.$emit('change-page-size', Number(event.target.value));
		},
	},
	template: `
		<div class="editor-chart-inspector-grid-view-pagination" :data-test-id="testId">
			<div class="editor-chart-inspector-grid-view-pagination__navigation">
				<span
					class="editor-chart-inspector-grid-view-pagination__navigation_current-page"
					:data-test-id="subTestId('current')"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_CURRENT_PAGE') }}
					<span class="editor-chart-inspector-grid-view-pagination__navigation_page-num">
						{{ page }}
					</span>
				</span>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<button
					type="button"
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:disabled="isFirstPage"
					:data-test-id="subTestId('prev')"
					@click="onMovePrevPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_PREV_PAGE') }}
				</button>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<button
					type="button"
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:disabled="isLastPage"
					:data-test-id="subTestId('next')"
					@click="onMoveNextPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_NEXT_PAGE') }}
				</button>
				<div class="editor-chart-inspector-grid-view-pagination__navigation_delimeter"></div>
				<button
					type="button"
					class="editor-chart-inspector-grid-view-pagination__navigation_move-btn"
					:disabled="isLastPage"
					:data-test-id="subTestId('last')"
					@click="onMoveLastPage"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_LAST_PAGE') }}
				</button>
			</div>
			<div class="editor-chart-inspector-grid-view-pagination__rows-count">
				<label
					class="editor-chart-inspector-grid-view-pagination__rows-count_label"
					:for="pageSizeInputId"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_GRID_VIEW_PAGINATION_ROWS_COUNT') }}
				</label>
				<div
					class="editor-chart-inspector-grid-view-pagination__rows-count_dropdown ui-system-input-container"
				>
					<select
						:id="pageSizeInputId"
						class="editor-chart-inspector-grid-view-pagination__rows-count_select ui-system-input-value"
						:value="pageSize"
						:data-test-id="subTestId('size')"
						@change="onChangePageSize"
					>
						<option
							v-for="count in pageSizeOptions"
							:key="count"
							:value="count"
						>
							{{ count }}
						</option>
					</select>
					<div class="ui-icon-set --chevron-down-l ui-system-input-dropdown" aria-hidden="true"></div>
				</div>
			</div>
		</div>
	`,
};
