import { EventEmitter } from 'main.core.events';

import { EventType, type ApplicationContext } from 'im.v2.const';

import { getMentionCellColumn } from '../components/mention/helpers/helpers';

import type { MentionGridIds } from '../components/mention/helpers/helpers';

export type MentionMoveSelectionEvent = { offset: number };
export type MentionMoveColumnEvent = { offset: number };
export type MentionActiveItemEvent = { nodeId: ?string };

const MentionSymbols: Set<string> = new Set(['@', '+']);
const WAIT_FOR_NEXT_SYMBOL_TIME = 10;
const WAIT_FOR_LAST_SYMBOL_TIME = 10;

const SelectionOffsetByKey: Map<string, number> = new Map([['ArrowUp', -1], ['ArrowDown', 1]]);
const NO_SELECTION_MOVE = 0;

// the row holds up to two cells: name (0) and the optional "add to chat" action (1)
const NAME_COLUMN = 0;
const ACTION_COLUMN = 1;
const NO_COLUMN_MOVE = 0;

export const MentionDetectorEvents = Object.freeze({
	showMentionPopup: 'showMentionPopup',
	hideMentionPopup: 'hideMentionPopup',
});

// events exchanged between the field and the mention grid over the shared emitter
export const MentionListEvents = Object.freeze({
	moveSelection: 'IM:Mention:moveSelection',
	moveColumn: 'IM:Mention:moveColumn',
	activeItemChanged: 'IM:Mention:activeItemChanged',
});

export function getSelectionOffset(event: KeyboardEvent): number
{
	return SelectionOffsetByKey.get(event.key) ?? NO_SELECTION_MOVE;
}

type MentionDetectorPayload = {
	textareaElement: HTMLTextAreaElement,
	context: ApplicationContext,
	// The ids of the grid this field is wired to: they are per composer, so the detector is given the
	// same set the grid renders with instead of building ids of its own.
	gridIds: MentionGridIds,
};

export class MentionDetector extends EventEmitter
{
	#mentionPopupOpened: boolean = false;
	#mentionSymbol: string = '';
	#textarea: HTMLTextAreaElement;
	#emitter: EventEmitter;
	#gridIds: MentionGridIds;
	#pendingChecks: Set<number> = new Set();

	static eventNamespace = 'BX.Messenger.v2.Textarea.MentionDetector';

	constructor(payload: MentionDetectorPayload)
	{
		super();
		this.setEventNamespace(MentionDetector.eventNamespace);

		const { textareaElement, context: { emitter }, gridIds } = payload;
		this.#textarea = textareaElement;
		this.#emitter = emitter;
		this.#gridIds = gridIds;
	}

	onActiveMentionKeyDown(event): void
	{
		if (!this.#mentionPopupOpened)
		{
			return;
		}

		this.#onOpenedMentionKeyDown(event);
	}

	onKeyDown(event): void
	{
		this.#onClosedMentionKeyDown(event);
	}

	onMentionPopupClose(): void
	{
		this.#mentionPopupOpened = false;
	}

	refresh(): void
	{
		const textBeforeCursor = this.#getTextBeforeCursor();
		const mentionSymbolIndex = this.#getLastMentionSymbolIndex(textBeforeCursor);
		if (mentionSymbolIndex < 0)
		{
			this.#hideIfOpened();

			return;
		}

		const symbolBeforeMentionSymbol = textBeforeCursor.slice(mentionSymbolIndex - 1, mentionSymbolIndex);
		if (mentionSymbolIndex > 0 && !this.#hasWhitespace(symbolBeforeMentionSymbol))
		{
			this.#hideIfOpened();

			return;
		}

		const query = textBeforeCursor.slice(mentionSymbolIndex);
		if (!this.#isUnfinishedMention(query))
		{
			this.#hideIfOpened();

			return;
		}

		this.#mentionSymbol = textBeforeCursor.slice(mentionSymbolIndex, mentionSymbolIndex + 1);
		this.#mentionPopupOpened = true;
		this.emit(MentionDetectorEvents.showMentionPopup, {
			mentionQuery: query.slice(1),
		});
	}

	getMentionSymbol(): string
	{
		return this.#mentionSymbol;
	}

	clearMentionSymbol(): void
	{
		this.#mentionSymbol = '';
	}

	destroy(): void
	{
		this.#pendingChecks.forEach((checkId: number) => clearTimeout(checkId));
		this.#pendingChecks.clear();
	}

	#onClosedMentionKeyDown(event: KeyboardEvent)
	{
		if (!this.#isOpenMentionCombination(event))
		{
			return;
		}

		this.#scheduleCheck((): void => {
			if (!this.#checkMentionSymbol())
			{
				return;
			}

			this.#mentionPopupOpened = true;
			this.emit(MentionDetectorEvents.showMentionPopup, {
				mentionQuery: '',
			});
		}, WAIT_FOR_NEXT_SYMBOL_TIME);
	}

	#onOpenedMentionKeyDown(event: KeyboardEvent)
	{
		const selectionOffset = getSelectionOffset(event);
		if (selectionOffset !== NO_SELECTION_MOVE)
		{
			event.preventDefault();
			this.#sendMoveSelectionEvent(selectionOffset);

			return;
		}

		const columnOffset = this.#getColumnOffset(event);
		if (columnOffset !== NO_COLUMN_MOVE)
		{
			event.preventDefault();
			this.#sendMoveColumnEvent(columnOffset);

			return;
		}

		if (this.#isActivateActionCellCombination(event))
		{
			event.preventDefault();
			this.#activateActionCell();

			return;
		}

		if (this.#isInsertMentionCombination(event))
		{
			event.preventDefault();
			this.#sendInsertMentionEvent(event);

			return;
		}

		this.#scheduleCheck((): void => {
			if (!this.#isValidQuery(this.#getQuery()))
			{
				this.#sendHidePopupEvent();

				return;
			}

			this.emit(MentionDetectorEvents.showMentionPopup, {
				mentionQuery: this.#getQueryWithoutMentionSymbol(),
			});
		}, WAIT_FOR_LAST_SYMBOL_TIME);
	}

	#scheduleCheck(check: () => void, delay: number): void
	{
		const checkId = setTimeout(() => {
			this.#pendingChecks.delete(checkId);
			check();
		}, delay);

		this.#pendingChecks.add(checkId);
	}

	#checkMentionSymbol(): boolean
	{
		const cursorPosition = this.#textarea.selectionEnd;
		this.#mentionSymbol = this.#textarea.value.slice(cursorPosition - 1, cursorPosition);
		if (!MentionSymbols.has(this.#mentionSymbol))
		{
			return false;
		}

		const symbolBeforeMentionSymbol = this.#textarea.value.slice(cursorPosition - 2, cursorPosition - 1);

		return symbolBeforeMentionSymbol.length === 0 || this.#hasWhitespace(symbolBeforeMentionSymbol);
	}

	// a text taken over from another field carries no open search:
	// only a mention the caret still stands in counts as unfinished
	#isUnfinishedMention(query: string): boolean
	{
		return this.#isValidQuery(query) && !(/\s/).test(query);
	}

	#isValidQuery(query: string): boolean
	{
		if (query.length === 0)
		{
			return false;
		}

		const firstQuerySymbol = query.slice(1, 2);
		if (firstQuerySymbol.length === 0)
		{
			return true;
		}

		if (!this.#isValidFirstSymbol(firstQuerySymbol))
		{
			return false;
		}

		return !this.#hasWhitespace(firstQuerySymbol);
	}

	#isInsertMentionCombination(event: KeyboardEvent): boolean
	{
		return event.key === 'Enter';
	}

	#isOpenMentionCombination(event: KeyboardEvent): boolean
	{
		return event.key === '+' || event.key === '@';
	}

	#hideIfOpened(): void
	{
		if (!this.#mentionPopupOpened)
		{
			return;
		}

		this.#sendHidePopupEvent();
	}

	#sendHidePopupEvent()
	{
		this.#mentionPopupOpened = false;
		this.#mentionSymbol = '';

		this.emit(MentionDetectorEvents.hideMentionPopup);
	}

	#sendInsertMentionEvent(event)
	{
		event.preventDefault();
		this.#emitter.emit(EventType.mention.selectItem);
		this.#sendHidePopupEvent();
	}

	#sendMoveSelectionEvent(offset: number)
	{
		this.#emitter.emit(MentionListEvents.moveSelection, { offset });
	}

	#sendMoveColumnEvent(offset: number)
	{
		this.#emitter.emit(MentionListEvents.moveColumn, { offset });
	}

	// left/right stay with the caret while editing the query: they only reach the action cell when the name
	// cell is active, the row actually has that cell and the caret sits at the end of the query text
	#getColumnOffset(event: KeyboardEvent): number
	{
		if (event.key === 'ArrowRight')
		{
			const canReachActionCell = this.#getActiveColumn() === NAME_COLUMN
				&& this.#activeRowHasActionCell()
				&& this.#isCaretAtQueryEnd();

			return canReachActionCell ? 1 : NO_COLUMN_MOVE;
		}

		if (event.key === 'ArrowLeft')
		{
			return this.#getActiveColumn() === ACTION_COLUMN ? -1 : NO_COLUMN_MOVE;
		}

		return NO_COLUMN_MOVE;
	}

	#isActivateActionCellCombination(event: KeyboardEvent): boolean
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return false;
		}

		return this.#getActiveColumn() === ACTION_COLUMN;
	}

	#activateActionCell()
	{
		const activeNode = document.getElementById(this.#getActiveCellId());
		const button = activeNode?.matches('button') ? activeNode : activeNode?.querySelector('button');
		button?.click();
	}

	#getActiveCellId(): string
	{
		return this.#textarea.getAttribute('aria-activedescendant') ?? '';
	}

	#getActiveColumn(): number
	{
		return getMentionCellColumn(this.#getActiveCellId());
	}

	#activeRowHasActionCell(): boolean
	{
		const row = this.#gridIds.getCellRow(this.#getActiveCellId());
		if (row < 0)
		{
			return false;
		}

		return document.getElementById(this.#gridIds.getCellId(row, ACTION_COLUMN)) !== null;
	}

	#isCaretAtQueryEnd(): boolean
	{
		const { selectionStart, selectionEnd, value } = this.#textarea;
		if (selectionStart !== selectionEnd)
		{
			return false;
		}

		const nextCharacter = value.charAt(selectionEnd);

		return nextCharacter === '' || this.#hasWhitespace(nextCharacter);
	}

	#getTextBeforeCursor(): string
	{
		return this.#textarea.value.slice(0, Math.max(0, this.#textarea.selectionEnd));
	}

	#getLastMentionSymbolIndex(text: string): number
	{
		let lastIndex = -1;
		MentionSymbols.forEach((mentionSymbol: string) => {
			lastIndex = Math.max(lastIndex, text.lastIndexOf(mentionSymbol));
		});

		return lastIndex;
	}

	#getMentionSymbolIndex(): number
	{
		const textBeforeCursor = this.#getTextBeforeCursor();

		return textBeforeCursor.lastIndexOf(this.#mentionSymbol);
	}

	#getQuery(): string
	{
		const textBeforeCursor = this.#getTextBeforeCursor();
		const mentionSymbolIndex = this.#getMentionSymbolIndex();
		if (mentionSymbolIndex < 0)
		{
			return '';
		}

		return textBeforeCursor.slice(mentionSymbolIndex, this.#textarea.selectionEnd);
	}

	#getQueryWithoutMentionSymbol(): string
	{
		return this.#getQuery().slice(1);
	}

	#isValidFirstSymbol(firstQuerySymbol: string): boolean
	{
		return !(this.#hasNumber(firstQuerySymbol)
			|| this.#hasWhitespace(firstQuerySymbol)
			|| this.#hasSpecialSymbol(firstQuerySymbol));
	}

	#hasWhitespace(text: string): boolean
	{
		return (/^\s/).test(text);
	}

	#hasNumber(text: string): boolean
	{
		return (/\d$/).test(text);
	}

	#hasSpecialSymbol(text: string): boolean
	{
		const regex = /[!"#$%&'()*+,./<>@\\^_|-]/;

		return regex.test(text);
	}
}
