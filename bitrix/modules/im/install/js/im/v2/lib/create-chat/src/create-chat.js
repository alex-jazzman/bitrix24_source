import { EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout } from 'im.v2.const';

import { type CreateChatFields, type PreselectedMemberItem, type OpenChatCreationParams } from './types/types';

export type { OpenChatCreationParams } from './types/types';
export type CreatableChatTypeItem = $Values<typeof CreatableChatType>;

export const CreatableChatType = {
	chat: 'chat',
	videoconf: 'videoconf',
	channel: 'channel',
	collab: 'collab',
	collabChat: 'collabChat',
};

export class CreateChatManager extends EventEmitter
{
	static events = {
		creationStatusChange: 'creationStatusChange',
		titleChange: 'titleChange',
		avatarChange: 'avatarChange',
		chatTypeChange: 'chatTypeChange',
	};

	static #instance: CreateChatManager;

	#isCreating: boolean = false;
	#chatType: CreatableChatTypeItem = CreatableChatType.chat;
	#chatTitle: string = '';
	#chatAvatarFile: File = null;
	#chatFields: CreateChatFields;
	// preset fields - pre-configured one-time values
	#parentChatId: number;
	#preselectedMembers: PreselectedMemberItem[] = [];
	#includeCurrentUser: boolean = true;
	#ownerId: number;

	static getInstance(): CreateChatManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	constructor(props)
	{
		super(props);
		this.setEventNamespace('BX.Messenger.v2.CreateChatManager');
	}

	startChatCreation(chatTypeToCreate: CreatableChatTypeItem, params: OpenChatCreationParams = {}): Promise
	{
		const {
			clearCurrentCreation = true,
			preselectedMembers = [],
			includeCurrentUser = true,
			ownerId = null,
			parentChatId = 0,
		} = params;

		if (clearCurrentCreation)
		{
			this.setCreationStatus(false);
		}

		this.#parentChatId = parentChatId;
		this.#preselectedMembers = preselectedMembers;
		this.#includeCurrentUser = includeCurrentUser;
		this.#ownerId = ownerId;

		return LayoutManager.getInstance().setLayout({
			name: Layout.createChat,
			entityId: chatTypeToCreate,
		});
	}

	isCreating(): boolean
	{
		return this.#isCreating;
	}

	isCreationLayoutActive(type: CreatableChatTypeItem): boolean
	{
		const { name: currentLayoutName, entityId: currentLayoutChatType } = Core.getStore().getters['application/getLayout'];

		return currentLayoutName === Layout.createChat && currentLayoutChatType === type;
	}

	getChatType(): CreatableChatTypeItem
	{
		return this.#chatType;
	}

	getChatTitle(): string
	{
		return this.#chatTitle;
	}

	getChatAvatar(): ?File
	{
		return this.#chatAvatarFile;
	}

	getParentChatId(): number
	{
		return this.#parentChatId;
	}

	setChatType(type: CreatableChatTypeItem)
	{
		this.#chatType = type;
		this.emit(CreateChatManager.events.chatTypeChange, type);
	}

	setCreationStatus(flag: boolean)
	{
		this.#isCreating = flag;
		this.clearFields();
		this.emit(CreateChatManager.events.creationStatusChange, flag);
	}

	setChatTitle(chatTitle: string)
	{
		this.#chatTitle = chatTitle;
		this.emit(CreateChatManager.events.titleChange, chatTitle);
	}

	setChatAvatar(chatAvatarFile: ?File)
	{
		this.#chatAvatarFile = chatAvatarFile;
		this.emit(CreateChatManager.events.avatarChange, chatAvatarFile);
	}

	saveFields(chatFields: CreateChatFields)
	{
		this.#chatFields = chatFields;
	}

	getFields(): ?CreateChatFields
	{
		return this.#chatFields;
	}

	clearFields()
	{
		this.#chatFields = null;
		this.setChatTitle('');
		this.setChatAvatar(null);
	}

	getChatMembers(): [[string, number | string]]
	{
		const mappedMembers = this.#preselectedMembers.map((item) => [item.type, item.id]);
		if (this.#includeCurrentUser)
		{
			mappedMembers.push(['user', Core.getUserId()]);
		}

		return mappedMembers;
	}

	getOwnerId(): boolean
	{
		return this.#ownerId ?? Core.getUserId();
	}

	getUndeselectedItems(): [[string, number | string]]
	{
		if (this.#includeCurrentUser)
		{
			return [['user', Core.getUserId()]];
		}

		return [];
	}

	clearPresetFields()
	{
		this.#ownerId = null;
		this.#includeCurrentUser = true;
		this.#preselectedMembers = [];
	}
}
