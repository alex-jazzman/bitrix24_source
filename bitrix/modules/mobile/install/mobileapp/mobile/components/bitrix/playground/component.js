(() => {
	const require = (ext) => jn.require(ext);

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

	layout.showComponent(new PlaygroundComponent());
})();
