import { Type } from 'main.core';
import ConfigurableItem from '../configurable-item';

import { ActionParams, Base } from './base';
import { tryToResendWithMessage } from './message/resend';

declare type TelegramParams = {
	text: string,
	senderCode: string,
	senderId: string,
	from: string,
	client: Object,
}

export class Telegram extends Base
{
	getDeleteActionMethod(): string
	{
		return 'crm.timeline.activity.delete';
	}

	getDeleteActionCfg(recordId: Number, ownerTypeId: Number, ownerId: Number): Object
	{
		return {
			data: {
				activityId: recordId,
				ownerTypeId,
				ownerId,
			},
		};
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:Telegram:Resend' && Type.isPlainObject(actionData.params))
		{
			void this.#resendTelegram(actionData.params);
		}
	}

	async #resendTelegram(params: TelegramParams): Promise<void>
	{
		const messageParams = {
			backend: {
				senderCode: params.senderCode,
				id: params.senderId,
			},
			fromId: params.from,
			client: params.client,
			text: params.text,
		};

		const wasResendAvailable = await tryToResendWithMessage(messageParams);
		if (!wasResendAvailable)
		{
			console.error('BX.Crm.Timeline.Item.Controllers.Telegram: could not resend message via message menubar item');
		}
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (item.getType() === 'Activity:Telegram');
	}
}
