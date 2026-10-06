/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, ui_select) {
	'use strict';

	// @vue/component
	const UiSelect = ui_vue3.defineComponent({
		name: 'UiSelect',
		props: {
			modelValue: {
				type: [String, Number, null],
				default: null
			},
			label: {
				type: String,
				default: ''
			},
			/** @type{Array<UiSelectItem>} */
			items: {
				type: Array,
				default: () => []
			},
			disabled: {
				type: Boolean,
				default: false
			},
			inputClassName: {
				type: String,
				default: ''
			},
			targetContainer: {
				type: [HTMLElement, null],
				default: null
			}
		},
		emits: ['update:modelValue'],
		watch: {
			modelValue(value) {
				this.select.setValue(String(value ?? ''));
			},
			items() {
				this.initSelect();
			},
			disabled() {
				this.updateDisabled();
			}
		},
		mounted() {
			this.initSelect();
		},
		methods: {
			initSelect() {
				this.select = new ui_select.Select({
					options: this.items.map(item => {
						return {
							value: String(item.id),
							label: item.title
						};
					}),
					value: String(this.modelValue ?? ''),
					placeholder: this.label,
					containerClassname: `socialnetwork--ui-select ${this.inputClassName}`,
					popupParams: {
						targetContainer: this.targetContainer || document.body
					}
				});
				this.select.subscribe('update', this.handleUpdate);
				this.select.renderTo(this.$refs.container);
				this.updateDisabled();
			},
			handleUpdate(event) {
				const selectedItem = this.items.find(item => String(item.id) === event.getData());
				if (selectedItem && selectedItem.id !== this.modelValue) {
					this.$emit('update:modelValue', selectedItem.id);
				}
			},
			updateDisabled() {
				this.select.getInput().disabled = this.disabled;
			}
		},
		template: `
		<div ref="container"></div>
	`
	});

	exports.UiSelect = UiSelect;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX.Ui);
//# sourceMappingURL=ui-select.bundle.js.map
