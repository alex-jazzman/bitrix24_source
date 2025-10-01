/**
 * @module user-profile/common-tab/src/block/header/block
 */
jn.define('user-profile/common-tab/src/block/header/block', (require, exports, module) => {
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { Header } = require('user-profile/common-tab/src/block/header/view');
	const { UserStatus } = require('user-profile/common-tab/enum/user-status');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { dispatch } = require('statemanager/redux/store');

	class HeaderBlock extends BaseBlock
	{
		getSort()
		{
			return 100;
		}

		prepareProps(commonTabData)
		{
			const { user, ownerId, statusData = {} } = commonTabData ?? {};

			if (user)
			{
				dispatch(usersUpserted([user]));
			}

			return {
				ownerId,
				GMTString: statusData.GMTString,
				lastSeenDate: statusData.lastSeenDate,
				personalGender: user?.personalGender,
				onVacationDateTo: statusData.onVacationDateTo,
				status: UserStatus.getEnum(statusData?.status),
			};
		}

		shouldUseBaseWrapper()
		{
			return false;
		}

		getContentClass()
		{
			return Header;
		}
	}

	module.exports = {
		HeaderBlock,
	};
});
