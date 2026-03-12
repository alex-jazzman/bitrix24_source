import { Tag, Event, Dom } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { useContextMenu, type UseContextMenu } from 'ui.block-diagram';
import { IconButton } from '../../../../shared/ui';

import './color-menu-top-btn.css';

type ColorMenuTopBtnSetup = {
	iconSet: { [string]: string },
	isOpen: boolean,
	showPopup: Pick<UseContextMenu, 'showPopup'>,
};

const OPTION_ITEM_CLASS_NAMES = {
	BASE: 'editor-chart-menu-top-btn__item',
	CHANGED: '--changed',
};

const OFFSET_LEFT_COLOR_MENU = 70;
const OFFSET_TOP_COLOR_MENU = 130;
const POPUP_MIN_WIDTH = 145;

// @vue/component
export const ColorMenuTopBtn = {
	name: 'ColorMenuTopBtn',
	components: {
		IconButton,
	},
	props: {
		colorName: {
			type: String,
			required: true,
		},
		options: {
			type: Array,
			default: () => ([]),
		},
	},
	emits: ['update:colorName', 'update:open'],
	setup(): ColorMenuTopBtnSetup
	{
		const { isOpen, showPopup } = useContextMenu();

		return {
			iconSet: Outline,
			isOpen,
			showPopup,
		};
	},
	data(): { optionElements: Map<string, HTMLElement> }
	{
		return {
			optionElements: new Map(),
		};
	},
	watch: {
		colorName(newColorName: string, oldColorName: string | undefined): void
		{
			Dom.removeClass(
				this.optionElements.get(oldColorName),
				OPTION_ITEM_CLASS_NAMES.CHANGED,
			);
			Dom.addClass(
				this.optionElements.get(newColorName),
				OPTION_ITEM_CLASS_NAMES.CHANGED,
			);
		},
		options: {
			handler(newOptions: Array<string>, oldOptions: Array<string> = []): void
			{
				oldOptions.forEach((option: string) => this.optionElements.delete(option));
				newOptions.forEach((option: string) => this.optionElements.set(option, this.getMenuItem(option)));
			},
			immediate: true,
		},
		isOpen(isOpen): void
		{
			this.$emit('update:open', isOpen);
		},
	},
	methods: {
		getMenuItemClassNames(colorName: string): string
		{
			const classNames = [
				OPTION_ITEM_CLASS_NAMES.BASE,
				`--${colorName}`,
			];

			if (this.colorName === colorName)
			{
				classNames.push(OPTION_ITEM_CLASS_NAMES.CHANGED);
			}

			return classNames.join(' ');
		},
		getMenuItem(colorName: string): HTMLElement
		{
			const menuItem = Tag.render`
				<button class="${this.getMenuItemClassNames(colorName)}">
					<div class="editor-chart-menu-top-btn__icon-check-wrap">
						<div
							class="ui-icon-set --circle-check editor-chart-menu-top-btn__icon-check"
							style="--ui-icon-set__icon-size: 14px;"
						>
						</div>
					</div>
				</button>
			`;

			Event.bind(menuItem, 'click', () => {
				this.$emit('update:colorName', colorName);
			});

			return menuItem;
		},
		getMenuContent(): HTMLElement
		{
			const content = Tag.render`
				<div class="editor-chart-menu-top-btn__menu">
				</div>
			`;

			this.options.forEach((option) => {
				Dom.append(this.optionElements.get(option), content);
			});

			return content;
		},
		onOpenColorMenu(): void
		{
			const { top = 0, left = 0 } = this.$refs.colorMenuBtn
				?.$el?.getBoundingClientRect() ?? {};

			this.showPopup(
				{
					clientX: left - OFFSET_LEFT_COLOR_MENU,
					clientY: top - OFFSET_TOP_COLOR_MENU,
				},
				{
					content: this.getMenuContent(),
					minWidth: POPUP_MIN_WIDTH,
				},
			);
		},
	},
	template: `
		<IconButton
			ref="colorMenuBtn"
			:active="isOpen"
			:icon-name="iconSet.PALETTE"
			:color="'var(--ui-color-palette-gray-40)'"
			@click="onOpenColorMenu"
		/>
	`,
};
