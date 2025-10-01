(() => {
	BX.onViewLoaded(async () => {
		const { initTabWidgets } = await requireLazy('user-profile/tabs-preparer', false);
		if (initTabWidgets)
		{
			const params = BX.componentParameters.get('params', {});

			initTabWidgets(
				// eslint-disable-next-line no-undef
				tabs.nestedWidgets(),
				Object.fromEntries(
					// eslint-disable-next-line no-undef
					Object.entries(params).map(([tab, tabParams]) => [tab, { ...tabParams, parentWidget: tabs }]),
				),
			);
		}
	});
})();
