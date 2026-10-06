import { Restriction } from 'crm.kanban.restriction';
import { ToolbarComponent } from 'crm.toolbar-component';
import { ajax, Dom, Event, Loc, Runtime, Text, Type } from 'main.core';

import 'main.kanban';
import { Menu, MenuManager, Popup, PopupManager, PopupWindowButton } from 'main.popup';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'ls';
import { Dialog as EntitySelectorDialog } from 'ui.entity-selector';
import { Guide } from 'ui.tour';

import DeleteAction from './actions/deleteaction';
import RestartAutomationAction from './actions/restartautomationaction';
import StageLabels from './analytics/stagelabels';
import { ViewMode } from './viewmode';

/**
 * @param options
 * @extends {BX.Kanban.Grid}
 */
export class Grid extends BX.Kanban.Grid
{
	static Instance = null;

	static getInstance()
	{
		return Grid.Instance;
	}

	accessNotifyDialog = null;
	loadNewInterval = 25;
	ajaxParams = {};
	customFieldsPopup = null;
	customFieldsContainer = null;
	actionPanel = null;
	customActionPanel = null;
	currentNode = null;
	itemMoving = null;
	actionItems = [];
	checkedItems = [];
	progressBarEditor = null;
	ccItem = null;
	restItem = null;
	popupCancel = null;
	handleScrollWithOpenPopupInKanbanColumn = null;
	dropZonesShow = false;
	fieldsSelectors = {};
	animationDuration = 800;
	hintForNotVisibleItems = null;
	handleHideHintForNotVisibleItems = null;
	canUpdateItemAtItsPosition = false;
	stageAnalyticsLabels = null;

	constructor(options)
	{
		BX.Event.EventEmitter.setMaxListeners('Kanban.Grid:onFirstRender', 50);

		super(options);

		this._analyticsDictionary = BX.Crm.Integration.Analytics.Dictionary;
		this._analyticsBuilder = BX.Crm.Integration.Analytics.Builder;

		BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemCaptured", this.onBeforeItemCaptured.bind(this));
		BX.addCustomEvent(this, "Kanban.DropZone:onBeforeItemRestored", this.onBeforeItemRestored.bind(this));
		BX.addCustomEvent(this, "Kanban.DropZone:onItemCaptured", this.onItemCaptured.bind(this));

		BX.addCustomEvent(this, "Kanban.Grid:onBeforeItemMoved", this.onBeforeItemMoved.bind(this));
		//BX.addCustomEvent(this, "Kanban.Grid:onItemMoved", this.onItemMoved.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onColumnAddedAsync", this.onColumnAddedAsync.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onColumnUpdated", this.onColumnUpdated.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onColumnMoved", this.onColumnMoved.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onColumnRemovedAsync", this.onColumnRemovedAsync.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onColumnLoadAsync", this.onColumnLoadAsync.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", this.onItemDragStartHandler.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onItemDragStart", this.setKanbanDragMode.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onItemDragStop", this.unSetKanbanDragMode.bind(this));

		BX.addCustomEvent("BX.Main.Filter:apply", this.onApplyFilter.bind(this));
		BX.addCustomEvent("Crm.PartialEditorDialog.Close", this.onPartialEditorClose.bind(this));
		BX.addCustomEvent("onPullEvent-crm", this.onPullEventHandlerCrm.bind(this));
		BX.addCustomEvent("onPullEvent-im", this.onPullEventHandlerCrm.bind(this));
		BX.addCustomEvent("onCrmActivityTodoChecked", this.onCrmActivityTodoChecked.bind(this));
		BX.addCustomEvent("SidePanel.Slider:onClose", this.onSliderClose.bind(this));
		BX.addCustomEvent("BX.CRM.Kanban.Item.select", this.startActionPanel.bind(this));
		BX.addCustomEvent("BX.CRM.Kanban.Item.unSelect", this.onItemUnselect.bind(this));
		BX.addCustomEvent("BX.UI.ActionPanel:clickResetAllBlock", this.resetMultiSelectMode.bind(this));
		BX.addCustomEvent('BX.UI.ActionPanel:hidePanel', this.showUiToolbarContainer.bind(this));
		BX.addCustomEvent('BX.UI.ActionPanel:showPanel', this.hideUiToolbarContainer.bind(this));
		BX.addCustomEvent("BX.Crm.EntityEditorSection:onOpenChildMenu", this.onOpenEditorMenu.bind(this));
		BX.addCustomEvent("BX.Crm.EntityEditor:onConfigScopeChange", this.onConfigEditorScopeChange.bind(this));
		BX.addCustomEvent("BX.Crm.EntityEditor:onConfigReset", this.onConfigEditorReset.bind(this));
		BX.addCustomEvent("BX.Crm.EntityEditor:onForceCommonConfigScopeForAll", this.onForceCommonEditorConfigScopeForAll.bind(this));
		// BX.addCustomEvent("BX.CRM.Kanban.Item.select", this.onMultiSelectMode.bind(this));
		BX.addCustomEvent("onPopupShow", this.onPopupShow.bind(this));
		BX.addCustomEvent("onPopupClose", this.onPopupClose.bind(this));
		BX.addCustomEvent("CrmDragItemDragRelease", this.onEditorDragItemRelease.bind(this));
		BX.addCustomEvent(window, "onCrmEntityCreate", this.onCrmEntityCreateDeadlinesView.bind(this));
		BX.addCustomEvent(this, "Kanban.Grid:onRender", Runtime.debounce(this.handleHintForNotVisibleColumns, 400, this));

		//setInterval(this.loadNew.bind(this), this.loadNewInterval * 1000);

		this.stageAnalyticsLabels = new StageLabels(options.stageAnalyticsLabels);

		Grid.Instance = this;
	}

	/**
	 * @returns {Array}
	 */
	getChecked()
	{
		return this.checkedItems;
	}

	/**
	 * @returns {number[]}
	 */
	getCheckedId()
	{
		return this.getChecked().map((item) => item.id);
	}

	checkItem(item)
	{
		const itemToArray = this.getItem(item);

		if (!BX.util.in_array(itemToArray, this.checkedItems))
		{
			itemToArray.checked = true;

			if (!this.isCheckedItem(itemToArray))
			{
				this.checkedItems.push(itemToArray);
			}

			Dom.addClass(itemToArray.checkedButton, 'crm-kanban-item-checkbox-checked');
			Dom.addClass(itemToArray.container, 'crm-kanban-item-selected');

			BX.onCustomEvent('BX.CRM.Kanban.Item.select', [itemToArray]);
		}
	}

	isCheckedItem(item)
	{
		const checkedItems = this.checkedItems;
		for (let i = 0, c = checkedItems.length; i < c; i++)
		{
			if (checkedItems[i]['id'] === item['id'])
			{
				return true;
			}
		}

		return false;
	}

	onCrmEntityCreateDeadlinesView(entityData)
	{
		const context = entityData.sender.getContext();
		if (context['VIEW_MODE'] === ViewMode.MODE_DEADLINES)
		{
			void this.loadNew(entityData.entityId, true);
		}
	}

	onEditorDragItemRelease()
	{
		this.getColumns().forEach((column) => {
			if (!column.isEditorOpen())
			{
				column.cleanEditorNode();
				column.editor = null;
			}
		});
	}

	unCheckItem(item)
	{
		const itemInArray = this.getItem(item);
		if (BX.util.in_array(itemInArray, this.checkedItems))
		{
			this.checkedItems.splice(this.checkedItems.indexOf(itemInArray), 1);

			itemInArray.checked = false;

			Dom.removeClass(itemInArray.checkedButton, 'crm-kanban-item-checkbox-checked');
			Dom.removeClass(itemInArray.container, 'crm-kanban-item-selected');

			BX.onCustomEvent('BX.CRM.Kanban.Item.unSelect', [itemInArray]);
		}
	}

	getPopupCancel(content)
	{
		if (!this.popupCancel)
		{
			this.popupCancel = new Popup(
				'crm-kanban-popup-cancel',
				window,
				{
					className: 'crm-kanban-popup-cancel',
					autoHide: false,
					overlay: true,
					maxWidth: 350,
					buttons: [
						new PopupWindowButton({
							text: 'OK',
							className: 'ui-btn ui-btn-primary',
							events: {
								click: () => {
									this.popupCancel.close();
								},
							},
						}),
					],
					closeByEsc: true,
					closeIcon: true,
				}
			);
		}

		this.popupCancel.setContent(content);

		return this.popupCancel;
	}

	getItemsForAction(removeItem)
	{
		const items = this.getChecked();

		if (removeItem)
		{
			items.splice(this.actionItems.indexOf(removeItem), 1);
		}

		this.actionItems = [];

		items.forEach((item) => {
			this.actionItems.push(parseInt(item.id, 10));
		});

		return this.actionItems;
	}

	bindEvents()
	{
		if (this.isBindEvents)
		{
			return;
		}

		Event.bind(window, 'click', (el) => {
			if(this.dropZonesShow)
			{
				return;
			}

			this.isItKanban(el.target) ? this.currentNode = el.target : this.currentNode = null;

			const availableParentTags = [
				'main-kanban-item',
				'ui-action-panel',
				'ui-action-panel-item-popup-menu',
				'bx-finder-popup',
				'responsible-user-selector-dialog',
			];

			const hasAvailableParent = availableParentTags
				.find((className) => BX.findParent(el.target, { className }))
			;

			if (
				!hasAvailableParent
				&& ((top.BX.SidePanel?.Instance?.getTopSlider()?.url ?? '').indexOf('/company/personal/user/') !== 0)
			)
			{
				const popup = PopupManager.getCurrentPopup();

				if (!popup?.isShown())
				{
					this.unSetKanbanDragMode();
					this.resetMultiSelectMode();
				}
			}
		});

		Event.bind(window, 'keydown', (el) => {
			if (this.dropZonesShow)
			{
				return;
			}

			if (el.code === "Escape")
			{
				this.resetMultiSelectMode();
				this.unSetKanbanDragMode();
			}
		});

		BX.addCustomEvent(
			window,
			'Crm.PartialEditorDialog.Close',
			(editor, params) => {
				if (params.isCancelled && this.itemMoving.item)
				{
					this.moveItem(
						this.itemMoving.item,
						this.itemMoving.oldColumn,
						this.itemMoving.oldNextSiblingId
					);
				}
			}
		);

		BX.Event.EventEmitter.subscribe(
			'Crm.Kanban.Column:onItemAdded',
			(event) =>{
				if (
					this.itemMoving?.item.id === event.data.item.id
					&& this.items[this.itemMoving.item.id] !== undefined
					&& this.itemMoving.item.columnId === this.items[this.itemMoving.item.id].columnId
				)
				{
					const column = this.getColumn(event.data.item.columnId);
					const { data } = event;

					if (
						data.item.columnId === data.oldColumn.id
						&& column.data.type === 'PROGRESS'
					)
					{
						return;
					}

					// @todo check this for ticket 0143009
					//this.itemMoving.oldColumn = event.data.oldColumn;
					this.onItemMoved(data.item, data.targetColumn, data.beforeItem);
				}
			}
		);

		BX.Event.EventEmitter.subscribe('crm-kanban-settings-fields-view', () => {
			this.showFieldsSelectPopup('view');
		});

		BX.Event.EventEmitter.subscribe('crm-kanban-settings-fields-edit', () => {
			this.loadHiddenQuickEditorForFirstColumn();
			this.showFieldsSelectPopup('edit');
		});

		BX.Event.EventEmitter.subscribe('BX.Crm.Kanban:toggleTooltipsVisibility', () => {
			this.onToggleTooltipsVisibility();
		});

		const toolbarComponent = ToolbarComponent.Instance ?? null;

		if (this.getData().isDynamicEntity && toolbarComponent)
		{
			toolbarComponent.subscribeTypeUpdatedEvent(() => {
				if (BX.Reflection.getClass('BX.Crm.Router.Instance.getKanbanUrl'))
				{
					const entityTypeId = (
						this.getData().hasOwnProperty('entityTypeInt')
							? Text.toInteger(this.getData().entityTypeInt)
							: 0
					);

					const categoryId = (
						this.getData().params.hasOwnProperty('CATEGORY_ID')
							? Text.toInteger(this.getData().params.CATEGORY_ID)
							: 0
					);

					const newUrl = BX.Crm.Router.Instance.getKanbanUrl(entityTypeId, categoryId);
					if (newUrl)
					{
						window.location.href = newUrl;

						return;
					}
				}

				window.location.reload();
			});

			toolbarComponent.subscribeCategoriesUpdatedEvent(() => {
				this.reload();
			});
		}

		this.isBindEvents = true;
	}

	isItKanban(target)
	{
		return Boolean(BX.findParent(target, {className: 'main-kanban'}));
	}

	setKanbanDragMode()
	{
		Dom.addClass(document.body, 'crm-kanban-drag-mode');
	}

	unSetKanbanDragMode()
	{
		this.stopActionPanel(true);
		Dom.removeClass(document.body, 'crm-kanban-drag-mode');
	}

	/**
	 * Render Kanban (override for add multiple actions).
	 * @returns {void}
	 */
	renderLayout()
	{
		const gridData = this.getData();

		super.renderLayout(...arguments);
		this.setDropAreaFirstItemWidth();

		if (this.ccItem && !gridData.contactCenterShow)
		{
			this.hideItem(this.ccItem);
		}

		if (this.restItem && !gridData.restDemoBlockShow)
		{
			this.hideItem(this.restItem);
		}
	}

	/**
	 * Set width for first item.
	 */
	setDropAreaFirstItemWidth()
	{
		if (this.layout.gridContainer.firstChild === null)
		{
			return;
		}

		const styleNode = BX.create('style', {
			attrs: {
				type: 'text/css',
			},
		});

		const classNames = '.main-kanban-dropzone:first-child, main-kanban-dropzone:last-child';
		const width = this.layout.gridContainer.firstChild.offsetWidth + 3;
		const text = `${classNames}(max-width: ${width}px, min-width: ${width}px)`;
		const styles = document.createTextNode(text);

		styleNode.appendChild(styles);
		document.head.appendChild(styleNode);
	}

	/**
	 * @returns {string}
	 */
	getAjaxHandlerPath()
	{
		const data = this.getData();

		return (
			Type.isStringFilled(data.ajaxHandlerPath)
				? data.ajaxHandlerPath
				: '/bitrix/components/bitrix/crm.kanban/ajax.old.php'
		);
	}

	/**
	 * @param {Object} data
	 * @returns {void}
	 */
	setAjaxParams(data)
	{
		this.ajaxParams = data;
	}

	/**
	 * Perform ajax query.
	 * @param {Object} data
	 * @param {Function} onsuccess
	 * @param {Function} onfailure
	 * @param {String} dataType html/json/script
	 * @returns {void}
	 */
	ajax(data, onsuccess, onfailure, dataType)
	{
		const gridData = this.getData();

		if (Type.isUndefined(dataType))
		{
			dataType = 'json';
		}

		data.sessid = BX.bitrix_sessid();
		data.extra = gridData.params;
		data.entity_type = gridData.entityType;
		data.viewMode = gridData.viewMode;
		data.version = 2;
		data.ajaxParams = this.ajaxParams;
		data.entityPath = gridData.entityPath;

		this.setAjaxParams({});

		let url = this.getAjaxHandlerPath();

		if (!Type.isUndefined(data.action))
		{
			url += url.indexOf('?') === -1 ? '?' : '&';
			url += 'action=' + data.action;
		}

		if (this.isMultiSelectMode())
		{
			url += '&group=yes';
		}

		if (this.isCycleRequest(data))
		{
			this.reload();
		}
		else
		{
			BX.ajax({
				method: 'POST',
				dataType,
				url,
				data,
				onsuccess,
				onfailure,
			});
		}
	}

	/**
	 * This is a crutch that will serve as the final frontier against kanban loops
	 * until we find all the scenarios where customers have kanban loops.
	 * @param {Object} data
	 * @returns {boolean}
	 */
	isCycleRequest(data)
	{
		if (data.action !== 'page')
		{
			return false;
		}

		const cyclePeriod = 8 * 1000; // 8 seconds
		const maxRequestsInPeriod = 5;

		const setCycleRequestParams = (cycleRequestParams) => {
			BX.localStorage.set('crm-kanban-cycle-request-params', cycleRequestParams, cyclePeriod);
		}

		let params = BX.localStorage.get('crm-kanban-cycle-request-params');
		if (!params)
		{
			params = this.getEmptyCycleRequestParams();
			params.total += 1;
			setCycleRequestParams(params);

			return false;
		}

		const offset = Date.now() - params.startTime;
		if (offset < cyclePeriod && params.total >= maxRequestsInPeriod)
		{
			setCycleRequestParams(this.getEmptyCycleRequestParams());

			return true;
		}

		if (offset > cyclePeriod)
		{
			params = this.getEmptyCycleRequestParams();
		}

		params.total += 1;
		setCycleRequestParams(params);

		return false;
	}

	getEmptyCycleRequestParams()
	{
		return {
			total: 0,
			startTime: Date.now(),
		};
	}

	showLockedEntitySlider()
	{
		Runtime.loadExtension('ui.info-helper').then(({ FeaturePromotersRegistry }) => {
			FeaturePromotersRegistry
				.getPromoter({ code: this.getData().lockedEntitySliderCode })
				.show()
			;
		});
	}

	/**
	 * Show popup for request access.
	 * @returns {void}
	 */
	accessNotify()
	{
		if (
			typeof BX.Intranet !== "undefined" &&
			typeof BX.Intranet.NotifyDialog !== "undefined"
		)
		{
			if (this.accessNotifyDialog === null)
			{
				var gridData = this.getData();
				this.accessNotifyDialog = new BX.Intranet.NotifyDialog({
					listUserData: this.getData().admins,
					notificationHandlerUrl: this.getAjaxHandlerPath() +
											"?action=notifyAdmin&version=2&entity_type=" +
											gridData.entityType,
					popupTexts: {
						sendButton: Loc.getMessage("CRM_KANBAN_NOTIFY_BUTTON"),
						title: Loc.getMessage("CRM_KANBAN_NOTIFY_TITLE"),
						header: Loc.getMessage("CRM_KANBAN_NOTIFY_HEADER"),
						description: Loc.getMessage("CRM_KANBAN_NOTIFY_TEXT2")
					}
				});
			}
			this.accessNotifyDialog.show();
		}
	}

	/**
	 * Add new stage.
	 * @param {BX.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	addStage(column)
	{
		var promise = new BX.Promise();
		var targetColumn = this.getPreviousColumnSibling(column);
		var targetColumnId = targetColumn ? targetColumn.getId() : 0;

		this.ajax({
				action: "modifyStage",
				columnName: column.getName(),
				columnColor: column.getColor(),
				afterColumnId: targetColumnId
			},
			function(data)
			{
				if (data && !data.error)
				{
					this?.stageAnalyticsLabels.sendCreateSuccess();
					this.resetActionPanel();

					promise.fulfill(data);
				}
				else if (data)
				{
					this?.stageAnalyticsLabels.sendCreateFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);

					promise.reject(data.error);
				}
			}.bind(this),
			function(error)
			{
				this?.stageAnalyticsLabels.sendCreateFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);

				promise.reject("Error: " + error);
			}.bind(this)
		);

		return promise;
	}

	/**
	 * Remove one column (stage).
	 * @param {BX.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	removeStage(column)
	{
		var promise = new BX.Promise();

		this.ajax({
				action: "modifyStage",
				columnId: column.getId(),
				delete: 1
			},
			function(data)
			{
				if (data && !data.error)
				{
					this?.stageAnalyticsLabels.sendDeleteSuccess();
					this.resetActionPanel();

					promise.fulfill();
				}
				else if (data)
				{
					this?.stageAnalyticsLabels.sendDeleteFailure();

					promise.reject(data.error);
				}
			}.bind(this),
			function(error)
			{
				this?.stageAnalyticsLabels.sendDeleteFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);

				promise.reject("Error: " + error);
			}.bind(this)
		);

		return promise;
	}

	/**
	 * Get items from one column.
	 * @param {BX.CRM.Kanban.Column} column
	 * @returns {BX.Promise}
	 */
	getColumnItems(column)
	{
		const promise = new BX.Promise();

		const total = column.getTotal();
		this.data.params.total = total;

		const itemsCount = column.getItemsCount();
		this.data.params.itemsCount = itemsCount;

		const pagination = column.getPagination();

		/**
		 *  if there is a large number of changes in elements in real time, then the value of the total number
		 *  of elements in the column may become irrelevant and an erroneous request will be sent with a page number
		 *  that is outside the range of acceptable values, because of this, the request will return a selection
		 *  for the first page (see "$this->NavPageNomer = ..." in DBNavStart() function)
		 *  To eliminate this error, we check in advance if it is possible to get the items on the next page.
		 */
		const { skipColumnCountCheck } = this.getData();
		const { blockSize, canLoadMoreItems } = column;

		if (
			(!skipColumnCountCheck && total < pagination.getPage() * blockSize)
			|| (skipColumnCountCheck && !canLoadMoreItems)
		)
		{
			column.setTotal(itemsCount);
			promise.fulfill([]);

			return promise;
		}

		column.setLoadingInProgress();

		const page = pagination.getPage() + 1;
		this.ajax(
			{
				action: 'page',
				page,
				column: column.getId(),
				onlyItems: (page > 1 ? 'Y' : 'N'),
			},
			(data) => {
				this.updateConfig(data);

				if (
					data
					&& !data.error
					&& (Array.isArray(data) || Array.isArray(data.items))
				)
				{
					const items = (Array.isArray(data) ? data : data.items);
					if (items.length === 0)
					{
						column.setLoadingMoreItem(false);
						if (skipColumnCountCheck)
						{
							column.setTotal(itemsCount + items.length);
							column.showTotalCount();
						}
					}

					promise.fulfill(items);

					return;
				}

				if (data)
				{
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
					promise.reject(data.error);

					return;
				}

				if (this.ccItem)
				{
					const gridData = this.getData();
					if (!gridData.contactCenterShow)
					{
						this.hideItem(this.ccItem);
					}
				}
			},
			(error) => {
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
				promise.reject(`Error: ${error}`);
			},
		);

		return promise;
	}

	/**
	 * Add item to the column in top.
	 * @param {Object} data
	 * @param {bool} incColumnPrice
	 * @returns {void}
	 */
	addItemTop(data, incColumnPrice)
	{
		var column = this.getColumn(data.columnId);
		var columnItems = column ? column.getItems() : [];
		incColumnPrice = (typeof incColumnPrice !== 'undefined' ? incColumnPrice : true);

		// get first item in column
		if (columnItems.length > 0)
		{
			data.targetId = columnItems[0].getId();
		}

		// inc column price and add item
		(column && incColumnPrice) ? column.incPrice(data.data.price) : null;
		this.addItem(data);
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} item
	 */
	updateItemAtItsPosition(item)
	{
		this.canUpdateItemAtItsPosition = true;

		this
			.moveItem(item, item.getColumn(), item, true)
			.finally(() => {
				this.canUpdateItemAtItsPosition = true;
			});
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {BX.CRM.Kanban.Column} targetColumn
	 * @param {BX.CRM.Kanban.Item} beforeItem
	 * @param {bool} usePromise
	 * @returns {Promise<{status: boolean}>|boolean|Promise<void>|Promise<unknown>}
	 */
	moveItem(
		item,
		targetColumn,
		beforeItem,
		usePromise
	)
	{
		usePromise = (usePromise || false);
		return this.movePromisedItem(item, targetColumn, beforeItem, usePromise);
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {BX.CRM.Kanban.Column} targetColumn
	 * @param {BX.CRM.Kanban.Item} beforeItem
	 * @param {bool} usePromise
	 * @returns {Promise<unknown[]>|boolean|Promise<void>|Promise<{status: boolean}>}
	 */
	movePromisedItem(
		item,
		targetColumn,
		beforeItem,
		usePromise
	)
	{
		var notChangeTotal = (item.notChangeTotal || false);
		item = this.getItem(item);
		item.notChangeTotal = notChangeTotal;

		targetColumn = this.getColumn(targetColumn);

		if (
			!item
			|| !targetColumn
			|| (item === beforeItem && !this.canUpdateItemAtItsPosition)
		)
		{
			if (usePromise)
			{
				return Promise.resolve({
					status: false,
				});
			}
			return false;
		}

		beforeItem = (beforeItem ? this.getItem(beforeItem) : (targetColumn.items[0] || null));
		var currentColumn = item.getColumn();

		if (this.getChecked().length > 1)
		{
			return this.moveManyItems(item, targetColumn, beforeItem, usePromise);
		}

		item.beforeItem = beforeItem;
		currentColumn.removeItem(item).then(() => {
			targetColumn.addItem(item, item.beforeItem);
		});

		this.stopActionPanel();

		if (usePromise)
		{
			return Promise.resolve({
				status: true,
			});
		}

		return true;
	}

	moveManyItems(primaryItem, targetColumn, beforeItem, usePromise)
	{
		// check required fields
		let error = false;

		const targetColumnId = targetColumn.getId();
		const targetColumnData = targetColumn.getData();

		const items = this.getChecked();
		for (let i = 0, itemsCount = items.length; i < itemsCount; i++)
		{
			const itemData = items[i].getData();
			const currentColumnId = items[i].getColumn().getId();

			// some final columns
			if (
				this.getTypeInfoParam('hasRestictionToMoveToWinColumn')
				&& targetColumnData.type === 'WIN'
			)
			{
				error = true;
				if (itemsCount === i + 1)
				{
					this.resetMultiSelectMode()
				}
			}
			// first checking if targetColumn require some fields
			else if (
				Type.isArrayFilled(this.getRequiredFieldsForColumnId(targetColumnId, itemData))
				&& targetColumnId !== currentColumnId
			)
			{
				// check required fm fields
				if (itemData.required_fm)
				{
					const newRequired = [];
					const requiredFieldNames = this.getRequiredFieldsForColumnId(targetColumnId, itemData);

					for (let j = 0, cc = requiredFieldNames.length; j < cc; j++)
					{
						const requiredName = requiredFieldNames[j];
						if (items[i].isRequiredFmField(requiredName) || !items[i].isValidFmFieldName(requiredName))
						{
							newRequired.push(requiredName);
						}
					}

					itemData.required[targetColumnId] = newRequired;
				}

				if (Type.isArrayFilled(this.getRequiredFieldsForColumnId(targetColumnId, itemData)))
				{
					error = true;

					if (itemsCount === i + 1)
					{
						this.resetMultiSelectMode()
					}
				}
			}
			else if (itemData['updateRestrictionCallback'])
			{
				try
				{
					// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side
					eval(itemData['updateRestrictionCallback']);
				}
				catch (e)
				{
					console.log('update action restricted');
				}
				this.resetMultiSelectMode();

				if (usePromise)
				{
					return Promise.resolve();
				}

				return;
			}
		}

		if (error)
		{
			const gridData = this.getData();
			this.showNotCompletedPopup(gridData);
		}

		const removePromises = [];
		const currentColumns = new Map();

		for (let i = 0; i < items.length; i++)
		{
			const currentColumn = items[i].getColumn();
			if (items[i] !== primaryItem && currentColumn !== targetColumn)
			{
				currentColumn.layout.total.textContent = +currentColumn.layout.total.innerHTML - 1;
			}

			items[i].useAnimation = false;
			removePromises.push(currentColumn.removeItem(items[i]));
			currentColumns.set(items[i].getId(), currentColumn);
		}

		if (usePromise)
		{
			return Promise.all(removePromises).then(() => {
				items.forEach((item) => {
					item.useAnimation = false;
					item.layout.container.style.opacity = 1;
				});
				targetColumn.addItems(items, beforeItem);

				this.resetMultiSelectMode();
				this.stopActionPanel();
			});
		}

		targetColumn.addItems(items, beforeItem);

		this.resetMultiSelectMode();
		this.stopActionPanel();
	}

	/**
	 * Load new items by interval.
	 * @param {int|int[]} id Entity id or array of entity ids (optional).
	 * @param {boolean} force Force load without filter.
	 * @param {boolean} forceUpdate Force update entity.
	 * @param {boolean} onlyItems
	 * @param {boolean} useAnimation
	 * @returns {Promise}
	 */
	loadNew(id, force, forceUpdate, onlyItems, useAnimation)
	{
		var gridData = this.getData();
		var entityIds = (typeof id !== 'undefined' ? (Array.isArray(id) ? id : [id]) : 0);

		if (document.hidden)
		{
			return Promise.reject(new Error('Tab is not active'));
		}

		var loadItemsCount = 0;
		loadItemsCount = entityIds.reduce(function(count, current, index, arr){
			var item = this.getItem(current);
			if (item && item.getData().updateRestrictionCallback)
			{
				delete arr[index];
				return count;
			}
			return ++count;
		}.bind(this), 0);

		if (!loadItemsCount)
		{
			return Promise.resolve();
		}

		useAnimation = Type.isBoolean(useAnimation) ? useAnimation : false;

		return new Promise(function(resolve, reject){
			this.ajax(
				entityIds[0]
					? {
						action: "get",
						entity_id: entityIds,
						force: force === true ? "Y" : "N",
						onlyItems: (onlyItems === true ? 'Y' : 'N')
					}
					: {
						action: "get",
						min_entity_id: gridData.lastId,
						force: force === true ? "Y" : "N",
						onlyItems: (onlyItems === true ? 'Y' : 'N')
					},
				function (data)
				{
					if (!data)
					{
						resolve(data);
					}

					this.updateConfig(data);

					if (data.items)
					{
						var worked = false;
						if (data.items.length)
						{
							var titlesForRender = {};
							for (var i = data.items.length - 1; i >= 0; i--)
							{
								var item = data.items[i];
								item.useAnimation = useAnimation;
								var existItem = this.getItem(item.id);
								if (item.id <= 0)
								{
									continue;
								}
								worked = true;
								if (existItem)
								{
									var existData = existItem.getData();
									var existColumn = existItem.getColumn();
									var newColumn = this.getColumn(item.columnId);

									existColumn.decPrice(parseFloat(existData.price));

									titlesForRender[existColumn.getId()] = existColumn;

									if (newColumn)
									{
										newColumn.incPrice(parseFloat(item.data.price));
										existItem.data.price = item.data.price;

										const sorter = BX.CRM.Kanban.Sort.Sorter.createWithCurrentSortType(newColumn.getItems());
										const beforeItem = sorter.calcBeforeItemByParams(item.data.sort);

										if (newColumn !== existColumn || forceUpdate === true)
										{
											item.notChangeTotal = true;
											if (beforeItem)
											{
												item.targetId = beforeItem.getId();
											}
											this.updateItem(item.id, item);
											titlesForRender[newColumn.getId()] = newColumn;
										}
										else if (newColumn.getPreviousItemSibling(existItem) !== beforeItem)
										{
											this.moveItem(existItem, newColumn, beforeItem);
										}
									}
									else
									{
										this.removeItem(existItem);
									}
								}
								else if (item.id && this.getColumn(item.columnId) === null)
								{
									BX.onCustomEvent(this, "Kanban.Column:render");
								}
								else if (item.id)
								{
									this.addItemTop(item);
								}
								if (!entityIds[0])
								{
									gridData.lastId = item.id;
									this.setData(gridData);
								}
							}

							for (var key in titlesForRender)
							{
								titlesForRender[key].renderSubTitle();
							}
						}

						if (!worked && entityIds[0])
						{
							var item = this.getItem(entityIds[0]);
							if (item)
							{
								var itemData = item.getData();
								var column = item.getColumn();

								column.decPrice(itemData.price);
								this.removeItem(entityIds[0]);
							}
						}
					}

					resolve(data);
				}.bind(this),
				function (error)
				{
					reject();
				}.bind(this)
			);
		}.bind(this));
	}

	updateConfig(data)
	{
		if (!Type.isObject(data.config) || Object.keys(data.config).length === 0)
		{
			return;
		}

		const gridData = this.getData();
		if (Type.isArrayFilled(data.config.users))
		{
			data.config.users.forEach((item) => {
				const userExist = gridData.itemsConfig?.users.some((user) => {
					return Number(user.id) === Number(item.id);
				});

				if (!userExist)
				{
					gridData.itemsConfig.users.push(item);
				}
			});
		}

		if (Type.isArrayFilled(data.config.fields))
		{
			data.config.fields.forEach((item) => {
				const fieldConfigExist = gridData.itemsConfig?.fields.some((field) => {
					return field.code === item.code;
				});

				if (!fieldConfigExist)
				{
					gridData.itemsConfig?.fields.push(item);
				}
			});
		}
	}

	/**
	 *
	 * @param {Number} item
	 * @param {BX.CRM.Kanban.Item} options
	 * @returns {boolean}
	 */
	updateItem(item, options)
	{
		item = this.getItem(item);
		if (!item)
		{
			return false;
		}

		if (BX.Kanban.Utils.isValidId(options.columnId) && options.columnId !== item.getColumn().getId())
		{
			if (options.notChangeTotal)
			{
				item.notChangeTotal = options.notChangeTotal;
			}
			if (options.useAnimation)
			{
				item.useAnimation = options.useAnimation;
			}
			this.moveItem(item, this.getColumn(options.columnId), this.getItem(options.targetId));
		}

		var eventArgs = ['UPDATE', { task: item, options: options }];

		BX.onCustomEvent(window, 'tasksTaskEvent', eventArgs);

		item.setOptions(options);
		item.render();

		return true;
	}

	/**
	 * Hook on item drag start.
	 * @param {BX.CRM.Kanban.Item} item
	 * @returns {void}
	 */
	onItemDragStart(item)
	{
		this.setDragMode(BX.Kanban.DragMode.ITEM);

		if (parseInt(item.getId()) < 0)
		{
			return;
		}

		var items = this.getItems();
		var itemColumnId = item.getColumnId();

		// disable move for win lead
		if (item.isItemMoveDisabled())
		{
			for (var itemId in items)
			{
				var columnId = items[itemId].getColumnId();

				if (columnId === itemColumnId)
				{
					items[itemId].enableDropping();
				}
			}

			return;
		}

		super.onItemDragStart(...arguments);

		if (this.progressBarEditor)
		{
			this.progressBarEditor.close();
		}
	}

	/**
	 * @param {BX.CRM.Kanban.Item} item
	 */
	onItemDragStartHandler(item)
	{
		item.setLastPosition();
	}

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnLoadAsync(promises)
	{
		promises.push(this.getColumnItems.bind(this));
	}

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnRemovedAsync(promises)
	{
		promises.push(this.removeStage.bind(this));
	}

	/**
	 * Event Handler must add a promise to the 'promises' collection.
	 * @param {Array} promises
	 * @returns {void}
	 */
	onColumnAddedAsync(promises)
	{
		promises.push(this.addStage.bind(this));
	}

	/**
	 * Hook on item drop to junk's.
	 * @param {BX.CRM.Kanban.DropZoneEvent} dropEvent
	 * @returns {void}
	 */
	onBeforeItemCaptured(dropEvent)
	{
		BX.onCustomEvent("Crm.Kanban.Grid:onBeforeItemCapturedStart", [this, dropEvent]);
		// move item and decprice in column
		if (dropEvent.isActionAllowed())
		{
			var item = dropEvent.getItem();
			var column = item.getColumn();
			var drop = dropEvent.getDropZone();

			const groupIds = this.getItemsForAction();
			this.itemMoving = {
				item,
				price: parseFloat(item.getData().price),
				oldColumn: column,
				oldNextSiblingId: column.getNextItemSibling(item),
				newColumn: null,
				newNextSibling: null,
				dropEvent,
				groupIds,
			};

			dropEvent.groupIds = groupIds;

			this.onItemMoved(item, drop, null, true);
		}
	}

	onItemCaptured(item, dropZone, ids)
	{
		if (dropZone.getId() === 'DELETED')
		{
			if (Type.isArray(ids) && ids.length === 0)
			{
				ids = parseInt(item.getId(), 10);
			}

			ids = ids ?? this.getCheckedId();

			if (!Type.isArray(ids))
			{
				ids = [ids];
			}

			const params = {
				ids,
				showNotify: false,
			};

			(new DeleteAction(this, params))
				.setDropZone(dropZone)
				.execute()
			;
		}
	}

	/**
	 * Hook on item return from junk's.
	 * @param {BX.Kanban.DropZoneEvent} event
	 * @returns {void}
	 */
	onBeforeItemRestored(event)
	{
		const item = event.getItem();
		const column = item.getColumn();
		const price = parseFloat(item.getData().price);

		column.incPrice(price);

		const ids = this.itemMoving.groupIds ? this.itemMoving.groupIds.toString() : item.getId();

		const analyticsData = this.getDefaultAnalyticsCloseEvent(item, column.getData().type, ids);
		analyticsData.c_sub_section = this._analyticsDictionary.SUB_SECTION_KANBAN_DROPZONE;
		analyticsData.c_element = this._analyticsDictionary.ELEMENT_CANCEL_BUTTON;
		this.registerAnalyticsCloseEvent(analyticsData, this._analyticsDictionary.STATUS_CANCEL);

		this.onItemMoved(item, column);
	}

	/**
	 * Hook on item moved start.
	 * @param {BX.Kanban.DragEvent} event
	 * @returns {void}
	 */
	onBeforeItemMoved(event)
	{
		if (this.isBlockedIncomingMoving(event.targetColumn))
		{
			BX.UI.Notification.Center.notify(
				{
					content: Loc.getMessage('CRM_KANBAN_MOVE_ITEM_TO_COLUMN_BLOCKED_2'),
					autoHideDelay: 5000,
				}
			);

			event.denyAction();
			return;
		}

		var item = event.getItem();
		var column = item.getColumn();

		this.itemMoving = {
			item: item,
			price: parseFloat(item.getData().price),
			oldColumn: column,
			oldNextSiblingId: column.getNextItemSibling(item),
			newColumn: null,
			newNextSibling: null
		};
	}

	/**
	 * Hook on item moved.
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {BX.Kanban.Column|BX.Kanban.DropZone} targetColumn
	 * @param {BX.CRM.Kanban.Item} [beforeItem]
	 * @param {Boolean} [skipHandler]
	 * @returns {void}
	 */
	onItemMoved(item, targetColumn, beforeItem, skipHandler)
	{
		const itemData = item.getData();
		var columnId = targetColumn.getId();
		var gridData = this.getData();
		var isDropZone = targetColumn instanceof BX.Kanban.DropZone;

		if (
			targetColumn.getId() !== "DELETED"
			&& itemData['updateRestrictionCallback']
			&& Type.isString(itemData['updateRestrictionCallback'])
			&& columnId !== this.itemMoving.oldColumn.getId()
		)
		{
			try
			{
				// eslint-disable-next-line no-eval -- intentional: executes jsCode action type from server-side
				eval(itemData['updateRestrictionCallback']);
			}
			catch (e)
			{
				console.log('update action restricted');
			}
			if (isDropZone)
			{
				this.itemMoving.dropEvent.denyAction();
			}
			else
			{
				this.moveItem(
					item,
					this.itemMoving.oldColumn,
					this.itemMoving.oldNextSiblingId
				);
			}

			return;
		}

		// first checking if targetColumn require some fields
		if (
			Type.isArrayFilled(this.getRequiredFieldsForColumnId(columnId, itemData))
			&& this.itemMoving.oldColumn.getId() !== targetColumn.getId()
			&& !item.isChangedInPullRequest()
		)
		{
			// check required fm fields
			if (itemData.required_fm)
			{
				const newRequired = [];
				const requiredFieldNames = this.getRequiredFieldsForColumnId(columnId, itemData);

				for (let i = 0, c = requiredFieldNames.length; i < c; i++)
				{
					const key = requiredFieldNames[i];
					if (item.isRequiredFmField(key) || !item.isValidFmFieldName(key))
					{
						newRequired.push(requiredFieldNames[i]);
					}
				}
				itemData.required[columnId] = newRequired;
			}

			// if the item was loaded from a pull request, remove the required fields already set there
			if (item.rawData && typeof item.rawData === 'object')
			{
				const requiredFields = this.getRequiredFieldsForColumnId(columnId, itemData);

				for (var i = 0, c = requiredFields.length; i < c; i++)
				{
					var key = requiredFields[i];
					if (
						!(
							typeof item.rawData[key] === 'undefined'
							|| item.rawData[key] === null
							|| item.rawData[key] === ''
							|| (Array.isArray(item.rawData[key]) && !item.rawData[key].length)
						)
					)
					{
						requiredFields.splice(i, 1);
					}
				}
				itemData.required[columnId] = requiredFields;
			}

			if (
				(
					Type.isArrayFilled(itemData.required?.[columnId])
					|| Type.isArrayFilled(itemData.required.ALL)
				)
				&& this.getTypeInfoParam('isQuickEditorEnabled')
			)
			{
				this.itemMoving.newColumn = targetColumn;
				this.itemMoving.newNextSibling = beforeItem;
				// back to the prev place
				if (isDropZone)
				{
					this.itemMoving.dropEvent.denyAction();
				}

				if (this.getChecked().length > 1)
				{
					this.showNotCompletedPopup(gridData);
					this.resetMultiSelectMode();
				}
				else
				{
					// show editor
					const requiredFields = this.getRequiredFieldsForColumnId(columnId, itemData);

					this.openPartialEditor(item.getId(), columnId, requiredFields);
					Dom.addClass(
						item.layout.container,
						"main-kanban-item-waiting"
					);
				}
				return;
			}
		}

		if (!item.isChangedInPullRequest())
		{
			// show popup for lead convert
			if (
				this.getTypeInfoParam('canShowPopupForLeadConvert')
				&& targetColumn.getId() === 'CONVERTED'
				&& this.itemMoving.dropEvent
			)
			{
				BX.Crm.KanbanComponent.dropPopup(
					this,
					this.itemMoving.dropEvent
				);
			}

			// change price in old/new columns
			if (!item.notChangeTotal)
			{
				if (this.itemMoving.item.getData().runtimePrice !== true)
				{
					this.itemMoving.oldColumn.decPrice(this.itemMoving.price);
				}
				if (!isDropZone)
				{
					targetColumn.incPrice(this.itemMoving.price);
					targetColumn.renderSubTitle();
					this.itemMoving.oldColumn.renderSubTitle();
				}
			}

			item.notChangeTotal = false;
		}

		this.itemMoving.item.setDataKey(
			"runtimePrice",
			false
		);

		// call handler
		if (
			skipHandler !== true
			&& !item.isChangedInPullRequest()
		)
		{
			var handlerData = {
				grid: this,
				item: item,
				targetColumn: targetColumn,
				beforeItem: beforeItem,
				skip: false
			};
			BX.onCustomEvent("Crm.Kanban.Grid:onItemMovedFinal", [handlerData]);
			if (handlerData.skip === true)
			{
				return;
			}
		}

		var afterItemId = 0;
		var itemId = item.getId();

		// set sort
		if (targetColumn instanceof BX.Kanban.DropZone)
		{
			afterItemId = 0;
		}
		else
		{
			var afterItem = targetColumn.getPreviousItemSibling(item);
			if (afterItem)
			{
				afterItemId = afterItem.getId();
			}
		}

		Dom.removeClass(
			item.layout.container,
			"main-kanban-item-waiting"
		);

		if (item.isChangedInPullRequest())
		{
			this.clearItemMoving();
			item.dropChangedInPullRequest();
		}
		else
		{
			const { groupIds } = this.itemMoving;
			if (Type.isArray(groupIds) && !Type.isArrayFilled(groupIds))
			{
				groupIds.push(itemId);
			}

			this.checkItemStatusAfterMoved(item, afterItemId, targetColumn);
		}
	}

	/**
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {number} afterItemId
	 * @param {BX.Kanban.Column|BX.Kanban.DropZone} targetColumn
	 */
	checkItemStatusAfterMoved(item, afterItemId, targetColumn)
	{
		const itemId = item.getId();
		const targetColumnId = targetColumn ? targetColumn.getId() : 0;
		const params = {
			action: 'status',
			entity_id: this.itemMoving?.groupIds ?? itemId,
			prev_entity_id: afterItemId,
			status: targetColumnId,
			eventId: BX.Pull.QueueManager.registerRandomEventId(),
		};

		const ids = this.itemMoving?.groupIds ?? [itemId];
		const columnType = targetColumn.getData().type;
		const isColumnChanged = this.itemMoving?.oldColumn && (this.itemMoving.oldColumn.id !== targetColumn.id);

		const analyticsData = this.getDefaultAnalyticsCloseEvent(item, targetColumn.getData().type, ids);

		this.ajax(
			params,
			(data) => {
				if (!data)
				{
					if (isColumnChanged)
					{
						this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR)
					}

					return;
				}

				if (this.hasResponseError(data))
				{
					this.rollbackItemsMovement([item.id], targetColumnId);

					this.showResponseError(data);

					if (isColumnChanged)
					{
						this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR)
					}

					return;
				}

				if (isColumnChanged)
				{
					this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_SUCCESS)
				}
				else
				{
					this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR_FILLING_FIELDS)
				}

				if (
					this.getData().useItemPlanner
					&& !this.itemMoving?.groupIds
					&& Restriction.Instance.isTodoActivityCreateAvailable()
				)
				{
					setTimeout(() => this.showItemPlannerMenu(item), 500);
				}

				const { items } = data;
				let { isShouldUpdateCard } = data;
				if (Type.isArrayFilled(items))
				{
					this.updateItem(itemId, items[0]);

					return;
				}

				const prevColumnId = item.getLastPosition()?.columnId;
				if (prevColumnId)
				{
					const prevColumn = this.getColumn(prevColumnId);
					const currentColumn = item.getColumn();

					if (prevColumn?.isHiddenTotalSum() !== currentColumn?.isHiddenTotalSum())
					{
						isShouldUpdateCard = true;
					}
				}
				else
				{
					isShouldUpdateCard = true;
				}

				item.setDataKey('columnId', targetColumnId);

				if (isShouldUpdateCard)
				{
					void this.loadNew(itemId, false, true, true, true);
				}
			},
			(error) => {
				this.registerAnalyticsChangeStageEvent(item, columnType, ids, this._analyticsDictionary.STATUS_ERROR)

				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			},
		);
	}

	/**
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {string} type
	 * @param {string} ids
	 */
	getDefaultAnalyticsCloseEvent(item, type, ids)
	{
		let element = type;

		if (element === 'WIN')
		{
			element = 'won';
		}
		else if (element === 'LOOSE')
		{
			element = 'lose';
		} else
		{
			element = 'progress';
		}

		let subSection = this._analyticsDictionary.SUB_SECTION_KANBAN;

		if (this.dropZonesShow) {
			subSection = this._analyticsDictionary.SUB_SECTION_KANBAN_DROPZONE;
		}

		return this._analyticsBuilder.Entity.CloseEvent.createDefault(item.getGridData().entityType, ids)
			.setSubSection(subSection)
			.setElement(element)
			.buildData();
	}

	registerAnalyticsCloseEvent(analyticsData, status)
	{
		if (!analyticsData || (analyticsData.c_element === 'progress' && status !== this._analyticsDictionary.STATUS_CANCEL))
		{
			return;
		}

		analyticsData.status = status;

		BX.UI.Analytics.sendData(analyticsData);
	}

	registerAnalyticsChangeStageEvent(item, columnType, ids, status)
	{
		if (columnType === 'PROGRESS')
		{
			const analyticsData = this._analyticsBuilder.Entity.ChangeStageEvent.createDefault(item.getGridData().entityType, ids.length)
				.setSubSection(this._analyticsDictionary.SUB_SECTION_KANBAN)
				.setStatus(status)
				.buildData();

			BX.UI.Analytics.sendData(analyticsData);
		}
		else
		{
			this.registerAnalyticsCloseEvent(this.getDefaultAnalyticsCloseEvent(item, columnType, ids.toString()), status)
		}
	}

	registerAnalyticsSpecialItemLinkClick(item, linkPath)
	{
		const pathParts = {
			REST_DEMO: 'rest_demo',
			CONTACT_CENTER: 'contact_center',
			MARKETPLACE: 'marketplace'
		}

		if (!(linkPath.toUpperCase() in pathParts))
		{
			return;
		}

		let element = this._analyticsDictionary.ELEMENT_ITEM_CONTACT_CENTER;
		if (linkPath === pathParts.REST_DEMO)
		{
			element = this._analyticsDictionary.ELEMENT_ITEM_INDUSTRY_BUTTON;
		}

		if (linkPath === pathParts.MARKETPLACE)
		{
			element = this._analyticsDictionary.ELEMENT_CONTACT_CENTER_MARKETPLACE;
		}

		const analyticsEvent = this._analyticsBuilder.Block.LinkEvent.createDefault(item.getGridData().entityType)
			.setElement(element);

		if (linkPath === pathParts.REST_DEMO)
		{
			analyticsEvent.setType(this._analyticsDictionary.TYPE_ITEM_INDUSTRY);
		}

		this.sendAnalyticsEvent(analyticsEvent);
	}

	registerAnalyticsSpecialItemCloseEvent(item, subSection, element, type = null)
	{
		const analyticsEvent = this._analyticsBuilder.Block.CloseEvent.createDefault(item.getGridData().entityType)
			.setSubSection(subSection)
			.setElement(element);

		if (type === this._analyticsDictionary.TYPE_ITEM_INDUSTRY)
		{
			analyticsEvent.setType(type);
		}

		this.sendAnalyticsEvent(analyticsEvent);
	}

	registerAnalyticsSpecialItemEnableEvent(item, subSection, element, type = null)
	{
		const analyticsEvent = this._analyticsBuilder.Block.EnableEvent.createDefault(item.getGridData().entityType)
			.setSubSection(subSection)
			.setElement(element);

		if (type === 'industry_block')
		{
			analyticsEvent.setType(this._analyticsDictionary.TYPE_ITEM_INDUSTRY);
		}

		this.sendAnalyticsEvent(analyticsEvent);
	}

	sendAnalyticsEvent(analyticsEvent)
	{
		BX.UI.Analytics.sendData(analyticsEvent.buildData());
	}

	/**
	 * @param {number[]} itemIds
	 * @param {string} targetColumnId
	 */
	rollbackItemsMovement(itemIds, targetColumnId)
	{
		this.clearItemMoving();

		itemIds.forEach((itemId) => {
			const item = this.getItem(itemId);
			if (item === null)
			{
				return;
			}

			const currentColumn = this.getColumn(targetColumnId);
			if (currentColumn === null)
			{
				return;
			}

			const targetColumn = this.getColumn(item.options.columnId);
			if (targetColumn === null)
			{
				return;
			}

			const beforeItem = this.getItem(item.lastPosition.targetId);

			currentColumn.removeItem(item).then(() => {
				const { price } = item.data;
				this.moveItemPriceBetweenColumns(currentColumn, targetColumn, price);

				targetColumn.addItem(item, beforeItem);
			});
		});
	}

	/**
	 * @param {BX.CRM.Kanban.Column} donor
	 * @param {BX.CRM.Kanban.Column} acceptor
	 * @param {Number} price
	 */
	moveItemPriceBetweenColumns(donor, acceptor, price)
	{
		if (Type.isNumber(price))
		{
			donor.decPrice(price);
			donor.renderSubTitle();
			acceptor.incPrice(price);
			acceptor.renderSubTitle();
		}
	}

	hasResponseError(response)
	{
		return Type.isString(response.error);
	}

	showResponseError(response)
	{
		if (response.errorCode === 'MODE_NOT_AVAILABLE')
		{
			this.handleModeNotAvailable();
			return;
		}

		const errorText = response.error;

		if (response.fatal)
		{
			BX.Kanban.Utils.showErrorDialog(errorText, true);
		}
		else
		{
			BX.UI.Notification.Center.notify({
				content: errorText,
				autoHideDelay: 5000,
			});
		}
	}

	handleModeNotAvailable()
	{
		if (this._modeNotAvailableHandled)
		{
			return;
		}

		this._modeNotAvailableHandled = true;

		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('CRM_KANBAN_MODE_ACTIVITIES_DISABLED'),
			autoHideDelay: 5000,
		});

		const gridData = this.getData();
		const entityTypeId = gridData.hasOwnProperty('entityTypeInt')
			? Text.toInteger(gridData.entityTypeInt)
			: 0;
		const categoryId = gridData.params && gridData.params.hasOwnProperty('CATEGORY_ID')
			? Text.toInteger(gridData.params.CATEGORY_ID)
			: 0;

		if (entityTypeId > 0 && BX.Crm.Router && BX.Crm.Router.Instance)
		{
			const listUri = BX.Crm.Router.Instance.getItemListUrl(entityTypeId, categoryId);
			if (listUri)
			{
				window.location = listUri.toString();
			}
		}
	}

	showItemPlannerMenu(item)
	{
		item.showPlannerMenu(item.getContainer(), BX.Crm.Activity.TodoEditorMode.UPDATE,true);
	}

	showNotCompletedPopup(gridData)
	{
		var message;
		if(gridData.isDynamicEntity)
		{
			message = Loc.getMessage("CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_DYNAMIC_MSGVER_1")
		}
		else
		{
			message = Loc.getMessage("CRM_KANBAN_SET_STATUS_NOT_COMPLETED_TEXT_" + gridData.entityType + '_MSGVER_1');
		}

		this.getPopupCancel(message).show();
	}

	/**
	 * Hook on column update.
	 * @param {BX.Kanban.Column} column
	 * @returns {void}
	 */
	onColumnUpdated(column)
	{
		var columnId = column.getId();
		var title = column.getName();
		var color = column.getColor();

		this.ajax({
				action: "modifyStage",
				columnId: columnId,
				columnName: title,
				columnColor: color
			},
			function(data)
			{
				if (data && data.error)
				{
					this?.stageAnalyticsLabels.sendRenameFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, data.fatal);
				}
				else
				{
					this?.stageAnalyticsLabels.sendRenameSuccess();
					this.resetActionPanel();
				}
			}.bind(this),
			function(error)
			{
				this?.stageAnalyticsLabels.sendRenameFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
			}.bind(this)
		);
	}

	/**
	 * Hook on column move.
	 * @param {BX.Kanban.Column} column
	 * @param {BX.Kanban.Column} [targetColumn]
	 * @returns {void}
	 */
	onColumnMoved(column, targetColumn)
	{
		var columnId = column.getId();
		var afterColumn = this.getPreviousColumnSibling(column);
		var afterColumnId = afterColumn ? afterColumn.getId() : 0;

		this.ajax({
				action: "modifyStage",
				columnId: columnId,
				afterColumnId: afterColumnId
			},
			function(data)
			{
				if (data && data.error)
				{
					this?.stageAnalyticsLabels.sendUpdateFailure();
					BX.Kanban.Utils.showErrorDialog(data.error, true);
				}
				else
				{
					this?.stageAnalyticsLabels.sendUpdateSuccess();
					this.resetActionPanel();
				}
			}.bind(this),
			function(error)
			{
				this?.stageAnalyticsLabels.sendUpdateFailure();
				BX.Kanban.Utils.showErrorDialog("Error: " + error, true);
			}.bind(this)
		);
	}

	/**
	 * Hook on main filter applied.
	 * @param {String} filterId
	 * @param {Object} values
	 * @param {Object} filterInstance
	 * @param {BX.Promise} promise
	 * @param {Object} params
	 * @returns {void}
	 */
	onApplyFilter(filterId, values, filterInstance, promise, params)
	{
		this.clearItemMoving();
		this.fadeOut();

		if (Type.isObject(params))
		{
			params.autoResolve = false;
		}

		this.ajax(
			{
				action: 'get',
			},
			(data) => {
				const gridData = this.getData();

				if (!Type.isUndefined(data.customFields))
				{
					gridData.customFields = data.customFields;
				}

				if (Type.isArray(data.customEditFields))
				{
					gridData.customEditFields = data.customEditFields;
				}

				if (Type.isBoolean(data.shouldShowTooltips))
				{
					gridData.itemsConfig.shouldShowTooltips = data.shouldShowTooltips;
				}

				if (Type.isObject(data.config) && Object.keys(data.config).length > 0)
				{
					Object.keys(data.config).forEach(key => {
						const configRow = data.config[key];
						if (
							Type.isArrayFilled(configRow)
							|| (Type.isObject(configRow) && Object.keys(configRow).length > 0)
							|| Type.isBoolean(configRow)
						)
						{
							gridData.itemsConfig[key] = configRow;
						}
					});
				}

				this.setData(gridData);
				this.destroyFieldsSelectPopup();
				this.destroyHideColumnSumPopups();
				this.destroyUnavailableFieldsPopup();

				const exist = [];
				let id = null;
				let columns = this.getColumns();
				for (let i = 0, c = columns.length; i < c; i++)
				{
					id = columns[i].getId();
					exist.push(id);
					this.removeColumn(id);
				}

				this.removeItems();
				this.loadData(data);

				const dropZone = this.getDropZoneArea();
				const dropZones = this.getDropZoneArea().getDropZones();
				for (let i = 0, c = dropZones.length; i < c; i++)
				{
					dropZone.removeDropZone(dropZones[i]);
				}

				if (data.dropzones)
				{
					for (let i = 0, c = data.dropzones.length; i < c; i++)
					{
						dropZone.addDropZone(data.dropzones[i]);
					}
				}

				// check for new columns and scroll to it
				let newColumn = null;
				columns = this.getColumns();
				for (let i = 0, c = columns.length; i < c; i++)
				{
					id = columns[i].getId();
					if (!BX.util.in_array(id, exist))
					{
						newColumn = columns[i];
					}
				}

				if (newColumn !== null)
				{
					this.addClassEar()
				}

				this.fadeIn();

				this.resetMultiSelectMode();

				setTimeout(() => {
					if (this.hasOnlyNotVisibleColumnsWithItems())
					{
						this.showHintForNotVisibleItems();
					}
				}, 20);

				if (typeof promise !== "undefined")
				{
					promise.fulfill();
				}

			},
			(error) => {
				if (typeof promise !== "undefined")
				{
					promise.reject();
				}

				this.fadeIn();
			}
		);
	}

	handleHintForNotVisibleColumns()
	{
		if (this.hintForNotVisibleItems || !this.hasOnlyNotVisibleColumnsWithItems())
		{
			return;
		}

		this.showHintForNotVisibleItems();
	}

	hasOnlyNotVisibleColumnsWithItems()
	{
		const columns = this.getColumns();
		let result = false;

		for (let columnIndex = 0; columnIndex < columns.length; columnIndex++)
		{
			const column = columns[columnIndex];
			const isColumnHaveItems = column.items.filter((item) => item.id > -1).length > 0;

			if (!isColumnHaveItems)
			{
				continue;
			}

			if (this.isVisibleColumn(column))
			{
				result = false;
				break;
			}
			else
			{
				result = true;
			}
		}

		return result;

	}

	isVisibleColumn(column)
	{
		if (!column || !this.layout.gridContainer)
		{
			return false;
		}

		const gridContainerPos = Dom.getPosition(this.layout.gridContainer);
		const columnPos = Dom.getPosition(column.layout.container);

		return columnPos.left < gridContainerPos.right;
	}

	showHintForNotVisibleItems()
	{
		if (this.hintForNotVisibleItems)
		{
			return;
		}

		const entityType = this.getData().entityType;

		const hintTitle = Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TITLE`)
			|| Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TITLE_MSGVER_1`)
			|| Loc.getMessage('CRM_GRID_HINT_FOR_NOT_VISIBLE_ELEMENT_TITLE');
		const hintText = Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TEXT`)
			|| Loc.getMessage(`CRM_GRID_HINT_FOR_NOT_VISIBLE_${entityType}_TEXT_MSGVER_1`)
			|| Loc.getMessage('CRM_GRID_HINT_FOR_NOT_VISIBLE_ELEMENT_TEXT');

		this.hintForNotVisibleItems = new Guide({
			onEvents: true,
			simpleMode: true,
			steps: [
				{
					target: '.main-kanban-ear-right',
					title: hintTitle,
					text: hintText,
					position: 'left',
				},
			],
		});

		this.hintForNotVisibleItems.showNextStep()
		this.adjustHintForNotVisibleItems();

		this.handleHideHintForNotVisibleItems = this.hideHintForNotVisibleItems.bind(this);
		Event.bind(window, 'scroll', this.handleHideHintForNotVisibleItems);
		Event.bind(this.layout.gridContainer, 'scroll', this.handleHideHintForNotVisibleItems);
		BX.addCustomEvent('BX.Main.Filter:apply', this.handleHideHintForNotVisibleItems);

		this.addClassEar();
	}

	hideHintForNotVisibleItems()
	{
		if (this.hintForNotVisibleItems)
		{
			Event.unbind(this.layout.gridContainer, 'scroll', this.handleHideHintForNotVisibleItems);
			Event.unbind(window, 'scroll', this.handleHideHintForNotVisibleItems);
			this.hintForNotVisibleItems.close();
			this.hintForNotVisibleItems = null;
		}

	}

	adjustHintForNotVisibleItems()
	{
		if (!this.hintForNotVisibleItems)
		{
			return;
		}

		const popup = this.hintForNotVisibleItems.getPopup();
		const bindElementPos = Dom.getPosition(popup.bindElement);

		const {width: popupWidth} = Dom.getPosition(popup.getPopupContainer());
		const angleHeight = 18;
		const angleWidth = 13;
		const angleOffset = 16;

		const newTopPos = bindElementPos.top + (bindElementPos.height / 2) - (angleHeight / 2) - angleOffset + 'px';
		const newLeftPos = (bindElementPos.left - popupWidth - angleWidth) + 'px';

		Dom.style(popup.getPopupContainer(), 'top', newTopPos);
		Dom.style(popup.getPopupContainer(), 'left', newLeftPos);
	}

	adjustLayout()
	{
		super.adjustLayout(...arguments);
		this.adjustHintForNotVisibleItems();
	}

	clearItemMoving()
	{
		this.itemMoving = null
	}

	/**
	 * Add ears.
	 * @returns {void}
	 */
	addClassEar()
	{
		var ear = document.querySelector(".main-kanban-ear-right");
		ear.classList.contains("crm-kanban-ear-animate") ? Dom.removeClass("crm-kanban-ear-animate") : null
		Dom.addClass(ear, "crm-kanban-ear-animate")
	}

	/**
	 * Show or hide contact center.
	 *
	 * @param {BX.Main.Menu} menu
	 *
	 * @return {void}
	 */
	toggleCC(menu)
	{
		let subSection = this._analyticsDictionary.SUB_SECTION_GRID_ROW_MENU;
		let element = this._analyticsDictionary.ELEMENT_HIDE_CONTACT_CENTER;

		if (menu === undefined)
		{
			menu = MenuManager.getCurrentMenu();

			subSection = this._analyticsDictionary.SUB_SECTION_KANBAN;
			element = this._analyticsDictionary.ELEMENT_CLOSE_BUTTON;
		}

		if (menu)
		{
			menu.close();
		}

		if (this.ccItem)
		{
			var gridData = this.getData();
			if (gridData.contactCenterShow)
			{
				this.hideItem(this.ccItem);

				this.registerAnalyticsSpecialItemCloseEvent(this.ccItem, subSection, element);
			}
			else
			{
				this.unhideItem(this.ccItem);

				this.registerAnalyticsSpecialItemEnableEvent(
					this.ccItem,
					this._analyticsDictionary.SUB_SECTION_GRID_ROW_MENU,
					this._analyticsDictionary.ELEMENT_ENABLE_CONTACT_CENTER,
				);
			}
			gridData.contactCenterShow = !gridData.contactCenterShow;

			if (menu)
			{
				menu.removeMenuItem('crm_kanban_cc_delimiter');
				menu.removeMenuItem('crm_kanban_cc');
			}
		}

		this.ajax({
				action: "toggleCC"
			},
			function()
			{
			}.bind(this),
			function(error)
			{
			}.bind(this)
		);
	}

	/**
	 * Hide REST demo block.
	 * @return {void}
	 */
	toggleRest()
	{
		if (this.restItem)
		{
			this.hideItem(this.restItem);
		}
		this.ajax({
				action: "toggleRest"
			},
			function()
			{
			}.bind(this),
			function(error)
			{
			}.bind(this)
		);
	}

	/**
	 *
	 * @param {BX.Kanban.Item|string|number} item
	 * @returns {boolean}
	 */
	unhideItem(item)
	{
		const result = this.unhideItemWithoutColumnRender(item);

		if (result)
		{
			item.getColumn().render();
		}

		return result;
	}

	/**
	 *
	 * @param {BX.Kanban.Item|string|number} item
	 * @returns {boolean}
	 */
	unhideItemWithoutColumnRender(item)
	{
		item = this.getItem(item);
		if (!item || item.isVisible())
		{
			return false;
		}

		item.setOptions({ visible: true });

		if (
			item.layout.container
			&& Dom.hasClass(item.layout.container, 'main-kanban-item-disabled')
		)
		{
			Dom.removeClass(item.layout.container, 'main-kanban-item-disabled');
		}

		if (item.isCountable())
		{
			item.getColumn().incrementTotal();
		}

		return true;
	}

	/**
	 * Add menu item for show popup for select additional fields.
	 * @param {Strings} menuId
	 * @return {void}
	 */
	addMenuAdditionalFields(menuId)
	{
		var menu = MenuManager.getCurrentMenu(
			menuId
		);
		var menuItems = menu.getMenuItems();

		if (
			menu &&
			menuItems &&
			menu.bindElement &&
			BX(menu.bindElement) &&
			BX.hasClass(BX(menu.bindElement), "ui-btn-icon-setting")
		)
		{
			var itemId = (menuItems.length > 0) ? menuItems[0].getId() : 0;

			const newMenuItems = [{
				text: Loc.getMessage('CRM_KANBAN_SETTINGS_FIELDS_VIEW'),
				onclick: () => this.showFieldsSelectPopup('view'),
			}];

			if (this.getData().entityType !== 'ORDER')
			{
				newMenuItems.push({
					text: Loc.getMessage("CRM_KANBAN_SETTINGS_FIELDS_EDIT"),
					onclick: () => {
						this.loadHiddenQuickEditorForFirstColumn();
						this.showFieldsSelectPopup('edit');
					},
				});
			}
			menu.addMenuItem(
				{
					text: Loc.getMessage("CRM_KANBAN_SETTINGS_TITLE"),
					items: newMenuItems
				},
				itemId
			);
		}
	}

	loadHiddenQuickEditorForFirstColumn()
	{
		const firstColumnId = this.columnsOrder[0]?.id;
		if (firstColumnId)
		{
			this.columns[firstColumnId].showQuickEditor(true);
		}
	}

	/**
	 * Add menu item for show or hide contact center block.
	 * @param {Strings} menuId
	 * @return {void}
	 */
	addMenuToggleCS(menuId)
	{
		var gridData = this.getData();
		var menu = MenuManager.getCurrentMenu(
			menuId
		);
		if (
			menu &&
			menu.bindElement &&
			BX(menu.bindElement) &&
			BX.hasClass(BX(menu.bindElement), "ui-btn-icon-setting")
		)
		{
			menu.addMenuItem(
				{
					text: "",
					delimiter: true
				},
				null
			);
			menu.addMenuItem(
				{
					text: gridData.contactCenterShow
							? Loc.getMessage("CRM_KANBAN_HIDE_CC")
							: Loc.getMessage("CRM_KANBAN_SHOW_CC"),
					onclick: function(e, /*BX.PopupMenuItem*/item)
					{
						//item.layout.text.textContent for change text if need
						this.toggleCC();
					}.bind(this)
				},
				null
			);
		}
	}

	getQuickEditor()
	{
		var columns = this.getColumns();

		for (var i = 0, c = columns.length; i < c; i++)
		{
			var columnEditor = columns[i].getQuickEditor();
			if (columnEditor)
			{
				return columnEditor;
			}
		}

		return null;
	}

	getColumnWithOpenEditor(excludeColumn)
	{
		const columns = this.getColumns();

		for (let i = 0; i < columns.length; i++)
		{
			if (columns[i] !== excludeColumn && columns[i].editorOpen)
			{
				return columns[i];
			}
		}

		return null;
	}

	/**
	 * Show popup for selecting fields which must show in view / edit.
	 * @param {string} viewType
	 */
	showFieldsSelectPopup(viewType)
	{
		if (this.fieldsSelectors[viewType])
		{
			this.fieldsSelectors[viewType].show();

			return;
		}

		Runtime.loadExtension('ui.dialogs.checkbox-list').then(() => {
			const gridData = this.getData();
			const columnEditor = this.getQuickEditor();
			let selectedFields = viewType === 'view' ? gridData.customFields : gridData.customEditFields;

			if (columnEditor && viewType === 'edit')
			{
				const section = columnEditor.getControlById('main');
				const sectionFields = section.getChildren();

				if (BX.Type.isArray(sectionFields))
				{
					selectedFields = sectionFields.map(field => field.getId());

					gridData.customEditFields = selectedFields;
					this.setData(gridData);
				}
			}

			this
				.fetchFields(viewType, gridData.entityType, selectedFields, { categoryId: gridData.params?.CATEGORY_ID ?? 0 })
				.then((data) => {
					this.fieldsSelectors[viewType] = this.createFieldsSelector(viewType, data);
					this.fieldsSelectors[viewType].show();
				}
			);
		});
	}

	fetchFields(viewType, entityType, selectedFields, params = {})
	{
		return new Promise((resolve) => {
			ajax.runComponentAction(
				'bitrix:crm.kanban',
				'getPreparedFields',
				{
					mode: 'ajax',
					data: {
						entityType,
						viewType,
						selectedFields,
						params,
					}
				})
				.then(({ status, data }) => {
					if (status === 'success')
					{
						resolve(data);

						return;
					}

					console.error(`Fields for ${entityType} not fetched`);
				}, () => {
					console.error(`Fields for ${entityType} not fetched`);
				})
			;
		})
	}

	/**
	 * @param {string} viewType
	 * @param {{sections: Object, categories: Object, options: Object}} data
	 * @returns {CheckboxList}
	 */
	createFieldsSelector(viewType, data)
	{
		const columnCount = 3;
		const title = Loc.getMessage(`CRM_KANBAN_CUSTOM_FIELDS_${viewType.toUpperCase()}`);
		const placeholder = Loc.getMessage('CRM_EDITOR_FIELD_SEARCH_PLACEHOLDER');
		const emptyStateTitle = Loc.getMessage('CRM_EDITOR_FIELD_EMPTY_STATE_TITLE');
		const emptyStateDescription = Loc.getMessage('CRM_EDITOR_FIELD_EMPTY_STATE_DESCRIPTION');
		const allSectionsDisabledTitle = Loc.getMessage('CRM_EDITOR_FIELD_ALL_SECTIONS_DISABLED');

		const { sections, categories, options } = data;

		return new BX.UI.CheckboxList({
			columnCount,
			lang: {
				title,
				placeholder,
				emptyStateTitle,
				emptyStateDescription,
				allSectionsDisabledTitle,
			},
			sections,
			categories,
			options,
			params: {
				destroyPopupAfterClose: false,
			},
			events: {
				onApply: (event) => this.onApplyCheckboxList(viewType, event.data.fields, options),
			},
		});
	}

	/**
	 * @param {string} viewType
	 * @param {string[]} fields
	 * @param {Object[]} options
	 */
	onApplyCheckboxList(viewType, fields, options)
	{
		const preparedFields = {};

		fields.forEach((field) => {
			const optionField = options.find((option) => option.id === field);
			preparedFields[field] = optionField?.title;
		});

		let oldValues;
		const gridData = this.getData();

		if (viewType === 'view')
		{
			oldValues = gridData.customFields;
			gridData.customFields = Object.keys(preparedFields);
		}
		else
		{
			oldValues = gridData.customEditFields;
			gridData.customEditFields = Object.keys(preparedFields);
		}

		this.ajax(
			{
				action: 'saveFields',
				fields: preparedFields,
				type: viewType
			},
			() => this.onSuccessFieldsSave(viewType, oldValues),
		);
	}

	/**
	 * @param {string} viewType
	 * @param {string[]} oldValues
	 */
	onSuccessFieldsSave(viewType, oldValues)
	{
		if (viewType === 'view')
		{
			this.onApplyFilter();

			return;
		}

		const gridData = this.getData();
		this.applyCustomEditFields(gridData.customEditFields, oldValues);
	}

	applyCustomEditFields(newFields, oldFields)
	{
		var sectionEditor = this.getQuickEditor().getControlById("main");
		var fieldsToAdd = newFields.filter(
			function(fieldName)
			{
				return oldFields.indexOf(fieldName) < 0 && sectionEditor.getChildById(fieldName) === null;
			}
		);
		var fieldsToRemove = oldFields.filter(
			function(fieldName)
			{
				return newFields.indexOf(fieldName) < 0 && sectionEditor.getChildById(fieldName) !== null;
			}
		);
		// gets editor from each column and add new fields
		var columns = this.getColumns();
		for (var i = 0; i < columns.length; i++)
		{
			var columnEditor = columns[i].getQuickEditor();
			if (!columnEditor)
			{
				continue;
			}
			var element;
			// add new fields
			for (var j = 0; j < fieldsToAdd.length; j++)
			{
				element = columnEditor.getAvailableSchemeElementByName(
					fieldsToAdd[j]
				);
				if (element)
				{
					var field = columnEditor.createControl(
						element.getType(),
						element.getName(),
						{
							schemeElement: element,
							model: columnEditor._model,
							mode: columnEditor._mode
						}
					);

					if (field)
					{
						columnEditor.getControlById("main").addChild(
							field,
							{
								layout: {forceDisplay: true},
								enableSaving: false
							}
						);
					}
				}
			}
			// remove old fields
			for (var k = 0; k < fieldsToRemove.length; k++)
			{
				element = columnEditor.getSchemeElementByName(
					fieldsToRemove[k]
				);
				if (element)
				{
					var section = columnEditor.getControlById("main");
					var control = section.getChildById(fieldsToRemove[k]);
					if (control)
					{
						section.removeChild(control, { enableSaving: false });
					}
				}
			}

			columnEditor.commitSchemeChanges();
		}

		this.getQuickEditor().saveSchemeChanges().then(
			function () {
				for (var i = 0; i < columns.length; i++)
				{
					var columnEditor = columns[i].getQuickEditor();
					if (columnEditor)
					{
						columnEditor.refreshLayout();
					}
				}
			}
		);
	}

	destroyFieldsSelectPopup()
	{
		var customFieldsPopup = BX.Main.PopupManager.getPopupById("kanban_custom_fields");
		if (customFieldsPopup)
		{
			customFieldsPopup.destroy();
		}
	}

	destroyHideColumnSumPopups()
	{
		this.getColumns().forEach((column) => {
			PopupManager.getPopupById(column.getHideColumnSumPopupId())?.destroy();
		});
	}

	destroyUnavailableFieldsPopup()
	{
		PopupManager.getPopupById('crm-unavailable-fields-checker-popup')?.destroy();
	}

	/**
	 * Handler partial editor close.
	 * @param {BX.Crm.PartialEditorDialog} sender
	 * @param {Object} eventParams
	 * @return void
	 */
	onPartialEditorClose(sender, eventParams)
	{
		Dom.removeClass(
			this.itemMoving.item.layout.container,
			"main-kanban-item-waiting"
		);

		if (eventParams.isCancelled)
		{
			return;
		}

		var stilError = false;
		// update required fields
		if (eventParams.entityData)
		{
			var itemData = this.itemMoving.item.getData();
			var newColumnId = this.itemMoving.newColumn.getId();

			const requiredKeys = this.getRequiredFieldsForColumnId(newColumnId, itemData);

			if (Type.isArrayFilled(requiredKeys))
			{
				let itrError = false;
				const deletedFM = {};

				const requiredFmFields = ['PHONE', 'EMAIL', 'IM', 'WEB'];
				requiredFmFields.forEach((fieldName) => {
					if (eventParams.entityData[fieldName])
					{
						itemData.required_fm[fieldName] = false;
						deletedFM[fieldName] = true;
					}
				});

				for (var i = 0, c = requiredKeys.length; i < c; i++)
				{
					var key = requiredKeys[i];

					if (deletedFM[key])
					{
						itrError = false;
					}
					else if (
						eventParams.entityData[key] &&
						(
							typeof eventParams.entityData[key] === "object" &&
							eventParams.entityData[key].IS_EMPTY === false
							||
							typeof eventParams.entityData[key] !== "object" &&
							eventParams.entityData[key] !== ""
						)
					)
					{
						itrError = false;
					}
					else if (
						key === "OPPORTUNITY_WITH_CURRENCY" &&
						parseFloat(eventParams.entityData["OPPORTUNITY"]) > 0
					)
					{
						this.itemMoving.item.setDataKey(
							"runtimePrice",
							true
						);
						itrError = false;
					}
					else if (
						key === "CLIENT" &&
						(
							parseInt(eventParams.entityData["CONTACT_ID"]) > 0 ||
							parseInt(eventParams.entityData["COMPANY_ID"]) > 0
						)
					)
					{
						itrError = false;
					}
					else if (
						key === "FILES"
						&& (
							Type.isArray(eventParams.entityData['STORAGE_ELEMENT_IDS'])
							&& eventParams.entityData['STORAGE_ELEMENT_IDS'].reduce(function(a, b) {
								return a + b;
							}, 0) > 0
						)
					)
					{
						itrError = false;
					}
					else if (
						key === "OBSERVER" &&
						eventParams.entityData["OBSERVER_IDS"].length
					)
					{
						itrError = false;
					}
					else
					{
						itrError = true;
					}
					if (!itrError)
					{
						// @todo
						for (var kStatus in itemData.required)
						{
							var stRequired = itemData.required[kStatus];
							for (var ii = 0, cc = stRequired.length; ii < cc; ii++)
							{
								if (stRequired[ii] === key)
								{
									stRequired = BX.util.deleteFromArray(stRequired, ii);
									break;
								}
							}
							itemData.required[kStatus] = stRequired;
						}
					}
					else
					{
						stilError = true;
					}
				}
				// save new data
				this.itemMoving.item.setDataKey('required', itemData.required);
				this.itemMoving.item.setDataKey('required_fm', this.itemMoving.item.getRequiredFm());

				// @todo #015661 it may be necessary to rollback commit after merging with mobile/crm
				if (eventParams.entityData["OPPORTUNITY_ACCOUNT"])
				{
					this.itemMoving.price = parseFloat(eventParams.entityData["OPPORTUNITY_ACCOUNT"]);
					this.itemMoving.item.setDataKey(
						"price",
						this.itemMoving.price
					);
					this.itemMoving.item.setDataKey(
						"price_formatted",
						eventParams.entityData["FORMATTED_OPPORTUNITY_ACCOUNT_WITH_CURRENCY"]
					);
				}
			}
		}
		// if drop area
		if (this.itemMoving.newColumn instanceof BX.Kanban.DropZone)
		{
			this.itemMoving.newColumn.captureItem(
				this.itemMoving.item
			);
		}
		else
		{
			// // move visual and save
			// this.onItemMoved(
			// 	this.itemMoving.item,
			// 	this.itemMoving.newColumn,
			// 	this.itemMoving.newNextSibling
			// );
			if (!stilError)
			{
				if (this.itemMoving?.oldColumn?.id)
				{
					this.itemMoving.item.columnId = this.itemMoving.oldColumn.id;
				}

				this.moveItem(
					this.itemMoving.item,
					this.itemMoving.newColumn,
					this.itemMoving.newNextSibling
				);
			}
		}
	}

	/**
	 * @param {string} columnId
	 * @param {Object} itemData
	 * @returns {string[]}
	 */
	getRequiredFieldsForColumnId(columnId, itemData)
	{
		return [
			...(itemData.required?.[columnId] ?? []),
			...(itemData.required?.ALL ?? []),
		];
	}

	/**
	 * Hook on pull event.
	 * @param {String} command
	 * @param {Object} params
	 * @returns {void}
	 */
	onPullEventHandlerCrm(command, params)
	{
		var gridData = this.getData();

		// new activity
		// if (command === "activity_add" && /*params.COMPLETED !== "Y" &&*/
		// 	params.OWNER_TYPE_NAME === gridData.entityType
		// )
		// {
		// 	var item = this.getItem(params.OWNER_ID);
		// 	if (item)
		// 	{
		// 		this.loadNew(item.getId());
		// 	}
		// 	else
		// 	{
		// 		this.loadNew();
		// 	}
		// }

		// new element by delegate
		if (command === "notify")
		{
			// lead / deal
			// var matches = params.originalTag.match(
			// 	new RegExp("CRM\\|" + gridData.entityType + "_RESPONSIBLE\\|([\\d]+)")
			// );
			// if (matches && matches[1])
			// {
			// 	this.loadNew(matches[1]);
			// }
			// invoice
			if (
				gridData.entityType === "INVOICE" &&
				params.settingName === "crm|invoice_responsible_changed"
			)
			{
				var matches = params.originalTag.match(
					new RegExp("CRM\\|" + gridData.entityType + "\\|([\\d]+)")
				);
				if (matches && matches[1])
				{
					this.loadNew(matches[1]);
				}
			}
		}
	}

	/**
	 * Check on one activity.
	 * @param {Integer} activityId
	 * @param {Integer} ownerId
	 * @param {Integer} ownerTypeId
	 * @param {Boolean} deadlined
	 * @returns {void}
	 */
	onCrmActivityTodoChecked(activityId, ownerId, ownerTypeId, deadlined)
	{
		const item = this.getItem(ownerId);
		if (!item)
		{
			return;
		}

		// deadlined counters
		if (deadlined)
		{
			let activityErrorTotal = item.getActivityErrorTotal();
			activityErrorTotal--;
			item.setDataKey('activityErrorTotal', activityErrorTotal);
		}

		// common counters
		let activityProgress = item.getActivityProgress();
		activityProgress--;
		item.setDataKey('activityProgress', activityProgress);

		item.switchPlanner();
	}

	/**
	 * On slider close.
	 * @param {BX.SidePanel.Event} SliderEvent
	 * @returns {void}
	 */
	onSliderClose(SliderEvent)
	{
		var gridData = this.getData();
		var maskUrl = gridData.entityPath;
		var sliderUrl = SliderEvent.slider.getUrl();
		maskUrl = maskUrl.replace(/\#([^\#]+)\#/, '([\\d]+)');

		var match = sliderUrl.match(new RegExp(maskUrl));
		if (match && match[1])
		{
			this.loadNew(match[1], false, true, true, true);
		}
	}

	/**
	 * On popup show.
	 * @param {BX.PopupWindow} popupWindow
	 * @returns {void}
	 */
	onPopupShow(popupWindow)
	{
		if (this.isPopupInKanbanColumn(popupWindow)) {

			if (this.handleScrollWithOpenPopupInKanbanColumn) {
				this.onPopupClose();
			}

			this.handleScrollWithOpenPopupInKanbanColumn = (e) => {
				// Sticky popups (e.g. the "not enough rights" popup) must follow the
				// bound button on scroll instead of being closed.
				if (this.isStickyKanbanColumnPopup(popupWindow)) {
					this.updateStickyPopupPosition(popupWindow);

					return;
				}

				popupWindow.close();
			}

			BX.Event.EventEmitter.subscribe(this, 'Kanban.Column:onScroll', this.handleScrollWithOpenPopupInKanbanColumn);
			Event.bind(window, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
			Event.bind(this.layout.gridContainer, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
		}

		var kanbanSettingsClasses = [
			'menu-popup-toolbar_lead_list_menu',
			'menu-popup-toolbar_deal_list_menu',
			'menu-popup-toolbar_order_kanban_menu',
			'menu-popup-toolbar_quote_list_menu'
		];
		var notCsClasses = [
			'menu-popup-toolbar_order_kanban_menu',
			'menu-popup-toolbar_quote_list_menu'
		];
		var newKanbanSettingsClasses = [
			'toolbar_lead_list_settings_menu',
			'toolbar_deal_list_settings_menu'
		];

		// add some menu item
		if (kanbanSettingsClasses.indexOf(popupWindow.uniquePopupId) !== -1)
		{
			var popupId = popupWindow.uniquePopupId.substr(11);
			this.addMenuAdditionalFields(popupId);
			if (notCsClasses.indexOf(popupWindow.uniquePopupId) === -1)
			{
				this.addMenuToggleCS(popupId);
			}
		}
		else if (newKanbanSettingsClasses.indexOf(popupWindow.uniquePopupId) !== -1)
		{
			var settingsButtonMenu = this.getSettingsButtonMenu();
			if (settingsButtonMenu !== null)
			{
				var gridData = this.getData();
				settingsButtonMenu.addMenuItem({
					id: 'crm_kanban_cc_delimiter',
					delimiter: true
				}, null);
				settingsButtonMenu.addMenuItem({
					id: 'crm_kanban_cc',
					text: gridData.contactCenterShow? Loc.getMessage("CRM_KANBAN_HIDE_CC") : Loc.getMessage("CRM_KANBAN_SHOW_CC"),
					onclick: function(event)
					{
						this.toggleCC(settingsButtonMenu);
					}.bind(this)
				}, null);
			}
		}
	}

	/**
	 * On popup close.
	 * @returns {void}
	 */
	onPopupClose() {
		if (this.handleScrollWithOpenPopupInKanbanColumn) {
			BX.Event.EventEmitter.unsubscribe(this, 'Kanban.Column:onScroll', this.handleScrollWithOpenPopupInKanbanColumn);
			Event.unbind(window, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);
			Event.unbind(this.layout.gridContainer, 'scroll', this.handleScrollWithOpenPopupInKanbanColumn);

			this.handleScrollWithOpenPopupInKanbanColumn = null;
		}
	}

	/**
	 * Is popup kanban column.
	 * @param {BX.PopupWindow} popupWindow
	 * @returns {boolean}
	 */
	isPopupInKanbanColumn(popupWindow)
	{
		const kanbanColumnClassname = 'main-kanban-column';
		let kanbanColumnElem = popupWindow.bindElement;
		const isTourPopup = BX.hasClass(popupWindow.popupContainer, 'popup-window-ui-tour');
		if (isTourPopup)
		{
			return false;
		}

		while (kanbanColumnElem && !Dom.hasClass(kanbanColumnElem, kanbanColumnClassname)) {
			kanbanColumnElem = kanbanColumnElem.parentNode;
		}

		return !!kanbanColumnElem;
	}

	/**
	 * Sticky popups must follow their bound element while the column is scrolled
	 * instead of being closed on scroll (e.g. the "not enough rights" popup
	 * anchored to the quick create save button).
	 * @param {BX.PopupWindow} popupWindow
	 * @returns {boolean}
	 */
	isStickyKanbanColumnPopup(popupWindow)
	{
		return popupWindow.uniquePopupId === 'crm-unavailable-fields-checker-popup';
	}

	/**
	 * Keeps a sticky popup glued to its bound element while the column scrolls,
	 * but hides it once the bound element is scrolled out of the visible area of
	 * its scroll container (so a fixed popup does not float over the top menu).
	 * @param {BX.PopupWindow} popupWindow
	 * @returns {void}
	 */
	updateStickyPopupPosition(popupWindow)
	{
		const bindElement = popupWindow.bindElement;
		const container = popupWindow.popupContainer;
		if (!bindElement || !container)
		{
			return;
		}

		const scrollContainer = this.getScrollableParent(bindElement);
		let isBindElementVisible = true;
		if (scrollContainer)
		{
			const bindRect = bindElement.getBoundingClientRect();
			const scrollRect = scrollContainer.getBoundingClientRect();
			isBindElementVisible = bindRect.bottom > scrollRect.top && bindRect.top < scrollRect.bottom;
		}

		if (isBindElementVisible)
		{
			container.style.visibility = '';
			popupWindow.adjustPosition();
		}
		else
		{
			container.style.visibility = 'hidden';
		}
	}

	/**
	 * Nearest vertically scrollable ancestor of the node (or null).
	 * @param {HTMLElement} node
	 * @returns {?HTMLElement}
	 */
	getScrollableParent(node)
	{
		let current = node.parentElement;
		while (current)
		{
			const overflowY = getComputedStyle(current).overflowY;
			if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight)
			{
				return current;
			}
			current = current.parentElement;
		}

		return null;
	}

	/**
	 * Set multi select mode.
	 * @returns {void}
	 */
	setMultiSelectMode()
	{
		this.multiSelectMode = true;
		this.setKanbanDragMode();
	}

	/**
	 * Build the action panel.
	 */
	initActionPanel()
	{
		var gridData = this.getData();

		var renderToNode = document.querySelector(".page-navigation");
		const isAirTemplate = BX.Reflection.getClass('BX.Intranet.Bitrix24.Template') !== null;

		if(!renderToNode)
		{
			renderToNode = (
				isAirTemplate
					? document.querySelector('.crm-kanban-action-panel')
					: document.getElementById('uiToolbarContainer')
			);
		}

		if (this.customActionPanel)
		{
			this.customActionPanel.renderTo = renderToNode;
			this.actionPanel = this.customActionPanel;

			this.actionPanel.draw();

			return;
		}

		this.actionPanel = new BX.UI.ActionPanel({
			renderTo: renderToNode,
			removeLeftPosition: true,
			maxHeight: 58,
			parentPosition: "bottom",
			autoHide: false,
		});

		this.actionPanel.draw();

		// delete
		this.actionPanel.appendItem({
			id: "kanban_delete",
			text: Loc.getMessage("CRM_KANBAN_PANEL_DELETE"),
			icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-delete.svg",
			onclick: () => {
				BX.CRM.Kanban.Actions.deleteAll(this);
			}
		});

		// ignore
		if (this.getTypeInfoParam('canUseIgnoreItemInPanel'))
		{
			this.actionPanel.appendItem({
				id: "kanban_ignore",
				text: Loc.getMessage("CRM_KANBAN_PANEL_IGNORE"),
				icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-ignore.svg",
				onclick: () => {
					BX.CRM.Kanban.Actions.ignore(this);
				}
			});
		}

		/*region Change category*/
		var items = [],
			categories = [],
			columns = this.getColumns(),
			drops = this.getDropZoneArea().getDropZones();
		for (var i = 0, c = columns.length; i < c; i++)
		{
			categories.push({
				id: columns[i].id,
				name: columns[i].name,
				blockedIncomingMoving: this.isBlockedIncomingMoving(columns[i]),
				type: columns[i].data.type,
			});
		}
		for (var i = 0, c = drops.length; i < c; i++)
		{
			var dropData = drops[i].getData();
			if (
				(
					gridData.entityType === "LEAD"
					&& dropData.type === "LOOSE"
				)
				||
				(
					gridData.entityType !== "LEAD"
					&& dropData.type
				)
			)
			{
				categories.push({
					id: drops[i].id,
					name: drops[i].name,
					blockedIncomingMoving: this.isBlockedIncomingMoving(columns[i]),
					type: drops[i].data.type,
				});
			}
		}
		for (var i = 0, c = categories.length; i < c; i++)
		{
			if (categories[i].blockedIncomingMoving)
			{
				continue;
			}

			items.push({
				id: "kanban_column_" + categories[i].id,
				column: categories[i],
				text: BX.util.htmlspecialchars(categories[i].name),
				onclick: function(i, item)
				{
					item.menuWindow.close();
					BX.CRM.Kanban.Actions.changeColumn(
						this,
						item.column
					);
				}.bind(this)
			});
		}
		this.actionPanel.appendItem({
			id: "kanban_column",
			text: Loc.getMessage("CRM_KANBAN_PANEL_STAGE"),
			items: items,
			icon: (gridData.entityType === "DEAL" || gridData.isDynamicEntity)
				? "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-stage.svg"
				: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-status.svg"
		});
		/* endregion */

		this.appendChangeCategoryItem();
		this.appendAssignedItem();

		// create task
		if (this.getTypeInfoParam('canUseCreateTaskInPanel'))
		{
			this.actionPanel.appendItem({
				id: "kanban_task",
				text: Loc.getMessage("CRM_KANBAN_PANEL_TASK"),
				icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-create.svg",
				onclick: function()
				{
					BX.CRM.Kanban.Actions.task(
						this
					);
				}.bind(this)
			});
		}

		if (this.getTypeInfoParam('canUseCallListInPanel'))
		{
			// call list
			this.actionPanel.appendItem({
				id: "kanban_calllist",
				text: Loc.getMessage("CRM_KANBAN_PANEL_CALLLIST"),
				icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-call.svg",
				onclick: function()
				{
					BX.CRM.Kanban.Actions.startCallList(
						this,
						false
					);
				}.bind(this)
			});
		}

		// merge
		if (this.getTypeInfoParam('canUseMergeInPanel'))
		{

			this.actionPanel.appendItem({
				id: "kanban_merge",
				text: Loc.getMessage("CRM_KANBAN_PANEL_MERGE"),
				icon: "/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-merge.svg",
				onclick: function()
				{
					BX.CRM.Kanban.Actions.merge(
						this
					);
				}.bind(this)
			});
		}

		if (this.getTypeInfoParam('canUseRestartAutomationInPanel'))
		{
			this.appendRestartAutomationAction();
		}
	}

	appendChangeCategoryItem()
	{
		const gridData = this.getData();

		if (!Type.isArrayFilled(gridData?.categories))
		{
			return;
		}

		const items = [];
		gridData.categories.forEach((category) => {
			items.push({
				id: `kanban_category_${category.ID}`,
				category,
				text: Text.encode(category.NAME),
				onclick: (i, item) => {
					item.menuWindow.close();
					BX.CRM.Kanban.Actions.changeCategory(this, item.category);
				},
			});
		})

		this.actionPanel.appendItem({
			id: 'kanban_category',
			text: Loc.getMessage('CRM_KANBAN_PANEL_CATEGORY2'),
			icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-fulling.svg',
			items,
		});
	}

	appendRestartAutomationAction()
	{
		this.actionPanel.appendItem({
			id: 'kanban_restart_automation',
			text: Loc.getMessage('CRM_KANBAN_PANEL_RESTART_AUTOMATION'),
			icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-restartautomation.svg',
			onclick: () => {
				const ids = this.getCheckedId();
				if (!Type.isArrayFilled(ids))
				{
					return;
				}

				(new RestartAutomationAction(this, { ids })).execute();
			},
		});
	}

	appendAssignedItem()
	{
		if (Type.isUndefined(BX.UI.EntityEditorUserSelector))
		{
			return;
		}

		this.actionPanel.appendItem({
			id: 'kanban_assigned',
			text: Loc.getMessage('CRM_KANBAN_PANEL_ASSIGNED'),
			icon: '/bitrix/js/crm/kanban/images/crm-kanban-actionpanel-responsible.svg',
			onclick: (event, item) => {
				setTimeout(() => {
					const targetNode = (
						Type.isUndefined(item.layout.container)
							? item.actionPanel.layout.more
							: item.layout.container
					);

					this.getResponsibleUserSelectorDialog(targetNode).show();
				}, 100);
			},
		});
	}

	getResponsibleUserSelectorDialog(targetNode)
	{
		return new EntitySelectorDialog({
			id: 'crm-kanban-responsible-user-selector-dialog',
			targetNode,
			context: 'CRM_KANBAN_RESPONSIBLE_USER',
			multiple: false,
			enableSearch: true,
			width: 450,
			entities: [
				{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						emailUsers: false,
						inviteGuestLink: false,
						intranetUsersOnly: true,
					},
				},
				{
					id: 'structure-node',
					options: {
						selectMode: 'usersOnly',
					},
				},
			],
			events: {
				'Item:onSelect': (event) => {
					this.onResponsibleUserSelect(event);
				},
			},
			popupOptions: {
				className: 'responsible-user-selector-dialog',
			},
		});
	}

	onResponsibleUserSelect(event)
	{
		const { item: selectedItem } = event.getData();

		if (selectedItem)
		{
			BX.CRM.Kanban.Actions.setAssigned(this, {
				entityId: selectedItem.getId(),
				name: Text.encode(selectedItem.getTitle()),
			});
		}
	}

	isBlockedIncomingMoving(column)
	{
		return ((column && column.data && column.data.blockedIncomingMoving) || false);
	}

	hideUiToolbarContainer()
	{
		var uiToolbarContainer = document.getElementById('uiToolbarContainer');
		Dom.addClass(uiToolbarContainer, '--transparent');
	}

	showUiToolbarContainer()
	{
		var uiToolbarContainer = document.getElementById('uiToolbarContainer');
		Dom.removeClass(uiToolbarContainer, '--transparent');
	}

	/**
	 * Show action panel.
	 * @returns {void}
	 */
	startActionPanel()
	{
		if (!this.actionPanel)
		{
			this.initActionPanel();
		}

		this.actionPanel.showPanel();
	}

	/**
	 * Hide action panel.
	 * @returns {void}
	 */
	stopActionPanel(force = false, resetMultiSelectMode = false)
	{
		if (!this.actionPanel)
		{
			return;
		}

		if (force || !this.getChecked().length)
		{
			this.actionPanel.hidePanel();
		}
	}

	/**
	 * Reset action panel.
	 * @returns {void}
	 */
	resetActionPanel()
	{
		if (this.actionPanel)
		{
			this.actionPanel.removeItems();
			this.actionPanel = null;
		}

		if (this.customActionPanel)
		{
			this.customActionPanel.removeItems();
			this.customActionPanel = null;
		}
	}

	onItemUnselect(itemInArray)
	{
		this.stopActionPanel();
	}

	/**
	 * @param {BX.UI.ActionPanel} actionPanel
	 */
	setCustomActionPanel(actionPanel)
	{
		this.customActionPanel = actionPanel;
	}

	reload()
	{
		this.resetMultiSelectMode();
		this.unSetKanbanDragMode();
		this.onApplyFilter();
	}

	calculateTotalCheckItems()
	{
		if(!this.actionPanel)
		{
			this.initActionPanel();
		}

		this.actionPanel.setTotalSelectedItems(this.getChecked().length);
	}

	isMultiSelectMode()
	{
		return this.multiSelectMode;
	}

	onMultiSelectMode()
	{
		if(this.multiSelectMode)
			return;

		this.multiSelectMode = true;
		Dom.addClass(this.layout.gridContainer, "crm-kanban-multi-select-mode");
	}

	resetMultiSelectMode()
	{
		for (var i = 0; i < this.getChecked().length; i++)
		{
			this.getChecked()[i].unSelectItem();
			if(this.getChecked()[i].layout.container && this.getChecked()[i].layout.container.classList.contains("main-kanban-item-disabled"))
			{
				Dom.removeClass(this.getChecked()[i].layout.container, "main-kanban-item-disabled");
			}
		}

		this.checkedItems = [];
		this.actionItems = [];
		this.multiSelectMode = false;
		Dom.removeClass(this.layout.gridContainer, "crm-kanban-multi-select-mode");
	}

	onOpenEditorMenu(editor, eventArgs)
	{
		// build new items for editor menu
		var menuItems = [], editorMenuPopup = null;
		menuItems.push({
			id: menuItems.length + 1,
			text: Loc.getMessage("CRM_KANBAN_CUSTOM_FIELDS_VIEW"),
			onclick: function() {
				this.showFieldsSelectPopup("view", editor);
			}.bind(this)
		});
		menuItems.push({
			id: menuItems.length + 1,
			text: Loc.getMessage("CRM_KANBAN_CUSTOM_FIELDS_EDIT"),
			onclick: function() {
				this.showFieldsSelectPopup("edit", editor);
			}.bind(this)
		});
		editorMenuPopup = new Menu(
			"crm-kanban-qiuck-form-add-fields-popup",
			editor._addChildButton,
			menuItems,
			{
				autohide: true,
				bindOptions: { forceBindPosition: true },
				autoHide: true,
				cacheable: false,
				closeByEsc: true
			}
		);
		editorMenuPopup.show();

		// cancel system menu
		eventArgs["cancel"] = true;
	}

	onConfigEditorScopeChange()
	{
		this.onApplyFilter();
	}

	onConfigEditorReset()
	{
		this.setAjaxParams({
			editorReset: "Y"
		});
		this.onApplyFilter();
	}

	onForceCommonEditorConfigScopeForAll()
	{
		this.setAjaxParams({
			editorSetCommon: "Y"
		});
		this.onApplyFilter();
	}

	insertItem(item, params = {})
	{
		const columnId = (params.hasOwnProperty('newColumnId') ? params.newColumnId : item.columnId);
		const newColumn = this.getColumn(columnId);

		if(newColumn)
		{
			const sorter = BX.CRM.Kanban.Sort.Sorter.createWithCurrentSortType(newColumn.getItems());

			const beforeItem = sorter.calcBeforeItem(item);
			if (
				sorter.getSortType() === BX.CRM.Kanban.Sort.Type.BY_LAST_ACTIVITY_TIME
				&& params.canShowLastActivitySortTour
			)
			{
				BX.Event.EventEmitter.emit('Kanban.Grid::onShowSortByLastActivityTour', {
					target: ".main-kanban-item[data-id='"+item.id+"']",
					stepId: 'step-sort-by-last-activity-time',
					delay: 1000,
				});
			}

			if (item.columnId === newColumn.getId() && beforeItem === null)
			{
				this.updateItemAtItsPosition(item);
			}
			else
			{
				this.moveItem(item, newColumn.getId(), beforeItem);
			}
		}
		else
		{
			this.removeItem(item);
		}
	}

	removeItem(itemId)
	{
		var item = this.getItem(itemId);
		if (item)
		{
			item.useAnimation = true;
			var column = item.getColumn();
			delete this.items[item.getId()];
			column.removeItem(item);
			item.dispose();
		}

		return item;
	}

	openPartialEditor(itemId, columnId, fieldNames)
	{
		var gridData = this.getData();
		var context = {};
		var settings = {
			entityTypeId: gridData.entityTypeInt,
			entityId: itemId,
			fieldNames: fieldNames,
			context: context,
		};
		context[this.getTypeInfoParam('stageIdKey')] = columnId;
		context['NOT_CHANGE_STATUS'] = 'Y';
		if(this.getTypeInfoParam('useFactoryBasedApproach'))
		{
			settings.title = Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
			settings.isController = true;
			settings.entityTypeName = gridData.entityType;
			settings.stageId = columnId;
		}
		else
		{
			settings.title = Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
		}

		this.progressBarEditor = BX.Crm.PartialEditorDialog.create(
			"progressbar-entity-editor",
			settings
		);

		window.setTimeout(
			function(){
				this.progressBarEditor.open();
			}.bind(this),
			150
		);
	}

	/**
	 * @param {string} param
	 */
	getTypeInfoParam(param)
	{
		var typeInfo = this.getTypeInfo();

		return (typeInfo[param] ? typeInfo[param] : false);
	}

	getTypeInfo()
	{
		return this.getData().typeInfo;
	}

	/**
	 * @returns {BX.Main.Menu|null}
	 */
	getSettingsButtonMenu()
	{
		const button = ToolbarComponent.Instance.getSettingsButton();

		return button ? button.getMenuWindow() : null;
	}

	setCurrentSortType(sortType)
	{
		return new Promise((resolve, reject) => {
			this.ajax(
				{
					action: 'setCurrentSortType',
					sortType,
				},
				resolve,
				reject,
			);
		});
	}

	onToggleTooltipsVisibility()
	{
		const newVisibilitySetting = !this.shouldShowTooltips();
		this.data.itemsConfig.shouldShowTooltips = newVisibilitySetting;

		BX.userOptions.save('crm', 'should_show_tooltips_kanban', null, newVisibilitySetting ? 1 : 0);
		this.fadeOut();

		location.reload();
	}

	shouldShowTooltips()
	{
		return this?.data?.itemsConfig?.shouldShowTooltips ?? true;
	}
}
