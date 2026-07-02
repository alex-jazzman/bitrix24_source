import { onMounted, onUnmounted, ref } from 'ui.vue3';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Loc } from 'main.core';
import { DebugBarLayout } from '../debug-bar-layout/debug-bar-layout';
import { useDebugSessions, useDebugTraces, DebugSessionsList } from '../../../../features/debug-bar';
import { DEBUG_BAR_LABELS } from '../../constants';

import '../debug-bar-variables.css';
import './style.css';

export const DebugBarPanel = {
	name: 'DebugBarPanel',
	components: {
		DebugBarLayout,
		DebugSessionsList,
	},
	emits: ['close'],
	setup(props, { emit })
	{
		const { sessions, isLoading, loadSessions, deleteAllSessions } = useDebugSessions();
		const {
			traces,
			isLoadingTraces,
			isLoadingMoreTraces,
			hasMoreTraces,
			loadTraces,
			loadMoreTraces,
			clearTraces,
		} = useDebugTraces();
		const selectedSessionId = ref(null);
		const isFirstLoad = ref(true);
		const isMaximized = ref(false);

		function selectSession(sessionId: number): void
		{
			if (selectedSessionId.value === sessionId)
			{
				selectedSessionId.value = null;
				clearTraces();
			}
			else
			{
				selectedSessionId.value = sessionId;
				loadTraces(sessionId);
			}
		}

		async function loadSessionsWithAutoExpand(): Promise<void>
		{
			await loadSessions();

			if (isFirstLoad.value && sessions.value.length > 0)
			{
				isFirstLoad.value = false;
				const latestSession = sessions.value[0];
				selectedSessionId.value = latestSession.id;
				await loadTraces(latestSession.id);
			}
		}

		function closePanel(): void
		{
			emit('close');
		}

		function handleMaximize(): void
		{
			isMaximized.value = !isMaximized.value;
		}

		async function handleClear(): Promise<void>
		{
			MessageBox.confirm(
				Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_CONFIRM_MESSAGE),
				Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_CONFIRM_TITLE),
				async (messageBox) => {
					messageBox.close();

					const success = await deleteAllSessions();

					if (success)
					{
						clearTraces();
						selectedSessionId.value = null;
						await loadSessions();
					}
				},
				Loc.getMessage(DEBUG_BAR_LABELS.CLEAR_BUTTON),
				(messageBox) => {
					messageBox.close();
				},
				Loc.getMessage(DEBUG_BAR_LABELS.CANCEL_BUTTON),
			);
		}

		let refreshInterval = null;

		onMounted(() => {
			loadSessionsWithAutoExpand();

			refreshInterval = setInterval(() => {
				loadSessions();
			}, 5000);
		});

		onUnmounted(() => {
			if (refreshInterval)
			{
				clearInterval(refreshInterval);
			}
		});

		return {
			sessions,
			selectedSessionId,
			traces,
			isLoading,
			isLoadingTraces,
			isLoadingMoreTraces,
			hasMoreTraces,
			isMaximized,
			selectSession,
			loadMoreTraces,
			closePanel,
			handleMaximize,
			handleClear,
		};
	},
	template: `
		<DebugBarLayout
			:is-loading="isLoading"
			:is-maximized="isMaximized"
			@close="closePanel"
			@maximize="handleMaximize"
			@clear="handleClear"
		>
			<DebugSessionsList
				:sessions="sessions"
				:selected-session-id="selectedSessionId"
				:traces="traces"
				:is-loading-traces="isLoadingTraces"
				:has-more-traces="hasMoreTraces"
				:is-loading-more-traces="isLoadingMoreTraces"
				@select-session="selectSession"
				@load-more-traces="loadMoreTraces"
			/>
		</DebugBarLayout>
	`,
};
