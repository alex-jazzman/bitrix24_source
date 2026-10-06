/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, ui_icons_b24, main_core, main_loader, main_popup) {
	'use strict';

	let sidePanelExtensionPromise = null;
	function loadSidePanelExtension() {
		if (sidePanelExtensionPromise === null) {
			sidePanelExtensionPromise = main_core.Runtime.loadExtension('main.sidepanel');
		}
		return sidePanelExtensionPromise;
	}
	async function openUserProfile(userId) {
		try {
			const {
				SidePanel
			} = await loadSidePanelExtension();
			const url = `/company/personal/user/${userId}/`;
			SidePanel.Instance.open(url, {
				cacheable: false
			});
		} catch {
			sidePanelExtensionPromise = null;
		}
	}

	const RENDER_BATCH_SIZE = 50;
	class UsersPopup {
		#users;
		#title;
		#bindElement;
		#popup = null;
		#listContainer = null;
		#renderedCount = 0;
		#nextCursor = null;
		#totalCount;
		#loadUsers;
		#hasMoreRemoteUsers;
		#loading = false;
		#loader = null;
		#loaderContainer = null;
		constructor(options = {}) {
			this.#users = Array.isArray(options.users) ? options.users : [];
			this.#title = options.title ?? '';
			this.#bindElement = options.bindElement ?? null;
			this.#totalCount = main_core.Type.isNumber(options.totalCount) ? options.totalCount : this.#users.length;
			this.#loadUsers = main_core.Type.isFunction(options.loadUsers) ? options.loadUsers : null;
			this.#hasMoreRemoteUsers = this.#loadUsers !== null;
		}
		show() {
			this.#popup = new main_popup.Popup({
				id: `sign-users-popup-${Date.now()}`,
				bindElement: this.#bindElement,
				className: 'sign-users-popup',
				width: 280,
				maxHeight: 320,
				padding: 0,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				content: this.#render()
			});
			this.#popup.show();
			void this.#renderNextBatch();
		}
		#render() {
			const container = main_core.Tag.render`
			<div class="sign-users-popup__container" data-test-id="sign-users-popup">
				${this.#renderTitle()}
				<div class="sign-users-popup__list" aria-busy="false"></div>
			</div>
		`;
			const listContainer = container.querySelector('.sign-users-popup__list');
			if (!(listContainer instanceof HTMLElement)) {
				throw new TypeError('Users popup list container was not rendered');
			}
			this.#listContainer = listContainer;
			this.#renderedCount = 0;
			this.#nextCursor = null;
			this.#hasMoreRemoteUsers = this.#loadUsers !== null;
			main_core.Event.bind(listContainer, 'scroll', () => this.#renderOnScroll());
			return container;
		}
		#renderOnScroll() {
			if (this.#listContainer === null) {
				return;
			}
			const remainingHeight = this.#listContainer.scrollHeight - this.#listContainer.scrollTop - this.#listContainer.clientHeight;
			if (remainingHeight <= 64) {
				void this.#renderNextBatch();
			}
		}
		async #renderNextBatch() {
			if (this.#listContainer === null || this.#loading || this.#renderedCount >= this.#totalCount) {
				return;
			}
			if (this.#loadUsers !== null && this.#hasMoreRemoteUsers && this.#renderedCount >= this.#users.length) {
				this.#loading = true;
				this.#showLoader();
				try {
					const page = await this.#loadUsers(RENDER_BATCH_SIZE, this.#nextCursor);
					const loadedUsers = Array.isArray(page?.users) ? page.users : [];
					this.#users.push(...loadedUsers);
					this.#totalCount = main_core.Type.isNumber(page?.total) ? page.total : this.#totalCount;
					this.#nextCursor = main_core.Type.isNumber(page?.nextCursor) ? page.nextCursor : null;
					this.#hasMoreRemoteUsers = this.#nextCursor !== null;
					if (!this.#hasMoreRemoteUsers) {
						this.#totalCount = this.#users.length;
					}
				} catch {
					this.#totalCount = this.#renderedCount;
				} finally {
					this.#hideLoader();
					this.#loading = false;
				}
			}
			const end = Math.min(this.#renderedCount + RENDER_BATCH_SIZE, this.#users.length, this.#totalCount);
			const fragment = document.createDocumentFragment();
			for (let index = this.#renderedCount; index < end; index++) {
				fragment.append(this.#renderItem(this.#users[index]));
			}
			this.#listContainer.append(fragment);
			this.#renderedCount = end;
		}
		#showLoader() {
			if (this.#listContainer === null || this.#loader !== null) {
				return;
			}
			this.#loaderContainer = main_core.Tag.render`
			<div class="sign-users-popup__loader" data-test-id="sign-users-loader"></div>
		`;
			main_core.Dom.append(this.#loaderContainer, this.#listContainer);
			main_core.Dom.attr(this.#listContainer, 'aria-busy', 'true');
			this.#loader = new main_loader.Loader({
				target: this.#loaderContainer,
				size: 48,
				mode: 'inline'
			});
			void this.#loader.show();
		}
		#hideLoader() {
			this.#loader?.destroy();
			this.#loader = null;
			this.#loaderContainer?.remove();
			this.#loaderContainer = null;
			if (this.#listContainer !== null) {
				main_core.Dom.attr(this.#listContainer, 'aria-busy', 'false');
			}
		}
		#renderTitle() {
			if (!main_core.Type.isStringFilled(this.#title)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="sign-users-popup__title">${main_core.Text.encode(this.#title)}</div>
		`;
		}
		#encodeCssUrl(url) {
			return encodeURI(url).replaceAll("'", '%27').replaceAll('(', '%28').replaceAll(')', '%29');
		}
		#renderItem(user) {
			const photo = main_core.Type.isStringFilled(user?.photo) ? user.photo : '';
			const modifier = photo === '' ? ' sign-users-popup__avatar--empty' : '';
			const style = photo === '' ? '' : `background-image: url('${this.#encodeCssUrl(photo)}')`;
			const item = main_core.Tag.render`
			<div class="sign-users-popup__item" data-test-id="sign-users-popup-item">
				<span class="sign-users-popup__avatar${modifier}" style="${style}"></span>
				<span class="sign-users-popup__name">${main_core.Text.encode(user?.name ?? '')}</span>
			</div>
		`;
			const userId = Number(user?.id);
			if (Number.isInteger(userId) && userId > 0) {
				main_core.Event.bind(item, 'click', () => {
					this.#popup?.close();
					void openUserProfile(userId);
				});
			}
			return item;
		}
	}

	const DEFAULT_MAX_VISIBLE = 3;
	class RoleAvatarStack {
		#users;
		#title;
		#maxVisible;
		#totalCount;
		#loadUsers;
		constructor(options = {}) {
			this.#users = Array.isArray(options.users) ? options.users : [];
			this.#title = options.title ?? '';
			this.#maxVisible = main_core.Type.isNumber(options.maxVisible) ? options.maxVisible : DEFAULT_MAX_VISIBLE;
			this.#totalCount = main_core.Type.isNumber(options.totalCount) ? options.totalCount : this.#users.length;
			this.#loadUsers = main_core.Type.isFunction(options.loadUsers) ? options.loadUsers : null;
		}
		render() {
			if (this.#totalCount === 1 && this.#users.length > 0) {
				return this.#renderSingleUser(this.#users[0]);
			}
			const visible = this.#users.slice(0, this.#maxVisible);
			const restCount = Math.max(0, this.#totalCount - visible.length);
			const container = main_core.Tag.render`
			<span class="sign-role-avatar-stack" data-test-id="sign-role-avatar-stack"></span>
		`;
			visible.forEach(user => main_core.Dom.append(this.#renderAvatar(user), container));
			if (restCount > 0) {
				main_core.Dom.append(main_core.Tag.render`<span class="sign-role-avatar-stack__counter">+${restCount}</span>`, container);
			}
			main_core.Event.bind(container, 'click', event => {
				event.preventDefault();
				event.stopPropagation();
				this.#openPopup(container);
			});
			return container;
		}
		#renderSingleUser(user) {
			const container = main_core.Tag.render`
			<span
				class="sign-role-avatar-stack sign-role-avatar-stack--single"
				data-test-id="sign-role-avatar-stack"
			></span>
		`;
			main_core.Dom.append(this.#renderAvatar(user), container);
			main_core.Dom.append(main_core.Tag.render`<span class="sign-role-avatar-stack__single-name">${main_core.Text.encode(user?.name ?? '')}</span>`, container);
			main_core.Event.bind(container, 'click', event => {
				event.preventDefault();
				event.stopPropagation();
				const userId = Number(user?.id);
				if (Number.isInteger(userId) && userId > 0) {
					void openUserProfile(userId);
				}
			});
			return container;
		}
		#renderAvatar(user) {
			const photo = main_core.Type.isStringFilled(user?.photo) ? user.photo : '';
			if (photo === '') {
				return main_core.Tag.render`
				<span
					class="sign-role-avatar-stack__item ui-icon ui-icon-common-user"
					title="${main_core.Text.encode(user?.name ?? '')}"
				>
					<i></i>
				</span>
			`;
			}
			return main_core.Tag.render`
			<span
				class="sign-role-avatar-stack__item"
				title="${main_core.Text.encode(user?.name ?? '')}"
				style="background-image: url('${this.#encodeCssUrl(photo)}')"
			></span>
		`;
		}
		#encodeCssUrl(url) {
			return encodeURI(url).replaceAll("'", '%27').replaceAll('(', '%28').replaceAll(')', '%29');
		}
		#openPopup(bindElement) {
			new UsersPopup({
				users: this.#loadUsers === null ? this.#users : [],
				totalCount: this.#totalCount,
				loadUsers: this.#loadUsers,
				title: this.#title,
				bindElement
			}).show();
		}
	}

	exports.RoleAvatarStack = RoleAvatarStack;
	exports.UsersPopup = UsersPopup;

})(this.BX.Sign.V2.Grid.Components = this.BX.Sign.V2.Grid.Components || {}, BX, BX, BX, BX.Main);
//# sourceMappingURL=users.bundle.js.map
