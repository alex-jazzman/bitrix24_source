import { ajax, Loc } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { MY_TAB_ID } from '../constants';

const UNDO_TOAST_DELAY_MS = 5000;

type CatalogPopupItemHideActionOptions = {
	onHiddenToggled?: () => void,
	onHiddenCommitted?: () => void,
};

type CatalogPopupItemHideMenuItem = {
	title: string,
	onClick: () => void,
};

export class CatalogPopupItemHideAction
{
	#item: CatalogItem;
	#tab: TabConfig | null;
	#onHiddenToggled: (() => void) | null;
	#onHiddenCommitted: (() => void) | null;

	constructor(
		item: CatalogItem,
		tab: TabConfig | null = null,
		options: CatalogPopupItemHideActionOptions = {},
	)
	{
		this.#item = item;
		this.#tab = tab;
		this.#onHiddenToggled = options.onHiddenToggled ?? null;
		this.#onHiddenCommitted = options.onHiddenCommitted ?? null;
	}

	canBeHidden(): boolean
	{
		return this.#tab?.id === MY_TAB_ID
			&& (this.#item.isMine !== true || this.#item.editUrl !== null);
	}

	getMenuItem(): ?CatalogPopupItemHideMenuItem
	{
		if (!this.canBeHidden())
		{
			return null;
		}

		return {
			title: Loc.getMessage(
				this.#item.isHidden
					? 'VIBECODECONNECTOR_CATALOG_MENU_UNHIDE'
					: 'VIBECODECONNECTOR_CATALOG_MENU_HIDE',
			),
			onClick: () => {
				if (this.#item.isHidden)
				{
					this.#unhide();
				}
				else
				{
					this.#hide();
				}
			},
		};
	}

	#hide(): void
	{
		const wasPinned = this.#item.isPinned;

		this.#item.isHidden = true;
		this.#item.isPinned = false;
		this.#onHiddenToggled?.();

		this.#runAction('vibecodeconnector.Catalog.hide')
			.then(() => {
				this.#showUndoToast(wasPinned);
				this.#onHiddenCommitted?.();
			})
			.catch((error) => {
				this.#item.isHidden = false;
				this.#item.isPinned = wasPinned;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to hide', this.#item.id, error);
			});
	}

	#unhide(): void
	{
		this.#item.isHidden = false;
		this.#onHiddenToggled?.();

		this.#runAction('vibecodeconnector.Catalog.unhide')
			.then(() => {
				this.#onHiddenCommitted?.();
			})
			.catch((error) => {
				this.#item.isHidden = true;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to unhide', this.#item.id, error);
			});
	}

	#showUndoToast(wasPinned: boolean): void
	{
		NotificationCenter.notify({
			content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_TOAST'),
			autoHideDelay: UNDO_TOAST_DELAY_MS,
			actions: [
				{
					title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_TOAST_UNDO'),
					events: {
						click: (event, balloon) => {
							balloon?.close();
							this.#undoHide(wasPinned);
						},
					},
				},
			],
		});
	}

	#undoHide(wasPinned: boolean): void
	{
		this.#item.isHidden = false;
		this.#item.isPinned = wasPinned;
		this.#onHiddenToggled?.();

		this.#runAction('vibecodeconnector.Catalog.unhide')
			.then(() => {
				if (!wasPinned)
				{
					return null;
				}

				return this.#runAction('vibecodeconnector.Catalog.pin').catch((error) => {
					this.#item.isPinned = false;
					this.#onHiddenToggled?.();
					this.#showError();
					console.error('[vibecodeconnector.catalog] failed to restore pin on undo', this.#item.id, error);
				});
			})
			.then(() => {
				this.#onHiddenCommitted?.();
			})
			.catch((error) => {
				this.#item.isHidden = true;
				this.#item.isPinned = false;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to undo hide', this.#item.id, error);
			});
	}

	#runAction(action: string): Promise<any>
	{
		return ajax.runAction(action, {
			data: { ...this.#tab?.extraData, catalogItemId: this.#item.id },
		});
	}

	#showError(): void
	{
		NotificationCenter.notify({
			content: Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_ERROR'),
		});
	}
}
