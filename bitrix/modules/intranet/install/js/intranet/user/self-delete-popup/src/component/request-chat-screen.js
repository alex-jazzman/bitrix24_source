import { Loc, Tag, Type } from 'main.core';
import { Button } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Headline, Text as TypographyText } from 'ui.system.typography';

import { BaseScreen } from './base-screen';
import { SelfDeletePopupElementId } from '../const';

export class RequestChatScreen extends BaseScreen
{
	#createChatButton = null;
	#participantSelector = null;

	getTitle(): string
	{
		return Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_PROFILE_DELETE');
	}

	getDescriptionMessages(): Array<string>
	{
		return [
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_REQUEST_CHAT'),
		];
	}

	renderBody(): HTMLElement
	{
		const participantsNode = Tag.render`
			<div
				class="intranet-self-delete-popup__participant-box"
				data-testid="${SelfDeletePopupElementId.Participants}"
			></div>
		`;

		const content = Tag.render`
			<div class="intranet-self-delete-popup__card">
				${Headline.render(Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CHAT_CARD_TITLE'), {
					size: 'sm',
					className: 'intranet-self-delete-popup__card-title',
				})}
				${TypographyText.render(Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CHAT_CARD_DESCRIPTION'), {
					tag: 'div',
					size: 'md',
					className: 'intranet-self-delete-popup__card-description',
				})}
				${participantsNode}
			</div>
		`;
		this.#participantSelector = this.#createParticipantSelector();

		this.getActions().setParticipants([]);
		this.#participantSelector.renderTo(participantsNode);

		return content;
	}

	getButtons(): Array<Button>
	{
		this.#createChatButton = this.createButton({
			id: SelfDeletePopupElementId.CreateChatButton,
			text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_CREATE_CHAT'),
			style: this.getFilledButtonStyle(),
			disabled: true,
			onClick: (button) => this.getActions().createChat(button),
		});

		return [
			this.#createChatButton,
			this.createButton({
				id: SelfDeletePopupElementId.CancelButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL'),
				style: this.getOutlineButtonStyle(),
				onClick: () => this.getActions().cancel(),
			}),
		];
	}

	#createParticipantSelector(): TagSelector
	{
		const participantSelector = new TagSelector({
			id: SelfDeletePopupElementId.Participants,
			textBoxAutoHide: true,
			textBoxWidth: 350,
			maxHeight: 99,
			showAddButton: true,
			showCreateButton: false,
			placeholder: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_ADD_PARTICIPANT'),
			multiple: true,
			events: {
				onTagAdd: this.handleSelectorChange.bind(this),
				onTagRemove: this.handleSelectorChange.bind(this),
			},
			dialogOptions: {
				id: SelfDeletePopupElementId.ParticipantsPopup,
				context: 'intranet-self-delete-popup',
				width: 390,
				height: 320,
				compactView: true,
				dropdownMode: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: true,
				multiple: true,
				hideOnDeselect: false,
				entities: [
					{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							userId: this.getOptions().adminIds,
							inviteEmployeeLink: false,
						},
					},
				],
			},
		});

		participantSelector.getTextBox().id = SelfDeletePopupElementId.ParticipantsInput;
		participantSelector.getTextBox().dataset.testid = SelfDeletePopupElementId.ParticipantsInput;

		return participantSelector;
	}

	handleSelectorChange(): void
	{
		const participants = this.#mapSelectedItemsToParticipants(this.#participantSelector?.getTags() ?? []);

		this.getActions().setParticipants(participants);
		this.#createChatButton?.setDisabled(participants.length === 0);
	}

	#mapSelectedItemsToParticipants(selectedItems): Array<Object>
	{
		return selectedItems
			.filter((participant) => this.#filterSelectedItemParticipant(participant))
			.map((participant) => this.#mapSelectedItemToParticipant(participant))
		;
	}

	#filterSelectedItemParticipant(participant): boolean
	{
		if (
			!Type.isObjectLike(participant)
			|| !Type.isFunction(participant.getEntityId)
			|| !Type.isFunction(participant.getId)
			|| !Type.isFunction(participant.getTitle)
		)
		{
			return false;
		}

		const participantId = Number(participant.getId());

		return participant.getEntityId() === 'user'
			&& Type.isInteger(participantId)
			&& participantId > 0
			&& Type.isStringFilled(participant.getTitle());
	}

	#mapSelectedItemToParticipant(participant): Object
	{
		const avatarUrl = Type.isFunction(participant.getAvatar) ? participant.getAvatar() : null;

		return {
			id: Number(participant.getId()),
			name: participant.getTitle().trim(),
			avatarUrl: Type.isStringFilled(avatarUrl) ? avatarUrl.trim() : null,
		};
	}
}
