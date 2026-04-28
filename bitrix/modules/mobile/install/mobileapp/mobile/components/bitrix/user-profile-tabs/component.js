(() => {
	const require = (ext) => jn.require(ext);

	BX.onViewLoaded(async () => {
		const {
			initTabNestedWidgets,
			initTabNestedWidgetsStatic,
			bindEvents,
		} = require('user-profile/tabs-preparer');
		const { Feature } = require('feature');

		if (initTabNestedWidgets && bindEvents)
		{
			const initTabs = Feature.isDynamicTabsEditSupported()
				? initTabNestedWidgets
				: initTabNestedWidgetsStatic;

			// eslint-disable-next-line no-undef
			bindEvents(tabs, Number(BX.componentParameters.get('ownerId', env.userId)));
			// eslint-disable-next-line no-undef
			await initTabs(tabs, BX.componentParameters.get('params', {}));
		}
	});
})();
