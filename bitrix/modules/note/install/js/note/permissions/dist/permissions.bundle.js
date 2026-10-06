/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, main_sidepanel, ui_notification, ui_iconSet_outline, note_ui_themeContext, main_popup, ui_buttons, ui_entitySelector, ui_hint, ui_system_checkbox, ui_system_dialog, main_core_events, note_analytics) {
	'use strict';

	class PermissionsApi {
		loadCollectionPermissions(collectionId) {
			return main_core.ajax.runAction('note.infrastructure.CollectionController.getPermissions', {
				data: {
					id: collectionId
				}
			}).then(response => response?.data || {});
		}
		saveCollectionPermissions(collectionId, policyLevel, permissions) {
			return main_core.ajax.runAction('note.infrastructure.CollectionController.savePermissions', {
				data: {
					id: collectionId,
					policyLevel,
					permissions: Array.isArray(permissions) ? permissions : []
				}
			}).then(response => response?.data || false);
		}
		loadDocumentPermissions(documentId) {
			return main_core.ajax.runAction('note.infrastructure.DocumentController.getPermissions', {
				data: {
					id: documentId
				}
			}).then(response => response?.data || {});
		}
		saveDocumentPermissions(documentId, permissions) {
			return main_core.ajax.runAction('note.infrastructure.DocumentController.savePermissions', {
				data: {
					id: documentId,
					permissions: Array.isArray(permissions) ? permissions : []
				}
			}).then(response => response?.data || false);
		}
		createCollection(name, position = 0) {
			return main_core.ajax.runAction('note.infrastructure.CollectionController.create', {
				data: {
					name,
					position
				}
			}).then(response => response?.data || null);
		}
		updateCollection(collectionId, name) {
			return main_core.ajax.runAction('note.infrastructure.CollectionController.update', {
				data: {
					id: collectionId,
					name
				}
			}).then(response => response?.data || null);
		}
		deleteCollection(collectionId) {
			return main_core.ajax.runAction('note.infrastructure.CollectionController.delete', {
				data: {
					id: collectionId
				}
			}).then(response => Boolean(response?.data));
		}
	}

	const LEVEL_NONE = 'none';
	const LEVEL_VIEW = 'view';
	const LEVEL_EDIT = 'edit';
	const LEVEL_MANAGE = 'manage';
	const LEVEL_MODERATE = 'moderate';

	// Grant scope (mirrors backend DocumentAccessService): a grant applies to this
	// document only, or to this document and its whole subtree. `subtree` is valid
	// only with a positive level (view/edit) and gated by the availability flag.
	const SCOPE_DOCUMENT = 'document';
	const SCOPE_SUBTREE = 'subtree';
	const ENTITY_TYPE_USER = 'user';
	const ENTITY_TYPE_DEPARTMENT = 'department';
	const ENTITY_TYPE_PROJECT = 'project';
	const ENTITY_TYPE_META_USER = 'meta-user';
	const META_USER_ALL_USERS = 'all-users';
	const ALL_USERS_SUBJECT_CODE = '*';

	const ALL_LEVELS = [LEVEL_MODERATE, LEVEL_MANAGE, LEVEL_EDIT, LEVEL_VIEW];
	class NotePermissionsMembers {
		createEmptyByLevel() {
			const byLevel = {};
			for (const level of ALL_LEVELS) {
				byLevel[level] = new Map();
			}
			return byLevel;
		}
		hydrateState(payload) {
			this.byLevel = this.createEmptyByLevel();
			// Inherited rows are kept apart from byLevel: they are shown inside the selector as
			// non-removable tags and never take part in the save payload.
			this.inheritedByLevel = this.createEmptyByLevel();
			this.subtreeAvailable = payload?.subtreeAvailable === true;
			const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
			for (const permission of permissions) {
				const subjectCode = String(permission?.subjectCode || '').trim();
				if (!subjectCode || subjectCode === ALL_USERS_SUBJECT_CODE) {
					continue;
				}
				const level = this.normalizeLevel(permission?.level);
				if (!level) {
					continue;
				}
				const titleHint = String(permission?.name || '');
				if (permission?.inherited === true) {
					const sourceId = Number(permission?.sourceDocumentId) || null;
					const sourceTitle = String(permission?.sourceDocumentTitle || '');
					this.inheritedByLevel[level].set(subjectCode, this.buildMember(subjectCode, titleHint, SCOPE_DOCUMENT, true, sourceId, sourceTitle));
					continue;
				}
				const scope = this.normalizeScope(permission?.scope);
				this.byLevel[level].set(subjectCode, this.buildMember(subjectCode, titleHint, scope));
			}
			const policyLevel = this.normalizeLevel(payload?.policyLevel);
			if (policyLevel) {
				this.byLevel[policyLevel].set(ALL_USERS_SUBJECT_CODE, {
					subjectCode: ALL_USERS_SUBJECT_CODE,
					title: this.getAllEmployeesTitle(),
					entityId: ENTITY_TYPE_META_USER,
					entityItemId: META_USER_ALL_USERS,
					scope: SCOPE_DOCUMENT,
					inherited: false,
					sourceDocumentId: null,
					sourceDocumentTitle: ''
				});
			}
		}
		getAllEmployeesTitle() {
			return main_core.Loc.getMessage('NOTE_PERMISSIONS_POPUP_ALL_EMPLOYEES') || '';
		}
		buildMember(subjectCode, titleHint = '', scope = SCOPE_DOCUMENT, inherited = false, sourceDocumentId = null, sourceDocumentTitle = '') {
			const decoded = this.decodeSubjectCode(subjectCode);
			return {
				subjectCode,
				title: titleHint || subjectCode,
				entityId: decoded?.entityId || '',
				entityItemId: decoded?.entityItemId || '',
				scope,
				inherited,
				sourceDocumentId,
				sourceDocumentTitle
			};
		}
		moveMemberToLevel(targetLevel, member) {
			for (const level of ALL_LEVELS) {
				if (level !== targetLevel && this.byLevel[level]?.has(member.subjectCode)) {
					this.byLevel[level].delete(member.subjectCode);
				}
			}
			if (this.byLevel[targetLevel]) {
				this.byLevel[targetLevel].set(member.subjectCode, member);
			}
		}
		removeMemberFromLevel(level, subjectCode) {
			this.byLevel[level]?.delete(subjectCode);
		}
		findMemberLevel(subjectCode) {
			for (const level of ALL_LEVELS) {
				if (this.byLevel[level]?.has(subjectCode)) {
					return level;
				}
			}
			return null;
		}
		collectStateForSave() {
			const byLevel = {};
			for (const level of ALL_LEVELS) {
				byLevel[level] = Array.from(this.byLevel[level]?.values?.() || []);
			}
			return {
				name: String(this.popupName || ''),
				byLevel
			};
		}
		hasModerator() {
			return (this.byLevel[LEVEL_MODERATE]?.size || 0) > 0;
		}
		normalizeLevel(level) {
			const value = String(level || '').toLowerCase().trim();
			if (ALL_LEVELS.includes(value)) {
				return value;
			}
			return '';
		}
		normalizeScope(scope) {
			return String(scope || '').toLowerCase().trim() === SCOPE_SUBTREE ? SCOPE_SUBTREE : SCOPE_DOCUMENT;
		}

		// Single scope toggle drives every editable grant uniformly. Untouched hydrated
		// scope is preserved (the toggle is only rewritten on an explicit flip), so a
		// mixed initial state is never silently changed.
		applyScopeToEditableMembers(scope) {
			for (const level of ALL_LEVELS) {
				const map = this.byLevel?.[level];
				if (!map) {
					continue;
				}
				for (const member of map.values()) {
					member.scope = scope;
				}
			}
		}
		hasSubtreeMember() {
			for (const level of ALL_LEVELS) {
				const map = this.byLevel?.[level];
				if (!map) {
					continue;
				}
				for (const member of map.values()) {
					if (member.scope === SCOPE_SUBTREE) {
						return true;
					}
				}
			}
			return false;
		}
		getInheritedMembers(level) {
			return Array.from(this.inheritedByLevel?.[level]?.values?.() || []);
		}
		decodeSubjectCode(subjectCode) {
			const normalized = String(subjectCode || '');
			if (normalized === ALL_USERS_SUBJECT_CODE) {
				return {
					entityId: ENTITY_TYPE_META_USER,
					entityItemId: META_USER_ALL_USERS
				};
			}
			let match = normalized.match(/^U(\d+)$/);
			if (match) {
				return {
					entityId: ENTITY_TYPE_USER,
					entityItemId: match[1]
				};
			}
			match = normalized.match(/^DR(\d+)$/);
			if (match) {
				return {
					entityId: ENTITY_TYPE_DEPARTMENT,
					entityItemId: match[1]
				};
			}

			// Socnet group: a bare SG{id} (added through the UI) or a role-suffixed
			// SG{id}_K/_E/_A (written by the wiki import) — both denote the same group.
			match = normalized.match(/^SG(\d+)(?:_[AEK])?$/);
			if (match) {
				return {
					entityId: ENTITY_TYPE_PROJECT,
					entityItemId: match[1]
				};
			}
			return null;
		}
		encodeSubjectCode(entityId, entityItemId) {
			const id = String(entityItemId || '').trim();
			if (!id) {
				return '';
			}
			const type = String(entityId || '');
			if (type === ENTITY_TYPE_META_USER && id === META_USER_ALL_USERS) {
				return ALL_USERS_SUBJECT_CODE;
			}
			switch (type) {
				case ENTITY_TYPE_USER:
					return `U${id}`;
				case ENTITY_TYPE_DEPARTMENT:
				case 'structure-node':
					return `DR${id}`;
				case ENTITY_TYPE_PROJECT:
					// Store the member code: group members carry SG{id}_K in their access
					// codes, so this is the variant that actually grants the group access
					// (a bare SG{id} matches no user's codes and would grant nobody).
					return `SG${id}_K`;
				default:
					return '';
			}
		}
	}

	class NotePermissionsPopup extends NotePermissionsMembers {
		createPopup() {
			const content = this.createPopupShell();
			const primaryButton = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text: this.popupConfig.primaryButtonText || this.getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
				// Identity for tests: the footer buttons are otherwise reachable only through
				// ui.system.dialog internals (`.ui-system-dialog__footer button.--style-filled`).
				dataset: {
					testid: 'note-permissions-save'
				},
				onclick: () => {
					if (!this.canSavePermissions) {
						return;
					}
					void this.handlePrimaryAction();
				}
			});
			primaryButton.setDisabled(true);
			this.canSavePermissions = false;
			this.primaryButton = primaryButton;
			const cancelButton = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				text: this.getMessage('NOTE_PERMISSIONS_POPUP_CANCEL'),
				dataset: {
					testid: 'note-permissions-cancel'
				},
				onclick: () => this.popup?.hide()
			});
			this.popup = new ui_system_dialog.Dialog({
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
						ui_hint.Hint.hide();
						this.destroyPopup(true);
					}
				}
			});
			this.popup.show();
			const popupEl = this.popupBody?.closest('.popup-window');
			if (popupEl) {
				main_core.Dom.addClass(popupEl, 'note-permissions-dialog');
				main_core.Dom.addClass(popupEl, note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(this.popupTheme));
				// `note-permissions-dialog` sets height:600px after the first adjust ran on a smaller popup; recenter.
				main_popup.PopupManager.getPopupById(popupEl.id)?.adjustPosition({
					forceBindPosition: true
				});
			}
		}
		async handlePrimaryAction() {
			if (!this.popupConfig || !this.primaryButton) {
				return;
			}
			this.primaryButton.setWaiting(true);
			try {
				const state = this.collectStateForSave();
				await this.popupConfig.save(state);
				this.showNotification(this.popupConfig.successMessage);
				this.popup?.hide?.();
			} catch (error) {
				console.error('note.permissions: failed to save', error);
				const fallbackMessage = error?.noteRollbackFailed ? this.getMessage('NOTE_PERMISSIONS_POPUP_ROLLBACK_FAILED') : '';
				this.showNotification(fallbackMessage || this.popupConfig.errorMessage);
			} finally {
				this.primaryButton?.setWaiting(false);
			}
		}
		createPopupShell() {
			this.popupBody = main_core.Tag.render`<div class="note-permissions-popup-shell"></div>`;
			return this.popupBody;
		}
		renderPopupLoader() {
			if (!this.popupBody) {
				return;
			}
			this.canSavePermissions = false;
			this.primaryButton?.setDisabled(true);
			main_core.Dom.clean(this.popupBody);
			main_core.Dom.append(main_core.Tag.render`
			<div class="note-permissions-popup-loader">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.popupBody);
		}
		renderPopupLoadError() {
			if (!this.popupBody) {
				return;
			}
			this.canSavePermissions = false;
			this.primaryButton?.setDisabled(true);
			main_core.Dom.clean(this.popupBody);
			main_core.Dom.append(main_core.Tag.render`
			<div class="note-permissions-popup-loader note-permissions-popup-loader--error">
				<div class="note-permissions-popup-loader__spinner"></div>
			</div>
		`, this.popupBody);
		}
		async renderPopupContent() {
			if (!this.popupBody || !this.popupConfig) {
				return;
			}
			const container = this.buildPopupContainer();
			main_core.Dom.clean(this.popupBody);
			main_core.Dom.append(container, this.popupBody);
			this.mountSections();
			this.canSavePermissions = true;
			this.updateValidationState();
			this.popupNameInput?.focus();
		}
		buildPopupContainer() {
			const container = main_core.Tag.render`
			<div class="note-permissions-popup">
				<div class="note-permissions-popup__sections"></div>
			</div>
		`;
			if (this.popupConfig?.name?.visible) {
				const initialValue = String(this.popupConfig.name.initialValue || '');
				const placeholder = String(this.popupConfig.name.placeholder || '');
				const nameBlock = main_core.Tag.render`
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
				main_core.Event.bind(input, 'input', () => {
					this.popupName = input.value;
					this.updateValidationState();
				});
				main_core.Event.bind(input, 'keydown', event => {
					if (event.key === 'Enter' && this.canSavePermissions) {
						event.preventDefault();
						void this.handlePrimaryAction();
					}
				});
				main_core.Dom.prepend(nameBlock, container);
			} else {
				this.popupName = '';
				this.popupNameInput = null;
			}
			const scopeBlock = this.buildScopeBlock();
			if (scopeBlock) {
				// Scope control sits above the level sections, next to the document identity.
				main_core.Dom.prepend(scopeBlock, container);
			}
			this.sectionsContainer = container.querySelector('.note-permissions-popup__sections');
			return container;
		}

		// Subtree-scope checkbox: document mode only and only once the server confirms the
		// feature is available. A single toggle drives every editable grant uniformly.
		// `ui.system.checkbox` wraps a real <input type="checkbox">, so keyboard access and the
		// accessible name come from the platform — no ARIA augmentation needed here.
		buildScopeBlock() {
			this.scopeCheckbox = null;
			if (this.popupConfig?.kind !== 'document' || !this.subtreeAvailable) {
				return null;
			}

			// Reflect an existing subtree grant so the initial state matches the data; a
			// mixed hydrated state stays untouched until the user explicitly flips the toggle.
			this.subtreeScopeEnabled = this.hasSubtreeMember();
			const inputId = `note-permissions-scope-${Number(this.popupConfig?.targetId) || 0}`;
			const titleText = this.getMessage('NOTE_PERMISSIONS_POPUP_SCOPE_TITLE');
			const hintText = this.getMessage('NOTE_PERMISSIONS_POPUP_SCOPE_HINT');
			const checkbox = new ui_system_checkbox.Checkbox({
				checked: this.subtreeScopeEnabled,
				size: ui_system_checkbox.CheckboxSize.Md,
				attributes: {
					id: inputId
				},
				onChange: ({
					checked
				}) => this.handleScopeToggle(checked === true)
			});

			// The checkbox renders its own <label> around the box, so the caption is a sibling
			// <label for>, not a wrapper — nesting labels would be invalid markup.
			const block = main_core.Tag.render`
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
		handleScopeToggle(enabled) {
			this.subtreeScopeEnabled = enabled === true;
			this.applyScopeToEditableMembers(this.subtreeScopeEnabled ? SCOPE_SUBTREE : SCOPE_DOCUMENT);
		}
		mountSections() {
			if (!this.sectionsContainer || !this.popupConfig) {
				return;
			}
			this.sectionSelectors = {};
			main_core.Dom.clean(this.sectionsContainer);
			for (const section of this.popupConfig.sections) {
				const block = this.buildSectionBlock(section);
				main_core.Dom.append(block, this.sectionsContainer);
			}
		}
		buildSectionBlock(section) {
			const titleText = String(section.title || '');
			const titleNode = main_core.Tag.render`
			<div class="note-permissions-popup__section-title">
				<span class="note-permissions-popup__section-title-text">${titleText}</span>
			</div>
		`;
			if (section.required) {
				const titleTextNode = titleNode.querySelector('.note-permissions-popup__section-title-text');
				main_core.Dom.append(main_core.Tag.render`<span class="note-permissions-popup__section-title-required" aria-hidden="true">*</span>`, titleTextNode);
			}
			const hintText = String(section.hintText || '').trim();
			if (hintText) {
				const hintNode = ui_hint.Hint.createNode(hintText);
				if (hintNode) {
					main_core.Dom.addClass(hintNode, 'note-permissions-popup__section-title-hint');
					main_core.Dom.append(hintNode, titleNode);
				}
			}
			const selectorContainer = main_core.Tag.render`<div class="note-permissions-popup__selector"></div>`;
			const block = main_core.Tag.render`
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
		applyThemeToSelector(selector) {
			// TagSelector hardcodes `--ui-context-content-light` on its outer container
			// (entity-selector/src/tag-selector/tag-selector.js); rewrite it to the active note theme.
			const outer = selector?.getOuterContainer?.();
			if (!outer) {
				return;
			}
			main_core.Dom.removeClass(outer, '--ui-context-content-light');
			main_core.Dom.removeClass(outer, '--ui-context-content-dark');
			main_core.Dom.addClass(outer, note_ui_themeContext.NoteThemeContext.getDesignSystemContext());
		}
		createSectionSelector(section) {
			const preselectedItems = this.buildPreselectedItems(section.level);
			// Inherited grants ride in as ordinary preselected items — that is what resolves their
			// real names through the entity providers — but `undeselectedItems` makes the platform
			// render them without a remove cross and refuse deselection.
			const undeselectedItems = this.buildInheritedItems(section.level);
			const entities = this.buildEntitiesForSection();
			const isMobile = document.documentElement.classList.contains('note-mobile');
			let scrollSyncHandler = null;
			const tagSelector = new ui_entitySelector.TagSelector({
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
						className: `${note_ui_themeContext.NoteThemeContext.getDesignSystemContext()} note-permissions-tag-selector-popup`
					},
					// dialog.handleAutoHide(entity-selector/dialog.js) returns true (close) for any outside
					// click except inside the popup or a non-empty textbox. On mobile that means tapping the
					// empty textbox closes the dropdown AND auto-hides the textbox via handlePopupAfterClose
					// → hideTextBox(). Override so any tap within the tag-selector container keeps it open.
					autoHideHandler: isMobile ? (event, dialog) => {
						const tsContainer = dialog?.getTagSelector?.()?.getContainer?.();
						if (tsContainer && event?.target instanceof Node && tsContainer.contains(event.target)) {
							return false;
						}
						return true;
					} : undefined,
					events: {
						'Item:onSelect': event => {
							this.handleItemSelect(section.level, event);
						},
						'Item:onDeselect': event => {
							this.handleItemDeselect(section.level, event);
						},
						'onShow': event => {
							const dialog = event?.getTarget?.();
							scrollSyncHandler = scrollEvent => {
								const popup = dialog?.getPopup?.();
								const popupEl = popup?.getPopupContainer?.();
								if (popupEl && scrollEvent.target instanceof Node && popupEl.contains(scrollEvent.target)) {
									return;
								}
								popup?.adjustPosition?.({
									forceBindPosition: true
								});
							};
							document.addEventListener('scroll', scrollSyncHandler, {
								capture: true,
								passive: true
							});
						},
						'onHide': () => {
							if (scrollSyncHandler) {
								document.removeEventListener('scroll', scrollSyncHandler, true);
								scrollSyncHandler = null;
							}
						}
					}
				},
				events: {
					// Preselected items resolve asynchronously through the providers, so inherited
					// tags appear after construction — this is where their "inherited" hint is attached.
					onAfterTagAdd: event => {
						this.decorateInheritedTag(section.level, event?.getData?.()?.tag);
					}
				}
			});
			if (isMobile) {
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
		buildPreselectedItems(level) {
			const items = [];
			const map = this.byLevel?.[level];
			if (map) {
				for (const member of map.values()) {
					if (member.entityId && member.entityItemId) {
						items.push([member.entityId, member.entityItemId]);
					}
				}
			}

			// Inherited grants are shown inside the selector rather than in a separate list, so they
			// are preselected too. They stay out of `byLevel`, hence out of the save payload.
			for (const item of this.buildInheritedItems(level)) {
				items.push(item);
			}
			return items;
		}

		// A subject can hold both an inherited grant from an ancestor and an explicit grant of its own
		// at the same level — different rows, same tag in the selector. The explicit one wins here: it
		// is the row this popup owns, and listing the subject as inherited would preselect it twice and
		// lock the tag through `undeselectedItems`, leaving the moderator unable to revoke their own
		// grant. Revoking it uncovers the inherited grant, which reappears as read-only on reopen.
		buildInheritedItems(level) {
			const items = [];
			for (const member of this.getInheritedMembers(level)) {
				if (this.hasExplicitMember(level, member.subjectCode)) {
					continue;
				}
				if (member.entityId && member.entityItemId) {
					items.push([member.entityId, member.entityItemId]);
				}
			}
			return items;
		}

		// Is this subject covered by a grant made ON this document (as opposed to an inherited one)?
		hasExplicitMember(level, subjectCode) {
			return this.byLevel?.[level]?.has(String(subjectCode || '')) === true;
		}

		// The hint names the document the grant comes from whenever the server reported it: the tag is
		// read-only here, so without the source name a moderator has no way to find where to revoke.
		buildInheritedHint(member) {
			const sourceTitle = String(member?.sourceDocumentTitle || '').trim();
			if (sourceTitle === '') {
				return this.getMessage('NOTE_PERMISSIONS_POPUP_INHERITED_HINT');
			}
			return this.getMessage('NOTE_PERMISSIONS_POPUP_INHERITED_HINT_FROM').replace('#DOCUMENT#', main_core.Text.encode(sourceTitle));
		}

		// Marks a tag that stands for an inherited grant with the "inherited from the parent document"
		// hint. Non-removability itself comes from `undeselectedItems`, not from here.
		decorateInheritedTag(level, tag) {
			if (!tag || typeof tag.getContainer !== 'function') {
				return;
			}
			const subjectCode = this.encodeSubjectCode(String(tag.getEntityId?.() || ''), String(tag.getId?.() || ''));
			const member = this.inheritedByLevel?.[level]?.get(subjectCode);
			// An own grant on the same subject keeps the tag removable, so it must not be dressed up as
			// read-only inherited either.
			if (!subjectCode || !member || this.hasExplicitMember(level, subjectCode)) {
				return;
			}
			const container = tag.getContainer();
			if (!container) {
				return;
			}
			main_core.Dom.addClass(container, 'note-permissions-popup__inherited-tag');
			container.setAttribute('data-hint', this.buildInheritedHint(member));
			container.setAttribute('data-hint-no-icon', 'Y');
			ui_hint.Hint.initNode(container);
		}
		decorateInheritedTags(selector, level) {
			const tags = selector?.getTags?.();
			if (!Array.isArray(tags)) {
				return;
			}
			for (const tag of tags) {
				this.decorateInheritedTag(level, tag);
			}
		}
		buildEntitiesForSection() {
			// Suppress SN footer ("Invite employee" / "Create project" / "Create chat"):
			// UserProvider reads showInvitationFooter; ProjectProvider reads createProjectLink.
			const baseEntities = [{
				id: 'user',
				options: {
					showInvitationFooter: false
				}
			}, {
				id: 'project',
				options: {
					createProjectLink: false
				}
			}, {
				id: 'department',
				options: {
					selectMode: 'usersAndDepartments',
					allowSelectRootDepartment: true
				}
			}];
			if (this.popupConfig?.kind === 'collection') {
				baseEntities.push({
					id: ENTITY_TYPE_META_USER,
					options: {
						[META_USER_ALL_USERS]: true
					}
				});
			}
			return baseEntities;
		}
		handleItemSelect(level, event) {
			if (this.suppressSelectorSync) {
				return;
			}
			const item = event?.getData?.()?.item || event?.data?.item;
			if (!item) {
				return;
			}
			const member = this.itemToMember(item);
			if (!member.subjectCode) {
				return;
			}
			const previousLevel = this.findMemberLevel(member.subjectCode);
			if (previousLevel && previousLevel !== level) {
				this.removeFromSelectorSilently(previousLevel, member);
			}
			this.moveMemberToLevel(level, member);
			this.updateValidationState();
		}
		handleItemDeselect(level, event) {
			if (this.suppressSelectorSync) {
				return;
			}
			const item = event?.getData?.()?.item || event?.data?.item;
			if (!item) {
				return;
			}
			const subjectCode = this.encodeSubjectCode(String(item.getEntityId?.() || ''), String(item.getId?.() || ''));
			if (!subjectCode) {
				return;
			}

			// Inherited grants live outside byLevel; `undeselectedItems` should already block this,
			// so the guard only keeps a stray deselect from silently doing nothing meaningful. A subject
			// that ALSO holds an own grant is not blocked — that grant is exactly what is being revoked.
			if (!this.hasExplicitMember(level, subjectCode) && this.inheritedByLevel?.[level]?.has(subjectCode)) {
				return;
			}
			this.removeMemberFromLevel(level, subjectCode);
			this.updateValidationState();
		}
		removeFromSelectorSilently(level, member) {
			const selector = this.sectionSelectors?.[level];
			if (!selector) {
				return;
			}
			const dialog = selector.getDialog?.();
			if (!dialog) {
				return;
			}
			const dialogItem = dialog.getItem?.([member.entityId, member.entityItemId]);
			if (!dialogItem) {
				return;
			}
			this.suppressSelectorSync = true;
			try {
				dialogItem.deselect();
			} finally {
				this.suppressSelectorSync = false;
			}
		}
		itemToMember(item) {
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
				sourceDocumentId: null
			};
		}
		updateValidationState() {
			if (!this.primaryButton || !this.popupConfig) {
				return;
			}
			const isValid = this.isStateValid();
			this.canSavePermissions = isValid;
			this.primaryButton.setDisabled(!isValid);
		}
		isStateValid() {
			if (this.popupConfig?.name?.visible) {
				const trimmed = String(this.popupName || '').trim();
				if (!trimmed) {
					return false;
				}
			}
			const sections = this.popupConfig?.sections || [];
			for (const section of sections) {
				if (!section.required) {
					continue;
				}
				const map = this.byLevel?.[section.level];
				if (!map || map.size === 0) {
					return false;
				}
			}
			return true;
		}
		getMessage(code, fallback) {
			return main_core.Loc.getMessage(code) || fallback || '';
		}
	}

	const EVENT_COLLECTION_RENAMED = 'Note:collectionRenamed';
	const COLLECTION_SECTION_ORDER = [LEVEL_MODERATE, LEVEL_MANAGE, LEVEL_VIEW];
	const DOCUMENT_SECTION_ORDER = [LEVEL_EDIT, LEVEL_VIEW];
	function getMessage(code) {
		return main_core.Loc.getMessage(code) || '';
	}
	function getLevelTitle(level) {
		switch (level) {
			case LEVEL_MODERATE:
				return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_MODERATE');
			case LEVEL_MANAGE:
				return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT');
			case LEVEL_EDIT:
				return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_EDIT');
			case LEVEL_VIEW:
				return getMessage('NOTE_PERMISSIONS_POPUP_LEVEL_VIEW');
			default:
				return '';
		}
	}
	function getLevelHint(level, kind) {
		const suffix = kind === 'document' ? '_DOCUMENT' : '';
		const code = `NOTE_PERMISSIONS_POPUP_HINT_${String(level).toUpperCase()}${suffix}`;
		return getMessage(code);
	}
	function buildCollectionSections() {
		return COLLECTION_SECTION_ORDER.map(level => ({
			level,
			title: getLevelTitle(level),
			hintText: getLevelHint(level, 'collection'),
			required: level === LEVEL_MODERATE
		}));
	}
	function buildDocumentSections() {
		return DOCUMENT_SECTION_ORDER.map(level => ({
			level,
			title: getLevelTitle(level),
			hintText: getLevelHint(level, 'document'),
			required: false
		}));
	}
	function flattenStateForCollection(state) {
		let policyLevel = LEVEL_NONE;
		const permissions = [];
		for (const level of Object.keys(state.byLevel)) {
			const members = state.byLevel[level] || [];
			for (const member of members) {
				if (member.subjectCode === ALL_USERS_SUBJECT_CODE) {
					policyLevel = level;
					continue;
				}
				permissions.push({
					subjectCode: member.subjectCode,
					level
				});
			}
		}
		return {
			policyLevel,
			permissions
		};
	}
	function flattenStateForDocument(state) {
		const permissions = [];
		for (const level of Object.keys(state.byLevel)) {
			const members = state.byLevel[level] || [];
			for (const member of members) {
				if (member.subjectCode === ALL_USERS_SUBJECT_CODE) {
					continue;
				}

				// Subtree scope is valid only for positive levels; mirror the backend guard
				// so a malformed level never ships an invalid scope pairing.
				const scope = member.scope === SCOPE_SUBTREE && (level === LEVEL_VIEW || level === LEVEL_EDIT) ? SCOPE_SUBTREE : SCOPE_DOCUMENT;
				permissions.push({
					subjectCode: member.subjectCode,
					level,
					scope
				});
			}
		}
		return permissions;
	}

	// Collection ACL popup only exposes MODERATE/MANAGE/VIEW sections, so byLevel[EDIT] stays empty
	// for collections (backend collection levels: NONE/VIEW/MANAGE/MODERATE). EDIT is folded into
	// reductorsCount as a no-loss safeguard. Counts include the ALL_USERS policy subject as-is.
	function buildCollectionCreateStats(state) {
		const byLevel = state?.byLevel || {};
		const countAt = level => Array.isArray(byLevel[level]) ? byLevel[level].length : 0;

		// Web-created collection is never an import, so no importType/import counters are sent.
		return {
			admin: countAt(LEVEL_MODERATE),
			reductorsCount: countAt(LEVEL_MANAGE) + countAt(LEVEL_EDIT),
			viewersCount: countAt(LEVEL_VIEW),
			customCount: 0
		};
	}
	function createCollectionEditConfig(api, collectionId, options = {}) {
		const initialName = String(options?.collectionName || '');
		return {
			kind: 'collection',
			mode: 'edit',
			targetId: collectionId,
			sections: buildCollectionSections(),
			name: {
				visible: true,
				initialValue: initialName,
				placeholder: getMessage('NOTE_PERMISSIONS_POPUP_NAME_PLACEHOLDER')
			},
			tagSelectorContext: `NOTE_COLLECTION_PERMISSIONS_${collectionId}`,
			load: () => api.loadCollectionPermissions(collectionId),
			save: async state => {
				try {
					const trimmedName = String(state.name || '').trim();
					const renamed = trimmedName && trimmedName !== initialName.trim();
					if (renamed) {
						await api.updateCollection(collectionId, trimmedName);
					}
					const {
						policyLevel,
						permissions
					} = flattenStateForCollection(state);
					await api.saveCollectionPermissions(collectionId, policyLevel, permissions);
					if (renamed) {
						main_core_events.EventEmitter.emit(EVENT_COLLECTION_RENAMED, new main_core_events.BaseEvent({
							data: {
								id: collectionId,
								name: trimmedName
							}
						}));
					}
					note_analytics.NoteAnalytics.collectionAccessChanged(true);
				} catch (error) {
					note_analytics.NoteAnalytics.collectionAccessChanged(false);
					throw error;
				}
			},
			successMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_SUCCESS'),
			errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_ERROR'),
			loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR'),
			primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
			dialogTitle: ''
		};
	}
	function createCollectionCreateConfig(api, options = {}) {
		return {
			kind: 'collection',
			mode: 'create',
			targetId: null,
			sections: buildCollectionSections(),
			name: {
				visible: true,
				initialValue: '',
				placeholder: getMessage('NOTE_PERMISSIONS_POPUP_NAME_PLACEHOLDER')
			},
			tagSelectorContext: 'NOTE_COLLECTION_PERMISSIONS_NEW',
			load: () => {
				const userId = Number(main_core.Loc.getMessage('USER_ID'));
				const permissions = [];
				if (Number.isInteger(userId) && userId > 0) {
					permissions.push({
						subjectCode: `U${userId}`,
						level: LEVEL_MODERATE,
						name: ''
					});
				}
				return Promise.resolve({
					permissions,
					policyLevel: LEVEL_NONE
				});
			},
			save: async state => {
				// Single create_collection event by the outcome of both hits (create + save perms).
				// Backend does not emit create_collection for web (removed in P3), so no double-count.
				const stats = buildCollectionCreateStats(state);
				try {
					const trimmedName = String(state.name || '').trim();
					const collection = await api.createCollection(trimmedName);
					const collectionId = Number(collection?.id || 0);
					if (!collectionId) {
						throw new Error('note.permissions: collection create returned no id');
					}
					const {
						policyLevel,
						permissions
					} = flattenStateForCollection(state);
					try {
						await api.saveCollectionPermissions(collectionId, policyLevel, permissions);
					} catch (savePermissionsError) {
						try {
							await api.deleteCollection(collectionId);
						} catch (rollbackError) {
							// Surface a more specific error so popup can show an extra hint
							rollbackError.noteRollbackFailed = true;
							throw rollbackError;
						}
						throw savePermissionsError;
					}
					note_analytics.NoteAnalytics.collectionCreated(stats, true);
					if (typeof options.onCreated === 'function') {
						options.onCreated({
							id: collectionId,
							name: String(collection?.name || trimmedName),
							position: Number(collection?.position || 0)
						});
					}
				} catch (error) {
					note_analytics.NoteAnalytics.collectionCreated(stats, false);
					throw error;
				}
			},
			successMessage: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_SUCCESS'),
			errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_ERROR'),
			loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR'),
			primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_CREATE_BUTTON'),
			dialogTitle: ''
		};
	}
	function createDocumentEditConfig(api, documentId, options = {}) {
		return {
			kind: 'document',
			mode: 'edit',
			targetId: documentId,
			sections: buildDocumentSections(),
			name: {
				visible: false,
				initialValue: String(options?.documentTitle || ''),
				placeholder: ''
			},
			tagSelectorContext: `NOTE_DOCUMENT_PERMISSIONS_${documentId}`,
			load: () => api.loadDocumentPermissions(documentId),
			save: async state => {
				const permissions = flattenStateForDocument(state);
				try {
					await api.saveDocumentPermissions(documentId, permissions);
					note_analytics.NoteAnalytics.documentAccessChanged(true);
				} catch (error) {
					note_analytics.NoteAnalytics.documentAccessChanged(false);
					throw error;
				}
			},
			successMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_SUCCESS_DOCUMENT'),
			errorMessage: getMessage('NOTE_PERMISSIONS_POPUP_SAVE_ERROR_DOCUMENT'),
			loadErrorMessage: getMessage('NOTE_PERMISSIONS_POPUP_LOAD_ERROR_DOCUMENT'),
			primaryButtonText: getMessage('NOTE_PERMISSIONS_POPUP_SAVE'),
			dialogTitle: getMessage('NOTE_PERMISSIONS_POPUP_TITLE_EDIT_DOCUMENT')
		};
	}

	class NotePermissionsApp extends NotePermissionsPopup {
		constructor() {
			super();
			this.api = new PermissionsApi();
			this.popup = null;
			this.popupBody = null;
			this.popupConfig = null;
			this.popupTheme = note_ui_themeContext.NoteTheme.LIGHT;
			this.popupLoadRequestToken = 0;
			this.canSavePermissions = false;
			this.primaryButton = null;
			this.byLevel = this.createEmptyByLevel();
			this.inheritedByLevel = this.createEmptyByLevel();
			this.subtreeAvailable = false;
			this.subtreeScopeEnabled = false;
			this.scopeCheckbox = null;
			this.popupName = '';
			this.popupNameInput = null;
			this.sectionsContainer = null;
			this.sectionSelectors = {};
			this.suppressSelectorSync = false;
		}
		resolveTheme(option) {
			if (option === note_ui_themeContext.NoteTheme.DARK || option === note_ui_themeContext.NoteTheme.LIGHT) {
				return option;
			}
			return note_ui_themeContext.NoteThemeContext.get();
		}
		resolveDesignContext(theme) {
			return note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(this.resolveTheme(theme));
		}
		openGlobalSettings(options = {}) {
			const sidePanel = this.getSidePanel();
			if (!sidePanel || !main_core.Type.isFunction(sidePanel.open)) {
				return;
			}
			sidePanel.open('/note/settings/permissions/', {
				cacheable: false,
				width: 1200,
				designSystemContext: this.resolveDesignContext(options?.theme)
			});
		}
		async openCollectionPopup(collectionId, options = {}) {
			const normalizedId = Number(collectionId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return;
			}
			await this.openPopup(createCollectionEditConfig(this.api, normalizedId, options), this.resolveTheme(options?.theme));
		}
		async openCollectionCreatePopup(options = {}) {
			await this.openPopup(createCollectionCreateConfig(this.api, options), this.resolveTheme(options?.theme));
		}
		async openDocumentPopup(documentId, options = {}) {
			const normalizedId = Number(documentId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return;
			}
			await this.openPopup(createDocumentEditConfig(this.api, normalizedId, options), this.resolveTheme(options?.theme));
		}
		async openPopup(config, theme = null) {
			this.destroyPopup();
			this.popupConfig = config;
			this.popupTheme = theme === note_ui_themeContext.NoteTheme.DARK ? note_ui_themeContext.NoteTheme.DARK : note_ui_themeContext.NoteTheme.LIGHT;
			this.byLevel = this.createEmptyByLevel();
			this.inheritedByLevel = this.createEmptyByLevel();
			this.subtreeAvailable = false;
			this.subtreeScopeEnabled = false;
			this.scopeCheckbox = null;
			this.popupName = String(config?.name?.initialValue || '');
			const requestToken = ++this.popupLoadRequestToken;
			this.createPopup();
			this.renderPopupLoader();
			let payload = {};
			try {
				payload = await config.load();
			} catch (error) {
				if (requestToken !== this.popupLoadRequestToken || !this.popupBody) {
					return;
				}
				console.error('note.permissions: failed to load permissions', error);
				this.renderPopupLoadError();
				this.showNotification(config.loadErrorMessage);
				return;
			}
			if (requestToken !== this.popupLoadRequestToken || !this.popupBody) {
				return;
			}
			this.hydrateState(payload);
			await this.renderPopupContent();
		}
		destroy() {
			this.destroyPopup();
		}
		getSidePanel() {
			return main_sidepanel.SidePanel?.Instance || null;
		}
		showNotification(content) {
			const normalizedContent = String(content || '');
			if (!normalizedContent) {
				return;
			}
			BX.UI.Notification.Center.notify({
				content: normalizedContent,
				position: 'top-right',
				autoHideDelay: 3000
			});
		}
		destroyPopup(skipPopupDestroy = false) {
			this.popupLoadRequestToken += 1;
			const popup = this.popup;
			this.popup = null;
			if (popup && !skipPopupDestroy) {
				if (main_core.Type.isFunction(popup.destroy)) {
					popup.destroy();
				} else if (main_core.Type.isFunction(popup.hide)) {
					popup.hide();
				}
			}
			this.popupBody = null;
			this.popupConfig = null;
			this.canSavePermissions = false;
			this.primaryButton = null;
			this.byLevel = this.createEmptyByLevel();
			this.inheritedByLevel = this.createEmptyByLevel();
			this.subtreeAvailable = false;
			this.subtreeScopeEnabled = false;
			this.scopeCheckbox = null;
			this.popupName = '';
			this.popupNameInput = null;
			this.sectionsContainer = null;
			this.sectionSelectors = {};
			this.suppressSelectorSync = false;
		}
	}
	const App = new NotePermissionsApp();

	exports.App = App;
	exports.NotePermissionsApp = NotePermissionsApp;

})(this.BX.Note.Permissions = this.BX.Note.Permissions || {}, BX, BX.SidePanel, BX.UI.Notification, window, BX.Note.Ui, BX.Main, BX.UI, BX.UI.EntitySelector, BX.UI, BX.UI.System.Checkbox, BX.UI.System, BX.Event, BX.Note);
//# sourceMappingURL=permissions.bundle.js.map
