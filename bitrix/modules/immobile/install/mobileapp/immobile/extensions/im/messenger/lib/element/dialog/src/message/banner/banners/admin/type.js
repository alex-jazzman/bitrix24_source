/**
 * @module im/messenger/lib/element/dialog/src/message/banner/banners/admin/type
 */
jn.define('im/messenger/lib/element/dialog/src/message/banner/banners/admin/type', (require, exports, module) => {
	const { Color } = require('tokens');

	const Await = Object.freeze({
		fireRequest: 'fireRequest',
		transferRequest: 'transferRequest',
	});

	const Success = Object.freeze({
		acceptedFire: 'acceptedFire',
		acceptedFireM: 'acceptedFireM',
		acceptedFireF: 'acceptedFireF',
		acceptedTransfer: 'acceptedTransfer',
		acceptedTransferM: 'acceptedTransferM',
		acceptedTransferF: 'acceptedTransferF',
		acceptedTransferSelf: 'acceptedTransferSelf',
	});

	const Failure = Object.freeze({
		refusedFire: 'refusedFire',
		refusedFireM: 'refusedFireM',
		refusedFireF: 'refusedFireF',
		refusedTransfer: 'refusedTransfer',
		refusedTransferM: 'refusedTransferM',
		refusedTransferF: 'refusedTransferF',
		refusedFireSelf: 'refusedFireSelf',
		refusedTransferSelf: 'refusedTransferSelf',
	});

	const ImageName = Object.freeze({
		docFailureSign: 'doc_failure_sign',
		docSuccessSign: 'doc_success_sign',
		docAwaitSign: 'doc_await_sign',
	});

	const ImageBackgroundColor = Object.freeze({
		docFailureSign: Color.accentMainAlert.toHex(),
		docSuccessSign: Color.accentMainSuccess.toHex(),
		docAwaitSign: Color.accentMainPrimaryalt.toHex(),
	});

	module.exports = {
		Await,
		Success,
		Failure,
		ImageName,
		ImageBackgroundColor,
	};
});
