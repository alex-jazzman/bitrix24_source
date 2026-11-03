/**
 * @module user-profile/common-tab/src/block/about-system-user/block
 */
jn.define('user-profile/common-tab/src/block/about-system-user/block', (require, exports, module) => {
	const { BaseBlock } = require('user-profile/common-tab/src/block/base-block');
	const { AboutSystemUser } = require('user-profile/common-tab/src/block/about-system-user/view');
	const { Color } = require('tokens');

	class AboutSystemUserBlock extends BaseBlock
	{
		/**
		 * @param {{ users?: Array<{ isSystemUser?: boolean }> }} commonTabData
		 * @returns {{ isSystemUser: boolean, style: { backgroundColor: string, minHeight: number } }}
		 */
		prepareProps(commonTabData)
		{
			const isSystemUser = commonTabData?.users?.[0]?.isSystemUser ?? false;

			return {
				isSystemUser,
				style: {
					backgroundColor: Color.accentSoftBlue2.toHex(),
					minHeight: 96,
				}
			};
		}

		/**
		 * @returns {boolean}
		 */
		isAvailable()
		{
			return this.props.isSystemUser;
		}

		/**
		 * @returns {(props: { isSystemUser: boolean, style: { backgroundColor: string, minHeight: number } }) => AboutSystemUser}
		 */
		getContentClass()
		{
			return AboutSystemUser;
		}
	}

	module.exports = { AboutSystemUserBlock };
});
