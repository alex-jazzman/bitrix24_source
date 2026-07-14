/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_popup, main_core) {
	'use strict';

	class Bitrix24Banner {
		#menuLinux;
		static #instance;
		#installersForLinux;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		showMenuForLinux(event, target, links) {
			event.preventDefault();
			this.#installersForLinux = links;
			this.#menuLinux = this.#menuLinux || new main_popup.Menu({
				className: 'system-auth-form__popup',
				bindElement: target,
				items: [{
					text: main_core.Loc.getMessage('B24_BANNER_DOWNLOAD_LINUX_DEB'),
					href: this.#installersForLinux.deb,
					onclick: element => {
						element.close();
					}
				}, {
					text: main_core.Loc.getMessage('B24_BANNER_DOWNLOAD_LINUX_RPM'),
					href: this.#installersForLinux.rpm,
					onclick: element => {
						element.close();
					}
				}],
				angle: true,
				offsetLeft: main_core.Dom.getPosition(target).width / 2
			});
			this.#menuLinux.toggle();
		}
	}

	exports.Bitrix24Banner = Bitrix24Banner;

})(this.BX.Intranet = this.BX.Intranet || {}, BX.Main, BX);
//# sourceMappingURL=script.js.map
