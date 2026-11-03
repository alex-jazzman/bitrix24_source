/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
this.BX.Sale.Checkout = this.BX.Sale.Checkout || {};
this.BX.Sale.Checkout.View = this.BX.Sale.Checkout.View || {};
this.BX.Sale.Checkout.View.Element = this.BX.Sale.Checkout.View.Element || {};
(function (exports, ui_vue, main_core, main_core_events, sale_checkout_const, ui_type, ui_entitySelector) {
	'use strict';

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-product_item_quantity', {
		props: ['item', 'index'],
		data() {
			return {
				quantity: this.item.quantity
			};
		},
		methods: {
			validate() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.basket.inputChangeQuantityProduct, {
					index: this.index
				});
			},
			onKeyDown(e) {
				if (e.key === 'Enter') {
					// recalculation runs in place: leaving the field would also lose the focus
					e.preventDefault();
					this.validate();
				}
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'checkout-item-quantity-field': true
				};
			},
			accessibleName() {
				return main_core.Loc.getMessage('CHECKOUT_VIEW_ELEMENT_INPUT_PRODUCT_ITEM_QUANTITY_NAME', {
					'#NAME#': this.item.name
				});
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

	const caretKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

	/**
	 * A field that filters what the buyer types still has to let the caret move.
	 */
	function isCaretKey(key) {
		return caretKeys.has(key);
	}

	/**
	 * Shared by the contact form fields. The ids come from the property index, so the error block
	 * the property list renders can point at the same field.
	 */
	const MixinPropertyField = {
		props: ['item', 'index'],
		computed: {
			fieldId() {
				return `sale-checkout-property-field-${this.index}`;
			},
			fieldErrorId() {
				return `sale-checkout-property-error-${this.index}`;
			},
			isRequired() {
				return this.item.required === 'Y';
			},
			isInvalid() {
				return this.item.validated === sale_checkout_const.Property.validate.failure;
			},
			// strings: Vue 2 drops an attribute bound to false
			ariaRequired() {
				return this.isRequired ? 'true' : 'false';
			},
			ariaInvalid() {
				return this.isInvalid ? 'true' : 'false';
			},
			errorDescribedBy() {
				return this.isInvalid ? this.fieldErrorId : null;
			}
		},
		methods: {
			validate() {
				main_core_events.EventEmitter.emit(sale_checkout_const.EventType.property.validate, {
					index: this.index
				});
			}
		}
	};

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-phone', {
		mixins: [MixinPropertyField],
		props: ['item', 'index'],
		methods: {
			onKeyDown(e) {
				let value = e.key;
				if (ui_type.PhoneFilter.replace(value) !== '') {
					return;
				}
				if (isCaretKey(e.key) || ['Esc', 'Delete', 'Backspace', 'Tab'].indexOf(e.key) >= 0) {
					return;
				}
				if (e.ctrlKey || e.metaKey) {
					return;
				}
				e.preventDefault();
			},
			onInput() {
				let value = ui_type.PhoneFormatter.formatValue(this.value);
				if (this.value !== value) {
					this.validate();
					this.value = value;
				}
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			value: {
				get() {
					return this.item.value;
				},
				set(newValue) {
					this.item.value = newValue;
				}
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-phone">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				@input="onInput"
				@keydown="onKeyDown"
				v-model="value"
				autocomplete="tel"
				inputmode="tel"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-text', {
		mixins: [MixinPropertyField],
		props: ['item', 'index', 'autocomplete'],
		data() {
			return {
				showAsterisk: this.showAsterisk
			};
		},
		methods: {
			onKeyUp(e) {
				if (['Esc', 'Tab'].indexOf(e.key) >= 0) {
					return;
				}
				if (e.ctrlKey || e.metaKey) {
					return;
				}
				if (this.isKeyAndroidChrome(e.key)) {
					this.hideAsteriskAndroid();
					return;
				}
				this.validate();
			},
			isKeyAndroidChrome(key) {
				return key === 'Unidentified';
			},
			hideAsteriskAndroid() {
				const asterisk = this.$el.getElementsByTagName('span')[0];
				asterisk.style.display = 'none';
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-text">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				type="text"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				:autocomplete="autocomplete"
				v-model="item.value"
				@keyup="onKeyUp"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-email', {
		mixins: [MixinPropertyField],
		props: ['item', 'index', 'autocomplete'],
		methods: {
			onKeyUp(e) {
				if (['Esc', 'Tab'].indexOf(e.key) >= 0) {
					return;
				}
				if (e.ctrlKey || e.metaKey) {
					return;
				}
				if (this.isKeyAndroidChrome(e.key)) {
					this.hideAsteriskAndroid();
					return;
				}
				this.validate();
			},
			isKeyAndroidChrome(key) {
				return key === 'Unidentified';
			},
			hideAsteriskAndroid() {
				const asterisk = this.$el.getElementsByTagName('span')[0];
				asterisk.style.display = 'none';
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-email">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				type="text"
				inputmode="email"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				:autocomplete="autocomplete"
				v-model="item.value"
				@keyup="onKeyUp"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-number', {
		mixins: [MixinPropertyField],
		props: ['item', 'index'],
		methods: {
			onKeyDown(e) {
				if (!isNaN(Number(e.key)) && e.key !== ' ') {
					return;
				}
				if (e.ctrlKey || e.metaKey || isCaretKey(e.key) || ['Esc', 'Tab', 'Backspace', 'Delete', '.'].indexOf(e.key) >= 0) {
					return;
				}
				e.preventDefault();
			},
			onPaste(e) {
				e.preventDefault();
				const pastedText = e.clipboardData.getData('Text');
				if (!isNaN(Number(pastedText))) {
					this.item.value = pastedText.trim();
				}
				this.validate();
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-number">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				@keydown="onKeyDown"
				@keyup="validate"
				@paste="onPaste"
				type="text"
				inputmode="numeric"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				v-model="item.value"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-checkbox', {
		mixins: [MixinPropertyField],
		props: ['item', 'index'],
		data() {
			return {
				'showValue': this.item.value === 'Y'
			};
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			switchValue: {
				get() {
					this.showValue = this.item.value === 'Y';
					return this.item.value === 'Y';
				},
				set(value) {
					if (value) {
						this.item.value = 'Y';
						this.showValue = true;
					} else {
						this.item.value = 'N';
						this.showValue = false;
					}
					this.validate();
				}
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-control form-control-lg border-0 pl-0 form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-checkbox">
			<input
				@blur="validate"
				type="checkbox"
				:id="fieldId"
				:value="showValue"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				v-model="switchValue"
			/>
			<label :for="fieldId" class="ml-2">{{item.name}}</label>
			<div
				class="asterisk-item"
				v-if="isRequired"
			>
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-date', {
		mixins: [MixinPropertyField],
		props: ['item', 'index', 'autocomplete', 'isDateTime'],
		methods: {
			onClick() {
				this.showCalendar();
				this.focusOnInput();
			},
			focusOnInput() {
				const element = this.$el.children[0];
				element.focus();
			},
			showCalendar() {
				BX.calendar({
					node: this.item.name,
					field: this.item.name,
					bTime: this.isDateTime,
					bUseSecond: false,
					callback_after: data => this.handleDate(data)
				});
			},
			handleDate(date) {
				const dateString = this.prepareDate(date);
				this.changeValue(dateString);
			},
			prepareDate(date) {
				if (this.isDateTime === true) {
					return date.toLocaleString([], {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
						hour: 'numeric',
						minute: 'numeric'
					}).replace(',', '');
				} else {
					return date.toLocaleDateString().replace(',', '');
				}
			},
			blur() {
				if (main_core.Type.isStringFilled(this.item.value)) {
					this.changeValue(this.item.value);
				}
			},
			changeValue(value) {
				let changeValue = '';
				if (main_core.Type.isStringFilled(value)) {
					changeValue = this.validateDate(value) ? this.prepareDate(BX.parseDate(value)) : this.previousValue;
				}
				this.setDate(changeValue);
				this.validate();
			},
			validateDate(value) {
				const date = BX.parseDate(value);
				return date && date.toLocaleDateString() !== 'Invalid Date';
			},
			setDate(date) {
				this.item.value = date;
				this.previousValue = date;
			}
		},
		computed: {
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			}
		},
		// language=Vue
		template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-date">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="blur"
				type="text"
				inputmode="numeric"
				:name="item.name"
				@click="onClick"
				@drop="(e) => e.preventDefault()"
				@dragstart="(e) => e.preventDefault()"
				@paste="(e) => e.preventDefault()"
				:autocomplete="autocomplete"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				v-model="item.value"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	const openingKeys = ['Enter', ' ', 'ArrowDown'];
	ui_vue.BitrixVue.component('sale-checkout-view-element-input-property-enum', {
		mixins: [MixinPropertyField],
		props: ['item', 'index', 'variants'],
		data() {
			return {
				expanded: false
			};
		},
		mounted() {
			this.createDialog();
		},
		methods: {
			createDialog() {
				this.popupMenu = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					dropdownMode: true,
					showAvatars: false,
					compactView: true,
					focusOnFirst: false,
					multiple: false,
					items: this.getMenuItems(),
					events: {
						'Item:onSelect': this.onSelect,
						'Item:onDeselect': this.onDeselect,
						onShow: this.onShow,
						onHide: this.onHide
					},
					footer: this.isRequired ? '' : this.getFooter()
				});
				main_core.Dom.style(this.popupMenu.getContainer(), 'width', `${this.$el.clientWidth}px`);
				main_core.Dom.style(this.popupMenu.getContainer(), 'height', '100%');
				window.addEventListener('resize', this.onResize.bind(this));
			},
			getMenuItems() {
				const items = [];
				for (const index in this.variants) {
					const variant = this.variants[index];
					items.push({
						id: variant.id,
						entityId: 'item',
						tabs: 'recents',
						title: variant.name,
						selected: this.item.value === variant.value,
						customData: {
							value: variant.value
						}
					});
				}
				return items;
			},
			deselectAll() {
				this.item.value = '';
				this.popupMenu.deselectAll();
				this.popupMenu.hide();
			},
			onSelect(e) {
				const selectedItem = e.getData().item.getDialog().getSelectedItems()[0];
				this.$el.value = selectedItem.getTitle();
				const customData = Object.fromEntries(selectedItem.getCustomData());
				this.item.value = customData.value;
				this.validate();
			},
			onDeselect() {
				this.item.value = '';
				this.popupMenu.hide();
				this.validate();
			},
			onShow() {
				this.expanded = true;
			},
			onHide() {
				this.expanded = false;
			},
			getFooter() {
				return BX.Tag.render`
					<span onclick="${this.deselectAll}" class="ui-selector-footer-link">
					${this.localize.CHECKOUT_VIEW_PROPERTY_LIST_ENUM_RESET_CHOICE}
					</span>`;
			},
			onKeyDown(e) {
				if (openingKeys.indexOf(e.key) >= 0) {
					// the field holds no text of its own, and Space alone would scroll the page
					e.preventDefault();
					this.render();
				}
			},
			render() {
				this.popupMenu.show();
			},
			onResize() {
				main_core.Dom.style(this.popupMenu.getContainer(), 'width', `${this.$el.clientWidth}px`);
			}
		},
		computed: {
			localize() {
				return Object.freeze(ui_vue.BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PROPERTY_LIST_'));
			},
			checkedClassObject() {
				return {
					'is-invalid': this.item.validated === sale_checkout_const.Property.validate.failure,
					'is-valid': this.item.validated === sale_checkout_const.Property.validate.successful
				};
			},
			getObjectClass() {
				const classes = {
					'form-control': true,
					'form-control-lg': true,
					'ui-ctl': true,
					'p-0': true,
					'border-0': this.item.validated === sale_checkout_const.Property.validate.unvalidated
				};
				return Object.assign(classes, this.checkedClassObject);
			},
			getSelectClass() {
				return {
					'property-enum-desktop': true,
					'form-control': true,
					'form-control-lg': true,
					'ui-ctl-element': true,
					'bg-transparent': true,
					'border-0': this.item.validated !== sale_checkout_const.Property.validate.unvalidated
				};
			},
			defaultValue() {
				if (this.item.value !== '') {
					return this.variants.find(e => e.value === this.item.value).name;
				}
				return '';
			},
			isEmpty() {
				return this.item.value === '';
			},
			isAsteriskShown() {
				return this.isEmpty && this.isRequired;
			},
			ariaExpanded() {
				return this.expanded ? 'true' : 'false';
			}
		},
		// language=Vue
		template: `
		<div
						class="form-wrap form-asterisk"
			:class="getObjectClass"
			data-testid="sale-checkout-property-enum"
			@blur="validate"
		>
			<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			<input
				readonly
				@click="render"
				@keydown="onKeyDown"
				:class="getSelectClass"
				role="combobox"
				:aria-expanded="ariaExpanded"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				:value="defaultValue"
			>
						<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
	});

	exports.MixinPropertyField = MixinPropertyField;

})(this.BX.Sale.Checkout.View.Element.Input = this.BX.Sale.Checkout.View.Element.Input || {}, BX, BX, BX.Event, BX.Sale.Checkout.Const, BX.Ui, BX.UI.EntitySelector);
//# sourceMappingURL=registry.bundle.js.map
