import { LocMixin } from 'sign.v2.b2e.vue-util';

/**
 * Search of the panel. It exists only while the search mode is on and takes the place of the header,
 * so it opens focused and hands the exit back to the panel: the cross of the input and Escape both
 * leave the mode instead of merely emptying the query.
 */
// @vue/component
export const PlaceholderSearch = {
	name: 'PlaceholderSearch',
	mixins: [LocMixin],
	props: {
		searchQuery: {
			type: String,
			default: '',
		},
	},
	emits: ['update:searchQuery', 'exit'],
	mounted(): void
	{
		this.$refs.input?.focus();
	},
	methods: {
		onInput(event: Event): void
		{
			this.$emit('update:searchQuery', event.target.value);
		},
		exit(): void
		{
			this.$emit('exit');
		},
	},
	template: `
		<div class="sign-placeholders-search">
			<input
				ref="input"
				type="text"
				class="sign-placeholders-search-input"
				:value="searchQuery"
				:placeholder="loc('PLACEHOLDER_LIST_SEARCH_PLACEHOLDER_MSGVER_1')"
				data-testid="sign-placeholder-search-input"
				@input="onInput"
				@keydown.esc="exit"
			/>
			<div class="sign-placeholders-search-icon-search"></div>
			<div
				class="sign-placeholders-search-icon-clear"
				role="button"
				tabindex="0"
				:aria-label="loc('PLACEHOLDER_LIST_SEARCH_CLOSE')"
				data-testid="sign-placeholder-search-exit"
				@click="exit"
				@keydown.enter="exit"
				@keydown.space.prevent="exit"
			></div>
		</div>
	`,
};
