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
	DefaultContactType,
	DefaultDescription,
	DefaultExportNew,
	DefaultOpened,
	DefaultResponsibleId,
	DefaultSource,
	DefaultValuesSection,
	Delimiter,
	Encoding,
	GeneralSettingsSection,
	ImportFileId,
	IsFirstRowHasHeaders,
	IsSkipEmptyColumns,
	NameFormat,
	RequisiteSettingsSection,
} from '../../../wizard-steps/configure-import-settings-step';

import { Delimiter as Hr, DownloadExampleAlert, Page } from '../../../layout';

export const CustomOrigin: BitrixVueComponentProps = {
	name: 'CustomOrigin',

	components: {
		Wizard,
		ConfigureImportSettingsStep,
		ConfigureFieldRatioStep,
		ConfigureDuplicateControlStep,
		ImportStep,

		GeneralSettingsSection,
		RequisiteSettingsSection,
		DefaultValuesSection,

		ImportFileId,
		Encoding,
		NameFormat,
		Delimiter,
		IsFirstRowHasHeaders,
		IsSkipEmptyColumns,

		DefaultContactType,
		DefaultSource,
		DefaultDescription,
		DefaultOpened,
		DefaultExportNew,
		DefaultResponsibleId,

		Page,
		DownloadExampleAlert,
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
					<ImportFileId :model="importSettings" />
					<DownloadExampleAlert
						:import-settings="importSettings"
					/>
					<Encoding 
						:encodings="dictionary.getEncodings()" 
						:model="importSettings" 
					/>
					<Delimiter 
						:delimiters="dictionary.getDelimiters()" 
						:model="importSettings" 
					/>
					<IsSkipEmptyColumns
						:model="importSettings"
					/>
					<IsFirstRowHasHeaders
						:model="importSettings"
					/>
					<NameFormat
						:name-formats="dictionary.getNameFormats()"
						:model="importSettings"
					/>
				</GeneralSettingsSection>
				<RequisiteSettingsSection
					:import-settings="importSettings"
					:requisite-presets="dictionary.getRequisitePresets()"
				/>
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
