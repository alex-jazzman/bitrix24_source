import './search-catalog-items-input.css';
import {
	mapWritableState,
	mapActions,
} from 'ui.vue3.pinia';
import {
	HeaderSearchLayoutSetup,
	TextInput,
	useCatalogStore,
} from '../../../../entities/catalog';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

// @vue/component
export const SearchCatalogItemsInput = {
	name: 'SearchCatalogItemsInput',
	components: {
		TextInput,
		BIcon,
	},
	data() {
		return {
			isFocused: false,
		};
	},
	computed: {
		...mapWritableState(useCatalogStore, [
			'searchText',
			'canSearch',
		]),
		iconColor(): string
		{
			return this.isFocused || this.searchText.length > 0
				? 'var(--ui-color-accent-main-primary)'
				: 'var(--ui-color-gray-50)'
			;
		},
		showClearButton(): boolean
		{
			return this.isFocused || this.searchText.length > 0;
		},
	},
	watch: {
		canSearch(value: boolean): void
		{
			if (!value)
			{
				this.hideFoundedGroupItems();
				this.resetCurrentGroup();
			}
		},
	},
	setup(props)
	{
		return {
			iconSet: Outline,
		};
	},
	methods: {
		...mapActions(useCatalogStore, [
			'hideFoundedGroupItems',
			'resetCurrentGroup',
		]),
		onInputSearchText(input: string): void
		{
			this.searchText = input;
		},
		onClear(): void
		{
			this.searchText = '';
		},
		onFocus(): void
		{
			this.isFocused = true;
		},
		onBlur(): void
		{
			this.isFocused = false;
		},
	},
	template: `
		<BIcon
			:name="iconSet.SEARCH"
			:size="24"
			:color="iconColor"
			class="ui-node-catalog-icon"
		/>
		<TextInput
			:modelValue="searchText"
			@update:modelValue="onInputSearchText"
			@focus="onFocus"
			@blur="onBlur"
		/>
		<button
			v-if="showClearButton"
			class="editor-chart-catalog-input__clear-btn"
			@click="onClear"
		>
			<BIcon
				:name="iconSet.CROSS_L"
				:size="24"
				class="ui-block-diagram-search-input__clear-btn-icon"
			/>
		</button>
	`,
};
