import { defineStore } from 'ui.vue3.pinia';

import { type PickerSource } from './types';

// Disk sources shown in the sidebar. Its loading/error state is fully
// independent of the main feed: a failed sources request must not remove the
// main output.
export const useSourceStore = defineStore('diskPickerSource', {
	state: (): {
		sources: PickerSource[],
		sourcesLoading: boolean,
		sourcesError: string | null,
	} => ({
		sources: [],
		sourcesLoading: false,
		sourcesError: null,
	}),
	actions: {
		setSources(sources: PickerSource[]): void
		{
			this.sources = [...sources];
		},
		setLoading(loading: boolean): void
		{
			this.sourcesLoading = loading;
		},
		setError(code: string | null): void
		{
			this.sourcesError = code;
		},
		reset(): void
		{
			this.sources = [];
			this.sourcesLoading = false;
			this.sourcesError = null;
		},
	},
});
