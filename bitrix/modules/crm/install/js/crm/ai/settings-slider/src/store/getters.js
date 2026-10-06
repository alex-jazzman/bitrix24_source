import {
	CALL_CHANNEL_CODE,
	isTranscriptionDependentCallChannel,
	TRANSCRIPTION_SCENARIO_CODE,
} from './helpers';

export default {
	slider: (state) => state.slider,
	scenarios: (state) => state.slider.scenarios,
	expandedScenarioCodes: (state) => state.expandedScenarioCodes,
	scenariosWithChannelState: (state) => {
		const scenarios = state.slider.scenarios ?? [];
		const transcription = scenarios.find((scenario) => scenario.code === TRANSCRIPTION_SCENARIO_CODE);
		const transcriptionCall = (transcription?.channels ?? []).find((channel) => channel.code === CALL_CHANNEL_CODE);
		const transcriptionReady = transcription?.availability?.ready === true;
		const transcriptionCallEnabled = transcriptionCall
			? (transcriptionCall.targetEnabled ?? transcriptionCall.enabled)
			: false
		;
		const isTranscriptionAvailableAndEnabled = transcriptionReady && transcriptionCallEnabled;

		return scenarios.map((scenario) => ({
			...scenario,
			channels: (scenario.channels ?? []).map((channel) => {
				if (
					!isTranscriptionAvailableAndEnabled
					&& isTranscriptionDependentCallChannel(scenario.code, channel.code)
				)
				{
					return {
						...channel,
						isBlocked: true,
						blockedReason: 'transcription_disabled',
					};
				}

				return {
					...channel,
					isBlocked: false,
					blockedReason: null,
				};
			}),
		}));
	},
	isLoading: (state) => state.isLoading,
	isSaving: (state) => state.isSaving,
	errorCode: (state) => state.errorCode,
	isDirty: (state) => state.slider.scenarios.some(
		(scenario) => scenario.channels.some((channel) => channel.isChanged),
	),
	isSaveDisabled: (state, getters) => getters.isLoading || getters.isSaving || !getters.isDirty,
};
