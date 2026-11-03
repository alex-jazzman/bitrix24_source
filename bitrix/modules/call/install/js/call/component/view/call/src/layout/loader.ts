import { defineComponent } from 'ui.vue3';

import { useUiStore } from 'call.store';
import type { UiStoreInstance, UiState } from 'call.store';
import type { LocFunction } from 'call.plugin.loc';

export const CallLoaderLayout = defineComponent({
	name: 'CallLoaderLayout',
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { uiStore: UiStoreInstance }
	{
		return {
			uiStore: useUiStore(),
		};
	},
	computed: {
		uiState(): UiState
		{
			return this.uiStore.uiState;
		},
		statusText(): string
		{
			const key = this.uiState === 'Reconnecting'
				? 'CALL_VIEW_CALL_STATUS_RECONNECTING'
				: 'CALL_VIEW_CALL_STATUS_CONNECTING';

			return (this.loc as LocFunction)(key);
		},
		testState(): string
		{
			return this.uiState.toLowerCase();
		},
	},
	template: /* HTML */`
		<div
			class="call-layout__loader"
			data-testid="call-layout-loader"
			:data-test-state="testState"
		>
			<div class="call-layout__loader-spinner"></div>
			<div class="call-layout__loader-status">{{ statusText }}</div>
		</div>
	`,
});
