import { defineStore } from 'ui.vue3.pinia';

export const useDebugBarStore = defineStore('bizprocdesigner-editor-debug-bar', {
	state: () => ({
		isVisible: false,
		isLoading: false,
		sessions: [],
		selectedSessionId: null,
		traces: [],
		isLoadingTraces: false,
		isLoadingMoreTraces: false,
		tracesPage: 1,
		hasMoreTraces: false,
	}),
	getters:
		{
			hasErrorSessions(state): boolean
			{
				return state.sessions.some((s) => s.hasErrors);
			},

			totalSessions(state): number
			{
				return state.sessions.length;
			},

			errorSessionsCount(state): number
			{
				return state.sessions.filter((s) => s.hasErrors).length;
			},
		},
	actions:
		{
			toggleVisibility(visible: boolean | null): void
			{
				this.isVisible = visible === undefined ? !this.isVisible : visible;
			},

			show(): void
			{
				this.isVisible = true;
			},

			hide(): void
			{
				this.isVisible = false;
				this.reset();
			},

			reset(): void
			{
				this.selectedSessionId = null;
				this.traces = [];
				this.tracesPage = 1;
				this.hasMoreTraces = false;
			},
		},
});
