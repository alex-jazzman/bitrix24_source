import { Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';

const ENTITY_ID = 'note-collection';

export type PickCollectionPopupResult = {
	collectionId: number,
	collectionTitle: string,
} | null;

export type PickCollectionPopupOptions = {
	api: Object,
	store: Object,
	canCreateCollection?: boolean,
	onFail?: (error: mixed) => void,
};

export function openPickCollectionPopup(options: PickCollectionPopupOptions): Promise<PickCollectionPopupResult>
{
	const api = options?.api;
	const store = options?.store;
	const canCreateCollection = Boolean(options?.canCreateCollection);
	const onFail = Type.isFunction(options?.onFail) ? options.onFail : () => {};

	return new Promise((resolve) => {
		let isResolved = false;
		let primaryButton = null;
		let selector = null;

		const finish = (value) => {
			if (isResolved)
			{
				return;
			}

			isResolved = true;
			resolve(value);
		};

		const textNode = Tag.render`
			<div class="note-sidebar-pick-collection-popup-text"></div>
		`;
		textNode.textContent = canCreateCollection
			? (Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT_WITH_CREATE') || '')
			: (Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT') || '')
		;

		const selectorContainer = Tag.render`
			<div class="note-sidebar-pick-collection-popup-selector"></div>
		`;

		const content = Tag.render`
			<div class="note-sidebar-pick-collection-popup-content">
				${textNode}
				${selectorContainer}
			</div>
		`;

		const updatePrimaryState = () => {
			if (!primaryButton || !selector)
			{
				return;
			}

			const tags = Type.isFunction(selector.getTags) ? selector.getTags() : [];
			primaryButton.setDisabled(!Array.isArray(tags) || tags.length !== 1);
		};

		const getSelectedTag = () => {
			if (!selector || !Type.isFunction(selector.getTags))
			{
				return null;
			}

			const tags = selector.getTags();
			if (!Array.isArray(tags) || tags.length !== 1)
			{
				return null;
			}

			const tag = tags[0];
			const id = Number(tag?.id ?? tag?.entityId ?? 0);
			if (!Number.isInteger(id) || id <= 0)
			{
				return null;
			}

			return {
				collectionId: id,
				collectionTitle: String(tag?.title || tag?.searchable || ''),
			};
		};

		primaryButton = new Button({
			text: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PRIMARY') || '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			disabled: true,
			onclick: () => {
				const selected = getSelectedTag();
				if (!selected)
				{
					return;
				}

				finish(selected);
				dialog.hide();
			},
		});

		const cancelButton = new Button({
			text: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_CANCEL') || '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			onclick: () => {
				finish(null);
				dialog.hide();
			},
		});

		// Inline create via SearchTabFooter — backend auto-assigns LEVEL_MODERATE to creator.
		const dialogEvents: Object = {};
		if (canCreateCollection)
		{
			dialogEvents['Search:onItemCreateAsync'] = (event) => {
				const name = String(event?.getData()?.searchQuery?.getQuery?.() || '').trim();
				if (name === '')
				{
					return Promise.resolve();
				}

				return api.createCollection(name).then((created) => {
					const id = Number(created?.id);
					if (!Number.isInteger(id) || id <= 0)
					{
						return;
					}

					const collectionName = String(created?.name || name);
					if (store && store.actions && Type.isFunction(store.actions.insertCollectionLocal))
					{
						const maxPosition = (store.state?.collections?.value || []).reduce(
							(max, item) => Math.max(max, Number(item?.position || 0)),
							0,
						);
						store.actions.insertCollectionLocal({
							id,
							name: collectionName,
							position: Number(created?.position || (maxPosition + 1)),
							canEditCollection: true,
							canManagePermissions: true,
						});
					}

					// Defer hide so SearchTabFooter's post-emit chain (clearSearch + selectFirstTab) can run first.
					setTimeout(() => {
						finish({ collectionId: id, collectionTitle: collectionName });
						dialog.hide();
					}, 0);
				}).catch((error) => {
					onFail(error);
				});
			};
		}

		const dialog = new Dialog({
			title: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TITLE') || '',
			content,
			hasOverlay: true,
			overlay: true,
			width: 480,
			centerButtons: [primaryButton, cancelButton],
			events: {
				onAfterShow: () => {
					const targetWidth = selectorContainer.offsetWidth || 432;
					const isMobile = document.documentElement.classList.contains('note-mobile');
					selector = new TagSelector({
						multiple: false,
						tagLimit: 1,
						placeholder: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PLACEHOLDER') || '',
						dialogOptions: {
							width: targetWidth,
							height: isMobile ? 280 : 340,
							showAvatars: false,
							popupOptions: {
								className: NoteThemeContext.getDesignSystemContext(),
							},
							entities: [
								{
									id: ENTITY_ID,
									dynamicLoad: true,
									dynamicSearch: true,
									options: {},
								},
							],
							searchOptions: canCreateCollection
								? {
									allowCreateItem: true,
									footerOptions: {
										label: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_FOOTER_CREATE') || '',
									},
								}
								: undefined,
							events: dialogEvents,
						},
						events: {
							onAfterTagAdd: () => updatePrimaryState(),
							onAfterTagRemove: () => updatePrimaryState(),
							onAfterTagsClear: () => updatePrimaryState(),
						},
					});
					NoteThemeContext.applyToTagSelector(selector);
					selector.renderTo(selectorContainer);
					const entityDialog = typeof selector.getDialog === 'function' ? selector.getDialog() : null;
					if (entityDialog)
					{
						NoteThemeContext.themeEntitySelector(entityDialog);
					}
					updatePrimaryState();
				},
				onHide: () => {
					const entityDialog = selector && Type.isFunction(selector.getDialog) ? selector.getDialog() : null;
					if (entityDialog && Type.isFunction(entityDialog.hide))
					{
						entityDialog.hide();
					}
					finish(null);
				},
				onDestroy: () => {
					if (selector && Type.isFunction(selector.destroy))
					{
						selector.destroy();
					}
				},
			},
		});

		NoteThemeContext.themeDialog(dialog, content);
		dialog.show();
	});
}
