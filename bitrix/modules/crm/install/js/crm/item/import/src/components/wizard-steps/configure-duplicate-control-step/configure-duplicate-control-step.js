import { BitrixVueComponentProps } from 'ui.vue3';
import { Loc } from 'main.core';
import { Dictionary } from '../../../lib/model/dictionary';
import { ImportSettings } from '../../../lib/model/import-settings';
import type { SelectOption } from '../../layout';

import {
	SettingsSection,
} from '../../layout';

import { DuplicateControlBehavior } from './field/duplicate-control-behavior';
import { DuplicateControlTargets } from './field/duplicate-control-targets';
import { DuplicateControlTargetsRequisite } from './field/duplicate-control-targets-requisite';

import { StepEventId } from '../../../lib/constant/step-event-id';

import './configure-duplicate-control-step.css';

export const ConfigureDuplicateControlStep: BitrixVueComponentProps = {
	name: 'ConfigureDuplicateControlStep',

	eventId: StepEventId.ConfigureDuplicateControlStep,
	title: Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_DUPLICATE_CONTROL_STEP'),

	components: {
		SettingsSection,
		DuplicateControlTargets,
		DuplicateControlBehavior,
		DuplicateControlTargetsRequisite,
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

	methods: {
		async beforeNext(): Promise<boolean>
		{
			return true;
		},
	},

	computed: {
		requisiteDuplicateControlTargets(): Array
		{
			if (!this.importSettings.get('isImportRequisite'))
			{
				return [];
			}

			return this.importSettings
				.getRequisiteDuplicateControlTargets()
				.map((requisiteDuplicateControlTarget) => {
					return {
						model: this.importSettings,
						targets: requisiteDuplicateControlTarget
							.fields
							.map((field): SelectOption => {
								return {
									title: field.fieldCaption,
									value: field.fieldId,
								};
							}),
						countryId: requisiteDuplicateControlTarget.countryId,
						countryCaption: requisiteDuplicateControlTarget.countryCaption,
					};
				});
		},
	},

	template: `
		<div class="crm-item-import__wizard-step__configure-duplicate-control-step">
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_DUPLICATE_CONTROL_SECTION_TITLE')">
				<DuplicateControlBehavior
					:behaviors="dictionary.getDuplicateControlBehaviors()"
					:is-duplicate-control-permitted="dictionary.isDuplicateControlPermitted()"
					:model="importSettings"
				/>
				<DuplicateControlTargets
					:targets="dictionary.getDuplicateControlTargets()"
					:model="importSettings"
				/>
				<template v-for="requisiteDuplicateControlTarget in requisiteDuplicateControlTargets">
					<DuplicateControlTargetsRequisite v-bind="requisiteDuplicateControlTarget"/>
				</template>
			</SettingsSection>
		</div>
	`,
};
