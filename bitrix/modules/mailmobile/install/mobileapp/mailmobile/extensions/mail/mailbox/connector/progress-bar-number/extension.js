/**
 * @module mail/mailbox/connector/progress-bar-number
 */
jn.define('mail/mailbox/connector/progress-bar-number', (require, exports, module) => {
	const AppTheme = require('apptheme');
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
							height: 35,
							width: 35,
							backgroundColor: this.props.backgroundColor || AppTheme.colors.accentMainPrimary,
							borderRadius: 100,
							color: AppTheme.colors.baseWhiteFixed,
							fontSize: 19,
							fontWeight: '600',
							textAlign: 'center',
						},
					}),
				),
			);
		}
	}

	module.exports = { ProgressBarNumber };
});
