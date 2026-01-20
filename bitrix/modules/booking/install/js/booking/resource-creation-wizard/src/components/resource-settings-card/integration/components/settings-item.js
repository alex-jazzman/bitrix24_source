import { UiErrorMessage } from 'booking.component.ui-error-message';

// @vue/component
export const SettingsItem = {
	name: 'IntegrationSettingsItem',
	components: {
		UiErrorMessage,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		errorMessage: {
			type: String,
			default: null,
		},
	},
	template: `
		<div class="resource-creation-wizard__integration-block-settings-item">
			<div class="resource-creation-wizard__integration-block-settings-item-info">
				<div class="resource-creation-wizard__integration-block-settings-item-info-title">
					{{ title }}
				</div>
				<div class="resource-creation-wizard__integration-block-settings-item-info-description">
					{{ description }}
				</div>
			</div>
			<slot/>
			<UiErrorMessage v-if="errorMessage" :message="errorMessage"/>
		</div>
	`,
};
