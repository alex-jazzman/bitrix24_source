/**
 * @module user-profile/tabs-preparer
 */
jn.define('user-profile/tabs-preparer', (require, exports, module) => {
	const { TabType } = require('user-profile/const');
	const { CommonTab } = require('user-profile/common-tab');

	/**
	 * @param {Array} tabs
	 * @param {string} selectedTabId
	 * @return {Array}
	 */
	function prepareTabs(tabs, selectedTabId)
	{
		return (
			tabs
				.filter((tab) => (
					tab.widget
					// eslint-disable-next-line no-undef
					|| availableComponents[tab.componentName]
					|| tab.component?.rootWidget?.name === 'web'
				))
				.map((tab) => ({
					id: tab.id,
					title: tab.title,
					active: tab.id === selectedTabId,
					component: tab.component,
					widget: tab.widget,
					params: tab.params,
				}))
		);
	}

	/**
	 * @param {Object} nestedWidgets
	 * @param {Object} params
	 */
	function initTabWidgets(nestedWidgets, params)
	{
		initCommonTabWidget(nestedWidgets, params);
	}

	function initCommonTabWidget(nestedWidgets, params)
	{
		if (nestedWidgets[TabType.COMMON])
		{
			const widget = nestedWidgets[TabType.COMMON];
			const widgetParams = params[TabType.COMMON];

			widget.showComponent(
				CommonTab({ ...widgetParams, layout: widget }),
			);
		}
	}

	module.exports = {
		prepareTabs,
		initTabWidgets,
	};
});
