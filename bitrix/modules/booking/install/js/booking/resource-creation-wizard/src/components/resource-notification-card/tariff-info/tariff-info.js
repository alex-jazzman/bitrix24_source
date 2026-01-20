import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { Set as IconSet } from 'ui.icon-set.api.core';

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
	data(): Object
	{
		return {
			IconSet,
			AlertColor,
			AlertIcon,
			AlertSize,
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
			:iconType="IconSet.BELL_1"
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
