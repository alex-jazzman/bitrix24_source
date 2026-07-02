/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports) {
	'use strict';

	const openHelpdeskArticle = articleCode => {
		BX.Helper?.show(`redirect=detail&code=${articleCode}`);
	};
	const getHelpdeskStringCallback = articleCode => {
		return `BX.Helper?.show('redirect=detail&code=${articleCode}')`;
	};

	exports.getHelpdeskStringCallback = getHelpdeskStringCallback;
	exports.openHelpdeskArticle = openHelpdeskArticle;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {});
//# sourceMappingURL=helpdesk.bundle.js.map
