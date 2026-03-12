/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/create
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/create', (require, exports, module) => {
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const {
		Color,
		Indent,
		Component,
	} = require('tokens');

	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	/**
	 * @param {{packId: StickerPackId, packType: StickerPackType, onClick: function}} props
	 * @return {BaseMethods}
	 * @constructor
	 */
	function StickerCreateView(props)
	{
		return View(
			{
				style: {
					width: 82,
					height: 82,
					justifyContent: 'center',
					alignItems: 'center',
				},
			},
			View(
				{
					style: {
						backgroundColor: Color.accentSoftBlue2.toHex(),
						borderRadius: Component.buttonXLCorner.toNumber(),
						padding: Indent.L.toNumber(),
					},
					onClick: () => {
						props.onClick();
						// emitter.emit(StickerEventType.action.createStickers, [props.packId, props.packType]);
					},
				},
				IconView({
					icon: Icon.PLUS,
					size: 28,
					color: Color.accentMainLink,
				}),
			),
		);
	}

	module.exports = { StickerCreateView };
});
