/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, ui_buttons, ui_entitySelector, ui_system_dialog, note_ui_themeContext) {
	'use strict';

	const ENTITY_ID = 'note-collection';
	/**
	 * Single source of truth for the "note-collection" TagSelector look & wiring.
	 * Creates the container node immediately; the TagSelector itself is built lazily
	 * on the first `applyTheme()` call so it is constructed once the node is attached
	 * to the DOM (correct width, mobile-safe dropdown height).
	 */
	function createCollectionSelector(options = {}) {
		const placeholder = String(options?.placeholder || '');
		const accessLevel = options?.accessLevel === 'view' ? 'view' : 'manage';
		const mobileDropdownHeight = Number(options?.mobileDropdownHeight) || 280;
		const desktopDropdownHeight = Number(options?.desktopDropdownHeight) || 340;
		const allowCreateItem = Boolean(options?.allowCreateItem);
		const createFooterLabel = String(options?.createFooterLabel || '');
		const onItemCreateAsync = main_core.Type.isFunction(options?.onItemCreateAsync) ? options.onItemCreateAsync : null;
		const showAvatars = Boolean(options?.showAvatars);
		const onSelectionChange = main_core.Type.isFunction(options?.onSelectionChange) ? options.onSelectionChange : () => {};
		const node = main_core.Tag.render`<div class="note-collection-picker__selector"></div>`;
		let selector = null;
		const build = () => {
			if (selector) {
				return;
			}
			const isMobile = document.documentElement.classList.contains('note-mobile');
			const targetWidth = node.offsetWidth || 432;
			const dialogEvents = {};
			if (allowCreateItem && onItemCreateAsync) {
				// Inline create via SearchTabFooter — backend auto-assigns LEVEL_MODERATE to creator.
				dialogEvents['Search:onItemCreateAsync'] = event => {
					const name = String(event?.getData()?.searchQuery?.getQuery?.() || '').trim();
					if (name === '') {
						return Promise.resolve();
					}
					return onItemCreateAsync(name);
				};
			}
			selector = new ui_entitySelector.TagSelector({
				multiple: false,
				tagLimit: 1,
				placeholder,
				dialogOptions: {
					width: targetWidth,
					height: isMobile ? mobileDropdownHeight : desktopDropdownHeight,
					showAvatars,
					popupOptions: {
						// Marker lets mobile.css trim this dropdown's width so its right edge lines up
						// with the input; the left tab-rail gutter of the EntitySelector search rail is
						// kept (inherited from the shared :has(.ui-selector-dialog) rule).
						className: `${note_ui_themeContext.NoteThemeContext.getDesignSystemContext()} note-collection-picker-dropdown`
					},
					entities: [{
						id: ENTITY_ID,
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							accessLevel
						}
					}],
					searchOptions: allowCreateItem ? {
						allowCreateItem: true,
						footerOptions: {
							label: createFooterLabel
						}
					} : undefined,
					events: dialogEvents
				},
				events: {
					onAfterTagAdd: () => onSelectionChange(),
					onAfterTagRemove: () => onSelectionChange(),
					onAfterTagsClear: () => onSelectionChange()
				}
			});
			note_ui_themeContext.NoteThemeContext.applyToTagSelector(selector);
			selector.renderTo(node);
			const entityDialog = main_core.Type.isFunction(selector.getDialog) ? selector.getDialog() : null;
			if (entityDialog) {
				note_ui_themeContext.NoteThemeContext.themeEntitySelector(entityDialog);
			}
		};
		return {
			node,
			getSelectedCollection() {
				if (!selector || !main_core.Type.isFunction(selector.getTags)) {
					return null;
				}
				const tags = selector.getTags();
				if (!Array.isArray(tags) || tags.length !== 1) {
					return null;
				}
				const tag = tags[0];
				const id = Number(tag?.id ?? tag?.entityId ?? 0);
				if (!Number.isInteger(id) || id <= 0) {
					return null;
				}
				return {
					id,
					title: String(tag?.title || tag?.searchable || '')
				};
			},
			// Builds the selector on first call (node is attached by now), then themes it.
			applyTheme() {
				build();
			},
			destroy() {
				if (!selector) {
					return;
				}
				const entityDialog = main_core.Type.isFunction(selector.getDialog) ? selector.getDialog() : null;
				if (entityDialog && main_core.Type.isFunction(entityDialog.hide)) {
					entityDialog.hide();
				}
				if (main_core.Type.isFunction(selector.destroy)) {
					selector.destroy();
				}
				selector = null;
			}
		};
	}
	/**
	 * Full "pick a collection" dialog for the plain pickers (create / orphan restore / move).
	 * Resolves with the chosen collection, or null on cancel/close.
	 */
	function openCollectionPicker(options = {}) {
		const title = String(options?.title || '');
		const description = String(options?.description || '');
		const placeholder = String(options?.placeholder || '');
		const primaryLabel = String(options?.primaryLabel || '');
		const cancelLabel = String(options?.cancelLabel || main_core.Loc.getMessage('NOTE_COLLECTION_PICKER_CANCEL') || '');
		const accessLevel = options?.accessLevel === 'view' ? 'view' : 'manage';
		const canCreateCollection = Boolean(options?.canCreateCollection);
		const createFooterLabel = String(options?.createFooterLabel || '');
		const onCreateCollection = main_core.Type.isFunction(options?.onCreateCollection) ? options.onCreateCollection : null;
		const mobileDropdownHeight = Number(options?.mobileDropdownHeight) || 280;
		return new Promise(resolve => {
			let isResolved = false;
			let primaryButton = null;
			const finish = value => {
				if (isResolved) {
					return;
				}
				isResolved = true;
				resolve(value);
			};
			const updatePrimaryState = () => {
				if (primaryButton) {
					primaryButton.setDisabled(picker.getSelectedCollection() === null);
				}
			};
			const onItemCreateAsync = canCreateCollection && onCreateCollection ? name => Promise.resolve(onCreateCollection(name)).then(created => {
				const id = Number(created?.id);
				if (!Number.isInteger(id) || id <= 0) {
					return;
				}
				const collectionTitle = String(created?.title || name);
				// Defer hide so SearchTabFooter's post-emit chain (clearSearch + selectFirstTab) can run first.
				setTimeout(() => {
					finish({
						collectionId: id,
						collectionTitle
					});
					dialog.hide();
				}, 0);
			}) : null;
			const picker = createCollectionSelector({
				placeholder,
				accessLevel,
				mobileDropdownHeight,
				allowCreateItem: canCreateCollection,
				createFooterLabel,
				onItemCreateAsync,
				onSelectionChange: () => updatePrimaryState()
			});
			const textNode = main_core.Tag.render`<div class="note-collection-picker__text"></div>`;
			textNode.textContent = description;
			const content = main_core.Tag.render`
			<div class="note-collection-picker__content">
				${description === '' ? '' : textNode}
				${picker.node}
			</div>
		`;
			primaryButton = new ui_buttons.Button({
				text: primaryLabel,
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				disabled: true,
				// Identity for tests: otherwise reachable only via ui.system.dialog internals.
				dataset: {
					testid: 'note-collection-picker-submit'
				},
				onclick: () => {
					const selected = picker.getSelectedCollection();
					if (!selected) {
						return;
					}
					finish({
						collectionId: selected.id,
						collectionTitle: selected.title
					});
					dialog.hide();
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: cancelLabel,
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				dataset: {
					testid: 'note-collection-picker-cancel'
				},
				onclick: () => {
					finish(null);
					dialog.hide();
				}
			});
			const dialog = new ui_system_dialog.Dialog({
				title,
				content,
				hasOverlay: true,
				overlay: true,
				width: 480,
				centerButtons: [primaryButton, cancelButton],
				events: {
					onAfterShow: () => {
						picker.applyTheme();
						updatePrimaryState();
					},
					onHide: () => {
						picker.destroy();
						finish(null);
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}

	exports.createCollectionSelector = createCollectionSelector;
	exports.openCollectionPicker = openCollectionPicker;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.UI, BX.UI.EntitySelector, BX.UI.System, BX.Note.Ui);
//# sourceMappingURL=collection-picker.bundle.js.map
