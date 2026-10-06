/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, intranet_widgetLoader) {
	'use strict';

	class SettingsWidgetLoader {
		static #instance;
		#widgetLoader;
		#isBitrix24 = false;
		#isAdmin = false;
		#isRequisite = false;
		#isMainPageAvailable = false;
		#node = false;
		constructor(params) {
			this.#isBitrix24 = params['isBitrix24'];
			this.#isAdmin = params['isAdmin'];
			this.#isRequisite = params['isRequisite'];
			this.#isMainPageAvailable = params['isMainPageAvailable'];
		}
		showOnce(node) {
			this.#node = node;
			const popup = this.#getWidgetLoader().getPopup();
			popup.show();
			const popupContainer = popup.getPopupContainer();
			if (popupContainer.getBoundingClientRect().left < 30) {
				popupContainer.style.left = '30px';
			}
			(typeof BX.Intranet.SettingsWidget !== 'undefined' ? Promise.resolve() : this.#load()).then(() => {
				if (typeof BX.Intranet.SettingsWidget !== 'undefined') {
					BX.Intranet.SettingsWidget.bindAndShow(node);
				}
			});
		}
		#getWidgetLoader() {
			if (this.#widgetLoader) {
				return this.#widgetLoader;
			}
			const widgetLoader = new intranet_widgetLoader.WidgetLoader({
				id: "bx-settings-header-popup",
				bindElement: this.#node,
				width: 374
			});
			widgetLoader.addHeaderSkeleton();
			if (this.#isRequisite) {
				widgetLoader.addItemSkeleton(22);
			}
			if (this.#isMainPageAvailable) {
				widgetLoader.addItemSkeleton(22);
			}
			if (this.#isAdmin) {
				widgetLoader.addSplitItemSkeleton(22);
			}
			if (this.#isBitrix24) {
				widgetLoader.addItemSkeleton(22);
			}
			if (this.#isAdmin) {
				widgetLoader.addItemSkeleton(22);
				widgetLoader.addFooterSkeleton();
			}
			this.#widgetLoader = widgetLoader;
			return this.#widgetLoader;
		}
		#load() {
			return new Promise(resolve => {
				main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getWidgetComponent', {
					mode: 'class'
				}).then(response => {
					return new Promise(resolve => {
						const loadCss = response.data.assets ? response.data.assets.css : [];
						const loadJs = response.data.assets ? response.data.assets.js : [];
						BX.load(loadCss, () => {
							BX.loadScript(loadJs, () => {
								main_core.Runtime.html(null, response.data.html).then(resolve);
							});
						});
					});
				}).then(() => {
					if (typeof BX.Intranet.SettingsWidget !== 'undefined') {
						setTimeout(() => {
							BX.Intranet.SettingsWidget.bindWidget(this.#getWidgetLoader());
							resolve();
						}, 0);
					}
				});
			});
		}
		static init(options) {
			if (!this.#instance) {
				this.#instance = new this(options);
			}
			return this.#instance;
		}
	}

	exports.SettingsWidgetLoader = SettingsWidgetLoader;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Intranet);
//# sourceMappingURL=script.js.map
