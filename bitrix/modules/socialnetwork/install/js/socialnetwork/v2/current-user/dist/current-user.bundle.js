/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
(function (exports, main_core) {
	'use strict';

	function getCurrentUserSettings() {
		const settings = main_core.Extension.getSettings('socialnetwork.v2.current-user');
		return {
			id: settings.get('id'),
			name: settings.get('name'),
			image: settings.get('image')
		};
	}

	exports.getCurrentUserSettings = getCurrentUserSettings;

})(this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {}, BX);
//# sourceMappingURL=current-user.bundle.js.map
