/**
 * @module my-company/screen
 */
jn.define('my-company/screen', (require, exports, module) => {
	const { MyCompanyScreen } = require('my-company/screen/src/screen');
	// The registry of the cards is published by the screen: a block code, the card it draws and the
	// shape of that entry (`MyCompanyCardEntry` of `types.d.ts`) are the contract of the section, so a
	// consumer asks the extension for them instead of reaching into its bundle.
	const {
		getCardCodes,
		getCardEntry,
		getUnknownCardCodes,
	} = require('my-company/screen/src/card-registry');

	module.exports = { MyCompanyScreen, getCardCodes, getCardEntry, getUnknownCardCodes };
});
