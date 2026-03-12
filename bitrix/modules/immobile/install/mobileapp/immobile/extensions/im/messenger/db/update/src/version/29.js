/**
 * @module im/messenger/db/update/version/29
 */
jn.define('im/messenger/db/update/version/29', (require, exports, module) => {
	const { StickerTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		new StickerTable().createDatabaseTableInstance();
	};
});