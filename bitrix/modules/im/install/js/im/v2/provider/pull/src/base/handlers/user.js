import { type Store } from 'ui.vue3.vuex';
import { Type, Http } from 'main.core';

import { Core } from 'im.v2.application.core';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';

import { UserLogoutParams, type UserShowInRecentParams } from '../../types/recent';
import { type UserInviteParams } from '../../types/user';

const GUEST_INVITE_CODE_COOKIE = 'BITRIX_IM_GUEST_INVITE_CODE';

export class UserPullHandler
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	handleUserInvite(params: UserInviteParams)
	{
		if (params.invited)
		{
			const userManager = new UserManager();
			userManager.setUsersToModel([params.user]);

			return;
		}

		this.#store.dispatch('users/update', {
			id: params.userId,
			fields: params.user,
		});
	}

	handleUserShowInRecent(params: UserShowInRecentParams)
	{
		const usersToStore = params.items.map((item) => item.user);

		const userManager = new UserManager();
		userManager.setUsersToModel(usersToStore);
	}

	handleUserLogout(params: UserLogoutParams)
	{
		const { deactivatedCodes } = params;
		const inviteCode = Http.Cookie.get(GUEST_INVITE_CODE_COOKIE);
		if (!Type.isArrayFilled(deactivatedCodes) || deactivatedCodes.includes(inviteCode))
		{
			Utils.browser.redirectTo('/');
		}
	}
}
