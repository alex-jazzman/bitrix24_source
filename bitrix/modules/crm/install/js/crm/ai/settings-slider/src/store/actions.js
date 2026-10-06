import { Loc, userOptions as UserOptions } from 'main.core';
import { UI } from 'ui.notification';

import { openLanguageSelector } from '../services/language-selector';
import { collectChangedChannelSelections, getAvailabilityReasonText, normalizeSavePayload } from './helpers';

const BUSY_RETRY_DELAY_MS = 1000;

const getErrorCode = (error): string => error?.errors?.[0]?.code ?? 'save_failed';
const getErrorMessage = (errorCode): string => {
	return getAvailabilityReasonText(errorCode) || Loc.getMessage('CRM_AI_SETTINGS_SLIDER_GENERIC_ERROR');
};
const delay = (ms): Promise => new Promise((resolve) => {
	setTimeout(resolve, ms);
});

async function saveWithBusyRetry(service, payload): Promise
{
	try
	{
		return await service.saveSlider(payload.revision, payload.scenarioUpdates);
	}
	catch (error)
	{
		if (getErrorCode(error) !== 'slider_busy')
		{
			throw error;
		}

		await delay(BUSY_RETRY_DELAY_MS);

		return service.saveSlider(payload.revision, payload.scenarioUpdates);
	}
}

export default {
	async loadSlider({ commit, state }): Promise
	{
		commit('startLoading');

		try
		{
			const response = await state.service.getSlider();
			const slider = response?.data?.slider;
			if (slider)
			{
				commit('setSlider', slider);
			}
			else
			{
				commit('setErrorCode', 'invalid_response');
			}
		}
		catch (error)
		{
			commit('setErrorCode', getErrorCode(error));
		}
		finally
		{
			commit('stopLoading');
		}
	},

	async saveSlider({ commit, state, getters, dispatch }): Promise
	{
		if (getters.isSaveDisabled)
		{
			return;
		}

		commit('startSaving');

		try
		{
			const payload = normalizeSavePayload(state.slider.revision, state.slider.scenarios);
			const response = await saveWithBusyRetry(state.service, payload);
			const slider = response?.data?.slider;
			if (slider)
			{
				commit('setSlider', slider);
			}
			else
			{
				commit('setErrorCode', 'invalid_response');
				UI.Notification.Center.notify({
					content: getErrorMessage('invalid_response'),
				});
			}
		}
		catch (error)
		{
			const errorCode = getErrorCode(error);
			if (errorCode === 'slider_state_conflict')
			{
				const pendingSelections = collectChangedChannelSelections(state.slider.scenarios);
				await dispatch('loadSlider');
				commit('reapplyChannelSelections', pendingSelections);
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_AI_SETTINGS_SLIDER_CONFLICT_REAPPLIED'),
				});
			}
			else
			{
				commit('setErrorCode', errorCode);
				UI.Notification.Center.notify({
					content: getErrorMessage(errorCode),
				});
			}
		}
		finally
		{
			commit('stopSaving');
		}
	},

	setScenarioChannelSelection({ commit }, payload): void
	{
		commit('setScenarioChannelSelection', payload);
	},

	toggleExpandedScenario({ commit }, scenarioCode): void
	{
		commit('toggleExpandedScenario', scenarioCode);
	},

	openLanguageSelector({ state, commit }, event): void
	{
		openLanguageSelector({
			entityTypeId: state.entityTypeId,
			categoryId: state.categoryId,
			currentLanguageId: state.slider.header.languageId,
			targetNode: event?.currentTarget ?? null,
			onSelect: (languageId, languageTitle) => {
				commit('setLanguage', { languageId, languageTitle });

				let optionName = `ai_config_${state.entityTypeId}`;
				if (Number.isInteger(state.categoryId))
				{
					optionName += `_${state.categoryId}`;
				}

				UserOptions.save('crm', optionName, 'languageId', languageId);
			},
		});
	},
};
