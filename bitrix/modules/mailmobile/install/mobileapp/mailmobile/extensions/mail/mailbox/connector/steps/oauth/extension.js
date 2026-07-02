/**
 * @module mail/mailbox/connector/steps/oauth
 */

jn.define('mail/mailbox/connector/steps/oauth', (require, exports, module) => {
	const { WizardStep } = require('layout/ui/wizard/step');
	const { ProgressBarNumber } = require('mail/mailbox/connector/progress-bar-number');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { getParameterByName } = require('utils/url');
	const ACTIVE_STEP_COLOR = Color.accentMainPrimary.toHex();
	const NEXT_STEP_COLOR = Color.base6.toHex();

	class OAuth extends WizardStep
	{
		constructor(props)
		{
			super();
			this.props = props;
		}

		isNextStepEnabled()
		{
			return false;
		}

		getTitle()
		{
			return Loc.getMessage('MAILBOX_CONNECTOR_OAUTH_HEADER_TITLE');
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

		getProgressBarSettings()
		{
			return {
				...super.getProgressBarSettings(),
				isEnabled: true,
				title: {
					text: Loc.getMessage('MAILBOX_CONNECTOR_OAUTH_TITLE_1'),
				},
				number: 2,
				count: 3,
				previousLineColor: ACTIVE_STEP_COLOR,
				currentLineColor: ACTIVE_STEP_COLOR,
				nextLineColor: NEXT_STEP_COLOR,
			};
		}

		startOAuth()
		{
			this.props.parent.getConnectionUrl().then(
				(response) => {
					const { OAuthSession } = jn.require('native/oauth');
					const session = new OAuthSession(response);
					session.start()
						.then(async ({ url }) => {
							const storageOauthUid = getParameterByName(url, 'storedUid');
							const login = getParameterByName(url, 'email');
							if (storageOauthUid && storageOauthUid !== '' && login && login !== '')
							{
								this.props.parent.onAuthComplete({
									useSmtp: 0,
									storageOauthUid,
									login,
								});
							}
							else
							{
								const error = getParameterByName(url, 'error');
								let errors = [];
								if (error)
								{
									errors = [
										{
											message: error,
										},
									];
								}
								this.props.parent.onErrorEnter(errors);
							}
						})
						.catch(({ errors }) => {
							this.props.parent.onErrorEnter(errors, false);
						});
				},
			).catch(() => {
				this.props.parent.goToStartStep();
			});
		}

		createLayout(props)
		{
			this.startOAuth();

			return View(
				{},
				ScrollView(
					{
						style: {
							height: '100%',
						},
					},
					View(
						{
							style: {
								paddingTop: 200,
								alignItems: 'center',
							},
						},
						View(
							{
								justifyContent: 'center',
								flexDirection: 'row',
							},
							Loader({
								style: {
									width: 50,
									height: 50,
								},
								tintColor: '#00aeff',
								animating: true,
								size: 'large',
							}),
						),
					),
				),
			);
		}
	}

	module.exports = { OAuth };
});
