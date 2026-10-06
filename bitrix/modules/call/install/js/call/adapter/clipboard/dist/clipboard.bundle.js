/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_lib_clipboard) {
	'use strict';

	async function copy(text) {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return;
		}
		im_lib_clipboard.Clipboard.copy(text);
	}
	function copyFromPromise(textPromise) {
		if (typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function') {
			const item = new ClipboardItem({
				'text/plain': textPromise.then(text => new Blob([text], {
					type: 'text/plain'
				}))
			});
			return navigator.clipboard.write([item]);
		}
		return textPromise.then(text => copy(text));
	}
	const Clipboard = {
		copy,
		copyFromPromise
	};

	exports.Clipboard = Clipboard;

})(this.BX.Call.Adapter = this.BX.Call.Adapter || {}, BX.Messenger.Lib);
//# sourceMappingURL=clipboard.bundle.js.map
