(() => {
	const require = (ext) => jn.require(ext);

	// A component for testing and hypothesis validation; keep it clean in the master branch.
	class PlaygroundComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
		}

		render()
		{
			return View();
		}
	}

	layout.showComponent(
		new PlaygroundComponent(),
	);
})();
