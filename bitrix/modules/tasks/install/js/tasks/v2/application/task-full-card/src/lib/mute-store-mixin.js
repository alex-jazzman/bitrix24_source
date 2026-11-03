import { Runtime, Type } from 'main.core';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';

type MuteMutation = {
	type: string,
	payload: ?{
		actionName: ?string,
		dialogId: ?TaskId,
		fields: ?{ isMuted: ?boolean },
	},
};

type ImChat = {
	chatId: number,
};

type ImStore = {
	getters: {
		'chats/get': (dialogId: ?TaskId, searchByChatId: boolean) => ?ImChat,
	},
	subscribe: (callback: (mutation: MuteMutation) => void) => () => void,
};

// The card renders the mute state on its own, so a mute done from the task chat has to
// reach the card even when no chat is mounted next to it: an embedded card shows no chat
// at all, and that is where the state used to stay stale until a page reload.
export const MuteStoreMixin = {
	created(): void
	{
		this.muteStoreUnsubscribe = null;
		this.isMuteStoreTornDown = false;
	},
	async mounted(): Promise<void>
	{
		// a template has no chat, so its card must not pull the messenger in
		if (!Core.getParams().features.im || idUtils.isTemplate(this.taskId))
		{
			return;
		}

		const { Core: ImCore } = await Runtime.loadExtension('im.v2.application.core');
		const imStore = ImCore.getStore();
		const unsubscribe = imStore.subscribe((mutation: MuteMutation) => {
			this.handleMuteChange(mutation, imStore);
		});

		if (this.isMuteStoreTornDown)
		{
			unsubscribe();

			return;
		}

		this.muteStoreUnsubscribe = unsubscribe;
	},
	unmounted(): void
	{
		this.isMuteStoreTornDown = true;
		this.muteStoreUnsubscribe?.();
		this.muteStoreUnsubscribe = null;
	},
	methods: {
		handleMuteChange(mutation: MuteMutation, imStore: ImStore): void
		{
			const { type, payload } = mutation;
			const { actionName, dialogId, fields } = payload ?? {};
			if (
				type !== 'chats/update'
				|| (actionName !== 'mute' && actionName !== 'unmute')
				|| !Type.isBoolean(fields?.isMuted)
			)
			{
				return;
			}

			const chatId = this.task?.chatId;
			if (!chatId || imStore.getters['chats/get'](dialogId, true)?.chatId !== chatId)
			{
				return;
			}

			void this.$store.dispatch(`${Model.Tasks}/update`, {
				id: this.taskId,
				fields: {
					isMuted: fields.isMuted,
				},
			});
		},
	},
};
