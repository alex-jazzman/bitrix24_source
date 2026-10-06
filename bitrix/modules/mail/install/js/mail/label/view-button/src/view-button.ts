import { Dom, Event, Loc, Runtime } from 'main.core';

import { type AssignMenuChange } from 'mail.label.assign-menu';

const BUTTON_SELECTOR = '[data-role="mail-label-assign"]';

type LiveAnnouncer = { announce: (message: string, mode: string) => void };

export class ViewLabelButton
{
	static #bound: boolean = false;
	static #isOpening: boolean = false;

	static init(): void
	{
		if (this.#bound)
		{
			return;
		}

		this.#bound = true;
		Event.bind(document.body, 'click', this.#handleClick);
	}

	static #handleClick = (event: MouseEvent): void => {
		const target = event.target;
		if (!(target instanceof Element))
		{
			return;
		}

		const button = target.closest(BUTTON_SELECTOR);
		if (!(button instanceof HTMLElement))
		{
			return;
		}

		const uidKey = button.dataset.uidKey;
		if (!uidKey)
		{
			return;
		}

		if (this.#isOpening)
		{
			return;
		}

		this.#isOpening = true;

		void Runtime.loadExtension('mail.label.assign-menu')
			.then((exports: any): Promise<void> => exports.AssignMenu.show({
				bindElement: button,
				messageIds: [uidKey],
				currentLabelIds: this.#parseLabelIds(button.dataset.labelIds),
				mailboxId: this.#parseMailboxId(uidKey),
				onChange: (change: AssignMenuChange): void => this.#updateButtonState(button, change),
				onShow: (): void => Dom.attr(button, 'aria-expanded', 'true'),
				onClose: (): void => Dom.attr(button, 'aria-expanded', 'false'),
			}))
			.catch((): void => this.#notifyError())
			.finally((): void => {
				this.#isOpening = false;
			});
	};

	// Both extensions are loaded lazily: they are needed only on this failure path.
	static #notifyError(): void
	{
		const message = Loc.getMessage('MAIL_LABEL_VIEW_BUTTON_ERROR') ?? '';

		void Runtime.loadExtension('ui.notification', 'ui.a11y')
			.then((exports: Record<string, any>): void => {
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right',
					autoHideDelay: 3000,
				});

				const announcer: LiveAnnouncer | void = exports.LiveAnnouncer;
				announcer?.announce(message, 'assertive');
			})
			.catch((): void => {});
	}

	static #parseMailboxId(uidKey: string): number | null
	{
		const mailboxId = Number(uidKey.split('-').pop());

		return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : null;
	}

	static #parseLabelIds(raw: string | void): number[]
	{
		if (!raw)
		{
			return [];
		}

		try
		{
			const parsed = JSON.parse(raw);

			return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : [];
		}
		catch
		{
			return [];
		}
	}

	static #updateButtonState(button: HTMLElement, change: AssignMenuChange): void
	{
		const ids = new Set(this.#parseLabelIds(button.dataset.labelIds));
		if (change.assigned)
		{
			ids.add(change.labelId);
		}
		else
		{
			ids.delete(change.labelId);
		}

		Dom.attr(button, 'data-label-ids', JSON.stringify([...ids]));
	}
}
