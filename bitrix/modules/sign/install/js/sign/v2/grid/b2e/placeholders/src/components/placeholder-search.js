import { LocMixin } from 'sign.v2.b2e.vue-util';

// @vue/component
export const PlaceholderSearch = {
	name: 'PlaceholderSearch',
	mixins: [LocMixin],
	props: {
		searchQuery: {
			type: String,
			default: '',
		},
		isHcmLinkTab: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		searchContainerClass(): string
		{
			return this.isHcmLinkTab
				? 'sign-placeholders-search-hcmlink'
				: 'sign-placeholders-search'
			;
		},
	},
	methods: {
		onInput(event: Event)
		{
			this.$emit('update:searchQuery', event.target.value);
		},
		clearInput()
		{
			this.$emit('update:searchQuery', '');
		},
	},
	template: `
		<div :class="searchContainerClass">
			<input
				type="text"
				class="sign-placeholders-search-input"
				:value="searchQuery"
				@input="onInput"
				:placeholder="loc('PLACEHOLDER_LIST_SEARCH_PLACEHOLDER')"
			/>
			<div v-if="searchQuery" class="sign-placeholders-search-icon-clear" @click="clearInput"></div>
			<div v-else class="sign-placeholders-search-icon-search"></div>
		</div>
	`,
};
