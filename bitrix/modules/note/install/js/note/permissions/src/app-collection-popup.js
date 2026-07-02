import { Dom, Event, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Dialog } from 'ui.system.dialog';
import { Menu } from 'ui.system.menu';
import 'ui.hint';
import { NotePermissionsMembers } from './app-members';
import {
	ENTITY_ICON_MAP,
	GLOBAL_POLICY_ICON,
	LEVEL_EDIT,
	LEVEL_MANAGE,
	LEVEL_MODERATE,
	LEVEL_NONE,
	LEVEL_VIEW,
	SELECTOR_READY_TIMEOUT_MS,
} from './constants';
import type { PermissionLevel, Member, LevelMenuItem, CollectionPopupOptions } from './type';

export class NotePermissionsCollectionPopup extends NotePermissionsMembers
{
	createCollectionPopup(options: CollectionPopupOptions): void
	{
		const title = this.getCollectionPopupTitle(options);
		const content = this.createCollectionPopupShell();

		const saveButton = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			text: this.getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
			onclick: async () => {
				if (!this.canSaveCollectionPermissions)
				{
					return;
				}

				saveButton.setWaiting(true);
				try
				{
					await this.saveCollectionPopupState();
					this.collectionPopup?.hide?.();
					this.showNotification(this.getMessage('NOTE_PERMISSIONS_POPUP_SAVE_SUCCESS'));
				}
				catch (error)
				{
					console.error('note.permissions: failed to save collection permissions', error);
					this.showNotification(this.getMessage('NOTE_PERMISSIONS_POPUP_SAVE_ERROR'));
				}
				finally
				{
					saveButton.setWaiting(false);
				}
			},
		});
		this.canSaveCollectionPermissions = false;

		this.collectionPopup = new Dialog({
			title,
			content,
			width: 760,
			hasOverlay: true,
			overlay: true,
			centerButtons: [
				saveButton,
				new Button({
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					text: this.getMessage('NOTE_PERMISSIONS_POPUP_CANCEL'),
					onclick: () => this.collectionPopup?.hide(),
				}),
			],
			events: {
				onHide: () => {
					this.destroyCollectionPopup(true);
				},
			},
		});

		this.collectionPopup.show();

		const popupEl = this.collectionPopupBody?.closest('.popup-window');
		if (popupEl)
		{
			Dom.addClass(popupEl, 'note-permissions-dialog');
		}
	}

	createCollectionPopupShell(): HTMLElement
	{
		this.collectionPopupBody = Tag.render`<div class="note-permissions-popup-shell"></div>`;

		return this.collectionPopupBody;
	}

	renderCollectionPopupLoader(): void
	{
		if (!this.collectionPopupBody)
		{
			return;
		}

		this.canSaveCollectionPermissions = false;
		Dom.clean(this.collectionPopupBody);
		Dom.append(Tag.render`
			<div class="note-permissions-popup-loader">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.collectionPopupBody);
	}

	renderCollectionPopupLoadError(): void
	{
		if (!this.collectionPopupBody)
		{
			return;
		}

		this.canSaveCollectionPermissions = false;
		Dom.clean(this.collectionPopupBody);
		Dom.append(Tag.render`
			<div class="note-permissions-popup-loader note-permissions-popup-loader--error">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.collectionPopupBody);
	}

	async renderCollectionPopupContent(requestToken: number): Promise<void>
	{
		if (!this.collectionPopupBody)
		{
			return;
		}

		const shouldWaitForSelector = this.knownMembers.size > 0;
		const { container, selectorReadyPromise } = this.createCollectionPopupContent(shouldWaitForSelector);
		if (shouldWaitForSelector)
		{
			await selectorReadyPromise;
		}

		if (
			requestToken !== this.collectionLoadRequestToken
			|| !this.collectionPopupBody
			|| this.collectionId <= 0
		)
		{
			return;
		}

		Dom.clean(this.collectionPopupBody);
		Dom.append(container, this.collectionPopupBody);
		this.canSaveCollectionPermissions = true;
	}

	createCollectionPopupContent(
		waitForSelector: boolean = false,
	): { container: HTMLElement, selectorReadyPromise: Promise<void> }
	{
		const levelsLabel = this.getMessage('NOTE_PERMISSIONS_POPUP_LEVELS_LABEL');
		const emptyText = this.getMessage('NOTE_PERMISSIONS_POPUP_EMPTY_ROWS');

		const container = Tag.render`
			<div class="note-permissions-popup">
				<div class="note-permissions-popup__section">
					<div class="note-permissions-popup__selector"></div>
				</div>
				<div class="note-permissions-popup__section">
					<div class="note-permissions-popup__label">${levelsLabel}</div>
					<div class="note-permissions-popup__list">
						<div class="note-permissions-popup__global-row"></div>
						<div class="note-permissions-popup__rows"></div>
						<div class="note-permissions-popup__empty">${emptyText}</div>
					</div>
				</div>
			</div>
		`;

		this.collectionRowsContainer = container.querySelector('.note-permissions-popup__rows');
		this.collectionGlobalRowContainer = container.querySelector('.note-permissions-popup__global-row');
		const selectorContainer = container.querySelector('.note-permissions-popup__selector');

		let isSelectorReadyResolved = false;
		let resolveSelectorReady = () => {};

		const markSelectorReady = () => {
			if (isSelectorReadyResolved)
			{
				return;
			}

			isSelectorReadyResolved = true;
			resolveSelectorReady();
		};

		const selectorReadyPromise = new Promise((resolve) => {
			resolveSelectorReady = resolve;
		});

		this.collectionSelector = this.createCollectionSelector({
			onLoad: markSelectorReady,
		});
		this.collectionSelector.renderTo(selectorContainer);
		this.syncKnownMembersFromSelector();
		this.renderMembersRows();

		if (waitForSelector)
		{
			setTimeout(markSelectorReady, SELECTOR_READY_TIMEOUT_MS);
		}
		else
		{
			markSelectorReady();
		}

		return {
			container,
			selectorReadyPromise,
		};
	}

	createCollectionSelector(options: { onLoad?: ?Function } = {}): Object
	{
		const onLoad = Type.isFunction(options?.onLoad) ? options.onLoad : null;
		const preselectedItems: [string, string][] = [];
		for (const member of this.knownMembers.values())
		{
			if (!member.entityId || !member.entityItemId)
			{
				continue;
			}

			preselectedItems.push([member.entityId, member.entityItemId]);
		}

		return new TagSelector({
			multiple: true,
			dialogOptions: {
				context: `NOTE_COLLECTION_PERMISSIONS_${this.collectionId}`,
				entities: [
					{ id: 'user' },
					{ id: 'project' },
					{
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
						},
					},
				],
				preselectedItems,
				events: {
					'Item:onSelect': () => this.syncKnownMembersFromSelector(true),
					'Item:onDeselect': () => this.syncKnownMembersFromSelector(true),
					onLoad: () => {
						this.syncKnownMembersFromSelector();
						onLoad?.();
					},
				},
			},
		});
	}

	renderGlobalPolicyRow(): void
	{
		if (!this.collectionGlobalRowContainer)
		{
			return;
		}

		const globalTitle = this.getMessage('NOTE_PERMISSIONS_POPUP_GLOBAL_ROW_TITLE');
		const hintText = this.getMessage('NOTE_PERMISSIONS_POPUP_PRIORITY_HINT');
		const levelLabel = this.getLevelLabel(this.collectionPolicyLevel);

		const levelButtonText = Tag.render`
			<span class="note-permissions-popup__level-button-text">${levelLabel}</span>
		`;
		const levelButton = Tag.render`
			<button class="note-permissions-popup__level-button" type="button">
				${levelButtonText}
				<span class="note-permissions-popup__level-button-chevron">
					<div class="ui-icon-set --chevron-down-s"></div>
				</span>
			</button>
		`;

		Event.bind(levelButton, 'click', () => {
			this.showPolicyLevelMenu(levelButton, this.collectionPolicyLevel, (newLevel) => {
				this.collectionPolicyLevel = newLevel;
				levelButtonText.textContent = this.getLevelLabel(newLevel);
			});
		});

		const hintNode = BX.UI.Hint.createNode(hintText);

		const row = Tag.render`
			<div class="note-permissions-popup__row note-permissions-popup__row--global">
				<span class="note-permissions-popup__row-icon">
					<div class="ui-icon-set --${GLOBAL_POLICY_ICON}"></div>
				</span>
				<span class="note-permissions-popup__row-title">
					<span class="note-permissions-popup__row-title-text">${globalTitle}</span>
					${hintNode}
				</span>
				<span class="note-permissions-popup__row-controls">
					${levelButton}
					<span class="note-permissions-popup__row-remove-spacer"></span>
				</span>
			</div>
		`;

		Dom.clean(this.collectionGlobalRowContainer);
		Dom.append(row, this.collectionGlobalRowContainer);
	}

	showPolicyLevelMenu(
		bindElement: HTMLElement,
		currentLevel: PermissionLevel,
		onSelect: (level: PermissionLevel) => void,
	): void
	{
		const levels: LevelMenuItem[] = [
			{ value: LEVEL_NONE, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_NONE') },
			{ value: LEVEL_VIEW, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_VIEW') },
			{ value: LEVEL_EDIT, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT') },
		];

		this.#showLevelMenuPopup(bindElement, currentLevel, onSelect, levels);
	}

	showPermissionLevelMenu(
		bindElement: HTMLElement,
		currentLevel: PermissionLevel,
		onSelect: (level: PermissionLevel) => void,
	): void
	{
		const levels: LevelMenuItem[] = [
			{ value: LEVEL_NONE, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_NONE') },
			{ value: LEVEL_VIEW, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_VIEW') },
			{ value: LEVEL_EDIT, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT') },
			{ value: LEVEL_MANAGE, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MANAGE') },
			{ value: LEVEL_MODERATE, title: this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MODERATE') },
		];

		this.#showLevelMenuPopup(bindElement, currentLevel, onSelect, levels);
	}

	#showLevelMenuPopup(
		bindElement: HTMLElement,
		currentLevel: PermissionLevel,
		onSelect: (level: PermissionLevel) => void,
		levels: LevelMenuItem[],
	): void
	{
		const menu = new Menu({
			bindElement,
			closeOnItemClick: true,
			autoHide: true,
			items: levels.map((level) => ({
				title: level.title,
				isSelected: level.value === currentLevel,
				onClick: () => {
					onSelect(level.value);
				},
			})),
		});

		menu.show();
	}

	createMemberRow(member: Member): HTMLElement
	{
		const iconClass = ENTITY_ICON_MAP[member.entityId] || 'o-person';
		const levelLabel = this.getLevelLabel(this.normalizePermissionLevel(member.level));

		const levelButtonText = Tag.render`
			<span class="note-permissions-popup__level-button-text">${levelLabel}</span>
		`;
		const levelButton = Tag.render`
			<button class="note-permissions-popup__level-button" type="button">
				${levelButtonText}
				<span class="note-permissions-popup__level-button-chevron">
					<div class="ui-icon-set --chevron-down-s"></div>
				</span>
			</button>
		`;

		Event.bind(levelButton, 'click', () => {
			const subjectCode = member.subjectCode;
			const known = this.knownMembers.get(subjectCode);
			const unknown = this.unknownMembers.get(subjectCode);
			const currentLevel = this.normalizePermissionLevel(
				known?.level || unknown?.level || LEVEL_NONE,
			);
			this.showPermissionLevelMenu(levelButton, currentLevel, (newLevel) => {
				if (known)
				{
					known.level = newLevel;
				}

				if (unknown)
				{
					unknown.level = newLevel;
				}

				levelButtonText.textContent = this.getLevelLabel(newLevel);
			});
		});

		const removeButton = Tag.render`
			<button
				class="note-permissions-popup__row-remove"
				type="button"
				title="${this.getMessage('NOTE_PERMISSIONS_POPUP_REMOVE_MEMBER')}"
			>
				<span class="note-permissions-popup__row-remove-icon">
					<div class="ui-icon-set --cross-45"></div>
				</span>
			</button>
		`;

		Event.bind(removeButton, 'click', () => {
			this.removeMember(member.subjectCode);
		});

		const row = Tag.render`
			<div class="note-permissions-popup__row note-permissions-popup__row--member">
				<span class="note-permissions-popup__row-icon">
					<div class="ui-icon-set --${iconClass}"></div>
				</span>
				<span class="note-permissions-popup__row-title">
					<span class="note-permissions-popup__row-title-text"></span>
				</span>
				<span class="note-permissions-popup__row-controls">
					${levelButton}
					${removeButton}
				</span>
			</div>
		`;

		const titleTextNode = row.querySelector('.note-permissions-popup__row-title-text');
		titleTextNode.textContent = String(member.title || member.subjectCode || '');

		return row;
	}

	getLevelLabel(level: PermissionLevel): string
	{
		switch (level)
		{
			case LEVEL_MODERATE:
				return this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MODERATE');
			case LEVEL_MANAGE:
				return this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MANAGE');
			case LEVEL_EDIT:
				return this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT');
			case LEVEL_VIEW:
				return this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_VIEW');
			case LEVEL_NONE:
			default:
				return this.getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_NONE');
		}
	}

	renderMembersRows(): void
	{
		if (!this.collectionRowsContainer)
		{
			return;
		}

		this.renderGlobalPolicyRow();

		const members: Member[] = [
			...this.knownMembers.values(),
			...this.unknownMembers.values(),
		];

		members.sort((a, b) => String(a.title).localeCompare(String(b.title)));

		Dom.clean(this.collectionRowsContainer);
		for (const member of members)
		{
			Dom.append(this.createMemberRow(member), this.collectionRowsContainer);
		}

		const emptyContainer = this.collectionRowsContainer
			.parentElement
			?.querySelector('.note-permissions-popup__empty');
		if (emptyContainer)
		{
			Dom.style(emptyContainer, 'display', members.length > 0 ? 'none' : '');
		}
	}
}
