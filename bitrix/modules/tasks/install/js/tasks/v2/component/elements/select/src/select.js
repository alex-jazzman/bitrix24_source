import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign } from 'ui.system.menu.vue';
import type { MenuOptions, MenuItemOptions } from 'ui.system.menu.vue';

export type Item = Pick<MenuItemOptions, 'id' | 'title'> & { disabled: ?boolean };
export type { MenuOptions };

// @vue/component
export const UiSelect = {
	name: 'UiSelect',
	components: {
		BInput,
		BMenu,
	},
	props: {
		/** @type{Item} */
		item: {
			type: Object,
			required: true,
		},
		/** @type{Item[]} */
		items: {
			type: Array,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		size: {
			type: String,
			default: InputSize.Sm,
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
		menuOptions: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:item'],
	setup(): { InputDesign: typeof InputDesign }
	{
		return {
			InputDesign,
		};
	},
	data(): { isShown: boolean }
	{
		return {
			isShown: false,
		};
	},
	computed: {
		options(): MenuOptions
		{
			return {
				bindElement: this.$refs.input.$el,
				closeOnItemClick: false,
				targetContainer: this.targetContainer || document.body,
				items: this.items.map((item) => {
					return {
						title: item.title,
						isSelected: item.id === this.item.id,
						design: item.disabled ? MenuItemDesign.Disabled : MenuItemDesign.Default,
						onClick: () => {
							if (item.disabled)
							{
								return;
							}

							this.$emit('update:item', item);
							this.isShown = false;
						},
					};
				}),
				...this.menuOptions,
			};
		},
	},
	methods: {
		inputClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			this.isShown = true;
		},
	},
	template: `
		<div class="tasks-select">
			<BInput
				:modelValue="item.title"
				dropdown
				clickable
				:active="isShown"
				:size
				:design="disabled ? InputDesign.Disabled : InputDesign.Default"
				ref="input"
				@click="inputClick"
			/>
			<BMenu
				v-if="isShown"
				:options
				@close="isShown = false"
			/>
		</div>
	`,
};
