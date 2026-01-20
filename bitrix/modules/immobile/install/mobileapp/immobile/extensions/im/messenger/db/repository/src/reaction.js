/**
 * @module im/messenger/db/repository/reaction
 */
jn.define('im/messenger/db/repository/reaction', (require, exports, module) => {
	const { Type } = require('type');

	const {
		ReactionTable,
	} = require('im/messenger/db/table');

	/**
	 * @class ReactionRepository
	 */
	class ReactionRepository
	{
		constructor()
		{
			this.reactionTable = new ReactionTable();
		}

		/**
		 * @param {number} chatId
		 */
		async deleteByChatId(chatId)
		{
			return this.reactionTable.deleteByChatId(chatId);
		}

		async saveFromModel(reactionList)
		{
			const reactionListToAdd = [];

			reactionList.forEach((reaction) => {
				// eslint-disable-next-line no-param-reassign
				const reactionToAdd = this.reactionTable.validate(reaction);

				reactionListToAdd.push(reactionToAdd);
			});

			return this.reactionTable.add(reactionListToAdd, true);
		}

		/**
		 * @param {Array<ReactionsModelState|RawReaction>} reactionList
		 */
		async saveFromRestWithDeleteEmpty(reactionList)
		{
			const toUpdate = [];
			const toDelete = [];

			for (const reaction of reactionList)
			{
				const reactionToAdd = this.validateRestReaction(reaction);

				if (this.isEmptyReaction(reactionToAdd))
				{
					if (Type.isNumber(reactionToAdd.messageId))
					{
						toDelete.push(reactionToAdd.messageId);
					}
				}
				else
				{
					toUpdate.push(this.reactionTable.validate(reactionToAdd));
				}
			}

			if (toDelete.length > 0)
			{
				await this.reactionTable.deleteByMessageIdList(toDelete);
			}

			if (toUpdate.length > 0)
			{
				return this.reactionTable.add(toUpdate, true);
			}

			return false;
		}

		/**
		 * @param {ReactionsModelState|RawReaction} reaction
		 * @returns {boolean}
		 */
		isEmptyReaction(reaction)
		{
			const { ownReactions, reactionCounters, reactionUsers } = reaction;

			const isEmptyArray = (value) => Type.isArray(value) && !Type.isArrayFilled(value);
			const isEmptyObject = (value) => Type.isObject(value) && Object.keys(value).length === 0;

			const noOwnReactions = Type.isNil(ownReactions) || isEmptyArray(ownReactions);
			const noCounters = isEmptyArray(reactionCounters) || isEmptyObject(reactionCounters);
			const noUsers = isEmptyArray(reactionUsers) || isEmptyObject(reactionUsers);

			return noOwnReactions && noCounters && noUsers;
		}

		async saveFromRest(reactionList)
		{
			const reactionListToAdd = [];

			reactionList.forEach((reaction) => {
				const reactionToAdd = this.reactionTable.validate(this.validateRestReaction(reaction));

				reactionListToAdd.push(reactionToAdd);
			});

			return this.reactionTable.add(reactionListToAdd, true);
		}

		async getListByMessageIds(messageIdList)
		{
			return this.reactionTable.getListByMessageIds(messageIdList);
		}

		validateRestReaction(reaction)
		{
			let result = {};

			if (Type.isStringFilled(reaction.dialogId))
			{
				result.dialogId = reaction.dialogId;
			}

			if (Type.isNumber(reaction.messageId))
			{
				result.messageId = reaction.messageId;
			}

			if (Type.isArrayFilled(reaction.ownReactions))
			{
				result.ownReactions = reaction.ownReactions;
			}

			if (Type.isObjectLike(reaction.reactionCounters))
			{
				result.reactionCounters = reaction.reactionCounters;
			}

			if (Type.isObjectLike(reaction.reactionUsers))
			{
				result.reactionUsers = reaction.reactionUsers;
			}

			return result;
		}
	}

	module.exports = {
		ReactionRepository,
	};
});
