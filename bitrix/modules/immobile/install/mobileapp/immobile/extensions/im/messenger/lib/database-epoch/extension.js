/**
 * @module im/messenger/lib/database-epoch
 */
jn.define('im/messenger/lib/database-epoch', (require, exports, module) => {
	const { Type } = require('type');
	const { CacheNamespace } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('lib--database-epoch');

	const STORAGE_ID = `${CacheNamespace}database-epoch`;
	const EPOCH_KEY = 'epoch';
	const INITIAL_EPOCH = 0;

	/**
	 * @desc Generation of the local database: raised on every drop of it, from any caller. Kept outside
	 * the database on purpose - a value stored inside would go away together with the very drop it has
	 * to outlive. View caches write the generation they were filled under and drop themselves on a
	 * mismatch, so a cache of a database that no longer exists never reaches the screen, no matter
	 * which list it belongs to and whether that list was ever opened in the session of the drop.
	 * @class DatabaseEpoch
	 */
	class DatabaseEpoch
	{
		/**
		 * @return {number}
		 */
		static get()
		{
			const { value } = getStorage().getObject(EPOCH_KEY, { value: INITIAL_EPOCH });

			return Type.isNumber(value) ? value : INITIAL_EPOCH;
		}

		/**
		 * @desc Opens the next generation: everything written from now on belongs to the database that
		 * takes the place of the dropped one.
		 * @return {number}
		 */
		static bump()
		{
			const epoch = DatabaseEpoch.get() + 1;
			getStorage().setObject(EPOCH_KEY, { value: epoch });
			logger.warn(`DatabaseEpoch.bump: the database generation is now ${epoch}`);

			return epoch;
		}
	}

	function getStorage()
	{
		// eslint-disable-next-line no-undef
		return Application.storageById(STORAGE_ID);
	}

	module.exports = { DatabaseEpoch };
});
