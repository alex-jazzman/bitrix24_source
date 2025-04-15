/**
 * @module im/messenger/model/draft
 */
jn.define('im/messenger/model/draft', (require, exports, module) => {
	const { draftModel } = require('im/messenger/model/draft/model');
	const { draftDefaultElement } = require('im/messenger/model/draft/default-element');

	module.exports = {
		draftModel,
		draftDefaultElement,
	};
});
