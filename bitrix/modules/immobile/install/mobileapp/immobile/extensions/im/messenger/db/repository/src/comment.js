/**
 * @module im/messenger/db/repository/comment
 */
jn.define('im/messenger/db/repository/comment', (require, exports, module) => {
	const { Type } = require('type');

	const { CommentTable } = require('im/messenger/db/table');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('repository--copilot', 'CommentRepository');

	/**
	 * @class CommentRepository
	 */
	class CommentRepository
	{
		constructor()
		{
			/**
			 * @type {CommentTable}
			 */
			this.commentTable = new CommentTable();
		}

		/**
		 * @param {Array<RelationCommentInfo>} relationCommentInfoList
		 * @return {Promise<{lastInsertId: number, columns: *[], changes: number, rows: *[], errors: Error[]}|void>}
		 */
		async saveFromModel(relationCommentInfoList)
		{
			const commentListToAdd = [];
			relationCommentInfoList.forEach((relationCommentInfo) => {
				const commentToAdd = this.commentTable.validate(relationCommentInfo);

				commentListToAdd.push(commentToAdd);
			});

			return this.commentTable.add(commentListToAdd, true);
		}

		/**
		 * @param {Array<RestCommentInfo>} commentInfoList
		 * @return {Promise<{lastInsertId: number, columns: *[], changes: number, rows: *[], errors: Error[]}|void>}
		 */
		async saveFromRest(commentInfoList)
		{
			const commentListToAdd = [];
			commentInfoList.forEach((commentInfo) => {
				// the row is written whole, so a cell without the parent chat would break
				// the reading by parent chat at a cold start
				if (!Type.isNumber(commentInfo.parentChatId) || commentInfo.parentChatId <= 0)
				{
					logger.warn(`${this.constructor.name}.saveFromRest: cell without parent chat`, commentInfo);

					return;
				}

				commentListToAdd.push(this.commentTable.validate(this.#convertRestToTableFormat(commentInfo)));
			});

			return this.commentTable.add(commentListToAdd, true);
		}

		/**
		 * @param {number} commentChatId
		 * @return {Promise<RelationCommentInfo | null>}
		 */
		async getByCommentChatId(commentChatId)
		{
			return this.commentTable.getById(commentChatId);
		}

		/**
		 * @param {number} parentChatId
		 * @return {Array<RelationCommentInfo>}
		 */
		async getByParentChatId(parentChatId)
		{
			const result = await this.commentTable.getList({ filter: { parentChatId } });

			logger.log(`${this.constructor.name}.getByParentChatId.items:`, result?.items);

			return result?.items ?? [];
		}

		/**
		 * @param {number} parentChatId
		 * @return {Promise<void>}
		 */
		async deleteByParentChatId(parentChatId)
		{
			return this.commentTable.delete({
				parentChatId,
			});
		}

		/**
		 * @param {RestCommentInfo} commentInfo
		 * @return {RelationCommentInfo}
		 */
		#convertRestToTableFormat(commentInfo)
		{
			/** @type {RelationCommentInfo} */
			const row = {
				commentChatId: commentInfo.chatId,
				parentMessageId: commentInfo.messageId,
				parentChatId: commentInfo.parentChatId,
			};

			// an absent value differs from a zero: the plate of a row without data looks as it does today
			if (Type.isNumber(commentInfo.messageCount))
			{
				row.messageCount = commentInfo.messageCount;
			}

			if (Type.isArray(commentInfo.lastUserIds))
			{
				row.lastUserIds = commentInfo.lastUserIds;
			}

			return row;
		}
	}

	module.exports = {
		CommentRepository,
	};
});
