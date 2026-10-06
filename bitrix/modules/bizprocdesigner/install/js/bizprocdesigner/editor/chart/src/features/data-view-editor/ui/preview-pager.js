import { GridViewPagination } from '../../../shared/ui';

/** Page size choices offered under the preview table (server caps the preview at 50 rows). */
const PAGE_SIZE_OPTIONS = [10, 20, 50];

/**
 * Pagination under the preview table: the shared {@see GridViewPagination} (the data inspector's
 * grid pagination) bound to the form's preview paging state. Events are ignored while the preview
 * request is in flight.
 */
// @vue/component
export const PreviewPager = {
	name: 'BizprocDataViewPreviewPager',
	components: { GridViewPagination },
	props: {
		page: {
			type: Number,
			default: 1,
		},
		pageSize: {
			type: Number,
			default: 20,
		},
		totalRows: {
			type: Number,
			default: 0,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:page', 'update:pageSize'],
	data(): Object
	{
		return {
			pageSizeOptions: PAGE_SIZE_OPTIONS,
		};
	},
	methods: {
		onChangePage(page: number): void
		{
			if (!this.isLoading)
			{
				this.$emit('update:page', page);
			}
		},
		onChangePageSize(size: number): void
		{
			if (!this.isLoading)
			{
				this.$emit('update:pageSize', Number(size));
			}
		},
	},
	template: `
		<GridViewPagination
			test-id="bizproc-dataview__pager"
			:page="page"
			:page-size="pageSize"
			:total-rows-count="totalRows"
			:page-size-options="pageSizeOptions"
			@change-page="onChangePage"
			@change-page-size="onChangePageSize"
		/>
	`,
};
