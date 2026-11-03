/**
 * @module user-profile
 */
jn.define('user-profile', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Feature } = require('feature');
	const { TabType } = require('user-profile/const');
	const { NotifyManager } = require('notify-manager');
	const { Presentation } = require('in-app-url/presentation');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');
	const {
		getInitialTabs,
		prepareParams,
		bindEvents,
		initTabNestedWidgets,
		initTabNestedWidgetsStatic,
		loadTabsForOpen,
	} = require('user-profile/tabs-preparer');

	/**
	 * @class UserProfile
	 */
	class UserProfile
	{
		static isOpening = false;

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

		static #buildTabsOpener({ parentWidget, items, presentation })
		{
			return new WidgetPresenter()
				.setPresentation(presentation)
				.setParentWidget(parentWidget)
				.setTitle(Loc.getMessage('M_PROFILE_TITLE'))
				.setCanOpenInDefault(true)
				.setTabs(
					items,
					{
						backgroundLayout: {
							mode: 'fixedHeight',
							resizeMode: 'cover',
						},
						grabTitle: false,
					},
				);
		}

		static #openTabsComponent({ parentWidget, items, ownerId, params, presentation })
		{
			return UserProfile.#buildTabsOpener({ parentWidget, items, presentation })
				.setComponentName('user-profile-tabs', {
					componentParams: { ownerId, params },
				})
				.open();
		}

		static #openTabsWidget({ parentWidget, items, ownerId, params, initTabs, presentation })
		{
			return UserProfile.#buildTabsOpener({ parentWidget, items, presentation })
				.onReady((widget) => {
					bindEvents(widget, ownerId);
					initTabs(widget, params);
				})
				.open();
		}

		static #openTabs({ parentWidget, items, ownerId, params, openInComponent, initTabs, presentation })
		{
			return openInComponent
				? UserProfile.#openTabsComponent({ parentWidget, items, ownerId, params, presentation })
				: UserProfile.#openTabsWidget({ parentWidget, items, ownerId, params, initTabs, presentation });
		}

		/**
		 * @param {UserProfileOpenParams} [params]
		 */
		static async open({
			ownerId = env.userId,
			selectedTabId = TabType.COMMON,
			openInComponent = false,
			presentation = null,
			parentWidget = PageManager,
			analyticsSection = '',
		} = {})
		{
			if (env.modulesData?.mobile?.isGuest === true)
			{
				return null;
			}

			if (UserProfile.isOpening)
			{
				return null;
			}
			UserProfile.isOpening = true;

			const preparedPresentation = Presentation.resolve(presentation, Presentation.MODAL);
			const shouldOpenInComponent = presentation?.isModal?.() ?? openInComponent;

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
						openInComponent: shouldOpenInComponent,
						initTabs: initTabNestedWidgetsStatic,
						presentation: preparedPresentation,
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
					openInComponent: shouldOpenInComponent,
					initTabs: initTabNestedWidgets,
					presentation: preparedPresentation,
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
