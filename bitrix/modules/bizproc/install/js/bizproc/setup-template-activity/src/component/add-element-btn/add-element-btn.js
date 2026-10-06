import { EventEmitter } from 'main.core.events';
import { Outline } from 'ui.icon-set.api.core';
import { BMenu } from 'ui.system.menu.vue';
import { CONSTANT_PRESETS, MENU_SECTIONS } from '../../constants';
import {
	calculateFreeHeightAround,
	makeEmptyTitle,
	makeEmptyDescription,
	makeEmptyDelimiter,
	makeEmptyConstant,
	makeEmptyTitleWithIcon,
	makePresetConstant,
} from '../../utils';
import type { ConstantConfiguration, ConstantPreset, Item } from '../../types';
import type { MenuItemOptions, MenuOptions, MenuSectionOptions } from 'ui.system.menu';

type AddElementBtnData = {
	isMenuShown: boolean;
	offsetLeft: number;
	menuMaxHeight: number | null;
};

type VisualElement = {
	labelKey: string;
	hintKey: string;
	make: () => Item;
};

// The popup keeps a fixed width: item subtitles wrap instead of sizing the menu by their length.
// Exported for the tests, which assert the layout of the menu against these very values.
export const MENU_WIDTH = 380;

// Keeps the popup off the window edge, borders and shadow included.
export const MENU_VIEWPORT_GAP = 12;

// A popup applies any non-negative maxHeight, so a smaller free space is left unlimited:
// a menu a few pixels tall is worse than a menu reaching beyond the window.
const MENU_MIN_HEIGHT = 200;

const VISUAL_ELEMENTS: Array<VisualElement> = [
	{
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_TITLE_ITEM_HINT',
		make: makeEmptyTitle,
	},
	{
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_HINT',
		make: makeEmptyTitleWithIcon,
	},
	{
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DESCRIPTION_ITEM_HINT',
		make: makeEmptyDescription,
	},
	{
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_DELIMITER_ITEM_HINT',
		make: makeEmptyDelimiter,
	},
];

// @vue/component
export const AddElementBtn = {
	name: 'AddElementBtn',
	components: {
		BMenu,
	},
	props:
	{
		constantIds: {
			type: Set,
			default: () => new Set(),
		},
		/** @type ConstantConfiguration[] */
		constantConfigurationList: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['add:element', 'create:constant'],
	data(): AddElementBtnData
	{
		return {
			isMenuShown: false,
			offsetLeft: 0,
			menuMaxHeight: null,
		};
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.addElementButton,
				// The popup gets its content as an element, so main.popup has no text to name it with.
				ariaLabel: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM'),
				offsetLeft: this.offsetLeft,
				width: MENU_WIDTH,
				maxHeight: this.menuMaxHeight,
				fixed: false,
				cacheable: false,
				sections: this.menuSections,
				items: [
					...this.visualElementItems,
					...this.presetItems,
					this.customConstantItem,
				],
			};
		},
		menuSections(): Array<MenuSectionOptions>
		{
			return [
				{
					code: MENU_SECTIONS.ELEMENTS,
					title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_MENU_SECTION_ELEMENTS'),
				},
				{
					code: MENU_SECTIONS.PRESETS,
					title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_MENU_SECTION_PRESETS'),
				},
				// An empty title renders a bare divider instead of a section heading.
				{
					code: MENU_SECTIONS.CUSTOM,
					title: '',
				},
			];
		},
		visualElementItems(): Array<MenuItemOptions>
		{
			return VISUAL_ELEMENTS.map((element: VisualElement) => ({
				sectionCode: MENU_SECTIONS.ELEMENTS,
				title: this.$Bitrix.Loc.getMessage(element.labelKey),
				subtitle: this.$Bitrix.Loc.getMessage(element.hintKey),
				onClick: () => this.$emit('add:element', element.make()),
			}));
		},
		availablePresets(): Array<ConstantPreset>
		{
			const types = new Set(this.constantConfigurationList.map(
				(configuration: ConstantConfiguration) => configuration.type,
			));

			return CONSTANT_PRESETS.filter((preset: ConstantPreset) => types.has(preset.constantType));
		},
		presetItems(): Array<MenuItemOptions>
		{
			return this.availablePresets.map((preset: ConstantPreset) => ({
				sectionCode: MENU_SECTIONS.PRESETS,
				title: this.$Bitrix.Loc.getMessage(preset.labelKey),
				subtitle: this.$Bitrix.Loc.getMessage(preset.hintKey),
				onClick: () => {
					this.$emit('create:constant', makePresetConstant(preset, this.generateFriendlyId()));
				},
			}));
		},
		customConstantItem(): MenuItemOptions
		{
			return {
				sectionCode: MENU_SECTIONS.CUSTOM,
				icon: Outline.PLUS_L,
				title: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CUSTOM_CONSTANT_LABEL'),
				subtitle: this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CUSTOM_CONSTANT_HINT'),
				onClick: () => {
					this.$emit('create:constant', makeEmptyConstant(this.generateFriendlyId()));
				},
			};
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
		EventEmitter.subscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
	},
	unmounted(): void
	{
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.closeMenu);
		EventEmitter.unsubscribe('Bizproc.NodeSettings:onScroll', this.closeMenu);
	},
	methods: {
		onShowMenu(event: MouseEvent): void
		{
			const { left = 0, top = 0, bottom = 0 } = this.$refs.addElementButton?.getBoundingClientRect() ?? {};

			// A click from Enter/Space carries no click count and no pointer position,
			// so the menu is bound to the button itself instead of the (0, 0) coordinate.
			const isKeyboardActivation = event.detail === 0;
			const freeHeight = calculateFreeHeightAround({ top, bottom }, window.innerHeight, MENU_VIEWPORT_GAP);

			this.offsetLeft = isKeyboardActivation ? 0 : Math.abs(event.clientX - left);
			this.menuMaxHeight = freeHeight >= MENU_MIN_HEIGHT ? freeHeight : null;
			this.isMenuShown = true;
		},
		generateFriendlyId(): string
		{
			const BASE_NAME = 'Constant';

			let counter = 1;
			let potentialId = `${BASE_NAME}${counter}`;

			while (this.constantIds.has(potentialId))
			{
				counter++;
				potentialId = `${BASE_NAME}${counter}`;
			}

			return potentialId;
		},
		// A close often arrives from the very action that has already moved the focus elsewhere:
		// a click into a field of the settings form, a confirmation popup opened from a menu item.
		// Only a focus nobody holds is free to come back to the button.
		isFocusUnclaimed(): boolean
		{
			const { activeElement, body } = document;

			return !activeElement || activeElement === body;
		},
		closeMenu(): void
		{
			// Events of the surrounding UI arrive whether the menu is open or not, and every block has
			// its own button: an idle one must not pull the focus away from where the user is.
			if (!this.isMenuShown)
			{
				return;
			}

			this.isMenuShown = false;

			// While the menu is still on screen the focus belongs to it — a menu item button after
			// Escape or a click. Whether anybody actually wants the focus is only visible once the popup
			// is gone, so the decision waits for the render that removes it: a focus left behind by the
			// popup reads as free, a focus already taken by a field or an editor stays where it is.
			void this.$nextTick(() => {
				if (this.isFocusUnclaimed())
				{
					// The air button draws its focus ring on :focus-visible only, so returning the focus
					// stays invisible after a mouse close; preventScroll keeps a scroll-driven close in place.
					this.$refs.addElementButton?.focus({ preventScroll: true });
				}
			});
		},
	},
	template: `
		<button
			ref="addElementButton"
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon bizproc-setuptemplateactivity-add-element-btn"
			type="button"
			data-testid="bizproc-setup-template-add-element-btn"
			aria-haspopup="menu"
			:aria-expanded="isMenuShown"
			@click="onShowMenu"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_ITEM') }}
			</span>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="closeMenu"
			/>
		</button>
	`,
};
