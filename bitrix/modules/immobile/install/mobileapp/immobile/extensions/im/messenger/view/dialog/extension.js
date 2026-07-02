/**
* @module im/messenger/view/dialog
*/
jn.define('im/messenger/view/dialog', (require, exports, module) => {

	const {
		DialogView,
		AfterScrollMessagePosition,
		InputQuoteType,
	} = require('im/messenger/view/dialog/dialog');
	const { DialogSuggests } = require('im/messenger/view/dialog/suggests');

	module.exports = {
		DialogView,
		AfterScrollMessagePosition,
		InputQuoteType,
		DialogSuggests,
	};
});
