import { BitrixVueComponentProps } from 'ui.vue3';
import { ImportSettings } from '../../../../../lib/model/import-settings';

import 'ui.system.alert';
import { TemporaryAlert, TemporarySystemDesign } from '../../../../layout';

import './requisite-hint-set.css';

// todo: Remove after adding dependency on ui 26.200.0
const AlertComponent = BX?.UI?.System?.Alert?.Vue?.Alert || TemporaryAlert;
const AlertDesignEnum = BX?.UI?.System?.Alert?.AlertDesign || TemporarySystemDesign;

export const RequisiteHintSet: BitrixVueComponentProps = {
	name: 'RequisiteHintSet',

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
	},

	components: {
		Alert: AlertComponent,
	},

	data(): Object
	{
		return {
			AlertDesignEnum,
		};
	},

	methods: {
		isImportRequisite(): boolean
		{
			return Boolean(this.importSettings.get('isImportRequisite'));
		},

		isPresence(group: string): boolean
		{
			const requisiteFields = this.importSettings
				.getEntityFields()
				.filter((field) => field.group === group);

			return requisiteFields.length > 0;
		},

		isRequisitePresetAssociate(): boolean
		{
			return Boolean(this.importSettings.get('isRequisitePresetAssociate'));
		},

		isRequisitePresetAssociateById(): boolean
		{
			return Boolean(this.importSettings.get('isRequisitePresetAssociateById'));
		},

		isRequisitePresetUseDefault(): boolean
		{
			return Boolean(this.importSettings.get('isRequisitePresetUseDefault'));
		},

		getFieldCaption(id: string): ?string
		{
			return this.importSettings
				.getEntityFields()
				.find((field) => field.id === id)
				?.name
			;
		},

		getNameFieldRequiredHint(): string
		{
			return this.getHint('NAME_FIELD_REQUIRED', {
				'#RQ_NAME#': this.getFieldCaption('RQ_NAME'),
			});
		},

		getIdFieldRequiredHint(): string
		{
			return this.getHint('ID_FIELD_REQUIRED', {
				'#RQ_ID#': this.getFieldCaption('RQ_ID'),
			});
		},

		getPresetIdFieldRequiredHint(): string
		{
			return this.getHint('PRESET_ID_FIELD_REQUIRED', {
				'#RQ_PRESET_ID#': this.getFieldCaption('RQ_PRESET_ID'),
			});
		},

		getAssociatePresetEnabledHint(): string
		{
			return this.getHint('ASSOCIATE_PRESET_ENABLED');
		},

		getPresetNameFieldRequiredHint(): string
		{
			return this.getHint('PRESET_NAME_FIELD_REQUIRED', {
				'#RQ_PRESET_NAME#': this.getFieldCaption('RQ_PRESET_NAME'),
			});
		},

		getDefaultPresetFallbackHint(): string
		{
			return this.getHint('DEFAULT_PRESET_FALLBACK');
		},

		getDefaultPresetUsedHint(): string
		{
			return this.getHint('DEFAULT_PRESET_USED');
		},

		getAddressFieldRequiredHint(): string
		{
			const addressFieldPattern = /^RQ_RQ_ADDR_TYPE\|\d+$/;
			const addressFieldCaptions = this.importSettings
				.getEntityFields()
				.filter((field) => addressFieldPattern.test(field.id))
				.map((field) => field.name);

			return this.getHint('ADDRESS_FIELD_REQUIRED', {
				'#RQ_RQ_ADDR_TYPE#': addressFieldCaptions.join(', '),
			});
		},

		getBankDetailsFieldRequiredHint(): string
		{
			return this.getHint('BANK_DETAILS_FIELD_REQUIRED', {
				'#BD_NAME#': this.getFieldCaption('BD_NAME'),
			});
		},

		getBankDetailsUniqueIdHint(): string
		{
			return this.getHint('BANK_DETAILS_UNIQUE_ID', {
				'#BD_ID#': this.getFieldCaption('BD_ID'),
			});
		},

		getHint(code: string, replace: Object = {}): string
		{
			const replaceValues = replace;
			replaceValues['\\[bold\\]'] = '<b>';
			replaceValues['\\[/bold\\]'] = '</b>';

			return this.$Bitrix.Loc.getMessage(`CRM_ITEM_IMPORT_RQ_HELP_${code}`, replaceValues);
		},
	},

	template: `
		<div class="crm-item-import__requisite-help" v-if="isImportRequisite() && isPresence('requisite')">
			<Alert
				:design="AlertDesignEnum.tinted"
				:hasCloseButton="false"
				leftImage="/bitrix/js/crm/item/import/dist/images/settings.png"
			>
				<div class="crm-item-import__requisite-help-hint-group-list">
					<div class="crm-item-import__requisite-help-hint-group-item">
						<p v-html="getNameFieldRequiredHint()" />
						<p v-html="getIdFieldRequiredHint()" />
					</div>

					<template v-if="isRequisitePresetAssociate()">
						<template v-if="isRequisitePresetAssociateById()">
							<div class="crm-item-import__requisite-help-hint-group-item">
								<p v-html="getPresetIdFieldRequiredHint()" />
								<p v-if="isRequisitePresetUseDefault()" v-html="getDefaultPresetFallbackHint()" />
							</div>
						</template>
						<template v-else>
							<div class="crm-item-import__requisite-help-hint-group-item">
								<p v-html="getAssociatePresetEnabledHint()" />
								<p v-html="getPresetNameFieldRequiredHint()" />
								<p v-if="isRequisitePresetUseDefault()" v-html="getDefaultPresetFallbackHint()" />
							</div>
						</template>
					</template>
					<template v-else>
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getDefaultPresetUsedHint()" />
						</div>
					</template>

					<template v-if="isPresence('address')">
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getAddressFieldRequiredHint()" />
						</div>
					</template>

					<template v-if="isPresence('bankDetail')">
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getBankDetailsFieldRequiredHint()" />
							<p v-html="getBankDetailsUniqueIdHint()" />
						</div>
					</template>
				</div>
			</Alert>
		</div>
	`,
};
