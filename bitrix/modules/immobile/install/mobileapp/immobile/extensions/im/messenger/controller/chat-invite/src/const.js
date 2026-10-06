/**
 * @module im/messenger/controller/chat-invite/const
 */
jn.define('im/messenger/controller/chat-invite/const', (require, exports, module) => {
	const TabType = Object.freeze({
		GUESTS: 'guests',
		EMPLOYEES: 'employees',
	});

	const GuestInviteImage = Object.freeze({
		name: 'invite-guests.svg',
		library: 'chat-invite',
	});

	module.exports = { TabType, GuestInviteImage };
});
