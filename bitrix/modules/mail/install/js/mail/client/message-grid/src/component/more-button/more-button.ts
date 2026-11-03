import { defineComponent, inject } from 'ui.vue3';

import { gridPagingKey, Phrase, TestId } from '../../const';
import { loc } from '../../lib/loc/loc';
import { useGridStore } from '../../model/grid/grid';

/**
 * The foot of the list: the button that adds the next page, and the word about a page that did not
 * come back or about the letters the list has no room left for.
 *
 * The class name of the button is a contract: the slider of a message clicks this very selector in
 * the window of the list when the reader walks close to the end of what is loaded.
 *
 * The button holds both of its words at once and shows one, the way the template of the platform
 * grid holds them; the third span is the turning ring. The word stands outside the button, since a
 * list with no next page keeps no button but still has something to say.
 */
// @vue/component
export const MoreButton = defineComponent({
	name: 'MailMessageGridMoreButton',

	setup()
	{
		return {
			grid: useGridStore(),
			paging: inject(gridPagingKey),
			testId: TestId.MoreButton,
			errorTestId: TestId.PageError,
		};
	},

	computed: {
		moreText(): string
		{
			return loc(Phrase.More);
		},

		loadingText(): string
		{
			return loc(Phrase.MoreLoading);
		},

		/**
		 * Neither the plan holding the mailbox nor the end of what the list answers for is something
		 * another try gets past, so each names what stands in the way instead of offering one. The end of
		 * the list is read first: it is the one that is no failure at all.
		 */
		noteText(): string
		{
			if (this.grid.pageLimitReached)
			{
				return loc(Phrase.PageLimit);
			}

			return loc(this.grid.pageSyncBlocked ? Phrase.TariffTextFirst : Phrase.PageError);
		},
	},

	methods: {
		handleClick(): void
		{
			void this.paging?.loadNextPage();
		},
	},

	template: `
		<div v-if="grid.footDrawn" class="main-grid-more">
			<div v-if="grid.pageNoteDrawn" class="mail-message-grid__page-error" :data-testid="errorTestId">
				{{ noteText }}
			</div>
			<button
				v-if="grid.nextPageOffered"
				type="button"
				class="main-grid-more-btn"
				:class="{ load: grid.loadingPage }"
				:data-testid="testId"
				:disabled="grid.loadingPage"
				@click="handleClick"
			><span class="main-grid-more-text">{{ moreText }}</span><span
				class="main-grid-more-load-text"
			>{{ loadingText }}</span><span class="main-grid-more-icon"></span></button>
		</div>
	`,
});
