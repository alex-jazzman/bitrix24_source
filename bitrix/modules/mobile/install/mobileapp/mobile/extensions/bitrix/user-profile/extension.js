/**
 * @module user-profile
 */
jn.define('user-profile', (require, exports, module) => {
	const { Loc } = require('loc');
	const { TabType, closeIcon } = require('user-profile/const');
	const { NotifyManager } = require('notify-manager');
	const {
		getInitialTabs,
		prepareParams,
		bindEvents,
		initTabNestedWidgets,
		initTabNestedWidgetsStatic,
		loadTabsForOpen,
	} = require('user-profile/tabs-preparer');
	const { Feature } = require('feature');

	/**
	 * @class UserProfile
	 */
	class UserProfile
	{
		static isOpening = false;

		static #buildTabsWidgetOptions(items)
		{
			return {
				titleParams: {
					text: Loc.getMessage('M_PROFILE_TITLE'),
				},
				grabTitle: false,
				modal: true,
				leftButtons: [
					{
						svg: {
							content: closeIcon,
						},
						isCloseButton: true,
					},
				],
				tabs: {
					items,
				},
			};
		}

		static #buildTabsComponentParams(items, params)
		{
			return {
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
						modal: true,
						leftButtons: [
							{
								svg: {
									content: closeIcon,
								},
								isCloseButton: true,
							},
						],
						tabs: {
							items,
						},
					},
				},
				params,
			};
		}

		static #openTabsComponent(parentWidget, items, params)
		{
			PageManager.openComponent(
				'JSStackComponent',
				UserProfile.#buildTabsComponentParams(items, params),
				parentWidget,
			);
		}

		static #openTabsWidget(parentWidget, items)
		{
			return parentWidget.openWidget('tabs', UserProfile.#buildTabsWidgetOptions(items));
		}

		static async #loadPreparedTabs(options)
		{
			await NotifyManager.showLoadingIndicator();
			try
			{
				return await loadTabsForOpen(options);
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		}

		static #openTabsWidgetAndInit(parentWidget, items, ownerId, params, initTabs)
		{
			return new Promise((resolve) => {
				UserProfile.#openTabsWidget(parentWidget, items)
					.then((widget) => {
						bindEvents(widget, ownerId);
						initTabs(widget, params);
						resolve(widget);
					})
					.catch(console.error)
				;
			});
		}

		static #openTabs({ parentWidget, items, ownerId, params, openInComponent, initTabs })
		{
			if (openInComponent)
			{
				UserProfile.#openTabsComponent(parentWidget, items, {
					ownerId,
					params,
				});

				return null;
			}

			return UserProfile.#openTabsWidgetAndInit(parentWidget, items, ownerId, params, initTabs);
		}

		/**
		 * @param {Object} params
		 * @param {number} [params.ownerId=env.userId]
		 * @param {string} [params.selectedTabId=TabType.COMMON]
		 * @param {boolean} [params.openInComponent=false]
		 * @param {string} [params.analyticsSection='']
		 * @param {PageManager} [params.parentWidget=PageManager]
		 */
		static async open({
			ownerId = env.userId,
			selectedTabId = TabType.COMMON,
			openInComponent = false,
			parentWidget = PageManager,
			analyticsSection = '',
		} = {})
		{
			if (UserProfile.isOpening)
			{
				return null;
			}
			UserProfile.isOpening = true;

			try
			{
				if (!ownerId)
				{
					return null;
				}

				const isDynamicTabsSupported = Feature.isDynamicTabsEditSupported();
				if (!isDynamicTabsSupported)
				{
					const { preparedTabs, preparedParams } = await UserProfile.#loadPreparedTabs({
						ownerId,
						selectedTabId,
						analyticsSection,
					});

					return UserProfile.#openTabs({
						parentWidget,
						items: preparedTabs,
						ownerId,
						params: preparedParams,
						openInComponent,
						initTabs: initTabNestedWidgetsStatic,
					});
				}

				const initialTabs = getInitialTabs(ownerId);
				const params = prepareParams(initialTabs, {
					ownerId,
					selectedTabId,
					analyticsSection,
				});

				return UserProfile.#openTabs({
					parentWidget,
					items: initialTabs,
					ownerId,
					params,
					openInComponent,
					initTabs: initTabNestedWidgets,
				});
			}
			finally
			{
				UserProfile.isOpening = false;
			}
		}
	}

	module.exports = {
		UserProfile,
	};
});
