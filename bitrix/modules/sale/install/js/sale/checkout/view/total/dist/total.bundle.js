/* eslint-disable */
(function (ui_vue, sale_checkout_const, sale_checkout_lib, main_core_events, ui_a11y, currency_currencyCore) {
		'use strict';

		ui_vue.BitrixVue.component('sale-checkout-view-total-basket', {
			props: ['total'],
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_TOTAL_'));
				},
				basePriceFormatted() {
					return currency_currencyCore.CurrencyCore.currencyFormat(this.total.basePrice, this.total.currency, true);
				}
			},
			// language=Vue
			template: `
			<tr class="checkout-basket-total-item checkout-basket-total-item-subtotal">
				<td>
					<div class="checkout-basket-total-item-summary">
						<span>{{localize.CHECKOUT_VIEW_TOTAL_TOTAL_ITEMS}}</span>
					</div>
				</td>
				<td>
					<div class="checkout-basket-total-item-price-block">
						<span class="checkout-basket-total-item-price" v-html="basePriceFormatted"/>
					</div>
				</td>
			</tr>
		`
		});

		ui_vue.BitrixVue.component('sale-checkout-view-total-discount', {
			props: ['total'],
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_TOTAL_'));
				},
				discountSumFormatted() {
					return currency_currencyCore.CurrencyCore.currencyFormat(this.total.discount.sum, this.total.currency, true);
				}
			},
			// language=Vue
			template: `
			<tr class="checkout-basket-total-item checkout-basket-total-item-discount">
				<td>
					<div class="checkout-basket-total-item-summary">
						<span>{{localize.CHECKOUT_VIEW_TOTAL_TOTAL_PROFIT}}</span>
					</div>
				</td>
				<td>
					<div class="checkout-basket-total-price-block">
						<span class="checkout-basket-total-item-price-discount" v-html="'-' + discountSumFormatted"/>
					</div>
				</td>
			</tr>
		`
		});

		ui_vue.BitrixVue.component('sale-checkout-view-total-summary', {
			props: ['total'],
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_TOTAL_'));
				},
				priceFormatted() {
					return currency_currencyCore.CurrencyCore.currencyFormat(this.total.price, this.total.currency, true);
				}
			},
			// language=Vue
			template: `
			 <tr class="checkout-basket-total-item checkout-basket-total-item-total">
				<td>
					<div class="checkout-basket-total-item-summary">
						<span>{{localize.CHECKOUT_VIEW_TOTAL_TOTAL_SUMMARY}}</span>
					</div>
				</td>
				<td>
					<div class="checkout-basket-total-price-block">
						<span class="checkout-basket-total-item-price" v-html="priceFormatted"/>
					</div>
				</td>
			</tr>
		`
		});

		// has to match the shutter breakpoint of the sale.order.checkout template styles
		const shutterLayoutQuery = '(max-width: 991px)';

		// the basket summary of another bundle renders these buttons, twice on the view stage
		const shutterInitiator = '.checkout-basket-total-backdrop-btn';
		ui_vue.BitrixVue.component('sale-checkout-view-total', {
			props: ['total', 'showBackdrop'],
			data() {
				return {
					shutterLayout: false
				};
			},
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_TOTAL_'));
				},
				hasDiscount() {
					return this.total.discount.sum !== 0;
				},
				getObjectClass() {
					const classes = ['checkout-basket-total-container'];
					if (this.isBackdrop) {
						classes.push('active');
					}
					return classes;
				},
				isBackdrop() {
					return this.showBackdrop === 'Y';
				},
				isShutterClosed() {
					return this.shutterLayout && !this.isBackdrop;
				},
				isShutterOpened() {
					return this.shutterLayout && this.isBackdrop;
				}
			},
			watch: {
				isShutterOpened(opened) {
					if (opened) {
						// the block is still inert at this point, and nothing inside it can take focus
						this.$nextTick(() => this.openShutter());
						return;
					}
					this.closeShutter();
				}
			},
			created() {
				this.focusTrap = null;
				this.cancelShutterWait = null;
				this.shutterOpener = null;
				this.shutterLayoutMedia = window.matchMedia(shutterLayoutQuery);
				this.shutterLayout = this.shutterLayoutMedia.matches;
				this.shutterLayoutMedia.onchange = event => {
					this.shutterLayout = event.matches;
				};
			},
			beforeDestroy() {
				this.shutterLayoutMedia.onchange = null;
				this.cancelShutterWait?.();
				this.cancelShutterWait = null;
				this.focusTrap?.destroy();
				this.focusTrap = null;
			},
			methods: {
				backdropTotalClose() {
					main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.backdropTotalClose);
				},
				openShutter() {
					if (!this.isShutterOpened || !this.$refs.shutter) {
						return;
					}
					const active = document.activeElement;
					this.shutterOpener = active?.matches(shutterInitiator) ? active : null;
					if (this.focusTrap === null) {
						this.focusTrap = new ui_a11y.FocusTrap(this.$refs.shutter, {
							isolateOutside: true,
							restoreFocus: () => this.getShutterInitiator()
						});
					}
					if (ui_a11y.FocusMonitor.Instance.getLastInputModality() !== 'keyboard') {
						this.focusTrap.activate({
							initialFocus: true
						});
						return;
					}

					// with the keyboard, wait for the fade: a transparent shutter leaves the trap only the ringless container
					this.cancelShutterWait = sale_checkout_lib.Shutter.whenVisible(this.$refs.shutter, () => this.focusTrap.activate({
						initialFocus: true
					}));
				},
				/**
				 * Runs from the watcher, not $nextTick: the trap lets the focus go before the block turns inert.
				 */
				closeShutter() {
					this.cancelShutterWait?.();
					this.cancelShutterWait = null;
					this.focusTrap?.deactivate();
					this.shutterOpener = null;
				},
				getShutterInitiator() {
					const candidates = [this.shutterOpener, document.querySelector(shutterInitiator)];
					return candidates.find(node => ui_a11y.InteractivityChecker.isFocusable(node)) ?? null;
				}
			},
			// language=Vue
			template: `
			<div
			:class="getObjectClass"
			data-testid="sale-checkout-total"
			:role="shutterLayout ? 'dialog' : false"
			:aria-modal="shutterLayout ? 'true' : false"
			:aria-label="shutterLayout ? localize.CHECKOUT_VIEW_TOTAL_BACKDROP_NAME : false"
			:inert="isShutterClosed"
			ref="shutter"
			@keydown.esc="backdropTotalClose"
		>
			<div class="checkout-basket-total-overlay" data-testid="sale-checkout-total-overlay" @click="backdropTotalClose"></div>
					<div class="checkout-basket-total-backdrop-container">
						<div class="checkout-basket-total-backdrop-header justify-content-between align-items-center checkout-basket-mobile-only">
							<div class="checkout-basket-total-backdrop-header-separate"></div>
							<div class="checkout-basket-total-backdrop-swipe-btn-container">
								<div class="checkout-basket-total-backdrop-swipe-btn"></div>
							</div>
							<div class="checkout-basket-total-backdrop-close-btn-container">
				<button
					class="checkout-basket-total-backdrop-close-btn"
					type="button"
					data-testid="sale-checkout-total-close-btn"
					@click="backdropTotalClose"
				>
					<span class="checkout-basket-total-backdrop-close-btn-text" >{{localize.CHECKOUT_VIEW_TOTAL_CLOSE}}</span>
				</button>
							</div>
						</div>
				<div class="checkout-basket-total-inner">
					<table class="checkout-basket-total-list" role="presentation">
						<sale-checkout-view-total-basket :total="total"/>
						<sale-checkout-view-total-discount :total="total" v-if="hasDiscount"/>
						<sale-checkout-view-total-summary :total="total"/>
					</table>
				</div>
			</div>
			</div>
	`
		});

})(BX, BX.Sale.Checkout.Const, BX.Sale.Checkout.Lib, BX.Event, BX.UI.Accessibility, BX.Currency);
//# sourceMappingURL=total.bundle.js.map
