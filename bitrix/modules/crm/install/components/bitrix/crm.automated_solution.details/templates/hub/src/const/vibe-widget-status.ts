// States of the embedded home page settings. Pending is the skeleton of the first save that creates the page:
// there is nothing to load yet, the slider reloads after the save.
export const VibeWidgetStatus = {
	Hidden: 'hidden',
	Pending: 'pending',
	Loading: 'loading',
	Ready: 'ready',
	Empty: 'empty',
	Error: 'error',
} as const;

export type VibeWidgetStatusValue = typeof VibeWidgetStatus[keyof typeof VibeWidgetStatus];
