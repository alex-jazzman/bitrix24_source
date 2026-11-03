/**
 * @module crm/timeline/item/ui/header/pin-button
 */
jn.define('crm/timeline/item/ui/header/pin-button', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');

	const ICON_SIZE = 20;

	/**
	 * @extends {LayoutComponent<TimelineItemHeaderPinButtonProps, TimelineItemHeaderPinButtonState>}
	 */
	class PinButton extends LayoutComponent
	{
		/**
		 * @param {TimelineItemHeaderPinButtonProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = { pinned: Boolean(props.pinned) };
		}

		/**
		 * @param {TimelineItemHeaderPinButtonProps} props
		 */
		componentWillReceiveProps(props)
		{
			this.state.pinned = Boolean(props.pinned);
		}

		render()
		{
			const { testId } = this.props;
			const { pinned } = this.state;

			return View(
				{
					testId,
					style: {
						paddingVertical: 10,
						paddingHorizontal: 13,
						justifyContent: 'center',
						alignItems: 'center',
					},
					onClick: () => this.#handleClick(),
				},
				IconView({
					testId: `${testId}-icon`,
					icon: pinned ? Icon.UNPIN : Icon.PIN,
					size: ICON_SIZE,
					color: Color.base3,
				}),
			);
		}

		#handleClick()
		{
			const { isReadonly, onClick } = this.props;

			if (isReadonly)
			{
				return;
			}

			this.setState({ pinned: !this.state.pinned });

			if (onClick)
			{
				onClick();
			}
		}
	}

	module.exports = { PinButton };
});
