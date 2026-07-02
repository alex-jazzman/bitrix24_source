import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { Outline } from 'ui.icon-set.api.core';

import { UiAlerts, AlertColor, AlertSize, AlertIcon } from 'booking.component.ui-alerts';
import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
const { mapGetters: mapResourceGetters } = createNamespacedHelpers('resource-creation-wizard');

// @vue/component
export const TariffInfo = {
	name: 'TariffInfo',
	components: {
		UiResourceWizardItem,
		UiAlerts,
	},
	setup(): {
		AlertColor: typeof AlertColor,
		AlertIcon: typeof AlertIcon,
		AlertSize: typeof AlertSize,
		Outline: typeof Outline,
		}
	{
		return {
			AlertColor,
			AlertIcon,
			AlertSize,
			Outline,
		};
	},
	computed: {
		...mapResourceGetters({
			showLicenseWarning: 'showLicenseWarning',
		}),
	},
	template: `
		<UiResourceWizardItem
			:title="loc('BRCW_NOTIFICATION_CARD_TARIFF_INFO_TITLE')"
			:iconType="Outline.NOTIFICATION"
			:description="loc('BRCW_NOTIFICATION_CARD_TARIFF_INFO_DESCRIPTION')"
			helpDeskType="TariffInfo"
		>
			<UiAlerts
				v-if="showLicenseWarning"
				:text="loc('BRCW_NOTIFICATION_CARD_TARIFF_INFO_ALERT')"
				:color="AlertColor.WARNING"
				:icon="AlertIcon.DANGER"
				:size="AlertSize.XS"
			/>
		</UiResourceWizardItem>
	`,
};
