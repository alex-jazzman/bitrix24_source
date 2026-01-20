import { ajax } from 'main.core';

export class Ajax
{
	static sendAuthSms(): Promise
	{
		return ajax.runAction('intranet.v2.Otp.sendAuthSms', {});
	}

	static sendMobilePush(channelTag: string): Promise
	{
		return ajax.runAction('intranet.v2.Otp.sendMobilePush', {
			data: {
				channelTag,
			},
		});
	}
}
