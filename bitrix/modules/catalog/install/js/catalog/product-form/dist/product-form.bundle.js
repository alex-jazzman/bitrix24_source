/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_vue, ui_vue_vuex, main_core, ui_notification, ui_designTokens, ui_fonts_opensans, catalog_productCalculator, currency_currencyCore, currency, ui_layoutForm, ui_forms, ui_buttons, main_core_events, catalog_productSelector, ui_common, ui_alerts, main_popup, catalog_productModel, main_loader, ui_messagecard, ui_vue_components_hint, ui_infoHelper, main_qrcode, clipboard, helper, ui_hint, ui_dialogs_messagebox) {
	'use strict';

	class FormElementPosition {
		static TOP = 'TOP';
		static BOTTOM = 'BOTTOM';
	}

	class ProductList extends ui_vue_vuex.VuexBuilderModel {
		/**
		 * @inheritDoc
		 */
		getName() {
			return 'productList';
		}
		getState() {
			return {
				currency: '',
				taxIncluded: 'N',
				basket: [],
				total: {
					sum: 0,
					discount: 0,
					taxSum: 0,
					result: 0
				}
			};
		}
		static getBaseProduct() {
			const random = main_core.Text.getRandom();
			return {
				offerId: null,
				selectorId: random,
				fields: {
					innerId: random,
					productId: null,
					skuId: null,
					code: null,
					type: null,
					module: null,
					sort: 0,
					price: null,
					basePrice: null,
					priceExclusive: null,
					quantity: 1,
					name: '',
					discount: 0,
					discountRate: 0,
					discountInfos: [],
					discountType: catalog_productCalculator.DiscountType.PERCENTAGE,
					tax: 0,
					taxSum: 0,
					taxIncluded: 'N',
					measureCode: 0,
					measureName: '',
					measureRatio: 1,
					isCustomPrice: 'N',
					additionalFields: [],
					properties: [],
					weight: 0,
					dimensions: {}
				},
				calculatedFields: [],
				catalogFields: {},
				showDiscount: 'N',
				showTax: 'N',
				skuTree: [],
				image: null,
				sum: 0,
				catalogPrice: null,
				discountSum: 0,
				detailUrl: '',
				encodedFields: null,
				errors: []
			};
		}
		getActions() {
			return {
				resetBasket({
					commit
				}) {
					commit('clearBasket');
					commit('addItem', {});
				},
				removeItem({
					dispatch,
					commit,
					state
				}, payload) {
					commit('deleteItem', payload);
					if (state.basket.length === 0) {
						commit('addItem', {});
					} else {
						state.basket.forEach((item, i) => {
							commit('updateItem', {
								index: i,
								fields: {
									sort: i
								}
							});
						});
					}
					dispatch('calculateTotal');
				},
				changeItem: ({
					dispatch,
					commit
				}, payload) => {
					commit('updateItem', payload);
					dispatch('calculateTotal');
				},
				setCurrency: ({
					commit
				}, payload) => {
					const currency = payload || '';
					commit('setCurrency', currency);
				},
				addItem: ({
					dispatch,
					commit
				}, payload) => {
					const item = payload.item || {
						fields: {}
					};
					commit('addItem', {
						item,
						position: payload.position || FormElementPosition.TOP
					});
					dispatch('calculateTotal');
				},
				calculateTotal: ({
					commit,
					state
				}) => {
					const total = {
						sum: 0,
						taxSum: 0,
						discount: 0,
						result: 0
					};
					state.basket.forEach(item => {
						const basePrice = main_core.Text.toNumber(item.fields.basePrice || 0);
						const quantity = main_core.Text.toNumber(item.fields.quantity || 0);
						const discount = main_core.Text.toNumber(item.fields.discount || 0);
						const taxSum = main_core.Text.toNumber(item.fields.taxSum || 0);
						total.sum += basePrice * quantity;
						total.result += main_core.Text.toNumber(item.sum);
						total.discount += discount * quantity;
						total.taxSum += taxSum;
					});
					total.discount = total.discount > total.sum ? total.sum : total.discount;
					commit('setTotal', total);
				}
			};
		}
		getGetters() {
			return {
				getBasket: state => () => {
					return state.basket;
				},
				getBaseProduct: () => () => {
					return ProductList.getBaseProduct();
				}
			};
		}
		getMutations() {
			return {
				addItem: (state, payload) => {
					let item = ProductList.getBaseProduct();
					item = Object.assign(item, payload.item);
					if (payload.position === FormElementPosition.BOTTOM) {
						state.basket.push(item);
					} else {
						state.basket.unshift(item);
					}
					state.basket.forEach((item, index) => {
						item.fields.sort = index;
					});
				},
				updateItem: (state, payload) => {
					if (main_core.Type.isNil(state.basket[payload.index])) {
						ui_vue.Vue.set(state.basket, payload.index, ProductList.getBaseProduct());
					}
					state.basket[payload.index] = Object.assign(state.basket[payload.index], payload.product);
				},
				clearBasket: state => {
					state.basket = [];
				},
				deleteItem: (state, payload) => {
					state.basket.splice(payload.index, 1);
					state.basket.forEach((item, index) => {
						item.fields.sort = index;
					});
				},
				setErrors: (state, payload) => {
					state.errors = payload;
				},
				clearErrors: state => {
					state.errors = [];
				},
				setCurrency: (state, payload) => {
					state.currency = payload;
				},
				setTotal: (state, payload) => {
					const formattedTotal = payload;
					if (main_core.Type.isStringFilled(state.currency)) {
						for (const key in payload) {
							if (payload.hasOwnProperty(key)) {
								formattedTotal[key] = currency_currencyCore.CurrencyCore.currencyFormat(payload[key], state.currency);
							}
						}
					}
					state.total = Object.assign(state.total, formattedTotal);
				}
			};
		}
	}

	const config = Object.freeze({
		databaseConfig: {
			name: 'catalog.product-form'
		},
		templateName: 'bx-form',
		templatePanelButtons: 'bx-panel-buttons',
		templatePanelCompilation: 'bx-panel-compilation',
		templateRowName: 'bx-form-row',
		templateFieldInlineSelector: 'bx-field-inline-selector',
		templateFieldPrice: 'bx-field-price',
		templateFieldResultSum: 'bx-field-result-sum',
		templateFieldQuantity: 'bx-field-quantity',
		templateFieldDiscount: 'bx-field-discount',
		templateFieldTax: 'bx-field-tax',
		templateSummaryTotal: 'bx-summary-total',
		moduleId: 'catalog'
	});

	class FormInputCode {
		static PRODUCT_SELECTOR = 'product-selector';
		static IMAGE_EDITOR = 'image-editor';
		static QUANTITY = 'quantity';
		static PRICE = 'price';
		static RESULT = 'result';
		static DISCOUNT = 'discount';
		static TAX = 'tax';
		static MEASURE = 'measure';
	}

	class FormErrorCode {
		static EMPTY_PRODUCT_SELECTOR = 0;
		static EMPTY_IMAGE = 1;
		static EMPTY_QUANTITY = 2;
		static EMPTY_PRICE = 3;
		static IS_NULLABLE_PRICE = 5;
	}

	class FormMode {
		static REGULAR = 'REGULAR';
		static READ_ONLY = 'READ_ONLY';
		static COMPILATION = 'COMPILATION';
	}

	ui_vue.Vue.component(config.templateFieldQuantity, {
		/**
		 * @emits 'onChangeQuantity' {quantity: number}
		 * @emits 'onSelectMeasure' {quantity: number, }
		 */

		props: {
			measureCode: Number,
			measureRatio: Number,
			measureName: String,
			quantity: Number,
			editable: Boolean,
			saveableMeasure: Boolean,
			hasError: Boolean,
			options: Object
		},
		created() {
			this.onInputQuantityHandler = main_core.Runtime.debounce(this.onInputQuantity, 500, this);
		},
		methods: {
			onInputQuantity(event) {
				if (!this.editable) {
					return;
				}
				event.target.value = event.target.value.replace(/[^.\d]/g, '.');
				const newQuantity = main_core.Text.toNumber(event.target.value);
				const lastSymbol = event.target.value.substr(-1);
				if (lastSymbol === '.') {
					return;
				}
				this.changeQuantity(newQuantity);
			},
			calculateCorrectionFactor(quantity, measureRatio) {
				let factoredQuantity = quantity;
				let factoredRatio = measureRatio;
				let correctionFactor = 1;
				while (!(Number.isInteger(factoredQuantity) && Number.isInteger(factoredRatio))) {
					correctionFactor *= 10;
					factoredQuantity = quantity * correctionFactor;
					factoredRatio = measureRatio * correctionFactor;
				}
				return correctionFactor;
			},
			incrementValue() {
				if (!this.editable) {
					return;
				}
				const correctionFactor = this.calculateCorrectionFactor(this.quantity, this.measureRatio);
				const quantity = (this.quantity * correctionFactor + this.measureRatio * correctionFactor) / correctionFactor;
				this.changeQuantity(quantity);
			},
			decrementValue() {
				if (this.quantity > this.measureRatio && this.editable) {
					const correctionFactor = this.calculateCorrectionFactor(this.quantity, this.measureRatio);
					const quantity = (this.quantity * correctionFactor - this.measureRatio * correctionFactor) / correctionFactor;
					this.changeQuantity(quantity);
				}
			},
			changeQuantity(value) {
				this.$emit('onChangeQuantity', value);
			},
			showPopupMenu(target) {
				if (!this.editable || !main_core.Type.isArray(this.options.measures)) {
					return;
				}
				const menuItems = [];
				this.options.measures.forEach(item => {
					menuItems.push({
						text: item.SYMBOL,
						item: item,
						onclick: this.selectMeasure
					});
				});
				if (menuItems.length > 0) {
					this.popupMenu = new main_popup.Menu({
						bindElement: target,
						items: menuItems
					});
					this.popupMenu.show();
				}
			},
			selectMeasure(event, params) {
				this.$emit('onSelectMeasure', {
					code: params.options?.item.CODE,
					name: params.options?.item.SYMBOL
				});
				if (this.popupMenu) {
					this.popupMenu.close();
				}
			}
		},
		// language=Vue
		template: `
		<div class="catalog-pf-product-input-wrapper" v-bind:class="{ 'ui-ctl-danger': hasError }">
			<input 	
				type="text" class="catalog-pf-product-input"
				v-bind:class="{ 'catalog-pf-product-input--disabled': !editable }"
				:value="quantity"
				@input="onInputQuantityHandler"
				:disabled="!editable"
				data-name="quantity"
				:data-value="quantity"
			>
			<div 
				class="catalog-pf-product-input-info catalog-pf-product-input-info--action" 
				@click="showPopupMenu($event.target)"
			>
				<span :title="measureName">{{ measureName }}</span>
			</div>
		</div>
	`
	});

	const PUBLISH_DELAY = 500;
	const MoneyInput = Object.freeze({
		PUBLISH_DELAY,
		sanitizeDecimalInput(value, selectionStart, selectionEnd) {
			const source = String(value ?? '');
			const start = Number.isInteger(selectionStart) ? selectionStart : source.length;
			const end = Number.isInteger(selectionEnd) ? selectionEnd : start;
			let result = '';
			let hasSeparator = false;
			let removedBeforeStart = 0;
			let removedBeforeEnd = 0;
			for (let index = 0; index < source.length; index++) {
				const char = source[index];
				const isDigit = /\d/.test(char);
				const isSeparator = char === '.' || char === ',';
				const keep = isDigit || isSeparator && !hasSeparator;
				if (keep) {
					result += isSeparator ? '.' : char;
					hasSeparator = hasSeparator || isSeparator;
					continue;
				}
				if (index < start) {
					removedBeforeStart++;
				}
				if (index < end) {
					removedBeforeEnd++;
				}
			}
			return {
				value: result,
				selectionStart: Math.max(0, start - removedBeforeStart),
				selectionEnd: Math.max(0, end - removedBeforeEnd)
			};
		},
		getDecimalPublishValue(value, allowTrailingSeparator = false) {
			const stringValue = String(value ?? '');
			if (stringValue === '') {
				return null;
			}
			const normalizedValue = allowTrailingSeparator ? stringValue.replace(/[.]$/, '') : stringValue;
			if (normalizedValue === '' || normalizedValue.endsWith('.')) {
				return null;
			}
			return Math.abs(main_core.Text.toNumber(normalizedValue));
		},
		hasTrailingDecimalSeparator(value) {
			return /[.,]$/.test(String(value ?? ''));
		},
		formatFocusedDecimal(value) {
			return String(main_core.Text.toNumber(value));
		},
		formatDecimal(value, precision) {
			return main_core.Text.toNumber(value).toFixed(main_core.Text.toInteger(precision) || 2);
		},
		selectAll(input) {
			input?.select?.();
		},
		moveCaretToEnd(input) {
			if (!input) {
				return;
			}
			const caretPosition = input.value.length;
			input.setSelectionRange?.(caretPosition, caretPosition);
		},
		applySelection(input, selectionStart, selectionEnd) {
			input?.setSelectionRange?.(selectionStart, selectionEnd);
		}
	});

	ui_vue.Vue.component(config.templateFieldPrice, {
		/**
		 * @emits 'onChangePrice' {price: number}
		 * @emits 'saveCatalogField' {}
		 */

		props: {
			selectorId: String,
			price: Number,
			editable: Boolean,
			hasError: Boolean,
			options: Object
		},
		data() {
			return {
				isFocused: false,
				isPointerFocus: false,
				hasInputChanges: false,
				inputValue: '',
				publishTimer: null,
				lastValidValue: main_core.Text.toNumber(this.price)
			};
		},
		beforeDestroy() {
			this.clearPublishTimer();
		},
		mounted() {
			BX.UI.Hint.init();
		},
		methods: {
			clearPublishTimer() {
				if (this.publishTimer) {
					clearTimeout(this.publishTimer);
					this.publishTimer = null;
				}
			},
			onInputPrice(event) {
				if (!this.editable) {
					return;
				}
				const input = event.target;
				this.hasInputChanges = true;
				const sanitized = MoneyInput.sanitizeDecimalInput(input.value, input.selectionStart, input.selectionEnd);
				this.inputValue = sanitized.value;
				if (input.value !== sanitized.value) {
					input.value = sanitized.value;
					MoneyInput.applySelection(input, sanitized.selectionStart, sanitized.selectionEnd);
				}
				const newPrice = MoneyInput.getDecimalPublishValue(this.inputValue);
				if (newPrice === null) {
					this.clearPublishTimer();
					return;
				}
				this.lastValidValue = newPrice;
				this.clearPublishTimer();
				this.publishTimer = setTimeout(() => {
					this.publishPrice(this.lastValidValue);
				}, MoneyInput.PUBLISH_DELAY);
			},
			publishPrice(newPrice) {
				this.clearPublishTimer();
				this.hasInputChanges = false;
				this.$emit('onChangePrice', newPrice);
			},
			onFocus(event) {
				if (!this.editable) {
					return;
				}
				const wasFocused = this.isFocused;
				this.isFocused = true;
				if (!wasFocused) {
					this.hasInputChanges = false;
					this.lastValidValue = main_core.Text.toNumber(this.price);
					this.inputValue = this.isPointerFocus ? event.target.value : MoneyInput.formatFocusedDecimal(this.price);
				}
				const shouldSelectAll = !this.isPointerFocus && !wasFocused;
				this.isPointerFocus = false;
				if (shouldSelectAll) {
					this.$nextTick(() => MoneyInput.selectAll(event.target));
				}
			},
			onBlur() {
				if (this.hasInputChanges) {
					const newPrice = this.inputValue === '' ? 0 : MoneyInput.getDecimalPublishValue(this.inputValue, true);
					this.publishPrice(newPrice ?? this.lastValidValue);
				} else {
					this.clearPublishTimer();
				}
				this.isFocused = false;
				this.isPointerFocus = false;
			},
			onPointerDown(event) {
				if (event.button !== undefined && event.button !== 0) {
					return;
				}
				this.isPointerFocus = true;
			},
			onPointerCancel() {
				this.isPointerFocus = false;
			}
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_');
			},
			currencySymbol() {
				return this.options.currencySymbol || '';
			},
			hintText() {
				if (!this.editable && !this.options?.isCatalogPriceEditEnabled) {
					return main_core.Loc.getMessage('CATALOG_FORM_PRICE_ACCESS_DENIED_HINT');
				}
				return null;
			},
			displayPrice() {
				if (this.isFocused) {
					return this.inputValue;
				}
				return MoneyInput.formatDecimal(this.price, this.options?.displayPrecision);
			}
		},
		// language=Vue
		template: `
		<div
			class="catalog-pf-product-input-wrapper"
			:class="{ 'ui-ctl-danger': hasError, '.catalog-pf-product-input-wrapper--disabled': !editable }"
			:data-hint="hintText"
			data-hint-no-icon
		>
			<input 	type="text" class="catalog-pf-product-input catalog-pf-product-input--align-right"
					v-bind:class="{ 'catalog-pf-product-input--disabled': !editable }"
					:value="displayPrice"
					@input="onInputPrice"
					@pointerdown="onPointerDown"
					@pointerup="onPointerCancel"
					@pointercancel="onPointerCancel"
					@focus="onFocus"
					@blur="onBlur"
					:disabled="!editable"
					data-name="price"
					:data-value="price"
			>
			<div class="catalog-pf-product-input-info" v-html="currencySymbol"></div>
		</div>
	`
	});

	ui_vue.Vue.component(config.templateFieldDiscount, {
		/**
		 * @emits 'changeDiscountType' {type: Y|N}
		 * @emits 'changeDiscount' {discountValue: number}
		 */

		props: {
			editable: Boolean,
			options: Object,
			discount: Number,
			discountType: Number,
			discountRate: Number
		},
		data() {
			return {
				isFocused: false,
				isPointerFocus: false,
				hasInputChanges: false,
				inputValue: '',
				publishTimer: null
			};
		},
		created() {
			this.currencySymbol = this.options.currencySymbol;
		},
		beforeDestroy() {
			this.clearPublishTimer();
		},
		mounted() {
			BX.UI.Hint.init();
		},
		methods: {
			clearPublishTimer() {
				if (this.publishTimer) {
					clearTimeout(this.publishTimer);
					this.publishTimer = null;
				}
			},
			onChangeType(event, params) {
				if (!this.editable) {
					return;
				}
				this.flushDiscount(true);
				const type = main_core.Text.toNumber(params?.options?.type) === catalog_productCalculator.DiscountType.MONETARY ? catalog_productCalculator.DiscountType.MONETARY : catalog_productCalculator.DiscountType.PERCENTAGE;
				this.$emit('changeDiscountType', type);
				this.inputValue = this.getFocusedDiscountValue(type);
				this.$nextTick(() => {
					this.inputValue = this.getFocusedDiscountValue(type);
				});
				if (this.popupMenu) {
					this.popupMenu.close();
				}
			},
			onInputDiscount(event) {
				if (!this.editable) {
					return;
				}
				this.hasInputChanges = true;
				this.inputValue = event.target.value;
				this.clearPublishTimer();
				if (this.inputValue === '' || MoneyInput.hasTrailingDecimalSeparator(this.inputValue)) {
					return;
				}
				this.publishTimer = setTimeout(() => {
					this.flushDiscount();
				}, MoneyInput.PUBLISH_DELAY);
			},
			flushDiscount(forceEmpty = false) {
				this.clearPublishTimer();
				if (!this.hasInputChanges) {
					return;
				}
				if (this.inputValue === '' && !forceEmpty) {
					return;
				}
				const discountValue = main_core.Text.toNumber(this.inputValue) || 0;
				this.hasInputChanges = false;
				if (discountValue === this.getCurrentDiscountValue() || !this.editable) {
					return;
				}
				this.$emit('changeDiscount', discountValue);
			},
			onFocus(event) {
				if (!this.editable) {
					return;
				}
				const wasFocused = this.isFocused;
				this.isFocused = true;
				if (!wasFocused) {
					this.hasInputChanges = false;
					this.inputValue = this.isPointerFocus ? event.target.value : this.getFocusedDiscountValue();
				}
				const shouldMoveCaretToEnd = !this.isPointerFocus && !wasFocused;
				this.isPointerFocus = false;
				if (shouldMoveCaretToEnd) {
					this.$nextTick(() => MoneyInput.moveCaretToEnd(event.target));
				}
			},
			onBlur() {
				this.flushDiscount(true);
				this.isFocused = false;
				this.isPointerFocus = false;
			},
			onPointerDown(event) {
				if (event.button !== undefined && event.button !== 0) {
					return;
				}
				this.isPointerFocus = true;
			},
			onPointerCancel() {
				this.isPointerFocus = false;
			},
			getFocusedDiscountValue(type = this.discountType) {
				const isPercent = main_core.Text.toNumber(type) === catalog_productCalculator.DiscountType.PERCENTAGE;
				const value = isPercent ? main_core.Text.toNumber(this.discountRate) : main_core.Text.toNumber(this.discount);
				return value === 0 ? '' : String(value);
			},
			getCurrentDiscountValue(type = this.discountType) {
				const isPercent = main_core.Text.toNumber(type) === catalog_productCalculator.DiscountType.PERCENTAGE;
				return isPercent ? main_core.Text.toNumber(this.discountRate) : main_core.Text.toNumber(this.discount);
			},
			showPopupMenu(target) {
				if (!this.editable || !main_core.Type.isArray(this.options.allowedDiscountTypes)) {
					return;
				}
				const menuItems = [];
				if (this.options.allowedDiscountTypes.includes(catalog_productCalculator.DiscountType.PERCENTAGE)) {
					menuItems.push({
						text: '%',
						onclick: this.onChangeType,
						type: catalog_productCalculator.DiscountType.PERCENTAGE
					});
				}
				if (this.options.allowedDiscountTypes.includes(catalog_productCalculator.DiscountType.MONETARY)) {
					menuItems.push({
						text: this.currencySymbol,
						onclick: this.onChangeType,
						type: catalog_productCalculator.DiscountType.MONETARY
					});
				}
				if (menuItems.length > 0) {
					this.popupMenu = new main_popup.Menu({
						bindElement: target,
						items: menuItems
					});
					this.popupMenu.show();
				}
			}
		},
		computed: {
			getDiscountInputValue() {
				if (this.isFocused) {
					return this.inputValue;
				}
				const isPercent = main_core.Text.toNumber(this.discountType) === catalog_productCalculator.DiscountType.PERCENTAGE;
				const value = isPercent ? main_core.Text.toNumber(this.discountRate) : main_core.Text.toNumber(this.discount);

				// No discount → render an empty field so the "0" placeholder is shown.
				// Focusing it then starts from scratch: there is no leading 0 to clear
				// before typing a value.
				if (value === 0) {
					return '';
				}
				if (isPercent) {
					return value.toFixed(4).replace(/\.?0+$/, '') || '0';
				}
				const precision = main_core.Text.toInteger(this.options?.displayPrecision) || 2;
				return value.toFixed(precision);
			},
			getDiscountSymbol() {
				return main_core.Text.toNumber(this.discountType) === catalog_productCalculator.DiscountType.PERCENTAGE ? '%' : this.currencySymbol;
			},
			wrapperClasses() {
				return {
					'catalog-pf-product-input-wrapper--disabled': !this.editable
				};
			},
			hintText() {
				if (!this.editable && !this.options?.isCatalogDiscountSetEnabled) {
					return main_core.Loc.getMessage('CATALOG_FORM_DISCOUNT_ACCESS_DENIED_HINT');
				}
				return null;
			}
		},
		// language=Vue
		template: `
		<div
			class="catalog-pf-product-input-wrapper catalog-pf-product-input-wrapper--left"
			:class="wrapperClasses"
			:data-hint="hintText"
			data-hint-no-icon
		>
			<input class="catalog-pf-product-input catalog-pf-product-input--align-right catalog-pf-product-input--right"
				ref="discountInput"
				v-bind:class="{ 'catalog-pf-product-input--disabled': !editable }"
				:value="getDiscountInputValue"
				@input="onInputDiscount"
				@pointerdown="onPointerDown"
				@pointerup="onPointerCancel"
				@pointercancel="onPointerCancel"
				@focus="onFocus"
				@blur="onBlur"
				placeholder="0"
				:disabled="!editable"
				data-name="discount"
				:data-value="getDiscountInputValue"
			/>
			<div class="catalog-pf-product-input-info catalog-pf-product-input-info--action"
				@click="showPopupMenu">
				<span v-html="getDiscountSymbol"></span>
			</div>
		</div>
	`
	});

	function decodeCurrencyText(value) {
		if (!main_core.Type.isString(value)) {
			return '';
		}
		const textarea = document.createElement('textarea');
		textarea.innerHTML = value;
		return textarea.value;
	}
	ui_vue.Vue.component(config.templateFieldTax, {
		/**
		 * @emits 'changeTax' {taxId: number, taxValue: number | null}
		 */

		props: {
			taxId: Number,
			editable: Boolean,
			options: Object,
			taxRate: {
				type: Number,
				default: 0
			},
			taxSum: {
				type: Number,
				default: 0
			},
			currencySymbol: {
				type: String,
				default: ''
			}
		},
		computed: {
			taxValue() {
				return main_core.Text.toNumber(this.taxRateItem ? this.taxRateItem.value : this.taxRate);
			},
			taxLabel() {
				return this.formatTaxRate(this.taxRateItem ? this.taxRateItem.value : this.taxRate);
			},
			taxRateItem() {
				return this.getTaxRateItem(this.taxId);
			},
			hasTaxSum() {
				return Number.isFinite(this.taxSum) && this.taxSum > 0;
			},
			formattedTaxSum() {
				const value = main_core.Text.toNumber(this.taxSum);
				const currency = this.options?.currency;
				if (main_core.Type.isStringFilled(currency)) {
					const formatted = currency_currencyCore.CurrencyCore.currencyFormat(value, currency, false);
					if (main_core.Type.isStringFilled(formatted)) {
						return decodeCurrencyText(formatted);
					}
				}
				const precision = main_core.Text.toInteger(this.options?.displayPrecision) || 2;
				return value.toFixed(precision);
			},
			normalizedCurrencySymbol() {
				return decodeCurrencyText(this.currencySymbol);
			}
		},
		methods: {
			onChangeValue(event, params) {
				const taxId = main_core.Text.toNumber(params?.options?.id);
				if (taxId === main_core.Text.toNumber(this.taxId) || !this.editable) {
					return;
				}
				this.$emit('changeTax', {
					taxValue: params?.options?.item,
					taxId
				});
				if (this.popupMenu) {
					this.popupMenu.close();
				}
			},
			getTaxRateList() {
				return main_core.Type.isArray(this.options.taxRateList) ? this.options.taxRateList : [];
			},
			getTaxRateItem(taxId) {
				const taxRateList = this.getTaxRateList();
				const normalizedTaxId = main_core.Text.toInteger(taxId);
				const item = taxRateList.find(rate => rate.taxId === normalizedTaxId);
				if (item || normalizedTaxId !== 0 || main_core.Text.toNumber(this.taxRate) > 0) {
					return item;
				}
				return taxRateList.find(rate => rate.value === null);
			},
			formatTaxRate(value) {
				// `null` is the "no VAT" rate (EXCLUDE_VAT='Y'); show its label instead of `null%`.
				if (value === null) {
					return main_core.Loc.getMessage('CATALOG_FORM_TAX_WITHOUT_VAT');
				}
				return main_core.Text.toNumber(value) + '%';
			},
			showPopupMenu(target) {
				if (!this.editable || !main_core.Type.isArray(this.options.taxRateList)) {
					return;
				}
				const menuItems = [];
				this.options.taxRateList.forEach(({
					taxId,
					value
				}) => {
					menuItems.push({
						id: taxId,
						text: this.formatTaxRate(value),
						item: value,
						dataset: {
							testid: `catalog-product-form-tax-rate-option-${taxId}`
						},
						onclick: this.onChangeValue
					});
				});
				if (menuItems.length > 0) {
					this.popupMenu = new main_popup.Menu({
						bindElement: target,
						items: menuItems
					});
					this.popupMenu.show();
				}
			}
		},
		// language=Vue
		template: `
		<div class="catalog-pf-product-tax-wrapper">
			<div
				class="catalog-pf-product-input-wrapper catalog-pf-product-input-wrapper--right"
				:class="{ 'catalog-pf-product-input-wrapper--disabled': !editable }"
				data-testid="catalog-product-form-tax-rate-trigger"
				@click="showPopupMenu"
			>
				<div
					class="catalog-pf-product-input"
					:class="{ 'catalog-pf-product-input--disabled': !editable }"
				>{{taxLabel}}</div>
				<div class="catalog-pf-product-input-info catalog-pf-product-input-info--dropdown"></div>
			</div>
			<div
				v-if="hasTaxSum"
				class="catalog-pf-product-tax-sum"
				data-testid="catalog-product-form-tax-sum"
			>
				<span
					class="catalog-pf-product-tax-sum__value"
					data-testid="catalog-product-form-tax-sum-value"
				>{{formattedTaxSum}}</span>
				<span
					class="catalog-pf-product-tax-sum__currency"
					data-testid="catalog-product-form-tax-sum-currency"
				>{{normalizedCurrencySymbol}}</span>
			</div>
		</div>
	`
	});

	ui_vue.Vue.component(config.templateFieldInlineSelector, {
		/**
		 * @emits 'onProductChange' {fields: object}
		 */
		props: {
			editable: Boolean,
			basketLength: Number,
			options: Object,
			basketItem: Object,
			model: Object
		},
		data() {
			return {
				currencySymbol: null,
				productSelector: null,
				imageControlId: null,
				selectorId: this.basketItem.selectorId
			};
		},
		created() {
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onProductSelect', this.onProductSelect.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onChange', this.onProductChange.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Catalog.ProductSelector:onClear', this.onProductClear.bind(this));
			main_core_events.EventEmitter.subscribe('ProductSelector::onNameChange', this.onNameChange.bind(this));
			main_core_events.EventEmitter.subscribe(this.$root.$app, 'onChangeCompilationMode', this.changeProductSelectorImageRequire.bind(this));
		},
		mounted() {
			this.productSelector = new catalog_productSelector.ProductSelector(this.selectorId, this.prepareSelectorParams());
			this.productSelector.renderTo(this.$refs.selectorWrapper);
		},
		methods: {
			changeProductSelectorImageRequire(event) {
				this.productSelector.checkEmptyImageError();
				this.productSelector.layoutErrors();
			},
			prepareSelectorParams() {
				const fields = {
					NAME: this.getField('name') || ''
				};
				if (!main_core.Type.isNil(this.getField('basePrice'))) {
					fields.PRICE = this.getField('basePrice');
					fields.CURRENCY = this.options.currency;
				}
				const selectorOptions = {
					iblockId: this.options.iblockId,
					basePriceId: this.options.basePriceId,
					currency: this.options.currency,
					skuTree: this.getDefaultSkuTree(),
					fileInputId: '',
					morePhotoValues: [],
					fileInput: '',
					model: this.model,
					config: {
						DETAIL_PATH: this.basketItem.detailUrl || '',
						ENABLE_SEARCH: true,
						ENABLE_INPUT_DETAIL_LINK: true,
						ENABLE_IMAGE_CHANGE_SAVING: true,
						ENABLE_EMPTY_PRODUCT_ERROR: this.options.enableEmptyProductError || this.isRequiredField(FormInputCode.PRODUCT_SELECTOR),
						ENABLE_EMPTY_IMAGES_ERROR: this.isRequiredField(FormInputCode.IMAGE_EDITOR),
						ROW_ID: this.selectorId,
						ENABLE_SKU_SELECTION: this.editable,
						HIDE_UNSELECTED_ITEMS: this.options.hideUnselectedProperties,
						URL_BUILDER_CONTEXT: this.options.urlBuilderContext,
						VIEW_FORMAT: this.options.isShortProductViewFormat ? catalog_productSelector.ProductSelector.SHORT_VIEW_FORMAT : catalog_productSelector.ProductSelector.FULL_VIEW_FORMAT
					},
					mode: this.editable ? catalog_productSelector.ProductSelector.MODE_EDIT : catalog_productSelector.ProductSelector.MODE_VIEW,
					fields
				};
				const formImage = this.basketItem.image;
				if (main_core.Type.isObject(formImage)) {
					selectorOptions.fileView = formImage.preview;
					selectorOptions.fileInput = formImage.input;
					selectorOptions.fileInputId = formImage.id;
					selectorOptions.morePhotoValues = formImage.values;
				}
				return selectorOptions;
			},
			isEnabledSaving() {
				return this.options.enableCatalogSaving && this.basketItem.hasEditRights;
			},
			isRequiredField(code) {
				return main_core.Type.isArray(this.options.requiredFields) && this.options.requiredFields.includes(code);
			},
			getDefaultSkuTree() {
				let skuTree = this.basketItem.skuTree || {};
				if (main_core.Type.isStringFilled(skuTree)) {
					skuTree = JSON.parse(skuTree);
				}
				return skuTree;
			},
			getField(name, defaultValue = null) {
				return this.basketItem.fields[name] || defaultValue;
			},
			onProductSelect(event) {
				const data = event.getData();
				if (main_core.Type.isStringFilled(data.selectorId) && data.selectorId === this.productSelector.getId()) {
					this.$emit('onProductSelect');
				}
			},
			onProductChange(event) {
				const data = event.getData();
				if (main_core.Type.isStringFilled(data.selectorId) && data.selectorId === this.productSelector.getId()) {
					const basePrice = data.fields.BASE_PRICE;
					const fields = {
						BASE_PRICE: basePrice,
						MODULE: 'catalog',
						NAME: data.fields.NAME,
						ID: data.fields.ID,
						PRODUCT_ID: data.fields.PRODUCT_ID,
						TYPE: data.fields.TYPE,
						SKU_ID: data.fields.SKU_ID,
						PROPERTIES: data.fields.PROPERTIES,
						URL_BUILDER_CONTEXT: this.options.urlBuilderContext,
						CUSTOMIZED: main_core.Type.isNil(data.fields.PRICE) || data.fields.CUSTOMIZED === 'Y' ? 'Y' : 'N',
						MEASURE_CODE: data.fields.MEASURE_CODE,
						MEASURE_NAME: data.fields.MEASURE_NAME,
						TAX_RATE: data.fields.TAX_RATE,
						TAX_INCLUDED: data.fields.TAX_INCLUDED ?? data.fields.VAT_INCLUDED,
						TAX_ID: data.fields.TAX_ID ?? data.fields.VAT_ID,
						MORE_PHOTO: data.morePhoto,
						IS_NEW: data.isNew
					};
					this.$emit('onProductChange', fields);
				}
			},
			onProductClear(event) {
				const data = event.getData();
				if (main_core.Type.isStringFilled(data.selectorId) && data.selectorId === this.productSelector.getId()) {
					this.$emit('onProductClear');
				}
			},
			onNameChange(event) {
				const data = event.getData();
				if (main_core.Type.isStringFilled(data.rowId) && data.rowId === this.productSelector.getId() && !this.productSelector.getModel().getProductId()) {
					const fields = {
						NAME: data.fields.NAME
					};
					this.$emit('onProductChange', fields);
				}
			}
		},
		// language=Vue
		template: `
			<div class='catalog-pf-product-item-section' :id='selectorId' ref='selectorWrapper'></div>
		`
	});

	ui_vue.Vue.component(config.templateFieldResultSum, {
		/**
		 * @emits 'onChangeSum' {sum: number}
		 */

		props: {
			sum: Number,
			editable: Boolean,
			options: Object
		},
		data() {
			return {
				isFocused: false,
				isPointerFocus: false,
				hasInputChanges: false,
				inputValue: '',
				publishTimer: null,
				lastValidValue: main_core.Text.toNumber(this.sum)
			};
		},
		beforeDestroy() {
			this.clearPublishTimer();
		},
		methods: {
			clearPublishTimer() {
				if (this.publishTimer) {
					clearTimeout(this.publishTimer);
					this.publishTimer = null;
				}
			},
			onInputSum(event) {
				if (!this.editable) {
					return;
				}
				const input = event.target;
				this.hasInputChanges = true;
				const sanitized = MoneyInput.sanitizeDecimalInput(input.value, input.selectionStart, input.selectionEnd);
				this.inputValue = sanitized.value;
				if (input.value !== sanitized.value) {
					input.value = sanitized.value;
					MoneyInput.applySelection(input, sanitized.selectionStart, sanitized.selectionEnd);
				}
				const newSum = MoneyInput.getDecimalPublishValue(this.inputValue);
				if (newSum === null) {
					this.clearPublishTimer();
					return;
				}
				this.lastValidValue = newSum;
				this.clearPublishTimer();
				this.publishTimer = setTimeout(() => {
					this.publishSum(this.lastValidValue);
				}, MoneyInput.PUBLISH_DELAY);
			},
			publishSum(newSum) {
				this.clearPublishTimer();
				this.hasInputChanges = false;
				this.$emit('onChangeSum', newSum);
			},
			onFocus(event) {
				if (!this.editable) {
					return;
				}
				const wasFocused = this.isFocused;
				this.isFocused = true;
				if (!wasFocused) {
					this.hasInputChanges = false;
					this.lastValidValue = main_core.Text.toNumber(this.sum);
					this.inputValue = this.isPointerFocus ? event.target.value : MoneyInput.formatFocusedDecimal(this.sum);
				}
				const shouldSelectAll = !this.isPointerFocus && !wasFocused;
				this.isPointerFocus = false;
				if (shouldSelectAll) {
					this.$nextTick(() => MoneyInput.selectAll(event.target));
				}
			},
			onBlur() {
				if (this.hasInputChanges) {
					const newSum = this.inputValue === '' ? 0 : MoneyInput.getDecimalPublishValue(this.inputValue, true);
					this.publishSum(newSum ?? this.lastValidValue);
				} else {
					this.clearPublishTimer();
				}
				this.isFocused = false;
				this.isPointerFocus = false;
			},
			onPointerDown(event) {
				if (event.button !== undefined && event.button !== 0) {
					return;
				}
				this.isPointerFocus = true;
			},
			onPointerCancel() {
				this.isPointerFocus = false;
			}
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_');
			},
			currencySymbol() {
				return this.options.currencySymbol || '';
			},
			displaySum() {
				if (this.isFocused) {
					return this.inputValue;
				}
				return MoneyInput.formatDecimal(this.sum, this.options?.displayPrecision);
			}
		},
		// language=Vue
		template: `
		<div class="catalog-pf-product-input-wrapper">
			<input 	type="text"
					class="catalog-pf-product-input catalog-pf-product-input--align-right"
					:class="{ 'catalog-pf-product-input--disabled': !editable }"
					:value="displaySum"
					@input="onInputSum"
					@pointerdown="onPointerDown"
					@pointerup="onPointerCancel"
					@pointercancel="onPointerCancel"
					@focus="onFocus"
					@blur="onBlur"
					:disabled="!editable"
					data-name="sum"
					:data-value="sum"
			>
			<div class="catalog-pf-product-input-info"
				 :class="{ 'catalog-pf-product-input--disabled': !editable }"
				 v-html="currencySymbol"
			></div>
		</div>
	`
	});

	ui_vue.Vue.component(config.templateRowName, {
		/**
		 * @emits 'changeProduct' {index: number, fields: object}
		 * @emits 'changeRowData' {index: number, fields: object}
		 * @emits 'emitErrorsChange' {index: number, errors: object}
		 * @emits 'refreshBasket'
		 * @emits 'removeItem' {index: number}
		 */

		props: {
			basketItem: Object,
			basketItemIndex: Number,
			basketLength: Number,
			countItems: Number,
			options: Object,
			mode: String
		},
		data() {
			return {
				model: null,
				currencySymbol: null,
				productSelector: null,
				imageControlId: null,
				selectorId: this.basketItem.selectorId,
				defaultMeasure: {
					name: '',
					id: null
				},
				blocks: {
					productSelector: FormInputCode.PRODUCT_SELECTOR,
					quantity: FormInputCode.QUANTITY,
					price: FormInputCode.PRICE,
					result: FormInputCode.RESULT,
					discount: FormInputCode.DISCOUNT,
					tax: FormInputCode.TAX,
					measure: FormInputCode.MEASURE
				},
				errorCodes: {
					emptyProductSelector: FormErrorCode.EMPTY_PRODUCT_SELECTOR,
					emptyImage: FormErrorCode.EMPTY_IMAGE,
					emptyQuantity: FormErrorCode.EMPTY_QUANTITY,
					emptyPrice: FormErrorCode.EMPTY_PRICE
				}
			};
		},
		created() {
			this.currencySymbol = this.options.currencySymbol;
			this.model = this.initModel();
			this.syncDefaultTaxFields();
			this.primeCalculator();
			if (main_core.Type.isArray(this.options.measures)) {
				this.options.measures.map(measure => {
					if (measure['IS_DEFAULT'] === 'Y') {
						this.defaultMeasure.name = measure.SYMBOL;
						this.defaultMeasure.code = measure.CODE;
						if (!this.basketItem.fields.measureName && !this.basketItem.fields.measureCode) {
							this.changeProductFields({
								measureCode: this.defaultMeasure.code,
								measureName: this.defaultMeasure.name
							});
						}
					}
				});
			}
		},
		methods: {
			prepareModelFields() {
				const defaultFields = this.basketItem.fields;
				const defaultPrice = main_core.Text.toNumber(defaultFields.price);
				let basePrice = defaultFields.basePrice ? defaultFields.basePrice : defaultFields.price;
				if (!main_core.Type.isNil(basePrice)) {
					basePrice = main_core.Text.toNumber(basePrice);
				}
				const explicitTaxRate = main_core.Text.toNumber(defaultFields.taxRate ?? defaultFields.vatRate ?? defaultFields.tax);
				const taxId = this.resolveTaxIdFromList(defaultFields.taxId, explicitTaxRate);
				const isDefaultNoVat = explicitTaxRate <= 0 && main_core.Text.toInteger(defaultFields.taxId) === 0 && taxId !== null && taxId !== 0;
				const taxRate = isDefaultNoVat ? 0 : explicitTaxRate || this.resolveTaxRateFromList(taxId) || 0;
				return {
					NAME: this.basketItem.fields?.name || '',
					MODULE: this.basketItem.fields?.module || '',
					PROPERTIES: this.basketItem.fields?.properties || {},
					PRODUCT_ID: this.basketItem.fields?.productId,
					ID: this.basketItem.fields?.skuId || this.basketItem.fields?.productId,
					SKU_ID: this.basketItem.fields?.skuId,
					QUANTITY: main_core.Text.toNumber(defaultFields.quantity),
					BASE_PRICE: basePrice,
					PRICE: defaultPrice,
					PRICE_NETTO: basePrice,
					PRICE_BRUTTO: defaultPrice,
					PRICE_EXCLUSIVE: this.basketItem.fields.priceExclusive || defaultPrice,
					DISCOUNT_TYPE_ID: main_core.Text.toNumber(defaultFields.discountType) || catalog_productCalculator.DiscountType.PERCENTAGE,
					DISCOUNT_RATE: main_core.Text.toNumber(defaultFields.discountRate),
					DISCOUNT_SUM: main_core.Text.toNumber(defaultFields.discount),
					TAX_INCLUDED: this.resolveTaxIncluded(defaultFields) || this.options.taxIncluded,
					TAX_RATE: taxRate,
					TAX_ID: taxId,
					CUSTOMIZED: defaultFields.isCustomPrice || 'N',
					MEASURE_CODE: defaultFields.measureCode || this.defaultMeasure.code,
					MEASURE_NAME: defaultFields.measureName || this.defaultMeasure.name
				};
			},
			resolveTaxIdFromList(taxId, taxRate = 0) {
				const normalizedTaxId = main_core.Text.toInteger(taxId);
				const taxRateList = this.options.taxRateList;
				if (!main_core.Type.isArray(taxRateList)) {
					return normalizedTaxId || null;
				}
				if (normalizedTaxId > 0) {
					return normalizedTaxId;
				}
				if (normalizedTaxId === 0 && main_core.Text.toNumber(taxRate) <= 0) {
					return taxRateList.find(item => item.value === null)?.taxId ?? null;
				}
				return normalizedTaxId;
			},
			resolveTaxRateFromList(taxId) {
				if (!main_core.Type.isArray(this.options.taxRateList) || main_core.Type.isNil(taxId)) {
					return 0;
				}
				const tax = this.options.taxRateList.find(item => item.taxId === main_core.Text.toInteger(taxId));
				return main_core.Text.toNumber(tax?.value) || 0;
			},
			resolveTaxIncluded(fields) {
				const candidates = [fields.taxIncluded, fields.vatIncluded];
				for (const raw of candidates) {
					if (raw === true || raw === 'Y' || raw === 'y') {
						return 'Y';
					}
					if (raw === false || raw === 'N' || raw === 'n') {
						return 'N';
					}
				}
				return null;
			},
			syncDefaultTaxFields() {
				const modelFields = this.getProductFieldsFromModel();
				const currentTaxIncluded = this.resolveTaxIncluded(this.basketItem.fields ?? {});
				if (main_core.Type.isNil(modelFields.taxId) || main_core.Text.toInteger(this.basketItem.fields?.taxId) === main_core.Text.toInteger(modelFields.taxId) && currentTaxIncluded === modelFields.taxIncluded) {
					return;
				}
				this.changeProductFields({
					taxId: modelFields.taxId,
					taxRate: modelFields.taxRate,
					taxIncluded: modelFields.taxIncluded,
					taxSum: modelFields.taxSum
				});
			},
			primeCalculator() {
				const calculator = this.model.getCalculator();
				const fields = calculator.getFields();
				const basePrice = main_core.Text.toNumber(fields.BASE_PRICE);
				if (basePrice > 0) {
					calculator.setFields(calculator.calculateBasePrice(basePrice));
				}
			},
			initModel() {
				const productId = main_core.Text.toNumber(this.basketItem.fields?.productId);
				const skuId = main_core.Text.toNumber(this.basketItem.fields?.skuId);
				const model = new catalog_productModel.ProductModel({
					iblockId: main_core.Text.toNumber(this.options.iblockId),
					basePriceId: main_core.Text.toNumber(this.options.basePriceId),
					currency: this.options.currency,
					isStoreCollectable: false,
					isSimpleModel: main_core.Type.isStringFilled(this.basketItem.fields?.name) && productId <= 0 && skuId <= 0,
					fields: this.prepareModelFields()
				});
				main_core_events.EventEmitter.subscribe(model, 'onErrorsChange', this.onErrorsChange);
				return model;
			},
			onErrorsChange() {
				const errors = Object.values(this.model.getErrorCollection().getErrors());
				this.changeRowData({
					errors
				});
				this.$emit('emitErrorsChange', {
					index: this.basketItemIndex,
					errors
				});
			},
			setCalculatedFields(fields) {
				this.model.getCalculator().setFields(fields);
				const map = {
					calculatedFields: fields
				};
				if (main_core.Text.toNumber(fields.SUM) >= 0) {
					map.sum = main_core.Text.toNumber(fields.SUM);
				}
				if (!main_core.Type.isNil(fields.ID)) {
					map.offerId = main_core.Text.toNumber(fields.ID);
				}
				this.changeRowData(map);
			},
			getProductFieldsFromModel() {
				const modelFields = this.model.getFields();
				const calculatorFields = this.model.getCalculator().getFields();
				return {
					productId: modelFields.PRODUCT_ID,
					skuId: modelFields.SKU_ID,
					name: modelFields.NAME,
					module: modelFields.MODULE,
					basePrice: modelFields.BASE_PRICE,
					price: modelFields.PRICE,
					priceExclusive: modelFields.PRICE_EXCLUSIVE,
					quantity: modelFields.QUANTITY,
					discountRate: modelFields.DISCOUNT_RATE,
					discount: modelFields.DISCOUNT_SUM,
					discountType: modelFields.DISCOUNT_TYPE_ID,
					isCustomPrice: modelFields.CUSTOMIZED || 'N',
					measureCode: modelFields.MEASURE_CODE || '',
					measureName: modelFields.MEASURE_NAME || '',
					properties: modelFields.PROPERTIES || {},
					taxId: modelFields.TAX_ID ?? modelFields.VAT_ID,
					taxRate: main_core.Text.toNumber(modelFields.TAX_RATE) || 0,
					taxIncluded: modelFields.TAX_INCLUDED ?? modelFields.VAT_INCLUDED,
					taxSum: main_core.Text.toNumber(calculatorFields.TAX_SUM) || 0,
					type: modelFields.TYPE,
					morePhoto: modelFields.MORE_PHOTO
				};
			},
			changeRowData(product) {
				this.$emit('changeRowData', {
					index: this.basketItemIndex,
					product
				});
			},
			changeProductFields(fields) {
				fields = Object.assign(this.basketItem.fields, fields);
				this.$emit('changeProduct', {
					index: this.basketItemIndex,
					product: {
						fields
					},
					skipFieldChecking: this.model.isSimple() && this.basketLength === 1
				});
			},
			saveCatalogField(changedFields) {
				return this.model.save(changedFields);
			},
			onProductChange(fields) {
				const calculator = this.model.getCalculator();
				const incomingTaxIncluded = fields.TAX_INCLUDED === 'Y' || fields.TAX_INCLUDED === 'N' ? fields.TAX_INCLUDED : null;
				let incomingTaxRate = main_core.Type.isNil(fields.TAX_RATE) ? null : main_core.Text.toNumber(fields.TAX_RATE);
				const taxAware = this.options.showTaxSettingsSwitcher === 'Y';
				const hasIncomingTaxFields = !main_core.Type.isUndefined(fields.TAX_RATE) || !main_core.Type.isUndefined(fields.TAX_ID) || !main_core.Type.isUndefined(fields.VAT_ID);
				if (taxAware && hasIncomingTaxFields) {
					const incomingTaxId = fields.TAX_ID ?? fields.VAT_ID;
					const resolvedTaxId = this.resolveTaxIdFromList(incomingTaxId, incomingTaxRate);
					if (!main_core.Type.isNil(resolvedTaxId) && resolvedTaxId !== main_core.Text.toInteger(incomingTaxId)) {
						incomingTaxRate = this.resolveTaxRateFromList(resolvedTaxId);
						fields.TAX_ID = resolvedTaxId;
						fields.TAX_RATE = incomingTaxRate;
					}
				}
				const isFirstRealProduct = this.basketLength === 1 && !(main_core.Text.toNumber(this.basketItem.fields.productId) > 0) && !(main_core.Text.toNumber(this.basketItem.fields.skuId) > 0);
				if (taxAware && incomingTaxIncluded && isFirstRealProduct) {
					this.$root.$app.options.taxIncluded = incomingTaxIncluded;
				}
				const formTaxIncluded = this.$root.$app.options.taxIncluded;
				const canConvert = taxAware && !isFirstRealProduct && incomingTaxRate !== null && !main_core.Type.isUndefined(fields.BASE_PRICE);
				const conversion = canConvert ? calculator.convertBasePriceForTaxIncluded(main_core.Text.toNumber(fields.BASE_PRICE), incomingTaxRate, incomingTaxIncluded, formTaxIncluded) : {
					converted: false
				};
				const needsConversion = conversion.converted;
				if (needsConversion) {
					fields.BASE_PRICE = conversion.price;
					fields.TAX_INCLUDED = formTaxIncluded;
					fields.CUSTOMIZED = 'Y';
				}
				const preTaxFields = {};
				const effectiveTaxIncluded = needsConversion ? formTaxIncluded : incomingTaxIncluded;
				if (effectiveTaxIncluded && calculator.getFields().TAX_INCLUDED !== effectiveTaxIncluded) {
					preTaxFields.TAX_INCLUDED = effectiveTaxIncluded;
				}
				if (incomingTaxRate !== null && incomingTaxRate !== main_core.Text.toNumber(calculator.getFields().TAX_RATE)) {
					preTaxFields.TAX_RATE = incomingTaxRate;
				}
				if (Object.keys(preTaxFields).length > 0) {
					calculator.setFields(preTaxFields);
				}
				fields = Object.assign(main_core.Type.isUndefined(fields.BASE_PRICE) ? calculator.getFields() : calculator.calculateBasePrice(fields.BASE_PRICE), fields);
				this.changeRowData({
					catalogPrice: fields.BASE_PRICE
				});
				this.processFields(fields);
				this.setCalculatedFields(fields);
			},
			onProductSelect() {
				this.changeProductFields({
					additionalFields: {
						originBasketId: '',
						originProductId: ''
					}
				});
			},
			onProductClear() {
				/*const fields = this.model.getCalculator().calculatePrice(0);
					fields.BASE_PRICE = 0;
				fields.NAME = '';
				fields.ID = 0;
				fields.PRODUCT_ID = 0;
				fields.SKU_ID = 0;
				fields.MODULE = '';
					this.setCalculatedFields(fields);*/
			},
			onChangeSum(sum) {
				const priceItem = sum / main_core.Text.toNumber(this.basketItem.fields.quantity);
				if (this.isEditablePrice()) {
					const price = priceItem + main_core.Text.toNumber(this.basketItem.fields.discount);
					this.onChangePrice(price);
				} else if (this.isEditableDiscount()) {
					const discount = this.basketItem.fields.basePrice - priceItem;
					this.toggleDiscount('Y');
					this.changeDiscountType(catalog_productCalculator.DiscountType.MONETARY);
					this.changeDiscount(discount);
				}
			},
			onChangePrice(newPrice) {
				this.changeBasePrice(newPrice);
				if (this.isSaveablePrice()) {
					this.saveCatalogField(['BASE_PRICE']).then(() => {
						this.changeRowData({
							catalogPrice: newPrice
						});
					});
				}
			},
			onSelectMeasure(measure) {
				this.changeMeasure(measure);
				this.model.showSaveNotifier('measureChanger_' + this.selectorId, {
					title: main_core.Loc.getMessage('CATALOG_PRODUCT_MODEL_SAVING_NOTIFICATION_MEASURE_CHANGED_QUERY'),
					events: {
						onSave: () => {
							this.saveCatalogField(['MEASURE_CODE', 'MEASURE_NAME']);
						}
					}
				});
			},
			toggleDiscount(value) {
				if (this.isReadOnly) {
					return;
				}
				this.changeRowData({
					showDiscount: value
				});
				if (value === 'Y') {
					setTimeout(() => this.$refs?.discountWrapper?.$refs?.discountInput?.focus());
				}
			},
			toggleTax(value) {
				this.changeRowData({
					showTax: value
				});
			},
			processFields(fields) {
				this.model.getCalculator().setFields(fields);
				this.model.setFields(fields);
				if (!main_core.Type.isNil(fields.SUM)) {
					this.changeRowData({
						sum: fields.SUM
					});
				}
				this.changeProductFields({
					...this.basketItem.fields,
					...this.getProductFieldsFromModel()
				});
			},
			onChangeQuantity(quantity) {
				this.model.getCalculator().setFields();
				this.processFields(this.model.getCalculator().calculateQuantity(quantity));
			},
			changeMeasure(measure) {
				const productFields = this.basketItem.fields;
				productFields['measureCode'] = measure.code;
				productFields['measureName'] = measure.name;
				this.processFields({
					MEASURE_CODE: measure.code,
					MEASURE_NAME: measure.name
				});
			},
			changeBasePrice(price) {
				this.model.setField('BASE_PRICE', price);
				this.processFields(this.model.getCalculator().calculateBasePrice(price));
			},
			changePrice(price) {
				this.model.getCalculator().setFields(this.model.getCalculator().calculateBasePrice(this.basketItem.catalogPrice));
				const calculatedFields = this.model.getCalculator().calculatePrice(price);
				this.processFields(calculatedFields);
				return calculatedFields;
			},
			changeDiscountType(discountType) {
				const type = main_core.Text.toNumber(discountType) === catalog_productCalculator.DiscountType.MONETARY ? catalog_productCalculator.DiscountType.MONETARY : catalog_productCalculator.DiscountType.PERCENTAGE;
				const calculatedFields = this.model.getCalculator().calculateDiscountType(type);
				this.processFields(calculatedFields);
				return calculatedFields;
			},
			changeDiscount(discount) {
				const calculatedFields = this.model.getCalculator().calculateDiscount(discount);
				this.processFields(calculatedFields);
				return calculatedFields;
			},
			changeTax(fields) {
				const calculatedFields = this.model.getCalculator().calculateTax(main_core.Text.toNumber(fields.taxValue));
				calculatedFields.TAX_ID = fields.taxId;
				this.processFields(calculatedFields);
				return calculatedFields;
			},
			changeTaxIncluded(taxIncluded) {
				const calculator = this.model.getCalculator();
				if (taxIncluded === calculator.getFields().TAX_INCLUDED) {
					return;
				}
				const calculatedFields = calculator.calculateTaxIncluded(taxIncluded);
				this.processFields(calculatedFields);
				return calculatedFields;
			},
			removeItem() {
				this.$emit('removeItem', {
					index: this.basketItemIndex
				});
			},
			isRequiredField(code) {
				return main_core.Type.isArray(this.options.requiredFields) && this.options.requiredFields.includes(code);
			},
			isVisibleBlock(code) {
				return main_core.Type.isArray(this.options.visibleBlocks) && this.options.visibleBlocks.includes(code);
			},
			isCompilationMode() {
				return this.mode === FormMode.COMPILATION;
			},
			getPriceValue() {
				if (this.isCompilationMode()) {
					return this.isEditableField(this.blocks.price) ? this.basketItem.fields.basePrice : this.basketItem.catalogPrice;
				}
				return this.basketItem.fields.basePrice;
			},
			getQuantityValue() {
				if (this.isCompilationMode()) {
					return this.isEditableField(this.blocks.quantity) ? this.basketItem.fields.quantity : 1;
				}
				return this.basketItem.fields.quantity;
			},
			getSumValue() {
				if (this.isCompilationMode()) {
					return this.isEditableField(this.blocks.result) ? this.basketItem.sum : this.basketItem.catalogPrice;
				}
				return this.basketItem.sum;
			},
			getDiscountValue() {
				if (this.isCompilationMode()) {
					return this.isEditableField(this.blocks.discount) ? this.basketItem.fields.discount : 0;
				}
				return this.basketItem.fields.discount;
			},
			getDiscountRateValue() {
				if (this.isCompilationMode()) {
					return this.isEditableField(this.blocks.discount) ? this.basketItem.fields.discountRate : 0;
				}
				return this.basketItem.fields.discountRate;
			},
			hasError(code) {
				if (this.basketItem.errors.length === 0 || this.model.isEmpty() && !this.model.isChanged()) {
					return false;
				}
				const filteredErrors = this.basketItem.errors.filter(error => {
					return error.code === code;
				});
				return filteredErrors.length > 0;
			},
			isEditablePrice() {
				return this.options?.editableFields.includes(FormInputCode.PRICE) && (this.model.isNew() || !this.model.isCatalogExisted() || this.options?.isCatalogPriceEditEnabled);
			},
			isEditableDiscount() {
				return this.options?.isCatalogDiscountSetEnabled;
			},
			isSaveablePrice() {
				return this.options.isCatalogPriceEditEnabled && this.options.isCatalogPriceSaveEnabled && this.model.isNew();
			},
			isEditableField(code) {
				if (code === FormInputCode.PRICE && !this.isEditablePrice()) {
					return false;
				} else if (code === FormInputCode.DISCOUNT && !this.isEditableDiscount()) {
					return false;
				} else if (code === FormInputCode.RESULT && !this.options?.isCatalogDiscountSetEnabled && !this.isEditablePrice()) {
					return false;
				}
				return this.options?.editableFields.includes(code);
			},
			getHint(code) {
				return this.options?.fieldHints[code];
			},
			hasHint(code) {
				if (code === FormInputCode.PRICE && !this.options?.isCatalogPriceEditEnabled) {
					return !this.isEditablePrice();
				}
				return false;
			}
		},
		watch: {
			taxIncluded(value, oldValue) {
				if (value !== oldValue) {
					this.changeTaxIncluded(value);
				}
			}
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_FORM_');
			},
			showDiscount() {
				return this.showDiscountBlock && this.basketItem.showDiscount === 'Y';
			},
			getPriceExclusive() {
				return this.basketItem.fields.priceExclusive || this.basketItem.fields.price;
			},
			showDiscountBlock() {
				return this.options.showDiscountBlock === 'Y' && this.isVisibleBlock(this.blocks.discount) && !this.isReadOnly;
			},
			showTaxBlock() {
				return this.options.showTaxBlock === 'Y' && this.options.taxRateList.length > 0 && this.isVisibleBlock(this.blocks.tax) && !this.isReadOnly;
			},
			showRemoveIcon() {
				if (this.isReadOnly) {
					return false;
				}
				if (this.countItems > 1) {
					return true;
				}
				return !main_core.Type.isNil(this.basketItem.offerId);
			},
			showTaxSelector() {
				return this.basketItem.showTax === 'Y';
			},
			showBasePrice() {
				return this.basketItem.fields.discount > 0 || main_core.Text.toNumber(this.basketItem.fields.price) !== main_core.Text.toNumber(this.basketItem.fields.basePrice);
			},
			getMeasureName() {
				return this.basketItem.fields.measureName || this.defaultMeasure.name;
			},
			getMeasureCode() {
				return this.basketItem.fields.measureCode || this.defaultMeasure.code;
			},
			taxSum() {
				if (this.taxRate <= 0) {
					return 0;
				}
				if (!main_core.Type.isNil(this.basketItem.fields?.taxSum)) {
					return main_core.Text.toNumber(this.basketItem.fields.taxSum);
				}
				return main_core.Text.toNumber(this.basketItem.fields?.vatAmount) || 0;
			},
			taxRate() {
				const fromFields = main_core.Text.toNumber(this.basketItem.fields?.taxRate);
				if (fromFields > 0) {
					return fromFields;
				}
				return this.resolveTaxRateFromList(this.basketItem.fields?.taxId);
			},
			taxIncluded() {
				return this.basketItem.fields.taxIncluded;
			},
			isTaxIncluded() {
				return this.taxIncluded === 'Y';
			},
			isReadOnly() {
				return this.mode === FormMode.READ_ONLY;
			},
			getErrorsText() {
				let errorText = this.basketItem.errors.length !== 0 && !this.model.isEmpty() && this.model.isChanged() ? main_core.Loc.getMessage('CATALOG_PRODUCT_MODEL_ERROR_NOTIFICATION') : '';
				this.basketItem.offerId;
				return errorText;
			},
			hasSku() {
				return this.basketItem.skuTree !== '';
			}
		},
		// language=Vue
		template: `
		<div>
			<div class="catalog-pf-product-item" v-bind:class="{ 'catalog-pf-product-item--borderless': !isReadOnly && basketItemIndex === 0 }">
				<div class="catalog-pf-product-item--remove" @click="removeItem" v-if="showRemoveIcon"></div>
				<div class="catalog-pf-product-item--num">
					<div class="catalog-pf-product-index">{{basketItemIndex + 1}}</div>
				</div>
				<div class="catalog-pf-product-item--left">
					<div v-if="isVisibleBlock(blocks.productSelector)" class="catalog-pf-product-item-inline-selector">
						<div v-if="!this.isReadOnly" class="catalog-pf-product-item-section">
							<div class="catalog-pf-product-label">{{localize.CATALOG_FORM_NAME}}</div>
						</div>
						<${config.templateFieldInlineSelector}
							:basketItem="basketItem"
							:basketLength="basketLength"
							:options="options"
							:model="model"
							:editable="isEditableField(blocks.productSelector)"
							@onProductChange="onProductChange"
							@onProductSelect="onProductSelect"
							@onProductClear="onProductClear"
							@saveCatalogField="saveCatalogField"
						/>
					</div>
				</div>
				<div class="catalog-pf-product-item--right">
					<div class="catalog-pf-product-item-section">
						<div v-if="isVisibleBlock(blocks.price)" class="catalog-pf-product-label" style="width: 94px">
							{{localize.CATALOG_FORM_PRICE}}
						</div>
						<div v-if="isVisibleBlock(blocks.quantity)" class="catalog-pf-product-label" style="width: 72px">
							{{localize.CATALOG_FORM_QUANTITY}}
						</div>
						<div v-if="isVisibleBlock(blocks.result)" class="catalog-pf-product-label" style="width: 94px">
							{{localize.CATALOG_FORM_RESULT}}
						</div>
					</div>
					<div class="catalog-pf-product-item-section">
	
						<div v-if="isVisibleBlock(blocks.price)" class="catalog-pf-product-control" style="width: 94px">
							<${config.templateFieldPrice}
								:selectorId="basketItem.selectorId"
								:price="getPriceValue()"
								:options="options"
								:editable="isEditableField(blocks.price)"
								:hasError="hasError(errorCodes.emptyPrice)"
								@onChangePrice="onChangePrice"
								@saveCatalogField="saveCatalogField"
							/>
						</div>
	
						<div v-if="isVisibleBlock(blocks.quantity)" class="catalog-pf-product-control" style="width: 72px">
							<${config.templateFieldQuantity}
								:quantity="getQuantityValue()"
								:measureCode="getMeasureCode"
								:measureRatio="basketItem.fields.measureRatio"
								:measureName="getMeasureName"
								:hasError="hasError(errorCodes.emptyQuantity)"
								:options="options"
								:editable="isEditableField(blocks.quantity)"
								@onChangeQuantity="onChangeQuantity"
								@onSelectMeasure="onSelectMeasure"
							/>
						</div>
	
						<div v-if="isVisibleBlock(blocks.result)" class="catalog-pf-product-control" style="width: 94px">
							<${config.templateFieldResultSum}
									data-testid="catalog-product-form-row-result"
									:sum="getSumValue()"
									:options="options"
									:editable="isEditableField(blocks.result)"
									@onChangeSum="onChangeSum"
							/>
						</div>
					</div>
					<div v-if="hasError(errorCodes.emptyQuantity)" class="catalog-pf-product-item-section">
						<div class="catalog-product-error">{{localize.CATALOG_FORM_ERROR_EMPTY_QUANTITY_1}}</div>
					</div>
					<div v-if="hasError(errorCodes.emptyPrice)" class="catalog-pf-product-item-section">
						<div v-if="isEditableField(blocks.price)" class="catalog-product-error">{{localize.CATALOG_FORM_ERROR_EMPTY_PRICE_1}}</div>
						<div v-else class="catalog-product-error">{{localize.CATALOG_FORM_ERROR_EMPTY_PRICE_FILL_IN_CARD}}</div>
					</div>
					<div v-if="showDiscountBlock" class="catalog-pf-product-item-section">
						<div v-if="showDiscount" class="catalog-pf-product-link-toggler catalog-pf-product-link-toggler--hide" @click="toggleDiscount('N')">{{localize.CATALOG_FORM_DISCOUNT_TITLE}}</div>
						<div v-else class="catalog-pf-product-link-toggler catalog-pf-product-link-toggler--show" @click="toggleDiscount('Y')">{{localize.CATALOG_FORM_DISCOUNT_TITLE}}</div>
					</div>
	
					<div v-if="showDiscount" class="catalog-pf-product-item-section">
						<${config.templateFieldDiscount}
							:discount="getDiscountValue()"
							:discountType="basketItem.fields.discountType"
							:discountRate="getDiscountRateValue()"
							:options="options"
							:editable="isEditableField(blocks.discount)"
							ref="discountWrapper"
							@changeDiscount="changeDiscount"
							@changeDiscountType="changeDiscountType"
						/>
					</div>
	
					<div v-if="showTaxBlock" class="catalog-pf-product-item-section catalog-pf-product-item-section--dashed">
						<div v-if="showTaxSelector" data-testid="catalog-product-form-tax-toggle" class="catalog-pf-product-link-toggler catalog-pf-product-link-toggler--hide" @click="toggleTax('N')">{{localize.CATALOG_FORM_TAX_TITLE}}</div>
						<div v-else data-testid="catalog-product-form-tax-toggle" class="catalog-pf-product-link-toggler catalog-pf-product-link-toggler--show" @click="toggleTax('Y')">{{localize.CATALOG_FORM_TAX_TITLE}}</div>
					</div>
					<div v-if="showTaxSelector && showTaxBlock" class="catalog-pf-product-item-section">
						<${config.templateFieldTax}
							:taxId="basketItem.fields.taxId"
							:options="options"
							:editable="isEditableField(blocks.tax)"
							:taxRate="taxRate"
							:taxSum="taxSum"
							:currencySymbol="currencySymbol"
							@changeTax="changeTax"
						/>
					</div>
					<div class="catalog-pf-product-item-section catalog-pf-product-item-section--dashed"></div>
				</div>
				<div class="catalog-pf-product-item">
				</div>
			</div>
			<div>
				<div class="catalog-product-error" v-html="getErrorsText"></div>
			</div>
		</div>
	`
	});

	class FormCompilationType {
		static REGULAR = 'REGULAR';
	}

	class FormHelpdeskCode {
		static COMMON_COMPILATION = 13841876;
	}

	ui_vue.Vue.component(config.templatePanelCompilation, {
		props: {
			compilationOptions: Object,
			mode: String
		},
		created() {
			this.popup = null;
			this.compilationLink = null;
			const moreMessageButton = main_core.Tag.render`
			<a class="ui-btn ui-btn-primary">${this.localize.CATALOG_FORM_COMPILATION_INFO_BUTTON_MORE}</a>
		`;
			main_core.Event.bind(moreMessageButton, 'click', this.openHelpDesk);
			let header = '';
			let description = '';
			header = this.localize.CATALOG_FORM_COMPILATION_INFO_MESSAGE_TITLE;
			description = this.localize.CATALOG_FORM_COMPILATION_INFO_MESSAGE_BODY_MARKETING_2;
			this.message = new ui_messagecard.MessageCard({
				id: 'compilationInfo',
				header,
				description,
				angle: false,
				hidden: true,
				actionElements: [moreMessageButton]
			});
			main_core_events.EventEmitter.subscribe(this.message, 'onClose', this.hideMessage);
		},
		mounted() {
			this.$refs.message.appendChild(this.message.getLayout());
		},
		data() {
			return {
				compilationLink: null
			};
		},
		methods: {
			openHelpDesk() {
				this.helpdeskCode = FormHelpdeskCode.COMMON_COMPILATION;
				top.BX.Helper.show('redirect=detail&code=' + this.helpdeskCode);
			},
			showPopup(event) {
				if (this.compilationOptions.disabledSwitcher) {
					return;
				}
				if (this.popup instanceof main_popup.Popup) {
					this.popup.setBindElement(this.$refs.qrLink);
					this.popup.show();
					return;
				}
				const basket = this.$store.getters['productList/getBasket']();
				const productIds = basket.map(basketItem => {
					return basketItem?.fields?.skuId;
				});
				return new Promise((resolve, reject) => {
					main_core.ajax.runAction('salescenter.compilation.createCompilation', {
						data: {
							productIds,
							options: {
								ownerId: this.$root.$app.options.ownerId,
								ownerTypeId: this.$root.$app.options.ownerTypeId,
								dialogId: this.$root.$app.options.dialogId,
								sessionId: this.$root.$app.options.sessionId
							}
						}
					}).then(response => {
						this.compilationLink = response.data.link ?? null;
						main_core_events.EventEmitter.emit(this.$root.$app, 'ProductForm:onCompilationCreated', {
							compilationId: response.data.compilationId ?? null,
							ownerId: response.data.ownerId ?? null
						});
						this.popup = new main_popup.Popup({
							bindElement: event.target,
							content: this.getQRPopupContent(),
							width: 375,
							closeIcon: {
								top: '5px',
								right: '5px'
							},
							padding: 0,
							closeByEsc: true,
							autoHide: true,
							cacheable: true,
							animation: 'fading-slide',
							angle: {
								offset: 30
							}
						});
						this.popup.show();
						resolve();
					}).catch(() => reject());
				});
			},
			getQRPopupContent() {
				if (!this.compilationLink) {
					return '';
				}
				const buttonCopy = main_core.Tag.render`
				<div class="catalog-pf-product-qr-popup-copy">${this.localize.CATALOG_FORM_COMPILATION_QR_COPY}</div>
			`;
				main_core.Event.bind(buttonCopy, 'click', () => {
					BX.clipboard.copy(this.compilationLink);
					BX.UI.Notification.Center.notify({
						content: this.localize.CATALOG_FORM_COMPILATION_QR_COPY_NOTIFY_MESSAGE,
						autoHideDelay: 2000
					});
				});
				const qrWrapper = main_core.Tag.render`<div class="catalog-pf-product-qr-popup-image"></div>`;
				const content = main_core.Tag.render`
					<div class="catalog-pf-product-qr-popup">
						<div class="catalog-pf-product-qr-popup-content">
							<div class="catalog-pf-product-qr-popup-text">${this.localize.CATALOG_FORM_COMPILATION_QR_POPUP_TITLE}</div>
							${qrWrapper}
							<div class="catalog-pf-product-qr-popup-buttons">
								<a href="${this.compilationLink}" target="_blank" class="ui-btn ui-btn-light-border ui-btn-round">${this.localize.CATALOG_FORM_COMPILATION_QR_POPUP_INPUT_TITLE}</a>
							</div>
						</div>
						<div class="catalog-pf-product-qr-popup-bottom">
							<a href="${this.compilationLink}" target="_blank" class="catalog-pf-product-qr-popup--url">${this.compilationLink}</a>
							${buttonCopy}
						</div>
					</div>
				`;
				new QRCode(qrWrapper, {
					text: this.compilationLink,
					width: 250,
					height: 250
				});
				return content;
			},
			setSetting(event) {
				const value = event.target.checked ? 'Y' : 'N';
				this.$root.$app.changeFormOption('isCompilationMode', value);
			},
			getOnBeforeCreationStorePopupContent() {
				const loaderContent = main_core.Tag.render`
				<div class="catalog-product-form-popup--loader-block"></div>
			`;
				const node = main_core.Tag.render`
				<div class="catalog-product-form-popup--container">
					<div class="catalog-product-form-popup--title">${main_core.Loc.getMessage('CATALOG_FORM_POPUP_BEFORE_MARKET_CREATING1')}</div>
					${loaderContent}
					<div class="catalog-product-form-popup--text">${main_core.Loc.getMessage('CATALOG_FORM_POPUP_BEFORE_MARKET_CREATING_INFO1')}</div>
				</div>
			`;
				const loader = new main_loader.Loader({
					color: "#2fc6f6",
					target: loaderContent,
					size: 40
				});
				loader.show();
				return node;
			},
			getOnAfterCreationStorePopupContent(creationStorePopup) {
				const continueButton = main_core.Tag.render`
				<button class="ui-btn ui-btn-md ui-btn-primary">
					${main_core.Loc.getMessage('CATALOG_FORM_POPUP_AFTER_MARKET_CREATING_CONTINUE')}
				</button>
			`;
				main_core.Event.bind(continueButton, 'click', this.closeCreationStorePopup.bind(this, creationStorePopup));
				return main_core.Tag.render`
				<div class="catalog-product-form-popup--container">
					<div class="catalog-product-form-popup--title">${main_core.Loc.getMessage('CATALOG_FORM_POPUP_AFTER_MARKET_CREATING1')}</div>
					<div class="catalog-product-form-popup--loader-block catalog-product-form-popup--done"></div>
					<div class="catalog-product-form-popup--text">${main_core.Loc.getMessage('CATALOG_FORM_POPUP_AFTER_MARKET_CREATING_INFO1')}</div>
					<div class="catalog-product-form-popup--button-container">${continueButton}</div>
				</div>
			`;
			},
			closeCreationStorePopup(creationStorePopup) {
				creationStorePopup.close();
			},
			onLabelClick() {
				if (this.compilationOptions.isLimitedStore) {
					BX.UI.InfoHelper.show('limit_sites_number');
				}
			},
			onClickHint(event) {
				event.preventDefault();
				event.stopImmediatePropagation();
				if (!this.message) {
					return;
				}
				if (this.message.isShown()) {
					this.hideMessage();
				} else {
					this.showMessage();
				}
			},
			showMessage() {
				if (this.message) {
					main_core.Dom.addClass(this.$refs.hintIcon, 'catalog-pf-product-panel-message-arrow-target');
					this.message.show();
				}
			},
			hideMessage() {
				if (this.message) {
					main_core.Dom.removeClass(this.$refs.hintIcon, 'catalog-pf-product-panel-message-arrow-target');
				}
				this.message.hide();
			}
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_');
			},
			showQrLink() {
				return this.mode === FormMode.COMPILATION;
			},
			...ui_vue_vuex.Vuex.mapState({
				productList: state => state.productList
			})
		},
		// language=Vue
		template: `
		<div>
			<div class="catalog-pf-product-panel-compilation">
				<div class="catalog-pf-product-panel-compilation-wrapper">
					<label class="ui-ctl ui-ctl-checkbox catalog-pf-product-panel-compilation-checkbox-container" @click="onLabelClick">
						<input
							type="checkbox"
							:disabled="compilationOptions.disabledSwitcher"
							class="ui-ctl-element"
							@change="setSetting"
							data-setting-id="isCompilationMode"
						>
						<div class="ui-ctl-label-text">{{localize.CATALOG_FORM_COMPILATION_PRODUCT_SWITCHER_2}}</div>
						<div ref="hintIcon">
							<div data-hint-init="vue" class="ui-hint" @click="onClickHint">
								<span class="ui-hint-icon"></span>
							</div>
						</div>
						<div class="tariff-lock" v-if="compilationOptions.isLimitedStore"></div>
					</label>
				</div>
				<div
					v-if="showQrLink"
					class="catalog-pf-product-panel-compilation-link --icon-qr"
					@click="showPopup"
					ref="qrLink"
				>
					{{localize.CATALOG_FORM_COMPILATION_QR_LINK}}
				</div>
			</div>
			<div class="catalog-pf-product-panel-compilation-message" ref="message"></div>
			<div class="catalog-pf-product-panel-compilation-price-info">{{localize.CATALOG_FORM_COMPILATION_PRICE_NOTIFICATION}}</div>
		</div>
	`
	});

	ui_vue.Vue.component(config.templatePanelButtons, {
		/**
		 * @emits 'changeRowData' {index: number, fields: object}
		 * @emits 'refreshBasket'
		 * @emits 'addItem'
		 */

		props: {
			options: Object,
			mode: String
		},
		data() {
			return {};
		},
		methods: {
			refreshBasket() {
				this.$emit('refreshBasket');
			},
			changeBasketItem(item) {
				this.$emit('changeRowData', item);
			},
			addBasketItemForm() {
				this.$emit('addItem');
			},
			getInternalIndexByProductId(skuId) {
				const basket = this.$store.getters['productList/getBasket']();
				return Object.keys(basket).findIndex(inx => {
					return parseInt(basket[inx].skuId) === parseInt(skuId);
				});
			},
			handleAddItem(id, params) {
				const skuType = 4;
				if (main_core.Text.toNumber(params.type) === skuType) {
					main_core.ajax.runAction('catalog.productSelector.getSelectedSku', {
						json: {
							variationId: id,
							options: {
								priceId: this.options.basePriceId,
								urlBuilder: this.options.urlBuilder,
								currency: this.options.currency,
								resetSku: true
							}
						}
					}).then(response => this.processResponse(response, params.isAddAnyway));
				} else {
					main_core.ajax.runAction('catalog.productSelector.getProduct', {
						json: {
							productId: id,
							options: {
								priceId: this.options.basePriceId,
								urlBuilder: this.options.urlBuilder,
								currency: this.options.currency
							}
						}
					}).then(response => this.processResponse(response, params.isAddAnyway));
				}
			},
			processResponse(response, isAddAnyway) {
				const index = isAddAnyway ? -1 : this.getInternalIndexByProductId(response.data.skuId);
				if (index < 0) {
					const productData = response.data;
					productData.fields = productData.fields || {};
					const productBasePrice = main_core.Text.toNumber(productData.fields.BASE_PRICE);
					const productTaxRate = main_core.Text.toNumber(productData.fields.TAX_RATE);
					const productTaxIncluded = productData.fields.TAX_INCLUDED || productData.fields.VAT_INCLUDED || null;
					const basket = this.$store.getters['productList/getBasket']();
					const firstBasketItem = basket[0];
					const isFirstRealProduct = basket.length === 0 || basket.length === 1 && !(main_core.Text.toNumber(firstBasketItem?.fields?.productId) > 0) && !(main_core.Text.toNumber(firstBasketItem?.fields?.skuId) > 0);
					const taxAware = this.options.showTaxSettingsSwitcher === 'Y';
					let basePrice = productBasePrice;
					let needsConversion = false;
					let rowTaxIncluded = null;
					if (taxAware) {
						if (isFirstRealProduct && (productTaxIncluded === 'Y' || productTaxIncluded === 'N')) {
							this.$root.$app.options.taxIncluded = productTaxIncluded;
						}
						const formTaxIncluded = this.$root.$app.options.taxIncluded;
						if (!isFirstRealProduct) {
							const conversion = new catalog_productCalculator.ProductCalculator().convertBasePriceForTaxIncluded(productBasePrice, productTaxRate, productTaxIncluded, formTaxIncluded);
							needsConversion = conversion.converted;
							if (needsConversion) {
								basePrice = conversion.price;
							}
						}
						rowTaxIncluded = isFirstRealProduct ? productTaxIncluded || this.options.taxIncluded : formTaxIncluded;
					}
					let newItem = this.$store.getters['productList/getBaseProduct']();
					newItem.fields = Object.assign(newItem.fields, {
						price: basePrice,
						priceExclusive: basePrice,
						basePrice,
						name: productData.fields.NAME || '',
						productId: productData.productId,
						skuId: productData.skuId,
						measureCode: productData.fields.MEASURE_CODE,
						measureName: productData.fields.MEASURE_NAME,
						measureRatio: productData.fields.MEASURE_RATIO,
						properties: productData.fields.PROPERTIES,
						offerId: productData.skuId > 0 ? productData.skuId : productData.productId,
						module: 'catalog',
						isCustomPrice: needsConversion ? 'Y' : main_core.Type.isNil(productData.fields.PRICE) ? 'Y' : 'N',
						discountType: this.options.defaultDiscountType,
						...(taxAware ? {
							taxId: productData.fields.VAT_ID,
							taxRate: productTaxRate,
							...(rowTaxIncluded ? {
								taxIncluded: rowTaxIncluded
							} : {})
						} : {})
					});
					delete productData.fields;
					newItem = Object.assign(newItem, productData);
					newItem.sum = basePrice;
					this.$root.$app.addProduct(newItem);
				}
			},
			onUpdateBasketItem(inx, item) {
				this.$store.dispatch('productList/changeRowData', {
					index: inx,
					fields: item
				});
				this.$store.dispatch('productList/changeProduct', {
					index: inx,
					fields: item.fields
				});
			},
			/*
			* By default, basket collection contains a fake|empty item,
			*  that is deleted when you select items from the catalog.
			* Also, products can be added to the form and become an empty string,
			*  while stay a item of basket collection
			* */
			removeEmptyItems() {
				const basket = this.$store.getters['productList/getBasket']();
				basket.forEach((item, i) => {
					if (basket[i].name === '' && basket[i].price < 1e-10) {
						this.$store.commit('productList/deleteItem', {
							index: i
						});
					}
				});
			},
			modifyBasketItem(params) {
				const skuId = parseInt(params.id);
				if (skuId > 0) {
					const index = this.getInternalIndexByProductId(skuId);
					if (index >= 0) {
						this.showDialogProductExists(params);
					} else {
						this.removeEmptyItems();
						this.handleAddItem(skuId, params);
					}
				}
			},
			showDialogProductExists(params) {
				ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('CATALOG_FORM_BLOCK_PROD_EXIST_DLG_TEXT_FOR_DOUBLE').replace('#NAME#', params.name), main_core.Loc.getMessage('CATALOG_FORM_BLOCK_PROD_EXIST_DLG_TITLE'), messageBox => {
					const productId = parseInt(params.id, 10);
					const index = this.getInternalIndexByProductId(productId);
					if (index >= 0) {
						this.handleAddItem(productId, {
							...params,
							isAddAnyway: true
						});
					}
					messageBox.close();
				}, main_core.Loc.getMessage('CATALOG_FORM_BLOCK_PROD_EXIST_DLG_OK'), messageBox => messageBox.close(), main_core.Loc.getMessage('CATALOG_FORM_BLOCK_PROD_EXIST_DLG_NO'));
			},
			showDialogProductSearch() {
				const funcName = 'addBasketItemFromDialogProductSearch';
				window[funcName] = params => this.modifyBasketItem(params);
				const popup = new BX.CDialog({
					content_url: '/bitrix/tools/sale/product_search_dialog.php?' +
					//todo: 'lang='+this._settings.languageId+
					//todo: '&LID='+this._settings.siteId+
					'&caller=order_edit' + '&func_name=' + funcName + '&STORE_FROM_ID=0' + '&public_mode=Y',
					height: Math.max(500, window.innerHeight - 400),
					width: Math.max(800, window.innerWidth - 400),
					draggable: true,
					resizable: true,
					min_height: 500,
					min_width: 800,
					zIndex: 3100
				});
				popup.Show();
			},
			setSetting(event) {
				if (event.target.dataset.settingId === 'taxIncludedOption') {
					const value = event.target.checked ? 'Y' : 'N';
					this.$root.$app.changeFormOption('taxIncluded', value);
				} else if (event.target.dataset.settingId === 'showDiscountInputOption') {
					const value = event.target.checked ? 'Y' : 'N';
					this.$root.$app.changeFormOption('showDiscountBlock', value);
				} else if (event.target.dataset.settingId === 'showTaxInputOption') {
					const value = event.target.checked ? 'Y' : 'N';
					this.$root.$app.changeFormOption('showTaxBlock', value);
				}
			},
			getSettingItem(item) {
				const input = main_core.Tag.render`
					<input type="checkbox"  class="ui-ctl-element">
				`;
				input.checked = item.checked;
				input.disabled = item.disabled ?? false;
				input.dataset.settingId = item.id;
				const hintNode = main_core.Type.isStringFilled(item.hint) ? main_core.Tag.render`<span class="catalog-product-form-setting-hint" data-hint="${item.hint}"></span>` : '';
				const setting = main_core.Tag.render`
				<label class="ui-ctl ui-ctl-checkbox ui-ctl-w100">
					${input}
					<div class="ui-ctl-label-text ${item.disabled ? 'catalog-product-form-disabled-setting' : ''}">${item.title}${hintNode}</div>
				</label>
			`;
				BX.UI.Hint.init(setting);
				main_core.Event.bind(setting, 'change', this.setSetting.bind(this));
				return setting;
			},
			getSettingItems() {
				const items = [{
					id: 'showDiscountInputOption',
					checked: this.options.showDiscountBlock !== 'N',
					title: this.localize.CATALOG_FORM_ADD_SHOW_DISCOUNTS_OPTION
				}];
				if (this.options.showTaxSettingsSwitcher === 'Y') {
					items.unshift({
						id: 'taxIncludedOption',
						checked: this.options.taxIncluded === 'Y',
						title: this.localize.CATALOG_FORM_ADD_TAX_INCLUDED
					});
					items.push({
						id: 'showTaxInputOption',
						checked: this.options.showTaxBlock !== 'N',
						title: this.localize.CATALOG_FORM_ADD_SHOW_TAXES_OPTION
					});
				}
				return items;
			},
			prepareSettingsContent() {
				const content = main_core.Tag.render`
					<div class='catalog-pf-product-config-popup'></div>
				`;
				this.getSettingItems().forEach(item => {
					content.append(this.getSettingItem(item));
				});
				return content;
			},
			showConfigPopup(event) {
				// if (!this.popupMenu)
				// {
				this.popupMenu = new main_popup.Popup(null, event.target, {
					autoHide: true,
					draggable: false,
					offsetLeft: 0,
					offsetTop: 0,
					noAllPaddings: true,
					bindOptions: {
						forceBindPosition: true
					},
					closeByEsc: true,
					content: this.prepareSettingsContent()
				});
				// }

				this.popupMenu.show();
			},
			openSlider(url, options) {
				if (!main_core.Type.isPlainObject(options)) {
					options = {};
				}
				options = {
					...{
						cacheable: false,
						allowChangeHistory: false,
						events: {}
					},
					...options
				};
				return new Promise(resolve => {
					if (main_core.Type.isString(url) && url.length > 1) {
						options.events.onClose = function (event) {
							resolve(event.getSlider());
						};
						BX.SidePanel.Instance.open(url, options);
					} else {
						resolve();
					}
				});
			}
		},
		computed: {
			hasAccessToCatalog() {
				return this.options.isCatalogAccess;
			},
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_');
			},
			countItems() {
				return this.order.basket.length;
			},
			isCatalogHidden() {
				return this.options.isCatalogHidden;
			},
			...ui_vue_vuex.Vuex.mapState({
				productList: state => state.productList
			})
		},
		mounted() {
			BX.UI.Hint.init();
		},
		// language=Vue
		template: `
		<div>
			<div class="catalog-pf-product-add">
				<div class="catalog-pf-product-add-wrapper">
					<span class="catalog-pf-product-add-link" @click="addBasketItemForm">{{localize.CATALOG_FORM_ADD_PRODUCT}}</span>
					<span
						v-if="hasAccessToCatalog && !isCatalogHidden"
						class="catalog-pf-product-add-link catalog-pf-product-add-link--gray"
						@click="showDialogProductSearch"
					>{{localize.CATALOG_FORM_ADD_PRODUCT_FROM_CATALOG}}</span>
					<span
						v-else-if="!isCatalogHidden"
						class="catalog-pf-product-add-link catalog-pf-product-add-link--gray catalog-pf-product-add-link--disabled"
						:data-hint="localize.CATALOG_FORM_ADD_PRODUCT_FROM_CATALOG_DENIED_HINT"
						data-hint-no-icon
					>{{localize.CATALOG_FORM_ADD_PRODUCT_FROM_CATALOG}}</span>
				</div>
				<div class="catalog-pf-product-configure-link" @click="showConfigPopup">{{localize.CATALOG_FORM_DISCOUNT_EDIT_PAGE_URL_TITLE}}</div>
			</div>
		</div>
	`
	});

	ui_vue.Vue.component(config.templateSummaryTotal, {
		props: {
			currency: {
				type: String,
				required: true
			},
			sum: {
				required: true
			},
			sumAdditionalClass: String,
			currencyAdditionalClass: String
		},
		computed: {
			formattedSum() {
				const element = main_core.Tag.render`<span class="catalog-pf-text ${this.sumAdditionalClass ?? ''}">${this.sum}</span>`;
				return currency_currencyCore.CurrencyCore.getPriceControl(element, this.currency);
			}
		},
		// language=Vue
		template: `
	<span class="catalog-pf-symbol" :class="currencyAdditionalClass" v-html="formattedSum"></span>
	`
	});

	ui_vue.Vue.component(config.templateName, {
		props: {
			options: Object,
			mode: String
		},
		created() {
			BX.ajax.runAction("catalog.productSelector.getFileInput", {
				json: {
					iblockId: this.options.iblockId
				}
			});
		},
		methods: {
			refreshBasket() {
				this.$store.dispatch('productList/refreshBasket');
			},
			changeProduct(item) {
				this.$root.$app.changeProduct(item);
			},
			emitErrorsChange() {
				this.$root.$app.emitErrorsChange();
			},
			changeRowData(item) {
				delete item.product.fields;
				this.$store.commit('productList/updateItem', item);
			},
			removeItem(item) {
				this.$root.$app.removeProduct(item);
			},
			addItem() {
				this.$root.$app.addProduct();
			}
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('CATALOG_');
			},
			showTaxResult() {
				return this.options.showTaxBlock !== 'N';
			},
			discountRowClass() {
				return this.showTaxResult ? '' : 'catalog-pf-result-padding-bottom';
			},
			showResults() {
				return this.options.showResults !== false;
			},
			showButtonsTop() {
				return this.options.singleProductMode !== true && this.mode !== FormMode.READ_ONLY && this.options.buttonsPosition !== FormElementPosition.BOTTOM;
			},
			showButtonsBottom() {
				return this.options.singleProductMode !== true && this.mode !== FormMode.READ_ONLY && this.options.buttonsPosition === FormElementPosition.BOTTOM;
			},
			showResultBlock() {
				return this.showResults || this.enableAddButtons;
			},
			countItems() {
				return this.productList.basket.length;
			},
			totalResultLabel() {
				return this.options.hasOwnProperty('totalResultLabel') && this.options.totalResultLabel ? this.options.totalResultLabel : this.localize.CATALOG_FORM_TOTAL_RESULT;
			},
			...ui_vue_vuex.Vuex.mapState({
				productList: state => state.productList
			})
		},
		// language=Vue
		template: `
	<div class="catalog-product-form-container">
		<${config.templatePanelButtons}
			:options="options"
			:mode="mode"
			@refreshBasket="refreshBasket"
			@addItem="addItem"
			@changeRowData="changeRowData"
			@changeProduct="changeProduct"
			v-if="showButtonsTop"
		/>
		<div v-for="(item, index) in productList.basket" :key="item.selectorId">
			<${config.templateRowName}
				:basketItem="item"
				:basketItemIndex="index"
				:basketLength="productList.basket.length"
				:countItems="countItems"
				:options="options"
				:mode="mode"
				@changeProduct="changeProduct"
				@changeRowData="changeRowData"
				@removeItem="removeItem"
				@refreshBasket="refreshBasket"
				@emitErrorsChange="emitErrorsChange"
			/>
		</div>
		<${config.templatePanelButtons}
			:options="options"
			:mode="mode"
			@refreshBasket="refreshBasket"
			@addItem="addItem"
			@changeRowData="changeRowData"
			@changeProduct="changeProduct"
			v-if="showButtonsBottom"
		/>
		<${config.templatePanelCompilation}
			v-if="options.showCompilationModeSwitcher"
			:compilationOptions="options.compilationFormOption"
			:mode="mode"
		/>
		<div class="catalog-pf-result-line"></div>
		<div class="catalog-pf-result-wrapper" v-if="showResultBlock">
			<table class="catalog-pf-result">
				<tr>
					<td>
						<span class="catalog-pf-text">{{localize.CATALOG_FORM_PRODUCTS_PRICE}}:</span>
					</td>
					<td>
						<${config.templateSummaryTotal}
							:sum="productList.total.sum"
							:currency="options.currency"
							:sumAdditionalClass="productList.total.result !== productList.total.sum ? 'catalog-pf-text--line-through' : ''"
						/>
					</td>
				</tr>
				<tr>
					<td :class="discountRowClass">
						<span class="catalog-pf-text catalog-pf-text--discount">{{localize.CATALOG_FORM_TOTAL_DISCOUNT}}:</span>
					</td>
					<td :class="discountRowClass">
						<${config.templateSummaryTotal}
							:sum="productList.total.discount"
							:currency="options.currency"
							:sumAdditionalClass="'catalog-pf-text--discount'"
						/>
					</td>
				</tr>
				<tr v-if="showTaxResult">
					<td class="catalog-pf-tax">
						<span class="catalog-pf-text catalog-pf-text--tax">{{localize.CATALOG_FORM_TAX_TITLE}}:</span>
					</td>
					<td class="catalog-pf-tax">
						<${config.templateSummaryTotal}
							:sum="productList.total.taxSum"
							:currency="options.currency"
							:sumAdditionalClass="'catalog-pf-text--tax'"
						/>
					</td>
				</tr>
				<tr>
					<td class="catalog-pf-result-padding">
						<span class="catalog-pf-text catalog-pf-text--total catalog-pf-text--border">{{totalResultLabel}}:</span>
					</td>
					<td class="catalog-pf-result-padding">
						<${config.templateSummaryTotal}
							:sum="productList.total.result"
							:currency="options.currency"
							:sumAdditionalClass="'catalog-pf-text--total'"
							:currencyAdditionalClass="'catalog-pf-symbol--total'"
						/>
					</td>
				</tr>
			</table>
		</div>
	</div>
`
	});

	class ProductForm {
		constructor(options = {}) {
			this.options = this.prepareOptions(options);
			this.defaultOptions = Object.assign({}, this.options);
			this.editable = true;
			this.#setMode(FormMode.REGULAR);
			this.wrapper = main_core.Tag.render`<div class=""></div>`;
			if (main_core.Text.toNumber(options.iblockId) <= 0) {
				return;
			}
			ProductForm.initStore().then(result => this.initTemplate(result)).catch(error => ProductForm.showError(error));
		}
		static initStore() {
			const builder = new ui_vue_vuex.VuexBuilder();
			return builder.addModel(ProductList.create()).build();
		}
		prepareOptions(options = {}) {
			const settingsCollection = main_core.Extension.getSettings('catalog.product-form');
			const defaultOptions = {
				basket: [],
				measures: [],
				iblockId: null,
				basePriceId: settingsCollection.get('basePriceId'),
				taxRateList: [],
				singleProductMode: false,
				showResults: true,
				showCompilationModeSwitcher: false,
				enableEmptyProductError: true,
				isShortProductViewFormat: false,
				pricePrecision: 8,
				displayPrecision: 2,
				currency: settingsCollection.get('currency'),
				currencySymbol: settingsCollection.get('currencySymbol'),
				taxIncluded: settingsCollection.get('taxIncluded'),
				warehouseOption: settingsCollection.get('warehouseOption'),
				isCatalogHidden: settingsCollection.get('isCatalogHidden'),
				showDiscountBlock: settingsCollection.get('showDiscountBlock'),
				showTaxBlock: settingsCollection.get('showTaxBlock'),
				showTaxSettingsSwitcher: 'N',
				allowedDiscountTypes: [catalog_productCalculator.DiscountType.PERCENTAGE, catalog_productCalculator.DiscountType.MONETARY],
				visibleBlocks: [FormInputCode.PRODUCT_SELECTOR, FormInputCode.IMAGE_EDITOR, FormInputCode.PRICE, FormInputCode.QUANTITY, FormInputCode.RESULT, FormInputCode.DISCOUNT],
				requiredFields: [],
				editableFields: [],
				newItemPosition: FormElementPosition.TOP,
				buttonsPosition: FormElementPosition.TOP,
				urlBuilderContext: 'SHOP',
				hideUnselectedProperties: false,
				isCatalogDiscountSetEnabled: settingsCollection.get('isCatalogDiscountSetEnabled'),
				isCatalogPriceEditEnabled: settingsCollection.get('isCatalogPriceEditEnabled'),
				isCatalogPriceSaveEnabled: settingsCollection.get('isCatalogPriceSaveEnabled'),
				isCatalogSettingAccess: settingsCollection.get('isCatalogSettingAccess'),
				isCatalogAccess: settingsCollection.get('isCatalogAccess'),
				fieldHints: settingsCollection.get('fieldHints'),
				compilationFormType: FormCompilationType.REGULAR,
				compilationFormOption: {},
				ownerId: null,
				ownerTypeId: null,
				dialogId: null,
				sessionId: null
			};
			if (options.visibleBlocks && !main_core.Type.isArray(options.visibleBlocks)) {
				delete options.visibleBlocks;
			}
			if (options.requiredFields && !main_core.Type.isArray(options.requiredFields)) {
				delete options.requiredFields;
			}
			options = {
				...defaultOptions,
				...options
			};
			if (options.showTaxSettingsSwitcher !== 'Y') {
				options.showTaxBlock = 'N';
			} else if (main_core.Type.isArray(options.visibleBlocks) && !options.visibleBlocks.includes(FormInputCode.TAX)) {
				options.visibleBlocks = [...options.visibleBlocks, FormInputCode.TAX];
			}
			if (settingsCollection.get('isEnabledLanding')) {
				options.compilationFormOption = {
					type: options.compilationFormType,
					hasStore: settingsCollection.get('hasLandingStore'),
					isLimitedStore: settingsCollection.get('isLimitedLandingStore'),
					disabledSwitcher: settingsCollection.get('isLimitedLandingStore')
				};
			} else {
				options.showCompilationModeSwitcher = false;
			}
			options.defaultDiscountType = '';
			if (main_core.Type.isArray(options.allowedDiscountTypes)) {
				if (options.allowedDiscountTypes.includes(catalog_productCalculator.DiscountType.PERCENTAGE)) {
					options.defaultDiscountType = catalog_productCalculator.DiscountType.PERCENTAGE;
				} else if (options.allowedDiscountTypes.includes(catalog_productCalculator.DiscountType.MONETARY)) {
					options.defaultDiscountType = catalog_productCalculator.DiscountType.MONETARY;
				}
			}
			return options;
		}
		layout() {
			return this.wrapper;
		}
		setShowCompilationModeSwitcher(visible) {
			if (!visible) {
				this.changeFormOption('isCompilationMode', 'N');
			}
			this.options.showCompilationModeSwitcher = visible;
		}
		initTemplate(result) {
			return new Promise(resolve => {
				const context = this;
				this.store = result.store;
				this.templateEngine = ui_vue.BitrixVue.createApp({
					el: this.wrapper,
					store: this.store,
					data: {
						options: this.options,
						mode: this.mode
					},
					created() {
						this.$app = context;
					},
					mounted() {
						resolve();
					},
					template: `<${config.templateName} :options="options" :mode="mode"/>`
				});
				if (main_core.Type.isStringFilled(this.options.currency)) {
					this.setData({
						currency: this.options.currency
					});
					currency_currencyCore.CurrencyCore.loadCurrencyFormat(this.options.currency);
				}
				if (this.options.basket.length > 0) {
					this.setData({
						basket: this.options.basket
					}, {
						newItemPosition: FormElementPosition.BOTTOM
					});
					if (main_core.Type.isObject(this.options.totals)) {
						this.store.commit('productList/setTotal', this.options.totals);
					} else {
						this.store.dispatch('productList/calculateTotal');
					}
				} else {
					const newItem = this.store.getters['productList/getBaseProduct']();
					newItem.fields.discountType = this.options.defaultDiscountType;
					this.addProduct(newItem);
				}
				main_core_events.EventEmitter.emit(this, 'onAfterInit');
			});
		}
		addProduct(item = {}) {
			this.store.dispatch('productList/addItem', {
				item,
				position: this.options.newItemPosition
			}).then(() => {
				this.#onBasketChange();
			});
		}
		#onBasketChange() {
			main_core_events.EventEmitter.emit(this, 'ProductForm:onBasketChange', {
				basket: this.store.getters['productList/getBasket']()
			});
		}
		emitErrorsChange() {
			main_core_events.EventEmitter.emit(this, 'ProductForm:onErrorsChange');
		}
		changeProduct(item) {
			const product = item.product;
			product.errors = [];
			if (item.skipFieldChecking !== true) {
				const result = this.#checkRequiredFields(product);
				product.errors = result?.errors || [];
			}
			this.store.dispatch('productList/changeItem', {
				index: item.index,
				product
			}).then(() => {
				this.#onBasketChange();
			});
		}
		#checkRequiredFields(product) {
			const result = {};
			if (!main_core.Type.isArray(this.options.requiredFields) || this.options.requiredFields.length === 0) {
				return result;
			}
			result.errors = [];
			this.options.requiredFields.forEach(code => {
				switch (code) {
					case FormInputCode.PRICE:
						if (!this.options.isCatalogPriceSaveEnabled && product.catalogPrice <= 0) {
							result.errors.push({
								code: FormErrorCode.EMPTY_PRICE,
								message: main_core.Loc.getMessage('CATALOG_FORM_ERROR_EMPTY_PRICE_FILL_IN_CARD')
							});
						} else if (product.fields.basePrice <= 0) {
							result.errors.push({
								code: FormErrorCode.EMPTY_PRICE,
								message: main_core.Loc.getMessage('CATALOG_FORM_ERROR_EMPTY_PRICE_1')
							});
						}
						break;
					case FormInputCode.QUANTITY:
						if (product.fields.quantity <= 0) {
							result.errors.push({
								code: FormErrorCode.EMPTY_QUANTITY,
								message: main_core.Loc.getMessage('CATALOG_FORM_ERROR_EMPTY_QUANTITY_1')
							});
						}
						break;
					case FormInputCode.IMAGE_EDITOR:
						if (!main_core.Type.isObject(product.fields.morePhoto) || Object.keys(product.fields.morePhoto).length === 0) {
							result.errors.push({
								code: FormErrorCode.EMPTY_IMAGE,
								message: main_core.Loc.getMessage('CATALOG_FORM_ERROR_EMPTY_PICTURE_1')
							});
						}
						break;
				}
			});
			return result;
		}
		removeProduct(product) {
			this.store.dispatch('productList/removeItem', {
				index: product.index
			}).then(() => {
				this.#onBasketChange();
			});
		}
		setData(data, option = {}) {
			if (main_core.Type.isObject(data.basket)) {
				const formBasket = this.store.getters['productList/getBasket']();
				data.basket.forEach(fields => {
					if (!main_core.Type.isObject(fields)) {
						return;
					}
					const itemPosition = option.newItemPosition || this.options.newItemPosition;
					const innerId = fields.selectorId;
					if (main_core.Type.isNil(innerId)) {
						this.store.dispatch('productList/addItem', {
							item: fields,
							position: itemPosition
						});
						return;
					}
					const basketIndex = formBasket.findIndex(item => item.selectorId === innerId);
					if (basketIndex === -1) {
						this.store.dispatch('productList/addItem', {
							item: fields,
							position: itemPosition
						});
					} else {
						this.store.dispatch('productList/changeItem', {
							index: basketIndex,
							product: fields
						});
					}
				});
			}
			if (main_core.Type.isStringFilled(data.currency)) {
				this.store.dispatch('productList/setCurrency', data.currency);
			}
			if (main_core.Type.isObject(data.total)) {
				this.store.commit('productList/setTotal', {
					sum: data.total.sum,
					taxSum: data.total.taxSum,
					discount: data.total.discount,
					result: data.total.result
				});
			}
			if (main_core.Type.isObject(data.errors)) {
				this.store.commit('productList/setErrors', data.errors);
			}
		}
		changeFormOption(optionName, value) {
			value = value === 'Y' ? 'Y' : 'N';
			if (optionName === 'isCompilationMode') {
				if (!this.options.showCompilationModeSwitcher) {
					return;
				}
				main_core_events.EventEmitter.emit(this, 'onChangeCompilationMode', {
					isCompilationMode: value === 'Y'
				});
				const mode = value === 'Y' ? FormMode.COMPILATION : FormMode.REGULAR;
				this.#changeCompilationModeSetting(mode);
				return;
			}
			this.options[optionName] = value;
			const basket = this.store.getters['productList/getBasket']();
			basket.forEach((item, index) => {
				if (optionName === 'showDiscountBlock') {
					item.showDiscountBlock = value;
					this.store.dispatch('productList/changeItem', {
						index,
						product: item
					});
				} else if (optionName === 'showTaxBlock') {
					item.showTaxBlock = value;
					this.store.dispatch('productList/changeItem', {
						index,
						product: item
					});
				} else if (optionName === 'taxIncluded') {
					item.fields.taxIncluded = value;
				}
			});
			main_core.ajax.runAction('catalog.productForm.setConfig', {
				data: {
					configName: optionName,
					value
				}
			});
		}
		#changeCompilationModeSetting(mode) {
			this.#setMode(mode);
			const basket = this.store.getters['productList/getBasket']();
			basket.forEach((item, index) => this.changeProduct({
				index,
				product: item,
				skipFieldChecking: basket.length === 1 && index === 0 && item.offerId === null
			}));
		}
		getTotal() {
			this.store.dispatch('productList/getTotal');
		}
		setEditable(editable) {
			this.editable = editable;
			this.#setMode(editable ? FormMode.REGULAR : FormMode.READ_ONLY);
		}
		#setMode(mode) {
			this.mode = mode;
			if (mode === FormMode.READ_ONLY) {
				this.options.editableFields = [];
			} else if (mode === FormMode.COMPILATION) {
				this.options.editableFields = [FormInputCode.PRODUCT_SELECTOR];
				this.options.visibleBlocks = this.defaultOptions.visibleBlocks;
				this.options.visibleBlocks = this.defaultOptions.visibleBlocks;
				this.options.showResults = false;
			} else {
				mode = FormMode.REGULAR;
				this.options.visibleBlocks = this.defaultOptions.visibleBlocks;
				this.options.showResults = this.defaultOptions.showResults;
				this.options.editableFields = this.defaultOptions.visibleBlocks;
			}
			if (this.templateEngine) {
				this.templateEngine.mode = mode;
			}
			this.options.requiredFields = [];
			if (mode === FormMode.COMPILATION) {
				const compilationRequiredFields = [FormInputCode.PRODUCT_SELECTOR, FormInputCode.PRICE];
				this.options.requiredFields = this.options.visibleBlocks.filter(item => compilationRequiredFields.includes(item));
			}
			main_core_events.EventEmitter.emit(this, 'ProductForm:onModeChange', {
				mode
			});
		}
		hasErrors() {
			if (!this.store) {
				return false;
			}
			const basket = this.store.getters['productList/getBasket']();
			const errorItems = basket.filter(item => item.errors.length > 0);
			return errorItems.length > 0;
		}
		static showError(error) {
			console.error(error);
		}
	}

	exports.FormMode = FormMode;
	exports.ProductForm = ProductForm;

})(this.BX.Catalog = this.BX.Catalog || {}, BX, BX, BX, BX.UI.Notification, window, BX, BX.Catalog, BX.Currency, BX, BX.UI, BX, BX.UI, BX.Event, BX.Catalog, BX, BX.UI, BX.Main, BX.Catalog, BX, BX.UI, window, BX.UI, BX, BX, BX, BX.UI, BX.UI.Dialogs);
//# sourceMappingURL=product-form.bundle.js.map
