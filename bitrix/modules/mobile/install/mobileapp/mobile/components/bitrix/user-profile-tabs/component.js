(() => {
	BX.onViewLoaded(async () => {
		const { initTabWidgets } = await requireLazy('user-profile/tabs-preparer', false);
		if (initTabWidgets)
		{
			// eslint-disable-next-line no-undef
			initTabWidgets(tabs.nestedWidgets(), BX.componentParameters.get('params', {}));
		}
	});
})();
