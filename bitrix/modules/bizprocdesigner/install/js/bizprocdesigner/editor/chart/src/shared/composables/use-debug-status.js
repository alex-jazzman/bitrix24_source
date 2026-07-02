import { Loc } from 'main.core';
import { ref } from 'ui.vue3';
import { useAppStore } from '../../entities/app';
import { diagramStore } from '../../entities/blocks';
import { debugBarApi } from '../../entities/debug-bar/api';
import { DEBUG_BAR_ERROR_MESSAGES } from '../../entities/debug-bar/constants';
import { validateTemplateId } from '../../entities/debug-bar/utils';
import { useToastStore } from '../stores/toast-store';

export function useDebugStatus()
{
	const isDebugEnabled = ref(false);
	const isLoading = ref(false);
	const appStore = useAppStore();
	const store = diagramStore();
	const toastStore = useToastStore();

	async function checkDebugStatus(templateId: number | null)
	{
		if (!validateTemplateId(templateId, 'checkDebugStatus'))
		{
			return;
		}

		try
		{
			const status = await debugBarApi.getDebugStatus(templateId);

			if (!status)
			{
				return;
			}

			isDebugEnabled.value = status.enabled;
		}
		catch
		{
			toastStore.addWarning(
				Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.STATUS_CHECK_ERROR),
			);
		}
	}

	async function toggleDebug()
	{
		if (isLoading.value)
		{
			return;
		}

		isLoading.value = true;
		const templateId = store.templateId;

		try
		{
			if (isDebugEnabled.value && !appStore.isShownDebugBar)
			{
				appStore.showDebugBar();

				return;
			}

			if (!validateTemplateId(templateId, 'toggleDebug'))
			{
				return;
			}

			if (isDebugEnabled.value)
			{
				const success = await debugBarApi.disableDebug(templateId);

				if (success)
				{
					isDebugEnabled.value = false;
					appStore.hideDebugBar();
				}
				else
				{
					toastStore.addWarning(
						Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR),
					);
				}
			}
			else
			{
				const success = await debugBarApi.enableDebug(templateId);

				if (success)
				{
					isDebugEnabled.value = true;
					appStore.showDebugBar();
				}
				else
				{
					toastStore.addWarning(
						Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR),
					);
				}
			}
		}
		catch
		{
			toastStore.addWarning(
				Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.TOGGLE_ERROR),
			);
		}
		finally
		{
			isLoading.value = false;
		}
	}

	return {
		isDebugEnabled,
		isLoading,
		toggleDebug,
		checkDebugStatus,
	};
}
