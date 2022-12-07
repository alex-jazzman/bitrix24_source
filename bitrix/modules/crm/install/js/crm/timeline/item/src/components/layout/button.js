import {Action} from "../../action";
import { ButtonOptions, Button as UIButton } from 'ui.buttons';
import {ButtonType} from '../enums/button-type';
import {ButtonState} from '../enums/button-state';
import {Type} from 'main.core';

export const Button = {
	props: {
		title: {
			type: String,
			required: false,
			default: '',
		},
		type: {
			type: String,
			required: false,
			default: ButtonType.SECONDARY,
		},
		state: {
			type: String,
			required: false,
			default: ButtonState.DEFAULT,
		},
		iconName: {
			type: String,
			required: false,
			default: '',
		},
		size: {
			type: String,
			required: false,
			default: 'extra_small'
		},
		action: Object,
	},
	data() {
		return {
			popup: null,
			uiButton: Object.freeze(null),
			currentState: this.state,
		}
	},
	computed: {
		buttonOptions(): ButtonOptions {
			const upperCaseIconName = Type.isString(this.iconName) ? this.iconName.toUpperCase() : '';
			const upperCaseButtonSize = Type.isString(this.size) ? this.size.toUpperCase() : 'extra_small';
			const color = this.itemTypeToButtonColorDict[this.type] || UIButton.Color.LIGHT_BORDER;
			const text = this.type === ButtonType.ICON ? '' : this.title;
			return {
				round: true,
				dependOnTheme: false,
				size: UIButton.Size[upperCaseButtonSize],
				text: text,
				color: color,
				state: this.itemStateToButtonStateDict[this.currentState],
				icon: UIButton.Icon[upperCaseIconName],
			}
		},

		itemTypeToButtonColorDict() {
			return {
				[ButtonType.PRIMARY]: UIButton.Color.PRIMARY,
				[ButtonType.SECONDARY]: UIButton.Color.LIGHT_BORDER,
				[ButtonType.LIGHT]: UIButton.Color.LIGHT,
				[ButtonType.ICON]: UIButton.Color.LINK,
			}
		},

		itemStateToButtonStateDict() {
			return {
				[ButtonState.LOADING]: UIButton.State.WAITING,
				[ButtonState.DISABLED]: UIButton.State.DISABLED,
			}
		},

		buttonContainerRef(): HTMLElement | undefined {
			return this.$refs.buttonContainer;
		},

	},
	methods: {
		getUiButton(): ?UIButton
		{
			return this.uiButton;
		},

		setDisabled(disabled: boolean): void
		{
			if (disabled)
			{
				this.setButtonState(ButtonState.DISABLED);
			}
			else
			{
				this.setButtonState(ButtonState.DEFAULT);
			}
		},

		setLoading(loading: boolean): void
		{
			if (loading)
			{
				this.setButtonState(ButtonState.LOADING);
			}
			else
			{
				this.setButtonState(ButtonState.DEFAULT);
			}
		},

		setButtonState(state): void
		{
			if (this.currentState !== state)
			{
				this.currentState = state;
				this.getUiButton()?.setState(this.itemStateToButtonStateDict[this.currentState] ?? null);
			}
		},

		renderButton(): void {
			if (!this.buttonContainerRef) {
				return;
			}
			this.buttonContainerRef.innerHTML = '';
			const button = new UIButton(this.buttonOptions);
			button.renderTo(this.buttonContainerRef);
			this.uiButton = button;
		},

		executeAction(): void
		{
			if (this.action && this.currentState !== ButtonState.DISABLED && this.currentState !== ButtonState.LOADING)
			{
				const action = new Action(this.action);
				action.execute(this);
			}
		},

		onLayoutUpdated(): void
		{
			this.setButtonState(this.state);
		},

	},
	created() {
		this.$Bitrix.eventEmitter.subscribe('layout:updated', this.onLayoutUpdated);
	},
	beforeDestroy(): void
	{
		this.$Bitrix.eventEmitter.unsubscribe('layout:updated', this.onLayoutUpdated);
	},
	mounted() {
		this.renderButton();
	},
	updated() {
		this.renderButton();
	},
	watch: {
		state(newValue): void
		{
			this.setButtonState(newValue);
		},
	},
	template: `
		<div
			:class="$attrs.class"
			ref="buttonContainer"
			@click="executeAction">
		</div>
	`
};
