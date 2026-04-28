import { Dom } from 'main.core';

export const makeQrCodeTo = (element: HTMLElement, deeplink: string): void => {
	Dom.clean(element);

	// eslint-disable-next-line no-undef
	new QRCode(element, {
		text: deeplink,
		width: 230,
		height: 230,
		colorDark: '#000000',
		colorLight: '#ffffff',
		// eslint-disable-next-line no-undef
		correctLevel: QRCode.CorrectLevel.H,
	});
};
