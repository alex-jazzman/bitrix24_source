import './style.css';

import { mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';

import {
	useNodeSettingsStore,
	CONSTRUCTION_TYPES,
	CONSTRUCTION_LABELS,
	type ConstructionLabels,
	// eslint-disable-next-line no-unused-vars
	type Construction,
} from '../../../../entities/node-settings';

// @vue/component
export const SelectBooleanType = {
	name: 'select-boolean-type',
	props:
	{
		/** @type Construction */
		construction:
		{
			type: Object,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		selectedType:
		{
			get(): string
			{
				return this.construction.type;
			},
			set(value: string): void
			{
				this.selectBooleanType(value);
			},
		},
		booleanTypes(): Array<$Values<typeof CONSTRUCTION_TYPES>>
		{
			return [
				CONSTRUCTION_TYPES.AND_CONDITION,
				CONSTRUCTION_TYPES.OR_CONDITION,
			];
		},
		constructionLabels(): ConstructionLabels
		{
			return CONSTRUCTION_LABELS;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['selectBooleanType']),
		onClick(booleanType: string): void
		{
			this.selectedType = booleanType;
			this.selectBooleanType(this.construction, booleanType);
		},
	},
	template: `
		<div class="node-settings-boolean-type-switcher">
			<span
				v-for="booleanType in booleanTypes"
				class="node-settings-boolean-type-switcher_tab"
				:class="{ '--selected': selectedType === booleanType }"
				@click="onClick(booleanType)"
			>
				{{ getMessage(constructionLabels[booleanType]) }}
			</span>
		</div>
	`,
};
