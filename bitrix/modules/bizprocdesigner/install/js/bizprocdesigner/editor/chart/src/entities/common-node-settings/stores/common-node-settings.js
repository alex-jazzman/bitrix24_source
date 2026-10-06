import { defineStore } from 'ui.vue3.pinia';

import { NODE_SETTINGS_TABS } from '../../../shared/constants';
import { type Block } from '../../../shared/types';

type SettingsState = {
	block: Block;
	selectedTabId: string;
	shouldShowWithTransition: boolean;
};

type ShowSettingsOptions = {
	withTransition?: boolean;
};

export const useCommonNodeSettingsStore = defineStore('bizprocdesigner-common-node-settings-store', {
	state: (): SettingsState => ({
		block: null,
		selectedTabId: NODE_SETTINGS_TABS.basic,
		shouldShowWithTransition: false,
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
		// The flag describes this one show: an agent-driven show turns it on, the panel drops it as
		// soon as the fade has played (finishShowTransition), and a show that passes no options
		// turns it off anyway.
		showSettings(block: Block, options: ShowSettingsOptions): void
		{
			this.block = block;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
			this.shouldShowWithTransition = options?.withTransition === true;
		},
		/**
		 * Drops the transition flag once the panel has played the fade it was asked for. Left
		 * standing it would fade in every later render of the content of the same node — a repeated
		 * renderControls() raises and drops isLoading, and the user asked for no animation there.
		 */
		finishShowTransition(): void
		{
			this.shouldShowWithTransition = false;
		},
		hideSettings(): void
		{
			this.block = null;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
			this.shouldShowWithTransition = false;
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
