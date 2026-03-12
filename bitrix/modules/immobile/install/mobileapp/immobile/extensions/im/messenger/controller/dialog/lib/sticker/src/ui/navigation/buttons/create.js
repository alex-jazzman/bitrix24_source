/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/create
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/create', (require, exports, module) => {
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color } = require('tokens');

	const { StickerEventType, NAVIGATION_BUTTON_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	function StickerPackCreateNavigationButton()
	{
		return View(
			{
				style: {
					paddingHorizontal: 8,
					width: NAVIGATION_BUTTON_WIDTH,
				},
				onClick: () => {
					emitter.emit(StickerEventType.action.createPack, []);
				},
			},
			View(
				{
					style: {
						width: 36,
						height: 48,
						paddingTop: 8,
						paddingLeft: 2,
						paddingRight: 2,
						flexDirection: 'column',
						alignItems: 'center',
					},
					clickable: false,
				},
				IconView({
					icon: Icon.CIRCLE_PLUS,
					size: 32,
					style: {
						marginBottom: 5,
						backgroundColor: Color.bgContentSecondary.toHex(),
						borderRadius: 16,
					},
					color: Color.base2,
				}),
			),
		);
	}

	module.exports = { StickerPackCreateNavigationButton };
});
