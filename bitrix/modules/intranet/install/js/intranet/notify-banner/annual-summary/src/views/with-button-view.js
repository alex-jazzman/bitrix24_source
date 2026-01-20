import { Type, Tag, Loc, Dom } from 'main.core';
import { Button } from 'ui.buttons';
import { Analytic } from '../analytic';
import { View } from './view';
import { Message } from '../message';
import { ShareService } from '../share-service';
import { Menu } from 'main.popup';

export class WithButtonView extends View
{
	#click: ?function;
	#text: string;
	message: ?Message;
	#hideBtn: boolean;
	#analytic: ?Analytic;
	#shareService: ShareService;
	#menu: Menu;

	constructor(options: {})
	{
		super(options);
		this.#click = Type.isFunction(options?.btn?.click) ? options?.btn?.click : this.onShare;
		this.#text = options?.btn?.text || '';
		this.message = options.message ?? null;
		this.#hideBtn = options.hideBtn === true;
		this.#analytic = options.analytic instanceof Analytic ? options.analytic : null;
		this.#shareService = options.shareService instanceof ShareService ? options.shareService : null;
	}

	shareButton(): HTMLElement
	{
		if (this.#hideBtn)
		{
			return Tag.render``;
		}

		const handler = (btn: Button) => {
			if (btn.isWaiting())
			{
				return;
			}
			btn.setWaiting();
			Promise.all([this.#click(btn)])
				.then(() => btn.setWaiting(false))
				.catch(() => btn.setWaiting(false));
			this.#analytic?.share(this.index(), this.featureType());
		};

		const button = new Button({
			useAirDesign: true,
			className: 'intranet-year-results-popup__footer-button',
			onclick: handler,
			text: this.#text,
			wide: true,
		});

		return button.render();
	}

	downloadButton(): HTMLElement
	{
		if (this.#hideBtn)
		{
			return Tag.render``;
		}

		const handler = (btn: Button) => {
			if (btn.isWaiting())
			{
				return;
			}

			btn.setWaiting();
			this.#analytic?.save(this.index(), this.featureType());
			this.#shareService.getScreenshot(this.cachedContent())
				.then((file) => {
					this.#shareService.downloadFile(file);
				})
				.catch((e) => console.error(e))
				.finally(() => {
					btn.setWaiting(false);
				});
		};

		const button = new Button({
			useAirDesign: true,
			className: 'intranet-year-results-popup__footer-button intranet-year-results-popup__footer-button--white',
			onclick: handler,
			text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_DOWNLOAD_BTN'),
			wide: true,
		});

		return button.render();
	}

	onShare(event): Promise
	{
		return this.#shareService.isShareApiAvailable()
			? this.openShareOptionsPopup(event.button)
			: this.copyLink();
	}

	openShareOptionsPopup(target): Promise<void>
	{
		if (!this.#menu)
		{
			this.#menu = new Menu({
				autoHide: true,
				closeByEsc: true,
				fixed: true,
				angle: {
					offset: Dom.getPosition(target).height / 2,
					position: 'left',
				},
				items: [
					{
						text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_COPY_LINK'),
						onclick: async () => this.copyLink(),
					},
					{
						text: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_SCREENSHOT_TITLE'),
						onclick: async () => {
							try
							{
								const file = await this.#shareService.getScreenshot(this.cachedContent());
								await this.#shareService.shareContent({ files: [file] });
							}
							catch (error)
							{
								console.error(error);
								throw error;
							}
						},
					},
				],
			});

			this.#menu.getPopupWindow().setBindElement(target);
			this.#menu.getPopupWindow().setOffset({
				offsetLeft: Dom.getPosition(target).width + 14,
				offsetTop: -(Dom.getPosition(target).height + 16),
			});
		}

		this.#menu.toggle();

		return Promise.resolve();
	}

	async copyLink(): Promise<void>
	{
		try
		{
			const url = await this.#shareService.getLinkToShare();
			await this.#shareService.copyToClipboard(url);
			top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_NOTIFY_COPY'),
				autoHideDelay: 2500,
			});
		}
		catch (error)
		{
			console.error(error);
			throw error;
		}
	}
}
