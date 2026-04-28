import { BitrixVueComponentProps } from 'ui.vue3';

import { Dictionary } from '../../../lib/model/dictionary';
import { ImportSettings } from '../../../lib/model/import-settings';

import { Page, DownloadExampleAlert, Delimiter as Hr } from '../../layout';
import { Wizard } from '../../wizard/wizard';
import {
	ConfigureImportSettingsStep,
	ConfigureFieldRatioStep,
	ConfigureDuplicateControlStep,
	ImportStep,
} from '../../wizard-steps/index';

import {
	GeneralSettingsSection,
	RequisiteSettingsSection,
	DefaultValuesSection,
	ImportFileId,
	Encoding,
	DefaultResponsibleId,
	NameFormat,
	Delimiter,
	IsFirstRowHasHeaders,
	IsSkipEmptyColumns,
} from '../../wizard-steps/configure-import-settings-step';

import './company.css';

export const Company: BitrixVueComponentProps = {
	name: 'Company',

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
		DefaultResponsibleId,
		NameFormat,
		Delimiter,
		IsFirstRowHasHeaders,
		IsSkipEmptyColumns,

		Page,
		DownloadExampleAlert,
		Hr,
	},

	template: `
		<Page class="--company">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
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
		</Page>
	`,
};
