import { defineComponent } from 'ui.vue3';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { useFormState } from '../state';
import { loc } from '../utils/loc';

// @vue/component
export const MicrosoftConnection = defineComponent({
	name: 'microsoft-connection',

	components: { BInput },

	setup()
	{
		return {
			state: useFormState(),
			InputSize,
			InputDesign,
			loc,
		};
	},

	// language=Vue
	template: `
		<div v-if="state.connection.isOAuth" data-test-id="mail_config-form__microsoft-connection">
			<BInput
				:label="loc('MAIL_CONFIG_FORM_UPN_LABEL')"
				:size="InputSize.Lg"
				:design="InputDesign.DEFAULT"
				v-model="state.connection.userPrincipalName"
				data-test-id="mail_config-form__microsoft-upn_field"
			/>
			<div
				class="mail-config-form__field-description"
				data-test-id="mail_config-form__microsoft-upn_hint"
			>{{ loc('MAIL_CONFIG_FORM_UPN_HINT') }}</div>
		</div>
	`,
});
