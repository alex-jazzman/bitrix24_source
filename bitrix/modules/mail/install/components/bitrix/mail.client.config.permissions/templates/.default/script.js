;(function()
{
	const namespace = BX.namespace('BX.Mail.ConfigPerms');

	class ConfigPermsComponent
	{
		constructor(options)
		{
			this.accessRightsOptions = options.accessRightsOptions;
			this.accessRights = options.accessRights;
		}

		init()
		{
			this.accessRights.draw();
		}
	}

	namespace.ConfigPermsComponent = ConfigPermsComponent;
})();
