import { Type } from 'main.core';
import { MenuOptions } from 'main.popup';
import {
	SplitButton as UIButtonSplit,
	ButtonColor, ButtonSize,
	ButtonState, ButtonIcon,
	AirButtonStyle,
	ButtonCounterColor,
	ButtonTag,
} from 'ui.buttons';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu } from 'ui.system.menu.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';

import './button-split.css';


const BUTTON_PART_TYPE = {
	TEXT: 'TEXT',
	DROPDOWN: 'DROPDOWN',
	// in development
	TOGGLE: 'TOGGLE',
};

// @vue/component
export const ButtonSplitBkp: BitrixVueComponentProps | { button: ?UIButtonSplit } = {
	name: 'UiButtonSplitBkp',
	components: { BMenu },
	props: {
		id: {
			type: String,
			default: '',
		},
		idKey: {
			type: String,
			default: '',
		},
		class: {
			type: String,
			default: '',
		},
		text: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: '',
		},
		leftIcon: {
			type: String,
			default: '',
		},
		style: {
			type: String,
			default: '',
		},
		wide: Boolean,
		menuOptions: {
			type: MenuOptions,
			required: false,
			default: null,
		},
	},
	emits: [ 'click', 'clickSecondary' ],
	data(): Object {
		return {
			isMounted: false,
			isMenuShown: false,
			menuOptionsBound: null,
		};
	},
	watch: {},
	created(): void {
		const UIButtonSplitNew = new UIButtonSplit({
			id: this.idKey,
			className: this.class,
			props: { id: this.id },
			text: this.text,
			size: this.size,
			icon: this.leftIcon,
			useAirDesign: true,
			style: this.style,
			wide: this.wide,
			mainButton: {
				onclick: () => this.$emit('click'),
			},
			menuButton: {
				onclick: () => {
					this.isMenuShown = !this.isMenuShown;
					this.$emit('clickSecondary');
				},
			},
		});
		this.buttonNew = UIButtonSplitNew;
	},
	mounted(): void {
		const buttonNewRendered = this.buttonNew?.render();
		this.$refs.buttonPlaceholder.after(buttonNewRendered);
		if (this.menuOptions)
		{
			this.menuOptionsBound = {
				...this.menuOptions,
				className: 'popup-window_for-button-split',
				bindElement: buttonNewRendered,
			};
		}
		this.isMounted = true;
	},
	unmounted(): void {
		this.buttonNew?.getContainer()?.remove();
	},
	methods: {},
	template: `
		<button v-if="!isMounted" ref="buttonPlaceholder"></button>
		<BMenu v-if="isMenuShown" :options="menuOptionsBound" @close="isMenuShown = false"/>
	`,
};

// @vue/component
export const ButtonText = {
	name: 'ButtonText',
	components: {
		BIcon,
	},
	props: {
		id: {
			type: String,
			default: '',
		},
		text: {
			type: String,
			default: '',
		},
		iconLeft: {
			type: String,
			default: '',
		},
		iconRight: {
			type: String,
			default: '',
		},
		onclick: {
			type: Function,
			default: () => {},
		},
	},
	emits: [],
	setup(): Object
	{
		return {
		};
	},
	data(): Object
	{
		return {
		};
	},
	mounted(): void
	{
	},
	updated(): void
	{
	},
	methods: {

		// handlers

		handleClickButton(): void
		{
			this.onclick();
		},

		// handlers end

	},
	template: `
		<button
			:id="id"
			class="ui-btn-part ui-btn-part_text"
			@click="handleClickButton"
		>
			<BIcon
				v-if="iconLeft"
				class="ui-btn-part__img"
				:name="iconLeft"
			/>
			<span class="ui-btn-part__text">{{ text }}</span>
			<BIcon
				v-if="iconRight"
				class="ui-btn-part__img"
				:name="iconRight"
			/>
		</button>
	`,
};

// @vue/component
export const ButtonDropdown = {
	name: 'ButtonDropdown',
	components: {
		BIcon,
		BMenu,
	},
	props: {
		id: {
			type: String,
			default: '',
		},
		isLoading: {
			type: Boolean,
			required: false,
		},
		menuOptions: {
			type: MenuOptions,
			required: false,
			default: null,
		},
	},
	emits: [],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object {
		return {
			isMenuShown: false,
		};
	},
	computed: {
		menuOptionsBound(): any {
			return {
				...this.menuOptions,
				className: 'popup-window_for-button-split',
				bindElement: this.$refs.opener,
			};
		},
	},
	mounted(): void
	{},
	updated(): void
	{},
	methods: {

		// handlers

		handleClickButton(): void
		{
			this.isMenuShown = !this.isMenuShown;
		},

		// handlers end

	},
	template: `
		<button
			ref="opener"
			:id="id"
			class="ui-btn-part ui-btn-part_dropdown ui-icon-set__scope"
			:class="{'ui-btn-part_loading': isLoading}"
			@click="handleClickButton"
		>
			<BMenu v-if="isMenuShown" :options="menuOptionsBound" @close="isMenuShown = false" />
		</button>
	`,
};

// @vue/component
export const ButtonPlaceholder = {
	name: 'ButtonPlaceholder',
	components: {},
	props: {
		id: {
			type: String,
			default: '',
		},
		text: {
			type: String,
			default: '',
		},
	},
	emits: [],
	setup(): Object
	{
		return {};
	},
	data(): Object
	{
		return {};
	},
	mounted(): void
	{},
	updated(): void
	{},
	methods: {},
	template: `
		<div class="ui-btn-part ui-btn-part_fallback">
			<p class="ui-btn-part__info" >Type unknown. Id: {{ id }}. Text: {{ text }}.</p>
		</div>
	`,
};

// @vue/component
export const ButtonSplit: BitrixVueComponentProps | { button: ?UIButtonSplit } = {
	name: 'UiButtonSplit',
	components: {
		ButtonText,
		ButtonDropdown,
		ButtonPlaceholder,
	},
	props: {
		id: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: '',
		},
		styleName: {
			type: String,
			default: '',
		},
		wide: {
			type: Boolean,
			required: false,
		},
		buttonParts: {
			type: Array,
			required: true,
			default: () => ([]),
		},
	},
	emits: [
		'click',
		'menuOpen',
		'menuClose',
	],
	data(): Object {
		return {
		};
	},
	computed: {
		classSumm(): String
		{
			const classBase = '--air';
			const classStyle = this.styleName ? (' ' + this.styleName) : '';
			const classSize = this.size ? (' ' + this.size) : '';
			const classWide = this.wide ? ' --wide' : '';
			const classSummNew = classBase + classStyle + classSize + classWide;
			return classSummNew;
		},
	},
	watch: {
	},
	created(): void
	{},
	mounted(): void
	{},
	unmounted(): void
	{},
	methods: {
		getButtonPartComponent(buttonPart): Object
		{
			if (buttonPart.type === BUTTON_PART_TYPE.TEXT)
			{
				return ButtonText;
			}

			if (buttonPart.type === BUTTON_PART_TYPE.DROPDOWN)
			{
				return ButtonDropdown;
			}

			if (buttonPart.type === BUTTON_PART_TYPE.TOGGLE)
			{
				return ButtonPlaceholder;
			}

			return ButtonPlaceholder;
		},
	},
	template: `
		<ul
			:id="id"
			class="ui-btn-split ui-btn-split_vue-tmp"
			:class="classSumm"
		>
			<li
				v-for="buttonPart in buttonParts"
				:key="buttonPart.id + buttonPart.type"
				class="ui-btn-split__item"
				:class="{
					'ui-btn-split__item_no-divider': buttonPart.isNoNextDivider,
				}"
			>
				<component
					:is="getButtonPartComponent(buttonPart)"
					:key="buttonPart.id + buttonPart.type"
					:id="buttonPart.id"
					:ref="buttonPart.id"
					:icon-left="buttonPart.iconLeft"
					:icon-right="buttonPart.iconRight"
					:text="buttonPart.text"
					:menuOptions="buttonPart.menuOptions"
					:onclick="buttonPart.onClick"
				/>
			</li>
		</ul>
	`,
};

// @vue/component
export const ButtonTextDropdown: BitrixVueComponentProps | { button: ?UIButtonSplit } = {
	name: 'UiButtonTextDropdown',
	components: {
		ButtonSplit,
	},
	props: {
		id: {
			type: String,
			default: '',
		},
		isLoading: {
			type: Boolean,
			required: false,
		},
		text: {
			type: String,
			default: '',
		},
		iconLeft: {
			type: String,
			default: '',
		},
		iconRight: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: '',
		},
		styleName: {
			type: String,
			default: '',
		},
		wide: {
			type: Boolean,
			required: false,
		},
		menuOptions: {
			type: MenuOptions,
			required: false,
			default: null,
		},
	},
	emits: [
		'click',
	],
	data(): Object {
		return {
		};
	},
	computed: {
		buttonParts(): String
		{
			const buttonPartsNew = [
				{
					id: this.id + 'Text',
					type: BUTTON_PART_TYPE.TEXT,
					text: this.text,
					iconLeft: this.iconLeft,
					iconRight: this.iconRight,
					onClick: () => this.$emit('click'),
				},
				{
					id: this.id + 'Dropdown',
					type: BUTTON_PART_TYPE.DROPDOWN,
					menuOptions: this.menuOptions,
				},
			];
			return buttonPartsNew;
		},
	},
	watch: {
	},
	created(): void
	{},
	mounted(): void
	{},
	unmounted(): void
	{},
	methods: {
	},
	template: `
		<ButtonSplit
			:id="id"
			:size="size"
			:style-name="styleName"
			:wide="wide"
			:buttonParts="buttonParts"
		/>
	`,
};

export {
	ButtonColor,
	ButtonSize,
	ButtonIcon,
	AirButtonStyle,
	ButtonCounterColor,
	ButtonState,
	ButtonTag,
	BUTTON_PART_TYPE,
};
