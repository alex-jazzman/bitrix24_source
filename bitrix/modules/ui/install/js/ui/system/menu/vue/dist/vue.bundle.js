/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core, ui_system_menu) {
	'use strict';

	const BMenu = {
		name: 'BMenu',
		props: {
			id: {
				type: String,
				default: () => `ui-vue3-menu-${main_core.Text.getRandom()}`
			},
			options: {
				/** @type MenuOptions */
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			menuOptions() {
				return {
					...this.defaultOptions,
					...this.options
				};
			},
			defaultOptions() {
				return {
					id: this.id,
					cacheable: false,
					animation: 'fading',
					events: {
						onClose: this.handleClose,
						onDestroy: this.handleClose
					}
				};
			}
		},
		watch: {
			'options.items': {
				deep: true,
				handler(items) {
					// The rest of the options belongs to the instance and is read once, but the
					// items are the menu's content: a consumer keeps them in its own state, so
					// they follow it — in place, with the open submenu and the focus preserved.
					this.menu?.updateItems(items);
				}
			}
		},
		mounted() {
			this.menu = new ui_system_menu.Menu(this.menuOptions);
			this.menu.show();
		},
		unmounted() {
			this.menu?.close();
		},
		methods: {
			handleClose() {
				this.$emit('close');
			}
		},
		template: `
		<div v-if="false"></div>
	`
	};

	exports.Menu = ui_system_menu.Menu;
	exports.MenuItemDesign = ui_system_menu.MenuItemDesign;
	exports.MenuRichHeaderDesign = ui_system_menu.MenuRichHeaderDesign;
	exports.MenuSectionDesign = ui_system_menu.MenuSectionDesign;
	exports.BMenu = BMenu;

})(this.BX.UI.System.Menu = this.BX.UI.System.Menu || {}, BX, BX.UI.System);
//# sourceMappingURL=vue.bundle.js.map
