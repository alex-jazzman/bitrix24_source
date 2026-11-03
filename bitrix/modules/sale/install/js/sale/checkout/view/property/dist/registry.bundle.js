/* eslint-disable */
(function (ui_vue, sale_checkout_const, sale_checkout_view_element_input, main_core) {
		'use strict';

		ui_vue.BitrixVue.component('sale-checkout-view-property-note_error', {
			props: ['errorId', 'message'],
			template: `
				<div class="invalid-feedback" :id="errorId" data-testid="sale-checkout-property-error">
						{{message}}
				</div>
	`
		});

		ui_vue.BitrixVue.component('sale-checkout-view-property-list_edit', {
			props: ['items', 'errors', 'propertyVariants'],
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PROPERTY_LIST_'));
				}
			},
			methods: {
				getErrorMessage(item) {
					let error = this.errors.find(error => error.propertyId === item.id);
					return typeof error !== 'undefined' ? error.message : null;
				},
				// the field builds the same id from the same index for its aria-describedby
				getErrorId(index) {
					return `sale-checkout-property-error-${index}`;
				},
				isPhone(item) {
					return item.type === sale_checkout_const.Property.type.phone;
				},
				isName(item) {
					return item.type === sale_checkout_const.Property.type.name;
				},
				isEmail(item) {
					return item.type === sale_checkout_const.Property.type.email;
				},
				isNumber(item) {
					return item.type === sale_checkout_const.Property.type.number;
				},
				isCheckbox(item) {
					return item.type === sale_checkout_const.Property.type.checkbox;
				},
				isDate(item) {
					return item.type === sale_checkout_const.Property.type.date;
				},
				isDateTime(item) {
					return item.type === sale_checkout_const.Property.type.datetime;
				},
				isEnum(item) {
					return item.type === sale_checkout_const.Property.type.enum;
				},
				isFailure(item) {
					return item.validated === sale_checkout_const.Property.validate.failure;
				},
				getVariantsByPropertyId(propertyId) {
					return this.propertyVariants.filter(variant => variant.propertyId === propertyId);
				}
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

		ui_vue.BitrixVue.component('sale-checkout-view-property-list_view', {
			props: ['items', 'number', 'propertyVariants'],
			computed: {
				localize() {
					return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PROPERTY_LIST_VIEW_'));
				},
				getTitle() {
					let message = this.localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_ORDER_TITLE;
					return message.replace('#ORDER_NUMBER#', this.number);
				},
				getPropertiesShort() {
					const properties = [];
					for (let propertyId in this.items) {
						if (main_core.Type.isStringFilled(this.items[propertyId].value)) {
							properties.push(this.items[propertyId].value);
						}
					}
					return properties.join(', ');
				}
			},
			methods: {
				resolveValue(item) {
					if (item.type === sale_checkout_const.Property.type.checkbox) {
						return item.value === 'Y' ? this.localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_CHECKBOX_Y : this.localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_CHECKBOX_N;
					} else if (item.type === sale_checkout_const.Property.type.enum) {
						return this.propertyVariants.find(variant => variant.value === item.value && variant.propertyId === item.id).name;
					}
					return item.value;
				}
			},
			template: `
		<div class="checkout-basket-section">
		<h2 class="checkout-basket-title">{{localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_PROPERTIES}}</h2>
	
						<div class="checkout-item-personal-order-info">
							<div class="checkout-item-personal-order-payment">
								<div v-for="(item, index) in items" :key="index">{{item.name}}: <b>{{resolveValue(item)}}</b></div>
<!--								<div>{{getPropertiesShort}}</div>-->
							</div>
<!--							<div class="checkout-item-personal-order-shipping">-->
<!--								<strong>{{localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_SHIPPING_METHOD}}</strong>-->
<!--								<div>{{localize.CHECKOUT_VIEW_PROPERTY_LIST_VIEW_SHIPPING_METHOD_DESCRIPTION}}</div>-->
<!--							</div>-->
						</div>
			
		</div>
	`
		});

		ui_vue.BitrixVue.component('sale-checkout-view-property', {
			props: ['items', 'mode', 'order', 'propertyVariants', 'errors'],
			computed: {
				getConstMode() {
					return sale_checkout_const.Application.mode;
				}
			},
			template: `
		<div>
				<template v-if="mode === getConstMode.edit">
						 <sale-checkout-view-property-list_edit :items="items" :errors="errors" :propertyVariants="propertyVariants"/>
				</template>
				<template v-else>
						<sale-checkout-view-property-list_view :items="items" :number="order.accountNumber" :propertyVariants="propertyVariants"/>
						</template>
				</div>
	`
		});

})(BX, BX.Sale.Checkout.Const, BX.Sale.Checkout.View.Element.Input, BX);
//# sourceMappingURL=registry.bundle.js.map
