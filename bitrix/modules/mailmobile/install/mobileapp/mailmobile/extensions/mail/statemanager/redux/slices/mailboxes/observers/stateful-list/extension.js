/**
 * @module mail/statemanager/redux/slices/mailboxes/observers/stateful-list
 */
jn.define('mail/statemanager/redux/slices/mailboxes/observers/stateful-list', (require, exports, module) => {
	const {
		selectEntities,
		selectCurrentMailbox,
	} = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { isEqual } = require('utils/object');

	const observeMailboxesChange = (store, onChange) => {
		let selected = null;
		let prevMailboxes = selectEntities(store.getState());
		let prevCurrentMailbox = selectCurrentMailbox(store.getState());

		return store.subscribe(() => {
			const nextMailboxes = selectEntities(store.getState());
			const nextCurrentMailbox = selectCurrentMailbox(store.getState());

			const {
				added,
				// removed,
			} = getDiffForFoldersObserver(prevMailboxes, nextMailboxes);
			const isCurrentMailboxChanged = prevCurrentMailbox !== null && !isEqual(prevCurrentMailbox, nextCurrentMailbox);

			if (isCurrentMailboxChanged)
			{
				selected = nextCurrentMailbox;
			}

			if (
				added.length > 0
				// || removed.length > 0
				|| isCurrentMailboxChanged
			)
			{
				onChange({
					added,
					// removed,
					selected,
				});
			}

			prevMailboxes = nextMailboxes;
			prevCurrentMailbox = nextCurrentMailbox;
		});
	};

	const getDiffForFoldersObserver = (prevMailboxes, nextMailboxes) => {
		const added = [];
		const removed = [];

		Object.values(prevMailboxes).forEach((prevMailbox) => {
			if (!prevMailbox.isRemoved)
			{
				const nextMailbox = nextMailboxes[prevMailbox.id];

				if (!nextMailbox || nextMailbox.isRemoved)
				{
					removed.push(nextMailbox || prevMailbox);
				}
			}
		});

		Object.values(nextMailboxes).forEach((nextMailbox) => {
			if (!prevMailboxes[nextMailbox.id])
			{
				added.push(nextMailbox);
			}
		});

		return { added, removed };
	};

	module.exports = { observeMailboxesChange };
});