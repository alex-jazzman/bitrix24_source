/* eslint-disable */
(function (ui_vue, sale_checkout_const, main_core_events, sale_checkout_view_mixins, sale_checkout_lib, sale_checkout_view_element_button, ui_a11y, sale_checkout_view_element_input, sale_checkout_view_element_animatePrice, currency_currencyCore, main_core, catalog_skuTree) {
	'use strict';

	const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
	const shutterSelector = '.checkout-basket-item-backdrop-container';
	const restoreButton = ['.checkout-resotre-btn'];
	const removeButtons = ['.checkout-basket-item-remove-btn', '.checkout-basket-item-remove-dots-btn'];
	const changeVariationButton = ['.checkout-basket-item-change-btn'];

	/**
	 * Only real tab stops count: a mouse-only link has a negative tabindex yet still takes focus.
	 */
	function getFocusableNodes(root) {
		return [...root.querySelectorAll(focusableSelector)].filter(node => ui_a11y.InteractivityChecker.isTabbable(node));
	}
	function moveFocus(candidates, container) {
		for (const node of candidates) {
			node?.focus();
			if (node === document.activeElement) {
				return;
			}
		}
		if (!container || container.contains(document.activeElement)) {
			return;
		}
		container.setAttribute('tabindex', '-1');
		container.focus();
	}

	/**
	 * Takes a node inside the shutter or the wrapper around it; without a shutter the callback runs at once.
	 */
	function whenShutterVisible(node, callback) {
		return sale_checkout_lib.Shutter.whenVisible(node.closest(shutterSelector) ?? node.querySelector(shutterSelector), callback);
	}

	let dialogSequence = 0;

	/**
	 * Focus trap, isolation and scroll lock of a row layer, kept together so a refused opening cannot lock the page.
	 * The host marks the wrapper with `ref="dialog"` and lists its initiator selectors in `dialogInitiator`.
	 */
	const MixinItemDialog = {
		props: ['index', 'opened'],
		computed: {
			dialogHeadingId() {
				return `sale-checkout-item-dialog-heading-${this.dialogSequenceNumber}`;
			}
		},
		watch: {
			opened(opened) {
				if (opened) {
					document.body.style.overflowY = 'hidden';

					// the wrapper is still inert at this point, and nothing inside it can take focus
					this.$nextTick(() => this.openDialog());
					return;
				}
				this.closeDialog();
			}
		},
		created() {
			dialogSequence++;
			this.dialogSequenceNumber = dialogSequence;
			this.focusTrap = null;
			this.cancelShutterWait = null;
		},
		beforeDestroy() {
			if (this.opened) {
				this.closeDialog();
			}
			this.cancelShutterWait?.();
			this.focusTrap?.destroy();
			this.focusTrap = null;
		},
		methods: {
			openDialog() {
				if (!this.opened || !this.$refs.dialog) {
					return;
				}
				if (this.focusTrap === null) {
					this.focusTrap = new ui_a11y.FocusTrap(this.$refs.dialog, {
						isolateOutside: true,
						restoreFocus: () => this.getDialogInitiator()
					});
				}

				// nothing inside the layer can take focus while its shutter is still transparent
				this.cancelShutterWait = whenShutterVisible(this.$refs.dialog, () => this.focusTrap.activate({
					initialFocus: true
				}));
			},
			/**
			 * Runs from the watcher, not $nextTick: the trap lets the focus go before the wrapper turns inert.
			 */
			closeDialog() {
				this.cancelShutterWait?.();
				this.cancelShutterWait = null;
				this.focusTrap?.deactivate();
				document.body.style.overflowY = '';
			},
			requestDialogClose() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropClose, {
					index: this.index
				});
			},
			getDialogInitiator() {
				const row = this.$el.closest('.checkout-basket-item');
				if (!row) {
					return null;
				}
				const initiator = this.dialogInitiator.map(selector => row.querySelector(selector)).find(node => node !== null && ui_a11y.InteractivityChecker.isFocusable(node));
				return initiator ?? null;
			}
		}
	};

	ui_vue.BitrixVue.component('sale-checkout-view-product-price', {
		props: ['item'],
		computed: {
			hasDiscount() {
				return this.item.discount.sum !== 0;
			}
		},
		// language=Vue
		template: `
		<div class="checkout-item-price-block">
			<div v-if="hasDiscount"
				class="checkout-item-price-discount-container">
				<span class="checkout-item-price-discount">
					<sale-checkout-view-element-animate_price :sum="this.item.baseSum" :currency="this.item.currency" />
				</span>
				<span class="checkout-item-price-discount-diff">
					<sale-checkout-view-element-animate_price :sum="this.item.discount.sum" :currency="this.item.currency" :prefix="'-'" />
				</span>
			</div>
			<span class="checkout-item-price">
				<sale-checkout-view-element-animate_price :sum="this.item.sum" :currency="this.item.currency"/>
			</span>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-props_list', {
		props: ['list'],
		methods: {
			isShow(item) {
				return item.name !== '' && item.value !== '';
			}
		},
		// language=Vue
		template: `
		<div>
			<div v-for="(item, index) in list" v-if="isShow(item)" class="checkout-basket-item-props" :key="index">{{item.name}}: <strong>{{item.value}}</strong></div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_warning_list', {
		props: ['list'],
		// language=Vue
		template: `
		<div class="checkout-item-warning-container">
				<div class="text-danger" v-for="(item, index) in list" :key="index" >{{item.message}}</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_backdrop', {
		props: ['item', 'error'],
		mixins: [sale_checkout_view_mixins.MixinProductItemEdit, MixinItemDialog],
		computed: {
			dialogInitiator() {
				return changeVariationButton;
			}
		},
		// language=Vue
		template: `
		<div
			class="checkout-basket-item-backdrop-wrapper js-backdrop-open-change-sku"
			style=""
			data-testid="sale-checkout-variation-dialog"
			role="dialog"
			aria-modal="true"
			:aria-labelledby="dialogHeadingId"
			:inert="!opened"
			ref="dialog"
			@keydown.esc="requestDialogClose"
		>
			<sale-checkout-view-element-button-backdrop_overlay_close class="js-backdrop-open-change-sku" :index="this.index"/>
			<div class="checkout-basket-item-backdrop-container js-backdrop-open-change-sku">
				<div class="checkout-basket-item-detail-header justify-content-between align-items-center">
					<div class="checkout-basket-item-detail-swipe-btn-container" id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_swipe_btn">
						<div class="checkout-basket-item-detail-swipe-btn"/>
					</div>
				</div>
					<div class="checkout-basket-item-backdrop-inner">
					<div class="checkout-basket-item-backdrop-main">
						<div class="checkout-basket-item-head">
							<a :href="item.product.detailPageUrl" class="checkout-basket-item-image-block" tabindex="-1" aria-hidden="true">
								<img :src="getSrc" :alt="item.name" class="checkout-basket-item-image">
							</a>
							<h2 class="checkout-basket-item-name-block" :id="dialogHeadingId">
								<a :href="item.product.detailPageUrl" class="checkout-basket-item-name-text" data-testid="sale-checkout-backdrop-product-link">{{item.name}}</a>
							</h2>
						</div>
						<div class="checkout-basket-item-info-container" v-if="hasProps() || hasSkyTree()">
							<div class="checkout-basket-item-info-block">
								<sale-checkout-view-product-props_list :list="item.props" v-if="hasProps()"/>
								<sale-checkout-view-product-sku_tree :tree="item.sku.tree" :index="index" v-if="hasSkyTree()"/>
							</div>
							<sale-checkout-view-product-item_warning_list :list="error"/>
						</div>
					</div>
					<div class="checkout-basket-item-backdrop-bottom">
						<div class="checkout-basket-item-summary-info">
							<div class="checkout-item-quantity-block">
								<div class="checkout-item-quantity-field-container">
									<slot name="button-minus" />
									<div class="checkout-item-quantity-field-block">
										<sale-checkout-view-element-input-product_item_quantity :item="item" :index="index" data-testid="sale-checkout-backdrop-quantity-input"/>
										<div class="checkout-item-quantity-field" aria-hidden="true">{{item.quantity}}</div>
									</div>
									<slot name="button-plus" />
									<slot name="quantity-description" />
								</div>
							</div>
							<sale-checkout-view-product-price :item="item" :index="index" />
						</div>
						<sale-checkout-view-element-button-backdrop_sku_change :index="index"/>
					</div>
				</div>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_deleted', {
		props: ['item', 'index'],
		methods: {
			getSrc() {
				return encodeURI(this.item.product.picture);
			}
		},
		computed: {
			titleId() {
				return `sale-checkout-deleted-item-title-${this.index}`;
			},
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PRODUCT_INFO_DELETED_'));
			}
		},
		// language=Vue
		template: `
		<div class="checkout-table-row">
			<div class="checkout-table-td">
				<a :href="item.product.detailPageUrl" class="checkout-basket-item-image-block">
					<img :src="getSrc()" :alt="item.name" class="checkout-basket-item-image">
				</a>
			</div>
			<div class="checkout-table-td">
				<div class="checkout-basket-item-info-container">
					<h2 class="checkout-basket-item-name-block" :id="titleId">
						<span class="checkout-basket-item-name-text"><strong>{{localize.CHECKOUT_VIEW_PRODUCT_INFO_DELETED_WAS_DELETED}}</strong> {{item.name}}</span>
					</h2>
				</div>
			</div>
			<div class="checkout-table-td">
				<sale-checkout-view-element-button-restore :index="index" :describedBy="titleId"/>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_view', {
		props: ['item'],
		computed: {
			getSrc() {
				return encodeURI(this.item.product.picture);
			}
		},
		// language=Vue
		template: `
		<div class="checkout-table-row">
			<div class="checkout-table-td">
				<a :href="item.product.detailPageUrl" class="checkout-basket-item-image-block" tabindex="-1" aria-hidden="true">
					<img :src="getSrc" :alt="item.name" class="checkout-basket-item-image">
				</a>
			</div>
			<div class="checkout-table-td">
				<div class="checkout-basket-item-info-container">
					<h2 class="checkout-basket-item-name-block">
						<a :href="item.product.detailPageUrl" class="checkout-basket-item-name-text" data-testid="sale-checkout-product-link">{{item.name}}</a>
					</h2>
					<div class="checkout-basket-item-info-block">
						<sale-checkout-view-product-props_list :list="item.props"/>
					</div>
				</div>
			</div>
			<div class="checkout-table-td">
				<div class="checkout-basket-item-summary-info">
					<div class="checkout-item-quantity-block">
						<div class="checkout-item-quantity-block-text">{{item.quantity}} {{item.measureText}}</div>
					</div>
					<sale-checkout-view-product-price :item="item"/>
				</div>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_edit', {
		props: ['item', 'index', 'error'],
		mixins: [sale_checkout_view_mixins.MixinProductItemEdit],
		// language=Vue
		template: `
		<div class="checkout-table-row">
			<div class="checkout-table-td">
				<a :href="item.product.detailPageUrl" class="checkout-basket-item-image-block" tabindex="-1" aria-hidden="true">
					<img :src="getSrc" :alt="item.name" class="checkout-basket-item-image">
				</a>
			</div>
			<div class="checkout-table-td">
				<div class="checkout-basket-item-info-container">
					<h2 class="checkout-basket-item-name-block">
						<a :href="item.product.detailPageUrl" class="checkout-basket-item-name-text" data-testid="sale-checkout-product-link">{{item.name}}</a>
					</h2>
					<div class="checkout-basket-item-info-block">
						<sale-checkout-view-product-props_list :list="item.props" v-if="hasProps()"/>
						<div class="checkout-basket-desktop-only">
							<sale-checkout-view-product-sku_tree :tree="item.sku.tree" :index="index" v-if="hasSkyTree()"/>
						</div>
						<slot name="button-change-sku"/>
						<sale-checkout-view-product-item_warning_list :list="error"/>
					</div>
				</div>
			</div>
			<div class="checkout-table-td">
				<div class="checkout-basket-item-summary-info">
					<div class="checkout-item-quantity-block">
						<div class="checkout-item-quantity-field-container">
							<slot name="button-minus"/>
							<div class="checkout-item-quantity-field-block">
								<sale-checkout-view-element-input-product_item_quantity :item="item" :index="index" data-testid="sale-checkout-quantity-input"/>
								<div class="checkout-item-quantity-field" aria-hidden="true">{{item.quantity}}</div>
							</div>
							<slot name="button-plus"/>
							<slot name="quantity-description"/>
						</div>
					</div>
					<sale-checkout-view-product-price :item="item"/>
					<slot name="button-remove"/>
				</div>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-measure', {
		props: ['item'],
		// language=Vue
		template: `
		<span class="checkout-item-quantity-description">
			<span class="checkout-item-quantity-description-text">{{item.measureText}}</span>
			<span class="checkout-item-quantity-description-price"/>
		</span>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-price_measure', {
		props: ['item'],
		computed: {
			priceFormatted() {
				return currency_currencyCore.CurrencyCore.currencyFormat(this.item.price, this.item.currency, true);
			}
		},
		// language=Vue
		template: `
		<span class="checkout-item-quantity-description">
			<span class="checkout-item-quantity-description-text">
				<div v-html="priceFormatted + '/' + item.measureText"/>
			</span>
			<span class="checkout-item-quantity-description-price"/>
		</span>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-row', {
		props: ['item', 'index', 'mode', 'error'],
		mixins: [sale_checkout_view_mixins.MixinLoader],
		data() {
			return {
				showBackdropMobileMenu: 'N',
				showBackdropChangeSku: 'N'
			};
		},
		computed: {
			config() {
				return {
					status: this.item.status
				};
			},
			hasSkuPropsColor() {
				let tree = this.item.sku.tree;
				return tree.hasOwnProperty('EXISTING_VALUES') && tree.EXISTING_VALUES.hasOwnProperty('COLOR_REF');
			},
			isBackdropMobileMenu() {
				return this.showBackdropMobileMenu === 'Y';
			},
			isBackdropChangeSku() {
				return this.showBackdropChangeSku === 'Y';
			},
			isDeleted() {
				return this.item.deleted === 'Y';
			},
			isLocked() {
				return this.item.status === sale_checkout_const.Loader.status.wait;
			},
			getConstMode() {
				return sale_checkout_const.Application.mode;
			},
			isService() {
				return sale_checkout_lib.Product.isService(this.item);
			},
			buttonMinusDisabled() {
				return this.item.quantity - this.item.product.ratio < this.item.product.ratio;
			},
			buttonPlusDisabled() {
				return this.item.quantity + this.item.product.ratio > this.item.product.availableQuantity;
			},
			getObjectClass() {
				const classes = ['checkout-table-row-group', 'checkout-basket-item'];
				if (this.hasSkuPropsColor) {
					classes.push('checkout-basket-item--has-sku-color');
				}
				if (this.isDeleted) {
					classes.push('checkout-basket-item-deleted');
				}
				if (this.isLocked) {
					classes.push('checkout-basket-item-locked');
				}
				if (this.isBackdropChangeSku) {
					classes.push('active-backdrop-open-change-sku');
				}
				if (this.isBackdropMobileMenu) {
					classes.push('active-backdrop-open-mobile-menu');
				}
				return classes;
			}
		},
		watch: {
			isDeleted() {
				this.applyFocusRequest();
			},
			isBackdropChangeSku(opened) {
				if (!opened) {
					this.applyFocusRequest();
				}
			}
		},
		created() {
			// where the focus lands once the row is redrawn, which the controller debounce puts long after the click
			this.focusRequest = null;
			this.basketEventHandlers = {
				[sale_checkout_const.EventType.basket.buttonRemoveProduct]: event => {
					let index = event.getData().index;
					if (index === this.index && !this.isLocked && !this.isDeleted) {
						this.requestFocus(restoreButton);
					}
				},
				[sale_checkout_const.EventType.basket.buttonRestoreProduct]: event => {
					let index = event.getData().index;
					if (index === this.index && !this.isLocked && this.isDeleted) {
						this.requestFocus(removeButtons);
					}
				},
				[sale_checkout_const.EventType.basket.backdropOpenMobileMenu]: event => {
					let index = event.getData().index;
					if (index === this.index && !this.isLocked) {
						this.showBackdropMobileMenu = 'Y';
					}
				},
				[sale_checkout_const.EventType.basket.backdropOpenChangeSku]: event => {
					let index = event.getData().index;
					if (index === this.index && !this.isLocked) {
						this.showBackdropChangeSku = 'Y';
					}
				},
				[sale_checkout_const.EventType.basket.backdropClose]: event => {
					let index = event.getData().index;
					if (index === this.index) {
						const changeSkuWasOpen = this.isBackdropChangeSku;
						this.showBackdropMobileMenu = 'N';
						this.showBackdropChangeSku = 'N';
						if (changeSkuWasOpen) {
							this.requestFocus(changeVariationButton);
						}
					}
				}
			};
			Object.entries(this.basketEventHandlers).forEach(([eventName, handler]) => {
				main_core_events.EventEmitter.subscribe(eventName, handler);
			});
		},
		beforeDestroy() {
			Object.entries(this.basketEventHandlers).forEach(([eventName, handler]) => {
				main_core_events.EventEmitter.unsubscribe(eventName, handler);
			});
		},
		methods: {
			requestFocus(selectors) {
				const container = this.$refs.container;
				if (!container || !container.contains(document.activeElement)) {
					return;
				}
				this.focusRequest = {
					selectors,
					item: this.item
				};
			},
			applyFocusRequest() {
				const request = this.focusRequest;
				this.focusRequest = null;

				// another product means a neighbour left and the row shifted up; the list moves that focus
				if (request === null || request.item !== this.item) {
					return;
				}
				this.$nextTick(() => {
					const container = this.$refs.container;
					if (!container) {
						return;
					}
					moveFocus(request.selectors.map(selector => container.querySelector(selector)), container);
				});
			}
		},
		// language=Vue
		template: `
		<div :class="getObjectClass" :aria-busy="isLocked" style='position: relative;' data-testid="sale-checkout-product-row" ref="container">
			<template v-if="isDeleted">
				<sale-checkout-view-product-item_deleted :item="item" :index="index"/>
			</template>
			<template v-else>
				<template v-if="mode === getConstMode.edit">
					<sale-checkout-view-product-item_edit :item="item" :index="index" :mode="mode" :error="error">
						<template v-slot:button-minus><sale-checkout-view-element-button-minus :class="{'checkout-item-quantity-btn-disabled': buttonMinusDisabled}" :index="index" :disabled="buttonMinusDisabled" data-testid="sale-checkout-quantity-minus-btn"/></template>
						<template v-slot:button-plus v-if="isService"><sale-checkout-view-element-button-plus :index="index" data-testid="sale-checkout-quantity-plus-btn"/></template>
						<template v-slot:button-plus v-else			 ><sale-checkout-view-element-button-plus :class="{'checkout-item-quantity-btn-disabled': buttonPlusDisabled}" :index="index" :disabled="buttonPlusDisabled" data-testid="sale-checkout-quantity-plus-btn"/></template>
						<template v-slot:button-remove>
							<div class="checkout-basket-item-remove-btn-block">
								<sale-checkout-view-element-button-remove :index="index"/>
								<sale-checkout-view-element-button-item_mobile_menu :index="index"/>
							</div>
						</template>
						<template v-slot:quantity-description>
							<template v-if="buttonMinusDisabled"><sale-checkout-view-product-measure :item="item"/></template>
							<template v-else><sale-checkout-view-product-price_measure :item="item"/></template>
						</template>
						<template v-slot:button-change-sku><sale-checkout-view-element-button-item_change_sku :index="index"/></template>
					</sale-checkout-view-product-item_edit>
					<sale-checkout-view-product-item_backdrop_remove :index="index" :opened="isBackdropMobileMenu"/>
					<sale-checkout-view-product-item_backdrop :item="item" :index="index" :error="error" :opened="isBackdropChangeSku">
						<template v-slot:button-minus><sale-checkout-view-element-button-minus :class="{'checkout-item-quantity-btn-disabled': buttonMinusDisabled}" :index="index" :disabled="buttonMinusDisabled" data-testid="sale-checkout-backdrop-quantity-minus-btn"/></template>
						<template v-slot:button-plus v-if="isService"><sale-checkout-view-element-button-plus :index="index" data-testid="sale-checkout-backdrop-quantity-plus-btn"/></template>
						<template v-slot:button-plus v-else			 ><sale-checkout-view-element-button-plus :class="{'checkout-item-quantity-btn-disabled': buttonPlusDisabled}" :index="index" :disabled="buttonPlusDisabled" data-testid="sale-checkout-backdrop-quantity-plus-btn"/></template>
					</sale-checkout-view-product-item_backdrop>
				</template>
				<template v-else>
					<sale-checkout-view-product-item_view :item="item"/>
				</template>
			</template>
		</div>
	`
	});

	const rowSelector = '.checkout-basket-item';
	const totalsSelector = '.checkout-basket-summary-container';
	ui_vue.BitrixVue.component('sale-checkout-view-product-list', {
		props: ['items', 'mode', 'errors'],
		watch: {
			'items.length': function (current, previous) {
				if (current < previous) {
					this.followRemovedRow();
				}
			}
		},
		methods: {
			getError(index) {
				let error = this.errors.find(error => error.index === index);
				return typeof error !== 'undefined' ? error.list : null;
			},
			getTotals(container) {
				return container.parentElement?.querySelector(totalsSelector);
			},
			followRemovedRow() {
				const container = this.$refs.container;
				const row = document.activeElement?.closest(rowSelector);
				if (!row || !container.contains(row)) {
					return;
				}
				this.$nextTick(() => {
					if (container.contains(document.activeElement)) {
						return;
					}

					// rows are keyed by position, so the focused row node stays unless the last row went away
					const target = (row.isConnected ? row : this.getTotals(container)) ?? container;
					moveFocus(getFocusableNodes(target), target);
				});
			}
		},
		// language=Vue
		template: `
		<div class="checkout-basket-item-inner" data-testid="sale-checkout-product-list" ref="container">
			<sale-checkout-view-product-row v-for="(item, index) in items" :key="index"
											:item="item" :index="index" :mode="mode" :error="getError(index)" />
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-summary', {
		props: ['total', 'mode'],
		methods: {
			hasDiscount() {
				return this.total.discount.sum !== 0;
			},
			backdropTotalOpen() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropTotalOpen);
			}
		},
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_SUMMARY_'));
			},
			getConstMode() {
				return sale_checkout_const.Application.mode;
			}
		},
		// language=Vue
		template: `
		<div class="checkout-basket-summary-container" data-testid="sale-checkout-basket-summary">
			<!--region mobile -->
			<div class="checkout-basket-mobile-only checkout-basket-summary-discount checkout-summary-item-discount" v-if="hasDiscount()">
				<div class="checkout-basket-summary-text">{{localize.CHECKOUT_VIEW_SUMMARY_BASKET_PROFIT}}</div>
				<div class="checkout-item-price-block">
					<span class="checkout-summary-item-price-discount">
						<sale-checkout-view-element-animate_price :sum="this.total.discount.sum" :currency="this.total.currency" :prefix="'-'"/>
					</span>
				</div>
			</div>
			<!--endregion-->

			<!--region web-->
			<div class="checkout-basket-summary">
				<div class="checkout-basket-summary-text">{{localize.CHECKOUT_VIEW_SUMMARY_BASKET_ITEMS}}</div>
				<div class="checkout-item-price-block">
					<div class="checkout-item-price-discount-container checkout-basket-desktop-only" v-if="hasDiscount()">
						<span class="checkout-item-price-discount">
							<sale-checkout-view-element-animate_price :sum="this.total.basePrice" :currency="this.total.currency" />
						</span>
						<span class="checkout-item-price-discount-diff">
							<sale-checkout-view-element-animate_price :sum="this.total.discount.sum" :currency="this.total.currency" :prefix="'-'"/>
						</span>
					</div>
					<span class="checkout-item-price">
						<sale-checkout-view-element-animate_price :sum="this.total.price" :currency="this.total.currency" />
					</span>
				</div>
				<template v-if="mode === getConstMode.view">
					<div class="d-block w-100 text-right">
						<button
							class="checkout-basket-total-backdrop-btn checkout-basket-mobile-only"
							type="button"
							data-testid="sale-checkout-total-details-btn"
							@click="backdropTotalOpen"
						>{{localize.CHECKOUT_VIEW_SUMMARY_DETAILS}}</button>
					</div>
				</template>
			</div>
			<!--endregion-->
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product', {
		props: ['items', 'total', 'mode', 'errors', 'config'],
		mixins: [sale_checkout_view_mixins.MixinLoader],
		computed: {
			isLocked() {
				return this.config.status === sale_checkout_const.Loader.status.wait;
			},
			getObjectClass() {
				const classes = ['checkout-basket-list-items', 'checkout-table'];
				if (this.mode === sale_checkout_const.Application.mode.view) {
					classes.push('checkout-basket-list-items-view-mode');
				}
				if (this.isLocked) {
					classes.push('checkout-basket-item-locked');
				}
				return classes;
			}
		},
		// language=Vue
		template: `
			<div :class="getObjectClass" :aria-busy="ariaBusy" data-testid="sale-checkout-basket" ref="container">
			<sale-checkout-view-product-list :items="items" :errors="errors" :mode="mode"/>
			<sale-checkout-view-product-summary :total="total" :mode="mode"/>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-product-item_backdrop_remove', {
		mixins: [MixinItemDialog],
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PRODUCT_ITEM_MENU_');
			},
			dialogInitiator() {
				return removeButtons;
			}
		},
		// language=Vue
		template: `
		<div
			class="checkout-basket-item-backdrop-wrapper js-backdrop-open-mobile-menu"
			data-testid="sale-checkout-item-menu-dialog"
			role="dialog"
			aria-modal="true"
			:aria-label="localize.CHECKOUT_VIEW_PRODUCT_ITEM_MENU_NAME"
			:inert="!opened"
			ref="dialog"
			@keydown.esc="requestDialogClose"
		>
			<sale-checkout-view-element-button-backdrop_overlay_close class="js-backdrop-open-mobile-menu" :index="index"/>
			<div class="checkout-basket-item-backdrop-container js-backdrop-open-mobile-menu">
				<div class="checkout-basket-item-detail-header justify-content-between align-items-center">
					<div class="checkout-basket-item-detail-header-separate"/>
					<div class="checkout-basket-item-detail-swipe-btn-container" id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_swipe_btn">
						<div class="checkout-basket-item-detail-swipe-btn"/>
					</div>
					<sale-checkout-view-element-button-backdrop_close :index="index"/>
				</div>
				<div class="checkout-basket-item-backdrop-inner">
					<sale-checkout-view-element-button-backdrop_remove_remove :index="index"/>
					<sale-checkout-view-element-button-backdrop_remove_cancel :index="index"/>
				</div>
			</div>
		</div>
	`
	});

	const changeSkuShutterSelector = '.js-backdrop-open-change-sku';
	const skuLoadedEvent = 'BX.Catalog.SkuTree::onSkuLoaded';
	ui_vue.BitrixVue.component('sale-checkout-view-product-sku_tree', {
		props: ['tree', 'index'],
		data() {
			return {
				skuTree: new catalog_skuTree.SkuTree({
					skuTree: this.tree,
					selectable: true,
					hideUnselected: false
				})
			};
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PRODUCT_SKU_');
			},
			getHash() {
				return this.prepareValues(this.tree.SELECTED_VALUES);
			}
		},
		methods: {
			prepareValues(values) {
				return Object.keys(values).concat(Object.values(values)).join();
			},
			appendBlockHtml() {
				let wrapper = this.$refs.container;
				wrapper.appendChild(this.skuTree.layout());
			},
			focusSelectedProperty() {
				const propertyId = Object.keys(this.tree.SELECTED_VALUES ?? {})[0];
				if (propertyId === undefined) {
					return;
				}
				this.releaseFocusBeforeEntry();

				// the method is new in catalog and modules update on their own schedule
				this.skuTree.focusPropertyTabStop?.(propertyId);
			},
			// catalog draws the radios once its request for the properties is back, which may come after the shutter
			// has appeared
			focusSelectedPropertyWhenDrawn() {
				this.stopWaitingForDraw();
				if (this.$el.contains(document.activeElement)) {
					return;
				}
				this.visitorActed = false;
				this.focusBeforeVisitor = null;
				this.visitorInputHandler = () => {
					if (!this.visitorActed) {
						this.visitorActed = true;
						this.focusBeforeVisitor = document.activeElement;
					}
				};
				main_core.Event.bind(document, 'keydown', this.visitorInputHandler, true);
				main_core.Event.bind(document, 'pointerdown', this.visitorInputHandler, true);
				this.skuLoadedHandler = event => {
					if (event.getData()?.id !== this.skuTree.id) {
						return;
					}
					const focusLeftByShutter = this.isFocusLeftByShutter();
					this.stopWaitingForDraw();
					if (focusLeftByShutter && this.$el.closest('[inert]') === null && !this.$el.contains(document.activeElement)) {
						this.focusSelectedProperty();
					}
				};
				main_core_events.EventEmitter.subscribe(skuLoadedEvent, this.skuLoadedHandler);
			},
			// the trap of the shutter puts the focus on its first stop meanwhile; a focus the visitor has moved stays
			isFocusLeftByShutter() {
				const active = document.activeElement;
				return !this.visitorActed || active === null || active === document.body || active === this.focusBeforeVisitor;
			},
			stopWaitingForDraw() {
				if (this.skuLoadedHandler !== null) {
					main_core_events.EventEmitter.unsubscribe(skuLoadedEvent, this.skuLoadedHandler);
					this.skuLoadedHandler = null;
				}
				if (this.visitorInputHandler !== null) {
					main_core.Event.unbind(document, 'keydown', this.visitorInputHandler, true);
					main_core.Event.unbind(document, 'pointerdown', this.visitorInputHandler, true);
					this.visitorInputHandler = null;
					this.focusBeforeVisitor = null;
				}
			},
			// the focus zone of the group adopts an entry only from nowhere: coming from the opener,
			// its arrow cursor would stay on the first value and the arrows would not move
			releaseFocusBeforeEntry() {
				const active = document.activeElement;
				if (active !== null && active !== document.body && !this.$el.contains(active)) {
					active.blur();
				}
			},
			// Orca repeats the state of a radio only after Space, so a choice by Enter, arrows or mouse is silent;
			// the property name goes first, since a product carries several groups
			announceChoice(propertyId) {
				const chosen = this.$el.querySelector(`[role="radio"][data-property-id="${CSS.escape(String(propertyId))}"][aria-checked="true"]`);
				if (chosen === null) {
					return;
				}
				const value = chosen.getAttribute('aria-label') || chosen.getAttribute('title') || '';
				if (value === '') {
					return;
				}
				const property = this.getGroupName(chosen);
				const template = this.localize.CHECKOUT_VIEW_PRODUCT_SKU_SELECTED_ARIA || '';
				const replacements = {
					'#PROPERTY#': property,
					'#VALUE#': value
				};
				sale_checkout_lib.Announcer.announce(property === '' || template === '' ? value : template.replace(/#PROPERTY#|#VALUE#/g, placeholder => replacements[placeholder]));
			},
			getGroupName(node) {
				const group = node.closest('[role="radiogroup"]');
				if (group === null) {
					return '';
				}
				const label = group.getAttribute('aria-label');
				if (label) {
					return label;
				}
				const titleId = group.getAttribute('aria-labelledby');
				const title = titleId === null ? null : document.getElementById(titleId);
				return title === null ? '' : (title.textContent ?? '').trim();
			}
		},
		watch: {
			getHash() {
				let selectedValues = this.tree.SELECTED_VALUES;
				try {
					for (let propertyId in selectedValues) {
						if (!selectedValues.hasOwnProperty(propertyId)) {
							continue;
						}
						this.skuTree.setSelectedProperty(propertyId, selectedValues[propertyId]);
					}
				} catch (e) {}
				this.skuTree.toggleSkuProperties();
			}
		},
		created() {
			this.cancelShutterWait = null;
			this.skuLoadedHandler = null;
			this.visitorInputHandler = null;
			this.focusBeforeVisitor = null;
			this.visitorActed = false;

			// the group was built in a hidden shutter, so its radios get a tab stop only when asked for one
			this.openChangeSkuHandler = event => {
				if (event.getData().index !== this.index) {
					return;
				}
				this.$nextTick(() => {
					this.cancelShutterWait = whenShutterVisible(this.$el, () => {
						// a shutter the row refused to open, or closed during the fade, stays inert
						if (this.$el.closest('[inert]') === null) {
							this.focusSelectedProperty();
							this.focusSelectedPropertyWhenDrawn();
						}
					});
				});
			};
		},
		mounted() {
			this.appendBlockHtml();
			if (this.$el.closest(changeSkuShutterSelector) !== null) {
				main_core_events.EventEmitter.subscribe(sale_checkout_const.EventType.basket.backdropOpenChangeSku, this.openChangeSkuHandler);
			}
			if (this.skuTree) {
				// fired only on a choice of the visitor, not when the watcher above replays the offers
				this.skuTree.subscribe(sale_checkout_const.EventType.basket.changeSkuOriginName, event => {
					const data = event.getData();
					this.announceChoice(data[1]?.ID);
					main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.changeSku, {
						index: this.index,
						data
					});
				});
			}
		},
		beforeDestroy() {
			this.cancelShutterWait?.();
			this.stopWaitingForDraw();
			main_core_events.EventEmitter.unsubscribe(sale_checkout_const.EventType.basket.backdropOpenChangeSku, this.openChangeSkuHandler);
		},
		// language=Vue
		template: `<div data-testid="sale-checkout-sku-tree">
			<div ref="container"/>
		</div>
	`
	});

})(BX, BX.Sale.Checkout.Const, BX.Event, BX.Sale.Checkout.View.Mixins, BX.Sale.Checkout.Lib, BX.Sale.Checkout.View.Element, BX.UI.Accessibility, BX.Sale.Checkout.View.Element.Input, BX.Sale.Checkout.View.Element, BX.Currency, BX, BX.Catalog.SkuTree);
//# sourceMappingURL=registry.bundle.js.map
