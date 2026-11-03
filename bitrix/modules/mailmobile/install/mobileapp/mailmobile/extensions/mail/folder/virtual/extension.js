/**
 * @module mail/folder/virtual
 */
jn.define('mail/folder/virtual', (require, exports, module) => {
	const {
		setCurrentVirtualFolderKey,
	} = require('mail/statemanager/redux/slices/folders');
	const {
		selectFavoritesAvailable,
		selectLabelsAvailable,
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { setCurrentLabelId } = require('mail/statemanager/redux/slices/labels');
	const { selectAllLabels } = require('mail/statemanager/redux/slices/labels/selector');
	const {
		selectMessageCounterInAllMailboxes,
	} = require('mail/statemanager/redux/slices/mailboxes/selector');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { Loc } = require('loc');

	const { ALL_MESSAGES, FAVORITES, LABEL } = require('mail/folder/virtual/src/keys');

	const NAMES = {
		[ALL_MESSAGES]: Loc.getMessage('MAIL_FOLDER_VIRTUAL_ALL_MESSAGES_NAME'),
		[FAVORITES]: Loc.getMessage('MAIL_FOLDER_VIRTUAL_FAVORITES_NAME'),
	};

	const COUNTERS = {
		[ALL_MESSAGES]: selectMessageCounterInAllMailboxes,
	};

	const ACTIONS = {
		// The pair goes together: the list must never end up in the label mode without a label.
		[LABEL]: (key, { labelId } = {}) => {
			dispatch(setCurrentLabelId({ labelId }));
			dispatch(setCurrentVirtualFolderKey({ key }));
		},
		default: (key) => {
			dispatch(setCurrentVirtualFolderKey({ key }));
		},
	};

	const getNameByKey = (key) => NAMES[key] ?? null;

	const getCounterByKey = (key, state) => {
		const selector = COUNTERS[key];

		return selector ? selector(state) : null;
	};

	const callAction = (key, params = {}) => {
		const action = ACTIONS[key] || ACTIONS.default;
		action(key, params);
	};

	class VirtualFolder
	{
		constructor(name, type, unreadCount)
		{
			this.name = name;
			this.type = type;
			this.unreadCount = unreadCount;
			this.isVirtual = true;
		}
	}

	const getFavoritesVirtualFolder = (state) => {
		if (!selectFavoritesAvailable(state))
		{
			return null;
		}

		return new VirtualFolder(
			getNameByKey(FAVORITES),
			FAVORITES,
			getCounterByKey(FAVORITES, state),
		);
	};

	/**
	 * One row per label of the reader, in the order of the dictionary of the server.
	 *
	 * @returns {VirtualFolder[]}
	 */
	const getLabelVirtualFolders = (state) => {
		if (!selectLabelsAvailable(state))
		{
			return [];
		}

		return selectAllLabels(state).map((label) => {
			const folder = new VirtualFolder(label.name, LABEL, label.unread);
			folder.labelId = label.id;

			return folder;
		});
	};

	module.exports = {
		VirtualFolder,
		ALL_MESSAGES,
		FAVORITES,
		LABEL,
		getLabelVirtualFolders,
		getNameByKey,
		getCounterByKey,
		callAction,
		getFavoritesVirtualFolder,
	};
});
