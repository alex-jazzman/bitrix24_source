import { Dom, Event as CoreEvent, Text } from 'main.core';
import { PopupManager } from 'main.popup';
import { Select } from 'ui.select';

import { type MailboxOption } from '../../types';

export const MailboxInputId = 'mail-vacation-auto-reply-mailbox-input';
export const MailboxMenuId = 'mail-vacation-auto-reply-mailbox-menu';
export const MailboxOptionTestIdPrefix = 'mail-vacation-auto-reply-mailbox-option';

type SelectOption = {
	label: string,
	value: string,
};

type SelectUpdateEvent = {
	getData(): string,
};

export type MailboxSelectAdapterOptions = {
	container: HTMLElement,
	mailboxes: MailboxOption[],
	selectedId: number,
	placeholder: string,
	onSelect: (mailboxId: number) => void,
};

export class MailboxSelectAdapter
{
	#container: HTMLElement;
	#select: Select | null = null;
	#onSelect: (mailboxId: number) => void;
	#isApplyingValue: boolean = false;
	#optionIds: string[] = [];
	#menuObserver: MutationObserver | null = null;
	#menuContainer: HTMLElement | null = null;
	#suppressInputOpen: boolean = false;
	#restoreInputFocusAfterClose: boolean = true;
	#suppressInputOpenTimer: number | null = null;
	#inputOpenTimer: number | null = null;

	constructor(options: MailboxSelectAdapterOptions)
	{
		this.#container = options.container;
		this.#onSelect = options.onSelect;
		const selectOptions = this.#buildOptions(options.mailboxes);
		this.#optionIds = selectOptions.map((option: SelectOption): string => option.value);

		this.#select = new Select({
			options: selectOptions,
			value: String(options.selectedId),
			placeholder: options.placeholder,
			popupParams: {
				id: MailboxMenuId,
				focusTrap: true,
				events: {
					onShow: (): void => {
						this.#handleMenuShow();
					},
					onClose: (): void => {
						this.#handleMenuClose();
					},
					onAfterClose: (): void => {
						this.#handleMenuAfterClose();
					},
					onDestroy: (): void => {
						this.#disconnectMenuObserver();
					},
				},
			},
		} as unknown as ConstructorParameters<typeof Select>[0]);

		this.#select.renderTo(this.#container);
		const input = this.#select.getInput();
		Dom.attr(input, {
			id: MailboxInputId,
			role: 'combobox',
			'aria-haspopup': 'menu',
			'aria-expanded': 'false',
			autocomplete: 'off',
		});
		if (input !== null)
		{
			CoreEvent.bind(input, 'blur', this.#handleInputBlur, true);
			CoreEvent.bind(input, 'focus', this.#handleInputFocus, true);
			CoreEvent.bind(input, 'mouseup', this.#handleInputMouseUp, true);
			CoreEvent.bind(input, 'keydown', this.#handleInputKeyDown, true);
		}
		this.#select.subscribe('update', (event: SelectUpdateEvent): void => {
			this.#handleSelect(event);
		});
	}

	setSelectedId(mailboxId: number): void
	{
		if (this.#select === null || this.#select.getValue() === String(mailboxId))
		{
			return;
		}

		this.#isApplyingValue = true;
		this.#select.setValue(String(mailboxId));
		this.#isApplyingValue = false;
	}

	destroy(): void
	{
		const input = this.#select?.getInput();
		if (input !== null && input !== undefined)
		{
			CoreEvent.unbind(input, 'blur', this.#handleInputBlur, true);
			CoreEvent.unbind(input, 'focus', this.#handleInputFocus, true);
			CoreEvent.unbind(input, 'mouseup', this.#handleInputMouseUp, true);
			CoreEvent.unbind(input, 'keydown', this.#handleInputKeyDown, true);
		}
		this.#clearInputOpenTimer();
		this.#clearSuppressInputOpenTimer();
		this.#disconnectMenuObserver();
		this.#select = null;
		PopupManager.getPopupById(MailboxMenuId)?.destroy();
		Dom.clean(this.#container);
	}

	#handleMenuShow(): void
	{
		const popup = PopupManager.getPopupById(MailboxMenuId);
		const menuContainer = popup?.getContentContainer();
		const popupContainer = popup?.getPopupContainer();
		const input = this.#select?.getInput();
		if (!menuContainer || !popupContainer || input === null || input === undefined)
		{
			return;
		}

		Dom.attr(input, {
			'aria-controls': popupContainer.id,
			'aria-expanded': 'true',
		});
		this.#restoreInputFocusAfterClose = true;

		this.#disconnectMenuObserver();
		this.#menuContainer = menuContainer;
		CoreEvent.bind(menuContainer, 'click', this.#handleMenuClick);
		this.#menuObserver = new MutationObserver(() => {
			this.#applyOptionTestIds(menuContainer);
		});
		this.#menuObserver.observe(menuContainer, { childList: true, subtree: true });
		this.#applyOptionTestIds(menuContainer);
	}

	#handleMenuClose(): void
	{
		this.#clearInputOpenTimer();
		this.#disconnectMenuObserver();
		const input = this.#select?.getInput();
		if (input === null || input === undefined)
		{
			return;
		}

		Dom.attr(input, 'aria-expanded', 'false');
		this.#suppressOpeningOnFocus();
	}

	#handleMenuAfterClose(): void
	{
		const input = this.#select?.getInput();
		if (input === null || input === undefined)
		{
			return;
		}

		Dom.attr(input, 'aria-expanded', 'false');
		this.#suppressOpeningOnFocus();
		if (!this.#restoreInputFocusAfterClose)
		{
			return;
		}

		input.focus({ preventScroll: true });
	}

	#suppressOpeningOnFocus(): void
	{
		this.#suppressInputOpen = true;
		this.#clearSuppressInputOpenTimer();
		this.#suppressInputOpenTimer = window.setTimeout((): void => {
			this.#suppressInputOpen = false;
			this.#suppressInputOpenTimer = null;
		}, 150);
	}

	#handleInputBlur = (event: FocusEvent): void => {
		const popupContainer = PopupManager.getPopupById(MailboxMenuId)?.getPopupContainer();
		if (popupContainer?.contains(event.relatedTarget as Node | null))
		{
			event.stopImmediatePropagation();

			return;
		}

		this.#restoreInputFocusAfterClose = false;
		this.#clearInputOpenTimer();
	};

	#handleInputFocus = (event: FocusEvent): void => {
		event.stopImmediatePropagation();
		if (this.#suppressInputOpen)
		{
			return;
		}

		this.#scheduleInputOpen();
	};

	#handleInputMouseUp = (event: MouseEvent): void => {
		event.stopImmediatePropagation();
		if (event.currentTarget === document.activeElement)
		{
			this.#scheduleInputOpen();
		}
	};

	#handleInputKeyDown = (event: KeyboardEvent): void => {
		if (
			this.#select === null
			|| this.#select.isMenuShown()
			|| (event.key !== 'Enter' && event.key !== 'ArrowDown')
		)
		{
			return;
		}

		this.#clearInputOpenTimer();
		event.preventDefault();
		event.stopImmediatePropagation();
		this.#select.showMenu();
	};

	#handleMenuClick = (event: MouseEvent): void => {
		const target = event.target;
		if (target instanceof Element && target.closest('[role="menuitem"]') !== null)
		{
			this.#select?.hideMenu();
		}
	};

	#scheduleInputOpen(): void
	{
		this.#clearInputOpenTimer();
		this.#inputOpenTimer = window.setTimeout((): void => {
			this.#inputOpenTimer = null;
			this.#select?.showMenu();
		}, 100);
	}

	#applyOptionTestIds(menuContainer: HTMLElement): void
	{
		menuContainer.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach(
			(optionElement: HTMLElement, index: number): void => {
				const optionId = this.#optionIds[index];
				if (optionId)
				{
					Dom.attr(optionElement, 'data-testid', `${MailboxOptionTestIdPrefix}-${optionId}`);
				}
			},
		);
	}

	#disconnectMenuObserver(): void
	{
		this.#menuObserver?.disconnect();
		this.#menuObserver = null;
		if (this.#menuContainer !== null)
		{
			CoreEvent.unbind(this.#menuContainer, 'click', this.#handleMenuClick);
			this.#menuContainer = null;
		}
	}

	#clearSuppressInputOpenTimer(): void
	{
		if (this.#suppressInputOpenTimer !== null)
		{
			window.clearTimeout(this.#suppressInputOpenTimer);
			this.#suppressInputOpenTimer = null;
		}
	}

	#clearInputOpenTimer(): void
	{
		if (this.#inputOpenTimer !== null)
		{
			window.clearTimeout(this.#inputOpenTimer);
			this.#inputOpenTimer = null;
		}
	}

	#handleSelect(event: SelectUpdateEvent): void
	{
		if (this.#isApplyingValue)
		{
			return;
		}

		this.#onSelect(Text.toInteger(event.getData()));
	}

	#buildOptions(mailboxes: MailboxOption[]): SelectOption[]
	{
		return mailboxes
			.filter((mailbox: MailboxOption): boolean => mailbox.id > 0)
			.map((mailbox: MailboxOption): SelectOption => ({
				label: mailbox.email,
				value: String(mailbox.id),
			}))
		;
	}
}
