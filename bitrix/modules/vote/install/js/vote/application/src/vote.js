import { createStore, type Store } from 'ui.vue3.vuex';
import { ChatType } from 'im.v2.const';

import { VoteModel } from 'vote.store.vote';
import { VotePullHandler } from 'vote.provider.pull';

export class VoteApplication
{
	static instance: VoteApplication;
	store: Store;

	static init(): VoteApplication
	{
		return VoteApplication.getInstance();
	}

	static getInstance(): VoteApplication
	{
		if (!VoteApplication.instance)
		{
			VoteApplication.instance = new VoteApplication();
		}

		return VoteApplication.instance;
	}

	constructor()
	{
		this.createStore();
		this.initPull();
	}

	createStore(): void
	{
		this.store = createStore({
			modules: {
				vote: {
					namespaced: true,
					...VoteModel,
				},
			},
		});
	}

	getStore(): Store
	{
		return this.store;
	}

	initPull(): void
	{
		this.pullClient = BX.PULL;
		if (!this.pullClient)
		{
			return;
		}

		this.pullClient.subscribe(new VotePullHandler({ store: this.store }));
	}

	static canCreateVoteInChat(currentChatType: string): boolean
	{
		const availableChatTypes = [
			ChatType.chat,
			ChatType.open,
			ChatType.general,
			ChatType.call,
			ChatType.crm,
			ChatType.sonetGroup,
			ChatType.calendar,
			ChatType.tasks,
			ChatType.mail,
			ChatType.generalChannel,
			ChatType.channel,
			ChatType.openChannel,
			ChatType.collab,
		];

		return availableChatTypes.includes(currentChatType);
	}
}
