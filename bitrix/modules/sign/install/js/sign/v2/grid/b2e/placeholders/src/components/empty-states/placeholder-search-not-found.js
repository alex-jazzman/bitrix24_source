import { Type } from 'main.core';
import { LocMixin } from 'sign.v2.b2e.vue-util';
import { AirButtonStyle, Button as UiButton, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';

const createFieldDataset = Object.freeze({ testid: 'sign-placeholder-search-create-field' });

/**
 * The query goes into the label of the button as the name of the field to be, and the panel is narrow:
 * a long query is cut so the label keeps its shape. The full query still reaches the editor of the
 * field - the button hands over the query itself, not the label.
 */
const QUERY_LENGTH_LIMIT = 20;
const ELLIPSIS = '\u2026';

// @vue/component
export const PlaceholderSearchNotFound = {
	name: 'PlaceholderSearchNotFound',
	components: {
		UiButton,
	},
	mixins: [LocMixin],
	props: {
		searchQuery: {
			type: String,
			default: '',
		},
		/** The panel creates fields of Bitrix24 alone, so the tab of the external system offers none. */
		canCreateField: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['create-field'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
			createFieldDataset,
		};
	},
	computed: {
		/** The state also meets a tab without a chosen company, and there is no name to offer then. */
		hasQuery(): boolean
		{
			return Type.isStringFilled(this.searchQuery);
		},
		shouldShowCreateField(): boolean
		{
			return this.canCreateField && this.hasQuery;
		},
		createFieldText(): string
		{
			const query = this.searchQuery.length > QUERY_LENGTH_LIMIT
				? this.searchQuery.slice(0, QUERY_LENGTH_LIMIT) + ELLIPSIS
				: this.searchQuery
			;

			return this.loc('PLACEHOLDER_LIST_SEARCH_CREATE_FIELD', { '#QUERY#': query });
		},
	},
	template: `
		<div class="sign-placeholders-nothing-found-container" data-testid="sign-placeholder-search-not-found">
			<div class="sign-placeholders-nothing-found-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_DESCRIPTION') }}
				</div>
			</div>
			<UiButton
				v-if="shouldShowCreateField"
				:text="createFieldText"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN_ACCENT"
				:left-icon="ButtonIcon.ADD_M"
				:dataset="createFieldDataset"
				@click="$emit('create-field', searchQuery)"
			/>
		</div>
	`,
};
