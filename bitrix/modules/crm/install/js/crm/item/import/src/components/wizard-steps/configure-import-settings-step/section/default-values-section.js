import { BitrixVueComponentProps } from 'ui.vue3';
import { SettingsSection } from '../../../layout';

export const DefaultValuesSection: BitrixVueComponentProps = {
	name: 'DefaultValuesSection',

	components: {
		SettingsSection,
	},

	template: `
		<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_DEFAULT_VALUES')">
			<slot />
		</SettingsSection>
	`,
};
