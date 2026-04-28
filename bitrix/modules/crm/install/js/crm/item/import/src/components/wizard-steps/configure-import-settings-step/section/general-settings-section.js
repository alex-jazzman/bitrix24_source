import { BitrixVueComponentProps } from 'ui.vue3';

import { SettingsSection } from '../../../layout';

export const GeneralSettingsSection: BitrixVueComponentProps = {
	name: 'GeneralSettingsSection',

	components: {
		SettingsSection,
	},

	template: `
		<SettingsSection
			:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_GENERAL_SETTINGS')"
			:is-delimiter-enabled="false"
		>
			<slot />
		</SettingsSection>
	`,
};
