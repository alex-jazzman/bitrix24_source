import { defineStore } from 'ui.vue3.pinia';

import { getErrorCode } from '../../../shared/utils/response';
import {
	fragmentLibraryApi,
	FragmentLibraryErrorCode,
	isSurfaceRefusal,
	type FragmentListItem,
} from '../api/fragment-library-api';

type FragmentLibraryState = {
	items: Array<FragmentListItem>,
	hasMore: boolean,
	isLoading: boolean,
	errorCode: ?string,
	lastFetchId: number,
};

/** How many rows one page of the library holds; the server refuses anything above its own ceiling. */
const PAGE_SIZE = 20;

export const useFragmentLibraryStore = defineStore('bizprocdesigner-editor-fragment-library', {
	state: (): FragmentLibraryState => ({
		items: [],
		hasMore: false,
		isLoading: false,
		errorCode: null,
		lastFetchId: 0,
	}),
	getters:
	{
		isEmpty: (state: FragmentLibraryState): boolean => {
			return !state.isLoading && state.errorCode === null && state.items.length === 0;
		},
		isSurfaceUnavailable: (state: FragmentLibraryState): boolean => {
			return isSurfaceRefusal(state.errorCode);
		},
	},
	actions:
	{
		/**
		 * The list is never kept between openings of the window: other people add and remove fragments,
		 * so what was read the last time is shown to nobody, not even for a frame.
		 */
		async loadFirstPage(): Promise<void>
		{
			this.items = [];
			this.hasMore = false;

			await this.loadPage(0);
		},
		async loadMore(): Promise<void>
		{
			if (this.isLoading || !this.hasMore)
			{
				return;
			}

			await this.loadPage(this.items.length);
		},
		async loadPage(offset: number): Promise<void>
		{
			const fetchId = ++this.lastFetchId;
			this.isLoading = true;
			this.errorCode = null;
			try
			{
				const page = await fragmentLibraryApi.list(PAGE_SIZE, offset);
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.items = offset === 0 ? page.items : [...this.items, ...page.items];
				this.hasMore = page.hasMore;
			}
			catch (error)
			{
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				// The rows already read stay on the screen: a page that did not load leaves the earlier
				// ones usable, and `hasMore` still offers the retry.
				this.errorCode = getErrorCode(error) ?? FragmentLibraryErrorCode.unknown;
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoading = false;
				}
			}
		},
		/**
		 * The row as the server answered with it after a change of its own. The list is the one place the
		 * rows of the library live, so a window showing them never edits a row of its own.
		 */
		applyItem(item: FragmentListItem): void
		{
			const index = this.items.findIndex((row) => row.id === item.id);
			if (index !== -1)
			{
				this.items.splice(index, 1, item);
			}
		},
		removeItem(id: number): void
		{
			this.items = this.items.filter((item) => item.id !== id);
		},
		/**
		 * A refusal about the surface, met by an action of a row. It is not fixable there, so it is told
		 * here: the window says the same about it as a failed reading of the list does.
		 */
		markSurfaceUnavailable(errorCode: string): void
		{
			this.errorCode = errorCode;
		},
	},
});
