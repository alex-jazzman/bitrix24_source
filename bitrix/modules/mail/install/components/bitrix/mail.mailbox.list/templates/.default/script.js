;(function()
{
	const namespace = BX.namespace('BX.Mail.MailboxList');
	if (namespace.Manager)
	{
		return;
	}

	class Manager
	{
		constructor(params)
		{
			this.gridId = params.gridId;

			this.sliderMessageEvent = 'SidePanel.Slider:onMessage';

			this.reloadGridEventIds = [
				'mail-mailbox-config-success',
				'mail-mailbox-config-delete',
				'mail-massconnect-mailboxes-append-success',
			];

			this.bindEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent(this.sliderMessageEvent, this.onSliderMessage.bind(this));
		}

		onSliderMessage(event)
		{
			if (this.reloadGridEventIds.includes(event.getEventId()))
			{
				const grid = BX.Main.gridManager.getInstanceById(this.gridId);
				if (grid)
				{
					grid.reload();
				}
			}
		}

		unbindEvents()
		{
			BX.removeCustomEvent(this.sliderMessageEvent, this.onSliderMessage.bind(this));
		}

		destroy()
		{
			this.unbindEvents();
		}
	}

	const LimitHelpers = {
		showLimitSlider(code)
		{
			const activeFeaturePromoter = BX.UI.FeaturePromotersRegistry.getPromoter({
				code,
			});
			activeFeaturePromoter.show();
		},
	};

	namespace.Manager = Manager;
	namespace.LimitHelpers = LimitHelpers;
})();
