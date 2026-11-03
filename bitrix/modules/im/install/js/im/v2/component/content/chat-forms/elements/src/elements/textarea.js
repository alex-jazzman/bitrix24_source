import { BInput } from 'ui.system.input.vue';

import 'ui.design-tokens.air';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/textarea.css';

// BInput renders a textarea instead of an input as soon as more than one row is asked for.
const AIR_ROWS_QUANTITY = 3;

// @vue/component
export const TextareaInput = {
	name: 'TextareaInput',
	components: { BInput },
	props:
	{
		value: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			required: true,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		border: {
			type: Boolean,
			required: false,
			default: true,
		},
		rounded: {
			type: Boolean,
			required: false,
			default: true,
		},
	},
	emits: ['input'],
	setup(): Object
	{
		return { AIR_ROWS_QUANTITY };
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		containerClasses(): { [className: string]: boolean }
		{
			return { '--no-border': !this.border, '--rounded': this.rounded };
		},
	},
	methods:
	{
		onInput(event: Event)
		{
			this.$emit('input', event.target.value);
		},
	},
	// The design system owns the border and the corner radius of a field, so the border and
	// rounded flags shape the legacy markup only. ariaLabel is declared instead of being left
	// to fall through: an undeclared camelCase attribute reaches the DOM as "arialabel".
	// In air the field keeps the plain design of the design system, the way the selects of the
	// form do, so BInput draws its border itself and names no design of its own here. The class
	// on the same node carries the surface the field stands on.
	template: `
		<BInput
			v-if="isAirDesignEnabled"
			class="bx-im-chat-forms-textarea__field"
			:modelValue="value"
			:placeholder="placeholder"
			:ariaLabel="ariaLabel"
			:rowsQuantity="AIR_ROWS_QUANTITY"
			resize="none"
			data-testid="im-chat-form-textarea"
			@input="onInput"
		/>
		<div
			v-else
			class="bx-im-content-create-chat__textarea_container"
			:class="containerClasses"
			data-testid="im-chat-form-textarea"
		>
			<div class="ui-ctl ui-ctl-textarea ui-ctl-w100 ui-ctl-no-resize">
				<textarea
					:value="value"
					:placeholder="placeholder"
					@input="onInput"
					class="bx-im-content-create-chat__textarea ui-ctl-element"
				></textarea>
			</div>
		</div>
	`,
};
