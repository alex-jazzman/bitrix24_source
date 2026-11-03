(() => {
	const require = (ext) => jn.require(ext);

	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { DashboardList } = require('biconnector/dashboard-list');

	/**
	 * @class BIConnectorDashboardListComponent
	 */
	class BIConnectorDashboardListComponent extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.layout = props.layout;
			this.groupId = props.groupId || null;
			this.scopeCode = props.scopeCode || null;
		}

		render()
		{
			return View(
				{
					resizableByKeyboard: true,
					style: {
						flex: 1,
					},
				},
				new DashboardList({ layout: this.layout, groupId: this.groupId, scopeCode: this.scopeCode }),
			);
		}
	}

	BX.onViewLoaded(() => {
		const groupId = BX.componentParameters.get('GROUP_ID', null);
		const groupTitle = BX.componentParameters.get('GROUP_TITLE', '');
		const scopeCode = BX.componentParameters.get('SCOPE_CODE', null);

		layout.setTitle({
			text: groupTitle || Loc.getMessage('M_BIC_DASHBOARD_LIST_TITLE'),
			useLargeTitleMode: true,
		});
		layout.showComponent(new BIConnectorDashboardListComponent({ layout, groupId, scopeCode }));
	});
})();
