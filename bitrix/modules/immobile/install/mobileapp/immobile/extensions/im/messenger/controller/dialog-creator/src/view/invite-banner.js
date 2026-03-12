/**
 * @module im/messenger/controller/dialog-creator/src/view/invite-banner
 */
jn.define('im/messenger/controller/dialog-creator/src/view/invite-banner', (require, exports, module) => {
	const { PushBanner } = require('ui-system/blocks/banners/push-banner');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Indent } = require('tokens');

	function InviteBanner({
		accent = false,
		onClick = () => {},
	})
	{
		const leftIcon = Image({
			style: {
				width: 52,
				height: 52,
			},
			uri: encodeURI(
				makeLibraryImagePath(`add-3${accent ? '-active' : ''}.png`, 'volumetric'),
			),
		});

		return View(
			{
				style: {
					paddingHorizontal: Indent.XL3.getValue(),
				},
			},
			PushBanner({
				title: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_INVITE_BANNER'),
				description: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_INVITE_BANNER_SUBTITLE'),
				testId: 'messenger-invite-banner',
				animated: true,
				accent,
				leftIcon,
				onClick,
				animationCount: 1,
				animationDuration: 2000,
			}),
		);
	}

	module.exports = { InviteBanner };
});
