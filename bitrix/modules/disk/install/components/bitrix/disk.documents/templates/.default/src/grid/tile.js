import {Options as GridOptions} from '../options';
import {BaseEvent, EventEmitter} from "main.core.events";
import Backend from "../backend";
import getMenuItem from "../gridmenu/index";
import {keepFocusThroughMenuClose} from "../utils";
import {
	generateBoardsEmptyBlock,
	generateDocumentsEmptyBlock,
	generateTileEmptyBlock,
} from './tile-empty-block';

export default class Tile
{
	#analytics;

	constructor(analytics: any = null)
	{
		this.#analytics = analytics;

		this.addReloadGrid();
		this.addMenuActionLoader();
		this.addFilterSequence();
	}

	addFilterSequence()
	{
		EventEmitter.subscribe(
			'BX.Main.Filter:apply',
			function({compatData: [filterId, data, filter, promise, params]}: BaseEvent)
			{
				if (filterId === GridOptions.getFilterId())
				{
					promise.then(function () {
						BX.Main.tileGridManager
							.getInstanceById(GridOptions.getGridId())
							.reload();
					}.bind(this));
				}
			}
		);
	}

	addReloadGrid()
	{
		BX.addCustomEvent('onPopupFileUploadClose', () => {
			BX.Main.tileGridManager
				.getInstanceById(GridOptions.getGridId())
				.reload();
		});
	}

	addMenuActionLoader()
	{
		EventEmitter.subscribe(
			'Disk:Documents:TileGrid:MenuAction:FirstShow',
			function({compatData: [row, objectId, menuPopup]}: BaseEvent) {
				Backend
					.getMenuActions(objectId, this.#analytics)
					.then(function({data}) {
						const menu = menuPopup;
						row.actions = [];
						const prepareActionMenu = (item, index, ar) => {
							if (item['items'])
							{
								item['items'].forEach(prepareActionMenu)
							}
							if (item['id'] === 'rename')
							{
								item['onclick'] = () => keepFocusThroughMenuClose(row.onRename.bind(row));
							}

							const menuItem = getMenuItem(objectId, item);
							menuItem.subscribe('close', () => {
								menu.close();
							});
							if (ar === data)
							{
								menuItem.addPopupMenuItem(menu);
								row.actions.push(menuItem.getData());
							}
							else
							{
								ar[index] = menuItem.getData();
							}
						}
						data.forEach(prepareActionMenu);

						if (menu)
						{
							menu.removeMenuItem('loader');
						}
					}.bind(this))
					.catch(function({errors})
					{
						//Hide Loader and show errors
						console.log(errors);
					}.bind(this));
			}.bind(this)
		);
	}

	static generateEmptyBlock()
	{
		return generateTileEmptyBlock();
	}

	static generateDocumentsEmptyBlock()
	{
		return generateDocumentsEmptyBlock();
	}

	static generateBoardsEmptyBlock()
	{
		return generateBoardsEmptyBlock();
	}
}
