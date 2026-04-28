import { BitrixVueComponentProps } from 'ui.vue3';

import { Dictionary } from '../../../../lib/model/dictionary';
import { ImportSettings } from '../../../../lib/model/import-settings';

import { Wizard } from '../../../wizard/wizard';
import {
	ConfigureImportSettingsStep,
	ConfigureFieldRatioStep,
	ConfigureDuplicateControlStep,
	ImportStep,
} from '../../../wizard-steps';

import { Delimiter as Hr } from '../../../layout';

import {
	GeneralSettingsSection,
	DefaultValuesSection,
	ImportFileId,
	Encoding,
	DefaultContactType,
	DefaultSource,
	DefaultDescription,
	DefaultOpened,
	DefaultExportNew,
	DefaultResponsibleId,
} from '../../../wizard-steps/configure-import-settings-step';

export const VcardOrigin: BitrixVueComponentProps = {
	name: 'VcardOrigin',

	components: {
		Wizard,
		ConfigureImportSettingsStep,
		ConfigureFieldRatioStep,
		ConfigureDuplicateControlStep,
		ImportStep,

		GeneralSettingsSection,
		DefaultValuesSection,
		ImportFileId,
		Encoding,
		DefaultContactType,
		DefaultSource,
		DefaultDescription,
		DefaultOpened,
		DefaultExportNew,
		DefaultResponsibleId,

		Hr,
	},

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
		dictionary: {
			type: Dictionary,
			required: true,
		},
	},

	template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId
						:model="importSettings"
						:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_VCARD')"
						:uploader-options="{
							acceptedFileTypes: [
								'.vcf',
							],
						}"
					/>
					<Encoding
						:encodings="dictionary.getEncodings()"
						:model="importSettings"
					/>
				</GeneralSettingsSection>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId :model="importSettings" />
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`,
};
