/**
 * @module mail/signatures
 */
jn.define('mail/signatures', (require, exports, module) => {
	const compose = require('mail/signatures/compose');
	const { SignatureNavigator } = require('mail/signatures/src/signature-navigator');
	const { SignatureList } = require('mail/signatures/src/signature-list');
	const { SignatureCreate } = require('mail/signatures/src/signature-create');
	const { SignatureSenderSelection, SignatureSenderSelector } = require('mail/signatures/src/signature-sender-selector');

	module.exports = {
		...compose,
		SignatureNavigator,
		SignatureList,
		SignatureCreate,
		SignatureSenderSelection,
		SignatureSenderSelector,
	};
});
