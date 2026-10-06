import { normalizeSlider } from './helpers';

function updateScenarioChannel(state, scenarioCode, channelCode, updater): void
{
	state.slider.scenarios = state.slider.scenarios.map((scenario) => {
		if (scenario.code !== scenarioCode)
		{
			return scenario;
		}

		return {
			...scenario,
			channels: scenario.channels.map((channel) => {
				if (channel.code !== channelCode)
				{
					return channel;
				}

				const updated = updater(channel);

				return {
					...updated,
					isChanged: isChannelChanged(channel, updated),
				};
			}),
		};
	});
}

function isChannelChanged(channel, updated): boolean
{
	if (updated.targetEnabled !== channel.enabled)
	{
		return true;
	}

	if (updated.targetEnabled === false)
	{
		return false;
	}

	return updated.targetMode !== channel.mode;
}

export default {
	startLoading(state): void
	{
		state.isLoading = true;
		state.errorCode = null;
	},

	stopLoading(state): void
	{
		state.isLoading = false;
	},

	startSaving(state): void
	{
		state.isSaving = true;
		state.errorCode = null;
	},

	stopSaving(state): void
	{
		state.isSaving = false;
	},

	setSlider(state, slider): void
	{
		state.slider = normalizeSlider(slider);
		state.errorCode = null;
	},

	setErrorCode(state, errorCode): void
	{
		state.errorCode = errorCode;
	},

	setLanguage(state, { languageId, languageTitle }): void
	{
		state.slider.header.languageId = languageId;
		state.slider.header.languageTitle = languageTitle ?? '';
	},

	toggleExpandedScenario(state, scenarioCode): void
	{
		state.expandedScenarioCodes = state.expandedScenarioCodes.includes(scenarioCode)
			? state.expandedScenarioCodes.filter((code) => code !== scenarioCode)
			: [...state.expandedScenarioCodes, scenarioCode]
		;
	},

	setScenarioChannelSelection(state, { scenarioCode, channelCode, option }): void
	{
		updateScenarioChannel(state, scenarioCode, channelCode, (channel) => ({
			...channel,
			targetEnabled: option.enabled,
			targetMode: option.mode,
		}));
	},

	reapplyChannelSelections(state, selections): void
	{
		selections.forEach(({ scenarioCode, channelCode, targetEnabled, targetMode }) => {
			updateScenarioChannel(state, scenarioCode, channelCode, (channel) => ({
				...channel,
				targetEnabled,
				targetMode,
			}));
		});
	},
};
