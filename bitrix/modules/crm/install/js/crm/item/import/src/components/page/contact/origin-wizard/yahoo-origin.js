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

import {
	GeneralSettingsSection,
	DefaultValuesSection,
	ImportFileId,
	Encoding,
	Delimiter,
	DefaultContactType,
	DefaultSource,
	DefaultDescription,
	DefaultOpened,
	DefaultExportNew,
	DefaultResponsibleId,
} from '../../../wizard-steps/configure-import-settings-step';

export const YahooOrigin: BitrixVueComponentProps = {
	name: 'YahooOrigin',

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
		Delimiter,
		DefaultContactType,
		DefaultSource,
		DefaultDescription,
		DefaultOpened,
		DefaultExportNew,
		DefaultResponsibleId,
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
					<ImportFileId :model="importSettings" />
					<Encoding :model="importSettings" :encodings="dictionary.getEncodings()" />
					<Delimiter :model="importSettings" :delimiters="dictionary.getDelimiters()" />
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
						<DefaultResponsibleId
							:model="importSettings"
						/>
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
