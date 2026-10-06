import { Loc, Tag } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';
import { createCollectionSelector } from 'note.ui.collection-picker';

export type BulkRestorePopupResult = {
	confirmed: boolean,
	orphanTargetCollectionId: number | null,
};

export type BulkRestorePopupOptions = {
	total: number,
	orphanCount: number,
};

export function openBulkRestorePopup(options: BulkRestorePopupOptions): Promise<BulkRestorePopupResult>
{
	const total = Math.max(0, Number(options?.total) || 0);
	const orphanCount = Math.max(0, Number(options?.orphanCount) || 0);
	const hasOrphans = orphanCount > 0;

	return new Promise((resolve) => {
		let isResolved = false;
		let restoreButton = null;

		const finish = (value) => {
			if (isResolved)
			{
				return;
			}

			isResolved = true;
			resolve(value);
		};

		const headlineNode = Tag.render`
			<div class="note-recyclebin-bulk-popup-text"></div>
		`;
		headlineNode.textContent = buildHeadline(total);

		const orphanHintNode = hasOrphans
			? Tag.render`<div class="note-recyclebin-bulk-popup-hint"></div>`
			: null
		;
		if (orphanHintNode)
		{
			orphanHintNode.textContent = buildOrphanHint(orphanCount);
		}

		const getSelectedCollectionId = (): number => {
			const selected = picker ? picker.getSelectedCollection() : null;

			return selected ? selected.id : 0;
		};

		const updateRestoreState = () => {
			if (!restoreButton)
			{
				return;
			}

			if (!hasOrphans)
			{
				restoreButton.setDisabled(false);

				return;
			}

			restoreButton.setDisabled(getSelectedCollectionId() <= 0);
		};

		// Selector is only shown when part of the selection has lost its source collection.
		const picker = hasOrphans
			? createCollectionSelector({
				placeholder: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
				mobileDropdownHeight: 240,
				onSelectionChange: () => updateRestoreState(),
			})
			: null
		;

		const content = Tag.render`
			<div class="note-recyclebin-bulk-popup-content">
				${headlineNode}
				${orphanHintNode}
				${picker ? picker.node : ''}
			</div>
		`;

		restoreButton = new Button({
			text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
			dataset: { testid: 'note-dialog-confirm' },
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			disabled: hasOrphans,
			onclick: () => {
				if (hasOrphans)
				{
					const id = getSelectedCollectionId();
					if (id <= 0)
					{
						return;
					}

					finish({ confirmed: true, orphanTargetCollectionId: id });
				}
				else
				{
					finish({ confirmed: true, orphanTargetCollectionId: null });
				}
				dialog.hide();
			},
		});

		const cancelButton = new Button({
			text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
			dataset: { testid: 'note-dialog-cancel' },
			size: ButtonSize.LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			onclick: () => {
				finish({ confirmed: false, orphanTargetCollectionId: null });
				dialog.hide();
			},
		});

		const dialog = new Dialog({
			title: Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_TITLE') || '',
			content,
			hasOverlay: true,
			overlay: true,
			width: 480,
			centerButtons: [restoreButton, cancelButton],
			events: {
				onAfterShow: () => {
					if (picker)
					{
						picker.applyTheme();
					}
					updateRestoreState();
				},
				onHide: () => {
					if (picker)
					{
						picker.destroy();
					}
					finish({ confirmed: false, orphanTargetCollectionId: null });
				},
			},
		});

		NoteThemeContext.themeDialog(dialog, content);
		dialog.show();
	});
}

function buildHeadline(total: number): string
{
	return (Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_TEXT') || '')
		.replace('#COUNT#', String(total))
	;
}

function buildOrphanHint(orphanCount: number): string
{
	return (Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_ORPHAN_HINT') || '')
		.replace('#COUNT#', String(orphanCount))
	;
}
