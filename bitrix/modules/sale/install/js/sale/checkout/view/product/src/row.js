import { BitrixVue } from 'ui.vue';
import { EventType, Application, Loader as LoaderConst, Product as ProductConst } from 'sale.checkout.const';
import { EventEmitter } from 'main.core.events';
import { MixinLoader } from 'sale.checkout.view.mixins';
import { Product as ProductLib } from 'sale.checkout.lib'

import 'sale.checkout.view.element.button';

import { changeVariationButton, moveFocus, removeButtons, restoreButton } from './focus';

import './item-backdrop'
import './item-deleted'
import './item-view'
import './item-edit'
import './measure'
import './price-measure'

BitrixVue.component('sale-checkout-view-product-row', {
	props: ['item', 'index', 'mode', 'error'],
	mixins:[MixinLoader],
	data()
	{
		return {
			showBackdropMobileMenu : 'N',
			showBackdropChangeSku : 'N',
		}
	},
	computed:
	{
		config()
		{
			return {status: this.item.status}
		},
		hasSkuPropsColor()
		{
			let tree = this.item.sku.tree
			return tree.hasOwnProperty('EXISTING_VALUES') && tree.EXISTING_VALUES.hasOwnProperty('COLOR_REF')
		},
		isBackdropMobileMenu()
		{
			return this.showBackdropMobileMenu === 'Y';
		},
		isBackdropChangeSku()
		{
			return this.showBackdropChangeSku === 'Y';
		},
		isDeleted()
		{
			return this.item.deleted === 'Y';
		},

		isLocked()
		{
			return this.item.status === LoaderConst.status.wait
		},
		getConstMode()
		{
			return Application.mode
		},
		isService()
		{
			return ProductLib.isService(this.item);
		},
		buttonMinusDisabled()
		{
			return this.item.quantity - this.item.product.ratio < this.item.product.ratio
		},
		buttonPlusDisabled()
		{
			return this.item.quantity + this.item.product.ratio > this.item.product.availableQuantity
		},
		getObjectClass()
		{
			const classes = [
				'checkout-table-row-group',
				'checkout-basket-item',
			];

			if (this.hasSkuPropsColor)
			{
				classes.push('checkout-basket-item--has-sku-color')
			}

			if(this.isDeleted)
			{
				classes.push('checkout-basket-item-deleted')
			}

			if(this.isLocked)
			{
				classes.push('checkout-basket-item-locked');
			}

			if(this.isBackdropChangeSku)
			{
				classes.push('active-backdrop-open-change-sku');
			}
			if(this.isBackdropMobileMenu)
			{
				classes.push('active-backdrop-open-mobile-menu');

			}

			return classes;
		}
	},
	watch:
	{
		isDeleted()
		{
			this.applyFocusRequest();
		},
		isBackdropChangeSku(opened)
		{
			if (!opened)
			{
				this.applyFocusRequest();
			}
		},
	},
	created()
	{
		// where the focus lands once the row is redrawn, which the controller debounce puts long after the click
		this.focusRequest = null;

		this.basketEventHandlers = {
			[EventType.basket.buttonRemoveProduct]: (event) => {
				let index = event.getData().index;
				if (index === this.index && !this.isLocked && !this.isDeleted)
				{
					this.requestFocus(restoreButton);
				}
			},
			[EventType.basket.buttonRestoreProduct]: (event) => {
				let index = event.getData().index;
				if (index === this.index && !this.isLocked && this.isDeleted)
				{
					this.requestFocus(removeButtons);
				}
			},
			[EventType.basket.backdropOpenMobileMenu]: (event) => {
				let index = event.getData().index;
				if(index === this.index && !this.isLocked)
				{
					this.showBackdropMobileMenu = 'Y'
				}
			},
			[EventType.basket.backdropOpenChangeSku]: (event) => {
				let index = event.getData().index;
				if(index === this.index && !this.isLocked)
				{
					this.showBackdropChangeSku = 'Y'
				}
			},
			[EventType.basket.backdropClose]: (event) => {
				let index = event.getData().index;
				if(index === this.index)
				{
					const changeSkuWasOpen = this.isBackdropChangeSku;

					this.showBackdropMobileMenu = 'N'
					this.showBackdropChangeSku = 'N'

					if (changeSkuWasOpen)
					{
						this.requestFocus(changeVariationButton);
					}
				}
			},
		};

		Object.entries(this.basketEventHandlers).forEach(([eventName, handler]) => {
			EventEmitter.subscribe(eventName, handler);
		});
	},
	beforeDestroy()
	{
		Object.entries(this.basketEventHandlers).forEach(([eventName, handler]) => {
			EventEmitter.unsubscribe(eventName, handler);
		});
	},
	methods:
	{
		requestFocus(selectors)
		{
			const container = this.$refs.container;

			if (!container || !container.contains(document.activeElement))
			{
				return;
			}

			this.focusRequest = { selectors, item: this.item };
		},
		applyFocusRequest()
		{
			const request = this.focusRequest;
			this.focusRequest = null;

			// another product means a neighbour left and the row shifted up; the list moves that focus
			if (request === null || request.item !== this.item)
			{
				return;
			}

			this.$nextTick(() => {
				const container = this.$refs.container;

				if (!container)
				{
					return;
				}

				moveFocus(request.selectors.map((selector) => container.querySelector(selector)), container);
			});
		},
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
