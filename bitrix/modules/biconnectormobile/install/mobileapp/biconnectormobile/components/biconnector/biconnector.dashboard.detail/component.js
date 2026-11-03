(() => {
	const require = (ext) => jn.require(ext);

	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { DashboardDetail } = require('biconnector/dashboard-detail');

	/**
	 * @class BIConnectorDashboardDetailComponent
	 */
	class BIConnectorDashboardDetailComponent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.dashboardId = props.dashboardId;
			this.isPinned = props.isPinned === true;
			this.layout = props.layout;
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				new DashboardDetail({ dashboardId: this.dashboardId, isPinned: this.isPinned, layout: this.layout }),
			);
		}
	}

	BX.onViewLoaded(() => {
		const dashboardId = BX.componentParameters.get('DASHBOARD_ID', null);
		const title = BX.componentParameters.get('DASHBOARD_TITLE', '');
		const isPinned = BX.componentParameters.get('DASHBOARD_IS_PINNED', false);

		layout.setTitle({
			text: title || Loc.getMessage('M_BIC_DASHBOARD_DETAIL_TITLE'),
		});
		layout.showComponent(new BIConnectorDashboardDetailComponent({ dashboardId, isPinned, layout }));
	});
})();
