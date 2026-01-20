import { LocalizationMixin } from '../../mixins/localization-mixin';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';

// @vue/component
export const WizardNavigation = {
	components: {
		UiButton,
	},

	mixins: [LocalizationMixin],

	props: {
		isFirstStep: Boolean,
		isLastStep: Boolean,
		isSubmitting: Boolean,
		prevDisabled: Boolean,
		disabledContinueButton: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['prev-step', 'next-step', 'submit'],

	data(): Object
	{
		return {
			AirButtonStyle,
		};
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__wizard_navigation" data-test-id="mail_massconnect__wizard_navigation">
			<UiButton
				v-if="isLastStep"
				class="mail_massconnect__wizard_navigation_submit-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONNECT_BUTTON_TITLE')"
				:style="AirButtonStyle.FILLED"
				:waiting="isSubmitting"
				@click="$emit('submit')"
			/>
			<UiButton
				v-else
				class="mail_massconnect__wizard_navigation_next-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_CONTINUTE_BUTTON_TITLE')"
				:style="AirButtonStyle.FILLED"
				:disabled="disabledContinueButton"
				@click="$emit('next-step')"
			/>
			<UiButton
				v-if="!isFirstStep && !prevDisabled"
				class="mail_massconnect__wizard_navigation_prev-button"
				:text="loc('MAIL_MASSCONNECT_FORM_NAVIGATION_PANEL_BACK_BUTTON_TITLE')"
				:style="AirButtonStyle.PLAIN"
				@click="$emit('prev-step')"
			/>
		</div>
	`,
};
