(() => {
	const require = (extension) => jn.require(extension);
	const { UnsupportedFeature, UnsupportedFeaturePreset } = require('tasks/unsupported-feature');

	const component = new UnsupportedFeature({
		layout,
		type: UnsupportedFeaturePreset.SCRUM,
	});

	BX.onViewLoaded(() => {
		layout.showComponent(component);
	});
})();
