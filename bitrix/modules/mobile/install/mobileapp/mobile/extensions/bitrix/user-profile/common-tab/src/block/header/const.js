/**
 * @module user-profile/common-tab/src/block/header/const
 */
jn.define('user-profile/common-tab/src/block/header/const', (require, exports, module) => {
	const UserStatus = {
		ONLINE: 'ONLINE',
		OFFLINE: 'OFFLINE',
		DND: 'DND',
		ON_VACATION: 'ON_VACATION',
		FIRED: 'FIRED',
		INVITED: 'INVITED',
		REINVITED: 'REINVITED',
	};

	module.exports = {
		UserStatus,
	};
});
