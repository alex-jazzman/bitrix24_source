import { ajax as Ajax, Dom, Type, Tag, Loc, Extension } from 'main.core';
import { Popup } from 'main.popup';
import { Loader } from 'main.loader';
import { PULL } from 'pull.client';
import 'main.qrcode';
import 'ui.icon-set.main';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import './css/style.css';

export class QrAuthorization
{
	title;
	content;
	bottomText;
	qr;
	popupParam;

	constructor(options = {})
	{
		this.title = options.title || null;
		this.content = options.content || null;
		this.bottomText = options.bottomText || Loc.getMessage('UI_QR_AUTHORIZE_TAKE_CODE');
		this.showFishingWarning = options.showFishingWarning ?? false;
		this.showBottom = options.showBottom ?? true;
		this.helpLink = options.helpLink || null;
		this.helpCode = options.helpCode || null;
		this.qr = options.qr || null;
		this.popupParam = options.popupParam || null;
		this.intent = options.intent || 'calendar';
		this.payload = options.payload || null;
		this.popup = null;
		this.loader = null;
		this.ttl = Extension.getSettings('ui.qrauthorization')?.ttl ?? 60;
		this.ttlInterval = null;

		this.qrNode = null;
		this.successNode = null;
		this.loadingNode = null;

		this.isSubscribe = false;
		this.isScanned = false;
	}

	createQrCodeImage()
	{
		if (this.isScanned)
		{
			return;
		}

		Dom.clean(this.getQrNode());

		if (Type.isString(this.qr))
		{
			this.clean();
			new QRCode(this.getQrNode(), {
				text: this.qr,
				width: 180,
				height: 180,
			});

			return;
		}

		this.loading();
		Ajax.runAction('mobile.deeplink.get', {
			data: this.getRequestData(),
		}).then((response) => {
			// The scan may land while this request is on the wire. The code it brings back was issued
			// after the scan, so it carries the payload away from the code the person entered by.
			if (this.isScanned)
			{
				return;
			}

			const link = response.data?.link;
			if (link)
			{
				this.clean();
				new QRCode(this.getQrNode(), {
					text: link,
					width: 180,
					height: 180,
				});

				if (!this.isSubscribe)
				{
					this.isSubscribe = true;
					this.subscribe();
				}
			}
		}).catch(() => {});
	}

	// The code is reissued on a timer, and every reissue invalidates the previous one, so the payload
	// has to travel with each request - not only with the first one.
	getRequestData()
	{
		const data = {
			intent: this.intent,
			ttl: this.ttl,
		};

		if (this.payload)
		{
			data.payload = this.payload;
		}

		return data;
	}

	subscribe()
	{
		if (PULL)
		{
			PULL.subscribe({
				type: 'BX.PullClient.SubscriptionType.Server',
				moduleId: 'mobile',
				command: 'onDeeplinkShouldRefresh',
				callback: (params) => {
					this.success();
				},
			});
		}
	}

	getQrNode(): HTMLElement
	{
		if (!this.qrNode)
		{
			this.qrNode = Tag.render`
				<div class="ui-qr-authorization__popup-qr"></div>
			`;
		}

		return this.qrNode;
	}

	getPopup(): Popup
	{
		if (!this.popup)
		{
			const title = Type.isObject(this.title) ? this.title?.text : this.title;
			const titleSize = Type.isObject(this.title) ? this.title?.size : '';

			const container = Tag.render`
				<div class="ui-qr-authorization__popup-wrapper">
					<div class="ui-qr-authorization__popup-top ${this.content ? '' : '--direction-column'}">
						<div class="ui-qr-authorization__popup-left ${title ? '' : '--flex'}">
							${title
								? `<div class="ui-qr-authorization__popup-title --${titleSize}">${title}</div>`
								: ''}
							${this.content
								? `<div class="ui-qr-authorization__popup-text">${this.content}</div>`
								: ''}
						</div>
						<div class="ui-qr-authorization__popup-right ${this.title ? '' : '--no-margin'}" data-role="ui-qr-authorization__qr-node"></div>
					</div>
					${this.renderFishingWarning()}
					${this.renderBottom()}
				</div>
			`;

			const popupWidth = this.content ? 710 : 405;
			const popupParam = {
				className: this.popupParam?.className ?? 'ui-qr-authorization__popup ui-qr-authorization__popup-scope',
				width: this.popupParam?.width ?? popupWidth,
				content: container,
				closeByEsc: this.popupParam?.closeByEsc ? this.popupParam?.className : true,
				overlay: this.popupParam?.overlay ?? false,
				autoHide: this.popupParam?.autoHide ?? true,
				closeIcon: {
					top: '14px',
					right: '15px',
				},
				events: {
					onPopupShow: () => {
						this.isScanned = false;
						this.createQrCodeImage();
						this.ttlInterval = setInterval(() => {
							this.createQrCodeImage();
						}, this.ttl * 1000);

						const qrTarget = this.getPopup().getContentContainer().querySelector('[data-role="ui-qr-authorization__qr-node"]');

						if (qrTarget)
						{
							Dom.append(this.getQrNode(), qrTarget);
						}
					},
					onPopupClose: () => {
						this.stopReissue();
					},
				},
				padding: 0,
				animation: 'fading-slide',
			};

			this.popup = new Popup(popupParam);
		}

		return this.popup;
	}

	renderFishingWarning()
	{
		if (!this.showFishingWarning)
		{
			return '';
		}

		return Tag.render`
			<div class="ui-qr-authorization__popup-warning">
				<div class="ui-icon-set --shield-2-attention"></div>
				${Loc.getMessage('UI_QR_AUTHORIZE_DONT_SHARE_QR_WARNING')}
			</div>
		`;
	}

	renderBottom(): HTMLElement | string
	{
		if (!this.showBottom)
		{
			return '';
		}

		const bottomText = Type.isObject(this.bottomText) ? this.bottomText?.text : this.bottomText;
		const bottomTextSize = Type.isObject(this.bottomText) ? this.bottomText?.size : '';

		return Tag.render`
			<div class="ui-qr-authorization__popup-bottom">
				<div class="ui-qr-authorization__popup-bottom--title ${bottomTextSize ? '--' + bottomTextSize : ''}">
					${bottomText}
				</div>
				${this.renderHelpLink()}
			</div>
		`;
	}

	renderHelpLink(): HTMLElement | string
	{
		if (this.helpCode)
		{
			const onclick = (e) => {
				e.preventDefault();
				top.BX.Helper.show(`redirect=detail&code=${this.helpCode}`);
			};

			return Tag.render`
				<a onclick="${onclick}" class="ui-qr-authorization__popup-bottom--link">
					${Loc.getMessage('UI_QR_AUTHORIZE_HELP')}
				</a onc>
			`;
		}

		if (this.helpLink)
		{
			return Tag.render`
				<a href="${this.helpLink}" class="ui-qr-authorization__popup-bottom--link">
					${Loc.getMessage('UI_QR_AUTHORIZE_HELP')}
				</a>
			`;
		}

		return '';
	}

	success()
	{
		this.isScanned = true;
		this.stopReissue();
		this.clean();
		Dom.addClass(this.getQrNode(), '--success');
		Dom.append(this.getSuccessNode(), this.getQrNode());
	}

	// Every reissue invalidates the previous code and carries the payload over to the new one, so past
	// the scan the timer must stay silent: a code issued after the scan would take the payload away
	// from the code the person actually entered by.
	stopReissue()
	{
		clearInterval(this.ttlInterval);
		this.ttlInterval = null;
	}

	getSuccessNode(): HTMLElement
	{
		if (!this.successNode)
		{
			this.successNode = Tag.render`
				<div class="ui-qr-authorization__popup-qr-success"></div>
			`;
		}

		return this.successNode;
	}

	loading()
	{
		this.clean();
		Dom.addClass(this.getQrNode(), '--loading');
		Dom.append(this.getLoadingNode(), this.getQrNode());
		this.showLoader();
	}

	getLoadingNode(): HTMLElement
	{
		if (!this.loadingNode)
		{
			this.loadingNode = Tag.render`
				<div class="ui-qr-authorization__popup-qr-loading"></div>
			`;
		}

		return this.loadingNode;
	}

	getLoader(): Loader
	{
		if (!this.loader)
		{
			this.loader = new Loader({
				target: this.getLoadingNode(),
				size: 150,
			});
		}

		return this.loader;
	}

	showLoader(): void
	{
		void this.getLoader().show();
	}

	hideLoader(): void
	{
		void this.getLoader().hide();
	}

	clean()
	{
		Dom.removeClass(this.getQrNode(), ['--loading', '--success']);
		Dom.remove(this.getLoadingNode());
		Dom.remove(this.getSuccessNode());
		Dom.clean(this.getQrNode());
		this.hideLoader();
	}

	show()
	{
		if (!this.getPopup().isShown())
		{
			this.loading();
			this.getPopup().show();
		}
	}

	close()
	{
		if (this.getPopup().isShown())
		{
			this.clean();
			this.getPopup().close();
		}
	}
}
