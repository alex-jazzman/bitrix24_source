/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_system_typography_vue, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const UiAccordion = {
		name: 'UiAccordion',
		provide() {
			return {
				accordion: this
			};
		},
		props: {
			value: {
				type: [Number, String, Array, null],
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			},
			multiple: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		expose: ['isItemOpen', 'toggleItem'],
		methods: {
			isItemOpen(itemValue) {
				if (this.multiple) {
					const values = Array.isArray(this.value) ? this.value : [];
					return values.includes(itemValue);
				}
				return this.value === itemValue;
			},
			toggleItem(itemValue) {
				if (this.disabled) {
					return;
				}
				if (this.multiple) {
					const values = Array.isArray(this.value) ? [...this.value] : [];
					const index = values.indexOf(itemValue);
					if (index >= 0) {
						values.splice(index, 1);
					} else {
						values.push(itemValue);
					}
					this.$emit('update:value', values);
					return;
				}
				this.$emit('update:value', this.value === itemValue ? null : itemValue);
			}
		},
		template: `
		<div class="sonet--ui-accordion">
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const UiAccordionItem = {
		name: 'UiAccordionItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd
		},
		inject: {
			accordion: {
				default: null
			}
		},
		props: {
			value: {
				type: [Number, String],
				required: true
			},
			title: {
				type: String,
				default: null
			},
			iconName: {
				type: [String, null],
				default: null
			},
			iconColor: {
				type: [String, null],
				default: null
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			isOpen() {
				if (!this.accordion) {
					return false;
				}
				return this.accordion.isItemOpen(this.itemValue);
			},
			itemValue() {
				if (this.value === null || this.value === undefined) {
					return this._uid;
				}
				return this.value;
			},
			isDisabled() {
				return Boolean(this.disabled || this.accordion?.disabled);
			}
		},
		methods: {
			onToggle() {
				if (this.isDisabled || !this.accordion) {
					return;
				}
				this.accordion.toggleItem(this.itemValue);
			}
		},
		template: `
		<div class="sonet--ui-accordion-item">
			<button
				class="sonet--ui-accordion-item-head"
				type="button"
				:disabled="isDisabled"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:tabindex="isDisabled ? -1 : 0"
				@click="onToggle"
			>
				<span class="sonet--ui-accordion-item-head-content">
					<slot name="head">
						<BIcon v-if="iconName" :size="24" :name="iconName" :color="iconColor"/>
						<TextMd>{{ title }}</TextMd>
					</slot>
				</span>
				<span
					class="sonet--ui-accordion-item-chevron"
					:class="{ '--open': isOpen }"
				>
					<BIcon :size="26" :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-base-4)"/>
				</span>
			</button>
			<transition name="sonet--ui-accordion-item">
				<div v-if="isOpen" class="sonet--ui-accordion-item-content">
					<slot/>
				</div>
			</transition>
		</div>
	`
	};

	exports.UiAccordion = UiAccordion;
	exports.UiAccordionItem = UiAccordionItem;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.UI.System.Typography.Vue, BX.UI.IconSet);
//# sourceMappingURL=ui-accordion.bundle.js.map
