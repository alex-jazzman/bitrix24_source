/**
 * @module in-app-url/routes/settings
 */
jn.define('in-app-url/routes/settings', (require, exports, module) => {
	const { Feature } = require('feature');
	const { requireLazy } = require('require-lazy');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { Loc } = require('loc');
	const { showSafeToast } = require('toast');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');

	const openPresetManagementPage = (params, { context }) => {
		void WidgetPresenter.fromContext(context)
			.setComponentName('tab.presets')
			.setTitleParams({
				text: context?.title || Loc.getMessage('MENU_SETTINGS_SECTION_BOTTOM_MENU'),
				useLargeTitleMode: true,
			})
			.setCanOpenInDefault(context?.canOpenInDefault ?? Boolean(context?.deeplink))
			.open();
	};

	const openGeneralSettingsPage = async (params, { context }) => {
		const openOldSettings = () => {
			PageManager.openComponent(
				'JSStackComponent',
				{
					componentCode: 'settings.config',
					// eslint-disable-next-line no-undef
					scriptPath: availableComponents.settings?.publicUrl ?? '/mobileapp/jn/settings/?version=1.0',
					type: 'component',
					canOpenInDefault: context?.canOpenInDefault ?? Boolean(context?.deeplink),
					rootWidget: {
						name: 'settings',
						settings: {
							objectName: 'settings',
							titleParams: {
								text: context?.title,
								type: 'section',
							},
							...(context?.presentation?.isModal?.() ? context.presentation.getModalSettings() : {}),
						},
					},
					params: {
						USER_ID: env.userId,
						SITE_ID: env.siteId,
						LANGUAGE_ID: env.languageId,
						IS_ADMIN: env.isAdmin,
					},
				},
			);
		};

		if (!Feature.isNativeSettingApiSupported())
		{
			console.log('settings-v2: native api not ready, fallback to old version');
			openOldSettings();

			return;
		}

		try
		{
			const isFeatureEnabled = await checkFeatureFlag(FeatureFlagType.SETTINGS_V2);
			if (!isFeatureEnabled)
			{
				console.log('settings-v2: feature disabled, fallback to old version');
				openOldSettings();

				return;
			}

			const { openSettings, SettingsPageId } = await requireLazy('settings-v2');
			openSettings({
				settingsPageId: SettingsPageId.ROOT,
				parentWidget: context?.parentWidget,
				presentation: context?.presentation,
			});
		}
		catch (e)
		{
			console.error('settings-v2: unexpected failure, fallback to old version', e);
			openOldSettings();
		}
	};

	const openGoToWebWidget = async (params, { context }) => {
		try
		{
			const { qrauth } = await requireLazy('qrauth/utils');
			qrauth.open({
				showHint: true,
				title: context?.title,
				hintText: context?.hintText,
				analyticsSection: context?.analyticsSection,
			});
		}
		catch (e)
		{
			console.error('settings-v2: error loading qrauth', e);
		}
	};

	const openQrLoginOnOtherDevice = async (params, { context }) => {
		try
		{
			const { openQrLogin } = await requireLazy('qrauth/show-code');

			await openQrLogin({
				parentWidget: context?.parentWidget,
			});
		}
		catch (e)
		{
			console.error('settings: failed to open the cross-device login sheet', e);
			showSafeToast(
				{ message: Loc.getMessage('MOBILE_TOAST_ERROR_MESSAGE') },
				context?.parentWidget,
			);
		}
	};

	// eslint-disable-next-line consistent-return
	const openNotificationSettingsPage = async (params, { context }) => {
		const openOldNotificationSettings = async () => {
			try
			{
				const {
					SettingsNotifyManager,
					SettingsNotifyProvider,
				} = await requireLazy('settings/notify-provider');

				if (!SettingsNotifyManager)
				{
					return;
				}

				const provider = new SettingsNotifyProvider();
				SettingsNotifyManager.setSettingsProvider(provider);
				await SettingsNotifyManager.loadCache();

				if (!SettingsNotifyManager.requestConfigDataLoaded)
				{
					SettingsNotifyManager.requestConfigData();
				}

				const form = SettingsNotifyManager.prepareForm('notify');

				provider.openForm(form.compile(), form.getId());
				SettingsNotifyManager.onSettingsProviderStateChanged('onViewShown', form.getId());
			}
			catch (e)
			{
				console.error('settings-v2: failed to open old notification settings', e);
			}
		};

		try
		{
			const isFeatureEnabled = await checkFeatureFlag(FeatureFlagType.SETTINGS_V2);
			if (!isFeatureEnabled)
			{
				console.log('settings-v2: feature disabled, fallback to old version');

				return openOldNotificationSettings();
			}

			const { openSettings, SettingsPageId } = await requireLazy('settings-v2');
			openSettings({
				settingsPageId: SettingsPageId.NOTIFICATIONS_ROOT,
				parentWidget: context?.parentWidget,
				presentation: context?.presentation,
			});
		}
		catch (e)
		{
			console.error('settings-v2: unexpected failure, fallback to old version', e);

			return openOldNotificationSettings();
		}
	};

	const openSecuritySettingsPage = async (params, { context }) => {
		const isSecuritySettingsAvailable = await checkFeatureFlag(FeatureFlagType.SECURITY_SETTINGS);
		if (isSecuritySettingsAvailable === true)
		{
			const { openSettings, SettingsPageId } = await requireLazy('settings-v2');

			if (openSettings && SettingsPageId)
			{
				openSettings({
					settingsPageId: SettingsPageId.SECURITY,
					parentWidget: context?.parentWidget,
					presentation: context?.presentation,
				});
			}
			else
			{
				console.error('settings-v2 module is not available');
			}
		}
		else
		{
			console.warn('security settings feature is disabled');
		}
	};

	module.exports = function(inAppUrl) {
		inAppUrl
			.addRoute('/settings/tab.presets')
			.handler(openPresetManagementPage)
			.name('settings-tab-presets');

		inAppUrl
			.addRoute('/settings/general')
			.handler(openGeneralSettingsPage)
			.name('settings-general');

		inAppUrl
			.addRoute('/settings/go-to-web')
			.handler(openGoToWebWidget)
			.name('settings-go-to-web');

		inAppUrl
			.addRoute('/settings/login-on-other-device')
			.handler(openQrLoginOnOtherDevice)
			.name('settings-login-on-other-device');

		inAppUrl
			.addRoute('/settings/notification')
			.handler(openNotificationSettingsPage)
			.name('settings-notification');

		inAppUrl
			.addRoute('/settings/security')
			.handler(openSecuritySettingsPage)
			.name('settings-security');
	};
});
