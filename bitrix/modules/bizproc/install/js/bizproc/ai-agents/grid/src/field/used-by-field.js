import { BaseEvent } from 'main.core.events';
import { Popup } from 'main.popup';
import { Tag, Dom, Text, Event, Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';

import { Text as TypographyText } from 'ui.system.typography';
import { Item, Dialog, ItemOptions } from 'ui.entity-selector';

import { Messenger } from 'im.public';

import { Structure } from 'humanresources.company-structure.public';

import type { UsedByFieldFieldType, UserFieldType, DepartmentFieldType, ChatInfo } from '../types';
import GridIcons from '../grid-icons';
import { BaseField } from './base-field';
import { PhotoField } from './photo-field';

export class UsedByField extends BaseField
{
	static MAX_VISIBLE_AVATARS_COMBINED = 3;
	static MAX_VISIBLE_AVATARS_USERS_ONLY = 5;
	static MAX_COUNTER_VALUE = 99;

	static ENTITY_DEPARTMENT = 'department';
	static ENTITY_USER = 'user';

	#chatsPopup: Popup | null;

	render(params: UsedByFieldFieldType): void
	{
		const { users = [], chats = [], departments = {} } = params;

		const container = Tag.render`
			<div class="agent-grid-used-by-container"></div>
		`;

		const hasUsers = users && users.length > 0;
		const hasDepartments = departments && Object.keys(departments).length > 0;

		if (hasUsers && hasDepartments)
		{
			this.#renderCombinedView(container, departments, users);
		}
		else if (hasDepartments)
		{
			this.#renderDepartmentsOnlyView(container, departments, users);
		}
		else
		{
			this.#renderUsersOnlyView(container, departments, users);
		}

		this.#createChatNode(container, chats);

		this.appendToFieldNode(container);
	}

	#renderCombinedView(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
	): void
	{
		const combinedViewWrapper = Tag.render`
			<div class="agent-grid-used-by-container-with-users-and-departments"></div>
		`;
		Dom.append(combinedViewWrapper, container);

		this.#createDepartmentsCounter(combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
		this.#createAvatarsContainer(combinedViewWrapper, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
	}

	#renderUsersOnlyView(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
	): void
	{
		this.#createAvatarsContainer(container, departments, users, UsedByField.MAX_VISIBLE_AVATARS_USERS_ONLY);
	}

	#renderDepartmentsOnlyView(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
	): void
	{
		this.#createDepartmentsNode(container, departments, users);
	}

	#createAvatarsContainer(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
		maxVisibleAvatars: number,
	): void
	{
		const placeholderAvatarsCount = 3;
		const avatarsContainer = Tag.render`<div data-test-id="bizproc-ai-agents-grid-used-by-avatars-container" class="agent-grid-user-avatars"></div>`;

		if (!users || users.length === 0)
		{
			for (let i = 0; i < placeholderAvatarsCount; i++)
			{
				const avatarContainer = Tag.render`<span></span>`;
				Dom.append(avatarContainer, avatarsContainer);

				(new PhotoField({ fieldNode: avatarContainer })).render({});
			}
			Dom.append(avatarsContainer, container);

			return;
		}

		users.slice(0, maxVisibleAvatars).forEach((user) => {
			const avatarContainer = Tag.render`<span></span>`;
			Dom.append(avatarContainer, avatarsContainer);

			(new PhotoField({ fieldNode: avatarContainer })).render({ user });
		});

		if (users.length > maxVisibleAvatars)
		{
			const remainingCount = users.length - maxVisibleAvatars;
			const counterClass = 'agent-grid-avatar-counter-number';
			const counterWrapperClass = 'agent-grid-avatar-counter';

			const counter = this.#createCounterNode(
				remainingCount,
				departments,
				users,
				counterClass,
				counterWrapperClass,
			);

			Dom.append(counter, avatarsContainer);
		}

		Dom.append(avatarsContainer, container);
	}

	#createDepartmentsCounter(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
		maxVisibleAvatars: ?number,
	): void
	{
		const departmentsCount = Object.keys(departments).length;
		if (departmentsCount === 0)
		{
			return;
		}

		let withOpenPopupEvent = true;

		if (
			maxVisibleAvatars
			&& users?.length > maxVisibleAvatars
		)
		{
			withOpenPopupEvent = false;
		}

		const counterClass = 'agent-grid-department-counter agent-grid-department-counter-with-users';
		const counterWrapperClass = '';
		const withPlusPrefix = false;
		const counterNode = this.#createCounterNode(
			departmentsCount,
			departments,
			users,
			counterClass,
			counterWrapperClass,
			withPlusPrefix,
			withOpenPopupEvent,
		);

		if (counterNode)
		{
			Dom.append(counterNode, container);
		}
	}

	#createDepartmentsNode(
		container: HTMLElement,
		departments: ?DepartmentFieldType[],
		users: UserFieldType[],
	): void
	{
		if (!departments)
		{
			return;
		}

		const departmentIds = Object.keys(departments);
		const departmentsCount = departmentIds.length;

		if (departmentsCount === 0)
		{
			return;
		}

		const firstDepartmentId = Text.toInteger(departmentIds[0]);
		const firstDepartmentName = departments[firstDepartmentId] ?? '';
		const departmentNode = this.#getDepartmentNode(firstDepartmentName, firstDepartmentId);

		if (departmentsCount > 1)
		{
			const remainingCount = departmentsCount - 1;
			const counterClass = 'agent-grid-department-counter-number';
			const counterWrapperClass = 'agent-grid-department-counter';

			const counterNode = this.#createCounterNode(
				remainingCount,
				departments,
				users,
				counterClass,
				counterWrapperClass,
			);

			if (counterNode)
			{
				Dom.append(counterNode, departmentNode);
			}
		}

		Dom.append(departmentNode, container);
	}

	#getDepartmentNode(
		department: string,
		nodeId: number,
		shouldAddHover: boolean = false,
	): HTMLElement
	{
		const departmentWrapper = Tag.render`
			<div class="${shouldAddHover ? 'agent-grid-department-in-list' : 'agent-grid-department'}"></div>
		`;
		const circle = Tag.render`<div class="agent-grid-department-circle">${GridIcons.DEPARTMENT}</div>`;
		const label = TypographyText.render(
			department,
			{
				size: 'xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-department-label',
			},
		);

		Dom.attr(label, 'title', department);
		Dom.append(circle, departmentWrapper);
		Dom.append(label, departmentWrapper);

		Event.bind(departmentWrapper, 'click', (event: MouseEvent) => {
			event.stopPropagation();

			Structure?.open({
				focusNodeId: nodeId,
			});
		});

		return departmentWrapper;
	}

	#getDisplayedNumber(remainingCount: number): number
	{
		return remainingCount > UsedByField.MAX_COUNTER_VALUE
			? UsedByField.MAX_COUNTER_VALUE
			: remainingCount
		;
	}

	#createCounterNode(
		count: number,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
		counterClassName: string = '',
		counterWrapperClassName: string = '',
		withPlusPrefix = true,
		withOpenPopupEvent = true,
	): null | HTMLElement
	{
		if (count <= 0)
		{
			return null;
		}

		const counterWrapper = Tag.render`<div class="${counterWrapperClassName}"></div>`;

		const displayedNumber = this.#getDisplayedNumber(count);
		let counterText = String(displayedNumber);
		if (withPlusPrefix)
		{
			counterText = `+${counterText}`;
		}

		const numberNode = TypographyText.render(
			counterText,
			{
				size: '3xs',
				accent: false,
				tag: 'span',
				className: counterClassName,
			},
		);

		Dom.append(numberNode, counterWrapper);

		if (withOpenPopupEvent)
		{
			Event.bind(counterWrapper, 'click', (event) => {
				event.stopPropagation();
				this.#openCombinedPopup(departments, users, counterWrapper);
			});
		}
		else
		{
			Dom.addClass(numberNode, 'agent-grid-counter-default-cursor');
		}

		return counterWrapper;
	}

	#createChatNode(
		container: HTMLElement,
		chats: ChatInfo[],
	): void
	{
		const chatsCount = chats?.length ?? 0;

		if (chatsCount === 0)
		{
			return;
		}

		const firstChat = chats[0] ?? '';
		const chatNode = this.#getChatNode(firstChat);

		if (chatsCount > 1)
		{
			const remainingCount = chatsCount - 1;

			const counterNode = this.#getChatsCounterNode(
				remainingCount,
				chats,
			);

			Dom.append(counterNode, chatNode);
		}

		Dom.append(chatNode, container);
	}

	#getChatNode(
		chat: ChatInfo,
		shouldAddHover: boolean = false,
	): HTMLElement
	{
		const chatName = chat.chatName ?? '';
		const chatNameNode = TypographyText.render(
			chatName,
			{
				size: '2xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-chat-name',
			},
		);

		const encodedChatName = Text.encode(chatName);
		const containerClass = shouldAddHover ? 'agent-grid-chats-in-list' : 'agent-grid-chat-container';
		const chatContainer = Tag.render`
			<div class="${containerClass}" title="${encodedChatName}">
				${GridIcons.AGENT_CHAT}
				<a href="#" class="agent-grid-chat-link">
					${chatNameNode}
				</a>
			</div>
		`;

		Event.bind(chatContainer, 'click', (event) => {
			event.preventDefault();
			this.openChat(chat.chatId);
		});

		return chatContainer;
	}

	#getChatsCounterNode(
		remainingCount: number,
		chats: ChatInfo[],
	): HTMLElement
	{
		const counterWrapper = Tag.render`<div class="ai-agents-chats-counter-wrapper"></div>`;
		const counterClassName = 'ai-agents-chats-counter';

		const displayedNumber = this.#getDisplayedNumber(remainingCount);
		const counterText = `+${displayedNumber}`;

		const numberNode = TypographyText.render(
			counterText,
			{
				size: '3xs',
				accent: true,
				tag: 'span',
				className: counterClassName,
			},
		);

		Dom.append(numberNode, counterWrapper);

		Event.bind(counterWrapper, 'click', (event) => {
			event.stopPropagation();
			this.#toggleChatsListPopup(chats, counterWrapper);
		});

		return counterWrapper;
	}

	#toggleChatsListPopup(chats: ChatInfo[], counterNode: HTMLElement): void
	{
		if (this.#chatsPopup && this.#chatsPopup.isShown())
		{
			this.#chatsPopup.close();
		}
		else
		{
			this.#openChatsListPopup(chats, counterNode);
		}
	}

	#openChatsListPopup(chats: ChatInfo[], bindElement: HTMLElement): void
	{
		const contentNode = Tag.render`<div class="agent-grid-chats-list-wrapper"></div>`;

		this.#fillChatsListContent(chats, contentNode);

		this.#chatsPopup = new Popup({
			content: contentNode,
			bindElement,
			cacheable: false,
			minHeight: 50,
			maxWidth: 400,
			maxHeight: 200,
			padding: 0,
			autoHide: true,
			className: 'agents-grid-popup',
		});

		this.#chatsPopup.show();
		this.#chatsPopup.subscribe('onClose', () => {
			this.#chatsPopup = null;
		});
	}

	#fillChatsListContent(chats: ChatInfo[], contentNode: HTMLElement): HTMLElement
	{
		if (!chats || chats.length === 0)
		{
			return contentNode;
		}

		chats.forEach((chat) => {
			const shouldAddHover = true;
			const chatNode = this.#getChatNode(chat, shouldAddHover);
			Dom.append(chatNode, contentNode);
		});

		return contentNode;
	}

	openChat(chatId: string): void
	{
		if (!chatId)
		{
			return;
		}
		Messenger.openChat(chatId);
	}

	#openCombinedPopup(
		departments: ?DepartmentFieldType[],
		users: UserFieldType[],
		bindElement: HTMLElement,
	)
	{
		const items: ItemOptions[] = [];

		this.#fillDepartmentsListContent(departments, items);
		this.#fillUsersListContent(users, items);

		const entities = [
			{
				id: UsedByField.ENTITY_USER,
				dynamicLoad: false,
			},
			{
				id: UsedByField.ENTITY_DEPARTMENT,
				dynamicLoad: false,
			},
		];

		const dialog = new Dialog({
			targetNode: bindElement,
			width: 306,
			height: 309,
			dropdownMode: true,
			showAvatars: true,
			autoHide: true,
			multiple: false,
			hideOnSelect: false,
			focusOnFirst: false,
			showDefaultFooter: false,
			searchTabOptions: { visible: false },
			recentTabOptions: { visible: false },
			events: {
				'Item:onBeforeSelect': this.#handleBeforeSelect.bind(this),
			},
			entities,
			items,
		});

		dialog.show();
	}

	#fillDepartmentsListContent(
		departments: DepartmentFieldType[],
		items: ItemOptions[],
	): ItemOptions[]
	{
		if (!departments || Object.keys(departments).length === 0)
		{
			return items;
		}

		Object.entries(departments).forEach(([id, name]) => {
			items.push({
				id: Text.toInteger(id),
				title: name,
				entityId: UsedByField.ENTITY_DEPARTMENT,
				tabs: 'recents',
			});
		});

		return items;
	}

	#fillUsersListContent(
		users: UserFieldType[],
		items: ItemOptions[],
	): ItemOptions[]
	{
		if (!users || users.length === 0)
		{
			return items;
		}

		users.forEach((user: UserFieldType) => {
			const itemOptions: ItemOptions = {
				id: user.id,
				title: user.fullName,
				entityId: UsedByField.ENTITY_USER,
				tabs: 'recents',
				avatarOptions: {
					bgSize: 'cover',
				},
			};

			if (user?.photoUrl)
			{
				itemOptions.avatar = decodeURIComponent(user.photoUrl);
			}

			if (user?.profileLink)
			{
				itemOptions.link = user.profileLink;
			}

			items.push(itemOptions);
		});

		return items;
	}

	#openUserProfile(profileLink: ?string): void
	{
		if (Type.isStringFilled(profileLink))
		{
			SidePanel.Instance.open(profileLink);
		}
	}

	#handleBeforeSelect(event: BaseEvent): void
	{
		const item: Item = event.getData().item;
		event.preventDefault();

		if (item.getEntityId() === UsedByField.ENTITY_DEPARTMENT)
		{
			this.#handleSelectDepartment(item);

			return;
		}

		if (item.getEntityId() === UsedByField.ENTITY_USER)
		{
			this.#handleSelectUser(item);
		}
	}

	#handleSelectDepartment(item: Item): void
	{
		Structure?.open({
			focusNodeId: item.id,
		});
	}

	#handleSelectUser(item: Item): void
	{
		this.#openUserProfile(item?.link);
	}
}
