import { Outline } from 'ui.icon-set.api.core';
import { type BitrixVueComponentProps } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

export const TranscriptionState = {
	empty: 'empty',
	pending: 'pending',
	success: 'success',
	failed: 'failed',
};

// @vue/component
export const TranscriptionButton: BitrixVueComponentProps = {
	components: {
		UiButton,
	},
	props: {
		transcriptionState: {
			type: String,
			default: TranscriptionState.empty,
			validator: (value) => Object.values(TranscriptionState).includes(value),
		},
	},
	emits: ['click'],

	setup(): Object
	{
		return {
			ButtonSize,
			Outline,
		};
	},

	computed: {
		isPending(): boolean
		{
			return this.transcriptionState === TranscriptionState.pending;
		},

		isDisabled(): boolean
		{
			return this.isPending || this.transcriptionState === TranscriptionState.failed;
		},

		buttonStyle(): string
		{
			if (this.transcriptionState === TranscriptionState.empty || this.isPending)
			{
				return AirButtonStyle.FILLED_COPILOT;
			}

			if (this.transcriptionState === TranscriptionState.failed)
			{
				return AirButtonStyle.FILLED_ALERT;
			}

			return AirButtonStyle.OUTLINE_ACCENT_2;
		},
	},

	methods: {
		handleClick(): void
		{
			this.$emit('click');
		},
	},

	// Language=Vue3
	template: `
		<UiButton
			:leftIcon="Outline.TRANSCRIPTION"
			:size="ButtonSize.MEDIUM"
			:style="buttonStyle"
			:disabled="isDisabled"
			:loading="isPending"
			collapsed
			@click="handleClick"
		/>
	`,
};
