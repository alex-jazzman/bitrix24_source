const root = (typeof window !== 'undefined') ? window : globalThis;

root.BX = root.BX || {};
root.BX.UI = root.BX.UI || {};
root.BX.UI.BannerDispatcher = root.BX.UI.BannerDispatcher || {
	low: {
		toQueue()
		{},
	},
};

root.BX.UI.Tour = root.BX.UI.Tour || {};
root.BX.UI.Tour.Guide = root.BX.UI.Tour.Guide || class {
	constructor(options)
	{
		this.options = options;
		this.id = options.id;
	}

	getId()
	{
		return this.id;
	}

	getPopup()
	{
		return {
			contentContainer: {
				offsetWidth: 0,
			},
			setWidth()
			{},
			setAngle()
			{},
		};
	}

	scrollToTarget()
	{}

	start()
	{}

	subscribe()
	{}
};

root.BX.UI.Dialogs = root.BX.UI.Dialogs || {};
root.BX.UI.Dialogs.MessageBoxButtons = root.BX.UI.Dialogs.MessageBoxButtons || {
	OK_CANCEL: 'OK_CANCEL',
};
