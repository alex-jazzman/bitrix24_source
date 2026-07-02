/* eslint-disable */
this.BX = this.BX || {};
this.BX.Catalog = this.BX.Catalog || {};
this.BX.Catalog.Store = this.BX.Catalog.Store || {};
(function (exports, catalog_toolAvailabilityManager, main_core, main_core_events, currency_currencyCore, ui_hint, main_popup, catalog_productModel, catalog_productSelector, catalog_storeSelector, catalog_documentCard, ui_tour, spotlight, ui_notification) {
	'use strict';

	class HintPopup {
		constructor(editor) {
			this.editor = editor;
		}
		load(node, text) {
			if (!this.hintPopup) {
				this.hintPopup = new main_popup.Popup('ui-hint-popup-' + this.editor.getId(), null, {
					darkMode: true,
					closeIcon: true,
					animation: 'fading-slide'
				});
			}
			this.hintPopup.setBindElement(node);
			this.hintPopup.adjustPosition();
			this.hintPopup.setContent(main_core.Tag.render`
			<div class='ui-hint-content'>${main_core.Text.encode(text)}</div>
		`);
			return this.hintPopup;
		}
		show() {
			if (this.hintPopup) {
				this.hintPopup.show();
			}
		}
		close() {
			if (this.hintPopup) {
				this.hintPopup.close();
			}
		}
	}

	class PriceCalculator {
		static EXTRA_TYPE_PERCENTAGE = 1;
		static EXTRA_TYPE_MONETARY = 2;
		#fields = {
			basePrice: 0,
			finalPrice: 0,
			extra: null,
			extraType: PriceCalculator.EXTRA_TYPE_PERCENTAGE
		};
		constructor(fields) {
			this.#fields = {
				...this.#fields,
				...fields
			};
		}
		getBasePrice() {
			return this.#fields.basePrice;
		}
		getFinalPrice() {
			return this.#fields.finalPrice;
		}
		getExtra() {
			return this.#fields.extra;
		}
		getExtraType() {
			return this.#fields.extraType;
		}
		calculateBasePrice(basePrice) {
			this.#fields.basePrice = basePrice;
			this.#fields.extra = main_core.Text.toNumber(this.#fields.extra);
			if (this.#fields.extraType === PriceCalculator.EXTRA_TYPE_MONETARY) {
				this.#fields.finalPrice = this.#fields.basePrice + this.#fields.extra;
			} else {
				this.#fields.finalPrice = this.#fields.basePrice * (1 + this.#fields.extra / 100);
			}
			return this;
		}
		calculateFinalPrice(finalPrice) {
			this.#fields.finalPrice = finalPrice;
			const basePrice = main_core.Text.toNumber(this.#fields.basePrice);
			if (basePrice <= 0) {
				this.#fields.extraType = PriceCalculator.EXTRA_TYPE_MONETARY;
			}
			if (this.#fields.extraType === PriceCalculator.EXTRA_TYPE_MONETARY) {
				this.#fields.extra = this.#fields.finalPrice - basePrice;
			} else {
				this.#fields.extra = (this.#fields.finalPrice / basePrice - 1) * 100;
			}
			return this;
		}
		calculateExtra(extra) {
			this.#fields.extra = extra;
			if (main_core.Type.isNil(extra)) {
				return this;
			}
			return this.calculateBasePrice(this.#fields.basePrice);
		}
		calculateExtraType(extraType) {
			if (extraType !== PriceCalculator.EXTRA_TYPE_MONETARY) {
				extraType = PriceCalculator.EXTRA_TYPE_PERCENTAGE;
			}
			this.#fields.extraType = extraType;
			return this.calculateFinalPrice(this.#fields.finalPrice);
		}
	}

	class AccessDeniedInput {
		constructor(options) {
			this.text = options.text || main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_ACCESS_DENIED_TEXT');
			this.hint = options.hint;
			this.isReadOnly = options.isReadOnly === true;
		}
		renderTo(node) {
			const className = this.isReadOnly ? 'ui-ctl-no-border catalog-document-product-list-access-denied-readonly' : 'ui-ctl-disabled catalog-document-product-list-access-denied';
			const block = main_core.Tag.render`
		<div
			class="ui-ctl ui-ctl-w100 ui-ctl-before-icon ui-ctl-after-icon ${className}"
			data-hint="${this.hint}"
			data-hint-no-icon
		>
			<div class="ui-ctl-before catalog-document-product-list-access-denied-lock"></div>
			<div class="ui-ctl-after catalog-document-product-list-access-denied-hint"></div>
			<div class="ui-ctl-element">${this.text}</div>
		</div>
		`;
			node.innerHTML = '';
			node.appendChild(block);
			BX.UI.Hint.createInstance({
				popupParameters: {
					angle: {
						offset: 100
					}
				}
			}).init();
		}
	}

	const MODE_EDIT = 'EDIT';
	const MODE_SET = 'SET';
	class Row {
		fields = {};
		storeSelectors = [];
		externalActions = [];
		cache = new main_core.Cache.MemoryCache();
		modeChanges = {
			EDIT: MODE_EDIT,
			SET: MODE_SET
		};
		validatingFields = new Map();
		constructor(id, fields, settings, editor) {
			this.setId(id);
			this.setSettings(settings);
			this.setEditor(editor);
			this.setModel(fields, settings);
			this.initFields(fields);
			this.#initSelector();
			this.#initBarcode();
			this.#initSimpleFields();
			// this.#initPriceExtra();
			this.#initStoreSelector(this.getSettingValue('storeHeaderMap', {}));
			this.#initActions();
			this.#hideFields();
			requestAnimationFrame(this.initHandlers.bind(this));
		}
		getNode() {
			return this.cache.remember('node', () => {
				const rowId = this.getField('ID', 0);
				return this.getEditorContainer().querySelector(`[data-id="${rowId}"]`);
			});
		}
		getSelector() {
			return this.mainSelector;
		}
		getBarcodeSelector() {
			return this.barcodeSelector;
		}
		getId() {
			return this.id;
		}
		setId(id) {
			this.id = id;
		}
		getSettings() {
			return this.settings;
		}
		setSettings(settings) {
			this.settings = main_core.Type.isPlainObject(settings) ? settings : {};
		}
		getSettingValue(name, defaultValue) {
			// eslint-disable-next-line no-prototype-builtins
			return this.settings.hasOwnProperty(name) ? this.settings[name] : defaultValue;
		}
		setSettingValue(name, value) {
			this.settings[name] = value;
		}
		setEditor(editor) {
			this.editor = editor;
		}
		getEditor() {
			return this.editor;
		}
		getEditorContainer() {
			return this.getEditor().getContainer();
		}
		getHintPopup() {
			return this.getEditor().getHintPopup();
		}
		initHandlers() {
			const editor = this.getEditor();
			this.getNode().querySelectorAll('input').forEach(node => {
				main_core.Event.bind(node, 'input', editor.changeProductFieldHandler);
				main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
				// disable drag-n-drop events for text fields
				main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
				main_core.Event.bind(node, 'blur', editor.blurProductFieldHandler);
			});
			this.getNode().querySelectorAll('select').forEach(node => {
				main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
				// disable drag-n-drop events for select fields
				main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
			});
		}
		initHandlersForSelectors() {
			const editor = this.getEditor();
			let selectorNames = ['MAIN_INFO', 'BARCODE_INFO'];
			const storeFields = this.getSettingValue('storeHeaderMap', {});
			selectorNames = [...selectorNames, ...Object.keys(storeFields)];
			selectorNames.forEach(name => {
				this.getNode().querySelectorAll(`[data-name="${name}"] input[type="text"]`).forEach(node => {
					main_core.Event.bind(node, 'input', editor.changeProductFieldHandler);
					main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
					// disable drag-n-drop events for select fields
					main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
				});
			});
		}
		#initActions() {
			if (this.getEditor().isReadOnly() || this.getField('EDITABLE') === false) {
				return;
			}
			this.debouncedPurchasingPriceCalculation = main_core.Runtime.debounce(this.calculateStoreCostPrice, 500, this);
			const actionCellContentContainer = this.getNode().querySelector('.main-grid-cell-action .main-grid-cell-content');
			if (main_core.Type.isDomNode(actionCellContentContainer)) {
				const actionsButton = main_core.Tag.render`
				<a
					href="#"
					class="main-grid-row-action-button"
				></a>
			`;
				main_core.Event.bind(actionsButton, 'click', event => {
					const menuItems = [{
						text: main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_COPY_ACTION'),
						onclick: this.handleCopyAction.bind(this)
					}, {
						text: main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_DELETE_ACTION'),
						onclick: this.handleDeleteAction.bind(this)
					}];
					main_popup.PopupMenu.show({
						id: `${this.getId()}_actions_popup`,
						bindElement: actionsButton,
						items: menuItems
					});
					event.preventDefault();
					event.stopPropagation();
				});
				main_core.Dom.append(actionsButton, actionCellContentContainer);
			}
		}
		#initSelector() {
			const selectorOptions = {
				iblockId: this.model.getIblockId(),
				basePriceId: this.model.getBasePriceId(),
				currency: this.model.getCurrency(),
				model: this.model,
				config: {
					ENABLE_SEARCH: true,
					IS_ALLOWED_CREATION_PRODUCT: this.getSettingValue('isAllowedCreationProduct', true),
					ENABLE_IMAGE_INPUT: true,
					ROLLBACK_INPUT_AFTER_CANCEL: true,
					ENABLE_INPUT_DETAIL_LINK: true,
					ROW_ID: this.getId(),
					ENABLE_SKU_SELECTION: true,
					ENABLE_EMPTY_PRODUCT_ERROR: true,
					RESTRICTED_PRODUCT_TYPES: this.getEditor().getRestrictedProductTypes(),
					URL_BUILDER_CONTEXT: this.editor.getSettingValue('productUrlBuilderContext')
				},
				mode: catalog_productSelector.ProductSelector.MODE_EDIT
			};
			this.mainSelector = new catalog_productSelector.ProductSelector(`catalog_document_grid_${this.getId()}`, selectorOptions);
			const mainInfoNode = this.getNode().querySelector('[data-name="MAIN_INFO"]');
			if (mainInfoNode) {
				const numberSelector = mainInfoNode.querySelector('.main-grid-row-number');
				if (!main_core.Type.isDomNode(numberSelector)) {
					main_core.Dom.append(main_core.Tag.render`<div class="main-grid-row-number"></div>`, mainInfoNode);
				}
				let selectorWrapper = mainInfoNode.querySelector('.main-grid-row-product-selector');
				if (!main_core.Type.isDomNode(selectorWrapper)) {
					selectorWrapper = main_core.Tag.render`<div class="main-grid-row-product-selector"></div>`;
					main_core.Dom.append(selectorWrapper, mainInfoNode);
				}
				this.mainSelector.renderTo(selectorWrapper);
			}
			main_core_events.EventEmitter.subscribe(this.mainSelector, 'onBeforeCreate', this.#handleBeforeCreateProduct.bind(this));
		}
		#initSimpleFields() {
			const fields = ['COMMENT'];
			for (const name of fields) {
				const input = this.getNode().querySelector(`[name="${name}"]`);
				if (input) {
					const value = this.getField(name);
					input.value = main_core.Type.isNil(value) ? '' : value;
				}
			}
		}
		#initBarcode() {
			const selectorOptions = {
				iblockId: this.model.getIblockId(),
				basePriceId: this.model.getBasePriceId(),
				currency: this.model.getCurrency(),
				model: this.model,
				inputFieldName: 'BARCODE',
				type: catalog_productSelector.ProductSelector.INPUT_FIELD_BARCODE,
				config: {
					ENABLE_SEARCH: true,
					IS_ALLOWED_CREATION_PRODUCT: this.getSettingValue('isAllowedCreationProduct', true),
					ENABLE_INFO_SPOTLIGHT: this.editor.getSettingValue('showBarcodeSpotlightInfo', true),
					ENABLE_BARCODE_QR_AUTH: this.editor.getSettingValue('showBarcodeQrAuth', true),
					IS_INSTALLED_MOBILE_APP: this.editor.getSettingValue('isInstalledMobileApp', null),
					ENABLE_IMAGE_INPUT: false,
					ROLLBACK_INPUT_AFTER_CANCEL: true,
					ENABLE_INPUT_DETAIL_LINK: false,
					ROW_ID: this.getId(),
					ENABLE_SKU_SELECTION: false,
					ENABLE_SKU_TREE: false,
					ENABLE_EMPTY_PRODUCT_ERROR: false,
					RESTRICTED_PRODUCT_TYPES: this.getEditor().getRestrictedProductTypes()
				},
				mode: catalog_productSelector.ProductSelector.MODE_EDIT,
				scannerToken: this.getEditor().scannerToken
			};
			this.barcodeSelector = new catalog_productSelector.ProductSelector(`catalog_document_grid_${this.getId()}_barcode`, selectorOptions);
			main_core_events.EventEmitter.subscribe(this.barcodeSelector, 'onBeforeCreate', this.#handleBeforeCreateProduct.bind(this));
			main_core_events.EventEmitter.subscribe(this.barcodeSelector, 'onSpotlightClose', this.#handleSpotlightClose.bind(this));
			main_core_events.EventEmitter.subscribe(this.barcodeSelector, 'onBarcodeQrClose', this.#handleBarcodeQrClose.bind(this));
			main_core_events.EventEmitter.subscribe(this.barcodeSelector, 'onBarcodeScannerInstallChecked', this.#handleBarcodeScannerInstallCheck.bind(this));
			main_core_events.EventEmitter.subscribe(this.barcodeSelector, 'onBarcodeChange', this.#handleBarcodeChange.bind(this));
			this.layoutBarcode();
		}
		layoutBarcode() {
			const barcodeWrapper = this.getNode().querySelector('[data-name="BARCODE_INFO"]');
			if (this.barcodeSelector && barcodeWrapper) {
				barcodeWrapper.innerHTML = '';
				if (this.#needBarcode()) {
					this.barcodeSelector.renderTo(barcodeWrapper);
				}
			}
		}
		#initPriceExtra() {
			const node = this.getNode().querySelector('[data-name="BASE_PRICE"]');
			if (!main_core.Type.isDomNode(node)) {
				return;
			}
			const oldExtraNode = node.querySelector('.catalog-store-extra-price');
			if (main_core.Type.isDomNode(oldExtraNode)) {
				main_core.Dom.remove(oldExtraNode);
			}
			const extraValue = this.getField('BASE_PRICE_EXTRA') ?? '';
			const inputValue = main_core.Tag.render`
			<div>
				<input
					placeholder="-"
					class="catalog-store-extra-price"
					data-name="BASE_PRICE_EXTRA"
					value="${extraValue}"
				/>
			</div>
		`;
			const extraMeasureValue = this.getField('BASE_PRICE_EXTRA_RATE') === PriceCalculator.EXTRA_TYPE_MONETARY ? this.getEditor().getCurrencyText() : '%';
			const measureValue = main_core.Tag.render`
			<div class="main-grid-editor main-grid-editor-money-currency">
				<span class="main-dropdown-inner" data-name="BASE_PRICE_EXTRA_RATE">${extraMeasureValue}</span>
			</div>
		`;
			main_core.Event.bind(measureValue, 'click', () => {
				const menuItems = [{
					text: '%',
					onclick: this.handleSelectExtraPriceType.bind(this),
					type: PriceCalculator.EXTRA_TYPE_PERCENTAGE
				}, {
					text: this.getEditor().getCurrencyText(),
					onclick: this.handleSelectExtraPriceType.bind(this),
					type: PriceCalculator.EXTRA_TYPE_MONETARY
				}];
				main_popup.PopupMenu.show({
					id: `${this.getId()}_extra_type_popup`,
					bindElement: measureValue,
					items: menuItems
				});
			});
			const extraNode = main_core.Tag.render`
			<div class="main-grid-editor catalog-store-extra-price">
				${inputValue}
				${measureValue}
			</div>
		`;
			main_core.Dom.append(extraNode, node);
		}
		#initStoreSelector(fieldNames) {
			Object.keys(fieldNames).forEach(rowName => {
				const selectorOptions = {
					inputFieldId: fieldNames[rowName],
					inputFieldTitle: `${fieldNames[rowName]}_TITLE`,
					isDisabledEmpty: true,
					config: {
						ENABLE_SEARCH: true,
						ENABLE_INPUT_DETAIL_LINK: false,
						ROW_ID: this.getId()
					},
					mode: catalog_storeSelector.StoreSelector.MODE_EDIT,
					model: this.model
				};
				const storeSelector = new catalog_storeSelector.StoreSelector(`${this.getId()}_${rowName}`, selectorOptions);
				main_core_events.EventEmitter.subscribe(storeSelector, 'onChange', main_core.Runtime.debounce(this.#onStoreFieldChange.bind(this), 500, this));
				main_core_events.EventEmitter.subscribe(storeSelector, 'onClear', main_core.Runtime.debounce(this.#onStoreFieldChange.bind(this), 500, this));
				this.storeSelectors.push(storeSelector);
			});
			this.layoutStoreSelector(fieldNames);
		}
		layoutStoreSelector(fieldNames) {
			Object.keys(fieldNames).forEach(rowName => {
				const selectorId = `${this.getId()}_${rowName}`;
				this.storeSelectors.forEach(selector => {
					if (selector.getId() === selectorId) {
						const storeWrapper = this.getNode().querySelector(`[data-name="${rowName}"]`);
						if (storeWrapper) {
							storeWrapper.innerHTML = '';
							if (this.#needInventory()) {
								selector.renderTo(storeWrapper);
							}
						}
					}
				});
			});
		}
		#onStoreFieldChange(event) {
			const data = event.getData();
			data.fields.forEach(item => {
				this.updateField(item.NAME, item.VALUE);
			});
		}
		setRowNumber(number) {
			this.getNode().querySelectorAll('.main-grid-row-number').forEach(node => {
				node.textContent = `${number}.`;
			});
		}
		getFields(fields = []) {
			let result;
			if (main_core.Type.isArrayFilled(fields)) {
				result = {};
				for (const fieldName of fields) {
					result[fieldName] = this.getField(fieldName);
				}
			} else {
				result = main_core.Runtime.clone(this.fields);
			}

			// merge with real values
			const realValues = this.#getRealValues();
			for (const fieldName in realValues) {
				if (Object.hasOwnProperty.call(realValues, fieldName) && Object.hasOwnProperty.call(result, fieldName)) {
					result[fieldName] = realValues[fieldName];
				}
			}
			return result;
		}
		getFieldsWithHashed(fieldList) {
			const result = {};
			const realValues = this.#getRealValues() || {};
			const fields = main_core.Type.isArrayFilled(fieldList) ? fieldList : Object.keys(this.fields);
			const fieldsToEncode = {};
			fields.forEach(fieldName => {
				if (fieldName in realValues) {
					fieldsToEncode[fieldName] = this.getField(fieldName);
				} else {
					result[fieldName] = this.getField(fieldName);
				}
			});
			if (Object.keys(fieldsToEncode).length > 0) {
				result.REAL_VALUES = this.#encodeRealValues(fieldsToEncode);
			}
			return result;
		}

		/**
		 * Get real values field.
		 *
		 * Stores the real values of rows that are hidden due to lack of user access.
		 *
		 * @returns
		 */
		#getRealValues() {
			if (this.realValues) {
				return this.realValues;
			}
			try {
				const value = this.getField('REAL_VALUES');
				if (value) {
					const parsedValue = this.parseRealValues(value);
					if (main_core.Type.isPlainObject(parsedValue)) {
						this.realValues = parsedValue;
					}
				}
			} catch (e) {
				console.error(`Cannot parse REAL_VALUE: ${e.getMessage()}`);
			}
			return this.realValues;
		}
		updateRealValues(newRealValues) {
			const newRealValuesKey = Object.keys(newRealValues);
			if (newRealValuesKey.length === 0) {
				return;
			}
			if (!this.realValues) {
				return;
			}
			newRealValuesKey.forEach(valueKey => {
				this.realValues[valueKey] = newRealValues[valueKey];
			});
		}
		parseRealValues(values) {
			return JSON.parse(atob(values));
		}
		#encodeRealValues(values) {
			return btoa(JSON.stringify(values));
		}
		initFields(fields) {
			this.getModel().initFields(fields, false);
			this.setFields(fields);
		}
		setFields(fields) {
			for (const name in fields) {
				if (fields.hasOwnProperty(name)) {
					this.setField(name, fields[name]);
				}
			}
		}
		getField(name, defaultValue) {
			if (name !== 'REAL_VALUES') {
				const realValues = this.#getRealValues();
				if (realValues && Object.hasOwnProperty.call(realValues, name)) {
					return realValues[name];
				}
			}
			return this.fields.hasOwnProperty(name) ? this.fields[name] : defaultValue;
		}
		setField(name, value, changeModel = true) {
			this.fields[name] = value;
			if (changeModel) {
				this.getModel().setField(name, value);
			}
		}
		getUiFieldId(field) {
			return `${this.getId()}_${field}`;
		}
		getBasePrice() {
			return this.getField('BASE_PRICE', 0);
		}
		getAmount() {
			return this.getField('AMOUNT', 1);
		}
		isPriceNetto() {
			return this.getEditor().isTaxAllowed() && !this.isTaxIncluded();
		}
		getPrice() {
			return this.getField('PRICE', 0);
		}
		getPriceExclusive() {
			return this.getField('PRICE_EXCLUSIVE', 0);
		}
		getPriceNetto() {
			return this.getField('PRICE_NETTO', 0);
		}
		getPriceBrutto() {
			return this.getField('PRICE_BRUTTO', 0);
		}
		getQuantity() {
			return this.getField('QUANTITY', 0);
		}
		getTaxIncluded() {
			return this.getField('TAX_INCLUDED', 'N');
		}
		isTaxIncluded() {
			return this.getTaxIncluded() === 'Y';
		}
		getTaxRate() {
			return this.getField('TAX_RATE', 0);
		}
		getVatRate() {
			return this.getField('TAX_RATE', 0) / 100;
		}
		getTaxSum() {
			return this.isTaxIncluded() ? this.getPrice() * this.getQuantity() * (1 - 1 / (1 + this.getVatRate())) : this.getPriceExclusive() * this.getQuantity() * this.getVatRate();
		}
		updateFieldByEvent(fieldCode, event) {
			const target = event.target;
			const value = target.type === 'checkbox' ? target.checked : target.value;
			const mode = event.type === 'input' || event.type === 'change' ? MODE_EDIT : MODE_SET;
			this.updateField(fieldCode, value, mode);
		}
		updateDropdownField(fieldCode, value) {
			this.updateField(fieldCode, value, MODE_EDIT);
		}
		updateField(fieldCode, value, mode = MODE_SET) {
			this.resetExternalActions();
			this.updateFieldValue(fieldCode, value, mode);
			this.executeExternalActions();
		}
		updateFieldValue(code, value, mode = MODE_SET) {
			switch (code) {
				case 'SKU_ID':
					this.changeProductId(value);
					break;
				case 'BASE_PRICE':
					this.changeBasePrice(value, mode);
					break;

				// case 'BASE_PRICE_EXTRA':
				// 	this.changeExtra(value, mode);
				// 	break;

				case 'PURCHASING_PRICE':
					this.changePurchasingPrice(value, mode);
					break;
				case 'AMOUNT':
					this.changeAmount(value, mode);
					break;
				case 'MEASURE_CODE':
					this.changeMeasureCode(value, mode);
					break;
				case 'BARCODE':
					this.changeBarcode(value, mode);
					break;
				case 'STORE_FROM':
				case 'STORE_TO':
					this.changeStore(value, code);
					break;
				case 'STORE_FROM_TITLE':
				case 'STORE_TO_TITLE':
					this.changeStoreName(value, code);
					break;
				case 'NAME':
				case 'MAIN_INFO':
					this.changeProductName(value, mode);
					break;
				case 'SORT':
					this.changeSort(value, mode);
					break;
				case 'COMMENT':
					this.changeComment(value, mode);
					break;
				case 'TAX_RATE_FORMATTED':
				case 'TAX_INCLUDED_FORMATTED':
					this.updateUiField(code, value);
					break;
			}
		}
		updateFieldByName(field, value) {
			switch (field) {
				case 'TAX_INCLUDED':
					this.setTaxIncluded(value);
					break;
			}
		}
		changeProductId(value) {
			const preparedValue = this.parseInt(value);
			this.setProductId(preparedValue);
		}
		handleCopyAction(event, menuItem) {
			this.getEditor()?.copyRow(this);
			const menu = menuItem.getMenuWindow();
			if (menu) {
				menu.destroy();
			}
		}
		handleDeleteAction(event, menuItem) {
			this.getEditor()?.deleteRow(this);
			const menu = menuItem.getMenuWindow();
			if (menu) {
				menu.destroy();
			}
			this.unsubscribeEvents();
			this.#handleProductErrorsChange();
		}
		unsubscribeEvents() {
			this.getBarcodeSelector().unsubscribeEvents();
		}
		handleSelectExtraPriceType(event, menuItem) {
			this.changeExtraType(menuItem.type, MODE_EDIT);
			const menu = menuItem.getMenuWindow();
			if (menu) {
				menu.destroy();
			}
		}
		#getCalculator() {
			const extra = main_core.Type.isNumber(this.getModel().getField('BASE_PRICE_EXTRA')) ? this.getModel().getField('BASE_PRICE_EXTRA') : null;
			return new PriceCalculator({
				basePrice: main_core.Text.toNumber(this.getModel().getField('PURCHASING_PRICE')),
				finalPrice: main_core.Text.toNumber(this.getModel().getField('BASE_PRICE')),
				extra,
				extraType: main_core.Text.toNumber(this.getModel().getField('BASE_PRICE_EXTRA_RATE'))
			});
		}
		#getProductCalculator() {
			return this.getModel().getCalculator().setFields(this.#getCalculateProductFields()).setSettings(this.getEditor().getSettings());
		}
		#getCalculateProductFields() {
			return {
				PRICE: this.getPrice(),
				BASE_PRICE: this.getBasePrice(),
				PRICE_EXCLUSIVE: this.getPriceExclusive(),
				PRICE_NETTO: this.getPriceNetto(),
				PRICE_BRUTTO: this.getPriceBrutto(),
				QUANTITY: this.getQuantity(),
				TAX_INCLUDED: this.getTaxIncluded(),
				TAX_RATE: this.getTaxRate()
			};
		}
		changeExtraType(value, mode = MODE_SET) {
			let text = '%';
			if (value === PriceCalculator.EXTRA_TYPE_MONETARY) {
				text = this.getEditor().getCurrencyText();
			} else {
				value = PriceCalculator.EXTRA_TYPE_PERCENTAGE;
			}
			if (value === this.getField('BASE_PRICE_EXTRA_RATE')) {
				return;
			}
			if (mode === MODE_EDIT) {
				const calculator = this.#getCalculator().calculateExtraType(value);
				this.changeExtra(calculator.getExtra());
				this.changeBasePrice(calculator.getFinalPrice());
			}
			const node = this.getNode().querySelector('[data-name="BASE_PRICE_EXTRA_RATE"]');
			if (main_core.Type.isDomNode(node)) {
				node.innerHTML = text;
			}
			this.setField('BASE_PRICE_EXTRA_RATE', value);
		}
		changeExtra(value, mode = MODE_SET) {
			const preparedValue = main_core.Type.isNil(value) || value === '' ? null : this.parseFloat(value, this.getPricePrecision());
			this.setField('BASE_PRICE_EXTRA', preparedValue);
			if (preparedValue === null) {
				return;
			}
			if (mode === MODE_EDIT) {
				const calculator = this.#getCalculator().calculateExtra(preparedValue);
				this.changeBasePrice(calculator.getFinalPrice());
			} else {
				const node = this.getNode().querySelector('[data-name="BASE_PRICE_EXTRA"]');
				if (main_core.Type.isDomNode(node)) {
					node.value = preparedValue;
				}
			}
		}
		changeBasePrice(value, mode = MODE_SET) {
			const preparedValue = this.parseFloat(value, this.getPricePrecision());
			this.setBasePrice(preparedValue, mode);

			// if (mode === MODE_EDIT)
			// {
			// 	const calculator =
			// 		this.#getCalculator()
			// 			.calculateFinalPrice(preparedValue)
			// 	;
			//
			// 	this.changeExtra(calculator.getExtra());
			// 	this.changeExtraType(calculator.getExtraType());
			// }
		}
		changePurchasingPrice(value, mode = MODE_SET) {
			if (this.#isPurchasingPriceAccessDenied()) {
				return;
			}
			const preparedValue = this.parseFloat(value, this.getPricePrecision());
			this.setPurchasingPrice(preparedValue, mode);

			// const currentExtra = this.getField('BASE_PRICE_EXTRA');
			// if (mode === MODE_EDIT && !Type.isNil(currentExtra) && currentExtra !== '')
			// {
			// 	const calculator =
			// 		this.#getCalculator()
			// 			.calculateBasePrice(preparedValue)
			// 	;
			//
			// 	this.changeBasePrice(calculator.getFinalPrice());
			// }
		}
		changeAmount(value, mode = MODE_SET) {
			const preparedValue = this.parseFloat(value, this.getQuantityPrecision());
			this.setAmount(preparedValue, mode);
		}
		changeMeasureCode(value, mode = MODE_SET) {
			this.getEditor().getMeasures().filter(item => item.CODE === value).forEach(item => this.setMeasure(item, mode));
		}
		changeBarcode(value, mode = MODE_SET) {
			const preparedValue = value.toString();
			const isChangedValue = this.getField('BARCODE') !== preparedValue;
			if (isChangedValue && mode === MODE_SET) {
				this.setField('BARCODE', preparedValue);
				this.setField('DOC_BARCODE', preparedValue);
				this.addActionProductChange();
			} else if (mode === MODE_EDIT) {
				this.setField('DOC_BARCODE', preparedValue);
				this.addActionProductChange();
			}
		}
		changeStore(value, code) {
			const preparedValue = main_core.Text.toNumber(value);
			const isChangedValue = this.getField(code) !== preparedValue;
			if (isChangedValue) {
				this.setField(code, preparedValue);
				this.setStoreAmount(value, code);
				this.layoutStoreSelector(this.getSettingValue('storeHeaderMap', {}));
				this.addActionProductChange();
				if (this.getEditor().getSettingValue('isCalculableStorePurchasingPrice')) {
					this.debouncedPurchasingPriceCalculation();
				}
			}
		}
		changeStoreName(value, code) {
			const preparedValue = value.toString();
			this.setField(code, preparedValue);
			this.addActionProductChange();
		}
		changeProductName(value, mode = MODE_SET) {
			const preparedValue = value.toString();
			const isChangedValue = this.getField('NAME') !== preparedValue;
			if (isChangedValue && mode === MODE_SET) {
				this.setField('NAME', preparedValue);
				this.addActionProductChange();
			}
		}
		changeSort(value, mode = MODE_SET) {
			const preparedValue = this.parseInt(value);
			if (mode === MODE_SET) {
				this.setField('SORT', preparedValue);
			}
			const isChangedValue = this.getField('SORT') !== preparedValue;
			if (isChangedValue) {
				this.addActionProductChange();
			}
		}
		changeComment(value) {
			const preparedValue = main_core.Type.isNil(value) ? '' : value.toString().trim();
			if (preparedValue !== this.getField('COMMENT')) {
				this.setField('COMMENT', preparedValue);
				this.addActionProductChange();
			}
		}
		refreshFieldsLayout(exceptFields = []) {
			for (const field in this.fields) {
				if (this.fields.hasOwnProperty(field) && !exceptFields.includes(field)) {
					this.updateUiField(field, this.fields[field]);
				}
			}
			this.updateUiMeasure(this.getField('MEASURE_CODE'), this.getField('MEASURE_NAME'));
			this.getSelector()?.reloadFileInput();
			this.getSelector()?.layout();
			this.getBarcodeSelector()?.layout();
			this.updateUiStoreValues();
		}
		setModel(fields = {}, settings = {}) {
			const selectorId = `catalog_document_grid_${this.getId()}`;
			if (selectorId) {
				const model = catalog_productModel.ProductModel.getById(selectorId);
				if (model) {
					this.model = model;
				}
			}
			if (!(this.model instanceof catalog_productModel.ProductModel)) {
				this.model = new catalog_productModel.ProductModel({
					id: selectorId,
					currency: this.getEditor().getCurrencyId(),
					iblockId: fields.IBLOCK_ID,
					basePriceId: fields.BASE_PRICE_ID,
					skuTree: main_core.Type.isStringFilled(fields.SKU_TREE) ? JSON.parse(fields.SKU_TREE) : null,
					storeMap: fields.STORE_AMOUNT_MAP,
					fields
				});
				if (main_core.Type.isObject(fields.IMAGE_INFO)) {
					this.model.getImageCollection().setPreview(fields.IMAGE_INFO.preview);
					this.model.getImageCollection().setEditInput(fields.IMAGE_INFO.input);
					this.model.getImageCollection().setMorePhotoValues(fields.IMAGE_INFO.values);
				}
				if (!main_core.Type.isNil(fields.DETAIL_URL)) {
					this.model.setDetailPath(fields.DETAIL_URL);
				}
			}
			main_core_events.EventEmitter.subscribe(this.model, 'onErrorsChange', main_core.Runtime.debounce(this.#handleProductErrorsChange, 500, this));
			main_core_events.EventEmitter.subscribe(this.model, 'onChangeStoreData', this.updateUiStoreValues.bind(this));
		}
		getModel() {
			return this.model;
		}
		#handleProductErrorsChange() {
			const errors = this.getModel().getErrorCollection().getErrors();
			for (const code in errors) {
				if (code === catalog_productSelector.ProductSelector.ErrorCodes.NOT_SELECTED_PRODUCT || code === catalog_storeSelector.StoreSelector.ErrorCodes.NOT_SELECTED_STORE) {
					this.getSelector().layoutErrors();
				}
			}
			this.getEditor().handleProductErrorsChange();
		}
		#handleBeforeCreateProduct(event) {
			const {
				model
			} = event.getData();
			model.setField('BARCODE', this.barcodeSelector.getNameInputFilledValue());
			model.setField('NAME', this.mainSelector.getNameInputFilledValue());
		}
		#handleSpotlightClose(event) {
			this.editor.closeBarcodeSpotlights();
		}
		#handleBarcodeQrClose(event) {
			this.editor.closeBarcodeQrAuths();
		}
		#handleBarcodeScannerInstallCheck(event) {
			this.editor.enableSendBarcodeMobilePush();
		}
		#handleBarcodeChange(event) {
			const {
				value
			} = event.getData();
			this.changeBarcode(value, MODE_EDIT);
		}
		setProductId(value) {
			const isChangedValue = this.getField('PRODUCT_ID') !== value;
			if (isChangedValue) {
				this.setField('PRODUCT_ID', value);
				this.setField('SKU_ID', value);
				this.updateUiStoreValues();
				this.addActionProductChange();
				this.addActionUpdateTotal();
				this.#hidePurchasingPrice();
			}
		}
		setBasePrice(value, mode = MODE_SET) {
			// price can't be less than zero
			value = Math.max(value, 0);
			if (mode === MODE_SET) {
				this.updateUiField('BASE_PRICE', value.toFixed(this.getDisplayPrecision()));
			}
			this.setField('BASE_PRICE', value);
			this.addActionProductChange();
			this.addActionUpdateTotal();
			const calculatedFields = this.#getProductCalculator().calculateBasePrice(value);
			this.setFields(calculatedFields);
			this.updateRowTotalPrice();
		}
		updateRowTotalPrice() {
			const field = this.getEditor().getSettingValue('totalCalculationSumField', 'PURCHASING_PRICE');
			let value = this.getAmount() * this.getField(field, 0);
			value = Math.max(value, 0);
			this.setField('TOTAL_PRICE', value);
			this.updateUiField('TOTAL_PRICE', value.toFixed(this.getDisplayPrecision()));
		}
		updateProductStoreValues() {
			this.storeSelectors.forEach(selector => {
				selector.setProductId(this.getModel().getSkuId());
			});
		}
		updateUiStoreValues() {
			const storeHeaderMap = this.getSettingValue('storeHeaderMap', {});
			Object.keys(storeHeaderMap).forEach(key => {
				const fieldName = storeHeaderMap[key];
				let value = this.getField(fieldName);
				if (fieldName === 'STORE_FROM') {
					const currentAmount = this.model.getStoreCollection().getStoreAmount(value);
					if (currentAmount <= 0) {
						const maxStore = this.model.getStoreCollection().getMaxFilledStore();
						const storeSelector = catalog_storeSelector.StoreSelector.getById(`${this.getId()}_${key}`);
						if (maxStore.AMOUNT > currentAmount && storeSelector) {
							storeSelector.onStoreSelect(maxStore.STORE_ID, maxStore.STORE_TITLE);
							value = maxStore.STORE_ID;
						}
					}
				}
				this.setStoreAmount(value, fieldName);
			});
			this.layoutStoreSelector(this.getSettingValue('storeHeaderMap', {}));
		}
		setStoreAmount(value, fieldName, mode = MODE_SET) {
			if (!this.model.getStoreCollection().isInited()) {
				return;
			}

			// price can't be less than zero
			if (mode === MODE_SET) {
				let amount;
				const amounts = {
					_AMOUNT: () => this.model.getStoreCollection().getStoreAmount(value),
					_RESERVED: () => this.model.getStoreCollection().getStoreReserved(value),
					_AVAILABLE_AMOUNT: () => this.model.getStoreCollection().getStoreAvailableAmount(value)
				};
				for (const postfix in amounts) {
					if (Object.hasOwnProperty.call(amounts, postfix)) {
						const wrapper = this.#getNodeChildByDataName(fieldName + postfix);
						if (wrapper) {
							wrapper.innerHTML = '';
							if (this.#needInventory()) {
								amount = amounts[postfix]() || 0;
								const amountWithMeasure = `${amount} ${main_core.Text.encode(this.getField('MEASURE_NAME'))}`;
								let htmlAmount = amountWithMeasure;
								if (postfix === '_AVAILABLE_AMOUNT') {
									htmlAmount = amount > 0 ? amountWithMeasure : `<span class="text--danger">${amountWithMeasure}</span>`;
								}
								wrapper.innerHTML = htmlAmount;
							}
						}
					}
				}
			}
		}
		setPurchasingPrice(value, mode = MODE_SET) {
			if (this.#isPurchasingPriceAccessDenied()) {
				return;
			}

			// price can't be less than zero
			value = Math.max(value, 0);
			if (mode === MODE_SET) {
				this.updateUiField('PURCHASING_PRICE', value.toFixed(this.getDisplayPrecision()));
			}
			this.setField('PURCHASING_PRICE', value);
			this.addActionProductChange();
			this.addActionUpdateTotal();
			this.updateRowTotalPrice();
		}
		setAmount(value, mode = MODE_SET) {
			if (mode === MODE_SET) {
				this.updateUiInputField('AMOUNT', value);
			}
			const isChangedValue = this.getField('AMOUNT') !== value;
			if (isChangedValue) {
				this.setField('AMOUNT', value);
				this.addActionProductChange();
				this.addActionUpdateTotal();
				const calculatedFields = this.#getProductCalculator().calculateQuantity(value);
				this.setFields(calculatedFields);
				this.updateRowTotalPrice();
				if (this.getEditor().getSettingValue('isCalculableStorePurchasingPrice')) {
					this.debouncedPurchasingPriceCalculation();
				}
			}
		}
		calculateStoreCostPrice() {
			if (this.isEmptyRow()) {
				return;
			}
			main_core.ajax.runComponentAction(this.editor.getComponentName(), 'calculateStoreCostPrice', {
				mode: 'class',
				signedParameters: this.editor.getSignedParameters(),
				data: {
					productId: this.getField('SKU_ID'),
					quantity: this.getField('AMOUNT'),
					storeId: this.getField('STORE_FROM'),
					currency: this.editor.getCurrencyId()
				}
			}).then(result => {
				this.setPurchasingPrice(result.data);
			});
		}
		setMeasure(measure, mode = MODE_SET) {
			if (this.model.isEmpty()) {
				this.setField('MEASURE_CODE', measure.CODE);
				this.setField('MEASURE_NAME', measure.SYMBOL);
				this.updateUiMeasure(measure.CODE, measure.SYMBOL);
				return;
			}
			if (mode === MODE_EDIT) {
				this.getModel().showSaveNotifier(`measureChanger_${this.getId()}`, {
					title: main_core.Loc.getMessage('CATALOG_PRODUCT_MODEL_SAVING_NOTIFICATION_MEASURE_CHANGED_QUERY'),
					declineCancelTitle: main_core.Loc.getMessage('CATALOG_PRODUCT_MODEL_SAVING_NOTIFICATION_DECLINE_SAVE'),
					events: {
						onSave: () => {
							this.setField('MEASURE_CODE', measure.CODE);
							this.setField('MEASURE_NAME', measure.SYMBOL);
							this.updateUiMeasure(this.getField('MEASURE_CODE'), this.getField('MEASURE_NAME'));
							this.getModel().save(['MEASURE_CODE', 'MEASURE_NAME']);
						},
						onCancel: () => {
							this.updateUiMeasure(this.getField('MEASURE_CODE'), this.getField('MEASURE_NAME'));
						}
					}
				});
			} else {
				this.updateUiMeasure(measure.CODE, measure.SYMBOL);
			}
			this.addActionProductChange();
		}

		// controls
		getInputByFieldName(fieldName) {
			const fieldId = this.getUiFieldId(fieldName);
			let item = document.getElementById(fieldId);
			if (!main_core.Type.isElementNode(item)) {
				item = this.getNode().querySelector(`[name="${fieldId}"]`);
			}
			return item;
		}
		getInputWrapperByFieldName(fieldName) {
			const inputBlock = this.getInputByFieldName(fieldName);
			if (main_core.Type.isElementNode(inputBlock)) {
				return main_core.Type.isElementNode(inputBlock.parentNode) ? inputBlock.parentNode : inputBlock;
			}
			return undefined;
		}
		updateUiInputField(name, value) {
			const item = this.getInputByFieldName(name);
			if (main_core.Type.isElementNode(item)) {
				item.value = value;
			}
		}
		updateUiCheckboxField(name, value) {
			const item = this.getInputByFieldName(name);
			if (main_core.Type.isElementNode(item)) {
				item.checked = value === 'Y';
			}
		}
		getMoneyFieldDropdownApi(name) {
			if (!main_core.Reflection.getClass('BX.Main.dropdownManager')) {
				return null;
			}
			return BX.Main.dropdownManager.getById(`${this.getId()}_${name}_control`);
		}
		updateMoneyFieldUiWithDropdownApi(dropdown, value) {
			if (dropdown.getValue() === value) {
				return;
			}
			if (dropdown.menu) {
				dropdown.menu.destroy();
			}
			const item = dropdown.menu.itemsContainer.querySelector(`[data-value="${value}"]`);
			const menuItem = item && dropdown.getMenuItem(item);
			if (menuItem) {
				dropdown.refresh(menuItem);
				dropdown.selectItem(menuItem);
			}
		}
		updateUiMoneyField(name, value, text) {
			const item = this.getInputByFieldName(name);
			if (!main_core.Type.isElementNode(item)) {
				return;
			}
			item.dataset.value = value;
			const span = item.querySelector('span.main-dropdown-inner');
			if (!main_core.Type.isElementNode(span)) {
				return;
			}
			span.innerHTML = text;
		}
		updateUiMeasure(code, name) {
			this.updateUiMoneyField('MEASURE_CODE', code, main_core.Text.encode(name));
			this.updateUiStoreValues();
		}
		updateUiHtmlField(name, html) {
			const item = this.getNode().querySelector(`[data-name="${name}"]`);
			if (main_core.Type.isElementNode(item)) {
				item.innerHTML = html;
			}
		}
		updateUiCurrencyFields() {
			const currencyText = this.getEditor().getCurrencyText();
			const currencyId = String(this.getEditor().getCurrencyId());
			const currencyFieldNames = ['BASE_PRICE_CURRENCY', 'PURCHASING_PRICE_CURRENCY'];
			currencyFieldNames.forEach(name => {
				const dropdownValues = [];
				dropdownValues.push({
					NAME: currencyText,
					VALUE: currencyId
				});
				main_core.Dom.attr(this.getInputByFieldName(name), 'data-items', dropdownValues);
				this.updateUiMoneyField(name, currencyId, currencyText);
			});
		}
		updateUiField(field, value) {
			const uiName = this.getUiFieldName(field);
			if (!uiName) {
				return;
			}
			const uiType = this.getUiFieldType(field);
			if (!uiType) {
				return;
			}
			switch (uiType) {
				case 'input':
					this.updateUiInputField(uiName, value);
					break;
				case 'money':
					value = BX.util.number_format(value, this.getDisplayPrecision(), '.', '');
					this.updateUiInputField(uiName, value);
					break;
				case 'money_html':
					value = currency_currencyCore.CurrencyCore.currencyFormat(value, this.getEditor().getCurrencyId(), true);
					this.updateUiHtmlField(uiName, value);
					break;
				case 'tax':
					this.updateUiHtmlField(uiName, value);
					break;
			}
		}
		getUiFieldName(field) {
			let result = null;
			switch (field) {
				case 'AMOUNT':
				case 'MEASURE_CODE':
				case 'BASE_PRICE':
				case 'PURCHASING_PRICE':
				case 'TOTAL_PRICE':
					result = field;
					break;
				case 'TAX_RATE_FORMATTED':
					result = 'TAX_RATE';
					break;
				case 'TAX_INCLUDED_FORMATTED':
					result = 'TAX_INCLUDED';
					break;
			}
			return result;
		}
		getUiFieldType(field) {
			const moneyFields = ['BASE_PRICE', 'PURCHASING_PRICE', 'TOTAL_PRICE'];
			if (moneyFields.includes(field)) {
				const column = this.getEditor()?.getColumnInfo(field);
				if (column?.editable?.TYPE === 'MONEY') {
					return 'money';
				}
				return 'money_html';
			}
			if (field === 'AMOUNT') {
				return 'input';
			}
			const taxFields = ['TAX_RATE_FORMATTED', 'TAX_INCLUDED_FORMATTED'];
			if (taxFields.includes(field)) {
				return 'tax';
			}
			return null;
		}

		// proxy
		parseInt(value, defaultValue = 0) {
			return this.getEditor().parseInt(value, defaultValue);
		}
		parseFloat(value, precision, defaultValue = 0) {
			return this.getEditor().parseFloat(value, precision, defaultValue);
		}
		getPricePrecision() {
			return this.getEditor().getPricePrecision();
		}
		getDisplayPrecision() {
			return this.getEditor().getDisplayPrecision();
		}
		getQuantityPrecision() {
			return this.getEditor().getQuantityPrecision();
		}
		getCommonPrecision() {
			return this.getEditor().getCommonPrecision();
		}
		resetExternalActions() {
			this.externalActions.length = 0;
		}
		addExternalAction(action) {
			this.externalActions.push(action);
		}
		addActionProductChange() {
			this.addExternalAction({
				type: this.getEditor().actions.productChange,
				id: this.getId()
			});
		}
		addActionUpdateTotal() {
			this.addExternalAction({
				type: this.getEditor().actions.updateTotal
			});
		}
		executeExternalActions() {
			if (this.externalActions.length === 0) {
				return;
			}
			this.getEditor().executeActions(this.externalActions);
			this.resetExternalActions();
		}
		isEmptyRow() {
			return !main_core.Type.isStringFilled(this.getField('NAME', '').trim()) && this.model.isEmpty() && this.getBasePrice() <= 0;
		}
		validate() {
			const errorsList = [];
			if (!this.#isProductCountCorrect(this.getAmount())) {
				this.#subscribeFieldToValidator('AMOUNT', this.#isProductCountCorrect);
				errorsList.push(main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_INVALID_AMOUNT_2'));
			}
			return errorsList;
		}
		#subscribeFieldToValidator(fieldName, validatorCallback) {
			const fieldInput = this.getInputByFieldName(fieldName);
			const fieldWrapper = this.getInputWrapperByFieldName(fieldName);
			if (validatorCallback(fieldInput.valueAsNumber) || this.validatingFields.get(fieldName)) {
				return;
			}
			this.validatingFields.set(fieldName, true);
			fieldWrapper.classList.add('main-grid-editor-cell-danger');
			const validator = eventObject => {
				if (validatorCallback(eventObject.target.valueAsNumber)) {
					this.validatingFields.set(fieldName, false);
					main_core.Event.unbind(fieldInput, 'blur', validator);
					fieldWrapper.classList.remove('main-grid-editor-cell-danger');
				}
			};
			main_core.Event.bind(fieldInput, 'blur', validator);
		}
		#isProductCountCorrect(amountValue) {
			return amountValue > 0;
		}
		#getNodeChildByDataName(name) {
			return this.getNode().querySelector(`[data-name="${name}"]`);
		}
		#needInventory() {
			return !this.getModel().isService();
		}
		#needBarcode() {
			return !this.getModel().isService();
		}
		#isRowAccessDenied() {
			return this.getField('ACCESS_DENIED') === true;
		}
		#hideFields() {
			if (!this.#isRowAccessDenied()) {
				this.#hidePurchasingPrice();
				return;
			}
			const hiddenFields = this.getEditor().getSettingValue('hiddenFields');
			const columnIndexes = this.getEditor().getGridColumnIndexes();
			hiddenFields.forEach(fieldName => {
				const columnIndex = columnIndexes[fieldName];
				if (columnIndex === undefined) {
					return;
				}
				const item = this.getNode().querySelector(`.main-grid-cell:nth-child(${columnIndex + 1}) .main-grid-cell-content`);
				if (main_core.Type.isElementNode(item)) {
					item.innerHTML = '';
				}
			});
			const fieldWithHintIndex = columnIndexes.AMOUNT;
			if (fieldWithHintIndex) {
				const fieldWithHintNode = this.getNode().querySelector(`.main-grid-cell:nth-child(${fieldWithHintIndex + 1}) .main-grid-cell-content`);
				if (fieldWithHintNode) {
					const input = new AccessDeniedInput({
						hint: main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_ACCESS_DENIED_STORE_HINT'),
						isReadOnly: this.getEditor().isReadOnly()
					});
					input.renderTo(fieldWithHintNode);
				}
			}
		}
		#isPurchasingPriceAccessDenied() {
			return this.getField('ACCESS_DENIED_TO_PURCHASING_PRICE') === true;
		}
		#hidePurchasingPrice() {
			if (!this.#isPurchasingPriceAccessDenied()) {
				return;
			}
			const columnIndexes = this.getEditor().getGridColumnIndexes();
			const fieldWithHintIndex = columnIndexes.PURCHASING_PRICE;
			if (fieldWithHintIndex) {
				const fieldWithHintNode = this.getNode().querySelector(`.main-grid-cell:nth-child(${fieldWithHintIndex + 1})`);
				if (fieldWithHintNode) {
					const priceNode = fieldWithHintNode.querySelector('.main-grid-editor-container');
					if (priceNode) {
						priceNode.remove();
					}
					const contentNode = fieldWithHintNode.querySelector('.main-grid-cell-content');
					if (contentNode) {
						const input = new AccessDeniedInput({
							hint: main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_ACCESS_DENIED_PURCHASING_PRICE_HINT'),
							isReadOnly: this.getEditor().isReadOnly()
						});
						input.renderTo(contentNode);
						contentNode.style.display = 'block';
					}
				}
			}
		}
	}

	class PageEventsManager {
		_settings = {};
		constructor(settings) {
			this._settings = settings ? settings : {};
			this.eventHandlers = {};
		}
		registerEventHandler(eventName, eventHandler) {
			if (!this.eventHandlers[eventName]) this.eventHandlers[eventName] = [];
			this.eventHandlers[eventName].push(eventHandler);
			BX.addCustomEvent(this, eventName, eventHandler);
		}
		fireEvent(eventName, eventParams) {
			BX.onCustomEvent(this, eventName, eventParams);
		}
		unregisterEventHandlers(eventName) {
			if (this.eventHandlers[eventName]) {
				for (var i = 0; i < this.eventHandlers[eventName].length; i++) {
					BX.removeCustomEvent(this, eventName, this.eventHandlers[eventName][i]);
				}
				delete this.eventHandlers[eventName];
			}
		}
	}

	class SettingsPopup {
		#target;
		#settings;
		#editor;
		#cache = new main_core.Cache.MemoryCache();
		constructor(target, settings = [], editor) {
			this.#target = target;
			this.#settings = settings;
			this.#editor = editor;
		}
		show() {
			this.getPopup().show();
		}
		getPopup() {
			return this.#cache.remember('settings-popup', () => {
				return new main_popup.Popup(this.#editor.getId() + '_' + Math.random() * 100, this.#target, {
					autoHide: true,
					draggable: false,
					offsetLeft: 0,
					offsetTop: 0,
					angle: {
						position: 'top',
						offset: 43
					},
					noAllPaddings: true,
					bindOptions: {
						forceBindPosition: true
					},
					closeByEsc: true,
					content: this.#prepareSettingsContent()
				});
			});
		}
		#getSetting(id) {
			return this.#settings.filter(item => {
				return item.id === id;
			})[0];
		}
		#prepareSettingsContent() {
			const content = main_core.Tag.render`
			<div class='ui-entity-editor-popup-create-field-list'></div>
		`;
			this.#settings.forEach(item => {
				content.append(this.#getSettingItem(item));
			});
			return content;
		}
		#getSettingItem(item) {
			const input = main_core.Tag.render`
			<input type="checkbox">
		`;
			input.checked = item.checked;
			input.dataset.settingId = item.id;
			const descriptionNode = main_core.Type.isStringFilled(item.desc) ? main_core.Tag.render`<span class="ui-entity-editor-popup-create-field-item-desc">${item.desc}</span>` : '';
			const setting = main_core.Tag.render`
			<label class="ui-ctl-block ui-entity-editor-popup-create-field-item ui-ctl-w100">
				<div class="ui-ctl-w10" style="text-align: center">${input}</div>
				<div class="ui-ctl-w75">
					<span class="ui-entity-editor-popup-create-field-item-title">${item.title}</span>
					${descriptionNode}
				</div>
			</label>
		`;
			main_core.Event.bind(setting, 'change', this.#setSetting.bind(this));
			return setting;
		}
		#setSetting(event) {
			const settingItem = this.#getSetting(event.target.dataset.settingId);
			if (!settingItem) {
				return;
			}
			const settingEnabled = event.target.checked;
			this.#requestGridSettings(settingItem, settingEnabled);
		}
		#requestGridSettings(setting, enabled) {
			const headers = [];
			const cells = this.#editor.getGrid().getRows().getHeadFirstChild().getCells();
			Array.from(cells).forEach(header => {
				if ('name' in header.dataset) {
					headers.push(header.dataset.name);
				}
			});
			main_core.ajax.runComponentAction(this.#editor.getComponentName(), 'setGridSetting', {
				mode: 'class',
				data: {
					signedParameters: this.#editor.getSignedParameters(),
					settingId: setting.id,
					selected: enabled,
					currentHeaders: headers
				}
			}).then(() => {
				setting.checked = enabled;
				if (setting.id === 'ADD_NEW_ROW_TOP') {
					const panel = enabled ? 'top' : 'bottom';
					this.#editor.setSettingValue('newRowPosition', panel);
					const activePanel = this.#editor.changeActivePanelButtons(panel);
					const settingButton = activePanel.querySelector('[data-role="product-list-settings-button"]');
					this.getPopup().setBindElement(settingButton);
				} else {
					this.#editor.reloadGrid();
				}
				this.getPopup().close();
				const message = enabled ? main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_SETTING_ENABLED') : main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_SETTING_DISABLED');
				this.#showNotification(message.replace('#NAME#', setting.title), {
					category: 'popup-settings'
				});
			});
		}
		#showNotification(content, options) {
			options = options || {};
			BX.UI.Notification.Center.notify({
				content: content,
				stack: options.stack || null,
				position: 'top-right',
				width: 'auto',
				category: options.category || null,
				autoHideDelay: options.autoHideDelay || 3000
			});
		}
		updateCheckboxState() {
			const popupContainer = this.getPopup().getContentContainer();
			this.#settings.filter(item => item.action === 'grid' && main_core.Type.isArray(item.columns)).forEach(item => {
				let allColumnsExist = true;
				item.columns.forEach(columnName => {
					if (!this.#editor.getGrid().getColumnHeaderCellByName(columnName)) {
						allColumnsExist = false;
					}
				});
				const checkbox = popupContainer.querySelector('input[data-setting-id="' + item.id + '"]');
				if (main_core.Type.isDomNode(checkbox)) {
					checkbox.checked = allColumnsExist;
				}
			});
		}
	}

	class FieldHintManager {
		fieldHintIsBusy = false;
		activeHintGuide = null;
		#gridGetter;
		#contentContainer;
		constructor(contentContainer, gridGetter) {
			this.#contentContainer = contentContainer;
			this.#gridGetter = gridGetter;
		}
		processFieldTour(fieldNode, tourData, endTourHandler, addictedFieldNodes = []) {
			if (this.fieldHintIsBusy) {
				return;
			}
			this.fieldHintIsBusy = true;
			// When click action in progress tour will be closed -> 'onClose' tour method will be executed
			tourData.events = {
				onClose: () => {
					endTourHandler();
					this.fieldHintIsBusy = false;
					this.activeHintGuide = null;
				}
			};
			if (this.#fieldNodeIsInGridVision(fieldNode)) {
				let tourObject = this.#tieTourToNode(fieldNode, tourData);
				this.#freezeGridContainer(() => {
					tourObject.close();
				});
			} else {
				const gridContainer = this.#gridGetter().getContainer();
				const leftArrow = gridContainer.querySelector('.main-grid-ear-left');
				const rightArrow = gridContainer.querySelector('.main-grid-ear-right');
				const fieldPos = fieldNode.getClientRects()[0].x;
				const gridPos = gridContainer.getClientRects()[0].x;
				let spotlight = null;
				if (fieldPos > gridPos) {
					spotlight = this.#bindSpotlightToNode(rightArrow);
				} else {
					spotlight = this.#bindSpotlightToNode(leftArrow);
				}
				this.#bindGridNodeVisionChange(fieldNode, () => {
					spotlight.close();
					let tourObject = this.#tieTourToNode(fieldNode, tourData);
					this.#freezeGridContainer(() => {
						tourObject.close();
					});
				}, [], addictedFieldNodes);
			}
		}
		#bindGridNodeVisionChange(observedNode, onSuccessVisionCallback, callbackParams = [], addictedNodes = []) {
			const observedNodes = this.#getPossibleToValidateFieldNodes(observedNode, ...addictedNodes);
			const observer = event => {
				if (this.#fieldNodeIsInGridVision(...observedNodes)) {
					main_core.Event.unbind(this.#gridGetter().getScrollContainer(), 'scroll', observer);
					main_core.Event.unbind(window, 'resize', observer);
					onSuccessVisionCallback(...callbackParams);
				}
			};
			main_core.Event.bind(this.#gridGetter().getScrollContainer(), 'scroll', observer);
			main_core.Event.bind(window, 'resize', observer);
		}
		#getPossibleToValidateFieldNodes(mainNode, ...addictedNodes) {
			const nodesTuple = [];
			for (const addictedNode of addictedNodes) {
				nodesTuple.push({
					node: addictedNode,
					nodeRect: addictedNode.getClientRects()[0]
				});
			}
			const mainNodeTupleEl = {
				node: mainNode,
				nodeRect: mainNode.getClientRects()[0]
			};
			nodesTuple.push(mainNodeTupleEl);
			nodesTuple.sort((firstEl, secondEl) => {
				const {
					x: firstX
				} = firstEl.nodeRect;
				const {
					x: secondX
				} = secondEl.nodeRect;
				if (firstX < secondX) {
					return -1;
				} else if (firstX > secondX) {
					return 1;
				} else {
					return 0;
				}
			});
			const gridRect = this.#gridGetter()?.getContainer().getClientRects()?.[0];
			function widthIsValid(leftPos, rightPos) {
				return Math.abs(leftPos - rightPos) < gridRect.width;
			}
			while (nodesTuple.length > 1 && !widthIsValid(nodesTuple[0].nodeRect.x, nodesTuple[nodesTuple.length - 1].nodeRect.x)) {
				const firstEl = nodesTuple[0];
				const lastEl = nodesTuple[nodesTuple.length - 1];
				if (firstEl === mainNodeTupleEl) {
					nodesTuple.pop();
				} else if (lastEl === mainNodeTupleEl) {
					nodesTuple.shift();
				} else {
					const firstElDistance = mainNodeTupleEl.nodeRect.x - firstEl.nodeRect.x;
					const lastElDistance = lastEl.nodeRect.x - mainNodeTupleEl.nodeRect.x;
					if (firstElDistance >= lastElDistance) {
						nodesTuple.shift();
					} else {
						nodesTuple.pop();
					}
				}
			}
			return nodesTuple.map(el => el.node);
		}
		#fieldNodeIsInGridVision(...fieldNodes) {
			const gridRect = this.#gridGetter()?.getContainer().getClientRects()?.[0];
			if (gridRect === undefined) {
				return false;
			}
			const gridLeftEdge = gridRect.x;
			const gridRightEdge = gridRect.x + gridRect.width;
			for (const fieldNode of fieldNodes) {
				const fieldRect = fieldNode.getClientRects()?.[0];
				if (fieldRect === undefined) {
					return false;
				}
				const fieldLeftEdge = fieldRect.x;
				const fieldRightEdge = fieldRect.x + fieldRect.width;
				if (fieldLeftEdge < gridLeftEdge || fieldRightEdge > gridRightEdge) {
					return false;
				}
			}
			return true;
		}
		#bindSpotlightToNode(targetNode) {
			const spotlight = new BX.SpotLight({
				id: 'arrow_spotlight',
				targetElement: targetNode,
				autoSave: true,
				targetVertex: "middle-center",
				zIndex: 200
			});
			spotlight.show();
			spotlight.container.style.pointerEvents = "none";
			return spotlight;
		}
		#freezeGridContainer(onCloseCallback, callbackParams = []) {
			const gridContainer = this.#gridGetter().getContainer();
			const leftArrow = gridContainer.querySelector('.main-grid-ear-left');
			const rightArrow = gridContainer.querySelector('.main-grid-ear-right');
			gridContainer.style.pointerEvents = "none";
			leftArrow.style.pointerEvents = "none";
			rightArrow.style.pointerEvents = "none";
			const clickObserver = event => {
				gridContainer.style.pointerEvents = "auto";
				leftArrow.style.pointerEvents = "auto";
				rightArrow.style.pointerEvents = "auto";
				main_core.Event.unbind(this.#contentContainer, 'click', clickObserver);
				onCloseCallback(...callbackParams);
			};
			setTimeout(() => {
				main_core.Event.bind(this.#contentContainer, 'click', clickObserver);
			}, 500);
		}
		#tieTourToNode(tourTarget, tourData) {
			const guide = new ui_tour.Guide({
				steps: [Object.assign({
					target: tourTarget
				}, tourData)],
				onEvents: true
			});
			this.activeHintGuide = guide;
			guide.showNextStep();
			return guide;
		}
		getActiveHint() {
			if (!this.fieldHintIsBusy) {
				return null;
			} else if (this.activeHintGuide instanceof ui_tour.Guide) {
				return this.activeHintGuide;
			}
			return null;
		}
	}

	const GRID_TEMPLATE_ROW = 'template_0';
	const DEFAULT_PRECISION = 8;
	const isEmptyObject = function (obj) {
		if (!main_core.Type.isPlainObject(obj)) {
			return false;
		}
		for (const key in obj) {
			return false;
		}
		return true;
	};
	class Editor {
		products = [];
		productsWasInitiated = false;
		cache = new main_core.Cache.MemoryCache();
		#fieldHintManager;
		actions = {
			productChange: 'productChange',
			productListChanged: 'productListChanged',
			updateListField: 'listField',
			updateTotal: 'total'
		};
		updateFieldForList = null;
		productRowAddHandler = this.handleProductRowAdd.bind(this);
		productRowCreateHandler = this.handleProductRowCreate.bind(this);
		showBarcodeSettingsPopupHandler = this.handleShowBarcodeSettingsPopup.bind(this);
		showSettingsPopupHandler = this.handleShowSettingsPopup.bind(this);
		onSaveHandler = this.handleOnSave.bind(this);
		onEditorSubmit = this.handleEditorSubmit.bind(this);
		onFocusToProductList = this.handleProductListFocus.bind(this);
		onBeforeGridRequestHandler = this.handleOnBeforeGridRequest.bind(this);
		onGridUpdatedHandler = this.handleOnGridUpdated.bind(this);
		onGridRowMovedHandler = this.handleOnGridRowMoved.bind(this);
		onBeforeProductChangeHandler = this.handleOnBeforeProductChange.bind(this);
		onProductChangeHandler = this.handleOnProductChange.bind(this);
		onProductClearHandler = this.handleOnProductClear.bind(this);
		dropdownChangeHandler = this.handleDropdownChange.bind(this);
		onScanEmitHandler = this.handleMobileScanEvent.bind(this);
		changeProductFieldHandler = this.handleFieldChange.bind(this);
		blurProductFieldHandler = this.handleFieldBlur.bind(this);
		updateTotalDataDelayedHandler = main_core.Runtime.debounce(this.updateTotalDataDelayed, 100, this);
		constructor(id) {
			this.setId(id);
		}
		init(config = {}) {
			this.setSettings(config);
			this.scannerToken = this.scannerToken ?? main_core.Text.getRandom(16);
			if (this.canEdit()) {
				this.addFirstRowIfEmpty();
				this.enableEdit();
			}
			this.initForm();
			this.initProducts();
			this.initGridData();
			this.paintColumns();
			this.#fieldHintManager = new FieldHintManager(this.getContainer(), this.getGrid.bind(this));
			main_core_events.EventEmitter.emit('DocumentProductListController', [this]);
			this.#initSupportCustomRowActions();
			this.subscribeDomEvents();
			this.subscribeCustomEvents();
			this.getContainer().querySelectorAll('.catalog-document-product-list-add-block').forEach(buttonBlock => {
				BX.UI.Hint.init(buttonBlock);
			});
		}
		subscribeDomEvents() {
			const container = this.getContainer();
			if (main_core.Type.isElementNode(container)) {
				container.querySelectorAll('[data-role="product-list-add-button"]').forEach(addButton => {
					if (this.getSettingValue('isOnecInventoryManagementRestricted') === true) {
						main_core.Dom.addClass(addButton, 'ui-btn-icon-lock');
					}
					main_core.Event.bind(addButton, 'click', this.productRowAddHandler);
				});
				if (this.getSettingValue('enabledCreateProductButton', true)) {
					container.querySelectorAll('[data-role="product-list-create-button"]').forEach(addButton => {
						main_core.Event.bind(addButton, 'click', this.productRowCreateHandler);
					});
				}
				container.querySelectorAll('[data-role="product-list-settings-button"]').forEach(configButton => {
					main_core.Event.bind(configButton, 'click', this.showSettingsPopupHandler);
				});
				container.querySelectorAll('[data-role="product-list-barcode-settings-button"]').forEach(configButton => {
					main_core.Event.bind(configButton, 'click', this.showBarcodeSettingsPopupHandler);
				});
			}
		}
		unsubscribeDomEvents() {
			const container = this.getContainer();
			if (main_core.Type.isElementNode(container)) {
				container.querySelectorAll('[data-role="product-list-select-button"]').forEach(selectButton => {
					main_core.Event.unbind(selectButton, 'click', this.productSelectionPopupHandler);
				});
				container.querySelectorAll('[data-role="product-list-add-button"]').forEach(createButton => {
					main_core.Event.unbind(createButton, 'click', this.productRowCreateHandler);
				});
				container.querySelectorAll('[data-role="product-list-barcode-settings-button"]').forEach(addButton => {
					main_core.Event.unbind(addButton, 'click', this.productRowAddHandler);
				});
				container.querySelectorAll('[data-role="product-list-settings-button"]').forEach(configButton => {
					main_core.Event.unbind(configButton, 'click', this.showSettingsPopupHandler);
				});
			}
		}
		subscribeCustomEvents() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditor:onSave', this.onSaveHandler);
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorAjax:onSubmit', this.onEditorSubmit);
			main_core_events.EventEmitter.subscribe('onFocusToProductList', this.onFocusToProductList);
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequestHandler);
			main_core_events.EventEmitter.subscribe('Grid::updated', this.onGridUpdatedHandler);
			main_core_events.EventEmitter.subscribe('Grid::rowMoved', this.onGridRowMovedHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onBeforeChange', this.onBeforeProductChangeHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onChange', this.onProductChangeHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onClear', this.onProductClearHandler);
			main_core_events.EventEmitter.subscribe('Dropdown::change', this.dropdownChangeHandler);
			main_core_events.EventEmitter.subscribe('BarcodeScanner::onScanEmit', this.onScanEmitHandler);
		}
		unsubscribeCustomEvents() {
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntityEditor:onSave', this.onSaveHandler);
			main_core_events.EventEmitter.unsubscribe('BX.UI.EntityEditorAjax:onSubmit', this.onEditorSubmit);
			main_core_events.EventEmitter.unsubscribe('onFocusToProductList', this.onFocusToProductList);
			main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.onBeforeGridRequestHandler);
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.onGridUpdatedHandler);
			main_core_events.EventEmitter.unsubscribe('Grid::rowMoved', this.onGridRowMovedHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onBeforeChange', this.onBeforeProductChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onChange', this.onProductChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onClear', this.onProductClearHandler);
			main_core_events.EventEmitter.unsubscribe('Dropdown::change', this.dropdownChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BarcodeScanner::onScanEmit', this.onScanEmitHandler);
		}
		handleMobileScanEvent(event) {
			const params = event.getData();
			if (this.scannerToken !== params.id || !main_core.Type.isStringFilled(params.barcode)) {
				return;
			}
			for (const product of this.products) {
				if (product.getBarcodeSelector()?.searchInput?.getNameInput() === document.activeElement) {
					product.getBarcodeSelector().searchInput?.applyScannerData(params.barcode);
					return;
				}
			}
			for (const product of this.products) {
				if (product.getBarcodeSelector()?.searchInput?.getNameInput().value === '' && product.getSelector()?.searchInput?.getNameInput().value === '') {
					product.getBarcodeSelector().searchInput?.applyScannerData(params.barcode);
					return;
				}
			}
			const newRowId = this.addProductRow();
			this.getProductById(newRowId)?.getBarcodeSelector().searchInput?.applyScannerData(params.barcode);
		}
		#initSupportCustomRowActions() {
			this.getGrid()._clickOnRowActionsButton = () => {};
		}
		selectProductInRow(id, productId) {
			if (!main_core.Type.isStringFilled(id) || main_core.Text.toNumber(productId) <= 0) {
				return;
			}
			requestAnimationFrame(() => {
				this.getProductSelector(id)?.onProductSelect(productId);
			});
		}
		handleOnSave(event) {
			const notification = catalog_productModel.ProductModel.getLastActiveSaveNotification();
			if (notification) {
				notification.close();
			}
			const items = [];
			this.products.forEach(product => {
				const item = {
					fields: {
						...product.fields
					},
					rowId: product.fields.ROW_ID
				};
				items.push(item);
			});
			this.setSettingValue('items', items);
		}
		handleEditorSubmit(event) {}
		handleProductListFocus(event) {
			if (this.isReadOnly()) {
				return;
			}
			let listHaveEmptyRows = false;
			for (const product of this.products) {
				if (product.isEmptyRow()) {
					listHaveEmptyRows = true;
					this.focusProductSelector(product.fields.ROW_ID);
					break;
				}
			}
			if (!listHaveEmptyRows) {
				this.handleProductRowAdd();
			}
		}
		onInnerCancel() {
			this.reloadGrid(false);
		}
		changeActivePanelButtons(panelCode) {
			const container = this.getContainer();
			const activePanel = container.querySelector('.catalog-document-product-list-add-block-' + panelCode);
			if (main_core.Type.isDomNode(activePanel)) {
				main_core.Dom.removeClass(activePanel, 'catalog-document-product-list-add-block-hidden');
				main_core.Dom.addClass(activePanel, 'catalog-document-product-list-add-block-active');
			}
			const hiddenPanelCode = panelCode === 'top' ? 'bottom' : 'top';
			const removePanel = container.querySelector('.catalog-document-product-list-add-block-' + hiddenPanelCode);
			if (main_core.Type.isDomNode(removePanel)) {
				main_core.Dom.addClass(removePanel, 'catalog-document-product-list-add-block-hidden');
				main_core.Dom.removeClass(removePanel, 'catalog-document-product-list-add-block-active');
			}
			return activePanel;
		}
		reloadGrid(useProductsFromRequest = true, isInternalChanging = null) {
			if (isInternalChanging === null) {
				isInternalChanging = !useProductsFromRequest;
			}
			this.getGrid().reloadTable('POST', {
				useProductsFromRequest
			}, () => this.actionUpdateTotalData({
				isInternalChanging
			}));
		}

		/*
			keep in mind different actions for this handler:
			- native reload by grid actions (columns settings, etc.)		- products from request
			- rollback													- products from db			this.reloadGrid(false)
		 */
		handleOnBeforeGridRequest(event) {
			const [grid, eventArgs] = event.getCompatData();
			if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId()) {
				return;
			}

			// reload by native grid actions (columns settings, etc.), otherwise by this.reloadGrid()
			const isNativeAction = !('useProductsFromRequest' in eventArgs.data);
			const useProductsFromRequest = isNativeAction ? true : eventArgs.data.useProductsFromRequest;
			eventArgs.url = this.getReloadUrl();
			eventArgs.method = 'POST';
			eventArgs.sessid = BX.bitrix_sessid();
			eventArgs.data = {
				...eventArgs.data,
				useProductsFromRequest,
				signedParameters: this.getSignedParameters(),
				products: useProductsFromRequest ? this.getProductsFields(Editor.#getAjaxFields()) : null
			};
			let isDeletingRequest = false;
			if (eventArgs.data['action_button_' + eventArgs.gridId] === 'delete') {
				isDeletingRequest = true;
			}
			this.clearEditor();
			if (isNativeAction) {
				main_core_events.EventEmitter.subscribeOnce('Grid::updated', event => {
					const [grid] = event.getCompatData();
					if (!grid || grid.getId() !== this.getGridId()) {
						return;
					}
					this.actionUpdateTotalData({
						isInternalChanging: false
					});
					if (isDeletingRequest) {
						this.executeActions([{
							type: this.actions.productListChanged
						}]);
					}
				});
			}
		}
		handleOnGridUpdated(event) {
			const [grid] = event.getCompatData();
			if (!grid || grid.getId() !== this.getGridId()) {
				return;
			}
			this.getSettingsPopup().updateCheckboxState();
		}
		handleOnGridRowMoved(event) {
			const [ids,, grid] = event.getCompatData();
			if (!grid || grid.getId() !== this.getGridId()) {
				return;
			}
			const changed = this.resortProductsByIds(ids);
			if (changed) {
				this.refreshSortFields();
				this.numerateRows();
				this.executeActions([{
					type: this.actions.productListChanged
				}]);
			}
		}
		initPageEventsManager() {
			const componentId = this.getSettingValue('componentId');
			this.pageEventsManager = new PageEventsManager({
				id: componentId
			});
		}
		getPageEventsManager() {
			if (!this.pageEventsManager) {
				this.initPageEventsManager();
			}
			return this.pageEventsManager;
		}
		canEdit() {
			return this.getSettingValue('allowEdit', false) === true;
		}
		enableEdit() {
			// Cannot use editSelected because checkboxes have been removed
			const rows = this.getGrid().getRows().getRows();
			rows.forEach(current => {
				if (!current.isHeadChild() && !current.isTemplate() && !isEmptyObject(current.getEditData())) {
					current.edit();
				}
			});
		}
		addFirstRowIfEmpty() {
			if (this.getGrid().getRows().getCountDisplayed() === 0) {
				this.setSettingValue('taxIncluded', null);
				this.setSettingValue('taxIncludedFormatted', null);
				requestAnimationFrame(() => this.addProductRow());
			}
		}
		clearEditor() {
			this.unsubscribeProductsEvents();
			this.products = [];
			this.productsWasInitiated = false;
			this.destroySettingsPopup();
			this.unsubscribeDomEvents();
			this.unsubscribeCustomEvents();
			main_core.Event.unbindAll(this.container);
		}
		wasProductsInitiated() {
			return this.productsWasInitiated;
		}
		unsubscribeProductsEvents() {
			this.products.forEach(current => {
				const productSelector = current.getSelector();
				if (productSelector) {
					productSelector.unsubscribeEvents();
				}
				const barcodeSelector = current.getBarcodeSelector();
				if (barcodeSelector) {
					barcodeSelector.unsubscribeEvents();
				}
			});
		}
		destroy() {
			this.setForm(null);
			this.clearController();
			this.clearEditor();
		}
		setController(controller) {
			if (this.controller === controller) {
				return;
			}
			if (this.controller) {
				this.controller.clearProductList();
			}
			this.controller = controller;
		}
		clearController() {
			this.controller = null;
		}
		getId() {
			return this.id;
		}
		setId(id) {
			this.id = id;
		}

		/* settings tools */
		getSettings() {
			return this.settings;
		}
		setSettings(settings) {
			this.settings = settings || {};
		}
		getSettingValue(name, defaultValue) {
			return this.settings.hasOwnProperty(name) ? this.settings[name] : defaultValue;
		}
		setSettingValue(name, value) {
			this.settings[name] = value;
		}
		getComponentName() {
			return this.getSettingValue('componentName', '');
		}
		getReloadUrl() {
			return this.getSettingValue('reloadUrl', '');
		}
		getSignedParameters() {
			return this.getSettingValue('signedParameters', '');
		}
		getContainerId() {
			return this.getSettingValue('containerId', '');
		}
		getGridId() {
			return this.getSettingValue('gridId', '');
		}
		getLanguageId() {
			return this.getSettingValue('languageId', '');
		}
		getSiteId() {
			return this.getSettingValue('siteId', '');
		}
		getCatalogId() {
			return this.getSettingValue('catalogId', 0);
		}
		isReadOnly() {
			return this.getSettingValue('readOnly', true);
		}
		setReadOnly(readOnly) {
			this.setSettingValue('readOnly', readOnly);
		}
		getCurrencyId() {
			return this.getSettingValue('currencyId', '');
		}
		setCurrencyId(currencyId) {
			this.setSettingValue('currencyId', currencyId);
			return currency_currencyCore.CurrencyCore.loadCurrencyFormat(currencyId);
		}
		isSalesOrdersDocument() {
			const salesOrdersDocumentTypeCodes = ['REALIZATION', 'W'];
			return salesOrdersDocumentTypeCodes.includes(this.settings.documentType);
		}
		changeCurrencyId(currencyId) {
			const oldCurrencyId = this.getCurrencyId();
			if (oldCurrencyId === currencyId) {
				return;
			}
			this.setCurrencyId(currencyId).then(() => {
				const products = [];
				this.products.forEach(product => {
					product.getModel().setOption('currency', currencyId);
					products.push({
						fields: product.getFieldsWithHashed(['BASE_PRICE', 'PURCHASING_PRICE', 'STORE_FROM', 'STORE_TO']),
						id: product.getId()
					});
				});
				if (products.length > 0) {
					main_core.ajax.runComponentAction(this.getComponentName(), 'calculateProductPrices', {
						mode: 'class',
						signedParameters: this.getSignedParameters(),
						data: {
							products,
							currencyId,
							oldCurrencyId
						}
					}).then(this.onCalculatePricesResponse.bind(this));
				}
				const editData = this.getGridEditData();
				const templateRow = editData[GRID_TEMPLATE_ROW];
				templateRow['CURRENCY'] = this.getCurrencyId();
				const templateFieldNames = ['BASE_PRICE', 'PURCHASING_PRICE'];
				templateFieldNames.forEach(field => {
					if (templateRow[field] && templateRow[field]['CURRENCY']) {
						templateRow[field]['CURRENCY']['VALUE'] = this.getCurrencyId();
					}
				});
				this.setGridEditData(editData);
			});
		}
		onCalculatePricesResponse(response) {
			const products = response.data;
			this.products.forEach(product => {
				if (main_core.Type.isObject(products[product.getId()])) {
					const rawRealValues = products[product.getId()].REAL_VALUES || {};
					let realValues = {};
					if (Object.keys(rawRealValues).length > 0) {
						realValues = product.parseRealValues(products[product.getId()].REAL_VALUES);
						product.updateRealValues(realValues);
					}
					let basePrice = products[product.getId()].BASE_PRICE;
					if ('BASE_PRICE' in realValues) {
						basePrice = realValues.BASE_PRICE;
					}
					product.updateField('BASE_PRICE', basePrice);
					let purchasingPrice = products[product.getId()].PURCHASING_PRICE;
					if ('PURCHASING_PRICE' in realValues) {
						purchasingPrice = realValues.PURCHASING_PRICE;
					}
					product.updateField('PURCHASING_PRICE', purchasingPrice);
					product.updateUiCurrencyFields();
				}
			});
			this.updateTotalDataDelayed();
			this.updateTotalUiCurrency();
		}
		updateTotalUiCurrency() {
			const totalBlock = BX(this.getSettingValue('totalBlockContainerId', null));
			if (main_core.Type.isElementNode(totalBlock)) {
				const totalsList = ['totalCost'];
				totalBlock.querySelectorAll('.catalog-document-product-list-result-grid-total').forEach(row => {
					for (const totalId of totalsList) {
						const valueElement = row.querySelector('[data-total="' + totalId + '"]');
						if (valueElement) {
							row.innerHTML = currency_currencyCore.CurrencyCore.getPriceControl(valueElement, this.getCurrencyId());
						}
					}
				});
			}
		}
		getCurrencyText() {
			const currencyId = this.getCurrencyId();
			if (!main_core.Type.isStringFilled(currencyId)) {
				return '';
			}
			const format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currencyId);
			return format && format.FORMAT_STRING.replace(/(^|[^&])#/, '$1').trim() || '';
		}
		getDataFieldName() {
			return this.getSettingValue('dataFieldName', '');
		}
		getDataSettingsFieldName() {
			const field = this.getDataFieldName();
			return main_core.Type.isStringFilled(field) ? field + '_SETTINGS' : '';
		}
		getPricePrecision() {
			return this.getSettingValue('pricePrecision', DEFAULT_PRECISION);
		}
		getDisplayPrecision() {
			const currencyId = this.getCurrencyId();
			if (currencyId) {
				const format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currencyId);
				if (format && main_core.Type.isNumber(format.DECIMALS)) {
					return format.DECIMALS;
				}
			}
			return 2;
		}
		getQuantityPrecision() {
			return this.getSettingValue('quantityPrecision', DEFAULT_PRECISION);
		}
		getCommonPrecision() {
			return this.getSettingValue('commonPrecision', DEFAULT_PRECISION);
		}
		getMeasures() {
			return this.getSettingValue('measures', []);
		}
		getDefaultMeasure() {
			return this.getSettingValue('defaultMeasure', {});
		}
		getRowIdPrefix() {
			return this.getSettingValue('rowIdPrefix', 'catalog_entity_product_list_');
		}

		/* settings tools finish */

		/* calculate tools */
		parseInt(value, defaultValue = 0) {
			let result;
			const isNumberValue = main_core.Type.isNumber(value);
			const isStringValue = main_core.Type.isStringFilled(value);
			if (!isNumberValue && !isStringValue) {
				return defaultValue;
			}
			if (isStringValue) {
				value = value.replace(/^\s+|\s+$/g, '');
				const isNegative = value.indexOf('-') === 0;
				result = parseInt(value.replace(/[^\d]/g, ''), 10);
				if (isNaN(result)) {
					result = defaultValue;
				} else {
					if (isNegative) {
						result = -result;
					}
				}
			} else {
				result = parseInt(value, 10);
				if (isNaN(result)) {
					result = defaultValue;
				}
			}
			return result;
		}
		parseFloat(value, precision = DEFAULT_PRECISION, defaultValue = 0.0) {
			let result;
			const isNumberValue = main_core.Type.isNumber(value);
			const isStringValue = main_core.Type.isStringFilled(value);
			if (!isNumberValue && !isStringValue) {
				return defaultValue;
			}
			if (isStringValue) {
				value = value.replace(/^\s+|\s+$/g, '');
				const dot = value.indexOf('.');
				const comma = value.indexOf(',');
				const isNegative = value.indexOf('-') === 0;
				if (dot < 0 && comma >= 0) {
					let s1 = value.substr(0, comma);
					const decimalLength = value.length - comma - 1;
					if (decimalLength > 0) {
						s1 += '.' + value.substr(comma + 1, decimalLength);
					}
					value = s1;
				}
				value = value.replace(/[^\d.]+/g, '');
				result = parseFloat(value);
				if (isNaN(result)) {
					result = defaultValue;
				}
				if (isNegative) {
					result = -result;
				}
			} else {
				result = parseFloat(value);
			}
			if (precision >= 0) {
				result = this.round(result, precision);
			}
			return result;
		}
		round(value, precision = DEFAULT_PRECISION) {
			const factor = Math.pow(10, precision);
			return Math.round(value * factor) / factor;
		}

		/* calculate tools finish */

		getContainer() {
			return this.cache.remember('container', () => {
				return document.getElementById(this.getContainerId());
			});
		}
		initForm() {
			const formId = this.getSettingValue('formId', '');
			const form = main_core.Type.isStringFilled(formId) ? BX('form_' + formId) : null;
			if (main_core.Type.isElementNode(form)) {
				this.setForm(form);
			}
		}
		isExistForm() {
			return main_core.Type.isElementNode(this.getForm());
		}
		getForm() {
			return this.form;
		}
		setForm(form) {
			this.form = form;
		}
		initFormFields() {
			const container = this.getForm();
			if (main_core.Type.isElementNode(container)) {
				const field = this.getDataField();
				if (!main_core.Type.isElementNode(field)) {
					this.initDataField();
				}
				const settingsField = this.getDataSettingsField();
				if (!main_core.Type.isElementNode(settingsField)) {
					this.initDataSettingsField();
				}
			}
		}
		initFormField(fieldName) {
			const container = this.getForm();
			if (main_core.Type.isElementNode(container) && main_core.Type.isStringFilled(fieldName)) {
				container.appendChild(main_core.Dom.create('input', {
					attrs: {
						type: 'hidden',
						name: fieldName
					}
				}));
			}
		}
		removeFormFields() {
			const field = this.getDataField();
			if (main_core.Type.isElementNode(field)) {
				main_core.Dom.remove(field);
			}
			const settingsField = this.getDataSettingsField();
			if (main_core.Type.isElementNode(settingsField)) {
				main_core.Dom.remove(settingsField);
			}
		}
		initDataField() {
			this.initFormField(this.getDataFieldName());
		}
		initDataSettingsField() {
			this.initFormField(this.getDataSettingsFieldName());
		}
		getFormField(fieldName) {
			const container = this.getForm();
			if (main_core.Type.isElementNode(container) && main_core.Type.isStringFilled(fieldName)) {
				return container.querySelector('input[name="' + fieldName + '"]');
			}
			return null;
		}
		getDataField() {
			return this.getFormField(this.getDataFieldName());
		}
		getDataSettingsField() {
			return this.getFormField(this.getDataSettingsFieldName());
		}
		getProductCount() {
			return this.products.filter(item => !item.isEmptyRow()).length;
		}
		initProducts() {
			const list = this.getSettingValue('items', []);
			for (let item of list) {
				const fields = {
					...item.fields
				};
				this.products.push(new Row(item.rowId, fields, this.getSettingValue('rowSettings', {}), this));
			}
			this.numerateRows();
			this.productsWasInitiated = true;
			this.updateTotalDataDelayed();
		}
		numerateRows() {
			this.products.forEach((product, index) => {
				product.setRowNumber(index + 1);
			});
		}
		getGrid() {
			return this.cache.remember('grid', () => {
				const gridId = this.getGridId();
				if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
					throw Error(`Cannot find grid with '${gridId}' id.`);
				}
				return BX.Main.gridManager.getInstanceById(gridId);
			});
		}
		getGridColumnIndexes() {
			return this.cache.remember('getGridColumnIndexes', () => {
				let result = {};
				const columns = this.getGrid().getHead().querySelectorAll('.main-grid-cell-head');
				for (let i = 0; i < columns.length; i++) {
					const node = columns[i];
					const columnName = node.dataset.name;
					if (columnName) {
						result[columnName] = i;
					}
				}
				return result;
			});
		}
		initGridData() {
			const gridEditData = this.getSettingValue('templateGridEditData', null);
			if (gridEditData) {
				this.setGridEditData(gridEditData);
			}
		}
		paintColumns() {
			const paintedColumns = this.getSettingValue('paintedColumns', null);
			const grid = this.getGrid();
			if (grid && main_core.Type.isArray(paintedColumns)) {
				paintedColumns.forEach(columnName => {
					const rows = grid.getRows().getRows();
					rows.forEach(current => {
						const cell = current.getCellById(columnName);
						if (cell) {
							main_core.Dom.addClass(cell, 'main-grid-cell-light-blue-background');
						}
					});
				});
			}
		}
		getGridEditData() {
			return this.getGrid().arParams.EDITABLE_DATA;
		}
		getColumnInfo(code) {
			return this.getGrid()?.arParams?.COLUMNS_ALL[code] || {};
		}
		setGridEditData(data) {
			this.getGrid().arParams.EDITABLE_DATA = data;
		}
		setOriginalTemplateEditData(data) {
			this.getGrid().arParams.EDITABLE_DATA[GRID_TEMPLATE_ROW] = data;
		}
		handleProductErrorsChange() {
			if (this.#childrenHasErrors()) {
				this.controller.disableSaveButton();
			} else {
				this.controller.enableSaveButton();
			}
		}
		#childrenHasErrors() {
			return this.products.filter(product => product.getModel().getErrorCollection().hasErrors()).length > 0;
		}
		handleFieldChange(event) {
			const row = event.target.closest('tr');
			if (row && row.hasAttribute('data-id')) {
				const product = this.getProductById(row.getAttribute('data-id'));
				if (product) {
					let fieldCode = event.target.getAttribute('data-name');
					if (!main_core.Type.isStringFilled(fieldCode)) {
						const cell = event.target.closest('td');
						fieldCode = this.getFieldCodeByGridCell(row, cell);
					}
					if (fieldCode) {
						product.updateFieldByEvent(fieldCode, event);
					}
				}
			}
		}
		handleFieldBlur(event) {
			const row = event.target.closest('tr');
			const value = event.target.value;
			let fieldCode = event.target.getAttribute('data-name');
			if (!main_core.Type.isStringFilled(fieldCode)) {
				const cell = event.target.closest('td');
				fieldCode = this.getFieldCodeByGridCell(row, cell);
			}
			if (this.isSalesOrdersDocument() && fieldCode === 'AMOUNT' && value <= 0) {
				event.target.value = 1;
				this.handleFieldChange(event);
				BX.UI.Notification.Center.notify({
					width: 'auto',
					content: main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_INVALID_AMOUNT_REALIZATION')
				});
			}
		}
		handleDropdownChange(event) {
			const [dropdownId,,,, value] = event.getData();
			const regExp = new RegExp(this.getRowIdPrefix() + '([A-Za-z0-9]+)_(\\w+)_control', 'i');
			const matches = dropdownId.match(regExp);
			if (matches) {
				const [, rowId, fieldCode] = matches;
				const product = this.getProductById(rowId);
				if (product) {
					product.updateDropdownField(fieldCode, value);
				}
			}
		}
		getProductById(id) {
			const rowId = this.getRowIdPrefix() + id;
			return this.getProductByRowId(rowId);
		}
		getProductByRowId(rowId) {
			return this.products.find(row => {
				return row.getId() === rowId;
			});
		}
		getFieldCodeByGridCell(row, cell) {
			if (!main_core.Type.isDomNode(row) || !main_core.Type.isDomNode(cell)) {
				return null;
			}
			const grid = this.getGrid();
			if (grid) {
				const headRow = grid.getRows().getHeadFirstChild();
				const index = [...row.cells].indexOf(cell);
				return headRow.getCellNameByCellIndex(index);
			}
			return null;
		}
		addProductRow(anchorProduct = null) {
			const row = this.createGridProductRow();
			const newId = row.getId();
			if (anchorProduct) {
				const anchorRowNode = this.getGrid().getRows().getById(anchorProduct.getField('ID'))?.getNode();
				if (anchorRowNode) {
					anchorRowNode.parentNode.insertBefore(row.getNode(), anchorRowNode.nextSibling);
				}
			}
			this.initializeNewProductRow(newId, anchorProduct);
			this.getGrid().bindOnRowEvents();
			return newId;
		}
		handleProductRowAdd() {
			if (this.getSettingValue('isOnecInventoryManagementRestricted') === true) {
				catalog_toolAvailabilityManager.OneCPlanRestrictionSlider.show();
				return;
			}
			const id = this.addProductRow();
			this.focusProductSelector(id);
		}
		handleProductRowCreate() {}
		handleShowBarcodeSettingsPopup() {
			this.getSettingsPopup().show();
		}
		handleShowSettingsPopup() {
			this.getSettingsPopup().show();
		}
		destroySettingsPopup() {
			if (this.cache.has('settings-popup')) {
				this.cache.get('settings-popup').getPopup().destroy();
				this.cache.delete('settings-popup');
			}
		}
		getSettingsPopup() {
			return this.cache.remember('settings-popup', () => {
				return new SettingsPopup(this.getContainer().querySelector('.catalog-document-product-list-add-block-active [data-role="product-list-settings-button"]'), this.getSettingValue('popupSettings', []), this);
			});
		}
		getHintPopup() {
			return this.cache.remember('hint-popup', () => {
				return new HintPopup(this);
			});
		}
		createGridProductRow() {
			const newId = main_core.Text.getRandom();
			const originalTemplate = this.redefineTemplateEditData(newId);
			const grid = this.getGrid();
			let newRow;
			if (this.getSettingValue('newRowPosition') === 'bottom') {
				newRow = grid.appendRowEditor();
			} else {
				newRow = grid.prependRowEditor();
			}
			const newNode = newRow.getNode();
			if (main_core.Type.isDomNode(newNode)) {
				newNode.setAttribute('data-id', newId);
				newRow.makeCountable();
			}
			if (originalTemplate) {
				this.setOriginalTemplateEditData(originalTemplate);
			}
			main_core_events.EventEmitter.emit('Grid::thereEditedRows', []);
			grid.adjustRows();
			grid.updateCounterDisplayed();
			grid.updateCounterSelected();
			return newRow;
		}
		handleDeleteRow(rowId, event) {
			event.preventDefault();
			const row = this.getProductByRowId(rowId);
			if (row) {
				this.deleteRow(rowId);
			}
		}
		redefineTemplateEditData(newId) {
			const data = this.getGridEditData();
			const originalTemplateData = data[GRID_TEMPLATE_ROW];
			const customEditData = this.prepareCustomEditData(originalTemplateData, newId);
			this.setOriginalTemplateEditData({
				...originalTemplateData,
				...customEditData
			});
			return originalTemplateData;
		}
		prepareCustomEditData(originalEditData, newId) {
			const customEditData = {};
			const templateIdMask = this.getSettingValue('templateIdMask', '');
			for (let i in originalEditData) {
				if (originalEditData.hasOwnProperty(i)) {
					if (main_core.Type.isStringFilled(originalEditData[i]) && originalEditData[i].indexOf(templateIdMask) >= 0) {
						customEditData[i] = originalEditData[i].replace(new RegExp(templateIdMask, 'g'), newId);
					} else if (main_core.Type.isPlainObject(originalEditData[i])) {
						customEditData[i] = this.prepareCustomEditData(originalEditData[i], newId);
					} else {
						customEditData[i] = originalEditData[i];
					}
				}
			}
			return customEditData;
		}
		initializeNewProductRow(newId, anchorProduct = null) {
			let fields = {};
			if (anchorProduct !== null) {
				fields = Object.assign(fields, anchorProduct?.getFields());
			} else {
				fields = {
					...this.getSettingValue('templateItemFields', {}),
					...{
						CURRENCY: this.getCurrencyId()
					}
				};
			}
			if (main_core.Type.isNil(anchorProduct) && this.products.length > 0) {
				const previousRow = this.getSettingValue('newRowPosition') === 'bottom' ? this.products[this.products.length - 1] : this.products[0];
				const stores = this.getSettingValue('stores', {});
				const storeFields = previousRow.getSettingValue('storeHeaderMap', {});
				Object.values(storeFields).forEach(field => {
					const previousStoreValue = previousRow.getField(field);
					if (main_core.Type.isNil(stores[previousStoreValue])) {
						return;
					}
					fields[field] = previousRow.getField(field);
					const titleName = field + '_TITLE';
					fields[titleName] = previousRow.getField(titleName);
				});
			}
			const rowId = this.getRowIdPrefix() + newId;
			fields.ID = newId;
			fields.ROW_ID = newId;
			if (main_core.Type.isObject(fields.IMAGE_INFO)) {
				delete fields.IMAGE_INFO.input;
			}
			const product = new Row(rowId, fields, this.getSettingValue('rowSettings', {}), this);
			if (anchorProduct instanceof Row) {
				this.products.splice(1 + this.products.indexOf(anchorProduct), 0, product);
				product.refreshFieldsLayout();
			} else if (this.getSettingValue('newRowPosition') === 'bottom') {
				this.products.push(product);
			} else {
				this.products.unshift(product);
			}
			this.refreshSortFields();
			this.numerateRows();
			product.updateUiCurrencyFields();
			this.updateTotalUiCurrency();
			return product;
		}
		getProductSelector(newId) {
			return this.getProductById(newId).getSelector();
		}
		focusProductSelector(newId) {
			requestAnimationFrame(() => {
				this.getProductSelector(newId)?.searchInDialog().focusName();
			});
		}
		handleOnBeforeProductChange(event) {
			const data = event.getData();
			const product = this.getProductByRowId(data.rowId);
			if (product) {
				this.getGrid().tableFade();
				product.resetExternalActions();
			}
		}
		handleOnProductChange(event) {
			const data = event.getData();
			const productRow = this.getProductByRowId(data.rowId);
			if (productRow && data.fields) {
				delete data.fields.ID;

				// taxes
				const taxIncludedFromFirstItem = this.getSettingValue('taxIncludedFromFirstItem', null);
				const taxIncludedFromFirstItemFormatted = this.getSettingValue('taxIncludedFromFirstItemFormatted', null);
				const taxIncluded = taxIncludedFromFirstItem ? taxIncludedFromFirstItem : this.getSettingValue('taxIncluded', null);
				const taxIncludedFormatted = taxIncludedFromFirstItemFormatted ? taxIncludedFromFirstItemFormatted : this.getSettingValue('taxIncludedFormatted', null);
				if (taxIncluded && taxIncludedFormatted) {
					if (data.fields['TAX_INCLUDED'] === 'Y' && data.fields['TAX_INCLUDED'] !== taxIncluded) {
						data.fields['BASE_PRICE'] = data.fields['BASE_PRICE'] / (1 + data.fields['TAX_RATE'] / 100);
					}
					data.fields['TAX_INCLUDED'] = taxIncluded;
					data.fields['TAX_INCLUDED_FORMATTED'] = taxIncludedFormatted;
				} else {
					this.setSettingValue('taxIncluded', data.fields.TAX_INCLUDED);
					this.setSettingValue('taxIncludedFormatted', data.fields.TAX_INCLUDED_FORMATTED);
				}
				// end taxes

				productRow.setFields(data.fields);
				Object.keys(data.fields).forEach(key => {
					productRow.updateFieldValue(key, data.fields[key]);
				});
				productRow.setField('IS_NEW', data.isNew ? 'Y' : 'N');
				productRow.getSelector()?.layout();
				productRow.getBarcodeSelector()?.layout();
				productRow.updateProductStoreValues();
				productRow.initHandlersForSelectors();
				productRow.layoutStoreSelector(productRow.getSettingValue('storeHeaderMap', {}));
				productRow.layoutBarcode();
				productRow.executeExternalActions();
				if (this.isSalesOrdersDocument()) {
					productRow.changeAmount(productRow.getAmount() > 0 ? productRow.getAmount() : 1);
				}
				this.getGrid().tableUnfade();
			} else {
				this.getGrid().tableUnfade();
			}
		}
		handleOnProductClear(event) {
			const {
				selectorId,
				rowId
			} = event.getData();
			const product = this.getProductByRowId(rowId);
			if (product && product.getSelector().getId() === selectorId) {
				product.initHandlersForSelectors();
				product.setMeasure(this.getDefaultMeasure());
				product.changePurchasingPrice(0);
				product.changeBasePrice(0);
				product.changeAmount(0);
				product.updateUiStoreValues();
				product.updateProductStoreValues();
				product.changeBarcode('');
				product.getBarcodeSelector()?.setConfig('ENABLE_SEARCH', true).layout();
				product.executeExternalActions();
			}
			if (this.getProductCount() === 1) {
				this.setSettingValue('taxIncluded', null);
				this.setSettingValue('taxIncludedFormatted', null);
			}
		}
		compileProductData() {
			if (!this.isExistForm()) {
				return;
			}
			this.initFormFields();
			const field = this.getDataField();
			const settingsField = this.getDataSettingsField();
			this.cleanProductRows();
			if (main_core.Type.isElementNode(field) && main_core.Type.isElementNode(settingsField)) {
				field.value = this.prepareProductDataValue();
			}
		}
		prepareProductDataValue() {
			let productDataValue = '';
			if (this.getProductCount()) {
				const productData = [];
				this.products.forEach(item => {
					const itemFields = item.getFields(Editor.#getAjaxFields());
					if (!/^[0-9]+$/.test(itemFields['ID'])) {
						itemFields['ID'] = 0;
					}
					itemFields['CUSTOMIZED'] = 'Y';
					productData.push(itemFields);
				});
				productDataValue = JSON.stringify(productData);
			}
			return productDataValue;
		}
		static #getAjaxFields() {
			return ['ID', 'SKU_ID', 'AMOUNT', 'PURCHASING_PRICE', 'BASE_PRICE', 'BASE_PRICE_EXTRA', 'BASE_PRICE_EXTRA_RATE', 'COMMENT', 'DOC_BARCODE', 'BARCODE', 'STORE_TO', 'STORE_FROM', 'BASE_PRICE_ID', 'BASKET_ID', 'DOC_ID', 'ELEMENT_ID', 'IBLOCK_ID', 'MEASURE_CODE', 'MEASURE_NAME', 'NAME', 'OFFERS_IBLOCK_ID', 'PARENT_PRODUCT_ID', 'PRODUCT_ID', 'ROW_ID', 'STORE_FROM_AMOUNT', 'STORE_FROM_AVAILABLE_AMOUNT', 'STORE_FROM_RESERVED', 'STORE_FROM_TITLE', 'STORE_TO_AMOUNT', 'STORE_TO_AVAILABLE_AMOUNT', 'STORE_TO_RESERVED', 'STORE_TO_TITLE', 'TOTAL_PRICE', 'TYPE', 'PRICE', 'TAX_RATE', 'TAX_INCLUDED', 'TAX_SUM'];
		}

		/* actions */
		executeActions(actions) {
			if (!main_core.Type.isArrayFilled(actions)) {
				return;
			}
			for (let item of actions) {
				if (!main_core.Type.isPlainObject(item) || !main_core.Type.isStringFilled(item.type)) {
					continue;
				}
				switch (item.type) {
					case this.actions.productChange:
						this.actionSendProductChange(item);
						break;
					case this.actions.productListChanged:
						this.actionSendProductListChanged();
						break;
					case this.actions.updateTotal:
						this.actionUpdateTotalData();
						break;
				}
			}
		}
		actionSendProductChange(item) {
			if (!main_core.Type.isStringFilled(item.id)) {
				return;
			}
			const product = this.getProductByRowId(item.id);
			if (!product) {
				return;
			}

			// EventEmitter.emit(this, 'ProductList::onChangeFields', {
			// 	rowId: item.id,
			// 	productId: product.getField('PRODUCT_ID'),
			// 	fields: this.getProductByRowId(item.id).getCatalogFields()
			// });

			if (this.controller) {
				this.controller.productChange();
			}
		}
		actionSendProductListChanged(disableSaveButton = false) {
			if (this.controller) {
				this.controller.productChange(disableSaveButton);
			}
		}
		actionUpdateListField(item) {
			if (!main_core.Type.isStringFilled(item.field) || !('value' in item)) {
				return;
			}
			this.updateFieldForList = item.field;
			for (let row of this.products) {
				row.updateFieldByName(item.field, item.value);
			}
			this.updateFieldForList = null;
		}
		actionUpdateTotalData(options = {}) {
			this.updateTotalDataDelayedHandler(options);
		}

		/* actions finish */

		updateTotalDataDelayed(options = {}) {
			let totalCost = 0;
			let totalTax = 0;
			const totalCostField = this.getSettingValue('totalCalculationSumField', 'PURCHASING_PRICE');
			const totalTaxField = this.getSettingValue('totalCalculationSumTaxField', 'TAX_SUM');
			this.products.forEach(item => {
				totalCost += main_core.Text.toNumber(item.getField(totalCostField)) * main_core.Text.toNumber(item.getField('AMOUNT'));
				totalTax += main_core.Text.toNumber(item.getField(totalTaxField));
			});
			const totalBeforeTax = totalCost - totalTax;
			this.setTotalData({
				totalCost,
				totalBeforeTax,
				totalTax
			});
		}
		getProductsFields(fields = []) {
			const productFields = [];
			for (let item of this.products) {
				productFields.push(item.getFields(fields));
			}
			return productFields;
		}
		setTotalData(data) {
			const item = BX(this.getSettingValue('totalBlockContainerId', null));
			if (main_core.Type.isElementNode(item)) {
				const currencyId = this.getCurrencyId();
				const list = ['totalCost', 'totalBeforeTax', 'totalTax'];
				for (const id of list) {
					const row = item.querySelector('[data-total="' + id + '"]');
					if (main_core.Type.isElementNode(row) && id in data) {
						row.innerHTML = currency_currencyCore.CurrencyCore.currencyFormat(data[id], currencyId, false);
					}
				}
			}
			this.controller?.setTotal(data);
		}

		/* action tools finish */

		/* ajax tools */
		// ajaxRequest(action, data)
		// {
		// 	if (!Type.isPlainObject(data.options))
		// 	{
		// 		data.options = {};
		// 	}
		// 	data.options.ACTION = action;
		// 	ajax.runComponentAction(
		// 		this.getComponentName(),
		// 		action,
		// 		{
		// 			mode: 'class',
		// 			signedParameters: this.getSignedParameters(),
		// 			data: data
		// 		}
		// 	).then(
		// 		(response) => this.ajaxResultSuccess(response, data.options),
		// 		(response) => this.ajaxResultFailure(response)
		// 	);
		// }
		//
		// ajaxResultSuccess(response, requestOptions)
		// {
		// 	if (!this.ajaxResultCommonCheck(response))
		// 	{
		// 		return;
		// 	}
		//
		// 	switch (response.data.action)
		// 	{
		// 		case 'calculateTotalData':
		// 			// if (Type.isPlainObject(response.data.result))
		// 			// {
		// 			// 	this.setTotalData(response.data.result, requestOptions);
		// 			// }
		//
		// 			break;
		// 		case 'calculateProductPrices':
		// 			if (Type.isPlainObject(response.data.result))
		// 			{
		// 				this.onCalculatePricesResponse(response.data.result);
		// 			}
		//
		// 			break;
		// 	}
		// }

		// ajaxResultFailure(response)
		// {
		//
		// }

		ajaxResultCommonCheck(responce) {
			if (!main_core.Type.isPlainObject(responce)) {
				return false;
			}
			if (!main_core.Type.isStringFilled(responce.status)) {
				return false;
			}
			if (responce.status !== 'success') {
				return false;
			}
			if (!main_core.Type.isPlainObject(responce.data)) {
				return false;
			}
			if (!main_core.Type.isStringFilled(responce.data.action)) {
				return false;
			}

			// noinspection RedundantIfStatementJS
			if (!('result' in responce.data)) {
				return false;
			}
			return true;
		}
		deleteRow(row) {
			const gridRow = this.getGrid().getRows().getById(row.getField('ID'));
			if (gridRow) {
				main_core.Dom.remove(gridRow.getNode());
				this.getGrid().getRows().reset();
			}
			const index = this.products.indexOf(row);
			if (index > -1) {
				this.products.splice(index, 1);
				this.refreshSortFields();
				this.numerateRows();
			}
			main_core_events.EventEmitter.emit('Grid::thereEditedRows', []);
			this.addFirstRowIfEmpty();
			this.executeActions([{
				type: this.actions.productListChanged
			}, {
				type: this.actions.updateTotal
			}]);
		}
		copyRow(row) {
			this.addProductRow(row);
			this.refreshSortFields();
			this.numerateRows();
			main_core_events.EventEmitter.emit('Grid::thereEditedRows', []);
			this.executeActions([{
				type: this.actions.productListChanged
			}, {
				type: this.actions.updateTotal
			}]);
		}
		cleanProductRows() {
			this.products.filter(item => item.isEmptyRow()).forEach(row => this.deleteRow(row));
		}
		resortProductsByIds(ids) {
			let changed = false;
			if (main_core.Type.isArrayFilled(ids)) {
				this.products.sort((a, b) => {
					if (ids.indexOf(a.getField('ID')) > ids.indexOf(b.getField('ID'))) {
						return 1;
					}
					changed = true;
					return -1;
				});
			}
			return changed;
		}
		refreshSortFields() {
			this.products.forEach((item, index) => item.setField('SORT', (index + 1) * 10, false));
		}
		handleOnTabShow() {
			main_core_events.EventEmitter.emit('onDemandRecalculateWrapper', [this]);
		}
		closeBarcodeSpotlights() {
			this.products.forEach(product => {
				product.getBarcodeSelector()?.removeSpotlight();
			});
			this.setSettingValue('showBarcodeSpotlightInfo', false);
		}
		closeBarcodeQrAuths() {
			this.products.forEach(product => {
				product.getBarcodeSelector()?.removeQrAuth();
			});
			this.setSettingValue('showBarcodeQrAuth', false);
		}
		enableSendBarcodeMobilePush() {
			this.products.forEach(product => {
				product.getBarcodeSelector()?.setConfig('IS_INSTALLED_MOBILE_APP', true);
			});
			this.setSettingValue('isInstalledMobileApp', true);
		}
		validate() {
			if (this.getProductCount() === 0) {
				return [main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_IS_EMPTY')];
			}
			let errorsArray = [];
			this.products.forEach(product => {
				errorsArray = errorsArray.concat(product.validate());
			});
			return errorsArray;
		}
		showFieldTourHint(fieldName, tourData, endTourHandler, addictedFields = [], rowId = '') {
			if (this.products.length > 0) {
				let productNode = this.products[0].getNode();
				if (this.getProductByRowId(rowId)) {
					productNode = this.getProductByRowId(rowId).getNode();
				}
				const addictedNodes = [];
				for (const fieldName of addictedFields) {
					const fieldNode = productNode.querySelector(`[data-name="${fieldName}"]`);
					if (fieldNode !== null) {
						addictedNodes.push(fieldNode);
					}
				}
				const fieldNode = productNode.querySelector(`[data-name="${fieldName}"]`);
				if (fieldNode !== null) {
					this.#fieldHintManager.processFieldTour(fieldNode, tourData, endTourHandler, addictedNodes);
				}
			}
		}
		getActiveHint() {
			return this.#fieldHintManager.getActiveHint();
		}
		getRestrictedProductTypes() {
			return this.getSettingValue('restrictedProductTypes', []);
		}
		processApplyActionButtonClick(actionId) {
			if (actionId === 'STORE_FROM_INFO' || actionId === 'STORE_TO_INFO') {
				this.#processSetStoryAction(actionId);
			}
		}
		#processSetStoryAction(actionId) {
			const actionPanel = this.getGrid()?.getActionsPanel();
			const actionValues = actionPanel?.getValues();
			const actionStoreId = actionValues[actionId];
			if (!actionValues || main_core.Type.isUndefined(actionStoreId)) {
				return;
			}
			const selectedRows = this.getGrid().getRows().getSelected();
			if (selectedRows.length === 0) {
				return;
			}
			const stores = this.getSettingValue('stores', {});
			const actionStore = stores[actionStoreId];
			if (!main_core.Type.isNil(actionStore)) {
				const actionStoreName = actionStore?.TITLE || '';
				selectedRows.forEach(row => {
					const selectedItem = this.products.find(product => product.getField('ID') === row.getId());
					if (selectedItem) {
						const storeSelector = catalog_storeSelector.StoreSelector.getById(selectedItem.getId() + '_' + actionId);
						if (storeSelector) {
							storeSelector.onStoreSelect(actionStoreId, actionStoreName);
						}
					}
				});
				const documentTypeMoving = 'M';
				const messageId = this.settings.documentType !== documentTypeMoving ? 'CATALOG_DOCUMENT_PRODUCT_LIST_ACTION_STORE_CHANGED_HINT' : 'CATALOG_DOCUMENT_PRODUCT_LIST_ACTION_' + actionId + '_CHANGED_HINT';
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage(messageId, {
						'#STORE_NAME#': main_core.Text.encode(actionStoreName)
					}),
					autoHide: true,
					autoHideDelay: 4000
				});
			}
			const dropdown = actionPanel.getDropdowns().find(dropdown => dropdown.id === 'actionListId_control');
			if (dropdown) {
				actionPanel.removeItemsRelativeCurrent(dropdown.parentNode);
				main_core.Dom.attr(dropdown, 'data-value', null);
				const innerWrapper = dropdown.querySelector('.main-dropdown-inner');
				if (innerWrapper) {
					innerWrapper.innerText = main_core.Loc.getMessage('CATALOG_DOCUMENT_PRODUCT_LIST_ACTION_DEFAULT');
				}
			}
		}
	}

	exports.Editor = Editor;
	exports.PageEventsManager = PageEventsManager;

})(this.BX.Catalog.Store.ProductList = this.BX.Catalog.Store.ProductList || {}, BX.Catalog, BX, BX.Event, BX.Currency, BX.UI, BX.Main, BX.Catalog, BX.Catalog, BX.Catalog, BX.Catalog.DocumentCard, BX.UI.Tour, BX, BX);
//# sourceMappingURL=script.js.map
