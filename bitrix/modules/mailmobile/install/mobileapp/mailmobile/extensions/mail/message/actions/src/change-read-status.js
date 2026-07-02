/**
 * @module mail/message/actions/src/change-read-status
 */
jn.define('mail/message/actions/src/change-read-status', (require, exports, module) => {
	const { changeReadStatus: changeReadStatusThunk } = require('mail/statemanager/redux/slices/messages/thunk');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	/**
	 * Changes read status for one or more messages.
	 *
	 * @param {Object} params
	 * @param {number[]} params.objectIds
	 * @param {string[]} params.objectUidIds
	 * @param {number} params.isRead - 1 for read, 0 for unread
	 */
	function changeReadStatus({ objectIds, objectUidIds, isRead })
	{
		if (objectIds.length === 0)
		{
			return;
		}

		dispatch(changeReadStatusThunk({ objectIds, objectUidIds, isRead }));
	}

	module.exports = { changeReadStatus };
});
