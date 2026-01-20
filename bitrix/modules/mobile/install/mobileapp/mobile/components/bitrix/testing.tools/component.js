(() => {
	const require = (ext) => jn.require(ext);
	const { ManualTestingToolList } = require('manual-testing-tools');

	class ManualTestingToolsComponent extends LayoutComponent
	{
		render()
		{
			return ManualTestingToolList();
		}
	}

	layout.showComponent(new ManualTestingToolsComponent());
})();
