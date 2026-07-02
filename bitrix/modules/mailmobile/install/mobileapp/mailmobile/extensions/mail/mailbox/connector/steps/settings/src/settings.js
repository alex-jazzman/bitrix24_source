/**
 * @module mail/mailbox/connector/steps/settings/src/settings
 */
jn.define('mail/mailbox/connector/steps/settings/src/settings', (require, exports, module) => {
	const { WizardStep } = require('layout/ui/wizard/step');
	const { ProgressBarNumber } = require('mail/mailbox/connector/progress-bar-number');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { SettingsLayout } = require('mail/mailbox/settings');
	const ACTIVE_STEP_COLOR = Color.accentMainPrimary.toHex();
	const NEXT_STEP_COLOR = Color.base6.toHex();

	/**
	 * @class Settings
	 */
	class Settings extends WizardStep
	{
		constructor(props)
		{
			super();
			this.props = props;
		}

		getBackgroundColor()
		{
			return Color.bgContentPrimary.toHex();
		}

		getProgressBarSettings()
		{
			return {
				...super.getProgressBarSettings(),
				isEnabled: true,
				title: {
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_STEP_TITLE'),
				},
				number: 3,
				count: 3,
				previousLineColor: ACTIVE_STEP_COLOR,
				currentLineColor: ACTIVE_STEP_COLOR,
				nextLineColor: NEXT_STEP_COLOR,
			};
		}

		renderNumberBlock()
		{
			const progressBarSettings = this.getProgressBarSettings();

			return new ProgressBarNumber({
				number: progressBarSettings.number.toString(),
				backgroundColor: ACTIVE_STEP_COLOR,
				showOuterDecoration: false,
			});
		}

		getTitle()
		{
			return Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_TITLE');
		}

		createLayout(props)
		{
			this.settingsLayout = new SettingsLayout({
				isNewMailbox: this.props.isNewMailbox,
				settingsConfig: this.props.settingsConfig,
				layoutWidget: this.props.parent?.currentLayout,
				titleText: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_TITLE'),
				onConnect: (payload) => {
					if (this.props.parent)
					{
						this.props.parent.connectWithSettings(payload);
					}
				},
			});

			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.settingsLayout,
			);
		}
	}

	module.exports = { Settings };
});
