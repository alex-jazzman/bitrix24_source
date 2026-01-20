import { Store } from 'ui.vue3.vuex';

import { runAction } from 'im.v2.lib.rest';
import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';
import { RestMethod } from 'im.v2.const';

import type { ImModelCopilotRole } from 'im.v2.model';

export type RawRole = {
	code: string,
	name: string,
	description: string,
	industryCode: string,
	isNew: boolean,
	isRecommended: boolean,
	isSystem: boolean,
	avatar: {
		small: string,
		medium: string,
		large: string,
	},
};

export class CopilotService
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	updateRole({ dialogId, newRole }: { dialogId: string, newRole: RawRole }): Promise
	{
		Logger.warn('CopilotService: update role', dialogId);
		const currentRole: ImModelCopilotRole = this.#store.getters['copilot/chats/getRole'](dialogId);

		if (currentRole.code === newRole.code)
		{
			return Promise.resolve();
		}

		void this.#store.dispatch('copilot/chats/set', { dialogId, role: newRole.code });
		void this.#store.dispatch('copilot/roles/add', [newRole]);

		return this.#sendRequest({ dialogId, newRoleCode: newRole.code });
	}

	#sendRequest({ dialogId, newRoleCode }: { dialogId: string, newRoleCode: string }): Promise
	{
		const requestParams = { data: { dialogId, role: newRoleCode } };

		return runAction(RestMethod.imV2ChatCopilotUpdateRole, requestParams);
	}
}
