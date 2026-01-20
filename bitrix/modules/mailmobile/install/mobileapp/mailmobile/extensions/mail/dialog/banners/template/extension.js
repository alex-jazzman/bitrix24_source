/**
 * @module mail/dialog/banners/template
 */
jn.define('mail/dialog/banners/template', (require, exports, module) => {
	const { Card } = require('ui-system/layout/card');
	const { Indent, Color } = require('tokens');
	const IS_IOS = Application.getPlatform() === 'ios';
	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');

	function BannerTemplate(props)
	{
		const {
			iconPathName,
			iconWidth = 138,
			iconHeight = 138,
			title,
			description,
			buttonsView,
		} = props;

		return View(
			{
				style: {
					backgroundColor: Color.bgPrimary.toHex(),
					flexDirection: 'column',
				},
			},
			View(
				{
					style:
						{
							flex: 1,
						},
				},
				View(
					{
						style: {
							paddingBottom: 100,
							height: '100%',
						},
					},
					StatusBlock({
						testId: 'mail-banner-status-block',
						image: Image({
							uri: makeLibraryImagePath(iconPathName, 'empty-states', 'mail'),
							style: {
								width: Number(iconWidth),
								height: Number(iconHeight),
							},
						}),
						title,
						description,
					}),
				),
			),
			Card(
				{
					testId: `mail-banner-buttons-panel`,
					style:
					{
						paddingBottom: IS_IOS ? device.screen.safeArea.bottom : Indent.L.toNumber(),
					},
				},
				buttonsView,
			),
		);
	}

	module.exports = { BannerTemplate };
});
