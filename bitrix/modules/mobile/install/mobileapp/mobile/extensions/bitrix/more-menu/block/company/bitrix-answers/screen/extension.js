/**
 * @module more-menu/block/company/bitrix-answers/screen
 */
jn.define('more-menu/block/company/bitrix-answers/screen', (require, exports, module) => {
	const { BitrixAnswersScreenOpener } = require('more-menu/block/company/bitrix-answers/screen/src/opener');
	const { BitrixAnswersScreen } = require('more-menu/block/company/bitrix-answers/screen/src/screen');

	module.exports = { BitrixAnswersScreenOpener, BitrixAnswersScreen };
});
