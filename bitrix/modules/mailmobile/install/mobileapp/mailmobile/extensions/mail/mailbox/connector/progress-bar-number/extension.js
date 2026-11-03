/**
 * @module mail/mailbox/connector/progress-bar-number
 */
jn.define('mail/mailbox/connector/progress-bar-number', (require, exports, module) => {
	const { Color, Typography } = require('tokens');
	const { PureComponent } = require('layout/pure-component');

	/**
	 * @class ProgressBarNumber
	 */
	class ProgressBarNumber extends PureComponent
	{
		render()
		{
			return View(
				{
					style: {
						width: 47,
						height: 48,
						alignItems: 'flex-start',
						justifyContent: 'flex-end',
						marginLeft: 1,
					},
				},
				View(
					{
						style: {
							width: 45,
							height: 45,
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Text({
						text: String(this.props.number ?? ''),
						style: {
							...Typography.h3Accent.getStyle(),
							height: 35,
							width: 35,
							backgroundColor: this.props.backgroundColor || Color.accentMainPrimary.toHex(),
							borderRadius: 100,
							color: Color.baseWhiteFixed.toHex(),
							textAlign: 'center',
						},
					}),
				),
			);
		}
	}

	module.exports = { ProgressBarNumber };
});
