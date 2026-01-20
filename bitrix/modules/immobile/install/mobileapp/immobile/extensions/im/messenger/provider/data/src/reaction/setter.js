/**
 * @module im/messenger/provider/data/reaction/setter
 */
jn.define('im/messenger/provider/data/reaction/setter', (require, exports, module) => {
	const { BaseDataProvider } = require('im/messenger/provider/data/base');

	/**
	 * @class ReactionSetter
	 */
	class ReactionSetter extends BaseDataProvider
	{
		/**
		 * @param {ReactionsModelState|RawReaction} data
		 */
		async setToDatabase(data)
		{
			return this.repository.reaction.saveFromRest([data]);
		}
	}

	module.exports = { ReactionSetter };
});
