import {Cache, Dom, Loc, Type, Text, Tag} from "main.core";
import {Popup} from "main.popup";
import {observeIntersection, isAllowedUrl} from './utils';
import Pagination from './pagination';
import {Loader} from 'main.loader';

type UserType = {
	id: Number,
	entityId: ?Number,
	url: ?String,
	avatar: ?String,
	name: String
};

const repo = [];

// The url parser accepts a lone surrogate, encodeURI throws on it: such an avatar stays unpainted.
function encodeAvatarUrl(avatar: ?String): ?String
{
	if (!isAllowedUrl(avatar))
	{
		return null;
	}

	try
	{
		return encodeURI(avatar);
	}
	catch
	{
		return null;
	}
}

// The url never reaches the markup: it is encoded into a single css url token and applied through cssom,
// so it cannot close the token or add declarations of its own.
function renderAvatar(avatar: ?String): HTMLElement
{
	const node = Tag.render`<i></i>`;
	const url = encodeAvatarUrl(avatar);

	if (url !== null)
	{
		Dom.style(node, 'background', `url("${url}") no-repeat center`);
		Dom.style(node, 'backgroundSize', 'cover');
	}

	return node;
}

export default class Users {
	/*
	 * @test
	 * @return {*}
	 */
	static get(index)
	{
		return repo[index > 0 ? index : 0];
	}

	cache = new Cache.MemoryCache();
	maxCount = 3;
	popup: ?Popup;
	pagination: Pagination;
	loader: ?Loader;
	title: ?String = null;
	items: Map = new Map();
	options = {};
	observationReleases: Set<Function> = new Set();

	constructor(data: UserType[], paginationCallback: ?Function, options: {})
	{
		this.options = options || {};

		data.forEach(this.addItem.bind(this));
		this.renderFirst();

		this.pagination = new Pagination(paginationCallback);
		this.pagination.subscribe('onGetPage', this.onGetPage.bind(this));
		this.pagination.subscribe('onEndPage', this.onEndPage.bind(this));
		repo.push(this);
	}

	/**
	 * @private
	 */
	addItem(user: UserType): UserType
	{
		user.id = user.id || user.entityId;
		this.items.set(user.id, user);

		return user;
	}
	/**
	 * @private
	 */
	renderFirst()
	{
		let visibleCount = 0;
		const keys = this.items.keys();

		let key;
		const usersContainer = this.getUserListContainer();
		while (
			(visibleCount < this.maxCount)
			&&
			(key = keys.next().value)
		)
		{
			const userNode = this.getUserContainer(this.items.get(key));
			if (!usersContainer.contains(userNode))
			{
				usersContainer.appendChild(
					userNode
				);
			}
			visibleCount++;
		}

		if (this.items.size > this.maxCount)
		{
			this.getMoreButton().innerHTML = this.items.size - this.maxCount;
			this.getMoreButton().style.display = 'flex';
			this.getContainer().style.cursor = 'pointer';
		}
		else
		{
			this.getMoreButton().style.display = 'none';
			this.getContainer().style.cursor = '';
		}

		if (this.items.size <= 0)
		{
			this.getContainer().style.display = 'none';
		}
		else if (this.getContainer().style.display === 'none')
		{
			this.getContainer().style.display = 'flex';
		}

		this.getContainer().setAttribute('aria-label', this.getAccessibleName());
	}
	/**
	 * @private
	 */
	getUserContainer(user: UserType)
	{
		return this.cache.remember('userContainer' + user['id'], () => {
			return Tag.render`
				<span class="ui-icon ui-icon-common-user disk-active-user-list-item" title="${Text.encode(user['name'])}">
					${renderAvatar(user['avatar'])}
				</span>
			`;
		});
	}
	/**
	 * Keeps the pending observation releasable: the popup discards its rows on close while most of
	 * them are still below the fold, and the observer behind them is shared with every other list.
	 *
	 * @private
	 */
	observeOnce(entity: HTMLElement, callback: Function)
	{
		const release = observeIntersection(entity, () => {
			this.observationReleases.delete(release);
			callback();
		});

		this.observationReleases.add(release);
	}
	/**
	 * @private
	 */
	releaseObservations()
	{
		this.observationReleases.forEach((release) => release());
		this.observationReleases.clear();
	}
	/**
	 * @private
	 */
	renderPopupUser(user: UserType)
	{
		let wrapper;
		if (isAllowedUrl(user.url))
		{
			wrapper = Tag.render`
				<a href="${user['url']}" class="disk-active-user-popup-item" data-testid="disk-active-user-popup-item">
				</a>
			`;
		}
		else
		{
			wrapper = Tag.render`
				<div class="disk-active-user-popup-item" data-testid="disk-active-user-popup-item">
				</div>
			`;
		}

		const userRow = Tag.render`
			<div class="ui-icon ui-icon-common-user disk-active-user-popup-icon">
				<i></i>
			</div>
			<div class="disk-active-user-popup-name">${Text.encode(user['name'])}</div>
		`;

		wrapper.append(...userRow);

		if (user['avatar'])
		{
			// The roster reaches a hundred rows, so an avatar starts loading only once its row is on screen.
			const placeholder = wrapper.querySelector('.disk-active-user-popup-icon i');
			this.observeOnce(wrapper, () => {
				Dom.replace(placeholder, renderAvatar(user['avatar']));
			});
		}

		return wrapper;
	}
	/**
	 * @public
	 */
	getContainer()
	{
		const placeInGrid = this.options.placeInGrid || false;

		return this.cache.remember('mainContainer', () => {
			const style = this.items.size <= 0 ? ' style="display: none;" ' : '';
			const gridModifier = placeInGrid? 'disk-active-user--grid' : '';

			return Tag.render`
		<button
			type="button"
			class="disk-active-user-box ${gridModifier}"
			${style}
			aria-expanded="false"
			aria-haspopup="dialog"
			onclick="${this.showPopupUsers.bind(this)}"
		>
			<span class="disk-active-user">
				<span class="disk-active-user-inner">
					${this.getUserListContainer()}
					${this.getMoreButton()}
				</span>
			</span>
		</button>`;
		});
	}

	getAccessibleName(): string
	{
		return [...this.items.values()]
			.map((user) => user.name)
			.join(', ');
	}

	/**
	 * @private
	 */
	getUserListContainer()
	{
		return this.cache.remember('users', () => {
			return Tag.render`
			<span class="disk-active-user-list"></span>`;
		});
	}
	/**
	 * @private
	 */
	getMoreButton()
	{
		return this.cache.remember('more', () => {
			return Tag.render`
		<span class="disk-active-user-value" style="display: none;"></span>`;
		});
	}
	/**
	 * @private
	 */
	showPopupUsers()
	{
		this.getPopup().show();

		// The presence roster reaches a hundred participants, so the rows land in the live DOM in one mutation.
		const fragment = document.createDocumentFragment();
		this.items.forEach(
			(item) => {
				fragment.appendChild(this.renderPopupUser(item));
			}
		);
		this.getPopupUsersContainer().appendChild(fragment);
	}
	/**
	 * @private
	 */
	getPopup()
	{
		if (this.popup)
		{
			return this.popup;
		}

		this.popup = new Popup({
			className: 'disk-active-user-popup',
			ariaLabel: this.getAccessibleName(),
			content: Tag.render`<div class="disk-active-user-popup-content disk-active-user-popup--grid">
				${this.title ? `<div class="disk-active-user-popup-title">${this.title}</div>` : ''}
				<div class="disk-active-user-popup-box">
					<div class="disk-active-user-popup-inner">
						${this.getPopupUsersContainer()}
						${this.getPopupUsersEndBlock()}
					</div>
				</div>
			</div>`,
			bindElement: this.getContainer(),
			closeByEsc: true,
			autoHide: true,
		});
		this.popup.subscribe('onShow', () => {
			this.getContainer().setAttribute('aria-expanded', 'true');
		});
		this.popup.subscribeOnce('onAfterClose', function() {
			this.getContainer().setAttribute('aria-expanded', 'false');
			this.releaseObservations();
			delete this.popup;
			this.cache.delete('popupUsers');
			this.cache.delete('popupUsersEndBlock');
		}.bind(this));
		return this.popup
	}
	/**
	 * @private
	 */
	getPopupUsersContainer()
	{
		return this.cache.remember('popupUsers', () => {
			return document.createElement('div');
		});
	}
	/**
	 * @private
	 */
	getPopupUsersEndBlock()
	{
		return this.cache.remember('popupUsersEndBlock', () => {
			const res = document.createElement('div');

			if (this.pagination.isFinished())
			{
				return res;
			}

			const onclick = this.getNextPage.bind(this);
			res.className = 'disk-active-user-popup-box-pagination-loader';
			res.innerHTML = Loc.getMessage('JS_DISK_USERS_PAGINATION');
			res.addEventListener('click', onclick);
			this.observeOnce(res, onclick);
			return res;
		});
	}
	/**
	 * @private
	 */
	getNextPage()
	{
		this.loader = (this.loader || new Loader({target: this.getPopupUsersEndBlock(), size: 20}));
		this.loader.show();
		this.pagination.getNext();
	}
	/**
	 * @private
	 */
	onGetPage({data})
	{
		if (Type.isArray(data))
		{
			data.forEach((item: UserType) => {
				const user = this.addItem(item);
				this.getPopupUsersContainer()
					.appendChild(this.renderPopupUser(user))
			});
		}
	}
	/**
	 * @private
	 */
	onEndPage()
	{
		if (this.loader)
		{
			this.loader.hide();
		}
		this.getPopupUsersEndBlock().style.display = 'none';
	}
	/**
	 * @public
	 */
	addUser(userData: UserType)
	{
		this.addItem(userData);
		this.renderFirst();
	}

	/**
	 * Swaps the whole list in one render. Doing it through addUser()/deleteUser() per user costs a
	 * renderFirst() pass each time, so a single join or leave would re-walk the collection 2N times.
	 * Every cached node is dropped, otherwise a renamed or re-avatared user keeps the stale one.
	 *
	 * @public
	 */
	replaceUsers(users: UserType[])
	{
		this.releaseObservations();

		this.items.forEach((user, userId) => {
			this.cache.delete(`userContainer${userId}`);
		});

		Dom.clean(this.getUserListContainer());
		this.items = new Map();
		users.forEach(this.addItem.bind(this));
		this.renderFirst();
	}

	/**
	 * @public
	 */
	closePopup()
	{
		this.popup?.close();
	}

	hasUser(userId: number)
	{
		return this.items.has(userId);
	}

	getUser(userId: number)
	{
		return this.items.get(userId);
	}

	forEach(fn)
	{
		this.items.forEach(fn);
	}

	/**
	 * @public
	 */
	deleteUser(userId)
	{
		if (!this.hasUser(userId))
		{
			return;
		}

		const user = this.items.get(userId);
		this.items.delete(userId);
		if (this.cache.has('userContainer' + user['id']))
		{
			const usersContainer = this.getUserListContainer();
			const userNode = this.cache.get('userContainer' + userId);
			this.cache.delete('userContainer' + userId)

			if (usersContainer.contains(userNode))
			{
				usersContainer.removeChild(userNode);
			}
		}
		this.renderFirst();
	}
}
