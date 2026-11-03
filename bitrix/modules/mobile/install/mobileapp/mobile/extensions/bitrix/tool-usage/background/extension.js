(() => {
	const require = jn.require;

	const { Type } = require('type');

	const { RunActionExecutor } = require('rest/run-action-executor');

	const {
		ToolUsage,
		ToolUsageSources,
	} = require('tool-usage');
	const { BackgroundUIManager } = require('background/ui-manager');

	/**
	 * Use only in background context.
	 *
	 * @class ToolUsageBackground
	 * @property {Promise<void>} onInit Initialization promise to await before handling events.
	 */
	class ToolUsageBackground
	{
		constructor()
		{
			this.onInit = this.#init();
		}

		/**
		 * @return {Promise<void>}
		 */
		async #init()
		{
			if (!ToolUsage.isTrackingAvailable())
			{
				return;
			}

			await this.prepareCurrentPeriod();
			await this.processExpiredPeriodIfNeeded();
			this.subscribeToEvents();
		}

		async processExpiredPeriodIfNeeded()
		{
			if (!this.isPeriodExpired)
			{
				return;
			}

			try
			{
				const result = await new RunActionExecutor('mobile.ToolUsage.process').enableJson().call();
				const data = result?.data;

				if (data?.showReplacementBanner)
				{
					this.tryToShowBanner();
				}

				const canStartNextPeriod = Boolean(data?.canStartNextPeriod);

				if (canStartNextPeriod)
				{
					const currentPeriodDays = this.period ? this.period.days : null;
					const nextPeriodDays = ToolUsage.getNextPeriodDays(currentPeriodDays);
					this.period = await ToolUsage.getNextPeriod(nextPeriodDays);
					this.isPeriodExpired = false;
				}
			}
			catch (error)
			{
				console.error('ToolUsage background: process failed', error);
			}
		}

		subscribeToEvents()
		{
			BX.addCustomEvent('onTabsSelected', this.handleTabSelected);
			BX.addCustomEvent('onOpenMenuItem', this.handleMenuSelected);
		}

		unsubscribeFromEvents()
		{
			BX.removeCustomEvent('onTabsSelected', this.handleTabSelected);
			BX.removeCustomEvent('onOpenMenuItem', this.handleMenuSelected);
		}

		handleTabSelected = (tabId) => {
			void this.registerToolUsage(tabId, ToolUsageSources.BOTTOM_NAVIGATION);
		};

		handleMenuSelected = (itemId) => {
			void this.registerToolUsage(itemId, ToolUsageSources.MENU);
		};

		/**
		 * @param {string|number} id Incoming tool/menu id.
		 * @param {string} sourceId One of ToolUsageSources.*
		 * @return {Promise<void>}
		 */
		async registerToolUsage(id, sourceId)
		{
			await this.onInit;
			if (id === null || id === undefined)
			{
				return;
			}

			const toolId = String(id);
			if (!Type.isStringFilled(toolId))
			{
				return;
			}
			void ToolUsage.registerShow(toolId, sourceId, this.period);
		}

		/**
		 * @returns {Promise<void>}
		 */
		async prepareCurrentPeriod()
		{
			try
			{
				const period = await ToolUsage.getCurrentPeriod();
				if (!period)
				{
					const nextPeriodDays = ToolUsage.getNextPeriodDays(null);
					this.period = await ToolUsage.getNextPeriod(nextPeriodDays);
					this.isPeriodExpired = false;

					return;
				}

				this.period = period;
				this.isPeriodExpired = ToolUsage.isPeriodExpired(period);
			}
			catch (e)
			{
				console.error('ToolUsage background: prepareCurrentPeriod failed', e);
			}
		}

		tryToShowBanner()
		{
			BackgroundUIManager.openComponent('ToolUsageBanner', ToolUsageBackground.showBanner, 2000);
		}

		static showBanner()
		{
			PageManager.openComponent('JSStackComponent', {
				componentCode: 'tool-usage.banner',
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['tool-usage.banner'].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: 'tool-usage.banner',
					settings: {
						objectName: 'layout',
						modal: true,
						backdrop: {
							disableTopInset: true,
							showOnTop: true,
							forceDismissOnSwipeDown: true,
							horizontalSwipeAllowed: false,
							swipeContentAllowed: true,
							hideNavigationBar: true,
							onlyMediumPosition: true,
							mediumPositionHeight: 350,
							swipeAllowed: false,
						},
					},
				},
			});
		}
	}

	new ToolUsageBackground();
})();
