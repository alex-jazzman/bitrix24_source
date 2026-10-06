/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_designTokens, main_core, main_popup, main_polyfill_intersectionobserver, main_core_events, main_loader) {
	'use strict';

	const allowedProtocols = new Set(['http:', 'https:']);

	// Guards both sinks of an untrusted url: the link href and the avatar background.
	// Parsing collapses obfuscated schemes to a canonical protocol, so the allowlist cannot be bypassed.
	function isAllowedUrl(value) {
		if (!main_core.Type.isStringFilled(value)) {
			return false;
		}
		try {
			return allowedProtocols.has(new URL(value, location.href).protocol);
		} catch {
			return false;
		}
	}
	let intersectionObserver;
	function observeIntersection(entity, callback) {
		if (!intersectionObserver) {
			intersectionObserver = new IntersectionObserver(function (entries) {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						intersectionObserver.unobserve(entry.target);
						const observedCallback = entry.target.observedCallback;
						delete entry.target.observedCallback;
						setTimeout(observedCallback);
					}
				});
			}, {
				threshold: 0
			});
		}
		entity.observedCallback = callback;
		intersectionObserver.observe(entity);

		// A caller that drops its nodes before they ever come into view has to release them itself:
		// the observer is shared and would keep the detached nodes and their callbacks alive.
		return () => {
			intersectionObserver.unobserve(entity);
			delete entity.observedCallback;
		};
	}

	class Pagination extends main_core_events.EventEmitter {
		busy = false;
		finished = true;
		pageNumber = 1;
		constructor(callback) {
			super('disk.users');
			if (callback instanceof Function) {
				this.finished = false;
				this.callback = callback;
			}
		}
		isFinished() {
			return this.finished === true;
		}
		getNext() {
			if (this.busy === true || this.finished === true) {
				return false;
			}
			this.busy = true;
			this.callback(++this.pageNumber).then(({
				data: {
					data,
					getPageCount,
					getCurrentPage
				},
				errors
			}) => {
				this.emit('onGetPage', {
					data,
					getPageCount,
					getCurrentPage
				});
				if (getCurrentPage >= getPageCount) {
					this.finished = true;
					this.emit('onEndPage', {
						getPageCount,
						getCurrentPage
					});
				}
				this.busy = false;
			}, () => {
				this.emit('onError');
				this.busy = false;
			});
		}
	}

	const repo = [];

	// The url parser accepts a lone surrogate, encodeURI throws on it: such an avatar stays unpainted.
	function encodeAvatarUrl(avatar) {
		if (!isAllowedUrl(avatar)) {
			return null;
		}
		try {
			return encodeURI(avatar);
		} catch {
			return null;
		}
	}

	// The url never reaches the markup: it is encoded into a single css url token and applied through cssom,
	// so it cannot close the token or add declarations of its own.
	function renderAvatar(avatar) {
		const node = main_core.Tag.render`<i></i>`;
		const url = encodeAvatarUrl(avatar);
		if (url !== null) {
			main_core.Dom.style(node, 'background', `url("${url}") no-repeat center`);
			main_core.Dom.style(node, 'backgroundSize', 'cover');
		}
		return node;
	}
	class Users {
		/*
		 * @test
		 * @return {*}
		 */
		static get(index) {
			return repo[index > 0 ? index : 0];
		}
		cache = new main_core.Cache.MemoryCache();
		maxCount = 3;
		title = null;
		items = new Map();
		options = {};
		observationReleases = new Set();
		constructor(data, paginationCallback, options) {
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
		addItem(user) {
			user.id = user.id || user.entityId;
			this.items.set(user.id, user);
			return user;
		}
		/**
		 * @private
		 */
		renderFirst() {
			let visibleCount = 0;
			const keys = this.items.keys();
			let key;
			const usersContainer = this.getUserListContainer();
			while (visibleCount < this.maxCount && (key = keys.next().value)) {
				const userNode = this.getUserContainer(this.items.get(key));
				if (!usersContainer.contains(userNode)) {
					usersContainer.appendChild(userNode);
				}
				visibleCount++;
			}
			if (this.items.size > this.maxCount) {
				this.getMoreButton().innerHTML = this.items.size - this.maxCount;
				this.getMoreButton().style.display = 'flex';
				this.getContainer().style.cursor = 'pointer';
			} else {
				this.getMoreButton().style.display = 'none';
				this.getContainer().style.cursor = '';
			}
			if (this.items.size <= 0) {
				this.getContainer().style.display = 'none';
			} else if (this.getContainer().style.display === 'none') {
				this.getContainer().style.display = 'flex';
			}
			this.getContainer().setAttribute('aria-label', this.getAccessibleName());
		}
		/**
		 * @private
		 */
		getUserContainer(user) {
			return this.cache.remember('userContainer' + user['id'], () => {
				return main_core.Tag.render`
				<span class="ui-icon ui-icon-common-user disk-active-user-list-item" title="${main_core.Text.encode(user['name'])}">
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
		observeOnce(entity, callback) {
			const release = observeIntersection(entity, () => {
				this.observationReleases.delete(release);
				callback();
			});
			this.observationReleases.add(release);
		}
		/**
		 * @private
		 */
		releaseObservations() {
			this.observationReleases.forEach(release => release());
			this.observationReleases.clear();
		}
		/**
		 * @private
		 */
		renderPopupUser(user) {
			let wrapper;
			if (isAllowedUrl(user.url)) {
				wrapper = main_core.Tag.render`
				<a href="${user['url']}" class="disk-active-user-popup-item" data-testid="disk-active-user-popup-item">
				</a>
			`;
			} else {
				wrapper = main_core.Tag.render`
				<div class="disk-active-user-popup-item" data-testid="disk-active-user-popup-item">
				</div>
			`;
			}
			const userRow = main_core.Tag.render`
			<div class="ui-icon ui-icon-common-user disk-active-user-popup-icon">
				<i></i>
			</div>
			<div class="disk-active-user-popup-name">${main_core.Text.encode(user['name'])}</div>
		`;
			wrapper.append(...userRow);
			if (user['avatar']) {
				// The roster reaches a hundred rows, so an avatar starts loading only once its row is on screen.
				const placeholder = wrapper.querySelector('.disk-active-user-popup-icon i');
				this.observeOnce(wrapper, () => {
					main_core.Dom.replace(placeholder, renderAvatar(user['avatar']));
				});
			}
			return wrapper;
		}
		/**
		 * @public
		 */
		getContainer() {
			const placeInGrid = this.options.placeInGrid || false;
			return this.cache.remember('mainContainer', () => {
				const style = this.items.size <= 0 ? ' style="display: none;" ' : '';
				const gridModifier = placeInGrid ? 'disk-active-user--grid' : '';
				return main_core.Tag.render`
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
		getAccessibleName() {
			return [...this.items.values()].map(user => user.name).join(', ');
		}

		/**
		 * @private
		 */
		getUserListContainer() {
			return this.cache.remember('users', () => {
				return main_core.Tag.render`
			<span class="disk-active-user-list"></span>`;
			});
		}
		/**
		 * @private
		 */
		getMoreButton() {
			return this.cache.remember('more', () => {
				return main_core.Tag.render`
		<span class="disk-active-user-value" style="display: none;"></span>`;
			});
		}
		/**
		 * @private
		 */
		showPopupUsers() {
			this.getPopup().show();

			// The presence roster reaches a hundred participants, so the rows land in the live DOM in one mutation.
			const fragment = document.createDocumentFragment();
			this.items.forEach(item => {
				fragment.appendChild(this.renderPopupUser(item));
			});
			this.getPopupUsersContainer().appendChild(fragment);
		}
		/**
		 * @private
		 */
		getPopup() {
			if (this.popup) {
				return this.popup;
			}
			this.popup = new main_popup.Popup({
				className: 'disk-active-user-popup',
				ariaLabel: this.getAccessibleName(),
				content: main_core.Tag.render`<div class="disk-active-user-popup-content disk-active-user-popup--grid">
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
				autoHide: true
			});
			this.popup.subscribe('onShow', () => {
				this.getContainer().setAttribute('aria-expanded', 'true');
			});
			this.popup.subscribeOnce('onAfterClose', function () {
				this.getContainer().setAttribute('aria-expanded', 'false');
				this.releaseObservations();
				delete this.popup;
				this.cache.delete('popupUsers');
				this.cache.delete('popupUsersEndBlock');
			}.bind(this));
			return this.popup;
		}
		/**
		 * @private
		 */
		getPopupUsersContainer() {
			return this.cache.remember('popupUsers', () => {
				return document.createElement('div');
			});
		}
		/**
		 * @private
		 */
		getPopupUsersEndBlock() {
			return this.cache.remember('popupUsersEndBlock', () => {
				const res = document.createElement('div');
				if (this.pagination.isFinished()) {
					return res;
				}
				const onclick = this.getNextPage.bind(this);
				res.className = 'disk-active-user-popup-box-pagination-loader';
				res.innerHTML = main_core.Loc.getMessage('JS_DISK_USERS_PAGINATION');
				res.addEventListener('click', onclick);
				this.observeOnce(res, onclick);
				return res;
			});
		}
		/**
		 * @private
		 */
		getNextPage() {
			this.loader = this.loader || new main_loader.Loader({
				target: this.getPopupUsersEndBlock(),
				size: 20
			});
			this.loader.show();
			this.pagination.getNext();
		}
		/**
		 * @private
		 */
		onGetPage({
			data
		}) {
			if (main_core.Type.isArray(data)) {
				data.forEach(item => {
					const user = this.addItem(item);
					this.getPopupUsersContainer().appendChild(this.renderPopupUser(user));
				});
			}
		}
		/**
		 * @private
		 */
		onEndPage() {
			if (this.loader) {
				this.loader.hide();
			}
			this.getPopupUsersEndBlock().style.display = 'none';
		}
		/**
		 * @public
		 */
		addUser(userData) {
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
		replaceUsers(users) {
			this.releaseObservations();
			this.items.forEach((user, userId) => {
				this.cache.delete(`userContainer${userId}`);
			});
			main_core.Dom.clean(this.getUserListContainer());
			this.items = new Map();
			users.forEach(this.addItem.bind(this));
			this.renderFirst();
		}

		/**
		 * @public
		 */
		closePopup() {
			this.popup?.close();
		}
		hasUser(userId) {
			return this.items.has(userId);
		}
		getUser(userId) {
			return this.items.get(userId);
		}
		forEach(fn) {
			this.items.forEach(fn);
		}

		/**
		 * @public
		 */
		deleteUser(userId) {
			if (!this.hasUser(userId)) {
				return;
			}
			const user = this.items.get(userId);
			this.items.delete(userId);
			if (this.cache.has('userContainer' + user['id'])) {
				const usersContainer = this.getUserListContainer();
				const userNode = this.cache.get('userContainer' + userId);
				this.cache.delete('userContainer' + userId);
				if (usersContainer.contains(userNode)) {
					usersContainer.removeChild(userNode);
				}
			}
			this.renderFirst();
		}
	}

	exports.Users = Users;

})(this.BX.Disk = this.BX.Disk || {}, window, BX, BX.Main, BX, BX.Event, BX);
//# sourceMappingURL=users.bundle.js.map
