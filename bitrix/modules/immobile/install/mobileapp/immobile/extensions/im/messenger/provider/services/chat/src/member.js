/**
 * @module im/messenger/provider/services/chat/src/member
 */
jn.define('im/messenger/provider/services/chat/src/member', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class MemberService
	 */
	class MemberService
	{
		/**
		 * @param {number} chatId
		 * @param {Array<number>} userIds
		 * @return {Promise<{usersInChat: Array<number>, usersNotInChat: Array<number>, users: Array<{id, avatar, name, type}>}>}
		 */
		async checkParticipation(chatId, userIds)
		{
			return runAction(RestMethod.imV2ChatMemberCheckMembership, {
				data: {
					chatId,
					userIds,
				}
			});
		}
	}

	module.exports = { MemberService };
});
