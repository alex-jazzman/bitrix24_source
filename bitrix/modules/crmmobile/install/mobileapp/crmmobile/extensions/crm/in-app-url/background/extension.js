(() => {

	const { CrmRouter } = jn.require('crm/in-app-url/router');

	class CrmBackground
	{
		constructor()
		{
			this.bindEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent('crmbackground::router', (props) => {
				const router = new CrmRouter(props);
				router.open();
			});
		}
	}

	this.CrmBackground = new CrmBackground();
})();
