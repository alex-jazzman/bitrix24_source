import { defineStore } from 'ui.vue3.pinia';

import { type ViewerState } from './types';

// The state of the preview session owned by the picker window. It knows nothing
// about the page viewer singleton and never touches the network: loading the
// attributes and driving the viewer belong to the feature layer.
export const useViewerStore = defineStore('diskPickerViewer', {
	state: (): ViewerState => ({
		openingObjectId: null,
		open: false,
	}),
	getters: {
		// A preview is either being loaded or shown: a new one must not start.
		isBusy(): boolean
		{
			return this.openingObjectId !== null || this.open;
		},
	},
	actions: {
		startOpening(objectId: number): void
		{
			this.openingObjectId = objectId;
		},
		markOpen(): void
		{
			this.openingObjectId = null;
			this.open = true;
		},
		reset(): void
		{
			this.openingObjectId = null;
			this.open = false;
		},
	},
});
