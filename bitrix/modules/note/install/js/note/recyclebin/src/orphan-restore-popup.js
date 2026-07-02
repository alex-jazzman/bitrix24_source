import { Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';

const ENTITY_ID = 'note-collection';

export type OrphanRestorePopupResult = {
	collectionId: number,
	collectionTitle: string,
} | null;

export type OrphanRestorePopupOptions = {
	documentTitle?: string,
};

export function openOrphanRestorePopup(options: OrphanRestorePopupOptions = {}): Promise<OrphanRestorePopupResult>
{
	const documentTitle = String(options?.documentTitle || '');

	return new Promise((resolve) => {
		let isResolved = false;
		let restoreButton = null;
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
			<div class="note-recyclebin-orphan-popup-text"></div>
		`;
		textNode.textContent = buildBodyText(documentTitle);

		const selectorContainer = Tag.render`
			<div class="note-recyclebin-orphan-popup-selector"></div>
		`;

		const content = Tag.render`
			<div class="note-recyclebin-orphan-popup-content">
				${textNode}
				${selectorContainer}
			</div>
		`;

		const updateRestoreState = () => {
			if (!restoreButton || !selector)
			{
				return;
			}

			const tags = Type.isFunction(selector.getTags) ? selector.getTags() : [];
			restoreButton.setDisabled(!Array.isArray(tags) || tags.length !== 1);
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

		restoreButton = new Button({
			text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE') || '',
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
			text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			onclick: () => {
				finish(null);
				dialog.hide();
			},
		});

		const dialog = new Dialog({
			title: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TITLE') || '',
			content,
			hasOverlay: true,
			overlay: true,
			width: 480,
			centerButtons: [restoreButton, cancelButton],
			events: {
				onAfterShow: () => {
					const isMobile = document.documentElement.classList.contains('note-mobile');
					selector = new TagSelector({
						multiple: false,
						tagLimit: 1,
						placeholder: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
						dialogOptions: {
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
						},
						events: {
							onAfterTagAdd: () => updateRestoreState(),
							onAfterTagRemove: () => updateRestoreState(),
							onAfterTagsClear: () => updateRestoreState(),
						},
					});
					NoteThemeContext.applyToTagSelector(selector);
					selector.renderTo(selectorContainer);
					const entityDialog = typeof selector.getDialog === 'function' ? selector.getDialog() : null;
					if (entityDialog)
					{
						NoteThemeContext.themeEntitySelector(entityDialog);
					}
					updateRestoreState();
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

function buildBodyText(documentTitle: string): string
{
	return (Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TEXT') || '')
		.replace('#DOCUMENT#', documentTitle)
	;
}
