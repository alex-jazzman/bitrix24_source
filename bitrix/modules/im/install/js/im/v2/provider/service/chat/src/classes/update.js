import { isResizableImage, resizeImage } from 'ui.uploader.core';

import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction } from 'im.v2.lib.rest';
import { getChatRoleForUser } from 'im.v2.lib.role-manager';
import { Utils } from 'im.v2.lib.utils';

import { type ChatUpdateConfig, type CollabUpdateConfig, type GetMemberEntitiesConfig } from '../types/update-chat';

export class UpdateService
{
	async prepareAvatar(avatarFile: File): Promise<File>
	{
		if (!isResizableImage(avatarFile))
		{
			return Promise.reject(new Error('UpdateService: prepareAvatar: incorrect image'));
		}

		const MAX_AVATAR_SIZE = 180;
		const { preview: resizedAvatar } = await resizeImage(avatarFile, {
			width: MAX_AVATAR_SIZE,
			height: MAX_AVATAR_SIZE,
		});

		return resizedAvatar;
	}

	async changeAvatar(chatId: number, avatarFile: File): Promise
	{
		Logger.warn('ChatService: changeAvatar', chatId, avatarFile);
		const avatarInBase64 = await Utils.file.getBase64(avatarFile);

		return runAction(RestMethod.imV2ChatUpdateAvatar, {
			data: {
				id: chatId,
				avatar: avatarInBase64,
			},
		}).catch(([error]) => {
			console.error('ChatService: changeAvatar error:', error);
		});
	}

	async updateChat(chatId: number, chatConfig: ChatUpdateConfig): Promise<boolean>
	{
		Logger.warn(`ChatService: updateChat, chatId: ${chatId}`, chatConfig);

		const preparedFields = await this.#prepareFields(chatConfig);

		const payload = {
			id: chatId,
			fields: preparedFields,
		};

		const updateResult: boolean = await runAction(RestMethod.imV2ChatUpdate, { data: payload })
			.catch(([error]) => {
				console.error('ChatService: updateChat error:', error);
				Notifier.chat.onUpdateError();
				throw error;
			});

		Logger.warn('ChatService: updateChat result', updateResult);

		const dialogId = Utils.dialog.buildChatDialogId(chatId);
		await this.#updateChatInModel(dialogId, chatConfig);

		return updateResult;
	}

	async updateCollab(dialogId: string, collabConfig: CollabUpdateConfig): Promise<boolean>
	{
		Logger.warn(`ChatService: updateCollab, dialogId: ${dialogId}`, collabConfig);

		const preparedFields = await this.#prepareFields(collabConfig);

		let payload = {
			dialogId,
			name: preparedFields.title,
			description: preparedFields.description,
			avatarId: preparedFields.avatar,
		};

		if (collabConfig.groupSettings)
		{
			const groupSettings = collabConfig.groupSettings;
			payload = {
				...payload,
				ownerId: groupSettings.ownerId,
				addModeratorMembers: Utils.user.prepareSelectorIds(groupSettings.addModeratorMembers),
				deleteModeratorMembers: Utils.user.prepareSelectorIds(groupSettings.deleteModeratorMembers),
				permissions: groupSettings.permissions,
				options: groupSettings.options,
			};
		}

		const updateResult: boolean = await runAction(RestMethod.socialnetworkCollabUpdate, {
			data: payload,
		}).catch(([error]) => {
			console.error('ChatService: updateCollab error:', error);
			Notifier.collab.handleUpdateError(error);
			throw error;
		});

		Logger.warn('ChatService: updateCollab result', updateResult);

		return updateResult;
	}

	async getMemberEntities(chatId: number): Promise<GetMemberEntitiesConfig>
	{
		return runAction(RestMethod.imV2ChatMemberEntitiesList, {
			data: { chatId },
		}).catch(([error]) => {
			console.error('ChatService: getMemberEntities error:', error);
		});
	}

	async #prepareFields(chatConfig: ChatUpdateConfig): ChatUpdateConfig
	{
		const preparedConfig = { ...chatConfig };

		if (preparedConfig.avatar)
		{
			preparedConfig.avatar = await Utils.file.getBase64(chatConfig.avatar);
		}

		return preparedConfig;
	}

	#updateChatInModel(dialogId: string, chatConfig: ChatUpdateConfig): Promise
	{
		return Core.getStore().dispatch('chats/update', {
			dialogId,
			fields: {
				name: chatConfig.title,
				description: chatConfig.description,
				ownerId: chatConfig.ownerId,
				role: getChatRoleForUser(chatConfig),
				permissions: {
					manageUi: chatConfig.manageUi,
					manageUsersAdd: chatConfig.manageUsersAdd,
					manageUsersDelete: chatConfig.manageUsersDelete,
					manageMessages: chatConfig.manageMessages,
				},
			},
		});
	}
}
