import { type Store } from 'ui.vue3.vuex';

import { runAction } from 'im.v2.lib.rest';
import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';
import { RestMethod, CopilotMcpSelectionStatus } from 'im.v2.const';
import { type ImModelCopilotMcpAuth } from 'im.v2.model';

type SavedAuth = {
	id: number,
	name: string,
	icon?: ?string,
};

type SaveResponse = {
	status: string,
	auths: SavedAuth[],
};

type AppliedSelection = {
	dialogId: string,
	mcpAuth: ?ImModelCopilotMcpAuth,
	status: string,
	confirmed: boolean,
};

// a save or a clear that started later supersedes the one still in flight; the counter is shared by
// all instances, because every caller works through its own McpSelection
const selectionGenerations: Map<string, number> = new Map();

export class McpSelection
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	async save({ dialogId, mcpAuth }: { dialogId: string, mcpAuth: ImModelCopilotMcpAuth }): Promise<void>
	{
		const generation = this.#startGeneration(dialogId);

		if (Utils.dialog.isTempAiAssistantDialogId(dialogId))
		{
			// a draft chat lives on the client only: it is saved once transferred onto the created chat
			this.#applySelection({ dialogId, mcpAuth, status: CopilotMcpSelectionStatus.ready, confirmed: true });

			return;
		}

		const chatId = this.#getChatId(dialogId);
		if (!chatId)
		{
			this.#applySelection({ dialogId, mcpAuth, status: CopilotMcpSelectionStatus.error, confirmed: false });

			return;
		}

		const { auth: previousAuth, confirmed: wasPreviousConfirmed } = this.#getStoredSelection(dialogId);
		this.#applySelection({ dialogId, mcpAuth, status: CopilotMcpSelectionStatus.restoring, confirmed: false });

		try
		{
			const response: SaveResponse = await runAction(RestMethod.imV2McpSelectionSave, {
				data: { chatId, authIds: [mcpAuth.id] },
			});

			if (this.#isSuperseded(dialogId, generation))
			{
				return;
			}

			const confirmedAuth = this.#extractConfirmedAuth(response);
			if (!confirmedAuth)
			{
				this.#applySelection({
					dialogId,
					mcpAuth: previousAuth,
					status: CopilotMcpSelectionStatus.unavailable,
					confirmed: wasPreviousConfirmed,
				});

				return;
			}

			this.#applySelection({
				dialogId,
				mcpAuth: confirmedAuth,
				status: CopilotMcpSelectionStatus.ready,
				confirmed: true,
			});
		}
		catch (error)
		{
			Logger.warn('McpSelection: save failed', error);
			if (this.#isSuperseded(dialogId, generation))
			{
				return;
			}

			this.#applySelection({
				dialogId,
				mcpAuth: previousAuth,
				status: CopilotMcpSelectionStatus.error,
				confirmed: wasPreviousConfirmed,
			});
		}
	}

	async clear(dialogId: string): Promise<void>
	{
		const generation = this.#startGeneration(dialogId);

		if (Utils.dialog.isTempAiAssistantDialogId(dialogId))
		{
			this.#applySelection({
				dialogId,
				mcpAuth: null,
				status: CopilotMcpSelectionStatus.ready,
				confirmed: false,
			});

			return;
		}

		const chatId = this.#getChatId(dialogId);
		if (!chatId)
		{
			this.#applySelection({
				dialogId,
				mcpAuth: null,
				status: CopilotMcpSelectionStatus.error,
				confirmed: false,
			});

			return;
		}

		const { auth: previousAuth, confirmed: wasPreviousConfirmed } = this.#getStoredSelection(dialogId);
		this.#applySelection({
			dialogId,
			mcpAuth: null,
			status: CopilotMcpSelectionStatus.restoring,
			confirmed: false,
		});

		try
		{
			await runAction(RestMethod.imV2McpSelectionClear, { data: { chatId } });
			if (this.#isSuperseded(dialogId, generation))
			{
				return;
			}

			this.#applySelection({
				dialogId,
				mcpAuth: null,
				status: CopilotMcpSelectionStatus.ready,
				confirmed: false,
			});
		}
		catch (error)
		{
			Logger.warn('McpSelection: clear failed', error);
			if (this.#isSuperseded(dialogId, generation))
			{
				return;
			}

			this.#applySelection({
				dialogId,
				mcpAuth: previousAuth,
				status: CopilotMcpSelectionStatus.error,
				confirmed: wasPreviousConfirmed,
			});
		}
	}

	#startGeneration(dialogId: string): number
	{
		const generation = (selectionGenerations.get(dialogId) ?? 0) + 1;
		selectionGenerations.set(dialogId, generation);

		return generation;
	}

	#isSuperseded(dialogId: string, generation: number): boolean
	{
		return selectionGenerations.get(dialogId) !== generation;
	}

	#applySelection({ dialogId, mcpAuth, status, confirmed }: AppliedSelection): void
	{
		if (mcpAuth)
		{
			void this.#store.dispatch('copilot/chats/setMcpAuth', { dialogId, mcpAuth, confirmed });
		}
		else
		{
			void this.#store.dispatch('copilot/chats/clearMcpAuth', dialogId);
		}

		void this.#store.dispatch('copilot/chats/setMcpSelectionStatus', { dialogId, status });
	}

	// an empty selection carries no confirmation, so the pair stays consistent for a rollback
	#getStoredSelection(dialogId: string): { auth: ?ImModelCopilotMcpAuth, confirmed: boolean }
	{
		const auth = this.#store.getters['copilot/chats/getMcpAuth'](dialogId);

		return {
			auth,
			confirmed: Boolean(auth) && this.#store.getters['copilot/chats/isMcpAuthConfirmed'](dialogId) === true,
		};
	}

	#extractConfirmedAuth(response: ?SaveResponse): ?ImModelCopilotMcpAuth
	{
		const auth = response?.auths?.[0];
		if (!auth?.id)
		{
			return null;
		}

		return {
			id: auth.id,
			name: auth.name,
			icon: auth.icon ?? null,
		};
	}

	#getChatId(dialogId: string): ?number
	{
		return this.#store.getters['chats/get'](dialogId)?.chatId ?? null;
	}
}
