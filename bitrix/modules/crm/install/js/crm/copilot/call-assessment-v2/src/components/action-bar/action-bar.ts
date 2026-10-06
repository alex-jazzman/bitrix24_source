import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { defineComponent } from 'ui.vue3';
import './action-bar.css';

export const ActionBar = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ActionBar',
	components: {
		UiButton,
	},
	props: {
		variant: {
			type: String,
			default: 'edit',
			validator: (value: string): boolean => ['edit', 'create', 'view'].includes(value),
		},
		generateDisabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'save',
		'cancel',
		'generate',
		'edit',
	],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	template: `
		<div class="crm-call-assessment-v2-action-bar">
			<template v-if="variant === 'create'">
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_CREATE_GENERATE_BUTTON')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED_BITRIX_GPT"
					:disabled="generateDisabled"
					@click="$emit('generate')"
				/>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_CANCEL')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="$emit('cancel')"
				/>
			</template>
			<template v-else-if="variant === 'view'">
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_EDIT')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.OUTLINE"
					@click="$emit('edit')"
				/>
			</template>
			<template v-else>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_SAVE')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					@click="$emit('save')"
				/>
				<UiButton
					:text="loc('CRM_CALL_ASSESSMENT_V2_BUTTON_CANCEL')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="$emit('cancel')"
				/>
			</template>
		</div>
	`,
});
