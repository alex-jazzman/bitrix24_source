/**
 * @module vibecode/catalog/src/const
 */
jn.define('vibecode/catalog/src/const', (require, exports, module) => {
	const { Indent } = require('tokens');

	const CONTENT_BOTTOM_PADDING = Indent.XL4.toNumber();
	const SEARCH_DEBOUNCE_DELAY = 500;
	const VIBECODE_ITEM_TYPE = 'vibecode-catalog-item';
	const VIBECODE_MENU_SECTION_CODE = 'vibecode';
	const CATALOG_STATE = Object.freeze({
		ACTIVE: 'active',
		HIDDEN: 'hidden',
		NEW: 'new',
		ALL: 'all',
	});
	const VIBECODE_KIND = Object.freeze({
		BOT: 'bot',
	});
	const VIBECODE_PULL_CONFIG = Object.freeze({
		shouldReloadDynamically: true,
	});
	const VIBECODE_CREATE_URL = 'https://vibecode.bitrix24.tech/dashboard';

	module.exports = {
		CATALOG_STATE,
		CONTENT_BOTTOM_PADDING,
		SEARCH_DEBOUNCE_DELAY,
		VIBECODE_CREATE_URL,
		VIBECODE_ITEM_TYPE,
		VIBECODE_KIND,
		VIBECODE_MENU_SECTION_CODE,
		VIBECODE_PULL_CONFIG,
	};
});
