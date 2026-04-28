/**
 * @module im/messenger/const/src/chat-entity-link
 */
jn.define('im/messenger/const/src/chat-entity-link', (require, exports, module) => {
	const ChatEntityType = Object.freeze({
		tasks: 'TASKS',
		sonetGroup: 'SONET_GROUP',
		mail: 'MAIL',
		calendar: 'CALENDAR',
		contact: 'CONTACT',
		deal: 'DEAL',
		lead: 'LEAD',
		dynamic: 'DYNAMIC',
		company: 'COMPANY',
	});

	module.exports = {
		ChatEntityType,
	};
});
