import { BitrixVueComponentProps } from 'ui.vue3';
import { Loc } from 'main.core';

import { ImportSettings } from '../../../lib/model/import-settings';
import { SettingsSection, ErrorAlert, WarningAlert, TagSelector, TagSelectorOption, Table } from '../../layout';

import { StepEventId } from '../../../lib/constant/step-event-id';

import { RequisiteHintSet } from './hint/requisite-hint-set/requisite-hint-set';
import './configure-field-ratio-step.css';

export const ConfigureFieldRatioStep: BitrixVueComponentProps = {
	name: 'ConfigureFieldRatioStep',

	components: {
		SettingsSection,
		WarningAlert,
		ErrorAlert,
		TagSelector,
		Table,
		RequisiteHintSet,
	},

	eventId: StepEventId.ConfigureFieldRatioStep,
	title: Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_FIELD_RATIO_STEP'),

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
	},

	methods: {
		async beforeNext(): Promise<boolean>
		{
			return true;
		},
	},

	computed: {
		fields(): Array
		{
			const columns = this.importSettings
				.getFileHeaders()
				.map((fileHeader): TagSelectorOption => {
					return {
						title: fileHeader.title,
						value: fileHeader.columnIndex,
					};
				})
			;

			const fieldBindings = this.importSettings.getFieldBindings();
			const requiredFields = this.importSettings.getRequiredFieldIds();

			return this.importSettings
				.getEntityFields()
				.map((entityField) => {
					return {
						fieldName: entityField.id,
						fieldCaption: entityField.name,
						options: columns,
						model: fieldBindings,
						required: requiredFields.includes(entityField.id),
						nullable: true,
						placeholder: Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_BINDINGS_FIELD_PLACEHOLDER'),
						display: 'row',
						readonly: Boolean(entityField.readonly),
					};
				});
		},

		isFewColumnsFound(): boolean
		{
			return this.importSettings.getFileHeaders().length <= 1;
		},
	},

	template: `
		<div class="crm-item-import__wizard-step__configure-field-ratio-step">
			<slot name="before" />
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_SECTION_TITLE_BINDINGS')">
				<RequisiteHintSet :import-settings="importSettings" />
				<ErrorAlert v-if="isFewColumnsFound">
					{{ this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_FEW_COLUMNS_FOUND_ALERT') }}
				</ErrorAlert>
				<TagSelector
					v-for="field in fields"
					v-bind="field"
				/>
			</SettingsSection>
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_SECTION_TITLE_IMPORT_PREVIEW')">
				<Table v-bind="importSettings.getPreviewTable()" />
			</SettingsSection>
		</div>
	`,
};
