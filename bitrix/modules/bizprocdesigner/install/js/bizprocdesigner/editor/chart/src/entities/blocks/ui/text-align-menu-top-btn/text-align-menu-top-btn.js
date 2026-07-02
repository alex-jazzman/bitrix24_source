import { Tag, Event, Dom } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { useContextMenu, type UseContextMenu, useBlockDiagram } from 'ui.block-diagram';
import { IconButton } from '../../../../shared/ui';
import type { BlockFrameTextAlign } from '../../../../shared/types';

import './text-align-menu-top-btn.css';

type TextAlignMenuTopBtnProps = {
	textAlign: BlockFrameTextAlign,
	options: Array<BlockFrameTextAlign>,
	contextMenuName: string | null,
};

type TextAlignMenuTopBtnSetup = {
	iconSet: { [string]: string },
	isOpen: boolean,
	showPopup: Pick<UseContextMenu, 'showPopup'>,
};

const OFFSET_LEFT_COLOR_MENU = 112;
const OFFSET_TOP_COLOR_MENU = 90;
const POPUP_MIN_WIDTH = 224;

const TEXT_ALIGN_OPTIONS = {
	NONE: 'none',
	LEFT: 'left',
	TOP: 'top',
	BOTTOM: 'bottom',
	RIGHT: 'right',
};

const ALIGN_ICONS_MAP = {
	[TEXT_ALIGN_OPTIONS.NONE]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="8.01465"
				y="24.9844"
				width="24"
				height="1.84"
				rx="0.92"
				transform="rotate(-45 8.01465 24.9844)"
				fill="#A8ADB4"
			/>
		</svg>
	`,
	[TEXT_ALIGN_OPTIONS.LEFT]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="5.25"
				y="6.05029"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
			<rect
				x="5.25"
				y="10.645"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
			<rect
				x="5.25"
				y="15.2397"
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				fill="#A8ADB4"
			/>
		</svg>
	`,
	[TEXT_ALIGN_OPTIONS.TOP]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="-0.7"
				y="0.7"
				width="32.9"
				height="32.9"
				rx="5.95"
				transform="matrix(1 0 0 -1 1.40039 34.2999)"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				width="20.8359"
				height="1.84"
				rx="0.92"
				transform="matrix(1 0 0 -1 6.73242 12.853)"
				fill="#A8ADB4"
			/>
			<rect
				width="20.8359"
				height="1.84"
				rx="0.92"
				transform="matrix(1 0 0 -1 6.73242 8.27734)"
				fill="#A8ADB4"
			/>
		</svg>
	`,
	[TEXT_ALIGN_OPTIONS.BOTTOM]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.700391"
				y="0.699902"
				width="32.9"
				height="32.9"
				rx="5.95"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				x="6.73242"
				y="21.4468"
				width="20.8359"
				height="1.84"
				rx="0.92"
				fill="#A8ADB4"
			/>
			<rect
				x="6.73242"
				y="26.0225"
				width="20.8359"
				height="1.84"
				rx="0.92"
				fill="#A8ADB4"
			/>
		</svg>
	`,
	[TEXT_ALIGN_OPTIONS.RIGHT]: `
		<svg
			class="editor-chart-text-align-menu-top-btn__icon"
			width="35"
			height="35"
			viewBox="0 0 35 35"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.7"
				y="-0.7"
				width="32.9"
				height="32.9"
				rx="5.95"
				transform="matrix(-1 0 0 1 34.3004 1.3999)"
				stroke="#A8ADB4"
				stroke-width="1.4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 6.05029)"
				fill="#A8ADB4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 10.645)"
				fill="#A8ADB4"
			/>
			<rect
				width="11.0273"
				height="1.83789"
				rx="0.918945"
				transform="matrix(-1 0 0 1 29.0508 15.2397)"
				fill="#A8ADB4"
			/>
		</svg>
	`,
};

const OPTION_ITEM_CLASS_NAMES = {
	BASE: 'editor-chart-text-align-menu-top-btn__item',
	CHANGED: '--changed',
};

// @vue/component
export const TextAlignMenuTopBtn = {
	name: 'TextAlignMenuTopBtn',
	components: {
		IconButton,
	},
	props: {
		/** @type BlockFrameTextAlign */
		textAlign: {
			type: String,
			required: true,
		},
		/** @type Array<BlockFrameTextAlign> */
		options: {
			type: Array,
			default: () => ([
				TEXT_ALIGN_OPTIONS.NONE,
				TEXT_ALIGN_OPTIONS.LEFT,
				TEXT_ALIGN_OPTIONS.TOP,
				TEXT_ALIGN_OPTIONS.BOTTOM,
				TEXT_ALIGN_OPTIONS.RIGHT,
			]),
		},
		contextMenuName: {
			type: String,
			default: null,
		},
	},
	emits: ['update:textAlign', 'update:open'],
	setup(props: TextAlignMenuTopBtnProps): TextAlignMenuTopBtnSetup
	{
		const { isOpen, showPopup } = useContextMenu(props.contextMenuName);
		const { zoom } = useBlockDiagram();

		return {
			iconSet: Outline,
			isOpen,
			zoom,
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
		textAlign(newColorName: string, oldColorName: string | undefined): void
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
		isOpen(isOpen: boolean): void
		{
			this.$emit('update:open', isOpen);
		},
	},
	methods: {
		getMenuItemClassNames(textAlign: string): string
		{
			const classNames = [OPTION_ITEM_CLASS_NAMES.BASE];

			if (this.textAlign === textAlign)
			{
				classNames.push(OPTION_ITEM_CLASS_NAMES.CHANGED);
			}

			return classNames.join(' ');
		},
		getMenuItem(textAlign: string): HTMLElement
		{
			const menuItem = Tag.render`
				<button class="${this.getMenuItemClassNames(textAlign)}">
					<div class="editor-chart-text-align-menu-top-btn__icon-wrap">
						${ALIGN_ICONS_MAP[textAlign]}
					</div>
					<div class="editor-chart-text-align-menu-top-btn__icon-check-wrap">
						<div
							class="ui-icon-set --circle-check editor-chart-text-align-menu-top-btn__icon-check"
							style="--ui-icon-set__icon-size: 14px;"
						>
						</div>
					</div>
				</button>
			`;

			Event.bind(menuItem, 'click', () => {
				this.$emit('update:textAlign', textAlign);
			});

			return menuItem;
		},
		getMenuContent(): HTMLElement
		{
			const content = Tag.render`
				<div class="editor-chart-text-align-menu-top-btn__menu">
				</div>
			`;

			this.options.forEach((option) => {
				Dom.append(this.optionElements.get(option), content);
			});

			return content;
		},
		onOpenMenu(): void
		{
			const { top = 0, left = 0 } = this.$refs.alignMenuBtn
				?.$el?.getBoundingClientRect() ?? {};

			this.showPopup(
				{
					clientX: left - (OFFSET_LEFT_COLOR_MENU * this.zoom),
					clientY: top - (OFFSET_TOP_COLOR_MENU * this.zoom),
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
			ref="alignMenuBtn"
			:active="isOpen"
			:icon-name="iconSet.TEXT"
			:color="'var(--ui-color-palette-gray-40)'"
			@click="onOpenMenu"
		/>
	`,
};
