/**
 * @module user-profile/common-tab/src/block/common-fields/src/field/user-field
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/field/user-field', (require, exports, module) => {
	const { BaseField } = require('user-profile/common-tab/src/block/common-fields/src/field/base-field');
	const { Link4 } = require('ui-system/blocks/link');

	class UserField extends BaseField
	{
		renderViewModeFieldValue(value, idx)
		{
			const { id } = this.props;
			const { fullName, userId } = value;

			return Link4({
				testId: this.getTestId(`user-${id.toLowerCase()}-${idx}`),
				text: fullName,
				numberOfLines: 1,
				onClick: async () => {
					const { parentWidget } = this.props;
					const { UserProfile } = await requireLazy('user-profile');
					void UserProfile.open({
						ownerId: userId,
						parentWidget,
						analyticsSection: 'profile',
					});
				},
			});
		}
	}

	module.exports = { UserField };
});
