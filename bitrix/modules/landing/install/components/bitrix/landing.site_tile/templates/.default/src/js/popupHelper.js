import {Tag, Event, Dom, Loc} from 'main.core';
import {EventEmitter} from 'main.core.events';
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
		this.$containerInputUrl = null;
		this.$containerCopyLink = null;
		this.$containerTestOrder = null;
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
			|| ev.target.closest('.landing-sites__container-link-' + this.id)
			|| ev.target.closest('.landing-sites__status-' + this.id)
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
				catch (error)
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
		let node = Tag.render`
			<div class="landing-sites__popup-image"></div>
		`;

		new QRCode(node, {
			text: this.fullUrl,
			width: 250,
			height: 250,
		});

		return node;
	}

	getContainerQr()
	{
		if (!this.$containerQr)
		{
			let closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			Event.bind(closeIcon, 'click', this.hide.bind(this));
			const isShop = this.indexEditUrl.startsWith('/shop/');
			const popupText = isShop ? Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_3') : Loc.getMessage('LANDING_SITE_TILE_POPUP_SITE_TEXT');
			const popupButtonText = isShop ? Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SHOP') : Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_SITE');

			this.$containerQr = Tag.render`
				<div class="landing-sites__popup-container --qr">
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${popupText}
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons">
								<a href="${this.fullUrl}" target="_blank" class="ui-btn ui-btn-light-border ui-btn-round">
									${popupButtonText}
								</a>
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
			this.$containerTestOrder = Tag.render`
				<button type="button" class="ui-btn ui-btn-success ui-btn-round">
					${Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}
				</button>
			`;

			Event.bind(this.$containerTestOrder, 'click', this.showSecondStep.bind(this));
		}

		return this.$containerTestOrder;
	}

	getContainerFirstStep()
	{
		if (!this.$containerFirstStep)
		{
			let closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			Event.bind(closeIcon, 'click', this.hide.bind(this));

			this.$containerFirstStep = Tag.render`
				<div class="landing-sites__popup-container">
					${closeIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">
								${Loc.getMessage('LANDING_SITE_TILE_POPUP_CREATE_TEST_ORDER')}
							</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_TEXT')}
							</div>
							<div class="landing-sites__popup-image --first-order"></div>
							<div class="landing-sites__popup-buttons">
								${this.getContainerTestOrder()}
								<a href="${this.ordersUrl}" class="ui-btn ui-btn-light-border ui-btn-round">
									${Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM')}
								</a>
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
			let closeIcon = Tag.render`
				<button
					type="button"
					class="landing-sites__popup-close"
					aria-label="${Loc.getMessage('LANDING_SITE_TILE_POPUP_CLOSE')}"
				></button>
			`;
			let prevIcon = Tag.render`
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
					${closeIcon}
					${prevIcon}
					<div class="landing-sites__popup-wrapper">
						<div class="landing-sites__popup-title">
							<span class="landing-sites__popup-title-text">${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER')}</span>
						</div>
						<div class="landing-sites__popup-content">
							<div class="landing-sites__popup-text">
								<div class="landing-sites__popup-text --list"><span>1</span> ${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_1')}</div>
								<div class="landing-sites__popup-text --list"><span>2</span> ${Loc.getMessage('LANDING_SITE_TILE_POPUP_TEST_ORDER_ACTION_2')}</div>
							</div>
							${this.getContainerQrImage()}
							<div class="landing-sites__popup-buttons">
								<a href="${this.ordersUrl}" class="ui-btn ui-btn-success ui-btn-round">
									${Loc.getMessage('LANDING_SITE_TILE_POPUP_OPEN_CRM')}
								</a>
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.$containerSecondStep;
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

			let buttPublish = Tag.render`
				<button type="button" class="ui-btn ui-btn-success ui-btn-round">
					${Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_PUBLISH')}
				</button>
			`;
			if (
				this.itemObj.access.publication === false
				&& this.itemObj.error.publication
			)
			{
				const code = this.itemObj.error.publication.code || '';
				const hint = this.itemObj.error.publication.hint || '';
				const url = this.itemObj.error.publication.url || '';
				const link = this.itemObj.error.publication.link || '';
				if (code === 'shop1c')
				{
					buttPublish = Tag.render`
					<button 
						type="button"
						class="ui-btn ui-btn-success ui-btn-round ui-btn-disabled ui-btn-icon-lock"
						aria-disabled="true"
						data-hint="${hint}<br><a href='${url}'>${link}</a>"
						data-hint-no-icon
						data-hint-html
						data-hint-interactivity
					>
						${Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_PUBLISH')}
					</button>
				`;
				}
			}
			if (buttPublish.getAttribute('aria-disabled') !== 'true')
			{
				Event.bind(buttPublish, 'click', () =>
				{
					this.itemObj.markUserPublicationAction();
					EventEmitter.emit('BX.Landing.SiteTile:publish', this.itemObj);
					this.hide();
				});
			}

			const buttOpen = Tag.render`
				<button type="button" class="ui-btn ui-btn-light-border ui-btn-round">
					${Loc.getMessage('LANDING_SITE_TILE_NOT_PUBLISHED_BUTTON_OPEN')}
				</button>
			`;
			Event.bind(buttOpen, 'click', () =>
			{
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
							<div class="landing-sites__popup-buttons">
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
