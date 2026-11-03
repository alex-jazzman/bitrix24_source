/**
 * @module mail/statemanager/redux/slices/labels/src/state
 */
jn.define('mail/statemanager/redux/slices/labels/src/state', (require, exports, module) => {
	const { labelsListAdapter } = require('mail/statemanager/redux/slices/labels/meta');

	/**
	 * @param {object} label
	 * @returns {LabelReduxModel}
	 */
	const prepareLabel = (label) => ({
		id: Number(label.id),
		name: String(label.name ?? ''),
		mailboxId: Number(label.mailboxId ?? 0),
		sort: Number(label.sort ?? 0),
		unread: Number(label.unread ?? 0),
	});

	/**
	 * @returns {LabelReduxModel[]}
	 */
	const prepareLabels = (labels) => (
		Array.isArray(labels)
			? labels.map(prepareLabel).filter((label) => label.id > 0)
			: []
	);

	const createLabelsState = () => ({
		...labelsListAdapter.getInitialState(),
		currentLabelId: null,
		loaded: false,
		mailboxId: null,
	});

	/**
	 * A label the dictionary no longer knows cannot stay the current one: the list would ask the
	 * server for a mode it can no longer name.
	 */
	const dropUnknownCurrentLabel = (state) => {
		if (state.currentLabelId !== null && !state.entities[state.currentLabelId])
		{
			state.currentLabelId = null;
		}
	};

	const clearLabelsState = (state) => {
		labelsListAdapter.removeAll(state);
		state.currentLabelId = null;
		state.loaded = false;
	};

	/**
	 * The dictionary is one for the whole domain, and its labels belong to the mailbox it was read for.
	 * On a switch it is dropped at once: until the answer for the new mailbox arrives, showing the
	 * labels of the one the user has left would be wrong, and a failed request would leave them for good.
	 */
	const applyCurrentMailbox = (state, mailboxId) => {
		const next = Number(mailboxId) || null;

		if (state.mailboxId === next)
		{
			return;
		}

		clearLabelsState(state);
		state.mailboxId = next;
	};

	/**
	 * The gone availability leaves neither labels nor a current label: the next answer of the server
	 * brings the dictionary back if the domain returns.
	 */
	const applyLabelsAvailability = (state, labelsAvailable) => {
		if (labelsAvailable !== true)
		{
			clearLabelsState(state);
		}
	};

	const createLabelsReducers = () => ({
		labelsReceived: {
			reducer: (state, { payload }) => {
				// The server sends the whole dictionary of the mailbox, so a fresh answer replaces it.
				labelsListAdapter.setAll(state, payload);
				state.loaded = true;
				dropUnknownCurrentLabel(state);
			},
			prepare: (labels) => ({ payload: prepareLabels(labels) }),
		},
		setCurrentLabelId: (state, { payload }) => {
			const labelId = Number(payload?.labelId ?? 0);
			state.currentLabelId = labelId > 0 ? labelId : null;
		},
		/**
		 * Absolute counters of the server, the same ones the web menu of labels lives on: the module
		 * mail recalculates them on every read status change and sends them with the pull command
		 * `labelCountersUpdated`. Local deltas cover only what the client itself has just done.
		 */
		labelCountersReceived: (state, { payload }) => {
			const counters = payload?.counters ?? {};
			for (const [labelId, unread] of Object.entries(counters))
			{
				const label = state.entities[labelId];
				if (label)
				{
					label.unread = Math.max(0, Number(unread) || 0);
				}
			}
		},
		clearLabels: clearLabelsState,
	});

	module.exports = {
		applyCurrentMailbox,
		applyLabelsAvailability,
		createLabelsReducers,
		createLabelsState,
		prepareLabels,
	};
});
