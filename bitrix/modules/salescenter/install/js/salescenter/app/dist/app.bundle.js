/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, crm_messagesender_editor, main_core_events, main_loader, main_popup, rest_client, salescenter_manager, ui_buttons, bitrix24_phoneverify, ui_designTokens, ui_fonts_opensans, ui_notification, ui_dialogs_messagebox, ui_vue, ui_vue_vuex, salescenter_component_stageBlock, Tile, TimeLineItem, salescenter_marketplace, salescenter_component_stageBlock_tile, Hint, catalog_productForm, currency, DeliverySelector$1, ui_fonts_ruble, salescenter_component_stageBlock_smsMessage, salescenter_component_stageBlock_automation, AutomationStage, salescenter_component_stageBlock_timeline, ui_icons_disk, popup, ui_buttons_icons, ui_forms, ui_pinner, crm_integration_analytics, crm_router, salescenter_lib, ui_entitySelector, currency_currencyCore, landing_backend, landing_pageobject, ui_iconSet_actions, ui_analytics) {
	'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			for (var k in e) {
				n[k] = e[k];
			}
		}
		n.default = e;
		return Object.freeze(n);
	}

	var Tile__namespace = /*#__PURE__*/_interopNamespaceDefault(Tile);
	var TimeLineItem__namespace = /*#__PURE__*/_interopNamespaceDefault(TimeLineItem);
	var Hint__namespace = /*#__PURE__*/_interopNamespaceDefault(Hint);
	var AutomationStage__namespace = /*#__PURE__*/_interopNamespaceDefault(AutomationStage);

	const MixinTemplatesType = {
		data() {
			return {
				editable: true
			};
		},
		created() {
			// TODO: this code is really weird; the only place this event is emitted in is in the products block;
			// if there's no products block on the page, the entire slider breaks
			// perhaps a little refactoring is due
			this.$root.$on('on-change-editable', value => {
				this.editable = value;
			});
		}
	};

	let TileCollectionMixins = {
		components: {
			'label-block': salescenter_component_stageBlock_tile.Label,
			'tile-label-block': salescenter_component_stageBlock_tile.TileLabel,
			'tile-hint-img-block': salescenter_component_stageBlock_tile.TileHintImg,
			'tile-hint-plus-block': salescenter_component_stageBlock_tile.TileLabelPlus,
			'tile-hint-img-caption-block': salescenter_component_stageBlock_tile.TileHintImgCaption,
			'tile-hint-background-block': salescenter_component_stageBlock_tile.TileHintBackground,
			'tile-hint-background-caption-block': salescenter_component_stageBlock_tile.TileHintBackgroundCaption
		},
		methods: {
			getCollectionTile() {
				return this.tiles;
			},
			getCollectionTileByFilter(filter) {
				let map = new Map();
				let collection = this.getCollectionTile();
				if (filter.hasOwnProperty('type') && filter.type.length > 0) {
					collection.forEach((item, index) => {
						if (filter.type === item.getType()) {
							map.set(index, item);
						}
					});
				} else {
					collection.forEach((item, index) => map.set(index, item));
				}
				return map;
			},
			hasTileOfferFromCollection() {
				let map = this.getCollectionTileByFilter({
					type: Tile__namespace.Offer.type()
				});
				return map.size > 0;
			},
			hasTileMoreFromCollection() {
				let map = this.getCollectionTileByFilter({
					type: Tile__namespace.More.type()
				});
				return map.size > 0;
			},
			getTileOfferFromCollection() {
				let map = this.getCollectionTileByFilter({
					type: Tile__namespace.Offer.type()
				});
				let result = {};
				map.forEach((item, inx) => {
					result = {
						index: inx,
						tile: item
					};
					return false;
				});
				return result;
			},
			getTileMoreFromCollection() {
				let map = this.getCollectionTileByFilter({
					type: Tile__namespace.More.type()
				});
				let result = {};
				map.forEach((item, inx) => {
					result = {
						index: inx,
						tile: item
					};
					return false;
				});
				return result;
			},
			getTileByIndex(index) {
				let tile = null;
				this.getCollectionTileByFilter({}).forEach((item, inx) => {
					if (index === inx) {
						tile = item;
					}
				});
				return tile;
			},
			openSlider(inx) {
				let slider = new salescenter_marketplace.AppSlider();
				let tile = this.getTileByIndex(inx);
				slider.openAppLocal(tile, this.getOptionSlider);
				slider.subscribe(salescenter_marketplace.EventTypes.AppSliderSliderClose, e => this.$emit('on-tile-slider-close', {
					data: e.data
				}));
			},
			isControlTile(tile) {
				return [Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(tile.getType());
			},
			showHint(inx, e) {
				let event = e.data.event;
				let tile = this.getTileByIndex(inx);
				this.popup = new Hint__namespace.Popup();
				this.popup.show(event.target, tile.info);
			},
			hideHint() {
				if (this.popup) {
					this.popup.hide();
				}
			}
		},
		computed: {
			getOptionSlider() {
				return {
					width: 1000
				};
			}
		}
	};

	const Uninstalled = {
		props: {
			tiles: {
				type: Array,
				required: true
			}
		},
		mixins: [TileCollectionMixins],
		template: `		
		<div>
			<template v-for="(tile, index) in tiles">
				<tile-hint-background-caption-block	v-if="tile.img.length > 0 && tile.showTitle"
					:src="tile.img"
					:name="tile.name"
					:caption="tile.name"
					v-on:tile-hint-bg-label-on-click="openSlider(index)"
					v-on:tile-hint-bg-label-on-mouseenter="showHint(index, $event)"
					v-on:tile-hint-bg-label-on-mouseleave="hideHint"
				/>
				<tile-hint-background-block		v-else-if="tile.img.length > 0"
					:src="tile.img"
					:name="tile.name"
					v-on:tile-hint-bg-on-click="openSlider(index)"
					v-on:tile-label-bg-hint-on-mouseenter="showHint(index, $event)"
					v-on:tile-label-bg-hint-on-mouseleave="hideHint"
				/>
				<tile-hint-plus-block			v-else 
					:name="tile.name" 
					v-on:tile-label-plus-on-click="openSlider(index)"
				/> 
			</template>
		</div>
	`
	};

	const Installed = {
		props: {
			tiles: {
				type: Array,
				required: true
			}
		},
		mixins: [TileCollectionMixins],
		template: `	
		<div class="salescenter-app-payment-by-sms-item-container-payment">
			<div class="salescenter-app-payment-by-sms-item-container-payment-inline">
				<tile-label-block class="salescenter-app-payment-by-sms-item-container-payment-item-text"
					v-for="(tile, index) in tiles"
					v-bind:key="index"
					v-if="isControlTile(tile) === false"
					:name="tile.name" 
					v-on:tile-label-on-click="openSlider(index)"
				/>
				<br>
				<tile-label-block class="salescenter-app-payment-by-sms-item-container-payment-item-text-add"
					v-if="hasTileOfferFromCollection() === true"
					:name="getTileOfferFromCollection().tile.name"
					v-on:tile-label-on-click="openSlider(getTileOfferFromCollection().index)"
				/>
				<tile-label-block class="salescenter-app-payment-by-sms-item-container-payment-item-text-add"
					v-if="hasTileMoreFromCollection() === true"
					:name="getTileMoreFromCollection().tile.name"
					v-on:tile-label-on-click="openSlider(getTileMoreFromCollection().index)"
				/>
			</div>
		</div>
	`
	};

	const StageMixin = {
		computed: {
			statusClassMixin() {
				return {
					'salescenter-app-payment-by-sms-item': true,
					'salescenter-app-payment-by-sms-item-current': this.status === salescenter_component_stageBlock.StatusTypes.current,
					'salescenter-app-payment-by-sms-item-disabled': this.status === salescenter_component_stageBlock.StatusTypes.disabled
				};
			},
			containerClassMixin() {
				return {
					'salescenter-app-payment-by-sms-item-container': true
				};
			},
			counterCheckedMixin() {
				return this.status === salescenter_component_stageBlock.StatusTypes.complete;
			}
		},
		methods: {
			onSliderClose(e) {
				this.$emit('on-stage-tile-collection-slider-close', e);
			}
		}
	};

	const Cashbox = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			tiles: {
				type: Array,
				required: true
			},
			installed: {
				type: Boolean,
				required: true
			},
			titleItems: {
				type: Array
			},
			initialCollapseState: {
				type: Boolean,
				required: true
			}
		},
		mixins: [StageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'tile-collection-installed-block': Installed,
			'tile-collection-uninstalled-block': Uninstalled
		},
		computed: {
			statusClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled-bg': this.installed === false
				};
			},
			title() {
				return main_core.Loc.getMessage('SALESCENTER_CASHBOX_BLOCK_TITLE_MSGVER_1');
			},
			configForBlock() {
				return {
					counter: this.counter,
					titleItems: this.installed ? this.titleItems : [],
					installed: this.installed,
					collapsible: true,
					checked: this.counterCheckedMixin,
					showHint: !this.installed,
					initialCollapseState: this.initialCollapseState
				};
			}
		},
		methods: {
			onItemHint(e) {
				BX.Salescenter.Manager.openHowToConfigCashBox(e);
			},
			saveCollapsedOption(option) {
				this.$emit('on-save-collapsed-option', 'cashbox', option);
			}
		},
		template: `
		<stage-block-item
			:class="[statusClassMixin, statusClass]"
			:config="configForBlock"
			@on-item-hint.stop.prevent="onItemHint"
			@on-tile-slider-close="onSliderClose"
			@on-adjust-collapsed="saveCollapsedOption"
		>
			<template v-slot:block-title-title>{{title}}</template>
			<template v-slot:block-hint-title>
				${main_core.Loc.getMessage('SALESCENTER_CASHBOX_BLOCK_SETTINGS_TITLE')}
			</template>
			<template v-slot:block-container>
				<div
					v-if="!installed"
					class="salescenter-app-explanation"
				>
					<div class="salescenter-app-explanation-img"></div>
					<div class="salescenter-app-explanation-area">
						<div class="salescenter-app-explanation-text">
							${main_core.Loc.getMessage('SALESCENTER_TERMINAL_CASHBOX_SETUP_HINT')}
						</div>
					</div>
				</div>
				<div :class="containerClassMixin">
					<tile-collection-uninstalled-block 	:tiles="tiles" v-if="!installed" v-on:on-tile-slider-close="onSliderClose"/>
					<tile-collection-installed-block :tiles="tiles" v-on:on-tile-slider-close="onSliderClose" v-else />
				</div>
			</template>
		</stage-block-item>
	`
	};

	const ModeDictionary = Object.freeze({
		payment: 'payment',
		delivery: 'delivery',
		paymentDelivery: 'payment_delivery',
		terminalPayment: 'terminal_payment'
	});

	var Product$1 = {
		mixins: [MixinTemplatesType],
		mounted() {
			const editable = this.$root.$app.options.templateMode !== 'view';
			this.$root.$emit('on-change-editable', editable);
			if (this.productForm) {
				this.productForm.setEditable(editable);
				const formWrapper = this.$root.$el.querySelector('.salescenter-app-form-wrapper');
				formWrapper.appendChild(this.productForm.layout());
			}
		},
		created() {
			this.refreshId = null;
			const defaultCurrency = this.$root.$app.options.currencyCode || '';
			this.$store.dispatch('orderCreation/setCurrency', defaultCurrency);
			if (main_core.Type.isArray(this.$root.$app.options.basket)) {
				const fields = [];
				this.$root.$app.options.basket.forEach(item => {
					fields.push(item.fields);
				});
				this.$store.commit('orderCreation/setBasket', fields);
			}
			if (main_core.Type.isObject(this.$root.$app.options.totals)) {
				this.$store.commit('orderCreation/setTotal', this.$root.$app.options.totals);
			}
			this.productForm = new catalog_productForm.ProductForm({
				currencySymbol: this.$root.$app.options.currencySymbol,
				currency: defaultCurrency,
				iblockId: this.$root.$app.options.catalogIblockId,
				basePriceId: this.$root.$app.options.basePriceId,
				basket: main_core.Type.isArray(this.$root.$app.options.basket) ? this.$root.$app.options.basket : [],
				totals: this.$root.$app.options.totals,
				taxList: this.$root.$app.options.vatList,
				measures: this.$root.$app.options.measures,
				showDiscountBlock: this.$root.$app.options.showProductDiscounts,
				showTaxBlock: this.$root.$app.options.showProductTaxes,
				totalResultLabel: this.$root.$app.options.mode === 'delivery' ? main_core.Loc.getMessage('SALESCENTER_SHIPMENT_PRODUCT_BLOCK_TOTAL') : null,
				urlBuilderContext: this.$root.$app.options.urlProductBuilderContext,
				isCatalogPriceEditEnabled: this.$root.$app.options.isCatalogPriceEditEnabled,
				isCatalogDiscountSetEnabled: this.$root.$app.options.isCatalogDiscountSetEnabled,
				fieldHints: this.$root.$app.options.fieldHints,
				hideUnselectedProperties: this.$root.$app.options.templateMode === 'view',
				showCompilationModeSwitcher: this.showCompilationModeSwitcher(),
				ownerId: this.$root.$app.options.ownerId,
				ownerTypeId: this.$root.$app.options.ownerTypeId,
				dialogId: this.$root.$app.options.dialogId,
				sessionId: this.$root.$app.options.sessionId,
				isShortProductViewFormat: true,
				enableEmptyProductError: false
			});
			this.checkProductErrors();
			main_core_events.EventEmitter.subscribe(this.productForm, 'ProductForm:onBasketChange', main_core.Runtime.debounce(this.onBasketChange, 500, this));
			main_core_events.EventEmitter.subscribe(this.productForm, 'ProductForm:onErrorsChange', main_core.Runtime.debounce(this.checkProductErrors, 500, this));
			main_core_events.EventEmitter.subscribe(this.productForm, 'ProductForm:onModeChange', this.onProductFormModeChange);
			main_core_events.EventEmitter.subscribe(this.productForm, 'ProductForm:onCompilationCreated', this.onProductFormCompilationCreated.bind(this));
		},
		watch: {
			messageDataSenderCode() {
				this.productForm.setShowCompilationModeSwitcher(this.showCompilationModeSwitcher());
			}
		},
		computed: {
			messageDataSenderCode() {
				return this.$store.state.orderCreation.messageData.senderCode;
			}
		},
		methods: {
			showCompilationModeSwitcher() {
				return this.$root.$app.options.templateMode === 'create' && this.$root.$app.options.showCompilationModeSwitcher === 'Y' && this.$root.$app.options.mode === ModeDictionary.paymentDelivery && this.messageDataSenderCode !== 'bitrix24';
			},
			onProductFormCompilationCreated(event) {
				const data = event.getData();
				this.$root.$app.newCompilationId = data.compilationId;
				this.$root.$app.ownerId = data.ownerId;
				this.$root.$app.options.ownerId = data.ownerId;
			},
			onProductFormModeChange(event) {
				const mode = event.getData().mode;
				if (mode === catalog_productForm.FormMode.COMPILATION) {
					this.$store.commit('orderCreation/enableCompilationMode');
				} else {
					this.$store.commit('orderCreation/disableCompilationMode');
				}
				this.$emit('on-product-form-mode-change');
			},
			onBasketChange(event) {
				const processRefreshRequest = data => {
					if (this.productForm) {
						const preparedBasket = [];
						data.basket.forEach(item => {
							if (!main_core.Type.isStringFilled(item.innerId)) {
								return;
							}
							preparedBasket.push({
								selectorId: item.innerId,
								fields: item
							});
						});
						this.productForm.setData({
							...data,
							basket: preparedBasket
						});
						if (main_core.Type.isArray(data.basket)) {
							this.$store.commit('orderCreation/setBasket', data.basket);
						}
						if (main_core.Type.isObject(data.total)) {
							this.$store.commit('orderCreation/setTotal', data.total);
						}
					}
				};
				const data = event.getData();
				if (!main_core.Type.isArray(data.basket)) {
					return;
				}
				const fields = [];
				data.basket.forEach(item => {
					fields.push(item.fields);
				});
				this.$store.commit('orderCreation/setBasket', fields);
				if (this.$root.$app.newCompilationId) {
					this.changeCompilationProducts();
				}
				if (this.isNeedDisableSubmit()) {
					this.$store.commit('orderCreation/disableSubmit');
					this.$store.commit('orderCreation/setHasAvailableProducts', false);
					return;
				}
				this.$store.commit('orderCreation/enableSubmit');
				this.$store.commit('orderCreation/setHasAvailableProducts', true);
				const requestId = main_core.Text.getRandom(20);
				this.refreshId = requestId;
				main_core.ajax.runAction('salescenter.api.order.refreshBasket', {
					data: {
						orderId: this.$root.$app.orderId,
						basketItems: fields
					}
				}).then(result => {
					if (this.refreshId !== requestId) {
						return;
					}
					const data = BX.prop.getObject(result, 'data', {});
					processRefreshRequest({
						total: BX.prop.getObject(data, 'total', {
							discount: 0,
							result: 0,
							sum: 0
							// resultNumeric: 0,
						}),
						basket: BX.prop.get(data, 'items', [])
					});
				}).catch(result => {
					const data = BX.prop.getObject(result, 'data', {});
					processRefreshRequest({
						errors: BX.prop.get(result, 'errors', []),
						basket: BX.prop.get(data, 'items', [])
					});
				});
			},
			changeCompilationProducts() {
				const basketItems = this.$store.getters['orderCreation/getBasket']();
				const productIds = basketItems.map(basketItem => {
					return basketItem.skuId;
				});
				const newCompilationId = this.$root.$app.newCompilationId;
				if (newCompilationId) {
					main_core.ajax.runAction('salescenter.compilation.updateCompilation', {
						data: {
							newCompilationId,
							productIds
						}
					});
				}
			},
			checkProductErrors() {
				if (this.isNeedDisableSubmit()) {
					this.$store.commit('orderCreation/disableSubmit');
					this.$store.commit('orderCreation/setHasAvailableProducts', false);
				} else {
					this.$store.commit('orderCreation/enableSubmit');
					this.$store.commit('orderCreation/setHasAvailableProducts', true);
				}
			},
			isNeedDisableSubmit() {
				const basket = this.$store.getters['orderCreation/getBasket']();
				if (basket.length <= 0 || this.productForm && main_core.Type.isFunction(this.productForm.hasErrors) && this.productForm.hasErrors()) {
					return true;
				}
				const filledProducts = basket.filter(item => {
					return main_core.Type.isStringFilled(item.module) && item.productId > 0 || item.name.length > 0;
				});
				return filledProducts.length <= 0;
			}
		},
		template: `
		<div class="salescenter-app-payment-side">
			<div class="salescenter-app-page-content">
				<div class="salescenter-app-form-wrapper"></div>
				<slot name="footer"></slot>
			</div>
		</div>
	`
	};

	var Product = {
		props: {
			counter: {
				type: Number,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			hintTitle: {
				type: String,
				required: true
			},
			additionalContainerClasses: {
				type: Object,
				required: false,
				default() {
					return {};
				}
			}
		},
		mixins: [StageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			product: Product$1
		},
		methods: {
			onItemHint(e) {
				BX.Salescenter.Manager.openHowToSell(e);
			},
			onProductFormModeChange(event) {
				this.$emit('on-product-form-mode-change');
			}
		},
		computed: {
			status() {
				return this.$store.getters['orderCreation/getHasAvailableProducts'] ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.current;
			},
			configForBlock() {
				return {
					counter: this.counter,
					checked: this.counterCheckedMixin,
					showHint: true
				};
			},
			containerClasses() {
				return {
					...this.statusClassMixin,
					...this.additionalContainerClasses
				};
			}
		},
		template: `
		<stage-block-item
			@on-item-hint.stop.prevent="onItemHint"
			:config="configForBlock"
			:class="containerClasses"
		>
			<template v-slot:block-title-title>{{ title }}</template>
			<template v-slot:block-hint-title>{{ hintTitle }}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">
					<div class="salescenter-app-payment-by-sms-item-container-payment">
						<product
						@on-product-form-mode-change="onProductFormModeChange"
						/>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var DeliverySelector = {
		props: {
			config: {
				type: Object,
				required: true
			}
		},
		components: {
			'delivery-selector': DeliverySelector$1
		},
		data() {
			return {
				availableServices: []
			};
		},
		methods: {
			onChange(payload) {
				this.$store.dispatch('orderCreation/setDelivery', payload.deliveryPrice);
				this.$store.dispatch('orderCreation/setDeliveryId', payload.deliveryServiceId);
				this.$store.dispatch('orderCreation/setPropertyValues', payload.relatedPropsValues);
				this.$store.dispatch('orderCreation/setDeliveryExtraServicesValues', payload.relatedServicesValues);
				this.$store.dispatch('orderCreation/setExpectedDelivery', payload.estimatedDeliveryPrice);
				this.$store.dispatch('orderCreation/setDeliveryResponsibleId', payload.responsibleUser ? payload.responsibleUser.id : null);
				this.$emit('change', payload);
			},
			onAddressFromChanged() {
				this.refreshAvailableServices();
			},
			onDeliveryServiceChanged() {
				this.refreshAvailableServices();
			},
			onSettingsChanged() {
				this.$emit('delivery-settings-changed');
			},
			refreshAvailableServices() {
				main_core.ajax.runAction('salescenter.order.getCompatibleDeliverySystems', {
					data: {
						basketItems: this.config.basket ? this.config.basket : [],
						options: {
							sessionId: this.config.sessionId,
							ownerTypeId: this.config.ownerTypeId,
							ownerId: this.config.ownerId
						},
						deliveryServiceId: this.order.deliveryId,
						shipmentPropValues: this.order.propertyValues,
						deliveryRelatedServiceValues: this.order.deliveryExtraServicesValues,
						deliveryResponsibleId: this.order.deliveryResponsibleId
					}
				}).then(result => {
					let data = BX.prop.getObject(result, "data", {});
					this.availableServices = data.availableServices ? data.availableServices : {};
				}).catch(result => {
					this.availableServices = {};
				});
			}
		},
		created() {
			this.$store.dispatch('orderCreation/setPersonTypeId', this.config.personTypeId);
			this.refreshAvailableServices();
		},
		computed: {
			localize() {
				return ui_vue.Vue.getFilteredPhrases('SALESCENTER_');
			},
			sumTitle() {
				return main_core.Loc.getMessage('SALESCENTER_PRODUCT_PRODUCTS_PRICE');
			},
			productsPrice() {
				return this.order.total.result;
			},
			delivery() {
				return this.order.delivery;
			},
			deliveryFormatted() {
				if (this.isDeliveryCalculated) {
					return BX.Currency.currencyFormat(this.delivery, this.config.currency, false);
				}
			},
			total() {
				if (this.productsPrice === null || this.delivery === null) {
					return null;
				}
				return this.productsPrice + this.delivery;
			},
			totalFormatted() {
				return BX.Currency.currencyFormat(this.total, this.config.currency, false);
			},
			isDeliveryCalculated() {
				return this.order.delivery !== null;
			},
			excludedServiceIds() {
				return this.$root.$app.options.mode === 'delivery' ? [this.$root.$app.options.emptyDeliveryServiceId] : [];
			},
			actionData() {
				return {
					basketItems: this.config.basket,
					options: {
						orderId: this.$root.$app.orderId,
						sessionId: this.config.sessionId,
						ownerTypeId: this.config.ownerTypeId,
						ownerId: this.config.ownerId
					}
				};
			},
			...ui_vue_vuex.Vuex.mapState({
				order: state => state.orderCreation
			})
		},
		template: `
		<delivery-selector
			:available-services="availableServices"
			:excluded-service-ids="excludedServiceIds"				
			:init-entered-delivery-price="config.deliveryPrice"
			:init-delivery-service-id="config.deliveryServiceId"
			:init-related-services-values="config.relatedServicesValues"
			:init-related-props-values="config.relatedPropsValues"
			:init-related-props-options="config.relatedPropsOptions"
			:init-responsible-id="config.responsibleId"
			:person-type-id="config.personTypeId"
			:action="'salescenter.api.order.refreshDelivery'"
			:action-data="actionData"
			:external-sum="productsPrice"
			:external-sum-label="sumTitle"
			:currency="config.currency"
			:currency-symbol="config.currencySymbol"
			@change="onChange"
			@address-from-changed="onAddressFromChanged"
			@delivery-service-changed="onDeliveryServiceChanged"
			@settings-changed="onSettingsChanged"
		></delivery-selector>
	`
	};

	var ShipmentView = {
		props: {
			id: {
				type: Number,
				required: true
			},
			productsPrice: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				shipment: {
					priceDelivery: null,
					basePriceDelivery: null,
					currency: null,
					deliveryService: {
						name: null,
						logo: null,
						parent: {
							name: null,
							logo: null
						}
					},
					extraServices: [],
					requestProperties: []
				},
				canUserPerformCalls: false
			};
		},
		created() {
			main_core.ajax.runAction('salescenter.deliveryselector.getShipmentData', {
				data: {
					id: this.id
				}
			}).then(result => {
				this.shipment = result.data.shipment;
				this.canUserPerformCalls = result.data.canUserPerformCalls;
			});
		},
		methods: {
			getFormattedPrice(price) {
				return BX.Currency.currencyFormat(price, this.currency, true);
			},
			isPhoneRequestProperty(property) {
				if (!main_core.Type.isArray(property.tags)) {
					return false;
				}
				return property.tags.includes('phone');
			},
			makeCall(phoneNumber) {
				if (!main_core.Type.isUndefined(window.top['BXIM']) && this.canUserPerformCalls === true) {
					window.top['BXIM'].phoneTo(phoneNumber);
				} else {
					window.open('tel:' + phoneNumber, '_self');
				}
			}
		},
		computed: {
			hasParent() {
				return this.shipment.hasOwnProperty('deliveryService') && this.shipment.deliveryService.hasOwnProperty('parent') && this.shipment.deliveryService.parent;
			},
			deliveryServiceLogo() {
				return this.shipment.deliveryService.logo ? this.shipment.deliveryService.logo : null;
			},
			deliveryServiceProfileLogo() {
				return this.hasParent && this.shipment.deliveryService.parent.logo ? this.shipment.deliveryService.parent.logo : null;
			},
			paymentPrice() {
				return this.productsPrice + this.priceDelivery;
			},
			deliveryServiceName() {
				return this.hasParent ? this.shipment.deliveryService.parent.name : this.shipment.deliveryService.name;
			},
			deliveryServiceProfileName() {
				return this.hasParent ? this.shipment.deliveryService.name : null;
			},
			priceDelivery() {
				return this.shipment ? this.shipment.priceDelivery : null;
			},
			currency() {
				return this.shipment ? this.shipment.currency : null;
			},
			extraServices() {
				return main_core.Type.isArray(this.shipment.extraServices) ? this.shipment.extraServices : [];
			},
			isExtraServicesVisible() {
				return this.extraServices.length > 0;
			},
			requestProperties() {
				return main_core.Type.isArray(this.shipment.requestProperties) ? this.shipment.requestProperties : [];
			},
			isRequestPropertiesVisible() {
				return this.requestProperties.length > 0;
			},
			priceDeliveryFormatted() {
				return this.getFormattedPrice(this.priceDelivery);
			},
			productsPriceFormatted() {
				return this.getFormattedPrice(this.productsPrice);
			},
			paymentPriceFormatted() {
				return this.getFormattedPrice(this.paymentPrice);
			}
		},
		template: `
		<div style="width: 100%;" xmlns="http://www.w3.org/1999/html">
			<div class="salescenter-delivery-selector-head">
				<div
					v-if="hasParent && deliveryServiceLogo"
					:style="{ backgroundImage: 'url(' + deliveryServiceLogo + ')' }"
					class="salescenter-delivery-selector-logo"
				>
				</div>
				<div class="salescenter-delivery-selector-info">
					<div
						v-if="deliveryServiceProfileLogo"
						:style="{ backgroundImage: 'url(' + deliveryServiceProfileLogo + ')' }"
						class="salescenter-delivery-selector-logo"
					>
					</div>
					<div class="salescenter-delivery-selector-content">
						<div class="salescenter-delivery-selector-text-light">{{deliveryServiceName}}</div>
						<div
							v-if="deliveryServiceProfileName"
							class="salescenter-delivery-selector-text-dark"
						>
							{{deliveryServiceProfileName}}
						</div>
					</div>
				</div>
			</div>
			<div v-if="isExtraServicesVisible" class="salescenter-delivery-selector-main">
				<div class="salescenter-delivery-selector-text-light">
					${main_core.Loc.getMessage('SALESCENTER_SHIPMENT_EXTRA_SERVICES')}:
				</div>
				<ul class="salescenter-delivery-selector-list">
					<li
						v-for="extraService in extraServices"
						class="salescenter-delivery-selector-list-item salescenter-delivery-selector-text-dark"
					>
						{{extraService.name}}: {{extraService.value}} 
					</li>
				</ul>
			</div>
			<div v-if="isRequestPropertiesVisible" class="salescenter-delivery-selector-main">
				<div class="salescenter-delivery-selector-text-light">
					${main_core.Loc.getMessage('SALESCENTER_DELIVERY_REQUEST_DETAILS')}:
				</div>
				<ul class="salescenter-delivery-selector-list">
					<li
						v-for="requestProperty in requestProperties"
						class="salescenter-delivery-selector-list-item salescenter-delivery-selector-text-dark"
					>
						{{requestProperty.name}}:
						<template v-if="isPhoneRequestProperty(requestProperty)">
							<a @click.prevent="makeCall(requestProperty.value)" href="#">{{requestProperty.value}}</a>
						</template>
						<template v-else>
							{{requestProperty.value}}
						</template>
					</li>
				</ul>
			</div>
			<div class="salescenter-delivery-selector-line"></div>
			<div class="catalog-pf-result-wrapper">
				<table class="catalog-pf-result">
					<tr>
						<td>
							<span class="catalog-pf-text">
								${main_core.Loc.getMessage('SALESCENTER_PRODUCT_PRODUCTS_PRICE')}:
							</span>
						</td> 
						<td>
							<span v-html="productsPriceFormatted" class="catalog-pf-text"></span> 
						</td>
					</tr>
					<tr>
						<td class="catalog-pf-result-padding-bottom">
							<span class="catalog-pf-text catalog-pf-text--tax">
								${main_core.Loc.getMessage('SALESCENTER_SHIPMENT_PRODUCT_BLOCK_DELIVERY_PRICE')}: 
							</span>
						</td> 
						<td class="catalog-pf-result-padding-bottom"> 
							<span class="catalog-pf-text catalog-pf-text--tax" v-html="priceDeliveryFormatted"></span>
						</td>
					</tr> 
					<tr>
						<td class="catalog-pf-result-padding">
							<span class="catalog-pf-text catalog-pf-text--total catalog-pf-text--border">
								${main_core.Loc.getMessage('SALESCENTER_PRODUCT_TOTAL_RESULT')}: 
							</span>
						</td> 
						<td class="catalog-pf-result-padding">
							<span v-html="paymentPriceFormatted" class="catalog-pf-text catalog-pf-text--total"></span> 
						</td>
					</tr>
				</table>
			</div>
		</div>
	`
	};

	const DeliveryVuex = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			tiles: {
				type: Array,
				required: true
			},
			installed: {
				type: Boolean,
				required: true
			},
			isCollapsible: {
				type: Boolean,
				required: true
			},
			initialCollapseState: {
				type: Boolean,
				required: true
			}
		},
		data() {
			return {
				selectedDeliveryServiceName: null
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'delivery-selector-block': DeliverySelector,
			'shipment-view': ShipmentView,
			'uninstalled-delivery-block': Uninstalled
		},
		computed: {
			statusClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled-bg': this.installed === false || this.status === salescenter_component_stageBlock.StatusTypes.disabled
				};
			},
			productsPrice() {
				return this.order.total.result;
			},
			shipmentId() {
				return this.$root.$app.options.shipmentId;
			},
			configForBlock() {
				return {
					counter: this.counter,
					titleName: this.selectedDeliveryServiceName,
					installed: this.installed,
					collapsible: this.isCollapsible,
					checked: this.counterCheckedMixin,
					showHint: false,
					initialCollapseState: this.initialCollapseState
				};
			},
			config() {
				let deliveryServiceId = null;
				if (this.$root.$app.options.hasOwnProperty('shipmentData') && this.$root.$app.options.shipmentData.hasOwnProperty('deliveryServiceId')) {
					deliveryServiceId = this.$root.$app.options.shipmentData.deliveryServiceId;
				}
				let deliveryPrice = null;
				if (this.$root.$app.options.hasOwnProperty('shipmentData') && this.$root.$app.options.shipmentData.hasOwnProperty('deliveryPrice')) {
					deliveryPrice = this.$root.$app.options.shipmentData.deliveryPrice;
				}
				let relatedPropsValues = {};
				if (this.$root.$app.options.hasOwnProperty('shipmentData') && this.$root.$app.options.shipmentData.hasOwnProperty('propValues')) {
					relatedPropsValues = this.$root.$app.options.shipmentData.propValues;
				}
				let relatedServicesValues = {};
				if (this.$root.$app.options.hasOwnProperty('shipmentData') && this.$root.$app.options.shipmentData.hasOwnProperty('extraServicesValues') && !Array.isArray(this.$root.$app.options.shipmentData.extraServicesValues)) {
					relatedServicesValues = this.$root.$app.options.shipmentData.extraServicesValues;
				}
				let relatedPropsOptions = {};
				if (this.$root.$app.options.hasOwnProperty('deliveryOrderPropOptions') && !Array.isArray(this.$root.$app.options.deliveryOrderPropOptions)) {
					relatedPropsOptions = this.$root.$app.options.deliveryOrderPropOptions;
				}
				return {
					personTypeId: this.$root.$app.options.personTypeId,
					basket: this.order.basket,
					currencySymbol: this.$root.$app.options.currencySymbol,
					currency: this.order.currency,
					ownerTypeId: this.$root.$app.options.ownerTypeId,
					ownerId: this.$root.$app.options.ownerId,
					sessionId: this.$root.$app.options.sessionId,
					relatedPropsValues,
					relatedPropsOptions,
					relatedServicesValues,
					deliveryServiceId,
					responsibleId: this.$root.$app.options.assignedById,
					deliveryPrice
				};
			},
			isViewTemplateMode() {
				return this.$root.$app.options.templateMode === 'view';
			},
			...ui_vue_vuex.Vuex.mapState({
				order: state => state.orderCreation
			})
		},
		methods: {
			setTitleName(state) {
				this.selectedDeliveryServiceName = state.deliveryServiceName;
			},
			saveCollapsedOption(option) {
				this.$emit('on-save-collapsed-option', 'delivery', option);
			}
		},
		template: `
		<stage-block-item
			:config="configForBlock"
			:class="[statusClassMixin, statusClass]"
			@on-item-hint.stop.prevent="onItemHint"
			@on-adjust-collapsed="saveCollapsedOption"
		>
			<template v-slot:block-title-title>${main_core.Loc.getMessage('SALESCENTER_DELIVERY_BLOCK_TITLE')}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">
					<template v-if="!installed">
						<uninstalled-delivery-block :tiles="tiles" 
								v-on:on-tile-slider-close="onSliderClose"/>
					</template>
					<template v-else>
						<div class="salescenter-app-payment-by-sms-item-container-select">
							<shipment-view
								v-if="isViewTemplateMode"
								:id="shipmentId"
								:productsPrice="productsPrice"
							>
							</shipment-view>
							<delivery-selector-block v-else
								:config="config" 
								@delivery-settings-changed="onSliderClose"
								@change="setTitleName" 
							/>
						</div>
					</template>
				</div>
			</template>
		</stage-block-item>
	`
	};

	const PaySystem = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			tiles: {
				type: Array,
				required: true
			},
			installed: {
				type: Boolean,
				required: true
			},
			titleItems: {
				type: Array
			},
			initialCollapseState: {
				type: Boolean,
				required: true
			}
		},
		mixins: [StageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'tile-collection-installed-block': Installed,
			'tile-collection-uninstalled-block': Uninstalled
		},
		methods: {
			onItemHint(e) {
				BX.Salescenter.Manager.openHowToConfigDefaultPaySystem(e);
			},
			saveCollapsedOption(option) {
				this.$emit('on-save-collapsed-option', 'pay_system', option);
			}
		},
		computed: {
			configForBlock() {
				return {
					counter: this.counter,
					titleItems: this.installed ? this.titleItems : [],
					installed: this.installed,
					collapsible: true,
					checked: this.counterCheckedMixin,
					showHint: !this.installed,
					initialCollapseState: this.initialCollapseState
				};
			},
			statusClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled-bg': this.installed === false
				};
			},
			title() {
				return main_core.Loc.getMessage('SALESCENTER_PAYSYSTEM_BLOCK_TITLE_MSGVER_1');
			}
		},
		template: `
		<stage-block-item
			:class="[statusClassMixin, statusClass]"
			:config="configForBlock"
			@on-item-hint.stop.prevent="onItemHint"
			@on-tile-slider-close="onSliderClose"
			@on-adjust-collapsed="saveCollapsedOption"
		>
			<template v-slot:block-title-title>{{title}}</template>
			<template v-slot:block-hint-title>
				${main_core.Loc.getMessage('SALESCENTER_PAYSYSTEM_BLOCK_SETTINGS_TITLE')}
			</template>
			<template v-slot:block-container>
				<div
					v-if="!installed"
					class="salescenter-app-explanation"
				>
					<div class="salescenter-app-explanation-img"></div>
					<div class="salescenter-app-explanation-area">
						<div class="salescenter-app-explanation-text">
							${main_core.Loc.getMessage('SALESCENTER_TERMINAL_PAYMENT_SYSTEM_SETUP_HINT')}
						</div>
					</div>
				</div>
				<div :class="containerClassMixin">
					<tile-collection-uninstalled-block 	:tiles="tiles" v-if="!installed" v-on:on-tile-slider-close="onSliderClose"/>
					<tile-collection-installed-block :tiles="tiles" v-on:on-tile-slider-close="onSliderClose" v-else />
				</div>
			</template>
		</stage-block-item>
	`
	};

	const ContextDictionary = Object.freeze({
		deal: 'deal',
		smartInvoice: 'smart_invoice',
		chat: 'chat',
		sms: 'sms',
		imOpenlines: 'imopenlines_app',
		terminalList: 'terminal_list'
	});

	const MessageMixin = {
		watch: {
			isCompilationMode(compilationMode) {
				if (this.messageSenderEditor) {
					const textModes = this.$root.$app.sendingMethodDesc.text_modes;
					const currentMessage = compilationMode ? textModes.compilation : textModes.payment;
					const bbcodeMessage = this.convertLegacyTemplateToBBCode(currentMessage);
					this.messageSenderEditor.setMessageText(bbcodeMessage);
					this.$store.dispatch('orderCreation/setMessageData', {
						body: bbcodeMessage
					});
				}
			}
		},
		computed: {
			messageSenderAvailable() {
				return BX.type.isObject(this.messageSenderData);
			},
			messageSenderId() {
				return this.messageSenderData.renderTo.replace('#', '');
			},
			isCompilationMode() {
				return this.$store.getters['orderCreation/isCompilationMode'];
			},
			messageData() {
				return this.$store.getters['orderCreation/getMessageData'];
			}
		},
		methods: {
			convertLegacyTemplateToBBCode(template) {
				const caption = main_core.Loc.getMessage('SALESCENTER_TEMPLATE_PLACEHOLDER_LINK');
				let isFirstOccurrence = true;
				return template.replaceAll('#LINK#', () => {
					if (isFirstOccurrence) {
						isFirstOccurrence = false;
						return `[placeholder code=LINK removable=false copyable=false]${caption}[/placeholder]`;
					}
					return caption;
				});
			},
			onMessageBodyChangeHandler(event) {
				const body = event.getData().body;
				this.$store.dispatch('orderCreation/setMessageData', {
					body
				});
				if (this.messageData.senderCode !== 'bitrix24') {
					this.$root.$app.sendingMethodDesc.text_modes[this.isCompilationMode ? 'compilation' : 'payment'] = body;
				}
			}
		}
	};

	const ChatMessage = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			manager: {
				type: Object,
				required: true
			},
			titleTemplate: {
				type: String,
				required: true
			},
			showHint: {
				type: Boolean,
				required: true
			},
			editorTemplate: {
				type: String,
				required: true
			},
			editorUrl: {
				type: String,
				required: true
			},
			selectedMode: {
				type: String,
				required: true
			},
			messageSenderData: {
				type: Object,
				required: false
			}
		},
		mixins: [StageMixin, MessageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'chat-user-avatar-block': salescenter_component_stageBlock_smsMessage.UserAvatar,
			'chat-message-editor-block': salescenter_component_stageBlock_smsMessage.MessageEditor
		},
		data() {
			return {
				currentSenderCode: null,
				senders: [],
				pushedToUseBitrix24Notifications: null,
				smsSenderListComponentKey: 0,
				messageSenderEditor: null
			};
		},
		computed: {
			configForBlock() {
				return {
					counter: this.counter,
					checked: this.counterCheckedMixin,
					showHint: true
				};
			},
			editor() {
				return {
					template: this.editorTemplate,
					url: this.editorUrl
				};
			},
			title() {
				return this.titleTemplate;
			},
			isMessageReadOnly() {
				return this.$root.$app.context !== ContextDictionary.sms;
			}
		},
		mounted() {
			if (this.messageSenderAvailable) {
				this.initMessageSenderEditor();
			}
		},
		methods: {
			initMessageSenderEditor() {
				const editorConfig = {
					...this.messageSenderData,
					message: {
						...this.messageSenderData.message,
						text: this.convertLegacyTemplateToBBCode(this.messageSenderData.message?.text ?? '')
					}
				};
				this.messageSenderEditor = new crm_messagesender_editor.Editor(editorConfig);
				this.messageSenderEditor.render().then(() => this.initMessageData()).catch(() => {});
				this.messageSenderEditor.subscribe('onMessageBodyChange', this.onMessageBodyChangeHandler.bind(this));
			},
			initMessageData() {
				const state = this.messageSenderEditor.getState();
				const messageData = {
					body: state.message?.body
				};
				this.$store.dispatch('orderCreation/setMessageData', messageData);
				this.$store.commit('orderCreation/setIsSenderSelected', true);
			},
			onItemHint(e) {
				BX.Salescenter.Manager.openSlider(this.$root.$app.options.urlSettingsCompanyContacts, {
					width: 1200
				});
			},
			openBitrix24NotificationsHelp(event) {
				BX.Salescenter.Manager.openBitrix24NotificationsHelp(event);
			}
		},
		template: `
		<stage-block-item			
			:config="configForBlock"
			:class="statusClassMixin"
			v-on:on-item-hint="onItemHint"
		>
			<template v-slot:block-title-title>{{title}}</template>
			<template
				v-if="showHint"
				v-slot:block-hint-title
			>
				${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_COMPANY_CONTACTS_SHORTER_VERSION')}
			</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin" class="salescenter-app-payment-by-sms-item-container-offtop">
					<div v-if="messageSenderAvailable && !isMessageReadOnly">
						<div :id="messageSenderId"></div>
					</div>
					<div v-else class="salescenter-app-payment-by-sms-item-container-sms">
						<chat-user-avatar-block :manager="manager"/>
						<div class="salescenter-app-payment-by-sms-item-container-sms-content">
							<chat-message-editor-block :editor="editor" :isReadOnly="isMessageReadOnly" :selectedMode="selectedMode"/>
						</div>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	const Automation = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			stageOnOrderPaid: {
				type: String,
				required: false
			},
			stageOnDeliveryFinished: {
				type: String,
				required: false
			},
			items: {
				type: Array,
				required: true
			},
			initialCollapseState: {
				type: Boolean,
				required: true
			},
			isDeliveryStageVisible: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		mixins: [StageMixin, MixinTemplatesType],
		data() {
			return {
				paymentStages: [],
				shipmentStages: []
			};
		},
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'stage-item-list': salescenter_component_stageBlock_automation.StageList
		},
		methods: {
			saveCollapsedOption(option) {
				this.$emit('on-save-collapsed-option', 'automation', option);
			},
			updatePaymentStage(e) {
				const newStageId = e.data;
				this.paymentStages.forEach(stage => {
					stage.selected = stage.id === newStageId;
				});
				this.$root.$app.stageOnOrderPaid = e.data;
			},
			updateShipmentStage(e) {
				const newStageId = e.data;
				this.shipmentStages.forEach(stage => {
					stage.selected = stage.id === newStageId;
				});
				this.$root.$app.stageOnDeliveryFinished = e.data;
			},
			initStages(stages, currentValue) {
				Object.values(this.items).forEach(options => {
					options.selected = !currentValue && !options.hasOwnProperty('id') || options.id === currentValue;
					stages.push(AutomationStage__namespace.Factory.create(options));
				});
			}
		},
		computed: {
			configForBlock() {
				return {
					counter: this.counter,
					checked: this.counterCheckedMixin,
					collapsible: true,
					initialCollapseState: this.initialCollapseState,
					titleName: this.selectedStage.name
				};
			},
			selectedStage() {
				const stages = this.isPayment ? this.paymentStages : this.shipmentStages;
				return stages.find(stage => {
					return stage.selected;
				});
			},
			isPayment() {
				return this.$root.$app.options.mode === 'payment_delivery' || this.$root.$app.options.mode === 'payment' || this.$root.$app.options.mode === 'terminal_payment';
			},
			isHideDeliveryStage() {
				return !this.isDeliveryStageVisible;
			}
		},
		created() {
			if (this.isPayment) {
				this.initStages(this.paymentStages, this.stageOnOrderPaid);
			}
			this.initStages(this.shipmentStages, this.stageOnDeliveryFinished);
		},
		template: `
		<stage-block-item
			:config="configForBlock"
			:class="statusClassMixin"
			@on-adjust-collapsed="saveCollapsedOption"
		>
			<template v-slot:block-title-title>${main_core.Loc.getMessage('SALESCENTER_AUTOMATION_BLOCK_TITLE')}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">
					<div v-if="isPayment">
						<stage-item-list
							v-on:on-choose-select-option="updatePaymentStage($event)"
							:stages="paymentStages"
							:editable="editable"
						>
							<template v-slot:stage-list-text>${main_core.Loc.getMessage('SALESCENTER_AUTOMATION_BLOCK_TEXT')}</template>
						</stage-item-list>
					</div>

					<div v-if="!isHideDeliveryStage">
						<stage-item-list
							v-on:on-choose-select-option="updateShipmentStage($event)"
							:stages="shipmentStages"
							:editable="editable"
						>
							<template v-slot:stage-list-text>${main_core.Loc.getMessage('SALESCENTER_AUTOMATION_DELIVERY_FINISHED')}</template>
						</stage-item-list>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var Send$2 = {
		props: {
			buttonLabel: {
				type: String,
				required: true
			},
			buttonEnabled: {
				type: Boolean,
				required: true
			},
			showWhatClientSeesControl: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			buttonClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled': this.buttonEnabled === false
				};
			}
		},
		methods: {
			showWhatClientSees(event) {
				BX.Salescenter.Manager.openWhatClientSee(event);
			},
			submit(event) {
				this.$emit('on-submit', event);
			}
		},
		template: `
		<div
			:class="buttonClass"
			class="salescenter-app-payment-by-sms-item-show salescenter-app-payment-by-sms-item salescenter-app-payment-by-sms-item-send"
		>
			<div class="salescenter-app-payment-by-sms-item-counter">
				<div class="salescenter-app-payment-by-sms-item-counter-rounder"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-line"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-number"></div>
			</div>
			<div class="">
				<div class="salescenter-app-payment-by-sms-item-container">
					<div class="salescenter-app-payment-by-sms-item-container-payment">
						<div class="salescenter-app-payment-by-sms-item-container-payment-inline">
							<div
								@click="submit($event)"
								class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
							>
								{{buttonLabel}}
							</div>
							<div
								v-if="showWhatClientSeesControl"
								@click="showWhatClientSees"
								class="salescenter-app-add-item-link"
							>
								${main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_TEMPLATE_WHAT_DOES_CLIENT_SEE')}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const TimeLine = {
		props: {
			timelineItems: {
				type: Array,
				required: true
			}
		},
		components: {
			'timeline-item-block': salescenter_component_stageBlock_timeline.TimeLineItemBlock,
			'timeline-item-payment-block': salescenter_component_stageBlock_timeline.TimeLineItemPaymentBlock,
			'timeline-item-custom-block': salescenter_component_stageBlock_timeline.TimeLineItemCustomBlock
		},
		methods: {
			isPayment(item) {
				return item.type === TimeLineItem.Payment.type();
			},
			isCustom(item) {
				return item.type === TimeLineItem.Custom.type();
			}
		},
		template: `
		<div class="salescenter-app-payment-by-sms-timeline">
			<template v-for="(item) in timelineItems">
				<timeline-item-payment-block :item="item" v-if="isPayment(item)"/>
				<timeline-item-custom-block :item="item" v-else-if="isCustom(item)"/>
				<timeline-item-block :item="item" v-else/>
			</template>
		</div>
	`
	};

	const DocumentSelector = {
		props: {
			counter: {
				type: Number,
				required: true
			},
			templateAddUrl: {
				type: String,
				required: false
			}
		},
		mixins: [StageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block
		},
		computed: {
			status() {
				if (this.model && this.model.templates && this.model.templates.length || this.model.documents && this.model.documents.length) {
					return salescenter_component_stageBlock.StatusTypes.complete;
				}
				if (this.templateAddUrl && this.templateAddUrl.length) {
					return salescenter_component_stageBlock.StatusTypes.current;
				}
				return salescenter_component_stageBlock.StatusTypes.disabled;
			},
			configForBlock() {
				return {
					counter: this.counter,
					titleItems: [],
					installed: true,
					collapsible: false,
					checked: this.counterCheckedMixin,
					showHint: false,
					initialCollapseState: false
				};
			},
			getDocumentTitle() {
				const currentDocument = this.getCurrentDocument();
				if (currentDocument) {
					return currentDocument.title;
				}
				return main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_CREATE_NEW_TEMPLATE');
			},
			withStamps() {
				let isWithStamps = '';
				const currentDocument = this.getCurrentDocument();
				if (currentDocument) {
					if (currentDocument.isWithStamps) {
						isWithStamps = main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_WITH_SIGNS');
					} else {
						isWithStamps = main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_WITHOUT_SIGNS');
					}
				}
				return isWithStamps;
			},
			hasData() {
				const document = this.getCurrentDocument();
				return document && document.detailUrl;
			},
			...ui_vue_vuex.Vuex.mapState({
				model: state => state.documentSelector
			})
		},
		methods: {
			handleDocumentClick({
				target
			}) {
				if (this.getCurrentDocument() !== null) {
					this.openSelectorMenu(target);
				} else {
					this.openTemplatesList();
				}
			},
			openSelectorMenu(bindElement) {
				main_popup.MenuManager.show({
					id: 'payment-document-selector',
					bindElement,
					items: this.prepareSelectorMenuItems(),
					closeByEsc: true,
					cacheable: false
				});
			},
			closeSelectorMenu() {
				main_popup.MenuManager.destroy('payment-document-selector');
			},
			prepareSelectorMenuItems() {
				const items = [];
				if (this.model.documents) {
					for (const document of this.model.documents) {
						items.push({
							text: document.title,
							onclick: () => {
								this.closeSelectorMenu();
								this.$store.dispatch('documentSelector/setBoundDocumentId', {
									boundDocumentId: document.id
								});
							}
						});
					}
				}
				const templateListItem = {
					text: main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_CREATE_NEW_DOCUMENT'),
					items: []
				};
				if (this.model.templates) {
					if (items.length > 0) {
						items.push({
							delimiter: true
						});
					}
					for (const template of this.model.templates) {
						templateListItem.items.push({
							text: template.title,
							onclick: () => {
								this.closeSelectorMenu();
								this.$store.commit('documentSelector/setSelectedTemplateId', {
									selectedTemplateId: template.id
								});
							}
						});
					}
				}
				if (this.templateAddUrl) {
					if (templateListItem.items.length > 0) {
						templateListItem.items.push({
							delimiter: true
						});
					}
					templateListItem.items.push({
						text: main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_CREATE_NEW_TEMPLATE'),
						onclick: () => {
							this.closeSelectorMenu();
							this.openTemplatesList();
						}
					});
				}
				if (templateListItem.items.length > 0) {
					items.push(templateListItem);
				}
				return items;
			},
			openTemplatesList() {
				salescenter_manager.Manager.openSlider(this.templateAddUrl, {
					width: 930
				}).then(() => {
					this.$store.dispatch('documentSelector/loadTemplates');
				});
			},
			handleEditDocumentClick() {
				const currentDocument = this.getCurrentDocument();
				if (currentDocument.detailUrl) {
					salescenter_manager.Manager.openSlider(currentDocument.detailUrl, {
						width: 980
					}).then(slider => {
						const document = slider.getData().get('document');
						if (document) {
							this.$store.dispatch('documentSelector/addDocument', {
								document
							});
						}
					});
				}
			},
			getCurrentDocument() {
				let document = null;
				if (this.model.boundDocumentId > 0) {
					document = this.getDocumentById(this.model.boundDocumentId);
				}
				if (!document && this.model.selectedTemplateId > 0) {
					document = this.getStubDocumentByTemplate(this.model.selectedTemplateId);
				}
				if (!document) {
					const documents = this.model.documents;
					if (documents && documents[0]) {
						document = documents[0];
						this.$store.dispatch('documentSelector/setBoundDocumentId', {
							boundDocumentId: document.id
						});
					}
				}
				if (!document) {
					const templates = this.model.templates;
					if (templates && templates[0]) {
						document = this.getStubDocumentByTemplate(templates[0].id);
						this.$store.commit('documentSelector/setSelectedTemplateId', {
							selectedTemplateId: templates[0].id
						});
					}
				}
				return document;
			},
			getDocumentById(id) {
				for (const document of this.model.documents) {
					if (document.id === id) {
						return document;
					}
				}
				return null;
			},
			getTemplateById(id) {
				for (const template of this.model.templates) {
					if (template.id === id) {
						return template;
					}
				}
				return null;
			},
			getStubDocumentByTemplate(templateId) {
				const template = this.getTemplateById(templateId);
				if (!template) {
					return null;
				}
				const paymentId = this.$root.$app.options.paymentId || 0;
				let title = null;
				let detailUrl = null;
				if (paymentId > 0) {
					title = main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_DOCUMENT_NEW_SUFFIX', {
						'#TITLE#': template.title
					});
					detailUrl = main_core.Uri.addParam(template.documentCreationUrl, {
						values: {
							_paymentId: paymentId
						}
					});
				} else {
					title = main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_DOCUMENT_CREATED_LATER_SUFFIX', {
						'#TITLE#': template.title
					});
					detailUrl = null;
				}
				return {
					id: 0,
					title,
					detailUrl,
					isWithStamps: template.isWithStamps
				};
			}
		},
		// language=Vue
		template: `
		<stage-block-item
			:class="statusClassMixin"
			:config="configForBlock"
		>
			<template v-slot:block-title-title>${main_core.Loc.getMessage('SALESCENTER_DOCUMENT_SELECTOR_BLOCK_TITLE')}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">										
					<div class="salescenter-app-payment-item-container-document-selector">
						<div class="salescenter-app-payment-item-container-document-selector-selector">
							<div class="salescenter-app-payment-item-container-document-selector-selector-file">
								<div class="ui-icon ui-icon-lg ui-icon-file-pdf"><i></i></div>
							</div>
							<div class="salescenter-app-payment-item-container-document-selector-title">
								<div 
									ref="selectorNode"
									class="salescenter-app-payment-item-container-document-selector-title-button"
									@click="handleDocumentClick"
								>{{getDocumentTitle}}</div>
								<div class="salescenter-app-payment-item-container-document-selector-title-sign">{{withStamps}}</div>
							</div>
						</div>
						<div
							v-if="hasData"
							class="salescenter-app-payment-item-container-document-selector-edit"
						>
							<div 
								class="salescenter-app-payment-item-container-document-selector-edit-button"
								@click="handleEditDocumentClick"
							>
															<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
																<path fill-rule="evenodd" clip-rule="evenodd" d="M11.4359 0.03479L13.9865 2.61221L4.00879 12.563L1.45822 9.98561L11.4359 0.03479ZM0.0256074 13.6726C0.00148857 13.7639 0.0273302 13.8603 0.0927957 13.9275C0.159984 13.9947 0.25646 14.0205 0.347767 13.9947L3.19896 13.2265L0.793965 10.8223L0.0256074 13.6726Z" fill="#525C69"/>
															</svg>
															${main_core.Loc.getMessage('SALESCENTER_RIGHT_ACTION_EDIT')}</div>
						</div>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var StageBlocksList$1 = {
		components: {
			'chat-message-block': ChatMessage,
			'product-block': Product,
			'paysystem-block': PaySystem,
			'cashbox-block': Cashbox,
			'delivery-block': DeliveryVuex,
			'automation-block': Automation,
			'send-block': Send$2,
			'timeline-block': TimeLine,
			'document-selector-block': DocumentSelector
		},
		data() {
			const stages = {
				message: {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					manager: this.$root.$app.options.entityResponsible,
					titleTemplate: main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_SENDER_MSGVER_1'),
					showHint: this.$root.$app.options.templateMode !== 'view',
					editorTemplate: this.$root.$app.sendingMethodDesc.text,
					editorUrl: this.$root.$app.orderPublicUrl,
					selectedMode: 'payment',
					messageSenderData: this.$root.$app.options.messageSenderData
				},
				product: {
					status: this.$root.$app.options.basket && this.$root.$app.options.basket.length > 0 ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.current,
					title: main_core.Loc.getMessage('SALESCENTER_PRODUCT_BLOCK_TITLE_MSGVER_1'),
					hintTitle: this.$root.$app.options.templateMode === 'view' ? '' : main_core.Loc.getMessage('SALESCENTER_PRODUCT_SET_BLOCK_TITLE_SHORT')
				},
				paysystem: {
					status: this.$root.$app.options.paySystemList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.paySystemList.items),
					installed: this.$root.$app.options.paySystemList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.paySystemList.items),
					initialCollapseState: this.$root.$app.options.isPaySystemCollapsed ? this.$root.$app.options.isPaySystemCollapsed === 'Y' : this.$root.$app.options.paySystemList.isSet
				},
				cashbox: {},
				automation: {},
				documentSelector: {
					status: salescenter_component_stageBlock.StatusTypes.complete
				}
			};
			if (this.$root.$app.options.hasOwnProperty('deliveryList')) {
				stages.delivery = {
					isHidden: this.$root.$app.options.templateMode === 'view' && parseInt(this.$root.$app.options.shipmentId) <= 0,
					status: this.$root.$app.options.deliveryList.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.deliveryList.items),
					installed: this.$root.$app.options.deliveryList.isInstalled,
					initialCollapseState: this.$root.$app.options.isDeliveryCollapsed ? this.$root.$app.options.isDeliveryCollapsed === 'Y' : this.$root.$app.options.deliveryList.isInstalled
				};
			}
			if (this.$root.$app.options.cashboxList.hasOwnProperty('items')) {
				stages.cashbox = {
					status: this.$root.$app.options.cashboxList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.cashboxList.items),
					installed: this.$root.$app.options.cashboxList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.cashboxList.items),
					initialCollapseState: this.$root.$app.options.isCashboxCollapsed ? this.$root.$app.options.isCashboxCollapsed === 'Y' : this.$root.$app.options.cashboxList.isSet
				};
			}
			if (this.$root.$app.options.isAutomationAvailable) {
				stages.automation = {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					stageOnOrderPaid: this.$root.$app.options.stageOnOrderPaid,
					stageOnDeliveryFinished: this.$root.$app.options.stageOnDeliveryFinished,
					items: this.$root.$app.options.entityStageList,
					initialCollapseState: this.$root.$app.options.isAutomationCollapsed ? this.$root.$app.options.isAutomationCollapsed === 'Y' : false
				};
			}
			if (this.$root.$app.options.hasOwnProperty('timeline')) {
				stages.timeline = {
					items: this.getTimelineCollection(this.$root.$app.options.timeline)
				};
			}
			if (this.$root.$app.hasOwnProperty('documentSelector') && this.$root.$app.documentSelector.templateAddUrl) {
				stages.documentSelector.templateAddUrl = this.$root.$app.documentSelector.templateAddUrl;
			}
			return {
				stages
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		computed: {
			isSendAllowed() {
				return this.$store.getters['orderCreation/isAllowedSubmit'];
			},
			hasStageTimeLine() {
				return this.stages.timeline.hasOwnProperty('items') && this.stages.timeline.items.length > 0;
			},
			hasStageAutomation() {
				return this.stages.automation.hasOwnProperty('items');
			},
			hasStageCashBox() {
				return this.stages.cashbox.hasOwnProperty('tiles');
			},
			submitButtonLabel() {
				return main_core.Loc.getMessage('SALESCENTER_SEND');
			},
			isShowDocumentSelector() {
				return this.$root.$app.hasOwnProperty('documentSelector');
			}
		},
		methods: {
			initCounter() {
				this.counter = 1;
			},
			getTimelineCollection(items) {
				const list = [];
				Object.values(items).forEach(options => {
					list.push(TimeLineItem__namespace.Factory.create(options));
				});
				return list;
			},
			getTileCollection(items) {
				const tiles = [];
				Object.values(items).forEach(options => {
					tiles.push(Tile__namespace.Factory.create(options));
				});
				return tiles;
			},
			getTitleItems(items) {
				const result = [];
				items.forEach(item => {
					if (![Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(item.type)) {
						result.push(item);
					}
				});
				return result;
			},
			stageRefresh(e, type) {
				main_core.ajax.runComponentAction('bitrix:salescenter.app', 'getAjaxData', {
					mode: 'class',
					data: {
						type
					}
				}).then(response => {
					if (response.data) {
						this.refreshTilesByType(response.data, type);
					}
				}, () => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SALESCENTER_DATA_UPDATE_ERROR')
					});
				});
			},
			refreshTilesByType(data, type) {
				if (type === 'PAY_SYSTEM') {
					this.stages.paysystem.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.paysystem.tiles = this.getTileCollection(data.items);
					this.stages.paysystem.installed = data.isSet;
					this.stages.paysystem.titleItems = this.getTitleItems(data.items);
				} else if (type === 'CASHBOX') {
					this.stages.cashbox.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.cashbox.tiles = this.getTileCollection(data.items);
					this.stages.cashbox.installed = data.isSet;
					this.stages.cashbox.titleItems = this.getTitleItems(data.items);
				} else if (type === 'DELIVERY') {
					this.stages.delivery.status = data.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.delivery.tiles = this.getTileCollection(data.items);
					this.stages.delivery.installed = data.isInstalled;
				}
			},
			onSend(event) {
				this.$emit('stage-block-send-on-send', event);
			},
			changeProvider(value) {
				this.$root.$app.sendingMethodDesc.provider = value;
				BX.userOptions.save('salescenter', 'payment_sms_provider_options', 'latest_selected_provider', value);
			},
			saveCollapsedOption(type, value) {
				BX.userOptions.save('salescenter', 'add_payment_collapse_options', type, value);
			},
			onProductFormModeChange() {
				const isCompilationMode = this.$store.getters['orderCreation/isCompilationMode'];
				if (isCompilationMode) {
					this.stages.delivery.status = salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.message.selectedMode = 'compilation';
					this.$root.$app.sendingMethodDesc.text = this.$root.$app.sendingMethodDesc.text_modes.compilation;
					this.stages.message.editorTemplate = this.$root.$app.sendingMethodDesc.text_modes.compilation;
				} else {
					if (this.stages.delivery) {
						this.stages.delivery.status = this.$root.$app.options.deliveryList.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					}
					this.stages.message.selectedMode = 'payment';
					this.$root.$app.sendingMethodDesc.text = this.$root.$app.sendingMethodDesc.text_modes.payment;
					this.stages.message.editorTemplate = this.$root.$app.sendingMethodDesc.text_modes.payment;
				}
			}
		},
		created() {
			this.initCounter();
		},
		beforeUpdate() {
			this.initCounter();
		},
		template: `
		<div>
			<product-block
				:counter="counter++"
				:status="stages.product.status"
				:title="stages.product.title"
				:hintTitle="stages.product.hintTitle"
				@on-product-form-mode-change="onProductFormModeChange"
			/>
			<chat-message-block
				v-if="editable"
				@stage-block-sms-send-on-change-provider="changeProvider"
				:counter="counter++"
				:status="stages.message.status"
				:manager="stages.message.manager"
				:titleTemplate="stages.message.titleTemplate"
				:showHint="stages.message.showHint"
				:editorTemplate="stages.message.editorTemplate"
				:editorUrl="stages.message.editorUrl"
				:selectedMode="stages.message.selectedMode"
				:messageSenderData="stages.message.messageSenderData"
			/>
			<paysystem-block
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'PAY_SYSTEM')"
				:counter="counter++"
				:status="stages.paysystem.status"
				:tiles="stages.paysystem.tiles"
				:installed="stages.paysystem.installed"
				:titleItems="stages.paysystem.titleItems"
				:initialCollapseState="stages.paysystem.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<cashbox-block
				v-if="hasStageCashBox"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'CASHBOX')"
				:counter="counter++"
				:status="stages.cashbox.status"
				:tiles="stages.cashbox.tiles"
				:installed="stages.cashbox.installed"
				:titleItems="stages.cashbox.titleItems"
				:initialCollapseState="stages.cashbox.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<delivery-block
				v-if="stages.delivery && !stages.delivery.isHidden"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'DELIVERY')"
				:counter="counter++"
				:status="stages.delivery.status"
				:tiles="stages.delivery.tiles"
				:installed="stages.delivery.installed"
				:isCollapsible="true"
				:initialCollapseState="stages.delivery.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<document-selector-block
				v-if="isShowDocumentSelector"
				:counter="counter++"
				:templateAddUrl="stages.documentSelector.templateAddUrl"
			/>
			<automation-block
				v-if="hasStageAutomation"
				:counter="counter++"
				:status="stages.automation.status"
				:stageOnOrderPaid="stages.automation.stageOnOrderPaid"
				:stageOnDeliveryFinished="stages.automation.stageOnDeliveryFinished"
				:items="stages.automation.items"
				:initialCollapseState="stages.automation.initialCollapseState"
				:isDeliveryStageVisible="stages.delivery && stages.delivery.installed"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<send-block
				@on-submit="onSend"
				:buttonEnabled="isSendAllowed"
				:buttonLabel="submitButtonLabel"
				:showWhatClientSeesControl="false"
			/>
			<timeline-block
				v-if="hasStageTimeLine"
				:timelineItems="stages.timeline.items"
			/>
		</div>
	`
	};

	var ComponentMixin = {
		data() {
			return {
				isFaded: false
			};
		},
		mounted() {
			this.createPinner();
		},
		created() {
			this.$root.$on('on-start-progress', () => {
				this.startFade();
			});
			this.$root.$on('on-stop-progress', () => {
				this.endFade();
			});
		},
		methods: {
			startFade() {
				this.isFaded = true;
			},
			endFade() {
				this.isFaded = false;
			},
			createPinner() {
				let buttonsPanel = this.$refs['buttonsPanel'];
				if (buttonsPanel) {
					this.$root.$el.parentNode.appendChild(buttonsPanel);
					new BX.UI.Pinner(buttonsPanel, {
						fixBottom: this.$root.$app.isFrame,
						fullWidth: this.$root.$app.isFrame,
						anchorBottom: '.salescenter-app-pinner-anchor'
					});
				}
			},
			close() {
				this.$root.$app.closeApplication();
			}
		},
		computed: {
			isOrderPublicUrlAvailable() {
				return this.$root.$app.isOrderPublicUrlAvailable;
			},
			wrapperClass() {
				return {
					'salescenter-app-wrapper-fade': this.isFaded
				};
			},
			wrapperStyle() {
				const position = BX.pos(this.$root.$el);
				let offset = position.top + 20;
				if (this.$root.$nodes.footer) {
					offset += BX.pos(this.$root.$nodes.footer).height;
				}
				const buttonsPanel = this.$refs['buttonsPanel'];
				if (buttonsPanel) {
					offset += BX.pos(buttonsPanel).height;
				}

				//?auto
				return {
					'minHeight': 'calc(100vh - ' + offset + 'px)'
				};
			}
		}
	};

	var Start = {
		data() {
			return {};
		},
		methods: {
			connect() {
				const loader = new BX.Loader({
					size: 200
				});
				loader.show(document.body);
				BX.Salescenter.Manager.connect({
					no_redirect: 'Y',
					context: this.$root.$app.context
				}).then(() => {
					BX.Salescenter.Manager.loadConfig().then(result => {
						loader.hide();
						if (result.isSiteExists) {
							this.$root.$app.isSiteExists = result.isSiteExists;
							this.$root.$app.isOrderPublicUrlExists = true;
							this.$root.$app.orderPublicUrl = result.orderPublicUrl;
							this.$root.$app.isOrderPublicUrlAvailable = result.isOrderPublicUrlAvailable;
						}
						this.$emit('on-successfully-connected');
					});
				}).catch(function () {
					loader.hide();
				});
			},
			checkRecycle() {
				salescenter_manager.Manager.openConnectedSite(true);
			},
			publishConnectedSite() {
				this.$root.$app.publishShop();
			},
			confirmPhoneNumber() {
				main_core_events.EventEmitter.subscribeOnce('BX.Salescenter.App::onPhoneConfirmed', () => this.$root.$app.publishShop());
				this.$root.$app.confirmPhoneNumber();
			}
		},
		computed: {
			isOrderPageDeleted() {
				return this.$root.$app.isSiteExists && !this.isOrderPublicUrlExists;
			},
			isOrderPublicUrlExists() {
				return this.$root.$app.isOrderPublicUrlExists;
			},
			isPhoneConfirmed() {
				return this.$root.$app.isPhoneConfirmed;
			}
		},
		template: `
		<div class="salescenter-app-page-content salescenter-app-start-wrapper">
			<div class="ui-title-1 ui-text-center ui-color-medium" style="margin-bottom: 20px;">
				${main_core.Loc.getMessage('SALESCENTER_INFO_TEXT_TOP_2_MSGVER_1')}
			</div>
			<div class="ui-hr ui-mv-25"></div>
			<template v-if="isOrderPublicUrlExists && !isPhoneConfirmed">
				<div class="salescenter-title-5 ui-title-5 ui-text-center ui-color-medium">
					${main_core.Loc.getMessage('SALESCENTER_PHONE_CONFIRMATION_INFO_TEXT_BOTTOM_PUBLIC')}
				</div>
				<div style="padding-top: 5px;" class="ui-text-center">
					<div class="ui-btn ui-btn-primary ui-btn-lg" @click="confirmPhoneNumber">
						${main_core.Loc.getMessage('SALESCENTER_PHONE_CONFIRMATION_INFO_CONFIRM')}
					</div>
				</div>
			</template>
			<template v-else-if="isOrderPublicUrlExists">
				<div class="salescenter-title-5 ui-title-5 ui-text-center ui-color-medium">
					${main_core.Loc.getMessage('SALESCENTER_INFO_TEXT_BOTTOM_PUBLIC')}
				</div>
				<div style="padding-top: 5px;" class="ui-text-center">
					<div class="ui-btn ui-btn-primary ui-btn-lg" @click="publishConnectedSite">
						${main_core.Loc.getMessage('SALESCENTER_INFO_PUBLIC')}
					</div>
				</div>
			</template>
			<template v-else-if="isOrderPageDeleted">
				<div class="salescenter-title-5 ui-title-5 ui-text-center ui-color-medium">
					${main_core.Loc.getMessage('SALESCENTER_INFO_ORDER_PAGE_DELETED')}
				</div>
				<div style="padding-top: 5px;" class="ui-text-center">
					<div
						@click="checkRecycle"
						class="ui-btn ui-btn-primary ui-btn-lg"
					>
						${main_core.Loc.getMessage('SALESCENTER_CHECK_RECYCLE')}
					</div>
				</div>
			</template>
			<template v-else>
				<div class="salescenter-title-5 ui-title-5 ui-text-center ui-color-medium">
					${main_core.Loc.getMessage('SALESCENTER_INFO_TEXT_BOTTOM_2')}
				</div>
				<div style="padding-top: 5px;" class="ui-text-center">
					<div
						@click="connect"
						class="ui-btn ui-btn-primary ui-btn-lg"
					>
						${main_core.Loc.getMessage('SALESCENTER_INFO_CREATE')}
					</div>
				</div>
				<div style="padding-top: 5px;" class="ui-text-center">
					<div
						@click="BX.Salescenter.Manager.openHowPayDealWorks(event)"
						class="ui-btn ui-btn-link ui-btn-lg"
					>
						${main_core.Loc.getMessage('SALESCENTER_HOW')}
					</div>
				</div>
			</template>
		</div>
	`
	};

	var NoPaymentSystemsBanner = {
		data() {
			return {
				isVisible: true
			};
		},
		methods: {
			hide() {
				this.isVisible = false;
				this.$emit('on-hide');
			},
			openControlPanel() {
				salescenter_manager.Manager.openControlPanel();
			}
		},
		template: `
		<div v-if="isVisible" class="salescenter-app-banner" >
			<div class="salescenter-app-banner-inner">
				<div class="salescenter-app-banner-title">
					${main_core.Loc.getMessage('SALESCENTER_BANNER_TITLE')}
				</div>
				<div class="salescenter-app-banner-content">
					<div class="salescenter-app-banner-text">
						${main_core.Loc.getMessage('SALESCENTER_BANNER_TEXT')}
					</div>
					<div class="salescenter-app-banner-btn-block">
						<button
							@click="openControlPanel"
							class="ui-btn ui-btn-sm ui-btn-primary salescenter-app-banner-btn-connect"
						>
							${main_core.Loc.getMessage('SALESCENTER_BANNER_BTN_CONFIGURE')}
						</button>
						<button
							@click="hide"
							class="ui-btn ui-btn-sm ui-btn-link salescenter-app-banner-btn-hide"
						>
							${main_core.Loc.getMessage('SALESCENTER_BANNER_BTN_HIDE')}
						</button>
					</div>
				</div>
				<div
					@click="hide"
					class="salescenter-app-banner-close"
				>
				</div>
			</div>
		</div>
	`
	};

	var Chat = {
		mixins: [MixinTemplatesType, ComponentMixin],
		data() {
			return {
				isShowPreview: false,
				isShowPayment: false,
				pageTitle: '',
				currentPageId: null,
				actions: [],
				frameCheckShortTimeout: false,
				frameCheckLongTimeout: false,
				isPagesOpen: false,
				isFormsOpen: false,
				showedPageIds: [],
				loadedPageIds: [],
				errorPageIds: [],
				lastAddedPages: [],
				ordersCount: null,
				paymentsCount: null,
				editedPageId: null,
				currentPageTitle: null,
				ModeDictionary
			};
		},
		components: {
			'product': Product$1,
			'start': Start,
			'no-payment-systems-banner': NoPaymentSystemsBanner,
			'chat-receiving-payment': StageBlocksList$1
		},
		updated() {
			this.renderErrors();
		},
		mounted() {
			this.createLoader();
			this.$root.$app.fillPages().then(() => {
				if (this.$root.$app.isWithOrdersMode) {
					this.refreshOrdersCount();
				} else {
					this.refreshPaymentsCount();
				}
				this.openFirstPage();
			});
			if (this.$root.$app.isPaymentsLimitReached) {
				let paymentsLimitStartNode = this.$root.$nodes.paymentsLimit;
				let paymentsLimitNode = this.$refs['paymentsLimit'];
				for (let node of paymentsLimitStartNode.children) {
					paymentsLimitNode.appendChild(node);
				}
			}
		},
		methods: {
			getActions() {
				let actions = [];
				if (this.currentPage) {
					actions = [{
						text: this.localize.SALESCENTER_RIGHT_ACTION_COPY_URL,
						onclick: this.copyUrl
					}];
					if (this.currentPage.landingId > 0) {
						actions = [...actions, {
							text: this.localize.SALESCENTER_RIGHT_ACTION_HIDE,
							onclick: this.hidePage
						}];
					} else {
						actions = [...actions, {
							text: this.localize.SALESCENTER_RIGHT_ACTION_DELETE,
							onclick: this.hidePage
						}];
					}
				}
				return [...actions, {
					text: this.localize.SALESCENTER_RIGHT_ACTION_ADD,
					items: this.getAddPageActions()
				}];
			},
			getAddPageActions(isWebform = false) {
				return [{
					text: this.localize.SALESCENTER_RIGHT_ACTION_ADD_SITE_B24,
					onclick: () => {
						this.addSite(isWebform);
					}
				}, {
					text: this.localize.SALESCENTER_RIGHT_ACTION_ADD_CUSTOM,
					onclick: () => {
						this.showAddUrlPopup({
							isWebform: isWebform === true ? 'Y' : null
						});
					}
				}];
			},
			openFirstPage() {
				this.isShowPayment = false;
				this.isShowPreview = true;
				if (this.$root.$app.isPaymentCreationAvailable) {
					this.showPaymentForm();
				} else if (this.pages && this.pages.length > 0) {
					let firstWebformPage = false;
					let pageToOpen = false;
					this.pages.forEach(page => {
						if (!pageToOpen) {
							if (!page.isWebform) {
								pageToOpen = page;
							} else {
								firstWebformPage = page;
							}
						}
					});
					if (!pageToOpen && firstWebformPage) {
						pageToOpen = firstWebformPage;
					}
					if (this.currentPageId !== pageToOpen.id) {
						this.onPageClick(pageToOpen);
						if (pageToOpen.isWebform) {
							this.isFormsOpen = true;
						} else {
							this.isPagesOpen = true;
						}
					} else {
						this.currentPageId = this.pages[0].id;
					}
				} else {
					this.pageTitle = null;
					this.currentPageId = null;
					this.setPageTitle(this.pageTitle);
				}
			},
			onPageClick(page) {
				this.pageTitle = page.name;
				this.currentPageId = page.id;
				this.hideActionsPopup();
				this.isShowPayment = false;
				this.isShowPreview = true;
				this.setPageTitle(this.pageTitle);
				if (page.isFrameDenied !== true) {
					if (!this.showedPageIds.includes(page.id)) {
						this.startFrameCheckTimeout();
						this.showedPageIds.push(page.id);
					}
				} else {
					this.onFrameError();
				}
			},
			showActionsPopup({
				target
			}) {
				BX.PopupMenu.show('salescenter-app-actions', target, this.getActions(), {
					offsetLeft: 0,
					offsetTop: 0,
					closeByEsc: true
				});
			},
			showCompanyContacts({
				target
			}) {
				BX.Salescenter.Manager.openSlider(this.$root.$app.options.urlSettingsCompanyContacts, {
					width: 1200
				});
			},
			showAddPageActionPopup({
				target
			}, isWebform = false) {
				let menuId = 'salescenter-app-add-page-actions';
				if (isWebform) {
					menuId += '-forms';
				}
				BX.PopupMenu.show(menuId, target, this.getAddPageActions(isWebform), {
					offsetLeft: target.offsetWidth + 20,
					offsetTop: -target.offsetHeight - 15,
					closeByEsc: true,
					angle: {
						position: 'left'
					}
				});
			},
			hideActionsPopup() {
				BX.PopupMenu.destroy('salescenter-app-actions');
				BX.PopupMenu.destroy('salescenter-app-add-page-actions');
			},
			addSite(isWebform = false) {
				salescenter_manager.Manager.addSitePage(isWebform).then(result => {
					let newPage = result.answer.result.page || false;
					this.$root.$app.fillPages().then(() => {
						if (newPage) {
							this.onPageClick(newPage);
							this.lastAddedPages.push(parseInt(newPage.id));
						} else {
							this.openFirstPage();
						}
					});
				});
				this.hideActionsPopup();
			},
			copyUrl(event) {
				if (this.currentPage && this.currentPage.url) {
					salescenter_manager.Manager.copyUrl(this.currentPage.url, event);
					this.hideActionsPopup();
				}
			},
			editPage() {
				if (this.currentPage) {
					if (this.currentPage.landingId && this.currentPage.landingId > 0) {
						salescenter_manager.Manager.editLandingPage(this.currentPage.landingId, this.currentPage.siteId);
						this.hideActionsPopup();
					} else {
						this.showAddUrlPopup(this.currentPage);
					}
				}
			},
			hidePage() {
				if (this.currentPage) {
					this.$root.$app.hidePage(this.currentPage).then(() => {
						this.openFirstPage();
					});
					this.hideActionsPopup();
				}
			},
			hideNoPaymentSystemsBanner() {
				this.$root.$app.hideNoPaymentSystemsBanner();
			},
			showAddUrlPopup(newPage) {
				if (!main_core.Type.isPlainObject(newPage)) {
					newPage = {};
				}
				salescenter_manager.Manager.addCustomPage(newPage).then(pageId => {
					if (!this.isShowPreview) {
						this.isShowPreview = false;
					}
					this.$root.$app.fillPages().then(() => {
						if (pageId && (!main_core.Type.isPlainObject(newPage) || !newPage.id)) {
							this.lastAddedPages.push(parseInt(pageId));
						}
						if (!pageId && newPage) {
							pageId = newPage.id;
						}
						if (pageId) {
							this.pages.forEach(page => {
								if (parseInt(page.id) === parseInt(pageId)) {
									this.onPageClick(page);
								}
							});
						} else {
							if (!this.isShowPayment) {
								this.isShowPreview = true;
							}
						}
					});
				});
				this.hideActionsPopup();
			},
			getPaymentItemTitle() {
				if (!this.isOrderPublicUrlAvailable) {
					return null;
				}
				if (this.$root.$app.options.mode === 'payment') {
					return this.localize.SALESCENTER_LEFT_PAYMENT_ADD_2_MSGVER_1;
				}
				return this.localize.SALESCENTER_LEFT_PAYMENT_AND_DELIVERY_MSGVER_1;
			},
			showPaymentForm() {
				this.isShowPayment = true;
				this.isShowPreview = false;
				let title = this.getPaymentItemTitle() || this.localize.SALESCENTER_DEFAULT_TITLE;
				this.setPageTitle(title);
			},
			showOrdersList() {
				this.hideActionsPopup();
				salescenter_manager.Manager.showOrdersList({
					context: this.$root.$app.context,
					ownerId: this.$root.$app.ownerId,
					ownerTypeId: this.$root.$app.ownerTypeId
				}).then(() => {
					this.refreshOrdersCount();
				});
			},
			showPaymentsList() {
				this.hideActionsPopup();
				salescenter_manager.Manager.showPaymentsList({
					context: this.$root.$app.context,
					ownerId: this.$root.$app.ownerId,
					ownerTypeId: this.$root.$app.ownerTypeId
				}).then(() => {
					this.refreshPaymentsCount();
				});
			},
			showOrderAdd() {
				this.hideActionsPopup();
				salescenter_manager.Manager.showOrderAdd({
					ownerId: this.$root.$app.ownerId,
					ownerTypeId: this.$root.$app.ownerTypeId
				}).then(() => {
					this.refreshOrdersCount();
				});
			},
			showCatalog() {
				this.hideActionsPopup();
				salescenter_manager.Manager.openSlider(`/saleshub/catalog/?sessionId=${this.$root.$app.sessionId}`);
			},
			onFormsClick() {
				this.isFormsOpen = !this.isFormsOpen;
				this.hideActionsPopup();
			},
			openControlPanel() {
				salescenter_manager.Manager.openControlPanel();
				this.hideActionsPopup();
			},
			openHelpDesk() {
				this.hideActionsPopup();
				salescenter_manager.Manager.openHowItWorks();
			},
			isPageSelected(page) {
				return this.currentPage && this.isShowPreview && this.currentPage.id === page.id;
			},
			send(event, skipPublicMessage = 'n') {
				if (!this.isAllowedSubmitButton) {
					return;
				}
				if (this.isShowPayment && !this.isShowStartInfo) {
					if (this.$store.getters['orderCreation/isCompilationMode']) {
						this.$root.$app.sendCompilation(event.target);
					} else {
						this.$root.$app.sendPayment(event.target, skipPublicMessage);
					}
				} else if (this.currentPage && this.currentPage.isActive) {
					this.$root.$app.sendPage(this.currentPage.id);
				}
			},
			setPageTitle(title = null) {
				if (!title) {
					return;
				}
				if (this.$root.$nodes.title) {
					this.$root.$nodes.title.innerText = title;
				}
			},
			onFrameError() {
				clearTimeout(this.frameCheckLongTimeout);
				if (this.showedPageIds.includes(this.currentPage.id)) {
					this.loadedPageIds.push(this.currentPage.id);
				}
				this.errorPageIds.push(this.currentPage.id);
			},
			onFrameLoad(pageId) {
				clearTimeout(this.frameCheckLongTimeout);
				if (this.showedPageIds.includes(pageId)) {
					this.loadedPageIds.push(pageId);
					if (this.currentPage && this.currentPage.id === pageId) {
						if (this.frameCheckShortTimeout && !this.currentPage.landingId) {
							this.onFrameError();
						} else if (this.errorPageIds.includes(this.currentPage.id)) {
							this.errorPageIds = this.errorPageIds.filter(pageId => {
								return pageId !== this.currentPage.id;
							});
						}
					}
				}
				if (this.frameCheckShortTimeout && this.currentPage && this.currentPage.id === pageId && !this.currentPage.landingId) {
					this.onFrameError();
				}
			},
			onSuccessfullyConnected() {
				this.$root.$app.fillPages().then(() => {
					this.openFirstPage();
				});
			},
			startFrameCheckTimeout() {
				// this is a workaround for denied through X-Frame-Options sources
				if (this.frameCheckShortTimeout) {
					clearTimeout(this.frameCheckShortTimeout);
					this.frameCheckShortTimeout = false;
				}
				this.frameCheckShortTimeout = setTimeout(() => {
					this.frameCheckShortTimeout = false;
				}, 500);

				// to show error on long loading
				clearTimeout(this.frameCheckLongTimeout);
				this.frameCheckLongTimeout = setTimeout(() => {
					if (this.currentPage && this.showedPageIds.includes(this.currentPage.id) && !this.loadedPageIds.includes(this.currentPage.id)) {
						this.errorPageIds.push(this.currentPage.id);
					}
				}, 5000);
			},
			getFrameSource(page) {
				if (this.showedPageIds.includes(page.id)) {
					if (page.landingId > 0) {
						if (page.isActive) {
							return new main_core.Uri(page.url).setQueryParam('theme', '').toString();
						}
					} else {
						return page.url;
					}
				}
				return null;
			},
			refreshOrdersCount() {
				this.$root.$app.getOrdersCount().then(result => {
					this.ordersCount = result.answer.result || null;
				}).catch(() => {
					this.ordersCount = null;
				});
			},
			refreshPaymentsCount() {
				this.$root.$app.getPaymentsCount().then(result => {
					this.paymentsCount = result.answer.result || null;
				}).catch(() => {
					this.paymentsCount = null;
				});
			},
			renderErrors() {
				if (this.isShowPayment && this.order.errors.length > 0) {
					let errorMessages = this.order.errors.map(item => item.message).join('<br>');
					let params = {
						color: BX.UI.Alert.Color.DANGER,
						textCenter: true,
						text: BX.util.htmlspecialchars(errorMessages)
					};
					if (this.$refs.errorBlock.innerHTML.length === 0) {
						params.animated = true;
					}
					let alert = new BX.UI.Alert(params);
					this.$refs.errorBlock.innerHTML = '';
					this.$refs.errorBlock.appendChild(alert.getContainer());
				} else if (this.$refs.errorBlock) {
					this.$refs.errorBlock.innerHTML = '';
				}
			},
			editMenuItem(event, page) {
				this.editedPageId = page.id;
				setTimeout(() => {
					event.target.parentNode.parentNode.querySelector('input').focus();
				}, 50);
			},
			saveMenuItem(event) {
				const pageId = this.editedPageId;
				const name = event.target.value;
				let oldName;
				this.pages.forEach(page => {
					if (page.id === this.editedPageId) {
						oldName = page.name;
					}
				});
				if (pageId > 0 && oldName && name !== oldName && name.length > 0) {
					salescenter_manager.Manager.addPage({
						id: pageId,
						name: name,
						analyticsLabel: 'salescenterUpdatePageTitle'
					}).then(() => {
						this.$root.$app.fillPages().then(() => {
							if (this.editedPageId === this.currentPageId) {
								this.setPageTitle(name);
							}
							this.editedPageId = null;
						});
					});
				} else {
					this.editedPageId = null;
				}
			},
			createLoader() {
				const loader = new main_loader.Loader({
					size: 200
				});
				loader.show(this.$refs['previewLoader']);
			}
		},
		computed: {
			config: () => config,
			currentPage() {
				if (this.currentPageId > 0) {
					let pages = this.application.pages.filter(page => {
						return page.id === this.currentPageId;
					});
					if (pages.length > 0) {
						return pages[0];
					}
				}
				return null;
			},
			sendButtonLabel() {
				return main_core.Loc.getMessage('SALESCENTER_SEND');
			},
			pagesSubmenuHeight() {
				if (this.isPagesOpen) {
					return this.application.pages.filter(page => {
						return !page.isWebform;
					}).length * 39 + 30 + 'px';
				} else {
					return '0px';
				}
			},
			formsSubmenuHeight() {
				if (this.isFormsOpen) {
					return this.application.pages.filter(page => {
						return page.isWebform;
					}).length * 39 + 30 + 'px';
				} else {
					return '0px';
				}
			},
			isFrameError() {
				if (this.isShowPreview && this.currentPage) {
					if (!this.currentPage.isActive) {
						return true;
					} else if (!this.currentPage.landingId && this.errorPageIds.includes(this.currentPage.id)) {
						return true;
					}
				}
				return false;
			},
			isShowLoader() {
				return this.isShowPreview && this.currentPageId > 0 && this.showedPageIds.includes(this.currentPageId) && !this.loadedPageIds.includes(this.currentPageId);
			},
			isShowStartInfo() {
				let res = false;
				if (this.isShowPreview) {
					res = !this.pages || this.pages.length <= 0;
				} else if (this.isShowPayment) {
					res = !this.isOrderPublicUrlAvailable;
				}
				return res;
			},
			lastModified() {
				if (this.currentPage && this.currentPage.modifiedAgo) {
					return this.localize.SALESCENTER_MODIFIED.replace('#AGO#', this.currentPage.modifiedAgo);
				}
				return false;
			},
			localize() {
				return ui_vue.Vue.getFilteredPhrases('SALESCENTER_');
			},
			pages() {
				return [...this.application.pages];
			},
			isAllowedSubmitButton() {
				if (this.$root.$app.disableSendButton) {
					return false;
				}
				if (this.isShowPreview && this.currentPage && !this.currentPage.isActive) {
					return false;
				}
				if (this.isShowPayment) {
					return this.$store.getters['orderCreation/isAllowedSubmit'];
				}
				return this.currentPage;
			},
			isNoPaymentSystemsBannerVisible() {
				return this.$root.$app.options.showPaySystemSettingBanner;
			},
			mode() {
				return this.$root.$app.options.mode;
			},
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application,
				order: state => state.orderCreation
			})
		},
		template: `
		<div
			:class="wrapperClass"
			:style="wrapperStyle"
			class="salescenter-app-wrapper salescenter-app-chat-wrapper"
		>
			<div class="ui-sidepanel-sidebar salescenter-app-sidebar" ref="sidebar">
				<ul class="ui-sidepanel-menu" ref="sidepanelMenu">
					<li v-if="this.$root.$app.isPaymentCreationAvailable" :class="{ 'salescenter-app-sidebar-menu-active': this.isShowPayment}" class="ui-sidepanel-menu-item" @click="showPaymentForm">
						<a class="ui-sidepanel-menu-link">
							<div class="ui-sidepanel-menu-link-text">{{getPaymentItemTitle()}}</div>
						</a>
					</li>
					<li :class="{'salescenter-app-sidebar-menu-active': isPagesOpen}" class="ui-sidepanel-menu-item">
						<a class="ui-sidepanel-menu-link" @click.stop.prevent="isPagesOpen = !isPagesOpen;">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_PAGES}}</div>
							<div class="ui-sidepanel-toggle-btn">{{this.isPagesOpen ? this.localize.SALESCENTER_SUBMENU_CLOSE : this.localize.SALESCENTER_SUBMENU_OPEN}}</div>
						</a>
						<ul class="ui-sidepanel-submenu" :style="{height: pagesSubmenuHeight}">
							<li v-for="page in pages" v-if="!page.isWebform" :key="page.id"
							:class="{
								'ui-sidepanel-submenu-active': (currentPage && currentPage.id == page.id && isShowPreview),
								'ui-sidepanel-submenu-edit-mode': (editedPageId === page.id)
							}" class="ui-sidepanel-submenu-item">
								<a :title="page.name" class="ui-sidepanel-submenu-link" @click.stop="onPageClick(page)">
									<input class="ui-sidepanel-input" :value="page.name" v-on:keyup.enter="saveMenuItem($event)" @blur="saveMenuItem($event)" />
									<div class="ui-sidepanel-menu-link-text">{{page.name}}</div>
									<div v-if="lastAddedPages.includes(page.id)" class="ui-sidepanel-badge-new"></div>
									<div class="ui-sidepanel-edit-btn"><span class="ui-sidepanel-edit-btn-icon" @click="editMenuItem($event, page);"></span></div>
								</a>
							</li>
							<li class="salescenter-app-helper-nav-item salescenter-app-menu-add-page" @click.stop="showAddPageActionPopup($event)">
								<span class="salescenter-app-helper-nav-item-text salescenter-app-helper-nav-item-add">+</span><span class="salescenter-app-helper-nav-item-text">{{localize.SALESCENTER_RIGHT_ACTION_ADD}}</span>
							</li>
						</ul>
					</li>
					<li v-if="this.$root.$app.isWithOrdersMode" @click="showOrdersList">
						<a class="ui-sidepanel-menu-link">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_ORDERS}}</div>
							<span class="ui-sidepanel-counter" ref="ordersCounter" v-show="ordersCount > 0">{{ordersCount}}</span>
						</a>
					</li>
					<li v-if="this.$root.$app.isWithOrdersMode" @click="showOrderAdd">
						<a class="ui-sidepanel-menu-link">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_ORDER_ADD}}</div>
						</a>
					</li>
					<li v-if="!this.$root.$app.isWithOrdersMode" @click="showPaymentsList">
						<a class="ui-sidepanel-menu-link">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_PAYMENTS}}</div>
							<span class="ui-sidepanel-counter" ref="paymentsCounter" v-show="paymentsCount > 0">{{paymentsCount}}</span>
						</a>
					</li>
					<li v-if="this.$root.$app.isCatalogAvailable" @click="showCatalog">
						<a class="ui-sidepanel-menu-link">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_CATALOG}}</div>
						</a>
					</li>
					<li :class="{'salescenter-app-sidebar-menu-active': isFormsOpen}" class="ui-sidepanel-menu-item">
						<a class="ui-sidepanel-menu-link" @click.stop.prevent="onFormsClick();">
							<div class="ui-sidepanel-menu-link-text">{{localize.SALESCENTER_LEFT_FORMS_ALL}}</div>
							<div class="ui-sidepanel-toggle-btn">{{this.isFormsOpen ? this.localize.SALESCENTER_SUBMENU_CLOSE : this.localize.SALESCENTER_SUBMENU_OPEN}}</div>
						</a>
						<ul class="ui-sidepanel-submenu" :style="{height: formsSubmenuHeight}">
							<li v-for="page in pages" v-if="page.isWebform" :key="page.id"
							 :class="{
								'ui-sidepanel-submenu-active': (currentPage && currentPage.id == page.id && isShowPreview),
								'ui-sidepanel-submenu-edit-mode': (editedPageId === page.id)
							}" class="ui-sidepanel-submenu-item">
								<a :title="page.name" class="ui-sidepanel-submenu-link" @click.stop="onPageClick(page)">
									<input class="ui-sidepanel-input" :value="page.name" v-on:keyup.enter="saveMenuItem($event)" @blur="saveMenuItem($event)" />
									<div v-if="lastAddedPages.includes(page.id)" class="ui-sidepanel-badge-new"></div>
									<div class="ui-sidepanel-menu-link-text">{{page.name}}</div>
									<div class="ui-sidepanel-edit-btn"><span class="ui-sidepanel-edit-btn-icon" @click="editMenuItem($event, page);"></span></div>
								</a>
							</li>
							<li class="salescenter-app-helper-nav-item salescenter-app-menu-add-page" @click.stop="showAddPageActionPopup($event, true)">
								<span class="salescenter-app-helper-nav-item-text salescenter-app-helper-nav-item-add">+</span><span class="salescenter-app-helper-nav-item-text">{{localize.SALESCENTER_RIGHT_ACTION_ADD}}</span>
							</li>
						</ul>
					</li>
				</ul>
			</div>
			<div class="salescenter-app-right-side">
				<div class="salescenter-app-page-header" v-show="isShowPreview && !isShowStartInfo">
					<div class="salescenter-btn-action ui-btn ui-btn-link ui-btn-dropdown ui-btn-xs" @click="showActionsPopup($event)">{{localize.SALESCENTER_RIGHT_ACTIONS_BUTTON}}</div>
					<div class="salescenter-btn-delimiter salescenter-btn-action"></div>
					<div class="salescenter-btn-action ui-btn ui-btn-link ui-btn-xs ui-btn-icon-edit" @click="editPage">{{localize.SALESCENTER_RIGHT_ACTION_EDIT}}</div>
				</div>
				<start
					v-if="isShowStartInfo && mode !== ModeDictionary.terminalPayment"
					@on-successfully-connected="onSuccessfullyConnected"
				>
				</start>
				<template v-else-if="isFrameError && isShowPreview">
					<div class="salescenter-app-page-content salescenter-app-lost">
						<div class="salescenter-app-lost-block ui-title-1 ui-text-center ui-color-medium">{{localize.SALESCENTER_ERROR_TITLE}}</div>
						<div v-if="currentPage.isFrameDenied === true" class="salescenter-app-lost-helper ui-color-medium">{{localize.SALESCENTER_RIGHT_FRAME_DENIED}}</div>
						<div v-else-if="currentPage.isActive !== true" class="salescenter-app-lost-helper salescenter-app-not-active ui-color-medium">{{localize.SALESCENTER_RIGHT_NOT_ACTIVE}}</div>
						<div v-else class="salescenter-app-lost-helper ui-color-medium">{{localize.SALESCENTER_ERROR_TEXT}}</div>
					</div>
				</template>
				<div v-show="isShowPreview && !isShowStartInfo && !isFrameError" class="salescenter-app-page-content">
					<template v-for="page in pages">
						<iframe class="salescenter-app-demo" v-show="currentPage && currentPage.id == page.id" :src="getFrameSource(page)" frameborder="0" @error="onFrameError(page.id)" @load="onFrameLoad(page.id)" :key="page.id"></iframe>
					</template>
					<div class="salescenter-app-demo-overlay" :class="{
						'salescenter-app-demo-overlay-loading': this.isShowLoader
					}">
						<div v-show="isShowLoader" ref="previewLoader"></div>
						<div v-if="lastModified" class="salescenter-app-demo-overlay-modification">{{lastModified}}</div>
					</div>
				</div>
					<template v-if="this.$root.$app.isPaymentsLimitReached">
							<div ref="paymentsLimit" v-show="isShowPayment && !isShowStartInfo"></div>
				</template>
				<template v-else>
					<chat-receiving-payment
						v-if="isShowPayment && !isShowStartInfo"
						:key="order.basketVersion"
						@stage-block-send-on-send="send($event)"
					/>
						</template>
			</div>
			<div class="ui-button-panel-wrapper salescenter-button-panel" ref="buttonsPanel">
				<div class="ui-button-panel">
					<button :class="{'ui-btn-disabled': !this.isAllowedSubmitButton}" class="ui-btn ui-btn-md ui-btn-success" @click="send($event)">{{sendButtonLabel}}</button>
					<button class="ui-btn ui-btn-md ui-btn-link" @click="close">{{localize.SALESCENTER_CANCEL}}</button>
					<button v-if="isShowPayment && !isShowStartInfo && !this.$root.$app.isPaymentsLimitReached && this.$root.$app.isWithOrdersMode" class="ui-btn ui-btn-md ui-btn-link btn-send-crm" @click="send($event, 'y')">{{localize.SALESCENTER_SAVE_ORDER}}</button>
				</div>
				<div v-if="this.order.errors.length > 0" ref="errorBlock"></div>
			</div>
		</div>
	`
	};

	const TYPE_PHONE = 'phone';
	const TYPE_SENDER = 'sender';
	const SmsMessage = {
		props: {
			initSenders: {
				type: Array,
				required: true
			},
			initCurrentSenderCode: {
				type: String,
				required: false
			},
			messageSenderData: {
				type: Object,
				required: false
			},
			initPushedToUseBitrix24Notifications: {
				type: String,
				required: false
			},
			counter: {
				type: Number,
				required: true
			},
			manager: {
				type: Object,
				required: true
			},
			selectedSmsSender: {
				type: String,
				required: false
			},
			phone: {
				type: String,
				required: true
			},
			contactEditorUrl: {
				type: String,
				required: true
			},
			ownerTypeId: {
				type: Number,
				required: true
			},
			ownerId: {
				type: Number,
				required: true
			},
			titleTemplate: {
				type: String,
				required: true
			},
			showHint: {
				type: Boolean,
				required: true
			},
			editorTemplate: {
				type: String,
				required: true
			},
			editorUrl: {
				type: String,
				required: true
			},
			selectedMode: {
				type: String,
				required: true
			}
		},
		mixins: [StageMixin, MessageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block,
			'sms-error-block': salescenter_component_stageBlock_smsMessage.Error,
			'sms-sender-list-block': salescenter_component_stageBlock_smsMessage.SenderList,
			'sms-user-avatar-block': salescenter_component_stageBlock_smsMessage.UserAvatar,
			'sms-message-edit-block': salescenter_component_stageBlock_smsMessage.MessageEdit,
			'sms-message-view-block': salescenter_component_stageBlock_smsMessage.MessageView,
			'sms-message-editor-block': salescenter_component_stageBlock_smsMessage.MessageEditor,
			'sms-message-control-block': salescenter_component_stageBlock_smsMessage.MessageControl
		},
		data() {
			return {
				contactPhone: this.phone,
				currentSenderCode: null,
				senders: [],
				pushedToUseBitrix24Notifications: null,
				smsSenderListComponentKey: 0,
				messageSenderEditor: null,
				showMessageSenderEditor: true,
				clientError: false
			};
		},
		computed: {
			messageSenderError() {
				return {
					text: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_ALERT_PHONE_EMPTY')
				};
			},
			status() {
				return this.$store.getters['orderCreation/isSenderSelected'] ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.current;
			},
			configForBlock() {
				return {
					counter: this.counter,
					checked: this.counterCheckedMixin,
					showHint: true,
					hintClassModifier: 'salescenter-app-payment-by-sms-item-title-info--link-gray'
				};
			},
			editor() {
				return {
					template: this.editorTemplate,
					url: this.editorUrl
				};
			},
			currentSender() {
				return this.senders.find(sender => sender.code === this.currentSenderCode);
			},
			title() {
				return this.titleTemplate.replace('#PHONE#', this.contactPhone);
			},
			errors() {
				if (this.messageSenderAvailable) {
					return [];
				}
				let result = [];
				let bitrix24ConnectUrlError;
				if (!this.currentSender) {
					for (let sender of this.senders) {
						if (!salescenter_lib.SenderConfig.needConfigure(sender)) {
							continue;
						}
						result.push({
							text: this.getConnectionErrorText(sender),
							fixer: salescenter_lib.SenderConfig.openSliderFreeMessages(sender.connectUrl),
							fixText: this.getConnectionErrorFixText(sender),
							type: TYPE_SENDER
						});
						if (sender.code === salescenter_lib.SenderConfig.BITRIX24) {
							bitrix24ConnectUrlError = sender.connectUrl;
						}
					}
				} else {
					if (!this.currentSender.isAvailable) {
						result.push({
							text: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_' + this.currentSender.code.toUpperCase() + '_NOT_AVAILABLE'),
							type: TYPE_SENDER
						});
					} else {
						if (this.currentSender.isConnected) {
							result = this.currentSender.usageErrors.map(error => ({
								text: error,
								type: TYPE_SENDER
							}));
						} else {
							result.push({
								text: this.getConnectionErrorText(this.currentSender),
								fixer: this.getFixer(this.currentSender.connectUrl),
								fixText: this.getConnectionErrorFixText(this.currentSender),
								type: TYPE_SENDER
							});
							if (this.currentSender.code === salescenter_lib.SenderConfig.BITRIX24) {
								bitrix24ConnectUrlError = this.currentSender.connectUrl;
							}
						}
					}
				}
				if (!this.contactPhone) {
					if (this.contactEditorUrl.length > 0) {
						result.push({
							text: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_ALERT_PHONE_EMPTY'),
							fixer: this.getFixer(this.contactEditorUrl),
							fixText: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_ALERT_PHONE_EMPTY_SETTINGS'),
							type: TYPE_PHONE
						});
					} else {
						result.push({
							text: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_ALERT_PHONE_EMPTY'),
							type: TYPE_PHONE
						});
					}
				}
				if (this.pushedToUseBitrix24Notifications === 'N' && bitrix24ConnectUrlError) {
					this.getFixer(bitrix24ConnectUrlError)().then(() => this.handleErrorFix());
					BX.userOptions.save('salescenter', 'payment_sender_options', 'pushed_to_use_bitrix24_notifications', 'Y');
					this.pushedToUseBitrix24Notifications = 'Y';
				}
				return result;
			}
		},
		watch: {
			messageData(newMessageData) {
				if (!this.messageSenderEditor) {
					return;
				}
				this.showMessageSenderEditor = Boolean(newMessageData.fromId && newMessageData.senderId && newMessageData.senderCode);
				this.clientError = Boolean(!newMessageData.entityId || !newMessageData.entityTypeId || !newMessageData.phoneId);
				this.$store.commit('orderCreation/setIsSenderSelected', this.showMessageSenderEditor && !this.clientError);
			}
		},
		created() {
			this.initialize(this.initCurrentSenderCode, this.initSenders, this.initPushedToUseBitrix24Notifications);
		},
		mounted() {
			if (this.messageSenderAvailable) {
				this.$store.commit('orderCreation/setIsSenderSelected', false);
				this.initMessageSenderEditor();
			}
		},
		methods: {
			initMessageSenderEditor() {
				const editorConfig = {
					...this.messageSenderData,
					message: {
						...this.messageSenderData.message,
						text: this.convertLegacyTemplateToBBCode(this.messageSenderData.message?.text ?? '')
					}
				};
				this.messageSenderEditor = new crm_messagesender_editor.Editor(editorConfig);
				this.messageSenderEditor.render().then(() => this.initMessageData()).catch(() => {});
				this.messageSenderEditor.subscribe('onToChange', this.onToChangeHandler.bind(this));
				this.messageSenderEditor.subscribe('onMessageBodyChange', this.onMessageBodyChangeHandler.bind(this));
				this.messageSenderEditor.subscribe('onFromChange', this.onFromChangeHandler.bind(this));
				this.messageSenderEditor.subscribe('onChannelChange', this.onChannelChangeHandler.bind(this));
			},
			openMessageSenderConnectionsSlider() {
				crm_router.Router.Instance.openMessageSenderConnectionsSlider({
					c_section: crm_integration_analytics.Dictionary.SECTION_SALESCENTER_SLIDER
				}).then(() => {
					if (this.messageSenderEditor) {
						this.messageSenderEditor.reload().then(() => {
							this.initMessageData();
						});
					}
				});
			},
			onFromChangeHandler(event) {
				this.$store.dispatch('orderCreation/setMessageData', {
					fromId: event.getData().from?.id,
					fromType: event.getData().from?.type
				});
			},
			onChannelChangeHandler(event) {
				const channel = event.getData().channel;
				const backend = channel?.backend;
				this.$store.dispatch('orderCreation/setMessageData', {
					senderId: backend?.id,
					senderCode: backend?.senderCode,
					channelId: channel?.id
				});
			},
			onToChangeHandler(event) {
				const to = event.getData().to;
				this.$store.dispatch('orderCreation/setMessageData', {
					entityId: to?.customData?.addressSource?.entityId,
					entityTypeId: to?.customData?.addressSource?.entityTypeId,
					phoneId: to?.id
				});
			},
			initMessageData() {
				const state = this.messageSenderEditor.getState();
				const messageData = {
					body: state.message?.body,
					fromId: state.from?.id,
					fromType: state.from?.type,
					senderId: state.channel?.backend?.id,
					senderCode: state.channel?.backend?.senderCode,
					channelId: state.channel?.id,
					entityId: state.to?.customData?.addressSource?.entityId,
					entityTypeId: state.to?.customData?.addressSource?.entityTypeId,
					phoneId: state.to?.id
				};
				this.$store.dispatch('orderCreation/setMessageData', messageData);
			},
			onConfigureContactPhone() {
				this.$emit('stage-block-sms-message-on-change-contact-phone');
			},
			getConnectionErrorText(sender) {
				const messageCode = 'SALESCENTER_SEND_ORDER_BY_SMS_' + sender.code.toUpperCase() + '_NOT_CONNECTED_WARNING';
				const fallback = 'SALESCENTER_SEND_ORDER_BY_SMS_' + sender.code.toUpperCase() + '_NOT_CONNECTED';
				return main_core.Loc.getMessage(messageCode) || main_core.Loc.getMessage(fallback);
			},
			getConnectionErrorFixText(sender) {
				const messageCode = 'SALESCENTER_SEND_ORDER_BY_SMS_' + sender.code.toUpperCase() + '_NOT_CONNECTED_FIX';
				const fallback = 'SALESCENTER_PRODUCT_DISCOUNT_EDIT_PAGE_URL_TITLE';
				return main_core.Loc.getMessage(messageCode) || main_core.Loc.getMessage(fallback);
			},
			getFixer(fixUrl) {
				return () => {
					if (typeof fixUrl === 'string') {
						return salescenter_manager.Manager.openSlider(fixUrl, {
							events: {
								onLoad: function (event) {
									const slider = event.getSlider();
									const sliderBx = slider.getFrameWindow().BX;
									sliderBx.addCustomEvent("BX.Crm.EntityEditor:onNothingChanged", () => slider.close());
									sliderBx.addCustomEvent("BX.Crm.EntityEditor:onCancel", () => slider.close());
									sliderBx.addCustomEvent("onCrmEntityUpdate", () => slider.close());
								}
							}
						});
					}
					if (typeof fixUrl === 'object' && fixUrl !== null) {
						if (fixUrl.type === 'ui_helper') {
							return BX.loadExt('ui.info-helper').then(() => {
								BX.UI.InfoHelper.show(fixUrl.value);
							});
						}
					}
					return Promise.resolve();
				};
			},
			onItemHint(e) {
				BX.Salescenter.Manager.openSlider(this.$root.$app.options.urlSettingsCompanyContacts, {
					width: 1200
				});
			},
			initialize(currentSenderCode, senders, pushedToUseBitrix24Notifications) {
				this.currentSenderCode = currentSenderCode;
				this.senders = senders;
				this.pushedToUseBitrix24Notifications = pushedToUseBitrix24Notifications;
				this.$root.$app.options.currentSenderCode = this.currentSenderCode;
				this.$root.$app.options.senders = this.senders;
				this.$root.$app.options.pushedToUseBitrix24Notifications = this.pushedToUseBitrix24Notifications;
				this.$store.commit('orderCreation/setIsSenderSelected', this.currentSenderCode !== '');
			},
			handleOnSmsSenderSelected(value) {
				this.$emit('stage-block-sms-send-on-change-provider', value);
			},
			handleErrorFix() {
				main_core.ajax.runComponentAction("bitrix:salescenter.app", "refreshSenderSettings", {
					mode: "class"
				}).then(resolve => {
					if (BX.type.isObject(resolve.data) && Object.values(resolve.data).length > 0) {
						this.initialize(resolve.data.currentSenderCode, resolve.data.senders, resolve.data.pushedToUseBitrix24Notifications);
						this.smsSenderListComponentKey += 1;
					}
				});
			},
			handlePhoneErrorFix() {
				main_core.ajax.runComponentAction("bitrix:salescenter.app", "refreshContactPhone", {
					mode: "class",
					data: {
						fields: {
							ownerId: this.ownerId,
							ownerTypeId: this.ownerTypeId
						}
					}
				}).then(resolve => {
					if (BX.type.isObject(resolve.data) && Object.values(resolve.data).length > 0) {
						if (this.contactPhone != resolve.data.contactPhone) {
							ui_notification.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER_PHONE_CHANGE', {
									'#TITLE#': resolve.data.title
								})
							});
						}
						this.contactPhone = resolve.data.contactPhone;
						this.onConfigureContactPhone();
					}
				});
			},
			hendleSmsErrorBlock(event) {
				if (event.data.type === TYPE_PHONE) {
					this.handlePhoneErrorFix();
				} else {
					this.handleErrorFix();
				}
			},
			openBitrix24NotificationsHelp(event) {
				BX.Salescenter.Manager.openBitrix24NotificationsHelp(event);
			},
			openBitrix24NotificationsWorks(event) {
				BX.Salescenter.Manager.openBitrix24NotificationsWorks(event);
			}
		},
		//language=Vue
		template: `
		<stage-block-item			
			:config="configForBlock"
			:class="statusClassMixin"
			v-on:on-item-hint="onItemHint"
		>
			<template v-slot:block-title-title>{{title}}</template>
			<template
				v-if="showHint"
				v-slot:block-hint-title
			>
				${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_COMPANY_CONTACTS_V3')}
			</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin" class="salescenter-app-payment-by-sms-item-container-offtop">
					<sms-error-block
						v-if="!messageSenderAvailable"
						v-for="(error, index) in errors"
						v-bind:key="index"
						v-on:on-configure="hendleSmsErrorBlock($event)"
						:error="error"
					>
					</sms-error-block>
					<div v-if="messageSenderAvailable">
						<sms-error-block
							v-if="showMessageSenderEditor && clientError"
							:error="messageSenderError"
						>
						</sms-error-block>
						<div v-show="showMessageSenderEditor" :id="messageSenderId"></div>
						<div
							v-show="!showMessageSenderEditor"
							@click="openMessageSenderConnectionsSlider"
							class="salescenter-app-payment-by-sms-message-sender-empty-state"
						>
							<div class="salescenter-app-payment-by-sms-message-sender-empty-state-image"></div>
							<div class="salescenter-app-payment-by-sms-message-sender-empty-state-right-block">
								<div class="salescenter-app-payment-by-sms-message-sender-empty-state-text">
									${main_core.Loc.getMessage('SALESCENTER_MESSAGE_SENDER_EMPTY_STATE')}
								</div>
								<div class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps">
									${main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_BITRIX24_NOT_CONNECTED_FIX')}
								</div>
							</div>
						</div>
					</div>
					<div v-else class="salescenter-app-payment-by-sms-item-container-sms">
						<sms-user-avatar-block :manager="manager"/>
						<div class="salescenter-app-payment-by-sms-item-container-sms-content">
							<div v-if="currentSenderCode === 'bitrix24'" class="salescenter-app-payment-by-sms-item-container-sms-content">
								<div class="salescenter-app-payment-by-sms-item-container-sms-content-message">
									<div contenteditable="false" class="salescenter-app-payment-by-sms-item-container-sms-content-message-text">
										${main_core.Loc.getMessage('SALESCENTER_TEMPLATE_BASED_MESSAGE_WILL_BE_SENT')}
										<a @click.stop.prevent="openBitrix24NotificationsHelp(event)" href="#">
											${main_core.Loc.getMessage('SALESCENTER_MORE_DETAILS')}
										</a>
									</div>
								</div>
							</div>
							<sms-message-editor-block v-else :editor="editor" :selectedMode="selectedMode"/>
							<template v-if="currentSenderCode === 'bitrix24'">
								<div class="salescenter-app-payment-by-sms-item-container-sms-content-info">
									${main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_VIA_BITRIX24')}
									<span @click="openBitrix24NotificationsWorks(event)">
										${main_core.Loc.getMessage('SALESCENTER_PRODUCT_SET_BLOCK_TITLE_SHORT')}
									</span>
								</div>
							</template>
							<template v-else-if="currentSenderCode === 'sms_provider'">
								<sms-sender-list-block
									:key="smsSenderListComponentKey"
									:list="currentSender.smsSenders"
									:initSelected="selectedSmsSender"
									:settingUrl="currentSender.connectUrl"
									v-on:on-configure="handleErrorFix"
									v-on:on-selected="handleOnSmsSenderSelected"
								>
									<template v-slot:sms-sender-list-text-send-from>
										${main_core.Loc.getMessage('SALESCENTER_SEND_ORDER_BY_SMS_SENDER')}
									</template>
								</sms-sender-list-block>
							</template>
						</div>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var StageBlocksList = {
		components: {
			'send-block': Send$2,
			'cashbox-block': Cashbox,
			'product-block': Product,
			'delivery-block': DeliveryVuex,
			'paysystem-block': PaySystem,
			'automation-block': Automation,
			'sms-message-block': SmsMessage,
			'timeline-block': TimeLine
		},
		props: {
			sendAllowed: {
				type: Boolean,
				required: true
			}
		},
		data() {
			const stages = {
				message: {
					initSenders: this.$root.$app.options.senders,
					initCurrentSenderCode: this.$root.$app.options.currentSenderCode,
					messageSenderData: this.$root.$app.options.messageSenderData,
					initPushedToUseBitrix24Notifications: this.$root.$app.options.pushedToUseBitrix24Notifications,
					selectedSmsSender: this.$root.$app.sendingMethodDesc.provider,
					manager: this.$root.$app.options.entityResponsible,
					phone: this.$root.$app.options.contactPhone,
					ownerId: this.$root.$app.options.ownerId,
					ownerTypeId: this.$root.$app.options.ownerTypeId,
					contactEditorUrl: this.$root.$app.options.contactEditorUrl,
					titleTemplate: this.getTitleTemplate(),
					showHint: this.$root.$app.options.templateMode !== 'view',
					editorTemplate: this.$root.$app.sendingMethodDesc.text,
					editorUrl: this.$root.$app.orderPublicUrl,
					selectedMode: 'payment'
				},
				product: {
					title: main_core.Loc.getMessage('SALESCENTER_PRODUCT_BLOCK_TITLE_MSGVER_1'),
					hintTitle: this.$root.$app.options.templateMode === 'view' ? '' : main_core.Loc.getMessage('SALESCENTER_PRODUCT_SET_BLOCK_TITLE_SHORT')
				},
				paysystem: {
					status: this.$root.$app.options.paySystemList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.paySystemList.items),
					installed: this.$root.$app.options.paySystemList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.paySystemList.items),
					initialCollapseState: this.$root.$app.options.isPaySystemCollapsed ? this.$root.$app.options.isPaySystemCollapsed === 'Y' : this.$root.$app.options.paySystemList.isSet
				},
				cashbox: {},
				delivery: {
					status: this.$root.$app.options.deliveryList.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.deliveryList.items),
					installed: this.$root.$app.options.deliveryList.isInstalled,
					initialCollapseState: this.$root.$app.options.isDeliveryCollapsed ? this.$root.$app.options.isDeliveryCollapsed === 'Y' : this.$root.$app.options.deliveryList.isInstalled
				},
				automation: {}
			};
			if (this.$root.$app.options.cashboxList.hasOwnProperty('items')) {
				stages.cashbox = {
					status: this.$root.$app.options.cashboxList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.cashboxList.items),
					installed: this.$root.$app.options.cashboxList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.cashboxList.items),
					initialCollapseState: this.$root.$app.options.isCashboxCollapsed ? this.$root.$app.options.isCashboxCollapsed === 'Y' : this.$root.$app.options.cashboxList.isSet
				};
			}
			if (this.$root.$app.options.isAutomationAvailable) {
				stages.automation = {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					stageOnOrderPaid: this.$root.$app.options.stageOnOrderPaid,
					stageOnDeliveryFinished: this.$root.$app.options.stageOnDeliveryFinished,
					items: this.$root.$app.options.entityStageList,
					initialCollapseState: this.$root.$app.options.isAutomationCollapsed ? this.$root.$app.options.isAutomationCollapsed === 'Y' : false
				};
			}
			if (this.$root.$app.options.hasOwnProperty('timeline')) {
				stages.timeline = {
					items: this.getTimelineCollection(this.$root.$app.options.timeline)
				};
			}
			if (this.$root.$app.options.paySystemList.groups) {
				stages.paysystem.groups = this.getTileGroupsCollection(this.$root.$app.options.paySystemList.groups, stages.paysystem.tiles);
			}
			return {
				stages
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		computed: {
			hasStageTimeLine() {
				return this.stages.timeline.hasOwnProperty('items') && this.stages.timeline.items.length > 0;
			},
			hasStageAutomation() {
				return this.stages.automation.hasOwnProperty('items');
			},
			hasStageCashBox() {
				return this.stages.cashbox.hasOwnProperty('tiles');
			},
			submitButtonLabel() {
				return this.editable ? main_core.Loc.getMessage('SALESCENTER_SEND') : main_core.Loc.getMessage('SALESCENTER_RESEND');
			},
			isHideDeliveryStage() {
				return this.isViewWithoutDelivery();
			}
		},
		methods: {
			getTitleTemplate() {
				if (this.$root.$app.options.messageSenderData) {
					return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_SENDER_MSGVER_1');
				}
				if (this.$root.$app.sendingMethodDesc.sent) {
					return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_2_PAST_TIME');
				}
				return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_2');
			},
			initCounter() {
				this.counter = 1;
			},
			getTimelineCollection(items) {
				const list = [];
				Object.values(items).forEach(options => list.push(TimeLineItem__namespace.Factory.create(options)));
				return list;
			},
			getTileCollection(items) {
				const tiles = [];
				Object.values(items).forEach(options => tiles.push(Tile__namespace.Factory.create(options)));
				return tiles;
			},
			getTileGroupsCollection(groups, tiles) {
				const ret = [];
				if (Array.isArray(groups)) {
					Object.values(groups).forEach(item => {
						const group = new Tile__namespace.Group(item);
						group.fillTiles(tiles);
						ret.push(group);
					});
				}
				return ret;
			},
			getTitleItems(items) {
				const result = [];
				items.forEach(item => {
					if (![Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(item.type)) {
						result.push(item);
					}
				});
				return result;
			},
			stageRefresh(e, type) {
				main_core.ajax.runComponentAction('bitrix:salescenter.app', 'getAjaxData', {
					mode: 'class',
					data: {
						type
					}
				}).then(response => {
					if (response.data) {
						this.refreshTilesByType(response.data, type);
					}
				}, () => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SALESCENTER_DATA_UPDATE_ERROR')
					});
				});
			},
			refreshTilesByType(data, type) {
				if (type === 'PAY_SYSTEM') {
					this.stages.paysystem.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.paysystem.tiles = this.getTileCollection(data.items);
					this.stages.paysystem.groups = this.getTileGroupsCollection(data.groups, this.stages.paysystem.tiles);
					this.stages.paysystem.installed = data.isSet;
					this.stages.paysystem.titleItems = this.getTitleItems(data.items);
				} else if (type === 'CASHBOX') {
					this.stages.cashbox.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.cashbox.tiles = this.getTileCollection(data.items);
					this.stages.cashbox.installed = data.isSet;
					this.stages.cashbox.titleItems = this.getTitleItems(data.items);
				} else if (type === 'DELIVERY') {
					this.stages.delivery.status = data.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.delivery.tiles = this.getTileCollection(data.items);
					this.stages.delivery.installed = data.isInstalled;
				}
			},
			onSend(event) {
				this.$emit('stage-block-send-on-send', event);
			},
			changeProvider(value) {
				this.$root.$app.sendingMethodDesc.provider = value;
				BX.userOptions.save('salescenter', 'payment_sms_provider_options', 'latest_selected_provider', value);
			},
			changeContactPhone(event) {
				this.$emit('stage-block-on-reload', event);
			},
			saveCollapsedOption(type, value) {
				BX.userOptions.save('salescenter', 'add_payment_collapse_options', type, value);
			},
			onProductFormModeChange() {
				const isCompilationMode = this.$store.getters['orderCreation/isCompilationMode'];
				if (isCompilationMode) {
					this.stages.delivery.status = salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.message.selectedMode = 'compilation';
					this.$root.$app.sendingMethodDesc.text = this.$root.$app.sendingMethodDesc.text_modes.compilation;
					this.stages.message.editorTemplate = this.$root.$app.sendingMethodDesc.text_modes.compilation;
				} else {
					this.stages.delivery.status = this.$root.$app.options.deliveryList.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.message.selectedMode = 'payment';
					this.$root.$app.sendingMethodDesc.text = this.$root.$app.sendingMethodDesc.text_modes.payment;
					this.stages.message.editorTemplate = this.$root.$app.sendingMethodDesc.text_modes.payment;
				}
			},
			isViewWithoutDelivery() {
				return this.$root.$app.options.templateMode === 'view' && parseInt(this.$root.$app.options.shipmentId) <= 0;
			}
		},
		created() {
			this.initCounter();
		},
		beforeUpdate() {
			this.initCounter();
		},
		// language=Vue
		template: `
		<div>
			<product-block
				:counter="counter++"
				:title="stages.product.title"
				:hintTitle="stages.product.hintTitle"
				@on-product-form-mode-change="onProductFormModeChange"
			/>
			<sms-message-block
				@stage-block-sms-send-on-change-provider="changeProvider"
				@stage-block-sms-message-on-change-contact-phone="changeContactPhone"
				:counter="counter++"
				:initSenders="stages.message.initSenders"
				:initCurrentSenderCode="stages.message.initCurrentSenderCode"
				:messageSenderData="stages.message.messageSenderData"
				:initPushedToUseBitrix24Notifications="stages.message.initPushedToUseBitrix24Notifications"
				:selectedSmsSender="stages.message.selectedSmsSender"
				:manager="stages.message.manager"
				:phone="stages.message.phone"
				:contactEditorUrl="stages.message.contactEditorUrl"
				:ownerId="stages.message.ownerId"
				:ownerTypeId="stages.message.ownerTypeId"
				:titleTemplate="stages.message.titleTemplate"
				:showHint="stages.message.showHint"
				:editorTemplate="stages.message.editorTemplate"
				:editorUrl="stages.message.editorUrl"
				:selectedMode="stages.message.selectedMode"
			/>
			<paysystem-block
				v-if="editable"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'PAY_SYSTEM')"
				:counter="counter++"
				:status="stages.paysystem.status"
				:tiles="stages.paysystem.tiles"
				:installed="stages.paysystem.installed"
				:titleItems="stages.paysystem.titleItems"
				:initialCollapseState="stages.paysystem.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<cashbox-block
				v-if="editable && hasStageCashBox"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'CASHBOX')"
				:counter="counter++"
				:status="stages.cashbox.status"
				:tiles="stages.cashbox.tiles"
				:installed="stages.cashbox.installed"
				:titleItems="stages.cashbox.titleItems"
				:initialCollapseState="stages.cashbox.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<delivery-block
				v-if="!isHideDeliveryStage"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'DELIVERY')"
				:counter="counter++"
				:status="stages.delivery.status"
				:tiles="stages.delivery.tiles"
				:installed="stages.delivery.installed"
				:isCollapsible="true"
				:initialCollapseState="stages.delivery.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<automation-block
				v-if="editable && hasStageAutomation"
				:counter="counter++"
				:status="stages.automation.status"
				:stageOnOrderPaid="stages.automation.stageOnOrderPaid"
				:stageOnDeliveryFinished="stages.automation.stageOnDeliveryFinished"
				:items="stages.automation.items"
				:initialCollapseState="stages.automation.initialCollapseState"
				:isDeliveryStageVisible="stages.delivery.installed"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<send-block
				@on-submit="onSend"
				:buttonEnabled="sendAllowed"
				:showWhatClientSeesControl="!editable"
				:buttonLabel="submitButtonLabel"
			/>
			<timeline-block
				v-if="hasStageTimeLine"
				:timelineItems="stages.timeline.items"
			/>
		</div>
	`
	};

	var EntityCreatePaymentStages = {
		components: {
			'send-block': Send$2,
			'cashbox-block': Cashbox,
			'product-block': Product,
			'paysystem-block': PaySystem,
			'automation-block': Automation,
			'sms-message-block': SmsMessage,
			'timeline-block': TimeLine,
			'document-selector-block': DocumentSelector
		},
		props: {
			sendAllowed: {
				type: Boolean,
				required: true
			}
		},
		data() {
			let stages = {
				message: {
					initSenders: this.$root.$app.options.senders,
					initCurrentSenderCode: this.$root.$app.options.currentSenderCode,
					messageSenderData: this.$root.$app.options.messageSenderData,
					initPushedToUseBitrix24Notifications: this.$root.$app.options.pushedToUseBitrix24Notifications,
					selectedSmsSender: this.$root.$app.sendingMethodDesc.provider,
					manager: this.$root.$app.options.entityResponsible,
					phone: this.$root.$app.options.contactPhone,
					ownerId: this.$root.$app.options.ownerId,
					ownerTypeId: this.$root.$app.options.ownerTypeId,
					contactEditorUrl: this.$root.$app.options.contactEditorUrl,
					titleTemplate: this.getTitleTemplate(),
					showHint: this.$root.$app.options.templateMode !== 'view',
					editorTemplate: this.$root.$app.sendingMethodDesc.text,
					editorUrl: this.$root.$app.orderPublicUrl,
					selectedMode: 'payment'
				},
				product: {
					title: main_core.Loc.getMessage('SALESCENTER_PRODUCT_BLOCK_TITLE_MSGVER_1'),
					hintTitle: this.$root.$app.options.templateMode === 'view' ? '' : main_core.Loc.getMessage('SALESCENTER_PRODUCT_SET_BLOCK_TITLE_SHORT')
				},
				paysystem: {
					status: this.$root.$app.options.paySystemList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.paySystemList.items),
					installed: this.$root.$app.options.paySystemList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.paySystemList.items),
					initialCollapseState: this.$root.$app.options.isPaySystemCollapsed ? this.$root.$app.options.isPaySystemCollapsed === 'Y' : this.$root.$app.options.paySystemList.isSet
				},
				cashbox: {},
				automation: {},
				documentSelector: {
					status: salescenter_component_stageBlock.StatusTypes.complete
				}
			};
			if (this.$root.$app.options.cashboxList.hasOwnProperty('items')) {
				stages.cashbox = {
					status: this.$root.$app.options.cashboxList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.cashboxList.items),
					installed: this.$root.$app.options.cashboxList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.cashboxList.items),
					initialCollapseState: this.$root.$app.options.isCashboxCollapsed ? this.$root.$app.options.isCashboxCollapsed === 'Y' : this.$root.$app.options.cashboxList.isSet
				};
			}
			if (this.$root.$app.options.isAutomationAvailable) {
				stages.automation = {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					stageOnOrderPaid: this.$root.$app.options.stageOnOrderPaid,
					items: this.$root.$app.options.entityStageList,
					initialCollapseState: this.$root.$app.options.isAutomationCollapsed ? this.$root.$app.options.isAutomationCollapsed === 'Y' : false
				};
			}
			if (this.$root.$app.options.hasOwnProperty('timeline')) {
				stages.timeline = {
					items: this.getTimelineCollection(this.$root.$app.options.timeline)
				};
			}
			if (this.$root.$app.hasOwnProperty('documentSelector')) {
				if (this.$root.$app.documentSelector.templateAddUrl) {
					stages.documentSelector.templateAddUrl = this.$root.$app.documentSelector.templateAddUrl;
				}
			}
			return {
				stages: stages
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		computed: {
			hasStageTimeLine() {
				return this.stages.timeline.hasOwnProperty('items') && this.stages.timeline.items.length > 0;
			},
			hasStageAutomation() {
				return this.stages.automation.hasOwnProperty('items');
			},
			hasStageCashBox() {
				return this.stages.cashbox.hasOwnProperty('tiles');
			},
			submitButtonLabel() {
				return this.editable ? main_core.Loc.getMessage('SALESCENTER_SEND') : main_core.Loc.getMessage('SALESCENTER_RESEND');
			},
			isShowDocumentSelector() {
				return this.$root.$app.hasOwnProperty('documentSelector');
			}
		},
		methods: {
			getTitleTemplate() {
				if (this.$root.$app.options.messageSenderData) {
					return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_SENDER_MSGVER_1');
				}
				if (this.$root.$app.sendingMethodDesc.sent) {
					return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_2_PAST_TIME');
				}
				return main_core.Loc.getMessage('SALESCENTER_APP_CONTACT_BLOCK_TITLE_MESSAGE_2');
			},
			initCounter() {
				this.counter = 1;
			},
			getTimelineCollection(items) {
				let list = [];
				Object.values(items).forEach(options => list.push(TimeLineItem__namespace.Factory.create(options)));
				return list;
			},
			getTileCollection(items) {
				let tiles = [];
				Object.values(items).forEach(options => tiles.push(Tile__namespace.Factory.create(options)));
				return tiles;
			},
			getTitleItems(items) {
				let result = [];
				items.forEach(item => {
					if (![Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(item.type)) {
						result.push(item);
					}
				});
				return result;
			},
			stageRefresh(e, type) {
				main_core.ajax.runComponentAction("bitrix:salescenter.app", "getAjaxData", {
					mode: "class",
					data: {
						type: type
					}
				}).then(function (response) {
					if (response.data) {
						this.refreshTilesByType(response.data, type);
					}
				}.bind(this), function () {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SALESCENTER_DATA_UPDATE_ERROR')
					});
				});
			},
			refreshTilesByType(data, type) {
				if (type === 'PAY_SYSTEM') {
					this.stages.paysystem.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.paysystem.tiles = this.getTileCollection(data.items);
					this.stages.paysystem.installed = data.isSet;
					this.stages.paysystem.titleItems = this.getTitleItems(data.items);
				} else if (type === 'CASHBOX') {
					this.stages.cashbox.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.cashbox.tiles = this.getTileCollection(data.items);
					this.stages.cashbox.installed = data.isSet;
					this.stages.cashbox.titleItems = this.getTitleItems(data.items);
				}
			},
			onSend(event) {
				this.$emit('stage-block-send-on-send', event);
			},
			changeProvider(value) {
				this.$root.$app.sendingMethodDesc.provider = value;
				BX.userOptions.save('salescenter', 'payment_sms_provider_options', 'latest_selected_provider', value);
			},
			saveCollapsedOption(type, value) {
				BX.userOptions.save('salescenter', 'add_payment_collapse_options', type, value);
			}
		},
		created() {
			this.initCounter();
		},
		beforeUpdate() {
			this.initCounter();
		},
		template: `
		<div>
			<product-block
				:counter="counter++"
				:title="stages.product.title"
				:hintTitle="stages.product.hintTitle"
			/>
			<sms-message-block
				@stage-block-sms-send-on-change-provider="changeProvider"
				:counter="counter++"
				:initSenders="stages.message.initSenders"
				:initCurrentSenderCode="stages.message.initCurrentSenderCode"
				:messageSenderData="stages.message.messageSenderData"
				:initPushedToUseBitrix24Notifications="stages.message.initPushedToUseBitrix24Notifications"
				:selectedSmsSender="stages.message.selectedSmsSender"
				:manager="stages.message.manager"
				:phone="stages.message.phone"
				:contactEditorUrl="stages.message.contactEditorUrl"
				:ownerId="stages.message.ownerId"
				:ownerTypeId="stages.message.ownerTypeId"
				:titleTemplate="stages.message.titleTemplate"
				:showHint="stages.message.showHint"
				:editorTemplate="stages.message.editorTemplate"
				:editorUrl="stages.message.editorUrl"
				:selectedMode="stages.message.selectedMode"
			/>
			<paysystem-block
				v-if="editable"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'PAY_SYSTEM')"
				:counter="counter++"
				:status="stages.paysystem.status"
				:tiles="stages.paysystem.tiles"
				:installed="stages.paysystem.installed"
				:titleItems="stages.paysystem.titleItems"
				:initialCollapseState="stages.paysystem.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<cashbox-block
				v-if="editable && hasStageCashBox"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'CASHBOX')"
				:counter="counter++"
				:status="stages.cashbox.status"
				:tiles="stages.cashbox.tiles"
				:installed="stages.cashbox.installed"
				:titleItems="stages.cashbox.titleItems"
				:initialCollapseState="stages.cashbox.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<document-selector-block
				v-if="isShowDocumentSelector"
				:counter="counter++"
				:templateAddUrl="stages.documentSelector.templateAddUrl"
			/>
			<automation-block
				v-if="editable && hasStageAutomation"
				:counter="counter++"
				:status="stages.automation.status"
				:stageOnOrderPaid="stages.automation.stageOnOrderPaid"
				:items="stages.automation.items"
				:initialCollapseState="stages.automation.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<send-block
				@on-submit="onSend"
				:buttonEnabled="sendAllowed"
				:showWhatClientSeesControl="!editable"
				:buttonLabel="submitButtonLabel"
			/>
			<timeline-block
				v-if="hasStageTimeLine"
				:timelineItems="stages.timeline.items"
			/>
		</div>
	`
	};

	var Send$1 = {
		props: {
			buttonEnabled: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			buttonClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled': this.buttonEnabled === false
				};
			}
		},
		methods: {
			submit(event) {
				this.$emit('on-submit', event);
			}
		},
		template: `
		<div
			:class="buttonClass"
			class="salescenter-app-payment-by-sms-item-show salescenter-app-payment-by-sms-item salescenter-app-payment-by-sms-item-send"
		>
			<div class="salescenter-app-payment-by-sms-item-counter">
				<div class="salescenter-app-payment-by-sms-item-counter-rounder"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-line"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-number"></div>
			</div>
			<div class="">
				<div class="salescenter-app-payment-by-sms-item-container">
					<div class="salescenter-app-payment-by-sms-item-container-payment">
						<div class="salescenter-app-payment-by-sms-item-container-payment-inline">
							<div
								@click="submit($event)"
								class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
							>
								${main_core.Loc.getMessage('SALESCENTER_CREATE_SHIPMENT')}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	var StageBlocksListShipment = {
		components: {
			'send-block': Send$1,
			'product-block': Product,
			'delivery-block': DeliveryVuex,
			'automation-block': Automation
		},
		props: {
			sendAllowed: {
				type: Boolean,
				required: true
			}
		},
		data() {
			const stages = {
				product: {
					status: this.$root.$app.options.basket && this.$root.$app.options.basket.length > 0 ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.current,
					title: main_core.Loc.getMessage('SALESCENTER_PRODUCT_BLOCK_TITLE_MSGVER_1')
				},
				delivery: {
					status: this.$root.$app.options.deliveryList.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.deliveryList.items),
					installed: this.$root.$app.options.deliveryList.isInstalled,
					initialCollapseState: this.$root.$app.options.isDeliveryCollapsed ? this.$root.$app.options.isDeliveryCollapsed === 'Y' : this.$root.$app.options.deliveryList.isInstalled
				},
				automation: {}
			};
			if (this.$root.$app.options.isAutomationAvailable) {
				stages.automation = {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					stageOnDeliveryFinished: this.$root.$app.options.stageOnDeliveryFinished,
					items: this.$root.$app.options.entityStageList,
					initialCollapseState: this.$root.$app.options.isAutomationCollapsed ? this.$root.$app.options.isAutomationCollapsed === 'Y' : false
				};
			}
			return {
				stages
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		computed: {
			hasStageAutomation() {
				return this.stages.automation.hasOwnProperty('items');
			},
			editableMixin() {
				return this.editable === false;
			},
			isViewTemplateMode() {
				return this.$root.$app.options.templateMode === 'view';
			}
		},
		methods: {
			initCounter() {
				this.counter = 1;
			},
			getTileCollection(items) {
				const tiles = [];
				Object.values(items).forEach(options => tiles.push(Tile__namespace.Factory.create(options)));
				return tiles;
			},
			getTitleItems(items) {
				const result = [];
				items.forEach(item => {
					if (![Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(item.type)) {
						result.push(item);
					}
				});
				return result;
			},
			stageRefresh(e, type) {
				main_core.ajax.runComponentAction('bitrix:salescenter.app', 'getAjaxData', {
					mode: 'class',
					data: {
						type
					}
				}).then(response => {
					if (response.data) {
						this.refreshTilesByType(response.data, type);
					}
				}, () => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SALESCENTER_DATA_UPDATE_ERROR')
					});
				});
			},
			refreshTilesByType(data, type) {
				if (type === 'DELIVERY') {
					this.stages.delivery.status = data.isInstalled ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
					this.stages.delivery.tiles = this.getTileCollection(data.items);
					this.stages.delivery.installed = data.isInstalled;
				}
			},
			onSend(event) {
				this.$emit('stage-block-send-on-send', event);
			},
			saveCollapsedOption(type, value) {
				BX.userOptions.save('salescenter', 'add_shipment_collapse_options', type, value);
			}
		},
		created() {
			this.initCounter();
		},
		beforeUpdate() {
			this.initCounter();
		},
		template: `
		<div>
			<product-block 
				:counter="counter++"
				:status="stages.product.status"
				:title=	"stages.product.title"
				:hintTitle="''"
			/>
			
			<delivery-block v-on:on-stage-tile-collection-slider-close="stageRefresh($event, 'DELIVERY')"
				:counter="counter++"
				:status="stages.delivery.status"
				:tiles="stages.delivery.tiles"
				:installed="stages.delivery.installed"
				:isCollapsible="false"
				:initialCollapseState="stages.delivery.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>

			<automation-block v-if="editable && hasStageAutomation"
				:counter="counter++"
				:status="stages.automation.status"
				:stageOnDeliveryFinished="stages.automation.stageOnDeliveryFinished"
				:items="stages.automation.items"
				:initialCollapseState="stages.automation.initialCollapseState"
				:isDeliveryStageVisible=true
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			
			<send-block
				v-if="!isViewTemplateMode"
				@on-submit="onSend"
				:buttonEnabled="sendAllowed"
			/>
		</div>
	`
	};

	const ResponsibleSelector = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			selectedUser: {
				type: Number,
				required: false
			},
			responsible: {
				type: Object,
				required: false
			},
			isMobileInstalledForResponsible: {
				type: Boolean,
				required: false
			},
			editable: {
				type: Boolean,
				required: true
			},
			contact: {
				type: Object,
				required: true
			},
			hintTitle: {
				type: String,
				required: false
			}
		},
		mixins: [StageMixin],
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block
		},
		computed: {
			isCreateMode() {
				return this.$root.$app.options.templateMode === 'create';
			},
			configForBlock() {
				return {
					counter: this.counter,
					titleItems: [],
					installed: true,
					collapsible: false,
					checked: this.counterCheckedMixin,
					showHint: true
				};
			},
			contactInfo() {
				if (this.contact.name || this.contact.phone) {
					return main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_CONTACT_INFO_TEMPLATE', {
						'[span]': '<span class="salescenter-responsible-block-contact">',
						'[/span]': '</span>',
						'#CONTACT_NAME#': main_core.Text.encode(this.contact.name),
						'#CONTACT_PHONE#': main_core.Text.encode(this.contact.phone)
					});
				}
				return '';
			},
			addEmployee() {
				return main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_ADD_EMPLOYEE', {
					'[link]': '<span id="add-employee-link" class="salescenter-responsible-block-add-employee-link">',
					'[/link]': '</span>'
				});
			},
			responsibleHeaderText() {
				return this.isCreateMode ? main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_RESPONSIBLE_CREATE') : main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_RESPONSIBLE_VIEW');
			},
			avatarStyle() {
				const url = this.responsible.photo ? {
					'background-image': `url(${this.responsible.photo})`
				} : null;
				return [url];
			}
		},
		mounted() {
			this.$store.commit('orderCreation/setMobileInstalledForResponsible', this.isMobileInstalledForResponsible ?? true);
			const addEmployeeLink = document.getElementById('add-employee-link');
			if (addEmployeeLink) {
				main_core.Event.bind(addEmployeeLink, 'click', event => {
					this.$root.$app.openMobileAppPopup();
				});
			}
			if (!this.editable) {
				return;
			}
			const selectorRoot = document.getElementById('salescenterResponsibleSelector');
			const dialogOptions = {
				context: 'salescenter_responsible',
				entities: [{
					id: 'user'
				}],
				events: {
					'Item:onSelect': event => {
						this.onResponsibleChanged(event);
					}
				}
			};
			if (this.selectedUser) {
				dialogOptions.preselectedItems = [['user', this.selectedUser]];
				dialogOptions.undeselectedItems = [['user', this.selectedUser]];
			}
			const tagSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				dialogOptions,
				deselectable: false
			});
			tagSelector.renderTo(selectorRoot);
		},
		methods: {
			onResponsibleChanged(event) {
				const {
					item
				} = event.getData();
				item.setDeselectable(false);
				event.target?.tagSelector?.updateTags();
				this.$store.commit('orderCreation/setPaymentResponsibleId', item.getId());
				const isSubmitEnabled = this.$store.getters['orderCreation/isAllowedSubmit'];
				this.$store.commit('orderCreation/disableSubmit');
				main_core.ajax.runAction('salescenter.terminalResponsible.getUserMobileInfo', {
					data: {
						userId: item.getId()
					}
				}).then(result => {
					this.$store.commit('orderCreation/setMobileInstalledForResponsible', result.data.isMobileInstalled);
					if (!result.data.isMobileInstalled) {
						this.$store.commit('orderCreation/setResponsiblePhoneNumbers', result.data.phones);
					}
					if (isSubmitEnabled) {
						this.$store.commit('orderCreation/enableSubmit');
					}
					this.$emit('on-responsible-changed', event);
				});
			},
			onItemHint(event) {
				BX.Salescenter.Manager.openHowTerminalWorks();
			}
		},
		created() {
			if (this.selectedUser) {
				this.$store.commit('orderCreation/setPaymentResponsibleId', this.selectedUser);
			}
		},
		// language=Vue
		template: `
		<stage-block-item
			:class="statusClassMixin"
			:config="configForBlock"
			v-on:on-item-hint="onItemHint"
		>
			<template v-slot:block-title-title>{{ title }}</template>
			<template v-slot:block-hint-title>{{ hintTitle }}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">
					<p class="salescenter-responsible-block-responsible-header">{{ responsibleHeaderText }}</p>
					<div id="salescenterResponsibleSelector" v-if="editable"></div>
					<div class="salescenter-responsible-block-responsible-wrapper" v-else>
						<div
							class="salescenter-app-payment-by-sms-item-container-sms-user-avatar salescenter-responsible-block-responsible-photo"
							:style="avatarStyle"></div>
						<div class="salescenter-responsible-block-responsible-name-wrapper">
							<a class="salescenter-responsible-block-responsible-name">{{ responsible.fullName }}</a>
							<div class="salescenter-responsible-block-responsible-position-wrapper">
								<span class="salescenter-responsible-block-responsible-position">{{ responsible.position }}</span>
							</div>
						</div>
					</div>
					<div v-html="contactInfo" class="salescenter-responsible-block-contact-info" v-if="!isCreateMode"></div>
					<div v-html="addEmployee" class="salescenter-responsible-block-add-employee" v-else></div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var Send = {
		props: {
			buttonLabel: {
				type: String,
				required: true
			},
			buttonEnabled: {
				type: Boolean,
				required: true
			}
		},
		computed: {
			buttonClass() {
				return {
					'salescenter-app-payment-by-sms-item-disabled': this.buttonEnabled === false
				};
			}
		},
		methods: {
			submit(event) {
				this.$emit('on-submit', event);
			}
		},
		template: `
		<div
			:class="buttonClass"
			class="salescenter-app-payment-by-sms-item-show salescenter-app-payment-by-sms-item salescenter-app-payment-by-sms-item-send"
		>
			<div class="salescenter-app-payment-by-sms-item-counter">
				<div class="salescenter-app-payment-by-sms-item-counter-rounder"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-line"></div>
				<div class="salescenter-app-payment-by-sms-item-counter-number"></div>
			</div>
			<div class="">
				<div class="salescenter-app-payment-by-sms-item-container">
					<div class="salescenter-app-payment-by-sms-item-container-payment">
						<div class="salescenter-app-payment-by-sms-item-container-payment-inline">
							<div
								@click="submit($event)"
								class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
							>
								{{buttonLabel}}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	var Amount = {
		props: {
			status: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			hintTitle: {
				type: String,
				required: true
			}
		},
		mixins: [StageMixin],
		mounted() {
			// temporary fix; see the comment in the product block (product.js) for more details
			const editable = this.$root.$app.options.templateMode !== 'view';
			this.$root.$emit('on-change-editable', editable);
			this.$store.commit('orderCreation/enableSubmit');
		},
		components: {
			'stage-block-item': salescenter_component_stageBlock.Block
		},
		methods: {
			onItemHint(e) {
				BX.Salescenter.Manager.openHowToSell(e);
			},
			onProductFormModeChange(event) {
				this.$emit('on-product-form-mode-change');
			}
		},
		computed: {
			configForBlock() {
				return {
					counter: this.counter,
					checked: this.counterCheckedMixin,
					showHint: true
				};
			},
			formattedSum() {
				const defaultCurrency = this.$root.$app.options.currencyCode || '';
				const sum = currency_currencyCore.CurrencyCore.currencyFormat(this.$root.$app.options.totals.result, defaultCurrency, false);
				const element = main_core.Tag.render`<span class="catalog-pf-text salescenter-amount-block-amount-result-text--total">${sum}</span>`;
				return currency_currencyCore.CurrencyCore.getPriceControl(element, defaultCurrency);
			}
		},
		template: `
		<stage-block-item
			@on-item-hint.stop.prevent="onItemHint"
			:config="configForBlock"
			:class="statusClassMixin"
		>
			<template v-slot:block-title-title>{{ title }}</template>
			<template v-slot:block-hint-title>{{ hintTitle }}</template>
			<template v-slot:block-container>
				<div :class="containerClassMixin">
					<div class="salescenter-amount-block-stub-wrapper">
						<div class="salescenter-amount-block-stub-icon"></div>
						<div class="salescenter-amount-block-stub-text-wrapper">
							<h3 class="salescenter-amount-block-stub-title">${main_core.Loc.getMessage('SALESCENTER_AMOUNT_BLOCK_STUB_TITLE')}</h3>
							<p class="salescenter-amount-block-stub-text">${main_core.Loc.getMessage('SALESCENTER_AMOUNT_BLOCK_STUB_TEXT')}</p>
						</div>
					</div>
					<div class="salescenter-amount-block-amount-wrapper">
						<table class="salescenter-amount-block-amount-result">
							<tr>
								<td class="salescenter-amount-block-amount-result-cell">
									<span class="salescenter-amount-block-amount-result-text salescenter-amount-block-amount-result-text--total">${main_core.Loc.getMessage('SALESCENTER_AMOUNT_BLOCK_TOTAL')}</span>
								</td>
								<td class="salescenter-amount-block-amount-result-cell">
									<span class="salescenter-amount-block-amount-result-symbol salescenter-amount-block-amount-result-symbol--total" v-html="formattedSum"></span>
								</td>
							</tr>
						</table>
					</div>
				</div>
			</template>
		</stage-block-item>
	`
	};

	var TerminalStageBlocksList = {
		components: {
			'responsible-block': ResponsibleSelector,
			'cashbox-block': Cashbox,
			'product-block': Product,
			'paysystem-block': PaySystem,
			'automation-block': Automation,
			'timeline-block': TimeLine,
			'send-block': Send,
			'amount-block': Amount
		},
		props: {
			sendAllowed: {
				type: Boolean,
				required: true
			}
		},
		data() {
			const stages = {
				responsible: {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					selectedUser: parseInt(this.$root.$app.options.paymentResponsible ?? 0),
					responsible: this.$root.$app.options.entityResponsible,
					isMobileInstalledForResponsible: this.$root.$app.options.isMobileInstalledForResponsible,
					contact: {
						name: this.$root.$app.options.contactName,
						phone: this.$root.$app.options.contactPhone
					},
					editable: this.$root.$app.options.templateMode === 'create' || this.$root.$app.options.payment?.PAID === 'N',
					hintTitle: this.$root.$app.options.templateMode === 'view' ? '' : main_core.Loc.getMessage('SALESCENTER_HOW_TERMINAL_WORKS')
				},
				product: {
					status: this.$root.$app.options.basket && this.$root.$app.options.basket.length > 0 ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.current,
					title: main_core.Loc.getMessage('SALESCENTER_PRODUCT_BLOCK_TITLE_MSGVER_1'),
					hintTitle: ''
				},
				paysystem: {
					status: this.$root.$app.options.paySystemList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.paySystemList.items),
					installed: this.$root.$app.options.paySystemList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.paySystemList.items),
					initialCollapseState: this.$root.$app.options.isPaySystemCollapsed ? this.$root.$app.options.isPaySystemCollapsed === 'Y' : this.$root.$app.options.paySystemList.isSet
				},
				cashbox: {},
				automation: {}
			};
			if (this.$root.$app.options.cashboxList.hasOwnProperty('items')) {
				stages.cashbox = {
					status: this.$root.$app.options.cashboxList.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled,
					tiles: this.getTileCollection(this.$root.$app.options.cashboxList.items),
					installed: this.$root.$app.options.cashboxList.isSet,
					titleItems: this.getTitleItems(this.$root.$app.options.cashboxList.items),
					initialCollapseState: this.$root.$app.options.isCashboxCollapsed ? this.$root.$app.options.isCashboxCollapsed === 'Y' : this.$root.$app.options.cashboxList.isSet
				};
			}
			if (this.$root.$app.options.isAutomationAvailable) {
				stages.automation = {
					status: salescenter_component_stageBlock.StatusTypes.complete,
					stageOnOrderPaid: this.$root.$app.options.stageOnOrderPaid,
					items: this.$root.$app.options.entityStageList,
					initialCollapseState: this.$root.$app.options.isAutomationCollapsed ? this.$root.$app.options.isAutomationCollapsed === 'Y' : false
				};
			}
			if (this.$root.$app.options.hasOwnProperty('timeline')) {
				stages.timeline = {
					items: this.getTimelineCollection(this.$root.$app.options.timeline)
				};
			}
			if (this.$root.$app.options.paySystemList.groups) {
				stages.paysystem.groups = this.getTileGroupsCollection(this.$root.$app.options.paySystemList.groups, stages.paysystem.tiles);
			}
			if (this.$root.$app.options.templateMode === 'view' && this.$root.$app.options.payment?.PAID === 'Y') {
				stages.responsible.title = main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_TITLE_PAID_VIEW');
			} else {
				stages.responsible.title = main_core.Loc.getMessage('SALESCENTER_PAYMENT_RESPONSIBLE_SELECTOR_BLOCK_TITLE');
			}
			return {
				stages
			};
		},
		mixins: [StageMixin, MixinTemplatesType],
		computed: {
			hasStageTimeLine() {
				return this.stages.timeline.hasOwnProperty('items') && this.stages.timeline.items.length > 0;
			},
			hasStageAutomation() {
				return this.stages.automation.hasOwnProperty('items');
			},
			hasStageCashBox() {
				return this.stages.cashbox.hasOwnProperty('tiles');
			},
			submitButtonLabel() {
				return this.editable ? main_core.Loc.getMessage('SALESCENTER_CREATE_TERMINAL_PAYMENT') : main_core.Loc.getMessage('SALESCENTER_SAVE');
			},
			hasProducts() {
				return !this.$root.$app.options.isPaymentByAmount;
			}
		},
		methods: {
			initCounter() {
				this.counter = 1;
			},
			getTimelineCollection(items) {
				const list = [];
				Object.values(items).forEach(options => list.push(TimeLineItem__namespace.Factory.create(options)));
				return list;
			},
			getTileCollection(items) {
				const tiles = [];
				Object.values(items).forEach(options => tiles.push(Tile__namespace.Factory.create(options)));
				return tiles;
			},
			getTileGroupsCollection(groups, tiles) {
				const ret = [];
				if (Array.isArray(groups)) {
					Object.values(groups).forEach(item => {
						const group = new Tile__namespace.Group(item);
						group.fillTiles(tiles);
						ret.push(group);
					});
				}
				return ret;
			},
			getTitleItems(items) {
				const result = [];
				items.forEach(item => {
					if (![Tile__namespace.More.type(), Tile__namespace.Offer.type()].includes(item.type)) {
						result.push(item);
					}
				});
				return result;
			},
			stageRefresh(e, type) {
				main_core.ajax.runComponentAction('bitrix:salescenter.app', 'getAjaxData', {
					mode: 'class',
					data: {
						type
					}
				}).then(response => {
					if (response.data) {
						this.refreshTilesByType(response.data, type);
					}
				}, () => {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('SALESCENTER_DATA_UPDATE_ERROR')
					});
				});
			},
			refreshTilesByType(data, type) {
				switch (type) {
					case 'PAY_SYSTEM':
						{
							this.stages.paysystem.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
							this.stages.paysystem.tiles = this.getTileCollection(data.items);
							this.stages.paysystem.groups = this.getTileGroupsCollection(data.groups, this.stages.paysystem.tiles);
							this.stages.paysystem.installed = data.isSet;
							this.stages.paysystem.titleItems = this.getTitleItems(data.items);
							break;
						}
					case 'CASHBOX':
						{
							this.stages.cashbox.status = data.isSet ? salescenter_component_stageBlock.StatusTypes.complete : salescenter_component_stageBlock.StatusTypes.disabled;
							this.stages.cashbox.tiles = this.getTileCollection(data.items);
							this.stages.cashbox.installed = data.isSet;
							this.stages.cashbox.titleItems = this.getTitleItems(data.items);
							break;
						}
					// No default
				}
			},
			onSend(event) {
				this.$emit('stage-block-send-on-send', event);
			},
			onResponsibleChanged(event) {
				this.$emit('on-responsible-changed', event);
			},
			saveCollapsedOption(type, value) {
				BX.userOptions.save('salescenter', 'add_payment_collapse_options', type, value);
			}
		},
		created() {
			this.initCounter();
		},
		beforeUpdate() {
			this.initCounter();
		},
		// language=Vue
		template: `
		<div class="salescenter-app-terminal-wrapper">
			<product-block
				v-if="hasProducts"
				:counter="counter++"
				:status="stages.product.status"
				:title="stages.product.title"
				:hintTitle="stages.product.hintTitle"
				:additionalContainerClasses="{ 'salescenter-app-teminal-products-item': true }"
			/>
			<responsible-block
				:counter="counter++"
				:status="stages.responsible.status"
				:title="stages.responsible.title"
				:selectedUser="stages.responsible.selectedUser"
				:responsible="stages.responsible.responsible"
				:isMobileInstalledForResponsible="stages.responsible.isMobileInstalledForResponsible"
				:contact="stages.responsible.contact"
				:editable="stages.responsible.editable"
				:hintTitle="stages.responsible.hintTitle"
				@on-responsible-changed="onResponsibleChanged"
			/>
			<amount-block
				v-if="!hasProducts"
				:counter="counter++"
				:status="stages.product.status"
				:title="stages.product.title"
				:hintTitle="stages.product.hintTitle"
			/>
			<paysystem-block
				v-if="editable"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'PAY_SYSTEM')"
				:counter="counter++"
				:status="stages.paysystem.status"
				:tiles="stages.paysystem.tiles"
				:installed="stages.paysystem.installed"
				:titleItems="stages.paysystem.titleItems"
				:initialCollapseState="stages.paysystem.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<cashbox-block
				v-if="editable && hasStageCashBox"
				@on-stage-tile-collection-slider-close="stageRefresh($event, 'CASHBOX')"
				:counter="counter++"
				:status="stages.cashbox.status"
				:tiles="stages.cashbox.tiles"
				:installed="stages.cashbox.installed"
				:titleItems="stages.cashbox.titleItems"
				:initialCollapseState="stages.cashbox.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<automation-block
				v-if="editable && hasStageAutomation"
				:counter="counter++"
				:status="stages.automation.status"
				:stageOnOrderPaid="stages.automation.stageOnOrderPaid"
				:items="stages.automation.items"
				:initialCollapseState="stages.automation.initialCollapseState"
				@on-save-collapsed-option="saveCollapsedOption"
			/>
			<send-block
				v-if="editable"
				@on-submit="onSend"
				:buttonEnabled="sendAllowed"
				:buttonLabel="submitButtonLabel"
			/>
			<timeline-block
				v-if="hasStageTimeLine"
				:timelineItems="stages.timeline.items"
			/>
		</div>
	`
	};

	var Deal = {
		mixins: [MixinTemplatesType, ComponentMixin],
		data() {
			let isPanelVisible = true;
			if (this.$root.$app.options.mode === ModeDictionary.terminalPayment && this.$root.$app.options.templateMode === 'view' && this.$root.$app.options.payment?.PAID === 'N') {
				isPanelVisible = false;
			}
			return {
				activeMenuItem: this.$root.$app.options.mode,
				isLoading: false,
				isPanelVisible,
				ModeDictionary
			};
		},
		components: {
			'deal-receiving-payment': StageBlocksList,
			'crm-entity-create-payment': EntityCreatePaymentStages,
			'deal-creating-shipment': StageBlocksListShipment,
			'deal-terminal-payment': TerminalStageBlocksList,
			'start': Start
		},
		methods: {
			reload(form) {
				if (this.isLoading || !this.editable) {
					return;
				}
				this.isLoading = true;
				this.activeMenuItem = form;
				this.$emit('on-reload', {
					context: this.$root.$app.options.context,
					orderId: this.$root.$app.orderId,
					ownerTypeId: this.$root.$app.options.ownerTypeId,
					ownerId: this.$root.$app.options.ownerId,
					templateMode: 'create',
					mode: this.activeMenuItem,
					showModeList: this.$root.$app.options.showModeList,
					initialMode: this.$root.$app.options.initialMode
				});
			},
			onSuccessfullyConnected() {
				this.reload(this.activeMenuItem);
			},
			onReload() {
				this.reload(this.activeMenuItem);
			},
			sendPaymentDeliveryForm(event) {
				if (!this.isAllowedPaymentDeliverySubmitButton) {
					return;
				}
				if (!this.$root.$app.isPhoneConfirmed) {
					main_core_events.EventEmitter.subscribeOnce('BX.Salescenter.App::onPhoneConfirmed', () => this.sendPaymentDeliveryForm(event));
					this.$root.$app.showPhoneConfirmPopup();
					return;
				}
				if (this.$store.getters['orderCreation/isCompilationMode']) {
					this.$root.$app.sendCompilation(event.target);
				} else if (this.editable) {
					this.$root.$app.sendPayment(event.target);
				} else {
					this.$root.$app.resendPayment(event.target);
				}
			},
			sendDeliveryForm(event) {
				if (!this.isAllowedDeliverySubmitButton) {
					return;
				}
				this.$root.$app.sendShipment(event.target);
			},
			sendTerminalPaymentForm(event) {
				if (!this.isAllowedTerminalPaymentSubmitButton) {
					return;
				}
				if (this.templateMode === 'view') {
					this.$root.$app.updateTerminalPayment(event.target);
					return;
				}
				this.$root.$app.sendTerminalPayment(event.target);
			},
			// region menu item handlers
			specifyCompanyContacts() {
				BX.Salescenter.Manager.openSlider(this.$root.$app.options.urlSettingsCompanyContacts, {
					width: 1200
				});
			},
			suggestScenario(event) {
				BX.Salescenter.Manager.openFeedbackPayOrderForm(event);
			},
			howItWorks(event) {
				if (this.mode === ModeDictionary.payment) {
					BX.Salescenter.Manager.openHowPaySmartInvoiceWorks(event);
					return;
				}
				if (this.mode === ModeDictionary.terminalPayment) {
					BX.Salescenter.Manager.openHowTerminalWorks(event);
					return;
				}
				BX.Salescenter.Manager.openHowPayDealWorks(event);
			},
			openIntegrationWindow(event) {
				BX.Salescenter.Manager.openIntegrationRequestForm(event);
			},
			freeMessages() {
				let senders = this.$root.$app.options.senders;
				let sender = senders.filter(item => item.code === salescenter_lib.SenderConfig.BITRIX24);
				if (sender.length > 0) {
					let fixed = salescenter_lib.SenderConfig.openSliderFreeMessages(sender[0].connectUrl);
					fixed().then();
				}
			},
			onResponsibleChanged(event) {
				// it needs to be done like that and not with vue's @class attribute because is breaks BX.UI.Pinner's classes
				const buttonsPanel = this.$refs['buttonsPanel'];
				buttonsPanel.classList.remove('salescenter-button-panel-hidden');
				const pinnerAnchor = document.querySelector('.salescenter-app-pinner-anchor');
				pinnerAnchor.classList.remove('salescenter-app-pinner-anchor-hidden');
			},
			openTerminalToolDisabledSlider() {
				main_core.Runtime.loadExtension('ui.info-helper').then(() => {
					top.BX.UI.InfoHelper.show('limit_crm_terminal_off');
				});
			},
			openSalescanterToolDisabledSlider() {
				BX.loadExt('salescenter.tool-availability-manager').then(() => {
					BX.Salescenter.ToolAvailabilityManager.openSalescenterToolDisabledSlider();
				});
			}
			// endregion
		},
		computed: {
			mode() {
				return this.$root.$app.options.mode;
			},
			templateMode() {
				return this.$root.$app.options.templateMode;
			},
			initialMode() {
				return this.$root.$app.options.initialMode;
			},
			isAllowedFreeMessagesButton() {
				let senders = this.$root.$app.options.senders;
				let sender = senders.filter(item => item.code === salescenter_lib.SenderConfig.BITRIX24);
				if (sender.length > 0) {
					return salescenter_lib.SenderConfig.needConfigure(sender[0]);
				}
				return false;
			},
			isOnlyDeliveryItemVisible() {
				return this.initialMode === ModeDictionary.delivery && this.$root.$app.options.hasOwnProperty('deliveryList') && this.$root.$app.options.deliveryList.hasOwnProperty('hasInstallable') && this.$root.$app.options.deliveryList.hasInstallable;
			},
			isTerminalItemVisible() {
				return this.isPaymentItemVisible && this.$root.$app.options.isTerminalAvailable;
			},
			isTerminalToolEnabled() {
				return this.$root.$app.options.isTerminalToolEnabled;
			},
			isSalescenterToolEnabled() {
				return this.$root.$app.options.isSalescenterToolEnabled;
			},
			isPaymentItemVisible() {
				return this.initialMode === ModeDictionary.payment || this.initialMode === ModeDictionary.paymentDelivery || this.initialMode === ModeDictionary.terminalPayment;
			},
			isAllowedPaymentDeliverySubmitButton() {
				if (this.$root.$app.options.messageSenderData) {
					return this.$store.getters['orderCreation/isAllowedSubmit'];
				}
				if (!this.$root.$app.hasClientContactInfo()) {
					return false;
				}
				const senders = this.$root.$app.options.senders;
				const filteredSenders = senders.filter(sender => sender.code === this.$root.$app.options.currentSenderCode && sender.isConnected);
				if (filteredSenders.length === 0) {
					this.$store.commit('orderCreation/setIsSenderSelected', false);
				}
				return this.$store.getters['orderCreation/isAllowedSubmit'];
			},
			isAllowedTerminalPaymentSubmitButton() {
				return this.$store.getters['orderCreation/isAllowedSubmit'] || this.isTerminalViewModeSaveAllowed;
			},
			isTerminalViewModeSaveAllowed() {
				return this.templateMode === 'view' && this.$root.$app.options.payment?.PAID === 'N';
			},
			isAllowedDeliverySubmitButton() {
				const deliveryId = this.$store.getters['orderCreation/getDeliveryId'];
				if (!deliveryId) {
					return false;
				}
				if (!this.$store.getters['orderCreation/isAllowedSubmit']) {
					return false;
				}
				return deliveryId != this.$root.$app.options.emptyDeliveryServiceId;
			},
			isSuggestScenarioMenuItemVisible() {
				return this.$root.$app.options.isBitrix24;
			},
			isRequestIntegrationMenuItemVisible() {
				return this.$root.$app.options.isIntegrationButtonVisible;
			},
			isModeListVisible() {
				return this.$root.$app.options.showModeList ?? true;
			},
			needShowStoreConnection() {
				return !this.isOrderPublicUrlAvailable && this.mode !== ModeDictionary.delivery;
			},
			isSidebarEnabled() {
				return true; // not removing this just yet because who knows...
			},
			sendPaymentDeliveryFormButtonText() {
				return this.editable ? main_core.Loc.getMessage('SALESCENTER_SEND') : main_core.Loc.getMessage('SALESCENTER_RESEND');
			},
			title() {
				return this.$root.$app.options.title;
			},
			// classes region
			paymentDeliveryFormSubmitButtonClass() {
				return {
					'ui-btn-disabled': !this.isAllowedPaymentDeliverySubmitButton
				};
			},
			deliveryFormSubmitButtonClass() {
				return {
					'ui-btn-disabled': !this.isAllowedDeliverySubmitButton
				};
			},
			terminalPaymentFormSubmitButtonClass() {
				return {
					'ui-btn-disabled': !this.isAllowedTerminalPaymentSubmitButton
				};
			},
			paymentMenuItemClass() {
				return {
					'salescenter-app-sidebar-menu-active': this.activeMenuItem === ModeDictionary.payment
				};
			},
			paymentTerminalMenuItemClass() {
				return {
					'salescenter-app-sidebar-menu-active': this.activeMenuItem === ModeDictionary.terminalPayment
				};
			},
			paymentDeliveryMenuItemClass() {
				return {
					'salescenter-app-sidebar-menu-active': this.activeMenuItem === ModeDictionary.paymentDelivery
				};
			},
			deliveryMenuItemClass() {
				return {
					'salescenter-app-sidebar-menu-active': this.activeMenuItem === ModeDictionary.delivery
				};
			},
			// endregion
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application,
				order: state => state.orderCreation
			})
		},
		//language=Vue
		template: `
		<div>
			<div
				:class="wrapperClass"
				:style="wrapperStyle"
				class="salescenter-app-wrapper"
			>
				<div class="ui-sidepanel-sidebar salescenter-app-sidebar" v-if="isSidebarEnabled">
					<ul class="ui-sidepanel-menu">
						<template v-if="templateMode === 'view'">
							<li class="ui-sidepanel-menu-item salescenter-app-sidebar-menu-active">
								<a class="ui-sidepanel-menu-link">
									<div class="ui-sidepanel-menu-link-text">{{title}}</div>
								</a>
							</li>
						</template>
						<template v-else-if="isModeListVisible">
							<template v-if="isOnlyDeliveryItemVisible">
								<li
									:class="deliveryMenuItemClass"
									class="ui-sidepanel-menu-item"
								>
									<a class="ui-sidepanel-menu-link">
										<div class="ui-sidepanel-menu-link-text">
											${main_core.Loc.getMessage('SALESCENTER_LEFT_CREATE_SHIPMENT_MSGVER_1')}
										</div>
									</a>
								</li>
							</template>
							<template v-else>
								<li
									v-if="isPaymentItemVisible"
									@click="isSalescenterToolEnabled ? reload(ModeDictionary.payment) : openSalescanterToolDisabledSlider()"
									:class="paymentMenuItemClass"
									class="ui-sidepanel-menu-item"
								>
									<a class="ui-sidepanel-menu-link">
										<div class="ui-sidepanel-menu-link-text">
											${main_core.Loc.getMessage('SALESCENTER_LEFT_TAKE_PAYMENT')}
										</div>
									</a>
								</li>
	
								<li
									v-if="isTerminalItemVisible"
									@click="isTerminalToolEnabled ? reload(ModeDictionary.terminalPayment) : openTerminalToolDisabledSlider()"
									:class="paymentTerminalMenuItemClass"
									class="ui-sidepanel-menu-item"
								>
									<a class="ui-sidepanel-menu-link salescenter-menu-terminal-payment">
										<div class="ui-sidepanel-menu-link-text">
											${main_core.Loc.getMessage('SALESCENTER_LEFT_TERMINAL_PAYMENT')}
										</div>
									</a>
								</li>
	
								<li
									v-if="isPaymentItemVisible"
									@click="isSalescenterToolEnabled ? reload(ModeDictionary.paymentDelivery) : openSalescanterToolDisabledSlider()"
									:class="paymentDeliveryMenuItemClass"
									class="ui-sidepanel-menu-item"
								>
									<a class="ui-sidepanel-menu-link">
										<div class="ui-sidepanel-menu-link-text">
											${main_core.Loc.getMessage('SALESCENTER_LEFT_TAKE_PAYMENT_AND_CREATE_SHIPMENT')}
										</div>
									</a>
								</li>
							</template>
						</template>
	
						<li class="ui-sidepanel-menu-item ui-sidepanel-menu-item-sm ui-sidepanel-menu-item-separate">
							<a
								@click="specifyCompanyContacts"
								class="ui-sidepanel-menu-link"
							>
								<div class="ui-sidepanel-menu-link-text">
									${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_COMPANY_CONTACTS')}
								</div>
							</a>
						</li>
						<li
							v-if="isSuggestScenarioMenuItemVisible"
							class="ui-sidepanel-menu-item ui-sidepanel-menu-item-sm"
						>
							<a
								@click="suggestScenario($event)"
								class="ui-sidepanel-menu-link"
							>
								<div class="ui-sidepanel-menu-link-text">
									${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_OFFER_SCRIPT')}
								</div>
							</a>
						</li>
						<li class="ui-sidepanel-menu-item ui-sidepanel-menu-item-sm">
							<a
								@click="howItWorks($event)"
								class="ui-sidepanel-menu-link"
							>
								<div class="ui-sidepanel-menu-link-text">
									${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_HOW_WORKS')}
								</div>
							</a>
						</li>
						<li
							v-if="isAllowedFreeMessagesButton"
							class="ui-sidepanel-menu-item ui-sidepanel-menu-item-sm"
						>
							<a
								@click="freeMessages($event)"
								class="ui-sidepanel-menu-link"
							>
								<div class="ui-sidepanel-menu-link-text">
									${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_FREE_MESSAGES')}
								</div>
							</a>
						</li>
						<li
							v-if="isRequestIntegrationMenuItemVisible"
							class="ui-sidepanel-menu-item ui-sidepanel-menu-item-sm">
							<a
								@click="openIntegrationWindow($event)"
								class="ui-sidepanel-menu-link"
							>
								<div class="ui-sidepanel-menu-link-text"
									 data-manager-openIntegrationRequestForm-params="sender_page:deal"
								>
									${main_core.Loc.getMessage('SALESCENTER_LEFT_PAYMENT_INTEGRATION_MSGVER_3')}
								</div>
							</a>
						</li>
					</ul>
				</div>
				<div class="salescenter-app-right-side">
					<start
						v-if="needShowStoreConnection && mode !== ModeDictionary.terminalPayment"
						@on-successfully-connected="onSuccessfullyConnected"
					>
					</start>
					<template v-else>
						<deal-receiving-payment
							v-if="mode === ModeDictionary.paymentDelivery"
							@stage-block-on-reload="onReload"
							@stage-block-send-on-send="sendPaymentDeliveryForm($event)"
							:sendAllowed="isAllowedPaymentDeliverySubmitButton"
						/>
						<deal-creating-shipment
							v-else-if="mode === ModeDictionary.delivery"
							@stage-block-send-on-send="sendDeliveryForm($event)"
							:sendAllowed="isAllowedDeliverySubmitButton"
						/>
						<crm-entity-create-payment
							v-if="mode === ModeDictionary.payment"
							@stage-block-send-on-send="sendPaymentDeliveryForm($event)"
							:sendAllowed="isAllowedPaymentDeliverySubmitButton"
						/>
						<deal-terminal-payment
							v-if="mode === ModeDictionary.terminalPayment"
							@stage-block-send-on-send="sendTerminalPaymentForm($event)"
							@on-responsible-changed="onResponsibleChanged($event)"
							:sendAllowed="isAllowedTerminalPaymentSubmitButton"
						/>
					</template>
				</div>
				<template v-if="!(mode === 'terminal_payment' && templateMode === 'view' && !isTerminalViewModeSaveAllowed)">
					<div class="ui-button-panel-wrapper salescenter-button-panel" ref="buttonsPanel" :class="{ 'salescenter-button-panel-hidden': !isPanelVisible }">
						<div class="ui-button-panel">
							<template v-if="mode === ModeDictionary.paymentDelivery || mode === ModeDictionary.payment">
								<button
									@click="sendPaymentDeliveryForm($event)"
									:class="paymentDeliveryFormSubmitButtonClass"
									class="ui-btn ui-btn-md ui-btn-success"
								>
									{{sendPaymentDeliveryFormButtonText}}
								</button>
								<button
									@click="close"
									class="ui-btn ui-btn-md ui-btn-link"
								>
									${main_core.Loc.getMessage('SALESCENTER_CANCEL')}
								</button>
							</template>
							<template v-else-if="mode === 'terminal_payment'">
								<button
									v-if="editable"
									@click="sendTerminalPaymentForm($event)"
									:class="terminalPaymentFormSubmitButtonClass"
									class="ui-btn ui-btn-md ui-btn-success"
								>
									${main_core.Loc.getMessage('SALESCENTER_CREATE_TERMINAL_PAYMENT')}
								</button>
								<button
									v-if="isTerminalViewModeSaveAllowed"
									@click="sendTerminalPaymentForm($event)"
									:class="terminalPaymentFormSubmitButtonClass"
									class="ui-btn ui-btn-md ui-btn-success"
								>
									${main_core.Loc.getMessage('SALESCENTER_SAVE')}
								</button>
								<button
									@click="close"
									class="ui-btn ui-btn-md ui-btn-link"
								>
									${main_core.Loc.getMessage('SALESCENTER_CANCEL')}
								</button>
							</template>
							<template v-else-if="mode === ModeDictionary.delivery">
								<template v-if="editable">
									<button
										@click="sendDeliveryForm($event)"
										:class="deliveryFormSubmitButtonClass"
										class="ui-btn ui-btn-md ui-btn-success"
									>
										${main_core.Loc.getMessage('SALESCENTER_CREATE_SHIPMENT')}
									</button>
									<button
										@click="close"
										class="ui-btn ui-btn-md ui-btn-link"
									>
										${main_core.Loc.getMessage('SALESCENTER_CANCEL')}
									</button>
								</template>
							</template>
						</div>
						<div v-if="this.order.errors.length > 0" ref="errorBlock"></div>
					</div>
				</template>
			</div>
			<div class="salescenter-app-pinner-anchor" :class="{ 'salescenter-app-pinner-anchor-hidden': !isPanelVisible }"></div>
		</div>
	`
	};

	class ApplicationModel extends ui_vue_vuex.VuexBuilderModel {
		/**
		 * @inheritDoc
		 */
		getName() {
			return 'application';
		}
		getState() {
			return {
				pages: []
			};
		}
		getGetters() {
			return {
				getPages: state => () => {
					return state.pages;
				}
			};
		}
		getMutations() {
			return {
				setPages: (state, payload) => {
					if (typeof payload.pages === 'object') {
						state.pages = payload.pages;
						this.saveState(state);
					}
				},
				removePage: (state, payload) => {
					if (typeof payload.page === 'object') {
						state.pages = state.pages.filter(page => {
							return !(payload.page.id && payload.page.id > 0 && page.id === payload.page.id || payload.page.landingId && payload.page.landingId > 0 && page.landingId === payload.page.landingId);
						});
						this.saveState(state);
					}
				},
				addPage: (state, payload) => {
					if (typeof payload.page === 'object') {
						state.pages.push(payload.page);
						this.saveState(state);
					}
				}
			};
		}
	}

	class DocumentSelectorModel extends ui_vue_vuex.VuexBuilderModel {
		/**
		 * @inheritDoc
		 */
		getName() {
			return 'documentSelector';
		}
		getActions() {
			return {
				addDocument({
					commit,
					dispatch
				}, {
					document
				}) {
					commit('addDocument', {
						document
					});
					dispatch('setBoundDocumentId', {
						boundDocumentId: document.id
					});
				},
				setBoundDocumentId({
					state,
					commit
				}, {
					boundDocumentId
				}) {
					if (state.paymentId > 0) {
						rest_client.rest.callMethod('crm.documentgenerator.document.bindToPayment', {
							id: boundDocumentId,
							paymentId: state.paymentId
						}).then(() => {
							commit('setBoundDocumentId', {
								boundDocumentId
							});
						}).catch(response => {
							console.error(response);
						});
					} else {
						commit('setBoundDocumentId', {
							boundDocumentId
						});
					}
				},
				loadTemplates({
					state,
					commit
				}) {
					if (Number(state.entityTypeId) <= 0 || Number(state.entityId) <= 0) {
						commit('setTemplates', {
							templates: []
						});
						return;
					}
					rest_client.rest.callMethod('crm.documentgenerator.template.listForItem', {
						entityTypeId: state.entityTypeId,
						entityId: state.entityId
					}).then(response => {
						if (response.answer.result.templates) {
							commit('setTemplates', {
								templates: response.answer.result.templates
							});
						}
					}).catch(response => {
						console.error(response);
					});
				}
			};
		}
		getState() {
			return {
				entityTypeId: null,
				entityId: null,
				paymentId: null,
				documents: [],
				templates: [],
				boundDocumentId: null,
				selectedTemplateId: null
			};
		}
		getGetters() {
			return {
				getTemplates: state => {
					return state.templates;
				},
				getDocuments: state => {
					return state.documents;
				},
				getBoundDocumentId: state => {
					return state.boundDocumentId;
				},
				getSelectedTemplateId: state => {
					return state.selectedTemplateId;
				}
			};
		}
		getMutations() {
			return {
				fillState: (state, payload) => {
					state.entityTypeId = payload.entityTypeId;
					state.entityId = payload.entityId;
					state.paymentId = payload.paymentId;
					state.documents = payload.documents;
					state.templates = payload.templates;
					state.boundDocumentId = payload.boundDocumentId;
					state.selectedTemplateId = payload.selectedTemplateId;
				},
				setTemplates: (state, payload) => {
					if (typeof payload.templates === 'object') {
						state.templates = payload.templates;
					}
				},
				setBoundDocumentId: (state, payload) => {
					if (typeof payload.boundDocumentId === 'number') {
						state.boundDocumentId = payload.boundDocumentId;
					}
				},
				setSelectedTemplateId: (state, payload) => {
					if (typeof payload.selectedTemplateId === 'number') {
						state.selectedTemplateId = payload.selectedTemplateId;
						state.boundDocumentId = null;
					}
				},
				addDocument: (state, payload) => {
					if (typeof payload.document === 'object') {
						const newDocument = payload.document;
						if (!newDocument.id) {
							return;
						}
						const documents = state.documents || [];
						let isUpdated = false;
						for (const index in documents) {
							if (documents[index].id === newDocument.id) {
								documents[index] = newDocument;
								isUpdated = true;
								break;
							}
						}
						if (!isUpdated) {
							documents.unshift(newDocument);
						}
						state.documents = documents;
					}
				}
			};
		}
	}

	class OrderCreationModel extends ui_vue_vuex.VuexBuilderModel {
		/**
		 * @inheritDoc
		 */
		getName() {
			return 'orderCreation';
		}
		getState() {
			return {
				currency: '',
				processingId: null,
				basket: [],
				basketVersion: 0,
				propertyValues: [],
				deliveryExtraServicesValues: [],
				expectedDelivery: null,
				deliveryResponsibleId: null,
				personTypeId: null,
				deliveryId: null,
				delivery: null,
				isEnabledSubmit: false,
				isSenderSelected: true,
				isCompilationMode: false,
				errors: [],
				total: {
					sum: null,
					discount: null,
					result: null
				},
				/**
				 * ID of selected pay systems available for order payment
				 */
				availablePaySystemsIds: [],
				paymentResponsibleId: null,
				isMobileInstalledForResponsible: false,
				responsiblePhoneNumbers: [],
				messageData: {},
				hasAvailableProducts: false
			};
		}
		getActions() {
			return {
				resetBasket({
					commit
				}) {
					commit('clearBasket');
				},
				setCurrency: ({
					commit
				}, payload) => {
					const currency = payload || '';
					commit('setCurrency', currency);
				},
				setDeliveryId: ({
					commit
				}, payload) => {
					commit('setDeliveryId', payload);
				},
				setDelivery: ({
					commit
				}, payload) => {
					commit('setDelivery', payload);
				},
				setPropertyValues: ({
					commit
				}, payload) => {
					commit('setPropertyValues', payload);
				},
				setDeliveryExtraServicesValues: ({
					commit
				}, payload) => {
					commit('setDeliveryExtraServicesValues', payload);
				},
				setExpectedDelivery: ({
					commit
				}, payload) => {
					commit('setExpectedDelivery', payload);
				},
				setDeliveryResponsibleId: ({
					commit
				}, payload) => {
					commit('setDeliveryResponsibleId', payload);
				},
				setPaymentResponsibleId: ({
					commit
				}, payload) => {
					commit('setPaymentResponsibleId', payload);
				},
				setMobileInstalledForResponsible: ({
					commit
				}, payload) => {
					commit('setMobileInstalledForResponsible', payload);
				},
				setResponsiblePhoneNumbers: ({
					commit
				}, payload) => {
					commit('setResponsiblePhoneNumbers', payload);
				},
				setPersonTypeId: ({
					commit
				}, payload) => {
					commit('setPersonTypeId', payload);
				},
				setAvailablePaySystemsIds: ({
					commit
				}, payload) => {
					commit('setAvailablePaySystemsIds', payload);
				},
				setMessageData: ({
					commit
				}, payload) => {
					commit('setMessageData', payload);
				},
				setHasAvailableProducts: ({
					commit
				}, payload) => {
					commit('setHasAvailableProducts', payload);
				}
			};
		}
		getGetters() {
			return {
				getBasket: state => index => {
					return state.basket;
				},
				isAllowedSubmit: state => {
					return state.isEnabledSubmit && state.isSenderSelected;
				},
				isSenderSelected: state => {
					return state.isSenderSelected;
				},
				isCompilationMode: state => {
					return state.isCompilationMode;
				},
				getTotal: state => {
					return state.total;
				},
				getDelivery: state => {
					return state.delivery;
				},
				getDeliveryId: state => {
					return state.deliveryId;
				},
				getPropertyValues: state => {
					return state.propertyValues;
				},
				getDeliveryExtraServicesValues: state => {
					return state.deliveryExtraServicesValues;
				},
				getExpectedDelivery: state => {
					return state.expectedDelivery;
				},
				getDeliveryResponsibleId: state => {
					return state.deliveryResponsibleId;
				},
				getPaymentResponsibleId: state => {
					return state.paymentResponsibleId;
				},
				isMobileInstalledForResponsible: state => {
					return state.isMobileInstalledForResponsible;
				},
				getResponsiblePhoneNumbers: state => {
					return state.responsiblePhoneNumbers;
				},
				getPersonTypeId: state => {
					return state.personTypeId;
				},
				getAvailablePaySystemsIds: state => {
					return state.availablePaySystemsIds;
				},
				getMessageData: state => {
					return state.messageData;
				},
				getHasAvailableProducts: state => {
					return state.hasAvailableProducts;
				}
			};
		}
		getMutations() {
			return {
				setBasket: (state, payload) => {
					state.basket = payload;
				},
				setTotal: (state, payload) => {
					state.total = Object.assign(state.total, payload);
				},
				clearBasket: (state, payload) => {
					state.basket = [];
					state.basketVersion++;
				},
				setErrors: (state, payload) => {
					state.errors = payload;
				},
				setDeliveryId: (state, deliveryId) => {
					state.deliveryId = deliveryId;
				},
				setDelivery: (state, delivery) => {
					state.delivery = delivery;
				},
				setPropertyValues: (state, propertyValues) => {
					state.propertyValues = propertyValues;
				},
				setDeliveryExtraServicesValues: (state, deliveryExtraServicesValues) => {
					state.deliveryExtraServicesValues = deliveryExtraServicesValues;
				},
				setExpectedDelivery: (state, expectedDelivery) => {
					state.expectedDelivery = expectedDelivery;
				},
				setDeliveryResponsibleId: (state, deliveryResponsibleId) => {
					state.deliveryResponsibleId = deliveryResponsibleId;
				},
				setPaymentResponsibleId: (state, paymentResponsibleId) => {
					state.paymentResponsibleId = paymentResponsibleId;
				},
				setMobileInstalledForResponsible: (state, isMobileInstalledForResponsible) => {
					state.isMobileInstalledForResponsible = isMobileInstalledForResponsible;
				},
				setResponsiblePhoneNumbers: (state, responsiblePhoneNumbers) => {
					state.responsiblePhoneNumbers = responsiblePhoneNumbers;
				},
				clearErrors: state => {
					state.errors = [];
				},
				setProcessingId: (state, payload) => {
					state.processingId = payload;
				},
				setCurrency: (state, payload) => {
					state.currency = payload;
				},
				setPersonTypeId: (state, payload) => {
					state.personTypeId = payload;
				},
				setAvailablePaySystemsIds: (state, payload) => {
					state.availablePaySystemsIds = payload;
				},
				setIsSenderSelected: (state, isSelected) => {
					state.isSenderSelected = isSelected;
				},
				enableSubmit: state => {
					state.isEnabledSubmit = true;
				},
				disableSubmit: state => {
					state.isEnabledSubmit = false;
				},
				enableCompilationMode: state => {
					state.isCompilationMode = true;
				},
				disableCompilationMode: state => {
					state.isCompilationMode = false;
				},
				setMessageData: (state, payload) => {
					state.messageData = {
						...state.messageData,
						...payload
					};
				},
				setHasAvailableProducts: (state, payload) => {
					state.hasAvailableProducts = payload;
				}
			};
		}
	}

	class MobileAppInstallPopup {
		constructor(options) {
			this.initSenders(options.sendersConfig);
			this.phoneNumbers = options.phoneNumbers;
			this.userId = options.userId;
			this.root = options.root;
			this.selectedPhoneNumber = this.phoneNumbers?.[0] ?? null;
			this.selectedSender = this.senders?.[0] ?? null;

			/** @type Popup  */
			this.mainPopup = null;
			/** @type Button */
			this.sendButton = null;
			this.sendersMenu = null;
			this.phoneMenu = null;
		}
		initSenders(sendersData) {
			this.sendersConfig = sendersData.find(item => item.code === 'sms_provider');
			this.senders = this.sendersConfig?.smsSenders;
		}
		render() {
			const popupContent = this.getPopupContent();
			const linkButton = new ui_buttons.Button({
				id: 'copy-install-link',
				color: ui_buttons.Button.Color.LINK,
				round: true,
				icon: ui_buttons.ButtonIcon.COPY,
				text: main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_BTN_LINK')
			});
			this.sendButton = new ui_buttons.Button({
				state: this.selectedPhoneNumber && this.selectedSender ? null : ui_buttons.ButtonState.DISABLED,
				color: ui_buttons.Button.Color.PRIMARY,
				round: true,
				text: main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_BTN_SEND'),
				onclick: () => {
					this.sendButton.setClocking();
					this.sendSms();
				}
			});
			this.mainPopup = new main_popup.Popup({
				className: 'salescenter-popup-mobile',
				overlay: true,
				content: popupContent,
				closeIcon: true,
				maxWidth: 666,
				buttons: [this.sendButton, linkButton],
				events: {
					onClose: () => {
						this.root.closeApplication();
					}
				}
			});
			this.mainPopup.show();
			this.bindCopyLink(linkButton);
			this.bindSelectors();
		}
		sendSms() {
			main_core.ajax.runAction('salescenter.terminalResponsible.sendLinkToMobileApp', {
				data: {
					userId: this.userId,
					phone: this.selectedPhoneNumber,
					senderId: this.selectedSender.id,
					entity: {
						entityTypeId: this.root.ownerTypeId,
						entityId: this.root.ownerId
					}
				}
			}).then(result => {
				this.mainPopup.close();
				this.root.closeApplication();
			});
		}
		bindCopyLink(linkButton) {
			BX.clipboard.bindCopyClick(linkButton.getContainer(), {
				text: this.root.options.mobileAppLink
			});
		}
		bindSelectors() {
			this.bindSendersSelector();
			this.bindPhoneSelector();
		}
		bindSendersSelector() {
			const sendersSelector = document.getElementById('senders-selector');
			if (this.selectedSender) {
				main_core.Event.bind(sendersSelector, 'click', () => {
					const menuItems = [];
					this.senders.forEach(sender => {
						menuItems.push({
							text: main_core.Text.encode(sender.name),
							onclick: () => {
								this.selectedSender = sender;
								sendersSelector.firstChild.innerText = main_core.Text.encode(this.selectedSender.name);
								this.sendersMenu?.close();
							}
						});
					});
					BX.PopupMenu.show('sender-menu', sendersSelector, menuItems, {
						offsetTop: 0,
						offsetLeft: 36,
						angle: {
							position: 'top',
							offset: 0
						}
					});
					this.sendersMenu = BX.PopupMenu.getCurrentMenu();
				});
			} else {
				main_core.Event.bind(sendersSelector, 'click', () => {
					BX.SidePanel.Instance.open(this.sendersConfig.connectUrl, {
						events: {
							onClose: () => {
								this.refresh();
							}
						}
					});
				});
			}
		}
		bindPhoneSelector() {
			const phoneSelector = document.getElementById('phone-selector');
			if (this.selectedPhoneNumber) {
				main_core.Event.bind(phoneSelector, 'click', () => {
					const menuItems = [];
					this.phoneNumbers.forEach(phoneNumber => {
						menuItems.push({
							text: main_core.Text.encode(phoneNumber),
							onclick: () => {
								this.selectedPhoneNumber = phoneNumber;
								phoneSelector.firstChild.innerText = main_core.Text.encode(this.selectedPhoneNumber);
								this.phoneMenu?.close();
							}
						});
					});
					BX.PopupMenu.show('phone-menu', phoneSelector, menuItems, {
						offsetTop: 0,
						offsetLeft: 36,
						angle: {
							position: 'top',
							offset: 0
						}
					});
					this.phoneMenu = BX.PopupMenu.getCurrentMenu();
				});
			} else {
				main_core.Event.bind(phoneSelector, 'click', () => {
					BX.SidePanel.Instance.open(`/company/personal/user/${this.userId}/`, {
						events: {
							onClose: () => {
								this.refresh();
							}
						}
					});
				});
			}
		}
		refresh() {
			main_core.ajax.runAction('salescenter.terminalResponsible.refreshDataForSendingLink', {
				data: {
					userId: this.userId
				}
			}).then(result => {
				this.initSenders(result.data.senders);
				this.phoneNumbers = result.data.phones;
				this.selectedPhoneNumber = this.phoneNumbers?.[0] ?? null;
				this.selectedSender = this.senders?.[0] ?? null;
				this.updateSendButtonState();
				this.updateContent();
			});
		}
		updateSendButtonState() {
			this.sendButton.setDisabled(!Boolean(this.selectedPhoneNumber && this.selectedSender));
		}
		updateContent() {
			this.mainPopup.setContent(this.getPopupContent());
			this.bindSelectors();
		}
		getPopupContent() {
			// all for the sake of localization
			let phoneAndServiceContent = '';
			if (this.selectedSender) {
				phoneAndServiceContent = main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_SENDER_AND_PHONE', {
					'[main]': '<div class="salescenter-popup-mobile__service">',
					'[/main]': '</div>',
					'[number]': '<div class="salescenter-popup-mobile__service-box"><div class="salescenter-popup-mobile__service-name">',
					'#NUMBER#': `
						</div>
						<div class="salescenter-popup-mobile__service-inline" id="phone-selector">
							<div class="salescenter-popup-mobile__service-value">
								${this.selectedPhoneNumber ? main_core.Text.encode(this.selectedPhoneNumber) : main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_ADD_PHONE')}
							</div>
					`,
					'[/number]': `
							${this.selectedPhoneNumber ? '<div class="ui-icon-set --chevron-down"></div>' : ''}
						</div>
						</div>
					`,
					'[service]': '<div class="salescenter-popup-mobile__service-box"><div class="salescenter-popup-mobile__service-name">',
					'#SERVICE#': `
						</div>
						<div class="salescenter-popup-mobile__service-inline" id="senders-selector">
							<div class="salescenter-popup-mobile__service-value">${main_core.Text.encode(this.selectedSender.name)}</div>
					`,
					'[/service]': `
							<div class="ui-icon-set --chevron-down"></div>
						</div>
						</div>
					`
				});
			} else {
				phoneAndServiceContent = main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_SENDER_AND_PHONE_NO_SENDER', {
					'[main]': '<div class="salescenter-popup-mobile__service">',
					'[/main]': '</div>',
					'[number]': '<div class="salescenter-popup-mobile__service-box"><div class="salescenter-popup-mobile__service-name">',
					'#NUMBER#': `
						</div>
						<div class="salescenter-popup-mobile__service-inline" id="phone-selector">
							<div class="salescenter-popup-mobile__service-value">
								${this.selectedPhoneNumber ? main_core.Text.encode(this.selectedPhoneNumber) : main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_ADD_PHONE')}
							</div>
					`,
					'[/number]': `
							${this.selectedPhoneNumber ? '<div class="ui-icon-set --chevron-down"></div>' : ''}
							</div>
						</div>
					`,
					'[service]': '<div class="salescenter-popup-mobile__service-box"><div class="salescenter-popup-mobile__service-inline" id="senders-selector"><div class="salescenter-popup-mobile__service-value">',
					'[/service]': `
							</div>
							<div class="ui-icon-set --chevron-down"></div>
						</div>
					`
				});
			}
			return main_core.Tag.render`
			<div class="salescenter-popup-mobile__wrap">
				<div class="salescenter-popup-mobile__icon-box">
					<div class="salescenter-popup-mobile__icon"></div>
				</div>
				<div class="salescenter-popup-mobile__content">
					<div class="salescenter-popup-mobile__title">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_MOBILE_POPUP_TITLE')}</div>
					${phoneAndServiceContent}
				</div>
			</div>
		`;
		}
	}

	class App {
		constructor(options = {
			dialogId: null,
			sessionId: null,
			lineId: null,
			orderAddPullTag: null,
			landingPublicationPullTag: null,
			landingUnPublicationPullTag: null,
			isFrame: true,
			isOrderPublicUrlAvailable: false,
			isCatalogAvailable: false,
			isOrderPublicUrlExists: false,
			isWithOrdersMode: true,
			documentSelector: DocumentSelectorParams | null
		}) {
			this.slider = BX.SidePanel.Instance.getTopSlider();
			this.dialogId = options.dialogId;
			this.sessionId = parseInt(options.sessionId);
			this.lineId = parseInt(options.lineId);
			this.orderAddPullTag = options.orderAddPullTag;
			this.landingPublicationPullTag = options.landingPublicationPullTag;
			this.landingUnPublicationPullTag = options.landingUnPublicationPullTag;
			this.paySystemList = options.paySystemList;
			this.cashboxList = options.cashboxList;
			this.options = options;
			this.isProgress = false;
			this.fillPagesTimeout = false;
			this.disableSendButton = false;
			this.context = '';
			this.fillPagesQueue = [];
			this.ownerTypeId = '';
			this.ownerId = '';
			this.orderId = parseInt(options.orderId);
			this.stageOnOrderPaid = null;
			this.stageOnDeliveryFinished = null;
			this.sendingMethod = '';
			this.sendingMethodDesc = {};
			this.orderPublicUrl = '';
			this.fileControl = options.fileControl;
			this.currencyCode = options.currencyCode;
			this.newCompilationId = null;
			this.assignedById = options.assignedById;
			this.isPhoneConfirmed = options.isPhoneConfirmed;
			if (main_core.Type.isString(options.stageOnOrderPaid)) {
				this.stageOnOrderPaid = options.stageOnOrderPaid;
			}
			if (main_core.Type.isString(options.stageOnDeliveryFinished)) {
				this.stageOnDeliveryFinished = options.stageOnDeliveryFinished;
			}
			if (main_core.Type.isBoolean(options.isFrame)) {
				this.isFrame = options.isFrame;
			} else {
				this.isFrame = true;
			}
			if (main_core.Type.isBoolean(options.isOrderPublicUrlAvailable)) {
				this.isOrderPublicUrlAvailable = options.isOrderPublicUrlAvailable;
			} else {
				this.isOrderPublicUrlAvailable = false;
			}
			if (main_core.Type.isBoolean(options.isOrderPublicUrlExists)) {
				this.isOrderPublicUrlExists = options.isOrderPublicUrlExists;
			} else {
				this.isOrderPublicUrlExists = false;
			}
			if (main_core.Type.isString(options.orderPublicUrl)) {
				this.orderPublicUrl = options.orderPublicUrl;
			}
			if (main_core.Type.isBoolean(options.isCatalogAvailable)) {
				this.isCatalogAvailable = options.isCatalogAvailable;
			} else {
				this.isCatalogAvailable = false;
			}
			if (main_core.Type.isBoolean(options.isWithOrdersMode)) {
				this.isWithOrdersMode = options.isWithOrdersMode;
			} else {
				this.isWithOrdersMode = false;
			}
			if (main_core.Type.isBoolean(options.disableSendButton)) {
				this.disableSendButton = options.disableSendButton;
			}
			if (options.ownerTypeId) {
				this.ownerTypeId = options.ownerTypeId;
			}
			if (options.ownerId) {
				this.ownerId = options.ownerId;
			}
			if (main_core.Type.isString(options.context) && options.context.length > 0) {
				this.context = options.context;
			} else if (this.sessionId && this.dialogId) {
				this.context = ContextDictionary.imOpenlines;
			}
			if (main_core.Type.isBoolean(options.isPaymentsLimitReached)) {
				this.isPaymentsLimitReached = options.isPaymentsLimitReached;
			} else {
				this.isPaymentsLimitReached = false;
			}
			if (!main_core.Type.isUndefined(options.sendingMethod)) {
				this.sendingMethod = options.sendingMethod;
			}
			if (!main_core.Type.isUndefined(options.sendingMethodDesc)) {
				this.sendingMethodDesc = this.options.sendingMethodDesc;
			}
			this.isPaymentCreationAvailable = this.sessionId > 0 && this.dialogId.length > 0 || this.ownerTypeId && this.ownerId;
			this.connector = main_core.Type.isString(options.connector) ? options.connector : '';
			if (main_core.Type.isPlainObject(options.documentSelector)) {
				this.documentSelector = options.documentSelector;
				this.documentSelector.paymentId = this.options.paymentId;
			}
			main_core.Event.ready(() => {
				this.pull = BX.PULL;
				this.initPull();
				this.isSiteExists = salescenter_manager.Manager.isSiteExists;
			});
			App.initStore().then(result => this.initTemplate(result)).catch(error => App.showError(error));
		}
		static initStore() {
			const builder = new ui_vue_vuex.VuexBuilder();
			return builder.addModel(ApplicationModel.create()).addModel(OrderCreationModel.create()).addModel(DocumentSelectorModel.create()).useNamespace(true).build();
		}
		sendMessageAnalytic() {
			const messageData = this.store.getters['orderCreation/getMessageData'];
			const channelId = messageData?.channelId;
			if (!channelId) {
				return;
			}
			const eventData = crm_integration_analytics.Builder.Communication.Editor.SendEvent.createDefault(channelId).setSection(crm_integration_analytics.Dictionary.SECTION_SALESCENTER_SLIDER).buildData();
			ui_analytics.sendData(eventData);
		}
		initPull() {
			if (this.pull) {
				if (main_core.Type.isString(this.orderAddPullTag)) {
					this.pull.subscribe({
						moduleId: 'salescenter',
						command: this.orderAddPullTag,
						callback: params => {
							if (parseInt(params.sessionId) === this.sessionId && params.orderId > 0) {
								salescenter_manager.Manager.showOrdersListAfterCreate(params.orderId);
							}
						}
					});
				}
				if (main_core.Type.isString(this.landingPublicationPullTag)) {
					this.pull.subscribe({
						moduleId: 'salescenter',
						command: this.landingPublicationPullTag,
						callback: params => {
							if (parseInt(params.landingId) > 0) {
								this.fillPages();
							}
							if (params.hasOwnProperty('isOrderPublicUrlAvailable') && main_core.Type.isBoolean(params.isOrderPublicUrlAvailable)) {
								this.isOrderPublicUrlAvailable = params.isOrderPublicUrlAvailable;
								this.isOrderPublicUrlExists = true;
							}
						}
					});
				}
				if (main_core.Type.isString(this.landingUnPublicationPullTag)) {
					this.pull.subscribe({
						moduleId: 'salescenter',
						command: this.landingUnPublicationPullTag,
						callback: params => {
							if (parseInt(params.landingId) > 0) {
								this.fillPages();
							}
							if (params.hasOwnProperty('isOrderPublicUrlAvailable') && main_core.Type.isBoolean(params.isOrderPublicUrlAvailable)) {
								this.isOrderPublicUrlAvailable = params.isOrderPublicUrlAvailable;
								this.isOrderPublicUrlExists = true;
							}
						}
					});
				}
			}
		}
		initTemplate(result) {
			return new Promise(resolve => {
				const context = this;
				this.store = result.store;
				this.templateEngine = ui_vue.Vue.create({
					el: document.getElementById('salescenter-app-root'),
					components: {
						'chat': Chat,
						'deal': Deal
					},
					template: this.isPaymentMode() ? `<deal :key="componentKey" @on-reload="reload"/>` : `<chat :key="componentKey" @on-reload="reload"/>`,
					store: this.store,
					created() {
						this.$app = context;
						this.$nodes = {
							footer: document.getElementById('footer'),
							leftPanel: document.getElementById('left-panel'),
							title: document.getElementById('pagetitle'),
							paymentsLimit: document.getElementById('salescenter-payment-limit-container'),
							orderSelector: document.getElementById('salescenter-app-order-selector')
						};
						this.initOrderSelector();
						if (context.documentSelector) {
							this.$store.commit('documentSelector/fillState', context.documentSelector);
						}
						if (this.$app.options.showCompilationModeSwitcher === 'N') {
							this.$store.commit('orderCreation/enableCompilationMode');
						}
					},
					mounted() {
						resolve();
					},
					methods: {
						reload(arParams) {
							this.$root.$app.getLoader().show(document.body);
							main_core.ajax.runComponentAction('bitrix:salescenter.app', 'getComponentResult', {
								mode: 'class',
								data: {
									arParams
								}
							}).then(function (response) {
								if (response.data) {
									this.$root.$app.options = response.data;
									this.$root.$app.orderId = this.$root.$app.options.orderId;
									this.componentKey += 1;
									this.$root.$app.getLoader().hide();
								}
							}.bind(this));
						},
						initOrderSelector() {
							try {
								if (this.$app.options.orderList.length < 2 || this.$app.options.templateMode !== 'create' || !this.$app.options.orderId) {
									return;
								}
								const orderSelectorBtn = this.$nodes.orderSelector.querySelector('.salescenter-app-order-selector-text');
								if (!orderSelectorBtn) {
									return;
								}
								orderSelectorBtn.innerText = main_core.Loc.getMessage('SALESCENTER_ORDER_SELECTOR_ORDER_NUM').replace('#ORDER_ID#', this.$app.options.orderId);
								orderSelectorBtn.setAttribute('data-hint', main_core.Loc.getMessage('SALESCENTER_ORDER_SELECTOR_TOOLTIP'));
								let popupMenu;
								let menuItems = [];
								this.$app.options.orderList.map(orderId => {
									const orderCaption = main_core.Loc.getMessage('SALESCENTER_ORDER_SELECTOR_ORDER_NUM').replace('#ORDER_ID#', orderId);
									menuItems.push({
										text: orderCaption,
										onclick: event => {
											popupMenu.close();
											orderSelectorBtn.innerText = orderCaption;
											this.reload({
												context: this.$app.options.context,
												orderId: orderId,
												ownerTypeId: this.$app.options.ownerTypeId,
												ownerId: this.$app.options.ownerId,
												templateMode: this.$app.options.templateMode,
												mode: this.$app.options.mode,
												initialMode: this.$app.options.initialMode
											});
										}
									});
								});
								popupMenu = main_popup.MenuManager.create({
									id: 'deal-order-selector',
									bindElement: orderSelectorBtn,
									items: menuItems
								});
								this.$nodes.orderSelector.classList.remove('is-hidden');
								this.$nodes.orderSelector.addEventListener('click', e => {
									e.preventDefault();
									popupMenu.show();
									BX.UI.Hint.hide();
								});
								BX.UI.Hint.init(this.$nodes.orderSelector);
							} catch (err) {
								//
							}
						}
					},
					data() {
						return {
							componentKey: 0
						};
					}
				});
			});
		}
		closeApplication() {
			if (this.slider) {
				this.slider.close();
			}
		}
		fillPages() {
			return new Promise(resolve => {
				if (this.isProgress) {
					this.fillPagesQueue.push(resolve);
				} else {
					if (this.fillPagesTimeout) {
						clearTimeout(this.fillPagesTimeout);
					}
					this.fillPagesTimeout = setTimeout(() => {
						this.startProgress();
						rest_client.rest.callMethod('salescenter.page.list', {}).then(result => {
							this.store.commit('application/setPages', {
								pages: result.answer.result.pages
							});
							this.stopProgress();
							resolve();
							this.fillPagesQueue.forEach(item => {
								item();
							});
							this.fillPagesQueue = [];
						});
					}, 100);
				}
			});
		}
		static showError(error) {
			// console.error(error);
		}
		getLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					size: 200,
					mode: 'custom'
				});
			}
			return this.loader;
		}
		showLoader() {
			if (this.templateEngine) {
				this.getLoader().show(this.templateEngine.$el);
			}
		}
		hideLoader() {
			this.getLoader().hide();
		}
		startProgress(buttonEvent = null) {
			this.isProgress = true;
			this.templateEngine.$emit('on-start-progress');
			this.showLoader();
			if (main_core.Type.isDomNode(buttonEvent)) {
				buttonEvent.classList.add('ui-btn-wait');
			}
		}
		stopProgress(buttonEvent = null) {
			this.isProgress = false;
			this.templateEngine.$emit('on-stop-progress');
			this.hideLoader();
			if (main_core.Type.isDomNode(buttonEvent)) {
				buttonEvent.classList.remove('ui-btn-wait');
			}
		}
		hidePage(page) {
			return new Promise((resolve, reject) => {
				let promise;
				if (page.landingId > 0) {
					promise = salescenter_manager.Manager.hidePage(page);
				} else {
					promise = salescenter_manager.Manager.deleteUrl(page);
				}
				promise.then(() => {
					this.store.commit('application/removePage', {
						page
					});
					resolve();
				}).catch(result => {
					App.showError(result.answer.error_description);
					reject(result.answer.error_description);
				});
			});
		}
		sendPage(pageId) {
			if (this.isProgress) {
				return;
			}
			if (this.disableSendButton) {
				return;
			}
			const pages = this.store.getters['application/getPages']();
			let page;
			for (let index in pages) {
				if (pages.hasOwnProperty(index) && pages[index].id === pageId) {
					page = pages[index];
					break;
				}
			}
			let source = 'other';
			if (page.landingId > 0) {
				if (parseInt(page.siteId) === parseInt(salescenter_manager.Manager.connectedSiteId)) {
					source = 'landing_store_chat';
				} else {
					source = 'landing_other';
				}
			}
			if (!this.dialogId) {
				this.slider.data.set('action', 'sendPage');
				this.slider.data.set('page', page);
				this.slider.data.set('pageId', pageId);
				if (this.context === ContextDictionary.sms) {
					this.startProgress();
					BX.Salescenter.Manager.addAnalyticAction({
						analyticsLabel: 'salescenterSendSms',
						context: this.context,
						source: source,
						type: page.isWebform ? 'form' : 'info',
						code: page.code
					}).then(() => {
						this.stopProgress();
						this.closeApplication();
					});
				} else {
					this.closeApplication();
				}
				return;
			}
			this.startProgress();
			main_core.ajax.runAction('salescenter.page.send', {
				analyticsLabel: 'salescenterSendChat',
				getParameters: {
					dialogId: this.dialogId,
					context: this.context,
					source: source,
					type: page.isWebform ? 'form' : 'info',
					connector: this.connector,
					code: page.code
				},
				data: {
					id: pageId,
					options: {
						dialogId: this.dialogId,
						sessionId: this.sessionId
					}
				}
			}).then(() => {
				this.stopProgress();
				this.closeApplication();
			}).catch(result => {
				App.showError(result.errors.pop().message);
				this.stopProgress();
			});
		}
		sendCompilation(buttonEvent = null) {
			if (!this.isPaymentCreationAvailable) {
				this.closeApplication();
				return;
			}
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return;
			}
			this.startProgress(buttonEvent);
			let options = {
				dialogId: this.dialogId,
				sendingMethod: this.sendingMethod,
				sendingMethodDesc: this.sendingMethodDesc,
				ownerTypeId: this.ownerTypeId,
				ownerId: this.ownerId,
				connector: this.connector,
				sessionId: this.sessionId,
				compilationId: this.newCompilationId,
				editable: this.options.templateMode === 'create',
				messageData: this.getMessageDataForBackend()
			};
			if (this.stageOnOrderPaid !== null) {
				options.stageOnOrderPaid = this.stageOnOrderPaid;
			}
			if (this.stageOnDeliveryFinished !== null) {
				options.stageOnDeliveryFinished = this.stageOnDeliveryFinished;
			}
			this.sendCompilationAjaxAction(buttonEvent, options);
		}
		publishShop() {
			if (!this.isPhoneConfirmed) {
				return;
			}
			this.showLoader();
			landing_backend.Backend.getInstance().action('Site::publication', {
				id: salescenter_manager.Manager.connectedSiteId
			}).then(() => {
				this.slider.reload();
			}).catch(data => {
				this.getLoader().hide();
				if (data.type === 'error' && !main_core.Type.isUndefined(data.result[0])) {
					const errorCode = data.result[0].error;
					switch (errorCode) {
						case 'PUBLIC_SITE_REACHED':
							{
								salescenter_manager.Manager.openLimitShopNumberInfoHelper();
								break;
							}
						case 'PUBLIC_SITE_REACHED_FREE':
							{
								salescenter_manager.Manager.openFreeTarifInfoHelper();
								break;
							}
						case 'FREE_DOMAIN_IS_NOT_ALLOWED':
							{
								salescenter_manager.Manager.openFreeDomenInfoHelper();
								break;
							}
						case 'PHONE_NOT_CONFIRMED':
							{
								this.showPhoneConfirmPopup();
								break;
							}
						case 'EMAIL_NOT_CONFIRMED':
							{
								this.showEmailConfirmPopup();
								break;
							}
						default:
							{
								ui_dialogs_messagebox.MessageBox.alert(data.result[0].error_description);
							}
					}
				}
			});
		}
		confirmPhoneNumber() {
			if (!BX.Type.isObject(bitrix24_phoneverify.PhoneVerify)) {
				return;
			}
			bitrix24_phoneverify.PhoneVerify.getInstance().setEntityType('landing_site').setEntityId(salescenter_manager.Manager.connectedSiteId).startVerify({
				mandatory: false,
				callback: verified => {
					if (verified) {
						this.isPhoneConfirmed = true;
						main_core_events.EventEmitter.emit('BX.Salescenter.App::onPhoneConfirmed');
					}
				}
			});
		}
		showPhoneConfirmPopup() {
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('SALESCENTER_PHONE_CONFIRMATION_POPUP_MESSAGE'), main_core.Loc.getMessage('SALESCENTER_PHONE_CONFIRMATION_POPUP_TITLE'), messageBox => {
				messageBox.close();
				this.confirmPhoneNumber();
			}, main_core.Loc.getMessage('SALESCENTER_CONFIRMATION_POPUP_OK_CAPTION'), messageBox => messageBox.close(), main_core.Loc.getMessage('SALESCENTER_CONFIRMATION_POPUP_CANCEL_CAPTION'));
		}
		showEmailConfirmPopup() {
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('SALESCENTER_EMAIL_CONFIRMATION_POPUP_MESSAGE'), main_core.Loc.getMessage('SALESCENTER_EMAIL_CONFIRMATION_POPUP_TITLE'), messageBox => {
				messageBox.close();
				salescenter_manager.Manager.openConfirmEmailInfoHelper();
			}, main_core.Loc.getMessage('SALESCENTER_CONFIRMATION_POPUP_OK_CAPTION'), messageBox => messageBox.close(), main_core.Loc.getMessage('SALESCENTER_CONFIRMATION_POPUP_CANCEL_CAPTION'));
		}
		sendCompilationAjaxAction(buttonEvent, options) {
			const basketItems = this.store.getters['orderCreation/getBasket']();
			const productIds = basketItems.map(basketItem => {
				return basketItem.skuId;
			});
			main_core.ajax.runAction('salescenter.compilation.sendCompilation', {
				data: {
					productIds,
					options
				},
				analyticsLabel: 'salescenterCreateCompilation'
			}).then(result => {
				this.sendMessageAnalytic();
				this.store.dispatch('orderCreation/resetBasket');
				this.stopProgress(buttonEvent);
				if (result.data && result.data.compilation) {
					this.slider.data.set('action', 'sendCompilation');
					this.slider.data.set('compilation', result.data.compilation);
				}
				this.closeApplication();
				this.emitGlobalEvent('salescenter.app:oncompilationcreated');
			}).catch(data => {
				data.errors.forEach(error => {
					alert(error.message);
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
			});
		}
		sendShipment(buttonEvent) {
			if (!this.isPaymentCreationAvailable) {
				this.closeApplication();
				return null;
			}
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return null;
			}
			this.startProgress(buttonEvent);
			let data = {
				ownerTypeId: this.ownerTypeId,
				ownerId: this.ownerId,
				orderId: this.orderId,
				deliveryId: this.store.getters['orderCreation/getDeliveryId'],
				deliveryPrice: this.store.getters['orderCreation/getDelivery'],
				expectedDeliveryPrice: this.store.getters['orderCreation/getExpectedDelivery'],
				deliveryResponsibleId: this.store.getters['orderCreation/getDeliveryResponsibleId'],
				personTypeId: this.store.getters['orderCreation/getPersonTypeId'],
				shipmentPropValues: this.store.getters['orderCreation/getPropertyValues'],
				deliveryExtraServicesValues: this.store.getters['orderCreation/getDeliveryExtraServicesValues']
			};
			if (this.stageOnDeliveryFinished !== null) {
				data.stageOnDeliveryFinished = this.stageOnDeliveryFinished;
			}
			main_core.ajax.runAction('salescenter.order.createShipment', {
				data: {
					basketItems: this.store.getters['orderCreation/getBasket'](),
					options: data
				},
				analyticsLabel: 'salescenterCreateShipment'
			}).then(result => {
				this.store.dispatch('orderCreation/resetBasket');
				this.stopProgress(buttonEvent);
				if (result.data) {
					if (result.data.order) {
						this.slider.data.set('order', result.data.order);
					}
					if (result.data.deal) {
						this.slider.data.set('deal', result.data.deal);
					}
				}
				this.closeApplication();
				this.emitGlobalEvent('salescenter.app:onshipmentcreated');
			}).catch(data => {
				data.errors.forEach(error => {
					alert(error.message);
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
			});
		}
		sendPayment(buttonEvent, skipPublicMessage = 'n') {
			if (!this.isPaymentCreationAvailable) {
				this.closeApplication();
				return null;
			}
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return null;
			}
			this.startProgress(buttonEvent);
			const data = {
				dialogId: this.dialogId,
				sendingMethod: this.sendingMethod,
				sendingMethodDesc: this.sendingMethodDesc,
				sessionId: this.sessionId,
				lineId: this.lineId,
				ownerTypeId: this.ownerTypeId,
				orderId: this.orderId,
				ownerId: this.ownerId,
				mode: this.options.mode,
				skipPublicMessage,
				deliveryId: this.store.getters['orderCreation/getDeliveryId'],
				deliveryPrice: this.store.getters['orderCreation/getDelivery'],
				expectedDeliveryPrice: this.store.getters['orderCreation/getExpectedDelivery'],
				deliveryResponsibleId: this.store.getters['orderCreation/getDeliveryResponsibleId'],
				personTypeId: this.store.getters['orderCreation/getPersonTypeId'],
				shipmentPropValues: this.store.getters['orderCreation/getPropertyValues'],
				deliveryExtraServicesValues: this.store.getters['orderCreation/getDeliveryExtraServicesValues'],
				availablePaySystemsIds: this.store.getters['orderCreation/getAvailablePaySystemsIds'],
				connector: this.connector,
				context: this.context,
				currency: this.currencyCode,
				assignedById: this.assignedById,
				messageData: this.getMessageDataForBackend()
			};
			if (this.documentSelector) {
				data.boundDocumentId = this.store.getters['documentSelector/getBoundDocumentId'];
				data.selectedTemplateId = this.store.getters['documentSelector/getSelectedTemplateId'];
			}
			if (this.stageOnOrderPaid !== null) {
				data.stageOnOrderPaid = this.stageOnOrderPaid;
			}
			if (this.stageOnDeliveryFinished !== null) {
				data.stageOnDeliveryFinished = this.stageOnDeliveryFinished;
			}
			main_core.ajax.runAction('salescenter.order.createPayment', {
				data: {
					basketItems: this.store.getters['orderCreation/getBasket'](),
					options: data
				},
				analyticsLabel: this.context === ContextDictionary.deal ? 'salescenterCreatePaymentSms' : 'salescenterCreatePayment',
				getParameters: {
					dialogId: this.dialogId,
					context: this.context,
					connector: this.connector,
					skipPublicMessage: skipPublicMessage
				}
			}).then(result => {
				this.sendMessageAnalytic();
				this.store.dispatch('orderCreation/resetBasket');
				this.stopProgress(buttonEvent);
				if (skipPublicMessage === 'y') {
					let notify = {
						content: main_core.Loc.getMessage('SALESCENTER_ORDER_CREATE_NOTIFICATION').replace('#ORDER_ID#', result.data.order.number)
					};
					notify.actions = [{
						title: main_core.Loc.getMessage('SALESCENTER_VIEW'),
						events: {
							click() {
								salescenter_manager.Manager.showOrderAdd(result.data.order.id);
							}
						}
					}];
					BX.UI.Notification.Center.notify(notify);
					salescenter_manager.Manager.showOrdersList({
						orderId: result.data.order.id,
						ownerId: this.ownerId,
						ownerTypeId: this.ownerTypeId,
						context: this.context
					});
				} else {
					this.slider.data.set('action', 'sendPayment');
					this.slider.data.set('order', result.data.order);
					if (result.data.deal) {
						this.slider.data.set('deal', result.data.deal);
					}
					if (result.data.entity) {
						this.slider.data.set('entity', result.data.entity);
					}
					this.closeApplication();
				}
				this.emitGlobalEvent('salescenter.app:onpaymentcreated');
			}).catch(data => {
				data.errors.forEach(error => {
					top.BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(error.message)
					});
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
				if (this.needCloseApplication(data.errors)) {
					this.closeApplication();
				}
			});
		}
		sendTerminalPayment(buttonEvent) {
			if (!this.isPaymentCreationAvailable) {
				this.closeApplication();
				return null;
			}
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return null;
			}
			this.startProgress(buttonEvent);
			const data = {
				ownerTypeId: this.ownerTypeId,
				ownerId: this.ownerId,
				orderId: this.orderId,
				paymentResponsibleId: this.store.getters['orderCreation/getPaymentResponsibleId'],
				context: this.context,
				currency: this.currencyCode,
				assignedById: this.assignedById
			};
			if (this.stageOnOrderPaid !== null) {
				data.stageOnOrderPaid = this.stageOnOrderPaid;
			}
			const isMobileInstalledForResponsible = this.store.getters['orderCreation/isMobileInstalledForResponsible'];
			main_core.ajax.runAction('salescenter.order.createTerminalPayment', {
				data: {
					basketItems: this.store.getters['orderCreation/getBasket'](),
					options: data
				},
				analyticsLabel: 'salescenterCreateTerminalPayment',
				getParameters: {
					context: this.context
				}
			}).then(result => {
				this.store.dispatch('orderCreation/resetBasket');
				this.stopProgress(buttonEvent);
				this.slider.data.set('action', 'sendPayment');
				this.slider.data.set('order', result.data.order);
				if (result.data.deal) {
					this.slider.data.set('deal', result.data.deal);
				}
				if (result.data.entity) {
					this.slider.data.set('entity', result.data.entity);
				}
				if (isMobileInstalledForResponsible) {
					this.closeApplication();
				} else {
					this.showMobileAppInstallLinkPopup();
				}
				this.emitGlobalEvent('salescenter.app:onterminalpaymentcreated');
			}).catch(data => {
				data.errors.forEach(error => {
					top.BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(error.message)
					});
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
				if (this.needCloseApplication(data.errors)) {
					this.closeApplication();
				}
			});
		}
		showMobileAppInstallLinkPopup() {
			const responsiblePhoneNumbers = this.store.getters['orderCreation/getResponsiblePhoneNumbers'];
			new MobileAppInstallPopup({
				sendersConfig: this.options.senders,
				phoneNumbers: responsiblePhoneNumbers,
				userId: this.store.getters['orderCreation/getPaymentResponsibleId'],
				root: this
			}).render();
		}
		updateTerminalPayment(buttonEvent) {
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return null;
			}
			this.startProgress(buttonEvent);
			const data = {
				paymentResponsibleId: this.store.getters['orderCreation/getPaymentResponsibleId']
			};
			main_core.ajax.runAction('salescenter.order.updateTerminalPayment', {
				data: {
					paymentId: this.options.paymentId,
					options: data
				},
				analyticsLabel: 'salescenterUpdateTerminalPayment',
				getParameters: {
					context: this.context
				}
			}).then(result => {
				this.store.dispatch('orderCreation/resetBasket');
				this.stopProgress(buttonEvent);
				this.slider.data.set('action', 'sendPayment');
				this.slider.data.set('order', result.data.order);
				if (result.data.deal) {
					this.slider.data.set('deal', result.data.deal);
				}
				if (result.data.entity) {
					this.slider.data.set('entity', result.data.entity);
				}
				this.closeApplication();
				this.emitGlobalEvent('salescenter.app:onterminalpaymentupdated');
			}).catch(data => {
				data.errors.forEach(error => {
					top.BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(error.message)
					});
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
				if (this.needCloseApplication(data.errors)) {
					this.closeApplication();
				}
			});
		}
		openMobileAppPopup() {
			const popupIconClass = this.options.currentLanguage === 'ru' ? 'salescenter-popup-qr__icon --ru' : 'salescenter-popup-qr__icon';

			// the mobile app popup goes here
			const popupContent = main_core.Tag.render`
			<div class="salescenter-popup-qr__box">
				<div class="salescenter-popup-qr__title">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_TITLE')}</div>
				<div class="salescenter-popup-qr__desc">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_DESC')}</div>
				<div class="salescenter-popup-qr__content">
					<div class="salescenter-popup-qr__code"></div>
					<ul class="salescenter-popup-qr__list">
						<li class="salescenter-popup-qr__list_item">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_LIST_ITEM_1')}</li>
						<li class="salescenter-popup-qr__list_item">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_LIST_ITEM_2')}</li>
						<li class="salescenter-popup-qr__list_item">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_LIST_ITEM_3')}</li>
						<li class="salescenter-popup-qr__list_item">${main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_LIST_ITEM_4')}</li>
					</ul>
					<div class="salescenter-popup-qr__icon_box">
						<div class="${popupIconClass}"></div>
					</div>
				</div>
			</div>		
		`;
			const mobilePopup = new main_popup.Popup({
				className: 'salescenter-popup-qr__wrap',
				content: popupContent,
				overlay: true,
				closeIcon: true,
				maxWidth: 725,
				autoHide: true,
				cacheable: false,
				buttons: [new ui_buttons.Button({
					color: ui_buttons.Button.Color.PRIMARY,
					text: main_core.Loc.getMessage('SALESCENTER_JS_POPUP_CLOSE'),
					onclick: () => {
						mobilePopup.close();
					}
				}), new ui_buttons.Button({
					color: ui_buttons.Button.Color.LINK,
					text: main_core.Loc.getMessage('SALESCENTER_TERMINAL_QR_POPUP_BUTTON_ABOUT'),
					onclick: () => {
						salescenter_manager.Manager.openHowTerminalWorks();
					}
				})]
			});
			mobilePopup.show();
			this.getQRCode();
		}
		getQRCode() {
			const qrNode = document.querySelector('.salescenter-popup-qr__code');
			return new QRCode(qrNode, {
				text: this.options.mobileAppLink,
				width: 143,
				height: 143
			});
		}
		needCloseApplication(errors) {
			let alwaysOpen = errors.filter(error => {
				return error.code < 1 || error.code > 100;
			}).length >= 1;
			return alwaysOpen === false;
		}
		resendPayment(buttonEvent) {
			if (!this.isPaymentCreationAvailable) {
				this.closeApplication();
				return null;
			}
			if (!this.store.getters['orderCreation/isAllowedSubmit'] || this.isProgress) {
				return null;
			}
			this.startProgress(buttonEvent);
			const options = {
				sendingMethod: this.sendingMethod,
				sendingMethodDesc: this.sendingMethodDesc,
				stageOnOrderPaid: this.stageOnOrderPaid,
				ownerTypeId: this.ownerTypeId,
				ownerId: this.ownerId,
				messageData: this.getMessageDataForBackend()
			};
			if (this.documentSelector) {
				options.boundDocumentId = this.store.getters['documentSelector/getBoundDocumentId'];
				options.selectedTemplateId = this.store.getters['documentSelector/getSelectedTemplateId'];
			}
			main_core.ajax.runAction('salescenter.order.resendPayment', {
				data: {
					orderId: this.orderId,
					paymentId: this.options.paymentId,
					shipmentId: this.options.shipmentId,
					options
				},
				getParameters: {
					context: this.context
				}
			}).then(result => {
				this.sendMessageAnalytic();
				this.stopProgress(buttonEvent);
				this.closeApplication();
				this.emitGlobalEvent('salescenter.app:onpaymentresend');
			}).catch(data => {
				data.errors.forEach(error => {
					alert(error.message);
				});
				this.stopProgress(buttonEvent);
				App.showError(data);
			});
		}
		hideNoPaymentSystemsBanner() {
			const userOptionName = this.options.orderCreationOption || false;
			const userOptionKeyName = this.options.paySystemBannerOptionName || false;
			if (userOptionName && userOptionKeyName) {
				BX.userOptions.save('salescenter', userOptionName, userOptionKeyName, 'Y');
			}
		}
		getOrdersCount() {
			if (this.sessionId > 0) {
				return rest_client.rest.callMethod('salescenter.order.getActiveOrdersCount', {
					sessionId: this.sessionId
				});
			} else {
				return new Promise((resolve, reject) => {});
			}
		}
		getPaymentsCount() {
			if (this.sessionId > 0) {
				return rest_client.rest.callMethod('salescenter.order.getActivePaymentsCount', {
					sessionId: this.sessionId
				});
			} else {
				return new Promise((resolve, reject) => {});
			}
		}
		hasClientContactInfo() {
			if (this.options.sendingMethod === 'chat') {
				return this.options.dialogId !== '';
			}
			return this.options.contactPhone !== '';
		}
		emitGlobalEvent(eventName, data) {
			main_core_events.EventEmitter.emit(eventName, data);
			BX.SidePanel.Instance.postMessage(this.slider, eventName, data);
		}
		isPaymentMode() {
			return this.context === ContextDictionary.deal || this.context === ContextDictionary.smartInvoice || this.context === ContextDictionary.terminalList;
		}
		getMessageDataForBackend() {
			const messageData = this.store.getters['orderCreation/getMessageData'];
			if (!messageData?.body) {
				return messageData;
			}
			let body = messageData.body;
			// in case of double patterns like #LINK#LINK#
			while (body.includes('#LINK#')) {
				body = body.replace('#LINK#', '# LINK#');
			}
			return {
				...messageData,
				body: crm_messagesender_editor.replaceCustomMessagePlaceholders(body, code => {
					if (code === 'LINK') {
						return '#LINK#';
					}
					return null;
				})
			};
		}
	}

	exports.App = App;

})(this.BX.Salescenter = this.BX.Salescenter || {}, BX, BX.Crm.MessageSender.Editor, BX.Event, BX, BX.Main, BX, BX.Salescenter, BX.UI, BX.Bitrix24, BX, BX, BX.UI.Notification, BX.UI.Dialogs, BX, BX, BX.Salescenter.Component, BX.Salescenter.Tile, BX.Salescenter, BX.Salescenter, BX.Salescenter.Component.StageBlock, BX.Salescenter.Component.StageBlock, BX.Catalog, BX, BX.Salescenter, BX, BX.Salescenter.Component.StageBlock, BX.Salescenter.Component.StageBlock, BX.Salescenter.AutomationStage, BX.Salescenter.Component.StageBlock.TimeLine, BX, BX, BX, BX, BX, BX.Crm.Integration.Analytics, BX.Crm, BX.Salescenter, BX.UI.EntitySelector, BX.Currency, BX.Landing, BX.Landing, window, BX.UI.Analytics);
//# sourceMappingURL=app.bundle.js.map
