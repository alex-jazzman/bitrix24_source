import { Main } from 'ui.icon-set.api.core';
import { Loc } from 'main.core';

export const ChatsMenuOption = Object.freeze({
	addChat: 'addChat',
	linkChat: 'linkChat',
	addChannel: 'addChannel',
	linkChannel: 'linkChannel',
});

export const ChatsMenuLinkChat = Object.freeze({
	id: ChatsMenuOption.linkChat,
	title: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_LINK_BUTTON_TITLE'),
	description: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_LINK_BUTTON_DESC'),
	bIcon: {
		name: Main.CHAT_MESSAGE,
		size: 20,
		colorTokenName: 'paletteBlue50',
	},
	dataTestId: 'hr-department-content_chats-tab__chat-list-action-link',
});

export const ChatsMenuAddChat = Object.freeze({
	id: ChatsMenuOption.addChat,
	title: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_ADD_BUTTON_TITLE'),
	description: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_ADD_BUTTON_DESC'),
	bIcon: {
		name: Main.ADD_CHAT,
		size: 20,
		colorTokenName: 'paletteBlue50',
	},
	dataTestId: 'hr-department-content_chats-tab__chat-list-action-add',
});

export const ChatsMenuLinkChannel = Object.freeze({
	id: ChatsMenuOption.linkChannel,
	title: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_LINK_BUTTON_TITLE'),
	description: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_LINK_BUTTON_DESC'),
	bIcon: {
		name: Main.SPEAKER_MOUTHPIECE,
		size: 20,
		colorTokenName: 'paletteBlue50',
	},
	dataTestId: 'hr-department-content_chats-tab__channel-list-action-link',
});

export const ChatsMenuAddChannel = Object.freeze({
	id: ChatsMenuOption.addChannel,
	title: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_ADD_BUTTON_TITLE'),
	description: Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_ADD_BUTTON_DESC'),
	bIcon: {
		name: Main.SPEAKER_MOUTHPIECE_PLUS,
		size: 20,
		colorTokenName: 'paletteBlue50',
	},
	dataTestId: 'hr-department-content_chats-tab__channel-list-action-add',
});

export const ChatListDataTestIds = Object.freeze({
	containerDataTestId: 'hr-department-content_chats-tab__chat-list-container',
	listActionButtonDataTestId: 'hr-department-content_chats-tab__chat-list-action-button',
	listActonMenuDataTestId: 'hr-department-content_chats-tab__chat-list-action-menu-container',
	listCounterDataTestId: 'hr-department-content_chats-tab__chat-list-counter',
});

export const ChannelListDataTestIds = Object.freeze({
	containerDataTestId: 'hr-department-content_chats-tab__channel-list-container',
	listActionButtonDataTestId: 'hr-department-content_chats-tab__channel-list-action-button',
	listActonMenuDataTestId: 'hr-department-content_chats-tab__channel-list-action-menu-container',
	listCounterDataTestId: 'hr-department-content_chats-tab__channel-list-counter',
});

export const ChatLinkDialogDataTestIds = Object.freeze({
	containerDataTestId: 'hr-department-content_chats-tab__link-chat-container',
	confirmButtonDataTestId: 'hr-department-content_chats-tab__link-chat-confirm-button',
	cancelButtonDataTestId: 'hr-department-content_chats-tab__link-chat-cancel-button',
	closeButtonDataTestId: 'hr-department-content_chats-tab__link-chat-close-button',
});

export const ChannelLinkDialogDataTestIds = Object.freeze({
	containerDataTestId: 'hr-department-content_chats-tab__link-channel-container',
	confirmButtonDataTestId: 'hr-department-content_chats-tab__link-channel-confirm-button',
	cancelButtonDataTestId: 'hr-department-content_chats-tab__link-channel-cancel-button',
	closeButtonDataTestId: 'hr-department-content_chats-tab__link-channel-close-button',
});
