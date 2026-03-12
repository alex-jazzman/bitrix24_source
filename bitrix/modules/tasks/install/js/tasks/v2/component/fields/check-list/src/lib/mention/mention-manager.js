import { Type } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { MentionMatcher } from './mention-matcher';
import { CheckListParticipantService } from '../check-list-participant-service';

type MentionManagerParams = {
	taskId: number | string,
	itemId: number | string,
};

type HandleInputParams = {
	item: CheckListModel,
	isEntered: boolean,
	cursorPosition: number,
	targetNode: HTMLElement,
};

type MentionMatch = {
	text: string,
	startPosition: number,
};

export class MentionManager
{
	#itemId: number | string;
	#participantService: CheckListParticipantService;

	#currentItem: ?CheckListModel;
	#currentMention: ?MentionMatch;

	constructor(params: MentionManagerParams)
	{
		this.#itemId = params.itemId;
		this.#participantService = new CheckListParticipantService(params.taskId);
	}

	async handleInput(params: HandleInputParams): Promise<void>
	{
		if (this.#itemId !== params.item.id)
		{
			return;
		}

		this.#currentItem = params.item;

		const mention: ?MentionMatch = this.#extractMention(params);
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

	#extractMention(params: HandleInputParams): ?MentionMatch
	{
		const startPosition: number = this.#currentMention?.startPosition ?? params.cursorPosition - 1;
		const matchedText: string = MentionMatcher.match(
			params.item.title,
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
		};
	}

	#updateParticipantSearch(mention: MentionMatch): void
	{
		const searchText: string = mention.text.slice(1); // remove trigger character (@, +)
		this.#participantService.updateSearch(searchText);
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
	}

	#handleMentionSelected(): void
	{
		void this.#removeMentionFromTitle();
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
	}

	async #removeMentionFromTitle(): Promise<void>
	{
		if (!this.#currentMention)
		{
			return;
		}

		const newTitle: string = this.#buildTitleWithoutMention(
			this.#currentItem.title,
			this.#currentMention,
		);

		await this.#updateCheckList(this.#currentItem.id, { title: newTitle });
	}

	#buildTitleWithoutMention(currentTitle: string, mention: MentionMatch): string
	{
		const beforeMention = currentTitle.slice(0, mention.startPosition);
		const afterMention = currentTitle.slice(mention.startPosition + mention.text.length);

		return beforeMention + afterMention;
	}

	async #updateCheckList(id: number | string, fields: Partial<CheckListModel>): Promise<void>
	{
		return this.$store.dispatch(`${Model.CheckList}/update`, { id, fields });
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
