import { type Store } from 'ui.vue3.vuex';
import { type RestClient } from 'rest.client';

import { Core } from 'im.v2.application.core';
import { ChatType, RestMethod, UserRole, type SelectorEntityItem } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';
import { Notifier } from 'im.v2.lib.notifier';
import { LayoutManager } from 'im.v2.lib.layout';

import { type ImModelChat } from 'im.v2.model';

import { type AddSelectionConfig } from '../types/add-selection';

// join чата комментариев каскадно подписывает и на родительский канал — уведомления канальные
const CHANNEL_TYPES: Set<string> = new Set([
	ChatType.channel,
	ChatType.openChannel,
	ChatType.generalChannel,
	ChatType.comment,
]);

const UNREPORTED_CALL_ERROR: RunActionError = { code: '', customData: null, message: '' };

export class UserService
{
	#store: Store;
	#restClient: RestClient;

	// static: every component creates its own service instance, but in-flight guards must be app-wide
	static #joiningChats: Set<string> = new Set();
	static #leavingChats: Set<string> = new Set();

	constructor()
	{
		this.#store = Core.getStore();
		this.#restClient = Core.getRestClient();
	}

	async leaveChat(dialogId: string): void
	{
		if (UserService.#leavingChats.has(dialogId))
		{
			return;
		}
		UserService.#leavingChats.add(dialogId);

		const queryParams = { dialogId, userId: Core.getUserId() };
		try
		{
			await this.#restClient.callMethod(RestMethod.imV2ChatDeleteUser, queryParams);
			this.#onChatLeave(dialogId);
		}
		catch (result)
		{
			console.error('UserService: leave chat error', result.error());
			Notifier.chat.handleLeaveError(result.error());
		}
		finally
		{
			UserService.#leavingChats.delete(dialogId);
		}
	}

	async leaveCollab(dialogId: string): void
	{
		const payload = {
			data: { dialogId },
		};

		try
		{
			await runAction(RestMethod.socialnetworkMemberLeave, payload);
			this.#onChatLeave(dialogId);
		}
		catch (errors)
		{
			console.error('UserService: leave collab error', errors[0]);
			Notifier.collab.onLeaveError(errors[0]);
		}
	}

	async kickUserFromChat(dialogId: string, userId: number): void
	{
		const queryParams = { dialogId, userId };
		await this.#restClient.callMethod(RestMethod.imV2ChatDeleteUser, queryParams)
			.catch((result: RestResult) => {
				console.error('UserService: error kicking from chat', result.error());
				Notifier.chat.handleUserKickError(result.error());
			});
	}

	async kickUserFromCollab(dialogId: string, userId: number): void
	{
		const members = Utils.user.prepareSelectorIds(userId);
		const payload = {
			data: { dialogId, members },
		};

		await runAction(RestMethod.socialnetworkMemberDelete, payload)
			.catch(([error]) => {
				console.error('UserService: error kicking from collab', error);
				Notifier.collab.onKickUserError(error);
			});
	}

	addToChat(addConfig: {chatId: number, members: Array<string | number>, showHistory: boolean}): Promise
	{
		const { chatId, members, showHistory } = addConfig;
		const payload = {
			data: { chatId, userIds: members, hideHistory: !showHistory },
		};

		return runAction(RestMethod.imV2ChatAddUsers, payload)
			.catch(([error]) => {
				console.error('UserService: error adding to chat', error);
				throw error;
			});
	}

	async addSelection(selectionConfig: AddSelectionConfig): Promise<boolean>
	{
		const { chatId, userIds, nodes, showHistory } = selectionConfig;

		const [usersError, nodesError] = await Promise.all([
			this.#addUsers(chatId, userIds, showHistory),
			this.#linkNodes(chatId, nodes),
		]);

		if (!usersError && !nodesError)
		{
			return true;
		}

		Notifier.chat.handleSelectionAddError(usersError, nodesError);

		return false;
	}

	async joinChat(dialogId: string): Promise<boolean>
	{
		if (UserService.#joiningChats.has(dialogId))
		{
			return false;
		}
		UserService.#joiningChats.add(dialogId);

		Logger.warn(`UserService: join chat ${dialogId}`);
		const { role: previousRole, type }: ImModelChat = this.#store.getters['chats/get'](dialogId, true);
		const isChannel = CHANNEL_TYPES.has(type);
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { role: UserRole.member },
		});

		try
		{
			await this.#restClient.callMethod(RestMethod.imV2ChatJoin, { dialogId });
			if (isChannel)
			{
				Notifier.chat.onChannelSubscribeComplete();
			}

			return true;
		}
		catch (result)
		{
			console.error('UserService: error joining chat', result.error());
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: { role: previousRole },
			});
			Notifier.chat.handleJoinError(isChannel);

			return false;
		}
		finally
		{
			UserService.#joiningChats.delete(dialogId);
		}
	}

	addManager(dialogId: string, userId: number)
	{
		Logger.warn(`UserService: add manager ${userId} to ${dialogId}`);
		const { managerList }: ImModelChat = this.#store.getters['chats/get'](dialogId);
		if (managerList.includes(userId))
		{
			return;
		}
		const newManagerList = [...managerList, userId];
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { managerList: newManagerList },
		});

		const payload = {
			data: {
				dialogId,
				userIds: [userId],
			},
		};

		runAction(RestMethod.imV2ChatAddManagers, payload)
			.catch(([error]) => {
				console.error('UserService: add manager error', error);
			});
	}

	removeManager(dialogId: string, userId: number): void
	{
		Logger.warn(`UserService: remove manager ${userId} from ${dialogId}`);
		const { managerList }: ImModelChat = this.#store.getters['chats/get'](dialogId);
		if (!managerList.includes(userId))
		{
			return;
		}
		const newManagerList = managerList.filter((managerId) => managerId !== userId);
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { managerList: newManagerList },
		});

		const payload = {
			data: {
				dialogId,
				userIds: [userId],
			},
		};

		runAction(RestMethod.imV2ChatDeleteManagers, payload)
			.catch(([error]) => {
				console.error('UserService: remove manager error', error);
			});
	}

	async #addUsers(
		chatId: number,
		userIds: Array<string | number>,
		showHistory: boolean,
	): Promise<RunActionError | null>
	{
		if (userIds.length === 0)
		{
			return null;
		}

		return this.addToChat({ chatId, members: userIds, showHistory })
			.then(() => null)
			.catch((error: RunActionError) => error ?? UNREPORTED_CALL_ERROR);
	}

	async #linkNodes(chatId: number, nodes: SelectorEntityItem[]): Promise<RunActionError | null>
	{
		if (nodes.length === 0)
		{
			return null;
		}

		const payload = {
			data: { chatId, entities: nodes },
		};

		return runAction(RestMethod.imV2ChatStructureLink, payload)
			.then(() => null)
			.catch(([error]) => {
				console.error('UserService: error linking structure nodes to chat', error);

				return error ?? UNREPORTED_CALL_ERROR;
			});
	}

	#onChatLeave(dialogId: string): void
	{
		// open channel stays readable after unsubscribe: keep its load state and show the join CTA again
		const { type }: ImModelChat = this.#store.getters['chats/get'](dialogId, true);
		const isOpenChannel = type === ChatType.openChannel;

		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: isOpenChannel ? { role: UserRole.guest } : { inited: false, role: UserRole.guest },
		});

		void this.#store.dispatch('recent/pin', { dialogId, action: false });
		void this.#store.dispatch('recent/hide', { dialogId });

		if (!isOpenChannel)
		{
			LayoutManager.getInstance().clearCurrentChat(dialogId);
		}
	}
}
