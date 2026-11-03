import { Dom, Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import type { CheckListModel } from 'tasks.v2.model.check-list';

import { MentionMatcher } from './mention-matcher';
import { CheckListParticipantService } from '../check-list-participant-service';

type MentionManagerParams = {
	taskId: number | string,
	itemId: number | string,
	onDialogStateChange?: Function,
};

type HandleInputParams = {
	item: CheckListModel,
	isEntered: boolean,
	cursorPosition: number,
	targetNode: HTMLElement,
	visibleText?: string,
	captureVisibleRange?: Function,
	removeVisibleRange?: Function,
	setAria?: Function,
};

type MentionMatch = {
	text: string,
	startPosition: number,
	range: ?Object,
};

export class MentionManager
{
	#itemId: number | string;
	#participantService: CheckListParticipantService;
	#currentItem: ?CheckListModel;
	#currentMention: ?MentionMatch;
	#hostContainer: ?HTMLElement;
	#dialogExpanded: boolean = false;
	#removeVisibleRange: ?Function;
	#setAria: ?Function;
	#onDialogStateChange: Function;

	constructor(params: MentionManagerParams)
	{
		this.#itemId = params.itemId;
		this.#participantService = new CheckListParticipantService(params.taskId);
		this.#onDialogStateChange = Type.isFunction(params.onDialogStateChange)
			? params.onDialogStateChange
			: () => {}
		;
	}

	attachHost(container: ?HTMLElement): void
	{
		if (!container)
		{
			return;
		}

		this.#hostContainer = container;
		this.#syncComboboxState();
	}

	async handleInput(params: HandleInputParams): Promise<void>
	{
		if (String(this.#itemId) !== String(params.item.id))
		{
			return;
		}

		this.#currentItem = params.item;
		this.#removeVisibleRange = params.removeVisibleRange;
		this.#setAria = params.setAria;
		if (params.targetNode)
		{
			this.#hostContainer = params.targetNode;
		}
		this.#syncComboboxState();

		const mention = this.#extractMention(params);
		if (!mention)
		{
			this.#closeParticipantDialog();

			return;
		}

		this.#currentMention = mention;
		if (this.#participantService.isDialogOpen())
		{
			this.#updateParticipantSearch(mention);
		}
		else if (params.isEntered)
		{
			this.#openParticipantDialog(params.targetNode);
		}
	}

	isOpen(): boolean
	{
		return this.#participantService.isDialogOpen();
	}

	closeIfOpen(): boolean
	{
		if (!this.isOpen())
		{
			return false;
		}

		this.#closeParticipantDialog();

		return true;
	}

	destroy(): void
	{
		this.#closeParticipantDialog();
		this.#hostContainer = null;
		this.#currentItem = null;
		this.#removeVisibleRange = null;
		this.#setAria = null;
	}

	#extractMention(params: HandleInputParams): ?MentionMatch
	{
		const startPosition = this.#currentMention?.startPosition ?? params.cursorPosition - 1;
		const matchedText = MentionMatcher.match(
			params.visibleText ?? params.item.title,
			startPosition,
			params.cursorPosition,
		);
		if (!Type.isStringFilled(matchedText))
		{
			return null;
		}

		return {
			text: matchedText,
			startPosition,
			range: params.captureVisibleRange?.(startPosition, params.cursorPosition) ?? null,
		};
	}

	#updateParticipantSearch(mention: MentionMatch): void
	{
		this.#participantService.updateSearch(mention.text.slice(1));
		this.#syncComboboxState();
	}

	#openParticipantDialog(targetNode: HTMLElement): void
	{
		this.#participantService.showParticipantDialog({
			targetNode,
			type: 'auditors',
			items: [this.#currentItem],
			isMultiple: true,
			withAngle: false,
			enableSearch: false,
			onSelect: (): void => this.#handleMentionSelected(),
			onDeselect: (): void => this.#handleMentionSelected(),
			onClose: (): void => this.#resetMentionState(),
		});

		this.#dialogExpanded = true;
		this.#onDialogStateChange(true);
		this.#syncComboboxState();
		LiveAnnouncer.announce(Loc.getMessage('TASKS_V2_CHECK_LIST_MENTION_LIST_OPENED'), 'polite');
	}

	#handleMentionSelected(): void
	{
		if (this.#currentMention?.range && Type.isFunction(this.#removeVisibleRange))
		{
			this.#removeVisibleRange(this.#currentMention.range);
		}
		this.#closeParticipantDialog();
	}

	#closeParticipantDialog(): void
	{
		this.#participantService.closeDialog();
		this.#resetMentionState();
	}

	#resetMentionState(): void
	{
		this.#participantService.updateSearch('');
		this.#currentMention = null;
		this.#dialogExpanded = false;
		this.#onDialogStateChange(false);
		this.#syncComboboxState();
	}

	#syncComboboxState(): void
	{
		const listBoxId = this.#dialogExpanded ? this.#participantService.getActiveListBoxId() : null;
		const activeOptionId = Type.isStringFilled(listBoxId)
			? document.getElementById(listBoxId)?.querySelector('[aria-selected="true"]')?.id ?? null
			: null
		;
		const aria = this.#dialogExpanded
			? {
				role: 'combobox',
				autocomplete: 'list',
				expanded: 'true',
				controls: listBoxId,
				activedescendant: activeOptionId,
			}
			: { role: 'textbox' }
		;
		if (Type.isFunction(this.#setAria))
		{
			this.#setAria(aria);

			return;
		}

		const input = this.#hostContainer?.querySelector('[contenteditable="true"], textarea');
		if (input)
		{
			Dom.attr(input, {
				role: this.#dialogExpanded ? 'combobox' : 'textbox',
				'aria-autocomplete': this.#dialogExpanded ? 'list' : null,
				'aria-expanded': this.#dialogExpanded ? 'true' : null,
				'aria-controls': Type.isStringFilled(listBoxId) ? listBoxId : null,
				'aria-activedescendant': Type.isStringFilled(activeOptionId) ? activeOptionId : null,
			});
		}
	}
}
