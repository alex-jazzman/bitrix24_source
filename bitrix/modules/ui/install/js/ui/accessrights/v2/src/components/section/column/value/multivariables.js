import { Type } from 'main.core';
import type { Variable, VariableCollection } from '../../../../store/model/access-rights-model';
import type { AccessRightValue } from '../../../../store/model/user-groups-model';
import {
	cutLongTitle,
	getMultipleSelectedVariablesHintHtml,
	getMultipleSelectedVariablesTitle,
	getSelectedVariables,
	isUseGroupHeadValuesInHintByVariables,
} from '../../../../utils';
import { Selector } from '../../value/multivariables/selector';
import { SelectedHint } from './../../../util/selected-hint';

export const Multivariables = {
	name: 'Multivariables',
	components: {
		SelectedHint,
		Selector,
	},
	props: {
		// value for selector is id of a selected variable
		value: {
			/** @type AccessRightValue */
			type: Object,
			required: true,
		},
	},
	inject: ['section', 'userGroup', 'right'],
	data(): Object {
		return {
			isSelectorShown: false,
		};
	},
	computed: {
		isAllSelected(): boolean {
			return this.value.values.has(this.right.allSelectedCode);
		},
		hasVariablesSource(): boolean {
			return this.right.variablesSource !== null;
		},
		selectedVariables(): VariableCollection {
			return getSelectedVariables(this.right.variables, this.value.values, this.isAllSelected);
		},
		selectedValuesCount(): number {
			// "all" and "nothing" are states of the cell with a caption of their own, not picked values;
			// "nothing" falls back to emptyValue when nothingSelectedValue is not set, see getNothingSelectedValue
			const stateCodes = new Set([
				this.right.allSelectedCode,
				...(this.right.nothingSelectedValue ?? []),
				...(this.right.emptyValue ?? []),
			]);

			return [...this.value.values].filter((value: string) => !stateCodes.has(value)).length;
		},
		currentAlias(): ?string {
			return this.$store.getters['accessRights/getSelectedVariablesAlias'](this.section.sectionCode, this.value.id, this.value.values);
		},
		title(): string {
			if (Type.isString(this.currentAlias))
			{
				return this.currentAlias;
			}

			if (this.isAllSelected)
			{
				return this.right.allSelectedTitle ?? this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ALL_ACCEPTED');
			}

			// a source gives the dictionary only up to a threshold, so a role can hold values
			// no name arrived for - and it must not read as an empty cell
			if (this.hasVariablesSource && this.selectedValuesCount > 0)
			{
				return this.sourceModeTitle;
			}

			if (this.selectedVariables.size <= 0)
			{
				return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_ADD');
			}

			return getMultipleSelectedVariablesTitle(this.selectedVariables);
		},
		// repeats getMultipleSelectedVariablesTitle on purpose: here the count comes from the picked values,
		// not from the named ones, and that utility is shared with other modules, so it must keep its own contract
		sourceModeTitle(): string {
			if (this.selectedVariables.size === 0)
			{
				return this.$Bitrix.Loc.getMessage(
					'JS_UI_ACCESSRIGHTS_V2_SELECTED_COUNT',
					{ '#COUNT#': this.selectedValuesCount },
				);
			}

			const lastVariable: Variable = [...this.selectedVariables.values()].pop();

			if (this.selectedValuesCount === 1)
			{
				return lastVariable.title;
			}

			return this.$Bitrix.Loc.getMessage(
				'JS_UI_ACCESSRIGHTS_V2_HAS_SELECTED_ITEMS',
				{
					'#FIRST_ITEM_NAME#': cutLongTitle(lastVariable.title),
					'#COUNT_REST_ITEMS#': this.selectedValuesCount - 1,
				},
			);
		},
		hintHtml(): string {
			if (this.right.group && this.isUseGroupHeadValuesInHint)
			{
				return getMultipleSelectedVariablesHintHtml(this.parentSelectedVariables, this.title, this.parentRight.variables, true);
			}

			// under "all" the dictionary of a source holds an arbitrary subset gathered by other roles,
			// and the list would read as the whole set
			if (this.hasVariablesSource && this.isAllSelected)
			{
				return '';
			}

			return getMultipleSelectedVariablesHintHtml(
				this.selectedVariables,
				this.hintTitle,
				this.right.variables,
				false,
				this.hintRestItemsCount,
			);
		},
		hintRestItemsCount(): number {
			if (!this.hasVariablesSource)
			{
				return 0;
			}

			return Math.max(this.selectedValuesCount - this.selectedVariables.size, 0);
		},
		hintTitle(): string {
			if (Type.isString(this.right.hintTitle))
			{
				return this.right.hintTitle;
			}

			return this.$Bitrix.Loc.getMessage('JS_UI_ACCESSRIGHTS_V2_SELECTED_ITEMS_TITLE');
		},
		parentRight() {
			if (!this.right.group)
			{
				return null;
			}

			return this.$store.getters['accessRights/getAccessRightItemById'](this.section.sectionCode, this.right.group);
		},
		parentValue(): AccessRightValue
		{
			return this.$store.getters['userGroups/getAccessRightValue'](this.userGroup, this.section.sectionCode, this.parentRight.id);
		},
		parentSelectedVariables(): VariableCollection {
			return getSelectedVariables(this.parentRight.variables, this.parentValue.values, false);
		},
		isUseGroupHeadValuesInHint(): boolean {
			return isUseGroupHeadValuesInHintByVariables(this.selectedVariables)
		},
	},
	methods: {
		showSelector(): void {
			this.isSelectorShown = true;
		},
		setValues({ values }): void {
			this.$store.dispatch('userGroups/setAccessRightValues', {
				sectionCode: this.section.sectionCode,
				userGroupId: this.userGroup.id,
				valueId: this.value.id,
				values,
			});
		},
	},
	template: `
		<SelectedHint
			v-if="hintHtml"
			:html="hintHtml"
			class='ui-access-rights-v2-column-item-text-link'
			@click="showSelector"
			data-testid="ui-accessrights-multivariables-cell"
			v-bind="$attrs"
		>
			{{ title }}
		</SelectedHint>
		<div
			v-else
			class='ui-access-rights-v2-column-item-text-link ui-access-rights-v2-text-ellipsis'
			@click="showSelector"
			:title="title"
			data-testid="ui-accessrights-multivariables-cell"
			v-bind="$attrs"
		>
			{{ title }}
		</div>
		<Selector
			v-if="isSelectorShown" 
			:initial-values="value.values"
			@close="isSelectorShown = false"
			@apply="setValues"
		/>
	`,
};
