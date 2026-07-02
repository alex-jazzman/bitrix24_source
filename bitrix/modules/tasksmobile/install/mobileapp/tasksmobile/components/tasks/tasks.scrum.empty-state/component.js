(() => {
	const require = (extension) => jn.require(extension);
	const { UnsupportedFeature, UnsupportedFeatureType } = require('tasks/unsupported-feature');

	const component = new UnsupportedFeature({
		layout,
		type: UnsupportedFeatureType.SCRUM,
	});

	BX.onViewLoaded(() => {
		layout.showComponent(component);
	});
})();
