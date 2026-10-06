import { Dom, Loc, Runtime, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { UI } from 'ui.notification';
import { MessageBox } from 'ui.dialogs.messagebox';
import { LiveAnnouncer } from 'ui.a11y';

import 'ui.design-tokens.air';
import './style.css';

const ROW_CREATED_CLASS = 'bizproc-storage-list-row-created';
const ROW_CREATED_HIGHLIGHT_DURATION = 2400;

export class StorageList
{
	static Instance: ?StorageList = null;

	#gridId: string;
	#onStorageRemoveHandler: Function;

	constructor(options: { gridId: string })
	{
		StorageList.Instance = this;
		this.#gridId = options.gridId;

		Runtime.loadExtension('bizproc.router').then(({ Router }) => {
			Router.init();
		}).catch((e) => console.error(e));

		this.#onStorageRemoveHandler = this.#reloadGrid.bind(this);
		top.BX.Event.EventEmitter.subscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);

		const slider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (slider)
		{
			EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onDestroy', () => {
				this.destroy();
			});
		}
	}

	destroy(): void
	{
		top.BX.Event.EventEmitter.unsubscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);
	}

	deleteSelected(): void
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		const ids = grid?.getRows()?.getSelectedIds?.() || [];

		if (!ids.length)
		{
			return;
		}

		ajax.runAction('bizproc.storage.deleteList', { data: { ids } })
			.then(() => grid.reloadTable())
			.catch(({ errors }) => {
				if (errors?.length)
				{
					const content = errors
						.map(({ message }) => message)
						.join('<br>')
					;

					UI.Notification.Center.notify({ content });
				}
			})
		;
	}

	createStorage(): void
	{
		Runtime.loadExtension('bizproc.router').then(({ Router }) => {
			Router.openStorageEdit({
				events: {
					onCloseComplete: (event) => this.#onStorageCreated(event.getSlider()),
				},
			});
		}).catch((e) => console.error(e));
	}

	#onStorageCreated(slider: ?BX.SidePanel.Slider): void
	{
		const { storageId, storageTitle } = slider?.getData().get('data') ?? {};
		if (!storageId)
		{
			return;
		}

		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		if (!grid)
		{
			return;
		}

		grid.reloadTable(
			'POST',
			{ createdStorageId: storageId },
			() => {
				const createdRow = grid.getRows().getById(storageId);

				this.#highlightRow(createdRow);
				this.#announceStorageCreated(storageTitle, createdRow !== null);
			},
		);
	}

	#highlightRow(row: ?BX.Grid.Row): void
	{
		const rowNode = row?.getNode();
		if (!rowNode)
		{
			return;
		}

		const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

		rowNode.scrollIntoView({ behavior, block: 'nearest' });
		Dom.addClass(rowNode, ROW_CREATED_CLASS);
		setTimeout(() => Dom.removeClass(rowNode, ROW_CREATED_CLASS), ROW_CREATED_HIGHLIGHT_DURATION);
	}

	#announceStorageCreated(title: ?string, isRowShown: boolean): void
	{
		let messageId;
		if (isRowShown)
		{
			messageId = title
				? 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE'
				: 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NO_TITLE';
		}
		else
		{
			messageId = title
				? 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NOT_SHOWN'
				: 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NOT_SHOWN_NO_TITLE';
		}

		LiveAnnouncer.announce(Loc.getMessage(messageId, { '#TITLE#': title }));
	}

	#reloadGrid(): void
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		if (grid)
		{
			grid.reloadTable();
		}
	}

	removeStorage(storageId: number): void
	{
		MessageBox.confirm(
			Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_MESSAGE'),
			(messageBox) => {
				ajax.runAction('bizproc.storage.delete', { data: { id: storageId } })
					.then((response) => {
						if (response.data)
						{
							UI.Notification.Center.notify({
								content: Loc.getMessage('BIZPROC_STORAGE_LIST_DELETE_SUCCESS'),
							});

							if (messageBox)
							{
								messageBox.close();
							}

							this.#reloadGrid();
						}
					})
					.catch((error) => {
						MessageBox.alert(error.errors.pop().message);
					});
			},
			Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_OK'),
		);
	}
}
