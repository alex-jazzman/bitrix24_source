import { Text, Type } from 'main.core';
import {
	Button as UIButton,
	type ButtonOptions,
	ButtonState as UIButtonState,
	SplitButton as UISplitButton,
} from 'ui.buttons';
import { BitrixVue } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';
import { ButtonState } from '../enums/button-state';
import { ButtonType } from '../enums/button-type';

import { BaseButton } from './baseButton';
import { ButtonMenu } from './button-menu';

export const Button = BitrixVue.cloneComponent(BaseButton, {
	directives: { hint },
	props: {
		type: {
			type: String,
			required: false,
			default: ButtonType.SECONDARY,
		},
		iconName: {
			type: String,
			required: false,
			default: '',
		},
		size: {
			type: String,
			required: false,
			default: 'medium',
		},
		menuItems: {
			type: Object,
			required: false,
			default: null,
		},
	},

	data(): Object
	{
		return {
			timerSecondsRemaining: 0,
			currentState: this.state,
			hintText: Type.isStringFilled(this.tooltip) ? this.tooltip : '',
		};
	},

	computed:
	{
		itemTypeToButtonStyleDict(): Object
		{
			return {
				[ButtonType.PRIMARY]: UIButton.AirStyle.FILLED,
				[ButtonType.SECONDARY]: UIButton.AirStyle.OUTLINE,
				[ButtonType.LIGHT]: UIButton.AirStyle.PLAIN,
				[ButtonType.ICON]: UIButton.AirStyle.PLAIN_NO_ACCENT,
				[ButtonType.AI]: UIButton.AirStyle.FILLED_BITRIX_GPT,
			};
		},

		buttonContainerRef(): HTMLElement | undefined
		{
			return this.$refs.buttonContainer;
		},

		containerClasses(): Array
		{
			return [
				this.$attrs.class,
				{
					'--has-ai-icon': this.iconName?.toLowerCase() === 'ai',
					'--has-icon-only': this.type === ButtonType.ICON,
				},
			];
		},

		hintOptions(): ?Object
		{
			if (!Type.isStringFilled(this.hintText))
			{
				return null;
			}

			return {
				text: Text.encode(this.hintText),
				popupOptions: {
					offsetTop: 5,
				},
			};
		},
	},

	methods:
	{
		getButtonOptions(): ButtonOptions
		{
			const upperCaseIconName = Type.isString(this.iconName) ? this.iconName.toUpperCase() : '';
			const upperCaseButtonSize = Type.isString(this.size) ? this.size.toUpperCase() : 'extra_small';
			const btnStyle = this.itemTypeToButtonStyleDict[this.type] || UIButton.AirStyle.OUTLINE;
			const titleText = this.type === ButtonType.ICON ? '' : this.title;

			return {
				id: this.id,
				useAirDesign: true,
				round: true,
				size: UIButton.Size[upperCaseButtonSize],
				text: titleText,
				style: btnStyle,
				state: this.itemStateToButtonStateDict[this.currentState],
				icon: UIButton.Icon[upperCaseIconName],
				props: Type.isPlainObject(this.props) ? this.props : {},
			};
		},

		getUiButton(): ?UIButton
		{
			return this.uiButton;
		},

		disableWithTimer(sec: number)
		{
			this.setButtonState(ButtonState.DISABLED);
			const btn = this.getUiButton();
			let remainingSeconds = sec;

			btn.setText(this.formatSeconds(remainingSeconds));

			const timer = setInterval(() => {
				if (remainingSeconds < 1)
				{
					clearInterval(timer);
					btn.setText(this.title);

					this.setButtonState(ButtonState.DEFAULT);

					return;
				}

				remainingSeconds--;
				btn.setText(this.formatSeconds(remainingSeconds));
			}, 1000);
		},

		formatSeconds(sec: number): string
		{
			const minutes = Math.floor(sec / 60);
			const seconds = sec % 60;

			const formatMinutes = this.formatNumber(minutes);
			const formatSeconds = this.formatNumber(seconds);

			return `${formatMinutes}:${formatSeconds}`;
		},

		formatNumber(num: number): string
		{
			return num < 10 ? `0${num}` : num;
		},

		setButtonState(state): void
		{
			this.parentSetButtonState(state);
			this.getUiButton()?.setState(this.itemStateToButtonStateDict[this.currentState] ?? null);
		},

		createSplitButton(): UISplitButton
		{
			const menuItems = Object.keys(this.menuItems).map((key) => this.menuItems[key]);
			const options = this.getButtonOptions();
			const showMenu = () => {
				ButtonMenu.showMenu(
					this,
					menuItems,
					{
						id: `split-button-menu-${this.id}`,
						className: 'crm-timeline__split-button-menu',
						width: 250,
						angle: true,
						cacheable: false,
						offsetLeft: 13,
						bindElement: this.$el.querySelector('.ui-btn-menu'),
					},
				);
			};

			options.menuButton = {
				onclick: (element, event: PointerEvent) => {
					event.stopPropagation();
					showMenu();
				},
			};

			if (options.state === UIButtonState.DISABLED)
			{
				options.mainButton = {
					onclick: (element, event: PointerEvent) => {
						event.stopPropagation();
						showMenu();
					},
				};
			}

			return new UISplitButton(options);
		},

		renderButton(): void
		{
			if (!this.buttonContainerRef)
			{
				return;
			}

			this.buttonContainerRef.innerHTML = '';

			const button = this.menuItems
				? this.createSplitButton()
				: new UIButton(this.getButtonOptions())
			;

			button.renderTo(this.buttonContainerRef);

			this.uiButton = button;
		},

		setTooltip(tooltip: string): void
		{
			this.hintText = tooltip;
		},

		isInViewport(): boolean
		{
			const rect = this.$el.getBoundingClientRect();

			return (
				rect.top >= 0
				&& rect.left >= 0
				&& rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
				&& rect.right <= (window.innerWidth || document.documentElement.clientWidth)
			);
		},

		isPropEqual(propName: string, value: any): boolean
		{
			return this.getButtonOptions().props[propName] === value;
		},
	},

	watch: {
		state(newValue): void
		{
			this.setButtonState(newValue);
		},

		tooltip(newValue): void
		{
			this.hintText = Type.isStringFilled(newValue) ? newValue : '';
		},
	},

	mounted(): void
	{
		this.renderButton();
	},

	updated(): void
	{
		this.renderButton();
	},

	template: `
		<div
			:class="containerClasses"
			v-hint="hintOptions"
			ref="buttonContainer"
			@click="executeAction"
		>
		</div>
	`,
});
