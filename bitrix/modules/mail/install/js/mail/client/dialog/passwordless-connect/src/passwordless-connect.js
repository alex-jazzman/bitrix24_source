import { ajax, Dom, Tag, Loc, Browser } from 'main.core';
import { AirButtonStyle } from 'ui.buttons';
import { Input } from 'ui.system.input';
import { Confetti } from 'ui.confetti';
import { ActionPosition, ContentPosition, BaseDialog } from 'mail.client.dialog.base-dialog';
import './style.css';

export class PasswordlessConnect extends BaseDialog
{
	#input: ?Input = null;
	#mailboxId: number;
	#email: string;
	#sending: boolean = false;
	#messageListUrl: string = '';
	#newMailboxId: ?number = null;

	constructor(mailboxId: number, email: string, options: Object = {})
	{
		super({
			id: 'mail-passwordless-connect',
			title: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_POPUP_TITLE'),
			width: 430,
		});

		this.#mailboxId = mailboxId;
		this.#email = email;
		this.#messageListUrl = options.messageListUrl ?? '';
	}

	show(): void
	{
		super.show();
		this.#renderForm();
	}

	#renderForm(): void
	{
		this.#input = new Input({
			placeholder: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_PASSWORD_PLACEHOLDER'),
			type: 'password',
			stretched: true,
			onInput: () => this.#onPasswordInput(),
		});

		const descriptionText = Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DESCRIPTION');
		const parts = descriptionText.split('#EMAIL#');

		this.setContent(Tag.render`
			<div class="mail__client_dialog_passwordless-connect_form">
				<div class="mail__client_dialog_base-dialog_content-description">
					${parts[0]}<span class="mail__client_dialog_passwordless-connect_email-link">${this.#email}</span>${parts[1] ?? ''}
				</div>
				${this.#input.render()}
			</div>
		`);

		this.setActions({
			position: ActionPosition.left,
			actions: [
				{
					id: 'submit',
					text: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_SUBMIT'),
					style: AirButtonStyle.FILLED,
					onclick: () => this.#submit(),
				},
				{
					id: 'decline',
					text: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DECLINE'),
					style: AirButtonStyle.OUTLINE,
					onclick: () => this.#decline(),
				},
				{
					text: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_CANCEL'),
					style: AirButtonStyle.PLAIN_NO_ACCENT,
					onclick: () => this.close(),
				},
			],
		});

		this.getButton('submit')?.setDisabled(true);
	}

	#onPasswordInput(): void
	{
		const password = this.#input?.getValue() ?? '';
		this.getButton('submit')?.setDisabled(password.trim().length === 0);
	}

	#showSuccess(): void
	{
		this.setContentAlign(ContentPosition.center);
		this.setBodyPadding('24px 0 10px 0');
		this.setTitle('');

		this.setContent(Tag.render`
			<div class="mail__client_dialog_passwordless-connect_success">
				<img
					class="mail__client_dialog_passwordless-connect_success-icon"
					src="/bitrix/js/mail/client/dialog/passwordless-connect/images/success.webp"
					alt=""
				/>
				<div class="mail__client_dialog_passwordless-connect_success-title">
					${Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_SUCCESS_TITLE')}
				</div>
			</div>
		`);

		this.setActions({
			position: ActionPosition.center,
			actions: [
				{
					text: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_CLOSE'),
					style: AirButtonStyle.OUTLINE_NO_ACCENT,
					onclick: () => this.#onSuccessClose(),
				},
			],
		});

		this.#fireConfetti();
	}

	#fireConfetti(): void
	{
		if (Browser.isFirefox())
		{
			const canvas = document.createElement('canvas');
			Dom.style(canvas, {
				position: 'fixed',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				'pointer-events': 'none',
				'z-index': '111111',
			});
			Dom.append(canvas, document.body);

			const confetti = Confetti.create(canvas, { resize: true, useWorker: true });
			confetti({
				particleCount: 250,
				spread: 100,
				origin: { y: 0.65 },
			})
				.then(() => Dom.remove(canvas))
				.catch(() => Dom.remove(canvas))
			;

			return;
		}

		Confetti.fire({
			particleCount: 250,
			spread: 100,
			origin: { y: 0.65 },
			zIndex: 111_111,
		});
	}

	#onSuccessClose(): void
	{
		this.close();

		if (!this.#newMailboxId || !this.#messageListUrl)
		{
			document.location.reload();

			return;
		}

		const url = this.#messageListUrl
			.replace('#id#', this.#newMailboxId)
			.replace('#start_sync_with_showing_stepper#', 'true')
		;

		window.location.href = BX.util.add_url_param(url, { open_settings: 'Y' });
	}

	#submit(): void
	{
		if (this.#sending)
		{
			return;
		}

		const password = this.#input?.getValue()?.trim() ?? '';
		if (password.length === 0)
		{
			this.#input?.setError(
				Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_ERROR_EMPTY_PASSWORD'),
			);

			return;
		}

		this.#sending = true;
		const submitButton = this.getButton('submit');
		submitButton?.setWaiting(true);

		ajax.runAction('mail.mailboxconnecting.completePasswordlessRequest', {
			data: {
				mailboxId: this.#mailboxId,
				password,
			},
		})
			.then((response) => {
				this.#sending = false;
				submitButton?.setWaiting(false);
				this.#newMailboxId = response.data?.mailboxId ?? null;
				this.#showSuccess();
			})
			.catch((response) => {
				this.#sending = false;
				submitButton?.setWaiting(false);

				const errorMessage = response?.errors?.[0]?.message
					?? Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_ERROR_GENERIC')
				;

				this.#input?.setError(errorMessage);
			})
		;
	}

	#decline(): void
	{
		if (this.#sending)
		{
			return;
		}

		this.#sending = true;
		const declineButton = this.getButton('decline');
		declineButton?.setWaiting(true);

		ajax.runAction('mail.mailboxconnecting.cancelPasswordlessRequest', {
			data: { mailboxId: this.#mailboxId },
		})
			.then(() => {
				this.#sending = false;
				declineButton?.setWaiting(false);
				this.close();

				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('MAIL_PASSWORDLESS_CONNECT_DECLINE_SUCCESS'),
					position: 'top-right',
					autoHideDelay: 3000,
				});
			})
			.catch(() => {
				this.#sending = false;
				declineButton?.setWaiting(false);
			})
		;
	}

	static checkAndShow(options: Object = {}): void
	{
		ajax.runAction('mail.mailboxconnecting.getPendingPasswordlessRequest')
			.then((response) => {
				if (response.data?.mailboxId)
				{
					const popup = new PasswordlessConnect(
						response.data.mailboxId,
						response.data.email,
						options,
					);
					popup.show();
				}
			})
			.catch(() => {})
		;
	}
}
