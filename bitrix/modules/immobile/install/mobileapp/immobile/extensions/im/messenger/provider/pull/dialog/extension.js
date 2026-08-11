/**
 * @module im/messenger/provider/pull/dialog
 */
jn.define('im/messenger/provider/pull/dialog', (require, exports, module) => {
	/* global ChatDataConverter */
	const { Type } = require('type');
	const { clone } = require('utils/object');
	const { unique } = require('utils/array');

	const {
		UserRole,
		DialogType,
		MessagesAutoDeleteDelay,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { Feature } = require('im/messenger/lib/feature');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatDeletionOrigin, ChatDeletionReason } = require('im/messenger/application/lib/chat-deletion-manager');

	const { InputActionListener } = require('im/messenger/provider/pull/lib/input-action-listener');

	/**
	 * @class DialogPullHandler
	 */
	class DialogPullHandler extends BasePullHandler
	{
		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--dialog-v2', DialogPullHandler) });
		}

		/**
		 * @param {ChatUpdatePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatUpdate:', params, extra);

			await this.store.dispatch('dialoguesModel/update', {
				dialogId: params.chat.dialogId,
				fields: params.chat,
			});
		}

		/**
		 * @desc yep use for backgroundId and textFieldEnabled fields
		 * @param {ChatUpdateFieldsPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatFieldsUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatFieldsUpdate:', params, extra);

			await this.store.dispatch('dialoguesModel/update', {
				dialogId: params.dialogId,
				fields: params,
			});
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatCopilotRoleUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatCopilotRoleUpdate:', params);

			await this.store.dispatch(
				'dialoguesModel/copilotModel/updateRole',
				{
					dialogId: params.dialogId,
					fields: {
						chats: params.copilotRole.chats,
						roles: params.copilotRole.roles,
					},
				},
			);
		}

		/**
		 * @param {ChatMuteNotifyPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatMuteNotify(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatMuteNotify:', params);

			if (params.lines)
			{
				this.logger.info('handleChatMuteNotify skip openline mute:', params);

				return;
			}
			const { dialogId, muted } = params;

			const dialog = clone(this.#getDialogModel(dialogId));
			if (Type.isUndefined(dialog))
			{
				return;
			}

			const muteList = new Set(dialog.muteList);
			if (muted)
			{
				muteList.add(MessengerParams.getUserId());
			}
			else
			{
				muteList.delete(MessengerParams.getUserId());
			}

			await this.store.dispatch('dialoguesModel/set', [
				{
					dialogId,
					muteList: [...muteList],
				},
			]);

			await this.store.dispatch('sidebarModel/changeMute', {
				dialogId,
				isMute: muted,
			});
		}

		/**
		 * @param {ChatRenamePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatRename(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatRename:', params);

			const dialogId = `chat${params.chatId}`;
			const name = params.name;

			await this.store.dispatch('dialoguesModel/update', {
				dialogId,
				fields: { name },
			});
		}

		/**
		 * @param {{chatId: number, dialogId: DialogId}} params
		 * @param {PullExtraParams} extra
		 */
		async handleSetCopilotTitle(params, extra)
		{
			if (this.interceptEvent(extra) || !Feature.isAvatarRadialGradientEnabled)
			{
				return;
			}

			this.logger.info('handleSetCopilotTitle:', params);

			await this.store.dispatch('dialoguesModel/copilotModel/updateTitleIsCustom', {
				dialogId: params.dialogId,
				titleIsCustom: true,
			});
		}

		/**
		 * @desc maybe it is legacy and not used
		 * @param {GeneralChatIdPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		handleGeneralChatId(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleGeneralChatId:', params);

			if (ChatDataConverter)
			{
				ChatDataConverter.generalChatId = params.id;
			}

			MessengerParams.setGeneralChatId(params.id);
		}

		/**
		 * @param {ChatUserAddPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatUserAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatUserAdd:', params, extra);
			const {
				dialogId,
				newUsers,
				userCount,
				users,
				chatExtranet = false,
				containsCollaber = false,
			} = params || {};

			const dialogModel = this.#getDialogModel(dialogId);

			unique(newUsers).forEach((userId) => {
				const userDialogModel = this.#getDialogModel(userId);
				if (userDialogModel)
				{
					void this.store.dispatch('sidebarModel/sidebarCommonChatsModel/set', {
						chatId: userDialogModel.chatId,
						chats: [dialogModel],
					});
				}
			});

			/** @type {Partial<DialoguesModelState>} */
			const dialogUpdatingFields = {};

			if (Boolean(dialogModel?.extranet) !== chatExtranet)
			{
				dialogUpdatingFields.extranet = chatExtranet;
			}

			if (Boolean(dialogModel?.containsCollaber) !== containsCollaber)
			{
				dialogUpdatingFields.containsCollaber = containsCollaber;
			}

			if (newUsers.includes(MessengerParams.getUserId()))
			{
				dialogUpdatingFields.role = UserRole.member;
			}

			if (Object.keys(dialogUpdatingFields).length > 0)
			{
				await this.store.dispatch('dialoguesModel/update', {
					dialogId,
					fields: dialogUpdatingFields,
				});
			}

			await this.store.dispatch('usersModel/set', Object.values(users));
			await this.store.dispatch('dialoguesModel/addParticipants', {
				dialogId,
				participants: newUsers,
				userCounter: userCount,
			});
		}

		/**
		 * @param {ChatUserLeavePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatUserLeave(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatUserLeave:', params);

			const {
				userId,
				chatId,
				dialogId,
				userCount,
				chatExtranet,
				containsCollaber,
			} = params;

			const userDialogModel = this.#getDialogModel(userId);

			void this.store.dispatch('sidebarModel/sidebarCommonChatsModel/delete', {
				chatId: userDialogModel?.chatId,
				id: chatId,
			});

			if (Number(userId) === MessengerParams.getUserId())
			{
				// removeParticipants / extranet update below run for every leave (not only
				// the current user's) and no-op on a missing dialog, so they stay here.
				await serviceLocator.get('chat-deletion-manager').leave({ dialogId, chatId });
			}

			await this.store.dispatch('dialoguesModel/removeParticipants', {
				dialogId,
				participants: [userId],
				userCounter: userCount,
			});

			const dialogModel = this.#getDialogModel(dialogId);
			/** @type {Partial<DialoguesModelState>} */
			const dialogUpdatingFields = {};

			if (Boolean(dialogModel?.extranet) !== chatExtranet)
			{
				dialogUpdatingFields.extranet = chatExtranet;
			}

			if (Boolean(dialogModel?.containsCollaber) !== containsCollaber)
			{
				dialogUpdatingFields.containsCollaber = containsCollaber;
			}

			if (Object.keys(dialogUpdatingFields).length > 0)
			{
				await this.store.dispatch('dialoguesModel/update', {
					dialogId,
					fields: dialogUpdatingFields,
				});
			}
		}

		/**
		 * @param {ChatAvatarPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatAvatar(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatAvatar:', params);

			const dialogId = `chat${params.chatId}`;

			await this.store.dispatch('dialoguesModel/update', { dialogId, fields: { avatar: params.avatar } });
		}

		/**
		 * @param {CommentSubscribePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleCommentSubscribe(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleCommentSubscribe:', params);
			if (params.subscribe)
			{
				await this.store.dispatch('commentModel/subscribe', { messageId: params.messageId });
				await this.store.dispatch('dialoguesModel/unmute', {
					dialogId: params.dialogId,
				});

				return;
			}

			await this.store.dispatch('commentModel/unsubscribe', { messageId: params.messageId });
			await this.store.dispatch('dialoguesModel/mute', {
				dialogId: params.dialogId,
			});
		}

		/**
		 * @param {ChatManagersPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatManagers(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatManagers:', params);
			await this.store.dispatch('dialoguesModel/updateManagerList', {
				dialogId: params.dialogId,
				managerList: params.list,
			});
		}

		/**
		 * @param {ChatDeletePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChatDelete:', params, extra);

			if ([DialogType.openChannel, DialogType.channel].includes(params.type))
			{
				void this.store.dispatch('commentModel/deleteChannelCounters', {
					channelId: params.chatId,
				});
			}

			if (params.type === DialogType.comment)
			{
				void this.store.dispatch('commentModel/setCounters', {
					[params.parentChatId]: {
						[params.chatId]: 0,
					},
				});
			}

			// No userId self-check here on purpose: it would wrongly skip chats deleted
			// from other devices by the same user. The echo of a local delete is a no-op.
			await serviceLocator.get('chat-deletion-manager').delete({
				dialogId: params.dialogId,
				chatId: params.chatId,
				origin: ChatDeletionOrigin.pull,
				reason: ChatDeletionReason.delete,
			});
		}

		/**
		 * @param {InputActionNotifyPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleInputActionNotify(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { dialogId, userId } = params;
			if (!this.#getDialogModel(dialogId))
			{
				return;
			}

			this.logger.info('handleInputActionNotify:', params);

			await this.store.dispatch('usersModel/update', [
				{
					id: userId,
					fields: {
						id: userId,
						lastActivityDate: new Date(),
					},
				},
			]);
			await this.store.dispatch('dialoguesModel/setInputAction', { ...params });

			InputActionListener.getInstance().startInputAction({ ...params });
		}

		/**
		 * @param {MessagesAutoDeleteDelayParams} params
		 * @param {PullExtraParams} extra
		 */
		handleMessagesAutoDeleteDelayChanged(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleMessagesAutoDeleteDelayChanged params:', params, extra);

			if (params.delay !== MessagesAutoDeleteDelay.off)
			{
				Feature.updateExistingImFeatures({ messagesAutoDeleteEnabled: true });
			}

			this.store.dispatch('dialoguesModel/update', {
				dialogId: String(params.dialogId),
				fields: {
					messagesAutoDeleteDelay: params.delay,
				},
			});
		}

		/**
		 * @param {CopilotChangeEnginePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		handleChangeEngine(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChangeEngine params:', params, extra);
			const dialogHelper = DialogHelper.createByChatId(params.chatId);

			this.store.dispatch(
				'dialoguesModel/copilotModel/update',
				{
					dialogId: dialogHelper.dialogId,
					fields: {
						engine: { code: params.engineCode, name: params.engineName },
						changeEngine: false,
					},
				},
			);
		}

		/**
		 * @param {DialogId} dialogId
		 * @returns {?DialoguesModelState}
		 */
		#getDialogModel(dialogId)
		{
			return this.store.getters['dialoguesModel/getById'](dialogId);
		}
	}

	module.exports = {
		DialogPullHandler,
	};
});
