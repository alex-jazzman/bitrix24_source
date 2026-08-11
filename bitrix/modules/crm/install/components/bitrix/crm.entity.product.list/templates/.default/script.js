/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Entity = this.BX.Crm.Entity || {};
(function (exports, ui_designTokens, main_core, main_core_events, catalog_productCalculator, ui_hint, ui_notification, catalog_productModel, catalog_storeSelector, catalog_storeEnableWizard, main_popup, catalog_productSelector, currency_currencyCore, ui_tour, spotlight, catalog_toolAvailabilityManager, pull_client) {
	'use strict';

	class ReserveControl {
		static INPUT_NAME = 'INPUT_RESERVE_QUANTITY';
		static VIEW_NAME = 'VIEW_RESERVE_QUANTITY';
		static DATE_NAME = 'DATE_RESERVE_END';
		static QUANTITY_NAME = 'QUANTITY';
		static DEDUCTED_QUANTITY_NAME = 'DEDUCTED_QUANTITY';
		row;
		cache = new main_core.Cache.MemoryCache();
		isReserveEqualProductQuantity = true;
		wrapper = null;
		measureName;
		inputFieldName;
		viewName;
		dateFieldName;
		quantityFieldName;
		deductedQuantityFieldName;
		defaultDateReservation;
		isBlocked;
		isInventoryManagementToolEnabled;
		inventoryManagementMode;
		constructor(options) {
			this.row = options.row;
			this.inputFieldName = options.inputName || ReserveControl.INPUT_NAME;
			this.viewName = ReserveControl.VIEW_NAME;
			this.dateFieldName = options.dateFieldName || ReserveControl.DATE_NAME;
			this.quantityFieldName = options.quantityFieldName || ReserveControl.QUANTITY_NAME;
			this.deductedQuantityFieldName = options.deductedQuantityFieldName || ReserveControl.DEDUCTED_QUANTITY_NAME;
			this.defaultDateReservation = options.defaultDateReservation || null;
			this.isBlocked = options.isBlocked || false;
			this.isInventoryManagementToolEnabled = options.isInventoryManagementToolEnabled || false;
			this.inventoryManagementMode = options.inventoryManagementMode || '';
			this.measureName = options.measureName;
			this.isReserveEqualProductQuantity = !!options.isReserveEqualProductQuantity && (this.getReservedQuantity() === this.getQuantity() || this.row.isNewRow());
		}
		renderTo(node) {
			this.wrapper = node;
			main_core.Dom.append(main_core.Tag.render`<div>${this.getReserveInputNode()}</div>`, this.wrapper);
			main_core.Event.bind(this.getReserveInputNode().querySelector('input'), 'input', main_core.Runtime.debounce(this.onReserveInputChange, 800, this));
			if (!this.isInventoryManagementMode1C()) {
				if (this.getReservedQuantity() > 0 || this.isReserveEqualProductQuantity) {
					this.layoutDateReservation(this.getDateReservation());
				}
				main_core.Dom.append(this.getDateNode(), this.wrapper);
				main_core.Event.bind(this.getDateNode(), 'click', ReserveControl.onDateInputClick.bind(this));
				main_core.Event.bind(this.getDateNode().querySelector('input'), 'change', this.onDateChange.bind(this));
			}
		}
		setReservedQuantity(value, isTriggerEvent) {
			const input = this.getReserveInputNode().querySelector('input');
			if (input) {
				input.value = String(value);
				if (isTriggerEvent) {
					input.dispatchEvent(new window.Event('input'));
				}
			}
		}
		getReservedQuantity() {
			return main_core.Text.toNumber(this.row.getField(this.inputFieldName));
		}
		getDateReservation() {
			return this.row.getField(this.dateFieldName) || '';
		}
		getQuantity() {
			return main_core.Text.toNumber(this.row.getField(this.quantityFieldName));
		}
		getDeductedQuantity() {
			return main_core.Text.toNumber(this.row.getField(this.deductedQuantityFieldName));
		}
		getAvailableQuantity() {
			return this.getQuantity() - this.getDeductedQuantity();
		}
		onReserveInputChange(event) {
			const value = main_core.Text.toNumber(event.target.value);
			this.changeInputValue(value);
		}
		changeInputValue(rawValue) {
			let value = rawValue;
			if (value > this.getAvailableQuantity()) {
				this.showNotify('reserveCountError', 'CRM_ENTITY_PL_IS_LESS_QUANTITY_WITH_DEDUCTED_THEN_RESERVED');
				value = this.getAvailableQuantity();
				this.setReservedQuantity(value);
			} else if (value < 0) {
				this.showNotify('reserveNegativeCountError', 'CRM_ENTITY_PL_IS_NEGATIVE_INPUT_RESERVE');
				value = 0;
				this.setReservedQuantity(value);
			}
			if (value > 0) {
				const dateReservation = this.getDateReservation();
				if (dateReservation === '') {
					this.changeDateReservation(this.defaultDateReservation ?? '');
				} else {
					this.layoutDateReservation(dateReservation);
				}
			} else if (value <= 0) {
				this.changeDateReservation();
			}
			this.setReservedQuantity(value, false);
			this.row.updateField(this.inputFieldName, value);
		}
		clearCache() {
			this.cache.delete('dateInput');
			this.cache.delete('reserveInput');
		}
		isInputDisabled() {
			if (this.isBlocked || !this.isInventoryManagementToolEnabled) {
				return true;
			}
			const model = this.row.getModel();
			if (model) {
				return model.isSimple() || model.isService();
			}
			return false;
		}
		static onDateInputClick(event) {
			const target = event.target;
			BX.calendar({
				node: target,
				field: target.parentNode.querySelector('input'),
				bTime: false
			});
		}
		onDateChange(event) {
			const value = event.target.value;
			const newDate = BX.parseDate(value);
			const current = new Date();
			current.setHours(0, 0, 0, 0);
			if (newDate >= current) {
				this.changeDateReservation(value);
			} else {
				this.showNotify('reserveDateError', 'CRM_ENTITY_PL_DATE_IN_PAST');
				this.changeDateReservation(this.defaultDateReservation ?? '');
			}
		}
		getDateNode() {
			return this.cache.remember('dateInput', () => {
				return main_core.Tag.render`
				<div>
					<a class="crm-entity-product-list-reserve-date"></a>
					<input
						data-name="${this.dateFieldName}"
						name="${this.dateFieldName}"
						type="hidden"
						value="${this.getDateReservation()}"
					>
				</div>
			`;
			});
		}
		getReserveInputNode() {
			return this.cache.remember('reserveInput', () => {
				const viewReserveNode = this.isInventoryManagementMode1C() ? main_core.Tag.render`
						<span>
							<span data-name="${this.viewName}">
								${this.getReservedQuantity()}
							</span>
							&nbsp;
							${main_core.Text.encode(this.row.getMeasureName())}
						</span>
					` : null;
				const tag = main_core.Tag.render`
				<div ${this.isInputDisabled() ? 'class="crm-entity-product-list-locked-field-wrapper"' : ''}>
					${viewReserveNode}
					<input type="${this.isInventoryManagementMode1C() ? 'hidden' : 'text'}"
						data-name="${this.inputFieldName}"
						name="${this.inputFieldName}"
						class="ui-ctl-element ui-ctl-textbox ${this.isInputDisabled() ? 'crm-entity-product-list-locked-field' : ''}"
						autoComplete="off"
						value="${this.getReservedQuantity()}"
						placeholder="0"
						title="${this.getReservedQuantity()}"
						${this.isInputDisabled() ? 'disabled' : ''}
					/>
				</div>
			`;
				if (this.isBlocked || !this.isInventoryManagementToolEnabled) {
					tag.onclick = () => main_core_events.EventEmitter.emit(this, 'onNodeClick');
				}
				return tag;
			});
		}
		changeDateReservation(date = '') {
			if (date !== this.getDateReservation()) {
				this.row.updateField(this.dateFieldName, date);
			}
			this.layoutDateReservation(date);
		}
		layoutDateReservation(date = '') {
			const linkText = date === '' ? '' : main_core.Loc.getMessage('CRM_ENTITY_PL_RESERVED_DATE', {
				'#FINAL_RESERVATION_DATE#': date
			}) ?? '';
			const link = this.getDateNode().querySelector('a');
			if (link) {
				link.innerText = linkText;
			}
			const hiddenInput = this.getDateNode().querySelector('input');
			if (hiddenInput) {
				hiddenInput.value = date;
			}
		}
		disable(wrapper) {
			const node = wrapper || this.wrapper;
			if (node) {
				node.innerHTML = this.getReservedQuantity() + ' ' + main_core.Text.encode(this.measureName ?? '');
			}
		}
		isInventoryManagementMode1C() {
			return this.inventoryManagementMode === catalog_storeEnableWizard.ModeList.MODE_1C;
		}
		showNotify(notifyId, messageId) {
			let notify = BX.UI.Notification.Center.getBalloonById(notifyId);
			if (!notify) {
				const notificationOptions = {
					id: notifyId,
					closeButton: true,
					autoHideDelay: 3000,
					content: main_core.Tag.render`<div>${main_core.Loc.getMessage(messageId)}</div>`
				};
				notify = BX.UI.Notification.Center.notify(notificationOptions);
			}
			notify.show();
		}
	}

	class StoreAvailablePopup {
		rowId;
		model;
		inventoryManagementMode;
		node;
		popup = null;
		constructor(options) {
			this.rowId = options.rowId;
			this.model = options.model;
			this.inventoryManagementMode = options.inventoryManagementMode;
			this.setNode(options.node);
		}
		setNode(node) {
			this.node = node;
			main_core.Dom.addClass(this.node, 'store-available-popup-link');
			main_core.Event.bind(this.node, 'click', this.togglePopup.bind(this));
		}
		createPopup() {
			const popupId = `store-available-popup-row-${this.rowId}`;
			const popup = main_popup.PopupManager.getPopupById(popupId);
			if (popup) {
				this.popup = popup;
				this.popup.setBindElement(this.node);
				this.popup.setContent(this.getPopupContent());
			} else {
				this.popup = main_popup.PopupManager.create({
					id: popupId,
					bindElement: this.node,
					autoHide: true,
					draggable: false,
					angle: {
						position: 'top',
						offset: 250
					},
					noAllPaddings: true,
					bindOptions: {
						forceBindPosition: true
					},
					closeByEsc: true,
					content: this.getPopupContent()
				});
				this.popup.setOffset({
					offsetLeft: -218,
					offsetTop: 0
				});
			}
		}
		getPopupContent() {
			const storeId = this.model.getField('STORE_ID');
			const storeCollection = this.model.getStoreCollection();
			const storeQuantity = storeCollection.getStoreAmount(storeId);
			const reservedQuantity = storeCollection.getStoreReserved(storeId);
			const availableQuantity = storeCollection.getStoreAvailableAmount(storeId);
			const renderHead = value => {
				return `<td class="main-grid-cell-head main-grid-col-no-sortable main-grid-cell-right">
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-head-container">${value}</span>
				</div>
			</td>`;
			};
			const renderRow = value => {
				return `<td class="main-grid-cell main-grid-cell-right">
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">${value}</span>
				</div>
			</td>`;
			};
			const isReservedQuantityLink = reservedQuantity > 0 && this.inventoryManagementMode !== catalog_storeEnableWizard.ModeList.MODE_1C;
			const reservedQuantityContent = isReservedQuantityLink ? `<a href="#" class="store-available-popup-reserves-slider-link">${reservedQuantity}</a>` : reservedQuantity;
			const viewAvailableQuantity = availableQuantity <= 0 ? `<span class="text--danger">${availableQuantity}` : availableQuantity;
			const result = main_core.Tag.render`
			<div class="store-available-popup-container">
				<table class="main-grid-table">
					<thead class="main-grid-header">
						<tr class="main-grid-row-head">
							${renderHead(main_core.Loc.getMessage('CRM_ENTITY_PL_STORE_AVAILABLE_POPUP_QUANTITY_COMMON_MSGVER_1'))}
							${renderHead(main_core.Loc.getMessage('CRM_ENTITY_PL_STORE_AVAILABLE_POPUP_QUANTITY_RESERVED'))}
							${renderHead(main_core.Loc.getMessage('CRM_ENTITY_PL_STORE_AVAILABLE_POPUP_QUANTITY_AVAILABLE'))}
						</tr>
					</thead>
					<tbody>
						<tr class="main-grid-row main-grid-row-body">
							${renderRow(storeQuantity)}
							${renderRow(reservedQuantityContent)}
							${renderRow(viewAvailableQuantity)}
						</tr>
					</tbody>
				</table>
			</div>
		`;
			if (isReservedQuantityLink) {
				main_core.Event.bind(result.querySelector('.store-available-popup-reserves-slider-link'), 'click', e => {
					e.preventDefault();
					this.openDealsWithReservedProductSlider();
				});
			}
			return result;
		}
		openDealsWithReservedProductSlider() {
			const reservedDealsSliderLink = '/bitrix/components/bitrix/catalog.productcard.reserved.deal.list/slider.php';
			const storeId = this.model.getField('STORE_ID');
			const productId = this.model.getField('PRODUCT_ID');
			const sliderLink = new main_core.Uri(reservedDealsSliderLink);
			sliderLink.setQueryParam('productId', productId);
			sliderLink.setQueryParam('storeId', storeId);
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				allowChangeHistory: false,
				cacheable: false
			});
		}
		togglePopup() {
			if (this.popup) {
				if (this.popup.isShown()) {
					this.popup.close();
				} else {
					this.popup.setContent(this.getPopupContent());
					this.popup.show();
				}
			} else {
				this.createPopup();
				this.popup.show();
			}
		}
	}

	class MoneyControl {
		node;
		hint;
		constructor(options) {
			this.node = options.node;
			this.hint = options.hint ?? null;
		}
		enable() {
			this.node.removeAttribute('disabled');
			this.node.removeAttribute('data-hint-no-icon');
			this.node.removeAttribute('data-hint');
			this.node.classList.remove('ui-ctl-element');
			const currencyBlock = this.node.querySelector('.main-grid-editor-money-currency');
			if (currencyBlock) {
				currencyBlock.classList.add('main-dropdown');
				currencyBlock.dataset.disabled = 'false';
			}
			this.node.querySelector('.main-grid-editor-money-price')?.removeAttribute('disabled');
		}
		disable() {
			this.node.setAttribute('disabled', '');
			this.node.classList.add('ui-ctl-element');
			this.node.querySelector('.main-grid-editor-money-price')?.setAttribute('disabled', '');
			const currencyBlock = this.node.querySelector('.main-grid-editor-money-currency');
			if (currencyBlock) {
				currencyBlock.classList.remove('main-dropdown');
				currencyBlock.dataset.disabled = 'true';
			}
			if (this.hint) {
				this.node.setAttribute('data-hint-no-icon', '');
				this.node.setAttribute('data-hint', this.hint);
				BX.UI.Hint.init(this.node.parentNode);
			}
		}
	}

	class SettingsHolder {
		settings = {};
		getSettings() {
			return this.settings;
		}
		setSettings(settings) {
			this.settings = main_core.Type.isPlainObject(settings) ? settings : {};
		}
		getSettingValue(name, defaultValue) {
			return this.settings.hasOwnProperty(name) ? this.settings[name] : defaultValue;
		}
		setSettingValue(name, value) {
			this.settings[name] = value;
		}
	}

	class RowExternalActions {
		row;
		pending = [];
		onAfterExecute = null;
		constructor(row) {
			this.row = row;
		}
		reset() {
			this.pending.length = 0;
		}
		addProductChange() {
			this.pending.push({
				type: this.row.getEditor().actions.productChange,
				id: this.row.getId()
			});
		}
		addUpdateFieldList(field, value) {
			this.pending.push({
				type: this.row.getEditor().actions.updateListField,
				field,
				value
			});
		}
		addUpdateTotal() {
			this.pending.push({
				type: this.row.getEditor().actions.updateTotal
			});
		}
		execute() {
			if (this.pending.length === 0) {
				return;
			}
			this.row.getEditor().executeActions(this.pending);
			this.reset();
			if (this.onAfterExecute) {
				const callback = this.onAfterExecute;
				this.onAfterExecute = null;
				callback.call(undefined);
			}
		}
	}

	const CURRENCY_DROPDOWN_FIELDS = ['PRICE_CURRENCY', 'SUM_CURRENCY', 'DISCOUNT_TYPE_ID', 'DISCOUNT_ROW_CURRENCY'];
	class RowFieldUiBinder {
		row;
		constructor(row) {
			this.row = row;
		}
		getInputByFieldName(fieldName) {
			const fieldId = this.row.getUiFieldId(fieldName);
			let item = document.getElementById(fieldId);
			if (!main_core.Type.isElementNode(item)) {
				item = this.row.getNode().querySelector('[name="' + fieldId + '"]');
			}
			return item;
		}
		updateInput(name, value) {
			const item = this.getInputByFieldName(name);
			if (main_core.Type.isElementNode(item)) {
				item.value = value;
			}
		}
		updateCheckbox(name, value) {
			const item = this.getInputByFieldName(name);
			if (main_core.Type.isElementNode(item)) {
				item.checked = value === 'Y';
			}
		}
		updateDiscountType(name, value) {
			const text = value === catalog_productCalculator.DiscountType.MONETARY ? this.row.getEditor().currencyManager.getText() : '%';
			this.updateMoney(name, value, text);
		}
		getDropdownApi(name) {
			if (!main_core.Reflection.getClass('BX.Main.dropdownManager')) {
				return null;
			}
			return BX.Main.dropdownManager.getById(this.row.getId() + '_' + name + '_control');
		}
		updateMoneyWithDropdownApi(dropdown, value) {
			if (dropdown.getValue() === value) {
				return;
			}
			const item = dropdown.menu.itemsContainer.querySelector('[data-value="' + value + '"]');
			const menuItem = item && dropdown.getMenuItem(item);
			if (menuItem) {
				dropdown.refresh(menuItem);
				dropdown.selectItem(menuItem);
			}
		}
		updateMoneyManually(name, value, text) {
			const item = this.getInputByFieldName(name);
			if (!main_core.Type.isElementNode(item)) {
				return;
			}
			item.dataset.value = String(value);
			const span = item.querySelector('span.main-dropdown-inner');
			if (!main_core.Type.isElementNode(span)) {
				return;
			}
			span.innerHTML = text;
		}
		updateMoney(name, value, text) {
			const dropdownApi = this.getDropdownApi(name);
			if (dropdownApi) {
				this.updateMoneyWithDropdownApi(dropdownApi, value);
			} else {
				this.updateMoneyManually(name, value, text);
			}
		}
		updateMeasure(code, name) {
			this.updateMoney('MEASURE_CODE', code, name);
			this.row.updateUiStoreAmountData();
		}
		updateHtml(name, html) {
			const item = this.row.getNode().querySelector('[data-name="' + name + '"]');
			if (main_core.Type.isElementNode(item)) {
				item.innerHTML = html;
			}
		}
		updateCurrencyFields() {
			const editor = this.row.getEditor();
			const currencyText = editor.currencyManager.getText();
			const currencyId = '' + editor.getCurrencyId();
			CURRENCY_DROPDOWN_FIELDS.forEach(name => {
				const dropdownValues = [];
				if (name === 'DISCOUNT_TYPE_ID') {
					dropdownValues.push({
						NAME: '%',
						VALUE: '' + catalog_productCalculator.DiscountType.PERCENTAGE
					});
					dropdownValues.push({
						NAME: currencyText,
						VALUE: '' + catalog_productCalculator.DiscountType.MONETARY
					});
					if (this.row.getDiscountType() === catalog_productCalculator.DiscountType.MONETARY) {
						this.updateMoneyManually(name, catalog_productCalculator.DiscountType.MONETARY, currencyText);
					}
				} else {
					dropdownValues.push({
						NAME: currencyText,
						VALUE: currencyId
					});
					this.updateMoney(name, currencyId, currencyText);
				}
				main_core.Dom.attr(this.getInputByFieldName(name), 'data-items', dropdownValues);
			});
			this.updateField('TAX_SUM', this.row.getField('TAX_SUM'));
		}
		updateField(field, value) {
			const uiName = this.getUiName(field);
			if (!uiName) {
				return;
			}
			const uiType = this.getUiType(uiName);
			if (!uiType) {
				return;
			}
			if (!this.allowUpdate(field)) {
				return;
			}
			const row = this.row;
			switch (uiType) {
				case 'input':
					if (field === 'QUANTITY') {
						value = row.parseFloat(value, row.getQuantityPrecision());
					} else if (field === 'DISCOUNT_RATE') {
						value = row.parseFloat(value, row.getCommonPrecision());
					} else if (field === 'TAX_RATE') {
						value = main_core.Type.isNil(value) || value === '' ? '' : row.parseFloat(value, row.getCommonPrecision());
					} else if (value === 0) {
						value = '';
					} else if (main_core.Type.isNumber(value)) {
						value = row.parseFloat(value, row.getPricePrecision()).toFixed(row.getPricePrecision());
					}
					this.updateInput(uiName, value);
					break;
				case 'checkbox':
					this.updateCheckbox(uiName, value);
					break;
				case 'discount_type_field':
					this.updateDiscountType(uiName, value);
					break;
				case 'html':
					this.updateHtml(uiName, value);
					break;
				case 'money_html':
					value = currency_currencyCore.CurrencyCore.currencyFormat(value, row.getEditor().getCurrencyId(), true);
					this.updateHtml(uiName, value);
					break;
			}
		}
		getUiName(field) {
			let result = null;
			switch (field) {
				case 'QUANTITY':
				case 'MEASURE_CODE':
				case 'DISCOUNT_ROW':
				case 'DISCOUNT_TYPE_ID':
				case 'TAX_RATE':
				case 'TAX_INCLUDED':
				case 'TAX_SUM':
				case 'SUM':
				case 'PRODUCT_NAME':
				case 'SORT':
					result = field;
					break;
				case 'BASE_PRICE':
					result = 'PRICE';
					break;
				case 'DISCOUNT_RATE':
				case 'DISCOUNT_SUM':
					result = 'DISCOUNT_PRICE';
					break;
			}
			return result;
		}
		getUiType(field) {
			let result = null;
			switch (field) {
				case 'PRICE':
				case 'QUANTITY':
				case 'TAX_RATE':
				case 'DISCOUNT_PRICE':
				case 'DISCOUNT_RATE':
				case 'DISCOUNT_SUM':
				case 'DISCOUNT_ROW':
				case 'SUM':
				case 'PRODUCT_NAME':
				case 'SORT':
					result = 'input';
					break;
				case 'DISCOUNT_TYPE_ID':
					result = 'discount_type_field';
					break;
				case 'TAX_INCLUDED':
					result = 'checkbox';
					break;
				case 'TAX_SUM':
					result = 'money_html';
					break;
			}
			return result;
		}
		allowUpdate(field) {
			let result = true;
			switch (field) {
				case 'PRICE_NETTO':
					result = this.row.isPriceNetto();
					break;
				case 'PRICE_BRUTTO':
					result = !this.row.isPriceNetto();
					break;
				case 'DISCOUNT_RATE':
					result = this.row.isDiscountPercentage();
					break;
				case 'DISCOUNT_SUM':
					result = this.row.isDiscountMonetary();
					break;
			}
			return result;
		}
		refreshLayout(exceptFields = []) {
			const fields = this.row.fields;
			for (const field in fields) {
				if (fields.hasOwnProperty(field) && !exceptFields.includes(field)) {
					this.updateField(field, fields[field]);
				}
			}
		}
	}

	const MODE_EDIT = 'EDIT';
	const MODE_SET = 'SET';
	const enableImageInputCache = new Map();
	class Row extends SettingsHolder {
		static CATALOG_PRICE_CHANGING_DISABLED = 'CATALOG_PRICE_CHANGING_DISABLED';
		id = null;
		editor;
		model;
		mainSelector;
		reserveControl = null;
		storeSelector;
		storeAvailablePopup = null;
		fields = {};
		externalActionsQueue;
		uiBinder;
		handleChangeStoreData = () => {
			let storeId = this.getField('STORE_ID');
			if (!this.isReserveBlocked() && this.isNewRow() && this.storeSelector) {
				const currentAmount = this.getModel().getStoreCollection().getStoreAmount(storeId);
				if (currentAmount <= 0 && this.getModel().isChanged()) {
					const maxStore = this.getModel().getStoreCollection().getMaxFilledStore();
					if (maxStore.AMOUNT > currentAmount) {
						this.storeSelector.onStoreSelect(maxStore.STORE_ID, main_core.Text.decode(maxStore.STORE_TITLE));
					} else if (main_core.Type.isNil(storeId)) {
						storeId = +this.storeSelector.getStoreId();
						if (storeId > 0) {
							this.changeStore(storeId);
						}
					}
				}
			}
			this.setField('STORE_AVAILABLE', this.model.getStoreCollection().getStoreAvailableAmount(storeId));
			this.updateUiStoreAmountData();
		};
		handleProductErrorsChange = main_core.Runtime.debounce(() => {
			this.getEditor().handleProductErrorsChange();
		}, 500, this);
		handleMainSelectorClear = main_core.Runtime.debounce(() => {
			this.updateField('OFFER_ID', 0);
			this.updateField('PRODUCT_NAME', '');
			this.updateUiStoreAmountData();
			this.updateField('DEDUCTED_QUANTITY', 0);
			this.updateField('ROW_RESERVED', 0);
		}, 500, this);
		handleStoreFieldChange = main_core.Runtime.debounce(event => {
			const data = event.getData();
			data.fields.forEach(item => {
				this.updateField(item.NAME, item.VALUE);
			});
			this.initHandlersForSelectors();
		}, 500, this);
		handleStoreFieldClear = main_core.Runtime.debounce(() => {
			this.initHandlersForSelectors();
		}, 500, this);
		cache = new main_core.Cache.MemoryCache();
		get externalActions() {
			return this.externalActionsQueue.pending;
		}
		set externalActions(value) {
			this.externalActionsQueue.pending = value;
		}
		get onAfterExecuteExternalActions() {
			return this.externalActionsQueue.onAfterExecute;
		}
		set onAfterExecuteExternalActions(value) {
			this.externalActionsQueue.onAfterExecute = value;
		}
		constructor(id, fields, settings, editor) {
			super();
			this.externalActionsQueue = new RowExternalActions(this);
			this.uiBinder = new RowFieldUiBinder(this);
			this.setId(id);
			this.setSettings(settings);
			this.setEditor(editor);
			this.setModel(fields, settings);
			this.setFields(fields);
			this.initActions();
			this.initSelector();
			this.initStoreSelector();
			this.initStoreAvailablePopup();
			this.initReservedControl();
			this.modifyBasePriceInput();
			this.modifyQuantityInput();
			this.refreshFieldsLayout();
			this.updateUiStoreAmountData();
			this.initHandlersForSelectors();
			requestAnimationFrame(this.initHandlers.bind(this));
		}
		getNode() {
			return this.cache.remember('node', () => {
				const rowId = this.getField('ID', 0);
				return this.getEditorContainer()?.querySelector('[data-id="' + rowId + '"]') ?? null;
			}) ?? null;
		}
		getSelector() {
			return this.mainSelector;
		}
		isNewRow() {
			return isNaN(+this.getField('ID'));
		}
		getId() {
			return this.id;
		}
		setId(id) {
			this.id = id;
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
				main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
			});
			this.getNode().querySelectorAll('select').forEach(node => {
				main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
				main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
			});
		}
		initHandlersForSelectors() {
			const editor = this.getEditor();
			const selectorNames = ['MAIN_INFO', 'STORE_INFO', 'RESERVE_INFO'];
			selectorNames.forEach(name => {
				this.getNode().querySelectorAll('[data-name="' + name + '"] input[type="text"]').forEach(node => {
					main_core.Event.bind(node, 'input', editor.changeProductFieldHandler);
					main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
					main_core.Event.bind(node, 'mousedown', event => event.stopPropagation());
				});
			});
		}
		unsubscribeCustomEvents() {
			if (this.mainSelector) {
				this.mainSelector.unsubscribeEvents();
				main_core_events.EventEmitter.unsubscribe(this.mainSelector, 'onClear', this.handleMainSelectorClear);
			}
			if (this.storeSelector) {
				this.storeSelector.unsubscribeEvents();
				main_core_events.EventEmitter.unsubscribe(this.storeSelector, 'onChange', this.handleStoreFieldChange);
				main_core_events.EventEmitter.unsubscribe(this.storeSelector, 'onClear', this.handleStoreFieldClear);
			}
			main_core_events.EventEmitter.unsubscribe(this.model, 'onChangeStoreData', this.handleChangeStoreData);
			main_core_events.EventEmitter.unsubscribe(this.model, 'onErrorsChange', this.handleProductErrorsChange);
		}
		initActions() {
			if (this.getEditor().isReadOnly() || this.isRestrictedStoreInfo()) {
				return;
			}
			const actionCellContentContainer = this.getNode().querySelector('.main-grid-cell-action .main-grid-cell-content');
			if (main_core.Type.isElementNode(actionCellContentContainer)) {
				const actionsButton = main_core.Tag.render`
				<a
					href="#"
					class="main-grid-row-action-button"
				></a>
			`;
				main_core.Event.bind(actionsButton, 'click', event => {
					const menuItems = [{
						text: main_core.Loc.getMessage('CRM_ENTITY_PL_COPY'),
						onclick: this.handleCopyAction.bind(this),
						disabled: this.editor.getSettingValue('disabledSelectProductInput')
					}, {
						text: main_core.Loc.getMessage('CRM_ENTITY_PL_DELETE'),
						onclick: this.handleDeleteAction.bind(this),
						disabled: this.getModel().isEmpty() && this.getEditor().productCollection.products.length <= 1
					}];
					main_popup.PopupMenu.show({
						id: this.getId() + '_actions_popup',
						bindElement: actionsButton,
						items: menuItems,
						cacheable: false
					});
					event.preventDefault();
					event.stopPropagation();
				});
				main_core.Dom.append(actionsButton, actionCellContentContainer);
			}
		}
		modifyBasePriceInput() {
			const priceNode = this.getNodeChildByDataName('PRICE');
			if (!priceNode) {
				return;
			}
			const control = new MoneyControl({
				node: priceNode,
				hint: main_core.Loc.getMessage('CRM_ENTITY_PL_PRICE_CHANGING_RESTRICTED')
			});
			if (!this.isEditableCatalogPrice()) {
				control.disable();
			} else {
				control.enable();
			}
		}
		modifyQuantityInput() {
			if (!this.isRestrictedStoreInfo()) {
				return;
			}
			const countField = this.getNodeChildByDataName('QUANTITY');
			if (countField) {
				const control = new MoneyControl({
					node: countField,
					hint: main_core.Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_RESTRICTED_BY_STORE')
				});
				control.disable();
			}
		}
		isEditableCatalogPrice() {
			return this.editor.canEditCatalogPrice() || !this.getModel().isCatalogExisted() || this.getModel().isNew();
		}
		initSelector() {
			const id = 'crm_grid_' + this.getId();
			const enableImageInput = this.editor.getSettingValue('enableSelectProductImageInput', true);
			const existingSelector = catalog_productSelector.ProductSelector.getById(id);
			if (existingSelector) {
				this.mainSelector = existingSelector;
			}
			if (!existingSelector) {
				const selectorOptions = {
					iblockId: this.model.getIblockId(),
					basePriceId: this.model.getBasePriceId(),
					currency: this.model.getCurrency(),
					model: this.model,
					config: {
						ENABLE_SEARCH: true,
						IS_ALLOWED_CREATION_PRODUCT: true,
						ENABLE_IMAGE_INPUT: enableImageInput,
						ROLLBACK_INPUT_AFTER_CANCEL: true,
						ENABLE_INPUT_DETAIL_LINK: true,
						ROW_ID: this.getId(),
						ENABLE_SKU_SELECTION: true,
						ENABLE_EMPTY_PRODUCT_ERROR: false,
						SELECTOR_INPUT_DISABLED: this.editor.getSettingValue('disabledSelectProductInput'),
						URL_BUILDER_CONTEXT: this.editor.getSettingValue('productUrlBuilderContext'),
						RESTRICTED_PRODUCT_TYPES: this.getEditor().getRestrictedProductTypes()
					},
					mode: catalog_productSelector.ProductSelector.MODE_EDIT
				};
				this.mainSelector = new catalog_productSelector.ProductSelector('crm_grid_' + this.getId(), selectorOptions);
			} else {
				this.mainSelector.subscribeEvents();
				if (enableImageInput !== enableImageInputCache.get(id)) {
					this.mainSelector.setConfig('ENABLE_IMAGE_INPUT', enableImageInput);
					if (enableImageInput) {
						this.mainSelector.layoutImage();
					}
				}
			}
			enableImageInputCache.set(id, enableImageInput);
			if (this.isRestrictedStoreInfo()) {
				this.mainSelector.setMode(catalog_productSelector.ProductSelector.MODE_VIEW);
			}
			const mainInfoNode = this.getNodeChildByDataName('MAIN_INFO');
			if (mainInfoNode) {
				const numberSelector = mainInfoNode.querySelector('.main-grid-row-number');
				if (!main_core.Type.isElementNode(numberSelector)) {
					main_core.Dom.append(main_core.Tag.render`<div class="main-grid-row-number"></div>`, mainInfoNode);
				}
				let selectorWrapper = mainInfoNode.querySelector('.main-grid-row-product-selector');
				if (!main_core.Type.isElementNode(selectorWrapper)) {
					selectorWrapper = main_core.Tag.render`<div class="main-grid-row-product-selector"></div>`;
					main_core.Dom.append(selectorWrapper, mainInfoNode);
				}
				this.mainSelector.skuTreeInstance = null;
				if (this.editor.isVisible()) {
					this.mainSelector.renderTo(selectorWrapper);
				} else {
					this.mainSelector.wrapper = selectorWrapper;
				}
			}
			main_core_events.EventEmitter.subscribe(this.mainSelector, 'onClear', this.handleMainSelectorClear);
		}
		initStoreSelector() {
			if (!this.editor.isAllowReservation()) {
				return;
			}
			this.storeSelector = new catalog_storeSelector.StoreSelector(this.getId(), {
				inputFieldId: 'STORE_ID',
				inputFieldTitle: 'STORE_TITLE',
				config: {
					ENABLE_SEARCH: true,
					ENABLE_INPUT_DETAIL_LINK: false,
					ROW_ID: this.getId()
				},
				mode: catalog_storeSelector.StoreSelector.MODE_EDIT,
				model: this.model
			});
			main_core_events.EventEmitter.subscribe(this.storeSelector, 'onChange', this.handleStoreFieldChange);
			main_core_events.EventEmitter.subscribe(this.storeSelector, 'onClear', this.handleStoreFieldClear);
			if (this.isRestrictedStoreInfo() && this.storeSelector.searchInput) {
				this.storeSelector.searchInput.disable(main_core.Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_STORE_RESTRICTED_BY_STORE') ?? '');
			}
			this.layoutStoreSelector();
		}
		layoutStoreSelector() {
			const storeWrapper = this.getNodeChildByDataName('STORE_INFO');
			if (this.storeSelector && storeWrapper) {
				storeWrapper.innerHTML = '';
				if (this.needStoreSelectorInput()) {
					this.storeSelector.renderTo(storeWrapper);
					if (this.isReserveBlocked()) {
						this.applyStoreSelectorTweaks(() => this.editor.openIntegrationLimitSlider());
					} else if (!this.isInventoryManagementToolEnabled()) {
						this.applyStoreSelectorTweaks(() => this.editor.openInventoryManagementToolDisabledSlider());
					}
				}
			}
		}
		initStoreAvailablePopup() {
			const storeAvaiableNode = this.getNodeChildByDataName('STORE_AVAILABLE');
			if (!storeAvaiableNode) {
				return;
			}
			this.storeAvailablePopup = new StoreAvailablePopup({
				rowId: this.id,
				model: this.getModel(),
				node: storeAvaiableNode,
				inventoryManagementMode: this.getInventoryManagementMode()
			});
		}
		applyStoreSelectorTweaks(onWrapperClick) {
			const storeSearchInput = this.storeSelector.searchInput;
			if (!storeSearchInput || !storeSearchInput.getNameInput()) {
				return;
			}
			storeSearchInput.toggleIcon(storeSearchInput.getSearchIcon(), 'none');
			storeSearchInput.getNameInput().disabled = true;
			main_core.Dom.addClass(storeSearchInput.getNameInput(), 'crm-entity-product-list-locked-field');
			const wrapper = this.storeSelector.getWrapper();
			if (wrapper) {
				main_core.Dom.addClass(wrapper, 'crm-entity-product-list-locked-field-wrapper');
				main_core.Event.bind(wrapper, 'click', onWrapperClick);
			}
		}
		initReservedControl() {
			const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.getAllowedStores().length) {
				this.reserveControl = new ReserveControl({
					row: this,
					isReserveEqualProductQuantity: this.isReserveEqualProductQuantity(),
					defaultDateReservation: this.editor.getSettingValue('defaultDateReservation'),
					isInventoryManagementToolEnabled: this.isInventoryManagementToolEnabled(),
					inventoryManagementMode: this.getInventoryManagementMode() ?? '',
					isBlocked: this.isReserveBlocked(),
					measureName: this.getMeasureName()
				});
				main_core_events.EventEmitter.subscribe(this.reserveControl, 'onNodeClick', () => {
					if (this.isReserveBlocked()) {
						this.editor.openIntegrationLimitSlider();
					} else if (!this.isInventoryManagementToolEnabled()) {
						this.editor.openInventoryManagementToolDisabledSlider();
					}
				});
				if (this.isRestrictedStoreInfo()) {
					this.reserveControl.disable();
				}
				this.layoutReserveControl();
			}
			const quantityInput = this.getNode().querySelector('div[data-name="QUANTITY"] input');
			if (quantityInput) {
				main_core.Event.bind(quantityInput, 'change', event => {
					const isReserveEqualProductQuantity = this.isReserveEqualProductQuantity() && this.reserveControl?.isReserveEqualProductQuantity;
					if (isReserveEqualProductQuantity) {
						this.setReserveQuantity(this.getField('QUANTITY'));
						return;
					}
					const value = main_core.Text.toNumber(event.target.value);
					const errorNotifyId = 'quantityReservedCountError';
					let notify = BX.UI.Notification.Center.getBalloonById(errorNotifyId);
					if (value < this.getField('INPUT_RESERVE_QUANTITY')) {
						if (!notify) {
							const notificationOptions = {
								id: errorNotifyId,
								closeButton: true,
								autoHideDelay: 3000,
								content: main_core.Tag.render`<div>${main_core.Loc.getMessage('CRM_ENTITY_PL_IS_LESS_QUANTITY_THEN_RESERVED')}</div>`
							};
							notify = BX.UI.Notification.Center.notify(notificationOptions);
						}
						this.setReserveQuantity(this.getField('QUANTITY'));
						notify.show();
					}
				});
			}
		}
		layoutReserveControl() {
			const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.reserveControl) {
				storeWrapper.innerHTML = '';
				this.reserveControl.clearCache();
				if (this.needReserveControlInput()) {
					if (this.isRestrictedStoreInfo()) {
						storeWrapper.innerHTML = this.reserveControl.getReservedQuantity() + ' ' + main_core.Text.encode(this.getMeasureName());
						return;
					}
					this.reserveControl.renderTo(storeWrapper);
				}
			}
		}
		clearReserveControl() {
			const storeWrapper = this.getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.reserveControl) {
				storeWrapper.innerHTML = '';
				this.reserveControl.clearCache();
			}
		}
		setRowNumber(num) {
			this.getNode().querySelectorAll('.main-grid-row-number').forEach(node => {
				node.textContent = num + '.';
			});
		}
		getFields(fields = []) {
			let result;
			if (!main_core.Type.isArrayFilled(fields)) {
				result = main_core.Runtime.clone(this.fields);
			} else {
				result = {};
				for (const fieldName of fields) {
					result[fieldName] = this.getField(fieldName);
				}
			}
			if ('PRODUCT_NAME' in result) {
				const fixedProductName = this.getField('FIXED_PRODUCT_NAME', '');
				if (main_core.Type.isStringFilled(fixedProductName)) {
					result['PRODUCT_NAME'] = fixedProductName;
				}
			}
			return result;
		}
		getCatalogFields() {
			const fields = this.getFields(['CURRENCY', 'QUANTITY', 'MEASURE_CODE']);
			fields['PRICE'] = this.getBasePrice();
			fields['VAT_INCLUDED'] = this.getTaxIncluded();
			fields['VAT_ID'] = this.getTaxId();
			return fields;
		}
		getCalculateFields() {
			return {
				'PRICE': this.getPrice(),
				'BASE_PRICE': this.getBasePrice(),
				'PRICE_EXCLUSIVE': this.getPriceExclusive(),
				'PRICE_NETTO': this.getPriceNetto(),
				'PRICE_BRUTTO': this.getPriceBrutto(),
				'QUANTITY': this.getQuantity(),
				'DISCOUNT_TYPE_ID': this.getDiscountType(),
				'DISCOUNT_RATE': this.getDiscountRate(),
				'DISCOUNT_SUM': this.getDiscountSum(),
				'DISCOUNT_ROW': this.getDiscountRow(),
				'TAX_INCLUDED': this.getTaxIncluded(),
				'TAX_RATE': this.getTaxRate()
			};
		}
		setFields(fields) {
			for (const name in fields) {
				if (fields.hasOwnProperty(name)) {
					this.setField(name, fields[name]);
					this.getModel().setField(name, fields[name]);
				}
			}
		}
		getField(name, defaultValue) {
			return this.fields.hasOwnProperty(name) ? this.fields[name] : defaultValue;
		}
		setField(name, value, changeModel = true) {
			this.fields[name] = value;
			if (changeModel) {
				this.getModel().setField(name, value);
			}
		}
		getUiFieldId(field) {
			return this.getId() + '_' + field;
		}
		getBasePrice() {
			return this.getField('BASE_PRICE', 0);
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
			return this.getField('QUANTITY', 1);
		}
		getDiscountType() {
			return this.getField('DISCOUNT_TYPE_ID', catalog_productCalculator.DiscountType.UNDEFINED);
		}
		isDiscountUndefined() {
			return this.getDiscountType() === catalog_productCalculator.DiscountType.UNDEFINED;
		}
		isDiscountPercentage() {
			return this.getDiscountType() === catalog_productCalculator.DiscountType.PERCENTAGE;
		}
		isDiscountMonetary() {
			return this.getDiscountType() === catalog_productCalculator.DiscountType.MONETARY;
		}
		isDiscountHandmade() {
			return this.isDiscountPercentage() || this.isDiscountMonetary();
		}
		getDiscountRate() {
			return this.getField('DISCOUNT_RATE', 0);
		}
		getDiscountSum() {
			return this.getField('DISCOUNT_SUM', 0);
		}
		getDiscountRow() {
			return this.getField('DISCOUNT_ROW', 0);
		}
		isEmptyRow() {
			return !main_core.Type.isStringFilled(this.getField('NAME', '').trim()) && this.model.isEmpty() && this.getBasePrice() <= 0;
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
		getTaxSum() {
			return this.isTaxIncluded() ? this.getPrice() * this.getQuantity() * (1 - 1 / (1 + this.getTaxRate() / 100)) : this.getPriceExclusive() * this.getQuantity() * this.getTaxRate() / 100;
		}
		getTaxNode() {
			return this.getNode().querySelector('select[data-field-code="TAX_RATE"]');
		}
		getTaxId() {
			const taxNode = this.getTaxNode();
			if (main_core.Type.isElementNode(taxNode) && taxNode.options[taxNode.selectedIndex]) {
				return main_core.Text.toNumber(taxNode.options[taxNode.selectedIndex].getAttribute('data-tax-id'));
			}
			return 0;
		}
		updateFieldByEvent(fieldCode, event) {
			const target = event.target;
			const value = target.type === 'checkbox' ? target.checked : target.value;
			const mode = event.type === 'input' || event.type === 'change' ? MODE_EDIT : MODE_SET;
			this.updateField(fieldCode, value, mode);
		}
		updateField(fieldCode, value, mode = MODE_SET) {
			this.resetExternalActions();
			this.updateFieldValue(fieldCode, value, mode);
			this.executeExternalActions();
		}
		updateFieldValue(code, value, mode = MODE_SET) {
			switch (code) {
				case 'ID':
				case 'OFFER_ID':
					this.changeProductId(value);
					break;
				case 'QUANTITY':
					this.changeQuantity(value, mode);
					break;
				case 'MEASURE_CODE':
					this.changeMeasureCode(value, mode);
					break;
				case 'DISCOUNT':
				case 'DISCOUNT_PRICE':
					this.changeDiscount(value, mode);
					break;
				case 'DISCOUNT_TYPE_ID':
					this.changeDiscountType(value);
					break;
				case 'DISCOUNT_ROW':
					this.changeRowDiscount(value, mode);
					break;
				case 'VAT_ID':
				case 'TAX_ID':
					this.changeTaxId(value);
					break;
				case 'TAX_RATE':
					this.changeTaxRate(value);
					break;
				case 'VAT_INCLUDED':
				case 'TAX_INCLUDED':
					this.changeTaxIncluded(value);
					break;
				case 'SUM':
					this.changeRowSum(value, mode);
					break;
				case 'NAME':
				case 'PRODUCT_NAME':
				case 'MAIN_INFO':
					this.changeProductName(value);
					break;
				case 'SORT':
					this.changeSort(value, mode);
					break;
				case 'STORE_ID':
					this.changeStore(value);
					break;
				case 'STORE_TITLE':
					this.changeStoreName(value);
					break;
				case 'INPUT_RESERVE_QUANTITY':
					this.changeReserveQuantity(value);
					break;
				case 'DATE_RESERVE_END':
					this.changeDateReserveEnd(value);
					break;
				case 'PRICE':
				case 'BASE_PRICE':
					this.changeBasePrice(value, mode);
					break;
				case 'DEDUCTED_QUANTITY':
					this.setDeductedQuantity(value);
					break;
				case 'ROW_RESERVED':
					this.setRowReserved(value);
					break;
				case 'TYPE':
					this.setType(value);
					break;
				case 'SKU_TREE':
				case 'DETAIL_URL':
				case 'IMAGE_INFO':
				case 'COMMON_STORE_AMOUNT':
					this.setField(code, value);
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
		handleCopyAction(event, menuItem) {
			this.getEditor()?.copyRow(this);
			const menu = menuItem.getMenuWindow();
			if (menu) {
				menu.destroy();
			}
		}
		handleDeleteAction(event, menuItem) {
			this.getEditor()?.deleteRow(this.getField('ID'));
			const menu = menuItem.getMenuWindow();
			if (menu) {
				menu.destroy();
			}
		}
		changeProductId(value) {
			const preparedValue = this.parseInt(value);
			this.setProductId(preparedValue);
		}
		changeQuantity(value, mode = MODE_SET) {
			const preparedValue = this.parseFloat(value, this.getQuantityPrecision());
			this.setQuantity(preparedValue, mode);
		}
		changeMeasureCode(value, mode = MODE_SET) {
			this.getEditor().getMeasures().filter(item => item.CODE === value).forEach(item => this.setMeasure(item, mode));
		}
		changeDiscount(value, mode = MODE_SET) {
			let preparedValue;
			if (this.isDiscountPercentage()) {
				preparedValue = this.parseFloat(value, this.getCommonPrecision());
			} else {
				preparedValue = this.parseFloat(value, this.getCalculationPricePrecision()).toFixed(this.getCalculationPricePrecision());
			}
			this.setDiscount(preparedValue, mode);
		}
		changeDiscountType(value) {
			const preparedValue = this.parseInt(value, catalog_productCalculator.DiscountType.UNDEFINED);
			this.setDiscountType(preparedValue);
		}
		changeRowDiscount(value, mode = MODE_SET) {
			const preparedValue = this.parseFloat(value, this.getCalculationPricePrecision());
			this.setRowDiscount(preparedValue, mode);
		}
		changeTaxId(value) {
			const taxList = this.getEditor().getTaxList();
			if (main_core.Type.isArrayFilled(taxList)) {
				let taxRate = taxList.find(item => parseInt(item.ID) === Number(value));
				if (!taxRate) {
					taxRate = taxList.find(item => main_core.Type.isNil(item.VALUE));
				}
				if (taxRate) {
					this.changeTaxRate(taxRate.VALUE);
				}
			}
		}
		changeTaxRate(value) {
			const preparedValue = main_core.Type.isNil(value) || value === '' ? null : this.parseFloat(value, this.getCommonPrecision());
			this.setTaxRate(preparedValue);
		}
		changeTaxIncluded(value) {
			if (main_core.Type.isBoolean(value)) {
				value = value ? 'Y' : 'N';
			}
			this.setTaxIncluded(value);
		}
		changeRowSum(value, mode = MODE_SET) {
			const preparedValue = this.parseFloat(value, this.getCalculationPricePrecision());
			this.setRowSum(preparedValue, mode);
		}
		changeProductName(value) {
			const preparedValue = value.toString();
			const isChangedValue = this.getField('PRODUCT_NAME') !== preparedValue;
			if (isChangedValue) {
				this.setField('PRODUCT_NAME', preparedValue);
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
		changeStore(value) {
			if (this.isReserveBlocked()) {
				return;
			}
			const preparedValue = main_core.Text.toNumber(value);
			if (this.getField('STORE_ID') === preparedValue) {
				return;
			}
			this.setField('STORE_ID', preparedValue);
			this.setField('STORE_AVAILABLE', this.model.getStoreCollection().getStoreAvailableAmount(value));
			this.updateUiStoreAmountData();
			this.layoutReserveControl();
			this.addActionProductChange();
			this.initHandlersForSelectors();
		}
		updateUiStoreAmountData() {
			const availableWrapper = this.getNodeChildByDataName('STORE_AVAILABLE');
			if (!main_core.Type.isElementNode(availableWrapper)) {
				return;
			}
			const storeId = this.getField('STORE_ID');
			if (!storeId) {
				return;
			}
			const available = this.model.getStoreCollection().getStoreAvailableAmount(storeId);
			const amount = main_core.Text.toNumber(available);
			let amountWithMeasure = '';
			if (!this.getModel().isCatalogExisted() || this.isRestrictedStoreInfo() || this.getModel().isService()) {
				return;
			}
			amountWithMeasure = amount + ' ' + this.getMeasureName();
			availableWrapper.innerHTML = amount > 0 ? amountWithMeasure : `<span class="store-available-popup-link--danger">${amountWithMeasure}</span>`;
		}
		updatePropertyFields() {
			const productProps = this.model.getField('PRODUCT_PROPERTIES');
			for (const property in productProps) {
				const availableWrapper = this.getNodeChildByDataName(property);
				if (availableWrapper) {
					const value = this.model.getField('PRODUCT_PROPERTIES')[property] ?? '';
					availableWrapper.innerHTML = value;
				}
			}
		}
		clearPropertyFields() {
			const propNodes = this.getNodesChild();
			propNodes.forEach(property => {
				property.innerHTML = '';
			});
		}
		setRowReserved(value) {
			this.setField('ROW_RESERVED', value);
			const reserveWrapper = this.getNodeChildByDataName('ROW_RESERVED');
			if (!main_core.Type.isElementNode(reserveWrapper)) {
				return;
			}
			if (!this.getModel().isCatalogExisted() || this.getModel().isService()) {
				reserveWrapper.innerHTML = '';
				return;
			}
			reserveWrapper.innerHTML = main_core.Text.toNumber(this.getField('ROW_RESERVED')) + ' ' + this.getMeasureName();
		}
		setDeductedQuantity(value) {
			this.setField('DEDUCTED_QUANTITY', value);
			const deductedWrapper = this.getNodeChildByDataName('DEDUCTED_QUANTITY');
			if (!main_core.Type.isElementNode(deductedWrapper)) {
				return;
			}
			if (!this.getModel().isCatalogExisted() || this.getModel().isService()) {
				deductedWrapper.innerHTML = '';
				return;
			}
			deductedWrapper.innerHTML = main_core.Text.toNumber(this.getField('DEDUCTED_QUANTITY')) + ' ' + this.getMeasureName();
		}
		changeStoreName(value) {
			const preparedValue = value.toString();
			this.setField('STORE_TITLE', preparedValue);
			this.addActionProductChange();
		}
		changeDateReserveEnd(value) {
			const preparedValue = main_core.Type.isNil(value) ? '' : value.toString();
			this.setField('DATE_RESERVE_END', preparedValue);
			this.addActionProductChange();
		}
		changeReserveQuantity(value) {
			const preparedValue = main_core.Text.toNumber(value);
			const reserveDifference = preparedValue - this.getField('INPUT_RESERVE_QUANTITY');
			if (reserveDifference === 0 || isNaN(reserveDifference)) {
				return;
			}
			const newReserve = this.getField('ROW_RESERVED') + reserveDifference;
			this.setField('ROW_RESERVED', newReserve);
			this.setField('RESERVE_QUANTITY', Math.max(newReserve, 0));
			this.setField('INPUT_RESERVE_QUANTITY', preparedValue);
			this.addActionProductChange();
		}
		resetReserveFields() {
			this.setField('ROW_RESERVED', null);
			this.setField('RESERVE_QUANTITY', null);
			this.setField('INPUT_RESERVE_QUANTITY', null);
		}
		refreshFieldsLayout(exceptFields = []) {
			this.uiBinder.refreshLayout(exceptFields);
		}
		getCalculator() {
			const settings = {
				pricePrecision: this.getCalculationPricePrecision(),
				commonPrecision: this.getCommonPrecision(),
				quantityPrecision: this.getQuantityPrecision()
			};
			return this.getModel().getCalculator().setFields(this.getCalculateFields()).setSettings(settings);
		}
		setModel(fields = {}, settings = {}) {
			const selectorId = settings.selectorId;
			if (selectorId) {
				const model = catalog_productModel.ProductModel.getById(selectorId);
				if (model) {
					this.model = model;
				}
			}
			if (!this.model) {
				this.model = new catalog_productModel.ProductModel({
					id: selectorId,
					currency: this.getEditor().getCurrencyId(),
					iblockId: fields['IBLOCK_ID'],
					basePriceId: fields['BASE_PRICE_ID'],
					isSimpleModel: main_core.Text.toInteger(fields['PRODUCT_ID']) <= 0 && main_core.Type.isStringFilled(fields['NAME']),
					skuTree: main_core.Type.isStringFilled(fields['SKU_TREE']) ? JSON.parse(fields['SKU_TREE']) : null,
					storeMap: fields['STORE_MAP'] ?? {},
					fields
				});
				if (!main_core.Type.isNil(fields['DETAIL_URL'])) {
					this.model.setDetailPath(fields['DETAIL_URL']);
				}
			}
			const imageInfo = main_core.Type.isStringFilled(fields['IMAGE_INFO']) ? JSON.parse(fields['IMAGE_INFO']) : null;
			if (imageInfo !== null && typeof imageInfo === 'object') {
				this.model.getImageCollection().setPreview(imageInfo['preview']);
				this.model.getImageCollection().setEditInput(imageInfo['input']);
				this.model.getImageCollection().setMorePhotoValues(imageInfo['values']);
			}
			if (this.isReserveEqualProductQuantity()) {
				if (!this.getModel().getField('DATE_RESERVE_END')) {
					this.setField('DATE_RESERVE_END', this.editor.getSettingValue('defaultDateReservation'));
				}
			}
			main_core_events.EventEmitter.subscribe(this.model, 'onErrorsChange', this.handleProductErrorsChange);
			main_core_events.EventEmitter.subscribe(this.model, 'onChangeStoreData', this.handleChangeStoreData);
		}
		getModel() {
			return this.model;
		}
		setProductId(value) {
			const isChangedValue = this.getField('PRODUCT_ID') !== value;
			if (isChangedValue) {
				this.getModel().setOption('isSimpleModel', value <= 0 && main_core.Type.isStringFilled(this.getField('NAME')));
				this.setField('PRODUCT_ID', value, false);
				this.setField('OFFER_ID', value, false);
				this.storeSelector?.setProductId(value);
				this.addActionProductChange();
				this.addActionUpdateTotal();
				if (this.reserveControl && this.isReserveEqualProductQuantity() && this.needReserveControlInput()) {
					if (!this.getModel().getField('DATE_RESERVE_END')) {
						this.setField('DATE_RESERVE_END', this.editor.getSettingValue('defaultDateReservation'));
					}
					this.resetReserveFields();
					this.onAfterExecuteExternalActions = () => {
						this.reserveControl.changeInputValue(this.getField('QUANTITY'));
					};
				}
			}
		}
		changeBasePrice(value, mode = MODE_SET) {
			if (mode === MODE_EDIT && !this.isEditableCatalogPrice()) {
				value = this.getField('BASE_PRICE');
				this.updateUiInputField('PRICE', value.toFixed(this.getPricePrecision()));
				return;
			}
			const originalPrice = value;
			value = Math.max(value, 0);
			if (mode === MODE_SET) {
				this.updateUiInputField('PRICE', value.toFixed(this.getPricePrecision()));
			}
			const isChangedValue = this.getBasePrice() !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateBasePrice(value);
				this.setFields(calculatedFields);
				const exceptFieldNames = mode === MODE_EDIT ? ['BASE_PRICE', 'PRICE'] : [];
				this.refreshFieldsLayout(exceptFieldNames);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
			this.togglePriceHintPopup(originalPrice < 0 && originalPrice !== value);
		}
		shouldShowSmallPriceHint() {
			return main_core.Text.toNumber(this.getField('PRICE')) > 0 && main_core.Text.toNumber(this.getField('PRICE')) < 1 && this.isDiscountPercentage() && (main_core.Text.toNumber(this.getField('DISCOUNT_SUM')) > 0 || main_core.Text.toNumber(this.getField('DISCOUNT_RATE')) > 0 || main_core.Text.toNumber(this.getField('DISCOUNT_ROW')) > 0);
		}
		togglePriceHintPopup(showNegative = false) {
			if (this.shouldShowSmallPriceHint()) {
				this.getHintPopup().load(this.getInputByFieldName('PRICE'), main_core.Loc.getMessage('CRM_ENTITY_PL_SMALL_PRICE_NOTICE') ?? '').show();
			} else if (showNegative) {
				this.getHintPopup().load(this.getInputByFieldName('PRICE'), main_core.Loc.getMessage('CRM_ENTITY_PL_NEGATIVE_PRICE_NOTICE') ?? '').show();
			} else {
				this.getHintPopup().close();
			}
		}
		setQuantity(value, mode = MODE_SET) {
			if (mode === MODE_SET) {
				this.updateUiInputField('QUANTITY', value);
			}
			const isChangedValue = this.getField('QUANTITY') !== value;
			if (isChangedValue) {
				const errorNotifyId = 'quantityReservedCountError';
				const notify = BX.UI.Notification.Center.getBalloonById(errorNotifyId);
				if (notify) {
					notify.close();
				}
				const calculatedFields = this.getCalculator().calculateQuantity(value);
				this.setFields(calculatedFields);
				this.refreshFieldsLayout(['QUANTITY']);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		setReserveQuantity(value) {
			const node = this.getNodeChildByDataName('RESERVE_INFO');
			const input = node?.querySelector('input[name="INPUT_RESERVE_QUANTITY"]');
			if (main_core.Type.isElementNode(input)) {
				input.value = value;
				const view = node?.querySelector('span[data-name="VIEW_RESERVE_QUANTITY"]');
				if (view) {
					view.textContent = value;
				}
				this.reserveControl?.changeInputValue(value);
			} else {
				this.changeReserveQuantity(value);
			}
		}
		setMeasure(measure, mode = MODE_SET) {
			this.setField('MEASURE_CODE', measure.CODE);
			this.setField('MEASURE_NAME', measure.SYMBOL);
			this.updateUiMoneyField('MEASURE_CODE', measure.CODE, main_core.Text.encode(measure.SYMBOL));
			if (this.getModel().isNew()) {
				this.getModel().save(['MEASURE_CODE']);
			} else if (mode === MODE_EDIT) {
				this.getModel().showSaveNotifier('measureChanger_' + this.getId(), {
					title: main_core.Loc.getMessage('CATALOG_PRODUCT_MODEL_SAVING_NOTIFICATION_MEASURE_CHANGED_QUERY'),
					events: {
						onSave: () => {
							this.getModel().save(['MEASURE_CODE', 'MEASURE_NAME']);
						}
					}
				});
			}
			this.addActionProductChange();
		}
		setDiscount(value, mode = MODE_SET) {
			if (!this.isDiscountHandmade()) {
				return;
			}
			const fieldName = this.isDiscountPercentage() ? 'DISCOUNT_RATE' : 'DISCOUNT_SUM';
			const isChangedValue = this.getField(fieldName) !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateDiscount(value);
				this.setFields(calculatedFields);
				const exceptFieldNames = mode === MODE_EDIT ? ['DISCOUNT_RATE', 'DISCOUNT_SUM', 'DISCOUNT'] : [];
				this.refreshFieldsLayout(exceptFieldNames);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
			this.togglePriceHintPopup();
		}
		setDiscountType(value) {
			const isChangedValue = value !== catalog_productCalculator.DiscountType.UNDEFINED && this.getField('DISCOUNT_TYPE_ID') !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateDiscountType(value);
				this.setFields(calculatedFields);
				this.refreshFieldsLayout();
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		setRowDiscount(value, mode = MODE_SET) {
			const isChangedValue = this.getField('DISCOUNT_ROW') !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateRowDiscount(value);
				this.setFields(calculatedFields);
				const exceptFieldNames = mode === MODE_EDIT ? ['DISCOUNT_ROW'] : [];
				this.refreshFieldsLayout(exceptFieldNames);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		setTaxRate(value) {
			if (!this.getEditor().isTaxAllowed()) {
				return;
			}
			const isChangedValue = this.getTaxRate() !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateTax(value);
				this.setFields(calculatedFields);
				this.refreshFieldsLayout();
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		setTaxIncluded(value, mode = MODE_SET) {
			if (!this.getEditor().isTaxAllowed()) {
				return;
			}
			if (mode === MODE_SET) {
				this.updateUiCheckboxField('TAX_INCLUDED', value);
			}
			const isChangedValue = this.getTaxIncluded() !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateTaxIncluded(value);
				this.setFields(calculatedFields);
				this.refreshFieldsLayout();
				this.addActionUpdateFieldList('TAX_INCLUDED', value);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		setRowSum(value, mode = MODE_SET) {
			const isChangedValue = this.getField('SUM') !== value;
			if (isChangedValue) {
				const calculatedFields = this.getCalculator().calculateRowSum(value);
				this.setFields(calculatedFields);
				const exceptFieldNames = mode === MODE_EDIT ? ['SUM'] : [];
				this.refreshFieldsLayout(exceptFieldNames);
				this.addActionProductChange();
				this.addActionUpdateTotal();
			}
		}
		getInputByFieldName(fieldName) {
			return this.uiBinder.getInputByFieldName(fieldName);
		}
		updateUiInputField(name, value) {
			this.uiBinder.updateInput(name, value);
		}
		updateUiCheckboxField(name, value) {
			this.uiBinder.updateCheckbox(name, value);
		}
		updateUiMoneyField(name, value, text) {
			this.uiBinder.updateMoney(name, value, text);
		}
		updateUiMeasure(code, name) {
			this.uiBinder.updateMeasure(code, name);
		}
		updateUiHtmlField(name, html) {
			this.uiBinder.updateHtml(name, html);
		}
		updateUiCurrencyFields() {
			this.uiBinder.updateCurrencyFields();
		}
		updateUiField(field, value) {
			this.uiBinder.updateField(field, value);
		}
		parseInt(value, defaultValue = 0) {
			return this.getEditor().parseInt(value, defaultValue);
		}
		parseFloat(value, precision, defaultValue = 0) {
			return this.getEditor().parseFloat(value, precision, defaultValue);
		}
		getPricePrecision() {
			return this.getEditor().getPricePrecision();
		}
		getCalculationPricePrecision() {
			return this.getEditor().getCalculationPricePrecision();
		}
		getQuantityPrecision() {
			return this.getEditor().getQuantityPrecision();
		}
		getCommonPrecision() {
			return this.getEditor().getCommonPrecision();
		}
		resetExternalActions() {
			this.externalActionsQueue.reset();
		}
		addActionProductChange() {
			this.externalActionsQueue.addProductChange();
		}
		addActionUpdateFieldList(field, value) {
			this.externalActionsQueue.addUpdateFieldList(field, value);
		}
		addActionUpdateTotal() {
			this.externalActionsQueue.addUpdateTotal();
		}
		executeExternalActions() {
			this.externalActionsQueue.execute();
		}
		isEmpty() {
			return !main_core.Type.isStringFilled(this.getField('PRODUCT_NAME', '').trim()) && this.getField('PRODUCT_ID', 0) <= 0 && this.getPrice() <= 0;
		}
		isReserveBlocked() {
			return this.getSettingValue('isReserveBlocked', false);
		}
		isInventoryManagementToolEnabled() {
			return this.getSettingValue('isInventoryManagementToolEnabled', true);
		}
		getInventoryManagementMode() {
			return this.getSettingValue('inventoryManagementMode', '');
		}
		isRestrictedStoreInfo() {
			if (!this.editor.isAllowReservation()) {
				return false;
			}
			const storeId = this.getField('STORE_ID')?.toString();
			if (main_core.Type.isNil(storeId) || storeId === '0') {
				return false;
			} else if (this.getModel().isSimple() || this.getModel().isService()) {
				return false;
			}
			return !this.getAllowedStores().includes(storeId);
		}
		getAllowedStores() {
			return this.editor.getSettingValue('allowedStores', []);
		}
		isReserveEqualProductQuantity() {
			return this.editor.getSettingValue('isReserveEqualProductQuantity', false);
		}
		getMeasureName() {
			const measureName = main_core.Type.isStringFilled(this.model.getField('MEASURE_NAME')) ? this.model.getField('MEASURE_NAME') : this.editor.getDefaultMeasure()?.SYMBOL || '';
			return main_core.Text.encode(measureName);
		}
		getNodeChildByDataName(name) {
			return this.getNode().querySelector(`[data-name="${name}"]`);
		}
		getNodesChild() {
			return this.getNode().querySelectorAll(`span[data-name]`);
		}
		setType(value) {
			this.setField('TYPE', value);
			if (this.getModel().isService()) {
				this.clearReserveControl();
			}
		}
		needReserveControlInput() {
			return !this.getModel().isSimple() && !this.getModel().isService();
		}
		needStoreSelectorInput() {
			return !this.getModel().isSimple() && !this.getModel().isService();
		}
	}

	class PageEventsManager {
		settings;
		eventHandlers = {};
		constructor(settings) {
			this.settings = settings ?? {};
		}
		registerEventHandler(eventName, eventHandler) {
			if (!this.eventHandlers[eventName]) {
				this.eventHandlers[eventName] = [];
			}
			this.eventHandlers[eventName].push(eventHandler);
			BX.addCustomEvent(this, eventName, eventHandler);
		}
		fireEvent(eventName, eventParams) {
			BX.onCustomEvent(this, eventName, eventParams);
		}
		unregisterEventHandlers(eventName) {
			if (this.eventHandlers[eventName]) {
				for (const handler of this.eventHandlers[eventName]) {
					BX.removeCustomEvent(this, eventName, handler);
				}
				delete this.eventHandlers[eventName];
			}
		}
	}

	class SettingsPopup {
		target;
		settings;
		editor;
		cache = new main_core.Cache.MemoryCache();
		constructor(target, settings = [], editor) {
			this.target = target;
			this.settings = settings;
			this.editor = editor;
		}
		show() {
			this.getPopup().show();
		}
		getPopup() {
			return this.cache.remember('settings-popup', () => {
				return new main_popup.Popup({
					id: this.editor.getId() + '_' + Math.random() * 100,
					bindElement: this.target,
					autoHide: true,
					draggable: false,
					angle: {
						position: 'top',
						offset: 43
					},
					noAllPaddings: true,
					bindOptions: {
						forceBindPosition: true
					},
					closeByEsc: true,
					content: this.prepareSettingsContent()
				});
			});
		}
		getSetting(id) {
			return this.settings.filter(item => {
				return item.id === id;
			})[0];
		}
		prepareSettingsContent() {
			const content = main_core.Tag.render`
			<div class='ui-entity-editor-popup-create-field-list'></div>
		`;
			this.settings.forEach(item => {
				content.append(this.getCrmEntityProductListSettingItem(item));
			});
			return content;
		}
		getCrmEntityProductListSettingItem(item) {
			const input = main_core.Tag.render`
			<input type="checkbox">
		`;
			input.checked = item.checked ?? false;
			input.disabled = item.disabled ?? false;
			input.dataset.settingId = item.id;
			const descriptionNode = main_core.Type.isStringFilled(item.desc) ? main_core.Tag.render`<span class="ui-entity-editor-popup-create-field-item-desc">${item.desc}</span>` : '';
			const hintNode = main_core.Type.isStringFilled(item.hint) ? main_core.Tag.render`<span class="crm-entity-product-list-setting-hint" data-hint="${item.hint}"></span>` : '';
			const setting = main_core.Tag.render`
			<label class="ui-ctl-block ui-entity-editor-popup-create-field-item ui-ctl-w100">
				<div class="ui-ctl-w10" style="text-align: center">${input}</div>
				<div class="ui-ctl-w75">
					<span class="ui-entity-editor-popup-create-field-item-title ${item.disabled ? 'crm-entity-product-list-disabled-setting' : ''}">${item.title}${hintNode}</span>
					${descriptionNode}
				</div>
			</label>
		`;
			BX.UI.Hint.init(setting);
			main_core.Event.bind(setting, 'change', this.setSetting.bind(this));
			return setting;
		}
		setSetting(event) {
			const target = event.target;
			const settingItem = this.getSetting(target.dataset.settingId);
			if (!settingItem) {
				return;
			}
			const settingEnabled = target.checked;
			this.requestGridSettings(settingItem, settingEnabled);
		}
		requestGridSettings(setting, enabled) {
			const headers = [];
			const cells = this.editor.gridLifecycle.getGrid().getRows().getHeadFirstChild().getCells();
			Array.from(cells).forEach(header => {
				if ('name' in header.dataset) {
					headers.push(header.dataset.name);
				}
			});
			main_core.ajax.runComponentAction(this.editor.getComponentName(), 'setGridSetting', {
				mode: 'class',
				data: {
					signedParameters: this.editor.getSignedParameters(),
					settingId: setting.id,
					selected: enabled,
					currentHeaders: headers
				}
			}).then(() => {
				let message;
				setting.checked = enabled;
				if (setting.id === 'ADD_NEW_ROW_TOP') {
					const panel = enabled ? 'top' : 'bottom';
					this.editor.setSettingValue('newRowPosition', panel);
					const activePanel = this.editor.changeActivePanelButtons(panel);
					const settingButton = activePanel?.querySelector('[data-role="product-list-settings-button"]') ?? null;
					if (settingButton) {
						this.getPopup().setBindElement(settingButton);
					}
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED');
					message = message.replace('#NAME#', setting.title);
				} else if (setting.id === 'WAREHOUSE') {
					this.editor.reloadGrid(false);
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_DISABLED');
				} else {
					this.editor.reloadGrid();
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED');
					message = message.replace('#NAME#', setting.title);
				}
				this.getPopup().close();
				this.showNotification(message, {
					category: 'popup-settings'
				});
			});
		}
		showNotification(content, options) {
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
			this.settings.filter(item => item.action === 'grid' && main_core.Type.isArray(item.columns)).forEach(item => {
				let allColumnsExist = true;
				item.columns.forEach(columnName => {
					if (!this.editor.gridLifecycle.getGrid().getColumnHeaderCellByName(columnName)) {
						allColumnsExist = false;
					}
				});
				const checkbox = popupContainer.querySelector('input[data-setting-id="' + item.id + '"]');
				if (main_core.Type.isElementNode(checkbox)) {
					checkbox.checked = allColumnsExist;
				}
			});
		}
	}

	class HintPopup {
		editor;
		hintPopup = null;
		constructor(editor) {
			this.editor = editor;
		}
		load(node, text) {
			if (!this.hintPopup) {
				this.hintPopup = new main_popup.Popup({
					id: 'ui-hint-popup-' + this.editor.getId(),
					darkMode: true,
					closeIcon: true,
					animation: 'fading-slide',
					autoHide: true
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

	class FieldHintManager {
		fieldHintIsBusy = false;
		activeHintGuide = null;
		gridGetter;
		contentContainer;
		constructor(contentContainer, gridGetter) {
			this.contentContainer = contentContainer;
			this.gridGetter = gridGetter;
		}
		processFieldTour(fieldNode, tourData, endTourHandler, addictedFieldNodes = []) {
			if (this.fieldHintIsBusy) {
				return;
			}
			this.fieldHintIsBusy = true;
			tourData.events = {
				onClose: () => {
					endTourHandler();
					this.fieldHintIsBusy = false;
					this.activeHintGuide = null;
				}
			};
			if (this.fieldNodeIsInGridVision(fieldNode)) {
				let tourObject = this.tieTourToNode(fieldNode, tourData);
				this.freezeGridContainer(() => {
					tourObject.close();
				});
			} else {
				const gridContainer = this.gridGetter().getContainer();
				const leftArrow = gridContainer.querySelector('.main-grid-ear-left');
				const rightArrow = gridContainer.querySelector('.main-grid-ear-right');
				const fieldPos = fieldNode.getClientRects()[0].x;
				const gridPos = gridContainer.getClientRects()[0].x;
				let spotlight = null;
				if (fieldPos > gridPos) {
					spotlight = this.bindSpotlightToNode(rightArrow);
				} else {
					spotlight = this.bindSpotlightToNode(leftArrow);
				}
				this.bindGridNodeVisionChange(fieldNode, () => {
					spotlight.close();
					let tourObject = this.tieTourToNode(fieldNode, tourData);
					this.freezeGridContainer(() => {
						tourObject.close();
					});
				}, [], addictedFieldNodes);
			}
		}
		bindGridNodeVisionChange(observedNode, onSuccessVisionCallback, callbackParams = [], addictedNodes = []) {
			const observedNodes = this.getPossibleToValidateFieldNodes(observedNode, ...addictedNodes);
			const observer = _event => {
				if (this.fieldNodeIsInGridVision(...observedNodes)) {
					main_core.Event.unbind(this.gridGetter().getScrollContainer(), 'scroll', observer);
					main_core.Event.unbind(window, 'resize', observer);
					onSuccessVisionCallback(...callbackParams);
				}
			};
			main_core.Event.bind(this.gridGetter().getScrollContainer(), 'scroll', observer);
			main_core.Event.bind(window, 'resize', observer);
		}
		getPossibleToValidateFieldNodes(mainNode, ...addictedNodes) {
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
			const gridRect = this.gridGetter()?.getContainer().getClientRects()?.[0];
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
		fieldNodeIsInGridVision(...fieldNodes) {
			const gridRect = this.gridGetter()?.getContainer().getClientRects()?.[0];
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
		bindSpotlightToNode(targetNode) {
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
		freezeGridContainer(onCloseCallback, callbackParams = []) {
			const gridContainer = this.gridGetter().getContainer();
			const leftArrow = gridContainer.querySelector('.main-grid-ear-left');
			const rightArrow = gridContainer.querySelector('.main-grid-ear-right');
			gridContainer.style.pointerEvents = "none";
			leftArrow.style.pointerEvents = "none";
			rightArrow.style.pointerEvents = "none";
			const clickObserver = _event => {
				gridContainer.style.pointerEvents = "auto";
				leftArrow.style.pointerEvents = "auto";
				rightArrow.style.pointerEvents = "auto";
				main_core.Event.unbind(this.contentContainer, 'click', clickObserver);
				onCloseCallback(...callbackParams);
			};
			setTimeout(() => {
				main_core.Event.bind(this.contentContainer, 'click', clickObserver);
			}, 500);
		}
		tieTourToNode(tourTarget, tourData) {
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

	const DEFAULT_PRECISION$1 = 2;
	function parseIntValue(value, defaultValue = 0) {
		let result;
		const isNumberValue = main_core.Type.isNumber(value);
		const isStringValue = main_core.Type.isStringFilled(value);
		if (!isNumberValue && !isStringValue) {
			return defaultValue;
		}
		if (isStringValue) {
			let v = value.replace(/^\s+|\s+$/g, '');
			const isNegative = v.indexOf('-') === 0;
			result = parseInt(v.replace(/[^\d]/g, ''), 10);
			if (isNaN(result)) {
				result = defaultValue;
			} else if (isNegative) {
				result = -result;
			}
		} else {
			result = parseInt(value, 10);
			if (isNaN(result)) {
				result = defaultValue;
			}
		}
		return result;
	}
	function parseFloatValue(value, precision = DEFAULT_PRECISION$1, defaultValue = 0.0) {
		let result;
		const isNumberValue = main_core.Type.isNumber(value);
		const isStringValue = main_core.Type.isStringFilled(value);
		if (!isNumberValue && !isStringValue) {
			return defaultValue;
		}
		if (isStringValue) {
			let v = value.replace(/^\s+|\s+$/g, '');
			const dot = v.indexOf('.');
			const comma = v.indexOf(',');
			const isNegative = v.indexOf('-') === 0;
			if (dot < 0 && comma >= 0) {
				let s1 = v.substr(0, comma);
				const decimalLength = v.length - comma - 1;
				if (decimalLength > 0) {
					s1 += '.' + v.substr(comma + 1, decimalLength);
				}
				v = s1;
			}
			v = v.replace(/[^\d.]+/g, '');
			result = parseFloat(v);
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
			result = round(result, precision);
		}
		return result;
	}
	function round(value, precision = DEFAULT_PRECISION$1) {
		const factor = Math.pow(10, precision);
		return Math.round(value * factor) / factor;
	}

	class EditorEventBindings {
		editor;
		pullReloadGrid = null;
		constructor(editor) {
			this.editor = editor;
		}
		subscribeDom() {
			this.unsubscribeDom();
			const container = this.editor.getContainer();
			if (!main_core.Type.isElementNode(container)) {
				return;
			}
			for (const binding of this.getDomBindings()) {
				if (binding.gate && !binding.gate()) {
					continue;
				}
				container.querySelectorAll(binding.selector).forEach(el => {
					binding.beforeBind?.(el);
					main_core.Event.bind(el, 'click', binding.handler);
				});
			}
		}
		unsubscribeDom() {
			const container = this.editor.getContainer();
			if (!main_core.Type.isElementNode(container)) {
				return;
			}
			for (const binding of this.getDomBindings()) {
				container.querySelectorAll(binding.selector).forEach(el => {
					main_core.Event.unbind(el, 'click', binding.handler);
				});
			}
		}
		subscribeCustom() {
			this.unsubscribeCustom();
			for (const [name, handler] of this.getCustomBindings()) {
				main_core_events.EventEmitter.subscribe(name, handler);
			}
			if (pull_client.PULL) {
				this.pullReloadGrid = pull_client.PULL.subscribe({
					moduleId: 'crm',
					callback: data => {
						if (data.command === 'onCatalogInventoryManagementEnabled' || data.command === 'onCatalogInventoryManagementDisabled') {
							this.editor.reloadGrid(false);
						}
					}
				});
			}
		}
		unsubscribeCustom() {
			for (const [name, handler] of this.getCustomBindings()) {
				main_core_events.EventEmitter.unsubscribe(name, handler);
			}
			if (!main_core.Type.isNil(this.pullReloadGrid)) {
				this.pullReloadGrid();
			}
		}
		getDomBindings() {
			const e = this.editor;
			return [{
				selector: '[data-role="product-list-select-button"]',
				handler: e.productSelectionPopupHandler,
				gate: () => !e.getSettingValue('disabledSelectProductButton', false)
			}, {
				selector: '[data-role="product-list-add-button"]',
				handler: e.productRowAddHandler,
				gate: () => !e.getSettingValue('disabledAddRowButton', false),
				beforeBind: button => {
					if (e.getSettingValue('isOnecInventoryManagementRestricted') === true) {
						main_core.Dom.addClass(button, 'ui-btn-icon-lock');
					}
				}
			}, {
				selector: '[data-role="product-list-settings-button"]',
				handler: e.showSettingsPopupHandler
			}];
		}
		getCustomBindings() {
			const e = this.editor;
			return [['CrmProductSearchDialog_SelectProduct', e.onDialogSelectProductHandler], ['onAddViewedProductToDeal', e.onAddViewedProductToDealHandler], ['BX.Crm.EntityEditor:onSave', e.onSaveHandler], ['onFocusToProductList', e.onFocusToProductList], ['onCrmEntityUpdate', e.onEntityUpdateHandler], ['BX.Crm.EntityEditorAjax:onSubmit', e.onEditorSubmit], ['EntityProductListController:onInnerCancel', e.onInnerCancelHandler], ['Grid::beforeRequest', e.onBeforeGridRequestHandler], ['Grid::updated', e.onGridUpdatedHandler], ['Grid::rowMoved', e.onGridRowMovedHandler], ['BX.Catalog.ProductSelector:onBeforeChange', e.onBeforeProductChangeHandler], ['BX.Catalog.ProductSelector:onChange', e.onProductChangeHandler], ['BX.Catalog.ProductSelector:onBeforeClear', e.onBeforeProductClearHandler], ['BX.Catalog.ProductSelector:onClear', e.onProductClearHandler], ['Dropdown::change', e.dropdownChangeHandler]];
		}
	}

	class EditorAjaxClient {
		editor;
		pool = new Map();
		constructor(editor) {
			this.editor = editor;
		}
		request(action, data) {
			const requestKey = main_core.Text.getRandom();
			this.pool.set(action, requestKey);
			if (!main_core.Type.isPlainObject(data.options)) {
				data.options = {};
			}
			data.options.ACTION = action;
			data.options.REQUEST_KEY = requestKey;
			main_core.ajax.runComponentAction(this.editor.getComponentName(), action, {
				mode: 'class',
				signedParameters: this.editor.getSignedParameters(),
				data: data
			}).then(response => this.handleSuccess(response, data.options), response => this.handleFailure(response, data.options));
		}
		handleSuccess(response, requestOptions) {
			if (!this.commonCheck(response) || this.pool.get(response.data.action) !== requestOptions.REQUEST_KEY) {
				return;
			}
			this.pool.delete(response.data.action);
			main_core_events.EventEmitter.emit(this.editor, 'onAjaxSuccess', response.data.action);
			switch (response.data.action) {
				case 'calculateTotalData':
					if (main_core.Type.isPlainObject(response.data.result)) {
						this.editor.totalsService.apply(response.data.result, requestOptions);
					}
					break;
				case 'calculateProductPrices':
					if (main_core.Type.isPlainObject(response.data.result)) {
						this.editor.currencyManager.applyCalculatedPrices(response.data.result);
					}
					break;
			}
		}
		handleFailure(response, requestOptions) {
			this.pool.delete(requestOptions.ACTION);
		}
		commonCheck(response) {
			if (!main_core.Type.isPlainObject(response)) {
				return false;
			}
			if (!main_core.Type.isStringFilled(response.status)) {
				return false;
			}
			if (response.status !== 'success') {
				return false;
			}
			if (!main_core.Type.isPlainObject(response.data)) {
				return false;
			}
			if (!main_core.Type.isStringFilled(response.data.action)) {
				return false;
			}
			if (!('result' in response.data)) {
				return false;
			}
			return true;
		}
	}

	const TOTAL_BLOCK_FIELDS = ['totalCost', 'totalDelivery', 'totalTax', 'totalWithoutTax', 'totalDiscount', 'totalWithoutDiscount'];
	const PRODUCT_FIELDS_FOR_TOTAL = ['PRODUCT_ID', 'PRODUCT_NAME', 'QUANTITY', 'DISCOUNT_TYPE_ID', 'DISCOUNT_RATE', 'DISCOUNT_SUM', 'TAX_RATE', 'TAX_INCLUDED', 'PRICE_EXCLUSIVE', 'PRICE', 'CUSTOMIZED'];
	class EditorTotalsService {
		editor;
		state = {
			inProgress: false
		};
		updateDelayed;
		constructor(editor) {
			this.editor = editor;
			this.updateDelayed = main_core.Runtime.debounce(this.runDelayed.bind(this), 1000, this);
		}
		getProductFieldList() {
			return [...PRODUCT_FIELDS_FOR_TOTAL];
		}
		scheduleUpdate(options = {}) {
			if (this.state.inProgress) {
				return;
			}
			this.updateDelayed(options);
		}
		apply(data, options = {}) {
			const item = BX(this.editor.getSettingValue('totalBlockContainerId', null));
			if (main_core.Type.isElementNode(item)) {
				const currencyId = this.editor.getCurrencyId();
				for (const id of TOTAL_BLOCK_FIELDS) {
					const row = item.querySelector('[data-total="' + id + '"]');
					if (main_core.Type.isElementNode(row) && id in data) {
						row.innerHTML = currency_currencyCore.CurrencyCore.currencyFormat(data[id], currencyId, false);
					}
				}
			}
			this.sendToController(data, options);
			this.state.inProgress = false;
		}
		updateUiCurrency() {
			const totalBlock = BX(this.editor.getSettingValue('totalBlockContainerId', null));
			if (!main_core.Type.isElementNode(totalBlock)) {
				return;
			}
			totalBlock.querySelectorAll('.crm-product-list-payment-side-table-column').forEach(column => {
				const valueElement = column.querySelector('.crm-product-list-result-grid-total');
				if (valueElement) {
					column.innerHTML = currency_currencyCore.CurrencyCore.getPriceControl(valueElement, this.editor.getCurrencyId());
				}
			});
		}
		runDelayed(options = {}) {
			if (this.state.inProgress) {
				return;
			}
			this.state.inProgress = true;
			const products = this.editor.getProductsFields(this.getProductFieldList());
			products.forEach(item => item['CUSTOMIZED'] = 'Y');
			this.editor.ajaxClient.request('calculateTotalData', {
				options,
				products,
				currencyId: this.editor.getCurrencyId()
			});
		}
		sendToController(data, options) {
			const controller = this.editor.controller;
			if (!controller) {
				return;
			}
			let needMarkAsChanged = true;
			if (main_core.Type.isObject(options) && (options.isInternalChanging === true || options.isInternalChanging === 'true')) {
				needMarkAsChanged = false;
			}
			setTimeout(() => {
				controller.changeSumTotal(data, needMarkAsChanged, !this.editor.childrenHasErrors());
			}, 500);
		}
	}

	const PRICE_FIELDS_FOR_RECALC = ['BASE_PRICE', 'TAX_INCLUDED', 'PRICE_NETTO', 'PRICE_BRUTTO', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'CURRENCY'];
	const TEMPLATE_CURRENCY_FIELDS = ['DISCOUNT_ROW', 'SUM', 'PRICE'];
	const PRODUCT_CURRENCY_FIELD_NAMES = ['BASE_PRICE', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'CURRENCY_ID'];
	class EditorCurrencyManager {
		editor;
		constructor(editor) {
			this.editor = editor;
		}
		getPriceRecalcFieldNames() {
			return [...PRICE_FIELDS_FOR_RECALC];
		}
		change(currencyId) {
			this.set(currencyId);
			const products = [];
			this.editor.productCollection.products.forEach(product => {
				const priceFields = {};
				for (const name of PRICE_FIELDS_FOR_RECALC) {
					priceFields[name] = product.getField(name);
				}
				priceFields.CATALOG_PRICE = product.getField('CATALOG_PRICE');
				products.push({
					fields: priceFields,
					id: product.getId()
				});
			});
			if (products.length > 0) {
				this.editor.ajaxClient.request('calculateProductPrices', {
					products,
					currencyId
				});
			}
			this.updateGridTemplateCurrency();
		}
		set(currencyId) {
			this.editor.setSettingValue('currencyId', currencyId);
			const format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currencyId);
			const precision = format && format.DECIMALS != null && format.DECIMALS !== '' ? parseIntValue(format.DECIMALS, 2) : 2;
			this.editor.setSettingValue('pricePrecision', precision);
			this.editor.productCollection.products.forEach(product => product.getModel()?.setOption('currency', currencyId));
		}
		getText() {
			const currencyId = this.editor.getCurrencyId();
			if (!main_core.Type.isStringFilled(currencyId)) {
				return '';
			}
			const format = currency_currencyCore.CurrencyCore.getCurrencyFormat(currencyId);
			return format && format.FORMAT_STRING.replace(/(^|[^&])#/, '$1').trim() || currencyId;
		}
		applyCalculatedPrices(products) {
			this.editor.productCollection.products.forEach(product => {
				const calculated = products[product.getId()];
				if (!main_core.Type.isPlainObject(calculated)) {
					return;
				}
				product.updateUiCurrencyFields();
				for (const name of PRODUCT_CURRENCY_FIELD_NAMES) {
					product.updateField(name, main_core.Text.toNumber(calculated[name]));
				}
				product.setField('CURRENCY', calculated['CURRENCY_ID']);
				product.setField('CATALOG_PRICE', calculated['CATALOG_PRICE']);
			});
			this.editor.totalsService.updateUiCurrency();
		}
		updateGridTemplateCurrency() {
			const editData = this.editor.gridLifecycle.getEditData();
			const templateRow = editData['template_0'];
			const currencyId = this.editor.getCurrencyId();
			templateRow['CURRENCY'] = currencyId;
			for (const field of TEMPLATE_CURRENCY_FIELDS) {
				templateRow[field]['CURRENCY']['VALUE'] = currencyId;
			}
			this.editor.gridLifecycle.setEditData(editData);
		}
	}

	class EditorFormManager {
		editor;
		form = null;
		constructor(editor) {
			this.editor = editor;
		}
		init() {
			const formId = this.editor.getSettingValue('formId', '');
			const form = main_core.Type.isStringFilled(formId) ? BX('form_' + formId) : null;
			if (main_core.Type.isElementNode(form)) {
				this.set(form);
			}
		}
		get() {
			return this.form;
		}
		set(form) {
			this.form = form;
		}
		exists() {
			return main_core.Type.isElementNode(this.form);
		}
		initFields() {
			const container = this.form;
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
		initField(fieldName) {
			const container = this.form;
			if (main_core.Type.isElementNode(container) && main_core.Type.isStringFilled(fieldName)) {
				main_core.Dom.append(main_core.Dom.create('input', {
					attrs: {
						type: 'hidden',
						name: fieldName
					}
				}), container);
			}
		}
		removeFields() {
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
			this.initField(this.editor.getDataFieldName());
		}
		initDataSettingsField() {
			this.initField(this.editor.getDataSettingsFieldName());
		}
		getField(fieldName) {
			const container = this.form;
			if (main_core.Type.isElementNode(container) && main_core.Type.isStringFilled(fieldName)) {
				return container.querySelector('input[name="' + fieldName + '"]');
			}
			return null;
		}
		getDataField() {
			return this.getField(this.editor.getDataFieldName());
		}
		getDataSettingsField() {
			return this.getField(this.editor.getDataSettingsFieldName());
		}
	}

	const AJAX_FIELDS = ['ID', 'PRODUCT_ID', 'PRODUCT_NAME', 'QUANTITY', 'TAX_RATE', 'TAX_INCLUDED', 'PRICE_EXCLUSIVE', 'PRICE_NETTO', 'PRICE_BRUTTO', 'PRICE', 'CUSTOMIZED', 'BASE_PRICE', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'DISCOUNT_TYPE_ID', 'DISCOUNT_RATE', 'CURRENCY', 'STORE_ID', 'INPUT_RESERVE_QUANTITY', 'RESERVE_QUANTITY', 'DATE_RESERVE_END', 'SORT', 'MEASURE_CODE', 'MEASURE_NAME', 'TYPE'];
	class EditorProductDataSerializer {
		editor;
		constructor(editor) {
			this.editor = editor;
		}
		getAjaxFields() {
			return [...AJAX_FIELDS];
		}
		compile() {
			const editor = this.editor;
			if (!editor.formManager.exists()) {
				return;
			}
			editor.formManager.initFields();
			const field = editor.formManager.getDataField();
			const settingsField = editor.formManager.getDataSettingsField();
			editor.productCollection.cleanEmpty();
			if (main_core.Type.isElementNode(field) && main_core.Type.isElementNode(settingsField)) {
				field.value = this.prepareValue();
				settingsField.value = JSON.stringify({
					ENABLE_DISCOUNT: editor.getDiscountEnabled(),
					ENABLE_TAX: editor.getTaxEnabled()
				});
			}
			editor.addFirstRowIfEmpty();
		}
		prepareValue() {
			const editor = this.editor;
			if (!editor.getProductCount()) {
				return '';
			}
			const productData = [];
			editor.productCollection.products.forEach(item => {
				const saveFields = item.getFields(this.getAjaxFields());
				if (!/^[0-9]+$/.test(saveFields['ID'])) {
					saveFields['ID'] = 0;
				}
				saveFields['CUSTOMIZED'] = 'Y';
				productData.push(saveFields);
			});
			return JSON.stringify(productData);
		}
	}

	const GRID_TEMPLATE_ROW = 'template_0';
	class EditorGridLifecycle {
		editor;
		cache = new main_core.Cache.MemoryCache();
		constructor(editor) {
			this.editor = editor;
		}
		getGrid() {
			return this.cache.remember('grid', () => {
				const gridId = this.editor.getGridId();
				if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
					throw Error(`Cannot find grid with '${gridId}' id.`);
				}
				return BX.Main.gridManager.getInstanceById(gridId);
			});
		}
		initData() {
			const gridEditData = this.editor.getSettingValue('templateGridEditData', null);
			if (gridEditData) {
				this.setEditData(gridEditData);
			}
		}
		getEditData() {
			return this.getGrid().arParams.EDITABLE_DATA;
		}
		setEditData(data) {
			this.getGrid().arParams.EDITABLE_DATA = data;
		}
		setOriginalTemplateEditData(data) {
			this.getGrid().arParams.EDITABLE_DATA[GRID_TEMPLATE_ROW] = data;
		}
		redefineTemplateEditData(newId) {
			const data = this.getEditData();
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
			const templateIdMask = this.editor.getSettingValue('templateIdMask', '');
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
		createProductRow() {
			const newId = main_core.Text.getRandom();
			const originalTemplate = this.redefineTemplateEditData(newId);
			const grid = this.getGrid();
			let newRow;
			if (this.editor.getSettingValue('newRowPosition') === 'bottom') {
				newRow = grid.appendRowEditor();
			} else {
				newRow = grid.prependRowEditor();
			}
			const newNode = newRow.getNode();
			if (main_core.Type.isElementNode(newNode)) {
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
		reload(useProductsFromRequest = true) {
			this.getGrid().reloadTable('POST', {
				useProductsFromRequest
			}, () => main_core_events.EventEmitter.emit(this.editor, 'onGridReloaded'));
		}
	}

	class EditorProductCollection {
		products = [];
		productsAreInitiated = false;
		editor;
		constructor(editor) {
			this.editor = editor;
		}
		init() {
			const list = this.editor.getSettingValue('items', []);
			const isReserveBlocked = this.editor.getSettingValue('isReserveBlocked', false);
			const isInventoryManagementToolEnabled = this.editor.getSettingValue('isInventoryManagementToolEnabled', false);
			const inventoryManagementMode = this.editor.getSettingValue('inventoryManagementMode', null);
			for (const item of list) {
				const fields = {
					...item.fields
				};
				const settings = {
					selectorId: item.selectorId,
					isReserveBlocked,
					isInventoryManagementToolEnabled,
					inventoryManagementMode
				};
				this.products.push(new Row(item.rowId, fields, settings, this.editor));
			}
			this.numerate();
			this.productsAreInitiated = true;
		}
		count() {
			return this.products.filter(item => !item.isEmpty()).length;
		}
		findById(id) {
			const rowId = this.editor.getRowIdPrefix() + id;
			return this.findByRowId(rowId);
		}
		findByRowId(rowId) {
			return this.products.find(row => row.getId() === rowId);
		}
		numerate() {
			this.products.forEach((product, index) => {
				product.setRowNumber(index + 1);
			});
		}
		refreshSort() {
			this.products.forEach((item, index) => item.setField('SORT', (index + 1) * 10));
		}
		resortByIds(ids) {
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
		cleanEmpty() {
			this.products.filter(item => item.isEmpty()).forEach(row => this.editor.deleteRow(row.getField('ID'), true));
		}
		unsubscribeAll() {
			this.products.forEach(current => {
				current.unsubscribeCustomEvents();
			});
		}
		reset() {
			this.products = [];
			this.productsAreInitiated = false;
		}
	}

	const DEFAULT_PRECISION = 2;
	class Editor extends SettingsHolder {
		id = null;
		controller = null;
		isChangedGrid = false;
		isVisibleGrid = false;
		pageEventsManager;
		cache = new main_core.Cache.MemoryCache();
		fieldHintManager;
		eventBindings;
		ajaxClient;
		totalsService;
		currencyManager;
		formManager;
		productDataSerializer;
		gridLifecycle;
		productCollection;
		actions = {
			disableSaveButton: 'disableSaveButton',
			productChange: 'productChange',
			productListChanged: 'productListChanged',
			updateListField: 'listField',
			stateChanged: 'stateChange',
			updateTotal: 'total'
		};
		stateChange = {
			changed: false,
			sended: false
		};
		updateFieldForList = null;
		productSelectionPopupHandler = event => {
			const caller = 'crm_entity_product_list';
			const jsEventsManagerId = this.getSettingValue('jsEventsManagerId', '');
			const popup = new BX.CDialog({
				content_url: '/bitrix/components/bitrix/crm.product_row.list/product_choice_dialog.php?' + 'caller=' + caller + '&JS_EVENTS_MANAGER_ID=' + BX.util.urlencode(jsEventsManagerId) + '&sessid=' + BX.bitrix_sessid(),
				height: Math.max(500, window.innerHeight - 400),
				width: Math.max(800, window.innerWidth - 400),
				draggable: true,
				resizable: true,
				min_height: 500,
				min_width: 800,
				zIndex: 800
			});
			main_core_events.EventEmitter.subscribeOnce(popup, 'onWindowRegister', BX.defer(() => {
				popup.Get().style.position = 'fixed';
				popup.Get().style.top = parseInt(popup.Get().style.top) - BX.GetWindowScrollPos().scrollTop + 'px';
			}));
			main_core_events.EventEmitter.subscribeOnce(window, 'EntityProductListController:onInnerCancel', BX.defer(() => {
				popup.Close();
			}));
			if (!main_core.Type.isUndefined(BX.Crm.EntityEvent)) {
				main_core_events.EventEmitter.subscribeOnce(window, BX.Crm.EntityEvent.names.update, BX.defer(() => {
					requestAnimationFrame(() => {
						popup.Close();
					});
				}));
			}
			popup.Show();
		};
		productRowAddHandler = () => {
			if (this.getSettingValue('isOnecInventoryManagementRestricted') === true) {
				catalog_toolAvailabilityManager.OneCPlanRestrictionSlider.show();
				return;
			}
			const id = this.addProductRow();
			this.focusProductSelector(id);
		};
		showSettingsPopupHandler = () => {
			this.getSettingsPopup().show();
		};
		onDialogSelectProductHandler = event => {
			const [productId] = event.getCompatData() ?? [];
			let id;
			if (this.getProductCount() > 0 || this.productCollection.products[0]?.getField('ID') <= 0) {
				id = this.addProductRow();
			} else {
				id = this.productCollection.products[0]?.getField('ID');
			}
			this.selectProductInRow(id, productId);
		};
		onAddViewedProductToDealHandler = event => {
			const [productId] = event.getCompatData() ?? [];
			let id;
			if (this.getProductCount() > 0) {
				id = this.addProductRow();
			} else {
				id = this.productCollection.products[0]?.getField('ID');
			}
			this.selectViewedProductInRow(id, productId);
		};
		onSaveHandler = event => {
			const items = [];
			this.productCollection.products.forEach(product => {
				const item = {
					fields: {
						...product.fields
					},
					rowId: product.fields.ROW_ID
				};
				items.push(item);
			});
			this.setSettingValue('items', items);
		};
		onFocusToProductList = event => {
			if (this.isReadOnly()) {
				return;
			}
			let listHaveEmptyRows = false;
			for (const product of this.productCollection.products) {
				if (product.isEmptyRow()) {
					listHaveEmptyRows = true;
					this.focusProductSelector(product.fields['ID']);
					break;
				}
			}
			if (!listHaveEmptyRows) {
				this.productRowAddHandler();
			}
		};
		onEntityUpdateHandler = event => {
			const [data] = event.getData();
			if (this.isChanged() && data.entityId === this.getSettingValue('entityId') && data.entityTypeId === this.getSettingValue('entityTypeId')) {
				this.setGridChanged(false);
				this.reloadGrid(false);
			}
		};
		onEditorSubmit = event => {
			if (!this.isLocationDependantTaxesEnabled()) {
				return;
			}
			const entityData = event.getData()[0];
			if (!entityData || !entityData.hasOwnProperty('LOCATION_ID')) {
				return;
			}
			if (entityData['LOCATION_ID'] !== this.getLocationId()) {
				this.setLocationId(entityData['LOCATION_ID']);
				this.reloadGrid(false);
			}
		};
		onInnerCancelHandler = event => {
			if (this.controller) {
				this.controller.rollback();
			}
			this.setGridChanged(false);
			main_core_events.EventEmitter.subscribeOnce(this, 'onGridReloaded', () => this.actionUpdateTotalData({
				isInternalChanging: true
			}));
			this.reloadGrid(false);
		};
		onBeforeGridRequestHandler = event => {
			const [grid, eventArgs] = event.getCompatData() ?? [];
			if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId()) {
				return;
			}
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
				currencyId: this.getCurrencyId()
			};
			this.clearEditor();
			if (isNativeAction && this.isChanged()) {
				main_core_events.EventEmitter.subscribeOnce('Grid::updated', () => this.actionUpdateTotalData({
					isInternalChanging: false
				}));
			}
		};
		onGridUpdatedHandler = event => {
			const [grid] = event.getCompatData();
			if (!grid || grid.getId() !== this.getGridId()) {
				return;
			}
			this.getSettingsPopup().updateCheckboxState();
		};
		onGridRowMovedHandler = event => {
			const [ids,, grid] = event.getCompatData() ?? [];
			if (!grid || grid.getId() !== this.getGridId()) {
				return;
			}
			const changed = this.productCollection.resortByIds(ids);
			if (changed) {
				this.productCollection.refreshSort();
				this.productCollection.numerate();
				this.executeActions([{
					type: this.actions.productListChanged
				}]);
			}
		};
		onBeforeProductChangeHandler = event => {
			const data = event.getData();
			const product = this.productCollection.findByRowId(data.rowId);
			if (product) {
				this.gridLifecycle.getGrid().tableFade();
				product.resetExternalActions();
			}
		};
		onProductChangeHandler = event => {
			const data = event.getData();
			const productRow = this.productCollection.findByRowId(data.rowId);
			if (productRow && data.fields) {
				const promise = new Promise((resolve, reject) => {
					const fields = data.fields;
					if (!main_core.Type.isNil(fields['IMAGE_INFO'])) {
						fields['IMAGE_INFO'] = JSON.stringify(fields['IMAGE_INFO']);
					}
					if (this.getCurrencyId() !== fields['CURRENCY_ID']) {
						fields['CURRENCY'] = fields['CURRENCY_ID'];
						const priceFields = {};
						this.currencyManager.getPriceRecalcFieldNames().forEach(name => {
							priceFields[name] = data.fields[name];
						});
						const products = [{
							fields: priceFields,
							id: productRow.getId()
						}];
						main_core.ajax.runComponentAction(this.getComponentName(), 'calculateProductPrices', {
							mode: 'class',
							signedParameters: this.getSignedParameters(),
							data: {
								products,
								currencyId: this.getCurrencyId(),
								options: {
									ACTION: 'calculateProductPrices'
								}
							}
						}).then(response => {
							const changedFields = response.data.result[productRow.getId()];
							if (changedFields) {
								changedFields['CUSTOMIZED'] = 'Y';
								resolve(Object.assign(fields, changedFields));
							} else {
								resolve(fields);
							}
						});
					} else {
						resolve(fields);
					}
				});
				promise.then(fields => {
					if (this.productCollection.products.length > 1) {
						const taxId = fields['VAT_ID'] || fields['TAX_ID'];
						const taxIncluded = fields['VAT_INCLUDED'] || fields['TAX_INCLUDED'];
						if (taxId > 0 && taxIncluded !== productRow.getTaxIncluded()) {
							const taxRate = this.getTaxList()?.find(item => parseInt(item.ID) === taxId);
							if (taxRate?.VALUE > 0 && taxIncluded === 'Y') {
								fields['BASE_PRICE'] = fields['BASE_PRICE'] / (1 + taxRate.VALUE / 100);
							}
						}
						['TAX_INCLUDED', 'VAT_INCLUDED'].forEach(name => delete fields[name]);
					}
					if (productRow.getField('OFFER_ID') !== fields.ID) {
						fields['ROW_RESERVED'] = 0;
						fields['DEDUCTED_QUANTITY'] = 0;
						if (!this.getSettingValue('allowDiscountChange', true)) {
							fields['DISCOUNT_ROW'] = 0;
							fields['DISCOUNT_SUM'] = 0;
							fields['DISCOUNT_RATE'] = 0;
							fields['DISCOUNT'] = 0;
							productRow.updateUiHtmlField('DISCOUNT_PRICE', currency_currencyCore.CurrencyCore.currencyFormat(0, this.getCurrencyId(), true));
							productRow.updateUiHtmlField('DISCOUNT_ROW', currency_currencyCore.CurrencyCore.currencyFormat(0, this.getCurrencyId(), true));
						}
					}
					Object.keys(fields).forEach(key => {
						productRow.updateFieldValue(key, fields[key]);
					});
					if (!main_core.Type.isStringFilled(fields['CUSTOMIZED'])) {
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
				});
			} else {
				this.gridLifecycle.getGrid().tableUnfade();
			}
		};
		onBeforeProductClearHandler = event => {
			const {
				rowId
			} = event.getData();
			const product = this.productCollection.findByRowId(rowId);
			product?.clearPropertyFields();
		};
		onProductClearHandler = event => {
			const {
				rowId
			} = event.getData();
			const product = this.productCollection.findByRowId(rowId);
			if (product) {
				product.layoutReserveControl();
				product.initHandlersForSelectors();
				product.changeBasePrice(0);
				if (!this.getSettingValue('allowDiscountChange', true)) {
					product.setDiscount(0);
					product.updateUiHtmlField('DISCOUNT_PRICE', currency_currencyCore.CurrencyCore.currencyFormat(0, this.getCurrencyId(), true));
					product.updateUiHtmlField('DISCOUNT_ROW', currency_currencyCore.CurrencyCore.currencyFormat(0, this.getCurrencyId(), true));
				}
				product.modifyBasePriceInput();
				product.executeExternalActions();
			}
		};
		dropdownChangeHandler = event => {
			const [dropdownId,,,, value] = event.getData();
			const regExp = new RegExp(this.getRowIdPrefix() + '([A-Za-z0-9]+)_(\\w+)_control', 'i');
			const matches = dropdownId.match(regExp);
			if (matches) {
				const [, rowId, fieldCode] = matches;
				const product = this.productCollection.findById(rowId);
				if (product) {
					product.updateField(fieldCode, value, MODE_EDIT);
				}
			}
		};
		changeProductFieldHandler = event => {
			const row = event.target.closest('tr');
			if (row && row.hasAttribute('data-id')) {
				const product = this.productCollection.findById(row.getAttribute('data-id'));
				if (product) {
					const cell = event.target.closest('td');
					const fieldCode = this.getFieldCodeByGridCell(row, cell);
					if (fieldCode) {
						product.updateFieldByEvent(fieldCode, event);
					}
				}
			}
		};
		constructor(id) {
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
		init(config = {}) {
			this.setSettings(config);
			if (this.canEdit()) {
				this.addFirstRowIfEmpty();
				this.enableEdit();
			}
			this.formManager.init();
			this.productCollection.init();
			this.gridLifecycle.initData();
			this.fieldHintManager = new FieldHintManager(this.getContainer(), () => this.gridLifecycle.getGrid());
			main_core_events.EventEmitter.emit(window, 'EntityProductListController', [this]);
			this.initSupportCustomRowActions();
			this.subscribeDomEvents();
			this.subscribeCustomEvents();
			if (this.getSettingValue('isReserveBlocked', false)) {
				const headersToLock = ['STORE_INFO', 'RESERVE_INFO'];
				const container = this.getContainer();
				headersToLock.forEach(headerId => {
					const header = container?.querySelector(`.main-grid-cell-head[data-name="${headerId}"] .main-grid-cell-head-container`);
					if (header) {
						main_core.Dom.addClass(header, 'main-grid-cell-head-locked');
						header.onclick = event => {
							if (main_core.Dom.hasClass(event.target, 'ui-hint-icon')) {
								return;
							}
							this.openIntegrationLimitSlider();
						};
						const lock = main_core.Tag.render`<span class="crm-entity-product-list-locked-header"></span>`;
						header.insertBefore(lock, header.firstChild);
					}
				});
			}
			this.getContainer().querySelectorAll('.crm-entity-product-list-add-block').forEach(buttonBlock => {
				BX.UI.Hint.init(buttonBlock);
			});
		}
		subscribeDomEvents() {
			this.eventBindings.subscribeDom();
		}
		unsubscribeDomEvents() {
			this.eventBindings.unsubscribeDom();
		}
		subscribeCustomEvents() {
			this.eventBindings.subscribeCustom();
		}
		unsubscribeCustomEvents() {
			this.eventBindings.unsubscribeCustom();
		}
		initSupportCustomRowActions() {
			this.gridLifecycle.getGrid()._clickOnRowActionsButton = () => {};
		}
		selectViewedProductInRow(id, productId) {
			if (!main_core.Type.isStringFilled(id) || main_core.Text.toNumber(productId) <= 0) {
				return;
			}
			requestAnimationFrame(() => {
				const productSelector = this.getProductSelector(id);
				if (productSelector) {
					productSelector.onProductSelect(productId);
				}
			});
		}
		selectProductInRow(id, productId) {
			if (!main_core.Type.isStringFilled(id) || main_core.Text.toNumber(productId) <= 0) {
				return;
			}
			requestAnimationFrame(() => {
				const productSelector = this.getProductSelector(id);
				if (productSelector) {
					productSelector.searchInput?.clearErrors();
					productSelector.onProductSelect(productId);
				}
			});
		}
		changeActivePanelButtons(panelCode) {
			const container = this.getContainer();
			if (!container) {
				return null;
			}
			const activePanel = container.querySelector('.crm-entity-product-list-add-block-' + panelCode);
			if (main_core.Type.isElementNode(activePanel)) {
				main_core.Dom.removeClass(activePanel, 'crm-entity-product-list-add-block-hidden');
				main_core.Dom.addClass(activePanel, 'crm-entity-product-list-add-block-active');
			}
			const hiddenPanelCode = panelCode === 'top' ? 'bottom' : 'top';
			const removePanel = container.querySelector('.crm-entity-product-list-add-block-' + hiddenPanelCode);
			if (main_core.Type.isElementNode(removePanel)) {
				main_core.Dom.addClass(removePanel, 'crm-entity-product-list-add-block-hidden');
				main_core.Dom.removeClass(removePanel, 'crm-entity-product-list-add-block-active');
			}
			return activePanel;
		}
		reloadGrid(useProductsFromRequest = true) {
			this.gridLifecycle.reload(useProductsFromRequest);
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
		canEditCatalogPrice() {
			return this.getSettingValue('allowCatalogPriceEdit', false) === true;
		}
		isAllowReservation() {
			return this.getSettingValue('allowReservation', false) === true;
		}
		getDefaultDateReservation() {
			return this.getSettingValue('defaultDateReservation');
		}
		canSaveCatalogPrice() {
			return this.getSettingValue('allowCatalogPriceSave', false) === true;
		}
		enableEdit() {
			const rows = this.gridLifecycle.getGrid().getRows().getRows();
			rows.forEach(current => {
				if (!current.isHeadChild() && !current.isTemplate()) {
					current.edit();
				}
			});
		}
		addFirstRowIfEmpty() {
			if (this.gridLifecycle.getGrid().getRows().getCountDisplayed() === 0) {
				requestAnimationFrame(() => this.addProductRow());
			}
		}
		clearEditor() {
			this.productCollection.unsubscribeAll();
			this.productCollection.reset();
			this.destroySettingsPopup();
			this.unsubscribeDomEvents();
			this.unsubscribeCustomEvents();
			const container = this.getContainer();
			if (container) {
				main_core.Event.unbindAll(container);
			}
		}
		wasProductsInitiated() {
			return this.productCollection.productsAreInitiated;
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
		isLocationDependantTaxesEnabled() {
			return this.getSettingValue('isLocationDependantTaxesEnabled', false);
		}
		getLocationId() {
			return this.getSettingValue('locationId');
		}
		setLocationId(locationId) {
			this.setSettingValue('locationId', locationId);
		}
		changeCurrencyId(currencyId) {
			this.currencyManager.change(currencyId);
		}
		getDataFieldName() {
			return this.getSettingValue('dataFieldName', '');
		}
		getDataSettingsFieldName() {
			const field = this.getDataFieldName();
			return main_core.Type.isStringFilled(field) ? field + '_SETTINGS' : '';
		}
		getDiscountEnabled() {
			return this.getSettingValue('enableDiscount', 'N');
		}
		isDiscountEnabled() {
			return this.getDiscountEnabled() === 'Y';
		}
		getPricePrecision() {
			return this.getSettingValue('pricePrecision', DEFAULT_PRECISION);
		}
		getCalculationPricePrecision() {
			return this.getSettingValue('calculationPricePrecision', DEFAULT_PRECISION);
		}
		getQuantityPrecision() {
			return this.getSettingValue('quantityPrecision', DEFAULT_PRECISION);
		}
		getCommonPrecision() {
			return this.getSettingValue('commonPrecision', DEFAULT_PRECISION);
		}
		getTaxList() {
			return this.getSettingValue('taxList', []);
		}
		getTaxAllowed() {
			return this.getSettingValue('allowTax', 'N');
		}
		isTaxAllowed() {
			return this.getTaxAllowed() === 'Y';
		}
		getTaxEnabled() {
			return this.getSettingValue('enableTax', 'N');
		}
		isTaxEnabled() {
			return this.getTaxEnabled() === 'Y';
		}
		isTaxUniform() {
			return this.getSettingValue('taxUniform', true);
		}
		getMeasures() {
			return this.getSettingValue('measures', []);
		}
		getDefaultMeasure() {
			return this.getSettingValue('defaultMeasure', {});
		}
		getRowIdPrefix() {
			return this.getSettingValue('rowIdPrefix', 'crm_entity_product_list_');
		}
		parseInt(value, defaultValue = 0) {
			return parseIntValue(value, defaultValue);
		}
		parseFloat(value, precision = DEFAULT_PRECISION, defaultValue = 0.0) {
			return parseFloatValue(value, precision, defaultValue);
		}
		getContainer() {
			return this.cache.remember('container', () => {
				return document.getElementById(this.getContainerId());
			});
		}
		setForm(form) {
			this.formManager.set(form);
		}
		removeFormFields() {
			this.formManager.removeFields();
		}
		getProductCount() {
			return this.productCollection.count();
		}
		handleProductErrorsChange() {
			if (this.childrenHasErrors()) {
				this.controller.disableSaveButton();
			}
		}
		childrenHasErrors() {
			return this.productCollection.products.filter(product => product.getModel().getErrorCollection().hasErrors()).length > 0;
		}
		getFieldCodeByGridCell(row, cell) {
			if (!main_core.Type.isElementNode(row) || !main_core.Type.isElementNode(cell)) {
				return null;
			}
			const grid = this.gridLifecycle.getGrid();
			if (grid) {
				const headRow = grid.getRows().getHeadFirstChild();
				const index = [...row.cells].indexOf(cell);
				return headRow.getCellNameByCellIndex(index);
			}
			return null;
		}
		addProductRow(anchorProduct = null) {
			const row = this.gridLifecycle.createProductRow();
			const newId = row.getId();
			if (anchorProduct) {
				const anchorRowNode = this.gridLifecycle.getGrid().getRows().getById(anchorProduct.getField('ID'))?.getNode();
				if (anchorRowNode) {
					anchorRowNode.parentNode.insertBefore(row.getNode(), anchorRowNode.nextSibling);
				}
			}
			this.initializeNewProductRow(newId, anchorProduct);
			this.gridLifecycle.getGrid().bindOnRowEvents();
			return newId;
		}
		destroySettingsPopup() {
			if (this.cache.has('settings-popup')) {
				this.cache.get('settings-popup').getPopup().destroy();
				this.cache.delete('settings-popup');
			}
		}
		getSettingsPopup() {
			return this.cache.remember('settings-popup', () => {
				return new SettingsPopup(this.getContainer().querySelector('.crm-entity-product-list-add-block-active [data-role="product-list-settings-button"]'), this.getSettingValue('popupSettings', []), this);
			});
		}
		getHintPopup() {
			return this.cache.remember('hint-popup', () => {
				return new HintPopup(this);
			});
		}
		handleDeleteRow(rowId, event) {
			event.preventDefault();
			this.deleteRow(rowId);
		}
		initializeNewProductRow(newId, anchorProduct = null) {
			let fields = anchorProduct?.getFields();
			if (main_core.Type.isNil(fields)) {
				fields = {
					...this.getSettingValue('templateItemFields', {}),
					...{
						CURRENCY: this.getCurrencyId()
					}
				};
				const lastItem = this.productCollection.products[this.productCollection.products.length - 1];
				if (lastItem) {
					fields.TAX_INCLUDED = lastItem.getField('TAX_INCLUDED');
				}
			}
			const rowId = this.getRowIdPrefix() + newId;
			fields.ID = newId;
			if (main_core.Type.isObject(fields.IMAGE_INFO)) {
				delete fields.IMAGE_INFO.input;
			}
			delete fields.RESERVE_ID;
			const isReserveBlocked = this.getSettingValue('isReserveBlocked', false);
			const isInventoryManagementToolEnabled = this.getSettingValue('isInventoryManagementToolEnabled', false);
			const inventoryManagementMode = this.getSettingValue('inventoryManagementMode', null);
			const settings = {
				isReserveBlocked,
				isInventoryManagementToolEnabled,
				inventoryManagementMode,
				selectorId: 'crm_grid_' + rowId
			};
			const product = new Row(rowId, fields, settings, this);
			product.refreshFieldsLayout();
			if (anchorProduct instanceof Row) {
				const collectionProducts = this.productCollection.products;
				collectionProducts.splice(1 + collectionProducts.indexOf(anchorProduct), 0, product);
				product.getSelector()?.reloadFileInput();
				product.getSelector()?.layout();
				product.updateUiMeasure(product.getField('MEASURE_CODE'), main_core.Text.encode(product.getField('MEASURE_NAME')));
				if (!this.canEditCatalogPrice() && product.getModel().isCatalogExisted() && main_core.Type.isNumber(fields.CATALOG_PRICE)) {
					product.changeBasePrice(fields.CATALOG_PRICE);
				}
				if (!this.isAllowReservation()) {
					product.setField('DATE_RESERVE_END', this.getDefaultDateReservation());
					product.setField('STORE_ID', null);
					product.resetReserveFields();
				}
			} else if (this.getSettingValue('newRowPosition') === 'bottom') {
				this.productCollection.products.push(product);
			} else {
				this.productCollection.products.unshift(product);
			}
			this.productCollection.refreshSort();
			this.productCollection.numerate();
			product.updateUiCurrencyFields();
			this.totalsService.updateUiCurrency();
			const enableEmptyProductError = this.getSettingValue('enableEmptyProductError', false);
			if (enableEmptyProductError) {
				this.armEmptyProductErrorOnDialogHide(product);
			}
			return product;
		}
		armEmptyProductErrorOnDialogHide(product) {
			const selector = product.getSelector();
			const dialog = selector?.searchInput?.getDialog?.();
			if (!dialog || typeof dialog.subscribeOnce !== 'function') {
				return;
			}
			dialog.subscribeOnce('onHide', () => {
				selector.setConfig('ENABLE_EMPTY_PRODUCT_ERROR', true);
				setTimeout(() => {
					if (selector.inProcess?.()) {
						return;
					}
					const model = selector.getModel?.();
					if (model && model.isEmpty?.()) {
						model.getErrorCollection().setError('NOT_SELECTED_PRODUCT', selector.getEmptySelectErrorMessage());
						selector.layoutErrors();
					}
				}, 200);
			});
		}
		isTaxIncludedActive() {
			return this.productCollection.products.filter(product => product.isTaxIncluded()).length > 0;
		}
		getProductSelector(newId) {
			return catalog_productSelector.ProductSelector.getById('crm_grid_' + this.getRowIdPrefix() + newId);
		}
		focusProductSelector(newId) {
			requestAnimationFrame(() => {
				this.getProductSelector(newId)?.searchInDialog().focusName();
			});
		}
		compileProductData() {
			this.productDataSerializer.compile();
		}
		executeActions(actions) {
			if (!main_core.Type.isArrayFilled(actions)) {
				return;
			}
			const disableSaveButton = actions.filter(action => action.type === 'total' || action.type === 'disableSaveButton').length > 0;
			for (const item of actions) {
				if (!main_core.Type.isPlainObject(item) || !main_core.Type.isStringFilled(item.type)) {
					continue;
				}
				switch (item.type) {
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
		actionSendProductChange(item, disableSaveButton) {
			if (!main_core.Type.isStringFilled(item.id)) {
				return;
			}
			const product = this.productCollection.findByRowId(item.id);
			if (!product) {
				return;
			}
			main_core_events.EventEmitter.emit(this, 'ProductList::onChangeFields', {
				rowId: item.id,
				productId: product.getField('PRODUCT_ID'),
				fields: product.getCatalogFields()
			});
			if (this.controller) {
				this.controller.productChange(disableSaveButton);
				this.setGridChanged(true);
			}
		}
		actionSendProductListChanged(disableSaveButton = false) {
			if (this.controller) {
				this.controller.productChange(disableSaveButton);
				this.setGridChanged(true);
			}
		}
		actionUpdateListField(item) {
			if (!main_core.Type.isStringFilled(item.field) || !('value' in item)) {
				return;
			}
			if (!this.allowUpdateListField(item.field)) {
				return;
			}
			this.updateFieldForList = item.field;
			for (const row of this.productCollection.products) {
				row.updateFieldByName(item.field, item.value);
			}
			this.updateFieldForList = null;
		}
		actionUpdateTotalData(options = {}) {
			this.totalsService.scheduleUpdate(options);
		}
		actionSendStatusChange(item) {
			if (!('value' in item)) {
				return;
			}
			if (this.stateChange.changed === item.value) {
				return;
			}
			this.stateChange.changed = item.value;
			if (this.stateChange.sended) {
				return;
			}
			this.stateChange.sended = true;
		}
		allowUpdateListField(field) {
			if (this.updateFieldForList !== null) {
				return false;
			}
			let result = true;
			switch (field) {
				case 'TAX_INCLUDED':
					result = this.isTaxUniform() && this.isTaxAllowed();
					break;
			}
			return result;
		}
		setGridChanged(changed) {
			this.isChangedGrid = changed;
		}
		isChanged() {
			return this.isChangedGrid;
		}
		getProductsFields(fields = []) {
			const productFields = [];
			for (const item of this.productCollection.products) {
				productFields.push(item.getFields(fields));
			}
			return productFields;
		}
		validateSubmit() {
			return new Promise((resolve, reject) => {
				const currentBalloon = BX.UI.Notification.Center.getBalloonByCategory(catalog_productModel.ProductModel.SAVE_NOTIFICATION_CATEGORY);
				if (currentBalloon) {
					main_core_events.EventEmitter.subscribeOnce(currentBalloon, BX.UI.Notification.Event.getFullName('onClose'), () => {
						setTimeout(resolve, 500);
					});
					currentBalloon.close();
				} else {
					setTimeout(resolve, 50);
				}
			});
		}
		deleteRow(rowId, skipActions = false) {
			if (!main_core.Type.isStringFilled(rowId)) {
				return;
			}
			const gridRow = this.gridLifecycle.getGrid().getRows().getById(rowId);
			if (gridRow) {
				main_core.Dom.remove(gridRow.getNode());
				this.gridLifecycle.getGrid().getRows().reset();
			}
			const productRow = this.productCollection.findById(rowId);
			if (productRow) {
				const products = this.productCollection.products;
				const index = products.indexOf(productRow);
				if (index > -1) {
					products.splice(index, 1);
					this.productCollection.refreshSort();
					this.productCollection.numerate();
				}
			}
			main_core_events.EventEmitter.emit('Grid::thereEditedRows', []);
			if (!skipActions) {
				this.addFirstRowIfEmpty();
				this.executeActions([{
					type: this.actions.productListChanged
				}, {
					type: this.actions.updateTotal
				}]);
			}
		}
		copyRow(row) {
			this.addProductRow(row);
			this.productCollection.refreshSort();
			this.productCollection.numerate();
			main_core_events.EventEmitter.emit('Grid::thereEditedRows', []);
			this.executeActions([{
				type: this.actions.productListChanged
			}, {
				type: this.actions.updateTotal
			}]);
		}
		handleOnTabShow() {
			if (!this.isVisible()) {
				this.productCollection.products.forEach(product => {
					product.getSelector()?.layout();
					product.initHandlersForSelectors();
				});
			}
			main_core_events.EventEmitter.emit('onDemandRecalculateWrapper', [this]);
			this.isVisibleGrid = true;
		}
		isVisible() {
			return this.isVisibleGrid;
		}
		showFieldTourHint(fieldName, tourData, endTourHandler, addictedFields = [], rowId = '') {
			const products = this.productCollection.products;
			if (products.length > 0) {
				let productNode = products[0].getNode();
				const targetProduct = this.productCollection.findByRowId(rowId);
				if (targetProduct) {
					productNode = targetProduct.getNode();
				}
				const addictedNodes = [];
				for (const fName of addictedFields) {
					const fieldNode = productNode.querySelector(`[data-name="${fName}"]`);
					if (fieldNode !== null) {
						addictedNodes.push(fieldNode);
					}
				}
				const fieldNode = productNode.querySelector(`[data-name="${fieldName}"]`);
				if (fieldNode !== null) {
					this.fieldHintManager.processFieldTour(fieldNode, tourData, endTourHandler, addictedNodes);
				}
			}
		}
		getActiveHint() {
			return this.fieldHintManager.getActiveHint();
		}
		openIntegrationLimitSlider() {
			top.BX.UI.InfoHelper.show('limit_store_crm_integration');
			const helperSlider = top.BX.UI.InfoHelper.getSlider();
			top.BX.Event.EventEmitter.subscribeOnce('SidePanel.Slider:onCloseComplete', event => {
				const slider = event.getData()[0]?.getSlider();
				if (slider !== helperSlider) {
					return;
				}
				window.location.search += '&active_tab=tab_products';
			});
		}
		openInventoryManagementToolDisabledSlider() {
			main_core.Runtime.loadExtension('catalog.tool-availability-manager').then(exports => {
				const {
					ToolAvailabilityManager
				} = exports;
				ToolAvailabilityManager.openInventoryManagementToolDisabledSlider();
			});
		}
		getRestrictedProductTypes() {
			return this.getSettingValue('restrictedProductTypes', []);
		}
	}

	exports.Editor = Editor;
	exports.PageEventsManager = PageEventsManager;

})(this.BX.Crm.Entity.ProductList = this.BX.Crm.Entity.ProductList || {}, BX, BX, BX.Event, BX.Catalog, BX.UI, BX, BX.Catalog, BX.Catalog, BX.Catalog.Store, BX.Main, BX.Catalog, BX.Currency, BX.UI.Tour, BX, BX.Catalog, BX);
//# sourceMappingURL=script.js.map
