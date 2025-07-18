import { Dom, Loc, Tag, Text as TextFormat, Event, Extension } from 'main.core';
import type { Loader } from 'main.loader';
import { Helpdesk } from 'sign.v2.helper';
import { Dialog, TagSelector, TagItem } from 'ui.entity-selector';
import type { UserPartyOptions } from './type';
import type { CardItem } from './types/card-item';
import { UserPartyCounters } from 'sign.v2.b2e.user-party-counters';
import { UserPartyPopup } from 'sign.v2.b2e.user-party-popup';
import { Api, CountMember } from 'sign.v2.api';
import { FeatureStorage } from 'sign.feature-storage';
import { MemberRole, type MemberRoleType, EntityType } from 'sign.type';
import 'ui.icon-set.main';

import './style.css';

export type UserPartyConfig = {
	region: string,
	b2eSignersLimitCount: number,
}

export type { CardItem };

const Mode = Object.freeze({
	view: 'view',
	edit: 'edit',
});

const defaultAvatarLink = '/bitrix/js/sign/v2/b2e/user-party/images/user.svg';
const departmentAvatarLink = '/bitrix/js/sign/v2/b2e/user-party/images/department.svg';

const HelpdeskCodes = Object.freeze({
	SignEdmWithEmployees: '19740792',
});

export class UserParty
{
	#api: Api;

	#ui = {
		container: HTMLDivElement = null,
		itemContainer: HTMLDivElement = null,
		header: HTMLSpanElement = null,
		description: HTMLParagraphElement = null,
		userPartyCounterContainer: HTMLDivElement = null,
		showMoreSignersContainer: HTMLDivElement = null,
	};

	#items: Map<String, CardItem> = new Map();
	#preselectedUserData: Array<Object> = [];
	#userCount: Number = 0;

	#viewMode = Mode.edit;

	#tagSelector: ?TagSelector = null;
	#loader: ?Loader = null;
	#userPartyCounters: UserPartyCounters = null;

	#documentUid: string = null;

	#userPartyPopup: UserPartyPopup = null;

	#counterDelayTimeout: ?number = null;
	#role: MemberRoleType = MemberRole.signer;

	constructor(options: UserPartyOptions)
	{
		this.#api = new Api();
		this.#viewMode = options.mode;
		this.#role = options.role ?? MemberRole.signer;
		this.#init(options);
	}

	#init(options: UserPartyOptions): void
	{
		if (this.#viewMode === Mode.view)
		{
			this.#ui.container = this.getLayout(options.region);

			return;
		}

		const { b2eSignersLimitCount, region } = options;
		this.#userPartyCounters = new UserPartyCounters({
			userCountersLimit: b2eSignersLimitCount,
		});
		this.#ui.container = this.getLayout(region);

		const tabs = [];
		const entities = [
			{
				id: 'user',
				options: { intranetUsersOnly: true },
			},
			{
				id: 'structure-node',
				options: {
					selectMode: 'usersAndDepartments',
					fillRecentTab: true,
					allowFlatDepartments: true,
				},
			},
		];

		if (FeatureStorage.isDocumentsInSignersSelectorEnabled())
		{
			tabs.push({ id: 'sign-document', title: Loc.getMessage('SIGN_USER_PARTY_TAB_DOCUMENTS') });
			entities.push({ id: 'sign-document' });
		}

		this.#tagSelector = new TagSelector({
			events: {
				onTagRemove: (event) => {
					const { tag } = event.getData();
					this.#removeItem(tag);
				},
				onTagAdd: (event) => {
					const { tag } = event.getData();
					this.#addItem(tag);
				},
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
			},
		});
		this.#tagSelector.renderTo(this.#ui.itemContainer);
	}

	getLayout(region: string): HTMLElement
	{
		if (this.#ui.container)
		{
			return this.#ui.container;
		}

		this.#ui.itemContainer = Tag.render`
			<div class="sign-document-b2e-user-party__item-list"></div>
		`;
		if (this.#viewMode !== Mode.edit)
		{
			Dom.addClass(this.#ui.itemContainer, '--view');

			const link = Tag.render`
				<a href="#">${Loc.getMessage('SIGN_USER_PARTY_VIEW_SHOW_MORE', {
					'#EMPLOYEE_COUNT#': '<span class="--count-placeholder">…</span>',
				})}</a>
			`;

			this.#userPartyPopup = this.#createUserPartyPopup(link);

			Event.bind(link, 'click', (event) => {
				this.#userPartyPopup.setDocumentUid(this.#documentUid).show();
				event.preventDefault();
			});

			this.#ui.showMoreSignersContainer = Tag.render`
				<div class="sign-document-b2e-user-party__item-show_more">
					${link}
				</div>
			`;
			Dom.hide(this.#ui.showMoreSignersContainer);
			Dom.append(this.#ui.showMoreSignersContainer, this.#ui.itemContainer);

			return this.#ui.itemContainer;
		}

		const descriptionMessage = region === 'ru'
			? Helpdesk.replaceLink(Loc.getMessage('SIGN_USER_PARTY_DESCRIPTION'), HelpdeskCodes.SignEdmWithEmployees)
			: Loc.getMessage('SIGN_USER_PARTY_DESCRIPTION_WITHOUT_LINK')
		;
		this.#ui.description = Tag.render`
			<p class="sign-document-b2e-user-party__description">
				${descriptionMessage}
			</p>
		`;

		return Tag.render`
			<div>
				<div class="sign-b2e-settings__header-wrapper">
					<h1 class="sign-b2e-settings__header">${Loc.getMessage('SIGN_USER_PARTY_HEADER')}</h1>
					${this.#userPartyCounters.getLayout()}
				</div>
				<div class="sign-b2e-settings__item">
					<p class="sign-b2e-settings__item_title">
						${Loc.getMessage('SIGN_USER_PARTY_ITEM_TITLE')}
					</p>
					${this.#ui.itemContainer}
					${this.#ui.description}
				</div>
			</div>
		`;
	}

	#createUserPartyPopup(bindElement: HTMLElement): UserPartyPopup
	{
		const isDepartmentsVisible = this.#role === MemberRole.signer;

		return new UserPartyPopup({
			bindElement,
			isDepartmentsVisible,
			role: this.#role,
		});
	}

	async load(ids: number[]): Promise<void>
	{
		const { dialog } = this.#tagSelector;
		dialog.preselectedItems = ids.map((userId) => ['user', userId]);
		const promise = new Promise((resolve) => {
			dialog.subscribeOnce('onLoad', resolve);
		});
		dialog.load();
		await promise;
	}

	async setUserIds(usersData: [Object]): void
	{
		this.#clean();

		const maxShownItems = this.#getViewModeItemsCount();

		this.#userCount = usersData.length;
		this.#preselectedUserData = usersData
			.sort((a, b) => (a.entityType === 'structure-node' ? -1 : 1))
			.slice(0, maxShownItems)
		;

		if (this.#preselectedUserData.length < maxShownItems)
		{
			const membersResponse = await this.#api.getMembersForDocument(
				this.#documentUid,
				1,
				maxShownItems,
				this.#role,
			);
			const preselectedIds = new Set(
				usersData
					.filter((item) => item.entityType === EntityType.USER)
					.map((item) => item.entityId),
			);
			const addMembers = membersResponse.members
				.filter((member) => !preselectedIds.has(member.userId))
				.slice(0, maxShownItems - this.#preselectedUserData.length)
			;
			this.#preselectedUserData = [...this.#preselectedUserData, ...addMembers.map((member) => {
				return { entityType: 'user', entityId: member.userId };
			})];
		}

		// workaround because prepend is used in the interface instead of append
		this.#preselectedUserData.reverse();

		await this.#loadPreselectedUsersData();
		this.#displayShowMoreBtn();
	}

	async #displayShowMoreBtn(): void
	{
		let isShowMoreBtn = false;
		let showMoreCount = 0;
		const shownUsers = this.#preselectedUserData
			.reduce((count, item) => (item.entityType === 'user' ? count + 1 : count), 0)
		;

		if (this.#role === MemberRole.signer)
		{
			const signersCountResponse = await this.#api.getUniqUserCountForDocument(this.#documentUid);
			showMoreCount = signersCountResponse.count - shownUsers;
			isShowMoreBtn = showMoreCount > 0;
		}
		else if (this.#userCount > this.#getViewModeItemsCount())
		{
			isShowMoreBtn = true;
			showMoreCount = this.#userCount - this.#getViewModeItemsCount();
		}

		if (isShowMoreBtn)
		{
			this.#ui.showMoreSignersContainer.querySelector('.--count-placeholder').textContent = showMoreCount;
			Dom.show(this.#ui.showMoreSignersContainer);
		}
		else
		{
			this.#ui.showMoreSignersContainer.querySelector('.--count-placeholder').textContent = 0;
			Dom.hide(this.#ui.showMoreSignersContainer);
		}
	}

	async #loadPreselectedUsersData(): Promise<void>
	{
		this.#showLoader();

		await new Promise((resolve) => {
			const dialog = new Dialog({
				entities: [
					{ id: 'user' },
				],
				events: {
					onLoad: () => {
						dialog.getSelectedItems().forEach((item) => {
							this.#addItem(item);
						});
						resolve();
					},
				},
				preselectedItems: this.#preselectedUserData.map((entity) => {
					return [entity.entityType, entity.entityId];
				}),
			});
			dialog.load();
		});

		this.#hideLoader();
	}

	#showLoader(): void
	{
		this.#ui.itemContainer.style.display = 'none';
		this.#getLoader().show();
	}

	#hideLoader(): void
	{
		this.#ui.itemContainer.style.display = 'flex';
		this.#getLoader().hide();
	}

	#getLoader(): Loader
	{
		if (this.#loader)
		{
			return this.#loader;
		}

		this.#loader = new BX.Loader({
			target: this.#ui.container,
			mode: 'inline',
			size: 40,
		});

		return this.#loader;
	}

	#removeItem(tag: TagItem): void
	{
		const itemKey = this.#makeItemMapKeyByTag(tag);
		const item = this.#items.get(itemKey);
		if (item?.container)
		{
			Dom.remove(item.container);
		}

		this.#items.delete(itemKey);

		this.#updateEditModeCounter();
	}

	#addItem(tag: TagItem): void
	{
		const item = {
			id: tag.id,
			title: tag?.title.text,
			name: tag.customData?.get('name'),
			lastName: tag.customData?.get('lastName'),
			avatar: tag?.avatar,
			entityId: tag.id,
			entityType: tag?.entityId,
		};

		const container = this.#viewMode === Mode.view
			? this.#createItemLayout(item)
			: null
		;
		if (container)
		{
			Dom.prepend(container, this.#ui.itemContainer);
		}

		item.container = container;
		this.#items.set(this.#makeItemMapKeyByTag(tag), item);

		this.#updateEditModeCounter();
	}

	#updateEditModeCounter(): void
	{
		if (this.#viewMode === Mode.edit)
		{
			this.#updateCounterWithDelay(this.#tagSelector.getTags().map((member) => {
				return {
					entityId: member.id,
					entityType: member.entityId,
				};
			}));
		}
	}

	#updateCounterWithDelay(selectedMembers: CountMember[]): void
	{
		clearTimeout(this.#counterDelayTimeout);

		this.#counterDelayTimeout = setTimeout(async () => {
			const response = await this.#api.getUniqUserCountForMembers(selectedMembers);
			this.#userPartyCounters?.update(response.count);
		}, 100);
	}

	validate(): boolean
	{
		this.closeCounterGuide();
		const isValid = this.#items.size > 0 && this.#userPartyCounters.getCount() > 0;
		const tagSelectorContainer = this.#tagSelector.getOuterContainer();
		if (isValid)
		{
			Dom.removeClass(tagSelectorContainer, '--invalid');
		}
		else
		{
			Dom.addClass(tagSelectorContainer, '--invalid');
		}

		return isValid;
	}

	getEntities(): Array<CardItem>
	{
		return [...this.#items.values()];
	}

	resetUserPartyPopup(): void
	{
		this.#userPartyPopup.resetData();
	}

	setDocumentUid(uid: string): void
	{
		this.#documentUid = uid;
	}

	getPreselectedUserData(): Object[]
	{
		return this.#preselectedUserData;
	}

	#createItemLayout(item: CardItem): HTMLElement
	{
		switch (item.entityType)
		{
			case 'structure-node':
				return this.#createDepartmentItemLayout(item);
			case 'sign-document':
				return this.#createDocumentItemLayout(item);
			default:
				return this.#createUserItemLayout(item);
		}
	}

	#createDepartmentItemLayout(item: CardItem): HTMLElement
	{
		const title = TextFormat.encode(item.title);

		return Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --department">
				<div>
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${departmentAvatarLink}' alt="avatar"
					/>
				</div>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
	}

	#createDocumentItemLayout(item: CardItem): HTMLElement
	{
		const title = TextFormat.encode(item.title);

		return Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --document">
				<div>
					<div
						class="sign-document-b2e-user-party__item-list_item-avatar ui-icon-set --document-sign"
						title="${title}" alt="avatar"
					></div>
				</div>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
	}

	#createUserItemLayout(item: CardItem): HTMLElement
	{
		const title = TextFormat.encode(item.title);
		const itemAvatar = item.avatar || defaultAvatarLink;
		const profileLink = `/company/personal/user/${TextFormat.encode(item.entityId)}/`;

		return Tag.render`
			<div class="sign-document-b2e-user-party__item-list_item --user">
				<a href="${profileLink}">
					<img
						class="sign-document-b2e-user-party__item-list_item-avatar"
						title="${title}" src='${TextFormat.encode(itemAvatar)}' alt="avatar"
					/>
				</a>
				<div title="${title}" class="sign-document-b2e-user-party__item-list_item-text">
					${title}
				</div>
			</div>
		`;
	}

	#clean(): void
	{
		this.closeCounterGuide();
		[...this.#items.values()].forEach((item) => Dom.remove(item.container));
		this.#items.clear();
		this.#userPartyCounters?.update(this.#items.size);
	}

	#getViewModeItemsCount(): number
	{
		return 7; // for fixed slider width
	}

	getUniqueUsersCount(): number
	{
		return this.#userPartyCounters?.getCount() ?? 0;
	}

	closeCounterGuide(): void
	{
		this.#userPartyCounters?.closeGuide();
	}

	#makeItemMapKeyByTag(tag: { id: number | string, entityId: string }): string
	{
		const { id, entityId } = tag;

		return `${entityId}_${id}`;
	}
}
