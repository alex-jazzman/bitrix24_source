/**
 * @module mail/folder/virtual
 */
jn.define('mail/folder/virtual', (require, exports, module) => {
	const {
		setCurrentVirtualFolderKey,
	} = require('mail/statemanager/redux/slices/folders');
	const {
		selectMessageCounterInAllMailboxes,
	} = require('mail/statemanager/redux/slices/mailboxes/selector');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { Loc } = require('loc');

	const ALL_MESSAGES = 'all_messages';

	const NAMES = {
		[ALL_MESSAGES]: Loc.getMessage('MAIL_FOLDER_VIRTUAL_ALL_MESSAGES_NAME'),
	};

	const COUNTERS = {
		[ALL_MESSAGES]: selectMessageCounterInAllMailboxes,
	};

	const ACTIONS = {
		default: (key) => {
			dispatch(setCurrentVirtualFolderKey({ key }));
		},
	};

	const getNameByKey = (key) => NAMES[key] ?? null;

	const getCounterByKey = (key, state) => {
		const selector = COUNTERS[key];

		return selector ? selector(state) : null;
	};

	const callAction = (key) => {
		const action = ACTIONS[key] || ACTIONS.default;
		action(key);
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

	module.exports = {
		VirtualFolder,
		ALL_MESSAGES,
		getNameByKey,
		getCounterByKey,
		callAction,
	};
});
