(() => {

	const { CrmUrl } = jn.require('crm/in-app-url/url');
	const { inAppUrl } = jn.require('in-app-url');

	class CrmBackground
	{
		constructor()
		{
			this.bindEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent('crmbackground::router', (props) => {
				const crmUrl = new CrmUrl(props);
				const url = crmUrl.toString();

				inAppUrl.open(url, { canOpenInDefault: true }, () => {
					console.error(`it is impossible to open url: ${url} `);
				});
			});
		}
	}

	this.CrmBackground = new CrmBackground();
})();
