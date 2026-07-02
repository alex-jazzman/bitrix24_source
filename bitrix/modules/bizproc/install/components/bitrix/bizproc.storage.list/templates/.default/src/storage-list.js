import { Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';

export class StorageList
{
	#gridId: string;
	#onStorageRemoveHandler: Function;

	constructor(options: { gridId: string })
	{
		this.#gridId = options.gridId;

		Runtime.loadExtension('bizproc.router').then(({ Router }) => {
			Router.init();
		}).catch((e) => console.error(e));

		this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);
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

	#onStorageRemove(): void
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		if (grid)
		{
			grid.reloadTable();
		}
	}
}
