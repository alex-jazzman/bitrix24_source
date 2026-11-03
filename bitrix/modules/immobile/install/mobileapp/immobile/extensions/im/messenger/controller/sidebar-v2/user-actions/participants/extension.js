/**
 * @module im/messenger/controller/sidebar-v2/user-actions/participants
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/participants', (require, exports, module) => {
	const { unique } = require('utils/array');
	const { Loc } = require('im/messenger/loc');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { requireLazy } = require('require-lazy');
	const { Analytics, EventType, ComponentCode } = require('im/messenger/const');
	const { addChat, addParticipants, deleteParticipant } = require(
		'im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service',
	);
	const { MemberSelector } = require('im/messenger/controller/selector/member');
	const { MemberEntitySelector } = require('im/messenger/controller/selector/member-entity');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { DialogType } = require('im/messenger/const');
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');

	/**
	 * @param {DialogId} dialogId
	 * @param {Object} store
	 * @param {String} [widgetTitle]
	 * @returns {Promise<void>}
	 */
	async function onAddParticipants({ store, dialogId, widgetTitle } = {})
	{
		const dialog = store.getters['dialoguesModel/getById'](dialogId);

		if (!dialog)
		{
			return Promise.reject(new Error('openParticipantsAddWidget: unknown dialog'));
		}

		AnalyticsService.getInstance().sendUserAddButtonClicked({
			dialogId,
			section: Analytics.Section.chatSidebar,
		});

		if (dialog.type === DialogType.collab)
		{
			const collabId = store.getters['dialoguesModel/collabModel/getCollabIdByDialogId'](dialogId);
			if (Type.isNumber(collabId))
			{
				const { openCollabInvite, CollabInviteAnalytics } = await requireLazy('collab/invite');
				openCollabInvite({
					collabId,
					analytics: new CollabInviteAnalytics()
						.setSection(CollabInviteAnalytics.Section.CHAT_SIDEBAR)
						.setChatId(dialog.chatId),
				});
			}

			return Promise.resolve();
		}

		const isGuestInviteAvailableChat = dialog.type === DialogType.chat || dialog.type === DialogType.calendar;
		if (isGuestInviteAvailableChat && Feature.isChatWithGuestsAvailable && ChatPermission.canInviteGuests(dialogId))
		{
			const { ChatInviteController } = await requireLazy('im:messenger/controller/chat-invite');
			ChatInviteController.open({
				dialogId,
				store,
			});

			return Promise.resolve();
		}

		// "+" in a conversation with a single person starts a new group chat instead of adding
		// anybody to this one, so the composition of a chat is neither read nor preselected there.
		if (!DialogHelper.isDialogId(dialogId))
		{
			return openCreateChatSelector({ store, dialogId, widgetTitle });
		}

		return new Promise((resolve, reject) => {
			const selector = new MemberEntitySelector({
				dialogId,
				title: widgetTitle,
				sendButtonName: Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_BUTTON_SELECTOR_ADD'),
				onSelectMemberEntities: (addedEntities) => {
					addParticipants(dialogId, addedEntities)
						.then(resolve)
						.catch(reject);
				},
			});

			// A selector that never opened settles the promise of the entry point with the refusal:
			// its caller waits for it and has nothing else to learn the failure from.
			selector.open().catch(reject);
		});
	}

	/**
	 * @desc Picks the people a new group chat is started with. The org structure is out of this
	 * scenario: there is no chat to link a node to until the chat is created.
	 * @param {Object} store
	 * @param {DialogId} dialogId
	 * @param {String} [widgetTitle]
	 * @return {Promise<{chatId: number, dialogId: string}|null>}
	 */
	function openCreateChatSelector({ store, dialogId, widgetTitle })
	{
		return new Promise((resolve, reject) => {
			const selector = new MemberSelector({
				title: widgetTitle,
				excludeGuests: true,
				onSelectMembers: (selectedUsersIds) => {
					try
					{
						const { participants } = store.getters['dialoguesModel/getById'](dialogId);
						const currentParticipantIds = unique(participants.filter(Boolean));
						const uniqueIds = selectedUsersIds.filter((id) => !currentParticipantIds.includes(id));

						if (uniqueIds.length === 0)
						{
							reject();

							return;
						}

						addChat([...uniqueIds, ...currentParticipantIds])
							.then(resolve)
							.catch(reject);
					}
					catch (error)
					{
						reject(error);
					}
				},
			});

			selector.open();
		});
	}

	/**
	 * @desc Handler remove participant
	 * @param {DialogId} dialogId
	 * @param {number} userId
	 * @return {Promise<boolean>}
	 */
	function onRemoveParticipant(dialogId, userId)
	{
		return deleteParticipant(dialogId, userId);
	}

	/**
	 * @desc Handler on click send user from participants menu
	 * @param {DialogId} dialogId
	 */
	function onSendMessage(dialogId)
	{
		MessengerEmitter.emit(
			EventType.messenger.openDialog,
			{ dialogId },
			ComponentCode.imMessenger,
		);
	}

	module.exports = {
		onSendMessage,
		onAddParticipants,
		onRemoveParticipant,
	};
});
