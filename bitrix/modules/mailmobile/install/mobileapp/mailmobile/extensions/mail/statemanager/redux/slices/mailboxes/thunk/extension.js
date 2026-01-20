/**
 * @module mail/statemanager/redux/slices/mailboxes/thunk
 */
jn.define('mail/statemanager/redux/slices/mailboxes/thunk', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { sliceName } = require('mail/statemanager/redux/slices/mailboxes/meta');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { AjaxMethod } = require('mail/const');
	const condition = () => isOnline();

	const runActionPromise = ({ action, options }) => new Promise((resolve) => {
		(new RunActionExecutor(action, options)).setHandler(resolve).call(false);
	});

	const syncMailbox = createAsyncThunk(
		`${sliceName}/syncMailbox`,
		({ mailboxId }) => runActionPromise({
			action: AjaxMethod.syncMailbox,
			options: { id: mailboxId },
		}),
		{ condition },
	);

	const deleteMailbox = createAsyncThunk(
		`${sliceName}/deleteMailbox`,
		({ mailboxId }) => runActionPromise({
			action: AjaxMethod.deleteMailbox,
			options: { mailboxId },
		}),
		{ condition },
	);

	module.exports = {
		syncMailbox,
		deleteMailbox,
	};
});
