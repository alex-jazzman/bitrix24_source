import { BitrixVue } from 'ui.vue';
import { EventEmitter } from "main.core.events";
import { Type } from 'main.core';
import { FocusMonitor, FocusNavigator } from 'ui.a11y';
import { Application as ApplicationConst, Loader as LoaderConst, PaySystem as PaySystemConst, Property as PropertyConst,
		 EventType } from 'sale.checkout.const';

import "sale.checkout.view.total";
import "sale.checkout.view.product";
import "sale.checkout.view.property";
import "sale.checkout.view.user-consent"
import "sale.checkout.view.element.button";
import "sale.checkout.view.successful";
import "sale.checkout.view.empty-cart";
import "sale.checkout.view.payment"
import "sale.checkout.view.alert"

const stageContainer = '.checkout-basket-container';
const checkoutButtonContainer = '.checkout-btn-container';
const rejectedField = '.checkout-basket-section-personal-form [aria-invalid="true"]';
const statusScreen = '.checkout-order-status-successful';
const statusHeading = '.checkout-order-status-text';
const statusHeadingId = 'sale-checkout-order-status';
const orderTitle = '.checkout-order-info > :first-child';
const orderTitleId = 'sale-checkout-order-title';
// the screens of a placed order are named by a heading that says what has happened
const statusStages = new Set([ApplicationConst.stage.success, ApplicationConst.stage.payed]);
// only the answer to the order writes the general errors, and the same answer rewrites the fields it refused
const orderAnswerMutations = new Set(['application/setErrors', 'application/clearErrors']);
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A stage without a heading takes the focus on its container rather than past its text to a control.
 * With the keyboard it goes to the first tab stop: a container focused by script shows no ring.
 */
export function moveFocusToStage(container)
{
	if (!container)
	{
		return;
	}

	if (
		FocusMonitor.Instance.getLastInputModality() === 'keyboard'
		&& FocusNavigator.focusFirst(container, { tabbableOnly: true })
	)
	{
		return;
	}

	container.setAttribute('tabindex', '-1');
	container.focus();

	if (container === document.activeElement)
	{
		return;
	}

	container.querySelector(focusableSelector)?.focus();
}

/**
 * The screen of a placed order is a group named by its heading and the number of the order: the reader says
 * them on the way into the screen, ahead of its first control. That control takes the focus with a ring,
 * which a focus moved by script after a click does not get on its own. A screen without a control
 * gives the focus to its heading and stays unnamed.
 */
export function moveFocusToPlacedOrder(container)
{
	const screen = container?.querySelector(statusScreen);
	const heading = screen?.querySelector(statusHeading);

	if (!heading)
	{
		moveFocusToStage(container);

		return;
	}

	const control = screen.querySelector(focusableSelector);

	if (control)
	{
		heading.id = heading.id || statusHeadingId;
		const labelledBy = [heading.id];
		const title = screen.querySelector(orderTitle);

		if (title)
		{
			title.id = title.id || orderTitleId;
			labelledBy.push(title.id);
		}

		screen.setAttribute('role', 'group');
		screen.setAttribute('aria-labelledby', labelledBy.join(' '));
	}
	else
	{
		// the focused heading says itself: a group named by it would make the reader say it twice
		screen.removeAttribute('role');
		screen.removeAttribute('aria-labelledby');
	}

	const target = control ?? heading;
	target.focus({ focusVisible: true });

	if (target !== document.activeElement)
	{
		moveFocusToStage(container);
	}
}

/**
 * A field the server refused is where the buyer has to go next: the reader says its error text from there.
 */
export function moveFocusToRejectedField(form)
{
	form?.querySelector(rejectedField)?.focus();
}

BitrixVue.component('sale-checkout-form', {
	data()
	{
		return {
			stage: ApplicationConst.stage,
			mode: ApplicationConst.mode,
			status: LoaderConst.status,
			totalIsShow: 'N'
		}
	},
	computed:
	{
		checkoutButtonEnabled()
		{
			const properties = [];

			let list = this.$store.getters['property/getProperty'];

			for (let listKey in list)
			{
				if (!Type.isStringFilled(list[listKey].value) && list[listKey].required === 'Y')
				{
					return false;
				}

				if (!Type.isStringFilled(list[listKey].value))
				{
					continue;
				}

				if (
					list[listKey].type === PropertyConst.type.checkbox
					&& list[listKey].required === 'Y'
					&& list[listKey].value !== 'Y'
				)
				{
					return false;
				}

				if (list[listKey].type === PropertyConst.type.checkbox)
				{
					continue;
				}

				properties.push(list[listKey].value);
			}

			return properties.length > 0
		},
		hasPS()
		{
			const result = [];
			let list = this.$store.getters['pay-system/getPaySystem'];
			list.forEach((fields) => {
				if(fields.type !== PaySystemConst.type.cash)
				{
					result.push(fields)
				}
			})
			return result.length > 0
		},
		needCheckConsent()
		{
			return this.getConsent.items.length > 0;
		},
		getBasket()
		{
			return this.$store.getters['basket/getBasket'];
		},
		getBasketErrors()
		{
			return this.$store.getters['basket/getErrors'];
		},
		getOrder()
		{
			return this.$store.getters['order/getOrder'];
		},
		getProperty()
		{
			return this.$store.getters['property/getProperty'];
		},
		getVariant()
		{
			return this.$store.getters['property-variant/getVariant'];
		},
		getPropertyErrors()
		{
			return this.$store.getters['property/getErrors'];
		},
		getTotal()
		{
			const total = this.$store.getters['basket/getTotal'];
			return {
				price: total.price,
				basePrice: total.basePrice,
				discount: this.$store.getters['basket/getDiscount'],
				currency: this.$store.getters['basket/getCurrency']
			}
		},
		getConsent()
		{
			return this.$store.getters['consent/get'];
		},
		getStage()
		{
			return this.$store.getters['application/getStage'];
		},
		getStatus()
		{
			return this.$store.getters['application/getStatus'];
		},
		getBasketConfig()
		{
			return {
				status: this.$store.getters['basket/getStatus']
			}
		},
		getPaySystem()
		{
			return this.$store.getters['pay-system/getPaySystem']
		},
		getCheck()
		{
			return this.$store.getters['check/getCheck']
		},
		getPayment()
		{
			return this.$store.getters['payment/getPayment']
		},
		getPaymentConfig()
		{
			return {
				status: this.$store.getters['pay-system/getStatus'],
				returnUrl: this.$store.getters['application/getPathLocation'],
				mainPage: this.$store.getters['application/getPathMainPage'],
			}
		},
		getSuccessfulConfig()
		{
			return {
				mainPage: this.$store.getters['application/getPathMainPage'],
			}
		},
		getEmptyCartConfig()
		{
			return {
				path: this.$store.getters['application/getPath'],
			}
		},
		getTitleCheckoutButton()
		{
			return {
				title: this.$store.getters['application/getTitleCheckoutButton'],
			}
		},
		getErrors()
		{
			return this.$store.getters['application/getErrors'];
		}
	},
	watch:
	{
		getStage(stage)
		{
			const moveFocus = statusStages.has(stage) ? moveFocusToPlacedOrder : moveFocusToStage;

			this.$nextTick(() => moveFocus(this.$el.querySelector(stageContainer)));
		},
		checkoutButtonEnabled()
		{
			// the button is replaced by another component, and a focus left on the old node falls to the body
			const holdsFocus = this.$el.querySelector(checkoutButtonContainer)?.contains(document.activeElement);

			this.$nextTick(() => {
				if (holdsFocus)
				{
					this.$el.querySelector(`${checkoutButtonContainer} button`)?.focus();
				}
			});
		},
	},
	created()
	{
		this.unsubscribeOrderAnswer = this.$store.subscribe((mutation) => {
			if (orderAnswerMutations.has(mutation.type))
			{
				this.$nextTick(() => moveFocusToRejectedField(this.$el));
			}
		});

		EventEmitter.subscribe(EventType.basket.backdropTotalOpen, (event) => {
			this.totalIsShow = 'Y';
		});

		EventEmitter.subscribe(EventType.basket.backdropTotalClose, (event) => {
			this.totalIsShow = 'N';
		});
	},
	beforeDestroy()
	{
		this.unsubscribeOrderAnswer();
		EventEmitter.unsubscribe(EventType.basket.backdropTotalOpen);
		EventEmitter.unsubscribe(EventType.basket.backdropTotalClose);
	},
	// language=Vue
	template: `
      <div class="checkout-container-wrapper" data-testid="sale-checkout-form">
		  <div class="checkout-basket-container" data-testid="sale-checkout-stage">
			<template v-if="getStage === stage.edit">
			  <sale-checkout-view-product :items="getBasket" :total="getTotal" :mode="mode.edit" :errors="getBasketErrors" :config="getBasketConfig"/>
			  <sale-checkout-view-property :items="getProperty" :mode="mode.edit" :errors="getPropertyErrors" :propertyVariants="getVariant"/>
			  <sale-checkout-view-alert-list :errors="getErrors"/>
			  <sale-checkout-view-user_consent :item="getConsent" v-if="needCheckConsent"/>
			  <template v-if="checkoutButtonEnabled">
				<sale-checkout-view-element-button-checkout :title="getTitleCheckoutButton.title" :wait="getStatus === status.wait"/>
			  </template>
			  <template v-else>
				<sale-checkout-view-element-button-checkout_disabled :title="getTitleCheckoutButton.title"/>
			  </template>
			</template>
			<template v-else-if="getStage === stage.success">
			  <template v-if="hasPS">
				<sale-checkout-view-successful :items="getProperty" :order="getOrder" :config="getSuccessfulConfig"/>
			  </template>
			  <template v-else>
				<sale-checkout-view-successful-without-ps :items="getProperty" :order="getOrder" :config="getSuccessfulConfig"/>
			  </template>
			</template>
			<template v-else-if="getStage === stage.payed">
              <sale-checkout-view-successful_ps_return :items="getProperty" :order="getOrder" :total="getTotal" :config="getSuccessfulConfig"/>
			</template>
			<template v-else-if="getStage === stage.view">
			  <sale-checkout-view-product :items="getBasket" :total="getTotal" :mode="mode.view" :errors="getBasketErrors" :config="getBasketConfig"/>
			  <sale-checkout-view-property :items="getProperty" :mode="mode.view" :order="getOrder" :propertyVariants="getVariant"/>
			  <sale-checkout-view-product-summary :total="getTotal" :mode="mode.view"/>
              <sale-checkout-view-payment :order="getOrder" :payments="getPayment" :paySystems="getPaySystem" :check="getCheck" :config="getPaymentConfig"/>
			</template>
			<template v-else-if="getStage === stage.empty">
			  <sale-checkout-view-empty_cart :config="getEmptyCartConfig"/>
			</template>
		  </div>
		  <template v-if="getStage === stage.view">
			<sale-checkout-view-total :total="getTotal" :showBackdrop="totalIsShow"/>
		  </template>
      </div>
	`
});