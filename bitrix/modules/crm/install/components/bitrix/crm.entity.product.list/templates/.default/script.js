/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Entity = this.BX.Crm.Entity || {};
(function (exports, ui_designTokens, main_core, main_core_events, catalog_productCalculator, currency_currencyCore, ui_hint, ui_notification, main_popup, catalog_productModel, catalog_storeSelector, catalog_productSelector, pull_client, ui_tour, spotlight, catalog_toolAvailabilityManager, catalog_storeEnableWizard) {
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

	class ReserveControl {
		static INPUT_NAME = 'INPUT_RESERVE_QUANTITY';
		static VIEW_NAME = 'VIEW_RESERVE_QUANTITY';
		static DATE_NAME = 'DATE_RESERVE_END';
		static QUANTITY_NAME = 'QUANTITY';
		static DEDUCTED_QUANTITY_NAME = 'DEDUCTED_QUANTITY';
		#row = null;
		#cache = new main_core.Cache.MemoryCache();
		isReserveEqualProductQuantity = true;
		wrapper = null;
		constructor(options) {
			this.#row = options.row;
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
			this.isReserveEqualProductQuantity = options.isReserveEqualProductQuantity && (this.getReservedQuantity() === this.getQuantity() || this.#row.isNewRow());
		}
		renderTo(node) {
			this.wrapper = node;
			main_core.Dom.append(main_core.Tag.render`<div>${this.#getReserveInputNode()}</div>`, this.wrapper);
			main_core.Event.bind(this.#getReserveInputNode().querySelector('input'), 'input', main_core.Runtime.debounce(this.onReserveInputChange, 800, this));
			if (!this.#isInventoryManagementMode1C()) {
				if (this.getReservedQuantity() > 0 || this.isReserveEqualProductQuantity) {
					this.#layoutDateReservation(this.getDateReservation());
				}
				main_core.Dom.append(this.#getDateNode(), this.wrapper);
				main_core.Event.bind(this.#getDateNode(), 'click', ReserveControl.#onDateInputClick.bind(this));
				main_core.Event.bind(this.#getDateNode().querySelector('input'), 'change', this.onDateChange.bind(this));
			}
		}
		setReservedQuantity(value, isTriggerEvent) {
			const input = this.#getReserveInputNode().querySelector('input');
			if (input) {
				input.value = value;
				if (isTriggerEvent) {
					input.dispatchEvent(new window.Event('input'));
				}
			}
		}
		getReservedQuantity() {
			return main_core.Text.toNumber(this.#row.getField(this.inputFieldName));
		}
		getDateReservation() {
			return this.#row.getField(this.dateFieldName) || '';
		}
		getQuantity() {
			return main_core.Text.toNumber(this.#row.getField(this.quantityFieldName));
		}
		getDeductedQuantity() {
			return main_core.Text.toNumber(this.#row.getField(this.deductedQuantityFieldName));
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
				this.#showNotify('reserveCountError', 'CRM_ENTITY_PL_IS_LESS_QUANTITY_WITH_DEDUCTED_THEN_RESERVED');
				value = this.getAvailableQuantity();
				this.setReservedQuantity(value);
			} else if (value < 0) {
				this.#showNotify('reserveNegativeCountError', 'CRM_ENTITY_PL_IS_NEGATIVE_INPUT_RESERVE');
				value = 0;
				this.setReservedQuantity(value);
			}
			if (value > 0) {
				const dateReservation = this.getDateReservation();
				if (dateReservation === '') {
					this.changeDateReservation(this.defaultDateReservation);
				} else {
					this.#layoutDateReservation(dateReservation);
				}
			} else if (value <= 0) {
				this.changeDateReservation();
			}
			this.setReservedQuantity(value, false);
			this.#row.updateField(this.inputFieldName, value);
		}
		clearCache() {
			this.#cache.delete('dateInput');
			this.#cache.delete('reserveInput');
		}
		isInputDisabled() {
			if (this.isBlocked || !this.isInventoryManagementToolEnabled) {
				return true;
			}
			const model = this.#row.getModel();
			if (model) {
				return model.isSimple() || model.isService();
			}
			return false;
		}
		static #onDateInputClick(event) {
			BX.calendar({
				node: event.target,
				field: event.target.parentNode.querySelector('input'),
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
				this.#showNotify('reserveDateError', 'CRM_ENTITY_PL_DATE_IN_PAST');
				this.changeDateReservation(this.defaultDateReservation);
			}
		}
		#getDateNode() {
			return this.#cache.remember('dateInput', () => {
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
		#getReserveInputNode() {
			return this.#cache.remember('reserveInput', () => {
				const viewReserveNode = this.#isInventoryManagementMode1C() ? main_core.Tag.render`
						<span>
							<span data-name="${this.viewName}">
								${this.getReservedQuantity()}
							</span>
							&nbsp;
							${main_core.Text.encode(this.#row.getMeasureName())}
						</span>
					` : null;
				const tag = main_core.Tag.render`
				<div ${this.isInputDisabled() ? 'class="crm-entity-product-list-locked-field-wrapper"' : ''}>
					${viewReserveNode}
					<input type="${this.#isInventoryManagementMode1C() ? 'hidden' : 'text'}"
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
				this.#row.updateField(this.dateFieldName, date);
			}
			this.#layoutDateReservation(date);
		}
		#layoutDateReservation(date = '') {
			const linkText = date === '' ? '' : main_core.Loc.getMessage('CRM_ENTITY_PL_RESERVED_DATE', {
				'#FINAL_RESERVATION_DATE#': date
			});
			const link = this.#getDateNode().querySelector('a');
			if (link) {
				link.innerText = linkText;
			}
			const hiddenInput = this.#getDateNode().querySelector('input');
			if (hiddenInput) {
				hiddenInput.value = date;
			}
		}
		disable(wrapper) {
			const node = wrapper || this.wrapper;
			if (node) {
				node.innerHTML = this.getReservedQuantity() + ' ' + main_core.Text.encode(this.measureName);
			}
		}
		#isInventoryManagementMode1C() {
			return this.inventoryManagementMode === catalog_storeEnableWizard.ModeList.MODE_1C;
		}
		#showNotify(notifyId, messageId) {
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
		#rowId;
		#model;
		#inventoryManagementMode;
		#node;
		#popup;
		constructor(options) {
			this.#rowId = options.rowId;
			this.#model = options.model;
			this.#inventoryManagementMode = options.inventoryManagementMode;
			this.setNode(options.node);
		}
		setNode(node) {
			this.#node = node;
			main_core.Dom.addClass(this.#node, 'store-available-popup-link');
			main_core.Event.bind(this.#node, 'click', this.togglePopup.bind(this));
		}
		#createPopup() {
			const popupId = `store-available-popup-row-${this.#rowId}`;
			const popup = main_popup.PopupManager.getPopupById(popupId);
			if (popup) {
				this.#popup = popup;
				this.#popup.setBindElement(this.#node);
				this.#popup.setContent(this.getPopupContent());
			} else {
				this.#popup = main_popup.PopupManager.create({
					id: popupId,
					bindElement: this.#node,
					autoHide: true,
					draggable: false,
					offsetLeft: -218,
					offsetTop: 0,
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
			}
		}
		getPopupContent() {
			const storeId = this.#model.getField('STORE_ID');
			const storeCollection = this.#model.getStoreCollection();
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
			const isReservedQuantityLink = reservedQuantity > 0 && this.#inventoryManagementMode !== catalog_storeEnableWizard.ModeList.MODE_1C;
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
			const storeId = this.#model.getField('STORE_ID');
			const productId = this.#model.getField('PRODUCT_ID');
			const sliderLink = new main_core.Uri(reservedDealsSliderLink);
			sliderLink.setQueryParam('productId', productId);
			sliderLink.setQueryParam('storeId', storeId);
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				allowChangeHistory: false,
				cacheable: false
			});
		}
		togglePopup() {
			if (this.#popup) {
				if (this.#popup.isShown()) {
					this.#popup.close();
				} else {
					this.#popup.setContent(this.getPopupContent());
					this.#popup.show();
				}
			} else {
				this.#createPopup();
				this.#popup.show();
			}
		}
	}

	class MoneyControl {
		constructor(options) {
			this.node = options.node;
			this.hint = options.hint;
		}
		enable() {
			this.node.removeAttribute('disabled');
			this.node.removeAttribute('data-hint-no-icon');
			this.node.removeAttribute('data-hint');
			this.node.classList.remove('ui-ctl-element');
			const currencyBlock = this.node.querySelector('.main-grid-editor-money-currency');
			if (currencyBlock) {
				currencyBlock.classList.add('main-dropdown');
				currencyBlock.dataset.disabled = false;
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
				currencyBlock.dataset.disabled = true;
			}
			if (this.hint) {
				this.node.setAttribute('data-hint-no-icon', '');
				this.node.setAttribute('data-hint', this.hint);
				BX.UI.Hint.init(this.node.parentNode);
			}
		}
	}

	const MODE_EDIT = 'EDIT';
	const MODE_SET = 'SET';
	const enableImageInputCache = new Map();
	class Row {
		static CATALOG_PRICE_CHANGING_DISABLED = 'CATALOG_PRICE_CHANGING_DISABLED';
		fields = {};
		externalActions = [];
		handleChangeStoreData = this.#onChangeStoreData.bind(this);
		handleProductErrorsChange = main_core.Runtime.debounce(this.#onProductErrorsChange, 500, this);
		handleMainSelectorClear = main_core.Runtime.debounce(this.#onMainSelectorClear.bind(this), 500, this);
		handleStoreFieldChange = main_core.Runtime.debounce(this.#onStoreFieldChange.bind(this), 500, this);
		handleStoreFieldClear = main_core.Runtime.debounce(this.#onStoreFieldClear.bind(this), 500, this);
		cache = new main_core.Cache.MemoryCache();
		modeChanges = {
			EDIT: MODE_EDIT,
			SET: MODE_SET
		};
		constructor(id, fields, settings, editor) {
			this.setId(id);
			this.setSettings(settings);
			this.setEditor(editor);
			this.setModel(fields, settings);
			this.setFields(fields);
			this.#initActions();
			this.#initSelector();
			this.#initStoreSelector();
			this.#initStoreAvailablePopup();
			this.#initReservedControl();
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
				return this.getEditorContainer().querySelector('[data-id="' + rowId + '"]');
			});
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
			});
			this.getNode().querySelectorAll('select').forEach(node => {
				main_core.Event.bind(node, 'change', editor.changeProductFieldHandler);
				// disable drag-n-drop events for select fields
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
					// disable drag-n-drop events for select fields
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
		#initActions() {
			if (this.getEditor().isReadOnly() || this.isRestrictedStoreInfo()) {
				return;
			}
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
						text: main_core.Loc.getMessage('CRM_ENTITY_PL_COPY'),
						onclick: this.handleCopyAction.bind(this),
						disabled: this.editor.getSettingValue('disabledSelectProductInput')
					}, {
						text: main_core.Loc.getMessage('CRM_ENTITY_PL_DELETE'),
						onclick: this.handleDeleteAction.bind(this),
						disabled: this.getModel().isEmpty() && this.getEditor().products.length <= 1
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
			const priceNode = this.#getNodeChildByDataName('PRICE');
			if (!priceNode) {
				return;
			}
			const control = new MoneyControl({
				node: priceNode,
				hint: main_core.Loc.getMessage('CRM_ENTITY_PL_PRICE_CHANGING_RESTRICTED')
			});
			if (!this.#isEditableCatalogPrice()) {
				control.disable();
			} else {
				control.enable();
			}
		}
		modifyQuantityInput() {
			if (!this.isRestrictedStoreInfo()) {
				return;
			}
			const countField = this.#getNodeChildByDataName('QUANTITY');
			if (countField) {
				const control = new MoneyControl({
					node: countField,
					hint: main_core.Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_RESTRICTED_BY_STORE')
				});
				control.disable();
			}
		}
		#isEditableCatalogPrice() {
			return this.editor.canEditCatalogPrice() || !this.getModel().isCatalogExisted() || this.getModel().isNew();
		}
		#isSaveableCatalogPrice() {
			return this.getModel().isCatalogExisted() && this.getModel().isNew();
		}
		#initSelector() {
			const id = 'crm_grid_' + this.getId();
			const enableImageInput = this.editor.getSettingValue('enableSelectProductImageInput', true);
			this.mainSelector = catalog_productSelector.ProductSelector.getById(id);
			if (!this.mainSelector) {
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
				if (enableImageInput !== enableImageInputCache[id]) {
					this.mainSelector.setConfig('ENABLE_IMAGE_INPUT', enableImageInput);
					if (enableImageInput) {
						this.mainSelector.layoutImage();
					}
				}
			}
			enableImageInputCache[id] = enableImageInput;
			if (this.isRestrictedStoreInfo()) {
				this.mainSelector.setMode(catalog_productSelector.ProductSelector.MODE_VIEW);
			}
			const mainInfoNode = this.#getNodeChildByDataName('MAIN_INFO');
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
				this.mainSelector.skuTreeInstance = null;
				if (this.editor.isVisible()) {
					this.mainSelector.renderTo(selectorWrapper);
				} else {
					this.mainSelector.wrapper = selectorWrapper;
				}
			}
			main_core_events.EventEmitter.subscribe(this.mainSelector, 'onClear', this.handleMainSelectorClear);
		}
		#onMainSelectorClear() {
			this.updateField('OFFER_ID', 0);
			this.updateField('PRODUCT_NAME', '');
			this.updateUiStoreAmountData();
			this.updateField('DEDUCTED_QUANTITY', 0);
			this.updateField('ROW_RESERVED', 0);
		}
		#initStoreSelector() {
			if (!this.editor.getSettingValue('allowReservation', true)) {
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
				this.storeSelector.searchInput.disable(main_core.Loc.getMessage('CRM_ENTITY_PL_ROW_UPDATE_STORE_RESTRICTED_BY_STORE'));
			}
			this.layoutStoreSelector();
		}
		layoutStoreSelector() {
			const storeWrapper = this.#getNodeChildByDataName('STORE_INFO');
			if (this.storeSelector && storeWrapper) {
				storeWrapper.innerHTML = '';
				if (this.#needStoreSelectorInput()) {
					this.storeSelector.renderTo(storeWrapper);
					if (this.isReserveBlocked()) {
						this.#applyStoreSelectorRestrictionTweaks();
					} else if (!this.isInventoryManagementToolEnabled()) {
						this.#applyStoreSelectorToolAvailabilityTweaks();
					}
				}
			}
		}
		#initStoreAvailablePopup() {
			const storeAvaiableNode = this.#getNodeChildByDataName('STORE_AVAILABLE');
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
		#applyStoreSelectorRestrictionTweaks() {
			const storeSearchInput = this.storeSelector.searchInput;
			if (!storeSearchInput || !storeSearchInput.getNameInput()) {
				return;
			}
			storeSearchInput.toggleIcon(this.storeSelector.searchInput.getSearchIcon(), 'none');
			storeSearchInput.getNameInput().disabled = true;
			main_core.Dom.addClass(storeSearchInput.getNameInput(), 'crm-entity-product-list-locked-field');
			if (this.storeSelector.getWrapper()) {
				main_core.Dom.addClass(this.storeSelector.getWrapper(), 'crm-entity-product-list-locked-field-wrapper');
				main_core.Event.bind(this.storeSelector.getWrapper(), 'click', () => {
					this.editor.openIntegrationLimitSlider();
				});
			}
		}
		#applyStoreSelectorToolAvailabilityTweaks() {
			const storeSearchInput = this.storeSelector.searchInput;
			if (!storeSearchInput || !storeSearchInput.getNameInput()) {
				return;
			}
			storeSearchInput.toggleIcon(this.storeSelector.searchInput.getSearchIcon(), 'none');
			storeSearchInput.getNameInput().disabled = true;
			main_core.Dom.addClass(storeSearchInput.getNameInput(), 'crm-entity-product-list-locked-field');
			if (this.storeSelector.getWrapper()) {
				main_core.Dom.addClass(this.storeSelector.getWrapper(), 'crm-entity-product-list-locked-field-wrapper');
				main_core.Event.bind(this.storeSelector.getWrapper(), 'click', () => {
					this.editor.openInventoryManagementToolDisabledSlider();
				});
			}
		}
		#initReservedControl() {
			const storeWrapper = this.#getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.#getAllowedStores().length) {
				this.reserveControl = new ReserveControl({
					row: this,
					isReserveEqualProductQuantity: this.#isReserveEqualProductQuantity(),
					defaultDateReservation: this.editor.getSettingValue('defaultDateReservation'),
					isInventoryManagementToolEnabled: this.isInventoryManagementToolEnabled(),
					inventoryManagementMode: this.getInventoryManagementMode(),
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
					const isReserveEqualProductQuantity = this.#isReserveEqualProductQuantity() && this.reserveControl?.isReserveEqualProductQuantity;
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
		#onStoreFieldChange(event) {
			const data = event.getData();
			data.fields.forEach(item => {
				this.updateField(item.NAME, item.VALUE);
			});
			this.initHandlersForSelectors();
		}
		#onStoreFieldClear() {
			this.initHandlersForSelectors();
		}
		layoutReserveControl() {
			const storeWrapper = this.#getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.reserveControl) {
				storeWrapper.innerHTML = '';
				this.reserveControl.clearCache();
				if (this.#needReserveControlInput()) {
					if (this.isRestrictedStoreInfo()) {
						storeWrapper.innerHTML = this.reserveControl.getReservedQuantity() + ' ' + main_core.Text.encode(this.getMeasureName());
						return;
					}
					this.reserveControl.renderTo(storeWrapper);
				}
			}
		}
		clearReserveControl() {
			const storeWrapper = this.#getNodeChildByDataName('RESERVE_INFO');
			if (storeWrapper && this.reserveControl) {
				storeWrapper.innerHTML = '';
				this.reserveControl.clearCache();
			}
		}
		setRowNumber(number) {
			this.getNode().querySelectorAll('.main-grid-row-number').forEach(node => {
				node.textContent = number + '.';
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
		isEmptyDiscount() {
			if (this.isDiscountPercentage()) {
				return this.getDiscountRate() === 0;
			} else if (this.isDiscountMonetary()) {
				return this.getDiscountSum() === 0;
			} else if (this.isDiscountUndefined()) {
				return true;
			}
			return false;
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
			if (main_core.Type.isDomNode(taxNode) && taxNode.options[taxNode.selectedIndex]) {
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
				let taxRate = taxList.find(item => parseInt(item.ID) === parseInt(value));
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
		#onChangeStoreData() {
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
		}
		updateUiStoreAmountData() {
			const availableWrapper = this.#getNodeChildByDataName('STORE_AVAILABLE');
			if (!main_core.Type.isDomNode(availableWrapper)) {
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
				const availableWrapper = this.#getNodeChildByDataName(property);
				if (availableWrapper) {
					const value = this.model.getField('PRODUCT_PROPERTIES')[property] ?? '';
					availableWrapper.innerHTML = value;
				}
			}
		}
		clearPropertyFields() {
			const propNodes = this.#getNodesChild();
			propNodes.forEach(property => {
				property.innerHTML = '';
			});
		}
		setRowReserved(value) {
			this.setField('ROW_RESERVED', value);
			const reserveWrapper = this.#getNodeChildByDataName('ROW_RESERVED');
			if (!main_core.Type.isDomNode(reserveWrapper)) {
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
			const deductedWrapper = this.#getNodeChildByDataName('DEDUCTED_QUANTITY');
			if (!main_core.Type.isDomNode(deductedWrapper)) {
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
			for (const field in this.fields) {
				if (this.fields.hasOwnProperty(field) && !exceptFields.includes(field)) {
					this.updateUiField(field, this.fields[field]);
				}
			}
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

			// fill after change setting show pictures.
			const imageInfo = main_core.Type.isStringFilled(fields['IMAGE_INFO']) ? JSON.parse(fields['IMAGE_INFO']) : null;
			if (main_core.Type.isObject(imageInfo)) {
				this.model.getImageCollection().setPreview(imageInfo['preview']);
				this.model.getImageCollection().setEditInput(imageInfo['input']);
				this.model.getImageCollection().setMorePhotoValues(imageInfo['values']);
			}
			if (this.#isReserveEqualProductQuantity()) {
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
		#onProductErrorsChange() {
			this.getEditor().handleProductErrorsChange();
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
				if (this.reserveControl && this.#isReserveEqualProductQuantity() && this.#needReserveControlInput()) {
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
			if (mode === MODE_EDIT && !this.#isEditableCatalogPrice()) {
				value = this.getField('BASE_PRICE');
				this.updateUiInputField('PRICE', value.toFixed(this.getPricePrecision()));
				return;
			}
			const originalPrice = value;
			// price can't be less than zero
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
			this.#togglePriceHintPopup(originalPrice < 0 && originalPrice !== value);
		}
		#shouldShowSmallPriceHint() {
			return main_core.Text.toNumber(this.getField('PRICE')) > 0 && main_core.Text.toNumber(this.getField('PRICE')) < 1 && this.isDiscountPercentage() && (main_core.Text.toNumber(this.getField('DISCOUNT_SUM')) > 0 || main_core.Text.toNumber(this.getField('DISCOUNT_RATE')) > 0 || main_core.Text.toNumber(this.getField('DISCOUNT_ROW')) > 0);
		}
		#togglePriceHintPopup(showNegative = false) {
			if (this.#shouldShowSmallPriceHint()) {
				this.getHintPopup().load(this.getInputByFieldName('PRICE'), main_core.Loc.getMessage('CRM_ENTITY_PL_SMALL_PRICE_NOTICE')).show();
			} else if (showNegative) {
				this.getHintPopup().load(this.getInputByFieldName('PRICE'), main_core.Loc.getMessage('CRM_ENTITY_PL_NEGATIVE_PRICE_NOTICE')).show();
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
			const node = this.#getNodeChildByDataName('RESERVE_INFO');
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
			this.#togglePriceHintPopup();
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

		// controls
		getInputByFieldName(fieldName) {
			const fieldId = this.getUiFieldId(fieldName);
			let item = document.getElementById(fieldId);
			if (!main_core.Type.isElementNode(item)) {
				item = this.getNode().querySelector('[name="' + fieldId + '"]');
			}
			return item;
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
		updateUiDiscountTypeField(name, value) {
			const text = value === catalog_productCalculator.DiscountType.MONETARY ? this.getEditor().getCurrencyText() : '%';
			this.updateUiMoneyField(name, value, text);
		}
		getMoneyFieldDropdownApi(name) {
			if (!main_core.Reflection.getClass('BX.Main.dropdownManager')) {
				return null;
			}
			return BX.Main.dropdownManager.getById(this.getId() + '_' + name + '_control');
		}
		updateMoneyFieldUiWithDropdownApi(dropdown, value) {
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
		updateMoneyFieldUiManually(name, value, text) {
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
		updateUiMoneyField(name, value, text) {
			const dropdownApi = this.getMoneyFieldDropdownApi(name);
			if (dropdownApi) {
				this.updateMoneyFieldUiWithDropdownApi(dropdownApi, value);
			} else {
				this.updateMoneyFieldUiManually(name, value, text);
			}
		}
		updateUiMeasure(code, name) {
			this.updateUiMoneyField('MEASURE_CODE', code, name);
			this.updateUiStoreAmountData();
		}
		updateUiHtmlField(name, html) {
			const item = this.getNode().querySelector('[data-name="' + name + '"]');
			if (main_core.Type.isElementNode(item)) {
				item.innerHTML = html;
			}
		}
		updateUiCurrencyFields() {
			const currencyText = this.getEditor().getCurrencyText();
			const currencyId = '' + this.getEditor().getCurrencyId();
			const currencyFieldNames = ['PRICE_CURRENCY', 'SUM_CURRENCY', 'DISCOUNT_TYPE_ID', 'DISCOUNT_ROW_CURRENCY'];
			currencyFieldNames.forEach(name => {
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
					if (this.getDiscountType() === catalog_productCalculator.DiscountType.MONETARY) {
						this.updateMoneyFieldUiManually(name, catalog_productCalculator.DiscountType.MONETARY, currencyText);
					}
				} else {
					dropdownValues.push({
						NAME: currencyText,
						VALUE: currencyId
					});
					this.updateUiMoneyField(name, currencyId, currencyText);
				}
				main_core.Dom.attr(this.getInputByFieldName(name), 'data-items', dropdownValues);
			});
			this.updateUiField('TAX_SUM', this.getField('TAX_SUM'));
		}
		updateUiField(field, value) {
			const uiName = this.getUiFieldName(field);
			if (!uiName) {
				return;
			}
			const uiType = this.getUiFieldType(uiName);
			if (!uiType) {
				return;
			}
			if (!this.allowUpdateUiField(field)) {
				return;
			}
			switch (uiType) {
				case 'input':
					if (field === 'QUANTITY') {
						value = this.parseFloat(value, this.getQuantityPrecision());
					} else if (field === 'DISCOUNT_RATE') {
						value = this.parseFloat(value, this.getCommonPrecision());
					} else if (field === 'TAX_RATE') {
						value = main_core.Type.isNil(value) || value === '' ? '' : this.parseFloat(value, this.getCommonPrecision());
					} else if (value === 0) {
						value = '';
					} else if (main_core.Type.isNumber(value)) {
						value = this.parseFloat(value, this.getPricePrecision()).toFixed(this.getPricePrecision());
					}
					this.updateUiInputField(uiName, value);
					break;
				case 'checkbox':
					this.updateUiCheckboxField(uiName, value);
					break;
				case 'discount_type_field':
					this.updateUiDiscountTypeField(uiName, value);
					break;
				case 'html':
					this.updateUiHtmlField(uiName, value);
					break;
				case 'money_html':
					value = currency_currencyCore.CurrencyCore.currencyFormat(value, this.getEditor().getCurrencyId(), true);
					this.updateUiHtmlField(uiName, value);
					break;
			}
		}
		getUiFieldName(field) {
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
		getUiFieldType(field) {
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
		allowUpdateUiField(field) {
			let result = true;
			switch (field) {
				case 'PRICE_NETTO':
					result = this.isPriceNetto();
					break;
				case 'PRICE_BRUTTO':
					result = !this.isPriceNetto();
					break;
				case 'DISCOUNT_RATE':
					result = this.isDiscountPercentage();
					break;
				case 'DISCOUNT_SUM':
					result = this.isDiscountMonetary();
					break;
			}
			return result;
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
		addActionDisableSaveButton() {
			this.addExternalAction({
				type: this.getEditor().actions.disableSaveButton,
				id: this.getId()
			});
		}
		addActionUpdateFieldList(field, value) {
			this.addExternalAction({
				type: this.getEditor().actions.updateListField,
				field,
				value
			});
		}
		addActionStateChanged() {
			this.addExternalAction({
				type: this.getEditor().actions.stateChanged,
				value: true
			});
		}
		addActionStateReset() {
			this.addExternalAction({
				type: this.getEditor().actions.stateChanged,
				value: false
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
			if (this.onAfterExecuteExternalActions) {
				const callback = this.onAfterExecuteExternalActions;
				this.onAfterExecuteExternalActions = null;
				callback.call();
			}
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
			if (!this.editor.getSettingValue('allowReservation', true)) {
				return false;
			}
			const storeId = this.getField('STORE_ID')?.toString();
			if (main_core.Type.isNil(storeId) || storeId === '0') {
				return false;
			} else if (this.getModel().isSimple() || this.getModel().isService()) {
				return false;
			}
			return !this.#getAllowedStores().includes(storeId);
		}
		#getAllowedStores() {
			return this.editor.getSettingValue('allowedStores', []);
		}
		#isReserveEqualProductQuantity() {
			return this.editor.getSettingValue('isReserveEqualProductQuantity', false);
		}
		getMeasureName() {
			const measureName = main_core.Type.isStringFilled(this.model.getField('MEASURE_NAME')) ? this.model.getField('MEASURE_NAME') : this.editor.getDefaultMeasure()?.SYMBOL || '';
			return main_core.Text.encode(measureName);
		}
		#getNodeChildByDataName(name) {
			return this.getNode().querySelector(`[data-name="${name}"]`);
		}
		#getNodesChild() {
			return this.getNode().querySelectorAll(`span[data-name]`);
		}
		setType(value) {
			this.setField('TYPE', value);
			if (this.getModel().isService()) {
				this.clearReserveControl();
			}
		}
		#needReserveControlInput() {
			return !this.getModel().isSimple() && !this.getModel().isService();
		}
		#needStoreSelectorInput() {
			return !this.getModel().isSimple() && !this.getModel().isService();
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
		getSetting(id) {
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
			main_core.Event.bind(setting, 'change', this.#setSetting.bind(this));
			return setting;
		}
		#setSetting(event) {
			const settingItem = this.getSetting(event.target.dataset.settingId);
			if (!settingItem) {
				return;
			}
			const settingEnabled = event.target.checked;
			this.requestGridSettings(settingItem, settingEnabled);
		}
		requestGridSettings(setting, enabled) {
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
				let message;
				setting.checked = enabled;
				if (setting.id === 'ADD_NEW_ROW_TOP') {
					const panel = enabled ? 'top' : 'bottom';
					this.#editor.setSettingValue('newRowPosition', panel);
					const activePanel = this.#editor.changeActivePanelButtons(panel);
					const settingButton = activePanel.querySelector('[data-role="product-list-settings-button"]');
					this.getPopup().setBindElement(settingButton);
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED');
					message = message.replace('#NAME#', setting.title);
				} else if (setting.id === 'WAREHOUSE') {
					this.#editor.reloadGrid(false);
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_DISABLED');
				} else {
					this.#editor.reloadGrid();
					message = enabled ? main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED') : main_core.Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED');
					message = message.replace('#NAME#', setting.title);
				}
				this.getPopup().close();
				this.#showNotification(message, {
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
	const DEFAULT_PRECISION = 2;
	class Editor {
		ajaxPool = new Map();
		products = [];
		productsWasInitiated = false;
		isChangedGrid = false;
		isVisibleGrid = false;
		cache = new main_core.Cache.MemoryCache();
		#fieldHintManager;
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
		totalData = {
			inProgress: false
		};
		productSelectionPopupHandler = this.handleProductSelectionPopup.bind(this);
		productRowAddHandler = this.handleProductRowAdd.bind(this);
		showSettingsPopupHandler = this.handleShowSettingsPopup.bind(this);
		onDialogSelectProductHandler = this.handleOnDialogSelectProduct.bind(this);
		onAddViewedProductToDealHandler = this.handleOnAddViewedProductToDeal.bind(this);
		onSaveHandler = this.handleOnSave.bind(this);
		onFocusToProductList = this.handleProductListFocus.bind(this);
		onEntityUpdateHandler = this.handleOnEntityUpdate.bind(this);
		onEditorSubmit = this.handleEditorSubmit.bind(this);
		onInnerCancelHandler = this.handleOnInnerCancel.bind(this);
		onBeforeGridRequestHandler = this.handleOnBeforeGridRequest.bind(this);
		onGridUpdatedHandler = this.handleOnGridUpdated.bind(this);
		onGridRowMovedHandler = this.handleOnGridRowMoved.bind(this);
		onBeforeProductChangeHandler = this.handleOnBeforeProductChange.bind(this);
		onProductChangeHandler = this.handleOnProductChange.bind(this);
		onBeforeProductClearHandler = this.handleOnBeforeProductClear.bind(this);
		onProductClearHandler = this.handleOnProductClear.bind(this);
		dropdownChangeHandler = this.handleDropdownChange.bind(this);
		pullReloadGrid = null;
		changeProductFieldHandler = this.handleFieldChange.bind(this);
		updateTotalDataDelayedHandler = main_core.Runtime.debounce(this.updateTotalDataDelayed, 1000, this);
		constructor(id) {
			this.setId(id);
		}
		init(config = {}) {
			this.setSettings(config);
			if (this.canEdit()) {
				this.addFirstRowIfEmpty();
				this.enableEdit();
			}
			this.initForm();
			this.initProducts();
			this.initGridData();
			this.#fieldHintManager = new FieldHintManager(this.getContainer(), this.getGrid.bind(this));
			main_core_events.EventEmitter.emit(window, 'EntityProductListController', [this]);
			this.#initSupportCustomRowActions();
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
			this.unsubscribeDomEvents();
			const container = this.getContainer();
			if (main_core.Type.isElementNode(container)) {
				if (!this.getSettingValue('disabledSelectProductButton', false)) {
					container.querySelectorAll('[data-role="product-list-select-button"]').forEach(selectButton => {
						main_core.Event.bind(selectButton, 'click', this.productSelectionPopupHandler);
					});
				}
				if (!this.getSettingValue('disabledAddRowButton', false)) {
					container.querySelectorAll('[data-role="product-list-add-button"]').forEach(addButton => {
						if (this.getSettingValue('isOnecInventoryManagementRestricted') === true) {
							main_core.Dom.addClass(addButton, 'ui-btn-icon-lock');
						}
						main_core.Event.bind(addButton, 'click', this.productRowAddHandler);
					});
				}
				container.querySelectorAll('[data-role="product-list-settings-button"]').forEach(configButton => {
					main_core.Event.bind(configButton, 'click', this.showSettingsPopupHandler);
				});
			}
		}
		unsubscribeDomEvents() {
			const container = this.getContainer();
			if (main_core.Type.isElementNode(container)) {
				container.querySelectorAll('[data-role="product-list-select-button"]').forEach(selectButton => {
					main_core.Event.unbind(selectButton, 'click', this.productSelectionPopupHandler);
				});
				container.querySelectorAll('[data-role="product-list-add-button"]').forEach(addButton => {
					main_core.Event.unbind(addButton, 'click', this.productRowAddHandler);
				});
				container.querySelectorAll('[data-role="product-list-settings-button"]').forEach(configButton => {
					main_core.Event.unbind(configButton, 'click', this.showSettingsPopupHandler);
				});
			}
		}
		subscribeCustomEvents() {
			this.unsubscribeCustomEvents();
			main_core_events.EventEmitter.subscribe('CrmProductSearchDialog_SelectProduct', this.onDialogSelectProductHandler);
			main_core_events.EventEmitter.subscribe('onAddViewedProductToDeal', this.onAddViewedProductToDealHandler);
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onSave', this.onSaveHandler);
			main_core_events.EventEmitter.subscribe('onFocusToProductList', this.onFocusToProductList);
			main_core_events.EventEmitter.subscribe('onCrmEntityUpdate', this.onEntityUpdateHandler);
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditorAjax:onSubmit', this.onEditorSubmit);
			main_core_events.EventEmitter.subscribe('EntityProductListController:onInnerCancel', this.onInnerCancelHandler);
			main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.onBeforeGridRequestHandler);
			main_core_events.EventEmitter.subscribe('Grid::updated', this.onGridUpdatedHandler);
			main_core_events.EventEmitter.subscribe('Grid::rowMoved', this.onGridRowMovedHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onBeforeChange', this.onBeforeProductChangeHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onChange', this.onProductChangeHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onBeforeClear', this.onBeforeProductClearHandler);
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onClear', this.onProductClearHandler);
			main_core_events.EventEmitter.subscribe('Dropdown::change', this.dropdownChangeHandler);
			if (pull_client.PULL) {
				this.pullReloadGrid = pull_client.PULL.subscribe({
					moduleId: 'crm',
					callback: data => {
						if (data.command === 'onCatalogInventoryManagementEnabled' || data.command === 'onCatalogInventoryManagementDisabled') {
							this.reloadGrid(false);
						}
					}
				});
			}
		}
		unsubscribeCustomEvents() {
			main_core_events.EventEmitter.unsubscribe('CrmProductSearchDialog_SelectProduct', this.onDialogSelectProductHandler);
			main_core_events.EventEmitter.unsubscribe('onAddViewedProductToDeal', this.onAddViewedProductToDealHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.EntityEditor:onSave', this.onSaveHandler);
			main_core_events.EventEmitter.unsubscribe('onFocusToProductList', this.onFocusToProductList);
			main_core_events.EventEmitter.unsubscribe('onCrmEntityUpdate', this.onEntityUpdateHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.EntityEditorAjax:onSubmit', this.onEditorSubmit);
			main_core_events.EventEmitter.unsubscribe('EntityProductListController:onInnerCancel', this.onInnerCancelHandler);
			main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.onBeforeGridRequestHandler);
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.onGridUpdatedHandler);
			main_core_events.EventEmitter.unsubscribe('Grid::rowMoved', this.onGridRowMovedHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onBeforeChange', this.onBeforeProductChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onChange', this.onProductChangeHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onBeforeClear', this.onBeforeProductClearHandler);
			main_core_events.EventEmitter.unsubscribe('BX.Catalog.ProductSelector:onClear', this.onProductClearHandler);
			main_core_events.EventEmitter.unsubscribe('Dropdown::change', this.dropdownChangeHandler);
			if (!main_core.Type.isNil(this.pullReloadGrid)) {
				this.pullReloadGrid();
			}
		}
		#initSupportCustomRowActions() {
			this.getGrid()._clickOnRowActionsButton = () => {};
		}
		handleOnDialogSelectProduct(event) {
			const [productId] = event.getCompatData();
			let id;
			if (this.getProductCount() > 0 || this.products[0]?.getField('ID') <= 0) {
				id = this.addProductRow();
			} else {
				id = this.products[0]?.getField('ID');
			}
			this.selectProductInRow(id, productId);
		}
		handleOnAddViewedProductToDeal(event) {
			const [productId] = event.getCompatData();
			let id;
			if (this.getProductCount() > 0) {
				id = this.addProductRow();
			} else {
				id = this.products[0]?.getField('ID');
			}
			this.selectViewedProductInRow(id, productId);
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
					productSelector.searchInput.clearErrors();
					productSelector.onProductSelect(productId);
				}
			});
		}
		handleOnSave(event) {
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
		handleProductListFocus(event) {
			if (this.isReadOnly()) {
				return;
			}
			let listHaveEmptyRows = false;
			for (const product of this.products) {
				if (product.isEmptyRow()) {
					listHaveEmptyRows = true;
					this.focusProductSelector(product.fields['ID']);
					break;
				}
			}
			if (!listHaveEmptyRows) {
				this.handleProductRowAdd();
			}
		}
		handleOnEntityUpdate(event) {
			const [data] = event.getData();
			if (this.isChanged() && data.entityId === this.getSettingValue('entityId') && data.entityTypeId === this.getSettingValue('entityTypeId')) {
				this.setGridChanged(false);
				this.reloadGrid(false);
			}
		}
		handleEditorSubmit(event) {
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
		}
		handleOnInnerCancel(event) {
			if (this.controller) {
				this.controller.rollback();
			}
			this.setGridChanged(false);
			main_core_events.EventEmitter.subscribeOnce(this, 'onGridReloaded', () => this.actionUpdateTotalData({
				isInternalChanging: true
			}));
			this.reloadGrid(false);
		}
		changeActivePanelButtons(panelCode) {
			const container = this.getContainer();
			const activePanel = container.querySelector('.crm-entity-product-list-add-block-' + panelCode);
			if (main_core.Type.isDomNode(activePanel)) {
				main_core.Dom.removeClass(activePanel, 'crm-entity-product-list-add-block-hidden');
				main_core.Dom.addClass(activePanel, 'crm-entity-product-list-add-block-active');
			}
			const hiddenPanelCode = panelCode === 'top' ? 'bottom' : 'top';
			const removePanel = container.querySelector('.crm-entity-product-list-add-block-' + hiddenPanelCode);
			if (main_core.Type.isDomNode(removePanel)) {
				main_core.Dom.addClass(removePanel, 'crm-entity-product-list-add-block-hidden');
				main_core.Dom.removeClass(removePanel, 'crm-entity-product-list-add-block-active');
			}
			return activePanel;
		}
		reloadGrid(useProductsFromRequest = true, isInternalChanging = null) {
			if (isInternalChanging === null) {
				isInternalChanging = !useProductsFromRequest;
			}
			this.getGrid().reloadTable('POST', {
				useProductsFromRequest
			}, () => main_core_events.EventEmitter.emit(this, 'onGridReloaded'));
		}

		/*
			keep in mind different actions for this handler:
			- native reload by grid actions (columns settings, etc)		- products from request
			- reload by tax/discount settings button					- products from request		this.reloadGrid(true)
			- rollback													- products from db			this.reloadGrid(false)
			- reload after SalesCenter order save						- products from db			this.reloadGrid(false)
			- reload after save if location had been changed
		 */
		handleOnBeforeGridRequest(event) {
			const [grid, eventArgs] = event.getCompatData();
			if (!grid || !grid.parent || grid.parent.getId() !== this.getGridId()) {
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
				products: useProductsFromRequest ? this.getProductsFields(Editor.#getAjaxFields()) : null,
				locationId: this.getLocationId(),
				currencyId: this.getCurrencyId()
			};
			this.clearEditor();
			if (isNativeAction && this.isChanged()) {
				main_core_events.EventEmitter.subscribeOnce('Grid::updated', () => this.actionUpdateTotalData({
					isInternalChanging: false
				}));
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
		canEditCatalogPrice() {
			return this.getSettingValue('allowCatalogPriceEdit', false) === true;
		}
		allowReservation() {
			return this.getSettingValue('allowReservation', false) === true;
		}
		getDefaultDateReservation() {
			return this.getSettingValue('defaultDateReservation');
		}
		canSaveCatalogPrice() {
			return this.getSettingValue('allowCatalogPriceSave', false) === true;
		}
		enableEdit() {
			// Cannot use editSelected because checkboxes have been removed
			const rows = this.getGrid().getRows().getRows();
			rows.forEach(current => {
				if (!current.isHeadChild() && !current.isTemplate()) {
					current.edit();
				}
			});
		}
		addFirstRowIfEmpty() {
			if (this.getGrid().getRows().getCountDisplayed() === 0) {
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
				current.unsubscribeCustomEvents();
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
			this.settings = settings ? settings : {};
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
			this.products.forEach(product => product.getModel()?.setOption('currency', currencyId));
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
			this.setCurrencyId(currencyId);
			const products = [];
			this.products.forEach(product => {
				const priceFields = {};
				this.#getCalculatePriceFieldNames().forEach(name => {
					priceFields[name] = product.getField(name);
				});
				priceFields.CATALOG_PRICE = product.getField('CATALOG_PRICE');
				products.push({
					fields: priceFields,
					id: product.getId()
				});
			});
			if (products.length > 0) {
				this.ajaxRequest('calculateProductPrices', {
					products,
					currencyId
				});
			}
			const editData = this.getGridEditData();
			const templateRow = editData[GRID_TEMPLATE_ROW];
			templateRow['CURRENCY'] = this.getCurrencyId();
			const templateFieldNames = ['DISCOUNT_ROW', 'SUM', 'PRICE'];
			templateFieldNames.forEach(field => {
				templateRow[field]['CURRENCY']['VALUE'] = this.getCurrencyId();
			});
			this.setGridEditData(editData);
		}
		#getCalculatePriceFieldNames() {
			return ['BASE_PRICE', 'TAX_INCLUDED', 'PRICE_NETTO', 'PRICE_BRUTTO', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'CURRENCY'];
		}
		onCalculatePricesResponse(products) {
			this.products.forEach(product => {
				if (main_core.Type.isObject(products[product.getId()])) {
					product.updateUiCurrencyFields();
					['BASE_PRICE', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'CURRENCY_ID'].forEach(name => {
						product.updateField(name, main_core.Text.toNumber(products[product.getId()][name]));
					});
					product.setField('CURRENCY', products[product.getId()]['CURRENCY_ID']);
					product.setField('CATALOG_PRICE', products[product.getId()]['CATALOG_PRICE']);
				}
			});
			this.updateTotalUiCurrency();
		}
		updateTotalUiCurrency() {
			const totalBlock = BX(this.getSettingValue('totalBlockContainerId', null));
			if (main_core.Type.isElementNode(totalBlock)) {
				totalBlock.querySelectorAll('.crm-product-list-payment-side-table-column').forEach(column => {
					const valueElement = column.querySelector('.crm-product-list-result-grid-total');
					if (valueElement) {
						column.innerHTML = currency_currencyCore.CurrencyCore.getPriceControl(valueElement, this.getCurrencyId());
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
			return format && format.FORMAT_STRING.replace(/(^|[^&])#/, '$1').trim() || currencyId;
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
		calculatePriceWithoutDiscount(price, discount, discountType) {
			let result = 0.0;
			switch (discountType) {
				case catalog_productCalculator.DiscountType.PERCENTAGE:
					result = price - price * discount / 100;
					break;
				case catalog_productCalculator.DiscountType.MONETARY:
					result = price - discount;
					break;
			}
			return result;
		}
		calculateDiscountRate(originalPrice, price) {
			if (originalPrice === 0.0) {
				return 0.0;
			}
			if (price === 0.0) {
				return originalPrice > 0 ? 100.0 : -100;
			}
			return 100 * (originalPrice - price) / originalPrice;
		}
		calculateDiscount(originalPrice, discountRate) {
			return originalPrice * discountRate / 100;
		}
		calculatePriceWithoutTax(price, taxRate) {
			// Tax is not included in price
			return price / (1 + taxRate / 100);
		}
		calculatePriceWithTax(price, taxRate) {
			// Tax is included in price
			return price * (1 + taxRate / 100);
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
				main_core.Dom.append(main_core.Dom.create('input', {
					attrs: {
						type: "hidden",
						name: fieldName
					}
				}), container);
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
			return this.products.filter(item => !item.isEmpty()).length;
		}
		initProducts() {
			const list = this.getSettingValue('items', []);
			const isReserveBlocked = this.getSettingValue('isReserveBlocked', false);
			const isInventoryManagementToolEnabled = this.getSettingValue('isInventoryManagementToolEnabled', false);
			const inventoryManagementMode = this.getSettingValue('inventoryManagementMode', null);
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
				this.products.push(new Row(item.rowId, fields, settings, this));
			}
			this.numerateRows();
			this.productsWasInitiated = true;
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
		initGridData() {
			const gridEditData = this.getSettingValue('templateGridEditData', null);
			if (gridEditData) {
				this.setGridEditData(gridEditData);
			}
		}
		getGridEditData() {
			return this.getGrid().arParams.EDITABLE_DATA;
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
					const cell = event.target.closest('td');
					const fieldCode = this.getFieldCodeByGridCell(row, cell);
					if (fieldCode) {
						product.updateFieldByEvent(fieldCode, event);
					}
				}
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
					product.updateField(fieldCode, value, product.modeChanges.EDIT);
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
		handleProductSelectionPopup(event) {
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
					}, 0);
				}));
			}
			popup.Show();
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
				return new SettingsPopup(this.getContainer().querySelector('.crm-entity-product-list-add-block-active [data-role="product-list-settings-button"]'), this.getSettingValue('popupSettings', []), this);
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
			this.deleteRow(rowId);
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
			let fields = anchorProduct?.getFields();
			if (main_core.Type.isNil(fields)) {
				fields = {
					...this.getSettingValue('templateItemFields', {}),
					...{
						CURRENCY: this.getCurrencyId()
					}
				};
				const lastItem = this.products[this.products.length - 1];
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
				this.products.splice(1 + this.products.indexOf(anchorProduct), 0, product);
				product.getSelector()?.reloadFileInput();
				product.getSelector()?.layout();
				product.updateUiMeasure(product.getField('MEASURE_CODE'), main_core.Text.encode(product.getField('MEASURE_NAME')));
				if (!this.canEditCatalogPrice() && product.getModel().isCatalogExisted() && main_core.Type.isNumber(fields.CATALOG_PRICE)) {
					product.changeBasePrice(fields.CATALOG_PRICE);
				}
				if (!this.allowReservation()) {
					product.setField('DATE_RESERVE_END', this.getDefaultDateReservation());
					product.setField('STORE_ID', null);
					product.resetReserveFields();
				}
			} else if (this.getSettingValue('newRowPosition') === 'bottom') {
				this.products.push(product);
			} else {
				this.products.unshift(product);
			}
			this.refreshSortFields();
			this.numerateRows();
			product.updateUiCurrencyFields();
			this.updateTotalUiCurrency();
			product.getSelector()?.setConfig('ENABLE_EMPTY_PRODUCT_ERROR', this.getSettingValue('enableEmptyProductError', false));
			return product;
		}
		isTaxIncludedActive() {
			return this.products.filter(product => product.isTaxIncluded()).length > 0;
		}
		getProductSelector(newId) {
			return catalog_productSelector.ProductSelector.getById('crm_grid_' + this.getRowIdPrefix() + newId);
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
				const promise = new Promise((resolve, reject) => {
					const fields = data.fields;
					if (!main_core.Type.isNil(fields['IMAGE_INFO'])) {
						fields['IMAGE_INFO'] = JSON.stringify(fields['IMAGE_INFO']);
					}
					if (this.getCurrencyId() !== fields['CURRENCY_ID']) {
						fields['CURRENCY'] = fields['CURRENCY_ID'];
						const priceFields = {};
						this.#getCalculatePriceFieldNames().forEach(name => {
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
					if (this.products.length > 1) {
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
					this.getGrid().tableUnfade();
				});
			} else {
				this.getGrid().tableUnfade();
			}
		}
		handleOnBeforeProductClear(event) {
			const {
				rowId
			} = event.getData();
			const product = this.getProductByRowId(rowId);
			product.clearPropertyFields();
		}
		handleOnProductClear(event) {
			const {
				rowId
			} = event.getData();
			const product = this.getProductByRowId(rowId);
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
				settingsField.value = JSON.stringify({
					ENABLE_DISCOUNT: this.getDiscountEnabled(),
					ENABLE_TAX: this.getTaxEnabled()
				});
			}
			this.addFirstRowIfEmpty();
		}
		prepareProductDataValue() {
			let productDataValue = '';
			if (this.getProductCount()) {
				const productData = [];
				this.products.forEach(item => {
					const saveFields = item.getFields(Editor.#getAjaxFields());
					if (!/^[0-9]+$/.test(saveFields['ID'])) {
						saveFields['ID'] = 0;
					}
					saveFields['CUSTOMIZED'] = 'Y';
					productData.push(saveFields);
				});
				productDataValue = JSON.stringify(productData);
			}
			return productDataValue;
		}
		static #getAjaxFields() {
			return ['ID', 'PRODUCT_ID', 'PRODUCT_NAME', 'QUANTITY', 'TAX_RATE', 'TAX_INCLUDED', 'PRICE_EXCLUSIVE', 'PRICE_NETTO', 'PRICE_BRUTTO', 'PRICE', 'CUSTOMIZED', 'BASE_PRICE', 'DISCOUNT_ROW', 'DISCOUNT_SUM', 'DISCOUNT_TYPE_ID', 'DISCOUNT_RATE', 'CURRENCY', 'STORE_ID', 'INPUT_RESERVE_QUANTITY', 'RESERVE_QUANTITY', 'DATE_RESERVE_END', 'SORT', 'MEASURE_CODE', 'MEASURE_NAME', 'TYPE'];
		}

		/* actions */
		executeActions(actions) {
			if (!main_core.Type.isArrayFilled(actions)) {
				return;
			}
			const disableSaveButton = actions.filter(action => action.type === this.actions.updateTotal || action.type === this.actions.disableSaveButton).length > 0;
			for (const item of actions) {
				if (!main_core.Type.isPlainObject(item) || !main_core.Type.isStringFilled(item.type)) {
					continue;
				}
				switch (item.type) {
					case this.actions.productChange:
						this.actionSendProductChange(item, disableSaveButton);
						break;
					case this.actions.productListChanged:
						this.actionSendProductListChanged(disableSaveButton);
						break;
					case this.actions.updateListField:
						this.actionUpdateListField(item);
						break;
					case this.actions.updateTotal:
						this.actionUpdateTotalData();
						break;
					case this.actions.stateChanged:
						this.actionSendStatusChange(item);
						break;
				}
			}
		}
		actionSendProductChange(item, disableSaveButton) {
			if (!main_core.Type.isStringFilled(item.id)) {
				return;
			}
			const product = this.getProductByRowId(item.id);
			if (!product) {
				return;
			}
			main_core_events.EventEmitter.emit(this, 'ProductList::onChangeFields', {
				rowId: item.id,
				productId: product.getField('PRODUCT_ID'),
				fields: this.getProductByRowId(item.id).getCatalogFields()
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
			for (const row of this.products) {
				row.updateFieldByName(item.field, item.value);
			}
			this.updateFieldForList = null;
		}
		actionUpdateTotalData(options = {}) {
			if (this.totalData.inProgress) {
				return;
			}
			this.updateTotalDataDelayedHandler(options);
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

		/* actions finish */

		/* action tools */
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
		updateTotalDataDelayed(options = {}) {
			if (this.totalData.inProgress) {
				return;
			}
			this.totalData.inProgress = true;
			const products = this.getProductsFields(this.getProductFieldListForTotalData());
			products.forEach(item => item['CUSTOMIZED'] = 'Y');
			this.ajaxRequest('calculateTotalData', {
				options,
				products,
				currencyId: this.getCurrencyId()
			});
		}
		getProductsFields(fields = []) {
			const productFields = [];
			for (const item of this.products) {
				productFields.push(item.getFields(fields));
			}
			return productFields;
		}
		getProductFieldListForTotalData() {
			return ['PRODUCT_ID', 'PRODUCT_NAME', 'QUANTITY', 'DISCOUNT_TYPE_ID', 'DISCOUNT_RATE', 'DISCOUNT_SUM', 'TAX_RATE', 'TAX_INCLUDED', 'PRICE_EXCLUSIVE', 'PRICE', 'CUSTOMIZED'];
		}
		setTotalData(data, options = {}) {
			const item = BX(this.getSettingValue('totalBlockContainerId', null));
			if (main_core.Type.isElementNode(item)) {
				const currencyId = this.getCurrencyId();
				const list = ['totalCost', 'totalDelivery', 'totalTax', 'totalWithoutTax', 'totalDiscount', 'totalWithoutDiscount'];
				for (const id of list) {
					const row = item.querySelector('[data-total="' + id + '"]');
					if (main_core.Type.isElementNode(row) && id in data) {
						row.innerHTML = currency_currencyCore.CurrencyCore.currencyFormat(data[id], currencyId, false);
					}
				}
			}
			this.sendTotalData(data, options);
			this.totalData.inProgress = false;
		}
		sendTotalData(data, options) {
			if (this.controller) {
				let needMarkAsChanged = true;
				if (main_core.Type.isObject(options) && (options.isInternalChanging === true || options.isInternalChanging === 'true')) {
					needMarkAsChanged = false;
				}
				setTimeout(() => {
					this.controller.changeSumTotal(data, needMarkAsChanged, !this.#childrenHasErrors());
				}, 500);
			}
		}

		/* action tools finish */

		/* ajax tools */
		ajaxRequest(action, data) {
			const requestKey = main_core.Text.getRandom();
			this.ajaxPool.set(action, requestKey);
			if (!main_core.Type.isPlainObject(data.options)) {
				data.options = {};
			}
			data.options.ACTION = action;
			data.options.REQUEST_KEY = requestKey;
			main_core.ajax.runComponentAction(this.getComponentName(), action, {
				mode: 'class',
				signedParameters: this.getSignedParameters(),
				data: data
			}).then(response => this.ajaxResultSuccess(response, data.options), response => this.ajaxResultFailure(response, data.options));
		}
		ajaxResultSuccess(response, requestOptions) {
			if (!this.ajaxResultCommonCheck(response) || this.ajaxPool.get(response.data.action) !== requestOptions.REQUEST_KEY) {
				return;
			}
			this.ajaxPool.delete(response.data.action);
			main_core_events.EventEmitter.emit(this, 'onAjaxSuccess', response.data.action);
			switch (response.data.action) {
				case 'calculateTotalData':
					if (main_core.Type.isPlainObject(response.data.result)) {
						this.setTotalData(response.data.result, requestOptions);
					}
					break;
				case 'calculateProductPrices':
					if (main_core.Type.isPlainObject(response.data.result)) {
						this.onCalculatePricesResponse(response.data.result);
					}
					break;
			}
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
					setTimeout(resolve(), 50);
				}
			});
		}
		ajaxResultFailure(response, requestOptions) {
			this.ajaxPool.delete(requestOptions.ACTION);
		}
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
		deleteRow(rowId, skipActions = false) {
			if (!main_core.Type.isStringFilled(rowId)) {
				return;
			}
			const gridRow = this.getGrid().getRows().getById(rowId);
			if (gridRow) {
				main_core.Dom.remove(gridRow.getNode());
				this.getGrid().getRows().reset();
			}
			const productRow = this.getProductById(rowId);
			if (productRow) {
				const index = this.products.indexOf(productRow);
				if (index > -1) {
					this.products.splice(index, 1);
					this.refreshSortFields();
					this.numerateRows();
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
			this.products.filter(item => item.isEmpty()).forEach(row => this.deleteRow(row.getField('ID'), true));
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
			this.products.forEach((item, index) => item.setField('SORT', (index + 1) * 10));
		}
		handleOnTabShow() {
			if (!this.isVisible()) {
				this.products.forEach(product => {
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
			main_core.Runtime.loadExtension('catalog.tool-availability-manager').then(exports$1 => {
				const {
					ToolAvailabilityManager
				} = exports$1;
				ToolAvailabilityManager.openInventoryManagementToolDisabledSlider();
			});
		}
		getRestrictedProductTypes() {
			return this.getSettingValue('restrictedProductTypes', []);
		}
	}

	exports.Editor = Editor;
	exports.PageEventsManager = PageEventsManager;

})(this.BX.Crm.Entity.ProductList = this.BX.Crm.Entity.ProductList || {}, BX, BX, BX.Event, BX.Catalog, BX.Currency, BX.UI, BX, BX.Main, BX.Catalog, BX.Catalog, BX.Catalog, BX, BX.UI.Tour, BX, BX.Catalog, BX.Catalog.Store);
//# sourceMappingURL=script.js.map
