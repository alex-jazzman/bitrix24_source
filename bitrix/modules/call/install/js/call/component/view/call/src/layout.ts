import { defineComponent } from 'ui.vue3';

import { useUiStore } from 'call.store';
import type { UiStoreInstance, UiState } from 'call.store';

import { CallMainLayout } from './layout/main';
import { CallLoaderLayout } from './layout/loader';
import { CallErrorLayout } from './layout/error';

import './css/call.css';

const LOADING_STATES: ReadonlySet<UiState> = new Set<UiState>(['Idle', 'Preparing', 'Connecting', 'Reconnecting']);

export const CallLayout = defineComponent({
	name: 'CallLayout',
	components: {
		CallMainLayout,
		CallLoaderLayout,
		CallErrorLayout,
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
		isLoading(): boolean
		{
			return LOADING_STATES.has(this.uiState);
		},
		isError(): boolean
		{
			return this.uiState === 'Error';
		},
		isCopilotActive(): boolean
		{
			return this.uiStore.isCopilotActive;
		},
	},
	template: /* HTML */`
		<div
			class="call-layout"
			:class="{ 'call-layout--copilot': isCopilotActive }"
			data-testid="call-layout"
			:data-test-state="uiState.toLowerCase()"
		>
			<CallErrorLayout v-if="isError" />
			<CallLoaderLayout v-else-if="isLoading" />
			<CallMainLayout v-else />
		</div>
	`,
});
