import { NameService } from 'crm.ai.name-service';
import { Loc } from 'main.core';

export const DISABLED_MODE_CODE = 'disabled';
export const CALL_CHANNEL_CODE = 'call';

export const TRANSCRIPTION_SCENARIO_CODE = 'transcription';
export const TRANSCRIPTION_DEPENDENT_SCENARIO_CODES = [
	'summarize',
	'fillFields',
	'analyzeCommunication',
	'callAssessment',
];

export function createEmptySlider(): Object
{
	return {
		revision: '',
		scope: {
			entityTypeId: 0,
			categoryId: null,
			categoryName: null,
		},
		header: {
			languageId: '',
			languageTitle: '',
			isLanguageSelectorAvailable: false,
		},
		scenarios: [],
	};
}

export function normalizeSlider(slider): Object
{
	return {
		...slider,
		scenarios: (slider.scenarios ?? []).map((scenario) => ({
			...scenario,
			channels: (scenario.channels ?? []).map((channel) => ({
				...channel,
				targetEnabled: channel.enabled,
				targetMode: channel.mode,
				isChanged: false,
			})),
		})),
	};
}

export function buildChannelModeOptions(channel, getMessage = Loc.getMessage): Array
{
	return [
		{
			code: DISABLED_MODE_CODE,
			title: getMessage('CRM_AI_AUTOMATION_SLIDER_MODE_DISABLED') ?? DISABLED_MODE_CODE,
			enabled: false,
			mode: DISABLED_MODE_CODE,
		},
		...(channel.availableModes ?? []).map((mode) => ({
			code: mode,
			title: getModeTitle(channel.code, mode, getMessage),
			enabled: true,
			mode,
		})),
	];
}

export function formatScenarioSummary(channels, getMessage = Loc.getMessage): string
{
	return channels
		.map((channel) => {
			const selectedOption = getSelectedChannelModeOption(channel, getMessage);

			return `${channel.title}: ${selectedOption.title}`;
		})
		.join(', ')
	;
}

export function getSelectedChannelModeOption(channel, getMessage = Loc.getMessage): Object
{
	return findSelectedOption(channel, buildChannelModeOptions(channel, getMessage));
}

export function isTranscriptionDependentCallChannel(scenarioCode, channelCode): boolean
{
	return channelCode === CALL_CHANNEL_CODE
		&& TRANSCRIPTION_DEPENDENT_SCENARIO_CODES.includes(scenarioCode)
	;
}

export function collectChangedChannelSelections(scenarios): Array
{
	return (scenarios ?? []).flatMap((scenario) => (scenario.channels ?? [])
		.filter((channel) => channel.isChanged)
		.map((channel) => ({
			scenarioCode: scenario.code,
			channelCode: channel.code,
			targetEnabled: channel.targetEnabled,
			targetMode: channel.targetMode,
		})));
}

const REASON_MESSAGE_IDS = {
	ai_not_available: 'CRM_AI_AUTOMATION_SLIDER_REASON_AI_NOT_AVAILABLE',
	global_disabled: 'CRM_AI_AUTOMATION_SLIDER_REASON_GLOBAL_DISABLED',
	engine_not_configured: 'CRM_AI_AUTOMATION_SLIDER_REASON_ENGINE_NOT_CONFIGURED',
	subscription_required: 'CRM_AI_AUTOMATION_SLIDER_REASON_SUBSCRIPTION_REQUIRED',
	invalid_scope: 'CRM_AI_AUTOMATION_SLIDER_REASON_INVALID_SCOPE',
	slider_busy: 'CRM_AI_SETTINGS_SLIDER_BUSY_ERROR',
};

export function getAvailabilityReasonText(reasonCode, getMessage = Loc.getMessage): string
{
	const messageId = REASON_MESSAGE_IDS[reasonCode];

	return messageId ? (getMessage(messageId, NameService.copilotNameReplacement()) ?? '') : '';
}

export function normalizeSavePayload(revision, scenarios): Object
{
	// Full snapshot: persist the override for ALL displayed channels (not only changed ones)
	// to avoid the "shown != saved != executed" drift and the legacy fallback on the backend.
	return {
		revision,
		scenarioUpdates: scenarios
			.map((scenario) => ({
				code: scenario.code,
				channels: scenario.channels
					.map((channel) => {
						if (typeof channel.targetEnabled !== 'boolean')
						{
							throw new Error('invalid_channel_state');
						}

						const mode = resolveSaveMode(channel);
						if (typeof mode !== 'string' || mode === '')
						{
							throw new Error('invalid_channel_mode');
						}

						return {
							code: channel.code,
							enabled: channel.isBlocked ? false : channel.targetEnabled,
							mode,
						};
					}),
			}))
			.filter((update) => update.channels.length > 0),
	};
}

function resolveSaveMode(channel): string
{
	if (channel.targetEnabled === false && channel.targetMode === DISABLED_MODE_CODE)
	{
		return resolveTargetMode({
			...channel,
			targetMode: channel.mode,
		});
	}

	return channel.targetMode;
}

function resolveTargetMode(channel): string
{
	const availableModes = channel.availableModes ?? [];
	const targetMode = channel.targetMode ?? channel.mode ?? '';

	if (availableModes.includes(targetMode))
	{
		return targetMode;
	}

	if (availableModes.includes(channel.mode))
	{
		return channel.mode;
	}

	return availableModes[0] ?? '';
}

function findSelectedOption(channel, options): Object
{
	if ((channel.targetEnabled ?? channel.enabled) === false)
	{
		return options[0];
	}

	const targetMode = resolveTargetMode(channel);

	return options.find((option) => option.enabled && option.mode === targetMode) ?? options[0];
}

const MODE_MESSAGE_IDS = {
	call: {
		firstIncoming: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_FIRST_INCOMING',
		allIncoming: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_ALL_INCOMING',
		outgoing: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_OUTGOING',
		both: 'CRM_AI_AUTOMATION_SLIDER_CALL_MODE_BOTH',
	},
	chat: {
		firstChat: 'CRM_AI_AUTOMATION_SLIDER_CHAT_MODE_FIRST_CHAT',
		all: 'CRM_AI_AUTOMATION_SLIDER_CHAT_MODE_ALL',
	},
	email: {
		firstIncoming: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_FIRST_INCOMING',
		allIncoming: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL_INCOMING',
		allOutgoing: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL_OUTGOING',
		all: 'CRM_AI_AUTOMATION_SLIDER_EMAIL_MODE_ALL',
	},
};

function getModeTitle(channelCode, mode, getMessage): string
{
	const messageId = MODE_MESSAGE_IDS[channelCode]?.[mode];

	return messageId ? (getMessage(messageId) ?? mode) : mode;
}
