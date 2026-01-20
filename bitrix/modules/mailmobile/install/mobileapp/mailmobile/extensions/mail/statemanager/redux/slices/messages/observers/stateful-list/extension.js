/**
 * @module mail/statemanager/redux/slices/messages/observers/stateful-list
 */
jn.define('mail/statemanager/redux/slices/messages/observers/stateful-list', (require, exports, module) => {
	const { selectEntities, selectIsMultiSelectMode, selectSelectedIds } = require('mail/statemanager/redux/slices/messages/selector');
	const { isEqual } = require('utils/object');

	const observeListChange = (store, onChange) => {
		let prevMails = selectEntities(store.getState());
		let prevIsMultiSelectMode = selectIsMultiSelectMode(store.getState());
		let prevSelectedIds = selectSelectedIds(store.getState());

		return store.subscribe(() => {
			const nextMails = selectEntities(store.getState());
			const nextIsMultiSelectMode = selectIsMultiSelectMode(store.getState());
			const nextSelectedIds = selectSelectedIds(store.getState());

			const {
				moved,
				removed,
				added,
				created,
			} = getDiffForMessagessObserver(prevMails, nextMails);

			const isMultiSelectModeChanged = prevIsMultiSelectMode !== nextIsMultiSelectMode;
			const isSelectedIdsChanged = !isEqual(prevSelectedIds, nextSelectedIds);

			if (
				moved.length > 0 || removed.length > 0
				|| added.length > 0 || created.length > 0
				|| isMultiSelectModeChanged || isSelectedIdsChanged
			)
			{
				onChange({
					moved,
					removed,
					added,
					created,
					multiSelectMode: {
						changed: isMultiSelectModeChanged,
						current: nextIsMultiSelectMode,
						previous: prevIsMultiSelectMode,
					},
					selectedIds: {
						changed: isSelectedIdsChanged,
						current: nextSelectedIds,
						previous: prevSelectedIds,
					},
				});
			}

			prevMails = nextMails;
			prevIsMultiSelectMode = nextIsMultiSelectMode;
			prevSelectedIds = nextSelectedIds;
		});
	};

	/**
	 * @private
	 * @param {Object.<number, MessageReduxModel>} prevMails
	 * @param {Object.<number, MessageReduxModel>} nextMails
	 * @return {{
	 * moved: MessageReduxModel[],
	 * removed: MessageReduxModel[],
	 * added: MessageReduxModel[],
	 * created: MessageReduxModel[]
	 * }}
	 */
	const getDiffForMessagessObserver = (prevMails, nextMails) => {
		const moved = [];
		const removed = [];
		const added = [];
		const created = [];

		if (prevMails === nextMails)
		{
			return { moved, removed, added, created };
		}

		Object.values(prevMails).forEach((prevMail) => {
			if (!prevMail.isRemoved)
			{
				const nextMail = nextMails[prevMail.id];

				if (!nextMail || nextMail.isRemoved)
				{
					removed.push(nextMail || prevMail);
				}
			}
		});

		Object.values(nextMails).forEach((nextMail) => {
			if (!nextMail.isRemoved)
			{
				const prevMail = prevMails[nextMail.id];
				if (!prevMail || prevMail.isRemoved)
				{
					added.push(nextMail);
				}
			}
		});

		const processedMailIds = new Set([...removed, ...added].map(({ id }) => id));
		Object.values(nextMails).forEach((nextMail) => {
			const prevMail = prevMails[nextMail.id];
			if (!prevMail || processedMailIds.has(nextMail.id))
			{
				return;
			}

			const { isRemoved: prevIsRemoved, ...prevMailWithoutIsRemoved } = prevMail;
			const { isRemoved: nextIsRemoved, ...nextMailWithoutIsRemoved } = nextMail;

			if (!isEqual(prevMailWithoutIsRemoved, nextMailWithoutIsRemoved))
			{
				moved.push(nextMail);
			}
		});

		return { moved, removed, added, created };
	};

	module.exports = { observeListChange };
});
