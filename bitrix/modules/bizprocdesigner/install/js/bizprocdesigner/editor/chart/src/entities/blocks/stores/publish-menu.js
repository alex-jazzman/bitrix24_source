import { defineStore } from 'ui.vue3.pinia';

export type PublishMenuState = {
	holdCount: number,
};

/**
 * The publish menu kept open from outside the button. The onboarding points at an item of the menu, and a
 * publication started from an item runs over the menu it was chosen in, so the holds are counted: while at
 * least one of them lasts, neither a click of the page nor the buttons of the tour take the menu away.
 */
export const usePublishMenuStore = defineStore('bizprocdesigner-editor-publish-menu', {
	state: (): PublishMenuState => ({
		holdCount: 0,
	}),
	getters: {
		isHeldOpen(): boolean
		{
			return this.holdCount > 0;
		},
	},
	actions: {
		hold(): void
		{
			this.holdCount += 1;
		},
		// A hold given back more times than it was taken must not leave the menu owing the next holder.
		release(): void
		{
			this.holdCount = Math.max(this.holdCount - 1, 0);
		},
	},
});
