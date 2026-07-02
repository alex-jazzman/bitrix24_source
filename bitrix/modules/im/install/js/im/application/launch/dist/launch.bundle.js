/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_lib_logger) {
	'use strict';

	/**
	 * Bitrix Im
	 * Application Launcher
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	const ApplicationLauncher = function (app, params = {}) {
		let application = '';
		let name = '';
		if (typeof app === 'object') {
			name = app.name.toString();
			application = app.application.toString();
		} else {
			name = app.toString();
			application = app;
		}
		application = application.substr(0, 1).toUpperCase() + application.substr(1);
		if (application === 'Launch' || application === 'Core' || application.endsWith('Application')) {
			im_lib_logger.Logger.error('BX.Messenger.Application.Launch: specified name is forbidden.');
			return new Promise((resolve, reject) => reject());
		}
		let launch = function () {
			try {
				BX.Messenger.Application[name] = new BX.Messenger.Application[application + 'Application'](params);
				return BX.Messenger.Application[name].ready();
			} catch (e) {
				im_lib_logger.Logger.error(`BX.Messenger.Application.Launch: application "${application}" is not initialized.`);
				return false;
			}
		};
		if (typeof BX.Messenger.Application[application + 'Application'] === 'undefined' && typeof BX.Runtime !== 'undefined' && typeof BX.Runtime.loadExtension !== 'undefined') {
			let loadExtension = 'im.application.' + application.toString().toLowerCase();
			return BX.Runtime.loadExtension(loadExtension).then(() => launch());
		}
		return launch();
	};

	exports.Launch = ApplicationLauncher;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX.Messenger.Lib);
//# sourceMappingURL=launch.bundle.js.map
