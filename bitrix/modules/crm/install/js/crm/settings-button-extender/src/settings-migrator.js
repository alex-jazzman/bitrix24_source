import { Type } from 'main.core';

import { CALL_DIRECTION_INCOMING, CHANNEL_TYPE_CALL, CHANNEL_TYPE_CHAT } from './constants';

export class SettingsMigrator
{
	static migrateToChannelFormat(settings: Object): Object
	{
		if (settings && settings.channels)
		{
			return settings;
		}

		// old format migration to new format
		const result = { channels: {} };

		// call settings
		if (
			settings
			&& (settings.autostartOperationTypes || !Type.isUndefined(settings.autostartCallDirections))
		)
		{
			result.channels[CHANNEL_TYPE_CALL] = {
				channelType: CHANNEL_TYPE_CALL,
				autostartOperationTypes: settings.autostartOperationTypes || [],
				// eslint-disable-next-line max-len
				autostartTranscriptionOnlyOnFirstCallWithRecording: Boolean(settings.autostartTranscriptionOnlyOnFirstCallWithRecording),
				autostartCallDirections: settings.autostartCallDirections || [CALL_DIRECTION_INCOMING],
			};
		}

		// chat settings
		if (settings && !Type.isUndefined(settings.autostartOnlyFirstChat))
		{
			result.channels[CHANNEL_TYPE_CHAT] = {
				channelType: CHANNEL_TYPE_CHAT,
				autostartOperationTypes: [], // no such setting in old format
				autostartOnlyFirstChat: Boolean(settings.autostartOnlyFirstChat),
			};
		}

		return result;
	}

	static isValidChannelFormat(settings: Object): boolean
	{
		if (!Type.isPlainObject(settings))
		{
			return false;
		}

		if (!Type.isPlainObject(settings.channels))
		{
			return false;
		}

		// check each channel settings
		for (const [channelType, channelSettings] of Object.entries(settings.channels))
		{
			if (!Type.isPlainObject(channelSettings))
			{
				return false;
			}

			if (channelSettings.channelType !== channelType)
			{
				return false;
			}

			if (!Type.isArrayFilled(channelSettings.autostartOperationTypes))
			{
				return false;
			}
		}

		return true;
	}
}
