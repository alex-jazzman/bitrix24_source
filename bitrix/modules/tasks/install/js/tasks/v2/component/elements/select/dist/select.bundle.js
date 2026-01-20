/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_system_input_vue,ui_system_menu_vue) {
	'use strict';

	// @vue/component
	const UiSelect = {
	  name: 'UiSelect',
	  components: {
	    BInput: ui_system_input_vue.BInput,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  props: {
	    /** @type{Item} */
	    item: {
	      type: Object,
	      required: true
	    },
	    /** @type{Item[]} */
	    items: {
	      type: Array,
	      default: () => []
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    size: {
	      type: String,
	      default: ui_system_input_vue.InputSize.Sm
	    },
	    targetContainer: {
	      type: [HTMLElement, null],
	      default: null
	    },
	    menuOptions: {
	      type: Object,
	      default: null
	    }
	  },
	  emits: ['update:item'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign
	    };
	  },
	  data() {
	    return {
	      isShown: false
	    };
	  },
	  computed: {
	    options() {
	      return {
	        bindElement: this.$refs.input.$el,
	        closeOnItemClick: false,
	        targetContainer: this.targetContainer || document.body,
	        items: this.items.map(item => {
	          return {
	            title: item.title,
	            isSelected: item.id === this.item.id,
	            design: item.disabled ? ui_system_menu_vue.MenuItemDesign.Disabled : ui_system_menu_vue.MenuItemDesign.Default,
	            onClick: () => {
	              if (item.disabled) {
	                return;
	              }
	              this.$emit('update:item', item);
	              this.isShown = false;
	            }
	          };
	        }),
	        ...this.menuOptions
	      };
	    }
	  },
	  methods: {
	    inputClick() {
	      if (this.disabled) {
	        return;
	      }
	      this.isShown = true;
	    }
	  },
	  template: `
		<div class="tasks-select">
			<BInput
				:modelValue="item.title"
				dropdown
				clickable
				:active="isShown"
				:size
				:design="disabled ? InputDesign.Disabled : InputDesign.Default"
				ref="input"
				@click="inputClick"
			/>
			<BMenu
				v-if="isShown"
				:options
				@close="isShown = false"
			/>
		</div>
	`
	};

	exports.UiSelect = UiSelect;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.System.Input.Vue,BX.UI.System.Menu));
//# sourceMappingURL=select.bundle.js.map
