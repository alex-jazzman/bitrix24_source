/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, sign_v2_helper, ui_entitySelector, sign_v2_b2e_userPartyCounters, sign_v2_b2e_userPartyPopup, sign_v2_api, sign_featureStorage, sign_type, sign_v2_b2e_userPartyRefused) {
	'use strict';

	const Mode = Object.freeze({
		view: 'view',
		edit: 'edit'
	});
	const avatarLinks = {
		user: '/bitrix/js/sign/v2/b2e/user-party/images/user.svg',
		department: '/bitrix/js/sign/v2/b2e/user-party/images/department.svg',
		document: '/bitrix/js/sign/v2/b2e/user-party/images/sign-document.svg',
		signersList: '/bitrix/js/sign/v2/b2e/user-party/images/signers-list.svg'
	};
	const HelpdeskCodes = Object.freeze({
		SignEdmWithEmployees: '19740792'
	});
	class UserParty {
		#api;
		#ui = {
			container: HTMLDivElement = null,
			itemContainer: HTMLDivElement = null,
			header: HTMLSpanElement = null,
			description: HTMLParagraphElement = null,
			userPartyCounterContainer: HTMLDivElement = null,
			showMoreSignersContainer: HTMLDivElement = null
		};
		#items = new Map();
		#preselectedUserData = [];
		#userCount = 0;
		#viewMode = Mode.edit;
		#tagSelector = null;
		#loader = null;
		#userPartyCounters = null;
		#documentUid = null;
		#userPartyPopup = null;
		#counterDelayTimeout = null;
		#role = sign_type.MemberRole.signer;
		#userPartyRefused;
		constructor(options) {
			this.#api = new sign_v2_api.Api();
			this.#viewMode = options.mode;
			this.#role = options.role ?? sign_type.MemberRole.signer;
			this.#init(options);
		}
		#init(options) {
			if (this.#viewMode === Mode.view) {
				this.#ui.container = this.getLayout(options.region);
				return;
			}
			const {
				b2eSignersLimitCount,
				region
			} = options;
			this.#userPartyCounters = new sign_v2_b2e_userPartyCounters.UserPartyCounters({
				userCountersLimit: b2eSignersLimitCount
			});
			this.#userPartyRefused = new sign_v2_b2e_userPartyRefused.UserPartyRefused();
			this.#userPartyRefused.subscribe('onChange', event => {
				this.#updateEditModeCounter();
			});
			this.#ui.container = this.getLayout(region);
			const tabs = [];
			const entities = [{
				id: 'user',
				options: {
					intranetUsersOnly: true
				}
			}, {
				id: 'structure-node',
				options: {
					selectMode: 'usersAndDepartments',
					fillRecentTab: true,
					allowFlatDepartments: true
				}
			}, {
				id: 'signers-list'
			}];
			if (sign_featureStorage.FeatureStorage.isDocumentsInSignersSelectorEnabled()) {
				entities.push({
					id: 'sign-document'
				});
			}
			const preselectedItems = (options.preselectedSigners ?? []).map(entity => [entity.entityType, entity.entityId]);
			this.#tagSelector = new ui_entitySelector.TagSelector({
				events: {
					onTagRemove: event => {
						const {
							tag
						} = event.getData();
						this.#removeItem(tag);
					},
					onTagAdd: event => {
						const {
							tag
						} = event.getData();
						this.#addItem(tag);
					}
				},
				dialogOptions: {
					width: 425,
					height: 363,
					multiple: true,
					targetNode: this.#ui.itemContainer,
					context: 'sign_b2e_user_party',
					tabs,
					entities,
					dropdownMode: false,
					hideOnDeselect: false,
					preselectedItems
				}
			});
			this.#tagSelector.renderTo(this.#ui.itemContainer);
			if (preselectedItems.length > 0) {
				// the dialog resolves the preselected entities and the selector shows them as cards;
				// further editing of the signers stays the usual selector interaction
				this.#tagSelector.getDialog()?.load();
			}
		}
		getLayout(region) {
			if (this.#ui.container) {
				return this.#ui.container;
			}
			this.#ui.itemContainer = main_core.Tag.render`
			<div class="sign-document-b2e-user-party__item-list"></div>
		`;
			if (this.#viewMode !== Mode.edit) {
				main_core.Dom.addClass(this.#ui.itemContainer, '--view');
				const link = main_core.Tag.render`
				<a href="#">${main_core.Loc.getMessage('SIGN_USER_PARTY_VIEW_SHOW_MORE', {
				'#EMPLOYEE_COUNT#': '<span class="--count-placeholder">…</span>'
			})}</a>
			`;
				this.#userPartyPopup = this.#createUserPartyPopup(link);
				main_core.Event.bind(link, 'click', event => {
					this.#userPartyPopup.setDocumentUid(this.#documentUid).show();
					event.preventDefault();
				});
				this.#ui.showMoreSignersContainer = main_core.Tag.render`
				<div class="sign-document-b2e-user-party__item-show_more">
					${link}
				</div>
			`;
				main_core.Dom.hide(this.#ui.showMoreSignersContainer);
				main_core.Dom.append(this.#ui.showMoreSignersContainer, this.#ui.itemContainer);
				return this.#ui.itemContainer;
			}
			this.#ui.description = this.#renderDescription(region);
			return main_core.Tag.render`
			<div>
				<div class="sign-b2e-settings__header-wrapper">
					<h1 class="sign-b2e-settings__header">${main_core.Loc.getMessage('SIGN_USER_PARTY_HEADER')}</h1>
					${this.userPartyCounters.getLayout()}
				</div>
				<div class="sign-b2e-settings__item">
					${this.#renderTitle()}
					${this.#ui.itemContainer}
					${this.#ui.description}
					${this.userPartyRefused.render() ?? ''}
				</div>
			</div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`
			<p class="sign-b2e-settings__item_title">
				${main_core.Loc.getMessage('SIGN_USER_PARTY_ITEM_TITLE')}
			</p>
		`;
		}
		#renderDescription(region) {
			const descriptionMessage = region === 'ru' ? sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_USER_PARTY_DESCRIPTION'), HelpdeskCodes.SignEdmWithEmployees) : main_core.Loc.getMessage('SIGN_USER_PARTY_DESCRIPTION_WITHOUT_LINK');
			return main_core.Tag.render`
			<p class="sign-document-b2e-user-party__description">
				${descriptionMessage}
			</p>
		`;
		}
		#createUserPartyPopup(bindElement) {
			const isDepartmentsVisible = this.#role === sign_type.MemberRole.signer;
			return new sign_v2_b2e_userPartyPopup.UserPartyPopup({
				bindElement,
				isDepartmentsVisible,
				role: this.#role
			});
		}
		async load(ids) {
			const {
				dialog
			} = this.#tagSelector;
			dialog.preselectedItems = ids.map(userId => ['user', userId]);
			const promise = new Promise(resolve => {
				dialog.subscribeOnce('onLoad', resolve);
			});
			dialog.load();
			await promise;
		}
		async setUserIds(usersData) {
			this.#clean();
			const maxShownItems = this.#getViewModeItemsCount();
			this.#userCount = usersData.length;
			this.#preselectedUserData = usersData.sort((a, b) => a.entityType === 'structure-node' ? -1 : 1).slice(0, maxShownItems);
			const membersResponse = await this.#api.getMembersForDocument(this.#documentUid, 1, maxShownItems, this.#role);

			// filter out refused signers
			if (this.#role === sign_type.MemberRole.signer) {
				const knownUsers = new Set(membersResponse.members.map(member => member.userId));
				this.#preselectedUserData = this.#preselectedUserData.filter(item => {
					return item.entityType === sign_type.EntityType.USER ? knownUsers.has(item.entityId) : true;
				});
			}

			// add signers from lists, departments, etc.
			if (this.#preselectedUserData.length < maxShownItems) {
				const preselectedIds = new Set(usersData.filter(item => item.entityType === sign_type.EntityType.USER).map(item => item.entityId));
				const addMembers = membersResponse.members.filter(member => !preselectedIds.has(member.userId)).slice(0, maxShownItems - this.#preselectedUserData.length);
				this.#preselectedUserData = [...this.#preselectedUserData, ...addMembers.map(member => {
					return {
						entityType: 'user',
						entityId: member.userId
					};
				})];
			}

			// workaround because prepend is used in the interface instead of append
			this.#preselectedUserData.reverse();
			await this.#loadPreselectedUsersData();
			this.#displayShowMoreBtn();
		}
		async #displayShowMoreBtn() {
			let isShowMoreBtn = false;
			let showMoreCount = 0;
			const shownUsers = this.#preselectedUserData.reduce((count, item) => item.entityType === 'user' ? count + 1 : count, 0);
			if (this.#role === sign_type.MemberRole.signer) {
				const signersCountResponse = await this.#api.getUniqUserCountForDocument(this.#documentUid, false);
				showMoreCount = signersCountResponse.count - shownUsers;
				isShowMoreBtn = showMoreCount > 0;
			} else if (this.#userCount > this.#getViewModeItemsCount()) {
				isShowMoreBtn = true;
				showMoreCount = this.#userCount - this.#getViewModeItemsCount();
			}
			if (isShowMoreBtn) {
				this.#ui.showMoreSignersContainer.querySelector('.--count-placeholder').textContent = showMoreCount;
				main_core.Dom.show(this.#ui.showMoreSignersContainer);
			} else {
				this.#ui.showMoreSignersContainer.querySelector('.--count-placeholder').textContent = 0;
				main_core.Dom.hide(this.#ui.showMoreSignersContainer);
			}
		}
		async #loadPreselectedUsersData() {
			this.#showLoader();
			await new Promise(resolve => {
				const dialog = new ui_entitySelector.Dialog({
					entities: [{
						id: 'user'
					}],
					events: {
						onLoad: () => {
							dialog.getSelectedItems().forEach(item => {
								this.#addItem(item);
							});
							resolve();
						}
					},
					preselectedItems: this.#preselectedUserData.map(entity => {
						return [entity.entityType, entity.entityId];
					})
				});
				dialog.load();
			});
			this.#hideLoader();
		}
		#showLoader() {
			this.#ui.itemContainer.style.display = 'none';
			this.#getLoader().show();
		}
		#hideLoader() {
			this.#ui.itemContainer.style.display = 'flex';
			this.#getLoader().hide();
		}
		#getLoader() {
			if (this.#loader) {
				return this.#loader;
			}
			this.#loader = new BX.Loader({
				target: this.#ui.container,
				mode: 'inline',
				size: 40
			});
			return this.#loader;
		}
		#removeItem(tag) {
			const itemKey = this.#makeItemMapKeyByTag(tag);
			const item = this.#items.get(itemKey);
			if (item?.container) {
				main_core.Dom.remove(item.container);
			}
			this.#items.delete(itemKey);
			this.#updateEditModeCounter();
		}
		#addItem(tag) {
			const item = {
				id: tag.id,
				title: tag?.title.text,
				name: tag.customData?.get('name'),
				lastName: tag.customData?.get('lastName'),
				avatar: tag?.avatar,
				entityId: tag.id,
				entityType: tag?.entityId
			};
			const container = this.#viewMode === Mode.view ? this.#createItemLayout(item) : null;
			if (container) {
				main_core.Dom.prepend(container, this.#ui.itemContainer);
			}
			item.container = container;
			this.#items.set(this.#makeItemMapKeyByTag(tag), item);
			this.#updateEditModeCounter();
		}
		#updateEditModeCounter() {
			if (this.#viewMode === Mode.edit) {
				this.#updateCounterWithDelay(this.#tagSelector.getTags().map(member => {
					return {
						entityId: member.id,
						entityType: member.entityId
					};
				}));
			}
		}
		#updateCounterWithDelay(selectedMembers) {
			clearTimeout(this.#counterDelayTimeout);
			this.#counterDelayTimeout = setTimeout(async () => {
				const response = await this.#api.getUniqUserCountForMembers(selectedMembers, this.isRejectExcludedEnabled());
				this.#userPartyCounters?.update(response.count);
			}, 100);
		}
		validate() {
			this.closeCounterGuide();
			const isValid = this.#items.size > 0 && this.#userPartyCounters.getCount() > 0;
			const tagSelectorContainer = this.#tagSelector.getOuterContainer();
			if (isValid) {
				main_core.Dom.removeClass(tagSelectorContainer, '--invalid');
			} else {
				main_core.Dom.addClass(tagSelectorContainer, '--invalid');
			}
			return isValid;
		}
		isRejectExcludedEnabled() {
			return this.#userPartyRefused.shouldRemoveRefused();
		}
		getEntities() {
			return [...this.#items.values()];
		}
		resetUserPartyPopup() {
			this.#userPartyPopup.resetData();
		}
		setDocumentUid(uid) {
			this.#documentUid = uid;
		}
		getPreselectedUserData() {
			return this.#preselectedUserData;
		}
		#createItemLayout(item) {
			switch (item.entityType) {
				case 'structure-node':
					return this.#createDepartmentItemLayout(item);
				case 'sign-document':
					return this.#createDocumentItemLayout(item);
				case 'signers-list':
					return this.#createSignersListItemLayout(item);
				default:
					return this.#createUserItemLayout(item);
			}
		}
		#createDepartmentItemLayout(item) {
			const title = main_core.Text.encode(item.title);
			return main_core.Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --department">
				<div>
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${avatarLinks.department}' alt="avatar"
					/>
				</div>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
		}
		#createDocumentItemLayout(item) {
			const title = main_core.Text.encode(item.title);
			return main_core.Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --document">
				<div>
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${avatarLinks.document}' alt="avatar"
					/>
				</div>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
		}
		#createSignersListItemLayout(item) {
			const title = main_core.Text.encode(item.title);
			return main_core.Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --signers-list">
				<div>
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${avatarLinks.signersList}' alt="avatar"
					/>
				</div>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
		}
		#createUserItemLayout(item) {
			const title = main_core.Text.encode(item.title);
			const itemAvatar = item.avatar || avatarLinks.user;
			const profileLink = `/company/personal/user/${item.entityId}/`;
			return main_core.Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --user">
				<a href="${main_core.Text.encode(profileLink)}">
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${main_core.Text.encode(itemAvatar)}' alt="avatar"
					/>
				</a>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
		}
		#clean() {
			this.closeCounterGuide();
			[...this.#items.values()].forEach(item => main_core.Dom.remove(item.container));
			this.#items.clear();
			this.#userPartyCounters?.update(this.#items.size);
		}
		#getViewModeItemsCount() {
			return 7; // for fixed slider width
		}
		getUniqueUsersCount() {
			return this.#userPartyCounters?.getCount() ?? 0;
		}
		closeCounterGuide() {
			this.#userPartyCounters?.closeGuide();
		}
		#makeItemMapKeyByTag(tag) {
			const {
				id,
				entityId
			} = tag;
			return `${entityId}_${id}`;
		}

		/**
		 * @protected
		 */
		get userPartyCounters() {
			return this.#userPartyCounters;
		}

		/**
		 * @protected
		 */
		get userPartyRefused() {
			return this.#userPartyRefused;
		}

		/**
		 * @protected
		 */
		get ui() {
			return this.#ui;
		}
	}

	exports.UserParty = UserParty;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Sign.V2, BX.UI.EntitySelector, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2, BX.Sign, BX.Sign, BX.Sign.V2.B2e);
//# sourceMappingURL=user-party.bundle.js.map
