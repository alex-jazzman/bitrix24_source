import { defineStore } from 'ui.vue3.pinia';

import { NODE_SETTINGS_TABS } from '../../../shared/constants';
import { type Block } from '../../../shared/types';

type SettingsState = {
	block: Block;
	selectedTabId: string;
};

export const useCommonNodeSettingsStore = defineStore('bizprocdesigner-common-node-settings-store', {
	state: (): SettingsState => ({
		block: null,
		selectedTabId: NODE_SETTINGS_TABS.basic,
	}),
	getters:
	{
		isVisible: (state) => {
			return state.block !== null;
		},
	},
	actions:
	{
		isCurrentBlock(blockId: string): boolean
		{
			return this.block?.id === blockId;
		},
		showSettings(block: Block): void
		{
			this.block = block;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
		},
		hideSettings(): void
		{
			this.block = null;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
		},
		setRuleForm(form: HTMLElement): void
		{
			this.ruleForm = form;
		},
		setRuleSaving(isSaving: boolean): void
		{
			this.isRuleSaving = isSaving;
		},
	},
});
