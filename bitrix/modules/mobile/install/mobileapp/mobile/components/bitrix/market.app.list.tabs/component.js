(() => {
	const require = (ext) => jn.require(ext);

	BX.onViewLoaded(async () => {
		const { initTabNestedWidgets } = require('market/app-list/tabs-preparer');

		if (initTabNestedWidgets)
		{
			// eslint-disable-next-line no-undef
			initTabNestedWidgets(tabs, {
				listType: BX.componentParameters.get('listType', 'category'),
				categoryCode: BX.componentParameters.get('categoryCode', ''),
				initialTag: BX.componentParameters.get('initialTag', ''),
				installedFilter: BX.componentParameters.get('installedFilter', ''),
			});
		}
	});
})();
