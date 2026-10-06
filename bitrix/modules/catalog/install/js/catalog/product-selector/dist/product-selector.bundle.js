/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_designTokens, ui_forms, fileinput, ui_notification, main_core_events, catalog_skuTree, ui_entitySelector, catalog_productModel, catalog_productSelector, main_loader, ui_infoHelper, catalog_barcodeScanner, ui_qrauthorization, ui_tour, spotlight, catalog_toolAvailabilityManager, ui_iconSet_main, catalog_externalCatalogPlacement) {
	'use strict';

	class ProductSearchInputDefaultFooter extends ui_entitySelector.DefaultFooter {
		#loader = null;
		constructor(dialog, options) {
			super(dialog, options);
			this.getDialog().subscribe('onSearch', this.handleOnSearch.bind(this));
		}
		getContent() {
			let phrase = '';
			const isViewCreateButton = this.options.allowCreateItem === true || this.options.allowEditItem === false;
			if (this.isViewEditButton() && isViewCreateButton) {
				phrase = main_core.Tag.render`
				<div>${main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_1')}</div>
			`;
				const createButton = phrase.querySelector('create-button');
				main_core.Dom.replace(createButton, this.#getLabelContainer());
				const changeButton = phrase.querySelector('change-button');
				main_core.Dom.replace(changeButton, this.#getSaveContainer());
			} else if (this.isViewEditButton()) {
				phrase = this.#getSaveContainer();
			} else {
				phrase = this.#getLabelContainer();
			}
			return main_core.Tag.render`
			<div class="ui-selector-search-footer-box">
				${phrase}
				${this.#getHintContainer()}
				${this.getLoaderContainer()}
			</div>
		`;
		}
		handleOnSearch(event) {
			const {
				query
			} = event.getData();
			if (this.options.currentValue === query || query === '') {
				this.hide();
			} else {
				this.show();
			}
			this.getQueryContainer().textContent = ` ${query}`;
		}
		isViewEditButton() {
			return this.options.allowEditItem === true;
		}
		getQueryContainer() {
			return this.cache.remember('name-container', () => {
				return main_core.Tag.render`
				<span class="ui-selector-search-footer-query"></span>
			`;
			});
		}
		#getSaveContainer() {
			return this.cache.remember('save-container', () => {
				const className = 'ui-selector-footer-link';
				const messageId = this.options.inputName === catalog_productSelector.ProductSelector.INPUT_FIELD_BARCODE ? 'CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_BARCODE_CHANGE' : 'CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_CHANGE';
				return main_core.Tag.render`
				<button type="button" class="catalog-footer-action ${className}" data-testid="catalog-selector-footer-save-btn" onclick="${this.#onClickSaveChanges.bind(this)}">
					${main_core.Loc.getMessage(messageId)}
				</button>
			`;
			});
		}
		#getLoader() {
			if (main_core.Type.isNil(this.#loader)) {
				this.#loader = new main_loader.Loader({
					target: this.getLoaderContainer(),
					size: 17,
					color: 'rgba(82, 92, 105, 0.9)'
				});
			}
			return this.#loader;
		}
		#showLoader() {
			void this.#getLoader().show();
		}
		#hideLoader() {
			void this.#getLoader().hide();
		}
		#getLabelContainer() {
			return this.cache.remember('label', () => {
				return main_core.Tag.render`
				<span class="catalog-footers-label-container">
					<button
						type="button"
						data-testid="catalog-selector-footer-create-btn"
						onclick="${this.#handleClick.bind(this)}"
						class="catalog-footer-action ui-selector-footer-link ui-selector-footer-link-add"
					>
						${this.getOption('creationLabel', main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_CREATE'))}
					</button>
					${this.getQueryContainer()}
				</span>
			`;
			});
		}
		getLoaderContainer() {
			return this.cache.remember('loader', () => {
				return main_core.Tag.render`
				<div class="ui-selector-search-footer-loader"></div>
			`;
			});
		}
		#getHintContainer() {
			return this.cache.remember('hint', () => {
				let message = null;
				if (!this.options.allowEditItem && !this.options.allowCreateItem) {
					message = main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_DISABLED_FOOTER_ALL_HINT', {
						'#ADMIN_HINT#': this.#getErrorAdminHint()
					});
				} else if (!this.options.allowEditItem) {
					message = main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_DISABLED_FOOTER_EDIT_HINT', {
						'#ADMIN_HINT#': this.#getErrorAdminHint()
					});
				} else if (!this.options.allowCreateItem) {
					message = main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_DISABLED_FOOTER_ADD_HINT', {
						'#ADMIN_HINT#': this.#getErrorAdminHint()
					});
				}
				if (!message) {
					return null;
				}
				const hintNode = main_core.Tag.render`<span class="ui-btn ui-btn-icon-lock ui-btn-link"></span>`;
				hintNode.dataset.hint = message;
				hintNode.dataset.hintNoIcon = true;
				BX.UI.Hint.initNode(hintNode);
				return main_core.Tag.render`<div class="product-search-selector-disabled-footer-hint">${hintNode}</div>`;
			});
		}
		#onClickSaveChanges() {
			if (!this.options.allowEditItem) {
				return;
			}
			const dialog = this.getDialog();
			dialog.emit('ChangeItem:onClick', {
				query: dialog.getSearchTab().getLastSearchQuery().query
			});
			dialog.clearSearch();
			dialog.hide();
		}
		#createItem(event) {
			if (!this.options.allowCreateItem) {
				return;
			}
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector && tagSelector.isLocked()) {
				return;
			}
			const finalize = () => {
				this.#hideLoader();
				if (this.getDialog().getTagSelector()) {
					this.getDialog().getTagSelector().unlock();
					this.getDialog().focusSearch();
				}
			};
			event.preventDefault();
			this.#showLoader();
			if (tagSelector) {
				tagSelector.lock();
			}
			this.getDialog().emitAsync('Search:onItemCreateAsync', {
				searchQuery: this.getDialog().getActiveTab().getLastSearchQuery()
			}).then(() => {
				this.getTab().clearResults();
				this.getDialog().clearSearch();
				if (this.getDialog().getActiveTab() === this.getTab()) {
					this.getDialog().selectFirstTab();
				}
				finalize();
			}).catch(() => {
				finalize();
			});
		}
		#handleClick(event) {
			this.#createItem(event);
		}
		#getErrorAdminHint() {
			return this.options.errorAdminHint || '';
		}
	}

	class ProductSearchInputLimitedFooter extends ui_entitySelector.DefaultFooter {
		getContent() {
			const phrase = main_core.Tag.render`
			<div>${main_core.Loc.getMessage('CATALOG_SELECTOR_LIMITED_PRODUCT_CREATION')}</div>
		`;
			const infoButton = main_core.Tag.render`
			<a class="ui-btn ui-btn-sm ui-btn-primary ui-btn-hover ui-btn-round">
				${main_core.Loc.getMessage('CATALOG_SELECTOR_LICENSE_EXPLODE')}
			</a>
		`;
			main_core.Event.bind(infoButton, 'click', () => {
				BX.UI.InfoHelper.show('limit_shop_products');
			});
			return main_core.Tag.render`
			<div class="ui-selector-search-footer-box">
				<div class="ui-selector-search-footer-box">
					<div class="tariff-lock"></div>
					${phrase}
				</div>
				<div>
					${infoButton}
				</div>
			</div>
		`;
		}
	}

	class DialogMode {
		static SEARCHING = 'SEARCHING';
		static SHOW_PRODUCT_ITEM = 'SHOW_PRODUCT_ITEM';
		static SHOW_RECENT = 'SHOW_RECENT';
	}

	class SelectorErrorCode {
		static NOT_SELECTED_PRODUCT = 'NOT_SELECTED_PRODUCT';
		static FAILED_PRODUCT = 'FAILED_PRODUCT';
		static getCodes() {
			return [SelectorErrorCode.NOT_SELECTED_PRODUCT, SelectorErrorCode.FAILED_PRODUCT];
		}
	}

	class ProductSearchInputBase {
		cache = new main_core.Cache.MemoryCache();
		constructor(id, options = {}) {
			this.options = options;
			this.id = id || main_core.Text.getRandom();
			this.selector = options.selector;
			if (!(this.selector instanceof catalog_productSelector.ProductSelector)) {
				throw new TypeError('Product selector instance not found.');
			}
			this.model = options.model || {};
			this.isEnabledDetailLink = options.isEnabledDetailLink;
			this.inputName = options.inputName || catalog_productSelector.ProductSelector.INPUT_FIELD_NAME;
			this.loadedSelectedItem = null;
			this.clickNameInputHandler = this.handleClickNameInput.bind(this);
			this.searchInDialogHandler = main_core.Runtime.debounce(this.searchInDialog, 500, this);
			this.nameInputBlurHandler = this.#handleNameInputBlur.bind(this);
			this.nameInputKeyDownHandler = this.handleNameInputKeyDown.bind(this);
			this.iconsSwitchingOnNameInputHandler = this.#handleIconsSwitchingOnNameInput.bind(this);
			this.nameInputChangeHandler = this.#handleNameInputChange.bind(this);
		}
		layout() {
			this.#clearInputCache();
			const block = main_core.Tag.render`<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon"></div>`;
			this.toggleIcon(this.getClearIcon(), 'none');
			main_core.Dom.append(this.getClearIcon(), block);
			if (this.isSearchEnabled()) {
				if (this.selector.isProductSearchEnabled()) {
					this.#initHasDialogItems();
				}
				this.toggleIcon(this.getSearchIcon(), main_core.Type.isStringFilled(this.getFilledValue()) ? 'none' : 'block');
				main_core.Dom.append(this.getSearchIcon(), block);
				main_core.Event.bind(this.getNameInput(), 'click', this.clickNameInputHandler);
				main_core.Event.bind(this.getNameInput(), 'input', this.searchInDialogHandler);
				main_core.Event.bind(this.getNameInput(), 'blur', this.nameInputBlurHandler);
				main_core.Event.bind(this.getNameInput(), 'keydown', this.nameInputKeyDownHandler);
				this.dialogMode = this.model.isCatalogExisted() ? DialogMode.SHOW_PRODUCT_ITEM : DialogMode.SHOW_RECENT;
			}
			if (this.showDetailLink() && main_core.Type.isStringFilled(this.getValue())) {
				this.toggleIcon(this.getClearIcon(), 'none');
				this.toggleIcon(this.getSearchIcon(), 'none');
				this.toggleIcon(this.#getArrowIcon(), 'block');
				main_core.Dom.append(this.#getArrowIcon(), block);
			}
			main_core.Event.bind(this.getNameInput(), 'click', this.iconsSwitchingOnNameInputHandler);
			main_core.Event.bind(this.getNameInput(), 'input', this.iconsSwitchingOnNameInputHandler);
			main_core.Event.bind(this.getNameInput(), 'change', this.nameInputChangeHandler);
			main_core.Dom.append(this.getNameBlock(), block);
			return block;
		}
		getId() {
			return this.id;
		}
		getField(fieldName) {
			return this.model.getField(fieldName);
		}
		getValue() {
			return this.getField(this.inputName);
		}
		getFilledValue() {
			return this.getNameInput().value || '';
		}
		getSearchQuery() {
			return this.getFilledValue().trim();
		}
		isSearchQueryEmpty() {
			return this.getSearchQuery() === '';
		}
		isSearchEnabled() {
			return Boolean(this.options.isSearchEnabled);
		}
		toggleIcon(icon, value) {
			if (main_core.Type.isDomNode(icon)) {
				main_core.Dom.style(icon, 'display', value);
			}
		}
		getNameBlock() {
			return this.cache.remember('nameBlock', () => {
				return main_core.Tag.render`
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					${this.getNameTag()}
					${this.getNameInput()}
					${this.#getHiddenNameInput()}
				</div>
			`;
			});
		}
		getNameTag() {
			return null;
		}
		getNameInput() {
			return this.cache.remember('nameInput', () => {
				const input = main_core.Tag.render`
				<input type="text"
					class="ui-ctl-element ui-ctl-textbox"
					data-testid="catalog-product-selector-${main_core.Text.encode(this.inputName.toLowerCase())}-input"
					autocomplete="off"
					data-name="${main_core.Text.encode(this.inputName)}"
					value="${main_core.Text.encode(this.getValue())}"
					placeholder="${main_core.Text.encode(this.getPlaceholder())}"
					title="${main_core.Text.encode(this.getValue())}"
					onchange="${this.#handleNameInputHiddenChange.bind(this)}"
				>
			`;
				const accessibleName = this.getPlaceholder();
				if (main_core.Type.isStringFilled(accessibleName)) {
					input.setAttribute('aria-label', accessibleName);
				}
				if (this.selector.getConfig('SELECTOR_INPUT_DISABLED', false)) {
					main_core.Dom.addClass(input, 'ui-ctl-disabled');
					input.setAttribute('disabled', true);
				}
				return input;
			});
		}
		getClearIcon() {
			return this.cache.remember('closeIcon', () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-ctl-after ui-ctl-icon-clear"
					onclick="${this.handleClearIconClick.bind(this)}"
				></button>
			`;
			});
		}
		showDetailLink() {
			return this.isEnabledDetailLink;
		}
		handleNameInputKeyDown(event) {}
		clearErrors() {
			const errors = this.model.getErrorCollection().getErrors();
			for (const code in errors) {
				if (catalog_productSelector.ProductSelector.ErrorCodes.getCodes().includes(code)) {
					this.model.getErrorCollection().removeError(code);
				}
			}
		}
		focusName() {
			requestAnimationFrame(() => this.getNameInput().focus());
		}
		removeSpotlight() {}
		removeQrAuth() {}
		destroy() {
			main_core.Event.unbind(this.getNameInput(), 'click', this.clickNameInputHandler);
			main_core.Event.unbind(this.getNameInput(), 'input', this.searchInDialogHandler);
			main_core.Event.unbind(this.getNameInput(), 'blur', this.nameInputBlurHandler);
			main_core.Event.unbind(this.getNameInput(), 'keydown', this.nameInputKeyDownHandler);
			main_core.Event.unbind(this.getNameInput(), 'click', this.iconsSwitchingOnNameInputHandler);
			main_core.Event.unbind(this.getNameInput(), 'input', this.iconsSwitchingOnNameInputHandler);
			main_core.Event.unbind(this.getNameInput(), 'change', this.nameInputChangeHandler);
		}
		showItems() {
			if (this.getFilledValue() === '') {
				this.showPreselectedItems();
				return;
			}
			if (!this.model.isCatalogExisted() || this.dialogMode !== DialogMode.SHOW_PRODUCT_ITEM) {
				this.searchInDialog();
				return;
			}
			this.#showSelectedItem();
		}
		showPreselectedItems() {
			if (!this.selector.isProductSearchEnabled()) {
				return;
			}
			this.dialogMode = DialogMode.SHOW_RECENT;
			const dialog = this.getDialog();
			this.loadPreselectedItems();
			dialog.selectFirstTab();
			dialog.show();
			this.#hideFooter();
		}
		isFooterHidable() {
			return true;
		}

		/**
		 * @abstract
		 */
		searchInDialog() {
			throw new Error('Method "searchInDialog" should be overridden');
		}

		/**
		 * @abstract
		 */
		handleClickNameInput() {
			throw new Error('Method "handleClickNameInput" should be overridden');
		}

		/**
		 * @abstract
		 */
		getPlaceholder() {
			throw new Error('Method "getPlaceholder" should be overridden');
		}
		getDialog() {
			return this.cache.remember('dialog', () => {
				return new ui_entitySelector.Dialog(this.getDialogParams());
			});
		}
		getDialogParams() {
			const entity = {
				id: 'product',
				options: {
					iblockId: this.model.getIblockId(),
					basePriceId: this.model.getBasePriceId(),
					currency: this.model.getCurrency()
				},
				dynamicLoad: true,
				dynamicSearch: true
			};
			const restrictedProductTypes = this.selector.getConfig('RESTRICTED_PRODUCT_TYPES', null);
			if (!main_core.Type.isNil(restrictedProductTypes)) {
				entity.options.restrictedProductTypes = restrictedProductTypes;
			}
			return {
				id: `${this.id}_product`,
				height: 300,
				width: Math.max(this.getNameInput()?.offsetWidth, 565),
				context: 'catalog-products',
				targetNode: this.getNameInput(),
				enableSearch: false,
				multiple: false,
				dropdownMode: true,
				// Keep DOM focus on the name input while the dropdown loads/updates.
				// Explicit `false` is deterministic regardless of the `useFocusTrapInDialogs` flag.
				popupOptions: {
					focusTrap: false
				},
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Tag.message`${'CATALOG_SELECTOR_RECENT_TAB_STUB_TITLE'}`
					}
				},
				entities: [entity],
				events: {
					'Item:onSelect': this.onProductSelect.bind(this),
					onShow: this.onDialogShow.bind(this)
				}
			};
		}
		onDialogShow(event) {}

		/**
		 * @abstract
		 */
		getOnProductSelectConfig(item) {
			throw new Error('Method "getOnProductSelectConfig" should be overridden');
		}
		onProductSelect(event) {
			const item = event.getData().item;
			item.getDialog().getTargetNode().value = item.getTitle();
			this.toggleIcon(this.getSearchIcon(), 'none');
			this.clearErrors();
			if (this.selector) {
				this.selector.onProductSelect(item.getId(), this.getOnProductSelectConfig(item));
				this.selector.clearLayout();
				this.selector.layout();

				// Return focus to the name input of the freshly rendered row (Q-2):
				// the catalog tears down the old row DOM and draws a new one on select.
				this.selector.focusName();
			}
			this.dialogMode = DialogMode.SHOW_PRODUCT_ITEM;
			this.loadedSelectedItem = item;
			this.cache.delete('dialog');
		}
		onChangeValue(value) {
			this.getNameInput().title = value;
			this.getNameInput().value = value;
		}
		handleClearIconClick(event) {
			this.clear();
			event.stopPropagation();
			event.preventDefault();
		}
		clear() {
			this.selector.emit('onBeforeClear', {
				selectorId: this.selector.getId(),
				rowId: this.selector.getRowId()
			});
			this.loadedSelectedItem = null;
			if (this.selector.isProductSearchEnabled() && !this.model.isEmpty()) {
				this.selector.clearState();
				this.selector.clearLayout();
				this.selector.layout();
			} else {
				const newValue = '';
				this.toggleIcon(this.getClearIcon(), 'none');
				this.onChangeValue(newValue);
			}
			this.selector.focusName();
			this.selector.emit('onClear', {
				selectorId: this.selector.getId(),
				rowId: this.selector.getRowId()
			});
		}
		#handleIconsSwitchingOnNameInput(event) {
			this.toggleIcon(this.#getArrowIcon(), 'none');
			if (main_core.Type.isStringFilled(event.target.value)) {
				this.toggleIcon(this.getClearIcon(), 'block');
				this.toggleIcon(this.getSearchIcon(), 'none');
			} else {
				this.toggleIcon(this.getClearIcon(), 'none');
				if (this.isSearchEnabled()) {
					this.toggleIcon(this.getSearchIcon(), 'block');
				}
			}
		}
		#initHasDialogItems() {
			if (!main_core.Type.isNil(this.selector.getConfig('EXIST_DIALOG_ITEMS'))) {
				return;
			}
			if (!this.selector.getModel().isEmpty()) {
				this.selector.setConfig('EXIST_DIALOG_ITEMS', true);
				return;
			}

			// is null, that not send ajax
			this.selector.setConfig('EXIST_DIALOG_ITEMS', false);
			const dialog = this.getDialog();
			if (dialog.hasDynamicLoad()) {
				this.loadPreselectedItems();
				dialog.subscribeOnce('onLoad', () => {
					if (dialog.getPreselectedItems().length > 1) {
						this.selector.setConfig('EXIST_DIALOG_ITEMS', true);
					}
				});
			} else {
				this.selector.setConfig('EXIST_DIALOG_ITEMS', true);
			}
		}
		#hideFooter() {
			if (this.isFooterHidable()) {
				this.getDialog().getFooter()?.hide();
			}
		}
		#handleNameInputChange(event) {
			const value = event.target.value;
			this.onChangeValue(value);
		}
		#clearInputCache() {
			this.destroy();
			this.cache.delete('dialog');
			this.cache.delete('nameBlock');
			this.cache.delete('nameInput');
			this.cache.delete('hiddenNameInput');
		}
		loadPreselectedItems() {
			const dialog = this.getDialog();
			if (dialog.isLoading()) {
				return;
			}
			dialog.removeItems();
			dialog.loadState = 'UNSENT';
			this.loadedSelectedItem = null;
			dialog.load();
		}
		#showSelectedItem() {
			const dialog = this.getDialog();
			dialog.removeItems();
			new Promise((resolve, reject) => {
				if (!main_core.Type.isNil(this.loadedSelectedItem)) {
					resolve();
					return;
				}
				dialog.showLoader();
				main_core.ajax.runAction('catalog.productSelector.getSkuSelectorItem', {
					json: {
						id: this.selector.getModel().getSkuId(),
						options: {
							iblockId: this.model.getIblockId(),
							basePriceId: this.model.getBasePriceId(),
							currency: this.model.getCurrency()
						}
					}
				}).then(response => {
					dialog.hideLoader();
					this.loadedSelectedItem = null;
					if (main_core.Type.isObject(response.data) && !dialog.isLoading()) {
						this.loadedSelectedItem = dialog.addItem(response.data);
					}
					resolve();
				}).catch(error => reject(error));
			}).then(() => {
				if (main_core.Type.isNil(this.loadedSelectedItem)) {
					this.searchInDialog();
				} else {
					dialog.setPreselectedItems([this.selector.getModel().getSkuId()]);
					dialog.getRecentTab().getRootNode().addItem(this.loadedSelectedItem);
					dialog.selectFirstTab();
					this.#hideFooter();
				}
			}).catch(error => console.error(error));
			dialog.getPopup().show();
			this.#hideFooter();
		}
		#handleNameInputHiddenChange(event) {
			this.#getHiddenNameInput().value = event.target.value;
		}
		#handleSearchIconClick(event) {
			this.searchInDialog();
			this.focusName();
			event.stopPropagation();
			event.preventDefault();
		}
		#handleNameInputBlur(event) {
			// timeout to toggle clear icon handler while cursor is inside of name input
			setTimeout(() => {
				// display:none on a focused icon would drop keyboard focus to <body>;
				// keep an icon (clear/search are real buttons) visible while it holds focus.
				const hideIcon = icon => {
					if (icon !== document.activeElement) {
						this.toggleIcon(icon, 'none');
					}
				};
				hideIcon(this.getClearIcon());
				if (this.showDetailLink() && main_core.Type.isStringFilled(this.getValue())) {
					if (this.isSearchEnabled()) {
						hideIcon(this.getSearchIcon());
					}
					this.toggleIcon(this.#getArrowIcon(), 'block');
				} else {
					this.toggleIcon(this.#getArrowIcon(), 'none');
					if (this.isSearchEnabled()) {
						if (main_core.Type.isStringFilled(this.getFilledValue())) {
							hideIcon(this.getSearchIcon());
						} else {
							this.toggleIcon(this.getSearchIcon(), 'block');
						}
					}
				}
			}, 200);
			if (this.isSearchEnabled() && this.selector.isEnabledEmptyProductError()) {
				setTimeout(() => {
					if (this.#isCurrentSearchInput() && !this.selector.inProcess() && (this.model.isEmpty() || !main_core.Type.isStringFilled(this.getFilledValue()))) {
						this.model.getErrorCollection().setError(SelectorErrorCode.NOT_SELECTED_PRODUCT, this.selector.getEmptySelectErrorMessage());
						this.selector.layoutErrors();
					}
				}, 200);
			}
		}
		#isCurrentSearchInput() {
			return this.selector.searchInput === this;
		}
		#getHiddenNameInput() {
			return this.cache.remember('hiddenNameInput', () => {
				return main_core.Tag.render`
				<input
				 	type="hidden"
					name="${main_core.Text.encode(this.inputName)}"
					value="${main_core.Text.encode(this.getValue())}"
				>
			`;
			});
		}
		#getArrowIcon() {
			return this.cache.remember('arrowIcon', () => {
				return main_core.Tag.render`
				<a
					href="${main_core.Text.encode(this.model.getDetailPath())}"
					target="_blank"
					class="ui-ctl-after ui-ctl-icon-forward"
				>
			`;
			});
		}
		getSearchIcon() {
			return this.cache.remember('searchIcon', () => {
				return main_core.Tag.render`
				<button
					type="button"
					class="ui-ctl-after ui-ctl-icon-search"
					onclick="${this.#handleSearchIconClick.bind(this)}"
				></button>
			`;
			});
		}
	}

	class ProductSearchInputDefault extends ProductSearchInputBase {
		constructor(id, options = {}) {
			super(id, options);
			this.immutableFieldNames = [catalog_productSelector.ProductSelector.INPUT_FIELD_BARCODE, catalog_productSelector.ProductSelector.INPUT_FIELD_NAME];
			if (!this.immutableFieldNames.includes(this.inputName)) {
				this.immutableFieldNames.push(this.inputName);
			}
			this.ajaxInProcess = false;
		}
		getNameTag() {
			if (!this.model.isNew()) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-ctl-tag">${main_core.Loc.getMessage('CATALOG_SELECTOR_NEW_TAG_TITLE')}</div>
		`;
		}
		getDialogParams() {
			const params = {
				...super.getDialogParams(),
				searchTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Tag.message`${'CATALOG_SELECTOR_IS_EMPTY_TITLE'}`,
						subtitle: this.isAllowedCreateProduct() ? main_core.Tag.message`${'CATALOG_SELECTOR_IS_EMPTY_SUBTITLE'}` : '',
						arrow: true
					}
				}
			};
			const settingsCollection = main_core.Extension.getSettings('catalog.product-selector');
			if (main_core.Type.isObject(settingsCollection.get('limitInfo'))) {
				params.footer = ProductSearchInputLimitedFooter;
			} else if (this.model && this.model.isCatalogExisted()) {
				params.footer = ProductSearchInputDefaultFooter;
				params.footerOptions = {
					inputName: this.inputName,
					allowEditItem: this.isAllowedEditProduct(),
					allowCreateItem: this.isAllowedCreateProduct(),
					errorAdminHint: settingsCollection.get('errorAdminHint'),
					creationLabel: main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_CREATE'),
					currentValue: this.getValue()
				};
			} else {
				params.searchOptions = {
					allowCreateItem: this.isAllowedCreateProduct()
				};
			}
			params.events['Search:onItemCreateAsync'] = this.createProduct.bind(this);
			params.events['ChangeItem:onClick'] = this.showChangeNotification.bind(this);
			return params;
		}
		isAllowedCreateProduct() {
			return this.selector.getConfig('IS_ALLOWED_CREATION_PRODUCT', true) && this.selector.checkProductAddRights();
		}
		isAllowedEditProduct() {
			return this.selector.checkProductEditRights();
		}
		handleNameInputKeyDown(event) {
			const dialog = this.getDialog();
			if (event.key === 'Enter' && dialog.getActiveTab() === dialog.getSearchTab()) {
				if (main_core.Browser.isMac() && event.metaKey || event.ctrlKey) {
					// create a new product - keep the previous behavior
					event.preventDefault();
					event.stopPropagation();
					dialog.getSearchTab().getFooter().createItem();
					return;
				}

				// only suppress the form submit; do NOT stopPropagation so the
				// entity-selector Navigation document listener selects the active item
				event.preventDefault();
			}
		}
		onChangeValue(value) {
			super.onChangeValue(value);
			const fields = {};
			fields[this.inputName] = value;
			main_core_events.EventEmitter.emit('ProductSelector::onNameChange', {
				rowId: this.selector.getRowId(),
				fields
			});
			if (!this.selector.isEnabledAutosave()) {
				return;
			}
			this.selector.getModel().setFields(fields);
			this.selector.getModel().save().then(() => {
				BX.UI.Notification.Center.notify({
					id: 'saving_field_notify_name',
					closeButton: false,
					content: main_core.Tag.render`<div>${main_core.Loc.getMessage('CATALOG_SELECTOR_SAVING_NOTIFICATION_NAME')}</div>`,
					autoHide: true
				});
			}).catch(error => console.error(error));
		}
		searchInDialog() {
			if (this.isSearchQueryEmpty()) {
				if (this.isHasDialogItems === false) {
					this.getDialog().hide();
					return;
				}
				this.loadedSelectedItem = null;
				this.showPreselectedItems();
				return;
			}
			this.dialogMode = DialogMode.SEARCHING;
			this.#searchItem(this.getSearchQuery());
		}
		handleClickNameInput() {
			const dialog = this.getDialog();
			if (dialog.isOpen() || this.getFilledValue() === '' && this.isHasDialogItems === false) {
				dialog.hide();
				return;
			}
			this.showItems();
		}
		getImmutableFieldNames() {
			return this.immutableFieldNames;
		}
		getOnProductSelectConfig(item) {
			const isNew = item.getCustomData().get('isNew');
			const immutableFields = [];
			this.getImmutableFieldNames().forEach(key => {
				if (!main_core.Type.isNil(item.getCustomData().get(key))) {
					this.model.setField(key, item.getCustomData().get(key));
					immutableFields.push(key);
				}
			});
			return {
				isNew,
				immutableFields
			};
		}
		createProductModelFromSearchQuery(searchQuery) {
			const fields = {
				...this.selector.getModel().getFields()
			};
			fields[this.inputName] = searchQuery;
			return new catalog_productModel.ProductModel({
				isSimpleModel: true,
				isNew: true,
				currency: this.selector.options.currency,
				iblockId: this.selector.getModel().getIblockId(),
				basePriceId: this.selector.getModel().getBasePriceId(),
				fields
			});
		}
		createProduct(event) {
			if (this.ajaxInProcess) {
				return null;
			}
			this.ajaxInProcess = true;
			const dialog = event.getTarget();
			const {
				searchQuery
			} = event.getData();
			const newProduct = this.createProductModelFromSearchQuery(searchQuery.getQuery());
			main_core_events.EventEmitter.emit(this.selector, 'onBeforeCreate', {
				model: newProduct
			});
			return new Promise((resolve, reject) => {
				if (!this.checkCreationModel(newProduct)) {
					this.ajaxInProcess = false;
					dialog.hide();
					reject();
					return;
				}
				dialog.showLoader();
				newProduct.save().then(response => {
					dialog.hideLoader();
					const id = main_core.Text.toInteger(response.data.id);
					const item = dialog.addItem({
						id,
						entityId: 'product',
						title: searchQuery.getQuery(),
						tabs: dialog.getRecentTab().getId(),
						customData: {
							isNew: true
						}
					});
					this.selector.getModel().setOption('isSimpleModel', false);
					this.selector.getModel().setOption('isNew', true);
					this.getImmutableFieldNames().forEach(name => {
						this.selector.getModel().setField(name, newProduct.getField(name));
						this.selector.getModel().setOption(name, newProduct.getField(name));
					});
					if (item) {
						item.select();
					}
					dialog.hide();
					this.cache.delete('dialog');
					this.ajaxInProcess = false;
					this.isHasDialogItems = true;
					resolve();
				}).catch(errorResponse => {
					dialog.hideLoader();
					errorResponse.errors.forEach(error => {
						BX.UI.Notification.Center.notify({
							closeButton: true,
							content: main_core.Tag.render`<div>${error.message}</div>`,
							autoHide: true
						});
					});
					this.ajaxInProcess = false;
					reject();
				});
			});
		}
		checkCreationModel(creationModel) {
			return true;
		}
		showChangeNotification(event) {
			const {
				query
			} = event.getData();
			const options = {
				title: main_core.Loc.getMessage(`CATALOG_SELECTOR_SAVING_NOTIFICATION_${this.selector.getType()}`),
				events: {
					onSave: () => {
						if (this.selector) {
							this.selector.getModel().setField(this.inputName, query);
							this.selector.getModel().save([this.inputName]).catch(errorResponse => {
								errorResponse.errors.forEach(error => {
									BX.UI.Notification.Center.notify({
										closeButton: true,
										content: main_core.Tag.render`<div>${error.message}</div>`,
										autoHide: true
									});
								});
							});
						}
					}
				}
			};
			if (this.selector.getConfig('ROLLBACK_INPUT_AFTER_CANCEL', false)) {
				options.declineCancelTitle = main_core.Loc.getMessage('CATALOG_SELECTOR_SAVING_NOTIFICATION_CANCEL_TITLE');
				options.events.onCancel = () => {
					this.selector.clearLayout();
					this.selector.layout();
				};
			}
			this.selector.getModel().showSaveNotifier(`nameChanger_${this.selector.getId()}`, options);
		}
		getPlaceholder() {
			return this.isSearchEnabled() && this.model.isEmpty() ? main_core.Loc.getMessage('CATALOG_SELECTOR_BEFORE_SEARCH_TITLE') : main_core.Loc.getMessage('CATALOG_SELECTOR_VIEW_NAME_TITLE');
		}
		#searchItem(searchQuery = '') {
			if (!this.selector.isProductSearchEnabled()) {
				return;
			}
			const dialog = this.getDialog();
			dialog.getPopup().show();
			dialog.search(searchQuery);
		}
	}

	class ProductSearchInputBarcodeFooter extends ProductSearchInputDefaultFooter {
		#barcodeContent = null;
		#scannerContent = null;
		constructor(id, options = {}) {
			super(id, options);
			this.getDialog().subscribe('SearchTab:onLoad', this.handleOnSearchLoad.bind(this));
		}
		getContent() {
			this.#barcodeContent = super.getContent();
			this.#scannerContent = this.#getScannerContent();
			main_core.Dom.style(this.#barcodeContent, 'display', 'none');
			return main_core.Tag.render`
			<div class="catalog-footers-container">
				${this.#barcodeContent}
				${this.#scannerContent}
			</div>
		`;
		}
		isViewEditButton() {
			return !this.options.isEmptyBarcode && super.isViewEditButton();
		}
		#getScannerContent() {
			const phrase = main_core.Tag.render`
			<div>${main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_BARCODE')}</div>
		`;
			const createButton = phrase.querySelector('create-button');
			main_core.Dom.replace(createButton, this.#getScannerLabelContainer());
			return main_core.Tag.render`
			<div class="ui-selector-search-footer-box">
				${phrase}
				${this.getLoaderContainer()}
			</div>
		`;
		}
		#getScannerLabelContainer() {
			return this.cache.remember('scannerLabel', () => {
				return main_core.Tag.render`
				<button type="button" class="catalog-footer-action" data-testid="catalog-selector-footer-scanner-btn" onclick="${this.options.onScannerClick}">
					<span class="ui-selector-footer-link ui-selector-footer-link-add footer-link--warehouse-barcode-icon">
						${main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_BARCODE_START_SCAN_LABEL')}
					</span>
					${this.#getScannerQueryContainer()}
				</button>
			`;
			});
		}
		#getScannerQueryContainer() {
			return this.cache.remember('scanner_name-container', () => {
				return main_core.Tag.render`
				<span class="ui-selector-search-footer-query"></span>
			`;
			});
		}
		handleOnSearch(event) {
			const {
				query
			} = event.getData();
			if (!main_core.Type.isStringFilled(query)) {
				this.show();
				main_core.Dom.style(this.#scannerContent, 'display', '');
				main_core.Dom.style(this.#barcodeContent, 'display', 'none');
			} else if (this.options.currentValue === query) {
				this.hide();
			} else {
				this.show();
				main_core.Dom.style(this.#barcodeContent, 'display', '');
				main_core.Dom.style(this.#scannerContent, 'display', 'none');
			}
			this.getQueryContainer().textContent = ` ${query}`;
			this.#getScannerQueryContainer().textContent = ` ${query}`;
		}
		handleOnSearchLoad(event) {
			const {
				searchTab
			} = event.getData();
			this.getDialog().getItems().forEach(item => {
				if (item.getCustomData().get('BARCODE') === searchTab.getLastSearchQuery().getQuery()) {
					this.hide();
				}
			});
		}
	}

	class ProductSearchInputBarcode extends ProductSearchInputDefault {
		onFocusHandler = this.handleFocusEvent.bind(this);
		onBlurHandler = this.handleBlurEvent.bind(this);
		constructor(id, options = {}) {
			super(id, options);
			this.focused = false;
			this.settingsCollection = main_core.Extension.getSettings('catalog.product-selector');
			this.isInstalledMobileApp = this.selector.getConfig('IS_INSTALLED_MOBILE_APP') || this.settingsCollection.get('isInstallMobileApp');
			if (!this.settingsCollection.get('isEnabledQrAuth') && this.selector.getConfig('ENABLE_BARCODE_QR_AUTH', true)) {
				this.qrAuth = new ui_qrauthorization.QrAuthorization();
				this.qrAuth.createQrCodeImage();
			}
		}
		layout() {
			const block = super.layout();
			main_core.Dom.append(this.#getBarcodeIcon(), block);
			this.getNameInput().className += ' catalog-product-field-input-barcode';
			main_core.Event.bind(this.getNameInput(), 'focus', this.onFocusHandler);
			main_core.Event.bind(this.getNameInput(), 'blur', this.onBlurHandler);
			return block;
		}
		getDialogParams() {
			const entity = {
				id: 'barcode',
				options: {
					iblockId: this.model.getIblockId(),
					basePriceId: this.model.getBasePriceId(),
					currency: this.model.getCurrency()
				},
				dynamicLoad: true,
				dynamicSearch: true,
				searchFields: [{
					name: 'title',
					type: 'string',
					system: true,
					searchable: false
				}]
			};
			const restrictedProductTypes = this.selector.getConfig('RESTRICTED_PRODUCT_TYPES', null);
			if (!main_core.Type.isNil(restrictedProductTypes)) {
				entity.options.restrictedProductTypes = restrictedProductTypes;
			}
			const params = {
				id: `${this.id}_barcode`,
				height: 300,
				width: Math.max(this.getNameInput()?.offsetWidth, 565),
				context: null,
				targetNode: this.getNameInput(),
				enableSearch: false,
				multiple: false,
				dropdownMode: true,
				searchTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Tag.message`${'CATALOG_SELECTOR_IS_EMPTY_TITLE'}`,
						subtitle: this.isAllowedCreateProduct() ? main_core.Tag.message`${'CATALOG_SELECTOR_IS_EMPTY_SUBTITLE'}` : '',
						arrow: true
					}
				},
				events: {
					'Item:onSelect': this.onProductSelect.bind(this),
					'Search:onItemCreateAsync': this.createProduct.bind(this),
					'ChangeItem:onClick': this.showChangeNotification.bind(this)
				},
				entities: [entity]
			};
			if (this.model.getSkuId() && !main_core.Type.isStringFilled(this.model.getField(this.inputName))) {
				params.preselectedItems = [['barcode', this.model.getSkuId()]];
			}
			if (main_core.Type.isObject(this.settingsCollection.get('limitInfo'))) {
				params.footer = ProductSearchInputLimitedFooter;
			} else {
				params.footer = ProductSearchInputBarcodeFooter;
				params.footerOptions = {
					onScannerClick: this.#startMobileScanner.bind(this),
					isEmptyBarcode: !this.model || !this.model.isCatalogExisted(),
					inputName: this.inputName,
					errorAdminHint: this.settingsCollection.get('errorAdminHint'),
					allowEditItem: this.isAllowedEditProduct(),
					allowCreateItem: this.isAllowedCreateProduct(),
					creationLabel: main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_CREATE_WITH_BARCODE'),
					currentValue: this.getValue(),
					searchOptions: {
						allowCreateItem: this.isAllowedCreateProduct(),
						footerOptions: {
							label: main_core.Loc.getMessage('CATALOG_SELECTOR_SEARCH_POPUP_FOOTER_CREATE_WITH_BARCODE')
						}
					}
				};
			}
			return params;
		}
		handleFocusEvent() {
			this.focused = true;
		}
		handleBlurEvent() {
			this.focused = false;
		}
		isSearchEnabled() {
			return true;
		}
		showDetailLink() {
			return false;
		}
		getNameTag() {
			return null;
		}
		handleClickNameInput(event) {
			if (this.qrAuth && this.getDialog().getContainer()) {
				if (!main_core.Dom.hasClass(this.getDialog().getContainer(), 'qr-barcode-info')) {
					main_core.Dom.addClass(this.getDialog().getContainer(), 'qr-barcode-info');
				}
				if (this.getDialog().getContainer()) {
					main_core.Dom.append(this.#layoutMobileQrPopup(), this.getDialog().getContainer());
				}
			}
			super.handleClickNameInput(event);
		}
		showItems() {
			this.searchInDialog();
		}
		onChangeValue(value) {
			const fields = {};
			this.getNameInput().title = value;
			this.getNameInput().value = value;
			fields[this.inputName] = value;
			main_core_events.EventEmitter.emit('ProductSelector::onBarcodeChange', {
				rowId: this.selector.getRowId(),
				fields
			});
			this.selector.emit('onBarcodeChange', {
				value
			});
			if (this.selector.isEnabledAutosave()) {
				this.selector.getModel().setField(this.inputName, value);
				this.selector.getModel().showSaveNotifier(`barcodeChanger_${this.selector.getId()}`, {
					title: main_core.Loc.getMessage('CATALOG_SELECTOR_SAVING_NOTIFICATION_BARCODE'),
					disableCancel: true,
					events: {
						onSave: () => {
							if (this.selector) {
								this.selector.getModel().save([this.inputName]);
							}
						}
					}
				});
			}
		}
		searchInDialog() {
			this.#searchByBarcode(this.getSearchQuery());
		}
		createProductModelFromSearchQuery(searchQuery) {
			const model = super.createProductModelFromSearchQuery(searchQuery);
			model.setField(catalog_productSelector.ProductSelector.INPUT_FIELD_NAME, main_core.Loc.getMessage('CATALOG_SELECTOR_NEW_BARCODE_PRODUCT_NAME'));
			model.setField(this.inputName, searchQuery);
			return model;
		}
		checkCreationModel(creationModel) {
			if (!main_core.Type.isStringFilled(creationModel.getField(catalog_productSelector.ProductSelector.INPUT_FIELD_NAME))) {
				this.model.getErrorCollection().setError(SelectorErrorCode.NOT_SELECTED_PRODUCT, main_core.Loc.getMessage('CATALOG_SELECTOR_EMPTY_TITLE'));
				return false;
			}
			return true;
		}
		getPlaceholder() {
			return this.isSearchEnabled() && this.model.isEmpty() ? main_core.Loc.getMessage('CATALOG_SELECTOR_BEFORE_SEARCH_BARCODE_TITLE') : main_core.Loc.getMessage('CATALOG_SELECTOR_VIEW_BARCODE_TITLE');
		}
		handleClearIconClick(event) {
			this.toggleIcon(this.getClearIcon(), 'none');
			this.onChangeValue('');
			this.selector.focusName();
			event.stopPropagation();
			event.preventDefault();
		}
		applyScannerData(barcode) {
			this.#getProductIdByBarcode(barcode).then(response => {
				const productId = response?.data;
				if (productId) {
					this.#selectScannedBarcodeProduct(productId);
				} else {
					this.#searchByBarcode(barcode);
				}
				this.getNameInput().value = main_core.Text.encode(barcode);
			}).catch(error => console.error(error));
		}
		removeSpotlight() {
			if (this.spotlight) {
				this.spotlight.close();
			}
		}
		removeQrAuth() {
			const mobilePopup = this.getDialog().getContainer()?.querySelector('[data-role="mobile-popup"]');
			if (mobilePopup) {
				main_core.Dom.remove(mobilePopup);
				if (main_core.Dom.hasClass(this.getDialog().getContainer(), 'qr-barcode-info')) {
					main_core.Dom.removeClass(this.getDialog().getContainer(), 'qr-barcode-info');
				}
			}
			this.qrAuth = null;
		}
		destroy() {
			super.destroy();
			main_core.Event.unbind(this.getNameInput(), 'focus', this.onFocusHandler);
			main_core.Event.unbind(this.getNameInput(), 'blur', this.onBlurHandler);
		}
		#searchByBarcode(searchQuery = '') {
			if (!this.selector.isProductSearchEnabled()) {
				return;
			}
			const dialog = this.getDialog();
			if (!dialog) {
				return;
			}
			dialog.removeItems();
			if (!main_core.Type.isStringFilled(searchQuery) && this.model && this.model.isCatalogExisted()) {
				dialog.setPreselectedItems([['barcode', this.model.getSkuId()]]);
				dialog.loadState = 'UNSENT';
				dialog.load();
			}
			dialog.show();
			dialog.search(searchQuery);
		}
		#startMobileScanner(event) {
			if (this.isInstalledMobileApp) {
				this.#sendMobilePush(event);
				return;
			}
			if (!this.qrAuth) {
				this.qrAuth = new ui_qrauthorization.QrAuthorization();
				this.qrAuth.createQrCodeImage();
			}
			if (this.getDialog().isOpen()) {
				this.getDialog().hide();
				this.getDialog().subscribeOnce('onHide', this.handleClickNameInput.bind(this));
			} else {
				this.handleClickNameInput(event);
			}
		}
		#sendMobilePush(event) {
			event?.preventDefault();
			this.getDialog().hide();
			this.getNameInput().focus();
			if (!this.selector.isEnabledMobileScanning()) {
				return;
			}
			const token = this.selector.getMobileScannerToken();
			catalog_barcodeScanner.BarcodeScanner.open(token);
			const repeatLink = main_core.Tag.render`<span class='ui-notification-balloon-action'>${main_core.Loc.getMessage('CATALOG_SELECTOR_SEND_PUSH_ON_SCANNER_NOTIFICATION_REPEAT')}</span>`;
			main_core.Event.bind(repeatLink, 'click', this.#sendMobilePush.bind(this));
			const content = main_core.Tag.render`
			<div>
				<span>${main_core.Loc.getMessage('CATALOG_SELECTOR_SEND_PUSH_ON_SCANNER_NOTIFICATION')}</span>
				${repeatLink}
			</div>
		`;
			BX.UI.Notification.Center.notify({
				content,
				category: 'sending_push_barcode_scanner_notification',
				autoHideDelay: 5000
			});
		}
		#getProductIdByBarcode(barcode) {
			return main_core.ajax.runAction('catalog.ProductSelector.getProductIdByBarcode', {
				json: {
					barcode
				}
			});
		}
		#selectScannedBarcodeProduct(productId) {
			this.toggleIcon(this.getSearchIcon(), 'none');
			this.clearErrors();
			if (this.selector) {
				this.selector.onProductSelect(productId, {
					isNew: false,
					immutableFields: []
				});
				this.selector.clearLayout();
				this.selector.layout();
			}
			this.cache.delete('dialog');
		}
		#getBarcodeIcon() {
			return this.cache.remember('barcodeIcon', () => {
				const barcodeIcon = main_core.Tag.render`
				<button	class="ui-ctl-before warehouse-barcode-icon" title="${main_core.Loc.getMessage('CATALOG_SELECTOR_BARCODE_ICON_TITLE')}"></button>
			`;
				if (!this.settingsCollection.get('isShowedBarcodeSpotlightInfo') && this.selector.getConfig('ENABLE_INFO_SPOTLIGHT', true)) {
					this.spotlight = new BX.SpotLight({
						id: 'selector_barcode_scanner_info',
						targetElement: barcodeIcon,
						autoSave: true,
						targetVertex: 'middle-center',
						zIndex: 200
					});
					this.spotlight.show();
					main_core_events.EventEmitter.subscribe(this.spotlight, 'BX.SpotLight:onTargetEnter', () => {
						const guide = new ui_tour.Guide({
							steps: [{
								target: barcodeIcon,
								title: main_core.Loc.getMessage('CATALOG_SELECTOR_BARCODE_SCANNER_FIRST_TIME_HINT_TITLE'),
								text: main_core.Loc.getMessage('CATALOG_SELECTOR_BARCODE_SCANNER_FIRST_TIME_HINT_TEXT')
							}],
							onEvents: true
						});
						guide.getPopup().setAutoHide(true);
						guide.showNextStep();
						this.selector.setConfig('ENABLE_INFO_SPOTLIGHT', false);
						this.selector.emit('onSpotlightClose', {});
					});
				}
				main_core.Event.bind(barcodeIcon, 'click', event => {
					event.preventDefault();
					if (this.qrAuth) {
						this.handleClickNameInput(event);
					} else {
						this.#startMobileScanner(event);
					}
				});
				return barcodeIcon;
			});
		}
		#layoutMobileQrPopup() {
			return this.cache.remember('qrMobilePopup', () => {
				const closeIcon = main_core.Tag.render`<span class="popup-window-close-icon"></span>`;
				main_core.Event.bind(closeIcon, 'click', this.#closeMobilePopup.bind(this));
				let sendButton = '';
				let helpButton = '';
				if (top.BX.Helper) {
					helpButton = main_core.Tag.render`
					<a class="product-selector-mobile-popup-link ui-btn ui-btn-light-border ui-btn-round">
						${main_core.Loc.getMessage('CATALOG_SELECTOR_MOBILE_POPUP_HELP_BUTTON')}
					</a>
				`;
					main_core.Event.bind(helpButton, 'click', () => {
						top.BX.Helper.show('redirect=detail&code=14956818');
					});
					sendButton = main_core.Tag.render`
					<a class="product-selector-mobile-popup-link ui-btn ui-btn-link">
						${main_core.Loc.getMessage('CATALOG_SELECTOR_MOBILE_POPUP_SEND_PUSH_BUTTON')}
					</a>
				`;
					main_core.Event.bind(sendButton, 'click', () => {
						top.BX.Helper.show('redirect=detail&code=15042444');
					});
				}
				return main_core.Tag.render`
				<div data-role="mobile-popup">
					<div class="product-selector-mobile-popup-overlay"></div>
					<div class="product-selector-mobile-popup-content">
						<div class="product-selector-mobile-popup-title">${main_core.Loc.getMessage('CATALOG_SELECTOR_MOBILE_POPUP_TITLE')}</div>
						<div class="product-selector-mobile-popup-text">${main_core.Loc.getMessage('CATALOG_SELECTOR_MOBILE_POPUP_INSTRUCTION')}</div>
						<div class="product-selector-mobile-popup-qr">
							${this.qrAuth.getQrNode()}
						</div>
						<div class="product-selector-mobile-popup-link-container">
							${helpButton}
							${sendButton}
						</div>
						${closeIcon}
					</div>
				</div>
			`;
			});
		}
		#closeMobilePopup() {
			this.removeQrAuth();
			main_core.ajax.runAction('catalog.ProductSelector.isInstalledMobileApp', {
				json: {}
			}).then(result => {
				this.selector.emit('onBarcodeQrClose', {});
				if (result.data === true) {
					this.selector.emit('onBarcodeScannerInstallChecked', {});
					this.isInstalledMobileApp = true;
				}
			}).catch(error => console.error(error));
			main_core.userOptions.save('product-selector', 'barcodeQrAuth', 'showed', 'Y');
		}
	}

	class ProductSearchInputPlacementFooter extends ui_entitySelector.BaseFooter {
		render() {
			const container = main_core.Tag.render`<div>${this.getContent()}</div>`;
			main_core.Dom.addClass(container, this.getContainerClassName());
			return container;
		}
		getHelpLink() {
			const helpLink = main_core.Tag.render`
			<div class="product-selector-placement__help-link">
				${main_core.Loc.getMessage('CATALOG_SELECTOR_1C_HELP_LINK')}
			</div>
		`;
			main_core.Event.bind(helpLink, 'click', () => {
				if (top.BX && top.BX.Helper) {
					top.BX.Helper.show('redirect=detail&code=20233654');
				}
			});
			return helpLink;
		}

		/**
		 * @abstract
		 */
		getContent() {
			throw new Error('Method "getContent" should be overridden');
		}

		/**
		 * @abstract
		 */
		getContainerClassName() {
			throw new Error('Method "getContainerClassName" should be overridden');
		}
	}

	class ProductSearchInputPlacementFooterLock extends ProductSearchInputPlacementFooter {
		getContent() {
			const statusNode = main_core.Tag.render`
			<div class="product-selector-placement__status">
				${this.getOption('text') || ''}
			</div>
		`;
			main_core.Event.bind(statusNode, 'click', () => {
				catalog_toolAvailabilityManager.OneCPlanRestrictionSlider.show();
			});
			return main_core.Tag.render`
			<div class="product-selector-placement__container --lock">
				<div class="product-selector-placement__icon-1C">
					<div class="ui-icon-set --1c"></div>
				</div>
				${statusNode}
				${this.getHelpLink()}
			</div>
		`;
		}
		getContainerClassName() {
			return 'product-selector-placement__footer-failure';
		}
	}

	class ProductSearchInputPlacementFooterFailure extends ProductSearchInputPlacementFooter {
		getContent() {
			return main_core.Tag.render`
			<div class="product-selector-placement__container --default">
				<div class="product-selector-placement__icon-1C">
					<div class="ui-icon-set --1c"></div>
				</div>
				<div class="ui-icon-set --warning product-selector-placement__icon-error"></div>
				<div class="product-selector-placement__status">
					${this.getOption('text') || ''}
				</div>
				${this.getHelpLink()}
			</div>
		`;
		}
		getContainerClassName() {
			return 'product-selector-placement__footer-failure';
		}
	}

	class ProductSearchInputPlacementFooterLoading extends ProductSearchInputPlacementFooter {
		getContent() {
			return main_core.Tag.render`
			<div class="product-selector-placement__container">
				<div class="product-selector-placement__loader-icon">
					<div class="ui-icon-set --1c"></div>
					<div class="product-selector-placement__loader">
						<div class="product-selector-placement__loader-subtract"></div>
					</div>
				</div>
				<div class="product-selector-placement__status">
					${main_core.Loc.getMessage('CATALOG_SELECTOR_1C_CONNECTING')}
				</div>
				${this.getHelpLink()}
			</div>
		`;
		}
		getContainerClassName() {
			return 'product-selector-placement__footer-loading';
		}
	}

	class ProductSearchInputPlacementFooterSuccess extends ProductSearchInputPlacementFooter {
		getContent() {
			return main_core.Tag.render`
			<div class="product-selector-placement__container">
				<div class="product-selector-placement__icon-1C">
					<div class="ui-icon-set --1c"></div>
				</div>
				<div class="product-selector-placement__status">
					${main_core.Loc.getMessage('CATALOG_SELECTOR_1C_CONNECTED')}
				</div>
				${this.getHelpLink()}
			</div>
		`;
		}
		getContainerClassName() {
			return 'product-selector-placement__footer-success';
		}
	}

	class ProductSearchInputPlacement extends ProductSearchInputBase {
		#searchTimer = null;
		#productCreateTimer = null;
		#settingsCollection = {};
		constructor(id, options = {}) {
			super(id, options);
			this.#settingsCollection = main_core.Extension.getSettings('catalog.product-selector');
			main_core_events.EventEmitter.subscribe('Catalog:ProductSelectorPlacement:onProductCreated', this.#onProductCreated.bind(this));
			main_core_events.EventEmitter.subscribe('Catalog:ProductSelectorPlacement:onProductsFound', this.#onProductsFound.bind(this));
			this.#initializePlacement().catch(() => {});
		}
		isSearchEnabled() {
			return true;
		}
		onDialogShow(event) {
			this.#initializePlacement().catch(() => {});
		}
		getDialogParams() {
			return {
				...super.getDialogParams(),
				...this.#getDialogParamsFooter(),
				searchOptions: {
					allowCreateItem: false
				},
				searchTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Loc.getMessage('CATALOG_SELECTOR_IS_EMPTY_TITLE'),
						subtitle: '',
						arrow: false
					}
				},
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_SEARCH_TITLE'),
						subtitle: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_SEARCH_SUBTITLE')
					}
				}
			};
		}
		searchInDialog() {
			this.getDialog().getPopup().show();
			this.#initializePlacement().then(() => this.searchInDialogActual()).catch(() => {});
		}
		searchInDialogActual() {
			const dialog = this.getDialog();
			dialog.getPopup().show();
			if (this.isSearchQueryEmpty()) {
				this.clear();
				dialog.selectTab(this.getDialog().getRecentTab().getId());
				this.showItems();
			} else {
				this.dialogMode = DialogMode.SEARCHING;
				dialog.selectTab(dialog.getSearchTab().getId());
				dialog.getSearchTab().getStub().hide();
				this.#initializePlacement().then(() => this.#searchInExternalCatalog()).catch(() => {});
			}
		}
		handleClickNameInput() {
			if (this.#settingsCollection.is1cPlanRestricted) {
				catalog_toolAvailabilityManager.OneCPlanRestrictionSlider.show();
				return;
			}
			this.getDialog().getPopup().show();
			this.#initializePlacement().then(() => this.showItems()).catch(() => {});
		}
		getPlaceholder() {
			return main_core.Loc.getMessage('CATALOG_SELECTOR_1C_INPUT_PLACEHOLDER');
		}
		getOnProductSelectConfig(item) {
			return {
				needExternalUpdate: item.getCustomData().get('needExternalUpdate')
			};
		}
		onProductSelect(event) {
			const item = event.getData().item;
			if (event.getTarget() === this.getDialog() && item.getCustomData().has('appSid')) {
				this.clearErrors();
				this.selector.emitOnProductSelectEvents();
				this.#onExternalCatalogProductSelect(item);
				return;
			}
			super.onProductSelect(event);
		}
		isFooterHidable() {
			return false;
		}
		#onExternalCatalogProductSelect(item) {
			if (this.#productCreateTimer) {
				return;
			}
			const returnEventData = {
				rowId: this.selector.getRowId()
			};
			main_core_events.EventEmitter.emit('Catalog:ProductSelectorPlacement:onNeedProductCreate', {
				appSid: item.getCustomData().get('appSid'),
				productId: item.id,
				returnEventData
			});
			this.#productCreateTimer = setTimeout(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING_ERROR'),
					autoHide: true,
					autoHideDelay: 4000
				});
				this.#onProductCreated(new main_core_events.BaseEvent({
					data: {
						...returnEventData,
						createdProduct: null
					}
				}));
			}, catalog_externalCatalogPlacement.ExternalCatalogPlacement.RESPONSE_TIMEOUT);
		}
		#onProductsFound(event) {
			const {
				rowId,
				searchResults,
				searchQuery
			} = event.getData();
			if (rowId !== this.selector.getRowId()) {
				return;
			}
			this.#clearSearchTimer();
			if (searchQuery !== this.getSearchQuery()) {
				return;
			}
			const dialog = this.getDialog();
			dialog.selectTab(dialog.getSearchTab().getId());
			if (searchResults.length === 0) {
				this.#renderStub(this.getDialog().getSearchTab(), {
					title: main_core.Loc.getMessage('CATALOG_SELECTOR_IS_EMPTY_TITLE'),
					subtitle: '',
					arrow: false
				});
			}
			for (const searchResultItem of searchResults) {
				dialog.addItem({
					id: searchResultItem.id,
					title: searchResultItem.name,
					avatar: '/bitrix/js/catalog/product-selector/images/icon1C.png',
					entityId: 'product',
					tabs: dialog.getSearchTab().getId(),
					customData: {
						appSid: this.selector.placement.getAppSidId()
					}
				});
			}
			this.#hideSearchLoader();
			this.#toggleEmptyResult();
			this.getDialog().setFooter(ProductSearchInputPlacementFooterSuccess);
		}
		#clearSearchTimer() {
			clearTimeout(this.#searchTimer);
			this.#searchTimer = null;
		}
		#onProductCreated(event) {
			if (this.#productCreateTimer === null) {
				return;
			}
			const {
				rowId,
				createdProduct
			} = event.getData();
			if (rowId !== this.selector.getRowId()) {
				return;
			}
			const dialog = this.getDialog();
			const createdProductId = main_core.Text.toNumber(createdProduct?.id);
			const item = new ui_entitySelector.Item({
				id: createdProductId || 0,
				entityId: 'product',
				title: createdProduct?.title || '',
				customData: {
					needExternalUpdate: false
				}
			});
			item.setDialog(dialog);
			if (createdProductId > 0) {
				dialog.saveRecentItem(item);
			}
			this.onProductSelect(new main_core_events.BaseEvent({
				data: {
					item
				}
			}));
			dialog.removeItems();
			dialog.hide();
			clearTimeout(this.#productCreateTimer);
			this.#productCreateTimer = null;
		}
		#showSearchLoader() {
			const searchLoader = this.getDialog().getSearchTab().getSearchLoader();
			searchLoader.show();
			searchLoader.getTextContainer().textContent = main_core.Loc.getMessage('CATALOG_SELECTOR_1C_SEARCH');
		}
		#hideSearchLoader() {
			this.getDialog().getSearchTab().getSearchLoader().hide();
		}
		#toggleEmptyResult() {
			this.getDialog().getSearchTab().toggleEmptyResult();
		}
		#searchInExternalCatalog() {
			this.#clearSearchTimer();
			this.#showSearchLoader();
			this.getDialog().removeItems();
			main_core_events.EventEmitter.emit('Catalog:ProductSelectorPlacement:onNeedSearchProducts', {
				appSid: this.selector.placement.getAppSidId(),
				searchQuery: this.getSearchQuery(),
				returnEventData: {
					rowId: this.selector.getRowId(),
					searchQuery: this.getSearchQuery()
				}
			});
			this.#searchTimer = setTimeout(() => {
				this.#clearSearchTimer();
				this.#hideSearchLoader();
				this.#toggleEmptyResult();
				this.getDialog().setFooter(ProductSearchInputPlacementFooterFailure, {
					text: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING')
				});
				this.#renderStub(this.getDialog().getSearchTab(), {
					title: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_NO_RESPONSE_TITLE'),
					subtitle: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_NO_RESPONSE_SUBTITLE').replace('[break]', '<br>'),
					arrow: true
				});
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING_ERROR'),
					autoHide: true,
					autoHideDelay: 4000
				});
			}, catalog_externalCatalogPlacement.ExternalCatalogPlacement.RESPONSE_TIMEOUT);
		}
		#getDialogParamsFooter() {
			let footer = ProductSearchInputPlacementFooterLoading;
			let footerOptions = {};
			if (this.selector.placement.isInitialized()) {
				footer = this.selector.placement.isInitializedSuccessfully() ? ProductSearchInputPlacementFooterSuccess : ProductSearchInputPlacementFooterFailure;
				if (this.selector.placement.isInitializedSuccessfully()) {
					footer = ProductSearchInputPlacementFooterSuccess;
				} else {
					footer = ProductSearchInputPlacementFooterFailure;
					footerOptions = {
						text: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_CONNECTED')
					};
				}
			}
			return {
				footer,
				footerOptions
			};
		}
		#initializePlacement() {
			return new Promise((resolve, reject) => {
				this.selector.placement.initialize().then(() => {
					this.getDialog().setFooter(ProductSearchInputPlacementFooterSuccess);
					resolve();
				}).catch(error => {
					this.#renderStub(this.getDialog().getRecentTab(), {
						title: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_INIT_FAILURE_TITLE'),
						subtitle: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_RECENT_TAB_INIT_FAILURE_SUBTITLE').replace('[break]', '<br>'),
						arrow: true
					});
					if (error?.reason === 'tariff') {
						this.getDialog().setFooter(ProductSearchInputPlacementFooterLock, {
							text: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_CONNECTED')
						});
					} else {
						this.getDialog().setFooter(ProductSearchInputPlacementFooterFailure, {
							text: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_CONNECTED')
						});
					}
					reject();
				});
			});
		}
		loadPreselectedItems() {
			this.selector.placement.initialize().then(() => super.loadPreselectedItems()).catch(() => {});
		}
		#renderStub(tab, stubOptions) {
			this.getDialog().removeItems();
			tab.getStub().hide();
			tab.setStub(true, stubOptions);
			tab.getStub().show();
		}
	}

	class ProductImageInput {
		constructor(id, options = {}) {
			this.id = id || main_core.Text.getRandom();
			this.selector = options.selector || null;
			if (!(this.selector instanceof catalog_productSelector.ProductSelector)) {
				throw new Error('Product selector instance not found.');
			}
			this.config = options.config || {};
			if (!main_core.Type.isStringFilled(this.selector.getModel()?.getImageCollection().getEditInput())) {
				this.restoreDefaultInputHtml();
			}
			this.enableSaving = options.enableSaving;
			this.uploaderFieldMap = {};
		}
		getId() {
			return this.id;
		}
		setId(id) {
			this.id = id;
		}
		setView(html) {
			this.selector.getModel()?.getImageCollection().setPreview(html);
		}
		setInputHtml(html) {
			this.selector.getModel()?.getImageCollection().setEditInput(html);
		}
		restoreDefaultInputHtml() {
			const defaultInput = `
			<div class="ui-image-input-container ui-image-input-img--disabled">
				<div class="adm-fileinput-wrapper">
					<div class="adm-fileinput-area mode-pict adm-fileinput-drag-area"></div>
				</div>
			</div>
		`;
			this.selector.getModel()?.getImageCollection().setEditInput(defaultInput);
			this.selector.getModel()?.getImageCollection().setPreview(defaultInput);
		}
		isViewMode() {
			return this.selector && (this.selector.isViewMode() || !this.selector.model.isSaveable());
		}
		isEnabledLiveSaving() {
			return this.enableSaving;
		}
		layout() {
			const imageContainer = main_core.Tag.render`<div></div>`;
			const html = this.isViewMode() ? this.selector.getModel()?.getImageCollection()?.getPreview() : this.selector.getModel()?.getImageCollection()?.getEditInput();
			main_core.Runtime.html(imageContainer, html);
			return imageContainer;
		}
	}

	const instances = new Map();
	const iblockSkuTreeProperties = new Map();
	class ProductSelector extends main_core_events.EventEmitter {
		static MODE_VIEW = 'view';
		static MODE_EDIT = 'edit';
		static SHORT_VIEW_FORMAT = 'short';
		static FULL_VIEW_FORMAT = 'full';
		static INPUT_FIELD_NAME = 'NAME';
		static INPUT_FIELD_BARCODE = 'BARCODE';
		static ErrorCodes = SelectorErrorCode;
		static UIInputRequest = null;
		static RESTORE_FOCUS_FALLBACK_TIMEOUT = 1000;
		#inAjaxProcess = false;
		mode = ProductSelector.MODE_EDIT;
		cache = new main_core.Cache.MemoryCache();
		type = ProductSelector.INPUT_FIELD_NAME;
		mobileScannerToken = null;

		// Keyboard-origin variation change restores focus into the recreated radiogroup (B1).
		variationChangeFromKeyboard = false;
		variationChangePropertyId = null;
		variationChangeHandler = this.handleVariationChange.bind(this);
		onSaveImageHandler = this.onSaveImage.bind(this);
		onChangeFieldsHandler = main_core.Runtime.debounce(this.onChangeFields, 500, this);
		onUploaderIsInitedHandler = this.onUploaderIsInited.bind(this);
		onNameChangeFieldHandler = main_core.Runtime.debounce(this.onNameChange, 500, this);
		placementOnProductUpdatedHandler = this.placementOnProductUpdated.bind(this);
		static getById(id) {
			return instances.get(id) || null;
		}
		constructor(id, options = {}) {
			super();
			this.setEventNamespace('BX.Catalog.ProductSelector');
			this.id = id || main_core.Text.getRandom();
			options.inputFieldName = options.inputFieldName || ProductSelector.INPUT_FIELD_NAME;
			this.options = options || {};
			this.settings = main_core.Extension.getSettings('catalog.product-selector');
			this.type = this.options.type || ProductSelector.INPUT_FIELD_NAME;
			this.setMode(options.mode);
			this.isExternalCatalog = this.settings.get('isExternalCatalog', false);
			if (this.isExternalCatalog) {
				this.placement = catalog_externalCatalogPlacement.ExternalCatalogPlacement.create();
				this.placement.initialize();
			}
			if (options.model && options.model instanceof catalog_productModel.ProductModel) {
				this.model = options.model;
			} else {
				this.model = catalog_productModel.ProductModel.getById(this.id);
			}
			if (!(this.model instanceof catalog_productModel.ProductModel)) {
				this.model = new catalog_productModel.ProductModel({
					currency: options.currency,
					iblockId: main_core.Text.toNumber(options.iblockId),
					basePriceId: main_core.Text.toNumber(options.basePriceId),
					fields: options.fields,
					skuTree: options.skuTree,
					storeMap: options.storeMap
				});
			}
			this.model.getImageCollection().setMorePhotoValues(options.morePhotoValues);
			if (!main_core.Type.isNil(this.getConfig('DETAIL_PATH'))) {
				this.model.setDetailPath(this.getConfig('DETAIL_PATH'));
			}
			if (options.failedProduct) {
				this.model.getErrorCollection().setError(SelectorErrorCode.FAILED_PRODUCT, '');
			}
			if (this.isShowableEmptyProductError()) {
				this.model.getErrorCollection().setError(SelectorErrorCode.NOT_SELECTED_PRODUCT, this.getEmptySelectErrorMessage());
			}
			if (options.fileView) {
				this.model.getImageCollection().setPreview(options.fileView);
			}
			if (options.fileInput) {
				this.model.getImageCollection().setEditInput(options.fileInput);
			}
			this.layout();
			if (options.skuTree) {
				this.updateSkuTree(options.skuTree);
			}
			if (options.scannerToken) {
				this.setMobileScannerToken(options.scannerToken);
			}
			this.subscribeEvents();
			instances.set(this.id, this);
		}
		setModel(model) {
			this.model = model;
		}
		getModel() {
			return this.model;
		}
		setMode(mode) {
			if (!main_core.Type.isNil(mode)) {
				this.mode = mode === ProductSelector.MODE_VIEW ? ProductSelector.MODE_VIEW : ProductSelector.MODE_EDIT;
			}
		}
		isViewMode() {
			return this.mode === ProductSelector.MODE_VIEW;
		}
		isShortViewFormat() {
			return this.getConfig('VIEW_FORMAT', ProductSelector.FULL_VIEW_FORMAT) === ProductSelector.SHORT_VIEW_FORMAT;
		}
		isSaveable() {
			return !this.isViewMode() && this.model.isSaveable();
		}
		isEnabledAutosave() {
			return this.isSaveable() && this.getConfig('ENABLE_AUTO_SAVE', false);
		}
		isEnabledMobileScanning() {
			return !this.isViewMode() && this.getConfig('ENABLE_MOBILE_SCANNING', true);
		}
		getEmptySelectErrorMessage() {
			return !this.isExternalCatalog && this.checkProductAddRights() ? main_core.Loc.getMessage('CATALOG_SELECTOR_SELECTED_PRODUCT_TITLE') : main_core.Loc.getMessage('CATALOG_SELECTOR_SELECT_PRODUCT_TITLE');
		}
		getMobileScannerToken() {
			return this.mobileScannerToken || main_core.Text.getRandom(16);
		}
		checkProductViewRights() {
			return this.model.checkAccess(catalog_productModel.RightActionDictionary.ACTION_PRODUCT_VIEW) ?? true;
		}
		checkProductEditRights() {
			return this.model.checkAccess(catalog_productModel.RightActionDictionary.ACTION_PRODUCT_EDIT) ?? false;
		}
		checkProductAddRights() {
			return this.model.checkAccess(catalog_productModel.RightActionDictionary.ACTION_PRODUCT_ADD) ?? false;
		}
		setMobileScannerToken(token) {
			this.mobileScannerToken = token;
		}
		removeMobileScannerToken() {
			this.mobileScannerToken = null;
		}
		getId() {
			return this.id;
		}
		getType() {
			return this.type;
		}
		getConfig(name, defaultValue) {
			return BX.prop.get(this.options.config, name, defaultValue);
		}
		setConfig(name, value) {
			this.options.config[name] = value;
			return this;
		}
		getRowId() {
			return this.getConfig('ROW_ID');
		}
		getFileInput() {
			if (!this.fileInput) {
				this.fileInput = new ProductImageInput(this.options.fileInputId, {
					selector: this,
					enableSaving: this.getConfig('ENABLE_IMAGE_CHANGE_SAVING', false)
				});
			}
			return this.fileInput;
		}
		isProductSearchEnabled() {
			return this.getConfig('ENABLE_SEARCH', false) && this.model.getIblockId() > 0 && this.checkProductViewRights();
		}
		isSkuTreeEnabled() {
			return this.getConfig('ENABLE_SKU_TREE', true) !== false;
		}
		isImageFieldEnabled() {
			return this.getConfig('ENABLE_IMAGE_INPUT', true) !== false;
		}
		isShowableEmptyProductError() {
			const emptyChanged = this.model.isEmpty() && this.model.isChanged();
			return this.isEnabledEmptyProductError() && (emptyChanged || this.model.isSimple());
		}
		isShowableErrors() {
			return this.isEnabledEmptyProductError() || this.isEnabledEmptyImagesError();
		}
		isEnabledEmptyProductError() {
			return this.getConfig('ENABLE_EMPTY_PRODUCT_ERROR', false);
		}
		isEnabledEmptyImagesError() {
			return this.getConfig('ENABLE_EMPTY_IMAGES_ERROR', false);
		}
		isEnabledChangesRendering() {
			return this.getConfig('ENABLE_CHANGES_RENDERING', true);
		}
		isInputDetailLinkEnabled() {
			return this.getConfig('ENABLE_INPUT_DETAIL_LINK', false) && main_core.Type.isStringFilled(this.model.getDetailPath()) && this.checkProductViewRights();
		}
		getWrapper() {
			if (!this.wrapper) {
				this.wrapper = document.getElementById(this.id);
			}
			return this.wrapper;
		}
		renderTo(node) {
			this.clearLayout();
			this.wrapper = node;
			this.layout();
		}
		layout() {
			const wrapper = this.getWrapper();
			if (!wrapper) {
				return;
			}
			const block = main_core.Tag.render`<div class="catalog-product-field-inner"></div>`;
			main_core.Dom.append(this.layoutNameBlock(), block);
			if (this.getSkuTreeInstance()) {
				main_core.Dom.append(this.getSkuTreeInstance().layout(), block);
			}
			main_core.Dom.append(this.getErrorContainer(), block);
			this.defineWrapperClass(wrapper);
			wrapper.innerHTML = '';
			if (!this.isViewMode()) {
				main_core.Dom.append(block, wrapper);
			}
			if (this.isImageFieldEnabled()) {
				if (main_core.Reflection.getClass('BX.UI.ImageInput')) {
					this.layoutImage();
				}
				if (ProductSelector.UIInputRequest instanceof Promise) {
					ProductSelector.UIInputRequest.then(() => {
						this.layoutImage();
					});
				} else {
					ProductSelector.UIInputRequest = new Promise(resolve => {
						main_core.ajax.runAction('catalog.productSelector.getFileInput', {
							json: {
								iblockId: this.getModel().getIblockId()
							}
						}).then(() => {
							this.layoutImage();
							ProductSelector.UIInputRequest = null;
							resolve();
						});
					});
				}
				main_core.Dom.append(this.getImageContainer(), wrapper);
			}
			if (this.isViewMode()) {
				main_core.Dom.append(block, wrapper);
			}
			if (this.isViewMode()) {
				main_core.Dom.append(block, wrapper);
			}
			if (this.isShowableErrors) {
				this.layoutErrors();
			}
			this.subscribeToVariationChange();
		}
		focusName() {
			if (this.searchInput) {
				this.searchInput.focusName();
			}
			return this;
		}
		getImageContainer() {
			return this.cache.remember('imageContainer', () => main_core.Tag.render`<div class="catalog-product-img"></div>`);
		}
		getErrorContainer() {
			return this.cache.remember('errorContainer', () => main_core.Tag.render`
				<div
					class="catalog-product-error"
					data-testid="catalog-product-selector-${main_core.Text.encode(this.options.inputFieldName.toLowerCase())}-error-container"
				></div>
			`);
		}
		layoutErrors() {
			this.getErrorContainer().innerHTML = '';
			this.clearImageErrorBorder();
			if (!this.model.getErrorCollection().hasErrors()) {
				return;
			}
			const errors = this.model.getErrorCollection().getErrors();
			for (const code in errors) {
				if (!ProductSelector.ErrorCodes.getCodes().includes(code)) {
					continue;
				}
				if (code === 'EMPTY_IMAGE') {
					this.setImageErrorBorder();
				} else {
					main_core.Dom.append(main_core.Tag.render`<div class="catalog-product-error-item">${errors[code].text}</div>`, this.getErrorContainer());
					if (this.searchInput) {
						main_core.Dom.addClass(this.searchInput.getNameBlock(), 'ui-ctl-danger');
					}
				}
			}
		}
		setImageErrorBorder() {
			main_core.Dom.addClass(this.getImageContainer().querySelector('.adm-fileinput-area'), 'adm-fileinput-drag-area-error');
		}
		clearImageErrorBorder() {
			main_core.Dom.removeClass(this.getImageContainer().querySelector('.adm-fileinput-area'), 'adm-fileinput-drag-area-error');
		}
		onUploaderIsInited() {
			if (this.isEnabledEmptyImagesError()) {
				requestAnimationFrame(this.layoutErrors.bind(this));
			}
		}
		layoutImage() {
			this.getImageContainer().innerHTML = '';
			main_core.Dom.append(this.getFileInput().layout(), this.getImageContainer());
			this.refreshImageSelectorId = null;
		}
		clearState() {
			this.getModel().initFields({
				ID: '',
				NAME: '',
				BARCODE: '',
				PRODUCT_ID: null,
				SKU_ID: null
			}).setOption('isNew', false);
			this.getFileInput().restoreDefaultInputHtml();
			this.getModel().clearSkuTree();
			this.skuTreeInstance = null;
			this.getModel().getStoreCollection().clear();
		}
		clearLayout() {
			this.unsubscribeToVariationChange();
			const wrapper = this.getWrapper();
			if (wrapper) {
				wrapper.innerHTML = '';
			}
		}
		subscribeEvents() {
			this.internalUnsubscribeEvents();
			main_core_events.EventEmitter.incrementMaxListeners('ProductList::onChangeFields', 1);
			main_core_events.EventEmitter.incrementMaxListeners('ProductSelector::onNameChange', 1);
			main_core_events.EventEmitter.incrementMaxListeners('Catalog.ImageInput::save', 1);
			main_core_events.EventEmitter.incrementMaxListeners('onUploaderIsInited', 1);
			main_core_events.EventEmitter.incrementMaxListeners('Catalog:ProductSelectorPlacement:onProductUpdated', 1);
			main_core_events.EventEmitter.subscribe('ProductList::onChangeFields', this.onChangeFieldsHandler);
			main_core_events.EventEmitter.subscribe('ProductSelector::onNameChange', this.onNameChangeFieldHandler);
			main_core_events.EventEmitter.subscribe('Catalog.ImageInput::save', this.onSaveImageHandler);
			main_core_events.EventEmitter.subscribe('onUploaderIsInited', this.onUploaderIsInitedHandler);
			main_core_events.EventEmitter.subscribe('Catalog:ProductSelectorPlacement:onProductUpdated', this.placementOnProductUpdatedHandler);
		}
		unsubscribeEvents() {
			this.unsubscribeToVariationChange();
			this.internalUnsubscribeEvents();
		}
		internalUnsubscribeEvents() {
			main_core_events.EventEmitter.unsubscribe('Catalog.ImageInput::save', this.onSaveImageHandler);
			main_core_events.EventEmitter.unsubscribe('ProductList::onChangeFields', this.onChangeFieldsHandler);
			main_core_events.EventEmitter.unsubscribe('onUploaderIsInited', this.onUploaderIsInitedHandler);
			main_core_events.EventEmitter.unsubscribe('onUploaderIsInited', this.onUploaderIsInitedHandler);
			main_core_events.EventEmitter.unsubscribe('ProductSelector::onNameChange', this.onNameChangeFieldHandler);
			main_core_events.EventEmitter.unsubscribe('Catalog:ProductSelectorPlacement:onProductUpdated', this.placementOnProductUpdatedHandler);
		}
		defineWrapperClass(wrapper) {
			if (this.isViewMode()) {
				main_core.Dom.addClass(wrapper, 'catalog-product-view');
				main_core.Dom.removeClass(wrapper, 'catalog-product-edit');
				if (this.isShortViewFormat()) {
					main_core.Dom.addClass(wrapper, '--short-format');
				}
			} else {
				main_core.Dom.addClass(wrapper, 'catalog-product-edit');
				main_core.Dom.removeClass(wrapper, 'catalog-product-view');
			}
			if (this.isImageFieldEnabled()) {
				main_core.Dom.addClass(wrapper, '--with-images');
			}
		}
		getNameBlockView() {
			const productName = main_core.Text.encode(this.model.getField('NAME'));
			const namePlaceholder = main_core.Loc.getMessage('CATALOG_SELECTOR_VIEW_NAME_TITLE');
			if (this.getModel().getDetailPath()) {
				return main_core.Tag.render`
				<a href="${this.getModel().getDetailPath()}" title="${namePlaceholder}">${productName}</a>
			`;
			}
			return main_core.Tag.render`<span title="${namePlaceholder}">${productName}</span>`;
		}
		getNameInputFilledValue() {
			if (this.searchInput) {
				return this.searchInput.getFilledValue();
			}
			return '';
		}
		layoutNameBlock() {
			const block = main_core.Tag.render`<div class="catalog-product-field-input"></div>`;
			if (this.isViewMode()) {
				main_core.Dom.append(this.getNameBlockView(), block);
			} else {
				this.searchInput = this.#createSearchInput();
				main_core.Dom.append(this.searchInput.layout(), block);
			}
			return block;
		}
		#createSearchInput() {
			if (this.getType() !== ProductSelector.INPUT_FIELD_BARCODE && this.searchInput) {
				this.searchInput.destroy();
			}
			if (this.placement) {
				return new ProductSearchInputPlacement(this.id, {
					selector: this,
					model: this.getModel(),
					inputName: this.options.inputFieldName,
					isSearchEnabled: this.isProductSearchEnabled(),
					isEnabledEmptyProductError: this.isEnabledEmptyProductError(),
					isEnabledDetailLink: this.isInputDetailLinkEnabled()
				});
			}
			if (this.getType() === ProductSelector.INPUT_FIELD_BARCODE) {
				if (!this.searchInput) {
					return new ProductSearchInputBarcode(this.id, {
						selector: this,
						model: this.getModel(),
						inputName: this.options.inputFieldName
					});
				}
				return this.searchInput;
			}
			return new ProductSearchInputDefault(this.id, {
				selector: this,
				model: this.getModel(),
				inputName: this.options.inputFieldName,
				isSearchEnabled: this.isProductSearchEnabled(),
				isEnabledEmptyProductError: this.isEnabledEmptyProductError(),
				isEnabledDetailLink: this.isInputDetailLinkEnabled()
			});
		}
		searchInDialog() {
			this.searchInput.searchInDialog();
			return this;
		}
		updateSkuTree(tree) {
			this.getModel().setSkuTree(tree);
			this.skuTreeInstance = null;
			return this;
		}
		getIblockSkuTreeProperties() {
			return new Promise(resolve => {
				if (iblockSkuTreeProperties.has(this.getModel().getIblockId())) {
					resolve(iblockSkuTreeProperties.get(this.getModel().getIblockId()));
				} else {
					main_core.ajax.runAction('catalog.productSelector.getSkuTreeProperties', {
						json: {
							iblockId: this.getModel().getIblockId()
						}
					}).then(response => {
						iblockSkuTreeProperties.set(this.getModel().getIblockId(), response);
						resolve(response);
					});
				}
			});
		}
		getSkuTreeInstance() {
			if (this.isSkuTreeEnabled() && this.getModel()?.getSkuTree() && !this.skuTreeInstance) {
				this.skuTreeInstance = new catalog_skuTree.SkuTree({
					skuTree: this.getModel().getSkuTree(),
					selectable: this.getConfig('ENABLE_SKU_SELECTION', true),
					hideUnselected: this.getConfig('HIDE_UNSELECTED_ITEMS', false),
					isShortView: this.isViewMode() && this.isShortViewFormat()
				});
			}
			return this.skuTreeInstance;
		}
		subscribeToVariationChange() {
			const skuTree = this.getSkuTreeInstance();
			if (skuTree) {
				this.unsubscribeToVariationChange();
				skuTree.subscribe('SkuProperty::onChange', this.variationChangeHandler);
			}
		}
		unsubscribeToVariationChange() {
			const skuTree = this.getSkuTreeInstance();
			if (skuTree) {
				skuTree.unsubscribe('SkuProperty::onChange', this.variationChangeHandler);
			}
		}
		handleVariationChange(event) {
			const [skuFields,, meta] = event.getData();
			const productId = main_core.Text.toNumber(skuFields.PARENT_PRODUCT_ID);
			const variationId = main_core.Text.toNumber(skuFields.ID);
			if (productId <= 0 || variationId <= 0) {
				return;
			}
			this.variationChangeFromKeyboard = Boolean(meta?.fromKeyboard);
			this.variationChangePropertyId = meta?.propertyId ?? null;
			this.emit('onBeforeChange', {
				selectorId: this.getId(),
				rowId: this.getRowId()
			});
			this.#inAjaxProcess = true;
			if (this.placement) {
				this.placement.initialize().then(() => {
					this.placementEmitOnCatalogProductNeedToUpdate({
						productId: variationId,
						returnEventData: {
							rowId: this.getRowId(),
							scenario: 'variationChange',
							payload: [variationId]
						}
					});
				}).catch(() => {
					this.handleVariationChangeAjaxAction(variationId);
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING_ERROR'),
						autoHide: true,
						autoHideDelay: 4000
					});
				});
				return;
			}
			this.handleVariationChangeAjaxAction(variationId);
		}
		handleVariationChangeAjaxAction(variationId) {
			main_core.ajax.runAction('catalog.productSelector.getSelectedSku', {
				json: {
					variationId,
					options: {
						priceId: this.basePriceId,
						currency: this.model.getCurrency(),
						urlBuilder: this.getConfig('URL_BUILDER_CONTEXT')
					}
				}
			}).then(response => this.processResponse(response, {
				...this.options.config
			}));
		}
		onChangeFields(event) {
			const eventData = event.getData();
			if (eventData.rowId !== this.getRowId()) {
				return;
			}
			const fields = eventData.fields;
			this.getModel().setFields(fields);
		}
		reloadFileInput() {
			main_core.ajax.runAction('catalog.productSelector.getFileInput', {
				json: {
					iblockId: this.getModel().getIblockId(),
					skuId: this.getModel()?.getSkuId()
				}
			}).then(event => {
				this.getModel().getImageCollection().setEditInput(event.data.html);
				if (this.isImageFieldEnabled()) {
					this.layoutImage();
				}
			});
		}
		onNameChange(event) {
			const eventData = event.getData();
			if (eventData.rowId !== this.getRowId() || !this.isEnabledAutosave()) {
				return;
			}
			const fields = eventData.fields;
			this.getModel().setFields(fields);
			this.getModel().save().then(() => {
				BX.UI.Notification.Center.notify({
					id: 'saving_field_notify_name',
					closeButton: false,
					content: main_core.Tag.render`<div>${main_core.Loc.getMessage('CATALOG_SELECTOR_SAVING_NOTIFICATION_NAME_CHANGED')}</div>`,
					autoHide: true
				});
			});
		}
		onSaveImage(event) {
			const [, inputId, response] = event.getData();
			if (inputId !== this.getFileInput().getId()) {
				return;
			}
			this.getFileInput().setId(response.data.id);
			this.getFileInput().setInputHtml(response.data.input);
			this.getFileInput().setView(response.data.preview);
			this.getModel().getImageCollection().setMorePhotoValues(response.data.values);
			if (this.isImageFieldEnabled()) {
				this.layoutImage();
			}
			this.emit('onChange', {
				selectorId: this.id,
				rowId: this.getRowId(),
				fields: this.getModel().getFields(),
				morePhoto: this.getModel().getImageCollection().getMorePhotoValues()
			});
		}
		inProcess() {
			return this.#inAjaxProcess;
		}
		onProductSelect(productId, itemConfig) {
			this.emitOnProductSelectEvents();
			this.productSelectRequest(productId, itemConfig);
		}
		emitOnProductSelectEvents() {
			this.emit('onProductSelect', {
				selectorId: this.getId(),
				rowId: this.getRowId()
			});
			this.emit('onBeforeChange', {
				selectorId: this.getId(),
				rowId: this.getRowId()
			});
		}
		productSelectRequest(productId, itemConfig = {
			isNew: false,
			needExternalUpdate: true,
			immutableFields: []
		}) {
			this.#inAjaxProcess = true;
			if (this.placement && itemConfig.needExternalUpdate !== false) {
				this.placement.initialize().then(() => {
					this.placementEmitOnCatalogProductNeedToUpdate({
						productId,
						returnEventData: {
							rowId: this.getRowId(),
							scenario: 'productSelect',
							payload: [productId, itemConfig]
						}
					});
				}).catch(() => {
					this.productSelectAjaxAction(productId, itemConfig);
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING_ERROR'),
						autoHide: true,
						autoHideDelay: 4000
					});
				});
				return;
			}
			this.productSelectAjaxAction(productId, itemConfig);
		}
		productSelectAjaxAction(productId, itemConfig = {
			isNew: false,
			immutableFields: []
		}) {
			main_core.ajax.runAction('catalog.productSelector.getProduct', {
				json: {
					productId,
					options: {
						priceId: this.basePriceId,
						currency: this.model.getCurrency(),
						urlBuilder: this.getConfig('URL_BUILDER_CONTEXT')
					}
				}
			}).then(response => this.processResponse(response, {
				...this.options.config,
				...itemConfig
			}, true));
		}
		placementEmitOnCatalogProductNeedToUpdate(eventData) {
			main_core_events.EventEmitter.emit('Catalog:ProductSelectorPlacement:onNeedProductUpdate', {
				appSid: this.placement.getAppSidId(),
				...eventData
			});
			this.placementProductUpdateTimer = setTimeout(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CATALOG_SELECTOR_1C_NOT_RESPONDING_ERROR'),
					autoHide: true,
					autoHideDelay: 4000
				});
				this.placementOnProductUpdated(new main_core_events.BaseEvent({
					data: {
						...eventData.returnEventData
					}
				}));
			}, catalog_externalCatalogPlacement.ExternalCatalogPlacement.RESPONSE_TIMEOUT);
		}
		placementOnProductUpdated(event) {
			if (this.placementProductUpdateTimer === null) {
				return;
			}
			const {
				rowId,
				scenario,
				payload
			} = event.getData();
			if (rowId !== this.getRowId()) {
				return;
			}
			if (scenario === 'productSelect') {
				this.productSelectAjaxAction(...payload);
			} else if (scenario === 'variationChange') {
				this.handleVariationChangeAjaxAction(...payload);
			}
			clearTimeout(this.placementProductUpdateTimer);
			this.placementProductUpdateTimer = null;
		}
		processResponse(response, config = {}, isProductAction = false) {
			const data = response?.data || null;
			this.#inAjaxProcess = false;
			const fields = data?.fields || [];
			if (main_core.Type.isArray(config.immutableFields)) {
				config.immutableFields.forEach(field => {
					fields[field] = this.getModel().getField(field);
				});
				if (data) {
					data.fields = fields;
				}
			}
			if (isProductAction) {
				this.clearState();
				if (!data && this.isEnabledEmptyProductError()) {
					this.model.getErrorCollection().setError(SelectorErrorCode.NOT_SELECTED_PRODUCT, this.getEmptySelectErrorMessage());
				}
			}
			if (data) {
				this.changeSelectedElement(data, config);
			} else if (!isProductAction) {
				this.productSelectRequest(this.getModel().getProductId());
			}
			this.unsubscribeToVariationChange();
			if (this.isEnabledChangesRendering()) {
				this.clearLayout();
				this.layout();

				// Return focus to the name input of the freshly rendered row after this second,
				// asynchronous re-layout - but only for a product select (B7). Variation change
				// re-layouts here too (isProductAction=false) and must not steal focus, unless it
				// was triggered from the keyboard: then focus returns into the recreated
				// radiogroup so arrow-key navigation can continue (B1).
				if (isProductAction) {
					this.focusName();
				} else if (this.variationChangeFromKeyboard) {
					this.restoreVariationFocus(this.variationChangePropertyId);
				}
			}
			this.variationChangeFromKeyboard = false;
			this.variationChangePropertyId = null;
			this.emit('onChange', {
				selectorId: this.id,
				rowId: this.getRowId(),
				isNew: config.isNew || false,
				fields,
				morePhoto: this.getModel().getImageCollection().getMorePhotoValues()
			});
		}
		restoreVariationFocus(propertyId) {
			const skuTree = this.getSkuTreeInstance();
			if (!skuTree) {
				return;
			}

			// layout() recreated the sku-tree; its properties render asynchronously, so wait for
			// onSkuLoaded of THIS instance and let the sku-tree focus the changed group's tab-stop.
			// A tree without sku properties never emits onSkuLoaded (sku-tree layout is gated by
			// hasSku() && hasSkuProps()), so a timeout falls back to the name input and always drops
			// the subscription to avoid a leak. The one-shot guard keeps the two paths exclusive.
			const skuTreeId = skuTree.id;
			let settled = false;
			let fallbackTimer = null;
			const finish = focusAction => {
				if (settled) {
					return;
				}
				settled = true;
				clearTimeout(fallbackTimer);
				main_core_events.EventEmitter.unsubscribe('BX.Catalog.SkuTree::onSkuLoaded', handler);
				focusAction();
			};
			const handler = loadEvent => {
				const data = loadEvent.getData();
				if (!data || data.id !== skuTreeId) {
					return;
				}
				finish(() => {
					// focusPropertyTabStop() silently no-ops when the changed property group is no
					// longer rendered after the variation change (its tab-stop is gone). Detect the
					// missing tab-stop and fall back to the name input - symmetric with the timeout
					// branch - so a keyboard variation change never drops focus.
					if (this.hasRenderedTabStop(skuTreeId, propertyId)) {
						skuTree.focusPropertyTabStop(propertyId);
					} else {
						this.focusName();
					}
				});
			};
			main_core_events.EventEmitter.subscribe('BX.Catalog.SkuTree::onSkuLoaded', handler);
			fallbackTimer = setTimeout(() => finish(() => this.focusName()), ProductSelector.RESTORE_FOCUS_FALLBACK_TIMEOUT);
		}

		// True only when the changed variation property still has a radio (roving tab-stop) in
		// the rebuilt sku-tree, i.e. focusPropertyTabStop() would actually move focus. Mirrors
		// SkuTree.focusPropertyTabStop()'s numeric property match against the rendered radios.
		hasRenderedTabStop(skuTreeId, propertyId) {
			const container = document.getElementById(skuTreeId);
			if (!container) {
				return false;
			}
			return [...container.querySelectorAll('[role="radio"][data-property-id]')].some(radio => main_core.Text.toNumber(radio.dataset.propertyId) === main_core.Text.toNumber(propertyId));
		}
		changeSelectedElement(data, config) {
			const productId = main_core.Text.toInteger(data.productId);
			const productChanged = this.getModel().getProductId() !== productId;
			if (productChanged) {
				this.getModel().setOption('productId', productId);
				this.getModel().setOption('skuId', main_core.Text.toInteger(data.skuId));
				this.getModel().setOption('isSimpleModel', false);
				this.getModel().setOption('isNew', config.isNew);
			}
			this.getModel().initFields(data.fields);
			const imageField = {
				id: '',
				input: '',
				preview: '',
				values: []
			};
			if (main_core.Type.isObject(data.image)) {
				imageField.id = data.image.id;
				imageField.input = data.image.input;
				imageField.preview = data.image.preview;
				imageField.values = data.image.values;
			}
			this.getFileInput().setId(imageField.id);
			this.getFileInput().setInputHtml(imageField.input);
			this.getFileInput().setView(imageField.preview);
			this.getModel().getImageCollection().setMorePhotoValues(imageField.values);
			this.checkEmptyImageError();
			if (data.detailUrl) {
				this.getModel().setDetailPath(data.detailUrl);
			}
			if (main_core.Type.isObject(data.skuTree)) {
				this.updateSkuTree(data.skuTree);
			}
		}
		checkEmptyImageError() {
			if (!main_core.Type.isArrayFilled(this.getModel().getImageCollection().getMorePhotoValues()) && this.isEnabledEmptyImagesError()) {
				this.getModel().getErrorCollection().setError('EMPTY_IMAGE', main_core.Loc.getMessage('CATALOG_SELECTOR_EMPTY_IMAGE_ERROR'));
			} else {
				this.getModel().getErrorCollection().removeError('EMPTY_IMAGE');
			}
		}
		removeSpotlight() {
			this.searchInput?.removeSpotlight();
			this.setConfig('ENABLE_INFO_SPOTLIGHT', false);
		}
		removeQrAuth() {
			this.searchInput?.removeQrAuth();
			this.setConfig('ENABLE_BARCODE_QR_AUTH', false);
		}
	}

	exports.ProductSelector = ProductSelector;

})(this.BX.Catalog = this.BX.Catalog || {}, BX, window, BX, BX, BX.UI.Notification, BX.Event, BX.Catalog.SkuTree, BX.UI.EntitySelector, BX.Catalog, BX.Catalog, BX, BX.UI, BX.Catalog, BX.UI, BX.UI.Tour, BX, BX.Catalog, window, BX.Catalog);
//# sourceMappingURL=product-selector.bundle.js.map
