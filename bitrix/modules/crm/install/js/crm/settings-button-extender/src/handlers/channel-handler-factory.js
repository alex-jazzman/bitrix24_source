import { CHANNEL_TYPE_CALL, CHANNEL_TYPE_CHAT } from '../constants';

import type { ChannelParams } from './base-channel-handler';
import { BaseChannelHandler } from './base-channel-handler';
import { CallChannelHandler } from './call-channel-handler';
import { ChatChannelHandler } from './chat-channel-handler';

type ChannelType = CHANNEL_TYPE_CALL | CHANNEL_TYPE_CHAT;

export class ChannelHandlerFactory
{
	// eslint-disable-next-line max-len
	static create(channelType: ChannelType, settings: ChannelParams, extensionSettings): BaseChannelHandler | null
	{
		switch (channelType)
		{
			case CHANNEL_TYPE_CALL:
				return new CallChannelHandler(settings, extensionSettings);
			case CHANNEL_TYPE_CHAT:
				return new ChatChannelHandler(settings, extensionSettings);
			default:
				throw new Error(`Unknown channel type: ${channelType}`);
		}
	}

	static getSupportedChannelTypes(): ChannelType[]
	{
		return [
			CHANNEL_TYPE_CALL,
			CHANNEL_TYPE_CHAT,
		];
	}
}
