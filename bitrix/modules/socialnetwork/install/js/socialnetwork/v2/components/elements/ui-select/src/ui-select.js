import { BInput } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { type UiSelectItem } from './types';

// @vue/component
export const UiSelect = {
	name: 'UiSelect',
	components: {
		BInput,
		BMenu,
	},
	props: {
		modelValue: {
			type: [String, Number, null],
			default: null,
		},
		label: {
			type: String,
			default: '',
		},
		/** @type{Array<UiSelectItem>} */
		items: {
			type: Array,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		inputClassName: {
			type: String,
			default: '',
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		inputValue(): string
		{
			return this.items.find((item) => this.isSelectedItem(item))?.title ?? '';
		},
	},
	methods: {
		selectItem(item: UiSelectItem): void
		{
			this.$emit('update:modelValue', item.id);
		},
		isSelectedItem(item: UiSelectItem): boolean
		{
			return item.id === this.modelValue;
		},
		getMenuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.selector.$el,
				targetContainer: this.targetContainer || document.body,
				items: this.items.map((item: UiSelectItem) => {
					return {
						title: item.title,
						icon: item.icon,
						isSelected: this.isSelectedItem(item),
						design: item.disabled ? MenuItemDesign.Disabled : MenuItemDesign.Default,
						onClick: () => this.selectItem(item),
					};
				}),
			};
		},
	},
	template: `
		<BInput
			:modelValue="inputValue"
			:label
			:disabled
			dropdown
			clickable
			:class="inputClassName"
			:active="isMenuShown"
			ref="selector"
			@click="isMenuShown = true"
		/>
		<BMenu v-if="isMenuShown" :options="getMenuOptions()" @close="isMenuShown = false"/>
	`,
};
