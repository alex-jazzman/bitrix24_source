/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_system_input_vue, ui_system_menu_vue) {
	'use strict';

	// @vue/component
	const UiSelect = {
		name: 'UiSelect',
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu
		},
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
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			inputValue() {
				return this.items.find(item => this.isSelectedItem(item))?.title ?? '';
			}
		},
		methods: {
			selectItem(item) {
				this.$emit('update:modelValue', item.id);
			},
			isSelectedItem(item) {
				return item.id === this.modelValue;
			},
			getMenuOptions() {
				return {
					bindElement: this.$refs.selector.$el,
					targetContainer: this.targetContainer || document.body,
					items: this.items.map(item => {
						return {
							title: item.title,
							icon: item.icon,
							isSelected: this.isSelectedItem(item),
							design: item.disabled ? ui_system_menu_vue.MenuItemDesign.Disabled : ui_system_menu_vue.MenuItemDesign.Default,
							onClick: () => this.selectItem(item)
						};
					})
				};
			}
		},
		template: `
		<BInput
			:modelValue="inputValue"
			:label
			:disabled
			dropdown
			clickable
			:class="inputClassName"
			:active="isMenuShown"
			ref="selector"
			@click="isMenuShown = true"
		/>
		<BMenu v-if="isMenuShown" :options="getMenuOptions()" @close="isMenuShown = false"/>
	`
	};

	exports.UiSelect = UiSelect;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.UI.System.Input.Vue, BX.UI.System.Menu);
//# sourceMappingURL=ui-select.bundle.js.map
