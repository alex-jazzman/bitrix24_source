import { BitrixVue } from 'ui.vue';
import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events'

import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-input-product_item_quantity', {
	props: ['item', 'index'],
	data()
	{
		return {
			quantity: this.item.quantity
		}
	},
	methods:
		{
			validate()
			{
				EventEmitter.emit(EventType.basket.inputChangeQuantityProduct, {index: this.index});
			},
			onKeyDown(e)
			{
				if (e.key === 'Enter')
				{
					// recalculation runs in place: leaving the field would also lose the focus
					e.preventDefault();
					this.validate();
				}
			}
		},
	computed:
		{
			checkedClassObject()
			{
				return {'checkout-item-quantity-field': true}
			},
			accessibleName()
			{
				return Loc.getMessage(
					'CHECKOUT_VIEW_ELEMENT_INPUT_PRODUCT_ITEM_QUANTITY_NAME',
					{'#NAME#': this.item.name},
				);
			}
		},
	// language=Vue
	template: `
      <input :class="checkedClassObject" 
			 type="text" 
			 inputmode="numeric" 
			 :aria-label="accessibleName"
             @blur="validate"
			 @keydown="onKeyDown"
             v-model="item.quantity"
             ref="container"
	  />
	`
});