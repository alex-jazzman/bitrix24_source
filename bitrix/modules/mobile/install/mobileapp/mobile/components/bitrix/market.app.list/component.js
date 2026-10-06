(() => {
	const require = (ext) => jn.require(ext);
	const { MarketList } = require('market/app-list');

	BX.onViewLoaded(() => {
		layout.showComponent(
			MarketList({
				layout,
				categoryCode: BX.componentParameters.get('categoryCode', ''),
				initialTag: BX.componentParameters.get('initialTag', ''),
			}),
		);
	});
})();
