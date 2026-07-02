/**
 * @module user-profile/common-tab/src/block/header/block
 */
jn.define('user-profile/common-tab/src/block/header/block', (require, exports, module) => {
	const { Feature } = require('feature');
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { Header } = require('user-profile/common-tab/src/block/header/view');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { dispatch } = require('statemanager/redux/store');

	class HeaderBlock extends BaseBlock
	{
		prepareProps(commonTabData)
		{
			const {
				owner,
				ownerId,
				statusData = {},
				isEditMode,
				onChange,
				currentTheme,
				inviteSettings,
				parentWidget,
			} = commonTabData ?? {};

			if (owner)
			{
				dispatch(usersUpserted([owner]));
			}

			return {
				ownerId,
				isEditMode,
				onChange,
				GMTString: statusData.GMTString,
				lastSeenDate: statusData.lastSeenDate,
				personalGender: owner?.personalGender,
				onVacationDateTo: statusData.onVacationDateTo,
				status: statusData.status,
				isBirthday: statusData.isBirthday,
				currentTheme,
				inviteSettings,
				parentWidget,
			};
		}

		shouldUseBaseViewWrapper()
		{
			return false;
		}

		shouldUseBaseEditWrapper()
		{
			if (Feature.canUseWidgetBackground())
			{
				return false;
			}

			return super.shouldUseBaseEditWrapper();
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
