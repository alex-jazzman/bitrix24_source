import { Runtime, Loc, Type } from 'main.core';
import { PopupManager, PopupWindowButton } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import 'crm_activity_planner';
import SimpleAction from './simpleaction';
import DeleteAction from './deleteaction';

/**
 * Multiple actions for CRM Kanban.
 */
export const Actions = {
	/**
	 * Start calling list.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param {Boolean} createActivity
	 * @returns {void}
	 */
	startCallList(grid, createActivity)
	{
		Runtime.loadExtension('crm.entity-list.panel')
			.then(({ createCallList }) => {
				if (Type.isUndefined(createActivity))
				{
					createActivity = true;
				}

				const gridData = grid.getData();

				/** @see BX.Crm.EntityList.Panel.createCallList */
				return createCallList(gridData.entityTypeInt, grid.getCheckedId(), createActivity);
			}).then(({ errorMessages }) => {
				if (Type.isArrayFilled(errorMessages))
				{
					const error = errorMessages.join('. \n');
					BX.Kanban.Utils.showErrorDialog(error);
				}
			})
		;
	},

	/**
	 * Some simple action.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param {Object} params
	 * @param {boolean} disableNotify
	 * @returns {Promise}
	 */
	simpleAction(grid, params, disableNotify)
	{
		return (new SimpleAction(grid, params))
			.showNotify(!disableNotify)
			.applyFilterAfterAction(!disableNotify)
			.execute()
		;
	},

	setAssigned(grid, assigned)
	{
		const params = {
			action: 'setAssigned',
			ids: grid.getCheckedId(),
			assignedId: assigned.entityId,
			assignedName: assigned.name,
		};

		void this.simpleAction(grid, params, false);
	},

	/**
	 * Merge selected items.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @returns {void}
	 */
	merge(grid)
	{
		var selectedIds = grid.getCheckedId();
		var mergeManager = BX.Crm.BatchMergeManager.getItem(grid.getData().gridId);
		if(mergeManager && !mergeManager.isRunning() && selectedIds.length > 1)
		{
			mergeManager.setEntityIds(selectedIds);
			mergeManager.execute();
		}
	},

	/**
	 * Change category id for deals.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param category
	 * @package {int} category
	 * @returns {void}
	 */
	changeCategory(grid, category)
	{
		var categoryLink = "";

		if (category.url)
		{
			categoryLink = category.url;
		}

		this.simpleAction(grid, {
			action: "changeCategory",
			id: grid.getCheckedId(),
			category: category.ID,
			categoryName: BX.util.htmlspecialchars(category.NAME),
			categoryLink: categoryLink
		}, false);
	},

	/**
	 * Change column.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @package {Object} column
	 * @returns {void}
	 */
	changeColumn(grid, column)
	{
		var gridData = grid.getData();
		grid.firstRenderComplete = false;

		this.simpleAction(grid, {
			action: "status",
			entity_id: grid.getCheckedId(),
			status: column.id,
			statusName: BX.util.htmlspecialchars(column.name),
			entity_type: gridData.entityType
		}, false);
	},

	/**
	 * @deprecated since crm 24.0.0. Use DeleteAction
	 *
	 * Delete one item.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param {Number[] | Number | null} ids
	 * @param {BX.Crm.Kanban.DropZone} drop
	 */
	delete(grid, ids, drop)
	{
		// eslint-disable-next-line no-param-reassign
		ids = ids ?? grid.getCheckedId();

		const params = {
			ids,
			showNotify: false,
		};

		(new DeleteAction(grid, params))
			.setDropZone(drop)
			.execute()
		;
	},

	/**
	 * Delete.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @returns {void}
	 */
	deleteAll(grid)
	{
		this.confirm(
			Loc.getMessage('CRM_KANBAN_PANEL_ACTION_CONFIRM'),
			() => {

				const params = {
					ids: grid.getCheckedId(),
					applyFilterAfterAction: true,
					showNotify: false,
				};

				(new DeleteAction(grid, params)).execute();
			},
			{
				grid,
			},
		);
	},

	/**
	 * Open / close.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param {Boolean} open Open or close.
	 * @returns {void}
	 */
	open(grid, open)
	{
		if (typeof open === "undefined")
		{
			open = false;
		}
		this.simpleAction(grid, {
			action: "open",
			id: grid.getCheckedId(),
			flag: open ? "Y" : "N"
		}, false);
	},

	/**
	 * Ignore.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @param {Boolean} open Open or close.
	 * @returns {void}
	 */
	ignore(grid, open)
	{
		this.confirm(
			Loc.getMessage("CRM_KANBAN_PANEL_ACTION_CONFIRM"),
			() => {
				grid.fadeOut();
				BX.ajax.runComponentAction('bitrix:crm.kanban', 'excludeEntity', {
					mode: 'ajax',
					data: {
						entityType: grid.getData().entityType,
						ids: grid.getCheckedId(),
					}
				}).then((response) => {
					this.simpleAction(grid, {
						action: "delete",
						ignore: "Y",
						id: grid.getCheckedId()
					}, false);
				}, (response) => {
					grid.stopActionPanel();
					grid.onApplyFilter();
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				});
			},
			{ grid }
		);
	},

	/**
	 * Refresh deals accounts.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @returns {void}
	 */
	refreshaccount(grid)
	{
		this.simpleAction(grid, {
			action: "refreshAccount",
			id: grid.getCheckedId()
		}, false);
	},

	/**
	 * Send email.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @returns {void}
	 */
	email(grid)
	{
		if (
			BX.CrmActivityEditor &&
			BX.CrmActivityProvider &&
			BX.CrmActivityEditor.items["kanban_activity_editor"]
		)
		{
			var gridData = grid.getData();
			var communications = [];
			var ids = grid.getCheckedId();

			for (var i = 0, c = ids.length; i < c; i++)
			{
				communications.push({
					type: "EMAIL",
					entityId: ids[i],
					entityType: gridData.entityType
				});
			}

			BX.CrmActivityEditor.items["kanban_activity_editor"].addEmail({
				communications: communications,
				communicationsLoaded: true
			});
		}
	},

	/**
	 * Add task.
	 * @param {BX.CRM.Kanban.Grid} grid
	 * @returns {void}
	 */
	task(grid)
	{
		const gridData = grid.getData();
		let communications = '';
		const ids = grid.getCheckedId();
		const entityType = gridData.entityType;

		for (let i = 0, c = ids.length; i < c; i++)
		{
			communications +=
				BX.CrmOwnerTypeAbbr.resolve(entityType) +
				"_" +
				ids[i] + ";";
		}
		const taskData = {
			UF_CRM_TASK: communications,
			TITLE: "CRM: ",
			TAGS: "crm",
			ta_sec: 'crm',
			ta_sub: entityType.toLowerCase(),
			ta_el: 'context_menu',
		};

		let taskCreatePath = Loc.getMessage("CRM_TASK_CREATION_PATH");
		taskCreatePath = taskCreatePath.replace("#user_id#", Loc.getMessage("USER_ID"));
		taskCreatePath = BX.util.add_url_param(
			taskCreatePath,
			taskData
		);

		if (SidePanel)
		{
			SidePanel.Instance.open(taskCreatePath);
		}
		else
		{
			window.top.location.href = taskCreatePath;
		}
	},

	/**
	 * Confirm for some actions.
	 * @param {String} message
	 * @param {Function} acceptFunc
	 * @param {Object} params
	 * @return {BX.PopupWindowManager}
	 */
	confirm(message, acceptFunc, params = {})
	{
		var dialog = PopupManager.create(
			"crm-kanban-confirm-dialog",
			null,
			{
				titleBar: Loc.getMessage("CRM_KANBAN_CONFIRM_TITLE"),
				content: "",
				width: 400,
				autoHide: false,
				overlay: true,
				closeByEsc : true,
				closeIcon : true,
				draggable : { restrict : true}
			}
		);

		dialog.setContent(message);

		dialog.setButtons([,
			new PopupWindowButton({
				text: Loc.getMessage("CRM_KANBAN_CONFIRM_Y"),
				className: "popup-window-button-accept",
				events: {
					click: function()
					{
						acceptFunc();
						this.popupWindow.close();
					}
				}
			}),
			new PopupWindowButton({
				text: Loc.getMessage("CRM_KANBAN_CONFIRM_N"),
				className: "popup-window-button-cancel",
				events: {
					click: function()
					{
						if (params.grid instanceof BX.CRM.Kanban.Grid)
						{
							params.grid.resetMultiSelectMode();
						}
						this.popupWindow.close();
					}
				}
			})
		]);

		dialog.show();

		return dialog;
	},
};
