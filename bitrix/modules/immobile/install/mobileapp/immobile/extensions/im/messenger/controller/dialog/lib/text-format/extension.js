/**
 * @module im/messenger/controller/dialog/lib/text-format
 */
jn.define('im/messenger/controller/dialog/lib/text-format', (require, exports, module) => {
	const { TextFormatManager, TextFormatEvent } = require('im/messenger/controller/dialog/lib/text-format/src/manager');

	module.exports = {
		TextFormatManager,
		TextFormatEvent,
	};
});
