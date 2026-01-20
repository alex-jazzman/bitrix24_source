import { Popup } from 'main.popup';
import { Tag, Dom, Text, Event, Type } from 'main.core';

import { Text as TypographyText } from 'ui.system.typography';

import { Messenger } from 'im.public';

import { Structure } from 'humanresources.company-structure.public';

import type { UsedByFieldFieldType, UserFieldType, DepartmentFieldType } from '../types';
import GridIcons from '../grid-icons';
import { BaseField } from './base-field';
import { PhotoField } from './photo-field';

export class UsedByField extends BaseField
{
	static MAX_VISIBLE_AVATARS_COMBINED = 3;
	static MAX_VISIBLE_AVATARS_USERS_ONLY = 5;
	static MAX_COUNTER_VALUE = 99;

	#combinedPopup: Popup | null;

	render(params: UsedByFieldFieldType): void
	{
		const { users = [], chatId, chatName, departments = {} } = params;

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

		this.#createChatNode(container, chatId, chatName);

		this.appendToFieldNode(container);
	}

	#renderCombinedView(
		container: HTMLElement,
		departments: DepartmentFieldType[],
		users: UserFieldType[],
	): void
	{
		Dom.addClass(container, 'agent-grid-used-by-container-with-users-and-departments');

		this.#createDepartmentsCounter(container, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
		this.#createAvatarsContainer(container, departments, users, UsedByField.MAX_VISIBLE_AVATARS_COMBINED);
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
				this.#toggleCombinedPopup(departments, users, counterWrapper);
			});
		}
		else
		{
			Dom.addClass(numberNode, 'agent-grid-counter-default-cursor');
		}

		return counterWrapper;
	}

	#toggleCombinedPopup(
		departments: DepartmentFieldType[],
		users: UserFieldType[],
		bindElement: HTMLElement,
	): void
	{
		if (this.#combinedPopup && this.#combinedPopup.isShown())
		{
			this.#combinedPopup.close();
		}
		else
		{
			this.#openCombinedPopup(departments, users, bindElement);
		}
	}

	#createChatNode(
		container: HTMLElement,
		chatId: ?string,
		chatName: ?string,
	): void
	{
		if (!chatId)
		{
			return;
		}

		const chatNameNode = TypographyText.render(
			chatName || '',
			{
				size: '2xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-chat-name',
			},
		);

		const encodedChatName = Text.encode(chatName || '');
		const chatContainer = Tag.render`
			<div class="agent-grid-chat-container" title="${encodedChatName}">
				${GridIcons.AGENT_CHAT}
				<a href="#" class="agent-grid-chat-link">
					${chatNameNode}
				</a>
			</div>
		`;

		Event.bind(chatContainer, 'click', (event) => {
			event.preventDefault();
			this.openChat(chatId);
		});

		Dom.append(chatContainer, container);
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
		const contentNode = Tag.render`<div class="agent-grid-departments-list-wrapper"></div>`;

		this.#fillDepartmentsListContent(departments, contentNode);
		this.#fillUsersListContent(users, contentNode);

		this.#combinedPopup = new Popup({
			content: contentNode,
			bindElement,
			cacheable: false,
			minWidth: 300,
			minHeight: 50,
			maxWidth: 400,
			maxHeight: 200,
			padding: 0,
			autoHide: true,
			className: 'agents-grid-popup',
		});

		this.#combinedPopup.show();
		this.#combinedPopup.subscribe('onClose', () => {
			this.#combinedPopup = null;
		});
	}

	#fillDepartmentsListContent(
		departments: DepartmentFieldType[],
		contentNode: HTMLElement,
	): HTMLElement
	{
		if (!departments || Object.keys(departments).length === 0)
		{
			return contentNode;
		}

		Object.entries(departments).forEach(([id, name]) => {
			const nodeId = Text.toInteger(id);
			const departmentNode = this.#getDepartmentNode(name, nodeId, true);
			Dom.append(departmentNode, contentNode);
		});

		return contentNode;
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

	#fillUsersListContent(
		users: UserFieldType[],
		contentNode: HTMLElement,
	): HTMLElement
	{
		if (!users || users.length === 0)
		{
			return contentNode;
		}

		users.forEach((user) => {
			const departmentNode = this.#getUserWithNameNode(user, true);
			Dom.append(departmentNode, contentNode);
		});

		return contentNode;
	}

	#getUserWithNameNode(user: UserFieldType): HTMLElement
	{
		const userFullName = user?.fullName || '';
		const userWrapper = Tag.render`<div title="${userFullName}" class="agent-grid-user-in-list"></div>`;
		const imageWrapper = Tag.render`<div class="agent-grid-user-img-container"></div>`;

		new PhotoField({ fieldNode: imageWrapper }).render({ user });

		const label = TypographyText.render(
			userFullName,
			{
				size: 'xs',
				accent: false,
				tag: 'span',
				className: 'agent-grid-user-full-name',
			},
		);

		Event.bind(userWrapper, 'click', () => this.#openUserProfile(user?.profileLink));

		Dom.append(imageWrapper, userWrapper);
		Dom.append(label, userWrapper);

		return userWrapper;
	}

	#openUserProfile(profileLink: ?string): void
	{
		if (Type.isStringFilled(profileLink))
		{
			BX.SidePanel.Instance.open(profileLink);
		}
	}
}
