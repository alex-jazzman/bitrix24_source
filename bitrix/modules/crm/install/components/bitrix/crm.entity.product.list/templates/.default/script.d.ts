/* eslint-disable */
type CrmEntityProductListReserveControlOptions = {
	row: BX.Crm.Entity.ProductList.Row;
	inputName?: string;
	dateFieldName?: string;
	quantityFieldName?: string;
	deductedQuantityFieldName?: string;
	defaultDateReservation?: string | null;
	isBlocked?: boolean;
	isInventoryManagementToolEnabled?: boolean;
	inventoryManagementMode?: string;
	measureName?: string;
	isReserveEqualProductQuantity?: boolean;
};

type CrmEntityProductListStoreAvailablePopupOptions = {
	rowId: string | number;
	model: BX.Catalog.ProductModel;
	inventoryManagementMode?: string | null;
	node: HTMLElement;
};

type CrmEntityProductListAction = CrmEntityProductListProductChangeAction | CrmEntityProductListDisableSaveButtonAction | CrmEntityProductListProductListChangedAction | CrmEntityProductListUpdateListFieldAction | CrmEntityProductListStateChangedAction | CrmEntityProductListUpdateTotalAction;

type CrmEntityProductListProductChangeAction = {
	type: 'productChange';
	id: string;
};

type CrmEntityProductListDisableSaveButtonAction = {
	type: 'disableSaveButton';
	id: string;
};

type CrmEntityProductListProductListChangedAction = {
	type: 'productListChanged';
};

type CrmEntityProductListUpdateListFieldAction = {
	type: 'listField';
	field: string;
	value: any;
};

type CrmEntityProductListStateChangedAction = {
	type: 'stateChange';
	value: boolean;
};

type CrmEntityProductListUpdateTotalAction = {
	type: 'total';
};

type CrmEntityProductListSettings = Record<string, any>;

type CrmEntityProductListYesNo = 'Y' | 'N';

type CrmEntityProductListSettingItem = {
	id: string;
	title: string;
	desc?: string;
	hint?: string;
	checked?: boolean;
	disabled?: boolean;
	action?: string;
	columns?: string[];
};

declare namespace BX.Crm.Entity.ProductList {
	class Editor extends SettingsHolder {
		private id;
		controller: any;
		private isChangedGrid;
		private isVisibleGrid;
		pageEventsManager: PageEventsManager;
		private readonly cache;
		private fieldHintManager;
		readonly eventBindings: EditorEventBindings;
		readonly ajaxClient: EditorAjaxClient;
		readonly totalsService: EditorTotalsService;
		readonly currencyManager: EditorCurrencyManager;
		readonly formManager: EditorFormManager;
		readonly productDataSerializer: EditorProductDataSerializer;
		readonly gridLifecycle: EditorGridLifecycle;
		readonly productCollection: EditorProductCollection;
		readonly actions: {
			readonly disableSaveButton: "disableSaveButton";
			readonly productChange: "productChange";
			readonly productListChanged: "productListChanged";
			readonly updateListField: "listField";
			readonly stateChanged: "stateChange";
			readonly updateTotal: "total";
		};
		private readonly stateChange;
		private updateFieldForList;
		readonly productSelectionPopupHandler: (event: Event) => void;
		readonly productRowAddHandler: () => void;
		readonly showSettingsPopupHandler: () => void;
		readonly onDialogSelectProductHandler: (event: BX.Event.BaseEvent) => void;
		readonly onAddViewedProductToDealHandler: (event: BX.Event.BaseEvent) => void;
		readonly onSaveHandler: (event: BX.Event.BaseEvent) => void;
		readonly onFocusToProductList: (event: BX.Event.BaseEvent) => void;
		readonly onEntityUpdateHandler: (event: BX.Event.BaseEvent) => void;
		readonly onEditorSubmit: (event: BX.Event.BaseEvent) => void;
		readonly onInnerCancelHandler: (event: BX.Event.BaseEvent) => void;
		readonly onBeforeGridRequestHandler: (event: BX.Event.BaseEvent) => void;
		readonly onGridUpdatedHandler: (event: BX.Event.BaseEvent) => void;
		readonly onGridRowMovedHandler: (event: BX.Event.BaseEvent) => void;
		readonly onBeforeProductChangeHandler: (event: BX.Event.BaseEvent) => void;
		readonly onProductChangeHandler: (event: BX.Event.BaseEvent) => void;
		readonly onBeforeProductClearHandler: (event: BX.Event.BaseEvent) => void;
		readonly onProductClearHandler: (event: BX.Event.BaseEvent) => void;
		readonly dropdownChangeHandler: (event: BX.Event.BaseEvent) => void;
		readonly changeProductFieldHandler: (event: Event) => void;
		constructor(id: string);
		init(config?: Record<string, any>): void;
		subscribeDomEvents(): void;
		unsubscribeDomEvents(): void;
		subscribeCustomEvents(): void;
		unsubscribeCustomEvents(): void;
		private initSupportCustomRowActions;
		selectViewedProductInRow(id: string, productId: number): void;
		selectProductInRow(id: string, productId: number): void;
		changeActivePanelButtons(panelCode: 'top' | 'bottom'): HTMLElement | null;
		reloadGrid(useProductsFromRequest?: boolean): void;
		initPageEventsManager(): void;
		getPageEventsManager(): PageEventsManager;
		canEdit(): boolean;
		canEditCatalogPrice(): boolean;
		isAllowReservation(): boolean;
		getDefaultDateReservation(): string | null;
		canSaveCatalogPrice(): boolean;
		enableEdit(): void;
		addFirstRowIfEmpty(): void;
		clearEditor(): void;
		wasProductsInitiated(): boolean;
		destroy(): void;
		setController(controller: any): void;
		clearController(): void;
		getId(): string;
		setId(id: string): void;
		getComponentName(): string;
		getReloadUrl(): string;
		getSignedParameters(): string;
		getContainerId(): string;
		getGridId(): string;
		getLanguageId(): string;
		getSiteId(): string;
		getCatalogId(): number;
		isReadOnly(): boolean;
		setReadOnly(readOnly: boolean): void;
		getCurrencyId(): string;
		isLocationDependantTaxesEnabled(): boolean;
		getLocationId(): string | null;
		setLocationId(locationId: string): void;
		changeCurrencyId(currencyId: string): void;
		getDataFieldName(): string;
		getDataSettingsFieldName(): string;
		getDiscountEnabled(): CrmEntityProductListYesNo;
		isDiscountEnabled(): boolean;
		getPricePrecision(): number;
		getCalculationPricePrecision(): number;
		getQuantityPrecision(): number;
		getCommonPrecision(): number;
		getTaxList(): any[];
		getTaxAllowed(): CrmEntityProductListYesNo;
		isTaxAllowed(): boolean;
		getTaxEnabled(): CrmEntityProductListYesNo;
		isTaxEnabled(): boolean;
		isTaxUniform(): boolean;
		getMeasures(): any[];
		getDefaultMeasure(): Record<string, any>;
		getRowIdPrefix(): string;
		parseInt(value: number | string, defaultValue?: number): number;
		parseFloat(value: number | string, precision?: number, defaultValue?: number): number;
		getContainer(): HTMLElement | null;
		setForm(form: HTMLElement | null): void;
		removeFormFields(): void;
		getProductCount(): number;
		handleProductErrorsChange(): void;
		childrenHasErrors(): boolean;
		getFieldCodeByGridCell(row: HTMLTableRowElement, cell: HTMLTableCellElement): string | null;
		addProductRow(anchorProduct?: Row | null): string;
		destroySettingsPopup(): void;
		getSettingsPopup(): SettingsPopup;
		getHintPopup(): HintPopup;
		handleDeleteRow(rowId: string, event: BX.Event.BaseEvent): void;
		initializeNewProductRow(newId: string, anchorProduct?: Row | null): Row;
		private armEmptyProductErrorOnDialogHide;
		isTaxIncludedActive(): boolean;
		getProductSelector(newId: string): BX.Catalog.ProductSelector | null;
		focusProductSelector(newId: string): void;
		compileProductData(): void;
		executeActions(actions: CrmEntityProductListAction[]): void;
		actionSendProductChange(item: CrmEntityProductListProductChangeAction, disableSaveButton: boolean): void;
		actionSendProductListChanged(disableSaveButton?: boolean): void;
		actionUpdateListField(item: CrmEntityProductListUpdateListFieldAction): void;
		actionUpdateTotalData(options?: Record<string, any>): void;
		actionSendStatusChange(item: CrmEntityProductListStateChangedAction): void;
		allowUpdateListField(field: string): boolean;
		setGridChanged(changed: boolean): void;
		isChanged(): boolean;
		getProductsFields(fields?: string[]): Record<string, any>[];
		validateSubmit(): Promise<void>;
		deleteRow(rowId: string, skipActions?: boolean): void;
		copyRow(row: Row): void;
		handleOnTabShow(): void;
		isVisible(): boolean;
		showFieldTourHint(fieldName: string, tourData: Record<string, any>, endTourHandler: Function, addictedFields?: string[], rowId?: string): void;
		getActiveHint(): BX.UI.Tour.Guide | null;
		openIntegrationLimitSlider(): void;
		openInventoryManagementToolDisabledSlider(): void;
		getRestrictedProductTypes(): any[];
	}

	abstract class SettingsHolder {
		protected settings: Record<string, any>;
		getSettings(): Record<string, any>;
		setSettings(settings: Record<string, any>): void;
		getSettingValue(name: string, defaultValue?: any): any;
		setSettingValue(name: string, value: any): void;
	}

	class PageEventsManager {
		private settings;
		private readonly eventHandlers;
		constructor(settings: Record<string, any> | null | undefined);
		registerEventHandler(eventName: string, eventHandler: Function): void;
		fireEvent(eventName: string, eventParams: any): void;
		unregisterEventHandlers(eventName: string): void;
	}

	class EditorEventBindings {
		private readonly editor;
		private pullReloadGrid;
		constructor(editor: Editor);
		subscribeDom(): void;
		unsubscribeDom(): void;
		subscribeCustom(): void;
		unsubscribeCustom(): void;
		private getDomBindings;
		private getCustomBindings;
	}

	class EditorAjaxClient {
		private readonly editor;
		private readonly pool;
		constructor(editor: Editor);
		request(action: string, data: Record<string, any>): void;
		handleSuccess(response: any, requestOptions: Record<string, any>): void;
		handleFailure(response: any, requestOptions: Record<string, any>): void;
		commonCheck(response: any): boolean;
	}

	class EditorTotalsService {
		private readonly editor;
		private readonly state;
		private readonly updateDelayed;
		constructor(editor: Editor);
		getProductFieldList(): string[];
		scheduleUpdate(options?: Record<string, any>): void;
		apply(data: Record<string, any>, options?: Record<string, any>): void;
		updateUiCurrency(): void;
		private runDelayed;
		private sendToController;
	}

	class EditorCurrencyManager {
		private readonly editor;
		constructor(editor: Editor);
		getPriceRecalcFieldNames(): string[];
		change(currencyId: string): void;
		set(currencyId: string): void;
		getText(): string;
		applyCalculatedPrices(products: Record<string, any>): void;
		private updateGridTemplateCurrency;
	}

	class EditorFormManager {
		private readonly editor;
		private form;
		constructor(editor: Editor);
		init(): void;
		get(): HTMLElement | null;
		set(form: HTMLElement | null): void;
		exists(): boolean;
		initFields(): void;
		initField(fieldName: string): void;
		removeFields(): void;
		initDataField(): void;
		initDataSettingsField(): void;
		getField(fieldName: string): HTMLInputElement | null;
		getDataField(): HTMLInputElement | null;
		getDataSettingsField(): HTMLInputElement | null;
	}

	class EditorProductDataSerializer {
		private readonly editor;
		constructor(editor: Editor);
		getAjaxFields(): string[];
		compile(): void;
		prepareValue(): string;
	}

	class EditorGridLifecycle {
		private readonly editor;
		private readonly cache;
		constructor(editor: Editor);
		getGrid(): any;
		initData(): void;
		getEditData(): Record<string, any>;
		setEditData(data: Record<string, any>): void;
		setOriginalTemplateEditData(data: any): void;
		redefineTemplateEditData(newId: string): any;
		prepareCustomEditData(originalEditData: Record<string, any>, newId: string): Record<string, any>;
		createProductRow(): any;
		reload(useProductsFromRequest?: boolean): void;
	}

	class EditorProductCollection {
		products: Row[];
		productsAreInitiated: boolean;
		private readonly editor;
		constructor(editor: Editor);
		init(): void;
		count(): number;
		findById(id: string): Row | undefined;
		findByRowId(rowId: string): Row | undefined;
		numerate(): void;
		refreshSort(): void;
		resortByIds(ids: any[]): boolean;
		cleanEmpty(): void;
		unsubscribeAll(): void;
		reset(): void;
	}

	class Row extends SettingsHolder {
		static readonly CATALOG_PRICE_CHANGING_DISABLED = "CATALOG_PRICE_CHANGING_DISABLED";
		private id;
		private editor;
		model: BX.Catalog.ProductModel;
		mainSelector: BX.Catalog.ProductSelector;
		reserveControl: ReserveControl | null;
		storeSelector: BX.Catalog.StoreSelector;
		storeAvailablePopup: StoreAvailablePopup | null;
		fields: Record<string, any>;
		private readonly externalActionsQueue;
		private readonly uiBinder;
		private readonly handleChangeStoreData;
		private readonly handleProductErrorsChange;
		private readonly handleMainSelectorClear;
		private readonly handleStoreFieldChange;
		private readonly handleStoreFieldClear;
		private readonly cache;
		get externalActions(): CrmEntityProductListAction[];
		set externalActions(value: CrmEntityProductListAction[]);
		get onAfterExecuteExternalActions(): (() => void) | null;
		set onAfterExecuteExternalActions(value: (() => void) | null);
		constructor(id: string, fields: Record<string, any>, settings: CrmEntityProductListSettings, editor: Editor);
		getNode(): HTMLElement | null;
		getSelector(): BX.Catalog.ProductSelector | null;
		isNewRow(): boolean;
		getId(): string;
		setId(id: string): void;
		setEditor(editor: Editor): void;
		getEditor(): Editor;
		getEditorContainer(): HTMLElement | null;
		getHintPopup(): HintPopup;
		initHandlers(): void;
		initHandlersForSelectors(): void;
		unsubscribeCustomEvents(): void;
		private initActions;
		modifyBasePriceInput(): void;
		modifyQuantityInput(): void;
		private isEditableCatalogPrice;
		private initSelector;
		private initStoreSelector;
		layoutStoreSelector(): void;
		private initStoreAvailablePopup;
		private applyStoreSelectorTweaks;
		private initReservedControl;
		layoutReserveControl(): void;
		clearReserveControl(): void;
		setRowNumber(num: number): void;
		getFields(fields?: string[]): Record<string, any>;
		getCatalogFields(): Record<string, any>;
		getCalculateFields(): BX.Catalog.FieldScheme;
		setFields(fields: Record<string, any>): void;
		getField(name: string, defaultValue?: any): any;
		setField(name: string, value: any, changeModel?: boolean): void;
		getUiFieldId(field: string): string;
		getBasePrice(): number;
		isPriceNetto(): boolean;
		getPrice(): number;
		getPriceExclusive(): number;
		getPriceNetto(): number;
		getPriceBrutto(): number;
		getQuantity(): number;
		getDiscountType(): BX.Catalog.DiscountTypes;
		isDiscountUndefined(): boolean;
		isDiscountPercentage(): boolean;
		isDiscountMonetary(): boolean;
		isDiscountHandmade(): boolean;
		getDiscountRate(): number;
		getDiscountSum(): number;
		getDiscountRow(): number;
		isEmptyRow(): boolean;
		getTaxIncluded(): CrmEntityProductListYesNo;
		isTaxIncluded(): boolean;
		getTaxRate(): number;
		getTaxSum(): number;
		getTaxNode(): HTMLSelectElement | null;
		getTaxId(): number;
		updateFieldByEvent(fieldCode: string, event: UIEvent): void;
		updateField(fieldCode: string, value: any, mode?: string): void;
		updateFieldValue(code: string, value: any, mode?: string): void;
		updateFieldByName(field: string, value: any): void;
		handleCopyAction(event: any, menuItem: any): void;
		handleDeleteAction(event: any, menuItem: any): void;
		changeProductId(value: any): void;
		changeQuantity(value: any, mode?: string): void;
		changeMeasureCode(value: string, mode?: string): void;
		changeDiscount(value: any, mode?: string): void;
		changeDiscountType(value: any): void;
		changeRowDiscount(value: any, mode?: string): void;
		changeTaxId(value: number): void;
		changeTaxRate(value: number | null | string): void;
		changeTaxIncluded(value: any): void;
		changeRowSum(value: any, mode?: string): void;
		changeProductName(value: any): void;
		changeSort(value: any, mode?: string): void;
		changeStore(value: number): void;
		updateUiStoreAmountData(): void;
		updatePropertyFields(): void;
		clearPropertyFields(): void;
		setRowReserved(value: any): void;
		setDeductedQuantity(value: any): void;
		changeStoreName(value: any): void;
		changeDateReserveEnd(value: string): void;
		changeReserveQuantity(value: number): void;
		resetReserveFields(): void;
		refreshFieldsLayout(exceptFields?: string[]): void;
		getCalculator(): BX.Catalog.ProductCalculator;
		setModel(fields?: Record<string, any>, settings?: CrmEntityProductListSettings): void;
		getModel(): BX.Catalog.ProductModel;
		setProductId(value: any): void;
		changeBasePrice(value: any, mode?: string): void;
		private shouldShowSmallPriceHint;
		private togglePriceHintPopup;
		setQuantity(value: any, mode?: string): void;
		setReserveQuantity(value: any): void;
		setMeasure(measure: any, mode?: string): void;
		setDiscount(value: any, mode?: string): void;
		setDiscountType(value: any): void;
		setRowDiscount(value: any, mode?: string): void;
		setTaxRate(value: any): void;
		setTaxIncluded(value: CrmEntityProductListYesNo, mode?: string): void;
		setRowSum(value: any, mode?: string): void;
		getInputByFieldName(fieldName: string): HTMLElement | null;
		updateUiInputField(name: string, value: any): void;
		updateUiCheckboxField(name: string, value: any): void;
		updateUiMoneyField(name: string, value: number | string, text: string): void;
		updateUiMeasure(code: string, name: string): void;
		updateUiHtmlField(name: string, html: string): void;
		updateUiCurrencyFields(): void;
		updateUiField(field: string, value: any): void;
		parseInt(value: number | string, defaultValue?: number): number;
		parseFloat(value: number | string, precision: number, defaultValue?: number): number;
		getPricePrecision(): number;
		getCalculationPricePrecision(): number;
		getQuantityPrecision(): number;
		getCommonPrecision(): number;
		resetExternalActions(): void;
		addActionProductChange(): void;
		addActionUpdateFieldList(field: string, value: any): void;
		addActionUpdateTotal(): void;
		executeExternalActions(): void;
		isEmpty(): boolean;
		isReserveBlocked(): boolean;
		isInventoryManagementToolEnabled(): boolean;
		getInventoryManagementMode(): string | null;
		isRestrictedStoreInfo(): boolean;
		private getAllowedStores;
		private isReserveEqualProductQuantity;
		getMeasureName(): string;
		private getNodeChildByDataName;
		private getNodesChild;
		setType(value: any): void;
		private needReserveControlInput;
		private needStoreSelectorInput;
	}

	class ReserveControl {
		static readonly INPUT_NAME = "INPUT_RESERVE_QUANTITY";
		static readonly VIEW_NAME = "VIEW_RESERVE_QUANTITY";
		static readonly DATE_NAME = "DATE_RESERVE_END";
		static readonly QUANTITY_NAME = "QUANTITY";
		static readonly DEDUCTED_QUANTITY_NAME = "DEDUCTED_QUANTITY";
		private readonly row;
		private readonly cache;
		isReserveEqualProductQuantity: boolean;
		wrapper: HTMLElement | null;
		readonly measureName: string | undefined;
		readonly inputFieldName: string;
		readonly viewName: string;
		readonly dateFieldName: string;
		readonly quantityFieldName: string;
		readonly deductedQuantityFieldName: string;
		readonly defaultDateReservation: string | null;
		readonly isBlocked: boolean;
		readonly isInventoryManagementToolEnabled: boolean;
		readonly inventoryManagementMode: string;
		constructor(options: CrmEntityProductListReserveControlOptions);
		renderTo(node: HTMLElement): void;
		setReservedQuantity(value: number, isTriggerEvent?: boolean | null): void;
		getReservedQuantity(): number;
		getDateReservation(): string;
		getQuantity(): number;
		getDeductedQuantity(): number;
		getAvailableQuantity(): number;
		onReserveInputChange(event: Event): void;
		changeInputValue(rawValue: number): void;
		clearCache(): void;
		isInputDisabled(): boolean;
		private static onDateInputClick;
		onDateChange(event: Event): void;
		private getDateNode;
		private getReserveInputNode;
		changeDateReservation(date?: string): void;
		private layoutDateReservation;
		disable(wrapper?: Element | null): void;
		private isInventoryManagementMode1C;
		private showNotify;
	}

	class StoreAvailablePopup {
		private readonly rowId;
		private readonly model;
		private readonly inventoryManagementMode;
		private node;
		private popup;
		constructor(options: CrmEntityProductListStoreAvailablePopupOptions);
		setNode(node: HTMLElement): void;
		private createPopup;
		getPopupContent(): HTMLElement;
		openDealsWithReservedProductSlider(): void;
		togglePopup(): void;
	}

	class HintPopup {
		private readonly editor;
		private hintPopup;
		constructor(editor: Editor);
		load(node: HTMLElement, text: string): BX.Main.Popup;
		show(): void;
		close(): void;
	}

	class SettingsPopup {
		private readonly target;
		private readonly settings;
		private readonly editor;
		private readonly cache;
		constructor(target: HTMLElement, settings: CrmEntityProductListSettingItem[] | undefined, editor: Editor);
		show(): void;
		getPopup(): BX.Main.Popup;
		getSetting(id: string): CrmEntityProductListSettingItem | undefined;
		private prepareSettingsContent;
		private getCrmEntityProductListSettingItem;
		private setSetting;
		requestGridSettings(setting: CrmEntityProductListSettingItem, enabled: boolean): void;
		private showNotification;
		updateCheckboxState(): void;
	}
}
