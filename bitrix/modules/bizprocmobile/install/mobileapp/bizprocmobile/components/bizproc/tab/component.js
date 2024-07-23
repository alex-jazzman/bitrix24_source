(() => {
	const require = (ext) => jn.require(ext);

	const { PureComponent } = require('layout/pure-component');
	const { WorkflowList } = require('bizproc/workflow/list');
	class TabComponent extends PureComponent
	{
		TAB_ID = 'bizproc';
		isActive = true;
		inactiveTime;
		listRef;

		render()
		{
			return new WorkflowList({
				layout,
				ref: (ref) => this.listRef = ref,
			});
		}

		async componentDidMount()
		{
			BX.addCustomEvent('onAppActive', () => this.onAppActive());
			BX.addCustomEvent('onAppPaused', () => this.onAppPaused());

			BX.addCustomEvent('onTabsSelected', (tabId) => this.onTabsSelected(tabId));
			BX.addCustomEvent('onTabsReSelected', (tabId)=> this.onTabsReSelected(tabId));
		}

		onAppActive()
		{
			this.askToReload();
		}

		onAppPaused()
		{
			this.inactiveTime ??= Date.now();
		}

		onTabsSelected(tabId)
		{
			this.isActive = (tabId === this.TAB_ID);

			if (this.isActive)
			{
				this.askToReload();
			}
			else
			{
				this.inactiveTime ??= Date.now();
			}
		}

		onTabsReSelected(tabId)
		{
			if (this.isActive)
			{
				this.reload();
			}
		}

		askToReload()
		{
			if (this.isActive && this.inactiveTime)
			{
				const minutesPassed = Math.round((Date.now() - this.inactiveTime) / 60000);
				if (minutesPassed >= 30)
				{
					this.reload();
				}
			}

			if (this.isActive)
			{
				this.inactiveTime = null;
			}
		}

		reload()
		{
			if (this.listRef)
			{
				this.listRef.reload();
			}
		}
	}

	layout.showComponent(new TabComponent());
})();
