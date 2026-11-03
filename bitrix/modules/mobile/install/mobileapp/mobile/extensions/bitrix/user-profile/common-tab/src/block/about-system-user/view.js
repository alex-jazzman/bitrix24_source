/**
 * @module user-profile/common-tab/src/block/about-system-user/view
 */
jn.define('user-profile/common-tab/src/block/about-system-user/view', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Text5 } = require('ui-system/typography');
	const { Link5, LinkMode } = require('ui-system/blocks/link')

	/**
	 * @extends {LayoutComponent}
	 */
	class AboutSystemUser extends LayoutComponent
	{
		/**
		 * @returns {LayoutComponent}
		 */
		render()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
					},
				},
				Image({
					uri: makeLibraryImagePath('information-banner.png', 'volumetric', 'mobile', false),
					style: {
						flexShrink: 1,
						width: 52,
						height: 48,
					}
				}),
				View(
					{
						style: {
							flexShrink: 2,
							marginLeft: Indent.XL.toNumber(),
						}
					},
					Text5({
						style: {
							marginBottom: Indent.S.toNumber(),
						},
						color: Color.base2,
						text: Loc.getMessage('M_PROFILE_SYSTEM_USER_PLACEHOLDER'),
					}),
					Link5({
						testId: 'about-system-user-link-article',
						mode: LinkMode.DASH,
						color: Color.accentMainLink,
						textDecorationLine: 'underline',
						text: Loc.getMessage('M_PROFILE_SYSTEM_USER_LINK'),
						onClick: () => helpdesk.openHelpArticle('29123994', 'helpdesk'),
					}),
				),
			);
		}
	}

	module.exports = {
		/**
		 * @returns {AboutSystemUser}
		 */
		AboutSystemUser: (props) => new AboutSystemUser(props),
	};
});
