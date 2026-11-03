/* eslint-disable */
this.BX = this.BX || {};
this.BX.Catalog = this.BX.Catalog || {};
(function (exports, catalog_entityCard, catalog_storeEnableWizard, main_core, main_core_events, main_popup, ui_buttons, ui_entitySelector, ui_label, currency_currencyCore) {
	'use strict';

	class StoreDocumentFieldConfigurator extends BX.UI.EntityEditorFieldConfigurator {
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
		getOptionContainer() {
			const optionContainer = super.getOptionContainer();
			this._isRequiredCheckBox = this.getField().getData().requiredIsEditable ? this.getIsRequiredCheckBox() : null;
			return optionContainer;
		}
		onSaveButtonClick() {
			this.getField().getSchemeElement()._isRequired = this._isRequiredCheckBox.checked;
			super.onSaveButtonClick();
			BX.ajax.runComponentAction('bitrix:catalog.store.document.detail', 'changeRequired', {
				mode: 'class',
				data: {
					documentType: this.getEditor().getModel().getData().DOC_TYPE,
					fieldName: this.getField()._id,
					required: this.getField().isRequired() ? 'Y' : 'N'
				}
			});
		}
		getIsRequiredCheckBox() {
			const checkBox = this.createOption({
				caption: main_core.Loc.getMessage('UI_ENTITY_EDITOR_UF_REQUIRED_FIELD')
			});
			checkBox.checked = this._field && this._field.isRequired();
			return checkBox;
		}
	}
	main_core.Reflection.namespace('BX.Catalog').StoreDocumentFieldConfigurator = StoreDocumentFieldConfigurator;

	const disabledAiFillPolicy = {
		isAiFillPolicyAvailable: () => false,
		isAiFillPolicyChanged: () => false,
		isAiFillPolicySupportedForType: () => false,
		getSavedAiFillPolicyState: () => true
	};
	class StoreDocumentFieldConfigurationManager extends BX.UI.EntityConfigurationManager {
		getSimpleFieldConfigurator(params, parent) {
			let typeId = '';
			const field = main_core.Type.isObject(params.field) ? params.field : null;
			if (field) {
				typeId = field.getType();
				field.setVisible(false);
				let userType = field.getSchemeElement().getData().userType;
				userType = main_core.Type.isString(userType) ? userType : false;
				if (userType) {
					typeId = userType;
				}
			} else {
				typeId = main_core.Type.isString(params.TypeId) ? params.TypeId : BX.UI.EntityUserFieldType.string;
			}
			this._fieldConfigurator = StoreDocumentFieldConfigurator.create('', {
				editor: this._editor,
				schemeElement: null,
				model: parent._model,
				mode: BX.UI.EntityEditorMode.edit,
				parent,
				typeId,
				field,
				mandatoryConfigurator: null
			});
			return this._fieldConfigurator;
		}
		getUserFieldConfigurator(params, parent) {
			const configurator = super.getUserFieldConfigurator(params, parent);
			// Remove after http://jabber.bx/view.php?id=256488 fixes the shared configurator contract.
			for (const [methodName, implementation] of Object.entries(disabledAiFillPolicy)) {
				if (!main_core.Type.isFunction(configurator[methodName])) {
					configurator[methodName] = implementation;
				}
			}
			return configurator;
		}
		static create(id, settings) {
			const self = new this();
			self.initialize(id, settings);
			return self;
		}
	}

	class ProductListController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this._setProductListHandler = this.handleSetProductList.bind(this);
			this._tabShowHandler = this.onTabShow.bind(this);
			this._editorControlChangeHandler = this.onEditorControlChange.bind(this);
			this._currencyId = this._model.getField('CURRENCY', '');
			main_core_events.EventEmitter.subscribe(this._editor, 'onControlChanged', this.onEditorControlChange.bind(this));
			main_core_events.EventEmitter.subscribe('DocumentProductListController', this._setProductListHandler);
			main_core_events.EventEmitter.subscribe('onEntityDetailsTabShow', this._tabShowHandler);
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorList:onItemSelect', event => {
				const [field, params] = event.data;
				if (field?.getId() === 'TOTAL_WITH_CURRENCY') {
					this.changeCurrency(params.item.value);
				}
			});
		}
		handleSetProductList(event) {
			const productList = event.getData()[0];
			this.setProductList(productList);
			main_core_events.EventEmitter.unsubscribe('DocumentProductListController', this._setProductListHandler);
		}
		reinitializeProductList() {
			if (this.productList) {
				this.productList.reloadGrid(false);
			}
		}
		onTabShow(event) {
			const [tab] = event.getData();
			if (tab.id === 'tab_products' && this.productList) {
				this.productList.handleOnTabShow();
				main_core_events.EventEmitter.unsubscribe('onEntityDetailsTabShow', this._tabShowHandler);
				main_core_events.EventEmitter.emit('onDocumentProductListTabShow', this);
			}
		}
		innerCancel() {
			this.rollback();
			if (this.productList) {
				this.productList.onInnerCancel();
			}
			this._currencyId = this._model.getField('CURRENCY');
			if (this.productList) {
				this.productList.changeCurrencyId(this._currencyId);
				this.productList.updateTotalUiCurrency();
			}
			this._isChanged = false;
		}
		getCurrencyId = function () {
			return this._currencyId;
		};
		setProductList(productList) {
			if (this.productList === productList) {
				return;
			}
			if (this.productList) {
				this.productList.destroy();
			}
			this.productList = productList;
			if (this.productList) {
				this.productList.setController(this);
				this.productList.setForm(this._editor.getFormElement());
				if (this.productList.getCurrencyId() !== this.getCurrencyId()) {
					this.productList.changeCurrencyId(this.getCurrencyId());
				}
				this._prevProductCount = this._curProductCount = this.productList.getProductCount();
			}
		}
		onAfterSave() {
			super.onAfterSave();
			if (this.productList) {
				this.productList.removeFormFields();
			}
			this._editor._toolPanel.showViewModeButtons();
		}
		productChange(disableSaveButton = false) {
			disableSaveButton = disableSaveButton ?? false;
			this.markAsChanged();
			if (disableSaveButton) {
				this.disableSaveButton();
			}
			main_core_events.EventEmitter.emit('onDocumentProductChange', this.productList.getProductsFields());
		}
		onBeforeSubmit() {
			if (this.productList && (this.isChanged() || this._editor.isNew())) {
				this.productList.compileProductData();
			}
		}
		enableSaveButton() {
			if (this._editor?._toolPanel) {
				this._editor._toolPanel.enableSaveButton();
			}
		}
		disableSaveButton() {
			if (this._editor?._toolPanel) {
				this._editor._toolPanel.disableSaveButton();
			}
		}
		onEditorControlChange(event) {
			const [field, params] = event.getData();
			if (field instanceof BX.UI.EntityEditorMoney && params?.fieldName === 'CURRENCY') {
				this.changeCurrency(params.fieldValue);
			}
		}
		changeCurrency(currencyValue) {
			this._currencyId = currencyValue;
			if (this.productList && this._currencyId) {
				this.productList.changeCurrencyId(this._currencyId);
				this.markAsChanged();
			}
		}
		setTotal(totalData) {
			this._model.setField('FORMATTED_TOTAL', BX.Currency.currencyFormat(totalData.totalCost, this.getCurrencyId(), false));
			this._model.setField('FORMATTED_TOTAL_WITH_CURRENCY', BX.Currency.currencyFormat(totalData.totalCost, this.getCurrencyId(), true));
			this._model.setField('TOTAL', totalData.totalCost);
			const totalCurrencyControl = this._editor.getControlById('TOTAL_WITH_CURRENCY');
			if (totalCurrencyControl instanceof BX.UI.EntityEditorMoney) {
				totalCurrencyControl.refreshLayout();
			}
		}
		validateProductList() {
			let errorsArray = this.productList.validate();
			if (errorsArray.length > 0) {
				this._editor._toolPanel.addError(errorsArray[0]);
				main_core_events.EventEmitter.emit('onProductsCheckFailed', errorsArray);
				return false;
			}
			return true;
		}
	}

	class DocumentCardController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this._model.lockField('TOTAL');
		}
		doInitialize() {
			this.#subscribeToEvents();
		}
		#subscribeToEvents() {
			this.#subscribeToProductRowSummaryEvents();
		}
		#subscribeToProductRowSummaryEvents() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorProductRowSummary:onDetailProductListLinkClick', () => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
			});
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorProductRowSummary:onAddNewRowInProductList', () => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
				setTimeout(() => {
					main_core_events.EventEmitter.emit('onFocusToProductList');
				}, 500);
			});
		}
		onAfterSave() {
			super.onAfterSave();
			window.top.BX.onCustomEvent('DocumentCard:onDocumentCardSave');
			let sliders = BX.SidePanel.Instance.getOpenSliders();
			sliders.forEach(slider => {
				if (slider.getWindow()?.BX.Catalog?.DocumentGridManager) {
					slider.getWindow().BX.onCustomEvent('DocumentCard:onDocumentCardSave');
				}
			});
		}
	}

	class ControllersFactory {
		constructor(eventName) {
			main_core_events.EventEmitter.subscribe(eventName, event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods['entityCard'] = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			if (type === 'document_card') {
				return new DocumentCardController(controlId, settings);
			}
			if (type === 'catalog_store_document_product_list') {
				return new ProductListController(controlId, settings);
			}
			return null;
		}
	}

	/**
	 * @deprecated Use BX.UI.EntityEditorProductRowSummary instead
	 */
	class ProductRowSummary extends BX.UI.EntityEditorField {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this._loader = null;
			this._productsContainer = null;
			this._previousData = [];
			this._itemCount = 0;
			this._totalCount = 0;
			this._moreButton = null;
			this._moreButtonRow = null;
			this._totalsRow = null;
			this._moreButtonClickHandler = BX.delegate(this._onMoreButtonClick, this);
			this._visibleItemsLimit = 5;
		}
		layout(options = {}) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({});
			this.adjustWrapper();
			var data = this.getValue();
			if (!BX.type.isPlainObject(data)) {
				return;
			}
			var title = this.getTitle();
			var items = BX.prop.getArray(data, 'items', []);
			this._totalCount = BX.prop.getInteger(data, 'count', 0);
			this._itemCount = items.length;
			var length = this._itemCount;
			var maxLength = this._visibleItemsLimit;
			var restLength = 0;
			if (length > maxLength) {
				restLength = this._totalCount - maxLength;
				length = maxLength;
			}
			if (this.isDragEnabled()) {
				this._wrapper.appendChild(this.createDragButton());
			}
			this._wrapper.appendChild(this.createTitleNode(title));
			this._productsContainer = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-list'
				}
			});
			for (var i = 0; i < length; i++) {
				this.addProductRow(items[i]);
			}
			this._moreButton = null;
			if (restLength > 0) {
				this.addMoreButton(restLength);
			}
			this.addTotalRow(data['total']);
			this._wrapper.appendChild(BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products'
				},
				children: [this._productsContainer]
			}));
			if (this.isContextMenuEnabled()) {
				this._wrapper.appendChild(this.createContextMenuButton());
			}
			if (this.isDragEnabled()) {
				this.initializeDragDropAbilities();
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		addMoreButton(restLength) {
			var row = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-item'
				}
			});
			this._moreButtonRow = row;
			this._productsContainer.appendChild(row);
			var nameCell = BX.create("div", {
				props: {
					className: 'catalog-entity-widget-content-block-products-item-name'
				}
			});
			row.appendChild(nameCell);
			this._moreButton = BX.create('span', {
				attrs: {
					className: 'catalog-entity-widget-content-block-products-show-more'
				},
				events: {
					click: this._moreButtonClickHandler
				},
				text: main_core.Loc.getMessage('DOCUMENT_PRODUCTS_NOT_SHOWN', {
					'#COUNT#': restLength.toString()
				})
			});
			nameCell.appendChild(this._moreButton);
			row.appendChild(BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-price'
				}
			}));
		}
		addTotalRow(total) {
			var row = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-item'
				}
			});
			this._totalsRow = row;
			this._productsContainer.appendChild(row);
			var nameCell = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-item-name'
				},
				html: main_core.Loc.getMessage('DOCUMENT_PRODUCTS_TOTAL')
			});
			row.appendChild(nameCell);
			var valueCell = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-price'
				},
				html: currency_currencyCore.CurrencyCore.currencyFormat(total.amount, total.currency, true)
			});
			row.appendChild(valueCell);
		}
		addAddProductButton() {
			let addProductsLink = BX.create('a', {
				props: {
					href: '#'
				}
			});
			addProductsLink.text = main_core.Loc.getMessage('DOCUMENT_PRODUCTS_ADD_PRODUCT');
			addProductsLink.onclick = () => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
			};
			let row = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-add-products'
				},
				children: [addProductsLink]
			});
			this._productsContainer.appendChild(row);
		}
		_onMoreButtonClick(e) {
			main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
				tabId: 'tab_products'
			});
		}
		doClearLayout() {
			this._productsContainer = null;
			this._moreButton = null;
			this._moreButtonRow = null;
			this._totalsRow = null;
		}
		addProductRow(data) {
			var row = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-item'
				}
			});
			this._productsContainer.appendChild(row);
			var nameCell = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-item-name'
				}
			});
			nameCell.innerHTML = BX.util.htmlspecialchars(data['PRODUCT_NAME']);
			row.appendChild(nameCell);
			var valueCell = BX.create('div', {
				props: {
					className: 'catalog-entity-widget-content-block-products-price'
				}
			});
			row.appendChild(valueCell);
			valueCell.appendChild(BX.create('div', {
				attrs: {
					className: 'catalog-entity-widget-content-block-products-price-value'
				},
				html: data['SUM']
			}));
		}
	}

	class Contractor extends BX.UI.EntityEditorField {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this._input = null;
			this.innerWrapper = null;
			this.currentContractorName = '';
			this.viewModeDisplay = null;
		}
		getContentWrapper() {
			return this.innerWrapper;
		}
		layout(options = {}) {
			if (this._hasLayout) {
				return;
			}
			this.ensureWrapperCreated({});
			this.adjustWrapper();
			let title = this.getTitle();
			if (this.isDragEnabled()) {
				this._wrapper.appendChild(this.createDragButton());
			}
			this._wrapper.appendChild(this.createTitleNode(title));
			let name = this.getName();
			let value = this.getValue();
			this._schemeElement.getData();
			if (!this.currentContractorName) {
				this.currentContractorName = this.getContractorNameFromModel();
			}
			this._input = main_core.Tag.render`<input name="${name}" type="hidden" value="${value}"/>`;
			this._wrapper.appendChild(this._input);
			this.innerWrapper = main_core.Tag.render`<div class="ui-entity-editor-content-block"></div>`;
			this._wrapper.appendChild(this.innerWrapper);
			if (this._mode === BX.UI.EntityEditorMode.edit) {
				let currentSelectedItems = [];
				if (value) {
					currentSelectedItems.push({
						id: value,
						entityId: 'contractor',
						title: this.currentContractorName
					});
				}
				let contractorSelector = new ui_entitySelector.TagSelector({
					items: currentSelectedItems,
					placeholder: main_core.Loc.getMessage('DOCUMENT_CONTRACTOR_FIELD_PLACEHOLDER'),
					textBoxWidth: '100%',
					multiple: false,
					dialogOptions: {
						context: 'catalog_document_contractors',
						entities: [{
							id: 'contractor',
							dynamicLoad: true,
							dynamicSearch: true
						}],
						searchOptions: {
							allowCreateItem: true,
							footerOptions: {
								label: main_core.Loc.getMessage('DOCUMENT_ADD_CONTRACTOR')
							}
						},
						events: {
							'Item:onSelect': event => {
								this._input.value = event.data.item.getId();
								if (this.viewModeDisplay) {
									this.currentContractorName = event.data.item.getTitle();
									this.viewModeDisplay.innerHTML = BX.util.htmlspecialchars(this.currentContractorName);
								}
								this._changeHandler();
							},
							'Search:onItemCreateAsync': this.createContractor.bind(this),
							'Item:onDeselect': event => {
								this._input.value = '';
								this._changeHandler();
							}
						}
					}
				});
				contractorSelector.renderTo(this.innerWrapper);
				if (BX.UI.EntityEditorModeOptions.check(this._modeOptions, BX.UI.EntityEditorModeOptions.individual)) {
					contractorSelector.getDialog().show();
				}
			} else
				// if(this._mode === BX.UI.EntityEditorMode.view)
				{
					if (this.hasContentToDisplay()) {
						this.viewModeDisplay = main_core.Tag.render`<div class="ui-entity-editor-content-block-text">${BX.util.htmlspecialchars(this.currentContractorName)}</div>`;
					} else {
						this.viewModeDisplay = main_core.Tag.render`<div class="ui-entity-editor-content-block-text">${main_core.Loc.getMessage('DOCUMENT_CONTRACTOR_NOT_FILLED')}</div>`;
					}
					this.innerWrapper.appendChild(this.viewModeDisplay);
				}
			if (this.isContextMenuEnabled()) {
				this._wrapper.appendChild(this.createContextMenuButton());
			}
			if (this.isDragEnabled()) {
				this.initializeDragDropAbilities();
			}
			this.registerLayout(options);
			this._hasLayout = true;
		}
		validate(result) {
			if (!(this._mode === BX.UI.EntityEditorMode.edit && this._input)) {
				throw "BX.Catalog.DocumentCard.Contractor. Invalid validation context";
			}
			this.clearError();
			if (this.hasValidators()) {
				return this.executeValidators(result);
			}
			let isValid = !(this.isRequired() || this.isRequiredByAttribute()) || BX.util.trim(this._input.value) !== "";
			if (!isValid) {
				result.addError(BX.UI.EntityValidationError.create({
					field: this
				}));
				this.showRequiredFieldError(this._input);
			}
			return isValid;
		}
		hasValue() {
			if (this.getValue() === '0') {
				return false;
			}
			return super.hasValue();
		}
		getModeSwitchType(mode) {
			let result = BX.UI.EntityEditorModeSwitchType.common;
			if (mode === BX.UI.EntityEditorMode.edit) {
				result |= BX.UI.EntityEditorModeSwitchType.button | BX.UI.EntityEditorModeSwitchType.content;
			}
			return result;
		}
		createContractor(event) {
			let {
				searchQuery
			} = event.getData();
			let companyName = searchQuery.getQuery();
			return new Promise((resolve, reject) => {
				const dialog = event.getTarget();
				const fields = {
					companyName
				};
				dialog.showLoader();
				main_core.ajax.runAction('catalog.contractor.createContractor', {
					data: {
						fields
					}
				}).then(response => {
					dialog.hideLoader();
					const item = dialog.addItem({
						id: response.data.id,
						entityId: 'contractor',
						title: searchQuery.getQuery(),
						tabs: dialog.getRecentTab().getId()
					});
					if (item) {
						item.select();
					}
					dialog.hide();
					resolve();
				}).catch(() => {
					dialog.hideLoader();
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('DOCUMENT_ADD_CONTRACTOR_ERROR')
					});
					dialog.hide();
					reject();
				});
			});
		}
		getContractorNameFromModel() {
			return this._model.getSchemeField(this._schemeElement, 'contractorName', '');
		}
		rollback() {
			this.currentContractorName = this.getContractorNameFromModel();
		}
	}

	class FieldsFactory {
		constructor() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorControlFactory:onInitialize', event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods['documentCard'] = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			if (type === 'contractor') {
				return new Contractor(controlId, settings);
			}
			return null;
		}
	}

	class DocumentModel extends BX.UI.EntityModel {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
		}
		isCaptionEditable() {
			return true;
		}
		getCaption() {
			var title = this.getField("TITLE");
			return BX.type.isString(title) ? title : "";
		}
		setCaption(caption) {
			this.setField("TITLE", caption);
		}
		prepareCaptionData(data) {
			data["TITLE"] = this.getField("TITLE", "");
		}
	}

	class ModelFactory {
		constructor() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorModelFactory:onInitialize', event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods['store_document'] = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			if (type === 'store_document') {
				return new DocumentModel(controlId, settings);
			}
			return null;
		}
	}

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
	let DocumentCard = /*#__PURE__*/function (_BaseCard) {
		function DocumentCard(id, settings) {
			var _this;
			babelHelpers.classCallCheck(this, DocumentCard);
			_this = _callSuper(this, DocumentCard, [id, settings]);
			_this.documentType = settings.documentType;
			_this.isDocumentConducted = settings.documentStatus === 'Y';
			_this.componentName = settings.componentName;
			_this.signedParameters = settings.signedParameters;
			_this.isConductLocked = settings.isConductLocked;
			_this.masterSliderUrl = settings.masterSliderUrl;
			_this.isInventoryManagementDisabled = settings.isInventoryManagementDisabled;
			_this.inventoryManagementFeatureCode = settings.inventoryManagementFeatureCode;
			_this.editorName = settings.includeCrmEntityEditor ? 'BX.Crm.EntityEditor' : 'BX.UI.EntityEditor';
			_this.inventoryManagementSource = settings.inventoryManagementSource;
			_this.lockedCancellation = settings.lockedCancellation || false;
			_this.activeTabId = 'main';
			_this.insidePageTitleConfig = settings.insidePageTitleConfig || {};
			_this.isTabAnalyticsSent = false;
			if (main_core.Type.isPlainObject(_this.insidePageTitleConfig)) {
				_this.appendInsidePageTitle(_this.insidePageTitleConfig);
			}
			_this.setSliderText();
			_this.addCopyLinkPopup();
			_this.subscribeToEvents();
			if (settings.documentTypeSelector) {
				_this.initDocumentTypeSelector();
			}
			_instance._ = _this;

			// setting this to true so that we can decide
			// whether to close the slider or not on the fly on backend (closeOnSave=Y)
			BX.UI.SidePanel.Wrapper.setParam('closeAfterSave', true);
			_this.showNotificationOnClose = false;
			return _this;
		}
		babelHelpers.inherits(DocumentCard, _BaseCard);
		return babelHelpers.createClass(DocumentCard, [{
			key: "appendInsidePageTitle",
			value: function appendInsidePageTitle(config) {
				const toolbar = BX.UI?.ToolbarManager?.getDefaultToolbar();
				const titleContainer = toolbar?.titleContainer.querySelector('.ui-toolbar-title-item-box');
				if (!titleContainer) {
					return;
				}
				let editButton = null;
				let pageLink = null;
				if (config.enableEditTitle) {
					editButton = main_core.Tag.render`
				<span id="pagetitle_edit" class="pagetitle-edit-button"></span>
			`;
				}
				if (config.enablePageLink) {
					pageLink = main_core.Tag.render`
				<span id="${this.settings.copyLinkButtonId}" class="page-link-btn"></span>
			`;
				}
				if (editButton || pageLink) {
					const buttonContainer = main_core.Tag.render`
				<span id="pagetitle_btn_wrapper" class="pagetitile-button-container"></span>
			`;
					if (editButton) {
						main_core.Dom.append(editButton, buttonContainer);
					}
					if (pageLink) {
						main_core.Dom.append(pageLink, buttonContainer);
					}
					main_core.Dom.append(buttonContainer, titleContainer);
				}
				if (config.enableStatusLabel) {
					const labelOptions = {
						text: config.statusLabel.text,
						color: config.statusLabel.color,
						size: ui_label.LabelSize.LG,
						link: '',
						fill: true,
						customClass: 'document-status-label'
					};
					const label = new ui_label.Label(labelOptions);
					main_core.Dom.append(label.render(), titleContainer);
				}
			}
		}, {
			key: "initDocumentTypeSelector",
			value: function initDocumentTypeSelector() {
				const documentTypeSelector = this.settings.documentTypeSelector;
				const documentTypeSelectorTypes = this.settings.documentTypeSelectorTypes;
				if (!documentTypeSelector || !documentTypeSelectorTypes) {
					return;
				}
				const menuItems = [];
				documentTypeSelectorTypes.forEach(type => {
					menuItems.push({
						text: main_core.Loc.getMessage(`DOC_TYPE_SHORT_${type}`),
						onclick: e => {
							const slider = BX.SidePanel.Instance.getTopSlider();
							if (slider) {
								slider.url = BX.Uri.addParam(slider.getUrl(), {
									DOCUMENT_TYPE: type
								});
								slider.url = BX.Uri.removeParam(slider.url, ['firstTime', 'focusedTab']);
								if (this.activeTabId !== 'main') {
									slider.url = BX.Uri.addParam(slider.getUrl(), {
										focusedTab: this.activeTabId
									});
								}
								if (type === 'A' || type === 'S') {
									slider.requestMethod = 'post';
									slider.requestParams = {
										preloadedFields: {
											DOCUMENT_FIELDS: this.getDocumentFieldsForTypeSwitching(),
											PRODUCTS: this.getProductsForTypeSwitching()
										}
									};
								}
								slider.setFrameSrc();
							}
						}
					});
				});
				const popupMenu = main_popup.MenuManager.create({
					id: 'document-type-selector',
					bindElement: documentTypeSelector,
					items: menuItems
				});
				documentTypeSelector.addEventListener('click', e => {
					e.preventDefault();
					popupMenu.show();
				});
			}
		}, {
			key: "getDocumentFieldsForTypeSwitching",
			value: function getDocumentFieldsForTypeSwitching() {
				const documentFields = {};
				const editor = this.getEditorInstance();
				if (!editor) {
					return documentFields;
				}
				const form = editor.getFormElement();
				const formData = new FormData(form);
				const formProps = Object.fromEntries(formData);
				const fieldsToTransfer = ['TITLE', 'CURRENCY', 'TOTAL'];
				fieldsToTransfer.forEach(field => {
					documentFields[field] = formProps[field] ?? '';
				});
				return documentFields;
			}
		}, {
			key: "getProductsForTypeSwitching",
			value: function getProductsForTypeSwitching() {
				const products = [];
				if (!main_core.Reflection.getClass('BX.Catalog.Store.ProductList.Instance')) {
					return products;
				}
				const productFields = ['ID', 'STORE_TO', {
					ELEMENT_ID: 'SKU_ID'
				}, 'AMOUNT', 'PURCHASING_PRICE', 'BASE_PRICE', 'BASE_PRICE_EXTRA', 'BASE_PRICE_EXTRA_RATE'];
				BX.Catalog.Store.ProductList.Instance.getProductsFields().forEach(productRow => {
					const product = {};
					productFields.forEach(field => {
						if (main_core.Type.isObject(field)) {
							const destinationField = Object.keys(field)[0];
							const sourceField = field[destinationField];
							product[destinationField] = productRow[sourceField] ?? '';
						} else {
							product[field] = productRow[field] ?? '';
						}
					});
					products.push(product);
				});
				return products;
			}
		}, {
			key: "openMasterSlider",
			value: function openMasterSlider() {
				const card = this;
				new catalog_storeEnableWizard.EnableWizardOpener().open(this.masterSliderUrl, {
					urlParams: {
						analyticsContextSection: catalog_storeEnableWizard.AnalyticsContextList.DOCUMENT_CARD
					},
					data: {
						openGridOnDone: false
					},
					events: {
						onCloseComplete: function (event) {
							const slider = event.getSlider();
							if (!slider) {
								return;
							}
							if (slider.getData().get('isInventoryManagementEnabled')) {
								card.isConductLocked = false;
								BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
									if (slider.getWindow()?.BX.Catalog?.DocumentGridManager) {
										slider.allowChangeHistory = false;
										slider.getWindow().location.reload();
									}
								});
							}
						}
					}
				});
			}
		}, {
			key: "adjustToolPanel",
			value: function adjustToolPanel() {}
		}, {
			key: "focusOnTab",
			value: function focusOnTab(tabId) {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: tabId
				});
			}

			// deprecated
		}, {
			key: "setViewModeButtons",
			value: function setViewModeButtons(editor) {
				editor._toolPanel.showViewModeButtons();
			}

			// deprecated
		}, {
			key: "setEditModeButtons",
			value: function setEditModeButtons(editor) {
				editor._toolPanel.showEditModeButtons();
			}
		}, {
			key: "getEditorInstance",
			value: function getEditorInstance() {
				const editorInstance = main_core.Reflection.getClass(this.editorName);
				if (editorInstance) {
					return editorInstance.getDefault();
				}
				return null;
			}
		}, {
			key: "subscribeToEvents",
			value: function subscribeToEvents() {
				this.subscribeToUserSelectorEvent();
				this.subscribeToValidationFailedEvent();
				this.subscribeToOnSaveEvent();
				this.subscribeToTabOpenEvent();
				this.subscribeToDirectActionEvent();
				this.subscribeToEntityCreateEvent();
				this.subscribeToBeforeEntityRedirectEvent();
				this.subscribeToCreateUserFieldEvent();
				this.subscribeToFieldConfiguratorEvent();
			}
		}, {
			key: "subscribeToFieldConfiguratorEvent",
			value: function subscribeToFieldConfiguratorEvent() {
				main_core_events.EventEmitter.subscribe('BX.UI.EntityConfigurationManager:onInitialize', this.onConfigurationManagerInit.bind(this));
			}
		}, {
			key: "onConfigurationManagerInit",
			value: function onConfigurationManagerInit(event) {
				const [, eventArgs] = event.getCompatData();
				if (!eventArgs.type || eventArgs.type === 'editor') {
					eventArgs.configurationFieldManager = StoreDocumentFieldConfigurationManager.create(this.id, eventArgs);
				}
				event.stopImmediatePropagation();
			}
		}, {
			key: "subscribeToCreateUserFieldEvent",
			value: function subscribeToCreateUserFieldEvent() {
				main_core_events.EventEmitter.subscribe('BX.UI.EntityConfigurationManager:onCreateClick', e => {
					e.data.isCanceled = true;
					const editor = this.getEditorInstance();
					const createUrl = editor.getConfigurationFieldManager().getCreationPageUrl('custom');
					if (createUrl) {
						top.BX.SidePanel.Instance.open(createUrl);
					}
				});
			}
		}, {
			key: "subscribeToUserSelectorEvent",
			value: function subscribeToUserSelectorEvent() {
				if (this.editorName !== 'BX.UI.EntityEditor') {
					return;
				}
				main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorUser:openSelector', event => {
					const eventData = event.data[1];
					const dialog = new ui_entitySelector.Dialog({
						targetNode: eventData.anchor,
						enableSearch: true,
						multiple: false,
						context: 'CATALOG_DOCUMENT',
						entities: [{
							id: 'user'
						}, {
							id: 'department'
						}],
						events: {
							'Item:onSelect': onSelectEvent => {
								const fieldId = eventData.id;
								const selectedItem = onSelectEvent.data.item;
								const userData = {
									entityId: selectedItem.id,
									avatar: selectedItem.avatar,
									name: main_core.Text.encode(selectedItem.title.text)
								};
								if (this.entityId > 0) {
									const fields = {};
									fields[fieldId] = selectedItem.id;
									BX.ajax.runComponentAction(this.componentName, 'save', {
										mode: 'class',
										signedParameters: this.signedParameters,
										data: {
											fields: fields
										}
									}).then(result => {
										eventData.callback(dialog, userData);
									});
								} else {
									eventData.callback(dialog, userData);
								}
							}
						}
					});
					dialog.show();
				});
			}
		}, {
			key: "subscribeToValidationFailedEvent",
			value: function subscribeToValidationFailedEvent() {
				main_core_events.EventEmitter.subscribe(`${this.editorName}:onFailedValidation`, event => {
					main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
						tabId: 'main'
					});
				});
				main_core_events.EventEmitter.subscribe('onProductsCheckFailed', event => {
					main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
						tabId: 'tab_products'
					});
				});
			}
		}, {
			key: "subscribeToOnSaveEvent",
			value: function subscribeToOnSaveEvent() {
				main_core_events.EventEmitter.subscribe(`${this.editorName}:onSave`, event => {
					const eventEditor = event.data[0];
					const action = event.data[1]?.actionId;
					if (eventEditor && eventEditor._ajaxForm) {
						eventEditor._toolPanel?.clearErrors();
						if (this.isInventoryManagementDisabled && this.inventoryManagementFeatureCode) {
							event.data[1].cancel = true;
							event.data[0]._toolPanel?.setLocked(false);
							top.BX.UI.InfoHelper.show(this.inventoryManagementFeatureCode);
							return;
						}
						if (action === 'SAVE_AND_CONDUCT') {
							if (this.isConductLocked) {
								event.data[1].cancel = true;
								event.data[0]._toolPanel?.setLocked(false);
								this.openMasterSlider();
								return;
							}
							if (!this.validateControllers(eventEditor.getControllers())) {
								event.data[1].cancel = true;
								eventEditor._toolPanel?.setLocked(false);
								return;
							}
							if (event.data[1].cancel) {
								return;
							}
						}
						const form = eventEditor._ajaxForms[action];
						if (form) {
							form.addUrlParams({
								documentType: this.documentType,
								isNewDocument: this.entityId <= 0 ? 'Y' : 'N',
								inventoryManagementSource: this.inventoryManagementSource
							});
						}
					}
				});
			}
		}, {
			key: "subscribeToTabOpenEvent",
			value: function subscribeToTabOpenEvent() {
				main_core_events.EventEmitter.subscribe('BX.Catalog.EntityCard.TabManager:onSelectItem', event => {
					const tabId = event.data.tabId;
					if (tabId === 'tab_products' && !this.isTabAnalyticsSent) {
						this.sendAnalyticsData({
							tab: 'products',
							isNewDocument: this.entityId <= 0 ? 'Y' : 'N',
							documentType: this.documentType,
							inventoryManagementSource: this.inventoryManagementSource
						});
						this.isTabAnalyticsSent = true;
					}
					if (tabId) {
						this.activeTabId = tabId;
					}
				});
			}
		}, {
			key: "subscribeToDirectActionEvent",
			value: function subscribeToDirectActionEvent() {
				main_core_events.EventEmitter.subscribe(`${this.editorName}:onDirectAction`, event => {
					const eventEditor = event.data[0];
					if (this.isInventoryManagementDisabled && this.inventoryManagementFeatureCode) {
						event.data[1].cancel = true;
						event.data[0]._toolPanel?.setLocked(false);
						top.BX.UI.InfoHelper.show(this.inventoryManagementFeatureCode);
						return;
					}
					if (event.data[1]?.actionId === 'CONDUCT') {
						eventEditor._toolPanel?.clearErrors();
						if (this.isConductLocked) {
							event.data[1].cancel = true;
							event.data[0]._toolPanel?.setLocked(false);
							this.openMasterSlider();
							return;
						}
						if (!this.validateControllers(eventEditor.getControllers())) {
							event.data[1].cancel = true;
							eventEditor._toolPanel?.setLocked(false);
							return;
						}
						event.data[0]._ajaxForms.CONDUCT.addUrlParams({
							documentType: this.documentType,
							inventoryManagementSource: this.inventoryManagementSource
						});
					}
					if (event.data[1]?.actionId === 'CANCEL_CONDUCT') {
						if (this.isLockedCancellation()) {
							this.showCancellationInfo();
							event.data[1].cancel = true;
							event.data[0]._toolPanel?.setLocked(false);
							return;
						}
						event.data[0]._ajaxForms.CANCEL_CONDUCT.addUrlParams({
							documentType: this.documentType,
							inventoryManagementSource: this.inventoryManagementSource
						});
					}
				});
			}
		}, {
			key: "subscribeToEntityCreateEvent",
			value: function subscribeToEntityCreateEvent() {
				main_core_events.EventEmitter.subscribe('onEntityCreate', event => {
					window.top.BX.onCustomEvent('DocumentCard:onEntityCreate');
					BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
						if (slider.getWindow()?.BX.Catalog?.DocumentGridManager) {
							slider.getWindow().BX.onCustomEvent('DocumentCard:onEntityCreate');
						}
					});
					const editor = event?.data[0]?.sender;
					if (editor) {
						editor._toolPanel.disableSaveButton();
						editor.hideToolPanel();
					}
				});
			}
		}, {
			key: "subscribeToBeforeEntityRedirectEvent",
			value: function subscribeToBeforeEntityRedirectEvent() {
				main_core_events.EventEmitter.subscribe('beforeEntityRedirect', event => {
					window.top.BX.onCustomEvent('DocumentCard:onBeforeEntityRedirect');
					BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
						slider.getWindow().BX.onCustomEvent('DocumentCard:onBeforeEntityRedirect');
					});
					const editor = event?.data[0]?.sender;
					if (editor) {
						editor._toolPanel.disableSaveButton();
						editor.hideToolPanel();
						this.showNotificationOnClose = event?.data[0]?.showNotificationOnClose === 'Y';
						if (this.showNotificationOnClose) {
							let url = event.data[0].redirectUrl;
							if (!url) {
								return;
							}
							url = BX.Uri.removeParam(url, 'closeOnSave');
							window.top.BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('DOCUMENT_CONDUCT_SUCCESSFUL'),
								actions: [{
									title: main_core.Loc.getMessage('DOCUMENT_CONDUCT_SUCCESSFUL_VIEW'),
									href: url,
									events: {
										click: function (event, balloon, action) {
											balloon.close();
										}
									}
								}]
							});
						}
					}
				});
			}
		}, {
			key: "validateControllers",
			value: function validateControllers(controllers) {
				let validateResult = true;
				if (Array.isArray(controllers)) {
					controllers.forEach(controller => {
						if (controller instanceof ProductListController && !controller.validateProductList()) {
							validateResult = false;
						}
					});
				} else {
					validateResult = false;
				}
				return validateResult;
			}
		}, {
			key: "sendAnalyticsData",
			value: function sendAnalyticsData(data) {
				BX.ajax.runAction('catalog.analytics.sendAnalyticsLabel', {
					analyticsLabel: data
				});
			}
		}, {
			key: "addCopyLinkPopup",
			value: function addCopyLinkPopup() {
				const copyLinkButton = document.getElementById(this.settings.copyLinkButtonId);
				if (!copyLinkButton) {
					return;
				}
				copyLinkButton.onclick = () => {
					this.copyDocumentLinkToClipboard();
				};
			}
		}, {
			key: "copyDocumentLinkToClipboard",
			value: function copyDocumentLinkToClipboard() {
				const url = BX.util.remove_url_param(window.location.href, ['IFRAME', 'IFRAME_TYPE']);
				if (!BX.clipboard.copy(url)) {
					return;
				}
				var popup = new BX.PopupWindow('catalog_copy_document_url_to_clipboard', document.getElementById(this.settings.copyLinkButtonId), {
					content: main_core.Loc.getMessage('DOCUMENT_LINK_COPIED'),
					darkMode: true,
					autoHide: true,
					zIndex: 1000,
					angle: true,
					bindOptions: {
						position: 'top'
					}
				});
				popup.show();
				setTimeout(() => {
					popup.close();
				}, 1500);
			}
		}, {
			key: "setSliderText",
			value: function setSliderText() {
				const slider = BX.SidePanel.Instance.getTopSlider();
				if (slider) {
					slider.getLabel().setText(main_core.Loc.getMessage(`SLIDER_LABEL_${this.documentType}`));
				}
			}
		}, {
			key: "disableSaveAndConductButton",
			value: function disableSaveAndConductButton() {
				if (!this.conductAndSaveButton) {
					return;
				}
				this.conductAndSaveButton.disabled = true;
				BX.addClass(this.conductAndSaveButton, 'ui-btn-disabled');
			}
		}, {
			key: "enableSaveAndConductButton",
			value: function enableSaveAndConductButton() {
				if (!this.conductAndSaveButton) {
					return;
				}
				this.conductAndSaveButton.disabled = false;
				BX.removeClass(this.conductAndSaveButton, 'ui-btn-disabled');
			}
		}, {
			key: "isLockedCancellation",
			value: function isLockedCancellation() {
				return this.lockedCancellation;
			}
		}, {
			key: "showCancellationInfo",
			value: function showCancellationInfo() {
				const popup = new main_popup.Popup(null, null, {
					events: {
						onPopupClose: () => {
							popup.destroy();
						}
					},
					content: this.getCancellationPopupContent(),
					overlay: true,
					buttons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_YES'),
						color: ui_buttons.Button.Color.PRIMARY,
						onclick: () => {
							this.lockedCancellation = false;
							this.getEditorInstance()?.performAction('CANCEL_CONDUCT');
							popup.close();
						}
					}), new BX.UI.Button({
						text: main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_NO'),
						color: BX.UI.Button.Color.LINK,
						onclick: () => {
							popup.close();
						}
					})]
				});
				popup.show();
			}
		}, {
			key: "getCancellationPopupContent",
			value: function getCancellationPopupContent() {
				const moreLink = main_core.Tag.render`<a href="#" class="ui-form-link">${main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_LINK')}</a>`;
				main_core.Event.bind(moreLink, 'click', () => {
					const articleId = 17858278;
					top.BX.Helper.show(`redirect=detail&code=${articleId}`);
				});
				const descriptionHtml = main_core.Tag.render`
			<div>${main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_HINT', {
				'#HELP_LINK#': '<help-link></help-link>'
			})}</div>
		`;
				main_core.Dom.replace(descriptionHtml.querySelector('help-link'), moreLink);
				return main_core.Tag.render`
			<div>
				<h3>${main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_TITLE')}</h3>
				<div>${main_core.Text.encode(main_core.Loc.getMessage('CANCEL_CONDUCT_CANCELLATION_POPUP_QUESTION'))}
				<br>${descriptionHtml}<div>
			</div>
		`;
			}
		}], [{
			key: "getInstance",
			value: function getInstance() {
				return _instance._;
			}
		}, {
			key: "registerFieldFactory",
			value: function registerFieldFactory() {
				new FieldsFactory();
			}
		}, {
			key: "registerModelFactory",
			value: function registerModelFactory() {
				new ModelFactory();
			}
		}, {
			key: "registerDocumentControllersFactory",
			value: function registerDocumentControllersFactory(eventName) {
				new ControllersFactory(eventName);
			}
		}]);
	}(catalog_entityCard.BaseCard);
	var _instance = {
		_: void 0
	};

	class Button {
		static render(parentNode, highlight) {
			const buttonTitle = main_core.Loc.getMessage('FEEDBACK_BUTTON_TITLE');
			const button = main_core.Tag.render`
			<button class="ui-btn ui-btn-light-border ui-btn-themes" title="${buttonTitle}">
				<span class="ui-btn-text">
					${buttonTitle}
				</span>
			</button>
		`;
			if (highlight) {
				button.style.zIndex = 140;
				button.style.backgroundColor = '#fff';
			}
			button.addEventListener('click', () => {
				BX.Catalog.DocumentCard.Slider.openFeedbackForm();
			});
			parentNode.appendChild(button);
			return button;
		}
	}

	class Slider {
		static openFeedbackForm() {
			BX.UI.Feedback.Form.open(Slider.getFeedbackParams());
		}
		static async openIntegrationRequestForm(event) {
			if (event && main_core.Type.isFunction(event.preventDefault)) {
				event.preventDefault();
			}
			try {
				const response = await main_core.ajax.runComponentAction('bitrix:catalog.feedback', 'getFormParams', {
					mode: 'class'
				});
				const {
					Form
				} = await main_core.Runtime.loadExtension(['ui.feedback.form']);
				const formIdNumber = Math.round(Math.random() * 1000);
				const data = response.data;
				data.id += formIdNumber.toString();
				Form.open(data);
			} catch (err) {
				await console.error(err);
			}
		}
		static open(url, rawOptions) {
			let options = main_core.Type.isPlainObject(rawOptions) ? rawOptions : {};
			options = {
				cacheable: false,
				allowChangeHistory: false,
				events: {},
				...options
			};
			return new Promise(resolve => {
				if (main_core.Type.isString(url) && url.length > 1) {
					options.events.onClose = function (event) {
						resolve(event.getSlider());
					};
					BX.SidePanel.Instance.open(url, rawOptions);
				} else {
					resolve();
				}
			});
		}
		static getFeedbackParams() {
			return {
				id: `catalog-feedback-${parseInt(Math.random() * 1000, 10)}`,
				forms: [{
					id: 384,
					lang: 'ru',
					sec: '0pskpd',
					zones: ['ru', 'by', 'kz']
				}, {
					id: 392,
					lang: 'en',
					sec: 'siqjqa',
					zones: ['en', 'ua']
				}, {
					id: 388,
					lang: 'es',
					sec: '53t2bu',
					zones: ['es']
				}, {
					id: 390,
					lang: 'de',
					sec: 'mhglfc',
					zones: ['de']
				}, {
					id: 386,
					lang: 'com.br',
					sec: 't6tdpy',
					zones: ['com.br']
				}]
			};
		}
	}

	exports.DocumentCard = DocumentCard;
	exports.FeedbackButton = Button;
	exports.ProductListController = ProductListController;
	exports.Slider = Slider;

})(this.BX.Catalog.DocumentCard = this.BX.Catalog.DocumentCard || {}, BX.Catalog.EntityCard, BX.Catalog.Store, BX, BX.Event, BX.Main, BX.UI, BX.UI.EntitySelector, BX.UI, BX.Currency);
//# sourceMappingURL=document-card.bundle.js.map
