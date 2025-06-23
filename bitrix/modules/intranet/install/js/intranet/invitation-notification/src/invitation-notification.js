import { Extension, Type, Dom, Loc } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Popup, PopupManager } from 'main.popup';
import { Button } from 'ui.buttons';
import './style.css';

export type NotificationOptions = {
	title: string;
	description: string;
	type: number;
}

export class InvitationNotification
{
	#popup: Popup = null;
	#options: NotificationOptions = null;
	#invitationLink: ?string = null;
	invitationButton: ?Element = null;

	constructor(options: NotificationOptions)
	{
		if (Type.isObject(options))
		{
			this.#options = options;
		}

		this.#invitationLink = Extension.getSettings('intranet.invitation-notification').inviteWidgetLink;
		this.invitationButton = document.querySelector('[data-id="invitationButton"]');
	}

	createNotificationBalloon(onDone: Function): BX.UI.Notification.Balloon
	{
		return PopupManager.create({
			id: 'push-invitations',
			className: 'popup-window-dark',
			background: 'rgb(8, 93, 193)',
			closeIcon: true,
			autoHide: false,
			closeByEsc: true,
			padding: 12,
			borderRadius: 20,
			contentPadding: 0,
			offsetTop: 10,
			offsetLeft: -277,
			angle: {
				offset: 360,
				position: 'top',
			},
			bindElement: this.invitationButton,
			bindOptions: {
				forceBindPosition: false,
			},
			width: 440,
			minHeight: 120,
			content: this.getContent(),
			events: {
				onClose: () => {
					onDone();
					BX.userOptions.save('intranet.invitation', 'invitationNotificationTransitionBalloonTs', null, Math.floor(Date.now() / 1000));
				},
			},
		});
	}

	getContent(): HTMLElement
	{
		const title = this.#options.title;
		const description = this.#options.description;

		return Dom.create('div', {
			props: {
				className: 'intranet-notification-container',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'intranet-notification-container__image-wrapper',
					},
					children: [
						this.#renderImage(),
					],
				}),
				Dom.create('div', {
					props: {
						className: 'intranet-notification-content',
					},
					children: [
						this.#getMessageContainer(title, description),
						this.#getButtonContainer(),
					],
				}),
			],
		});
	}

	#renderImage(): HTMLElement
	{
		return Dom.create('div', {
			props: {
				className: 'intranet-notification-container__image',
			},
		});
	}

	#getMessageContainer(title, description): HTMLElement
	{
		return Dom.create('div', {
			props: {
				className: 'intranet-notification-content-wrapper',
			},
			children: [
				Dom.create('h4', {
					props: {
						className: 'intranet-notification-content__title',
					},
					html: title,
				}),
				Dom.create('span', {
					props: {
						className: 'intranet-notification-content__description',
					},
					html: description,
				}),
			],
		});
	}

	#getButtonContainer(): HTMLElement
	{
		const isReInviteNotification = this.#options.type === 7;
		const text = isReInviteNotification
			? Loc.getMessage('INTRANET_INVITATION_NOTIFICATION_BALLON_BUTTON_REINVITE')
			: Loc.getMessage('INTRANET_INVITATION_NOTIFICATION_BALLON_BUTTON_INVITE');

		return (new Button({
			text,
			round: true,
			noCaps: true,
			className: 'intranet-notification-content__action',
			onclick: () => {
				this.#popup.close();

				if (isReInviteNotification)
				{
					window.location.href = '/company/?apply_filter=Y&INVITED=Y';
				}
				else
				{
					const link = document.createElement('a');
					link.setAttribute('onclick', this.#invitationLink);
					link.click();
				}
			},
		})).render();
	}

	show(): void
	{
		BannerDispatcher.critical.toQueue((onDone) => {
			this.#popup = this.createNotificationBalloon(onDone);
			this.#popup.show();
			this.#popup.zIndexComponent.setZIndex(400);

			this.invitationButton.addEventListener('click', () => {
				this.#popup?.close();
			});
		});
	}
}
