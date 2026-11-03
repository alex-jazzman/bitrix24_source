import { BInput, InputDesign } from 'ui.system.input.vue';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/title-input.css';

// @vue/component
export const TitleInput = {
	name: 'TitleInput',
	components: { BInput },
	props:
	{
		modelValue: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			required: true,
		},
		maxLength: {
			type: [Number, null],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		return { InputDesign };
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
	},
	mounted()
	{
		this.$refs.titleInput.focus();
	},
	methods:
	{
		onInput(event: Event)
		{
			const control = event.target;

			// BInput has no maxlength prop and forwards no attributes to its control, so the
			// limit is applied to the control the event came from.
			if (this.maxLength !== null && control.value.length > this.maxLength)
			{
				control.value = control.value.slice(0, this.maxLength);
			}

			this.$emit('update:modelValue', control.value);
		},
	},
	// The testid sits on the only root node, so a consumer that hangs its own one on the
	// component replaces it instead of adding a second identifier. The class lands on the same
	// node: it carries the metrics of the field and the line under it.
	template: `
		<BInput
			v-if="isAirDesignEnabled"
			ref="titleInput"
			class="bx-im-chat-forms-title-input__field"
			:modelValue="modelValue"
			:placeholder="placeholder"
			:design="InputDesign.Naked"
			stretched
			data-testid="im-chat-form-title-input"
			@input="onInput"
		/>
		<div v-else class="bx-im-chat-forms-title-input__container" data-testid="im-chat-form-title-input">
			<input
				:value="modelValue"
				:placeholder="placeholder"
				@input="onInput"
				:maxlength="maxLength"
				class="bx-im-chat-forms-title-input__input"
				ref="titleInput"
			/>
		</div>
	`,
};
