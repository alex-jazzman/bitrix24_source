import { Tag, Event, Dom, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button } from 'ui.buttons';
import 'ui.notification';

import { A11y } from './a11y';

export default class PopupHelper
{
	constructor(options)
	{
		this.id = options.id;
		this.url = options.url;
		this.itemObj = options.itemObj;
		this.fullUrl = options.fullUrl;
		this.ordersUrl = options.ordersUrl;
		this.indexEditUrl = options.indexEditUrl;
		this.notPublishedText = options.notPublishedText;
		this.qr = null;

		this.$container = null;
		this.$containerClose = null;
		this.$containerFirstStep = null;
		this.$containerSecondStep = null;
		this.$containerQr = null;
		this.$containerQrimage = null;
		this.$containerQrButton = null;
		this.$containerNotPublishedPublishButton = null;
		this.$containerNotPublishedOpenButton = null;
		this.$containerInputUrl = null;
		this.$containerCopyLink = null;
		this.$containerTestOrder = null;
		this.$containerOpenCRMFirstStep = null;
		this.$containerOpenCRMSecondStep = null;
		this.focusTrap = null;
		this.focusTrapPromise = null;
		this.isShown = false;

		this.adjustCloseEditByClick = this.adjustCloseEditByClick.bind(this);
		this.adjustCloseEditByKeyDown = this.adjustCloseEditByKeyDown.bind(this);
	}

	hide()
	{
		this.isShown = false;
		this.deactivateFocusTrap();
		A11y.setHidden(this.getContainer(), true);
		this.getContainer().classList.remove('--show');
		Event.unbind(document.body, 'click', this.adjustCloseEditByClick);
		Event.unbind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		EventEmitter.emit(this, 'BX.Landing.SiteTile.Popup:onHide', this);
	}

	show(param: string)
	{
		this.isShown = true;
		A11y.setHidden(this.getContainer(), false);
		this.getContainer().classList.add('--show');
		if (param === 'link')
		{
			this.getContainerFirstStep().style.display = 'none';
			this.getContainerSecondStep().style.display = 'none';
			this.getContainerNotPublished().style.display = 'none';

			this.getContainerQr().style.display = null;
		}
		else if (param === 'notPublished')
		{
			this.getContainerFirstStep().style.display = 'none';
			this.getContainerSecondStep().style.display = 'none';
			this.getContainerQr().style.display = 'none';

			this.getContainerNotPublished().style.display = null;
		}
		else
		{
			this.getContainerQr().style.display = 'none';
			this.getContainerNotPublished().style.display = 'none';

			this.getContainerFirstStep().style.display = null;
			this.getContainerSecondStep().style.display = null;
		}

		this.syncContainersVisibility(param);
		this.activateFocusTrap();
		Event.bind(document.body, 'click', this.adjustCloseEditByClick);
		Event.bind(document.body, 'keydown', this.adjustCloseEditByKeyDown);
		EventEmitter.emit(this, 'BX.Landing.SiteTile.Popup:onShow', this);
	}

	syncContainersVisibility(param: string)
	{
		const isQr = param === 'link';
		const isNotPublished = param === 'notPublished';
		const isFirstStep = !isQr && !isNotPublished && !this.getContainerFirstStep().classList.contains('--hide-right');
		const isSecondStep = !isQr && !isNotPublished && !this.getContainerSecondStep().classList.contains('--hide-left');

		A11y.setHidden(this.getContainerQr(), !isQr);
		A11y.setHidden(this.getContainerNotPublished(), !isNotPublished);
		A11y.setHidden(this.getContainerFirstStep(), !isFirstStep);
		A11y.setHidden(this.getContainerSecondStep(), !isSecondStep);
		this.syncDialogLabel(param);
	}

	syncDialogLabel(param: string)
	{
		if (param === 'link')
		{
			const label = this.indexEditUrl.startsWith('/shop/')
				? Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SHOP')
				: Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SITE')
			;

			this.getContainer().setAttribute('aria-label', label);

			return;
		}

		if (param === 'notPublished')
		{
			this.getContainer().setAttribute(
				'aria-label',
				this.notPublishedText ? this.notPublishedText.title : Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_TITLE'),
			);

			return;
		}

		const label = this.getContainerFirstStep().classList.contains('--hide-right')
			? Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER')
			: Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')
		;

		this.getContainer().setAttribute('aria-label', label);
	}

	activateFocusTrap()
	{
		if (this.focusTrap)
		{
			this.focusTrap.activate({ initialFocus: true });

			return;
		}

		if (!this.focusTrapPromise)
		{
			this.focusTrapPromise = A11y.createFocusTrap(this.getContainer(), {
				initialFocus: 'first-tabbable',
				restoreFocus: true,
				isolateOutside: true,
			});
		}

		this.focusTrapPromise
			.then((focusTrap) => {
				this.focusTrap = focusTrap;
				if (this.isShown && this.focusTrap)
				{
					this.focusTrap.activate({ initialFocus: true });
				}
			})
			.catch(() => {});
	}

	deactivateFocusTrap()
	{
		this.focusTrap?.deactivate();
	}

	adjustCloseEditByClick(ev)
	{
		if (ev.type !== 'click')
		{
			return;
		}

		if (
			ev.target.closest('.landing-sites__popup')
			|| ev.target.closest(`.landing-sites__container-link-${this.id}`)
			|| ev.target.closest(`.landing-sites__status-${this.id}`)
		)
		{
			return;
		}

		this.hide();
	}

	adjustCloseEditByKeyDown(ev)
	{
		if (ev.type !== 'keydown')
		{
			return;
		}

		if (ev.keyCode === 27) // close by Escape
		{
			this.hide();
		}
	}

	showSecondStep()
	{
		this.getContainerFirstStep().classList.add('--hide-right');
		this.getContainerSecondStep().classList.remove('--hide-left');
		this.syncContainersVisibility();
		this.getContainerSecondStep()
			.querySelector('.landing-sites__popup-prev')
			?.focus({ preventScroll: true });
	}

	showFirstStep()
	{
		this.getContainerFirstStep().classList.remove('--hide-right');
		this.getContainerSecondStep().classList.add('--hide-left');
		this.syncContainersVisibility();
		this.getContainerTestOrder().focus({ preventScroll: true });
	}

	getContainerInputUrl()
	{
		if (!this.$containerInputUrl)
		{
			this.$containerInputUrl = Tag.render`
				<input
					type="text"
					style="position: absolute; left: 0; top: 0; width: 1px; height: 1px; padding: 0; border: 0; opacity: 0; pointer-events: none"
					value="${this.fullUrl}">
			`;
		}

		return this.$containerInputUrl;
	}

	getContainerCopyLink()
	{
		if (!this.$containerCopyLink)
		{
			this.$containerCopyLink = Tag.render`
				<button type="button" class="landing-sites__popup-copy">
					${Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK')}
				</button>
			`;

			Event.bind(this.$containerCopyLink, 'click', () => {
				this.getContainerInputUrl().select();
				let isCopied = false;
				try
				{
					isCopied = document.execCommand('copy');
				}
				catch
				{
					isCopied = false;
				}

				if (isCopied)
				{
					BX.UI.Notification.Center.notify({
						content: Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE'),
						autoHideDelay: 2000,
					});
					A11y.announce(Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE'));

					return;
				}

				A11y.announce(Loc.getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_ERROR'), 'assertive');
			});
		}

		return this.$containerCopyLink;
	}

	getContainerQrImage()
	{
		const node = Tag.render`
			<div class="landing-sites__popup-image"></div>
		`;

		new QRCode(node, {
			text: this.fullUrl,
			width: 250,
			height: 250,
		});

		return node;
	}

	getContainerQrButton()
	{
		const isShop = this.indexEditUrl.startsWith('/shop/');
		const popupButtonText = isShop ? Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SHOP') : Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SITE');
		if (!this.$containerQrButton)
		{
			const openQrButton = new Button({
				text: popupButtonText,
				useAirDesign: true,
				tag: Button.Tag.LINK,
				link: this.fullUrl,
				props: {
					target: '_blank',
					rel: 'noopener',
				},
				style: Button.AirStyle.OUTLINE,
			});
			this.$containerQrButton = openQrButton.getContainer();
		}

		return this.$containerQrButton;
	}

	getContainerQr()
	{
		if (!this.$containerQr)
		{
			const closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			Event.bind(closeIcon, 'click', this.hide.bind(this));
			const isShop = this.indexEditUrl.startsWith('/shop/');
			const popupText = isShop ? Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_3') : Loc.getMessage('LANDING_SITE_TILE_POPUP_SITE_TEXT');

			this.$containerQr = Tag.render`
				<div class="landing-sites__popup-container --qr">
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${popupText}
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons --ui-context-content-light">
								${this.getContainerQrButton()}
							</div>
						</div>
						<div class="landing-sites__popup-bottom">
							<a href="${this.fullUrl}" target="_blank" class="landing-sites__popup-url">
								${this.url}
								${this.getContainerInputUrl()}
							</a>
							${this.getContainerCopyLink()}
						</div>
					</div>
				</div>
			`;
		}

		return this.$containerQr;
	}

	getContainerTestOrder()
	{
		if (!this.$containerTestOrder)
		{
			const testOrderButton = new Button({
				text: Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER'),
				useAirDesign: true,
				style: Button.AirStyle.FILLED,
				props: {
					type: 'button',
				},
			});

			this.$containerTestOrder = testOrderButton.getContainer();
			Event.bind(this.$containerTestOrder, 'click', this.showSecondStep.bind(this));
		}

		return this.$containerTestOrder;
	}

	createContainerOpenCRM()
	{
		if (!this.$containerOpenCRMFirstStep)
		{
			const openCRMFirstStepButton = new Button({
				text: Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM'),
				className: 'landing-sites__popup-crm-button',
				useAirDesign: true,
				tag: Button.Tag.LINK,
				link: this.ordersUrl,
				style: Button.AirStyle.OUTLINE,
			});
			this.$containerOpenCRMFirstStep = openCRMFirstStepButton.getContainer();
		}

		if (!this.$containerOpenCRMSecondStep)
		{
			const openCRMSecondStepButton = new Button({
				text: Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM'),
				className: 'landing-sites__popup-crm-button',
				useAirDesign: true,
				tag: Button.Tag.LINK,
				link: this.ordersUrl,
				style: Button.AirStyle.OUTLINE,
			});
			this.$containerOpenCRMSecondStep = openCRMSecondStepButton.getContainer();
		}
	}

	getContainerOpenCRMFirstStep()
	{
		this.createContainerOpenCRM();

		return this.$containerOpenCRMFirstStep;
	}

	getContainerOpenCRMSecondStep()
	{
		this.createContainerOpenCRM();

		return this.$containerOpenCRMSecondStep;
	}

	getContainerFirstStep()
	{
		if (!this.$containerFirstStep)
		{
			const closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			Event.bind(closeIcon, 'click', this.hide.bind(this));

			this.$containerFirstStep = Tag.render`
				<div class="landing-sites__popup-container">
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">
								${Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}
							</span>
							${closeIcon}
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_TEXT')}
							</div>
							<div class="landing-sites__popup-image --first-order"></div>
							<div class="landing-sites__popup-buttons --ui-context-content-light">
								${this.getContainerTestOrder()}
								${this.getContainerOpenCRMFirstStep()}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.$containerFirstStep;
	}

	getContainerSecondStep()
	{
		if (!this.$containerSecondStep)
		{
			const closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			const prevIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-prev"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_BACK')}"
				></button>
			`;

			Event.bind(closeIcon, 'click', this.hide.bind(this));
			Event.bind(prevIcon, 'click', this.showFirstStep.bind(this));

			this.$containerSecondStep = Tag.render`
				<div class="landing-sites__popup-container --hide-left">
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							${prevIcon}
							<span class="landing-sites__popup-title-text">${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER')}</span>
							${closeIcon}
						</div>
						<div class="landing-sites__popup-content --popup-second-step">
							<div class="landing-sites__popup-text">
								<div class="landing-sites__popup-text --list"><span>1</span> ${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_1')}</div>
								<div class="landing-sites__popup-text --list"><span>2</span> ${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_2')}</div>
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons --ui-context-content-light">
								${this.getContainerOpenCRMSecondStep()}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.$containerSecondStep;
	}

	getContainerNotPublishedPublishButton()
	{
		if (!this.$containerNotPublishedPublishButton)
		{
			const restriction = this.itemObj.error?.publication;
			const isShop1c = this.itemObj.access.publication === false
				&& restriction?.code === 'shop1c';

			const options = {
				text: Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_PUBLISH'),
				useAirDesign: true,
				style: Button.AirStyle.FILLED,
			};

			if (isShop1c)
			{
				options.disabled = true;
				options.state = Button.State.DISABLED;
				options.icon = Button.Icon.LOCK;
				options.dataset = {
					hint: `${restriction.hint}<br><a href="${restriction.url}">${restriction.link}</a>`,
					hintNoIcon: 'Y',
					hintHtml: 'Y',
					hintInteractivity: 'Y',
				};
			}
			else
			{
				options.onclick = () => {
					this.itemObj.markUserPublicationAction();
					EventEmitter.emit('BX.Landing.SiteTile:publish', this.itemObj);
					this.hide();
				};
			}

			const publishButton = new Button(options);
			this.$containerNotPublishedPublishButton = publishButton.getContainer();
		}

		return this.$containerNotPublishedPublishButton;
	}

	getContainerNotPublishedOpenButton()
	{
		if (!this.$containerNotPublishedOpenButton)
		{
			const openButton = new Button({
				text: Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_OPEN'),
				useAirDesign: true,
				style: Button.AirStyle.OUTLINE,
			});
			this.$containerNotPublishedOpenButton = openButton.getContainer();
		}

		return this.$containerNotPublishedOpenButton;
	}

	getContainerNotPublished()
	{
		if (!this.$containerNotPublished)
		{
			const closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			Event.bind(closeIcon, 'click', this.hide.bind(this));
			const buttPublish = this.getContainerNotPublishedPublishButton();
			const buttOpen = this.getContainerNotPublishedOpenButton();
			Event.bind(buttOpen, 'click', () => {
				if (this.indexEditUrl)
				{
					Dom.addClass(buttOpen, 'ui-btn-wait');
					window.location.href = this.indexEditUrl;
				}
			});

			this.$containerNotPublished = Tag.render`
				<div class="landing-sites__popup-container --not-published" aria-hidden="true" inert>
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">
								${this.notPublishedText ? this.notPublishedText.title : 'title'}
							</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${this.notPublishedText ? this.notPublishedText.message : 'message'}
							</div>
							<div class="landing-sites__popup-buttons --ui-context-content-light">
								${buttPublish}
								${buttOpen}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.$containerNotPublished;
	}

	getContainer()
	{
		if (!this.$container)
		{
			this.$container = Tag.render`
				<div
					class="landing-sites__popup"
					role="dialog"
					aria-modal="true"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}"
					aria-hidden="true"
					inert
				>
					${this.getContainerFirstStep()}
					${this.getContainerSecondStep()}
					${this.getContainerQr()}
					${this.getContainerNotPublished()}
				</div>
			`;
		}

		return this.$container;
	}
}
