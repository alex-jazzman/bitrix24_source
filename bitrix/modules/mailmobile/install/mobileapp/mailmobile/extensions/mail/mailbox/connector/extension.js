/**
 * @module mail/mailbox/connector
 */

jn.define('mail/mailbox/connector', (require, exports, module) => {
	const { MailWizard } = require('mail/mailbox/connector/wizard');
	const { AjaxMethod } = require('mail/const');
	const { ServicesListStep } = require('mail/mailbox/connector/steps/services-list');
	const { LoginPassword } = require('mail/mailbox/connector/steps/login-password');
	const { Imap } = require('mail/mailbox/connector/steps/imap');
	const { OAuth } = require('mail/mailbox/connector/steps/oauth');
	const { Settings } = require('mail/mailbox/connector/steps/settings');
	const { NotifyManager } = require('notify-manager');
	const { MailDialog } = require('mail/dialog');
	const { AnalyticsEvent } = require('analytics');

	class Connector extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			const {
				parentWidget,
				successCallback = () => {},
				connectFrom = 'mail',
			} = props;
			this.parentWidget = parentWidget;
			this.successCallback = successCallback;
			this.connectedEmail = false;
			this.stepProps = {};
			this.getStepForId = this.getStepForId.bind(this);
			this.oauthMode = true;
			this.connectFrom = connectFrom;
			this.pendingCredentials = null;
			this.settingsConfig = null;
		}

		validateFields(fieldRefs)
		{
			let validate = true;

			Object.values(fieldRefs).forEach((fieldRef) => {
				if (fieldRef && !fieldRef.validate())
				{
					validate = false;
				}
			});

			return validate;
		}

		loadConnectionUrl()
		{
			return BX.ajax.runAction(AjaxMethod.getMailboxConnectionUrl, {});
		}

		connectMailbox(props, settings = {})
		{
			const {
				login = '',
				password = '',
				server = '',
				port = 993,
				ssl = true,
				storageOauthUid = '',
				useSmtp = 1,
				serverSmtp = '',
				portSmtp = 587,
				sslSmtp = true,
				loginSmtp = '',
				passwordSMTP = '',
				loginWithoutDomain = '',
			} = props;

			return BX.ajax.runAction(AjaxMethod.connectMailbox, {
				data: {
					serviceId: this.getMailServiceId(),
					login,
					password,
					server,
					port,
					ssl: ssl ? 1 : 0,
					storageOauthUid,
					useSmtp,
					serverSmtp,
					portSmtp,
					sslSmtp: sslSmtp ? 1 : 0,
					loginSmtp,
					passwordSMTP,
					loginWithoutDomain,
					...settings,
				},
			});
		}

		loadServices()
		{
			return BX.ajax.runAction(AjaxMethod.getMailboxServices, {});
		}

		loadSettingsConfig()
		{
			return BX.ajax.runAction(AjaxMethod.getMailboxSettingsConfig, {});
		}

		renderWizard()
		{
			return new MailWizard({
				parentLayout: this.currentLayout,
				steps: this.getSteps().map((step) => step.id),
				stepForId: this.getStepForId,
				useProgressBar: true,
				hideProgressBarInLastTab: true,
				isNavigationBarBorderEnabled: true,
			});
		}

		saveMailServiceId(id)
		{
			this.currentMailServiceId = id;
		}

		getMailServiceId()
		{
			return Number(this.currentMailServiceId);
		}

		saveMailServiceKey(key)
		{
			this.currentMailServiceKey = key;
		}

		getConnectedMailboxId()
		{
			return this.connectedMailboxId;
		}

		saveConnectedMailboxId(id)
		{
			this.connectedMailboxId = Number(id);
		}

		saveConnectedEmail(email)
		{
			this.connectedEmail = email;
		}

		getConnectedEmail()
		{
			return this.connectedEmail;
		}

		getServices()
		{
			return this.mailServices;
		}

		setSettingsConfig(config)
		{
			this.settingsConfig = config;
		}

		getSettingsConfig()
		{
			return this.settingsConfig;
		}

		nextStep()
		{
			this.wizard.moveToNextStep();
		}

		async goToStartStep()
		{
			this.currentLayout = await this.wizard.openStepWidget('servicesList');
		}

		async goToImap()
		{
			this.currentLayout = await this.wizard.openStepWidget('imap');
		}

		async goToLoginPassword()
		{
			this.currentLayout = await this.wizard.openStepWidget('loginPassword');
		}

		async goToOauth()
		{
			this.currentLayout = await this.wizard.openStepWidget('oauth');
		}

		async goToSettings()
		{
			this.stepProps.settings = {
				isNewMailbox: true,
				settingsConfig: this.getSettingsConfig(),
			};

			const settingsStep = this.getStepForId('settings');
			this.wizard.addStep('settings', settingsStep);

			this.currentLayout = await this.wizard.openStepWidget('settings');
		}

		goToFinalStep()
		{
			MailDialog.show({
				type: MailDialog.CONNECTING_MAIL_TYPE_FINAL,
				layoutWidget: this.currentLayout,
				successCallback: () => {
					this.successCallback(
						this.getConnectedMailboxId(),
						this.getConnectedEmail(),
					);
				},
				mailboxId: this.getConnectedMailboxId(),
			});
		}

		getMailServiceKey()
		{
			return this.currentMailServiceKey;
		}

		onErrorEnter(errors, showErrors = true)
		{
			this.sendErrorAnalytics();
			this.goToStartStep();

			if (showErrors)
			{
				NotifyManager.showErrors(errors);
			}
		}

		onAuthComplete(credentials)
		{
			this.pendingCredentials = credentials;
			NotifyManager.hideLoadingIndicatorWithoutFallback();
			this.goToSettings();
		}

		connectWithSettings(settingsPayload)
		{
			NotifyManager.showLoadingIndicator();

			return this.connectMailbox(this.pendingCredentials, settingsPayload)
				.then(({ data }) => {
					this.sendSuccessAnalytics();
					this.saveConnectedEmail(data.email);
					this.saveConnectedMailboxId(data.id);
					NotifyManager.hideLoadingIndicatorWithoutFallback();
					this.goToFinalStep();
				})
				.catch(({ errors }) => {
					NotifyManager.hideLoadingIndicatorWithoutFallback();
					this.sendErrorAnalytics();
					NotifyManager.showErrors(errors);
				});
		}

		sendErrorAnalytics()
		{
			new AnalyticsEvent({
				tool: 'mail',
				category: 'mail_general_ops',
				event: 'mailbox_connect',
				c_section: this.connectFrom,
				status: 'error',
			}).send();
		}

		sendSuccessAnalytics()
		{
			new AnalyticsEvent({
				tool: 'mail',
				category: 'mail_general_ops',
				event: 'mailbox_connect',
				c_section: this.connectFrom,
				status: 'success',
			}).send();
		}

		getStepForId(stepId)
		{
			const step = this.getSteps().find((step) => step.id === stepId);

			const props = this.stepProps[stepId] || {};
			props.parent = this;
			if (step)
			{
				return new step.component(props);
			}

			return null;
		}

		getSteps()
		{
			const steps = [];

			steps.push(
				{
					id: 'servicesList',
					component: ServicesListStep,
				},
				{
					id: 'oauth',
					component: OAuth,
				},
				{
					id: 'imap',
					component: Imap,
				},
				{
					id: 'loginPassword',
					component: LoginPassword,
				},
				{
					id: 'settings',
					component: Settings,
				},
			);

			return steps;
		}

		render()
		{
			const wizard = this.renderWizard();
			this.wizard = wizard;

			return View(
				{},
				wizard,
			);
		}

		setConnectionUrl(url)
		{
			this.connectionUrl = url;
		}

		async getConnectionUrl()
		{
			if (!this.connectionUrl)
			{
				const response = await this.loadConnectionUrl();

				if (response.data)
				{
					this.setConnectionUrl(response.data);
				}
			}

			return `${this.connectionUrl}?serviceName=${this.getMailServiceKey()}`;
		}

		async show()
		{
			NotifyManager.showLoadingIndicator();

			try
			{
				const [servicesResponse, settingsConfigResponse] = await Promise.all([
					this.loadServices(),
					this.loadSettingsConfig(),
				]);

				if (servicesResponse.data)
				{
					this.mailServices = servicesResponse.data;
					this.setSettingsConfig(settingsConfigResponse?.data || null);
					NotifyManager.hideLoadingIndicatorWithoutFallback();

					const parentWidget = this.parentWidget || PageManager;
					const widget = await parentWidget.openWidget('layout', {
						modal: true,
						backdrop: {
							horizontalSwipeAllowed: false,
							mediumPositionPercent: 90,
						},
					});

					this.currentLayout = widget;
					widget.showComponent(this);
				}
			}
			catch (error)
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();

				if (error?.errors)
				{
					NotifyManager.showErrors(error.errors);
				}
			}
		}

	}

	module.exports = {
		Connector,
	};
});
