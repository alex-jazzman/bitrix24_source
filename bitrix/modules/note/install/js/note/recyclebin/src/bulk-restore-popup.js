import { Dom, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Dialog } from 'ui.system.dialog';
import { NoteThemeContext } from 'note.ui.theme-context';

const ENTITY_ID = 'note-collection';

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
		let selector = null;

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

		const selectorContainer = hasOrphans
			? Tag.render`<div class="note-recyclebin-bulk-popup-selector"></div>`
			: null
		;

		const content = Tag.render`
			<div class="note-recyclebin-bulk-popup-content">
				${headlineNode}
				${orphanHintNode}
				${selectorContainer}
			</div>
		`;

		const getSelectedCollectionId = (): number => {
			if (!selector || !Type.isFunction(selector.getTags))
			{
				return 0;
			}

			const tags = selector.getTags();
			if (!Array.isArray(tags) || tags.length !== 1)
			{
				return 0;
			}

			const tag = tags[0];
			const id = Number(tag?.id ?? tag?.entityId ?? 0);
			return Number.isInteger(id) && id > 0 ? id : 0;
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

		restoreButton = new Button({
			text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
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
					if (!hasOrphans || !selectorContainer)
					{
						return;
					}

					const isMobile = document.documentElement.classList.contains('note-mobile');
					selector = new TagSelector({
						multiple: false,
						tagLimit: 1,
						placeholder: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
						dialogOptions: {
							height: isMobile ? 240 : 340,
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
					selector.renderTo(selectorContainer);
					const outer = selector.getOuterContainer?.();
					if (outer)
					{
						Dom.removeClass(outer, '--ui-context-content-light');
						Dom.removeClass(outer, '--ui-context-content-dark');
						Dom.addClass(outer, NoteThemeContext.getDesignSystemContext());
					}
					updateRestoreState();
				},
				onHide: () => {
					finish({ confirmed: false, orphanTargetCollectionId: null });
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
