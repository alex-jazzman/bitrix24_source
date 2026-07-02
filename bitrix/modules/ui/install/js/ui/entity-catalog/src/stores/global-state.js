import { defineStore } from 'ui.vue3.pinia';

export const useGlobalState = defineStore('global-state', {
	state: () => ({
		searchQuery: '',
		searchApplied: false,
		filtersApplied: false,
		currentGroup: null,
		shouldShowWelcomeStub: true,
	}),
});
