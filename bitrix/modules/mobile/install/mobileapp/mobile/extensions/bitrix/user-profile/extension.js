/**
 * @module user-profile
 */
jn.define('user-profile', (require, exports, module) => {
	const { ajaxPublicErrorHandler } = require('error');
	const { Loc } = require('loc');
	const { NotifyManager } = require('notify-manager');
	const { TabType } = require('user-profile/const');
	const { fetchTabs, fetchNewProfileFeatureEnabled } = require('user-profile/api');
	const { Icon } = require('assets/icons');
	const { openUserProfile, ProfileView } = require('user/profile');

	/**
	 * @class UserProfile
	 */
	class UserProfile
	{
		/**
		 * @param {Object} params
		 * @param {number} [params.ownerId=env.userId]
		 * @param {string} [params.selectedTabId=TabType.COMMON]
		 * @param {boolean} [params.openInComponent=false]
		 * @param {PageManager} [params.parentWidget=PageManager]
		 */
		static async open({
			ownerId = env.userId,
			selectedTabId = TabType.COMMON,
			openInComponent = false,
			parentWidget = PageManager,
			widgetParams = {},
		} = {})
		{
			if (!ownerId)
			{
				return null;
			}

			return UserProfile.openLegacyProfile(ownerId, openInComponent, parentWidget, widgetParams);

			const isEnabled = await fetchNewProfileFeatureEnabled();

			if (!isEnabled)
			{
				return UserProfile.openLegacyProfile(ownerId, openInComponent, parentWidget, widgetParams);
			}

			void NotifyManager.showLoadingIndicator();
			const response = await fetchTabs({ ownerId, selectedTabId });
			NotifyManager.hideLoadingIndicatorWithoutFallback();
			if (response.status === 'error')
			{
				void ajaxPublicErrorHandler(response);

				return null;
			}

			const { tabs, selectedTabId: selectedTabIdFromResponse } = response.data;
			const {
				prepareTabs,
				initTabWidgets,
			} = await requireLazy('user-profile/tabs-preparer', false);

			const preparedTabs = prepareTabs(tabs, selectedTabIdFromResponse);
			const params = Object.fromEntries(preparedTabs.map((tab) => [tab.id, tab.params]));

			if (openInComponent)
			{
				parentWidget.openComponent('JSStackComponent', {
					// eslint-disable-next-line no-undef
					scriptPath: availableComponents['user-profile-tabs'].publicUrl,
					componentCode: 'user-profile-tabs',
					canOpenInDefault: true,
					rootWidget: {
						name: 'tabs',
						settings: {
							objectName: 'tabs',
							title: Loc.getMessage('M_PROFILE_TITLE'),
							grabTitle: false,
							tabs: {
								items: preparedTabs,
							},
						},
					},
					params: {
						params,
					},
				});

				return null;
			}

			return new Promise((resolve) => {
				parentWidget
					.openWidget('tabs', {
						titleParams: {
							text: Loc.getMessage('M_PROFILE_TITLE'),
						},
						grabTitle: false,
						modal: true,
						leftButtons: [{
							svg: {
								uri: `${currentDomain}${Icon.CHEVRON_DOWN_SIZE_M?.getPath()}`,
							},
							isCloseButton: true,
						}],
						tabs: {
							items: preparedTabs,
						},
					})
					.then((widget) => {
						initTabWidgets(
							widget.nestedWidgets(),
							Object.fromEntries(
								Object.entries(params).map(([tab, tabParams]) => [tab, { ...tabParams, parentWidget: widget }]),
							),
						);
						resolve(widget);
					})
					.catch(console.error)
				;
			});
		}

		static async openLegacyProfile(userId, openInComponent, parentWidget, widgetParams)
		{
			if (openInComponent)
			{
				ProfileView.openComponent({
					userId,
				});

				return null;
			}

			return openUserProfile({
				parentWidget,
				userId,
				...widgetParams,
			});
		}
	}

	module.exports = {
		UserProfile,
		fetchNewProfileFeatureEnabled,
	};
});
