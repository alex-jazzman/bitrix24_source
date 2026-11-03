import { Loc, Tag } from 'main.core';
import { Dialog as SystemDialog } from 'ui.system.dialog';
import { Text as TypographyText } from 'ui.system.typography';
import { resolveErrorHtml } from 'biconnector.error-message';
import { Center as NotificationCenter } from 'ui.notification';
import './css/loading-popup.css';

type LoadingPopupOptions = {
	loadingMessage?: string,
	errorMessage?: string,
	popupOptions?: Object,
	callbacks: LoadingPopupCallbacks,
};

type LoadingPopupCallbacks = {
	loadData: () => Promise<any>,
	checkData: (result: any) => boolean,
	onSuccess: () => any,
	onFail: () => any,
};

export class LoadingPopup
{
	#isPopupClosedByUser = false;
	#loadingPopup = null;
	#loadingMessage: string;
	#errorMessage: string;
	#popupOptions: Object;
	#callbacks: LoadingPopupCallbacks;

	constructor(options: LoadingPopupOptions = {})
	{
		this.#loadingMessage = options.loadingMessage || Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_MESSAGE');
		this.#errorMessage = options.errorMessage || Loc.getMessage('BICONNECTOR_LOADING_POPUP_LOAD_ERROR');

		const defaultOptions = this.#getDefaultPopupOptions();
		this.#popupOptions = {
			...defaultOptions,
			...options.popupOptions,
		};
		this.#callbacks = options.callbacks;
	}

	showLoadPopup(): void
	{
		this.#isPopupClosedByUser = false;
		this.#loadingPopup = new SystemDialog(this.#popupOptions);
		this.#loadingPopup.show();

		this.#callbacks.loadData()
			.then((result) => {
				if (this.#isPopupClosedByUser)
				{
					return;
				}

				this.#hideLoadingPopup();

				if (this.#callbacks.checkData(result))
				{
					this.#callbacks.onSuccess();
				}
				else
				{
					this.#callbacks.onFail();
				}
			})
			.catch((response) => {
				this.#hideLoadingPopup();
				NotificationCenter.notify({
					content: resolveErrorHtml(response, this.#errorMessage),
				});
			});
	}

	#hideLoadingPopup(): void
	{
		if (this.#loadingPopup)
		{
			this.#loadingPopup.hide();
			this.#loadingPopup = null;
		}
	}

	#getDefaultPopupOptions(): Object
	{
		return {
			content: this.#getContent(),
			width: 400,
			height: 176,
			title: ' ',
			hasCloseButton: true,
			hasOverlay: true,
			disableScrolling: false,
			hasVerticalPadding: false,
			hasHorizontalPadding: false,
			events: {
				onHide: () => {
					this.#isPopupClosedByUser = true;
				},
			},
		};
	}

	#getContent(): HTMLElement
	{
		const loadingText = TypographyText.render(
			this.#loadingMessage,
			{ size: 'sm' },
		);

		return Tag.render`
			<div class="biconnector-loading-popup">
				<div class="biconnector-loading-popup-spinner-wrapper">
					<img
						class="biconnector-loading-popup-spinner"
						src="/bitrix/js/biconnector/loading-popup/src/images/spinner.webp"
						alt="Loading"
					/>
				</div>
				<div class="biconnector-loading-popup-text">
					${loadingText}
				</div>
			</div>
		`;
	}
}
