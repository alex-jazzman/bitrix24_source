/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector/last-shown-store
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector/last-shown-store', (require, exports, module) => {
	const { Type } = require('type');

	const STORAGE_ID = 'im/messenger/copilot/greeting';
	const LAST_SHOWN_KEY = 'lastShownId';

	/**
	 * @class GreetingLastShownStore
	 * @desc Persistent key-value store for the id of the last shown BitrixGPT greeting.
	 * Backed by Application.storageById, so the value survives app restart.
	 */
	class GreetingLastShownStore
	{
		constructor()
		{
			// eslint-disable-next-line no-undef
			this.storage = Application.storageById(STORAGE_ID);
		}

		/**
		 * @return {?number}
		 */
		getLastId()
		{
			const { id } = this.storage.getObject(LAST_SHOWN_KEY, { id: null });

			return Type.isNumber(id) ? id : null;
		}

		/**
		 * @param {number} id
		 */
		saveLastId(id)
		{
			this.storage.setObject(LAST_SHOWN_KEY, { id });
		}
	}

	module.exports = { GreetingLastShownStore };
});
