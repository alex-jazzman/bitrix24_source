/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_controller) {
	'use strict';

	/**
	 * Bitrix Im
	 * Core application
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	class CoreApplication {
		constructor() {
			this.controller = new im_controller.Controller();
		}
		ready() {
			return this.controller.ready();
		}
	}
	let Core = new CoreApplication();

	exports.Core = Core;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Messenger);
//# sourceMappingURL=core.bundle.js.map
