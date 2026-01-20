/**
 * @module settings-v2/manager
 */
jn.define('settings-v2/manager', (require, exports, module) => {
	const { Pages } = require('settings-v2/structure');
	const { SettingsPageId } = require('settings-v2/const');
	const { SettingsPage } = require('settings-v2/ui/page');
	const { Type } = require('type');

	/**
	 * @class SettingsManager
	 */
	class SettingsManager
	{
		/**
		 * @param {SettingsPageId} settingsPageId
		 * @param {PageManager} parentWidget
		 * @param {Object} pageParams
		 */
		async open({ settingsPageId = SettingsPageId.ROOT, pageParams = {}, parentWidget = PageManager })
		{
			if (!Pages[settingsPageId])
			{
				throw new Error(`Invalid settingsPageId: "${settingsPageId}" Expected one of enum SettingsPageId`);
			}

			const settingsPage = await this.preparePage(Pages[settingsPageId], pageParams);

			return this.#openWidget({
				parentWidget,
				settingsPage,
			});
		}

		async preparePage(settingsPage, pageParams)
		{
			return {
				...settingsPage,
				...pageParams,
			};
		}

		async #openWidget({ settingsPage, parentWidget = PageManager })
		{
			const { title } = settingsPage;
			const currentWidget = await parentWidget.openWidget('layout', {
				titleParams: {
					text: title,
					type: 'dialog',
				},
			});

			currentWidget.showComponent(
				new SettingsPage({
					...settingsPage,
					openPage: this.openPage(currentWidget),
				}),
			);
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
		openSettings: ({ settingsPageId, parentWidget }) => (new SettingsManager()).open({
			settingsPageId,
			parentWidget,
		}),
	};
});
