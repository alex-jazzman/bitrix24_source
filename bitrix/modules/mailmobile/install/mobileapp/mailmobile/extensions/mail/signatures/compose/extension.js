/**
 * @module mail/signatures/compose
 */
jn.define('mail/signatures/compose', (require, exports, module) => {
	const { SignatureApi } = require('mail/signatures/compose/src/signature-api');
	const { SignatureModel } = require('mail/signatures/compose/src/signature-model');
	const { ComposeSignatureState, SIGNATURE_SEPARATOR } = require('mail/signatures/compose/src/compose-signature-state');
	const { ComposeSenderIdentity } = require('mail/signatures/compose/src/compose-sender-identity');
	const {
		extractSignatureText,
		findSignatureSuffixRange,
		replaceOrAppendSignature,
		replaceSignatureRange,
		stripSignatureRange,
		transformEditableSignatureRange,
		transformSignatureRange,
	} = require('mail/signatures/compose/src/signature-range');
	const { SignatureChoiceQueue } = require('mail/signatures/compose/src/signature-choice-queue');
	const { SignaturePicker } = require('mail/signatures/compose/src/signature-picker');

	module.exports = {
		SignatureApi,
		SignatureModel,
		ComposeSignatureState,
		ComposeSenderIdentity,
		SIGNATURE_SEPARATOR,
		extractSignatureText,
		findSignatureSuffixRange,
		replaceOrAppendSignature,
		replaceSignatureRange,
		stripSignatureRange,
		transformEditableSignatureRange,
		transformSignatureRange,
		SignatureChoiceQueue,
		SignaturePicker,
	};
});
