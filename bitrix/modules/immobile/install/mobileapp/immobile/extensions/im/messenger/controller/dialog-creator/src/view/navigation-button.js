/**
 * @module im/messenger/controller/dialog-creator/navigation-button
 */
jn.define('im/messenger/controller/dialog-creator/navigation-button', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { withPressed } = require('utils/color');
	const { Loc } = require('im/messenger/loc');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text5 } = require('ui-system/typography/text');
	const { Color } = require('tokens');

	/**
	 * @param {NavigationButtonProps} params
	 */
	function navigationButton(params)
	{
		const {
			iconSvg,
			pngIcon,
			text,
			subtitle,
			onClick,
			withSeparator,
			testId = '',
			textStyle = {},
			isNew = false,
			isLocked = false,
			iconSize = 40,
		} = params;
		const imageIcon = iconSvg
			? { svg: { content: iconSvg } }
			: { uri: pngIcon, resizeMode: 'contain' };

		const iconOffset = (iconSize - 40) / 2;
		const imageProps = {
			...imageIcon,
			style: {
				width: iconSize,
				height: iconSize,
				marginTop: -iconOffset,
				marginBottom: -iconOffset,
				marginLeft: -iconOffset,
				marginRight: -iconOffset,
			},
		};

		return View(
			{
				testId,
				style: {
					flexDirection: 'row',
					paddingLeft: 18,
					backgroundColor: withPressed(Theme.colors.bgContentPrimary),
				},
				clickable: true,
				onClick,
			},
			View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Image(imageProps),
			),
			View(
				{
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						flex: 1,
						paddingVertical: 15,
						marginLeft: 12,
						paddingRight: 10,
						borderBottomWidth: withSeparator ? 1 : 0,
						borderBottomColor: withSeparator ? Theme.colors.bgSeparatorPrimary : null,
					},
				},
				View(
					{
						style: {
							justifyContent: 'flex-start',
							alignItems: 'center',
							flexDirection: 'row',
							flexGrow: 1,
						},
					},
					Text({
						text,
						style: {
							color: Theme.colors.base1,
							fontSize: 18,
							...textStyle,
						},
					}),
					isNew && BadgeCounter({
						value: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_BRAND_NEW_LABEL'),
						testId: `${testId}_badge`,
						showRawValue: true,
						design: BadgeCounterDesign.COLLAB_SUCCESS, // todo use proper tokens
						style: {
							marginLeft: 4,
							top: 1,
						},
					}),
					isLocked && IconView({
						size: 20,
						icon: Icon.LOCK,
						color: Color.accentMainPrimary,
						style: {
							marginLeft: 4,
						},
					}),
				),
				subtitle && Text5({
					text: subtitle.replaceAll('#BR#', '\n'),
					color: Color.base3,
					ellipsize: 'end',
					numberOfLines: 2,
					style: {
						marginTop: 2,
					},
				}),
			),
		);
	}

	module.exports = { navigationButton };
});
