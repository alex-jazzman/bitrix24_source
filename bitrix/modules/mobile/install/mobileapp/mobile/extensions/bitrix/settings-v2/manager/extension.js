/**
 * @module settings-v2/manager
 */
jn.define('settings-v2/manager', (require, exports, module) => {
	const { Pages } = require('settings-v2/structure');
	const { SettingsPageId } = require('settings-v2/const');
	const { SettingsPage } = require('settings-v2/ui/page');
	const { Presentation } = require('in-app-url/presentation');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');

	/**
	 * @class SettingsManager
	 */
	class SettingsManager
	{
		/**
		 * @param {SettingsPageId} settingsPageId
		 * @param {PageManager} parentWidget
		 * @param {Object} pageParams
		 * @param {?Presentation} presentation
		 */
		async open({
			settingsPageId = SettingsPageId.ROOT,
			pageParams = {},
			parentWidget = PageManager,
			presentation = null,
		})
		{
			if (!Pages[settingsPageId])
			{
				throw new Error(`Invalid settingsPageId: "${settingsPageId}" Expected one of enum SettingsPageId`);
			}

			const settingsPage = await this.preparePage(Pages[settingsPageId], pageParams);

			return this.#openWidget({
				parentWidget,
				settingsPage,
				presentation,
			});
		}

		async preparePage(settingsPage, pageParams)
		{
			return {
				...settingsPage,
				...pageParams,
			};
		}

		#openWidget({ settingsPage, parentWidget = PageManager, presentation = null })
		{
			const { title, onOpen } = settingsPage;

			const widget = new WidgetPresenter()
				.setPresentation(Presentation.resolve(presentation, Presentation.LAYOUT))
				.setParentWidget(parentWidget)
				.setTitleParams({
					text: title,
					type: 'dialog',
				})
				.setComponent((currentWidget) => new SettingsPage({
					...settingsPage,
					openPage: this.openPage(currentWidget),
				}))
				.open();

			Promise.resolve(onOpen?.()).catch((e) => console.error(e));

			return widget;
		}

		openPage = (currentWidget) => (settingsPageId, pageParams) => {
			void new SettingsManager().open({
				settingsPageId,
				parentWidget: currentWidget,
				pageParams,
			});
		};
	}

	module.exports = {
		openSettings: ({ settingsPageId, parentWidget, presentation }) => (new SettingsManager()).open({
			settingsPageId,
			parentWidget,
			presentation,
		}),
	};
});
