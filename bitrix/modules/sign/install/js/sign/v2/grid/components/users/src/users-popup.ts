import { Dom, Event, Tag, Text, Type } from 'main.core';
import { Loader } from 'main.loader';
import { Popup } from 'main.popup';

import { openUserProfile } from './open-user-profile';
import { type UserData } from './role-avatar-stack';

export type UsersPage = {
	users: UserData[];
	total: number | null;
	nextCursor: number | null;
};

export type LoadUsers = (limit: number, afterUserId: number | null) => Promise<UsersPage>;

type UsersPopupOptions = {
	users?: UserData[];
	title?: string;
	bindElement?: HTMLElement | null;
	totalCount?: number;
	loadUsers?: LoadUsers | null;
};

const RENDER_BATCH_SIZE = 50;

export class UsersPopup
{
	#users: UserData[];
	#title: string;
	#bindElement: HTMLElement | null;
	#popup: Popup | null = null;
	#listContainer: HTMLElement | null = null;
	#renderedCount = 0;
	#nextCursor: number | null = null;
	#totalCount: number;
	#loadUsers: LoadUsers | null;
	#hasMoreRemoteUsers: boolean;
	#loading = false;
	#loader: Loader | null = null;
	#loaderContainer: HTMLElement | null = null;

	constructor(options: UsersPopupOptions = {})
	{
		this.#users = Array.isArray(options.users) ? options.users : [];
		this.#title = options.title ?? '';
		this.#bindElement = options.bindElement ?? null;
		this.#totalCount = Type.isNumber(options.totalCount) ? Number(options.totalCount) : this.#users.length;
		this.#loadUsers = Type.isFunction(options.loadUsers) ? options.loadUsers as LoadUsers : null;
		this.#hasMoreRemoteUsers = this.#loadUsers !== null;
	}

	show(): void
	{
		this.#popup = new Popup({
			id: `sign-users-popup-${Date.now()}`,
			bindElement: this.#bindElement,
			className: 'sign-users-popup',
			width: 280,
			maxHeight: 320,
			padding: 0,
			autoHide: true,
			closeByEsc: true,
			cacheable: false,
			content: this.#render(),
		});

		this.#popup.show();
		void this.#renderNextBatch();
	}

	#render(): HTMLElement
	{
		const container = Tag.render`
			<div class="sign-users-popup__container" data-test-id="sign-users-popup">
				${this.#renderTitle()}
				<div class="sign-users-popup__list" aria-busy="false"></div>
			</div>
		`;
		const listContainer = container.querySelector('.sign-users-popup__list');
		if (!(listContainer instanceof HTMLElement))
		{
			throw new TypeError('Users popup list container was not rendered');
		}

		this.#listContainer = listContainer;
		this.#renderedCount = 0;
		this.#nextCursor = null;
		this.#hasMoreRemoteUsers = this.#loadUsers !== null;
		Event.bind(listContainer, 'scroll', () => this.#renderOnScroll());

		return container;
	}

	#renderOnScroll(): void
	{
		if (this.#listContainer === null)
		{
			return;
		}

		const remainingHeight = this.#listContainer.scrollHeight
			- this.#listContainer.scrollTop
			- this.#listContainer.clientHeight
		;
		if (remainingHeight <= 64)
		{
			void this.#renderNextBatch();
		}
	}

	async #renderNextBatch(): Promise<void>
	{
		if (this.#listContainer === null || this.#loading || this.#renderedCount >= this.#totalCount)
		{
			return;
		}

		if (
			this.#loadUsers !== null
			&& this.#hasMoreRemoteUsers
			&& this.#renderedCount >= this.#users.length
		)
		{
			this.#loading = true;
			this.#showLoader();
			try
			{
				const page = await this.#loadUsers(RENDER_BATCH_SIZE, this.#nextCursor);
				const loadedUsers = Array.isArray(page?.users) ? page.users : [];
				this.#users.push(...loadedUsers);
				this.#totalCount = Type.isNumber(page?.total) ? Number(page.total) : this.#totalCount;
				this.#nextCursor = Type.isNumber(page?.nextCursor) ? page.nextCursor : null;
				this.#hasMoreRemoteUsers = this.#nextCursor !== null;
				if (!this.#hasMoreRemoteUsers)
				{
					this.#totalCount = this.#users.length;
				}
			}
			catch
			{
				this.#totalCount = this.#renderedCount;
			}
			finally
			{
				this.#hideLoader();
				this.#loading = false;
			}
		}

		const end = Math.min(this.#renderedCount + RENDER_BATCH_SIZE, this.#users.length, this.#totalCount);
		const fragment = document.createDocumentFragment();
		for (let index = this.#renderedCount; index < end; index++)
		{
			fragment.append(this.#renderItem(this.#users[index]));
		}
		this.#listContainer.append(fragment);
		this.#renderedCount = end;
	}

	#showLoader(): void
	{
		if (this.#listContainer === null || this.#loader !== null)
		{
			return;
		}

		this.#loaderContainer = Tag.render`
			<div class="sign-users-popup__loader" data-test-id="sign-users-loader"></div>
		`;
		Dom.append(this.#loaderContainer, this.#listContainer);
		Dom.attr(this.#listContainer, 'aria-busy', 'true');
		this.#loader = new Loader({
			target: this.#loaderContainer,
			size: 48,
			mode: 'inline',
		});
		void this.#loader.show();
	}

	#hideLoader(): void
	{
		this.#loader?.destroy();
		this.#loader = null;
		this.#loaderContainer?.remove();
		this.#loaderContainer = null;
		if (this.#listContainer !== null)
		{
			Dom.attr(this.#listContainer, 'aria-busy', 'false');
		}
	}

	#renderTitle(): HTMLElement | string
	{
		if (!Type.isStringFilled(this.#title))
		{
			return '';
		}

		return Tag.render`
			<div class="sign-users-popup__title">${Text.encode(this.#title)}</div>
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

	#renderItem(user: UserData): HTMLElement
	{
		const photo = Type.isStringFilled(user?.photo) ? user.photo : '';
		const modifier = photo === '' ? ' sign-users-popup__avatar--empty' : '';
		const style = photo === '' ? '' : `background-image: url('${this.#encodeCssUrl(photo)}')`;
		const item = Tag.render`
			<div class="sign-users-popup__item" data-test-id="sign-users-popup-item">
				<span class="sign-users-popup__avatar${modifier}" style="${style}"></span>
				<span class="sign-users-popup__name">${Text.encode(user?.name ?? '')}</span>
			</div>
		`;

		const userId = Number(user?.id);
		if (Number.isInteger(userId) && userId > 0)
		{
			Event.bind(item, 'click', () => {
				this.#popup?.close();
				void openUserProfile(userId);
			});
		}

		return item;
	}
}
