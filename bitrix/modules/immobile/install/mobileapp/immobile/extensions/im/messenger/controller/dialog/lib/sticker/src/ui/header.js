/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/header
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/header', (require, exports, module) => {
	const { Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color, Component } = require('tokens');
	/**
	 * @class StickerWidgetHeader
	 */
	class StickerWidgetHeader extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				title: props.title,
				configurable: props.configurable,
			};
		}

		componentDidMount()
		{
			super.componentDidMount();

			this.props.ref(this);
		}

		render()
		{
			return View(
				{
					style: {
						width: '100%',
						height: 44,
						marginTop: 15,
						flexDirection: 'row',
						justifyContent: 'center',
						paddingHorizontal: Component.paddingLr.toNumber(),
						alignItems: 'center',
					},
				},
				this.renderTitle(),
			);
		}

		renderTitle()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'row',
						justifyContent: 'center',
					},
				},
				View({
					style: {
						width: 28,
					},
				}),
				View(
					{
						style: {
							alignSelf: 'center',
							justifyContent: 'center',
							alignItems: 'center',
							flexGrow: 2,
						},
					},
					View(
						{
							style: {
								maxWidth: '80%',
							},
						},
						Text4({
							text: this.state.title,
							color: Color.base1,
							accent: true,
							ellipsize: 'end',
							numberOfLines: 1,
						}),
					),
				),
				this.renderMenu(),
			);
		}

		renderMenu()
		{
			return View(
				{
					style: {
						alignSelf: 'flex-end',
						width: 28,
						justifyContent: 'center',
						alignItems: 'center',
					},
					onClick: () => {
						if (!this.state.configurable)
						{
							return;
						}

						this.props.onClick(this.ref);
					},
					ref: (ref) => {
						this.ref = ref;
					},
				},
				this.state.configurable
					? IconView({
						icon: Icon.MORE,
						size: 28,
						color: Color.base4,
					}) : null,
			);
		}
	}

	module.exports = { StickerWidgetHeader };
});
