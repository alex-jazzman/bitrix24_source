import { BInput, InputSize } from 'ui.system.input.vue';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';

import 'ui.design-tokens.air';

import './select-input.css';

export type SelectInputItem = {
	value: string,
	text: string,
};

const openingKeys = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

// @vue/component
export const SelectInput = {
	name: 'SelectInput',
	components: { BInput, BMenu },
	props:
	{
		/** @type SelectInputItem[] */
		items: {
			type: Array,
			required: true,
		},
		value: {
			type: String,
			required: true,
		},
		// BInput keeps its control private and forwards no id to it, so the caption of the row
		// cannot reach the control through for/id and names it by text instead.
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['itemChange'],
	setup(): Object
	{
		return { InputSize };
	},
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed:
	{
		selectedText(): string
		{
			return this.items.find((item: SelectInputItem) => item.value === this.value)?.text ?? '';
		},
		menuOptions(): MenuOptions
		{
			return {
				// The field as a whole is the trigger: BInput exposes no node for the control
				// inside, so the menu stamps aria-haspopup / aria-expanded here and gives the
				// focus back to the control it wrapped.
				bindElement: this.$refs.field.$el,
				closeOnItemClick: false,
				items: this.items.map((item: SelectInputItem) => {
					return {
						title: item.text,
						isSelected: item.value === this.value,
						onClick: () => this.selectItem(item),
					};
				}),
			};
		},
	},
	methods:
	{
		openMenu(): void
		{
			this.isMenuShown = true;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (this.isMenuShown || !openingKeys.has(event.key))
			{
				return;
			}

			event.preventDefault();
			this.openMenu();
		},
		selectItem(item: SelectInputItem): void
		{
			this.isMenuShown = false;
			this.$emit('itemChange', item.value);
		},
	},
	// The field is readonly and not clickable on purpose: with clickable BInput blurs the
	// control on focus, which drops the field out of the tab order and leaves no way to open
	// the menu from the keyboard. No design is named either: the reference field is the plain
	// one of the design system, which is what BInput draws on its own default.
	template: `
		<div class="bx-im-chat-forms-select-input" data-testid="im-chat-form-select-input">
			<BInput
				ref="field"
				:modelValue="selectedText"
				:ariaLabel="ariaLabel"
				:size="InputSize.Md"
				:active="isMenuShown"
				dropdown
				readonly
				stretched
				@click="openMenu"
				@keydown="handleKeydown"
			/>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`,
};
