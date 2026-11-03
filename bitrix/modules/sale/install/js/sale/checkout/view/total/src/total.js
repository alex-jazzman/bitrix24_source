import { BitrixVue } from 'ui.vue';
import { EventType } from 'sale.checkout.const';
import { Shutter } from 'sale.checkout.lib';
import { EventEmitter } from "main.core.events";
import { FocusMonitor, FocusTrap, InteractivityChecker } from 'ui.a11y';

import './basket'
import './discount'
import './summary'

// has to match the shutter breakpoint of the sale.order.checkout template styles
const shutterLayoutQuery = '(max-width: 991px)';

// the basket summary of another bundle renders these buttons, twice on the view stage
const shutterInitiator = '.checkout-basket-total-backdrop-btn';

BitrixVue.component('sale-checkout-view-total', {
	props: ['total', 'showBackdrop'],
	data()
	{
		return {
			shutterLayout: false,
		};
	},
	computed:
	{
		localize()
		{
			return Object.freeze(
				BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_TOTAL_'))
		},
		hasDiscount()
		{
			return this.total.discount.sum !== 0;
		},
		getObjectClass()
		{
			const classes = [
				'checkout-basket-total-container'
			];
			
			if(this.isBackdrop)
			{
				classes.push('active');
			}
			
			return classes;
		},
		isBackdrop()
		{
			return this.showBackdrop === 'Y';
		},
		isShutterClosed()
		{
			return this.shutterLayout && !this.isBackdrop;
		},
		isShutterOpened()
		{
			return this.shutterLayout && this.isBackdrop;
		},
	},
	watch:
	{
		isShutterOpened(opened)
		{
			if (opened)
			{
				// the block is still inert at this point, and nothing inside it can take focus
				this.$nextTick(() => this.openShutter());

				return;
			}

			this.closeShutter();
		},
	},
	created()
	{
		this.focusTrap = null;
		this.cancelShutterWait = null;
		this.shutterOpener = null;
		this.shutterLayoutMedia = window.matchMedia(shutterLayoutQuery);
		this.shutterLayout = this.shutterLayoutMedia.matches;
		this.shutterLayoutMedia.onchange = (event) => {
			this.shutterLayout = event.matches;
		};
	},
	beforeDestroy()
	{
		this.shutterLayoutMedia.onchange = null;
		this.cancelShutterWait?.();
		this.cancelShutterWait = null;
		this.focusTrap?.destroy();
		this.focusTrap = null;
	},
	methods:
	{
		backdropTotalClose()
		{
			EventEmitter.emit(EventType.basket.backdropTotalClose)
		},
		openShutter()
		{
			if (!this.isShutterOpened || !this.$refs.shutter)
			{
				return;
			}

			const active = document.activeElement;
			this.shutterOpener = active?.matches(shutterInitiator) ? active : null;

			if (this.focusTrap === null)
			{
				this.focusTrap = new FocusTrap(this.$refs.shutter, {
					isolateOutside: true,
					restoreFocus: () => this.getShutterInitiator(),
				});
			}

			if (FocusMonitor.Instance.getLastInputModality() !== 'keyboard')
			{
				this.focusTrap.activate({ initialFocus: true });

				return;
			}

			// with the keyboard, wait for the fade: a transparent shutter leaves the trap only the ringless container
			this.cancelShutterWait = Shutter.whenVisible(
				this.$refs.shutter,
				() => this.focusTrap.activate({ initialFocus: true }),
			);
		},
		/**
		 * Runs from the watcher, not $nextTick: the trap lets the focus go before the block turns inert.
		 */
		closeShutter()
		{
			this.cancelShutterWait?.();
			this.cancelShutterWait = null;
			this.focusTrap?.deactivate();
			this.shutterOpener = null;
		},
		getShutterInitiator()
		{
			const candidates = [this.shutterOpener, document.querySelector(shutterInitiator)];

			return candidates.find((node) => InteractivityChecker.isFocusable(node)) ?? null;
		},
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
