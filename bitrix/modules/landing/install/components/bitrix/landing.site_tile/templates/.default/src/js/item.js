import {Tag, Text, Event, Loc, Dom, Type} from 'main.core';
import {Menu} from 'main.popup';
import {EventEmitter} from 'main.core.events';
import {MessageBox} from 'ui.dialogs.messagebox';
import {Icon, Outline, Solid} from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';

import EditableTitle from './editableTitle';
import LeaderShip from './leadership';
import PopupHelper from './popupHelper';
import { A11y } from './a11y';

export default class Item
{
	constructor(options)
	{
		this.id = options.id;
		this.grid = options.grid;
		this.title = options.title;
		this.url = options.url;
		this.fullUrl = options.fullUrl;
		this.domainProvider = options.domainProvider;
		this.pagesUrl = options.pagesUrl;
		this.ordersUrl = options.ordersUrl;
		this.domainUrl = options.domainUrl;
		this.contactsUrl = options.contactsUrl;
		this.indexEditUrl = options.indexEditUrl;
		this.ordersCount = options.ordersCount;
		this.phone = options.phone;
		this.preview = options.preview;
		this.cloudPreview = options.cloudPreview;
		this.published = options.published;
		this.deleted = options.deleted;
		this.domainStatus = options.domainStatus;
		this.domainStatusMessage = options.domainStatusMessage;
		this.menuItems = options.menuItems || [];
		this.menuBottomItems = options.menuBottomItems || [];
		this.notPublishedText = options.notPublishedText || null;
		this.access = options.access || {};
		this.error = options.error || {};
		this.articles = options.articles || [];
		this.editableTitle = null;
		this.editableUrl = null;
		this.leadership = null;
		this.popupHelper = null;
		this.popupStatus = null;
		this.popupConfig = null;
		this.loader = null;
		this.copilotProcess = Type.isBoolean(options.copilotProcess) ? options.copilotProcess : null;
		this.isCreatedByAiScenario = options.isCreatedByAiScenario === true;
		this.createByCopilotText = options.createByCopilotText ?? '';
		this.copilotGeneratedText = options.copilotGeneratedText ?? '';
		this.shouldAnnouncePublication = false;

		this.$container = null;
		this.$containerWrapper = null;
		this.$containerPreviewImage = null;
		this.$containerPreviewStatus = null;
		this.$containerPreviewShowPages = null;
		this.$containerPreviewInstruction = null;
		this.$containerPreviewInstructionButton = null;
		this.$containerInfo = null;
		this.$containerPhone = null;
		this.$containerTitle = null;
		this.$containerDomain = null;
		this.$containerDomainLink = null;
		this.$containerDomainStatus = null;
		this.$containerDomainStatusIcon = null;
		this.$containerDomainStatusTitle = null;
		this.$containerDomainStatusMessage = null;
		this.$containerSiteStatus = null;
		this.$containerSiteStatusRound = null;
		this.$containerSiteStatusTitle = null;
		this.$containerSiteMore = null;
		this.$containerLinks = null;

		this.bindEvents();

		this.lazyLoadCloudPreview = this.lazyLoadCloudPreview.bind(this);
	}

	bindEvents()
	{
		EventEmitter.subscribe('BX.Landing.SiteTile:showLeadership', options => {
			if (this === options.data)
			{
				this.active();
				this.setContainerPosition();
				this.getContainerPreviewInstructionButton()?.setAttribute('aria-expanded', 'true');
			}

			if (this !== options.data)
			{
				this.fade();
			}
		});

		EventEmitter.subscribe('BX.Landing.SiteTile:hideLeadership', options => {
			if (this === options.data)
			{
				this.unActive();
				this.unSetContainerPosition();
				this.getContainerPreviewInstructionButton()?.setAttribute('aria-expanded', 'false');
			}

			this.unFade();
		});

		EventEmitter.subscribe(this.getPopupHelper(), 'BX.Landing.SiteTile.Popup:onShow', () => {
			this.getContainerWrapper().classList.add('--fade');
			this.getContainerDomainLink().setAttribute('aria-expanded', 'true');
		});

		EventEmitter.subscribe(this.getPopupHelper(), 'BX.Landing.SiteTile.Popup:onHide', () => {
			this.getContainerWrapper().classList.remove('--fade');
			this.getContainerDomainLink().setAttribute('aria-expanded', 'false');
		});

		// close open dialogs while still attached so their focus trap releases inert before the grid is replaced
		EventEmitter.subscribe('BX.Landing.SiteTile:beforeGridRefresh', () => {
			if (this.popupHelper?.isShown)
			{
				this.popupHelper.hide();
			}

			if (this.leadership?.isShown)
			{
				this.leadership.hide();
			}
		});
	}

	setContainerPosition()
	{
		let offsetRight = window.innerWidth - this.getContainer().getBoundingClientRect().right;
		let leaderShipWidth = this.getLeadership().getContainer().offsetWidth;
		let previousItem = this.getContainer().previousSibling;
		if (offsetRight > leaderShipWidth)
		{
			return;
		}

		this.getContainer().style.transform = 'translateX(-' + (leaderShipWidth + 40 - offsetRight) + 'px)';

		if (previousItem && (previousItem.offsetTop === this.getContainer().offsetTop))
		{
			previousItem.style.transform = 'translateX(-10px)';
		}
	}

	unSetContainerPosition()
	{
		this.getContainer().style.transform = null;

		let previousItem = this.getContainer().previousSibling;
		if (previousItem && (previousItem.offsetTop === this.getContainer().offsetTop))
		{
			previousItem.style.transform = null;
		}
	}

	markUserPublicationAction()
	{
		this.shouldAnnouncePublication = true;
	}

	consumeUserPublicationAction(): boolean
	{
		const shouldAnnounce = this.shouldAnnouncePublication === true;
		this.shouldAnnouncePublication = false;

		return shouldAnnounce;
	}

	announcePublishedStatus(status: boolean)
	{
		A11y.announce(
			status
				? Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_PUBLISHED')
				: Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_UNPUBLISHED'),
		);
	}

	announcePublicationError(message: ?string)
	{
		if (!this.consumeUserPublicationAction())
		{
			return;
		}

		A11y.announce(
			message || Loc.getMessage('LANDING_SITE_TILE_PUBLICATION_ERROR'),
			'assertive',
		);
	}

	updatePublishedStatus(status: boolean, options: { announce?: boolean } = {})
	{
		const shouldAnnounce = options.announce === true || this.consumeUserPublicationAction();
		if (this.published === status)
		{
			return;
		}
		if (this.popupStatus)
		{
			this.popupStatus.destroy();
		}
		this.popupStatus = null;

		if (status)
		{
			this.published = true;
			this.getContainerSiteStatus().className = 'landing-sites__status --success';
			this.getContainerSiteStatusTitle().innerText = Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED');
			this.getContainerPreviewImage().classList.remove('--not-published');
			this.getContainerPreviewStatus().classList.add('--hide');
			if (shouldAnnounce)
			{
				this.announcePublishedStatus(true);
			}

			return;
		}

		this.published = false;
		this.getContainerSiteStatus().className = 'landing-sites__status --alert';
		this.getContainerSiteStatusTitle().innerText = Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');
		this.getContainerPreviewImage().classList.add('--not-published');
		this.getContainerPreviewStatus().classList.remove('--hide');
		if (shouldAnnounce)
		{
			this.announcePublishedStatus(false);
		}
	}

	updateTitle(param: string)
	{
		if (param)
		{
			this.title = param;
		}
	}

	updateUrl(param: string)
	{
		if (param)
		{
			this.url = param;
		}
	}

	getContainerTitle()
	{
		if (!this.$containerTitle)

		{
			const iconEdit = new Icon({
				icon: Outline.EDIT_M,
				color: 'var(--ui-color-base-70)',
				size: 21,
			});
			const iconEditNode = iconEdit.render();
			iconEditNode.classList.add('landing-sites__title-edit');
			this.$containerTitle = Tag.render`
				<div class="landing-sites__title">
					<div class="landing-sites__title-text">${this.title}</div>
					${iconEditNode}
				</div>
			`;
		}

		return this.$containerTitle;
	}

	mergeMenuItems(items: Array<Object>): Array<Object>
	{
		const addMenu = [
			{
				text: this.deleted
					? Loc.getMessage('LANDING_SITE_TILE_RESTORE')
					: Loc.getMessage('LANDING_SITE_TILE_REMOVE'),
				access: 'delete',
				onclick: () => {
					if (!this.deleted)
					{
						const messageBox = new MessageBox({
							title: Loc.getMessage('LANDING_SITE_TILE_DELETE_ALERT_TITLE'),
							message: Loc.getMessage('LANDING_SITE_TILE_DELETE_ALERT_MESSAGE'),
							useAirDesign: true,
							buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
							onOk: () => {
								EventEmitter.emit('BX.Landing.SiteTile:remove', [this, messageBox]);
								messageBox.close();
							},
							popupOptions: {
								autoHide: true,
								closeByEsc: true,
								minHeight: false,
								minWidth: 260,
								maxWidth: 300,
								width: false,
								animation: 'fading-slide',
							},
						});
						messageBox.show();
					}
					else
					{
						EventEmitter.emit('BX.Landing.SiteTile:restore', this);
						this.getPopupConfig().close();
					}
				},
			},
		];

		let spliceStart = 0;
		items.map((item, i) => {
			if (item.delimiter === true)
			{
				spliceStart = i;
			}
			if (this.deleted)
			{
				item.disabled = true;
			}
		});
		addMenu.reverse().map(item => {
			items.push(item);
		});

		return items;
	}

	disableMenuItems(items: Array<Object>): Array<Object>
	{
		items = items.map(item => {
			if (item.access && this.access[item.access] !== true)
			{
				item.disabled = true;
			}
			return item;
		});

		return items;
	}

	getPopupConfig()
	{
		if (!this.popupConfig)
		{
			const items = this.disableMenuItems(this.mergeMenuItems(this.menuItems));
			items.forEach((item) => {
				if (item.access === 'settings' && Type.isString(item.onclick))
				{
					item.onclick = item.onclick.replace('#ID#', this.id);
				}
			});

			this.popupConfig = new Menu({
				className: 'landing-sites__status-popup',
				bindElement: this.getContainerSiteMore(),
				offsetLeft: -61,
				minWidth: 220,
				closeByEsc: true,
				autoHide: true,
				angle: {
					offset: 97,
				},
				items,
				events: {
					onPopupClose: () => {
						this.getContainerSiteMore().classList.remove('--hover');
						this.getContainerSiteMore().setAttribute('aria-expanded', 'false');
					},
					onPopupShow: () => {
						this.getContainerSiteMore().classList.add('--hover');
						this.getContainerSiteMore().setAttribute('aria-expanded', 'true');
					},
				},
				animation: 'fading-slide',
			});
		}

		return this.popupConfig;
	}

	getPopupStatus(): Menu
	{
		if (!this.popupStatus)
		{
			this.popupStatus = new Menu({
				className: 'landing-sites__status-popup',
				bindElement: this.getContainerSiteStatus(),
				minWidth: 220,
				closeByEsc: true,
				autoHide: true,
				angle: {
					offset: 97,
				},
				items: [
					{
						text: this.published
							? Loc.getMessage('LANDING_SITE_TILE_UNPUBLISH')
							: Loc.getMessage('LANDING_SITE_TILE_PUBLISH'),
						onclick: () => {
							this.popupStatus.close();
							this.markUserPublicationAction();
							this.published
								? EventEmitter.emit('BX.Landing.SiteTile:unPublish', this)
								: EventEmitter.emit('BX.Landing.SiteTile:publish', this);
						},
					},
				],
				events: {
					onPopupClose: () => {
						this.getContainerSiteStatus().classList.remove('--hover');
						this.getContainerSiteStatus().setAttribute('aria-expanded', 'false');
					},
					onPopupShow: () => {
						this.getContainerSiteStatus().classList.add('--hover');
						this.getContainerSiteStatus().setAttribute('aria-expanded', 'true');
					},
				},
				animation: 'fading-slide',
			});
		}

		return this.popupStatus;
	}

	getContainerSiteStatus()
	{
		if (!this.$containerSiteStatus)
		{
			if (this.access.publication)
			{
				const status = this.published
					? '--success'
					: '--alert';

				this.$containerSiteStatus = Tag.render`
					<button
						type="button"
						class="landing-sites__status ${status}"
						aria-haspopup="menu"
						aria-expanded="false"
						data-testid="landing-sites-item-status-btn"
					>
						${this.getContainerSiteStatusTitle()}
						<div class="landing-sites__status-arrow"></div>
					</button>
				`;

				Event.bind(this.$containerSiteStatus, 'click', ev => {
					this.getPopupStatus().layout.menuContainer.style.left =
						this.$containerSiteStatus.getBoundingClientRect().left + 'px';
					this.getPopupStatus().show();
					ev.stopPropagation();
				});
			}
			else
			{
				this.$containerSiteStatus = Tag.render`
					<div class="landing-sites__status_disabled">
						${this.getContainerSiteStatusRound()}
						${this.getContainerSiteStatusTitle()}
					</div>
				`;

				if (this.error.publication)
				{
					const code = this.error.publication.code || '';
					const hint = this.error.publication.hint || '';
					const url = this.error.publication.url || '';
					const link = this.error.publication.link || '';
					if (code === 'shop1c')
					{
						this.$containerSiteStatus = Tag.render`
							<div 
								class="landing-sites__status_disabled"
								data-hint="${hint}<br><a href='${url}'>${link}</a>"
								data-hint-no-icon
								data-hint-html
								data-hint-interactivity
							>
								${this.getContainerSiteStatusRound()}
								${this.getContainerSiteStatusTitle()}
							</div>
						`;
					}
				}
			}
		}

		return this.$containerSiteStatus;
	}

	getContainerSiteMore()
	{
		if (!this.$containerSiteMore)
		{
			const iconMore = new Icon({
				icon: Outline.MORE_M,
				color: 'var(--ui-color-base-70)',
				size: 21,
			});
			this.$containerSiteMore = Tag.render`
				<button
					type="button"
					class="landing-sites__more"
					aria-label="${Text.encode(Loc.getMessage('LANDING_SITE_TILE_MORE_ACTIONS'))}"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="landing-sites-item-more-btn"
				>${iconMore.render()}</button>
			`;

			Event.bind(this.$containerSiteMore, 'click', ev => {
				this.getPopupConfig().show();
				ev.stopPropagation();
			});
		}

		return this.$containerSiteMore;
	}

	getContainerSiteStatusRound()
	{
		if (!this.$containerSiteStatusRound)
		{
			this.$containerSiteStatusRound = Tag.render`<div class="landing-sites__status-round"></div>`;
		}

		return this.$containerSiteStatusRound;
	}

	getContainerSiteStatusTitle()
	{
		if (!this.$containerSiteStatusTitle)
		{
			let title = this.published
				? Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED')
				: Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');

			this.$containerSiteStatusTitle = Tag.render`<div class="landing-sites__status-title">${title}</div>`;
		}

		return this.$containerSiteStatusTitle;
	}

	publush()
	{
		this.published = true;
		this.getContainerSiteStatus().className = 'landing-sites__status --success';
		this.getContainerSiteStatusTitle().innerText = Loc.getMessage('LANDING_SITE_TILE_STATUS_PUBLISHED');
		this.getContainerPreviewStatus().classList.add('--hide');
	}

	unPublish()
	{
		this.published = false;
		this.getContainerSiteStatus().className = 'landing-sites__status --alert';
		this.getContainerSiteStatusTitle().innerText = Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED');
		this.getContainerPreviewStatus().classList.remove('--hide');
	}

	getEditableTitle()
	{
		if (!this.editableTitle)
		{
			this.editableTitle = new EditableTitle({
				phone: this.phone,
				type: 'title',
				item: this,
				url: this.contactsUrl,
				disabled: !this.access.settings,
			});
		}

		return this.editableTitle;
	}

	getContainerInfo()
	{
		if (!this.$containerInfo)
		{
			this.$containerInfo = Tag.render`
				<div class="landing-sites__container --white-bg">
					<div class="landing-sites__container-left">
						<div class="landing-sites__title">
							<div class="landing-sites__title-text" title="${Text.encode(this.title)}">${Text.encode(this.title)}</div>
						</div>
						${this.phone ? this.getEditableTitle().getContainer() : ''}
					</div>
					<div class="landing-sites__container-right">
						${this.getContainerSiteStatus()}
						${this.getContainerSiteMore()}
					</div>
				</div>
			`;
		}

		return this.$containerInfo;
	}

	announceDomainStatus(statusText: string)
	{
		const message = statusText || Loc.getMessage('LANDING_SITE_TILE_DOMAIN_STATUS_UPDATED_FALLBACK');
		const template = Loc.getMessage('LANDING_SITE_TILE_DOMAIN_STATUS_UPDATED') || '#STATUS#';
		A11y.announce(
			template.replace('#STATUS#', message),
		);
	}

	updateDomainStatus(status: string, statusText: string, options: { announce?: boolean } = {})
	{
		// success
		// alert
		// danger
		// clock
		const previousStatus = this.domainStatus || '';
		const previousStatusText = this.domainStatusMessage || '';
		!status ? status = '' : null;
		this.domainStatus = status;
		this.updateContainerDomainStatus();

		!statusText ? statusText = '' : null;
		this.updateDomainStatusMessage(statusText);
		if (
			options.announce === true
			&& (previousStatus !== status || previousStatusText !== statusText)
		)
		{
			this.announceDomainStatus(statusText);
		}
	}

	getDomainStatusIconByStatus(status: string)
	{
		switch (status)
		{
			case 'alert':
			case 'danger':
				return Solid.ALERT_ACCENT;

			case 'clock':
				return Outline.CLOCK;

			case 'success':
			case 'unknow':
			default:
				return Outline.LINK;
		}
	}

	getDomainStatusIconColorByStatus(status: string)
	{
		switch (status)
		{
			case 'alert':
				return 'var(--ui-color-background-primary)';

			case 'danger':
				return 'var(--ui-color-background-primary)';

			case 'clock':
				return 'var(--ui-color-design-outline-a1-content)';

			case 'success':
				return 'var(--ui-color-background-primary)';

			case 'unknow':
			default:
				return 'var(--ui-color-design-outline-a1-content)';
		}
	}

	createContainerDomainStatusIcon()
	{
		const iconStatus = new Icon({
			icon: this.getDomainStatusIconByStatus(this.domainStatus),
			color: this.getDomainStatusIconColorByStatus(this.domainStatus),
			size: 20,
		});

		const iconNode = iconStatus.render();
		iconNode.classList.add('landing-sites__container-status-icon');

		return iconNode;
	}

	updateContainerDomainStatus()
	{
		const statusClass = this.domainStatus ? ` --${this.domainStatus}` : '';
		const container = this.getContainerDomainStatus();

		container.className = `landing-sites__container-status${statusClass}`;
		Dom.clean(container);
		container.appendChild(this.createContainerDomainStatusIcon());
	}

	getContainerDomainStatus()
	{
		if (!this.$containerDomainStatus)
		{
			this.$containerDomainStatus = Tag.render`<div class="landing-sites__container-status"></div>`;
			this.updateContainerDomainStatus();
		}

		return this.$containerDomainStatus;
	}

	getEditableUrl()
	{
		if (!this.editableUrl)
		{
			this.editableUrl = new EditableTitle({
				title: this.url,
				type: 'url',
				item: this,
				url: this.domainUrl,
				disabled: !this.access.settings,
			});
		}

		return this.editableUrl;
	}

	getContainerDomainStatusIcon()
	{
		if (!this.$containerDomainStatusIcon)
		{
			const iconQrCode = new Icon({
				icon: Outline.QR_CODE,
				color: 'var(--ui-color-design-outline-a1-content)',
				size: 20,
			});
			this.$containerDomainStatusIcon = iconQrCode.render();
			this.$containerDomainStatusIcon.classList.add('landing-sites__status-icon');
			if (this.domainStatus)
			{
				this.$containerDomainStatusIcon.classList.add(`--${this.domainStatus}`);
			}
		}

		return this.$containerDomainStatusIcon;
	}

	getContainerDomainStatusTitle()
	{
		if (!this.$containerDomainStatusTitle)
		{
			let title = Loc.getMessage('LANDING_SITE_TILE_OPEN');

			this.$containerDomainStatusTitle = Tag.render`
				<div class="landing-sites__status-title">
					${title}
				</div>`;
		}

		return this.$containerDomainStatusTitle;
	}

	updateDomainStatusMessage(text: string)
	{
		!text ? text = '' : null;

		this.getContainerDomainStatusMessage().innerText = text;
		this.domainStatusMessage = text;
	}

	getContainerDomainStatusMessage()
	{
		if (!this.$containerDomainStatusMessage)
		{
			!this.domainStatusMessage ? this.domainStatusMessage = '' : null;
			this.$containerDomainStatusMessage = Tag.render`
				<div class="landing-sites__sub-title">${this.domainStatusMessage}</div>
			`;
		}

		return this.$containerDomainStatusMessage;
	}

	getContainerDomainLink()
	{
		if (!this.$containerDomainLink)
		{
			this.$containerDomainLink = Tag.render`
				<button
					type="button"
					class="landing-sites__status landing-sites__status-${this.id}"
					aria-label="${Text.encode(Loc.getMessage('LANDING_SITE_TILE_OPEN_SITE_LINK'))}"
					aria-haspopup="dialog"
					aria-expanded="false"
					data-testid="landing-sites-item-domain-btn"
				>
					${this.getContainerDomainStatusIcon()}
					${this.getContainerDomainStatusTitle()}
				</button>
			`;

			Event.bind(this.$containerDomainLink, 'click', () => {
				this.getPopupHelper().show(this.published ? 'link' : 'notPublished');
			});
		}

		return this.$containerDomainLink;
	}

	getContainerDomain()
	{
		if (!this.$containerDomain)
		{
			this.$containerDomain = Tag.render`
				<div class="landing-sites__container --white-bg --white-bg--alpha --domain">
					${this.getContainerDomainStatus()}
					<div class="landing-sites__container-left">
						${this.getEditableUrl().getContainer()}
						${this.getContainerDomainStatusMessage()}
					</div>
					<div class="landing-sites__container-right">
						${this.getContainerDomainLink()}
					</div>
				</div>
			`;
		}

		return this.$containerDomain;
	}

	getContainerPreviewImage()
	{
		if (!this.$containerPreviewImage)
		{
			this.$containerPreviewImage = Tag.render`<div class="landing-sites__preview-image ${this.published ? '' : '--not-published'}"></div>`;

			this.$containerPreviewImage.style.backgroundImage = 'url(' + this.preview + ')';
			this.$containerPreviewImage.style.backgroundSize = 'cover';
			if (this.published && this.cloudPreview && (this.cloudPreview !== this.preview))
			{
				this.lazyLoadCloudPreview();
			}

			if (this.copilotProcess === false)
			{
				const copilotLabel = Tag.render`
					<div class="landing-sites__preview-copilot-label">
						<div class="">${this.createByCopilotText}</div>
					</div>
				`;
				this.$containerPreviewImage.appendChild(copilotLabel);
			}
		}

		return this.$containerPreviewImage;
	}

	lazyLoadCloudPreview()
	{
		try {
			const previewUrl =
				this.cloudPreview
				+ ((this.cloudPreview.indexOf('?') > 0) ? '&' : '?')
				+ 'refreshed' + (Date.now()/86400000|0)
			;
			const xhr = new XMLHttpRequest();
			xhr.open("HEAD", previewUrl);
			xhr.onload = () => {
				const expires = xhr.getResponseHeader("expires");
				if (
					expires
					&& (new Date(expires)) <= (new Date())
				)
				{
					setTimeout(this.lazyLoadCloudPreview, 3000);
				}
				else
				{
					this.$containerPreviewImage.style.backgroundImage = 'url(' + previewUrl + ')';
				}
			};
			xhr.send();
		} catch (error) {}
	}

	getContainerPreviewStatus()
	{
		if (!this.$containerPreviewStatus)
		{
			this.$containerPreviewStatus = Tag.render`
				<div class="landing-sites__preview-status --not-published ${this.published ? '--hide' : ''}">
					<div class="landing-sites__preview-status-wrapper">
						<div class="landing-sites__preview-status-icon"></div>
						<div class="landing-sites__preview-status-text">
							${Loc.getMessage('LANDING_SITE_TILE_STATUS_NOT_PUBLISHED')}
						</div>
					</div>
				</div>
			`;

			Event.bind(this.$containerPreviewStatus, 'mouseenter', () => {
				this.$containerPreviewStatus.style.width = this.$containerPreviewStatus.firstElementChild.offsetWidth + 'px';
			});

			Event.bind(this.$containerPreviewStatus, 'mouseleave', () => {
				this.$containerPreviewStatus.style.width = null;
			});
		}

		return this.$containerPreviewStatus;
	}

	getContainerPreviewShowPages()
	{
		if (!this.$containerPreviewShowPages)
		{
			const previewShowText = this.isCreatedByAiScenario
				? (Loc.getMessage('LANDING_SITE_TILE_GO_TO_COMBO_MODE') || Loc.getMessage('LANDING_SITE_TILE_SHOW_PAGES'))
				: Loc.getMessage('LANDING_SITE_TILE_SHOW_PAGES');

			this.$containerPreviewShowPages = Tag.render`
				<div class="landing-sites__preview-show">
					${previewShowText}
				</div>
			`;
		}

		return this.$containerPreviewShowPages;
	}

	getContainerPreviewInstruction()
	{
		if (!this.$containerPreviewInstruction)
		{
			this.$containerPreviewInstructionButton = Tag.render`
				<button
					type="button"
					class="landing-sites__preview-leadership-text"
					aria-haspopup="dialog"
					aria-expanded="false"
					data-testid="landing-sites-item-leadership-btn"
				>
					${Loc.getMessage('LANDING_SITE_TILE_INSTRUCTION')}
				</button>
			`;

			this.$containerPreviewInstruction = Tag.render`
				<div class="landing-sites__preview-leadership">
					${this.$containerPreviewInstructionButton}
				</div>
			`;

			Event.bind(this.$containerPreviewInstructionButton, 'click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				this.getLeadership().show();
			});
		}

		return this.$containerPreviewInstruction;
	}

	getContainerPreviewInstructionButton()
	{
		if (!this.$containerPreviewInstructionButton && this.articles.length > 0)
		{
			this.getContainerPreviewInstruction();
		}

		return this.$containerPreviewInstructionButton;
	}

	getContainerLinks()
	{
		if (!this.$containerLinks)
		{
			this.$containerLinks = Tag.render`<div class="landing-sites__container --without-bg --auto-height --flex"></div>`;

			this.menuBottomItems.map(menuItem => {
				this.$containerLinks.appendChild(this.getContainerLinksItem(menuItem.code, menuItem.href, menuItem.text));
			});
		}

		return this.$containerLinks;
	}

	getContainerLinkIconByType(type: string)
	{
		switch (type)
		{
			case 'orders':
				return Outline.CRM;

			case 'marketing':
				return Outline.ROCKET;

			case 'cookies':
				return Outline.COOKIES;

			case 'pages':
				return Outline.PAGES;

			case 'products':
				return Outline.SHOPPING_CART;

			default:
				return null;
		}
	}

	getContainerLinksItem(type: string, link: string, title: string)
	{
		const iconType = this.getContainerLinkIconByType(type);
		let iconNode;

		if (iconType)
		{
			const icon = new Icon({
				icon: iconType,
				color: 'var(--ui-color-design-outline-a1-content)',
				size: 24,
			});
			iconNode = icon.render();
			iconNode.classList.add('landing-sites__container-link-icon', `--${type}`);
			iconNode.setAttribute('aria-hidden', 'true');
		}
		else
		{
			iconNode = Tag.render`<div class="landing-sites__container-link-icon --${type}"></div>`;
			iconNode.setAttribute('aria-hidden', 'true');
		}

		const container = Tag.render`
			<a
				href="${link}"
				class="landing-sites__container-link landing-sites__container-link-${this.id}"
				aria-label="${Text.encode(title)}"
			>
				${iconNode}
				<div class="landing-sites__container-link-text">${title}</div>
			</a>
		`;

		Event.bind(container, 'click', event => {
			EventEmitter.emit('BX.Landing.SiteTile:onBottomMenuClick', [type, event, this]);
		});

		return container;
	}

	getLeadership()
	{
		if (!this.leadership)
		{
			this.leadership = new LeaderShip({
				id: this.id,
				item: this,
				articles: this.articles,
			});
		}
		return this.leadership;
	}

	getRemoveFocusTarget()
	{
		const items = this.grid.getItems();
		const index = items.indexOf(this);
		const item = items[index + 1] || items[index - 1] || null;
		if (item && item.getContainer)
		{
			const container = item.getContainer();
			container.tabIndex = -1;

			return container;
		}

		const gridContainer = this.grid.getContainer();
		gridContainer.tabIndex = -1;

		return gridContainer;
	}

	restoreFocusAfterRemove()
	{
		const activeElement = document.activeElement;
		if (!activeElement || !this.getContainer().contains(activeElement))
		{
			return;
		}

		const target = this.getRemoveFocusTarget();
		requestAnimationFrame(() => {
			target.focus({ preventScroll: true });
		});
	}

	remove(options: { announce?: boolean } = {})
	{
		const container = this.getContainer();
		let isRemoved = false;
		this.restoreFocusAfterRemove();
		if (options.announce === true)
		{
			A11y.announce(Loc.getMessage('LANDING_SITE_TILE_REMOVE_ANNOUNCE'));
		}
		container.classList.add('--remove');
		Event.bind(container, 'transitionend', () => {
			if (isRemoved)
			{
				return;
			}

			isRemoved = true;
			let items = this.grid.getItems();
			const index = items.indexOf(this);
			if (index !== -1)
			{
				items.splice(index, 1);
			}
			Dom.remove(container);
		});
	}

	lock()
	{
		this.getContainer().classList.add('--lock');
		if (!this.loader)
		{
			this.loader = new BX.Loader({
				target: this.getContainer(),
				size: 100,
			});
		}

		this.loader.show();
	}

	unLock()
	{
		this.getContainer().classList.remove('--lock');
		if (this.loader)
		{
			this.loader.hide();
		}
	}

	fade()
	{
		this.getContainer().classList.add('--fade');
	}

	unFade()
	{
		this.getContainer().classList.remove('--fade');
	}

	active()
	{
		this.getContainer().classList.add('--active');
	}

	unActive()
	{
		this.getContainer().classList.remove('--active');
	}

	getPopupHelper(): PopupHelper
	{
		if (!this.popupHelper)
		{
			this.popupHelper = new PopupHelper({
				id: this.id,
				url: this.url,
				itemObj: this,
				fullUrl: this.fullUrl,
				ordersUrl: this.ordersUrl,
				indexEditUrl: this.indexEditUrl,
				notPublishedText: this.notPublishedText,
			});
		}

		return this.popupHelper;
	}

	getContainerWrapper()
	{
		if (!this.$containerWrapper)
		{
			this.$containerWrapper = Tag.render`
				<div class="landing-sites__item-container">
					<div class="landing-sites__preview-container">
						<a href="${this.pagesUrl}" class="landing-sites__preview">
							${this.getContainerPreviewImage()}
							${this.getContainerPreviewStatus()}
							${this.getContainerPreviewShowPages()}
						</a>
						${this.articles.length > 0 ? this.getContainerPreviewInstruction() : ''}
					</div>
					${this.getContainerInfo()}
					${this.getContainerDomain()}
					${this.getContainerLinks()}
				</div>
			`;
		}

		return this.$containerWrapper;
	}

	getContainer()
	{
		if (!this.$container)
		{
			const containerClasses = [
				'landing-sites__grid-item',
				this.deleted ? '--deleted' : '',
				this.copilotProcess === true ? '--generating' : '',
			].join(' ').trim();

			const copilotLabel = this.copilotProcess === true
				? Tag.render`
					<div class="landing-sites__preview-show copilot-label">
					    <i class="ui-icon-set --bitrix-gpt"></i>
					    ${this.copilotGeneratedText}
					</div>
				`
				: '';

			this.$container = Tag.render`
				<div class="${containerClasses}" role="listitem">
				    <div class="landing-sites__item" id="landing-sites__grid-item--${this.id}">
				        ${this.getLeadership().getContainer()}
				        ${this.getContainerWrapper()}
				        ${this.getPopupHelper().getContainer()}
				    </div>
				    ${copilotLabel}
				</div>
			`;
		}

		return this.$container;
	}
}
