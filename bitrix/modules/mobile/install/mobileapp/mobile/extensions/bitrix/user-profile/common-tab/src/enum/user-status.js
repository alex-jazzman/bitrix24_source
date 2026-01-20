/**
 * @module user-profile/common-tab/enum/user-status
 */
jn.define('user-profile/common-tab/enum/user-status', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Icon } = require('ui-system/blocks/icon');
	const { Color } = require('tokens');

	class UserStatus extends BaseEnum
	{
		static ONLINE = new UserStatus('ONLINE', {
			icon: Icon.SMALL_CIRCLE_CHECK,
			iconColor: Color.accentMainSuccess,
		});

		static FIRED = new UserStatus('FIRED', {
			icon: Icon.SMALL_CROSS,
			iconColor: Color.base4,
		});

		static DND = new UserStatus('DND', {
			icon: Icon.SMALL_STOP,
			iconColor: Color.accentMainAlert,
		});

		static ON_VACATION = new UserStatus('ON_VACATION', {
			icon: Icon.SMALL_VACATION,
			iconColor: Color.accentExtraAqua,
		});

		static OFFLINE = new UserStatus('OFFLINE', {
			icon: Icon.SMALL_CLOCK,
			iconColor: Color.accentMainWarning,
		});

		getIcon()
		{
			return this.getValue().icon;
		}

		getIconColor()
		{
			return this.getValue().iconColor;
		}
	}

	module.exports = {
		UserStatus,
	};
});
