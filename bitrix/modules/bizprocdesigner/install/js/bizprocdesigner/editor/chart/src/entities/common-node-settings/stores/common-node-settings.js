import { defineStore } from 'ui.vue3.pinia';

type SettingsState = {
	isLoading: boolean;
};

export const useCommonNodeSettingsStore = defineStore('bizprocdesigner-common-node-settings-store', {
	state: (): SettingsState => ({
		isLoading: false,
		block: null,
	}),
	getters:
	{
		isVisible: (state) => {
			return state.block !== null;
		},
	},
	actions:
	{
		isCurrentBlock(blockId): boolean
		{
			return this.block?.id === blockId;
		},
		showSettings(block): void
		{
			this.block = block;
		},
		hideSettings(): void
		{
			this.block = null;
		},
	},
});
