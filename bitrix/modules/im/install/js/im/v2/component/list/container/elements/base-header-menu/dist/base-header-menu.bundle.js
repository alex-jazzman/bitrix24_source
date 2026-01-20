/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_component_elements_menu) {
	'use strict';

	// @vue/component
	const BaseHeaderMenu = {
	  name: 'BaseHeaderMenu',
	  components: {
	    MessengerMenu: im_v2_component_elements_menu.MessengerMenu
	  },
	  data() {
	    return {
	      showPopup: false
	    };
	  },
	  computed: {
	    menuConfig() {
	      return {
	        id: 'im-recent-header-menu',
	        width: 284,
	        bindElement: this.$refs.icon || {},
	        offsetTop: 4,
	        padding: 0
	      };
	    }
	  },
	  methods: {
	    onIconClick() {
	      this.showPopup = true;
	    },
	    onClose() {
	      this.showPopup = false;
	    }
	  },
	  template: `
		<div 
			class="bx-im-list-container-base-header-menu__icon"
			:class="{'--active': showPopup }"
			@click="onIconClick"
			ref="icon"
		>
			<MessengerMenu v-if="showPopup" :config="menuConfig" @close="onClose">
				<slot name="menu-items" :closeCallback="onClose"></slot>
			</MessengerMenu>
		</div>
	`
	};

	exports.BaseHeaderMenu = BaseHeaderMenu;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Component.Elements));
//# sourceMappingURL=base-header-menu.bundle.js.map
