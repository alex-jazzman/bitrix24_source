/**
 * @module mail/statemanager/redux/slices/messages/model/message
 */
jn.define('mail/statemanager/redux/slices/messages/model/message', (require, exports, module) => {
	class MessageModel
	{
		/**
		 * @public
		 * @param {object} sourceServerMessage
		 * @returns {MessageReduxModel}
		 */
		static prepareReduxMailFromServer(sourceServerMessage)
		{
			return {
				direction: Number(sourceServerMessage.direction),
				id: Number(sourceServerMessage.id),
				uidId: sourceServerMessage.uidId,
				to: sourceServerMessage.to,
				from: sourceServerMessage.from,
				date: sourceServerMessage.date,
				isRead: sourceServerMessage.isRead,
				isRemoved: sourceServerMessage.isRemoved,
				isSelected: sourceServerMessage.isSelected,
				crmBindId: sourceServerMessage.crmBindId,
				taskBindId: sourceServerMessage.taskBindId,
				crmBindTypeId: sourceServerMessage.crmBindTypeId,
				chatBindId: sourceServerMessage.chatBindId,
				subject: sourceServerMessage.subject,
				abbreviatedText: sourceServerMessage.abbreviatedText,
				withAttachments: sourceServerMessage.withAttachments,
			};
		}
	}

	module.exports = { MessageModel };
});
