(() => {
	const require = (ext) => jn.require(ext);

	const { ToolUsage } = require('tool-usage');
	const { ToolUsageBanner } = require('layout/ui/tool-usage-banner');

	BX.onViewLoaded(() => {
		void ToolUsage.onReplacementBannerShown();
		layout.showComponent(new ToolUsageBanner({
			parentWidget: layout,
		}));
	});
})();
