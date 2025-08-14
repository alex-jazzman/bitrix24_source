/**
 * @module im/messenger/lib/promotion/copilot-view
 */
jn.define('im/messenger/lib/promotion/copilot-view', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { Icon, IconView } = require('ui-system/blocks/icon');

	const { PromotionAsset } = require('im/messenger/assets/promotion');

	/**
	 * @class CopilotView
	 */
	class CopilotView extends LayoutComponent
	{
		/**
		 * @param {() => any} props.onClick
		 */
		constructor(props)
		{
			super(props);
		}

		render()
		{
			return View(
				{},
				View(
					{
						style: {
							width: 410,
							maxWidth: '98%',
							minHeight: 122,
							flexDirection: 'row',
							backgroundColor: Color.bgContentInapp.toHex(),
							borderRadius: 18,
							padding: 12,
							paddingRight: 18,
							overflow: 'hidden',
						},
					},
					IconView({
						style: {
							position: 'absolute',
							right: 12,
							top: 12,
							padding: 12,
						},
						size: 24,
						color: Color.chatOverallBaseWhite2,
						icon: Icon.CROSS,
						onClick: this.props.onClick,
					}),
					View(
						{
							style: {
								borderRadius: 8,
								padding: 10,
								height: '100%',
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						Image({
							style: {
								width: 78,
								height: 78,
								marginRight: 8,
								alignSelf: 'center',
							},
							svg: {
								uri: PromotionAsset.copilotInDefaultTabUrl,
							},
						}),
					),
					View(
						{
							style: {
								flex: 1,
								marginLeft: 12,
								flexDirection: 'column',
								overflow: 'hidden',
								maxWidth: '100%',
								width: '100%',
							},
							clickable: false,
						},
						Text({
							style: {
								color: Color.baseWhiteFixed.toHex(),
								fontSize: 17,
								fontWeight: '500',
								flexShrink: 1,
							},
							text: Loc.getMessage('IM_PROMO_COPILOT_IN_DEFAULT_TAB_TITLE'),
							ellipsize: 'end',
							numberOfLines: 3,
						}),
						Text({
							style: {
								color: Color.chatOverallBaseWhite2.toHex(),
								fontSize: 15,
								fontWeight: '400',
								marginTop: 6,
							},
							text: Loc.getMessage('IM_PROMO_COPILOT_IN_DEFAULT_TAB_DESCRIPTION'),
							ellipsize: 'end',
							numberOfLines: 4,
						}),
					),
				),
			);
		}
	}

	module.exports = { CopilotView };
});
