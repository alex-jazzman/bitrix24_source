import { ajax, Dom, Loc, Type } from 'main.core';
import { ImageCompressor } from 'landing.imagecompressor';
import { Screenshoter, PageObject } from 'landing.screenshoter';

export type ShareLinkOptions = {
	signedUserId: number,
	signedType: string,
};

export class ShareService
{
	#linkToShare;
	#screenshotToShare;

	constructor(options: ShareLinkOptions)
	{
		this.signedUserId = options?.signedUserId ?? null;
		this.signedType = options?.signedType ?? null;
	}

	isShareApiAvailable(): boolean
	{
		return window.isSecureContext
			&& navigator.share
			&& navigator.canShare;
	}

	getLinkToShare(): Promise<string>
	{
		if (!this.#linkToShare)
		{
			this.#linkToShare = ajax.runAction('intranet.v2.AnnualSummary.getLink', {
				data: {
					signedUserId: this.signedUserId,
					signedType: this.signedType,
				},
			})
				.then((response) => response.data.link)
				.catch((error) => {
					this.#linkToShare = null;
					throw error;
				});
		}

		return this.#linkToShare;
	}

	getScreenshot(container: HTMLElement): Promise<File>
	{
		if (!this.#screenshotToShare)
		{
			const sharedContainer = container.cloneNode(true);
			Dom.addClass(sharedContainer, 'intranet-year-results-popup__slide--screenshot');
			// We need to add container to DOM for html-to-image
			Dom.append(sharedContainer, document.querySelector('.intranet-year-results-popup__slide-wrapper'));
			PageObject.getEditorWindow = () => window;

			this.#screenshotToShare = Screenshoter
				.makeElementScreenshot(sharedContainer)
				.then((sourceFile) => {
					return ImageCompressor.compress(sourceFile, {
						maxWidth: 900,
						maxHeight: 1600,
					});
				})
				.then((compressedFile) => {
					return new File([compressedFile], 'bitrix24.png', { type: 'image/png' });
				})
				.catch((error) => {
					this.#screenshotToShare = null;
					throw error;
				})
				.finally(() => {
					sharedContainer.remove();
				});
		}

		return this.#screenshotToShare;
	}

	async copyToClipboard(textToCopy: string): Promise<void>
	{
		if (!Type.isString(textToCopy))
		{
			return Promise.reject();
		}

		if (window.isSecureContext && navigator.clipboard)
		{
			return new Promise((resolve, reject) => {
				setTimeout(() => (
					navigator.clipboard
						.writeText(textToCopy)
						.then(() => resolve())
						.catch((e) => reject(e))
				), 0);
			});
		}

		return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
	}

	shareContent(shareData: Object): Promise<void>
	{
		shareData.title = Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_TITLE');

		if (
			window.isSecureContext
			&& navigator.share
			&& navigator.canShare
			&& navigator.canShare(shareData)
		)
		{
			return navigator.share(shareData);
		}

		return Promise.reject();
	}

	downloadFile(file: File): void
	{
		const url = URL.createObjectURL(file);
		const a = document.createElement('a');
		a.href = url;
		a.download = file.name;
		a.click();
		URL.revokeObjectURL(url);
	}
}
