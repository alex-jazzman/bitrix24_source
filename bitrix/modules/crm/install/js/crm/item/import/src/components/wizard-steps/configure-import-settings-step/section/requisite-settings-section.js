import { BaseEvent } from 'main.core.events';
import { BitrixVueComponentProps } from 'ui.vue3';
import { ImportSettings } from '../../../../lib/model/import-settings';

import { SettingsSection } from '../../../layout';

import {
	IsImportRequisite,
	DefaultRequisitePresetId,
	IsRequisitePresetAssociate,
	IsRequisitePresetAssociateById,
	IsRequisitePresetUseDefault,
} from '../index';

export const RequisiteSettingsSection: BitrixVueComponentProps = {
	name: 'RequisiteSettingsSection',

	props: {
		importSettings: {
			type: ImportSettings,
			require: true,
		},
		requisitePresets: {
			type: Array,
			required: true,
		},
	},

	components: {
		SettingsSection,

		IsImportRequisite,
		DefaultRequisitePresetId,
		IsRequisitePresetAssociate,
		IsRequisitePresetAssociateById,
		IsRequisitePresetUseDefault,
	},

	data(): Object
	{
		return {
			isImportRequisite: this.importSettings.get('isImportRequisite'),
		};
	},

	mounted(): any
	{
		this.importSettings.subscribeValueChanged('isImportRequisite', this.handleIsImportRequisiteChange);
	},

	beforeUnmount(): any
	{
		this.importSettings.unsubscribeValueChanged('isImportRequisite', this.handleIsImportRequisiteChange);
	},

	methods: {
		handleIsImportRequisiteChange(event: BaseEvent): void
		{
			const data: { oldValue: ?boolean, newValue: ?boolean } = event.getData();
			this.isImportRequisite = data.newValue;

			if (this.isImportRequisite)
			{
				void this.$nextTick(() => {
					const element = this.$refs.section?.$el || this.$refs.section;
					if (element)
					{
						element.scrollIntoView({
							behavior: 'smooth',
							block: 'end',
						});
					}
				});
			}
		},
	},

	template: `
		<SettingsSection
			:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_REQUISITE')"
			ref="section"
		>
			<IsImportRequisite
				:model="importSettings"
			/>
			<DefaultRequisitePresetId
				v-if="isImportRequisite"
				:requisite-presets="requisitePresets"
				:model="importSettings"
			/>
			<IsRequisitePresetAssociate
				v-if="isImportRequisite"
				:model="importSettings"
			/>
			<IsRequisitePresetAssociateById
				v-if="isImportRequisite"
				:model="importSettings"
			/>
			<IsRequisitePresetUseDefault
				v-if="isImportRequisite"
				:model="importSettings"
			/>
		</SettingsSection>
	`,
};
