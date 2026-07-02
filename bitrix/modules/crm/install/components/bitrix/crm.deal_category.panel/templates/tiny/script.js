/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Deal = this.BX.Crm.Deal || {};
(function (exports, main_core, main_popup) {
	'use strict';

	class Panel extends main_core.Event.EventEmitter {
		static createMenuItem(options) {
			const item = {
				id: options.ID,
				html: main_core.Text.encode(options.NAME),
				href: options.URL
			};
			const count = Number.parseInt(options.COUNTER, 10);
			if (main_core.Type.isNumber(count) && count > 0) {
				const counter = `<span class="main-buttons-item-counter">${options.COUNTER}</span>`;
				item.html = `${item.html} ${counter}`;
			}
			return item;
		}
		constructor(options) {
			super();
			this.button = options.button;
			this.counter = options.counter;
			this.container = options.container;
			this.items = options.items;
			this.tunnelsUrl = options.tunnelsUrl;
			this.componentParams = options.componentParams;
			this.onButtonClick = this.onButtonClick.bind(this);
			main_core.Event.bind(this.button, 'click', this.onButtonClick);
		}
		isDropdown() {
			return main_core.Dom.hasClass(this.button, 'ui-btn-dropdown');
		}
		reload() {
			return main_core.ajax.runComponentAction('bitrix:crm.deal_category.panel', 'getComponent', {
				data: {
					params: this.componentParams
				}
			}).then(response => {
				const newContainer = main_core.Runtime.html(null, response.data.html);
				main_core.Dom.replace(this.container, newContainer);
				this.getMenu().destroy();
			});
		}
		onButtonClick(event) {
			event.preventDefault();
			if (this.isDropdown()) {
				this.getMenu().show();
				return;
			}
			this.showTunnelSlider();
		}
		showTunnelSlider() {
			// eslint-disable-next-line
			BX.SidePanel.Instance.open(this.tunnelsUrl, {
				cacheable: false,
				customLeftBoundary: 40,
				allowChangeHistory: false,
				events: {
					onClose: () => {
						this.reload();
						if (window.top.BX.Main && window.top.BX.Main.filterManager) {
							const {
								data
							} = window.top.BX.Main.filterManager;
							// eslint-disable-next-line
							Object.values(data).forEach(filter => filter._onFindButtonClick());
						}
					}
				}
			});
		}
		getMenu() {
			if (!this.menu) {
				const menuItems = this.items.map(item => Panel.createMenuItem(item));
				menuItems.push({
					delimiter: true
				});
				menuItems.push({
					id: 'tunnels',
					text: main_core.Loc.getMessage('CRM_DEAL_CATEGORY_PANEL_TUNNELS2'),
					onclick: this.showTunnelSlider.bind(this)
				});
				this.menu = new main_popup.PopupMenuWindow({
					bindElement: this.button,
					items: menuItems
				});
			}
			return this.menu;
		}
	}

	exports.Panel = Panel;

})(this.BX.Crm.Deal.Category = this.BX.Crm.Deal.Category || {}, BX, BX.Main);
//# sourceMappingURL=script.js.map
