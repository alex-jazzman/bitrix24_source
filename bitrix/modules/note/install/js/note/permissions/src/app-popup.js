import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { PopupManager } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Hint } from 'ui.hint';
import { Checkbox, CheckboxSize } from 'ui.system.checkbox';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';
import { NotePermissionsMembers } from './app-members';
import {
	ENTITY_TYPE_META_USER,
	META_USER_ALL_USERS,
	SCOPE_DOCUMENT,
	SCOPE_SUBTREE,
} from './constants';
import type { LevelSection, Member, PermissionLevel } from './type';

export class NotePermissionsPopup extends NotePermissionsMembers
{
	createPopup(): void
	{
		const content = this.createPopupShell();

		const primaryButton = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			text: this.popupConfig.primaryButtonText
				|| this.getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
			// Identity for tests: the footer buttons are otherwise reachable only through
			// ui.system.dialog internals (`.ui-system-dialog__footer button.--style-filled`).
			dataset: { testid: 'note-permissions-save' },
			onclick: () => {
				if (!this.canSavePermissions)
				{
					return;
				}

				void this.handlePrimaryAction();
			},
		});
		primaryButton.setDisabled(true);
		this.canSavePermissions = false;
		this.primaryButton = primaryButton;

		const cancelButton = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			text: this.getMessage('NOTE_PERMISSIONS_POPUP_CANCEL'),
			dataset: { testid: 'note-permissions-cancel' },
			onclick: () => this.popup?.hide(),
		});

		this.popup = new Dialog({
			title: this.popupConfig.dialogTitle || '',
			content,
			width: 700,
			hasOverlay: true,
			overlay: true,
			hasCloseButton: false,
			hasVerticalPadding: false,
			hasHorizontalPadding: false,
			rightButtons: [cancelButton, primaryButton],
			events: {
				onHide: () => {
					Hint.hide();
					this.destroyPopup(true);
				},
			},
		});

		this.popup.show();

		const popupEl = this.popupBody?.closest('.popup-window');
		if (popupEl)
		{
			Dom.addClass(popupEl, 'note-permissions-dialog');
			Dom.addClass(popupEl, NoteThemeContext.resolveDesignSystemContext(this.popupTheme));
			// `note-permissions-dialog` sets height:600px after the first adjust ran on a smaller popup; recenter.
			PopupManager.getPopupById(popupEl.id)?.adjustPosition({ forceBindPosition: true });
		}
	}

	async handlePrimaryAction(): Promise<void>
	{
		if (!this.popupConfig || !this.primaryButton)
		{
			return;
		}

		this.primaryButton.setWaiting(true);
		try
		{
			const state = this.collectStateForSave();
			await this.popupConfig.save(state);
			this.showNotification(this.popupConfig.successMessage);
			this.popup?.hide?.();
		}
		catch (error)
		{
			console.error('note.permissions: failed to save', error);
			const fallbackMessage = error?.noteRollbackFailed
				? this.getMessage('NOTE_PERMISSIONS_POPUP_ROLLBACK_FAILED')
				: '';
			this.showNotification(fallbackMessage || this.popupConfig.errorMessage);
		}
		finally
		{
			this.primaryButton?.setWaiting(false);
		}
	}

	createPopupShell(): HTMLElement
	{
		this.popupBody = Tag.render`<div class="note-permissions-popup-shell"></div>`;

		return this.popupBody;
	}

	renderPopupLoader(): void
	{
		if (!this.popupBody)
		{
			return;
		}

		this.canSavePermissions = false;
		this.primaryButton?.setDisabled(true);
		Dom.clean(this.popupBody);
		Dom.append(Tag.render`
			<div class="note-permissions-popup-loader">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.popupBody);
	}

	renderPopupLoadError(): void
	{
		if (!this.popupBody)
		{
			return;
		}

		this.canSavePermissions = false;
		this.primaryButton?.setDisabled(true);
		Dom.clean(this.popupBody);
		Dom.append(Tag.render`
			<div class="note-permissions-popup-loader note-permissions-popup-loader--error">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.popupBody);
	}

	async renderPopupContent(): Promise<void>
	{
		if (!this.popupBody || !this.popupConfig)
		{
			return;
		}

		const container = this.buildPopupContainer();
		Dom.clean(this.popupBody);
		Dom.append(container, this.popupBody);

		this.mountSections();

		this.canSavePermissions = true;
		this.updateValidationState();

		this.popupNameInput?.focus();
	}

	buildPopupContainer(): HTMLElement
	{
		const container = Tag.render`
			<div class="note-permissions-popup">
				<div class="note-permissions-popup__sections"></div>
			</div>
		`;

		if (this.popupConfig?.name?.visible)
		{
			const initialValue = String(this.popupConfig.name.initialValue || '');
			const placeholder = String(this.popupConfig.name.placeholder || '');
			const nameBlock = Tag.render`
				<div class="note-permissions-popup__name">
					<div class="note-permissions-popup__name-field">
						<input
							type="text"
							class="note-permissions-popup__name-input"
							placeholder="${placeholder}"
							maxlength="255"
						/>
						<span class="ui-icon-set --edit-m note-permissions-popup__name-icon" aria-hidden="true"></span>
					</div>
				</div>
			`;
			const input = nameBlock.querySelector('.note-permissions-popup__name-input');
			input.value = initialValue;
			this.popupName = initialValue;
			this.popupNameInput = input;

			Event.bind(input, 'input', () => {
				this.popupName = input.value;
				this.updateValidationState();
			});

			Event.bind(input, 'keydown', (event) => {
				if (event.key === 'Enter' && this.canSavePermissions)
				{
					event.preventDefault();
					void this.handlePrimaryAction();
				}
			});

			Dom.prepend(nameBlock, container);
		}
		else
		{
			this.popupName = '';
			this.popupNameInput = null;
		}

		const scopeBlock = this.buildScopeBlock();
		if (scopeBlock)
		{
			// Scope control sits above the level sections, next to the document identity.
			Dom.prepend(scopeBlock, container);
		}

		this.sectionsContainer = container.querySelector('.note-permissions-popup__sections');

		return container;
	}

	// Subtree-scope checkbox: document mode only and only once the server confirms the
	// feature is available. A single toggle drives every editable grant uniformly.
	// `ui.system.checkbox` wraps a real <input type="checkbox">, so keyboard access and the
	// accessible name come from the platform — no ARIA augmentation needed here.
	buildScopeBlock(): HTMLElement | null
	{
		this.scopeCheckbox = null;

		if (this.popupConfig?.kind !== 'document' || !this.subtreeAvailable)
		{
			return null;
		}

		// Reflect an existing subtree grant so the initial state matches the data; a
		// mixed hydrated state stays untouched until the user explicitly flips the toggle.
		this.subtreeScopeEnabled = this.hasSubtreeMember();

		const inputId = `note-permissions-scope-${Number(this.popupConfig?.targetId) || 0}`;
		const titleText = this.getMessage('NOTE_PERMISSIONS_POPUP_SCOPE_TITLE');
		const hintText = this.getMessage('NOTE_PERMISSIONS_POPUP_SCOPE_HINT');

		const checkbox = new Checkbox({
			checked: this.subtreeScopeEnabled,
			size: CheckboxSize.Md,
			attributes: { id: inputId },
			onChange: ({ checked }) => this.handleScopeToggle(checked === true),
		});

		// The checkbox renders its own <label> around the box, so the caption is a sibling
		// <label for>, not a wrapper — nesting labels would be invalid markup.
		const block = Tag.render`
			<div class="note-permissions-popup__scope">
				${checkbox.render()}
				<label class="note-permissions-popup__scope-text" for="${inputId}">
					<span class="note-permissions-popup__scope-title">${titleText}</span>
					<span class="note-permissions-popup__scope-hint">${hintText}</span>
				</label>
			</div>
		`;

		this.scopeCheckbox = checkbox;

		return block;
	}

	handleScopeToggle(enabled: boolean): void
	{
		this.subtreeScopeEnabled = enabled === true;
		this.applyScopeToEditableMembers(this.subtreeScopeEnabled ? SCOPE_SUBTREE : SCOPE_DOCUMENT);
	}

	mountSections(): void
	{
		if (!this.sectionsContainer || !this.popupConfig)
		{
			return;
		}

		this.sectionSelectors = {};

		Dom.clean(this.sectionsContainer);

		for (const section of this.popupConfig.sections)
		{
			const block = this.buildSectionBlock(section);
			Dom.append(block, this.sectionsContainer);
		}
	}

	buildSectionBlock(section: LevelSection): HTMLElement
	{
		const titleText = String(section.title || '');
		const titleNode = Tag.render`
			<div class="note-permissions-popup__section-title">
				<span class="note-permissions-popup__section-title-text">${titleText}</span>
			</div>
		`;

		if (section.required)
		{
			const titleTextNode = titleNode.querySelector('.note-permissions-popup__section-title-text');
			Dom.append(
				Tag.render`<span class="note-permissions-popup__section-title-required" aria-hidden="true">*</span>`,
				titleTextNode,
			);
		}

		const hintText = String(section.hintText || '').trim();
		if (hintText)
		{
			const hintNode = Hint.createNode(hintText);
			if (hintNode)
			{
				Dom.addClass(hintNode, 'note-permissions-popup__section-title-hint');
				Dom.append(hintNode, titleNode);
			}
		}

		const selectorContainer = Tag.render`<div class="note-permissions-popup__selector"></div>`;

		const block = Tag.render`
			<div class="note-permissions-popup__section" data-level="${section.level}">
				${titleNode}
				${selectorContainer}
			</div>
		`;

		const selector = this.createSectionSelector(section);
		selector.renderTo(selectorContainer);
		this.applyThemeToSelector(selector);
		// Covers tags that were already materialised before `onAfterTagAdd` was subscribed.
		this.decorateInheritedTags(selector, section.level);

		this.sectionSelectors[section.level] = selector;

		return block;
	}

	applyThemeToSelector(selector: Object): void
	{
		// TagSelector hardcodes `--ui-context-content-light` on its outer container
		// (entity-selector/src/tag-selector/tag-selector.js); rewrite it to the active note theme.
		const outer = selector?.getOuterContainer?.();
		if (!outer)
		{
			return;
		}

		Dom.removeClass(outer, '--ui-context-content-light');
		Dom.removeClass(outer, '--ui-context-content-dark');
		Dom.addClass(outer, NoteThemeContext.getDesignSystemContext());
	}

	createSectionSelector(section: LevelSection): Object
	{
		const preselectedItems = this.buildPreselectedItems(section.level);
		// Inherited grants ride in as ordinary preselected items — that is what resolves their
		// real names through the entity providers — but `undeselectedItems` makes the platform
		// render them without a remove cross and refuse deselection.
		const undeselectedItems = this.buildInheritedItems(section.level);
		const entities = this.buildEntitiesForSection();

		const isMobile = document.documentElement.classList.contains('note-mobile');

		let scrollSyncHandler = null;

		const tagSelector = new TagSelector({
			multiple: true,
			addButtonCaption: this.getMessage('NOTE_PERMISSIONS_POPUP_ADD'),
			dialogOptions: {
				context: `${this.popupConfig.tagSelectorContext}_${String(section.level).toUpperCase()}`,
				entities,
				preselectedItems,
				undeselectedItems,
				height: isMobile ? 280 : 420,
				// Disable keyboard-focus on the first list item: after every ajax load and on tab change
				// Dialog calls focusOnFirstNode() → itemNode.focus(), which blurs the textbox and
				// dismisses the mobile soft keyboard mid-typing. Keyboard navigation isn't relevant on
				// touch devices anyway.
				focusOnFirst: isMobile ? false : undefined,
				popupOptions: {
					className: `${NoteThemeContext.getDesignSystemContext()} note-permissions-tag-selector-popup`,
				},
				// dialog.handleAutoHide(entity-selector/dialog.js) returns true (close) for any outside
				// click except inside the popup or a non-empty textbox. On mobile that means tapping the
				// empty textbox closes the dropdown AND auto-hides the textbox via handlePopupAfterClose
				// → hideTextBox(). Override so any tap within the tag-selector container keeps it open.
				autoHideHandler: isMobile
					? (event, dialog) => {
						const tsContainer = dialog?.getTagSelector?.()?.getContainer?.();
						if (tsContainer && event?.target instanceof Node && tsContainer.contains(event.target))
						{
							return false;
						}

						return true;
					}
					: undefined,
				events: {
					'Item:onSelect': (event) => {
						this.handleItemSelect(section.level, event);
					},
					'Item:onDeselect': (event) => {
						this.handleItemDeselect(section.level, event);
					},
					'onShow': (event) => {
						const dialog = event?.getTarget?.();

						scrollSyncHandler = (scrollEvent) => {
							const popup = dialog?.getPopup?.();
							const popupEl = popup?.getPopupContainer?.();
							if (popupEl && scrollEvent.target instanceof Node && popupEl.contains(scrollEvent.target))
							{
								return;
							}
							popup?.adjustPosition?.({ forceBindPosition: true });
						};
						document.addEventListener('scroll', scrollSyncHandler, { capture: true, passive: true });
					},
					'onHide': () => {
						if (scrollSyncHandler)
						{
							document.removeEventListener('scroll', scrollSyncHandler, true);
							scrollSyncHandler = null;
						}
					},
				},
			},
			events: {
				// Preselected items resolve asynchronously through the providers, so inherited
				// tags appear after construction — this is where their "inherited" hint is attached.
				onAfterTagAdd: (event) => {
					this.decorateInheritedTag(section.level, event?.getData?.()?.tag);
				},
			},
		});

		if (isMobile)
		{
			// Suppress every programmatic focus on the textbox. TagSelector.handleAddButtonClick
			// calls focusTextBox synchronously (input.focus()) which on mobile pops the soft keyboard
			// the user didn't ask for. Dialog also calls focusTextBox via focusSearch from popup show
			// (double-rAF), every ajax load, Item:onSelect, tag remove, tab switch — each re-focus on
			// an already-focused input dismisses the keyboard. Patch must be installed at construction
			// time, before handleAddButtonClick can fire (it runs before Dialog's onShow event).
			tagSelector.focusTextBox = () => {};
		}

		return tagSelector;
	}

	buildPreselectedItems(level: PermissionLevel): [string, string][]
	{
		const items: [string, string][] = [];
		const map = this.byLevel?.[level];
		if (map)
		{
			for (const member of map.values())
			{
				if (member.entityId && member.entityItemId)
				{
					items.push([member.entityId, member.entityItemId]);
				}
			}
		}

		// Inherited grants are shown inside the selector rather than in a separate list, so they
		// are preselected too. They stay out of `byLevel`, hence out of the save payload.
		for (const item of this.buildInheritedItems(level))
		{
			items.push(item);
		}

		return items;
	}

	// A subject can hold both an inherited grant from an ancestor and an explicit grant of its own
	// at the same level — different rows, same tag in the selector. The explicit one wins here: it
	// is the row this popup owns, and listing the subject as inherited would preselect it twice and
	// lock the tag through `undeselectedItems`, leaving the moderator unable to revoke their own
	// grant. Revoking it uncovers the inherited grant, which reappears as read-only on reopen.
	buildInheritedItems(level: PermissionLevel): [string, string][]
	{
		const items: [string, string][] = [];
		for (const member of this.getInheritedMembers(level))
		{
			if (this.hasExplicitMember(level, member.subjectCode))
			{
				continue;
			}

			if (member.entityId && member.entityItemId)
			{
				items.push([member.entityId, member.entityItemId]);
			}
		}

		return items;
	}

	// Is this subject covered by a grant made ON this document (as opposed to an inherited one)?
	hasExplicitMember(level: PermissionLevel, subjectCode: string): boolean
	{
		return this.byLevel?.[level]?.has(String(subjectCode || '')) === true;
	}

	// The hint names the document the grant comes from whenever the server reported it: the tag is
	// read-only here, so without the source name a moderator has no way to find where to revoke.
	buildInheritedHint(member: Object): string
	{
		const sourceTitle = String(member?.sourceDocumentTitle || '').trim();
		if (sourceTitle === '')
		{
			return this.getMessage('NOTE_PERMISSIONS_POPUP_INHERITED_HINT');
		}

		return this.getMessage('NOTE_PERMISSIONS_POPUP_INHERITED_HINT_FROM')
			.replace('#DOCUMENT#', Text.encode(sourceTitle))
		;
	}

	// Marks a tag that stands for an inherited grant with the "inherited from the parent document"
	// hint. Non-removability itself comes from `undeselectedItems`, not from here.
	decorateInheritedTag(level: PermissionLevel, tag: Object | null): void
	{
		if (!tag || typeof tag.getContainer !== 'function')
		{
			return;
		}

		const subjectCode = this.encodeSubjectCode(
			String(tag.getEntityId?.() || ''),
			String(tag.getId?.() || ''),
		);
		const member = this.inheritedByLevel?.[level]?.get(subjectCode);
		// An own grant on the same subject keeps the tag removable, so it must not be dressed up as
		// read-only inherited either.
		if (!subjectCode || !member || this.hasExplicitMember(level, subjectCode))
		{
			return;
		}

		const container = tag.getContainer();
		if (!container)
		{
			return;
		}

		Dom.addClass(container, 'note-permissions-popup__inherited-tag');
		container.setAttribute('data-hint', this.buildInheritedHint(member));
		container.setAttribute('data-hint-no-icon', 'Y');
		Hint.initNode(container);
	}

	decorateInheritedTags(selector: Object, level: PermissionLevel): void
	{
		const tags = selector?.getTags?.();
		if (!Array.isArray(tags))
		{
			return;
		}

		for (const tag of tags)
		{
			this.decorateInheritedTag(level, tag);
		}
	}

	buildEntitiesForSection(): Array<Object>
	{
		// Suppress SN footer ("Invite employee" / "Create project" / "Create chat"):
		// UserProvider reads showInvitationFooter; ProjectProvider reads createProjectLink.
		const baseEntities = [
			{
				id: 'user',
				options: { showInvitationFooter: false },
			},
			{
				id: 'project',
				options: { createProjectLink: false },
			},
			{
				id: 'department',
				options: {
					selectMode: 'usersAndDepartments',
					allowSelectRootDepartment: true,
				},
			},
		];

		if (this.popupConfig?.kind === 'collection')
		{
			baseEntities.push({
				id: ENTITY_TYPE_META_USER,
				options: { [META_USER_ALL_USERS]: true },
			});
		}

		return baseEntities;
	}

	handleItemSelect(level: PermissionLevel, event: Object): void
	{
		if (this.suppressSelectorSync)
		{
			return;
		}

		const item = event?.getData?.()?.item || event?.data?.item;
		if (!item)
		{
			return;
		}

		const member = this.itemToMember(item);
		if (!member.subjectCode)
		{
			return;
		}

		const previousLevel = this.findMemberLevel(member.subjectCode);
		if (previousLevel && previousLevel !== level)
		{
			this.removeFromSelectorSilently(previousLevel, member);
		}

		this.moveMemberToLevel(level, member);
		this.updateValidationState();
	}

	handleItemDeselect(level: PermissionLevel, event: Object): void
	{
		if (this.suppressSelectorSync)
		{
			return;
		}

		const item = event?.getData?.()?.item || event?.data?.item;
		if (!item)
		{
			return;
		}

		const subjectCode = this.encodeSubjectCode(
			String(item.getEntityId?.() || ''),
			String(item.getId?.() || ''),
		);
		if (!subjectCode)
		{
			return;
		}

		// Inherited grants live outside byLevel; `undeselectedItems` should already block this,
		// so the guard only keeps a stray deselect from silently doing nothing meaningful. A subject
		// that ALSO holds an own grant is not blocked — that grant is exactly what is being revoked.
		if (!this.hasExplicitMember(level, subjectCode) && this.inheritedByLevel?.[level]?.has(subjectCode))
		{
			return;
		}

		this.removeMemberFromLevel(level, subjectCode);
		this.updateValidationState();
	}

	removeFromSelectorSilently(level: PermissionLevel, member: Member): void
	{
		const selector = this.sectionSelectors?.[level];
		if (!selector)
		{
			return;
		}

		const dialog = selector.getDialog?.();
		if (!dialog)
		{
			return;
		}

		const dialogItem = dialog.getItem?.([member.entityId, member.entityItemId]);
		if (!dialogItem)
		{
			return;
		}

		this.suppressSelectorSync = true;
		try
		{
			dialogItem.deselect();
		}
		finally
		{
			this.suppressSelectorSync = false;
		}
	}

	itemToMember(item: Object): Member
	{
		const entityId = String(item?.getEntityId?.() || '');
		const entityItemId = String(item?.getId?.() || '');
		const subjectCode = this.encodeSubjectCode(entityId, entityItemId);
		const title = String(item?.getTitle?.() || subjectCode);

		return {
			subjectCode,
			title,
			entityId,
			entityItemId,
			// A newly added grant follows the current scope toggle.
			scope: this.subtreeScopeEnabled ? SCOPE_SUBTREE : SCOPE_DOCUMENT,
			inherited: false,
			sourceDocumentId: null,
		};
	}

	updateValidationState(): void
	{
		if (!this.primaryButton || !this.popupConfig)
		{
			return;
		}

		const isValid = this.isStateValid();
		this.canSavePermissions = isValid;
		this.primaryButton.setDisabled(!isValid);
	}

	isStateValid(): boolean
	{
		if (this.popupConfig?.name?.visible)
		{
			const trimmed = String(this.popupName || '').trim();
			if (!trimmed)
			{
				return false;
			}
		}

		const sections = this.popupConfig?.sections || [];
		for (const section of sections)
		{
			if (!section.required)
			{
				continue;
			}

			const map = this.byLevel?.[section.level];
			if (!map || map.size === 0)
			{
				return false;
			}
		}

		return true;
	}

	getMessage(code: string, fallback?: string): string
	{
		return Loc.getMessage(code) || fallback || '';
	}
}
