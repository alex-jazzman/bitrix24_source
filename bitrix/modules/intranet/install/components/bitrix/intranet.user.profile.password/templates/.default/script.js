;(function ()
{
	var namespace = BX.namespace('BX.Intranet.UserProfile');
	if (namespace.Password)
	{
		return;
	}

	namespace.Password = function(params)
	{
		this.init(params);
	};

	namespace.Password.prototype = {
		init: function(params)
		{
			var logoutButton = document.querySelector("[data-role='intranet-pass-logout']");
			if (BX.type.isDomNode(logoutButton))
			{
				BX.bind(logoutButton, "click", function () {
					(new BX.Intranet.LogoutAllConfirm()).show();
				});
			}
		}
	};

})();