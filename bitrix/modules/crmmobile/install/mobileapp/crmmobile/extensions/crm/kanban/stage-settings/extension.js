/**
 * @module crm/kanban/stage-settings
 */
jn.define('crm/kanban/stage-settings', (require, exports, module) => {
	const { NotifyManager } = require('notify-manager');
	const { KanbanStageSettings } = require('layout/ui/kanban/stage-settings');
	const { TunnelList } = require('crm/tunnel-list');
	const { getStageCardPermissions } = require('crm/kanban/stage-settings/permissions');
	const { connect } = require('statemanager/redux/connect');
	const {
		selectById,
		updateCrmStage,
		deleteCrmStage,
	} = require('crm/statemanager/redux/slices/stage-settings');

	/**
	 * @class CrmKanbanStageSettings
	 */
	class CrmKanbanStageSettings extends KanbanStageSettings
	{
		static open(params, parentWidget = PageManager)
		{
			return new Promise((resolve, reject) => {
				parentWidget
					.openWidget('layout', this.getWidgetParams())
					.then((layout) => {
						layout.enableNavigationBarBorder(false);

						layout.showComponent(connect(mapStateToProps, mapDispatchToProps)(this)({ layout, ...params }));
						resolve(layout);
					})
					.catch(reject);
			});
		}

		constructor(props)
		{
			super(props);
			this.onChangeTunnelsHandler = this.onChangeTunnels.bind(this);
		}

		get isTunnelsEnabled()
		{
			return BX.prop.getBoolean(this.props, 'tunnelsEnabled', false);
		}

		get entityTypeId()
		{
			return BX.prop.getInteger(this.props, 'entityTypeId', null);
		}

		get documentFields()
		{
			return BX.prop.getObject(this.props, 'documentFields', {});
		}

		get kanbanSettingsId()
		{
			return BX.prop.getString(this.props, 'kanbanSettingsId', null);
		}

		get categoryId()
		{
			return BX.prop.getNumber(this.props, 'categoryId', null);
		}

		get configurationPermissions()
		{
			return getStageCardPermissions(this.stage);
		}

		componentWillReceiveProps(props)
		{
			super.componentWillReceiveProps(props);
		}

		initNavigation()
		{
			super.initNavigation();

			// the base class hands the removal of the stage to every card but the successful one,
			// and only managing the stages grants it
			if (this.layout && !this.configurationPermissions.canManageStage)
			{
				this.layout.setRightButtons([]);
			}
		}

		renderContent()
		{
			return View(
				{
					style: {
						flexDirection: 'column',
					},
					onClick: () => Keyboard.dismiss(),
					onPan: () => Keyboard.dismiss(),
				},
				this.renderStageName(),
				this.renderTunnelList(),
				this.renderColorPicker(),
			);
		}

		// the name and the color are hidden rather than shown unwritable: the base class of `mobile`
		// hardcodes `readOnly: false` on the input, and an unwritable view would mean moving its whole
		// layout here. The stage keeps its name in the navigation title either way.
		renderStageName()
		{
			if (!this.configurationPermissions.canManageStage)
			{
				return null;
			}

			return super.renderStageName();
		}

		renderColorPicker()
		{
			if (!this.configurationPermissions.canManageStage)
			{
				return null;
			}

			return super.renderColorPicker();
		}

		// hidden rather than shown unwritable, as the name and the color above: an editable list
		// would offer a change the server refuses, and refusing one part turns down the whole
		// request - the rename the same user is allowed to make included
		renderTunnelList()
		{
			if (!this.isTunnelsEnabled || !this.configurationPermissions.canManageTunnels)
			{
				return null;
			}

			return View(
				{},
				TunnelList({
					tunnelIds: this.changedFields.tunnels || this.stage.tunnels,
					kanbanSettingsId: this.kanbanSettingsId,
					documentFields: this.documentFields,
					entityTypeId: this.entityTypeId,
					stageId: this.stage.id,
					stageStatusId: this.stage.statusId,
					stageColor: this.changedFields.color || this.stage.color,
					layout: this.layout,
					onChangeTunnels: this.onChangeTunnelsHandler,
					categoryId: this.categoryId,
				}),
			);
		}

		onChangeTunnels(tunnels)
		{
			this.isChanged = true;
			this.changedFields.tunnels = tunnels;
		}

		updateStage()
		{
			return new Promise((resolve, reject) => {
				NotifyManager.showLoadingIndicator();
				const {
					statusId: stageStatusId,
					id,
				} = this.stage;

				this.props.updateCrmStage(
					{
						entityTypeId: this.entityTypeId,
						categoryId: this.categoryId,
						kanbanSettingsId: this.kanbanSettingsId,
						fields: {
							id,
							statusId: stageStatusId,
							...this.changedFields,
						},
						permissions: this.configurationPermissions,
					},
				)
					.unwrap()
					.then(() => {
						NotifyManager.hideLoadingIndicatorWithoutFallback();
						resolve();
					})
					.catch((error) => {
						NotifyManager.hideLoadingIndicatorWithoutFallback();
						NotifyManager.showDefaultError();
						reject(error);
					});
			});
		}

		deleteStage()
		{
			const { id, statusId, semantics } = this.stage;

			return new Promise((resolve, reject) => {
				NotifyManager.showLoadingIndicator();

				this.props.deleteCrmStage({
					id,
					entityTypeId: this.entityTypeId,
					categoryId: this.categoryId,
					kanbanSettingsId: this.kanbanSettingsId,
					statusId,
					semantics,
				})
					.unwrap()
					.then(() => {
						NotifyManager.hideLoadingIndicatorWithoutFallback();
						resolve();
					})
					.catch((rejectedValueOrSerializedError) => {
						NotifyManager.hideLoadingIndicatorWithoutFallback();
						NotifyManager.showErrors(rejectedValueOrSerializedError.errors);
						reject();
					});
			});
		}
	}

	const mapStateToProps = (state, ownProps) => ({
		stage: selectById(state, ownProps.stageId),
	});

	const mapDispatchToProps = ({
		updateCrmStage,
		deleteCrmStage,
	});

	module.exports = {
		CrmKanbanStageSettings,
	};
});
