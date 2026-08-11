// @vue/component
export const WorkStatusHeader = {
	name: 'WorkStatusHeader',
	mounted(): void
	{
		this.isUnmounted = false;

		// Dynamic load avoids circular dep — work-status-control-panel already
		// depends on work-time-report at config.php level.
		window.BX?.Runtime?.loadExtension('timeman.work-status-control-panel')
			.then(({ WorkStatusControlPanel }) => {
				const host = this.$refs.host;
				if (!WorkStatusControlPanel || !host || this.isUnmounted || !host.isConnected)
				{
					return;
				}

				try
				{
					const node = (new WorkStatusControlPanel()).renderWorkStatusControlPanel({
						hideOpenPanelButton: true,
						hideOpener: true,
					});
					if (node && !this.isUnmounted && host.isConnected)
					{
						host.appendChild(node);
					}
				}
				catch (error)
				{
					console.error('WorkStatusHeader: failed to render WorkStatusControlPanel', error);
				}
			})
			.catch((error) => {
				console.error('WorkStatusHeader: failed to load extension', error);
			});
	},
	beforeUnmount(): void
	{
		this.isUnmounted = true;
	},
	template: `<div ref="host" class="tm-work-time-report-header"></div>`,
};
