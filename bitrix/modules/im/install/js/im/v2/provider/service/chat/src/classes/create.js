import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RestMethod, ChatType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';
import { getChatRoleForUser } from 'im.v2.lib.role-manager';

import { type ChatCreateConfig, type CollabCreateConfig } from '../types/create-chat';

type CreateChatResult = { chatId: number };

export class CreateService
{
	async createChat(chatConfig: ChatCreateConfig): Promise<{ newDialogId: string, newChatId: number }>
	{
		Logger.warn('ChatService: createChat', chatConfig);

		const preparedFields = await this.#prepareFields(chatConfig);
		const payload = {
			data: { fields: preparedFields },
		};

		const createResult: CreateChatResult = await runAction(RestMethod.imV2ChatAdd, payload)
			.catch(([error]) => {
				console.error('ChatService: createChat error:', error);
				Notifier.chat.handleCreateError(error.error());
				throw error;
			});

		const { chatId: newChatId } = createResult;

		Logger.warn('ChatService: createChat result', newChatId);
		const newDialogId = Utils.dialog.buildChatDialogId(newChatId);
		this.#addChatToModel(newDialogId, chatConfig);
		Analytics.getInstance().ignoreNextChatOpen(newDialogId);

		return { newDialogId, newChatId };
	}

	async createCollab(collabConfig: CollabCreateConfig): Promise<{ newDialogId: string, newChatId: number }>
	{
		Logger.warn('ChatService: createCollab', collabConfig);

		const preparedFields = await this.#prepareFields(collabConfig);

		const params = {
			ownerId: preparedFields.ownerId,
			name: preparedFields.title,
			description: preparedFields.description,
			avatarId: preparedFields.avatar,
			moderatorMembers: Utils.user.prepareSelectorIds(collabConfig.moderatorMembers),
			permissions: collabConfig.permissions,
			options: {
				...collabConfig.options,
				messagesAutoDeleteDelay: preparedFields.messagesAutoDeleteDelay,
			},
		};

		const createResult: CreateChatResult = await runAction(RestMethod.socialnetworkCollabCreate, {
			data: params,
		}).catch(([error]) => {
			console.error('ChatService: createCollab error:', error);
			Notifier.collab.handleCreateError(error);
			throw error;
		});

		const { chatId: newChatId } = createResult;

		Logger.warn('ChatService: createCollab result', newChatId);
		const newDialogId = Utils.dialog.buildChatDialogId(newChatId);
		this.#addCollabToModel(newDialogId, preparedFields);
		Analytics.getInstance().ignoreNextChatOpen(newDialogId);

		return { newDialogId, newChatId };
	}

	async #prepareFields(chatConfig: ChatCreateConfig): ChatCreateConfig
	{
		const preparedConfig = { ...chatConfig };
		if (preparedConfig.type)
		{
			preparedConfig.type = this.#prepareType(preparedConfig.type);
		}

		if (preparedConfig.entityType)
		{
			preparedConfig.entityType = this.#prepareType(preparedConfig.entityType);
		}

		if (preparedConfig.avatar)
		{
			preparedConfig.avatar = await Utils.file.getBase64(chatConfig.avatar);
		}

		return preparedConfig;
	}

	#addCollabToModel(newDialogId: string, collabConfig: CollabCreateConfig): void
	{
		void Core.getStore().dispatch('chats/set', {
			dialogId: newDialogId,
			type: ChatType.collab,
			name: collabConfig.title,
		});
	}

	#addChatToModel(newDialogId: string, chatConfig: ChatCreateConfig): void
	{
		let chatType = chatConfig.searchable ? ChatType.open : ChatType.chat;
		if (Type.isStringFilled(chatConfig.entityType))
		{
			chatType = chatConfig.entityType;
		}

		if (Type.isStringFilled(chatConfig.type))
		{
			chatType = chatConfig.type;
		}

		void Core.getStore().dispatch('chats/set', {
			dialogId: newDialogId,
			type: chatType,
			name: chatConfig.title,
			role: getChatRoleForUser(chatConfig),
			parentChatId: chatConfig.parentChatId ?? 0,
			permissions: {
				manageUi: chatConfig.manageUi,
				manageSettings: chatConfig.manageSettings,
				manageUsersAdd: chatConfig.manageUsersAdd,
				manageUsersDelete: chatConfig.manageUsersDelete,
				manageMessages: chatConfig.manageMessages,
			},
		});
	}

	#prepareType(type: string): string
	{
		return Utils.text.convertCamelToSnakeCase(type).toUpperCase();
	}
}
