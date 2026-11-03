/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, ui_dialogs_messagebox) {
	'use strict';

	const DEFAULT_MAX_WIDTH = 650;
	const MIN_TAIL_LENGTH = 12;
	const MAX_TAIL_LENGTH = 20;
	function showAirMessageBox(options) {
		const messageBox = ui_dialogs_messagebox.MessageBox.create({
			title: options.title,
			message: options.message,
			modal: true,
			useAirDesign: true,
			maxWidth: options.maxWidth ?? DEFAULT_MAX_WIDTH,
			popupOptions: options.popupOptions ?? {}
		});
		if (main_core.Type.isFunction(options.buttonsFactory)) {
			const buttons = options.buttonsFactory(messageBox);
			if (buttons === null) {
				return null;
			}
			messageBox.setButtons(buttons);
		}
		const popupContainer = messageBox.getPopupWindow().getPopupContainer();
		main_core.Dom.addClass(popupContainer, 'disk-air-message-box-fit-content');
		if (options.className) {
			main_core.Dom.addClass(popupContainer, options.className);
		}
		messageBox.show();
		return messageBox;
	}
	function formatFileName(message, name) {
		const safeName = main_core.Text.encode(name);
		const chars = [...name];
		const dotIndex = chars.lastIndexOf('.');
		const extLength = dotIndex > 0 ? chars.length - dotIndex : 0;
		const tailLength = Math.min(chars.length, Math.max(MIN_TAIL_LENGTH, Math.min(extLength + 2, MAX_TAIL_LENGTH)));
		const head = main_core.Text.encode(chars.slice(0, chars.length - tailLength).join(''));
		const tail = main_core.Text.encode(chars.slice(chars.length - tailLength).join(''));
		const fileName = `<span class="disk-air-message-box-file-name-sr-only">${safeName}</span>` + `<span class="disk-air-message-box-file-name" aria-hidden="true">${head}</span>` + `<span class="disk-air-message-box-file-name-tail" aria-hidden="true">${tail}</span>`;
		const wrapFileName = (leftPart, rightPart) => {
			return '<span class="disk-air-message-box-file-name-wrapper"' + ' data-testid="disk-air-message-box-file-name"' + ` title="${safeName}">${leftPart}${fileName}${rightPart}</span>`;
		};
		return message.replaceAll(/(["'])#NAME#\1(\?)/g, (match, quote, questionMark) => wrapFileName(quote, `${quote}&nbsp;${questionMark}`)).replaceAll(/(["'])#NAME#\1/g, (match, quote) => wrapFileName(quote, quote)).replaceAll(/#NAME#(\?)/g, (match, questionMark) => wrapFileName('', questionMark)).replaceAll('#NAME#', () => wrapFileName('', ''));
	}

	exports.formatFileName = formatFileName;
	exports.showAirMessageBox = showAirMessageBox;

})(this.BX.Disk.AirMessageBox = this.BX.Disk.AirMessageBox || {}, BX, BX.UI.Dialogs);
//# sourceMappingURL=air-message-box.bundle.js.map
