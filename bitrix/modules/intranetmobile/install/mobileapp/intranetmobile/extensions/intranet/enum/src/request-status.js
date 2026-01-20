/**
 * @module intranet/enum/src/request-status
 */
jn.define('intranet/enum/src/request-status', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class RequestStatus
	 */
	class RequestStatus extends BaseEnum
	{
		static IDLE = new RequestStatus('IDLE', 'Idle');
		static PENDING = new RequestStatus('PENDING', 'Pending');
		static FULFILLED = new RequestStatus('FULFILLED', 'Fulfilled');
		static REJECTED = new RequestStatus('REJECTED', 'Rejected');
	}

	module.exports = { RequestStatus };
});
