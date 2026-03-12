/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/button
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/button', (require, exports, module) => {
	const { Component, Color } = require('tokens');
	const { Text2 } = require('ui-system/typography/text');
	const { SpinnerLoader, SpinnerDesign } = require('layout/ui/loaders/spinner');

	/**
	 * @class PackButton
	 * @typedef {LayoutComponent<PackButtonProps, PackButtonState>} PackButton
	 */
	class PackButton extends LayoutComponent
	{
		static defaultProps = {
			ref: () => {},
		};

		constructor(props)
		{
			super(props);
			this.state = {
				isLoading: false,
				enabled: props.enabled,
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
						height: 42,
						width: '100%',
						backgroundColor: this.state.enabled
							? Color.accentMainPrimaryalt.toHex()
							: Color.base7.toHex(),
						borderRadius: Component.buttonLCorner.toNumber(),
						justifyContent: 'center',
						alignItems: 'center',
					},
					onClick: () => {
						if (!this.state.enabled)
						{
							return;
						}

						this.setState({
							isLoading: true,
						}, () => {
							this.props.onClick();
						});
					},
				},
				this.state.isLoading
					? SpinnerLoader({
						size: 24,
						design: SpinnerDesign.WHITE,
					})
					: Text2({
						text: this.props.text,
						color: this.state.enabled
							? Color.baseWhiteFixed
							: Color.base5,
						accent: true,
					}),
			);
		}

		setLoading(isLoading)
		{
			this.setState({
				isLoading,
			});
		}

		setEnabled(enabled)
		{
			this.setState({
				enabled,
			});
		}
	}

	module.exports = { PackButton };
});
