import { Loc } from 'main.core';
import { AppLayout } from '../layout/app-layout';
import { ImportConfig } from '../layout/import-config';
import { ImportPreview } from '../steps/import-preview';
import { DatasetPropertiesStep } from '../steps/dataset-properties';
import { FieldsSettingsStep } from '../steps/fields-settings';
import { RelatedExternalDatasetsStep } from '../steps/related-external-datasets';
import { BaseApp } from './base-app';

export const SystemDatasetApp = {
	extends: BaseApp,
	data(): Object
	{
		return {
			steps: {
				properties: {
					disabled: false,
					valid: true,
				},
				fields: {
					disabled: false,
					valid: true,
					disabledElements: {
						name: true,
						type: true,
					},
				},
			},
			shownPopups: {},
		};
	},
	computed: {
		sourceCode(): string
		{
			return 'system';
		},
		sourceType(): string
		{
			return 'system';
		},
		isEditMode(): boolean
		{
			return true;
		},
		isSaveEnabled(): boolean
		{
			return false;
		},
		emptyStateText(): string
		{
			return Loc.getMessage('DATASET_IMPORT_SYSTEM_PREVIEW_EMPTY_TABLE', { '[br]': '\n' }) ?? '';
		},
	},
	methods: {
		onSliderClose()
		{
			// No unsaved changes check for system datasets — just close.
		},
	},
	components: {
		AppLayout,
		ImportConfig,
		ImportPreview,
		DatasetPropertiesStep,
		FieldsSettingsStep,
		RelatedExternalDatasetsStep,
	},
	// language=Vue
	template: `
		<AppLayout
			ref="appLayout"
			:save-locked="true"
			:is-edit-mode="true"
			:hide-buttons="true"
		>
			<template v-slot:left-panel>
				<ImportConfig>
					<div class="ui-alert ui-alert-default ui-alert-icon-info">
						<span class="ui-alert-message dataset-import-system-hint__message">
							<span class="dataset-import-system-hint__title">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SYSTEM_READONLY_HINT_TITLE') }}</span>
							<span class="dataset-import-system-hint__description">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_SYSTEM_READONLY_HINT') }}</span>
						</span>
					</div>
					<DatasetPropertiesStep
						:is-open-initially="true"
						:disabled="false"
						:reserved-names="[]"
						:name-max-length="230"
						ref="propertiesStep"
						:dataset-source-code="'system'"
						:source-type="sourceType"
					/>
					<FieldsSettingsStep
						:is-open-initially="true"
						:disabled="false"
						:disabled-elements="steps.fields.disabledElements"
						:source-type="sourceType"
						:title="$Bitrix.Loc.getMessage('DATASET_IMPORT_SYSTEM_FIELDS_TITLE')"
						:hint="''"
						ref="fieldsStep"
					/>
					<RelatedExternalDatasetsStep
						:is-open-initially="true"
						:disabled="false"
						:is-superset-ready="appParams.isSupersetReady"
						:source-type="sourceType"
						ref="externalDatasetsStep"
					/>
				</ImportConfig>
			</template>
			<template v-slot:right-panel>
				<ImportPreview
					:empty-state-text="emptyStateText"
					:needShowHeadersWithEmptyRows="false"
					:source-type="sourceType"
				/>
			</template>
		</AppLayout>
	`,
};
