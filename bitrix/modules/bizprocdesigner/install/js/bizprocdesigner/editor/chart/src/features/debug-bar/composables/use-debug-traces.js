import { Loc } from 'main.core';
import { ref, VueRefValue } from 'ui.vue3';
import { DEBUG_BAR_ERROR_MESSAGES, DEBUG_BAR_CONFIG, debugBarApi } from '../../../entities/debug-bar';
import { useToastStore } from '../../../shared/stores';
import { handleResponseError } from '../../../shared/utils';

export function useDebugTraces(): {traces: VueRefValue}
{
	const traces = ref([]);
	const isLoadingTraces = ref(false);
	const isLoadingMoreTraces = ref(false);
	const currentTracesPage = ref(1);
	const hasMoreTraces = ref(false);
	const currentSessionId = ref(null);
	const toastStore = useToastStore();

	async function loadTraces(sessionId: number): Promise<void>
	{
		if (!sessionId)
		{
			return;
		}

		currentSessionId.value = sessionId;
		currentTracesPage.value = 1;
		isLoadingTraces.value = true;

		try
		{
			const response = await debugBarApi.loadTraces({
				debugSessionId: sessionId,
				page: 1,
			});

			if (response)
			{
				traces.value = response;
				hasMoreTraces.value = response.length >= DEBUG_BAR_CONFIG.DEFAULT_TRACES_PAGE_SIZE;
			}
			else
			{
				traces.value = [];
				hasMoreTraces.value = false;
				toastStore.addWarning(Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TRACES_ERROR));
			}
		}
		catch (error)
		{
			handleResponseError(error);
		}
		finally
		{
			isLoadingTraces.value = false;
		}
	}

	async function loadMoreTraces(): Promise<void>
	{
		if (!currentSessionId.value || isLoadingMoreTraces.value)
		{
			return;
		}

		isLoadingMoreTraces.value = true;
		const nextPage = currentTracesPage.value + 1;

		try
		{
			const response = await debugBarApi.loadTraces({
				debugSessionId: currentSessionId.value,
				page: nextPage,
			});

			if (response && response.length > 0)
			{
				traces.value = [...traces.value, ...response];
				currentTracesPage.value = nextPage;
				hasMoreTraces.value = response.length >= DEBUG_BAR_CONFIG.DEFAULT_TRACES_PAGE_SIZE;
			}
			else
			{
				hasMoreTraces.value = false;
			}
		}
		catch (error)
		{
			handleResponseError(error);
		}
		finally
		{
			isLoadingMoreTraces.value = false;
		}
	}

	function clearTraces()
	{
		traces.value = [];
		currentTracesPage.value = 1;
		hasMoreTraces.value = false;
		currentSessionId.value = null;
	}

	return {
		traces,
		isLoadingTraces,
		isLoadingMoreTraces,
		hasMoreTraces,
		loadTraces,
		loadMoreTraces,
		clearTraces,
	};
}
