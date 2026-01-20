(() => {
	const require = (extension) => jn.require(extension);
	const { ResultsYear } = require('intranet/results-year/story');

	BX.onViewLoaded(() => {
		void ResultsYear.show({
			onClose: () => {
				layout.close();
			},
		});
	});
})();
