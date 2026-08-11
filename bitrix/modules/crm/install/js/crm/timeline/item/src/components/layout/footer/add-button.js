import { Outline } from 'ui.icon-set.api.core';
import {
	AirButtonStyle,
	Button as UiButton,
	ButtonSize,
	ButtonState as UiButtonState,
} from 'ui.vue3.components.button';

import { Action } from '../../../action';
import { ButtonState } from '../../enums/button-state';

export const AdditionalButtonIcon = Object.freeze({
	NOTE: 'note',
	PRINT: 'print',
	SCRIPT: 'script',
	QR_CODE: 'qr-code',
	VIDEOCONFERENCE: 'videoconference',
	DOTS: 'dots',
});

export const AdditionalButtonColor = Object.freeze({
	DEFAULT: 'default',
	PRIMARY: 'primary',
});

const ICON_MAP = Object.freeze({
	[AdditionalButtonIcon.NOTE]: Outline.NOTE,
	[AdditionalButtonIcon.PRINT]: Outline.PRINTER,
	[AdditionalButtonIcon.SCRIPT]: Outline.TRANSCRIPTION,
	[AdditionalButtonIcon.QR_CODE]: Outline.QR_CODE,
	[AdditionalButtonIcon.VIDEOCONFERENCE]: Outline.RECORD_VIDEO,
	[AdditionalButtonIcon.DOTS]: Outline.MORE_L,
});

const STYLE_MAP = Object.freeze({
	[AdditionalButtonColor.DEFAULT]: AirButtonStyle.PLAIN_NO_ACCENT,
	[AdditionalButtonColor.PRIMARY]: AirButtonStyle.PLAIN_ACCENT,
});

const UI_BUTTON_STATE_MAP = Object.freeze({
	[ButtonState.LOADING]: UiButtonState.WAITING,
	[ButtonState.AI_LOADING]: UiButtonState.AI_WAITING,
});

export const AdditionalButton = {
	name: 'AdditionalButton',
	components: {
		UiButton,
	},
	inheritAttrs: false,
	props: {
		id: {
			type: String,
			required: false,
			default: '',
		},
		title: {
			type: String,
			required: false,
			default: '',
		},
		iconName: {
			type: String,
			required: false,
			default: '',
			validator(value: string): boolean
			{
				return Object.values(AdditionalButtonIcon).indexOf(value) > -1;
			},
		},
		color: {
			type: String,
			required: false,
			default: AdditionalButtonColor.DEFAULT,
			validator(value: string): boolean
			{
				return Object.values(AdditionalButtonColor).indexOf(value) > -1;
			},
		},
		state: {
			type: String,
			required: false,
			default: ButtonState.DEFAULT,
		},
		action: Object,
	},

	setup(): Object
	{
		return {
			ButtonSize,
		};
	},

	data(): Object
	{
		return {
			currentState: this.state,
		};
	},
	watch: {
		state(value: string): void
		{
			this.setButtonState(value);
		},
	},
	computed: {
		mappedIcon(): ?string
		{
			return ICON_MAP[this.iconName] || null;
		},
		mappedStyle(): string
		{
			return STYLE_MAP[this.color] || AirButtonStyle.PLAIN_NO_ACCENT;
		},
		buttonDataset(): Object
		{
			return this.iconName
				? { testid: `crm-timeline-additional-button-${this.iconName}` }
				: {};
		},
		isHidden(): boolean
		{
			return this.currentState === ButtonState.HIDDEN;
		},
		isDisabled(): boolean
		{
			return this.currentState === ButtonState.DISABLED;
		},
		isLoading(): boolean
		{
			return this.uiButtonState === UiButtonState.WAITING;
		},
		uiButtonState(): ?string
		{
			return UI_BUTTON_STATE_MAP[this.currentState] || null;
		},
	},

	created(): void
	{
		this.$Bitrix.eventEmitter.subscribe('layout:updated', this.onLayoutUpdated);
	},

	beforeUnmount(): void
	{
		this.$Bitrix.eventEmitter.unsubscribe('layout:updated', this.onLayoutUpdated);
	},

	methods: {
		setButtonState(value: string): void
		{
			if (this.currentState !== value)
			{
				this.currentState = value;
			}
		},

		setDisabled(disabled: boolean): void
		{
			this.setButtonState(disabled ? ButtonState.DISABLED : ButtonState.DEFAULT);
		},

		setLoading(loading: boolean): void
		{
			this.setButtonState(loading ? ButtonState.LOADING : ButtonState.DEFAULT);
		},

		onLayoutUpdated(): void
		{
			this.setButtonState(this.state);
		},

		executeAction(): void
		{
			if (this.isDisabled || this.uiButtonState)
			{
				return;
			}

			if (this.action)
			{
				const action = new Action(this.action);
				action.execute(this);
			}
		},
	},

	// language=Vue
	template: `
		<div
			v-if="!isHidden"
			:title="title"
			class="crm-timeline__additional-button"
		>
			<UiButton
				:text="title"
				:leftIcon="mappedIcon"
				:size="ButtonSize.LARGE"
				:style="mappedStyle"
				:state="uiButtonState"
				:disabled="isDisabled"
				:loading="isLoading"
				:dataset="buttonDataset"
				collapsed
				@click="executeAction"
			/>
		</div>
	`,
};
