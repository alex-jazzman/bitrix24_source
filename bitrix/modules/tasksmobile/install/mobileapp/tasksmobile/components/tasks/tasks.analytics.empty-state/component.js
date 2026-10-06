(() => {
	const require = (extension) => jn.require(extension);
	const { UnsupportedFeature, UnsupportedFeaturePreset } = require('tasks/unsupported-feature');

	const component = new UnsupportedFeature({
		layout,
		type: UnsupportedFeaturePreset.ANALYTICS,
	});

	BX.onViewLoaded(() => {
		layout.showComponent(component);
	});
})();
