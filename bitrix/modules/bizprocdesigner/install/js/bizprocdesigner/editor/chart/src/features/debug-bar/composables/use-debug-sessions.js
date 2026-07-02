import { Loc } from 'main.core';
import { ref } from 'ui.vue3';
import { useToastStore } from '../../../shared/stores';
import { diagramStore } from '../../../entities/blocks';
import { debugBarApi, DEBUG_BAR_CONFIG, DEBUG_BAR_ERROR_MESSAGES } from '../../../entities/debug-bar';
import { handleResponseError } from '../../../shared/utils';

export function useDebugSessions()
{
	const sessions = ref([]);
	const isLoading = ref(false);
	const toastStore = useToastStore();

	async function loadSessions(): Promise<void>
	{
		isLoading.value = true;

		try
		{
			const templateId = diagramStore().templateId;

			if (!templateId || templateId === 0)
			{
				toastStore.addWarning(Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TEMPLATE_NOT_FOUND));

				return;
			}

			const response = await debugBarApi.loadSessions({
				templateId,
				limit: DEBUG_BAR_CONFIG.DEFAULT_LIMIT,
				offset: DEBUG_BAR_CONFIG.DEFAULT_OFFSET,
			});

			if (response)
			{
				sessions.value = response;
			}
			else
			{
				toastStore.addWarning(Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.SESSIONS_LOAD_ERROR));
			}
		}
		catch (error)
		{
			handleResponseError(error);
		}
		finally
		{
			isLoading.value = false;
		}
	}

	async function deleteAllSessions(): Promise<boolean>
	{
		isLoading.value = true;

		try
		{
			const success = await debugBarApi.deleteAllSessions();

			if (success)
			{
				sessions.value = [];

				return true;
			}

			toastStore.addWarning(Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.CLEAR_ERROR));

			return false;
		}
		catch (error)
		{
			handleResponseError(error);

			return false;
		}
		finally
		{
			isLoading.value = false;
		}
	}

	return {
		sessions,
		isLoading,
		loadSessions,
		deleteAllSessions,
	};
}
