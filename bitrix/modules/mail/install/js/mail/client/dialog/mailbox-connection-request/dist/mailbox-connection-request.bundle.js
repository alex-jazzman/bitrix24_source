/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, main_core, ui_buttons, ui_system_input, ui_infoHelper, mail_client_dialog_baseDialog) {
	'use strict';

	class MailboxConnectionRequest extends mail_client_dialog_baseDialog.BaseDialog {
		#input = null;
		#sending = false;
		constructor() {
			super({
				id: 'mail-mailbox-connection-request',
				title: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_POPUP_TITLE') ?? '',
				width: 430
			});
		}
		async show() {
			super.show();
			let isRepeat = false;
			try {
				const response = await this.doBeforeShowContent({
					showLoader: true,
					action: () => main_core.ajax.runAction('mail.api.mailboxconnectionrequest.getOwnRequestStatus')
				});
				isRepeat = response?.data?.isRepeat ?? false;
			} catch {
			}
			if (!this.getPopup()) {
				return;
			}
			if (isRepeat) {
				this.#showRepeat();
			} else {
				this.#renderForm();
			}
		}
		#renderForm() {
			this.#input = new ui_system_input.Input({
				placeholder: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_COMMENT_PLACEHOLDER') ?? '',
				stretched: true,
				dataTestId: 'mail-mailbox-connection-request-comment'
			});
			this.setContent(main_core.Tag.render`
			<div class="mail__client_dialog_mailbox-connection-request_form">
				<div class="mail__client_dialog_base-dialog_content-description">
					${main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_DESCRIPTION')}
				</div>
				${this.#input.render()}
			</div>
		`);
			this.setActions({
				position: mail_client_dialog_baseDialog.ActionPosition.left,
				actions: [{
					id: 'submit',
					text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUBMIT') ?? '',
					style: ui_buttons.AirButtonStyle.FILLED,
					onclick: () => this.#submit()
				}, {
					text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL') ?? '',
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => this.close()
				}]
			});
		}
		#showSuccess() {
			this.setContentAlign(mail_client_dialog_baseDialog.ContentPosition.center);
			this.setBodyPadding('24px 0 10px 0');
			this.setTitle('');
			this.setWidth(430);
			this.hideCloseIcon();
			this.setContent(main_core.Tag.render`
			<div class="mail__client_dialog_mailbox-connection-request_success">
				<video
					class="mail__client_dialog_mailbox-connection-request_success-video"
					src="/bitrix/js/mail/client/dialog/mailbox-connection-request/images/success.mp4"
					autoplay
					muted
					playsinline
				></video>
				<div class="mail__client_dialog_mailbox-connection-request_success-title">
					${main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE')}
				</div>
			</div>
		`);
			this.setActions({
				position: mail_client_dialog_baseDialog.ActionPosition.center,
				actions: [{
					text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CLOSE') ?? '',
					style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
					onclick: () => this.close()
				}]
			});
		}
		#showRepeat() {
			this.setContentAlign(mail_client_dialog_baseDialog.ContentPosition.center);
			this.setBodyPadding('52px 0 18px 0');
			this.setTitle('');
			this.setWidth(430);
			this.setContent(main_core.Tag.render`
			<div class="mail__client_dialog_mailbox-connection-request_repeat">
				<video
					class="mail__client_dialog_mailbox-connection-request_repeat-video"
					src="/bitrix/js/mail/client/dialog/mailbox-connection-request/images/success.mp4"
					autoplay
					muted
					playsinline
				></video>
				<div class="mail__client_dialog_mailbox-connection-request_repeat-text">
					<div class="mail__client_dialog_mailbox-connection-request_repeat-title">
						${main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE')}
					</div>
					<div class="mail__client_dialog_mailbox-connection-request_repeat-description">
						${main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ALREADY_SENT')}
					</div>
				</div>
			</div>
		`);
			this.setActions({
				position: mail_client_dialog_baseDialog.ActionPosition.center,
				actions: [{
					id: 'cancel-request',
					text: main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL_REQUEST') ?? '',
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => this.#cancelRequest()
				}]
			});
		}
		#cancelRequest() {
			const cancelButton = this.getButton('cancel-request');
			cancelButton?.setWaiting(true);
			main_core.ajax.runAction('mail.api.mailboxconnectionrequest.cancelOwnRequest').then(() => {
				cancelButton?.setWaiting(false);
				this.close();
			}).catch(() => {
				cancelButton?.setWaiting(false);
			});
		}
		static #showLimitSlider() {
			const promoter = ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: 'limit_contact_center_mail_box_number'
			});
			promoter?.show();
		}
		#submit() {
			if (this.#sending) {
				return;
			}
			this.#sending = true;
			const submitButton = this.getButton('submit');
			submitButton?.setWaiting(true);
			const comment = this.#input?.getValue()?.trim() ?? '';
			main_core.ajax.runAction('mail.api.mailboxconnectionrequest.createRequest', {
				data: {
					comment
				}
			}).then(response => {
				this.#sending = false;
				submitButton?.setWaiting(false);
				if (response.data.isRepeat) {
					this.#showRepeat();
				} else {
					this.#showSuccess();
				}
			}).catch(response => {
				this.#sending = false;
				submitButton?.setWaiting(false);
				const errorCode = response?.errors?.[0]?.code ?? '';
				if (errorCode === 'MAIL_CONNECTION_REQUEST_LIMIT_EXCEEDED') {
					this.close();
					MailboxConnectionRequest.#showLimitSlider();
					return;
				}
				const errorMessage = response?.errors?.[0]?.message ?? main_core.Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ERROR') ?? '';
				this.#input?.setError(errorMessage);
			});
		}
	}

	exports.MailboxConnectionRequest = MailboxConnectionRequest;

})(this.BX.Mail.Client.Dialog = this.BX.Mail.Client.Dialog || {}, BX, BX.UI, BX.UI.System.Input, BX.UI, BX.Mail.Client.Dialog);
//# sourceMappingURL=mailbox-connection-request.bundle.js.map
