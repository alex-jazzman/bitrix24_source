import 'ui.system.radiobutton';
import { RadioButton } from 'ui.system.radiobutton.vue';
import { Switcher } from 'ui.vue3.components.switcher';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import { Checkbox } from 'ui.system.checkbox.vue';
import { CheckboxSize } from 'ui.system.checkbox';
import { hint } from 'ui.vue3.directives.hint';
import { createAirSwitcherOptions, createHintOptions } from '../../../../utils';
import type { Variable } from '../../../../store/model/access-rights-model';

// Shared list of dependent-variable rows for both single-select (radio) and multi-select (checkbox + secondary
// switchers) modes. Row markup, hints and data-* attributes are identical between modes; only the row control
// differs, and multi-mode additionally renders the secondary switchers.
export const SelectList = {
	name: 'DependentVariablesSelectList',
	emits: ['selectVariable', 'toggleVariable', 'enableSecondary', 'disableSecondary'],
	components: { RadioButton, Switcher, Icon, Checkbox },
	directives: { hint },
	props: {
		mode: {
			type: String,
			required: true,
			validator: (value: string) => ['single', 'multi'].includes(value),
		},
		variables: {
			type: Map,
			required: true,
		},
		customValues: {
			type: Set,
			required: true,
		},
		group: {
			type: String,
			default: '',
		},
		secondaryVariables: {
			type: Map,
			default: () => new Map(),
		},
	},
	computed: {
		iconSet(): IconSet {
			return IconSet;
		},
		checkboxSize(): Object {
			return CheckboxSize;
		},
		isSingle(): boolean {
			return this.mode === 'single';
		},
		secondarySwitcherOptions(): Object {
			return createAirSwitcherOptions();
		},
	},
	methods: {
		getVariableHintOptions(variable: Variable): Object {
			return createHintOptions(variable.hint);
		},
		onRowClick(variable: Variable): void {
			this.$emit(this.isSingle ? 'selectVariable' : 'toggleVariable', variable.id);
		},
		onRadioUpdate(variableId: string, value: boolean): void {
			if (value)
			{
				this.$emit('selectVariable', variableId);
			}
		},
	},
	template: `
		<div class="ui-access-rights-v2-dv-popup--line-container">
			<div
				v-for="[variableId, variable] in variables"
				:key="variableId"
				class="ui-access-rights-v2-dv-popup--line --clickable"
				:class="{ '--checked': customValues.has(variable.id) }"
				@click="onRowClick(variable)"
			>
				<div class="ui-access-rights-v2-dv-popup--line-title">
					<span class="ui-access-rights-v2-text-ellipsis" :title="variable.title">{{ variable.title }}</span>
					<Icon v-if="variable.hint" :name="iconSet.INFO_1" :color="'var(--ui-color-palette-gray-40)'" :size="20" v-hint="getVariableHintOptions(variable)" @click.stop></Icon>
				</div>
				<div v-if="isSingle" class="ui-access-rights-v2-dv-popup--line-radio" @click.stop>
					<RadioButton
						:model-value="customValues.has(variable.id)"
						:group="group"
						:data-accessrights-variable-id="variable.id"
						@update:model-value="(value) => onRadioUpdate(variable.id, value)"
					/>
				</div>
				<div v-else class="ui-access-rights-v2-dv-popup--line-checkbox" @click.stop>
					<Checkbox
						:model-value="customValues.has(variable.id)"
						:size="checkboxSize.Md"
						:data-accessrights-variable-id="variable.id"
						@update:model-value="$emit('toggleVariable', variable.id)"
					/>
				</div>
			</div>
			<template v-if="!isSingle">
				<div
					v-for="[variableId, variable] in secondaryVariables"
					:key="variableId"
					class="ui-access-rights-v2-dv-popup--line --secondary"
				>
					<Switcher
						:is-checked="customValues.has(variable.id)"
						@check="$emit('enableSecondary', variable.id)"
						@uncheck="$emit('disableSecondary', variable.id)"
						:options="secondarySwitcherOptions"
						style="padding-right: 5px;"
						:data-accessrights-variable-id="variable.id"
					/>
					<span class="ui-access-rights-v2-text-ellipsis">{{ variable.title }}</span>
				</div>
			</template>
		</div>
	`,
};
