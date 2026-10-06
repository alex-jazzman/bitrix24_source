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

	computed: {
		// The field holds null while the profile of the account is unresolved. The input needs a
		// string, and anything typed here - clearing the field included - is a statement of the user
		// and replaces the unresolved state.
		userPrincipalName: {
			get(): string
			{
				return this.state.connection.userPrincipalName ?? '';
			},
			set(value: string): void
			{
				this.state.connection.userPrincipalName = value;
			},
		},
	},

	// language=Vue
	template: `
		<div v-if="state.connection.isOAuth" data-test-id="mail_config-form__microsoft-connection">
			<BInput
				:label="loc('MAIL_CONFIG_FORM_UPN_LABEL')"
				:size="InputSize.Lg"
				:design="InputDesign.DEFAULT"
				v-model="userPrincipalName"
				:disabled="state.migrationActive"
				data-test-id="mail_config-form__microsoft-upn_field"
			/>
			<div
				class="mail-config-form__field-description"
				data-test-id="mail_config-form__microsoft-upn_hint"
			>{{ loc('MAIL_CONFIG_FORM_UPN_HINT') }}</div>
		</div>
	`,
});
