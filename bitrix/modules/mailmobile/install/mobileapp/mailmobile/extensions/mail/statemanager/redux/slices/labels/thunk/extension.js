/**
 * @module mail/statemanager/redux/slices/labels/thunk
 */
jn.define('mail/statemanager/redux/slices/labels/thunk', (require, exports, module) => {
	const connection = require('device/connection');
	const store = require('statemanager/redux/store');
	const { runLabelAction } = require('mail/label/transport');
	const { labelsReceived } = require('mail/statemanager/redux/slices/labels');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const {
		createLabelsThunks,
	} = require('mail/statemanager/redux/slices/labels/thunk/src/factory');

	module.exports = createLabelsThunks({
		runAction: runLabelAction,
		isOnline: () => connection.isOnline(),
		labelsReceived,
		getCurrentMailboxId: () => selectCurrentMailboxId(store.getState()),
	});
});
