import { Type, Dom, Event, Loc, Runtime, Tag, Text } from 'main.core';
import 'main.kanban';
import { Loader } from 'main.loader';
import { PopupManager } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Hint } from 'ui.hint';

import { CurrencyCore } from 'currency.currency-core';

import { getStageTextColor } from 'crm.stage.color';

import { applyStageTitleTextColor } from './stage-title-color';

// Grace period that lets the pointer travel from the total onto the hint itself.
const HIDDEN_SUM_HINT_CLOSE_DELAY = 300;
let stageDescriptionTooltipLoadPromise = null;
let stageDescriptionTooltipOwnerToken = null;

function loadStageDescriptionTooltip()
{
	stageDescriptionTooltipLoadPromise ??= Runtime
		.loadExtension('crm.stage.description-tooltip')
		.then(({ StageDescriptionTooltip }) => new StageDescriptionTooltip())
		.catch((error) => {
			stageDescriptionTooltipLoadPromise = null;

			throw error;
		})
	;

	return stageDescriptionTooltipLoadPromise;
}

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
	quickFormPartialEditor = null;
	loader = null;
	isKeyMetaPressed = false;
	clickStatus = null;
	cancelEditHandler = null;
	editModeSnapshot = null;
	stageUpdateInProgress = false;
	blockSize = 20;
	canLoadMoreItems = true;
	columnSumPopup = null;
	hiddenSumHintCloseTimeout = null;
	hiddenSumHintHandlers = null;
	stageDescriptionTooltip = null;
	stageDescriptionTooltipOwnerToken = {};
	stageDescriptionTooltipRequestId = 0;

	constructor(options)
	{
		super(options);
		this.handleStageTitleMouseEnter = this.handleStageTitleMouseEnter.bind(this);
		this.handleStageTitleMouseLeave = this.handleStageTitleMouseLeave.bind(this);
		this.handleStageTitleFocusIn = this.handleStageTitleFocusIn.bind(this);
		this.handleStageTitleFocusOut = this.handleStageTitleFocusOut.bind(this);
		this.handleStageTitleMouseDown = this.handleStageTitleMouseDown.bind(this);
		this.handleStageTitleClick = this.handleStageTitleClick.bind(this);
		this.handleStageTitleKeyDown = this.handleStageTitleKeyDown.bind(this);
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
			const button = super.getAddColumnButton();
			this.makeColumnActionAccessible(
				button,
				Loc.getMessage('CRM_KANBAN_COLUMN_ADD_ARIA_LABEL', { '#NAME#': this.getName() || '' }),
				(event) => this.handleAddColumnButtonClick(event),
			);
			button.setAttribute('data-testid', 'crm-kanban-column-add-stage-btn');

			return button;
		}
	}

	/**
	 * The stage edit ("pencil") control: focusable button with a meaningful name
	 * and keyboard activation, revealed on keyboard focus as well as hover.
	 *
	 * @returns {Element}
	 */
	getEditButton()
	{
		const button = super.getEditButton();
		this.makeColumnActionAccessible(
			button,
			Loc.getMessage('CRM_KANBAN_COLUMN_EDIT_ARIA_LABEL', { '#NAME#': this.getName() || '' }),
			() => this.switchToEditMode(),
		);
		button.setAttribute('data-testid', 'crm-kanban-column-edit-btn');

		return button;
	}

	/**
	 * Makes a column action (rendered as a clickable <div>) keyboard-operable and
	 * nameable for assistive tech: adds button semantics, focusability and
	 * Enter/Space activation. Controls that are only visible on hover are revealed
	 * on keyboard focus by the :focus-visible rules of main.kanban.
	 *
	 * Semantics and handlers are set up once per node, while the name is written
	 * on every call: the same node is handed back on later renders, and by then
	 * the stage it is named after may have been renamed.
	 *
	 * @param {Element} node
	 * @param {string} ariaLabel
	 * @param {Function} onActivate
	 */
	makeColumnActionAccessible(node, ariaLabel, onActivate)
	{
		if (!Type.isDomNode(node))
		{
			return;
		}

		this.setActionAriaLabel(node, ariaLabel);

		if (node.dataset.a11yEnhanced === 'true')
		{
			return;
		}

		node.dataset.a11yEnhanced = 'true';
		node.setAttribute('role', 'button');
		node.setAttribute('tabindex', '0');

		Event.bind(node, 'keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
			{
				event.preventDefault();
				onActivate(event);
			}
		});
	}

	/**
	 * @param {?Element} node
	 * @param {string} ariaLabel
	 */
	setActionAriaLabel(node, ariaLabel)
	{
		if (!Type.isDomNode(node) || !Type.isStringFilled(ariaLabel))
		{
			return;
		}

		// Writing the same value again would make some screen readers announce the
		// control anew, and the stage is redrawn on every card added or removed.
		if (node.getAttribute('aria-label') !== ariaLabel)
		{
			node.setAttribute('aria-label', ariaLabel);
		}
	}

	/**
	 * The stage actions are named after the stage, and their nodes are created
	 * once and reused: the title layout, the add-stage button and the compact
	 * add-item button all survive a redraw. Renaming a stage therefore has to
	 * rewrite their names explicitly, or a screen reader keeps announcing the old
	 * one (WCAG 4.1.2). The name of the stage itself is rewritten by the base
	 * render() through getColumnAriaLabel().
	 *
	 * @returns {Element}
	 */
	render()
	{
		const container = super.render();

		this.refreshActionAriaLabels();

		return container;
	}

	refreshActionAriaLabels()
	{
		const name = this.getName() || '';

		this.setActionAriaLabel(
			this.layout.editButton,
			Loc.getMessage('CRM_KANBAN_COLUMN_EDIT_ARIA_LABEL', { '#NAME#': name }),
		);
		this.setActionAriaLabel(
			this.layout.addColumnButton,
			Loc.getMessage('CRM_KANBAN_COLUMN_ADD_ARIA_LABEL', { '#NAME#': name }),
		);
		this.refreshAddItemButtonAriaLabel();
	}

	/**
	 * Makes the compact "add item" ("+") control keyboard-operable and, for the
	 * icon-only variant, gives it a meaningful name.
	 */
	enhanceAddItemButtonAccessibility()
	{
		const node = this.layout.subTitleAddButton;
		if (
			!Type.isDomNode(node)
			|| node.classList.contains('crm-kanban-column-add-item-button--dummy')
		)
		{
			return;
		}

		this.refreshAddItemButtonAriaLabel();

		if (node.dataset.a11yEnhanced === 'true')
		{
			return;
		}

		node.dataset.a11yEnhanced = 'true';
		node.setAttribute('data-testid', 'crm-kanban-column-quick-add-btn');

		// Native <a> add-buttons are already keyboard-operable; only the <div>
		// variant needs button semantics and Enter/Space activation.
		if (node.tagName === 'DIV')
		{
			node.setAttribute('role', 'button');
			node.setAttribute('tabindex', '0');
			Event.bind(node, 'keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
				{
					event.preventDefault();
					node.click();
				}
			});
		}
	}

	/**
	 * The icon-only variant of the "+" control is named after the stage; the
	 * variant with a visible caption is already named by that caption, and an
	 * author name would replace it in the name computation instead of adding to
	 * it (WCAG 4.1.2).
	 */
	refreshAddItemButtonAriaLabel()
	{
		const node = this.layout.subTitleAddButton;
		if (
			!Type.isDomNode(node)
			|| node.classList.contains('crm-kanban-column-add-item-button--dummy')
			|| Type.isStringFilled(node.textContent.trim())
		)
		{
			return;
		}

		this.setActionAriaLabel(
			node,
			Loc.getMessage('CRM_KANBAN_COLUMN_QUICK_ADD_ARIA_LABEL', { '#NAME#': this.getName() || '' }),
		);
	}

	/**
	 * Accessible name of the stage column. Overridable name hook: stage name
	 * plus the number of cards, so a screen reader announces the stage without
	 * relying on the visual counter.
	 *
	 * @returns {string}
	 */
	getColumnAriaLabel()
	{
		const name = this.getName() || '';

		return Loc.getMessagePlural(
			'CRM_KANBAN_COLUMN_ARIA_LABEL',
			this.getTotal(),
			{
				'#NAME#': name,
				'#COUNT#': this.getTotal(),
			},
		);
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
				this.prepareGridAfterItemsAdded(forSend, data);
				this.registerAnalyticsChangeStageEvent(items, data);
			},
			(error) => {
				void grid.loadNew(forSend, false, true, true, true);
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

			const eventData = BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(entityType)
				.setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN)
				.setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_QUICK_BUTTON)
				.buildData()
			;
			const postFormAnalyticsData = { data: eventData };
			const analyticsConfig = { data: [] };

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
							'POST_FORM_ANALYTICS_DATA': postFormAnalyticsData,
							ANALYTICS_CONFIG: analyticsConfig,
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
						POST_FORM_ANALYTICS_DATA: postFormAnalyticsData,
						ANALYTICS_CONFIG: analyticsConfig,
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

					if(
						this.editorOpen
						&& this.isCurrentQuickFormEditorCreateEvent(entityData)
					)
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
			BX.addCustomEvent(window, "BX.CRM.Kanban.Item.select", this.enabledAddButton.bind(this));
			//BX.addCustomEvent(window, "Kanban.Column:render", this.hideQuickFormEditor.bind(this));
			BX.addCustomEvent(window, "onCrmEntityCreate", this.completeQuickFormEditor.bind(this));
			BX.addCustomEvent(
				window,
				"Crm.QuickFormPartialEditorDialog.Close",
				this.handleQuickFormPartialEditorClose.bind(this),
			);
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
		context.PARAMS = {
			CATEGORY_ID: gridData.params.CATEGORY_ID || 0,
			VIEW_MODE: gridData.viewMode,
		};

		const eventData = BX.Crm.Integration.Analytics.Builder.Entity.AddEvent.createDefault(gridData.entityType)
			.setSubSection(BX.Crm.Integration.Analytics.Dictionary.SUB_SECTION_KANBAN)
			.setElement(BX.Crm.Integration.Analytics.Dictionary.ELEMENT_FILL_REQUIRED_FIELDS_POPUP)
			.buildData()
		;

		var settings = {
			entityTypeId: gridData.entityTypeInt,
			entityId: 0,
			fieldNames: fieldNames,
			context: context,
			values: [],
			presetValues: presetValues,
			analyticsConfig: { data: [] },
			postFormAnalyticsData: { data: eventData },
			hostColumnForQuickEditorId: this.getId().toString(),
			categoryId: (gridData.params.CATEGORY_ID || 0).toString(),
			viewMode: gridData.viewMode,
		};

		if(this.getGrid().getTypeInfoParam('useFactoryBasedApproach'))
		{
			settings.title = Loc.getMessage('CRM_TYPE_ITEM_PARTIAL_EDITOR_TITLE');
			settings.isController = true;
			settings.entityTypeName = gridData.entityType;
			settings.stageId = this.getId();
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

	handleQuickFormPartialEditorClose(sender)
	{
		if (sender === this.quickFormPartialEditor)
		{
			this.quickFormPartialEditor = null;
		}
	}

	isEditorOpen()
	{
		return this.editorOpen;
	}

	completeQuickFormEditor(entityData = null)
	{
		if(
			!this.editorOpen
			|| !this.isCurrentQuickFormEditorCreateEvent(entityData)
		)
		{
			return;
		}

		this.hideQuickEditorLoader();
		this.enabledAddButton();
		this.restoreQuickFormEntryPointFocus();
		this.hideQuickFormEditor();
		this.cleanEditor();
	}

	isCurrentQuickFormEditorCreateEvent(entityData)
	{
		if (!entityData)
		{
			return true;
		}

		const sender = entityData.sender;
		if (sender === this.editor)
		{
			return true;
		}

		const partialEditor = this.quickFormPartialEditor?.getEditor?.();

		return (
			sender === partialEditor
			&& this.quickFormPartialEditor?.isOpen?.() === true
		);
	}

	restoreQuickFormEntryPointFocus()
	{
		const activeElement = document.activeElement;
		if (this.editorNode?.contains?.(activeElement) !== true)
		{
			return;
		}

		const addItemButton = this.layout?.subTitleAddButton;
		if (addItemButton?.isConnected !== true)
		{
			return;
		}

		addItemButton.focus?.();
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

	renderTitle()
	{
		const title = super.renderTitle();
		applyStageTitleTextColor(title, getStageTextColor(this.getColor()));
		this.bindStageTooltipEvents();

		return title;
	}

	addTitleHint(element)
	{
		this.clearDefaultStageTitleHint(element);
	}

	clearDefaultStageTitleHint(element)
	{
		const hintObject = element?.closest('.main-kanban-column-title-info');
		if (!Type.isElementNode(hintObject))
		{
			return;
		}

		hintObject.removeAttribute('data-hint-init');
		hintObject.removeAttribute('data-hint');
		hintObject.removeAttribute('data-hint-no-icon');
		Hint.hide(hintObject);
	}

	bindStageTooltipEvents()
	{
		const titleNode = this.layout?.info;
		if (!Type.isElementNode(titleNode))
		{
			return;
		}

		this.clearDefaultStageTitleHint(titleNode);

		Event.unbind(titleNode, 'mouseenter', this.handleStageTitleMouseEnter);
		Event.unbind(titleNode, 'mouseleave', this.handleStageTitleMouseLeave);
		Event.unbind(titleNode, 'focusin', this.handleStageTitleFocusIn);
		Event.unbind(titleNode, 'focusout', this.handleStageTitleFocusOut);
		Event.unbind(titleNode, 'mousedown', this.handleStageTitleMouseDown);
		Event.unbind(titleNode, 'click', this.handleStageTitleClick);
		Event.unbind(titleNode, 'keydown', this.handleStageTitleKeyDown);
		titleNode.dataset.testid = `crm-kanban-stage-title-${this.getId()}`;

		Event.bind(titleNode, 'mouseenter', this.handleStageTitleMouseEnter);
		Event.bind(titleNode, 'mouseleave', this.handleStageTitleMouseLeave);
		Event.bind(titleNode, 'focusin', this.handleStageTitleFocusIn);
		Event.bind(titleNode, 'focusout', this.handleStageTitleFocusOut);
		Event.bind(titleNode, 'mousedown', this.handleStageTitleMouseDown);
		Event.bind(titleNode, 'click', this.handleStageTitleClick);
		Event.bind(titleNode, 'keydown', this.handleStageTitleKeyDown);

		if (this.isEditable())
		{
			titleNode.setAttribute('role', 'button');
			titleNode.setAttribute('tabindex', '0');
			titleNode.setAttribute('aria-haspopup', 'dialog');
		}
		else
		{
			titleNode.removeAttribute('role');
			titleNode.removeAttribute('aria-haspopup');
			if (
				Type.isStringFilled(this.getData().description)
				|| this.isStageTitleCropped()
			)
			{
				titleNode.setAttribute('tabindex', '0');
			}
			else
			{
				titleNode.removeAttribute('tabindex');
			}
		}
	}

	handleStageTitleMouseEnter()
	{
		const grid = this.getGrid();
		if (Type.isFunction(grid.isStageEditorOpenedFor) && grid.isStageEditorOpenedFor(this.getId()))
		{
			this.closeStageDescriptionTooltip();

			return;
		}

		this.showStageDescriptionTooltip();
	}

	handleStageTitleMouseLeave()
	{
		this.stageDescriptionTooltipRequestId++;
		if (stageDescriptionTooltipOwnerToken === this.stageDescriptionTooltipOwnerToken)
		{
			stageDescriptionTooltipOwnerToken = null;
			this.stageDescriptionTooltip?.hide();
		}
	}

	handleStageTitleFocusIn()
	{
		this.handleStageTitleMouseEnter();
	}

	handleStageTitleFocusOut()
	{
		this.handleStageTitleMouseLeave();
	}

	handleStageTitleMouseDown()
	{
		this.closeStageDescriptionTooltip();
	}

	handleStageTitleClick(event)
	{
		if (!this.isEditable() || event.target.closest('.main-kanban-column-edit'))
		{
			return;
		}

		event.preventDefault();
		this.switchToEditMode();
	}

	handleStageTitleKeyDown(event)
	{
		if (!this.isEditable() || !['Enter', ' '].includes(event.key))
		{
			return;
		}

		event.preventDefault();
		this.switchToEditMode();
	}

	async showStageDescriptionTooltip()
	{
		if (!Type.isStringFilled(this.getData().description) && !this.isStageTitleCropped())
		{
			this.closeStageDescriptionTooltip();

			return;
		}

		const requestId = ++this.stageDescriptionTooltipRequestId;
		let tooltip = null;
		try
		{
			tooltip = await loadStageDescriptionTooltip();
		}
		catch
		{
			return;
		}

		if (requestId !== this.stageDescriptionTooltipRequestId)
		{
			return;
		}

		this.stageDescriptionTooltip = tooltip;
		this.showLoadedStageDescriptionTooltip();
	}

	showLoadedStageDescriptionTooltip()
	{
		stageDescriptionTooltipOwnerToken = this.stageDescriptionTooltipOwnerToken;
		this.stageDescriptionTooltip.show({
			bindElement: this.getStageDescriptionTooltipBindElement(),
			focusElement: this.layout.info,
			name: this.getName(),
			description: this.getData().description ?? '',
			showName: this.isStageTitleCropped(),
		});
	}

	getStageDescriptionTooltipBindElement(): HTMLElement
	{
		return Type.isElementNode(this.layout?.color) ? this.layout.color : this.layout.info;
	}

	isStageTitleCropped(): boolean
	{
		const titleText = this.layout?.nameInner;

		return Type.isElementNode(titleText) && titleText.offsetWidth < titleText.scrollWidth;
	}

	closeStageDescriptionTooltip()
	{
		this.stageDescriptionTooltipRequestId++;
		if (stageDescriptionTooltipOwnerToken === this.stageDescriptionTooltipOwnerToken)
		{
			stageDescriptionTooltipOwnerToken = null;
			this.stageDescriptionTooltip?.hideImmediately();
		}
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
					if (!this.editor.hasUnavailableFieldsByStage(this.getId().toString()))
					{
						this.processQuickEditor();
						this.showQuickEditorLoader();
					}
				},
			});

			this.quickFormCancelButtonInstance = new Button({
				text: Loc.getMessage("CRM_KANBAN_CONFIRM_N"),
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				onclick: () => {
					this.editor?.hideUnavailableFieldsPopup();
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
												columns[i].editor.hideUnavailableFieldsPopup();
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

										if (this.editor.hasUnavailableFieldsByStage(this.getId().toString()))
										{
											this.editor.showUnavailableFieldsPopup(
												this.editorNodeCreate.firstChild,
												this.getId().toString(),
											);

											Dom.addClass(this.editorNodeCreate.firstChild, 'ui-btn-disabled');
										}
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

		this.enhanceAddItemButtonAccessibility();

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
			// The hint popup is bound to the total node, so it cannot outlive it.
			this.destroyHiddenSumHint();

			this.layout.subTitlePriceText = Tag.render`<span class="crm-kanban-total-price-total"></span>`;
			this.layout.subTitlePrice = Tag.render`<div class="crm-kanban-total-price">`;

			Dom.append(this.layout.subTitlePriceText, this.layout.subTitlePrice);
		}
		else if (!isShowTotalPrice)
		{
			this.destroyHiddenSumHint();

			this.layout.subTitlePrice = null;
			this.layout.subTitlePriceText = null;
		}

		this.updateHiddenSumHint();
	}

	/**
	 * The masked total is the trigger of the "sum is hidden" hint. WCAG 1.4.13
	 * requires such content to be dismissible, hoverable and persistent, so the
	 * hint opens on hover and on keyboard focus, closes on Escape, and survives
	 * the pointer travelling from the trigger onto the hint itself. The hint text
	 * is also the accessible name of the trigger, so a screen reader gets it
	 * without opening anything - and for the same reason the trigger does not
	 * point at the shown hint with aria-describedby, which would only repeat the
	 * name as a description.
	 */
	updateHiddenSumHint()
	{
		const trigger = this.layout.subTitlePriceText;

		this.unbindHiddenSumHintHandlers();

		if (!Type.isDomNode(trigger))
		{
			return;
		}

		if (!this.isHiddenTotalSum())
		{
			this.closeHiddenSumHint();
			['role', 'tabindex', 'aria-label', 'data-testid'].forEach((attribute) => {
				trigger.removeAttribute(attribute);
			});

			return;
		}

		trigger.setAttribute('role', 'button');
		trigger.setAttribute('tabindex', '0');
		trigger.setAttribute('aria-label', Loc.getMessage('CRM_KANBAN_COLUMN_HIDDEN_SUM'));
		trigger.setAttribute('data-testid', 'crm-kanban-column-hidden-sum-hint-btn');

		// Handlers are kept so they can be removed one by one: unbindAll would also
		// take down listeners of these events bound by anyone else.
		this.hiddenSumHintHandlers = {
			node: trigger,
			events: {
				mouseenter: this.onSubTitlePriceMouseEnter.bind(this),
				mouseleave: this.onSubTitlePriceMouseLeave.bind(this),
				focus: this.onSubTitlePriceFocus.bind(this),
				blur: this.onSubTitlePriceBlur.bind(this),
				keydown: this.onSubTitlePriceKeyDown.bind(this),
			},
		};

		Object.entries(this.hiddenSumHintHandlers.events).forEach(([eventName, handler]) => {
			Event.bind(trigger, eventName, handler);
		});
	}

	unbindHiddenSumHintHandlers()
	{
		if (!this.hiddenSumHintHandlers)
		{
			return;
		}

		const { node, events } = this.hiddenSumHintHandlers;
		Object.entries(events).forEach(([eventName, handler]) => {
			Event.unbind(node, eventName, handler);
		});

		this.hiddenSumHintHandlers = null;
	}

	onSubTitlePriceMouseEnter()
	{
		this.showHiddenSumHint();
	}

	onSubTitlePriceMouseLeave()
	{
		this.scheduleHiddenSumHintClose();
	}

	onSubTitlePriceFocus()
	{
		this.showHiddenSumHint();
	}

	onSubTitlePriceBlur(event)
	{
		// The hint may legitimately take the focus (a screen reader user walking
		// into its content), so leaving the trigger for the hint itself must not
		// close it - otherwise focus bounces between the two.
		const popupContainer = this.columnSumPopup?.getPopupContainer();
		const nextTarget = event?.relatedTarget;
		if (popupContainer && Type.isDomNode(nextTarget) && popupContainer.contains(nextTarget))
		{
			return;
		}

		this.closeHiddenSumHint();
	}

	onSubTitlePriceKeyDown(event)
	{
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		event.preventDefault();

		if (this.columnSumPopup?.isShown())
		{
			this.closeHiddenSumHint();
		}
		else
		{
			this.showHiddenSumHint();
		}
	}

	getHiddenSumPopup()
	{
		if (this.columnSumPopup)
		{
			return this.columnSumPopup;
		}

		this.columnSumPopup = PopupManager.create(
			this.getHideColumnSumPopupId(),
			this.layout.subTitlePriceText,
			{
				autoHide: true,
				closeByEsc: true,
				role: 'tooltip',
				// A tooltip must never pull the focus away from its trigger. The
				// option has to be explicit: with the focus trap accessibility
				// setting on, an omitted value means "trap enabled".
				focusTrap: false,
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

		// Keeps the hint open while the pointer is on the hint itself.
		const popupContainer = this.columnSumPopup.getPopupContainer();
		Event.bind(popupContainer, 'mouseenter', this.cancelHiddenSumHintClose.bind(this));
		Event.bind(popupContainer, 'mouseleave', this.scheduleHiddenSumHintClose.bind(this));

		return this.columnSumPopup;
	}

	showHiddenSumHint()
	{
		this.cancelHiddenSumHintClose();
		this.getHiddenSumPopup().show();
	}

	closeHiddenSumHint()
	{
		this.cancelHiddenSumHintClose();
		this.columnSumPopup?.close();
	}

	scheduleHiddenSumHintClose()
	{
		this.cancelHiddenSumHintClose();
		this.hiddenSumHintCloseTimeout = setTimeout(
			() => this.closeHiddenSumHint(),
			HIDDEN_SUM_HINT_CLOSE_DELAY,
		);
	}

	cancelHiddenSumHintClose()
	{
		if (this.hiddenSumHintCloseTimeout)
		{
			clearTimeout(this.hiddenSumHintCloseTimeout);
			this.hiddenSumHintCloseTimeout = null;
		}
	}

	/**
	 * Drops the hint entirely: the popup is bound to the total node and the close
	 * timeout would otherwise fire after that node is gone.
	 */
	destroyHiddenSumHint()
	{
		this.cancelHiddenSumHintClose();
		this.unbindHiddenSumHintHandlers();
		this.columnSumPopup?.destroy();
		this.columnSumPopup = null;
	}

	destroy()
	{
		this.destroyHiddenSumHint();

		super.destroy();
	}

	getHideColumnSumPopupId()
	{
		return `kanban-column-${this.getId()}-hidden-sum-popup`;
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

		if (gridData.rights?.areStagesEditable)
		{
			const grid = this.getGrid();
			if (Type.isFunction(grid.openStageEditorForCreate))
			{
				event.preventDefault();
				grid.openStageEditorForCreate(this);

				return;
			}

			super.handleAddColumnButtonClick(event);
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
		if (this.isStageUpdateInProgress())
		{
			return;
		}

		const gridData = this.getGridData();

		if (gridData.rights?.areStagesEditable)
		{
			const grid = this.getGrid();
			if (Type.isFunction(grid.openStageEditorForEdit))
			{
				grid.openStageEditorForEdit(this);

				return;
			}

			this.saveEditModeSnapshot();
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

	saveEditModeSnapshot()
	{
		this.editModeSnapshot = {
			name: this.getName(),
			color: this.getColor(),
		};
	}

	getEditModeSnapshot()
	{
		return this.editModeSnapshot;
	}

	restoreEditModeSnapshot(snapshot)
	{
		if (!this.isCurrentEditModeSnapshot(snapshot))
		{
			return;
		}

		this.setName(snapshot.name);
		this.setColor(snapshot.color);
		this.colorChanged = false;
		this.render();
		this.clearEditModeSnapshot(snapshot);
	}

	clearEditModeSnapshot(snapshot)
	{
		if (!this.isCurrentEditModeSnapshot(snapshot))
		{
			return;
		}

		this.editModeSnapshot = null;
	}

	isCurrentEditModeSnapshot(snapshot)
	{
		return Type.isPlainObject(snapshot) && this.editModeSnapshot === snapshot;
	}

	isStageUpdateInProgress()
	{
		return this.stageUpdateInProgress === true;
	}

	setStageUpdateInProgress(value = true)
	{
		this.stageUpdateInProgress = value;
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

	renderTitle()
	{
		const title = super.renderTitle();
		applyStageTitleTextColor(title, getStageTextColor(this.getColor()));

		return title;
	}

	handleRemoveButtonClick(event)
	{
		this.getGrid().getColumns().forEach(function(column){
			column.getAddColumnButton().style.visibility = null;
		});
		super.handleRemoveButtonClick(event);
	}
}
