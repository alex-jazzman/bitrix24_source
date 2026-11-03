import { BitrixVue } from 'ui.vue';
import { Property as Const } from 'sale.checkout.const';

import 'sale.checkout.view.element.input';

import './note-error'

BitrixVue.component('sale-checkout-view-property-list_edit', {
	props: ['items', 'errors', 'propertyVariants'],
	computed: {
		localize()
		{
			return Object.freeze(
				BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PROPERTY_LIST_'))
		},
	},
	methods: {
		getErrorMessage(item)
		{
			let error = this.errors.find(error => error.propertyId === item.id);
			return typeof error !== 'undefined' ? error.message : null
		},
		// the field builds the same id from the same index for its aria-describedby
		getErrorId(index)
		{
			return `sale-checkout-property-error-${index}`;
		},
		isPhone(item)
		{
			return item.type === Const.type.phone
		},
		isName(item)
		{
			return item.type === Const.type.name
		},
		isEmail(item)
		{
			return item.type === Const.type.email
		},
		isNumber(item)
		{
			return item.type === Const.type.number
		},
		isCheckbox(item)
		{
			return item.type === Const.type.checkbox
		},
		isDate(item)
		{
			return item.type === Const.type.date
		},
		isDateTime(item)
		{
			return item.type === Const.type.datetime
		},
		isEnum(item)
		{
			return item.type === Const.type.enum
		},
		isFailure(item)
		{
			return item.validated === Const.validate.failure
		},
		getVariantsByPropertyId(propertyId)
		{
			return this.propertyVariants.filter(variant => variant.propertyId === propertyId);
		},
	},
	// language=Vue
	template: `
		<div class="checkout-basket-section checkout-basket-section-personal-form" data-testid="sale-checkout-property-list">
			<h2 class="checkout-basket-title">{{localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_SHIPPING_CONTACTS}}</h2>
			<div class="form-group" v-for="(item, index) in items" :key="index" :data-testid="'sale-checkout-property-' + index">
				<sale-checkout-view-element-input-property-text v-if="isName(item)"
					:item="item" 
					:index="index" 
					autocomplete="name"
				/>
				<sale-checkout-view-element-input-property-phone v-else-if="isPhone(item)" 
					:item="item" 
					:index="index"
				/>
				<sale-checkout-view-element-input-property-email v-else-if="isEmail(item)" 
					:item="item" 
					:index="index" 
					autocomplete="email" 
				/>
				<sale-checkout-view-element-input-property-checkbox v-else-if="isCheckbox(item)" 
					:item="item" 
					:index="index" 
					:autocomplete="item.value" 
				/>
				<sale-checkout-view-element-input-property-number v-else-if="isNumber(item)" 
					:item="item" 
					:index="index"
				/>
				<sale-checkout-view-element-input-property-date v-else-if="isDate(item) || isDateTime(item)"
					:item="item"
					:index="index"
					autocomplete="off"
					:isDateTime="isDateTime(item)"
				/>
				<sale-checkout-view-element-input-property-enum v-else-if="isEnum(item)"
					:item="item"
					:index="index"
					:variants="getVariantsByPropertyId(item.id)"
				/>
				<sale-checkout-view-element-input-property-text v-else
					:item="item" 
					:index="index" 
					autocomplete="off"
				/>

				<sale-checkout-view-property-note_error v-if="isFailure(item)"
					:errorId="getErrorId(index)"
					:message="getErrorMessage(item)"
				/>
			</div>
		</div>
	`
});