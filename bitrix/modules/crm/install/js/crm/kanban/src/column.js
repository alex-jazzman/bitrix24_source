import { Type, Dom, Event, Loc, Tag, Text } from 'main.core';
import { CurrencyCore } from 'currency.currency-core';
import { Loader } from 'main.loader';
import { PopupManager } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import 'main.kanban';

/**
 *
 * @param options
 * @extends {BX.Kanban.Column}
 */
export class Column extends BX.Kanban.Column
{
	renderSubtitleTime = 6;
	subtitleNode = null;
	pathToAdd = null;
	editorNodeWaiting = null;
	editorNodeIsBlock = null;
	editorNodeIsVisible = false;
	editorNode = null;
	editorNodeContainer = null;
	editorNodeCreate = null;
	editorNodeSelectFields = null;
	editorNodeSelectPopup = null;
	editorLoaded = false;
	editorOpen = false;
	quickFormSaveButtonInstance = null;
	quickFormCancelButtonInstance = null;
	editorId = null;
	editor = null;
	loader = null;
	isKeyMetaPressed = false;
	clickStatus = null;
	cancelEditHandler = null;
	blockSize = 20;
	canLoadMoreItems = true;

	constructor(options)
	{
		super(options);
	}

	getSubTitle()
	{
		const subTitle = super.getSubTitle();

		if (
			!this.getGrid().getTypeInfoParam('isQuickEditorEnabled')
			&& !this.getGrid().getTypeInfoParam('showTotalPrice')
		)
		{
			Dom.addClass(subTitle, '--hidden');
		}

		return subTitle;
	}

	/**
	 * Custom format method from BX.crm-kanban-quick-form-show .2s cubic-bezier(0.88, -0.08, 0.46, 0.91) forwards.Currency.
	 * @param {float} price Price.
	 * @param {string} currency Currency.
	 * @param {boolean} useTemplate Use or not template.
	 * @returns {string}
	 */
	currencyFormat(price, currency, useTemplate)
	{
		var result = "",
			format;

		useTemplate = !!useTemplate;
		format = CurrencyCore.getCurrencyFormat(currency);

		if (!!format && typeof format === "object")
		{
			format.CURRENT_DECIMALS = format.DECIMALS;
			format.HIDE_ZERO = "Y";//always
			if (format.HIDE_ZERO === "Y" && price == parseInt(price, 10))
			{
				format.CURRENT_DECIMALS = 0;
			}

			result = BX.util.number_format(
				price,
				format.CURRENT_DECIMALS,
				format.DEC_POINT,
				format.THOUSANDS_SEP
			);
			result = `<span class="crm-kanban-total-price-total__amount">${result}</span>`;
			if (useTemplate)
			{
				result = format.FORMAT_STRING.replace(/(^|[^&])#/, "$1" + result);
			}
		}
		return result;
	}

	/**
	 * Decrement total price of column.
	 * @param {Number} val Value to decrement.
	 * @returns {void}
	 */
	decPrice(val)
	{
		if (this.isHiddenTotalSum() || !Type.isNumber(val))
		{
			return;
		}

		const data = this.getData();
		data.sum = parseFloat(data.sum) - val;
		this.setData(data);
	}

	/**
	 * Increment total price of column.
	 * @param {Integer} val Value to increment.
	 * @returns {void}
	 */
	incPrice(val)
	{
		if (this.isHiddenTotalSum() || !Type.isNumber(val))
		{
			return;
		}

		const data = this.getData();
		data.sum = parseFloat(data.sum) + val;
		this.setData(data);
	}

	/**
	 * Return add-button for new column.
	 * @returns {DOM|null}
	 */
	getAddColumnButton()
	{
		var columnData = this.getData();

		if (columnData.type === "WIN")
		{
			this.layout.info.style.marginRight = "0";
			return Dom.create("div");
		}
		else
		{
			return super.getAddColumnButton();
		}
	}

	/**
	 * Get path for add mew element.
	 * @returns {string}
	 */
	getAddPath()
	{
		if (this.pathToAdd !== null)
		{
			return this.pathToAdd;
		}

		var gridData = this.getGridData();
		var type = gridData.entityType.toLowerCase();
		var wrapperId, button;

		if (type === "invoice")
		{
			wrapperId = "crm_invoice_toolbar";
		}
		else if (type === "order")
		{
			wrapperId = "toolbar_order_kanban";
		}
		else
		{
			wrapperId = "toolbar_" + type + "_list";
		}

		if (BX(wrapperId))
		{
			button = BX(wrapperId).querySelector("a");
			if (Type.isDomNode(button))
			{
				this.pathToAdd = button.getAttribute("href");
				this.pathToAdd += this.pathToAdd.indexOf("?") === -1 ? "?" : "&";
			}
		}

		return this.pathToAdd;
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {BX.CRM.Kanban.Item} beforeItem
	 */
	addItem(item, beforeItem)
	{
		if (!(item instanceof BX.Kanban.Item))
		{
			throw new Error("item must be an instance of BX.Kanban.Item");
		}

		if(item.layout.container && item.layout.container.classList.contains("main-kanban-item-disabled"))
		{
			Dom.removeClass(item.layout.container, "main-kanban-item-disabled");
		}

		var oldColumnId = item.getColumnId();
		item.setColumnId(this.getId());
		//? setGrid

		if(item.checked)
		{
			item.unSelectItem();
		}

		var index = BX.util.array_search(beforeItem, this.items);
		var items = this.getItems();
		var alreadySet = false;

		for (const itemId in items)
		{
			if (items[itemId].id === item.getId())
			{
				items[itemId] = item;
				alreadySet = true;
			}
		}

		if (!alreadySet)
		{
			if (index >= 0)
			{
				this.items.splice(index, 0, item);
			}
			else
			{
				this.items.push(item);
			}

			if (item.isVisible())
			{
				if (item.isCountable())
				{
					this.incrementTotal();
				}
			}
			else
			{
				this.getGrid().unhideItem(item);
			}
		}

		this.setPullItemBackground(item);

		if (!item.layout.container)
		{
			item.useAnimation = false;
		}

		item.animate({
			duration: this.getGrid().animationDuration / 4,
			draw: function(progress) {
				const currentHeight = item.layout.container.scrollHeight * progress;
				item.layout.container.style.height = `${currentHeight}px`;
				item.layout.container.style.zIndex = -1;
			},
			useAnimation: item.useAnimation
		}).then(() => {
			this.setPullItemBackground(item, '#fff');
			item.useAnimation = false;

			const style = {
				height: 'auto',
				opacity: '100%',
				zIndex: null,
			};
			Dom.style(item.layout.container, style);

			const params = {
				item,
				targetColumn: this,
				beforeItem,
				oldColumn: this.grid.getColumn(oldColumnId),
			}
			BX.Event.EventEmitter.emit('Crm.Kanban.Column:onItemAdded', params);
		});

		if (this.getGrid().isRendered())
		{
			this.render();
		}
	}

	addItems(items, beforeItem)
	{
		if(!items)
		{
			items = this.getGrid().getChecked();
		}

		var forSend = [];

		var index = BX.util.array_search(beforeItem, this.items);

		var afterItemId = 0;
		var afterItem = this.getPreviousItemSibling(beforeItem);
		if (afterItem)
		{
			afterItemId = afterItem.getId();
		}

		for (var i = 0; i < items.length; i++)
		{
			items[i].visible = true;

			if(items[i].getColumn() !== this)
			{

				items[i].getColumn().decPrice(items[i].data.price);
				items[i].getColumn().renderSubTitle();
				this.incPrice(items[i].data.price);
			}

			if(items[i].layout.container && items[i].layout.container.classList.contains("main-kanban-item-disabled"))
			{
				Dom.removeClass(items[i].layout.container, "main-kanban-item-disabled");
			}

			items[i].setColumnId(this.getId());

			//? setGrid

			if(items[i].checked)
			{
				items[i].unSelectItem();
			}

			var itemIndex = BX.util.array_search(items[i], this.items);

			if(beforeItem)
			{
				if (itemIndex >= 0)
				{
					this.items.splice(itemIndex, 0, items[i]);
				}
				else
				{
					this.items.splice(index, 0, items[i]);
				}
			}
			else
			{
				this.items.splice(this.items.length, 0, items[i]);
			}

			if(items[i].isCountable())
			{
				this.incrementTotal();
			}

			items[i].parentColumn = null;

			forSend.push(items[i].getId());
		}

		const columnId = this.getId();
		const params = {
			action: 'status',
			entity_id: forSend,
			prev_entity_id: afterItemId,
			status: columnId,
		}
		const grid = this.getGrid();

		grid.ajax(
			params,
			(data) => {
				this.prepareGridAfterItemsAdded(items, data);
				this.registerAnalyticsChangeStageEvent(items, data);
			},
			(error) => {
				grid.registerAnalyticsChangeStageEvent(items[0], this.getData().type, forSend, BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR)
				BX.Kanban.Utils.showErrorDialog(`Error: ${error}`, true);
			}
		);

		if (grid.isRendered())
		{
			// crutches for real total items
			const arr = [];

			for (const prop in this.items)
			{
				if (!BX.util.in_array(this.items[prop].id, arr))
				{
					arr.push(this.items[prop].id);
				}
			}

			this.render();
		}
	}

	registerAnalyticsChangeStageEvent(items, data)
	{
		if (!Type.isObjectLike(data))
		{
			return;
		}

		const grid = this.getGrid()
		const itemsIds = [];
		for (var i = 0; i < items.length; i++)
		{
			itemsIds.push(items[i].getId());
		}

		let status = '';
		if (data.errorCode && data.errorCode === 'CRM_FIELD_ERROR_REQUIRED')
		{
			status = BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR_FILLING_FIELDS
		}
		else
		{
			status = grid.hasResponseError(data) ? BX.Crm.Integration.Analytics.Dictionary.STATUS_ERROR : BX.Crm.Integration.Analytics.Dictionary.STATUS_SUCCESS;
		}

		grid.registerAnalyticsChangeStageEvent(items[0], this.getData().type, itemsIds, status);
	}

	prepareGridAfterItemsAdded(itemIds, data)
	{
		if (!Type.isObjectLike(data))
		{
			return;
		}

		const { grid } = this;
		if (grid.hasResponseError(data))
		{
			grid.clearItemMoving();
			grid.rollbackItemsMovement(itemIds, this.getId());
			grid.showResponseError(data);

			return;
		}

		if (data.isShouldUpdateCard)
		{
			const useAnimation = (!Array.isArray(itemIds) || itemIds.length <= 1);
			void this.getGrid().loadNew(itemIds, false, true, true, useAnimation);
		}
	}

	hasLoading()
	{
		if (!this.getGrid().getData().skipColumnCountCheck)
		{
			return super.hasLoading();
		}

		if (!this.canLoadMoreItems)
		{
			this.showTotalCount();

			return false;
		}

		return (super.getItemsCount() > 0);
	}

	onDragDrop(itemNode, x, y)
	{
		this.hideDragTarget();

		var event,
			success;

		var draggableItem = this.getGrid().getItemByElement(itemNode);

		event = new BX.Kanban.DragEvent();
		event.setItem(draggableItem);
		event.setTargetColumn(this);


		BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onBeforeItemMoved", [event]);

		if (!event.isActionAllowed())
		{
			return;
		}

		success = this.getGrid().moveItem(draggableItem, this);

		if (success)
		{
			BX.onCustomEvent(this.getGrid(), "Kanban.Grid:onItemMoved", [draggableItem, this, null]);
		}
	}

	/**
	 * Saving quick editor form.
	 * @return void
	 */
	processQuickEditor()
	{
		this.editor.save();
	}

	/**
	 * Reset loaded editor form.
	 * @returns {void}
	 */
	resetQuickEditor()
	{
		this.editorNodeContainer.style.height = this.editorNodeContainer.offsetHeight + "px";
		this.editorNodeContainer.innerHTML = "";
	}

	/**
	 * Gets quick editor instance.
	 * @return {BX.Crm.EntityEditor}
	 */
	getQuickEditor()
	{
		return this.editor;
	}

	/**
	 * Show quick editor form.
	 * @param {boolean} hidden
	 * @returns {void}
	 */
	showQuickEditor(hidden)
	{
		if(!hidden)
		{
			this.editorOpen = true;
		}

		this.getBody().scrollTop = 0;

		var gridData = this.getGridData();
		var entityType = gridData.entityType;
		var categoryId = gridData.params.CATEGORY_ID
						? parseInt(gridData.params.CATEGORY_ID)
						: 0;
		this.editorId = "quick_editor_v6_" + this.getId() + "_" + entityType.toLowerCase() + "_" + categoryId;

		if (!this.getGrid().getTypeInfoParam('isQuickEditorEnabled'))
		{
			return;
		}
		var isFactoryBasedApproach = this.getGrid().getTypeInfoParam('useFactoryBasedApproach');
		if (
			typeof gridData.quickEditorPath[entityType.toLowerCase()] === "undefined"
			&& !isFactoryBasedApproach
		)
		{
			return;
		}

		var params = gridData.params;
		params['VIEW_MODE'] = gridData.viewMode;

		var context = {
			PARAMS: params,
		};
		context[this.getGrid().getTypeInfoParam('stageIdKey')] = this.getId();

		// fields for form
		var formFields = this.getGrid().getTypeInfoParam('defaultQuickFormFields');

		if (!this.editorNodeContainer.innerHTML)
		{
			if(!hidden)
			{
				this.layout.subTitleAddButton.classList.add("crm-kanban-column-add-item-button-wait");
				this.disabledAddButton();
			}

			const analyticsConfig = {
				data: BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(entityType)
					.setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN)
					.setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_QUICK_BUTTON)
					.buildData()
				,
			};

			if (isFactoryBasedApproach)
			{
				BX.ajax.runAction('crm.api.item.getEditor',  {
					data: {
						entityTypeId: gridData.entityTypeInt,
						id: 0,
						stageId: this.getId(),
						categoryId: gridData.params.CATEGORY_ID ? gridData.params.CATEGORY_ID : 0,
						guid: this.editorId,
						configId: gridData.editorConfigId,
						viewMode: gridData.viewMode,
						params: {
							'ENABLE_PERSONAL_CONFIGURATION_UPDATE': true,
							'ENABLE_COMMON_CONFIGURATION_UPDATE': true,
							'ENABLE_CONFIG_SCOPE_TOGGLE': true,
							'ENABLE_SETTINGS_FOR_ALL': true,
							'POST_FORM_ANALYTICS_DATA': analyticsConfig,
							'HOST_COLUMN_FOR_QUICK_EDITOR_ID': this.getId().toString(),
						}
					}
				}).then((response) => {
					var result = BX.processHTML(response.data.html);

					this.editorNodeContainer.innerHTML = response.data.html;
					this.editorNodeContainer.appendChild(this.editorNodeCreate);

					this.editorNode.style.height = "0px";

					BX.ajax.processScripts(result.SCRIPT, undefined, () => {
						var interval = setInterval(() => {
							if (this.editorNodeContainer.offsetHeight < 150)
							{
								return
							}

							if (!this.editorOpen)
							{
								this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
								return;
							}
							if (hidden)
							{
								return;
							}

							this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";
							this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");

							var autoHideEditor = () => {
								this.editorNode.style.height = null;
								Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
							};

							Event.bind(this.editorNode, 'transitionend', autoHideEditor);
							clearInterval(interval);
						}, 100);
					});
				});
			}
			else
			{
				BX.ajax.post(
					gridData.quickEditorPath[entityType.toLowerCase()],
					{
						ACTION: "PREPARE_EDITOR_HTML",
						ACTION_ENTITY_TYPE_NAME: entityType,
						ACTION_ENTITY_ID: 0,
						GUID: this.editorId,
						CONFIG_ID: gridData.editorConfigId,
						FORCE_DEFAULT_CONFIG: "N",
						FORCE_DEFAULT_OPTIONS: "Y",
						IS_EMBEDDED: "Y",
						ENABLE_CONFIG_SCOPE_TOGGLE: "Y",
						ENABLE_CONFIGURATION_UPDATE: "Y",
						ENABLE_REQUIRED_USER_FIELD_CHECK: "Y",
						ENABLE_FIELDS_CONTEXT_MENU: "N",
						FIELDS: formFields,
						CONTEXT: context,
						POST_FORM_ANALYTICS_DATA: analyticsConfig,
						HOST_COLUMN_FOR_QUICK_EDITOR_ID: this.getId().toString(),
					},
					(result) => {
						this.editorNodeContainer.innerHTML = result;
						this.editorNodeContainer.appendChild(this.editorNodeCreate);

						if (!this.editorOpen)
						{
							this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");
							return;
						}

						if (hidden)
						{
							return;
						}

						this.editorNode.style.height = "0px";

						var interval = setInterval(() => {
							if (this.editorNodeContainer.offsetHeight < 150)
							{
								return
							}

							this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";
							this.layout.subTitleAddButton.classList.remove("crm-kanban-column-add-item-button-wait");

							var autoHideEditor = () => {
								this.editorNode.style.height = null;
								Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
							};

							Event.bind(this.editorNode, 'transitionend', autoHideEditor);
							clearInterval(interval);
						}, 100);
					}
				);
			}
		}
		else
		{
			this.getLoader().hide();
			this.hideQuickEditorLoader();
		}

		// catch editor instance after load
		if (!this.editorLoaded)
		{
			BX.addCustomEvent(
				window,
				"BX.Crm.EntityEditor:onInit",
				(sender, eventArgs) => {
					if (sender.getId() === this.editorId)
					{
						this.editor = sender;
					}
				}
			);

			BX.addCustomEvent(
				window,
				'onCrmEntityCreateError',
				({ error, checkErrors }) => {
					this.hideQuickEditorLoader();

					if (Type.isUndefined(error))
					{
						return;
					}

					if (Type.isObject(checkErrors))
					{
						this.openQuickFormPartialEditor(Object.keys(checkErrors));
					}
					else if (Type.isStringFilled(error))
					{
						BX.UI.Notification.Center.notify({
							content: Text.encode(error.replaceAll('<br />','\n')),
							autoHideDelay: 5000,
						});
					}
				}
			);

			if (!this.cancelEditHandler)
			{
				this.cancelEditHandler = ((params) => {
					this.hideQuickEditorLoader();
				});

				BX.addCustomEvent(
					window,
					"BX.Crm.EntityEditor:onFailedValidation",
					this.cancelEditHandler
				);

				BX.addCustomEvent(
					window,
					"BX.Crm.EntityEditor:onRestrictionAction",
					this.cancelEditHandler
				);
			}

			BX.addCustomEvent(
				window,
				'BX.Crm.EntityEditorAjax:onSubmitFailure',
				(errors) => {
					if(this.editorOpen)
					{
						this.quickFormSaveButtonInstance.setWaiting(false);
						this.editorNode.classList.remove("crm-kanban-quick-form-wait");

						var message = '';
						var requiredFields = [];
						for (var i in errors)
						{
							if(errors.hasOwnProperty(i) && errors[i].message)
							{
								if(
									errors[i].code === 'CRM_FIELD_ERROR_REQUIRED'
									&& errors[i].customData
									&& errors[i].customData.fieldName
								)
								{
									requiredFields.push(errors[i].customData.fieldName);
								}
								message += errors[i].message + ', ';
							}
						}

						if(requiredFields.length > 0)
						{
							this.openQuickFormPartialEditor(requiredFields);
						}
						else
						{
							BX.Kanban.Utils.showErrorDialog(Text.encode(message), true);
						}
					}
				}
			);

			BX.addCustomEvent(
				window,
				"onCrmEntityCreate",
				(entityData) => {
					var context = entityData.sender.getContext();
					var statusKey = this.getGrid().getTypeInfoParam('stageIdKey');
					if (context[statusKey] === this.getId())
					{
						this.getGrid().loadNew(
							entityData.entityId,
							true,
							false,
							false,
							true,
						);
					}

					if(this.editorOpen)
					{
						this.hideQuickEditorLoader();
						entityData.isCancelled = true;
					}
				}
			);

			var currentColumn = this;

			BX.addCustomEvent("CRM.Kanban.Column:clickAddButton", function() {
				if(currentColumn !== this)
				{
					currentColumn.closeQuickFormEditor();
				}
			});

			Event.bind(window, "keydown", (ev) => {
				if(	ev.code === "MetaRight" ||
					ev.code === "MetaLeft" ||
					ev.code === "ControlRight" ||
					ev.code === "ControlLeft" )
				{
					this.isKeyMetaPressed = true;
				}
			});

			Event.bind(window, "keyup", (ev) => {
				const codes = [
					'MetaRight',
					'MetaLeft',
					'ControlRight',
					'ControlLeft',
				];

				if (codes.includes(ev.code))
				{
					this.isKeyMetaPressed = false;
				}
			});

			Event.bind(window, "keydown", (ev) => {
				if(
					(ev.code === "Enter" || ev.code === "NumpadEnter")
					&& this.isKeyMetaPressed && this.editorOpen)
				{
					this.processQuickEditor();
					if (this.editor.isRequestRunning())
					{
						this.showQuickEditorLoader();
					}
					BX.PreventDefault(ev);
				}
			});

			BX.addCustomEvent(window, "BX.CRM.Kanban.Item.select", this.closeQuickFormEditor.bind(this));
			//BX.addCustomEvent(window, "Kanban.Column:render", this.hideQuickFormEditor.bind(this));
			BX.addCustomEvent(window, "onCrmEntityCreate", this.hideQuickFormEditor.bind(this));
			BX.addCustomEvent(window, "Kanban.Column:render", this.enabledAddButton.bind(this));
			BX.addCustomEvent(window, "Kanban.Grid:onItemDragStart", this.enabledAddButton.bind(this));
			BX.addCustomEvent(window, "Kanban.Grid:onItemDragStart", () => {
				if(this.editorOpen)
				{
					Event.bind(this.editorNode, "transitionend", () => {
						for (var i = 0; i < this.items.length; i++)
						{
							this.items[i].makeDroppable();
						}
					})
				}

				this.hideQuickFormEditor();
				this.enabledAddButton();
				this.cleanEditor();
			});
		}

		this.editorLoaded = true;

		this.layout.items.insertBefore(this.editorNode, this.layout.items.firstChild);
	}

	openQuickFormPartialEditor(fieldNames)
	{
		if (
			!this.editorOpen
			||
			(this.quickFormPartialEditor && this.quickFormPartialEditor._isLocked)
		)
		{
			return;
		}
		var formData = new FormData(this.editor._ajaxForm._elementNode),
			presetValues = {};

		var formDataEntries = formData.entries(),
			formDataEntry = formDataEntries.next(),
			pair;

		while (!formDataEntry.done) {
			pair = formDataEntry.value;
			if (presetValues[pair[0]] === undefined)
			{
				presetValues[pair[0]] = [];
			}
			presetValues[pair[0]].push(pair[1]);
			formDataEntry = formDataEntries.next();
		}

		var gridData = this.grid.getData();
		var context = {};
		context[this.getGrid().getTypeInfoParam('stageIdKey')] = this.id;
		context['NOT_CHANGE_STATUS'] = 'Y';

		var settings = {
			entityTypeId: gridData.entityTypeInt,
			entityId: 0,
			fieldNames: fieldNames,
			context: context,
			values: [],
			presetValues: presetValues,
			analyticsConfig: {
				data: BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(gridData.entityType)
					.setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN)
					.setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_FILL_REQUIRED_FIELDS_POPUP)
					.buildData()
				,
			},
		};

		if(this.getGrid().getTypeInfoParam('useFactoryBasedApproach'))
		{
			settings.title = Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
			settings.isController = true;
			settings.entityTypeName = gridData.entityType;
			settings.stageId = this.getId();

			if (gridData.params.CATEGORY_ID)
			{
				settings.categoryId = gridData.params.CATEGORY_ID;
			}
		}
		else
		{
			settings.title = Loc.getMessage(
				"CRM_KANBAN_REQUIRED_FIELDS_TITLE_" + gridData.entityType
			)
		}

		this.quickFormPartialEditor = BX.Crm.QuickFormPartialEditorDialog.create(
			"quickform-partial-entity-editor",
			settings
		);
		this.quickFormPartialEditor.open();
	}

	isEditorOpen()
	{
		return this.editorOpen;
	}

	showQuickEditorLoader()
	{
		this.quickFormSaveButtonInstance.setWaiting(true);
		this.editorNode.classList.add("crm-kanban-quick-form-wait");
	}

	hideQuickEditorLoader()
	{
		this.quickFormSaveButtonInstance.setWaiting(false);
		this.editorNode.classList.remove("crm-kanban-quick-form-wait");
	}

	closeQuickFormEditor()
	{
		if (!this.editorOpen)
		{
			return Promise.resolve(true);
		}

		if (!this.editor || !this.editor.hasChangedControls())
		{
			this.enabledAddButton();
			this.hideQuickFormEditor();
			this.cleanEditor();

			return Promise.resolve(true);
		}

		const confirmDialogId = 'kanban_close_quick_editor_confirm';
		const confirmDialog =
			BX.Crm.ConfirmationDialog.get(confirmDialogId)
			?? BX.Crm.ConfirmationDialog.create(
				confirmDialogId,
				{
					title: Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_TITLE'),
					content: Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_CONTENT'),
					cancelButtonTitle: Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_CANCEL_BUTTON'),
					acceptButtonTitle: Loc.getMessage('CRM_KANBAN_CLOSE_QUICK_EDITOR_ACCEPT_BUTTON'),
				},
			);

		return confirmDialog.open().then((result) => {
			if (BX.prop.getBoolean(result, 'cancel', true))
			{
				return false;
			}

			this.enabledAddButton();
			this.hideQuickFormEditor();
			this.cleanEditor();

			return true;
		});
	}

	/**
	 * Hide quick form editor.
	 * @return {void}
	 */
	hideQuickFormEditor()
	{
		if(!this.editorOpen)
		{
			return
		}

		this.editorOpen = false;
		this.editorNode.style.height = this.editorNode.offsetHeight + "px";

		setTimeout(() => {
			this.editorNode.style.height = "0px";
		}, 10);
	}

	disabledAddButton()
	{
		Dom.addClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event");
	}

	enabledAddButton()
	{
		Dom.removeClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event");
	}

	/**
	 * Is quick form popup?
	 * @param {Element} target
	 * @return {boolean}
	 */
	isQuickFormPopup(target)
	{
		return BX.findParent(target, {
			className: "popup-window"
		});
	}

	/**
	 * Is target bound to document or was removed in another callback of this onclick event?
	 * @param {Element} target
	 * @return {boolean}
	 */
	isBoundToDocument(target)
	{
		return !!target.closest('body');
	}

	/**
	 * Is quick form editor?
	 * @param {Element} target
	 * @return {boolean}
	 */
	isQuickFormEditor(target)
	{
		return BX.findParent(target, {
			className: "ui-entity-editor-column-content"
		});
	}

	/**
	 * @returns {HTMLElement}
	 */
	renderSubTitle()
	{
		if (this.canAddItem === null)
		{
			this.canAddItem = true;
		}

		this.createSubTitlePrice();

		if (this.subtitleNode)
		{
			return this.subtitleNode;
		}

		// create sum and button if no exists
		let plusTitle = '';
		let	quickForm = true;

		const data = this.getData();
		const gridData = this.getGridData();

		if (data.sort === 100 && this.getGrid().getTypeInfoParam('hasPlusButtonTitle'))
		{
			plusTitle = gridData.isDynamicEntity
				? Loc.getMessage('CRM_KANBAN_PLUS_TITLE_DYNAMIC')
				: (Loc.getMessage(`CRM_KANBAN_PLUS_TITLE_${gridData.entityType}`) || Loc.getMessage(`CRM_KANBAN_PLUS_TITLE_${gridData.entityType}_MSGVER_1`));
		}

		if (quickForm)
		{
			this.editorNode = Dom.create("div", {
				props: {
					className: "crm-kanban-quick-form --ui-context-content-light"
				},
				style: {
					height: "0px"
				},
				children: [
					this.editorNodeContainer = Dom.create("div", {
						props: {
							className: "crm-kanban-quick-form-container"
						}
					})
				]
			});

			this.quickFormSaveButtonInstance = new Button({
				text: Loc.getMessage("CRM_KANBAN_POPUP_SAVE"),
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				onclick: () => {
					this.processQuickEditor();
					this.showQuickEditorLoader();
				},
			});

			this.quickFormCancelButtonInstance = new Button({
				text: Loc.getMessage("CRM_KANBAN_CONFIRM_N"),
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				onclick: () => {
					this.enabledAddButton();
					this.hideQuickFormEditor();
					this.cleanEditor();
				},
			});

			this.editorNodeCreate = Dom.create("div", {
				props: {
					className: "crm-kanban-quick-form-buttons"
				},
				children: [
					this.quickFormSaveButtonInstance.render(),
					this.quickFormCancelButtonInstance.render(),
				]
			})
		}

		var stageIdKey = this.getGrid().getTypeInfoParam('stageIdKey');
		stageIdKey = stageIdKey.toLowerCase();

		if (
			this.canAddItem
			&& this.getGrid().getTypeInfoParam('isQuickEditorEnabled')
		)
		{
			this.layout.subTitleAddButton = Dom.create("div", {
				text: plusTitle,
				attrs: {
					className: "crm-kanban-column-add-item-button"
				},
				events: {
					click: quickForm
						? (ev) => {
							const tariffRestrictions = gridData.tariffRestrictions || {};
							if (tariffRestrictions.addItemNotPermittedByTariff === true)
							{
								BX.Crm.Router.Instance.showFeatureSlider();
								return;
							}
						// @todo Checking bx-ie is still actually?
							if(document.getElementsByTagName("html")[0].classList.contains("bx-ie"))
							{
								if(gridData.entityType === "LEAD")
								{
									SidePanel.Instance.open("/crm/lead/details/0/?category_id=" + gridData.params.CATEGORY_ID);
								}
								else if(gridData.entityType === "DEAL")
								{
									SidePanel.Instance.open("/crm/deal/details/0/");
								}
								return;
							}

							if(BX.hasClass(this.layout.subTitleAddButton, "crm-kanban-column-add-item-button-event"))
							{
								return;
							}

							this.disabledAddButton();

							if(!this.editorNodeContainer.innerHTML)
							{
								const openColumn = this.getGrid().getColumnWithOpenEditor(this);

								const releaseAllOtherColumns = () => {
									const columns = this.getGrid().getColumns();
									for (let i = 0; i < columns.length; i++)
									{
										if (columns[i] !== this)
										{
											if (columns[i].editor)
											{
												columns[i].editor.release();
												columns[i].editor = null;
												columns[i].editorOpen = false;
												columns[i].editorLoaded = false;
												BX.cleanNode(columns[i].editorNodeContainer);
											}

											columns[i].hideQuickFormEditor();
											columns[i].enabledAddButton();
											columns[i].cleanEditor();
										}
									}
								};

								if (openColumn)
								{
									openColumn.closeQuickFormEditor().then((closed) => {
										if (!closed)
										{
											this.enabledAddButton();
											return;
										}

										releaseAllOtherColumns();
										this.showQuickEditor();
									});

									return;
								}

								releaseAllOtherColumns();
								this.showQuickEditor();
								return;
							}

							const openEditor = () => {
								BX.onCustomEvent(this, "CRM.Kanban.Column:clickAddButton", this);

								if(!this.editorNode.parentNode)
								{
									this.layout.items.insertBefore(this.editorNode, this.layout.items.firstElementChild);
								}

								this.getBody().scrollTop = 0;

								this.editorNode.style.height = "0px";
								this.editorOpen = true;

								setTimeout(() => {
									this.editorNode.style.height = this.editorNodeContainer.offsetHeight + "px";

									const autoHideEditor = () => {
										this.editorNode.style.height = null;
										Event.unbind(this.editorNode, 'transitionend', autoHideEditor);
									};

									Event.bind(this.editorNode, 'transitionend', autoHideEditor);


									if(this.editor)
									{
										this.editor.refreshLayout({ reset: true });
									}
								}, 10);
							};

							const openColumn = this.getGrid().getColumnWithOpenEditor(this);

							if (openColumn)
							{
								openColumn.closeQuickFormEditor().then((closed) => {
									if (!closed)
									{
										this.enabledAddButton();
										return;
									}
									openEditor();
								});
							}
							else
							{
								openEditor();
							}
						}
						: null
				}
			});
		}
		else if (this.canAddItem)
		{
			this.layout.subTitleAddButton = (
				this.getAddPath()
					? Dom.create("a", {
						text: plusTitle,
						attrs: {
							className: "crm-kanban-column-add-item-button",
							href: this.getAddPath() + stageIdKey + '=' + this.getId()
						},
					}) : null
			);
		}
		else if (this.isShowHiddenAddItemButton())
		{
			this.layout.subTitleAddButton = Tag.render`
				<div class="crm-kanban-column-add-item-button--dummy"</div>
			`;
		}

		this.subtitleNode = Dom.create("div", {
			children: [
				this.layout.subTitlePrice,
				quickForm
				// quick form for some types and first column
				? this.layout.subTitleAddButton
				// just a button for new window
				: (
					this.getAddPath()
						? Dom.create("a", {
							text: plusTitle,
							attrs: {
								className: "crm-kanban-column-add-item-button",
								href: this.getAddPath() + stageIdKey + '=' + this.getId()
							}
						}) : null
				),
				this.editorNode
			]
		});

		return this.subtitleNode;
	}

	createSubTitlePrice()
	{
		this.createSubTitlePriceLayout();
		this.renderSubTitlePrice();
	}

	createSubTitlePriceLayout()
	{
		const isShowTotalPrice = this.getGrid().getTypeInfoParam('showTotalPrice');

		if (isShowTotalPrice && !this.layout.subTitlePrice)
		{
			this.layout.subTitlePriceText = Tag.render`<span class="crm-kanban-total-price-total"></span>`;
			this.layout.subTitlePrice = Tag.render`<div class="crm-kanban-total-price">`;

			Dom.append(this.layout.subTitlePriceText, this.layout.subTitlePrice);
		}
		else if (!isShowTotalPrice)
		{
			this.layout.subTitlePrice = null;
		}

		if (this.isHiddenTotalSum())
		{
			const { subTitlePriceText } = this.layout;

			Event.unbindAll(subTitlePriceText, 'mouseenter');
			Event.unbindAll(subTitlePriceText, 'mouseleave');
			Event.bind(subTitlePriceText, 'mouseenter', this.onSubTitlePriceMouseEnter.bind(this));
			Event.bind(subTitlePriceText, 'mouseleave', this.onSubTitlePriceMouseLeave.bind(this));
		}
	}

	onSubTitlePriceMouseEnter()
	{
		this.columnSumPopup = PopupManager.create(
			this.getHideColumnSumPopupId(),
			this.layout.subTitlePriceText,
			{
				autoHide: true,
				angle: true,
				animation: 'fading',
				darkMode: true,
				offsetTop: -10,
				offsetLeft: this.layout.subTitlePriceText.offsetWidth / 2,
				content: Loc.getMessage('CRM_KANBAN_COLUMN_HIDDEN_SUM'),
				bindOptions: {
					position: 'top',
				},
				params: {
					angleLeftOffset: 200,
				},
			}
		);

		this.columnSumPopup.show();
	}

	getHideColumnSumPopupId()
	{
		return `kanban-column-${this.getId()}-hidden-sum-popup`;
	}

	onSubTitlePriceMouseLeave()
	{
		this.columnSumPopup.close();
	}

	renderSubTitlePrice()
	{
		if (!this.layout.subTitlePriceText)
		{
			return;
		}

		if (this.isHiddenTotalSum())
		{
			this.renderHiddenTotalSum();
		}
		else
		{
			this.animateChangeSubTitlePrice();
		}
	}

	renderHiddenTotalSum()
	{
		if (!this.layout.subTitlePriceText || !this.isHiddenTotalSum())
		{
			return;
		}

		const { currencyFormat } = this.getData();

		this.layout.subTitlePriceText.innerHTML = `***** ${currencyFormat}`;
	}

	animateChangeSubTitlePrice()
	{
		const data = this.getData();

		data.sum = parseFloat(data.sum);
		data.sum_init = data.sum;
		data.sum_old = data.sum_old ? data.sum_old : data.sum_init;

		if (this.subTitleAnimationInterval)
		{
			clearInterval(this.subTitleAnimationInterval);
		}

		const currency = this.getGridData().currency;

		this.subTitleAnimationInterval = this.renderSubTitleAnimation(
			data.sum_old,
			data.sum,
			Math.abs(data.sum_old - data.sum) / 20,
			this.layout.subTitlePriceText,
			(element, value) => {
				element.innerHTML = this.currencyFormat(Math.round(value), currency, true);
				data.sum_old = data.sum;
			}
		);

		this.setData(data);
	}

	isHiddenTotalSum()
	{
		const { hiddenTotalSum } = this.getData();

		return Boolean(hiddenTotalSum);
	}

	isShowHiddenAddItemButton()
	{
		const columns = this.getGrid().getColumns();
		return columns.some(column => column.canAddItem);
	}

	cleanEditorNode()
	{
		BX.cleanNode(this.editorNodeContainer);
	}

	cleanEditor()
	{
		if(this.editor) {
			this.editor.rollback();
			this.editor.refreshLayout();
		}
	}

	/**
	 * Gets system loader.
	 * @return {Element}
	 */
	getLoader()
	{
		if(!this.loader)
		{
			this.loader = new Loader({
				target: this.editorNode
			});
		}

		return this.loader;
	}

	/**
	 * Animate change from start to val with step in element.
	 * @param {Number} start
	 * @param {Number} value
	 * @param {Number} step
	 * @param {DOM} element
	 * @param {Function} finalCall Call finally for element with val.
	 * @returns {number | null}
	 */
	renderSubTitleAnimation(start, value, step, element, finalCall)
	{
		var i = start;
		var val = parseFloat(value);
		var timeout = this.renderSubtitleTime;

		if (i === val)
		{
			if (typeof finalCall === 'function')
			{
				finalCall(element, value);
			}

			return null;
		}

		var sign = (start > value ? 'minus' : 'plus');

		var condition = function(currentValue){
			return (sign === 'plus' ? (value < currentValue) : (value > currentValue));
		};

		if (start > val)
		{
			step = -1 * step;
		}

		var timer = setInterval(function() {
			element.textContent = BX.util.number_format(i, 0, ",", " ");
			i += step;
			if (condition(i))
			{
				clearInterval(timer);
				this.subTitleAnimationInterval = null;
				finalCall(element, value);
			}
		}.bind(this), timeout);

		return timer;
	}

	handleAddColumnButtonClick(event)
	{
		const gridData = this.getGridData();

		if (gridData.rights?.canAddColumn)
		{
			const newColumn = this.getGrid().addColumn({
				id: "kanban-new-column-" + BX.util.getRandomString(5),
				type: "BX.CRM.Kanban.DraftColumn",
				canSort: false,
				canAddItem: false,
				droppable: false,
				targetId: this.getGrid().getNextColumnSibling(this)
			});

			newColumn.switchToEditMode();
		}
		else if (gridData.isLockedEntity)
		{
			this.getGrid().showLockedEntitySlider();
		}
		else if (!Type.isUndefined(BX.Intranet))
		{
			this.getGrid().accessNotify();
		}
	}

	switchToEditMode()
	{
		const gridData = this.getGridData();

		if (gridData.rights?.canEditColumn)
		{
			super.switchToEditMode();
		}
		else if (gridData.isLockedEntity)
		{
			this.getGrid().showLockedEntitySlider();
		}
		else if (!Type.isUndefined(BX.Intranet))
		{
			this.getGrid().accessNotify();
		}
	}

	focusTextBox()
	{
		setTimeout(() => {
			this.getTitleTextBox().focus();
		})
	}

	makeDroppable()
	{
		if (!this.isDroppable())
		{
			return;
		}

		var columnBody = this.getBody();

		columnBody.onbxdestdraghover = this.onDragEnter.bind(this);
		columnBody.onbxdestdraghout = this.onDragLeave.bind(this);
		columnBody.onbxdestdragfinish = this.onDragDrop.bind(this);

		columnBody.onbxdestdragstop = this.onItemDragEnd.bind(this);

		jsDD.registerDest(columnBody, 10);

		this.disableDropping();
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} itemToRemove
	 */
	removeItem(itemToRemove)
	{
		return new Promise((resolve, reject) => {
			var found = false;
			this.items = this.items.filter(function(item) {

				if (item === itemToRemove)
				{
					found = true;
					return false;
				}

				return true;
			});

			if (found)
			{
				const currentOpacityPercent = itemToRemove.layout.container.style.opacity * 100;
				const useAnimation = (currentOpacityPercent === 100 ? itemToRemove.useAnimation : false);

				this.setPullItemBackground(itemToRemove);
				itemToRemove.animate({
					useAnimation,
					duration: this.getGrid().animationDuration,
					draw: function(progress) {
						const opacity = currentOpacityPercent - progress * currentOpacityPercent + '%';
						itemToRemove.layout.container.style.opacity = opacity;
					},
				}).then((value) => {
					if (itemToRemove.isCountable() && itemToRemove.isVisible())
					{
						this.decrementTotal();
						this.getGrid().resetMultiSelectMode();
					}
					if (this.getGrid().isRendered())
					{
						this.render();
					}
					resolve();
				});
			}
			else
			{
				resolve();
			}
		});
	}

	/**
	 *
	 * @param {BX.CRM.Kanban.Item} item
	 * @param {string} backgroundColor
	 */
	setPullItemBackground(item, backgroundColor = '#fffabf')
	{
		if (item.changedInPullRequest && item.layout.bodyContainer.children[0])
		{
			item.layout.bodyContainer.children[0].style.backgroundColor = backgroundColor;
		}
	}

	setLoadingInProgress(value = true)
	{
		this.loadingInProgress = value;
	}

	setLoadingMoreItem(value = true)
	{
		this.canLoadMoreItems = value;
	}

	showTotalCount()
	{
		if (Dom.hasClass(this.layout.total, '--hidden'))
		{
			this.renderTitle();
			Dom.removeClass(this.layout.total, '--hidden');
		}
	}

	getTotalItem()
	{
		const totalItem = super.getTotalItem();

		if (this.getGrid().getData().skipColumnCountCheck)
		{
			totalItem.classList.add('--hidden');
		}

		return totalItem;
	}

	cleanLayoutItems()
	{
		var childNodes = Array.from(this.layout.items.childNodes);
		childNodes.map((item, index) => {
			if (item.classList.contains('main-kanban-item'))
			{
				this.layout.items.removeChild(item);
			}
		});
	}

	hasItem(id)
	{
		return this.items.some((item) => item.id === id);
	}
}

export class DraftColumn extends BX.Kanban.DraftColumn
{
	constructor(options)
	{
		super(options);
	}

	handleRemoveButtonClick(event)
	{
		this.getGrid().getColumns().forEach(function(column){
			column.getAddColumnButton().style.visibility = null;
		});
		super.handleRemoveButtonClick(event);
	}
}
