(() => {
	const showNavigationLoader = () => {
		const slider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (!slider)
		{
			return;
		}

		slider.showLoader();
	};

	const applyDesignSystemContext = () => {
		const contextClasses = [
			'--ui-context-edge-dark',
			'--ui-context-edge-light',
			'--ui-context-content-dark',
			'--ui-context-content-light',
		];

		document.body.classList.remove(...contextClasses);
		document.body.classList.add(
			'biconnector-workspace-analytic-page',
			'--ui-context-content-light',
		);
	};

	BX.Event.bind(window, 'beforeunload', showNavigationLoader);

	if (document.readyState === 'loading')
	{
		document.addEventListener(
			'DOMContentLoaded',
			applyDesignSystemContext,
			{ once: true },
		);
	}
	else
	{
		applyDesignSystemContext();
	}
})();
