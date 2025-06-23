/**
 * @module im/messenger/controller/sidebar-v2/user-actions/participants
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/participants', (require, exports, module) => {
	const { unique } = require('utils/array');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { EventType, ComponentCode } = require('im/messenger/const');
	const { openParticipantsSelector } = require(
		'im/messenger/controller/sidebar-v2/user-actions/participants/src/participants-selector',
	);
	const { addChat, addParticipants, deleteParticipant } = require(
		'im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service',
	);

	/**
	 * @param {DialogId} dialogId
	 * @param {Object} store
	 * @param {String} [widgetTitle]
	 * @returns {Promise<void>}
	 */
	async function onAddParticipants({ store, dialogId, widgetTitle } = {})
	{
		const selectedUsers = await openParticipantsSelector({
			store,
			dialogId,
			widgetTitle: widgetTitle || Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_ADD_PARTICIPANTS'),
		});

		const { participants } = store.getters['dialoguesModel/getById'](dialogId);
		const currentParticipantIds = unique(participants.filter(Boolean));
		const uniqueIds = selectedUsers.map(({ id }) => id).filter((id) => !currentParticipantIds.includes(id));

		if (uniqueIds.length === 0)
		{
			return Promise.reject();
		}

		const isCreateChat = !DialogHelper.isDialogId(dialogId);
		if (isCreateChat)
		{
			return addChat([...uniqueIds, ...currentParticipantIds]);
		}

		return addParticipants(dialogId, uniqueIds);
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
