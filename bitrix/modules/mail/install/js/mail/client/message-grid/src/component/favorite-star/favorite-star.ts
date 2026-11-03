import { defineComponent } from 'ui.vue3';

import { DataRole, Phrase, TestId } from '../../const';
import { toggleFavorite } from '../../feature/toggle-favorite/toggle-favorite';
import { loc } from '../../lib/loc/loc';
import { useGridStore } from '../../model/grid/grid';

/**
 * The star of one row. The registry is resolved through the application the component belongs to,
 * which is the one registry of the right grid - a scenario outside a component has to be given it.
 */
// @vue/component
export const FavoriteStar = defineComponent({
	name: 'MailMessageGridFavoriteStar',

	props: {
		rowId: {
			type: String,
			required: true,
		},
		isFavorite: {
			type: Boolean,
			required: true,
		},
	},

	setup()
	{
		return {
			grid: useGridStore(),
			dataRole: DataRole.Favorite,
			testId: TestId.FavoriteButton,
		};
	},

	computed: {
		/** The star carries no text, so this is the whole of its name for a screen reader. */
		label(): string
		{
			return loc(Phrase.FavoriteLabel);
		},
	},

	methods: {
		/**
		 * The click is left to travel on: above the grid it is what closes the popups that are open,
		 * and the row it lands in opens no message by itself.
		 */
		handleClick(): void
		{
			void toggleFavorite(this.grid, this.rowId, this.isFavorite);
		},
	},

	template: `
		<button
			type="button"
			class="mail-msg-list-favorite"
			:class="{ '--active': isFavorite }"
			:data-role="dataRole"
			:data-testid="testId"
			:data-favorite-id="rowId"
			:aria-pressed="isFavorite ? 'true' : 'false'"
			:aria-label="label"
			@click="handleClick"
			@keydown.space.prevent="handleClick"
		><span class="mail-msg-list-favorite__icon"></span></button>
	`,
});
