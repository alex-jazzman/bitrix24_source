(() => {
	const require = (ext) => jn.require(ext);
	const { MarketHome } = require('market/home');

	BX.onViewLoaded(() => {
		layout.showComponent(
			MarketHome({
				layout,
			}),
		);
	});
})();
