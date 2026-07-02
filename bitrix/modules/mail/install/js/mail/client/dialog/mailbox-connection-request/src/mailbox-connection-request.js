import { ajax, Tag, Loc } from 'main.core';
import { AirButtonStyle } from 'ui.buttons';
import { Input } from 'ui.system.input';
import { ActionPosition, ContentPosition, BaseDialog } from 'mail.client.dialog.base-dialog';
import './style.css';

type CreateRequestResponse = {
	data: {
		isRepeat: boolean,
		requestId: number,
	},
};

export class MailboxConnectionRequest extends BaseDialog
{
	#input: ?Input = null;
	#sending: boolean = false;

	constructor()
	{
		super({
			id: 'mail-mailbox-connection-request',
			title: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_POPUP_TITLE'),
			width: 430,
		});
	}

	show(): void
	{
		super.show();
		this.#renderForm();
	}

	#renderForm(): void
	{
		this.#input = new Input({
			placeholder: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_COMMENT_PLACEHOLDER'),
			stretched: true,
			dataTestId: 'mail-mailbox-connection-request-comment',
		});

		this.setContent(Tag.render`
			<div class="mail__client_dialog_mailbox-connection-request_form">
				<div class="mail__client_dialog_base-dialog_content-description">
					${Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_DESCRIPTION')}
				</div>
				${this.#input.render()}
			</div>
		`);

		this.setActions({
			position: ActionPosition.left,
			actions: [
				{
					id: 'submit',
					text: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUBMIT'),
					style: AirButtonStyle.FILLED,
					onclick: () => this.#submit(),
				},
				{
					text: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL'),
					style: AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => this.close(),
				},
			],
		});
	}

	#showSuccess(): void
	{
		this.setContentAlign(ContentPosition.center);
		this.setBodyPadding('24px 0 10px 0');
		this.setTitle('');
		this.setWidth(430);
		this.hideCloseIcon();

		this.setContent(Tag.render`
			<div class="mail__client_dialog_mailbox-connection-request_success">
				<video
					class="mail__client_dialog_mailbox-connection-request_success-video"
					src="/bitrix/js/mail/client/dialog/mailbox-connection-request/images/success.mp4"
					autoplay
					muted
					playsinline
				></video>
				<div class="mail__client_dialog_mailbox-connection-request_success-title">
					${Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE')}
				</div>
			</div>
		`);

		this.setActions({
			position: ActionPosition.center,
			actions: [
				{
					text: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CLOSE'),
					style: AirButtonStyle.OUTLINE_NO_ACCENT,
					onclick: () => this.close(),
				},
			],
		});
	}

	#showRepeat(): void
	{
		this.setContentAlign(ContentPosition.center);
		this.setBodyPadding('52px 0 18px 0');
		this.setTitle('');
		this.setWidth(430);

		this.setContent(Tag.render`
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
						${Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_SUCCESS_TITLE')}
					</div>
					<div class="mail__client_dialog_mailbox-connection-request_repeat-description">
						${Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ALREADY_SENT')}
					</div>
				</div>
			</div>
		`);

		this.setActions({
			position: ActionPosition.center,
			actions: [
				{
					id: 'cancel-request',
					text: Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_CANCEL_REQUEST'),
					style: AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => this.#cancelRequest(),
				},
			],
		});
	}

	#cancelRequest(): void
	{
		const cancelButton = this.getButton('cancel-request');
		cancelButton?.setWaiting(true);

		ajax.runAction('mail.api.mailboxconnectionrequest.cancelOwnRequest')
			.then(() => {
				cancelButton?.setWaiting(false);
				this.close();
			})
			.catch(() => {
				cancelButton?.setWaiting(false);
			})
		;
	}

	static #showLimitSlider(): void
	{
		const promoter = BX.UI?.FeaturePromotersRegistry?.getPromoter({
			code: 'limit_contact_center_mail_box_number',
		});

		promoter?.show();
	}

	#submit(): void
	{
		if (this.#sending)
		{
			return;
		}

		this.#sending = true;
		const submitButton = this.getButton('submit');
		submitButton?.setWaiting(true);

		const comment = this.#input?.getValue()?.trim() ?? '';

		ajax.runAction('mail.api.mailboxconnectionrequest.createRequest', {
			data: { comment },
		})
			.then((response: CreateRequestResponse) => {
				this.#sending = false;
				submitButton?.setWaiting(false);
				if (response.data.isRepeat)
				{
					this.#showRepeat();
				}
				else
				{
					this.#showSuccess();
				}
			})
			.catch((response) => {
				this.#sending = false;
				submitButton?.setWaiting(false);

				const errorCode = response?.errors?.[0]?.code ?? '';
				if (errorCode === 'MAIL_CONNECTION_REQUEST_LIMIT_EXCEEDED')
				{
					this.close();
					MailboxConnectionRequest.#showLimitSlider();

					return;
				}

				const errorMessage = response?.errors?.[0]?.message
					?? Loc.getMessage('MAIL_MAILBOX_CONNECTION_REQUEST_ERROR')
				;

				this.#input?.setError(errorMessage);
			})
		;
	}
}
