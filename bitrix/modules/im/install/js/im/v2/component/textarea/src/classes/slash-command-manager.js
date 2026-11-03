import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';

import { MentionListEvents, getSelectionOffset } from './mention-detector';

import type { ApplicationContext } from 'im.v2.const';

type TextareaLike = { value: string, selectionEnd: number };

const SLASH_SYMBOL = '/';
const WAIT_FOR_NEXT_SYMBOL_TIME = 10;
const WAIT_FOR_LAST_SYMBOL_TIME = 10;

export const SlashCommandManagerEvents = Object.freeze({
	showSlashCommandPopup: 'showSlashCommandPopup',
	hideSlashCommandPopup: 'hideSlashCommandPopup',
});

// region pure detectors

export function getCurrentLineText(textarea: TextareaLike): string
{
	const before = textarea.value.slice(0, Math.max(0, textarea.selectionEnd));

	return before.slice(before.lastIndexOf('\n') + 1);
}

export function getLineBeforeSlash(textarea: TextareaLike): string | null
{
	const line = getCurrentLineText(textarea);
	const slashIndex = line.indexOf(SLASH_SYMBOL);

	return slashIndex < 0 ? null : line.slice(0, slashIndex);
}

export function getSlashQuery(textarea: TextareaLike): string
{
	const line = getCurrentLineText(textarea);

	return line.slice(line.indexOf(SLASH_SYMBOL) + 1);
}

export function checkSlashTrigger(textarea: TextareaLike): boolean
{
	const line = getCurrentLineText(textarea);

	// "/" triggers only when it is the very first character of the line, never after leading
	// whitespace or a bot mention: the server executes commands only at the line start (^\/), so any
	// preceding character (even a space) would keep the command from running.
	return line === SLASH_SYMBOL;
}

export function isSlashLineStillOpen(textarea: TextareaLike): boolean
{
	const before = getLineBeforeSlash(textarea);

	return before === '';
}

// endregion pure detectors

export class SlashCommandManager extends EventEmitter
{
	#slashCommandPopupOpened: boolean = false;
	#textarea: HTMLTextAreaElement;
	#emitter: EventEmitter;
	#getHasItems: () => boolean;

	static eventNamespace = 'BX.Messenger.v2.Textarea.SlashCommandManager';

	constructor(payload: {
		textareaElement: HTMLTextAreaElement,
		context: ApplicationContext,
		getHasItems: () => boolean,
	})
	{
		super();
		this.setEventNamespace(SlashCommandManager.eventNamespace);

		const { textareaElement, context: { emitter }, getHasItems } = payload;
		this.#textarea = textareaElement;
		this.#emitter = emitter;
		this.#getHasItems = getHasItems;
	}

	// region 'popup'

	// returns whether the key was consumed by the popup; when it wasn't, the caller lets the textarea handle it
	onActiveSlashCommandKeyDown(event: KeyboardEvent): boolean
	{
		if (!this.#slashCommandPopupOpened)
		{
			return false;
		}

		return this.#onOpenedSlashCommandKeyDown(event);
	}

	onKeyDown(event: KeyboardEvent): void
	{
		this.#onClosedSlashCommandKeyDown(event);
	}

	onSlashCommandPopupClose(): void
	{
		this.#slashCommandPopupOpened = false;
	}

	openSlashCommandPopup(): void
	{
		this.#slashCommandPopupOpened = true;
		this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
	}

	#onClosedSlashCommandKeyDown(event: KeyboardEvent): void
	{
		if (event.key !== SLASH_SYMBOL)
		{
			return;
		}

		setTimeout((): void => {
			if (!checkSlashTrigger(this.#textarea))
			{
				return;
			}

			this.#slashCommandPopupOpened = true;
			this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
		}, WAIT_FOR_NEXT_SYMBOL_TIME);
	}

	#onOpenedSlashCommandKeyDown(event: KeyboardEvent): boolean
	{
		// with no selectable items there is nothing to navigate or insert:
		// let the event reach the textarea (message send, caret movement)
		const hasItems = this.#hasItems();

		if (hasItems && this.#isNavigateCombination(event))
		{
			event.preventDefault();
			// the popup reuses MentionItemsContainer, which walks its items on the shared move event
			this.#emitter.emit(MentionListEvents.moveSelection, { offset: getSelectionOffset(event) });

			return true;
		}

		if (hasItems && this.#isInsertCombination(event))
		{
			event.preventDefault();
			this.#sendInsertSlashCommandEvent();

			return true;
		}

		setTimeout((): void => {
			// the popup may have been closed (Esc / click-outside) between the keydown and this deferred
			// check while the slash line is still present - do not reopen it against the popup's own close
			if (!this.#slashCommandPopupOpened)
			{
				return;
			}

			if (!isSlashLineStillOpen(this.#textarea))
			{
				this.#sendHideSlashCommandPopupEvent();

				return;
			}

			this.emit(SlashCommandManagerEvents.showSlashCommandPopup, this.#getPopupPayload());
		}, WAIT_FOR_LAST_SYMBOL_TIME);

		return !this.#isNavigateCombination(event) && !this.#isInsertCombination(event);
	}

	#hasItems(): boolean
	{
		return this.#getHasItems() === true;
	}

	#sendInsertSlashCommandEvent(): void
	{
		this.#emitter.emit(EventType.textarea.selectSlashCommand);
		this.#sendHideSlashCommandPopupEvent();
	}

	#sendHideSlashCommandPopupEvent(): void
	{
		this.#slashCommandPopupOpened = false;
		this.emit(SlashCommandManagerEvents.hideSlashCommandPopup);
	}

	#getPopupPayload(): { query: string }
	{
		return {
			query: getSlashQuery(this.#textarea),
		};
	}

	#isNavigateCombination(event: KeyboardEvent): boolean
	{
		return event.key === 'ArrowUp' || event.key === 'ArrowDown';
	}

	#isInsertCombination(event: KeyboardEvent): boolean
	{
		return event.key === 'Enter';
	}
	// endregion 'popup'
}
