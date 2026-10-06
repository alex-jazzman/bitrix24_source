import { Dom, Loc, Tag } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

import { buildSenderSelectorItems, getInitialSenderOptionId, getSenderValueById } from './sender-options';
import { type PanelSaveData, type PanelSlot, type SenderOption } from './types';
import './style.css';

export type SenderBindingPanelOptions = {
	senderOptions: SenderOption[],
};

export class SenderBindingPanel implements PanelSlot
{
	#senderOptions: SenderOption[];
	#initialOptionId: string | null;
	#selector: TagSelector | null = null;

	constructor(options: SenderBindingPanelOptions)
	{
		this.#senderOptions = options.senderOptions ?? [];
		this.#initialOptionId = getInitialSenderOptionId(this.#senderOptions);
	}

	renderTo(container: HTMLElement): void
	{
		const selectorContainer = Tag.render`
			<div
				class="mail-signature-sender-binding__selector"
				data-role="sender-selector"
				data-testid="mail-signature-sender-selector"
			></div>
		`;

		const block = Tag.render`
			<div class="mail-signature-sender-binding" data-testid="mail-signature-sender-binding">
				<div class="mail-signature-sender-binding__label">
					${Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_LABEL') ?? ''}
				</div>
				${selectorContainer}
			</div>
		`;

		Dom.append(block, container);

		// Both captions are set explicitly: the DS switches to the "more" caption only once a tag
		// is rendered, so on open the button would read "Добавить" over an already chosen sender.
		const caption = Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_CHANGE') ?? '';

		this.#selector = new TagSelector({
			multiple: false,
			addButtonCaption: caption,
			addButtonCaptionMore: caption,
			dialogOptions: {
				targetNode: selectorContainer,
				context: 'MAIL_SIGNATURE_SENDER_BINDING',
				items: buildSenderSelectorItems(this.#senderOptions),
				dropdownMode: true,
				enableSearch: false,
				showAvatars: false,
				compactView: true,
			},
		});

		this.#selector.renderTo(selectorContainer);
	}

	getSaveData(): PanelSaveData
	{
		const selectedOptionId = this.#getSelectedOptionId();
		const selectedOption = this.#senderOptions.find((option) => option.id === selectedOptionId);

		return {
			kind: 'user',
			sender: getSenderValueById(this.#senderOptions, selectedOptionId),
			preserveAssignment: selectedOption?.preserveAssignment === true,
			senderChanged: selectedOptionId !== this.#initialOptionId,
		};
	}

	#getSelectedOptionId(): string | null
	{
		const tag = this.#selector?.getTags()[0];

		return tag ? String(tag.getId()) : this.#initialOptionId;
	}
}
