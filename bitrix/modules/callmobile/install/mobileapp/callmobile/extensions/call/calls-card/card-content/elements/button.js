/**
 * @module call/calls-card/card-content/elements/button
 */
jn.define('call/calls-card/card-content/elements/button', (require, exports, module) => {
	const DEFAULT_COLOR = '#FFFFFF';
	const PRESSED_COLOR = '#2FC6F6';

	/**
	 * @class Button
	 */
	class Button extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				selected: false,
			};
		}

		get icon()
		{
			return BX.prop.getString(this.props, 'icon', null);
		}

		get iconSelected()
		{
			return BX.prop.getString(this.props, 'iconSelected', null);
		}

		get activeWhenSelected()
		{
			return BX.prop.getBoolean(this.props, 'activeWhenSelected', false);
		}

		get buttonText()
		{
			return BX.prop.getString(this.props, 'text', null);
		}

		get isSwitchable()
		{
			return BX.prop.getBoolean(this.props, 'isSwitchable', false);
		}

		get eventName()
		{
			return BX.prop.getString(this.props, 'eventName', null);
		}

		get enabled()
		{
			return BX.prop.getBoolean(this.props, 'enabled', true);
		}

		get testId()
		{
			return BX.prop.getString(this.props, 'testId', null);
		}

		render()
		{
			const { selected } = this.state;
			const currentIcon = this.iconSelected && selected ? this.iconSelected : this.icon;
			const isActive = this.iconSelected && (this.activeWhenSelected ? selected : !selected);
			const bgOpacity = this.enabled ? (isActive ? 1 : 0.3) : 0.07;
			const bgColor = !this.iconSelected && this.isSwitchable && selected ? PRESSED_COLOR : DEFAULT_COLOR;

			return View(
				{
					style: {
						flexDirection: 'column',
						alignItems: 'center',
						marginHorizontal: 6,
						minWidth: 69.75,
					},
					clickable: false,
				},
				View(
					{
						style: {
							width: 52,
							height: 52,
							marginBottom: 2,
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
						},
						clickable: false,
					},
					View(
						{
							style: {
								width: 48,
								height: 48,
								borderRadius: 23.5,
								backgroundColor: {
									default: bgColor,
									pressed: this.enabled ? PRESSED_COLOR : DEFAULT_COLOR,
								},
								opacity: bgOpacity,
							},
							testId: this.testId,
							onTouchesBegan: () => {
								if (this.isSwitchable && this.eventName && this.props.onUiEvent && this.enabled)
								{
									this.setState(
										{
											selected: !selected,
										},
										() => {
											const { selected: newSelected } = this.state;

											this.props.onUiEvent({
												eventName: this.eventName,
												params: {
													selected: newSelected,
												},
											});

											if (this.props.onClick)
											{
												this.props.onClick({
													selected: newSelected,
												});
											}
										},
									);
								}
							},
							onClick: () => {
								if (!this.isSwitchable && this.eventName && this.props.onUiEvent && this.enabled)
								{
									this.props.onUiEvent({
										eventName: this.eventName,
										params: {
											selected,
										},
									});

									if (this.props.onClick)
									{
										this.props.onClick({
											selected,
										});
									}
								}
							},
						},
					),
					View(
						{
							style: {
								width: 47,
								height: 47,
								marginTop: -47,
								justifyContent: 'center',
								alignItems: 'center',
							},
							clickable: false,
						},
						Image({
							style: {
								width: 34,
								height: 34,
								opacity: this.enabled ? 1 : 0.4,
							},
							svg: {
								content: currentIcon,
							},
						}),
					),
				),
				Text({
					style: {
						color: '#FFFFFF',
						fontSize: 12,
						opacity: 0.5,
						marginTop: -3,
					},
					text: this.buttonText,
				}),
			);
		}
	}

	module.exports = { Button };
});
