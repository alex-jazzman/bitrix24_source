/**
 * @module in-app-url/routes/settings
 */
jn.define('in-app-url/routes/settings', (require, exports, module) => {
	const { Feature } = require('feature');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');

	const openPresetManagementPage = (params, { context }) => {
		PageManager.openComponent(
			'JSStackComponent',
			{
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['tab.presets'].publicUrl,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						titleParams: {
							text: context?.title,
							useLargeTitleMode: true,
						},
					},
				},
			},
		);
	};

	const openGeneralSettingsPage = async (params, { context }) => {
		const openOldSettings = () => {
			PageManager.openComponent(
				'JSStackComponent',
				{
					componentCode: 'settings.config',
					// eslint-disable-next-line no-undef
					scriptPath: availableComponents['settings'].publicUrl,
					type: 'component',
					rootWidget: {
						name: 'settings',
						settings: {
							objectName: 'settings',
							titleParams: {
								text: context?.title,
								type: 'section',
							},
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
			openSettings({ settingsPageId: SettingsPageId.ROOT });
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

	// eslint-disable-next-line consistent-return
	const openNotificationSettingsPage = async () => {
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
			openSettings({ settingsPageId: SettingsPageId.NOTIFICATIONS_ROOT });
		}
		catch (e)
		{
			console.error('settings-v2: unexpected failure, fallback to old version', e);

			return openOldNotificationSettings();
		}
	};

	const openSecuritySettingsPage = async () => {
		const isSecuritySettingsAvailable = await checkFeatureFlag(FeatureFlagType.SECURITY_SETTINGS);
		if (isSecuritySettingsAvailable === true)
		{
			const { openSettings, SettingsPageId } = await requireLazy('settings-v2');

			if (openSettings && SettingsPageId)
			{
				openSettings({
					settingsPageId: SettingsPageId.SECURITY,
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
			.register('/settings/tab.presets', openPresetManagementPage)
			.name('settings-tab-presets');

		inAppUrl
			.register('/settings/general', openGeneralSettingsPage)
			.name('settings-general');

		inAppUrl
			.register('/settings/go-to-web', openGoToWebWidget)
			.name('settings-go-to-web');

		inAppUrl
			.register('/settings/notification', openNotificationSettingsPage)
			.name('settings-notification');

		inAppUrl
			.register('/settings/security', openSecuritySettingsPage)
			.name('settings-security');
	};
});
