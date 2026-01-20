/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/provider/data/reaction
 */
jn.define('im/messenger/provider/data/reaction', (require, exports, module) => {
	const { Type } = require('type');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { BaseDataProvider } = require('im/messenger/provider/data/base');
	const { ReactionSetter } = require('im/messenger/provider/data/reaction/setter');
	const { ReactionDeleter } = require('im/messenger/provider/data/reaction/deleter');

	const logger = getLoggerWithContext('data-provider--recent', 'ReactionDataProvider');

	/**
	 * @class ReactionDataProvider
	 */
	class ReactionDataProvider extends BaseDataProvider
	{
		#setter = new ReactionSetter();
		#deleter = new ReactionDeleter();

		/**
		 * @param {'model' | 'database'} source
		 * @param {ReactionsModelState|RawReaction} data
		 */
		setToSource(source, data)
		{
			logger.log('setToSource', source, data);

			if (Type.isNil(data))
			{
				return;
			}

			if (source === BaseDataProvider.source.database)
			{
				return this.#setter.setToDatabase(data);
			}
		}

		/**
		 * @param {'model' | 'database'} source
		 * @param {ReactionsModelState|RawReaction} data
		 */
		async deleteFromSource(source, data)
		{
			logger.log('deleteFromSource', source, data);

			if (source === BaseDataProvider.source.database)
			{
				return this.#deleter.deleteFromDatabase(data);
			}
		}
	}

	module.exports = { ReactionDataProvider };
});
