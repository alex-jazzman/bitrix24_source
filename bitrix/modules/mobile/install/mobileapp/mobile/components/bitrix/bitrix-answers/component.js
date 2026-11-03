// The native container raises the content itself, by the address of this script, and returns nothing to
// the side that asked for it - so the screen of the section is mounted here and not by its opener.
(() => {
	const require = (ext) => jn.require(ext);
	const { BitrixAnswersScreen } = require('more-menu/block/company/bitrix-answers/screen');

	BX.onViewLoaded(() => {
		const url = BX.componentParameters.get('url', '');
		if (!url)
		{
			console.error('bitrix-answers: no address of the page to show, nothing to mount');

			return;
		}

		layout.showComponent(new BitrixAnswersScreen({
			layout,
			url,
			title: BX.componentParameters.get('title', ''),
			// The bar above the screen belongs to the container, and this is the only place that knows the
			// screen was raised by one rather than by a modal widget.
			ownsNavigationBar: false,
			canUseSupport: BX.componentParameters.get('canUseSupport', false),
			helpdeskUrl: BX.componentParameters.get('helpdeskUrl', null),
			supportBotId: BX.componentParameters.get('supportBotId', null),
			analyticsSection: BX.componentParameters.get('analyticsSection', ''),
		}));
	});
})();
