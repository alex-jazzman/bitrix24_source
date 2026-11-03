import { Type } from 'main.core';
import '../../../../css/value/dependent-variables/popup-content.css';
import 'ui.icon';
import 'ui.icon-set.actions';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import type { Preset, Variable, VariableCollection } from '../../../../store/model/access-rights-model';
import { Locator } from '../popup-header/locator';
import { MasterSwitcher } from '../popup-header/master-switcher';
import { CUSTOM_TAB_ID, Tabs } from './tabs';
import { PresetTabContent } from './preset-tab-content';
import { SelectList } from './select-list';

export const PopupContent = {
	name: 'DependentVariablesPopupContent',
	emits: ['apply'],
	components: { Locator, MasterSwitcher, Tabs, PresetTabContent, SelectList, Icon },
	props: {
		// value for selector is id of a selected variable
		initialValues: {
			type: Set,
			default: () => new Set(),
		},
		showMasterBadge: {
			type: Boolean,
			default: true,
		},
		userGroup: {
			type: Object,
			default: null,
		},
	},
	data(): Object {
		const initial = this.computeInitialState();

		return {
			selectedPresetId: initial.selectedPresetId,
			customValues: initial.customValues,
		};
	},
	inject: ['section', 'right', 'redefineApply'],
	computed: {
		presetVariableIds(): Set<string> {
			const ids: Set<string> = new Set();
			for (const preset of this.right.presets.values())
			{
				for (const variableId of preset.variableIds)
				{
					ids.add(variableId);
				}
			}

			return ids;
		},
		presetTabs(): Array<{ id: string, title: string, icon: ?string }> {
			const result = [];
			for (const preset of this.right.presets.values())
			{
				result.push({
					id: preset.id,
					title: preset.title,
					icon: preset.icon ?? null,
				});
			}

			return result;
		},
		hasCustomTab(): boolean {
			for (const variableId of this.right.variables.keys())
			{
				if (!this.presetVariableIds.has(variableId))
				{
					return true;
				}
			}

			return false;
		},
		activeTab(): string {
			return this.selectedPresetId ?? CUSTOM_TAB_ID;
		},
		activePreset(): ?Preset {
			if (!this.selectedPresetId)
			{
				return null;
			}

			return this.right.presets.get(this.selectedPresetId) ?? null;
		},
		effectiveValues(): Set<string> {
			if (this.activePreset)
			{
				return new Set(this.activePreset.variableIds);
			}

			return this.customValues;
		},
		isMinMaxValuesSet(): boolean {
			return !Type.isNil(this.right.minValue) && !Type.isNil(this.right.maxValue);
		},
		isMasterChecked(): boolean {
			if (this.selectedPresetId)
			{
				return true;
			}

			if (!this.isMinMaxValuesSet)
			{
				return this.customValues.size > 0;
			}

			for (const variableId of this.customValues)
			{
				if (!this.right.minValue.has(variableId))
				{
					return true;
				}
			}

			return false;
		},
		variablesShownInList(): VariableCollection {
			// Shallow copy is enough: only Map keys are removed below, the Variable values are never mutated.
			const result: VariableCollection = new Map(this.right.variables);

			if (this.isMinMaxValuesSet)
			{
				// minValue items are the floor — hidden from the list in both modes
				// (multi-mode pins them on; single-mode treats them as the master-OFF fallback).
				for (const variableId of this.right.minValue)
				{
					result.delete(variableId);
				}
			}

			for (const [variableId: string, variable: Variable] of result)
			{
				if (variable.secondary || this.presetVariableIds.has(variableId))
				{
					result.delete(variableId);
				}
			}

			return result;
		},
		secondaryVariables(): VariableCollection {
			const result: VariableCollection = new Map();

			for (const [variableId, variable] of this.right.variables)
			{
				if (variable.secondary && !this.presetVariableIds.has(variableId))
				{
					result.set(variableId, variable);
				}
			}

			return result;
		},
		nothingSelectedValues(): ?Set<string> {
			return this.$store.getters['accessRights/getNothingSelectedValue'](this.section.sectionCode, this.right.id);
		},
		iconSet(): IconSet {
			return IconSet;
		},
		isSingleSelect(): boolean {
			return this.right.type === 'single_dependent_variables';
		},
		radioGroupName(): string {
			return `ui-access-rights-v2-radio-${this.section.sectionCode}-${this.right.id}`;
		},
		customTabId(): string {
			return CUSTOM_TAB_ID;
		},
	},
	mounted()
	{
		this.redefineApply(() => {
			this.apply();
		});
	},
	methods: {
		addValue(variableId: string): void {
			const variable: ?Variable = this.right.variables.get(variableId);
			if (!variable)
			{
				return;
			}

			this.customValues.add(variableId);

			if (!Type.isNil(variable.requires))
			{
				for (const requiredId of variable.requires)
				{
					this.customValues.add(requiredId);
				}
			}

			if (!Type.isNil(variable.conflictsWith))
			{
				// remove old variables that conflict with variable we want to add
				for (const conflictId of variable.conflictsWith)
				{
					this.customValues.delete(conflictId);
				}
			}

			for (const otherVariable of this.right.variables.values())
			{
				if (otherVariable.id === variableId)
				{
					continue;
				}

				// if one of the current variables conflicts with newly added variables, we remove old variable
				if (this.customValues.has(otherVariable.id) && !Type.isNil(otherVariable.conflictsWith))
				{
					for (const conflictId of otherVariable.conflictsWith)
					{
						if (this.customValues.has(conflictId))
						{
							this.customValues.delete(otherVariable.id);
						}
					}
				}
			}
		},
		removeValue(variableId: string): void {
			this.customValues.delete(variableId);

			for (const otherVariableId of this.customValues)
			{
				if (otherVariableId === variableId)
				{
					continue;
				}

				const otherVariable: ?Variable = this.right.variables.get(otherVariableId);
				if (!otherVariable)
				{
					continue;
				}

				if (!Type.isNil(otherVariable.requires) && otherVariable.requires.has(variableId))
				{
					this.customValues.delete(otherVariableId);
				}
			}
		},
		setMaxValue(): void {
			if (!this.isMinMaxValuesSet)
			{
				return;
			}

			for (const variableId of this.right.maxValue)
			{
				const presetId: ?string = this.findPresetIdForVariable(variableId);
				if (presetId !== null)
				{
					this.selectTab(presetId);

					return;
				}
			}

			this.selectTab(CUSTOM_TAB_ID);

			if (this.isSingleSelect)
			{
				// pick the first maxValue id that is NOT pinned in minValue —
				// otherwise master ON would select an item hidden from the list and stay visually OFF.
				for (const variableId of this.right.maxValue)
				{
					if (!this.right.minValue.has(variableId))
					{
						this.selectRadio(variableId);
						break;
					}
				}

				return;
			}

			for (const variableId of this.right.maxValue)
			{
				this.addValue(variableId);
			}
		},
		setMinValue(): void {
			if (!this.isMinMaxValuesSet)
			{
				return;
			}

			for (const variableId of this.right.minValue)
			{
				const presetId: ?string = this.findPresetIdForVariable(variableId);
				if (presetId !== null)
				{
					this.selectTab(presetId);

					return;
				}
			}

			this.selectTab(CUSTOM_TAB_ID);

			if (this.isSingleSelect)
			{
				const firstMinId: ?string = [...this.right.minValue].find((id) => this.right.variables.has(id)) ?? null;
				this.customValues = firstMinId === null ? new Set() : new Set([firstMinId]);

				return;
			}

			this.customValues = new Set();
			for (const variableId of this.right.minValue)
			{
				this.addValue(variableId);
			}
		},
		apply(): void {
			let values = this.effectiveValues;
			if (values.size <= 0)
			{
				values = this.nothingSelectedValues;
			}

			this.$emit('apply', {
				values,
			});
		},
		computeInitialState(): { selectedPresetId: ?string, customValues: Set<string> } {
			const stored: Set<string> = new Set();
			for (const value of this.initialValues)
			{
				if (this.right.variables.has(value))
				{
					stored.add(value);
				}
			}

			const ownedByPreset: Set<string> = new Set();
			for (const preset of this.right.presets.values())
			{
				for (const variableId of preset.variableIds)
				{
					ownedByPreset.add(variableId);
				}

				if (
					stored.size === preset.variableIds.length
					&& preset.variableIds.every((variableId) => stored.has(variableId))
				)
				{
					return { selectedPresetId: preset.id, customValues: new Set() };
				}
			}

			const customValues: Set<string> = new Set();
			for (const value of stored)
			{
				if (!ownedByPreset.has(value))
				{
					customValues.add(value);
				}
			}

			if (this.right.type === 'single_dependent_variables' && customValues.size > 1)
			{
				const [first] = customValues;
				customValues.clear();
				customValues.add(first);
			}

			return { selectedPresetId: null, customValues };
		},
		findPresetIdForVariable(variableId: string): ?string {
			for (const preset of this.right.presets.values())
			{
				if (preset.variableIds.includes(variableId))
				{
					return preset.id;
				}
			}

			return null;
		},
		toggleValue(variableId: string): void {
			if (this.customValues.has(variableId))
			{
				this.removeValue(variableId);
			}
			else
			{
				this.addValue(variableId);
			}
		},
		selectRadio(variableId: string): void {
			if (this.right.variables.has(variableId))
			{
				this.customValues = new Set([variableId]);
			}
		},
		selectTab(tabId: string): void {
			if (tabId === CUSTOM_TAB_ID || !this.right.presets.has(tabId))
			{
				this.selectedPresetId = null;

				return;
			}

			if (tabId === this.selectedPresetId)
			{
				return;
			}

			this.selectedPresetId = tabId;
		},
	},
	// data attributes are needed for e2e automated tests
	template: `
		<div>
			<Locator/>
			<div class="ui-access-rights-v2-dv-popup--body">
				<MasterSwitcher
					:is-checked="isMasterChecked"
					:show-badge="showMasterBadge"
					:is-interactive="isMinMaxValuesSet"
					@check="setMaxValue"
					@uncheck="setMinValue"
				>
					<slot name="role-title"/>
				</MasterSwitcher>
				<Tabs
					v-if="presetTabs.length > 0"
					:tabs="presetTabs"
					:has-custom-tab="hasCustomTab"
					:active-tab="activeTab"
					@select-tab="selectTab"
				/>
				<PresetTabContent
					v-if="activeTab !== customTabId && activePreset"
					:preset="activePreset"
					:user-group="userGroup"
				/>
				<SelectList
					v-else-if="isSingleSelect"
					mode="single"
					:variables="variablesShownInList"
					:custom-values="customValues"
					:group="radioGroupName"
					@select-variable="selectRadio"
				/>
				<SelectList
					v-else
					mode="multi"
					:variables="variablesShownInList"
					:custom-values="customValues"
					:secondary-variables="secondaryVariables"
					@toggle-variable="toggleValue"
					@enable-secondary="addValue"
					@disable-secondary="removeValue"
				/>
			</div>
			<div
				v-if="right.dependentVariablesPopupHint"
				class="ui-access-rights-v2-dv-popup--hint"
			>
				<Icon :name="iconSet.INFO_1" :color="'var(--ui-color-palette-gray-40)'" :size="20"></Icon>
				<span>{{ right.dependentVariablesPopupHint }}</span>
			</div>
		</div>
	`,
};
