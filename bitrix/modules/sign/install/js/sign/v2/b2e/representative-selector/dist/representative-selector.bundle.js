/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_popup, sign_v2_b2e_userSelector, sign_v2_helper, sign_type) {
	'use strict';

	const defaultAvatarLink = '/bitrix/js/socialnetwork/entity-selector/src/images/default-user.svg';
	const HelpdeskCodes = Object.freeze({
		WhoCanBeRepresentative: '19740734'
	});
	const representativeSelectorMenuButtonId = 'sign-document-b2e-representative_selector_menu_button';
	const activationKeys = new Set(['Enter', ' ']);
	class RepresentativeSelector {
		#userSelector = null;
		#description;
		#isDescriptionVisible = true;
		#isMenuButtonVisible = false;
		#menu = null;
		#dialog = null;
		#uuid;
		#itemType;
		#onDelete;
		#onSelect;
		#onHide;
		#ui = {
			container: HTMLDivElement = null,
			info: {
				container: HTMLDivElement = null,
				avatar: HTMLImageElement = null,
				title: {
					container: HTMLDivElement = null,
					name: HTMLDivElement = null,
					position: HTMLDivElement = null
				}
			},
			changeBtn: {
				container: HTMLDivElement = null,
				element: HTMLDivElement = null
			},
			menuBtn: {
				container: HTMLDivElement = null,
				element: HTMLSpanElement = null
			},
			select: {
				container: HTMLDivElement = null,
				text: HTMLSpanElement = null,
				button: HTMLButtonElement = null
			},
			description: HTMLParagraphElement = null
		};
		#data = {
			id: null,
			name: null,
			position: null,
			avatarLink: null
		};
		constructor(options = {}) {
			this.#data.id = main_core.Type.isInteger(options.userId) ? options.userId : null;
			this.#description = options.description;
			this.#isDescriptionVisible = options.isDescriptionVisible ?? true;
			this.#isMenuButtonVisible = options.isMenuButtonVisible ?? false;
			this.#userSelector = new sign_v2_b2e_userSelector.UserSelector({
				cacheable: options.cacheable,
				multiple: false,
				roleEnabled: options.roleEnabled ?? false,
				context: options.context ?? 'sign_b2e_representative_selector',
				excludedEntityList: options.excludedEntityList ?? []
			});
			const defaultCallback = () => null;
			this.#onDelete = options.onDelete ?? defaultCallback;
			this.#onSelect = options.onSelect ?? defaultCallback;
			this.#onHide = options.onHide ?? defaultCallback;
			this.#ui.container = this.getLayout();
		}
		setExcludedEntityList(excludedEntityList) {
			if (!this.#userSelector) {
				return;
			}
			this.#userSelector.setExcludedEntityList(excludedEntityList);
		}
		getContainerId() {
			if (!this.#uuid) {
				this.#uuid = main_core.Text.getRandom();
			}
			return `sign_b2e_representative_selector_${this.#uuid}`;
		}
		getLayout() {
			if (this.#ui.container) {
				return this.#ui.container;
			}
			this.#ui.info.title.name = main_core.Tag.render`
			<div class="sign-document-b2e-representative-info-user-name"></div>
		`;
			this.#ui.info.title.position = main_core.Tag.render`
			<div class="sign-document-b2e-representative-info-user-pos"></div>
		`;
			this.#ui.info.avatar = main_core.Tag.render`
			<img src="${defaultAvatarLink}">
		`;
			this.#ui.info.title.container = main_core.Tag.render`
			<div class="sign-document-b2e-representative-info-user-title">
				${this.#ui.info.title.name}
				${this.#ui.info.title.position}
			</div>
		`;
			this.#ui.select.text = main_core.Tag.render`
			<span class="sign-document-b2e-representative-select-text">
				${main_core.Loc.getMessage('SIGN_PARTIES_REPRESENTATIVE_SELECT_TEXT')}
			</span>
		`;
			this.#ui.select.button = main_core.Tag.render`
			<button class="ui-btn ui-btn-success ui-btn-xs ui-btn-round">
				${main_core.Loc.getMessage('SIGN_PARTIES_REPRESENTATIVE_SELECT_BUTTON')}
			</button>
		`;
			this.#ui.select.container = main_core.Tag.render`
			<div class="sign-document-b2e-representative-select">
				${this.#ui.select.text}
				${this.#ui.select.button}
			</div>
		`;
			this.#ui.changeBtn.element = main_core.Tag.render`
			<span class="sign-document-b2e-representative-change-btn"></span>
		`;
			this.#ui.changeBtn.container = main_core.Tag.render`
			<div class="sign-document-b2e-representative-change">
				${this.#ui.changeBtn.element}
			</div>
		`;
			this.#ui.menuBtn.container = main_core.Tag.render`
			<div
				id="${representativeSelectorMenuButtonId}"
				class="sign-document-b2e-company-info-edit"
				role="button"
				tabindex="0"
				aria-haspopup="menu"
				aria-expanded="false"
				aria-label="${main_core.Loc.getMessage('SIGN_B2E_REPRESENTATIVE_SELECTOR_DELETE_BUTTON_TITLE')}"
				data-test-id="sign-b2e-representative-selector-menu"
			></div>
		`;

			// No aria-label on the row: it is shown only with a representative inside, so the accessible
			// name comes from the name and position — a static label would hide the selected value.
			this.#ui.info.container = main_core.Tag.render`
			<div
				class="sign-document-b2e-representative-info --clickable"
				role="button"
				tabindex="0"
				aria-haspopup="dialog"
				aria-expanded="false"
				data-test-id="sign-b2e-representative-selector-trigger"
			>
				<div class="sign-document-b2e-representative-info-user-photo">
					${this.#ui.info.avatar}
				</div>
				${this.#ui.info.title.container}
			</div>
		`;
			let description = '';
			if (this.#isDescriptionVisible) {
				description = this.#description ? main_core.Tag.render`<p class="sign-document-b2e-representative__info_paragraph">${this.#description}</p>` : main_core.Tag.render`
					<span>
						${sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_PARTIES_REPRESENTATIVE_INFO'), HelpdeskCodes.WhoCanBeRepresentative)}
					</span>
				`;
			}
			this.#ui.description = main_core.Tag.render`
			<div class="sign-document-b2e-representative__info">
				${description}
			</div>
		`;
			const menuBtn = this.#isMenuButtonVisible ? this.#ui.menuBtn.container : main_core.Tag.render``;
			this.#ui.container = main_core.Tag.render`
			<div id="${this.getContainerId()}">
				<div class="sign-document-b2e-representative__selector">
					${this.#ui.select.container}
					${this.#ui.info.container}
					${this.#ui.changeBtn.container}
					${menuBtn}
				</div>
				${this.#ui.description}
			</div>
		`;
			this.#setEmptyState();
			this.#bindEvents();
			return this.#ui.container;
		}
		#showMenu() {
			const representativeSelectorElement = document.getElementById(this.getContainerId());
			if (representativeSelectorElement === null) {
				return;
			}
			const menuButtonElement = representativeSelectorElement.querySelector(`#${representativeSelectorMenuButtonId}`);
			if (menuButtonElement === null) {
				return;
			}

			// Repeated activation closes the open menu instead of building a second one: closing a fresh
			// instance leaves the shown popup alive and resets its ARIA state.
			if (this.#menu) {
				this.#menu.close();
				return;
			}
			const menu = new main_popup.Menu({
				bindElement: menuButtonElement,
				cacheable: false,
				events: {
					onPopupClose: () => {
						this.#menu = null;
						main_core.Dom.attr(menuButtonElement, 'aria-expanded', 'false');
					}
				}
			});
			this.#menu = menu;
			main_core.Dom.attr(menuButtonElement, 'aria-expanded', 'true');
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SIGN_B2E_REPRESENTATIVE_SELECTOR_DELETE_BUTTON_TITLE'),
				onclick: () => {
					representativeSelectorElement.remove();
					this.#onDelete(this.getContainerId());
					menu.close();
				}
			});
			menu.show();
		}
		formatSelectButton(className) {
			this.#ui.select.button.className = `ui-btn ${className}`;
		}
		#setInfoState() {
			this.#ui.info.container.style.display = 'flex';
			BX.show(this.#ui.changeBtn.container);
			BX.show(this.#ui.description);
			BX.hide(this.#ui.select.container);
		}
		#setEmptyState() {
			BX.hide(this.#ui.info.container);
			BX.hide(this.#ui.changeBtn.container);
			BX.hide(this.#ui.description);
			BX.show(this.#ui.select.container);
		}
		format(id, className) {
			this.#ui[id].className = className;
		}
		validate() {
			const isValid = main_core.Type.isInteger(this.getRepresentativeId()) && this.getRepresentativeId() > 0;
			if (isValid) {
				main_core.Dom.removeClass(this.#ui.container.firstElementChild, '--invalid');
			} else {
				main_core.Dom.addClass(this.#ui.container.firstElementChild, '--invalid');
			}
			return isValid;
		}
		load(representativeId, entityType = sign_type.EntityType.USER) {
			const dialog = this.#userSelector.getDialog();
			dialog.subscribeOnce('onLoad', () => {
				const userItems = dialog.items.get(entityType);
				const userItem = userItems.get(`${representativeId}`);
				userItem.select();
				this.#showItem(userItem);
			});
			dialog.load();
			this.#data.id = representativeId;
			this.#itemType = entityType;
		}
		loadFistRepresentative() {
			const dialog = this.#userSelector.getDialog();
			dialog.subscribeOnce('onLoad', () => {
				const userItems = dialog.items.get('user');
				if (userItems.size === 0) {
					return;
				}
				const firstUserItem = userItems.values().next().value;
				firstUserItem.select();
				this.#showItem(firstUserItem);
			});
			dialog.load();
		}
		getRepresentativeId() {
			return this.#data.id;
		}
		getRepresentativeItemType() {
			return this.#itemType;
		}
		#bindEvents() {
			main_core.Event.bind(this.#ui.info.container, 'click', () => this.#onChangeButtonClickHandler());
			main_core.Event.bind(this.#ui.info.container, 'keydown', event => {
				if (!activationKeys.has(event.key)) {
					return;
				}
				event.preventDefault();
				this.#onChangeButtonClickHandler();
			});
			BX.bind(this.#ui.changeBtn.element, 'click', () => this.#onChangeButtonClickHandler());
			BX.bind(this.#ui.select.button, 'click', () => this.#onChangeButtonClickHandler());
			if (this.#isMenuButtonVisible) {
				main_core.Event.bind(this.#ui.menuBtn.container, 'click', () => this.#showMenu());
				main_core.Event.bind(this.#ui.menuBtn.container, 'keydown', event => {
					if (!activationKeys.has(event.key)) {
						return;
					}
					event.preventDefault();
					this.#showMenu();
				});
			}
			this.#userSelector.subscribe(sign_v2_b2e_userSelector.UserSelectorEvent.onItemSelect, event => this.#onSelectorItemSelectedHandler(event));
			this.#userSelector.subscribe(sign_v2_b2e_userSelector.UserSelectorEvent.onItemDeselect, event => this.onSelectorItemDeselectedHandler(event));
			this.#userSelector.subscribe(sign_v2_b2e_userSelector.UserSelectorEvent.onHide, event => this.#onSelectorDialogHide(event));
		}
		#onChangeButtonClickHandler() {
			// Repeated activation closes the open dialog. Without this, cacheable: false would build
			// a second dialog while the first one is still hiding asynchronously.
			if (this.#dialog?.isOpen()) {
				this.#dialog.hide();
				return;
			}

			// One instance per activation: with cacheable: false every getDialog() call builds a new dialog,
			// so the target node, the state and the shown popup would belong to different objects.
			const dialog = this.#userSelector.getDialog();
			this.#dialog = dialog;
			dialog.setTargetNode(this.#ui.container.firstElementChild);
			main_core.Dom.attr(this.#ui.info.container, 'aria-expanded', 'true');
			dialog.show();
		}
		#onSelectorDialogHide(event) {
			// A stale dialog hides after the current one is already shown — its event must not reset the state.
			if (this.#dialog?.isOpen()) {
				return;
			}
			this.#dialog = null;
			main_core.Dom.attr(this.#ui.info.container, 'aria-expanded', 'false');
			this.#onHide(this.getContainerId());
		}
		#onSelectorItemSelectedHandler(event) {
			this.#onSelect(this.getContainerId());
			if (!event?.data?.items || Number(event?.data?.items?.length) === 0) {
				this.#data.id = null;
				this.#setEmptyState();
				this.#userSelector.setPreselectedEntityList([]);
				return;
			}
			const item = event.data.items[0];
			this.#userSelector.setPreselectedEntityList([{
				id: item.id,
				type: item.entityId
			}]);
			this.#showItem(item);
		}
		#showItem(item) {
			this.#itemType = item.entityId;
			if (item.entityId === sign_type.EntityType.USER) {
				this.#showUserItem(item);
			} else if (item.entityId === sign_type.EntityType.STRUCTURE_NODE_ROLE) {
				this.#showRoleItem(item);
			}
		}
		#showUserItem(item) {
			this.#data.id = item.id;
			if (!main_core.Type.isInteger(this.#data.id) || this.#data.id <= 0) {
				return;
			}
			const name = item.customData?.get('name') ?? '';
			const lastName = item.customData?.get('lastName') ?? '';
			this.#data.name = main_core.Type.isStringFilled(name) ? name : '';
			if (main_core.Type.isStringFilled(lastName)) {
				if (main_core.Type.isStringFilled(name)) {
					this.#data.name += ' ';
				}
				this.#data.name += lastName;
			}
			if (!main_core.Type.isStringFilled(this.#data.name)) {
				this.#data.name = item.customData?.get('login') ?? '';
			}
			this.#data.position = item.customData?.get('position') || '';
			this.#data.avatarLink = item?.avatar || defaultAvatarLink;
			this.#refreshView();
		}
		#showRoleItem(item) {
			this.#data.id = item.id;
			if (!main_core.Type.isInteger(this.#data.id) || this.#data.id <= 0) {
				return;
			}
			this.#data.name = item.title;
			this.#data.avatarLink = defaultAvatarLink;
			this.#data.position = '';
			this.#refreshView();
		}
		onSelectorItemDeselectedHandler(event) {
			this.#data.id = null;
			this.#onSelectorItemSelectedHandler(event);
			this.#userSelector.setPreselectedEntityList([]);
		}
		#refreshView() {
			this.#ui.info.title.name.innerText = main_core.Text.encode(this.#data?.name);
			this.#ui.info.title.position.innerText = main_core.Text.encode(this.#data?.position);
			this.#ui.info.avatar.src = this.#data?.avatarLink;
			this.#setInfoState();
		}
	}

	exports.RepresentativeSelector = RepresentativeSelector;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Main, BX.Sign.V2.B2e, BX.Sign.V2, BX.Sign);
//# sourceMappingURL=representative-selector.bundle.js.map
