/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher, main_popup, ui_buttons, ui_analytics) {
	'use strict';

	class InvitationNotification {
		#popup = null;
		#options = null;
		#invitationLink = null;
		invitationButton = null;
		constructor(options) {
			if (main_core.Type.isObject(options)) {
				this.#options = options;
			}
			this.#invitationLink = main_core.Extension.getSettings('intranet.invitation-notification').inviteWidgetLink;
			this.invitationButton = document.querySelector('[data-id="invitationButton"]');
		}
		createNotificationBalloon(onDone) {
			const isAirTemplate = BX.Reflection.getClass('BX.Intranet.Bitrix24.Template') !== null;
			return main_popup.PopupManager.create({
				id: 'push-invitations',
				className: 'popup-window-dark',
				background: 'rgb(8, 93, 193)',
				closeIcon: true,
				autoHide: true,
				closeByEsc: true,
				padding: 12,
				borderRadius: 20,
				contentPadding: 0,
				offsetTop: 10,
				offsetLeft: isAirTemplate ? -310 : -277,
				angle: {
					offset: 360,
					position: 'top'
				},
				bindElement: this.invitationButton,
				bindOptions: {
					forceBindPosition: false
				},
				width: 440,
				minHeight: 120,
				content: this.getContent(),
				events: {
					onClose: () => {
						onDone();
					}
				}
			});
		}
		getContent() {
			const title = this.#options.title;
			const description = this.#options.description;
			return main_core.Dom.create('div', {
				props: {
					className: 'intranet-notification-container'
				},
				children: [main_core.Dom.create('div', {
					props: {
						className: 'intranet-notification-container__image-wrapper'
					},
					children: [this.#renderImage()]
				}), main_core.Dom.create('div', {
					props: {
						className: 'intranet-notification-content'
					},
					children: [this.#getMessageContainer(title, description), this.#getButtonContainer()]
				})]
			});
		}
		#renderImage() {
			return main_core.Dom.create('div', {
				props: {
					className: 'intranet-notification-container__image'
				}
			});
		}
		#getMessageContainer(title, description) {
			return main_core.Dom.create('div', {
				props: {
					className: 'intranet-notification-content-wrapper'
				},
				children: [main_core.Dom.create('h4', {
					props: {
						className: 'intranet-notification-content__title'
					},
					html: title
				}), main_core.Dom.create('span', {
					props: {
						className: 'intranet-notification-content__description'
					},
					html: description
				})]
			});
		}
		#getButtonContainer() {
			const isReInviteNotification = this.#options.type === 7;
			const text = isReInviteNotification ? main_core.Loc.getMessage('INTRANET_INVITATION_NOTIFICATION_BALLON_BUTTON_REINVITE') : main_core.Loc.getMessage('INTRANET_INVITATION_NOTIFICATION_BALLON_BUTTON_INVITE');
			return new ui_buttons.Button({
				text,
				round: true,
				noCaps: true,
				className: 'intranet-notification-content__action',
				onclick: () => {
					this.#popup.close();
					this.#sendAnalytics('button_click');
					if (isReInviteNotification) {
						window.location.href = '/company/?INVITED=Y';
					} else {
						const link = document.createElement('a');
						link.setAttribute('onclick', this.#invitationLink);
						link.click();
					}
				}
			}).render();
		}
		show() {
			if (!this.invitationButton) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				this.#popup = this.createNotificationBalloon(onDone);
				this.#popup.show();
				this.#popup.zIndexComponent.setZIndex(400);
				this.#saveUserOption();
				this.#sendAnalytics('push_show');
				this.invitationButton.addEventListener('click', () => {
					this.#popup?.close();
				});
			});
		}
		#saveUserOption() {
			BX.userOptions.save('intranet.invitation', 'invitationNotificationTransitionBalloonTs', null, Math.floor(Date.now() / 1000));
		}
		#sendAnalytics(event) {
			const typeMap = {
				1: 'common',
				3: 'tasks',
				4: 'crm',
				5: 'automatization',
				6: 'common',
				7: 'repeat_invite'
			};
			const type = typeMap[this.#options.type] || 'unknown';
			const params = {
				event,
				type,
				tool: 'invitation',
				category: 'onboarding'
			};
			ui_analytics.sendData(params);
		}
	}

	exports.InvitationNotification = InvitationNotification;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI, BX.Main, BX.UI, BX.UI.Analytics);
//# sourceMappingURL=invitation-notification.bundle.js.map
