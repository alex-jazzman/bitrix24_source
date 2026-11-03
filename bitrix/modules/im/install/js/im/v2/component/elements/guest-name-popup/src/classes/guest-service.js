import { Runtime } from 'main.core';

import { RestMethod } from 'im.v2.const';
import { GuestManager } from 'im.v2.lib.guest';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import { type RawUser } from 'im.v2.provider.service.types';

type SetNameResponse = {
	user: RawUser,
	userToken: ?string,
};

export class GuestService
{
	setName(name: string): Promise
	{
		return runAction(RestMethod.imV2GuestSetName, { data: { name } })
			.then((response: SetNameResponse) => {
				void (new UserManager()).setUsersToModel(response.user);
				const tokenApplied = this.#applyUserToken(response.userToken);
				GuestManager.getInstance().setGuestNamePopupState(false);

				// Resolve only once the fresh token is applied; #applyUserToken never rejects (soft-fail).
				return tokenApplied;
			}).catch(([error]: RunActionError[]) => {
				Logger.error('GuestService: setName error', error);
				throw error;
			});
	}

	#applyUserToken(userToken: ?string): Promise
	{
		if (!userToken)
		{
			return Promise.resolve();
		}

		// Contract API-01: paired with call Controller#runGuestLobbyAndPersistName — keep both in sync.
		// call module is optional: apply the fresh guest token only when it is installed
		return Runtime.loadExtension('call.lib.call-token-manager')
			.then(({ CallTokenManager }) => {
				CallTokenManager?.setUserToken(userToken);
			})
			.catch((error) => {
				// Soft-fail: call module may be absent; keep the guest token as-is, do not block.
				Logger.warn('GuestService: failed to apply fresh guest token to CallTokenManager', error);
			});
	}
}
