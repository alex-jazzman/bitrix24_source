/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core) {
	'use strict';

	const isMac = main_core.Browser.isMac();
	const hotkey = {
		action: isMac ? '⌘' : 'Ctrl',
		option: isMac ? '⌥' : 'Alt',
		control: 'Ctrl'
	};

	exports.hotkey = hotkey;

})(this.BX.Call.Helper = this.BX.Call.Helper || {}, BX);
//# sourceMappingURL=hotkey.bundle.js.map
