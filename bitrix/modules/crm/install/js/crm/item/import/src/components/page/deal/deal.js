import { BitrixVueComponentProps } from 'ui.vue3';

import { Dictionary } from '../../../lib/model/dictionary';
import { ImportSettings } from '../../../lib/model/import-settings';

import { Wizard } from '../../wizard/wizard';
import {
	ConfigureImportSettingsStep,
	ConfigureFieldRatioStep,
	ImportStep,
} from '../../wizard-steps/index';

import {
	GeneralSettingsSection,
	DefaultValuesSection,
	ImportFileId,
	Encoding,
	DefaultResponsibleId,
	NameFormat,
	Delimiter,
	IsFirstRowHasHeaders,
	IsSkipEmptyColumns,
} from '../../wizard-steps/configure-import-settings-step';

import { Page, DownloadExampleAlert, Delimiter as Hr } from '../../layout/index';

import './deal.css';

export const Deal: BitrixVueComponentProps = {
	name: 'Deal',

	components: {
		Wizard,
		ConfigureImportSettingsStep,
		ConfigureFieldRatioStep,
		ImportStep,

		Page,
		DownloadExampleAlert,
		Hr,

		GeneralSettingsSection,
		DefaultValuesSection,
		ImportFileId,
		Encoding,
		DefaultResponsibleId,
		NameFormat,
		Delimiter,
		IsFirstRowHasHeaders,
		IsSkipEmptyColumns,
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
		<Page class="--deal">
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
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
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
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`,
};
