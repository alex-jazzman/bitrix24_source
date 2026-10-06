import { Core } from 'im.v2.application.core';
import { UserType } from 'im.v2.const';

import { type ImModelUser } from 'im.v2.model';

const AnalyticUserType = Object.freeze({
	userIntranet: 'user_intranet',
	userExtranet: 'user_extranet',
	userCollaber: 'user_collaber',
	userGuest: 'user_guest',
});

export function getUserType(): $Values<typeof AnalyticUserType>
{
	const user: ImModelUser = Core.getStore().getters['users/get'](Core.getUserId(), true);

	switch (user.type)
	{
		case UserType.user:
			return AnalyticUserType.userIntranet;
		case UserType.extranet:
			return AnalyticUserType.userExtranet;
		case UserType.collaber:
			return AnalyticUserType.userCollaber;
		case UserType.guest:
			return AnalyticUserType.userGuest;
		default:
			return AnalyticUserType.userIntranet;
	}
}
