/**
 * @module im/messenger/controller/user-profile
 */
jn.define('im/messenger/controller/user-profile', (require, exports, module) => {
	const { openUserProfile } = require('user/profile');

	class UserProfile
	{
		static show(userId, options) {
			if (Application.getApiVersion() >= 27)
			{
				openUserProfile({
					userId,
					parentWidget: options.parentWidget,
				});
			}
			else
			{
				PageManager.openPage({ url: `/mobile/users/?user_id=${userId}` });
			}
		}
	}

	module.exports = { UserProfile };
});
