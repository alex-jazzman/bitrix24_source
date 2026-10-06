import { Dom, Event, Tag, Text, Type } from 'main.core';

import { openUserProfile } from './open-user-profile';
import { type LoadUsers, UsersPopup } from './users-popup';

export type UserData = {
	id: number;
	name: string;
	photo: string;
};

export type RoleAvatarStackOptions = {
	users?: UserData[];
	title?: string;
	maxVisible?: number;
	totalCount?: number;
	loadUsers?: LoadUsers;
};

const DEFAULT_MAX_VISIBLE = 3;

export class RoleAvatarStack
{
	#users: UserData[];
	#title: string;
	#maxVisible: number;
	#totalCount: number;
	#loadUsers: LoadUsers | null;

	constructor(options: RoleAvatarStackOptions = {})
	{
		this.#users = Array.isArray(options.users) ? options.users : [];
		this.#title = options.title ?? '';
		this.#maxVisible = Type.isNumber(options.maxVisible) ? options.maxVisible : DEFAULT_MAX_VISIBLE;
		this.#totalCount = Type.isNumber(options.totalCount) ? options.totalCount : this.#users.length;
		this.#loadUsers = Type.isFunction(options.loadUsers) ? options.loadUsers : null;
	}

	render(): HTMLElement
	{
		if (this.#totalCount === 1 && this.#users.length > 0)
		{
			return this.#renderSingleUser(this.#users[0]);
		}

		const visible = this.#users.slice(0, this.#maxVisible);
		const restCount = Math.max(0, this.#totalCount - visible.length);
		const container = Tag.render`
			<span class="sign-role-avatar-stack" data-test-id="sign-role-avatar-stack"></span>
		`;

		visible.forEach((user: UserData) => Dom.append(this.#renderAvatar(user), container));
		if (restCount > 0)
		{
			Dom.append(
				Tag.render`<span class="sign-role-avatar-stack__counter">+${restCount}</span>`,
				container,
			);
		}

		Event.bind(container, 'click', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			this.#openPopup(container);
		});

		return container;
	}

	#renderSingleUser(user: UserData): HTMLElement
	{
		const container = Tag.render`
			<span
				class="sign-role-avatar-stack sign-role-avatar-stack--single"
				data-test-id="sign-role-avatar-stack"
			></span>
		`;

		Dom.append(this.#renderAvatar(user), container);
		Dom.append(
			Tag.render`<span class="sign-role-avatar-stack__single-name">${Text.encode(user?.name ?? '')}</span>`,
			container,
		);

		Event.bind(container, 'click', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			const userId = Number(user?.id);
			if (Number.isInteger(userId) && userId > 0)
			{
				void openUserProfile(userId);
			}
		});

		return container;
	}

	#renderAvatar(user: UserData): HTMLElement
	{
		const photo = Type.isStringFilled(user?.photo) ? user.photo : '';
		if (photo === '')
		{
			return Tag.render`
				<span
					class="sign-role-avatar-stack__item ui-icon ui-icon-common-user"
					title="${Text.encode(user?.name ?? '')}"
				>
					<i></i>
				</span>
			`;
		}

		return Tag.render`
			<span
				class="sign-role-avatar-stack__item"
				title="${Text.encode(user?.name ?? '')}"
				style="background-image: url('${this.#encodeCssUrl(photo)}')"
			></span>
		`;
	}

	#encodeCssUrl(url: string): string
	{
		return encodeURI(url)
			.replaceAll("'", '%27')
			.replaceAll('(', '%28')
			.replaceAll(')', '%29')
		;
	}

	#openPopup(bindElement: HTMLElement): void
	{
		new UsersPopup({
			users: this.#loadUsers === null ? this.#users : [],
			totalCount: this.#totalCount,
			loadUsers: this.#loadUsers,
			title: this.#title,
			bindElement,
		}).show();
	}
}
