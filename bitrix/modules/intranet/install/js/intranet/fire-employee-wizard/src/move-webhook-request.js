import { ajax } from 'main.core';

export class MoveWebhookRequest
{
	send(userId: number, options = {}): Promise<boolean>
	{
		return ajax.runAction('intranet.v2.User.moveWebhook', {
			data: {
				userId,
				options,
			},
		});
	}

	static send(userId: number, options = {}): Promise<boolean>
	{
		return new MoveWebhookRequest().send(userId, options);
	}
}