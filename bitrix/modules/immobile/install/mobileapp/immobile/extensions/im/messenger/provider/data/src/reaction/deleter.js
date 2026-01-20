/**
 * @module im/messenger/provider/data/reaction/deleter
 */
jn.define('im/messenger/provider/data/reaction/deleter', (require, exports, module) => {
	const { BaseDataProvider } = require('im/messenger/provider/data/base');

	/**
	 * @class ReactionDeleter
	 */
	class ReactionDeleter extends BaseDataProvider
	{
		/**
		 * @param {ReactionsModelState|RawReaction} data
		 */
		async deleteFromDatabase(data)
		{
			return this.repository.reaction.saveFromRestWithDeleteEmpty([data]);
		}
	}

	module.exports = { ReactionDeleter };
});
