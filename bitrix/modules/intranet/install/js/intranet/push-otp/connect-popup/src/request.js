import { ajax as Ajax } from 'main.core';

export const resumeOtpRequest = (signedUserId: string) => {
	return BX.ajax.runAction(
		'intranet.v2.Otp.resumeOtp',
		{
			mode: 'ajax',
			method: 'POST',
			data: {
				signedUserId,
			},
		},
	);
};

export const pauseOtpRequest = (days: number, signedUserId: string) => {
	return BX.ajax.runAction(
		'intranet.v2.Otp.pauseOtp',
		{
			mode: 'ajax',
			method: 'POST',
			data: {
				signedUserId,
				days,
			},
		},
	);
};

export const deeplinkRequest = (intent: string, ttl: number) => {
	return Ajax.runAction('mobile.deeplink.get', {
		data: {
			intent,
			ttl,
		},
	});
};
