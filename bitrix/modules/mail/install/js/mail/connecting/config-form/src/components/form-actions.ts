import { defineComponent } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { useFormState } from '../state';
import { loc } from '../utils/loc';

// @vue/component
export const FormActions = defineComponent({
	name: 'form-actions',

	components: { UiButton },

	setup()
	{
		return {
			state: useFormState(),
			loc,
			AirButtonStyle,
		};
	},

	props: {
		isEditMode: { type: Boolean, default: false },
	},

	emits: ['save', 'cancel'],

	methods: {
		onSave(): void
		{
			this.$emit('save');
		},

		onCancel(): void
		{
			this.$emit('cancel');
		},
	},

	// language=Vue
	template: `
		<div class="mail-config-form__actions" data-test-id="mail_config-form__actions">
			<UiButton
				:text="isEditMode ? loc('MAIL_CONFIG_FORM_SAVE_BUTTON') : loc('MAIL_CONFIG_FORM_CONNECT_BUTTON')"
				:style="AirButtonStyle.FILLED"
				:loading="state.loading"
				:disabled="state.loading"
				:dataset="{ testId: 'mail_config-form__save_button' }"
				@click="onSave"
			/>
			<UiButton
				:text="loc('MAIL_CONFIG_FORM_CANCEL_BUTTON')"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:disabled="state.loading"
				:dataset="{ testId: 'mail_config-form__cancel_button' }"
				@click="onCancel"
			/>
		</div>
	`,
});
