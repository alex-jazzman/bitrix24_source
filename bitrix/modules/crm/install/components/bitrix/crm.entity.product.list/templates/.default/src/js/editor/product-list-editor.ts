import {ajax, Cache, Dom, Event as EventBinder, Runtime, Tag, Text, Type} from 'main.core';
import {EventEmitter} from 'main.core.events';
import {BaseEvent} from 'main.core.events';
import {Row, MODE_EDIT} from '../row/product-list-row';
import type {
	CrmEntityProductListAction,
	CrmEntityProductListProductChangeAction,
	CrmEntityProductListStateChangedAction,
	CrmEntityProductListUpdateListFieldAction,
	CrmEntityProductListYesNo,
} from '../row/product-list-row';
import {PageEventsManager} from '../page-events-manager';
import SettingsPopup from '../setting/settings-button';
import {CurrencyCore} from 'currency.currency-core';
import {ProductSelector} from 'catalog.product-selector';
import HintPopup from '../popup/hint-popup';
import {ProductModel} from 'catalog.product-model';
import {FieldHintManager} from '../popup/field-hint-manager';
import {Guide} from 'ui.tour';
import {OneCPlanRestrictionSlider} from 'catalog.tool-availability-manager';
import {SettingsHolder} from '../setting/settings-holder';
import * as calc from '../tool/calc-utils';
import {EditorEventBindings} from './editor-event-bindings';
import {EditorAjaxClient} from './editor-ajax-client';
import {EditorTotalsService} from './editor-totals-service';
import {EditorCurrencyManager} from './editor-currency-manager';
import {EditorFormManager} from './editor-form-manager';
import {EditorProductDataSerializer} from './editor-product-data-serializer';
import {EditorGridLifecycle} from './editor-grid-lifecycle';
import {EditorProductCollection} from './editor-product-collection';

import 'ui.hint';

declare const BX: any;
declare const top: any;

const DEFAULT_PRECISION: number = 2;

export class Editor extends SettingsHolder
{
	private id: string | null = null;
	public controller: any = null;
	private isChangedGrid: boolean = false;
	private isVisibleGrid: boolean = false;
	public pageEventsManager!: PageEventsManager;
	private readonly cache = new Cache.MemoryCache();

	private fieldHintManager!: FieldHintManager;
	public readonly eventBindings: EditorEventBindings;
	public readonly ajaxClient: EditorAjaxClient;
	public readonly totalsService: EditorTotalsService;
	public readonly currencyManager: EditorCurrencyManager;
	public readonly formManager: EditorFormManager;
	public readonly productDataSerializer: EditorProductDataSerializer;
	public readonly gridLifecycle: EditorGridLifecycle;
	public readonly productCollection: EditorProductCollection;

	public readonly actions = {
		disableSaveButton: 'disableSaveButton',
		productChange: 'productChange',
		productListChanged: 'productListChanged',
		updateListField: 'listField',
		stateChanged: 'stateChange',
		updateTotal: 'total'
	} as const;

	private readonly stateChange = {
		changed: false,
		sended: false
	};

	private updateFieldForList: string | null = null;

	// B3: rows added via the "Add product" button whose name-input must receive focus once,
	// after the FIRST product is selected (product change completes). Keyed by rowId
	// (prefixed, === onChange data.rowId). One-shot: removed on first hit so a later
	// variation change on the same row never steals focus (C1/B7).
	private readonly pendingFocusAfterProductSelect = new Set<string>();

	public readonly productSelectionPopupHandler = (event: Event): void => {
		const caller = 'crm_entity_product_list';
		const jsEventsManagerId = this.getSettingValue('jsEventsManagerId', '');

		const popup = new BX.CDialog({
			content_url: '/bitrix/components/bitrix/crm.product_row.list/product_choice_dialog.php?'
				+ 'caller=' + caller
				+ '&JS_EVENTS_MANAGER_ID=' + BX.util.urlencode(jsEventsManagerId)
				+ '&sessid=' + BX.bitrix_sessid(),
			height: Math.max(500, window.innerHeight - 400),
			width: Math.max(800, window.innerWidth - 400),
			draggable: true,
			resizable: true,
			min_height: 500,
			min_width: 800,
			zIndex: 800
		});

		EventEmitter.subscribeOnce(popup, 'onWindowRegister', BX.defer(() => {
			popup.Get().style.position = 'fixed';
			popup.Get().style.top = (parseInt(popup.Get().style.top) - BX.GetWindowScrollPos().scrollTop) + 'px';
		}));

		EventEmitter.subscribeOnce(window, 'EntityProductListController:onInnerCancel', BX.defer(() => {
			popup.Close();
		}));

		if (!Type.isUndefined(BX.Crm.EntityEvent))
		{
			EventEmitter.subscribeOnce(window, BX.Crm.EntityEvent.names.update, BX.defer(() => {
				requestAnimationFrame(() => {
					popup.Close();
				});
			}));
		}

		popup.Show();
	};
	public readonly productRowAddHandler = (): void => {
		if (this.getSettingValue('isOnecInventoryManagementRestricted') === true)
		{
			OneCPlanRestrictionSlider.show();

			return;
		}

		const id = this.addProductRow();
		this.pendingFocusAfterProductSelect.add(this.getRowIdPrefix() + id);
		this.focusProductSelector(id);
	};
	public readonly showSettingsPopupHandler = (): void => {
		this.getSettingsPopup().show();
	};

	public readonly onDialogSelectProductHandler = (event: BaseEvent): void => {
		const [productId] = event.getCompatData() ?? [];
		let id;
		if (this.getProductCount() > 0 || (this.productCollection.products[0] as any)?.getField('ID') <= 0)
		{
			id = this.addProductRow();
		}
		else
		{
			id = this.productCollection.products[0]?.getField('ID');
		}
		this.selectProductInRow(id, productId);
	};
	public readonly onAddViewedProductToDealHandler = (event: BaseEvent): void => {
		const [productId] = event.getCompatData() ?? [];
		let id;
		if (this.getProductCount() > 0)
		{
			id = this.addProductRow();
		}
		else
		{
			id = this.productCollection.products[0]?.getField('ID');
		}
		this.selectViewedProductInRow(id, productId);
	};
	public readonly onSaveHandler = (event: BaseEvent): void => {
		const items: Array<{fields: Record<string, any>, rowId: any}> = [];

		this.productCollection.products.forEach((product) => {
			const item = {
				fields: {...product.fields},
				rowId: product.fields.ROW_ID
			};
			items.push(item);
		});

		this.setSettingValue('items', items);
	};
	public readonly onFocusToProductList = (event: BaseEvent): void => {
		if (this.isReadOnly())
		{
			return;
		}

		let listHaveEmptyRows = false;

		for (const product of this.productCollection.products)
		{
			if (product.isEmptyRow())
			{
				listHaveEmptyRows = true;
				this.focusProductSelector(product.fields['ID']);
				break;
			}
		}

		if (!listHaveEmptyRows)
		{
			this.productRowAddHandler();
		}
	};
	public readonly onEntityUpdateHandler = (event: BaseEvent): void => {
		const [data] = event.getData();
		if (
			this.isChanged()
			&& data.entityId === this.getSettingValue('entityId')
			&& data.entityTypeId === this.getSettingValue('entityTypeId')
		)
		{
			this.setGridChanged(false);
			this.reloadGrid(false);
		}
	};
	public readonly onEditorSubmit = (event: BaseEvent): void => {
		if (!this.isLocationDependantTaxesEnabled())
		{
			return;
		}
		const entityData = event.getData()[0];
		if (!entityData || !entityData.hasOwnProperty('LOCATION_ID'))
		{
			return;
		}
		if (entityData['LOCATION_ID'] !== this.getLocationId())
		{
			this.setLocationId(entityData['LOCATION_ID']);
			this.reloadGrid(false);
		}
	};
	public readonly onInnerCancelHandler = (event: BaseEvent): void => {
		if (this.controller)
		{
			this.controller.rollback();
		}

		this.setGridChanged(false);

		EventEmitter.subscribeOnce(
			this,
			'onGridReloaded',
			() => this.actionUpdateTotalData({isInternalChanging: true})
		);
		this.reloadGrid(false);
	};
	public readonly onBeforeGridRequestHandler = (event: BaseEvent): void => {
		const [grid, eventArgs] = event.getCompatData() ?? [];

		if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId())
		{
			return;
		}

		// reload by native grid actions (columns settings, etc), otherwise by this.reloadGrid()
		const isNativeAction = !('useProductsFromRequest' in eventArgs.data);
		const useProductsFromRequest = isNativeAction ? true : eventArgs.data.useProductsFromRequest;

		eventArgs.url = this.getReloadUrl();
		eventArgs.method = 'POST';
		eventArgs.sessid = BX.bitrix_sessid();
		eventArgs.data = {
			...eventArgs.data,
			signedParameters: this.getSignedParameters(),
			products: useProductsFromRequest ? this.getProductsFields(this.productDataSerializer.getAjaxFields()) : null,
			locationId: this.getLocationId(),
			currencyId: this.getCurrencyId(),
		};

		this.clearEditor();

		if (isNativeAction && this.isChanged())
		{
			EventEmitter.subscribeOnce('Grid::updated', () => this.actionUpdateTotalData({isInternalChanging: false}));
		}
	};
	public readonly onGridUpdatedHandler = (event: BaseEvent): void => {
		const [grid]: any = event.getCompatData();

		if (!grid || grid.getId() !== this.getGridId())
		{
			return;
		}

		this.getSettingsPopup().updateCheckboxState();
	};
	public readonly onGridRowMovedHandler = (event: BaseEvent): void => {
		const [ids, , grid] = event.getCompatData() ?? [];

		if (!grid || grid.getId() !== this.getGridId())
		{
			return;
		}

		const changed = this.productCollection.resortByIds(ids);
		if (changed)
		{
			this.productCollection.refreshSort();
			this.productCollection.numerate();
			this.executeActions([{type: this.actions.productListChanged}]);
		}
	};
	public readonly onBeforeProductChangeHandler = (event: BaseEvent): void => {
		const data = event.getData();
		const product = this.productCollection.findByRowId(data.rowId);
		if (product)
		{
			this.gridLifecycle.getGrid().tableFade();
			product.resetExternalActions();
		}
	};
	public readonly onProductChangeHandler = (event: BaseEvent): void => {
		const data = event.getData();

		const productRow = this.productCollection.findByRowId(data.rowId);
		if (productRow && data.fields)
		{
			const promise = new Promise<Record<string, any>>((resolve, reject) => {
				const fields = data.fields;

				if (!Type.isNil(fields['IMAGE_INFO']))
				{
					fields['IMAGE_INFO'] = JSON.stringify(fields['IMAGE_INFO']);
				}

				if (this.getCurrencyId() !== fields['CURRENCY_ID'])
				{
					fields['CURRENCY'] = fields['CURRENCY_ID'];

					const priceFields: Record<string, any> = {};
					this.currencyManager.getPriceRecalcFieldNames().forEach((name) => {
						priceFields[name] = data.fields[name];
					});

					const products = [{
						fields: priceFields,
						id: productRow.getId()
					}];

					ajax.runComponentAction(
						this.getComponentName(),
						'calculateProductPrices',
						{
							mode: 'class',
							signedParameters: this.getSignedParameters(),
							data: {
								products,
								currencyId: this.getCurrencyId(),
								options: {
									ACTION: 'calculateProductPrices'
								}
							}
						}
					).then(
						(response: any) => {
							const changedFields = response.data.result[productRow.getId()];
							if (changedFields)
							{
								changedFields['CUSTOMIZED'] = 'Y';
								resolve(Object.assign(fields, changedFields));
							}
							else
							{
								resolve(fields);
							}
						}
					);
				}
				else
				{
					resolve(fields);
				}
			});

			promise.then((fields) => {
				if (this.productCollection.products.length > 1)
				{
					const taxId = fields['VAT_ID'] || fields['TAX_ID'];
					const taxIncluded = fields['VAT_INCLUDED'] || fields['TAX_INCLUDED'];

					if (taxId > 0 && taxIncluded !== productRow.getTaxIncluded())
					{
						const taxRate = this.getTaxList()?.find((item: any) => parseInt(item.ID) === taxId);
						if (taxRate?.VALUE > 0 && taxIncluded === 'Y')
						{
							fields['BASE_PRICE'] = fields['BASE_PRICE'] / (1 + taxRate.VALUE / 100);
						}
					}

					['TAX_INCLUDED', 'VAT_INCLUDED'].forEach(name => delete (fields[name]));
				}

				if (productRow.getField('OFFER_ID') !== fields.ID)
				{
					fields['ROW_RESERVED'] = 0;
					fields['DEDUCTED_QUANTITY'] = 0;
					if (!this.getSettingValue('allowDiscountChange', true))
					{
						fields['DISCOUNT_ROW'] = 0;
						fields['DISCOUNT_SUM'] = 0;
						fields['DISCOUNT_RATE'] = 0;
						fields['DISCOUNT'] = 0;
						productRow.updateUiHtmlField(
							'DISCOUNT_PRICE',
							CurrencyCore.currencyFormat(0, this.getCurrencyId(), true)
						);
						productRow.updateUiHtmlField(
							'DISCOUNT_ROW',
							CurrencyCore.currencyFormat(0, this.getCurrencyId(), true)
						);
					}
				}

				Object.keys(fields).forEach((key) => {
					productRow.updateFieldValue(key, fields[key]);
				});

				if (!Type.isStringFilled(fields['CUSTOMIZED']))
				{
					productRow.setField('CUSTOMIZED', 'N');
				}

				productRow.setField('IS_NEW', data.isNew ? 'Y' : 'N');

				productRow.layoutReserveControl();
				productRow.layoutStoreSelector();
				productRow.initHandlersForSelectors();
				productRow.updateUiStoreAmountData();
				productRow.updatePropertyFields();
				productRow.modifyBasePriceInput();
				productRow.executeExternalActions();
				this.gridLifecycle.getGrid().tableUnfade();

				// B3: for a row added via the "Add product" button, move focus to its name input once
				// the first product is selected. The initial focus sat on the button; B7's
				// focusName in processResponse can miss the freshly re-laid-out input on a new
				// row. Schedule via rAF so this is the last focus op after all re-layout;
				// one-shot flag ensures a later variation change won't refocus (C1/B7).
				if (this.pendingFocusAfterProductSelect.has(data.rowId))
				{
					this.pendingFocusAfterProductSelect.delete(data.rowId);
					const selector = productRow.getSelector();
					requestAnimationFrame(() => {
						(selector as any)?.focusName();
					});
				}
			});
		}
		else
		{
			this.gridLifecycle.getGrid().tableUnfade();
		}
	};
	public readonly onBeforeProductClearHandler = (event: BaseEvent): void => {
		const {rowId} = event.getData();
		const product = this.productCollection.findByRowId(rowId);
		product?.clearPropertyFields();
	};
	public readonly onProductClearHandler = (event: BaseEvent): void => {
		const {rowId} = event.getData();

		const product = this.productCollection.findByRowId(rowId);
		if (product)
		{
			product.layoutReserveControl();
			product.initHandlersForSelectors();
			product.changeBasePrice(0);
			if (!this.getSettingValue('allowDiscountChange', true))
			{
				product.setDiscount(0);
				product.updateUiHtmlField(
					'DISCOUNT_PRICE',
					CurrencyCore.currencyFormat(0, this.getCurrencyId(), true)
				);
				product.updateUiHtmlField(
					'DISCOUNT_ROW',
					CurrencyCore.currencyFormat(0, this.getCurrencyId(), true)
				);
			}
			product.modifyBasePriceInput();
			product.executeExternalActions();
		}
	};
	public readonly dropdownChangeHandler = (event: BaseEvent): void => {
		const [dropdownId, , , , value] = event.getData();
		const regExp = new RegExp(this.getRowIdPrefix() + '([A-Za-z0-9]+)_(\\w+)_control', 'i');
		const matches = dropdownId.match(regExp);
		if (matches)
		{
			const [, rowId, fieldCode] = matches;
			const product = this.productCollection.findById(rowId);
			if (product)
			{
				product.updateField(fieldCode, value, MODE_EDIT);
			}
		}
	};

	public readonly changeProductFieldHandler = (event: Event): void => {
		const row = (event.target as HTMLElement).closest('tr') as HTMLTableRowElement | null;
		if (row && row.hasAttribute('data-id'))
		{
			const product = this.productCollection.findById(row.getAttribute('data-id') as string);
			if (product)
			{
				const cell = (event.target as HTMLElement).closest('td') as HTMLTableCellElement | null;
				const fieldCode = this.getFieldCodeByGridCell(row, cell!);
				if (fieldCode)
				{
					product.updateFieldByEvent(fieldCode, event as UIEvent);
				}
			}
		}
	};

	constructor(id: string)
	{
		super();
		this.setId(id);
		this.eventBindings = new EditorEventBindings(this);
		this.ajaxClient = new EditorAjaxClient(this);
		this.totalsService = new EditorTotalsService(this);
		this.currencyManager = new EditorCurrencyManager(this);
		this.formManager = new EditorFormManager(this);
		this.productDataSerializer = new EditorProductDataSerializer(this);
		this.gridLifecycle = new EditorGridLifecycle(this);
		this.productCollection = new EditorProductCollection(this);
	}

	init(config: Record<string, any> = {}): void
	{
		this.setSettings(config);

		if (this.canEdit())
		{
			this.addFirstRowIfEmpty();
			this.enableEdit();
		}

		this.formManager.init();
		this.productCollection.init();
		this.gridLifecycle.initData();

		this.fieldHintManager = new FieldHintManager(this.getContainer()!, () => this.gridLifecycle.getGrid());

		EventEmitter.emit(window, 'EntityProductListController', [this] as any);

		this.initSupportCustomRowActions();

		this.subscribeDomEvents();
		this.subscribeCustomEvents();

		if (this.getSettingValue('isReserveBlocked', false))
		{
			const headersToLock = ['STORE_INFO', 'RESERVE_INFO'];
			const container = this.getContainer();
			headersToLock.forEach((headerId) => {
				const header = container?.querySelector(`.main-grid-cell-head[data-name="${headerId}"] .main-grid-cell-head-container`) as HTMLElement | null;
				if (header)
				{
					Dom.addClass(header, 'main-grid-cell-head-locked');
					header.onclick = (event: any) => {
						if (Dom.hasClass(event.target, 'ui-hint-icon'))
						{
							return;
						}
						this.openIntegrationLimitSlider();
					};
					const lock = Tag.render`<span class="crm-entity-product-list-locked-header"></span>`;
					header.insertBefore(lock, header.firstChild);
				}
			});
		}

		this
			.getContainer()!
			.querySelectorAll('.crm-entity-product-list-add-block')
			.forEach((buttonBlock) => {
				BX.UI.Hint.init(buttonBlock);
			})
		;
	}

	subscribeDomEvents(): void
	{
		this.eventBindings.subscribeDom();
	}

	unsubscribeDomEvents(): void
	{
		this.eventBindings.unsubscribeDom();
	}

	subscribeCustomEvents(): void
	{
		this.eventBindings.subscribeCustom();
	}

	unsubscribeCustomEvents(): void
	{
		this.eventBindings.unsubscribeCustom();
	}

	private initSupportCustomRowActions(): void
	{
		(this.gridLifecycle.getGrid() as any)._clickOnRowActionsButton = () => {};
	}

	selectViewedProductInRow(id: string, productId: number): void
	{
		if (!Type.isStringFilled(id) || Text.toNumber(productId) <= 0)
		{
			return;
		}

		requestAnimationFrame(() => {
			const productSelector = this.getProductSelector(id);
			if (productSelector)
			{
				productSelector.onProductSelect(productId);
			}
		});
	}

	selectProductInRow(id: string, productId: number): void
	{
		if (!Type.isStringFilled(id) || Text.toNumber(productId) <= 0)
		{
			return;
		}

		requestAnimationFrame(() => {
			const productSelector = this.getProductSelector(id);
			if (productSelector)
			{
				productSelector.searchInput?.clearErrors();
				productSelector.onProductSelect(productId);
			}
		});
	}

	changeActivePanelButtons(panelCode: 'top' | 'bottom'): HTMLElement | null
	{
		const container = this.getContainer();
		if (!container)
		{
			return null;
		}

		const activePanel = container.querySelector('.crm-entity-product-list-add-block-' + panelCode) as HTMLElement | null;
		if (Type.isElementNode(activePanel))
		{
			Dom.removeClass(activePanel, 'crm-entity-product-list-add-block-hidden');
			Dom.addClass(activePanel, 'crm-entity-product-list-add-block-active');
		}

		const hiddenPanelCode = (panelCode === 'top') ? 'bottom' : 'top';
		const removePanel = container.querySelector('.crm-entity-product-list-add-block-' + hiddenPanelCode);
		if (Type.isElementNode(removePanel))
		{
			Dom.addClass(removePanel, 'crm-entity-product-list-add-block-hidden');
			Dom.removeClass(removePanel, 'crm-entity-product-list-add-block-active');
		}

		return activePanel;
	}

	reloadGrid(useProductsFromRequest: boolean = true): void
	{
		this.gridLifecycle.reload(useProductsFromRequest);
	}

	/*
		keep in mind different actions for this handler:
		- native reload by grid actions (columns settings, etc)		- products from request
		- reload by tax/discount settings button					- products from request		this.reloadGrid(true)
		- rollback													- products from db			this.reloadGrid(false)
		- reload after SalesCenter order save						- products from db			this.reloadGrid(false)
		- reload after save if location had been changed
	 */
	initPageEventsManager(): void
	{
		const componentId = this.getSettingValue('componentId');
		this.pageEventsManager = new PageEventsManager({id: componentId});
	}

	getPageEventsManager(): PageEventsManager
	{
		if (!this.pageEventsManager)
		{
			this.initPageEventsManager();
		}

		return this.pageEventsManager;
	}

	canEdit(): boolean
	{
		return this.getSettingValue('allowEdit', false) === true;
	}

	canEditCatalogPrice(): boolean
	{
		return this.getSettingValue('allowCatalogPriceEdit', false) === true;
	}

	isAllowReservation(): boolean
	{
		return this.getSettingValue('allowReservation', false) === true;
	}

	getDefaultDateReservation(): string | null
	{
		return this.getSettingValue('defaultDateReservation');
	}

	canSaveCatalogPrice(): boolean
	{
		return this.getSettingValue('allowCatalogPriceSave', false) === true;
	}

	enableEdit(): void
	{
		// Cannot use editSelected because checkboxes have been removed
		const rows = this.gridLifecycle.getGrid().getRows().getRows();
		rows.forEach((current: any) => {
			if (!current.isHeadChild() && !current.isTemplate())
			{
				current.edit();
			}
		});
	}

	addFirstRowIfEmpty(): void
	{
		if (this.gridLifecycle.getGrid().getRows().getCountDisplayed() === 0)
		{
			requestAnimationFrame(() => this.addProductRow());
		}
	}

	clearEditor(): void
	{
		this.productCollection.unsubscribeAll();
		this.productCollection.reset();
		this.pendingFocusAfterProductSelect.clear();

		this.destroySettingsPopup();
		this.unsubscribeDomEvents();
		this.unsubscribeCustomEvents();

		const container = this.getContainer();
		if (container)
		{
			EventBinder.unbindAll(container as any);
		}
	}

	wasProductsInitiated(): boolean
	{
		return this.productCollection.productsAreInitiated;
	}

	destroy(): void
	{
		this.setForm(null);
		this.clearController();
		this.clearEditor();
	}

	setController(controller: any): void
	{
		if (this.controller === controller)
		{
			return;
		}
		if (this.controller)
		{
			this.controller.clearProductList();
		}
		this.controller = controller;
	}

	clearController(): void
	{
		this.controller = null;
	}

	getId(): string
	{
		return this.id as string;
	}

	setId(id: string): void
	{
		this.id = id;
	}

	/* settings tools */
	getComponentName(): string
	{
		return this.getSettingValue('componentName', '');
	}

	getReloadUrl(): string
	{
		return this.getSettingValue('reloadUrl', '');
	}

	getSignedParameters(): string
	{
		return this.getSettingValue('signedParameters', '');
	}

	getContainerId(): string
	{
		return this.getSettingValue('containerId', '');
	}

	getGridId(): string
	{
		return this.getSettingValue('gridId', '');
	}

	getLanguageId(): string
	{
		return this.getSettingValue('languageId', '');
	}

	getSiteId(): string
	{
		return this.getSettingValue('siteId', '');
	}

	getCatalogId(): number
	{
		return this.getSettingValue('catalogId', 0);
	}

	isReadOnly(): boolean
	{
		return this.getSettingValue('readOnly', true);
	}

	setReadOnly(readOnly: boolean): void
	{
		this.setSettingValue('readOnly', readOnly);
	}

	getCurrencyId(): string
	{
		return this.getSettingValue('currencyId', '');
	}

	isLocationDependantTaxesEnabled(): boolean
	{
		return this.getSettingValue('isLocationDependantTaxesEnabled', false);
	}

	getLocationId(): string | null
	{
		return this.getSettingValue('locationId');
	}

	setLocationId(locationId: string): void
	{
		this.setSettingValue('locationId', locationId);
	}

	changeCurrencyId(currencyId: string): void
	{
		this.currencyManager.change(currencyId);
	}

	getDataFieldName(): string
	{
		return this.getSettingValue('dataFieldName', '');
	}

	getDataSettingsFieldName(): string
	{
		const field = this.getDataFieldName();

		return Type.isStringFilled(field) ? field + '_SETTINGS' : '';
	}

	getDiscountEnabled(): CrmEntityProductListYesNo
	{
		return this.getSettingValue('enableDiscount', 'N');
	}

	isDiscountEnabled(): boolean
	{
		return this.getDiscountEnabled() === 'Y';
	}

	getPricePrecision(): number
	{
		return this.getSettingValue('pricePrecision', DEFAULT_PRECISION);
	}

	getCalculationPricePrecision(): number
	{
		return this.getSettingValue('calculationPricePrecision', DEFAULT_PRECISION);
	}

	getQuantityPrecision(): number
	{
		return this.getSettingValue('quantityPrecision', DEFAULT_PRECISION);
	}

	getCommonPrecision(): number
	{
		return this.getSettingValue('commonPrecision', DEFAULT_PRECISION);
	}

	getTaxList(): any[]
	{
		return this.getSettingValue('taxList', []);
	}

	getTaxAllowed(): CrmEntityProductListYesNo
	{
		return this.getSettingValue('allowTax', 'N');
	}

	isTaxAllowed(): boolean
	{
		return this.getTaxAllowed() === 'Y';
	}

	getTaxEnabled(): CrmEntityProductListYesNo
	{
		return this.getSettingValue('enableTax', 'N');
	}

	isTaxEnabled(): boolean
	{
		return this.getTaxEnabled() === 'Y';
	}

	isTaxUniform(): boolean
	{
		return this.getSettingValue('taxUniform', true);
	}

	getMeasures(): any[]
	{
		return this.getSettingValue('measures', []);
	}

	getDefaultMeasure(): Record<string, any>
	{
		return this.getSettingValue('defaultMeasure', {});
	}

	getRowIdPrefix(): string
	{
		return this.getSettingValue('rowIdPrefix', 'crm_entity_product_list_');
	}

	/* settings tools finish */

	parseInt(value: number | string, defaultValue: number = 0): number
	{
		return calc.parseIntValue(value, defaultValue);
	}

	parseFloat(value: number | string, precision: number = DEFAULT_PRECISION, defaultValue: number = 0.0): number
	{
		return calc.parseFloatValue(value, precision, defaultValue);
	}

	getContainer(): HTMLElement | null
	{
		return this.cache.remember('container', () => {
			return document.getElementById(this.getContainerId());
		}) as HTMLElement | null;
	}

	setForm(form: HTMLElement | null): void { this.formManager.set(form); }
	removeFormFields(): void { this.formManager.removeFields(); }

	getProductCount(): number { return this.productCollection.count(); }

	handleProductErrorsChange(): void
	{
		if (this.childrenHasErrors())
		{
			this.controller.disableSaveButton();
		}
	}

	childrenHasErrors(): boolean
	{
		return this.productCollection.products
			.filter((product) => product.getModel().getErrorCollection().hasErrors())
			.length > 0
		;
	}

	getFieldCodeByGridCell(row: HTMLTableRowElement, cell: HTMLTableCellElement): string | null
	{
		if (!Type.isElementNode(row) || !Type.isElementNode(cell))
		{
			return null;
		}

		const grid = this.gridLifecycle.getGrid();
		if (grid)
		{
			const headRow = grid.getRows().getHeadFirstChild();
			const index = [...row.cells].indexOf(cell);

			return headRow.getCellNameByCellIndex(index);
		}

		return null;
	}

	addProductRow(anchorProduct: Row | null = null): string
	{
		const row = this.gridLifecycle.createProductRow();
		const newId = row.getId();

		if (anchorProduct)
		{
			const anchorRowNode = this.gridLifecycle.getGrid().getRows().getById(anchorProduct.getField('ID'))?.getNode();
			if (anchorRowNode)
			{
				anchorRowNode.parentNode.insertBefore(row.getNode(), anchorRowNode.nextSibling);
			}
		}

		this.initializeNewProductRow(newId, anchorProduct);
		this.gridLifecycle.getGrid().bindOnRowEvents();
		return newId;
	}

	destroySettingsPopup(): void
	{
		if (this.cache.has('settings-popup'))
		{
			(this.cache.get('settings-popup') as SettingsPopup).getPopup().destroy();
			this.cache.delete('settings-popup');
		}
	}

	getSettingsPopup(): SettingsPopup
	{
		return this.cache.remember('settings-popup', () => {
			return new SettingsPopup(
				this.getContainer()!.querySelector('.crm-entity-product-list-add-block-active [data-role="product-list-settings-button"]') as HTMLElement,
				this.getSettingValue('popupSettings', []),
				this
			);
		}) as SettingsPopup;
	}

	getHintPopup(): HintPopup
	{
		return this.cache.remember('hint-popup', () => {
			return new HintPopup(this);
		}) as HintPopup;
	}

	handleDeleteRow(rowId: string, event: BaseEvent): void
	{
		(event as any).preventDefault();
		this.deleteRow(rowId);
	}

	initializeNewProductRow(newId: string, anchorProduct: Row | null = null): Row
	{
		let fields = anchorProduct?.getFields();
		if (Type.isNil(fields))
		{
			fields = {
				...this.getSettingValue('templateItemFields', {}),
				...{
					CURRENCY: this.getCurrencyId()
				}
			};

			const lastItem = this.productCollection.products[this.productCollection.products.length - 1];
			if (lastItem)
			{
				fields!.TAX_INCLUDED = lastItem.getField('TAX_INCLUDED');
			}
		}

		const rowId = this.getRowIdPrefix() + newId;
		fields!.ID = newId;
		if (Type.isObject(fields!.IMAGE_INFO))
		{
			delete (fields!.IMAGE_INFO as any).input;
		}
		delete (fields!.RESERVE_ID);
		const isReserveBlocked = this.getSettingValue('isReserveBlocked', false);
		const isInventoryManagementToolEnabled = this.getSettingValue('isInventoryManagementToolEnabled', false);
		const inventoryManagementMode = this.getSettingValue('inventoryManagementMode', null);

		const settings = {
			isReserveBlocked,
			isInventoryManagementToolEnabled,
			inventoryManagementMode,
			selectorId: 'crm_grid_' + rowId,
		};
		const product = new Row(rowId, fields!, settings, this);
		product.refreshFieldsLayout();

		if (anchorProduct instanceof Row)
		{
			const collectionProducts = this.productCollection.products;
			collectionProducts.splice(1 + collectionProducts.indexOf(anchorProduct), 0, product);

			(product.getSelector() as any)?.reloadFileInput();
			(product.getSelector() as any)?.layout();
			product.updateUiMeasure(
				product.getField('MEASURE_CODE'),
				Text.encode(product.getField('MEASURE_NAME')),
			);
			if (
				!this.canEditCatalogPrice()
				&& product.getModel().isCatalogExisted()
				&& Type.isNumber(fields!.CATALOG_PRICE)
			)
			{
				product.changeBasePrice(fields!.CATALOG_PRICE);
			}
			if (!this.isAllowReservation())
			{
				product.setField('DATE_RESERVE_END', this.getDefaultDateReservation());
				product.setField('STORE_ID', null);
				product.resetReserveFields();
			}
		}
		else if (this.getSettingValue('newRowPosition') === 'bottom')
		{
			this.productCollection.products.push(product);
		}
		else
		{
			this.productCollection.products.unshift(product);
		}

		this.productCollection.refreshSort();
		this.productCollection.numerate();

		product.updateUiCurrencyFields();
		this.totalsService.updateUiCurrency();

		// Empty-product validation: defer until the user explicitly closes the search dialog.
		// Setting ENABLE_EMPTY_PRODUCT_ERROR=true synchronously would trigger validation via
		// input-base.js:608 blur handler (200ms timer fires when search dialog opens and the
		// underlying name-input blurs) — that shows the error before the user has had a chance
		// to interact. Hook the dialog's `onHide` instead: when user closes the dialog without
		// selecting, enable the flag and manually surface the same error the blur handler would.
		const enableEmptyProductError = this.getSettingValue('enableEmptyProductError', false);
		if (enableEmptyProductError)
		{
			this.armEmptyProductErrorOnDialogHide(product);
		}

		return product;
	}

	private armEmptyProductErrorOnDialogHide(product: Row): void
	{
		const selector = product.getSelector() as any;
		const dialog = selector?.searchInput?.getDialog?.();
		if (!dialog || typeof dialog.subscribeOnce !== 'function')
		{
			return;
		}

		dialog.subscribeOnce('onHide', () => {
			selector.setConfig('ENABLE_EMPTY_PRODUCT_ERROR', true);

			// onHide fires synchronously after Item:onSelect; the product-load AJAX is
			// already running at this moment, so model.isEmpty() can still be true.
			// Mirror input-base.js:608-627: defer 200ms and skip if a request is in flight.
			setTimeout(() => {
				if (selector.inProcess?.())
				{
					return;
				}

				const model = selector.getModel?.();
				if (model && model.isEmpty?.())
				{
					model.getErrorCollection().setError(
						'NOT_SELECTED_PRODUCT',
						selector.getEmptySelectErrorMessage()
					);
					selector.layoutErrors();
				}
			}, 200);
		});
	}

	isTaxIncludedActive(): boolean
	{
		return this.productCollection.products
			.filter((product) => product.isTaxIncluded())
			.length > 0
		;
	}

	getProductSelector(newId: string): ProductSelector | null
	{
		return ProductSelector.getById('crm_grid_' + this.getRowIdPrefix() + newId);
	}

	focusProductSelector(newId: string): void
	{
		requestAnimationFrame(() => {
			(this.getProductSelector(newId) as any)
				?.searchInDialog()
				.focusName()
			;
		});
	}

	compileProductData(): void
	{
		this.productDataSerializer.compile();
	}

	/* actions */
	executeActions(actions: CrmEntityProductListAction[]): void
	{
		if (!Type.isArrayFilled(actions))
		{
			return;
		}

		const disableSaveButton = actions
			.filter(
				(action) => action.type === 'total' || action.type === 'disableSaveButton'
			)
			.length > 0
		;

		for (const item of actions)
		{
			if (
				!Type.isPlainObject(item)
				|| !Type.isStringFilled(item.type)
			)
			{
				continue;
			}

			switch (item.type)
			{
				case 'productChange':
					this.actionSendProductChange(item, disableSaveButton);
					break;

				case 'productListChanged':
					this.actionSendProductListChanged(disableSaveButton);
					break;

				case 'listField':
					this.actionUpdateListField(item);
					break;

				case 'total':
					this.actionUpdateTotalData();
					break;

				case 'stateChange':
					this.actionSendStatusChange(item);
					break;
			}
		}
	}

	actionSendProductChange(item: CrmEntityProductListProductChangeAction, disableSaveButton: boolean): void
	{
		if (!Type.isStringFilled(item.id))
		{
			return;
		}

		const product = this.productCollection.findByRowId(item.id);
		if (!product)
		{
			return;
		}

		EventEmitter.emit(this, 'ProductList::onChangeFields', {
			rowId: item.id,
			productId: product.getField('PRODUCT_ID'),
			fields: product.getCatalogFields()
		} as any);

		if (this.controller)
		{
			this.controller.productChange(disableSaveButton);
			this.setGridChanged(true);
		}
	}

	actionSendProductListChanged(disableSaveButton: boolean = false): void
	{
		if (this.controller)
		{
			this.controller.productChange(disableSaveButton);
			this.setGridChanged(true);
		}
	}

	actionUpdateListField(item: CrmEntityProductListUpdateListFieldAction): void
	{
		if (!Type.isStringFilled(item.field) || !('value' in item))
		{
			return;
		}

		if (!this.allowUpdateListField(item.field))
		{
			return;
		}

		this.updateFieldForList = item.field;

		for (const row of this.productCollection.products)
		{
			row.updateFieldByName(item.field, item.value);
		}

		this.updateFieldForList = null;
	}

	actionUpdateTotalData(options: Record<string, any> = {}): void
	{
		this.totalsService.scheduleUpdate(options);
	}

	actionSendStatusChange(item: CrmEntityProductListStateChangedAction): void
	{
		if (!('value' in item))
		{
			return;
		}
		if (this.stateChange.changed === item.value)
		{
			return;
		}
		this.stateChange.changed = item.value;
		if (this.stateChange.sended)
		{
			return;
		}
		this.stateChange.sended = true;
	}

	/* actions finish */

	/* action tools */
	allowUpdateListField(field: string): boolean
	{
		if (this.updateFieldForList !== null)
		{
			return false;
		}

		let result = true;

		switch (field)
		{
			case 'TAX_INCLUDED':
				result = this.isTaxUniform() && this.isTaxAllowed();
				break;
		}

		return result;
	}

	setGridChanged(changed: boolean): void
	{
		this.isChangedGrid = changed;
	}

	isChanged(): boolean
	{
		return this.isChangedGrid;
	}

	getProductsFields(fields: string[] = []): Record<string, any>[]
	{
		const productFields: Record<string, any>[] = [];

		for (const item of this.productCollection.products)
		{
			productFields.push(item.getFields(fields));
		}

		return productFields;
	}

	/* action tools finish */

	validateSubmit(): Promise<void>
	{
		return new Promise((resolve, reject) => {
			const currentBalloon = BX.UI.Notification.Center.getBalloonByCategory(ProductModel.SAVE_NOTIFICATION_CATEGORY);
			if (currentBalloon)
			{
				EventEmitter.subscribeOnce(
					currentBalloon,
					BX.UI.Notification.Event.getFullName('onClose'),
					() => {
						setTimeout(resolve, 500);
					}
				);
				currentBalloon.close();
			}
			else
			{
				setTimeout(resolve, 50);
			}
		});
	}

	deleteRow(rowId: string, skipActions: boolean = false): void
	{
		if (!Type.isStringFilled(rowId))
		{
			return;
		}

		this.pendingFocusAfterProductSelect.delete(this.getRowIdPrefix() + rowId);

		const gridRow = this.gridLifecycle.getGrid().getRows().getById(rowId);
		if (gridRow)
		{
			Dom.remove(gridRow.getNode());
			this.gridLifecycle.getGrid().getRows().reset();
		}

		const productRow = this.productCollection.findById(rowId);
		if (productRow)
		{
			const products = this.productCollection.products;
			const index = products.indexOf(productRow);
			if (index > -1)
			{
				products.splice(index, 1);
				this.productCollection.refreshSort();
				this.productCollection.numerate();
			}
		}

		EventEmitter.emit('Grid::thereEditedRows', [] as any);

		if (!skipActions)
		{
			this.addFirstRowIfEmpty();
			this.executeActions([
				{type: this.actions.productListChanged},
				{type: this.actions.updateTotal}
			]);
		}
	}

	copyRow(row: Row): void
	{
		this.addProductRow(row);
		this.productCollection.refreshSort();
		this.productCollection.numerate();

		EventEmitter.emit('Grid::thereEditedRows', [] as any);

		this.executeActions([
			{type: this.actions.productListChanged},
			{type: this.actions.updateTotal}
		]);
	}

	handleOnTabShow(): void
	{
		if (!this.isVisible())
		{
			this.productCollection.products.forEach(
				(product) => {
					(product.getSelector() as any)?.layout();
					product.initHandlersForSelectors();
				});
		}
		EventEmitter.emit('onDemandRecalculateWrapper', [this] as any);

		this.isVisibleGrid = true;
	}

	isVisible(): boolean
	{
		return this.isVisibleGrid;
	}

	showFieldTourHint(fieldName: string, tourData: Record<string, any>, endTourHandler: Function, addictedFields: string[] = [], rowId: string = ''): void
	{
		const products = this.productCollection.products;
		if (products.length > 0)
		{
			let productNode = products[0].getNode();
			const targetProduct = this.productCollection.findByRowId(rowId);
			if (targetProduct)
			{
				productNode = targetProduct.getNode();
			}

			const addictedNodes: HTMLElement[] = [];
			for (const fName of addictedFields)
			{
				const fieldNode = productNode!.querySelector(`[data-name="${fName}"]`) as HTMLElement | null;
				if (fieldNode !== null)
				{
					addictedNodes.push(fieldNode);
				}
			}

			const fieldNode = productNode!.querySelector(`[data-name="${fieldName}"]`) as HTMLElement | null;

			if (fieldNode !== null)
			{
				this.fieldHintManager.processFieldTour(fieldNode, tourData, endTourHandler, addictedNodes);
			}
		}
	}

	getActiveHint(): Guide | null
	{
		return this.fieldHintManager.getActiveHint();
	}

	openIntegrationLimitSlider(): void
	{
		top.BX.UI.InfoHelper.show('limit_store_crm_integration');
		const helperSlider = top.BX.UI.InfoHelper.getSlider();
		top.BX.Event.EventEmitter.subscribeOnce('SidePanel.Slider:onCloseComplete', (event: BaseEvent) => {
			const slider = event.getData()[0]?.getSlider();
			if (slider !== helperSlider)
			{
				return;
			}

			window.location.search += '&active_tab=tab_products';
		});
	}

	openInventoryManagementToolDisabledSlider(): void
	{
		Runtime.loadExtension('catalog.tool-availability-manager').then((exports: any) => {
			const {ToolAvailabilityManager} = exports;
			ToolAvailabilityManager.openInventoryManagementToolDisabledSlider();
		});
	}

	getRestrictedProductTypes(): any[]
	{
		return this.getSettingValue('restrictedProductTypes', []);
	}
}
